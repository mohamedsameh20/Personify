/* Advanced assessment engine: orchestrates session, responses, adaptive logic */
import { IntelligentQuestionSelector } from './question-selector.js';
import { ScoringEngine } from './scoring-advanced.js';
import { InsightsGenerator } from './insights-generator.js';

const AssessmentEngine = (() => {
  const STORAGE_KEY_PROGRESS = 'pp_assessment_progress_v1';
  const STORAGE_KEY_RESULTS = 'pp_assessment_results_v1';
  const TRAIT_KEYS = ['honesty_humility','emotionality','extraversion','agreeableness','conscientiousness','openness','dominance','vigilance','self_transcendence','abstract_orientation','value_orientation','flexibility'];

  let questionPool = [];
  let selector; let scoring; let insights;
  let session = null;

  async function init(){
    const modeButtons = document.querySelectorAll('.mode-btn');
    modeButtons.forEach(btn => btn.addEventListener('click', () => startAssessment(btn.dataset.mode)));
    loadData();
    restoreProgress();
    document.getElementById('prevQuestion')?.addEventListener('click', prevQuestion);
    document.getElementById('nextQuestion')?.addEventListener('click', nextQuestion);
    document.getElementById('pauseAssessment')?.addEventListener('click', pauseAssessment);
  }

  async function loadData(){
    try {
      const res = await fetch('data/premium-questions.json'); questionPool = await res.json();
    } catch(e){ console.warn('Question data unavailable, using fallback stub.'); questionPool = fallbackQuestions(); }
  }

  function startAssessment(mode){
    const questionTargets = { quick:30, standard:60, comprehensive:120 };
    const targetCount = questionTargets[mode] || 30;
    selector = new IntelligentQuestionSelector(questionPool, targetCount);
    const selected = selector.selectOptimalQuestions();
    scoring = new ScoringEngine(TRAIT_KEYS);
    insights = new InsightsGenerator();
    session = {
      id: crypto.randomUUID(), mode, started: Date.now(), index:0, responses:[], questions:selected,
      scores: scoring.initialScores(),
      complete:false
    };
    document.getElementById('assessmentIntro').hidden = true;
    document.getElementById('questionPanel').hidden = false;
    renderCurrentQuestion();
    saveProgress();
  }

  function renderCurrentQuestion(){
    const q = session.questions[session.index];
    const container = document.getElementById('questionContainer');
    const answerControls = document.getElementById('answerControls');
    const progressFill = document.getElementById('progressFill');
    const questionIndex = document.getElementById('questionIndex');
    if(!q) return;
    questionIndex.textContent = `Question ${session.index+1} / ${session.questions.length}`;
    progressFill.style.width = ((session.index)/ (session.questions.length))*100 + '%';
    container.innerHTML = `<h2 class="question-text">${escapeHTML(q.text)}</h2>`;
    answerControls.innerHTML = '';
    for(let i=1;i<=5;i++){
      const btn = document.createElement('button'); btn.textContent = i.toString(); btn.setAttribute('data-value', i);
      btn.addEventListener('click', () => selectAnswer(q, i, btn));
      answerControls.appendChild(btn);
    }
    hydrateExistingAnswer(q, answerControls);
    updateNavStates();
    renderLiveInsights();
  }

  function selectAnswer(question, value, btn){
    const existing = session.responses.find(r => r.id === question.id);
    if(existing){ existing.value = value; } else { session.responses.push({ id:question.id, trait:question.trait, value }); }
    [...btn.parentElement.children].forEach(b => b.removeAttribute('aria-pressed'));
    btn.setAttribute('aria-pressed','true');
    scoring.applyResponse(question, value);
    session.scores = scoring.currentScores();
    renderLiveInsights();
    saveProgress();
    document.getElementById('nextQuestion').disabled = false;
  }

  function hydrateExistingAnswer(question, container){
    const existing = session.responses.find(r => r.id === question.id); if(!existing) return;
    [...container.children].forEach(btn => { if(Number(btn.dataset.value) === existing.value){ btn.setAttribute('aria-pressed','true'); }});
    document.getElementById('nextQuestion').disabled = false;
  }

  function nextQuestion(){ if(session.index < session.questions.length -1){ session.index++; renderCurrentQuestion(); saveProgress(); } else { finishAssessment(); } }
  function prevQuestion(){ if(session.index > 0){ session.index--; renderCurrentQuestion(); } }

  function finishAssessment(){
    session.complete = true;
    session.completed = Date.now();
    // finalize MBTI & additional insights
    session.scores = scoring.finalize();
    session.insights = insights.generate(session.scores);
    saveResults();
    localStorage.removeItem(STORAGE_KEY_PROGRESS);
    window.location.href = 'results.html';
  }

  function pauseAssessment(){ saveProgress(); alert('Progress saved locally. You can resume later.'); }

  function saveProgress(){ localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(session)); }
  function saveResults(){ localStorage.setItem(STORAGE_KEY_RESULTS, JSON.stringify(session)); }

  function restoreProgress(){
    try { const raw = localStorage.getItem(STORAGE_KEY_PROGRESS); if(!raw) return; const s = JSON.parse(raw); if(!s || !s.questions) return; session = s;
      scoring = new ScoringEngine(TRAIT_KEYS, s.scores); insights = new InsightsGenerator();
      document.getElementById('assessmentIntro').hidden = true; document.getElementById('questionPanel').hidden = false; renderCurrentQuestion(); }
    catch(e){ console.warn('Restore failed', e); }
  }

  function renderLiveInsights(){
    if(!session) return; const el = document.getElementById('liveInsights'); if(!el) return;
    const top = Object.entries(session.scores.traits).sort((a,b)=>b[1]-a[1]).slice(0,3);
    el.innerHTML = '<ul class="live-traits">' + top.map(t=>`<li>${formatTrait(t[0])}: <strong>${(t[1]*100|0)}%</strong></li>`).join('') + '</ul>';
  }

  function updateNavStates(){
    document.getElementById('prevQuestion').disabled = session.index === 0;
    document.getElementById('nextQuestion').disabled = !session.responses.find(r=>r.id===session.questions[session.index].id);
  }

  function fallbackQuestions(){
    return Array.from({length:30}, (_,i)=>({ id:'q'+i, text:'Fallback question '+(i+1)+': I enjoy solving complex problems.' , trait: TRAIT_KEYS[i % TRAIT_KEYS.length] }));
  }

  function escapeHTML(str){ return str.replace(/[&<>"]/g, s=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s])); }
  function formatTrait(key){ return key.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()); }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  if(document.getElementById('assessmentRoot')) AssessmentEngine.init();
});
