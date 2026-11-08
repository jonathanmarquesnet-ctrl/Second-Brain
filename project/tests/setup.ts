import { vi } from 'vitest';

// 1. window.matchMedia mock
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // Deprecated
      removeListener: vi.fn(), // Deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // 2. ResizeObserver mock
  class MockResizeObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    value: MockResizeObserver,
  });

  // 3. IntersectionObserver mock
  class MockIntersectionObserver {
    root = null;
    rootMargin = '';
    thresholds = [];
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn().mockReturnValue([]);
  }
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    value: MockIntersectionObserver,
  });

  // 4. AudioContext mock
  class MockAudioContext {
    state = 'running';
    sampleRate = 44100;
    currentTime = 0;
    createGain = vi.fn().mockReturnValue({
      gain: { value: 1, setValueAtTime: vi.fn() },
      connect: vi.fn(),
    });
    createOscillator = vi.fn().mockReturnValue({
      frequency: { value: 440, setValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    });
    close = vi.fn().mockResolvedValue(undefined);
  }
  Object.defineProperty(window, 'AudioContext', {
    writable: true,
    value: MockAudioContext,
  });
  Object.defineProperty(window, 'webkitAudioContext', {
    writable: true,
    value: MockAudioContext,
  });

  // 5. MediaStream mock
  class MockMediaStream {
    id = 'mock-stream-id';
    active = true;
    getTracks = vi.fn().mockReturnValue([]);
    getVideoTracks = vi.fn().mockReturnValue([]);
    getAudioTracks = vi.fn().mockReturnValue([]);
    addTrack = vi.fn();
    removeTrack = vi.fn();
  }
  Object.defineProperty(window, 'MediaStream', {
    writable: true,
    value: MockMediaStream,
  });

  // 6. HTMLMediaElement (video/audio) mocks
  if (window.HTMLMediaElement) {
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    HTMLMediaElement.prototype.pause = vi.fn();
    HTMLMediaElement.prototype.load = vi.fn();
  }

  // 7. localStorage mock defensivo
  if (!window.localStorage || typeof window.localStorage.getItem !== 'function') {
    const store = new Map<string, string>();
    const mockStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, String(value)),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
      get length() {
        return store.size;
      },
      key: (i: number) => Array.from(store.keys())[i] ?? null,
    };
    Object.defineProperty(window, 'localStorage', {
      writable: true,
      value: mockStorage,
    });
  }
}
