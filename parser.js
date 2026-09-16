function normalise(s=''){return String(s).replace(/[\u2013\u2014]/g,'-').replace(/\u00a0/g,' ').replace(/[ \t]+/g,' ').trim()}
function matchDay(s=''){
  let raw=normalise(s).toLowerCase(),x=raw.replace(/[^a-z]/g,'');
  if(DAY_ALIASES[x])return DAY_ALIASES[x];
  for(let [k,v] of Object.entries(DAY_ALIASES)){
    if(x===k||x.startsWith(k))return v;
    if(new RegExp(`(^|[^a-z])${k}(?:day)?([^a-z]|$)`,'i').test(raw))return v;
  }
  return null;
}
function parseTimeText(s=''){
  let x=String(s).toLowerCase().replace(/\./g,':').replace(/\s/g,'');
  let m=x.match(/\b([0-2]?\d)[:](\d{2})\b/);if(!m)m=x.match(/\b([0-2]?\d)(\d{2})\b/);
  if(!m)return null;let h=+m[1],mm=+m[2];if(h>23||mm>59)return null;
  return `${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
}
function periodNumber(s=''){
  let raw=normalise(s),m=raw.match(/(?:period|lesson|slot|p)\s*[:#-]?\s*(\d{1,2})\b/i);
  if(!m&&/^\s*\d{1,2}\s*$/.test(raw))m=raw.match(/(\d{1,2})/);
  let n=m?+m[1]:0;return n>0&&n<=state.periods.length?n:null;
}
function parseTimeRange(s=''){
  let raw=String(s).replace(/\./g,':');
  let times=[...raw.matchAll(/\b([0-2]?\d)[:](\d{2})\b/g)].map(m=>`${String(+m[1]).padStart(2,'0')}:${m[2]}`);
  if(times.length>=2)return [times[0],times[1]];
  let pn=periodNumber(raw);if(pn&&state.periods[pn-1])return [...state.periods[pn-1]];
  if(times.length===1){let x=state.periods.find(p=>p[0]===times[0]);return x?[...x]:[times[0],addMinutes(times[0],60)]}
  return null;
}
function addMinutes(t,n){let v=mins(t)+n;return `${String(Math.floor(v/60)%24).padStart(2,'0')}:${String(v%60).padStart(2,'0')}`}
function cleanCell(s=''){return String(s).replace(/\r/g,'').split('\n').map(normalise).filter(Boolean).join('\n')}
function isNonLessonText(s=''){return /^(?:break|morning break|lunch|lunch break|registration|register|assembly|free|free period|non-contact|planning|ppa|duty|tutor|tutorial|staff meeting)$/i.test(normalise(s))}
function looksLikePerson(s=''){return /^(?:mr|mrs|ms|miss|dr|prof)\.?\s+[A-Za-z][A-Za-z' -]{1,30}$/i.test(normalise(s))}
const SUBJECT_ALIASES_EXTRA={
  'combined science':'Combined Science','computer science':'Computer Science','english language':'English Language','english literature':'English Literature','physical education':'PE','religious studies':'RS','design technology':'DT','food technology':'Food Technology','food prep':'Food Preparation','business studies':'Business','social sciences':'Social Sciences',
  'physics':'Physics','phys':'Physics','phy':'Physics','chemistry':'Chemistry','chem':'Chemistry','biology':'Biology','bio':'Biology','science':'Science','sci':'Science','maths':'Maths','mathematics':'Maths','math':'Maths','english':'English','eng':'English','history':'History','hist':'History','geography':'Geography','geo':'Geography','computing':'Computing','ict':'ICT','pe':'PE','art':'Art','music':'Music','drama':'Drama','french':'French','spanish':'Spanish','german':'German','rs':'RS','pshe':'PSHE','dt':'DT','business':'Business','economics':'Economics','psychology':'Psychology','sociology':'Sociology','form':'Form','tutorial':'Tutorial'
};
function subjectFromText(raw=''){
  let lower=' '+normalise(raw).toLowerCase().replace(/[()\[\]_/,-]+/g,' ')+' ';
  let pool={...Object.fromEntries((SUBJECTS||[]).map(s=>[String(s).toLowerCase(),titleCase(s)])),...SUBJECT_ALIASES_EXTRA};
  let keys=Object.keys(pool).sort((a,b)=>b.length-a.length);
  for(let k of keys){let re=new RegExp(`(^|[^a-z])${k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}([^a-z]|$)`,'i');if(re.test(lower))return pool[k]}
  return '';
}
function parseLessonCell(cell=''){
  let raw=cleanCell(cell),lines=raw.split(/\n|\s{2,}|\s*[|•·]\s*/).map(normalise).filter(Boolean);
  if(!lines.length)return {subject:'',className:'',room:'',confidence:0,raw};
  let room='',className='',subject=subjectFromText(raw);
  for(let line of lines){
    let rm=line.match(/\b(?:room|rm|lab|gym|hall|studio|sports hall|location|classroom)\s*[:#-]?\s*([A-Za-z0-9.-]+(?:\s+[A-Za-z0-9.-]+){0,2})/i);
    if(rm&&!room)room=normalise(rm[0]);
    let cm=line.match(/\b(?:year\s*)?(?:[7-9]|1[0-3])\s*[A-Za-z0-9]{0,5}(?:\/[A-Za-z0-9]{1,5})?\b|\b(?:L6|U6|KS[345])\b|\b(?:Y|Yr)\s*(?:[7-9]|1[0-3])\s*[A-Za-z0-9/]*\b|\b(?:[7-9]|1[0-3])[A-Z]{1,5}\d?\b/i);
    if(cm&&!className)className=normalise(cm[0]);
  }
  if(!room){
    let possible=lines.find(x=>/^(?:lab\s*)?[A-Z]{1,3}\d{1,3}[A-Z]?$|^\d{1,3}[A-Z]?$/i.test(x)&&x!==className);
    if(possible&&/lab|room|rm/i.test(raw))room=possible;
  }
  if(!subject){
    let scored=lines.map(x=>{
      let score=0;
      if(/[A-Za-z]{3,}/.test(x))score+=5;
      if(/\s/.test(x))score+=2;
      if(looksLikePerson(x)||matchDay(x)||parseTimeRange(x)||periodNumber(x)||isNonLessonText(x))score-=12;
      if(/^(?:period|lesson|time|subject|class|group|room|location|teacher|staff)\b/i.test(x))score-=10;
      if(x===className||x===room)score-=10;
      if(/^\d+$/.test(x))score-=10;
      return {x,score};
    }).sort((a,b)=>b.score-a.score);
    if(scored[0]?.score>0)subject=scored[0].x
      .replace(/\b(?:room|rm|lab|gym|hall|studio|location)\b.*$/i,'')
      .replace(/\b(?:year\s*)?(?:[7-9]|1[0-3])\s*[A-Za-z0-9/]{0,6}\b.*$/i,'').trim();
  }
  if(room)room=room.replace(/^rm\b/i,'Room').replace(/^lab\b/i,'Lab');
  let confidence=(subject?48:0)+(className?18:0)+(room?14:0)+Math.min(20,lines.length*5);
  return {subject:titleCase(subject||''),className,room,confidence:Math.min(97,confidence),raw};
}
function titleCase(s=''){
  return String(s).toLowerCase().replace(/\b\w/g,c=>c.toUpperCase())
    .replace(/\bPe\b/g,'PE').replace(/\bRs\b/g,'RS').replace(/\bIct\b/g,'ICT').replace(/\bDt\b/g,'DT').replace(/\bPshe\b/g,'PSHE').replace(/\bGcse\b/g,'GCSE');
}
function candidate(day,range,cell,base=50,source=''){
  let p=parseLessonCell(cell);if(!day||!range||!p.subject||isNonLessonText(p.subject))return null;
  return {selected:true,day,start:range[0]||'',end:range[1]||'',subject:p.subject,className:p.className||'',room:p.room||'',confidence:Math.round(Math.min(99,(base+p.confidence)/2)),source,raw:p.raw||cell};
}
function candidateFromFields(day,range,fields={},base=85,source=''){
  if(!day||!range)return null;
  let subject=normalise(fields.subject||''),className=normalise(fields.className||''),room=normalise(fields.room||'');
  let combined=[subject,className,room].filter(Boolean).join('\n'),p=parseLessonCell(combined);
  if(!subject)subject=p.subject;if(!className)className=p.className;if(!room)room=p.room;
  if(!subject||isNonLessonText(subject))return null;
  return {selected:true,day,start:range[0],end:range[1],subject:titleCase(subject),className,room,confidence:Math.min(99,Math.round(base+(className?3:0)+(room?3:0))),source,raw:combined};
}
function dedupeCandidates(arr){
  let out=[],seen=new Set();
  for(let x of arr.filter(Boolean)){
    x.day=matchDay(x.day)||x.day;x.start=parseTimeText(x.start)||x.start;x.end=parseTimeText(x.end)||x.end||addMinutes(x.start,60);
    x.subject=normalise(x.subject);x.className=normalise(x.className);x.room=normalise(x.room);
    let k=[x.day,x.start,x.subject,x.className].map(v=>String(v||'').toLowerCase()).join('|');
    if(!seen.has(k)&&x.day&&x.start&&x.subject){seen.add(k);out.push(x)}
  }
  return out;
}
function headerKind(s=''){
  let x=normalise(s).toLowerCase();
  if(/^(day|weekday)$/.test(x))return 'day';
  if(/^(period|lesson no\.?|lesson number|slot|p\.?)$/.test(x))return 'period';
  if(/^(time|times|start|lesson time)$/.test(x))return 'time';
  if(/^(subject|lesson|lesson name|activity|course)$/.test(x))return 'subject';
  if(/^(class|group|set|year|form|class\/group)$/.test(x))return 'className';
  if(/^(room|location|venue|classroom)$/.test(x))return 'room';
  return null;
}
function parseColumnTable(rows,source='table'){
  let headerRow=-1,map={};
  for(let r=0;r<Math.min(rows.length,14);r++){
    let trial={};rows[r].forEach((c,i)=>{let k=headerKind(c);if(k&&trial[k]==null)trial[k]=i});
    let score=['day','subject'].filter(k=>trial[k]!=null).length+(trial.time!=null||trial.period!=null?1:0)+(trial.className!=null?1:0)+(trial.room!=null?1:0);
    if(score>=3&&trial.day!=null&&(trial.time!=null||trial.period!=null)&&trial.subject!=null){headerRow=r;map=trial;break}
  }
  if(headerRow<0)return [];
  let out=[],lastDay=null,lastRange=null;
  for(let r=headerRow+1;r<rows.length;r++){
    let row=rows[r],day=matchDay(row[map.day]||'')||lastDay;if(day)lastDay=day;
    let range=parseTimeRange(row[map.time]||'')||parseTimeRange(row[map.period]||'')||lastRange;if(range)lastRange=range;
    let subject=map.subject!=null?row[map.subject]||'':'',className=map.className!=null?row[map.className]||'':'',room=map.room!=null?row[map.room]||'':'';
    if(day&&range&&subject){let c=candidateFromFields(day,range,{subject,className,room},95,source);if(c)out.push(c)}
  }
  return dedupeCandidates(out);
}
function transposeRows(rows){let width=Math.max(0,...rows.map(r=>r.length));return Array.from({length:width},(_,c)=>rows.map(r=>r[c]||''))}
function parseGridCore(rows,source='table'){
  let columnOut=parseColumnTable(rows,source);if(columnOut.length)return columnOut;
  let out=[],headerRow=-1,dayCols={};
  for(let r=0;r<Math.min(rows.length,14);r++){
    let map={};rows[r].forEach((c,i)=>{let d=matchDay(c);if(d)map[i]=d});
    if(Object.keys(map).length>=2){headerRow=r;dayCols=map;break}
  }
  if(headerRow>=0){
    let periodIndex=0;
    for(let r=headerRow+1;r<rows.length;r++){
      let row=rows[r],range=null;
      for(let c=0;c<Math.min(row.length,5);c++){range=parseTimeRange(row[c]);if(range)break}
      if(!range&&state.periods[periodIndex])range=[...state.periods[periodIndex]];
      let had=false;
      for(let [ci,day] of Object.entries(dayCols)){
        let text=row[+ci]||'';if(text&&range){let cand=candidate(day,range,text,90,source);if(cand){out.push(cand);had=true}}
      }
      if(had||range)periodIndex++;
    }
    if(out.length)return dedupeCandidates(out);
  }
  let dayRows=[];
  for(let r=0;r<rows.length;r++){let d=matchDay(rows[r][0]||'');if(d)dayRows.push([r,d])}
  if(dayRows.length>=2){
    let header=rows[Math.max(0,dayRows[0][0]-1)]||[];
    for(let [r,day] of dayRows){
      for(let c=1;c<rows[r].length;c++){
        let range=parseTimeRange(header[c]||'')||parseTimeRange(rows[0]?.[c]||'')||state.periods[c-1];
        let text=rows[r][c];if(text&&range){let cand=candidate(day,range,text,88,source);if(cand)out.push(cand)}
      }
    }
    if(out.length)return dedupeCandidates(out);
  }
  return [];
}
function parseGrid(matrix,source='table'){
  let rows=matrix.map(r=>(Array.isArray(r)?r:[r]).map(cleanCell)).filter(r=>r.some(Boolean));if(!rows.length)return [];
  let out=parseGridCore(rows,source);if(out.length)return out;
  let transposed=transposeRows(rows),tOut=parseGridCore(transposed,source+' (transposed)');if(tOut.length)return tOut;
  return parsePlainText(rows.map(r=>r.join(' | ')).join('\n'),source);
}
function stripScheduleTokens(line=''){
  return normalise(String(line)
    .replace(/\b(?:mon(?:day)?|tue(?:sday|s)?|wed(?:nesday|s)?|thu(?:rsday|rs|r)?|fri(?:day)?)\b/ig,' ')
    .replace(/\b(?:[0-2]?\d[:.]\d{2})(?:\s*[-–—to]+\s*[0-2]?\d[:.]\d{2})?\b/g,' ')
    .replace(/\b(?:period|lesson|slot|p)\s*[:#-]?\s*\d+\b/ig,' ')
    .replace(/[|;]+/g,' '));
}
function parsePlainText(text,source='text'){
  let rawLines=String(text).split(/\n+/).map(x=>x.trim()).filter(Boolean),out=[],day=null,pendingRange=null,seq={};
  for(let i=0;i<rawLines.length;i++){
    let raw=rawLines[i],line=normalise(raw),directDay=matchDay(line);
    if(directDay){day=directDay;seq[day]=0;let letters=line.replace(/[^A-Za-z]/g,'').toLowerCase();if(letters===day.toLowerCase()||letters===day.slice(0,3).toLowerCase())continue}
    let range=parseTimeRange(line);if(range)pendingRange=range;
    if(day&&range){
      let cell=stripScheduleTokens(line);if(cell&&!/^(?:time|period|lesson|subject|class|group|room|location)$/i.test(cell)){
        let c=candidate(day,range,cell,74,source);if(c){out.push(c);pendingRange=null;continue}
      }
    }
    if(day&&pendingRange&&!matchDay(line)&&!parseTimeRange(line)){
      let cell=stripScheduleTokens(line);if(cell&&!/^(?:time|period|lesson|subject|class|group|room|location)$/i.test(cell)){
        let c=candidate(day,pendingRange,cell,66,source);if(c){out.push(c);pendingRange=null;continue}
      }
    }
    let pieces=raw.split(/\t|\s*\|\s*|\s*;\s*/).map(normalise).filter(Boolean);
    if(pieces.length>=3){
      let d=pieces.map(matchDay).find(Boolean)||day,rr=pieces.map(parseTimeRange).find(Boolean);
      if(d&&rr){let leftovers=pieces.filter(x=>!matchDay(x)&&!parseTimeRange(x)&&!periodNumber(x));if(leftovers.length){let c=candidate(d,rr,leftovers.join('\n'),76,source);if(c)out.push(c)}}
    }else if(day&&!range&&!pendingRange){
      let p=parseLessonCell(line),idx=seq[day]||0;
      if(p.subject&&p.confidence>=53&&idx<state.periods.length&&!looksLikePerson(line)&&!isNonLessonText(line)){
        let c=candidate(day,state.periods[idx],line,58,source);if(c){out.push(c);seq[day]=idx+1}
      }
    }
  }
  return dedupeCandidates(out);
}
function coordEdges(centers){
  let s=[...centers].sort((a,b)=>a-b);if(!s.length)return [];
  let gaps=[];for(let i=1;i<s.length;i++)gaps.push(s[i]-s[i-1]);let pad=(gaps.sort((a,b)=>a-b)[Math.floor(gaps.length/2)]||80)/2;
  let e=[s[0]-pad];for(let i=1;i<s.length;i++)e.push((s[i-1]+s[i])/2);e.push(s[s.length-1]+pad);return e;
}
function median(arr){let x=[...arr].sort((a,b)=>a-b);return x.length?x[Math.floor(x.length/2)]:0}
function uniqueAxisBands(items,axis='y',threshold=18){
  let out=[];for(let item of [...items].sort((a,b)=>a[axis]-b[axis])){let prev=out.find(x=>Math.abs(x[axis]-item[axis])<threshold);if(!prev)out.push(item);else if((item.conf||0)>(prev.conf||0))Object.assign(prev,item)}return out;
}
function inferRegularBands(clean,axis,start,end,count){
  let vals=clean.map(w=>w[axis]).filter(v=>v>start&&v<end);if(!vals.length||!count)return [];
  let min=Math.min(...vals),max=Math.max(...vals);if(max<=min)return [];
  let step=(max-min)/Math.max(1,count-1);return Array.from({length:count},(_,i)=>({[axis]:min+i*step,range:state.periods[i]}));
}
function parseHorizontalDayLayout(clean,headers,source){
  headers=[...headers].sort((a,b)=>a.cx-b.cx);let headerY=median(headers.map(h=>h.cy)),xEdges=coordEdges(headers.map(h=>h.cx));
  let firstGap=headers.length>1?headers[1].cx-headers[0].cx:140,leftLimit=headers[0].cx-Math.max(35,firstGap*.35);
  let labels=clean.filter(w=>w.cy>headerY+6&&w.cx<leftLimit&&(parseTimeText(w.text)||periodNumber(w.text))).map(w=>({y:w.cy,range:parseTimeRange(w.text),text:w.text,conf:w.conf})).filter(x=>x.range);
  let bands=uniqueAxisBands(labels,'y',20);
  if(!bands.length){
    let content=clean.filter(w=>w.cy>headerY+8&&w.cx>xEdges[0]&&w.cx<xEdges[xEdges.length-1]&&!matchDay(w.text));
    bands=inferRegularBands(content,'cy',headerY+8,Infinity,state.periods.length).map(x=>({y:x.cy,range:x.range,conf:55}));
  }
  if(!bands.length)return [];
  bands.sort((a,b)=>a.y-b.y);let yEdges=coordEdges(bands.map(b=>b.y)),out=[];
  for(let bi=0;bi<bands.length;bi++){
    let range=bands[bi].range||state.periods[bi];if(!range)continue;
    for(let di=0;di<headers.length;di++){
      let ws=clean.filter(w=>w.cy>yEdges[bi]&&w.cy<yEdges[bi+1]&&w.cx>xEdges[di]&&w.cx<xEdges[di+1]&&!matchDay(w.text)&&!parseTimeText(w.text)&&!periodNumber(w.text));
      let cell=groupWordsIntoLines(ws);if(!cell.trim())continue;
      let avg=ws.reduce((a,w)=>a+(+w.conf||50),0)/Math.max(1,ws.length),c=candidate(headers[di].day,range,cell,Math.min(91,avg),source);if(c)out.push(c);
    }
  }
  return dedupeCandidates(out);
}
function parseVerticalDayLayout(clean,headers,source){
  headers=[...headers].sort((a,b)=>a.cy-b.cy);let headerX=median(headers.map(h=>h.cx)),yEdges=coordEdges(headers.map(h=>h.cy));
  let firstGap=headers.length>1?headers[1].cy-headers[0].cy:100,topLimit=headers[0].cy-Math.max(30,firstGap*.35);
  let labels=clean.filter(w=>w.cx>headerX+15&&w.cy<topLimit&&(parseTimeText(w.text)||periodNumber(w.text))).map(w=>({x:w.cx,range:parseTimeRange(w.text),text:w.text,conf:w.conf})).filter(x=>x.range);
  let bands=uniqueAxisBands(labels,'x',24);
  if(!bands.length){
    let content=clean.filter(w=>w.cx>headerX+20&&w.cy>yEdges[0]&&w.cy<yEdges[yEdges.length-1]&&!matchDay(w.text));
    bands=inferRegularBands(content,'cx',headerX+20,Infinity,state.periods.length).map(x=>({x:x.cx,range:x.range,conf:55}));
  }
  if(!bands.length)return [];
  bands.sort((a,b)=>a.x-b.x);let xEdges=coordEdges(bands.map(b=>b.x)),out=[];
  for(let di=0;di<headers.length;di++){
    for(let bi=0;bi<bands.length;bi++){
      let range=bands[bi].range||state.periods[bi];if(!range)continue;
      let ws=clean.filter(w=>w.cy>yEdges[di]&&w.cy<yEdges[di+1]&&w.cx>xEdges[bi]&&w.cx<xEdges[bi+1]&&!matchDay(w.text)&&!parseTimeText(w.text)&&!periodNumber(w.text));
      let cell=groupWordsIntoLines(ws);if(!cell.trim())continue;
      let avg=ws.reduce((a,w)=>a+(+w.conf||50),0)/Math.max(1,ws.length),c=candidate(headers[di].day,range,cell,Math.min(91,avg),source);if(c)out.push(c);
    }
  }
  return dedupeCandidates(out);
}
function parseOCRLayout(words,source='ocr'){
  let clean=words.filter(w=>w.text&&w.text.trim()&&(+w.conf||0)>18).map(w=>({...w,text:normalise(w.text),cx:w.cx??(w.x0+w.x1)/2,cy:w.cy??(w.y0+w.y1)/2}));
  let unique={};for(let w of clean){let d=matchDay(w.text);if(d&&(!unique[d]||(+w.conf||0)>(+unique[d].conf||0)))unique[d]={...w,day:d}}
  let headers=Object.values(unique);if(headers.length<2)return parsePlainText(groupWordsIntoLines(clean),source);
  let spreadX=Math.max(...headers.map(h=>h.cx))-Math.min(...headers.map(h=>h.cx)),spreadY=Math.max(...headers.map(h=>h.cy))-Math.min(...headers.map(h=>h.cy));
  let out=spreadX>=spreadY?parseHorizontalDayLayout(clean,headers,source):parseVerticalDayLayout(clean,headers,source);
  if(out.length)return out;
  let fallback=parsePlainText(groupWordsIntoLines(clean),source);return dedupeCandidates(fallback);
}
function groupWordsIntoLines(words){
  let rows=[];
  for(let w of [...words].sort((a,b)=>a.cy-b.cy||a.x0-b.x0)){
    let h=Math.max(8,Math.abs((w.y1??w.cy)-(w.y0??w.cy))),row=rows.find(r=>Math.abs(r.y-w.cy)<Math.max(10,h*.8));
    if(!row){row={y:w.cy,words:[]};rows.push(row)}row.words.push(w);
  }
  return rows.sort((a,b)=>a.y-b.y).map(r=>r.words.sort((a,b)=>a.x0-b.x0).map(w=>w.text).join(' ')).join('\n');
}
