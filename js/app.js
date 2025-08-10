/* Main application controller & theming */
(function(){
  const state = { theme: localStorage.getItem('theme') || 'dark' };
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(state.theme);
    const yearEl = document.getElementById('year'); if(yearEl) yearEl.textContent = new Date().getFullYear();
    const toggle = document.getElementById('themeToggle'); if(toggle){ toggle.addEventListener('click', () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', state.theme); applyTheme(state.theme); toggle.setAttribute('aria-pressed', state.theme==='light');
    }); }
    const featureBtn = document.getElementById('viewFeatures'); if(featureBtn){ featureBtn.addEventListener('click', () => {
      const panel = document.getElementById('featureShowcase'); const expanded = featureBtn.getAttribute('aria-expanded') === 'true';
      featureBtn.setAttribute('aria-expanded', String(!expanded)); if(panel) panel.hidden = expanded;
    }); }
    initHeroParticles();
    loadCharacterPreview();
  });

  function applyTheme(theme){
    const root = document.documentElement;
    if(theme==='light'){
      root.style.setProperty('--color-bg', '#f5f7fa');
      root.style.setProperty('--color-text', '#1a1f27');
      root.style.setProperty('--color-surface', 'rgba(0,0,0,0.06)');
    } else {
      root.style.setProperty('--color-bg', '#0e1116');
      root.style.setProperty('--color-text', '#f5f7fa');
      root.style.setProperty('--color-surface', 'rgba(255,255,255,0.05)');
    }
    document.body.classList.remove('theme-loading');
  }

  function initHeroParticles(){
    const canvas = document.getElementById('heroParticles'); if(!canvas) return;
    const ctx = canvas.getContext('2d');
    let w,h,particles=[]; const COUNT=42; function resize(){ w=canvas.width=canvas.offsetWidth; h=canvas.height=canvas.offsetHeight; }
    window.addEventListener('resize', resize); resize();
    function spawn(){ particles = Array.from({length:COUNT}, () => ({ x:Math.random()*w, y:Math.random()*h, r:1+Math.random()*3, vx:(-0.5+Math.random())*0.35, vy:(-0.5+Math.random())*0.35 })); }
    spawn();
    function frame(){ ctx.clearRect(0,0,w,h); ctx.globalCompositeOperation='lighter'; particles.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; if(p.x<0||p.x>w) p.vx*=-1; if(p.y<0||p.y>h) p.vy*=-1; const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*4); g.addColorStop(0,'rgba(255,107,107,.9)'); g.addColorStop(0.5,'rgba(78,205,196,.55)'); g.addColorStop(1,'rgba(26,83,92,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(p.x,p.y,p.r*4,0,Math.PI*2); ctx.fill(); }); requestAnimationFrame(frame); }
    frame();
  }

  async function loadCharacterPreview(){
    const container = document.getElementById('characterCarousel'); if(!container) return;
    try {
      const res = await fetch('data/characters-enhanced.json'); if(!res.ok) throw new Error('Network');
      const data = await res.json();
      const subset = data.slice(0,6);
      container.innerHTML = subset.map(c => `<article class="char-preview" aria-label="${c.name}"><div class="char-img" style="background:${c.visualEffects?.primaryColor||'#222'}"></div><h3>${c.name}</h3><p>${c.description||''}</p></article>`).join('');
    } catch(e){ container.innerHTML = '<p role="alert">Character preview unavailable offline until first load.</p>'; }
  }
})();
