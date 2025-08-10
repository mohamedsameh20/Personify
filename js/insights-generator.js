/* Personality insights generator (basic placeholder) */
export class InsightsGenerator {
  generate(scores){
    const traits = scores.traits || {}; const strengths = Object.entries(traits).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k,v])=> formatTrait(k));
    return { strengths, summary: `Key emerging strengths: ${strengths.join(', ')}.` };
  }
}
function formatTrait(k){ return k.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()); }

document.addEventListener('DOMContentLoaded', () => {
  if(document.getElementById('insightContent')){
    try { const raw = localStorage.getItem('pp_assessment_results_v1'); if(!raw) return; const session = JSON.parse(raw); const gen = new InsightsGenerator(); const insights = gen.generate(session.scores); document.getElementById('insightContent').innerHTML = `<p>${insights.summary}</p>`; document.getElementById('mbtiType').textContent = session.scores.mbti; document.getElementById('keyStrengths').innerHTML = '<ul>'+insights.strengths.map(s=>`<li>${s}</li>`).join('')+'</ul>'; } catch(e){ console.warn('Insights load failed'); }
  }
});
