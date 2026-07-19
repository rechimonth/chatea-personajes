import { vi } from "vitest";
import { GoogleGenAI } from "@google/genai";
import { CHARACTERS } from "../../characters.js";
import handler, { resetRateLimit } from "../../api/chat.js";

const MAX_HISTORY = 20;

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: vi.fn().mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [{ text: "Mocked AI response" }],
            },
          },
        ],
      }),
    },
  })),
}));

vi.mock("../../lib/middleware.js", () => ({
  authenticate: vi.fn((req, res, next) => {
    req.user = { id: 1, email: "test@example.com" };
    next();
  }),
}));

vi.mock("../../lib/db.js", () => ({
  getDb: vi.fn().mockReturnValue({
    get: vi.fn().mockImplementation((sql, params, callback) => {
      callback(null, null);
    }),
    run: vi.fn().mockImplementation((sql, params, callback) => {
      if (callback) callback(null);
    }),
    all: vi.fn().mockImplementation((sql, params, callback) => {
      callback(null, []);
    }),
  }),
}));

describe("api/chat.js", () => {
  let mockReq;
  let mockRes;
  let resolveHandler;

  beforeEach(() => {
    resetRateLimit();

    mockReq = {
      method: "POST",
      headers: {
        origin: "http://localhost:5173",
        "x-forwarded-for": "127.0.0.1",
        authorization: "Bearer valid-token",
      },
      connection: { remoteAddress: "127.0.0.1" },
      body: {
        characterId: CHARACTERS[0].id,
        messages: [{ role: "user", text: "Hello" }],
      },
    };

    let statusCalls = [];
    let jsonCalls = [];
    let endCalls = [];
    let headerCalls = [];

    const res = {
      status: vi.fn(function (s) {
        statusCalls.push(s);
        return res;
      }),
      setHeader: vi.fn(function (key, value) {
        headerCalls.push({ key, value });
        return res;
      }),
      json: vi.fn(function (data) {
        jsonCalls.push(data);
        return res;
      }),
      end: vi.fn(function () {
        endCalls.push(true);
        return res;
      }),
    };

    res._status = statusCalls;
    res._json = jsonCalls;
    res._end = endCalls;
    res._headers = headerCalls;

    mockRes = res;

    process.env.GEMINI_API_KEY = "TEST_API_KEY";
    process.env.NODE_ENV = "development";
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("should set CORS header to exact request origin in development", async () => {
    await handler(mockReq, mockRes);
    expect(mockRes.setHeader).toHaveBeenCalledWith("Access-Control-Allow-Origin", "http://localhost:5173");
  });

  test("should set CORS header to production origin in production", async () => {
    process.env.NODE_ENV = "production";
    mockReq.headers.origin = "https://chatea-personajes.vercel.app";

    await handler(mockReq, mockRes);

    expect(mockRes.setHeader).toHaveBeenCalledWith("Access-Control-Allow-Origin", "https://chatea-personajes.vercel.app");
  });

  test("should reject disallowed origin in production", async () => {
    process.env.NODE_ENV = "production";
    mockReq.headers.origin = "https://evil-site.com";

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Origin not allowed" });
  });

  test("should return 429 for too many requests from same IP", async () => {
    for (let i = 0; i < 10; i++) {
      await handler(mockReq, mockRes);
    }

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Too many requests. Please try again later." });
    expect(mockRes.setHeader).toHaveBeenCalledWith("Retry-After", expect.any(String));
  });

  test("should truncate messages if more than MAX_HISTORY", async () => {
    const longMessages = Array.from({ length: 25 }, (_, i) => ({ role: "user", text: `Message ${i}` }));
    mockReq.body.messages = longMessages;

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await handler(mockReq, mockRes);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ text: "Mocked AI response" });

    consoleErrorSpy.mockRestore();
  });

  test("should return 400 if characterId is missing", async () => {
    mockReq.body.characterId = undefined;
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "characterId is required" });
  });

  test("should return 400 if messages is not an array", async () => {
    mockReq.body.messages = "not an array";
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "messages must be an array" });
  });

  test("should return 404 if character not found", async () => {
    mockReq.body.characterId = "nonexistent-character";
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Character not found" });
  });

  test("should return 500 if GEMINI_API_KEY is missing", async () => {
    delete process.env.GEMINI_API_KEY;
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Server configuration error" });
    expect(consoleErrorSpy).toHaveBeenCalledWith("[api/chat] Missing GEMINI_API_KEY");
    consoleErrorSpy.mockRestore();
  });
});
