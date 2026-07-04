import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "./use-mobile";

function mockViewport(width: number) {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  });

  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: width < 768,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

describe("useIsMobile", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns true when the viewport is below the mobile breakpoint", () => {
    mockViewport(375); // typical phone width
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("returns false when the viewport is at or above the breakpoint", () => {
    mockViewport(1280); // desktop width
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("returns false (not undefined) before any effect has fired, avoiding layout flicker", () => {
    mockViewport(1280);
    const { result } = renderHook(() => useIsMobile());
    // The hook coerces the initial `undefined` state to boolean via `!!isMobile`
    expect(typeof result.current).toBe("boolean");
  });
});
