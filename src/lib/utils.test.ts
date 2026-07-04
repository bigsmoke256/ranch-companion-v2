import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("joins simple class strings", () => {
    expect(cn("p-2", "text-sm")).toBe("p-2 text-sm");
  });

  it("drops falsy values", () => {
    const showHidden = false;
    expect(cn("p-2", showHidden && "hidden", undefined, null, "text-sm")).toBe(
      "p-2 text-sm"
    );
  });

  it("resolves conflicting Tailwind utilities, keeping the last one", () => {
    // twMerge should collapse conflicting padding utilities into the last value
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("supports conditional object syntax", () => {
    expect(cn("base", { active: true, disabled: false })).toBe("base active");
  });
});
