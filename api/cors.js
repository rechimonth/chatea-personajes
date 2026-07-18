const VERCEL_PRODUCTION_ORIGIN = "https://chatea-personajes.vercel.app";
const LOCAL_DEVELOPMENT_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

export function getAllowedOrigins() {
  if (process.env.NODE_ENV === "production") {
    return [VERCEL_PRODUCTION_ORIGIN];
  }

  return LOCAL_DEVELOPMENT_ORIGINS;
}

export function getCorsOrigin(reqOrigin) {
  if (!reqOrigin) return null;

  const allowed = getAllowedOrigins();
  if (allowed.includes(reqOrigin)) {
    return reqOrigin;
  }

  return null;
}

export function applyCors(req, res, corsOrigin) {
  if (corsOrigin) {
    res.setHeader("Access-Control-Allow-Origin", corsOrigin);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
}
