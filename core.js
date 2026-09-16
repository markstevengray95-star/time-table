const DAYS=['Monday','Tuesday','Wednesday','Thursday','Friday'];
const DAY_ALIASES={mon:'Monday',monday:'Monday',tue:'Tuesday',tues:'Tuesday',tuesday:'Tuesday',wed:'Wednesday',weds:'Wednesday',wednesday:'Wednesday',thu:'Thursday',thur:'Thursday',thurs:'Thursday',thursday:'Thursday',fri:'Friday',friday:'Friday'};
const SUBJECTS=['physics','chemistry','biology','science','combined science','maths','mathematics','english','english language','english literature','history','geography','computing','computer science','ict','pe','physical education','art','music','drama','french','spanish','german','religious studies','rs','pshe','design technology','dt','food','business','economics','psychology','sociology','form','tutorial','further maths'];
const STORE='teacherTimetableManager_v3';
const SEED_VERSION='adcote-mark-gray-w1w2-2026-09-16-v1';
const DEFAULT_PERIODS=[['08:55','09:55'],['09:55','10:55'],['11:10','12:10'],['12:10','13:10'],['14:05','15:05'],['15:05','16:05']];
const SEED_LESSONS=[
  {"id":"adc-w1-mon-p1","week":"W1","day":"Monday","start":"08:55","end":"09:55","subject":"Further Maths","className":"Y11-/Further Maths","room":"EAL","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w1-wed-p1","week":"W1","day":"Wednesday","start":"08:55","end":"09:55","subject":"Science","className":"Y11-/Science C","room":"Physics Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w1-thu-p1","week":"W1","day":"Thursday","start":"08:55","end":"09:55","subject":"Biology","className":"Y10-Biology","room":"Physics Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w1-fri-p1","week":"W1","day":"Friday","start":"08:55","end":"09:55","subject":"Maths","className":"Y10-Mathematics G","room":"Physics Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w1-mon-p2","week":"W1","day":"Monday","start":"09:55","end":"10:55","subject":"Science","className":"Y9-/Science J","room":"Physics Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w1-tue-p2","week":"W1","day":"Tuesday","start":"09:55","end":"10:55","subject":"Science","className":"Y11-/Science C","room":"Physics Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w1-wed-p2","week":"W1","day":"Wednesday","start":"09:55","end":"10:55","subject":"Physics","className":"Y11-/Physics A","room":"Physics Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w1-thu-p2","week":"W1","day":"Thursday","start":"09:55","end":"10:55","subject":"Physics","className":"Y10-/Physic","room":"Physics Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w1-fri-p2","week":"W1","day":"Friday","start":"09:55","end":"10:55","subject":"Geography","className":"Y7-Geography","room":"Geography Room","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w1-mon-p3","week":"W1","day":"Monday","start":"11:10","end":"12:10","subject":"Biology","className":"Y10-Biology","room":"Physics Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w1-tue-p3","week":"W1","day":"Tuesday","start":"11:10","end":"12:10","subject":"Science","className":"Y11-/Science D","room":"Science Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w1-wed-p3","week":"W1","day":"Wednesday","start":"11:10","end":"12:10","subject":"Physics","className":"Y11-/Physics A","room":"Physics Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w1-thu-p3","week":"W1","day":"Thursday","start":"11:10","end":"12:10","subject":"Physics","className":"Y10-/Physic","room":"Physics Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w1-mon-p4","week":"W1","day":"Monday","start":"12:10","end":"13:10","subject":"Biology","className":"Y10-Biology","room":"Physics Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w1-tue-p4","week":"W1","day":"Tuesday","start":"12:10","end":"13:10","subject":"Physics","className":"Y13-Physics","room":"Physics Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w1-wed-p4","week":"W1","day":"Wednesday","start":"12:10","end":"13:10","subject":"Physics","className":"Y12-Physics","room":"Physics Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w1-fri-p4","week":"W1","day":"Friday","start":"12:10","end":"13:10","subject":"Physics","className":"Y10-/Physic","room":"Physics Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w1-mon-p5","week":"W1","day":"Monday","start":"14:05","end":"15:05","subject":"Science","className":"Y11-/Science C","room":"Physics Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w1-tue-p5","week":"W1","day":"Tuesday","start":"14:05","end":"15:05","subject":"Physics","className":"Y13-Physics","room":"Physics Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w1-wed-p5","week":"W1","day":"Wednesday","start":"14:05","end":"15:05","subject":"Physics","className":"Y12-Physics","room":"Physics Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w1-mon-p6","week":"W1","day":"Monday","start":"15:05","end":"16:05","subject":"Science","className":"Y11-/Science D","room":"Science Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w1-tue-p6","week":"W1","day":"Tuesday","start":"15:05","end":"16:05","subject":"Physics","className":"Y13-Physics","room":"Physics Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w1-wed-p6","week":"W1","day":"Wednesday","start":"15:05","end":"16:05","subject":"Physics","className":"Y12-Physics","room":"Physics Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w2-mon-p1","week":"W2","day":"Monday","start":"08:55","end":"09:55","subject":"Physics","className":"Y13-Physics","room":"Physics Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w2-tue-p1","week":"W2","day":"Tuesday","start":"08:55","end":"09:55","subject":"Science","className":"Y11-/Science C","room":"Physics Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w2-wed-p1","week":"W2","day":"Wednesday","start":"08:55","end":"09:55","subject":"Physics","className":"Y11-/Physics A","room":"Physics Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w2-fri-p1","week":"W2","day":"Friday","start":"08:55","end":"09:55","subject":"Maths","className":"Y10-Mathematics G","room":"Physics Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w2-mon-p2","week":"W2","day":"Monday","start":"09:55","end":"10:55","subject":"Physics","className":"Y13-Physics","room":"Physics Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w2-tue-p2","week":"W2","day":"Tuesday","start":"09:55","end":"10:55","subject":"Science","className":"Y11-/Science D","room":"Science Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w2-wed-p2","week":"W2","day":"Wednesday","start":"09:55","end":"10:55","subject":"Physics","className":"Y11-/Physics A","room":"Physics Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w2-fri-p2","week":"W2","day":"Friday","start":"09:55","end":"10:55","subject":"Science","className":"Y7-/Science","room":"Physics Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w2-mon-p3","week":"W2","day":"Monday","start":"11:10","end":"12:10","subject":"Physics","className":"Y10-/Physic","room":"Physics Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w2-tue-p3","week":"W2","day":"Tuesday","start":"11:10","end":"12:10","subject":"Science","className":"Y11-/Science D","room":"Science Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w2-wed-p3","week":"W2","day":"Wednesday","start":"11:10","end":"12:10","subject":"Science","className":"Y11-/Science D","room":"Science Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w2-fri-p3","week":"W2","day":"Friday","start":"11:10","end":"12:10","subject":"Science","className":"Y9-/Science J","room":"Physics Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w2-mon-p4","week":"W2","day":"Monday","start":"12:10","end":"13:10","subject":"Science","className":"Y11-/Science C","room":"Physics Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w2-tue-p4","week":"W2","day":"Tuesday","start":"12:10","end":"13:10","subject":"Physics","className":"Y11-/Physics A","room":"Physics Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w2-wed-p4","week":"W2","day":"Wednesday","start":"12:10","end":"13:10","subject":"Physics","className":"Y12-Physics","room":"Physics Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w2-fri-p4","week":"W2","day":"Friday","start":"12:10","end":"13:10","subject":"Physics","className":"Y10-/Physic","room":"Physics Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w2-mon-p5","week":"W2","day":"Monday","start":"14:05","end":"15:05","subject":"Biology","className":"Y10-Biology","room":"Physics Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w2-tue-p5","week":"W2","day":"Tuesday","start":"14:05","end":"15:05","subject":"Physics","className":"Y13-Physics","room":"Physics Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w2-wed-p5","week":"W2","day":"Wednesday","start":"14:05","end":"15:05","subject":"Physics","className":"Y12-Physics","room":"Physics Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w2-fri-p5","week":"W2","day":"Friday","start":"14:05","end":"15:05","subject":"Maths","className":"Y10-Mathematics G","room":"Physics Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w2-mon-p6","week":"W2","day":"Monday","start":"15:05","end":"16:05","subject":"Biology","className":"Y10-Biology","room":"Physics Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w2-tue-p6","week":"W2","day":"Tuesday","start":"15:05","end":"16:05","subject":"Physics","className":"Y13-Physics","room":"Physics Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w2-wed-p6","week":"W2","day":"Wednesday","start":"15:05","end":"16:05","subject":"Physics","className":"Y12-Physics","room":"Physics Lab","notes":"Imported from uploaded iSAMS timetable PDF"},
  {"id":"adc-w2-fri-p6","week":"W2","day":"Friday","start":"15:05","end":"16:05","subject":"Maths","className":"Y10-Mathematics G","room":"Physics Lab","notes":"Imported from uploaded iSAMS timetable PDF"}
];
let state=loadState(),currentWeek=state.activeWeek||'W1';
let candidates=[],extractedText='',pdfjsLibRef=null;

