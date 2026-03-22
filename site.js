const body = document.body;
function setLang(lang){
  localStorage.setItem('selected_lang', lang);
  body.classList.toggle('lang-en', lang === 'en');
  document.querySelectorAll('.lang-switch button').forEach(btn=>{
    btn.classList.toggle('active', btn.dataset.langBtn === lang);
  });
}
document.addEventListener('DOMContentLoaded', ()=>{
  setLang(localStorage.getItem('selected_lang') || 'tr');
  const mobileToggle = document.getElementById('mobileToggle');
  if(mobileToggle){
    mobileToggle.addEventListener('click', ()=>body.classList.toggle('menu-open'));
  }
  document.querySelectorAll('[data-mobile-close]').forEach(el=>el.addEventListener('click', ()=>body.classList.remove('menu-open')));
  document.querySelectorAll('.lang-switch button').forEach(btn=>btn.addEventListener('click', ()=>setLang(btn.dataset.langBtn)));
  document.querySelectorAll('.menu > li.has-mega > button').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      if(window.innerWidth > 1100){
        e.preventDefault();
        const li = btn.parentElement;
        document.querySelectorAll('.menu > li.has-mega').forEach(item=>{ if(item !== li) item.classList.remove('open'); });
        li.classList.toggle('open');
      }
    });
  });
  document.addEventListener('click', (e)=>{
    if(!e.target.closest('.menu')) document.querySelectorAll('.menu > li.has-mega').forEach(item=>item.classList.remove('open'));
  });
  const slides = document.querySelectorAll('.hero-slide');
  if(slides.length){
    let i=0;
    const dots = document.querySelectorAll('.hero-dots button');
    const show = (n)=>{
      slides.forEach((s,idx)=>s.classList.toggle('active', idx===n));
      dots.forEach((d,idx)=>d.classList.toggle('active', idx===n));
      i=n;
    };
    dots.forEach((d,idx)=>d.addEventListener('click', ()=>show(idx)));
    setInterval(()=>show((i+1)%slides.length), 5000);
  }
});
