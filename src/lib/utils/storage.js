export const storage = {
  get(key, fallback) {
    if (typeof window === 'undefined') {
      return fallback;
    }
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    try {
      return JSON.parse(raw);
    } catch (error) {
      console.warn('storage.get: failed to parse value for', key, error);
      return fallback;
    }
  },

  set(key, value) {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(key, JSON.stringify(value));
  },

  remove(key) {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.removeItem(key);
  },
};