function lessonKey(x){return [x.week||'W1',x.day,x.start,String(x.subject||'').trim().toLowerCase(),String(x.className||'').trim().toLowerCase()].join('|')}
function seededLessons(){return SEED_LESSONS.map(x=>({...x}))}
function loadState(){
  let x=null;try{x=JSON.parse(localStorage.getItem(STORE)||'null')}catch(e){}
  let existing=Array.isArray(x?.lessons)?x.lessons.map(l=>({...l,week:l.week||'W1'})):[];
  let seen=new Set(existing.map(lessonKey));
  for(let l of SEED_LESSONS){let k=lessonKey(l);if(!seen.has(k)){existing.push({...l});seen.add(k)}}
  let periods=(x?.seedVersion===SEED_VERSION&&Array.isArray(x?.periods)&&x.periods.length)?x.periods:DEFAULT_PERIODS.map(p=>[...p]);
  let out={...(x||{}),lessons:existing,periods,activeWeek:x?.activeWeek==='W2'?'W2':'W1',seedVersion:SEED_VERSION};
  try{localStorage.setItem(STORE,JSON.stringify(out))}catch(e){}
  return out;
}
function persist(){state.activeWeek=currentWeek;state.seedVersion=SEED_VERSION;localStorage.setItem(STORE,JSON.stringify(state));renderAll()}
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function uid(){return 'l_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8)}
function mins(t){let m=String(t||'').match(/(\d{1,2}):(\d{2})/);return m?(+m[1]*60+ +m[2]):0}
function fmtDuration(a,b){return Math.max(0,mins(b)-mins(a))}
function toast(msg){let e=document.getElementById('toast');e.textContent=msg;e.classList.add('show');clearTimeout(window.__ttToast);window.__ttToast=setTimeout(()=>e.classList.remove('show'),2200)}
function showPage(name){document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id==='page-'+name));document.querySelectorAll('.nav button').forEach(x=>x.classList.toggle('active',x.dataset.page===name));let map={week:['Your week','A clear view of lessons, rooms and classes.'],import:['Smart Import','Turn timetable images and documents into editable lessons.'],lessons:['All lessons','Find and manage every teaching slot.'],settings:['Settings','Configure periods and manage your data.']};document.getElementById('pageTitle').textContent=map[name][0];document.getElementById('pageSub').textContent=map[name][1];if(name==='settings')renderPeriodEditor();if(name==='lessons')renderLessonList()}
document.querySelectorAll('.nav button').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.page)));

