(function(){
  var PLATES=[45,35,25,10,5,2.5];
  var barWeight=45;

  /* ---------- audio alarm ---------- */
  var actx=null;
  function ensureAudio(){
    try{
      if(!actx){ var C=window.AudioContext||window.webkitAudioContext; if(C) actx=new C(); }
      if(actx && actx.state==='suspended') actx.resume();
    }catch(e){}
    return !!actx;
  }
  function beep(freq,at,dur,vol){
    var o=actx.createOscillator(), g=actx.createGain();
    o.type='square'; o.frequency.value=freq;
    var t=actx.currentTime+at;
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(vol,t+0.008);
    g.gain.setValueAtTime(vol,t+dur-0.03);
    g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(g); g.connect(actx.destination);
    o.start(t); o.stop(t+dur+0.02);
  }
  function alarm(){
    if(!ensureAudio()) return;
    for(var i=0;i<8;i++){ beep(i%2?1245:933, i*0.26, 0.19, 0.95); }
    try{ if(navigator.vibrate) navigator.vibrate([300,120,300,120,300]); }catch(e){}
  }
  var tb=document.querySelector('.alarmtest');
  if(tb) tb.addEventListener('click',function(){
    alarm(); tb.classList.add('ok'); tb.textContent='Alarm on';
    setTimeout(function(){ tb.classList.remove('ok'); tb.textContent='Test alarm'; },2600);
  });

  /* ---------- plate maths ---------- */
  function split(target,bar){
    var per=(target-bar)/2, out=[], rem=per;
    if(per<0) return {plates:null,per:per};
    PLATES.forEach(function(p){ while(rem>=p-0.001){ out.push(p); rem-=p; } });
    return {plates:out,per:per,left:Math.round(rem*10)/10};
  }
  function cls(p){return p===45?'d45':p===35?'d35':p===25?'d25':p===10?'d10':p===5?'d5':'d2';}
  function render(){
    document.querySelectorAll('.ex[data-target]').forEach(function(ex){
      var target=parseFloat(ex.dataset.target);
      var bar=ex.dataset.fixedBar?parseFloat(ex.dataset.fixedBar):barWeight;
      var viz=ex.querySelector('[data-bar-viz]'), ps=ex.querySelector('[data-per-side]');
      if(!viz) return;
      var r=split(target,bar);
      viz.innerHTML='';
      var sl=document.createElement('div'); sl.className='sleeve'; viz.appendChild(sl);
      if(!r.plates||!r.plates.length){
        var n=document.createElement('div'); n.className='note';
        n.textContent=r.per<=0?'Empty bar':'No plates needed'; viz.appendChild(n);
      } else {
        r.plates.forEach(function(p){
          var d=document.createElement('div'); d.className='pl '+cls(p);
          d.textContent=p; viz.appendChild(d);
        });
      }
      var t=bar+' lb bar + '+(r.per>0?r.per:0)+' lb per side = '+target+' lb';
      if(r.left&&r.left>0.05) t+='  (short by '+r.left+' lb per side)';
      ps.textContent=t;
    });
  }
  document.querySelectorAll('.seg button').forEach(function(b){
    b.addEventListener('click',function(){
      document.querySelectorAll('.seg button').forEach(function(o){o.setAttribute('aria-pressed','false');});
      b.setAttribute('aria-pressed','true');
      barWeight=parseFloat(b.dataset.bar); render();
    });
  });

  /* ---------- sets ---------- */
  document.querySelectorAll('.setchip').forEach(function(c){
    c.addEventListener('click',function(){
      c.setAttribute('aria-pressed', c.getAttribute('aria-pressed')==='true'?'false':'true');
    });
  });

  /* ---------- rest timers ---------- */
  function fmt(s){return Math.floor(s/60)+':'+('0'+(s%60)).slice(-2);}
  document.querySelectorAll('.timer').forEach(function(t){
    var total=parseInt(t.dataset.rest,10), id=null, left=total, label='Rest '+fmt(total);
    function reset(){ if(id){clearInterval(id);id=null;} left=total; t.className='timer'; t.textContent=label; }
    t.addEventListener('click',function(){
      if(t.classList.contains('done')){ reset(); return; }
      if(id){ reset(); return; }
      ensureAudio();                       /* unlock while we have the gesture */
      left=total; t.className='timer run'; t.textContent=fmt(left);
      id=setInterval(function(){
        left--;
        if(left<=0){
          clearInterval(id); id=null;
          t.className='timer done'; t.textContent='GO';
          alarm();
        } else { t.textContent=fmt(left); }
      },1000);
    });
  });

  /* ---------- video ---------- */
  function loadVideo(el){
    var f=document.createElement('iframe');
    f.src='https://www.youtube.com/embed/'+el.dataset.yt+'?autoplay=1&rel=0&playsinline=1&modestbranding=1';
    f.title='Technique video';
    f.setAttribute('referrerpolicy','strict-origin-when-cross-origin');
    f.setAttribute('allow','accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen');
    f.setAttribute('allowfullscreen','');
    el.replaceWith(f);
  }
  document.querySelectorAll('.poster[data-yt]').forEach(function(p){
    p.addEventListener('click',function(){loadVideo(p);});
    p.addEventListener('keydown',function(e){
      if(e.key==='Enter'||e.key===' '){e.preventDefault();loadVideo(p);}
    });
    var img=p.querySelector('img');
    function fail(){
      p.classList.add('nothumb');
      var pl=p.querySelector('.play'); if(pl) pl.setAttribute('data-label','Tap to play');
    }
    if(img){ img.addEventListener('error',fail);
      if(img.complete && img.naturalWidth===0) fail(); }
  });

  render();
})();
