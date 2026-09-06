import { createHmac } from "crypto";

export type SessionRole = "admin" | "seller";
export type Session = { role: SessionRole; sellerId?: string; exp: number };

const TTL_MS = 1000 * 60 * 60 * 12;

function secret(): string {
  return (
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ||
    process.env["SUPABASE_DB_URL"] ||
    "insecure-dev-secret"
  );
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function issueToken(session: Omit<Session, "exp">): string {
  const body = JSON.stringify({ ...session, exp: Date.now() + TTL_MS });
  const payload = Buffer.from(body, "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token: string): Session | null {
  const [payload, sig] = String(token ?? "").split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (sig.length !== expected.length || sig !== expected) return null;
  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as Session;
    if (!session?.exp || session.exp < Date.now()) return null;
    if (session.role !== "admin" && session.role !== "seller") return null;
    return session;
  } catch {
    return null;
  }
}
