const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const API_URL = import.meta.env.VITE_API_URL || (isLocalhost ? 'http://localhost:5001' : '');

if (typeof window !== 'undefined') {
  console.log('[FixNest Config] Active API_URL:', API_URL || '(relative /api)', '| Host:', window.location.hostname);
}
