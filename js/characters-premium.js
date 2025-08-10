/* Character comparison & enhanced profiles */
import { ScoringEngine } from './scoring-advanced.js';

const CharacterModule = (() => {
  let characters = [];
  async function init(){
    if(document.getElementById('characterGrid')) await loadCharacters();
    if(document.getElementById('characterMatchList')) await loadCharacters();
    if(characters.length){ renderGallery(); renderMatches(); }
  }
  async function loadCharacters(){
    try { const res = await fetch('data/characters-enhanced.json'); characters = await res.json(); }
    catch(e){ console.warn('Characters unavailable - using fallback'); characters = fallbackCharacters(); }
  }
  function renderGallery(){
    const grid = document.getElementById('characterGrid'); if(!grid) return;
    grid.innerHTML = characters.map(c => `<article class="character-tile" role="listitem" data-id="${c.id}">
      <img alt="" src="${c.images?.portrait||''}" loading="lazy" />
      <h3>${c.name}</h3>
      <p>${(c.description||'').slice(0,110)}</p>
    </article>`).join('');
    grid.addEventListener('click', e=>{ const tile = e.target.closest('.character-tile'); if(tile) openDetail(tile.dataset.id); });
  }
  function openDetail(id){
    const detail = document.getElementById('characterDetail'); const profile = document.getElementById('characterProfile');
    const c = characters.find(c=>c.id===id); if(!c || !detail) return;
    profile.innerHTML = `<h2>${c.name}</h2><p>${c.detailedAnalysis || c.description || ''}</p>`;
    detail.hidden = false;
    document.getElementById('closeCharacterDetail').onclick = ()=> detail.hidden = true;
  }
  function renderMatches(){
    const list = document.getElementById('characterMatchList'); if(!list) return;
    const resultsRaw = localStorage.getItem('pp_assessment_results_v1'); if(!resultsRaw){ list.innerHTML='<p>No assessment results yet.</p>'; return; }
    const session = JSON.parse(resultsRaw);
    const userScores = session.scores?.traits || {};
    const scored = characters.map(c => ({ ...c, similarity: calculateSimilarity(userScores, c.scores||{}) }));
    scored.sort((a,b)=>b.similarity-a.similarity);
    list.innerHTML = scored.slice(0,9).map(c => `<div class="character-card">
      <h3>${c.name}</h3>
      <progress max="1" value="${c.similarity.toFixed(3)}"></progress>
      <p>Similarity: ${(c.similarity*100).toFixed(1)}%</p>
    </div>`).join('');
  }
  function calculateSimilarity(user, character){
    let total=0, weightSum=0; Object.keys(user).forEach(trait=> { const w = 1; const d = Math.abs((user[trait]||0)-(character[trait]||0)); total+= (1-d)*w; weightSum+=w; });
    return weightSum? total/weightSum : 0; }
  function fallbackCharacters(){ return [ { id:'phineas-flynn', name:'Phineas Flynn', description:'Creative optimist.', scores:{} } ]; }
  return { init };
})();

document.addEventListener('DOMContentLoaded', () => CharacterModule.init());
