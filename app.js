(async function loadTimetableApp(){
  const files=['core.js','parser.js','import.js'];
  for(const src of files){
    await new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src=src;
      script.onload=resolve;
      script.onerror=()=>reject(new Error(`Could not load ${src}`));
      document.head.appendChild(script);
    });
  }
})().catch(error=>{
  console.error(error);
  const status=document.getElementById('importStatus');
  if(status){status.style.display='block';status.className='notice warn';status.textContent='The timetable app could not finish loading. Refresh the page and try again.';}
});
