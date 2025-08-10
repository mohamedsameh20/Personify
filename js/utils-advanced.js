// Utility helpers
export const clamp = (v,min,max)=> Math.min(max, Math.max(min,v));
export const average = arr => arr.reduce((a,b)=>a+b,0)/(arr.length||1);
