import Whop from "npm:@whop/sdk@0.0.35";

type Environment = "production" | "sandbox";

export function getWhopEnvironment(): Environment {
  return Deno.env.get("WHOP_ENVIRONMENT") === "sandbox" ? "sandbox" : "production";
}

export function getWhopBaseURL(environment = getWhopEnvironment()) {
  const explicit = Deno.env.get("WHOP_BASE_URL");
  if (explicit) return explicit;
  return environment === "sandbox"
    ? "https://sandbox-api.whop.com/api/v1"
    : "https://api.whop.com/api/v1";
}

export function getWhopClient() {
  const apiKey = Deno.env.get("WHOP_API_KEY");
  if (!apiKey) {
    throw new Error("WHOP_API_KEY is not configured");
  }

  return new Whop({
    apiKey,
    baseURL: getWhopBaseURL(),
  });
}

export function getWhopCompanyId() {
  const companyId = Deno.env.get("WHOP_COMPANY_ID");
  if (!companyId) {
    throw new Error("WHOP_COMPANY_ID is not configured");
  }

  return companyId;
}

export function getWhopWebhookSecret() {
  const secret = Deno.env.get("WHOP_WEBHOOK_SECRET");
  if (!secret) {
    throw new Error("WHOP_WEBHOOK_SECRET is not configured");
  }

  return secret;
}

export function isWhopNotes(notes?: string | null) {
  return typeof notes === "string" && notes.includes("[whop]");
}

export function buildWhopNotes(sessionId: string) {
  return `[whop] session=${sessionId}`;
}
