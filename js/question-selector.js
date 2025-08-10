/* Intelligent Question Selection */
export class IntelligentQuestionSelector {
  constructor(questionPool, targetCount=120){
    this.questionPool = Array.isArray(questionPool)? questionPool: [];
    this.targetCount = targetCount;
    this.selected = [];
  }
  selectOptimalQuestions(){
    const pool = this.questionPool.filter(q=> q && q.trait);
    // crude trait balance: ensure each trait appears at least minCount times
    const traits = [...new Set(pool.map(q=>q.trait))];
    const minCount = Math.max(1, Math.floor(this.targetCount / traits.length * 0.6));
    const traitBuckets = Object.fromEntries(traits.map(t=>[t,[]]));
    pool.forEach(q=> traitBuckets[q.trait].push(q));
    traits.forEach(t=> shuffle(traitBuckets[t]));
    // stage 1 initial balanced selection
    let draft = [];
    traits.forEach(t=> { draft.push(...traitBuckets[t].slice(0,minCount)); });
    // stage 2 fill remaining by discriminative power or fallback
    const remaining = this.targetCount - draft.length;
    const leftovers = pool.filter(q=> !draft.includes(q));
    leftovers.sort((a,b)=>(b.discriminativePower||0)-(a.discriminativePower||0));
    draft.push(...leftovers.slice(0,remaining));
    this.selected = shuffle(draft).slice(0,this.targetCount);
    return this.selected;
  }
  adaptiveQuestionSelection(/*currentResponses, uncertainTraits*/){ /* placeholder for future advanced logic */ }
}

function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.random()* (i+1) |0; [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }
