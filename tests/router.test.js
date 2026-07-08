import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Router, linkTo } from "../router.js";

const createHistoryState = (path = "/home", search = "") => ({
  pushState: vi.fn(),
  replaceState: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  length: 1,
  scrollRestoration: "auto",
  state: null,
});

const createLocation = (pathname = "/home", search = "") => ({
  pathname,
  search,
  href: `http://localhost${pathname}${search}`,
  origin: "http://localhost",
  assign: vi.fn(),
  replace: vi.fn(),
});

beforeEach(() => {
  const historyMock = createHistoryState();
  const locationMock = createLocation();
  
  Object.defineProperty(window, "history", {
    value: historyMock,
    writable: true,
  });

  Object.defineProperty(window, "location", {
    value: locationMock,
    writable: true,
  });
  
  window.router = null;
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("Router", () => {
  it("should initialize with current path and query", () => {
    const router = new Router();
    expect(router.currentPath).toBe("/home");
    expect(router.getParam("q")).toBeNull();
  });

  it("should navigate and call handler with params", async () => {
    const handler = vi.fn();
    const router = new Router();
    router.addRoute("/home", handler);
    router.addRoute("/chat", handler);

    router.navigate("/chat?id=sherlock-holmes");

    expect(window.history.pushState).toHaveBeenCalled();
    expect(router.currentPath).toBe("/chat");
    expect(router.getParam("id")).toBe("sherlock-holmes");
    expect(handler).toHaveBeenCalledWith({ id: "sherlock-holmes" });
  });

  it("should handle query params in addRoute", () => {
    const handler = vi.fn();
    const router = new Router();
    router.addRoute("/chat", handler);

    router.navigate("/chat?id=dracula&ref=home");
    expect(router.getParam("id")).toBe("dracula");
    expect(router.getParam("ref")).toBe("home");
  });

  it("should resolve the correct route when multiple routes are registered", () => {
    const homeHandler = vi.fn();
    const aboutHandler = vi.fn();
    const router = new Router();

    router.addRoute("/home", homeHandler);
    router.addRoute("/about", aboutHandler);

    router.navigate("/home");

    expect(homeHandler).toHaveBeenCalledTimes(1);
    expect(aboutHandler).not.toHaveBeenCalled();
  });

  it("should get all params as object", () => {
    const handler = vi.fn();
    const router = new Router();
    router.addRoute("/search", handler);

    router.navigate("/search?q=holmes&page=2");

    const params = router.getParams();
    expect(params).toEqual({ q: "holmes", page: "2" });
  });

  it("back and forward should call history methods", () => {
    const router = new Router();
    router.back();
    expect(window.history.back).toHaveBeenCalled();

    router.forward();
    expect(window.history.forward).toHaveBeenCalled();
  });

  it("linkTo should return a function that prevents default and navigates", () => {
    const router = new Router();
    router.addRoute("/about", vi.fn());

    window.router = router;
    const link = linkTo("/about");
    
    link({ preventDefault: vi.fn() });
    
    expect(router.currentPath).toBe("/about");
  });
});