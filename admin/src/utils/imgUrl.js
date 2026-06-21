const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function imgUrl(url) {
  if (!url) return '';
  if (url.startsWith('/uploads/')) return `${API_URL}${url}`;
  if (url.startsWith('http')) {
    try {
      const { pathname } = new URL(url);
      if (pathname.startsWith('/uploads/')) return `${API_URL}${pathname}`;
    } catch {}
  }
  return url;
}
