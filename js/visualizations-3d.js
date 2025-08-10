/* Visualization engine (stubbed basic implementations) */
export class PremiumVisualizationEngine {
  createRadarChart(canvas, traits){ if(!canvas) return; const ctx = canvas.getContext('2d'); const keys = Object.keys(traits); const values = keys.map(k=>traits[k]);
    const R = Math.min(canvas.width, canvas.height)/2 - 10; ctx.clearRect(0,0,canvas.width,canvas.height); ctx.save(); ctx.translate(canvas.width/2, canvas.height/2);
    // draw grid
    const levels = 5; ctx.strokeStyle='rgba(255,255,255,0.18)'; for(let l=1;l<=levels;l++){ ctx.beginPath(); const r=R*(l/levels); for(let i=0;i<keys.length;i++){ const a = (Math.PI*2/keys.length)*i; const x = Math.cos(a)*r; const y = Math.sin(a)*r; i===0? ctx.moveTo(x,y): ctx.lineTo(x,y); } ctx.closePath(); ctx.stroke(); }
    // draw axes
    ctx.strokeStyle='rgba(255,255,255,0.28)'; keys.forEach((k,i)=>{ const a=(Math.PI*2/keys.length)*i; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(a)*R, Math.sin(a)*R); ctx.stroke(); });
    // plot data
    ctx.beginPath(); values.forEach((v,i)=>{ const a=(Math.PI*2/keys.length)*i; const r=R*v; const x=Math.cos(a)*r; const y=Math.sin(a)*r; i===0? ctx.moveTo(x,y): ctx.lineTo(x,y); }); ctx.closePath(); ctx.fillStyle='rgba(255,107,107,0.35)'; ctx.strokeStyle='rgba(78,205,196,0.9)'; ctx.lineWidth=2; ctx.fill(); ctx.stroke();
    ctx.restore();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if(document.getElementById('radarChart')){
    const canvas = document.getElementById('radarChart'); canvas.width=600; canvas.height=600;
    try{ const raw = localStorage.getItem('pp_assessment_results_v1'); if(!raw) return; const session=JSON.parse(raw); const viz = new PremiumVisualizationEngine(); viz.createRadarChart(canvas, session.scores?.traits||{}); }catch(e){ console.warn('Visualization failed', e); }
  }
});
