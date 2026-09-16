async function handleFiles(files){
  for(let file of files){
    try{
      setStatus(`Reading ${file.name}…`,5);
      let ext=file.name.split('.').pop().toLowerCase();
      let result=[],mode='unstructured';
      if(file.type.startsWith('image/')){result=await parseImageFile(file);mode='ocr'}
      else if(file.type==='application/pdf'||ext==='pdf'){result=await parsePdfFile(file);mode='pdf'}
      else if(ext==='docx'){result=await parseDocxFile(file);mode='structured'}
      else if(['xlsx','xls','csv'].includes(ext)){result=await parseSheetFile(file);mode='structured'}
      else {result=parsePlainText(await file.text(),file.name);mode='text'}
      result=dedupeCandidates(result);
      let autoThreshold=mode==='structured'?82:mode==='pdf'?88:95;
      let auto=result.filter(c=>isCompleteCandidate(c)&&c.confidence>=autoThreshold);
      let review=result.filter(c=>!auto.includes(c));
      let commit={added:0,skipped:0};
      if(auto.length)commit=commitLessons(auto);
      candidates=dedupeCandidates([...candidates,...review]);
      if(candidates.length)renderCandidates();
      else hideReviewIfEmpty();

      let parts=[];
      if(commit.added)parts.push(`${commit.added} lesson${commit.added===1?'':'s'} added`);
      if(commit.skipped)parts.push(`${commit.skipped} duplicate${commit.skipped===1?'':'s'} skipped`);
      if(review.length)parts.push(`${review.length} need${review.length===1?'s':''} review`);
      if(!parts.length)parts.push(`No lessons were detected`);
      setStatus(`${file.name}: ${parts.join(' · ')}.`,100,commit.added?'good':review.length?'warn':'warn');
      if(commit.added)showPage('week');
    }catch(e){
      console.error(e);
      setStatus(`Could not read ${file.name}: ${e.message||e}`,100,'warn');
    }
  }
}
function isCompleteCandidate(c){return !!(c&&matchDay(c.day)&&parseTimeText(c.start)&&normalise(c.subject))}
function stateLessonKey(x){return [matchDay(x.day)||x.day,parseTimeText(x.start)||x.start,normalise(x.subject).toLowerCase(),normalise(x.className).toLowerCase()].join('|')}
function commitLessons(chosen){
  let added=0,skipped=0,existing=new Set(state.lessons.map(stateLessonKey));
  for(let c of chosen){
    if(!isCompleteCandidate(c))continue;
    let day=matchDay(c.day)||c.day,start=parseTimeText(c.start)||c.start,end=parseTimeText(c.end)||c.end||addMinutes(start,60);
    let lesson={id:uid(),day,start,end,subject:normalise(c.subject),className:normalise(c.className),room:normalise(c.room),notes:`Imported from ${c.source||'timetable'}`};
    let k=stateLessonKey(lesson);
    if(existing.has(k)){skipped++;continue}
    existing.add(k);state.lessons.push(lesson);added++;
  }
  if(added)persist();
  return {added,skipped};
}
function hideReviewIfEmpty(){
  let card=document.getElementById('reviewCard');
  if(card&&!candidates.length)card.style.display='none';
}

