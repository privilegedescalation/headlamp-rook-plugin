import '@testing-library/jest-dom';

// Node 22+ ships a minimal built-in `localStorage` global (property-bag only,
// no getItem/setItem/removeItem/clear) that shadows jsdom's Web Storage
// implementation. Provide a spec-compliant shim so code under test works.
if (typeof localStorage !== 'undefined' && typeof localStorage.getItem !== 'function') {
  const store = new Map<string, string>();

  const storage = {
    getItem(key: string): string | null {
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string): void {
      store.set(key, String(value));
    },
    removeItem(key: string): void {
      store.delete(key);
    },
    clear(): void {
      store.clear();
    },
    get length(): number {
      return store.size;
    },
    key(index: number): string | null {
      return [...store.keys()][index] ?? null;
    },
  };

  Object.defineProperty(globalThis, 'localStorage', {
    value: storage,
    writable: true,
    configurable: true,
  });

  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', {
      value: storage,
      writable: true,
      configurable: true,
    });
  }
}