function weekLessons(week=currentWeek){return state.lessons.filter(l=>(l.week||'W1')===week)}
function setWeek(week){currentWeek=week==='W2'?'W2':'W1';state.activeWeek=currentWeek;persist()}
function ensureWeekUI(){
  if(!document.getElementById('weekSwitchBar')){
    let stats=document.querySelector('#page-week .stats');
    if(stats)stats.insertAdjacentHTML('afterend',`<div id="weekSwitchBar" class="card" style="padding:12px 16px;margin-bottom:14px;display:flex;align-items:center;gap:8px;flex-wrap:wrap"><b style="margin-right:4px">Timetable cycle:</b><button class="btn" data-week-switch="W1" onclick="setWeek('W1')">Week 1</button><button class="btn" data-week-switch="W2" onclick="setWeek('W2')">Week 2</button><span id="activeWeekLabel" class="pill"></span><button class="btn" style="margin-left:auto" onclick="restoreSeedTimetable()">Reload my uploaded timetable</button></div>`);
  }
  if(!document.getElementById('fWeek')){
    let first=document.querySelector('#lessonModal .modal .two');
    if(first)first.insertAdjacentHTML('beforebegin',`<div class="field"><label>Week</label><select id="fWeek"><option value="W1">Week 1</option><option value="W2">Week 2</option></select></div>`);
  }
}
function updateWeekControls(){document.querySelectorAll('[data-week-switch]').forEach(b=>b.classList.toggle('primary',b.dataset.weekSwitch===currentWeek));let label=document.getElementById('activeWeekLabel');if(label)label.textContent=currentWeek==='W1'?'Week 1':'Week 2'}
function renderAll(){ensureWeekUI();renderWeek();renderStats();renderLessonList();updateWeekControls()}
function renderStats(){let arr=weekLessons(),total=arr.length,m=arr.reduce((a,l)=>a+fmtDuration(l.start,l.end),0),classes=new Set(arr.map(l=>l.className).filter(Boolean)),today=DAYS[new Date().getDay()-1];document.getElementById('statLessons').textContent=total;document.getElementById('statHours').textContent=(m/60).toFixed(m%60?1:0)+'h';document.getElementById('statClasses').textContent=classes.size;document.getElementById('statToday').textContent=today?arr.filter(l=>l.day===today).length:0}
function allTimeSlots(){let set=new Set(state.periods.map(p=>p.join('|')));weekLessons().forEach(l=>set.add([l.start,l.end].join('|')));return [...set].map(x=>x.split('|')).filter(x=>x[0]).sort((a,b)=>mins(a[0])-mins(b[0]))}
function renderWeek(){let g=document.getElementById('weekGrid'),today=DAYS[new Date().getDay()-1],slots=allTimeSlots(),arr=weekLessons();let html='<div class="head">Time</div>'+DAYS.map(d=>`<div class="head ${today===d?'today-head':''}">${d}${today===d?' · Today':''}</div>`).join('');for(let slot of slots){html+=`<div class="time">${esc(slot[0])}<br><span>${esc(slot[1])}</span></div>`;for(let day of DAYS){let items=arr.filter(l=>l.day===day&&l.start===slot[0]).sort((a,b)=>String(a.subject).localeCompare(String(b.subject)));html+=`<div>${items.length?items.map(l=>`<div class="lesson" onclick="openLessonModal('${l.id}')"><b>${esc(l.subject||'Lesson')}</b><span>${esc([l.className,l.room].filter(Boolean).join(' · '))}</span></div>`).join(''):'<div class="empty">—</div>'}</div>`}}g.innerHTML=html}
function renderLessonList(){let box=document.getElementById('lessonList');if(!box)return;let q=(document.getElementById('lessonSearch')?.value||'').trim().toLowerCase();let arr=[...state.lessons].sort((a,b)=>(a.week||'W1').localeCompare(b.week||'W1')||DAYS.indexOf(a.day)-DAYS.indexOf(b.day)||mins(a.start)-mins(b.start)).filter(l=>!q||[l.week,l.day,l.subject,l.className,l.room].join(' ').toLowerCase().includes(q));box.innerHTML=arr.length?arr.map(l=>`<div class="lesson-row"><div><b>${esc(l.week||'W1')} · ${esc(l.day.slice(0,3))}</b><br><small>${esc(l.start)}–${esc(l.end)}</small></div><div><b>${esc(l.subject||'Lesson')}</b><br><small>${esc([l.className,l.room].filter(Boolean).join(' · ')||'No class/room')}</small></div><button class="btn" onclick="openLessonModal('${l.id}')">Edit</button></div>`).join(''):'<div class="notice info">No lessons match.</div>'}