async function recogniseImageSource(source,label='image'){
  let res=await Tesseract.recognize(source,'eng',{
    logger:m=>{
      if(m.status==='recognizing text')setStatus(`Reading ${label}… ${Math.round((m.progress||0)*100)}%`,20+(m.progress||0)*70);
    }
  });
  let text=res?.data?.text||'';
  let tsv=res?.data?.tsv||'';
  let words=parseTsv(tsv);
  if(!words.length&&text.trim())return {text,words:[],lessons:parsePlainText(text,label)};
  return {text,words,lessons:words.length?parseOCRLayout(words,label):parsePlainText(text,label)};
}
async function parseImageFile(file){
  setStatus(`Improving image for OCR…`,12);
  let dataUrl=await preprocessImage(file);
  let ocr=await recogniseImageSource(dataUrl,file.name);
  extractedText += `\n--- ${file.name} ---\n${ocr.text}\n`;
  return ocr.lessons;
}
function parseTsv(tsv){
  let lines=String(tsv).split('\n'),out=[];
  for(let i=1;i<lines.length;i++){
    let c=lines[i].split('\t');
    if(c.length<12)continue;
    let level=+c[0],text=c.slice(11).join('\t').trim();
    if(level===5&&text)out.push({text,conf:+c[10],x0:+c[6],y0:+c[7],x1:+c[6]+ +c[8],y1:+c[7]+ +c[9]});
  }
  return out;
}
async function preprocessImage(file){
  let url=URL.createObjectURL(file);
  try{
    let img=await new Promise((resolve,reject)=>{let i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=url});
    let scale=Math.min(3.2,Math.max(1.5,2000/img.width));
    let c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);
    let ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,c.width,c.height);
    let im=ctx.getImageData(0,0,c.width,c.height),d=im.data,hist=new Array(256).fill(0);
    for(let i=0;i<d.length;i+=4){let g=Math.round(.299*d[i]+.587*d[i+1]+.114*d[i+2]);hist[g]++}
    let total=c.width*c.height,lo=0,hi=255,acc=0;
    while(lo<255&&(acc+=hist[lo])<total*.01)lo++;acc=0;
    while(hi>0&&(acc+=hist[hi])<total*.01)hi--;
    let span=Math.max(40,hi-lo);
    for(let i=0;i<d.length;i+=4){
      let g=Math.round(.299*d[i]+.587*d[i+1]+.114*d[i+2]);
      g=Math.max(0,Math.min(255,(g-lo)*255/span));g=Math.round((g-128)*1.22+128);
      d[i]=d[i+1]=d[i+2]=g;
    }
    ctx.putImageData(im,0,0);
    return c.toDataURL('image/png');
  }finally{URL.revokeObjectURL(url)}
}

async function ensurePdfJs(){
  if(pdfjsLibRef)return pdfjsLibRef;
  try{
    pdfjsLibRef=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs');
    pdfjsLibRef.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
    return pdfjsLibRef;
  }catch(e){throw new Error('PDF reader could not load. Check your internet connection and try again.')}
}
async function ocrPdfPage(page,source){
  let viewport=page.getViewport({scale:2.2});
  let canvas=document.createElement('canvas');
  canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
  let ctx=canvas.getContext('2d',{willReadFrequently:true});
  await page.render({canvasContext:ctx,viewport}).promise;
  let ocr=await recogniseImageSource(canvas.toDataURL('image/png'),source);
  extractedText+=`\n--- ${source} OCR ---\n${ocr.text}\n`;
  return ocr.lessons;
}
async function parsePdfFile(file){
  let pdfjs=await ensurePdfJs(),bytes=new Uint8Array(await file.arrayBuffer());
  let pdf=await pdfjs.getDocument({data:bytes}).promise,out=[];
  for(let p=1;p<=pdf.numPages;p++){
    setStatus(`Reading PDF page ${p} of ${pdf.numPages}…`,10+70*p/pdf.numPages);
    let page=await pdf.getPage(p),tc=await page.getTextContent();
    let words=tc.items.filter(x=>x.str&&x.str.trim()).map(x=>{
      let x0=x.transform[4],y=x.transform[5],h=Math.abs(x.height||x.transform[3]||10);
      return {text:x.str,conf:94,x0,y0:y-h,x1:x0+(x.width||10),y1:y,cx:x0+(x.width||10)/2,cy:y-h/2};
    });
    let raw=groupPdfLines(words);
    extractedText+=`\n--- ${file.name} page ${p} ---\n${raw}\n`;
    let pageOut=words.length?parsePdfLayout(words,file.name+' p'+p):[];
    if(!pageOut.length&&raw.trim())pageOut=parsePlainText(raw,file.name+' p'+p);
    if(!pageOut.length&&p<=12){
      setStatus(`Page ${p} looks scanned. Running OCR…`,70+20*p/pdf.numPages);
      pageOut=await ocrPdfPage(page,`${file.name} p${p}`);
    }
    out.push(...pageOut);
  }
  return dedupeCandidates(out);
}
function groupPdfLines(words){
  let rows=[];
  for(let w of [...words].sort((a,b)=>b.cy-a.cy||a.x0-b.x0)){
    let r=rows.find(x=>Math.abs(x.y-w.cy)<Math.max(4,(w.y1-w.y0)*.65));
    if(!r){r={y:w.cy,words:[]};rows.push(r)}
    r.words.push(w);
  }
  return rows.sort((a,b)=>b.y-a.y).map(r=>r.words.sort((a,b)=>a.x0-b.x0).map(w=>w.text).join(' ')).join('\n');
}
function parsePdfLayout(words,source){
  let inv=words.map(w=>({...w,y0:-w.y1,y1:-w.y0,cy:-w.cy}));
  return parseOCRLayout(inv,source);
}

