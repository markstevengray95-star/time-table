function normalise(s=''){return String(s).replace(/[\u2013\u2014]/g,'-').replace(/\u00a0/g,' ').replace(/[ \t]+/g,' ').trim()}
function matchDay(s=''){
  let raw=normalise(s).toLowerCase();
  let x=raw.replace(/[^a-z]/g,'');
  if(DAY_ALIASES[x])return DAY_ALIASES[x];
  for(let [k,v] of Object.entries(DAY_ALIASES)){
    if(x===k||x.startsWith(k))return v;
    if(new RegExp(`(^|[^a-z])${k}(?:day)?([^a-z]|$)`,'i').test(raw))return v;
  }
  return null;
}
function parseTimeText(s=''){
  let x=String(s).toLowerCase().replace(/\./g,':').replace(/\s/g,'');
  let m=x.match(/\b([0-2]?\d)[:](\d{2})\b/);
  if(!m)m=x.match(/\b([0-2]?\d)(\d{2})\b/);
  if(!m)return null;
  let h=+m[1],mm=+m[2];
  if(h>23||mm>59)return null;
  return `${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
}
function periodNumber(s=''){
  let m=String(s).match(/(?:period|lesson|p)\s*[:#-]?\s*(\d{1,2})\b/i);
  if(!m&&/^\s*\d{1,2}\s*$/.test(String(s)))m=String(s).match(/(\d{1,2})/);
  let n=m?+m[1]:0;
  return n>0&&n<=state.periods.length?n:null;
}
function parseTimeRange(s=''){
  let raw=String(s).replace(/\./g,':');
  let times=[...raw.matchAll(/\b([0-2]?\d)[:](\d{2})\b/g)].map(m=>`${String(+m[1]).padStart(2,'0')}:${m[2]}`);
  if(times.length>=2)return [times[0],times[1]];
  let pn=periodNumber(raw);
  if(pn&&state.periods[pn-1])return [...state.periods[pn-1]];
  if(times.length===1){
    let x=state.periods.find(p=>p[0]===times[0]);
    return x?[...x]:[times[0],addMinutes(times[0],60)];
  }
  return null;
}
function addMinutes(t,n){let v=mins(t)+n;return `${String(Math.floor(v/60)%24).padStart(2,'0')}:${String(v%60).padStart(2,'0')}`}
function cleanCell(s=''){return String(s).replace(/\r/g,'').split('\n').map(normalise).filter(Boolean).join('\n')}
function isNonLessonText(s=''){
  return /^(?:break|morning break|lunch|lunch break|registration|register|assembly|free|free period|non-contact|planning|ppa|duty|tutor|tutorial only)$/i.test(normalise(s));
}
function parseLessonCell(cell=''){
  let raw=cleanCell(cell);
  let lines=raw.split(/\n|\s{2,}|\s*[|•·]\s*/).map(normalise).filter(Boolean);
  if(!lines.length)return {subject:'',className:'',room:'',confidence:0,raw};
  let room='',className='',subject='';
  for(let line of lines){
    let rm=line.match(/\b(?:room|rm|lab|gym|hall|studio|sports hall|location)\s*[:#-]?\s*([A-Za-z0-9.-]+(?:\s+[A-Za-z0-9.-]+){0,2})/i);
    if(rm&&!room)room=normalise(rm[0]);
    let cm=line.match(/\b(?:year\s*)?(?:[7-9]|1[0-3])\s*[A-Za-z]{0,4}\b|\b(?:L6|U6|KS[345])\b|\b[7-9][A-Z]{1,4}\b|\b1[0-3][A-Z]{1,4}\b|\b(?:Y|Yr)\s*(?:[7-9]|1[0-3])\s*[A-Za-z0-9]*\b/i);
    if(cm&&!className)className=normalise(cm[0]);
  }
  let lower=raw.toLowerCase();
  let subj=[...SUBJECTS].sort((a,b)=>b.length-a.length).find(s=>lower.includes(s));
  if(subj)subject=titleCase(subj);
  if(!subject){
    let leftover=lines.find(x=>x!==room&&x!==className&&!parseTimeRange(x)&&!matchDay(x)&&!isNonLessonText(x)&&!/^(?:period|lesson|time|subject|class|group|room|location)\b/i.test(x));
    if(leftover)subject=leftover
      .replace(/\b(?:room|rm|lab|gym|hall|studio|location)\b.*$/i,'')
      .replace(/\b(?:year\s*)?(?:[7-9]|1[0-3])\s*[A-Za-z0-9]{0,4}\b.*$/i,'')
      .trim()||leftover;
  }
  if(room)room=room.replace(/^rm\b/i,'Room').replace(/^lab\b/i,'Lab');
  let confidence=(subject?45:0)+(className?20:0)+(room?15:0)+Math.min(20,lines.length*5);
  return {subject:titleCase(subject||''),className,room,confidence:Math.min(96,confidence),raw};
}
function titleCase(s=''){
  return String(s).toLowerCase().replace(/\b\w/g,c=>c.toUpperCase())
    .replace(/\bPe\b/g,'PE').replace(/\bRs\b/g,'RS').replace(/\bIct\b/g,'ICT')
    .replace(/\bDt\b/g,'DT').replace(/\bPshe\b/g,'PSHE').replace(/\bGcse\b/g,'GCSE');
}
function candidate(day,range,cell,base=50,source=''){
  let p=parseLessonCell(cell);
  if(!day||!range||!p.subject||isNonLessonText(p.subject))return null;
  return {selected:true,day,start:range?.[0]||'',end:range?.[1]||'',subject:p.subject,className:p.className||'',room:p.room||'',confidence:Math.round(Math.min(99,(base+p.confidence)/2)),source,raw:p.raw||cell};
}
function candidateFromFields(day,range,fields={},base=85,source=''){
  if(!day||!range)return null;
  let subject=normalise(fields.subject||'');
  let className=normalise(fields.className||'');
  let room=normalise(fields.room||'');
  let combined=[subject,className,room].filter(Boolean).join('\n');
  if(!subject){
    let p=parseLessonCell(combined);
    subject=p.subject; if(!className)className=p.className; if(!room)room=p.room;
  }
  if(!subject||isNonLessonText(subject))return null;
  let p=parseLessonCell(combined);
  return {selected:true,day,start:range[0],end:range[1],subject:titleCase(subject),className:className||p.className||'',room:room||p.room||'',confidence:Math.min(99,Math.round(base+(className?3:0)+(room?3:0))),source,raw:combined};
}
function dedupeCandidates(arr){
  let out=[],seen=new Set();
  for(let x of arr.filter(Boolean)){
    x.day=matchDay(x.day)||x.day;
    x.start=parseTimeText(x.start)||x.start;
    x.end=parseTimeText(x.end)||x.end||addMinutes(x.start,60);
    x.subject=normalise(x.subject);x.className=normalise(x.className);x.room=normalise(x.room);
    let k=[x.day,x.start,x.subject,x.className].map(v=>String(v||'').toLowerCase()).join('|');
    if(!seen.has(k)&&x.day&&x.start&&x.subject){seen.add(k);out.push(x)}
  }
  return out;
}
function headerKind(s=''){
  let x=normalise(s).toLowerCase();
  if(/^(day|weekday)$/.test(x))return 'day';
  if(/^(period|lesson|slot|p\.?)$/.test(x))return 'period';
  if(/^(time|times|start|lesson time)$/.test(x))return 'time';
  if(/^(subject|lesson|lesson name|activity)$/.test(x))return 'subject';
  if(/^(class|group|set|year|form|class\/group)$/.test(x))return 'className';
  if(/^(room|location|venue|classroom)$/.test(x))return 'room';
  return null;
}
function parseColumnTable(rows,source='table'){
  let headerRow=-1,map={};
  for(let r=0;r<Math.min(rows.length,12);r++){
    let trial={};
    rows[r].forEach((c,i)=>{let k=headerKind(c);if(k&&!Object.values(trial).includes(i))trial[k]=i});
    let score=['day','subject'].filter(k=>trial[k]!=null).length+(trial.time!=null||trial.period!=null?1:0)+(trial.className!=null?1:0)+(trial.room!=null?1:0);
    if(score>=3&&trial.day!=null&&(trial.time!=null||trial.period!=null)&&trial.subject!=null){headerRow=r;map=trial;break}
  }
  if(headerRow<0)return [];
  let out=[],lastDay=null;
  for(let r=headerRow+1;r<rows.length;r++){
    let row=rows[r];
    let day=matchDay(row[map.day]||'')||lastDay;
    if(day)lastDay=day;
    let range=parseTimeRange(row[map.time]||'')||parseTimeRange(row[map.period]||'');
    if(!range&&map.period!=null){
      let pn=periodNumber(row[map.period]||'');
      if(pn&&state.periods[pn-1])range=[...state.periods[pn-1]];
    }
    let subject=map.subject!=null?row[map.subject]||'':'';
    let className=map.className!=null?row[map.className]||'':'';
    let room=map.room!=null?row[map.room]||'':'';
    if(day&&range&&subject){
      let c=candidateFromFields(day,range,{subject,className,room},94,source);
      if(c)out.push(c);
    }
  }
  return dedupeCandidates(out);
}
function parseGrid(matrix,source='table'){
  let rows=matrix.map(r=>(Array.isArray(r)?r:[r]).map(cleanCell)).filter(r=>r.some(Boolean));
  if(!rows.length)return [];
  let columnOut=parseColumnTable(rows,source);
  if(columnOut.length)return columnOut;

  let out=[],headerRow=-1,dayCols={};
  for(let r=0;r<Math.min(rows.length,12);r++){
    let map={};
    rows[r].forEach((c,i)=>{let d=matchDay(c);if(d)map[i]=d});
    if(Object.keys(map).length>=2){headerRow=r;dayCols=map;break}
  }
  if(headerRow>=0){
    let periodIndex=0;
    for(let r=headerRow+1;r<rows.length;r++){
      let row=rows[r],range=null;
      for(let c=0;c<Math.min(row.length,4);c++){range=parseTimeRange(row[c]);if(range)break}
      if(!range){
        let explicit=row.map(periodNumber).find(Boolean);
        if(explicit&&state.periods[explicit-1])range=[...state.periods[explicit-1]];
      }
      if(!range&&state.periods[periodIndex])range=[...state.periods[periodIndex]];
      let hadLesson=false;
      for(let [ci,day] of Object.entries(dayCols)){
        let text=row[+ci]||'';
        if(text&&range){
          let cand=candidate(day,range,text,88,source);
          if(cand){out.push(cand);hadLesson=true}
        }
      }
      if(hadLesson||range)periodIndex++;
    }
    if(out.length)return dedupeCandidates(out);
  }

  let dayRows=[];
  for(let r=0;r<rows.length;r++){
    let d=matchDay(rows[r][0]||'');
    if(d)dayRows.push([r,d]);
  }
  if(dayRows.length>=2){
    let header=rows[Math.max(0,dayRows[0][0]-1)]||[];
    for(let [r,day] of dayRows){
      for(let c=1;c<rows[r].length;c++){
        let range=parseTimeRange(header[c]||'')||parseTimeRange(rows[0]?.[c]||'')||state.periods[c-1];
        let text=rows[r][c];
        if(text&&range){
          let cand=candidate(day,range,text,86,source);
          if(cand)out.push(cand);
        }
      }
    }
    if(out.length)return dedupeCandidates(out);
  }
  return parsePlainText(rows.map(r=>r.join(' | ')).join('\n'),source);
}
function stripScheduleTokens(line=''){
  return normalise(String(line)
    .replace(/\b(?:mon(?:day)?|tue(?:sday|s)?|wed(?:nesday|s)?|thu(?:rsday|rs|r)?|fri(?:day)?)\b/ig,' ')
    .replace(/\b(?:[0-2]?\d[:.]\d{2})(?:\s*[-–—to]+\s*[0-2]?\d[:.]\d{2})?\b/g,' ')
    .replace(/\b(?:period|lesson|p)\s*[:#-]?\s*\d+\b/ig,' ')
    .replace(/[|;]+/g,' '));
}
function parsePlainText(text,source='text'){
  let rawLines=String(text).split(/\n+/).map(x=>x.trim()).filter(Boolean),out=[],day=null,pendingRange=null;
  for(let i=0;i<rawLines.length;i++){
    let raw=rawLines[i],line=normalise(raw);
    let directDay=matchDay(line);
    if(directDay){
      day=directDay;
      let dayOnly=line.replace(/[^A-Za-z]/g,'').toLowerCase();
      if(dayOnly===day.toLowerCase()||dayOnly===day.slice(0,3).toLowerCase())continue;
    }
    let range=parseTimeRange(line);
    if(range)pendingRange=range;
    if(day&&range){
      let cell=stripScheduleTokens(line);
      if(cell&&!/^(?:time|period|lesson|subject|class|group|room|location)$/i.test(cell)){
        let c=candidate(day,range,cell,72,source);
        if(c){out.push(c);pendingRange=null;continue}
      }
    }
    if(day&&pendingRange&&!matchDay(line)&&!parseTimeRange(line)){
      let cell=stripScheduleTokens(line);
      if(cell&&!/^(?:time|period|lesson|subject|class|group|room|location)$/i.test(cell)){
        let c=candidate(day,pendingRange,cell,64,source);
        if(c){out.push(c);pendingRange=null;continue}
      }
    }
    let pieces=raw.split(/\t|\s*\|\s*|\s*;\s*/).map(normalise).filter(Boolean);
    if(pieces.length>=3){
      let d=pieces.map(matchDay).find(Boolean)||day;
      let rr=pieces.map(parseTimeRange).find(Boolean);
      if(d&&rr){
        let leftovers=pieces.filter(x=>!matchDay(x)&&!parseTimeRange(x)&&!periodNumber(x));
        if(leftovers.length){
          let c=candidate(d,rr,leftovers.join('\n'),74,source);
          if(c)out.push(c);
        }
      }
    }
  }
  return dedupeCandidates(out);
}
function parseOCRLayout(words,source='ocr'){
  let clean=words.filter(w=>w.text&&w.text.trim()&&(+w.conf||0)>20).map(w=>({...w,text:normalise(w.text),cx:w.cx??(w.x0+w.x1)/2,cy:w.cy??(w.y0+w.y1)/2}));
  let dayWords=[];
  for(let w of clean){let d=matchDay(w.text);if(d)dayWords.push({...w,day:d})}
  let unique={};dayWords.forEach(w=>{if(!unique[w.day]||(+w.conf||0)>(+unique[w.day].conf||0))unique[w.day]=w});
  let headers=Object.values(unique).sort((a,b)=>a.cx-b.cx);
  if(headers.length<2)return parsePlainText(groupWordsIntoLines(clean),source);
  let ys=headers.map(h=>h.cy).sort((a,b)=>a-b),medianY=ys[Math.floor(ys.length/2)];
  headers=headers.filter(h=>Math.abs(h.cy-medianY)<Math.max(45,(h.y1-h.y0)*2.8));
  if(headers.length<2)return parsePlainText(groupWordsIntoLines(clean),source);
  let boundaries=[];
  for(let i=0;i<=headers.length;i++){
    if(i===0)boundaries.push(-Infinity);
    else if(i===headers.length)boundaries.push(Infinity);
    else boundaries.push((headers[i-1].cx+headers[i].cx)/2);
  }
  let timeWords=clean.filter(w=>w.cy>medianY+8&&parseTimeText(w.text));
  let timeBands=[];
  for(let w of timeWords.sort((a,b)=>a.cy-b.cy)){
    let t=parseTimeText(w.text);if(!t)continue;
    if(!timeBands.some(x=>Math.abs(x.y-w.cy)<18))timeBands.push({y:w.cy,time:t});
  }
  if(!timeBands.length)return parsePlainText(groupWordsIntoLines(clean),source);
  let out=[];
  for(let ti=0;ti<timeBands.length;ti++){
    let top=ti===0?medianY+8:(timeBands[ti-1].y+timeBands[ti].y)/2;
    let bot=ti===timeBands.length-1?Infinity:(timeBands[ti].y+timeBands[ti+1].y)/2;
    let range=state.periods.find(p=>p[0]===timeBands[ti].time)||[timeBands[ti].time,addMinutes(timeBands[ti].time,60)];
    for(let di=0;di<headers.length;di++){
      let ws=clean.filter(w=>w.cy>top&&w.cy<bot&&w.cx>boundaries[di]&&w.cx<boundaries[di+1]&&!parseTimeText(w.text)&&!matchDay(w.text));
      let cell=groupWordsIntoLines(ws);
      if(cell.trim()){
        let avg=ws.reduce((a,w)=>a+(+w.conf||50),0)/Math.max(1,ws.length);
        let c=candidate(headers[di].day,range,cell,Math.min(90,avg),source);
        if(c)out.push(c);
      }
    }
  }
  return dedupeCandidates(out);
}
function groupWordsIntoLines(words){
  let rows=[];
  for(let w of [...words].sort((a,b)=>a.cy-b.cy||a.x0-b.x0)){
    let h=Math.max(8,Math.abs((w.y1??w.cy)-(w.y0??w.cy)));
    let row=rows.find(r=>Math.abs(r.y-w.cy)<Math.max(10,h*.8));
    if(!row){row={y:w.cy,words:[]};rows.push(row)}
    row.words.push(w);
  }
  return rows.sort((a,b)=>a.y-b.y).map(r=>r.words.sort((a,b)=>a.x0-b.x0).map(w=>w.text).join(' ')).join('\n');
}
