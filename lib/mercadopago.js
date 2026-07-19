import { buildEnv } from "./env.js";

export function getMPClient() {
  const accessToken = process.env.MP_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("[mercadopago] Missing MP_ACCESS_TOKEN");
  }

  const mp = require("mercadopago");

  return mp({
    accessToken,
    sandbox: buildEnv() !== "production",
  });
}

export function getMPPublicKey() {
  return process.env.MP_PUBLIC_KEY || "";
}

export function getMPWebhookSecret() {
  return process.env.MP_WEBHOOK_SECRET || "";
}

export function getMPPlanId() {
  return process.env.MP_PLAN_ID || "";
}
