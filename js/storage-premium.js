// Enhanced local storage with versioning & safe parse
export const Storage = {
  get(key, fallback){ try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch(e){ return fallback; } },
  set(key, value){ try { localStorage.setItem(key, JSON.stringify(value)); } catch(e){ console.warn('Storage write failed', e); } },
  remove(key){ localStorage.removeItem(key); }
};
