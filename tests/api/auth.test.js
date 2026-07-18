import { vi } from "vitest";
import registerHandler from "../../api/auth/register/index.js";
import loginHandler from "../../api/auth/login/index.js";
import meHandler from "../../api/auth/me/index.js";

const mockDb = {
  run: vi.fn(),
  get: vi.fn(),
};

vi.mock("../../api/db.js", () => ({
  getDb: vi.fn(() => mockDb),
  hashPassword: vi.fn((pwd) => `hashed-${pwd}`),
  comparePassword: vi.fn((a, b) => a === "correct"),
  generateToken: vi.fn((user) => `token-${user.id}`),
  verifyToken: vi.fn((token) => {
    if (!token || !token.startsWith("token-")) return null;
    const id = Number(token.slice(6));
    return { id, email: "test@example.com" };
  }),
}));

vi.mock("../../api/middleware.js", () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 1, email: "test@example.com" };
    next();
  },
}));

function createRes() {
  const res = {
    status: vi.fn(function (s) {
      res._status = s;
      return res;
    }),
    json: vi.fn(function (data) {
      res._json = data;
      return res;
    }),
    end: vi.fn(function () {
      return res;
    }),
  };
  res._status = null;
  res._json = null;
  return res;
}

describe("api/auth/register", () => {
  test("should register a new user", async () => {
    const statement = { lastID: 1 };
    mockDb.run.mockImplementation(function (sql, params, cb) {
      cb.call(statement, null);
      return this;
    });

    const req = { method: "POST", body: { email: "test@example.com", password: "secret123" } };
    const res = createRes();

    await registerHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      token: "token-1",
      user: { id: 1, email: "test@example.com" },
    });
  });

  test("should reject missing email", async () => {
    const req = { method: "POST", body: { password: "secret123" } };
    const res = createRes();

    await registerHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "email is required" });
  });

  test("should reject short password", async () => {
    const req = { method: "POST", body: { email: "test@example.com", password: "123" } };
    const res = createRes();

    await registerHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "password must be at least 6 characters" });
  });

  test("should reject duplicate email", async () => {
    mockDb.run.mockImplementation(function (sql, params, cb) {
      const err = new Error("UNIQUE constraint failed");
      err.message = "UNIQUE constraint failed: users.email";
      cb(err);
      return this;
    });

    const req = { method: "POST", body: { email: "test@example.com", password: "secret123" } };
    const res = createRes();

    await registerHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: "Email already registered" });
  });
});

describe("api/auth/login", () => {
  test("should login with valid credentials", async () => {
    mockDb.get.mockImplementation((sql, params, cb) => {
      cb(null, { id: 1, email: "test@example.com", password_hash: "hashed-correct" });
      return mockDb;
    });

    const req = { method: "POST", body: { email: "test@example.com", password: "correct" } };
    const res = createRes();

    await loginHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      token: "token-1",
      user: { id: 1, email: "test@example.com" },
    });
  });

  test("should reject invalid password", async () => {
    mockDb.get.mockImplementation((sql, params, cb) => {
      cb(null, { id: 1, email: "test@example.com", password_hash: "hashed-correct" });
      return mockDb;
    });

    const req = { method: "POST", body: { email: "test@example.com", password: "wrong" } };
    const res = createRes();

    await loginHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid email or password" });
  });

  test("should reject missing user", async () => {
    mockDb.get.mockImplementation((sql, params, cb) => {
      cb(null, undefined);
      return mockDb;
    });

    const req = { method: "POST", body: { email: "test@example.com", password: "correct" } };
    const res = createRes();

    await loginHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid email or password" });
  });
});

describe("api/auth/me", () => {
  test("should return user and subscription", async () => {
    mockDb.get.mockImplementation((sql, params, cb) => {
      if (sql.includes("FROM users")) {
        cb(null, { id: 1, email: "test@example.com", provider: "local", created_at: "2024-01-01" });
      } else {
        cb(null, { status: "active", provider: "stripe" });
      }
      return mockDb;
    });

    const req = { method: "GET", headers: {}, user: { id: 1 } };
    const res = createRes();

    await meHandler(req, res);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      user: { id: 1, email: "test@example.com", provider: "local" },
      subscription: { status: "active", provider: "stripe" },
    });
  });
});
