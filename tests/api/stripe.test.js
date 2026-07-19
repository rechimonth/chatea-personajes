import { vi } from "vitest";
import checkoutHandler from "../../api/checkout/index.js";
import portalHandler from "../../api/portal/index.js";

vi.mock("../../lib/stripe.js", () => ({
  getStripeClient: vi.fn(() => ({
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({
          url: "https://checkout.stripe.com/test",
          id: "cs_test_123",
        }),
      },
    },
    billingPortal: {
      sessions: {
        create: vi.fn().mockResolvedValue({
          url: "https://portal.stripe.com/test",
        }),
      },
    },
    subscriptions: {
      retrieve: vi.fn().mockResolvedValue({
        id: "sub_123",
        status: "active",
        current_period_end: 1700000000,
      }),
    },
  })),
  getStripePriceId: vi.fn(() => "price_test_123"),
  getStripeWebhookSecret: vi.fn(() => "whsec_test"),
}));

vi.mock("../../lib/middleware.js", () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 1, email: "test@example.com" };
    next();
  },
}));

vi.mock("../../lib/db.js", () => ({
  getDb: vi.fn(() => ({
    get: vi.fn((sql, params, cb) => {
      cb(null, { provider_subscription_id: "sub_123" });
      return {
        run: vi.fn(),
      };
    }),
    run: vi.fn((sql, params, cb) => {
      cb(null);
      return {
        lastID: 1,
      };
    }),
  })),
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

describe("api/checkout/stripe", () => {
  test("should create checkout session", async () => {
    const req = { method: "POST", body: { provider: "stripe" }, user: { id: 1, email: "test@example.com" } };
    const res = createRes();

    await checkoutHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      url: "https://checkout.stripe.com/test",
      sessionId: "cs_test_123",
    });
  });

  test("should reject non-POST", async () => {
    const req = { method: "GET", body: {}, user: { id: 1, email: "test@example.com" } };
    const res = createRes();

    await checkoutHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: "Method not allowed" });
  });
});

describe("api/portal/stripe", () => {
  test("should create portal session", async () => {
    const req = { method: "POST", body: { provider: "stripe" }, user: { id: 1, email: "test@example.com" } };
    const res = createRes();

    await portalHandler(req, res);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      url: "https://portal.stripe.com/test",
    });
  });

  test("should reject non-POST", async () => {
    const req = { method: "GET", body: {}, user: { id: 1, email: "test@example.com" } };
    const res = createRes();

    await portalHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: "Method not allowed" });
  });
});
