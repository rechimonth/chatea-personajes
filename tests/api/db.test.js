import { vi } from "vitest";
import { getDb, hashPassword, comparePassword, generateToken, verifyToken } from "../../lib/db.js";

describe("api/db.js", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test("hashPassword should return a bcrypt hash", () => {
    const hash = hashPassword("secret123");
    expect(hash).toBeTruthy();
    expect(hash.startsWith("$2")).toBe(true);
  });

  test("comparePassword should validate correct password", () => {
    const hash = hashPassword("secret123");
    expect(comparePassword("secret123", hash)).toBe(true);
    expect(comparePassword("wrong", hash)).toBe(false);
  });

  test("generateToken and verifyToken should roundtrip", () => {
    const user = { id: 1, email: "test@example.com" };
    const token = generateToken(user);
    expect(typeof token).toBe("string");

    const payload = verifyToken(token);
    expect(payload).toMatchObject({ id: 1, email: "test@example.com" });
    expect(payload).toHaveProperty("exp");
    expect(payload).toHaveProperty("iat");
  });

  test("verifyToken should return null for invalid token", () => {
    expect(verifyToken("invalid-token")).toBeNull();
  });
});
