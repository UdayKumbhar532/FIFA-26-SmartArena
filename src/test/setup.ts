import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Web Speech Synthesis API
Object.defineProperty(window, 'speechSynthesis', {
  value: {
    speak: vi.fn(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    getVoices: vi.fn().mockReturnValue([]),
  },
  writable: true,
});

// Mock SpeechSynthesisUtterance
(window as any).SpeechSynthesisUtterance = vi.fn().mockImplementation(() => {
  return {
    lang: '',
    text: '',
    onend: null,
  };
});

// Mock canvas-confetti
vi.mock('canvas-confetti', () => {
  return {
    default: vi.fn(),
  };
});
