import crypto from "crypto";

export function hashPayload(payload: unknown) {
  const json = JSON.stringify(payload);
  return crypto.createHash("sha256").update(json).digest("hex");
}
