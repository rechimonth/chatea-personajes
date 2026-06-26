import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendMessage } from "../service.js";

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn();
});

describe("service.sendMessage", () => {
  it("should throw if characterId is missing", async () => {
    await expect(sendMessage(null, [])).rejects.toThrow(
      "[service] characterId is required"
    );
  });

  it("should throw if messages is not an array", async () => {
    await expect(sendMessage("sherlock-holmes", "invalid")).rejects.toThrow(
      "[service] messages must be an array"
    );
  });

  it("should POST to /api/chat with correct payload", async () => {
    const messages = [
      { role: "user", text: "Hola", timestamp: Date.now() },
    ];

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ text: "Respuesta del personaje" }),
    });

    const result = await sendMessage("sherlock-holmes", messages);

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/chat",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: "sherlock-holmes",
          messages: messages,
        }),
      })
    );

    expect(result).toEqual({
      text: "Respuesta del personaje",
      characterId: "sherlock-holmes",
      timestamp: expect.any(Number),
    });
  });

  it("should trim text from response", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ text: "  Respuesta con espacios  " }),
    });

    const result = await sendMessage("dracula", []);
    expect(result.text).toBe("Respuesta con espacios");
  });

  it("should handle HTTP error response", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: "Server error" }),
    });

    await expect(sendMessage("alice", [])).rejects.toThrow("Server error");
  });

  it("should handle network error", async () => {
    global.fetch.mockRejectedValue(new Error("Network failure"));

    await expect(sendMessage("frankenstein", [])).rejects.toThrow(
      "Network failure"
    );
  });

  it("should truncate messages to last 20", async () => {
    const messages = Array.from({ length: 25 }, (_, i) => ({
      role: "user",
      text: `Mensaje ${i}`,
      timestamp: Date.now() + i,
    }));

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ text: "ok" }),
    });

    await sendMessage("sherlock-holmes", messages);

    const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(callBody.messages.length).toBe(20);
    expect(callBody.messages[0].text).toBe("Mensaje 5");
  });

  it("should handle missing text in response", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    await expect(sendMessage("dracula", [])).rejects.toThrow();
  });
});