async function parseDocxEmbeddedImages(buf,fileName){
  let zipApi;
  try{zipApi=typeof JSZip!=='undefined'?JSZip:(await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm')).default}
  catch(e){console.warn('Could not load Word image reader',e);return []}
  let zip=await zipApi.loadAsync(buf),out=[],names=Object.keys(zip.files).filter(n=>/^word\/media\//i.test(n)&&/\.(png|jpe?g|webp|bmp)$/i.test(n));
  for(let i=0;i<Math.min(names.length,12);i++){
    let n=names[i],blob=await zip.file(n).async('blob');
    if(blob.size<6000)continue;
    setStatus(`Reading image ${i+1} inside ${fileName}…`,55+35*(i+1)/Math.max(1,names.length));
    let dataUrl=await new Promise((resolve,reject)=>{let r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob)});
    let ocr=await recogniseImageSource(dataUrl,`${fileName} image ${i+1}`);
    extractedText+=`\n--- ${fileName} image ${i+1} ---\n${ocr.text}\n`;
    out.push(...ocr.lessons);
  }
  return out;
}
async function parseDocxFile(file){
  let buf=await file.arrayBuffer(),out=[];
  let r=await mammoth.convertToHtml({arrayBuffer:buf});
  let doc=new DOMParser().parseFromString(r.value,'text/html');
  doc.querySelectorAll('table').forEach((table,ti)=>{
    let matrix=[...table.rows].map(row=>[...row.cells].map(c=>c.innerText||c.textContent||''));
    out.push(...parseGrid(matrix,`${file.name} table ${ti+1}`));
  });
  let raw=await mammoth.extractRawText({arrayBuffer:buf});
  let text=raw.value||doc.body.innerText||doc.body.textContent||'';
  extractedText+=`\n--- ${file.name} ---\n${text}\n`;
  if(!out.length)out.push(...parsePlainText(text,file.name));
  if(!out.length)out.push(...await parseDocxEmbeddedImages(buf,file.name));
  return dedupeCandidates(out);
}
async function parseSheetFile(file){
  let data=await file.arrayBuffer(),wb=XLSX.read(data,{type:'array'}),out=[];
  for(let name of wb.SheetNames){
    let ws=wb.Sheets[name],matrix=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:false});
    let txt=matrix.map(r=>r.join(' | ')).join('\n');
    extractedText+=`\n--- ${file.name} / ${name} ---\n${txt}\n`;
    out.push(...parseGrid(matrix,`${file.name} / ${name}`));
  }
  return dedupeCandidates(out);
}
function parsePastedText(){
  let t=document.getElementById('pasteText').value;
  if(!t.trim()){toast('Paste timetable text first.');return}
  extractedText+=`\n--- Pasted text ---\n${t}\n`;
  let result=parsePlainText(t,'pasted text');
  let auto=result.filter(c=>isCompleteCandidate(c)&&c.confidence>=86);
  let review=result.filter(c=>!auto.includes(c));
  let commit=commitLessons(auto);
  candidates=dedupeCandidates([...candidates,...review]);
  if(candidates.length)renderCandidates();else hideReviewIfEmpty();
  setStatus(`${commit.added?`${commit.added} lesson${commit.added===1?'':'s'} added. `:''}${review.length?`${review.length} need review.`:'Import complete.'}`,100,commit.added?'good':'warn');
  if(commit.added)showPage('week');
}