function initModalDays(){document.getElementById('fDay').innerHTML=DAYS.map(d=>`<option>${d}</option>`).join('')}
function openLessonModal(id=''){let l=state.lessons.find(x=>x.id===id);document.getElementById('modalTitle').textContent=l?'Edit lesson':'Add lesson';document.getElementById('editId').value=l?.id||'';let fw=document.getElementById('fWeek');if(fw)fw.value=l?.week||currentWeek;document.getElementById('fDay').value=l?.day||'Monday';document.getElementById('fSubject').value=l?.subject||'';document.getElementById('fStart').value=l?.start||state.periods[0]?.[0]||'09:00';document.getElementById('fEnd').value=l?.end||state.periods[0]?.[1]||'10:00';document.getElementById('fClass').value=l?.className||'';document.getElementById('fRoom').value=l?.room||'';document.getElementById('fNotes').value=l?.notes||'';document.getElementById('deleteLessonBtn').style.display=l?'inline-block':'none';document.getElementById('lessonModal').classList.add('open')}
function closeLessonModal(){document.getElementById('lessonModal').classList.remove('open')}
function saveLessonFromModal(){let id=document.getElementById('editId').value,l={id:id||uid(),week:document.getElementById('fWeek')?.value||currentWeek,day:document.getElementById('fDay').value,subject:document.getElementById('fSubject').value.trim(),start:document.getElementById('fStart').value,end:document.getElementById('fEnd').value,className:document.getElementById('fClass').value.trim(),room:document.getElementById('fRoom').value.trim(),notes:document.getElementById('fNotes').value.trim()};if(!l.subject||!l.start||!l.end){toast('Add a subject, start and end time.');return}let i=state.lessons.findIndex(x=>x.id===id);if(i>=0)state.lessons[i]=l;else state.lessons.push(l);persist();closeLessonModal();toast(id?'Lesson updated':'Lesson added')}
function deleteCurrentLesson(){let id=document.getElementById('editId').value;if(!id)return;state.lessons=state.lessons.filter(x=>x.id!==id);persist();closeLessonModal();toast('Lesson deleted')}
function restoreSeedTimetable(){let keep=state.lessons.filter(l=>!String(l.id||'').startsWith('adc-w'));state.lessons=[...keep,...seededLessons()];state.periods=DEFAULT_PERIODS.map(p=>[...p]);state.seedVersion=SEED_VERSION;persist();toast('Your Week 1 and Week 2 timetable has been reloaded')}

