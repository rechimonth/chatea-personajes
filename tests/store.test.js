import { describe, it, expect, vi, beforeEach } from "vitest";

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock, writable: true });

vi.mock("../theme.js", () => ({
  saveTheme: vi.fn(),
  loadTheme: vi.fn(() => "light"),
}));

import { store } from "../store.js";

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

describe("store", () => {
  it("getState should return a frozen snapshot", () => {
    const state = store.getState();
    expect(state).toHaveProperty("route", "/home");
    expect(state).toHaveProperty("theme", "light");
    expect(state).toHaveProperty("messages");
    expect(Array.isArray(state.messages)).toBe(true);
    expect(Object.isFrozen(state)).toBe(true);
  });

  it("setState should merge updates and notify listeners", () => {
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.setState({ route: "/chat", characterId: "sherlock-holmes" });

    expect(store.getState().route).toBe("/chat");
    expect(store.getState().characterId).toBe("sherlock-holmes");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("subscribe should return unsubscribe function", () => {
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.setState({ theme: "dark" });
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    store.setState({ theme: "light" });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("notify should trigger all listeners", () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    store.subscribe(listener1);
    store.subscribe(listener2);

    store.notify();

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
  });

  it("incrementDaily and resetDaily should update state", () => {
    store.setState({ dailyMessages: 0, route: "/chat" });

    store.incrementDaily();
    expect(store.getState().dailyMessages).toBe(1);

    store.resetDaily();
    expect(store.getState().dailyMessages).toBe(0);
  });

  it("should not notify on uninitialized subscribe", () => {
    const listener = vi.fn();
    store.subscribe(listener);

    expect(listener).not.toHaveBeenCalled();
  });
});