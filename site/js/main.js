(function(){
  const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

  
  /* Nav: transparent on hero, solid after scroll */
  const nav=$('#nav'); const onScroll=()=>nav.classList.toggle('solid',scrollY>40);
  onScroll(); addEventListener('scroll',onScroll,{passive:true});

  /* Drawer */
  const drawer=$('#drawer'), back=$('#drawerBack'), burger=$('#burger');
  function setDrawer(o){drawer.classList.toggle('open',o);back.classList.toggle('open',o);drawer.setAttribute('aria-hidden',!o);burger.setAttribute('aria-expanded',o); if(o) $('#drawerClose').focus(); else burger.focus();}
  burger.addEventListener('click',()=>setDrawer(true));
  $('#drawerClose').addEventListener('click',()=>setDrawer(false));
  back.addEventListener('click',()=>setDrawer(false));
  drawer.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setDrawer(false)));
  addEventListener('keydown',e=>{if(e.key==='Escape'&&drawer.classList.contains('open'))setDrawer(false)});

  /* Scroll reveal (visible at rest; replays a rise with 100ms stagger) */
  if('IntersectionObserver' in window && !reduce){
    const io=new IntersectionObserver(es=>es.forEach(en=>{
      if(en.isIntersecting && en.boundingClientRect.top>0){
        const sibs=Array.from(en.target.parentElement.children).filter(c=>c.classList.contains('rise'));
        en.target.style.animationDelay=(sibs.indexOf(en.target)*100)+'ms';
        en.target.classList.add('in'); io.unobserve(en.target);
      }
    }),{threshold:.15});
    $$('.rise').forEach(el=>{ if(el.getBoundingClientRect().top>innerHeight) io.observe(el); });
  }

  /* Count-up stats */
  const fmt=n=>n.toLocaleString('en-US');
  const counters=$$('[data-count]');
  function runCount(el){const end=+el.dataset.count,suf=el.dataset.suffix||'',plus=end>=1000?'+':'';
    if(reduce){el.textContent=fmt(end)+suf+plus;return}
    const t0=performance.now();(function step(t){const p=Math.min(1,(t-t0)/1200),v=Math.round(end*(1-Math.pow(1-p,3)));el.textContent=fmt(v)+suf+(p===1?plus:'');if(p<1)requestAnimationFrame(step)})(t0);}
  counters.forEach(el=>{el.textContent=fmt(+el.dataset.count)+(el.dataset.suffix||'')+(+el.dataset.count>=1000?'+':'')});
  if('IntersectionObserver' in window){const co=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting){runCount(en.target);co.unobserve(en.target)}}),{threshold:.5});counters.forEach(c=>co.observe(c));}

  /* Cost-per-wear calculator */
  const RC_PRICE=42, RC_LIFE=100;
  const money=n=>(n<0?'-':'')+'$'+Math.abs(n).toLocaleString('en-US',{maximumFractionDigits:0});
  const money2=n=>'$'+n.toFixed(2);
  function readNum(id,errId,min,max,label){
    const el=$(id), v=parseFloat(String(el.value).replace(/[$,\s]/g,''));
    const bad=isNaN(v)||v<min||v>max;
    el.classList.toggle('bad',bad); el.setAttribute('aria-invalid',bad);
    $(errId).textContent=bad?`Enter ${label} between ${min} and ${max}.`:'';
    return bad?null:v;
  }
  let lastBig='';
  function calc(){
    const rot=+$('#rot').value, life=+$('#life').value;
    $('#rotOut').textContent=rot; $('#lifeOut').textContent=life;
    const price=readNum('#price','#priceErr',1,500,'a price'), wears=readNum('#wears','#wearsErr',1,20,'a number');
    if(price===null||wears===null) return;
    const annualWears=rot*wears*12;
    const costFF=annualWears/life*price, costRC=annualWears/RC_LIFE*RC_PRICE;
    const save=costFF-costRC;
    $('#bigLabel').textContent=save>=0?"You'd save each year":"Your current tees cost less per year by";
    const big=money(Math.abs(save));
    const bigEl=$('#big'); bigEl.textContent=big;
    if(big!==lastBig && !reduce){bigEl.classList.remove('pop');void bigEl.offsetWidth;bigEl.classList.add('pop')}
    lastBig=big;
    $('#oWears').textContent=fmt(annualWears);
    $('#oCpwFF').textContent=money2(price/life);
    $('#oCpwRC').textContent=money2(RC_PRICE/RC_LIFE);
    $('#oBin').textContent=Math.max(0,annualWears/life-annualWears/RC_LIFE).toFixed(1)+' / yr';
    const mx=Math.max(costFF,costRC,1);
    $('#barFF').style.width=(costFF/mx*100)+'%'; $('#barRC').style.width=(costRC/mx*100)+'%';
    $('#bFF').textContent=money(costFF); $('#bRC').textContent=money(costRC);
  }
  ['#rot','#life','#price','#wears'].forEach(id=>$(id).addEventListener('input',calc));
  $('#calcForm').addEventListener('submit',e=>e.preventDefault());
  calc();

  /* Email forms (prototype: no network) */
  const emailOk=v=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  function wire(formId,inputId,errId,msg){
    $(formId).addEventListener('submit',e=>{
      e.preventDefault(); const inp=$(inputId), err=$(errId);
      if(!emailOk(inp.value.trim())){inp.classList.add('bad');err.className='err';err.textContent='Enter an email like name@example.com.';inp.focus();return}
      inp.classList.remove('bad'); err.className='ok'; err.textContent=msg;
    });
  }
  wire('#leadForm','#leadEmail','#leadErr','Got it. In the live store your report would be emailed to you; this prototype sends nothing.');
  wire('#newsForm','#newsEmail','#newsErr','You’re on the list (prototype only, nothing was sent).');

  /* Pricing toggle */
  const sw=$('#billing');
  sw.addEventListener('click',()=>{
    const yearly=sw.getAttribute('aria-checked')!=='true'; sw.setAttribute('aria-checked',yearly);
    sw.setAttribute('aria-labelledby',yearly?'lblA':'lblM');
    $$('[data-m]').forEach(el=>{
      el.classList.add('fade');
      setTimeout(()=>{el.textContent=yearly?el.dataset.y:el.dataset.m;el.classList.remove('fade')},reduce?0:180);
    });
    $('#insNote').textContent=yearly?'You save $16 compared with monthly':'Switch to yearly and get 2 months free';
  });

  /* Lookbook player (simulated 2:40 film, 4 chapters) */
  const scenes=$$('.scene'), chBtns=$$('#chapters button'), cc=$('#cc');
  const TOTAL=160, CH=40; let t=0, playing=false, timer=null, capsOn=true;
  const mmss=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
  function render(){
    const i=Math.min(3,Math.floor(t/CH));
    scenes.forEach((s,k)=>s.classList.toggle('on',k===i));
    chBtns.forEach((b,k)=>b.classList.toggle('on',k===i));
    $('#progBar').style.width=(t/TOTAL*100)+'%';
    $('#time').textContent=mmss(t)+' / '+mmss(TOTAL);
    cc.textContent=scenes[i].dataset.cap; cc.hidden=!(capsOn&&(playing||t>0));
  }
  function play(){ if(playing) return; playing=true; $('#poster').hidden=true; $('#playBtn').textContent='❚❚'; $('#playBtn').setAttribute('aria-label','Pause');
    if(t>=TOTAL) t=0; timer=setInterval(()=>{t+=1; if(t>=TOTAL){t=TOTAL;pause()} render()},reduce?1000:250); render(); }
  function pause(){ playing=false; clearInterval(timer); $('#playBtn').textContent='▶'; $('#playBtn').setAttribute('aria-label','Play'); render(); }
  $('#poster').addEventListener('click',play);
  $('#playBtn').addEventListener('click',()=>playing?pause():play());
  $('#ccBtn').addEventListener('click',e=>{capsOn=!capsOn;e.currentTarget.setAttribute('aria-pressed',capsOn);render()});
  chBtns.forEach(b=>b.addEventListener('click',()=>{t=+b.dataset.i*CH;play();render()}));
  render();

})();

/* Offline support: register the service worker so the store can be installed as an app */
if('serviceWorker' in navigator && location.protocol==='https:'){
  addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
}