function renderPeriodEditor(){let box=document.getElementById('periodEditor');box.innerHTML=state.periods.map((p,i)=>`<div style="display:grid;grid-template-columns:55px 1fr 1fr auto;gap:7px;align-items:center;margin-bottom:8px"><small style="color:var(--muted)">P${i+1}</small><input class="period-start" type="time" value="${esc(p[0])}" style="border:1px solid #30425f;background:#0c1627;color:var(--text);padding:8px;border-radius:8px"><input class="period-end" type="time" value="${esc(p[1])}" style="border:1px solid #30425f;background:#0c1627;color:var(--text);padding:8px;border-radius:8px"><button class="btn" onclick="removePeriod(${i})">×</button></div>`).join('')}
function addPeriod(){let last=state.periods[state.periods.length-1]||['09:00','10:00'],s=mins(last[1]),e=s+60;state.periods.push([`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`,`${String(Math.floor(e/60)).padStart(2,'0')}:${String(e%60).padStart(2,'0')}`]);renderPeriodEditor()}
function removePeriod(i){state.periods.splice(i,1);renderPeriodEditor()}
function savePeriods(){let s=[...document.querySelectorAll('.period-start')],e=[...document.querySelectorAll('.period-end')];state.periods=s.map((x,i)=>[x.value,e[i].value]).filter(x=>x[0]&&x[1]);persist();toast('Periods saved')}
