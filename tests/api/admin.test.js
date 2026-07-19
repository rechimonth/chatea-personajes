import { vi } from "vitest";

const ADMIN_EMAIL = "admin@example.com";

const mockDb = {
  all: vi.fn(),
  get: vi.fn(),
  run: vi.fn(),
};

vi.mock("../../lib/middleware.js", () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 1, email: req.headers["x-admin-email"] === ADMIN_EMAIL ? ADMIN_EMAIL : "user@example.com" };
    next();
  },
}));

vi.mock("../../lib/db.js", () => ({
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

describe("api/admin/characters", () => {
  let handler;

  beforeAll(async () => {
    vi.resetModules();
    const mod = await import("../../api/admin/index.js");
    handler = mod.default;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("should reject non-admin user", async () => {
    process.env.ADMIN_EMAIL = ADMIN_EMAIL;
    const req = {
      method: "GET",
      headers: { "x-admin-email": "user@example.com" },
      user: { id: 1, email: "user@example.com" },
      query: {},
      body: {},
    };
    const res = createRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Forbidden" });
  });

  test("should list characters for admin", async () => {
    process.env.ADMIN_EMAIL = ADMIN_EMAIL;
    const req = {
      method: "GET",
      headers: { "x-admin-email": ADMIN_EMAIL },
      user: { id: 1, email: ADMIN_EMAIL },
      query: {},
      body: {},
    };
    const res = createRes();

    mockDb.all.mockImplementation((sql, cb) => {
      cb(null, [{ id: "sherlock-holmes", name: "Sherlock" }]);
      return mockDb;
    });

    await handler(req, res);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ id: "sherlock-holmes", name: "Sherlock" }),
    ]));
  });

  test("should create character", async () => {
    process.env.ADMIN_EMAIL = ADMIN_EMAIL;
    const req = {
      method: "POST",
      headers: { "x-admin-email": ADMIN_EMAIL },
      user: { id: 1, email: ADMIN_EMAIL },
      query: {},
      body: { id: "new-char", name: "New Character" },
    };
    const res = createRes();

    mockDb.run.mockImplementation(function (sql, params, cb) {
      const statement = { lastID: 1 };
      cb.call(statement, null);
      return this;
    });

    mockDb.get.mockImplementation((sql, params, cb) => {
      cb(null, { id: "new-char", name: "New Character" });
      return mockDb;
    });

    await handler(req, res);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: "new-char", name: "New Character" }));
  });

  test("should update character", async () => {
    process.env.ADMIN_EMAIL = ADMIN_EMAIL;
    const req = {
      method: "PUT",
      headers: { "x-admin-email": ADMIN_EMAIL },
      user: { id: 1, email: ADMIN_EMAIL },
      query: { id: "sherlock-holmes" },
      body: { name: "Sherlock Updated" },
    };
    const res = createRes();

    mockDb.run.mockImplementation(function (sql, params, cb) {
      this.changes = 1;
      cb(null);
      return this;
    });

    mockDb.get.mockImplementation((sql, params, cb) => {
      cb(null, { id: "sherlock-holmes", name: "Sherlock Updated" });
      return mockDb;
    });

    await handler(req, res);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: "sherlock-holmes", name: "Sherlock Updated" }));
  });

  test("should delete character", async () => {
    process.env.ADMIN_EMAIL = ADMIN_EMAIL;
    const req = {
      method: "DELETE",
      headers: { "x-admin-email": ADMIN_EMAIL },
      user: { id: 1, email: ADMIN_EMAIL },
      query: { id: "sherlock-holmes" },
      body: {},
    };
    const res = createRes();

    mockDb.run.mockImplementation(function (sql, params, cb) {
      const statement = { changes: 1 };
      cb.call(statement, null);
      return this;
    });

    await handler(req, res);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ deleted: true });
  });
});
