/* Sophisticated Scoring Engine */
export class ScoringEngine {
  constructor(traits, existing){
    this.traits = traits;
    this.traitScores = existing?.traits || Object.fromEntries(traits.map(t=>[t,0]));
    this.counts = existing?.counts || Object.fromEntries(traits.map(t=>[t,0]));
    this.facets = existing?.facets || {}; // placeholder for facet-level detail
  }
  initialScores(){ return { traits: {...this.traitScores }, facets:{}, mbti:'', personalityType:'' }; }
  applyResponse(question, value){
    const normalized = (value-1)/4; // map 1-5 Likert to 0-1
    this.traitScores[question.trait] = ((this.traitScores[question.trait]*this.counts[question.trait]) + normalized) / (this.counts[question.trait]+1);
    this.counts[question.trait] += 1;
  }
  currentScores(){ return { traits:{...this.traitScores}, facets:{...this.facets} }; }
  finalize(){
    const mbti = this.deriveMBTI();
    return { traits:{...this.traitScores}, facets:{...this.facets}, mbti, personalityType: this.mapToPersona(mbti) };
  }
  deriveMBTI(){
    // Simplistic placeholder mapping various traits to MBTI axes
    const E = this.traitScores.extraversion > 0.5 ? 'E':'I';
    const S = this.traitScores.abstract_orientation < 0.5 ? 'S':'N';
    const T = this.traitScores.agreeableness < 0.5 ? 'T':'F';
    const J = this.traitScores.flexibility < 0.5 ? 'J':'P';
    return E+S+T+J;
  }
  mapToPersona(mbti){ const map = { ENFP:'Visionary Catalyst', ISTJ:'Detail Guardian' }; return map[mbti] || 'Adaptive Explorer'; }
}