function setStatus(text,pct=0,type='info'){
  let s=document.getElementById('importStatus'),w=document.getElementById('progressWrap'),b=document.getElementById('progressBar');
  s.style.display='block';s.className='notice '+type;s.textContent=text;
  w.style.display=pct>=100?'none':'block';b.style.width=Math.max(0,Math.min(100,pct))+'%';
}
function renderCandidates(){
  let card=document.getElementById('reviewCard');card.style.display='block';
  let body=document.getElementById('reviewBody'),low=candidates.filter(c=>c.confidence<65).length;
  document.getElementById('reviewSummary').innerHTML=`<div class="notice ${low?'warn':'good'}">${candidates.length} candidate lesson${candidates.length===1?'':'s'} need review.${low?` ${low} have low confidence.`:''}</div>`;
  body.innerHTML=candidates.map((c,i)=>`<tr>
    <td><input type="checkbox" ${c.selected?'checked':''} onchange="candidates[${i}].selected=this.checked"></td>
    <td><select onchange="candidates[${i}].day=this.value">${DAYS.map(d=>`<option ${d===c.day?'selected':''}>${d}</option>`).join('')}</select></td>
    <td><input type="time" value="${esc(c.start)}" onchange="candidates[${i}].start=this.value"></td>
    <td><input type="time" value="${esc(c.end)}" onchange="candidates[${i}].end=this.value"></td>
    <td><input value="${esc(c.subject)}" onchange="candidates[${i}].subject=this.value"></td>
    <td><input value="${esc(c.className)}" onchange="candidates[${i}].className=this.value"></td>
    <td><input value="${esc(c.room)}" onchange="candidates[${i}].room=this.value"></td>
    <td><span class="conf ${c.confidence>=80?'high':c.confidence>=65?'mid':'low'}">${c.confidence}%</span></td>
  </tr>`).join('');
  document.getElementById('rawExtract').textContent=extractedText.trim()||'No raw extract available.';
  card.scrollIntoView({behavior:'smooth',block:'start'});
}
function selectAllCandidates(v){candidates.forEach(c=>c.selected=v);renderCandidates()}
function applyCandidates(){
  let chosen=candidates.filter(c=>c.selected&&isCompleteCandidate(c));
  if(!chosen.length){toast('Select at least one complete lesson.');return}
  let result=commitLessons(chosen),chosenSet=new Set(chosen);
  candidates=candidates.filter(c=>!chosenSet.has(c));
  if(candidates.length)renderCandidates();else hideReviewIfEmpty();
  toast(`${result.added} lesson${result.added===1?'':'s'} added${result.skipped?`; ${result.skipped} duplicate${result.skipped===1?'s':''} skipped`:''}`);
  if(result.added)showPage('week');
}

function exportData(){
  let blob=new Blob([JSON.stringify({version:4,exportedAt:new Date().toISOString(),...state},null,2)],{type:'application/json'});
  let a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='teacher-timetable-backup.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),500);toast('Backup downloaded');
}
async function restoreData(file){
  if(!file)return;
  try{
    let x=JSON.parse(await file.text());if(!Array.isArray(x.lessons))throw new Error('No lessons found');
    state={lessons:x.lessons,periods:Array.isArray(x.periods)&&x.periods.length?x.periods:DEFAULT_PERIODS.map(x=>[...x])};
    persist();toast('Backup restored');
  }catch(e){toast('That backup file could not be restored.')}
  document.getElementById('restoreInput').value='';
}
function resetApp(){
  if(!confirm('Delete all timetable data stored in this browser?'))return;
  state={lessons:[],periods:DEFAULT_PERIODS.map(x=>[...x])};localStorage.removeItem(STORE);renderAll();renderPeriodEditor();toast('Timetable reset');
}

const drop=document.getElementById('dropZone'),fileInput=document.getElementById('fileInput');
['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('drag')}));
['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('drag')}));
drop.addEventListener('drop',e=>handleFiles([...e.dataTransfer.files]));
fileInput.addEventListener('change',()=>{handleFiles([...fileInput.files]);fileInput.value=''});
document.getElementById('lessonModal').addEventListener('click',e=>{if(e.target.id==='lessonModal')closeLessonModal()});
initModalDays();renderAll();
