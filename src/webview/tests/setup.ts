import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock acquireVsCodeApi
(global as any).acquireVsCodeApi = () => ({
  postMessage: vi.fn(),
  getState: vi.fn(),
  setState: vi.fn(),
});

// Mock codicons as they are not easily resolvable in JSDOM/Node
vi.mock("@vscode/codicons", () => ({}));

// react-window v2 uses ResizeObserver internally — jsdom does not provide it.
// Provide a no-op stub so component tests can mount without crashing.
(global as any).ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Stub IntersectionObserver for any scroll-visibility hooks
(global as any).IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
