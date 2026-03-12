import { vi } from "vitest";

type Listener = (event: MediaQueryListEvent) => void;

function evaluateQuery(width: number, query: string) {
  const minWidthMatch = query.match(/\(min-width:\s*(\d+)px\)/);
  const maxWidthMatch = query.match(/\(max-width:\s*(\d+)px\)/);
  const minWidth = minWidthMatch ? Number(minWidthMatch[1]) : null;
  const maxWidth = maxWidthMatch ? Number(maxWidthMatch[1]) : null;

  if (minWidth !== null && width < minWidth) return false;
  if (maxWidth !== null && width > maxWidth) return false;
  return true;
}

export function mockViewport(width: number) {
  const listeners = new Map<string, Set<Listener>>();

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => {
      const queryListeners = listeners.get(query) || new Set<Listener>();
      listeners.set(query, queryListeners);

      return {
        matches: evaluateQuery(width, query),
        media: query,
        onchange: null,
        addListener: vi.fn((listener: Listener) => queryListeners.add(listener)),
        removeListener: vi.fn((listener: Listener) => queryListeners.delete(listener)),
        addEventListener: vi.fn((_eventName: string, listener: Listener) => queryListeners.add(listener)),
        removeEventListener: vi.fn((_eventName: string, listener: Listener) => queryListeners.delete(listener)),
        dispatchEvent: vi.fn(),
      };
    }),
  });
}
