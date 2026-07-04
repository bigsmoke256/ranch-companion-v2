import { describe, it, expect } from "vitest";
import { deriveRoleFlags } from "./useAuth";

describe("deriveRoleFlags", () => {
  it("returns all flags false when role is null", () => {
    const flags = deriveRoleFlags(null);
    expect(flags.role).toBeNull();
    expect(flags.isAdmin).toBe(false);
    expect(flags.isFarmer).toBe(false);
    expect(flags.isVet).toBe(false);
    expect(flags.isFarmManager).toBe(false);
    expect(flags.isClient).toBe(false);
  });

  it("marks isAdmin true for admin role", () => {
    const flags = deriveRoleFlags("admin");
    expect(flags.isAdmin).toBe(true);
  });

  it("treats admin as a farmer as well (admin superset)", () => {
    // Business rule from the original implementation: admins should pass
    // isFarmer checks too, since they have farmer-level access.
    const flags = deriveRoleFlags("admin");
    expect(flags.isFarmer).toBe(true);
  });

  it("marks isFarmer true for farmer role, without granting admin", () => {
    const flags = deriveRoleFlags("farmer");
    expect(flags.isFarmer).toBe(true);
    expect(flags.isAdmin).toBe(false);
  });

  it("only sets one role flag true for vet", () => {
    const flags = deriveRoleFlags("vet");
    expect(flags.isVet).toBe(true);
    expect(flags.isAdmin).toBe(false);
    expect(flags.isFarmer).toBe(false);
    expect(flags.isFarmManager).toBe(false);
    expect(flags.isClient).toBe(false);
  });

  it("only sets one role flag true for farm_manager", () => {
    const flags = deriveRoleFlags("farm_manager");
    expect(flags.isFarmManager).toBe(true);
    expect(flags.isFarmer).toBe(false);
  });

  it("only sets one role flag true for client", () => {
    const flags = deriveRoleFlags("client");
    expect(flags.isClient).toBe(true);
    expect(flags.isFarmer).toBe(false);
  });
});
