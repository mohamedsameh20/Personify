// Dynamic theming stub (future expansion)
export function deriveThemeFromScores(scores){
  if(!scores) return 'balanced';
  const { traits } = scores;
  if(!traits) return 'balanced';
  if((traits.extraversion||0) > 0.7) return 'creative';
  if((traits.conscientiousness||0) > 0.7) return 'analytical';
  return 'balanced';
}
