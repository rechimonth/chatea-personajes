export function buildEnv() {
  return (process.env.NODE_ENV || "development").toLowerCase();
}
