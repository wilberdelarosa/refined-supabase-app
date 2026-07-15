import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { failOrderPayment, settleOrderPayment } from "../_shared/order-payment-settlement.ts";

type Provider = "azul" | "cardnet";

function createAdminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Supabase service role is not configured");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function encodeUtf16Le(value: string) {
  const bytes = new Uint8Array(value.length * 2);
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    bytes[index * 2] = code & 0xff;
    bytes[index * 2 + 1] = code >> 8;
  }
  return bytes;
}

async function hmacSha512(message: string, key: string) {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(key),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", cryptoKey, encodeUtf16Le(message));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEquals(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function sanitizePayload(payload: Record<string, string>) {
  const blockedFragments = ["cardnumber", "creditcard", "datavault", "token", "authhash", "session-key", "cvv", "cvc"];
  return Object.fromEntries(
    Object.entries(payload).filter(([key]) => {
      const normalized = key.toLowerCase().replaceAll("_", "");
      return !blockedFragments.some((fragment) => normalized.includes(fragment));
    }),
  );
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function paymentRedirect(orderId: string, provider: Provider, status: string, responseCode?: string) {
  const siteUrl = (Deno.env.get("PUBLIC_SITE_URL") || "https://barbaro-nutrition.lovable.app").replace(/\/$/, "");
  const target = new URL(`/order/${orderId}`, siteUrl);
  target.searchParams.set("provider", provider);
  target.searchParams.set("payment", status);
  if (responseCode) target.searchParams.set("code", responseCode.slice(0, 24));
  return Response.redirect(target.toString(), 303);
}

async function readResponsePayload(req: Request, url: URL) {
  const payload = Object.fromEntries(url.searchParams.entries());
  if (req.method === "POST") {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const body = new URLSearchParams(await req.text());
      for (const [key, value] of body.entries()) payload[key] = value;
    }
  }
  delete payload.provider;
  delete payload.order_id;
  delete payload.outcome;
  delete payload.return_url;
  return payload;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "GET" && req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const url = new URL(req.url);
  const provider = url.searchParams.get("provider") as Provider | null;
  const orderId = url.searchParams.get("order_id") || "";
  const outcome = url.searchParams.get("outcome") || "return";

  if ((provider !== "azul" && provider !== "cardnet") || !isUuid(orderId)) {
    return jsonResponse({ error: "Invalid payment callback" }, 400);
  }

  const admin = createAdminClient();
  let eventKey = `${provider}:${orderId}:${outcome}`;

  try {
    const responsePayload = await readResponsePayload(req, url);
    const { data: paymentSession, error: sessionError } = await admin
      .from("payment_provider_sessions")
      .select("*")
      .eq("order_id", orderId)
      .eq("provider", provider)
      .single();

    if (sessionError || !paymentSession) {
      throw new Error("Payment session not found");
    }

    const sanitizedPayload = sanitizePayload(responsePayload);
    const eventReference = responsePayload.RRN
      || responsePayload.RetrievalReferenceNumber
      || responsePayload.RetrivalReferenceNumber
      || responsePayload.AuthorizationCode
      || paymentSession.session_id
      || outcome;
    eventKey = `${provider}:${orderId}:${eventReference}:${outcome}`;

    const { error: insertEventError } = await admin.from("payment_return_events").insert({
      provider,
      order_id: orderId,
      event_key: eventKey,
      outcome,
      sanitized_payload: sanitizedPayload,
    });

    if (insertEventError && !String(insertEventError.message).toLowerCase().includes("duplicate")) {
      throw insertEventError;
    }

    if (outcome === "cancelled") {
      await failOrderPayment(admin, orderId, provider, "Pago cancelado por el cliente", sanitizedPayload);
      await admin.from("payment_return_events").update({
        outcome: "cancelled",
        verified: false,
        processed_at: new Date().toISOString(),
      }).eq("event_key", eventKey);
      return paymentRedirect(orderId, provider, "cancelled");
    }

    if (provider === "azul") {
      const authKey = getRequiredEnv("AZUL_AUTH_KEY");
      const receivedHash = responsePayload.AuthHash || responsePayload.AUTHHASH || "";
      const isoCode = responsePayload.IsoCode || responsePayload.ISOCode || "";
      const responseCode = responsePayload.ResponseCode || "";
      const stringToVerify = [
        responsePayload.OrderNumber || "",
        responsePayload.Amount || "",
        responsePayload.AuthorizationCode || "",
        responsePayload.DateTime || "",
        responseCode,
        isoCode,
        responsePayload.ResponseMessage || "",
        responsePayload.ErrorDescription || "",
        responsePayload.RRN || "",
        authKey,
      ].join("");
      const expectedHash = await hmacSha512(stringToVerify, authKey);

      if (!receivedHash || !constantTimeEquals(receivedHash.toLowerCase(), expectedHash.toLowerCase())) {
        throw new Error("Azul response signature is invalid");
      }

      const requestPayload = (paymentSession.request_payload || {}) as Record<string, string>;
      if (responsePayload.OrderNumber !== paymentSession.order_reference) {
        throw new Error("Azul order reference does not match");
      }
      if (String(responsePayload.Amount || "") !== String(requestPayload.amount || "")) {
        throw new Error("Azul amount does not match");
      }

      if (isoCode === "00") {
        const providerReference = responsePayload.RRN || responsePayload.AuthorizationCode || paymentSession.order_reference;
        await settleOrderPayment(admin, {
          orderId,
          provider,
          providerReferenceId: providerReference,
          authorizationCode: responsePayload.AuthorizationCode || null,
          responseCode: isoCode,
          payload: sanitizedPayload,
        });
        await admin.from("payment_return_events").update({
          outcome: "approved",
          verified: true,
          response_code: isoCode,
          processed_at: new Date().toISOString(),
          error_message: null,
        }).eq("event_key", eventKey);
        return paymentRedirect(orderId, provider, "success", isoCode);
      }

      const failureReason = responsePayload.ErrorDescription || responsePayload.ResponseMessage || "Pago declinado por Azul";
      await failOrderPayment(admin, orderId, provider, failureReason, sanitizedPayload);
      await admin.from("payment_return_events").update({
        outcome: "declined",
        verified: true,
        response_code: isoCode || responseCode,
        processed_at: new Date().toISOString(),
      }).eq("event_key", eventKey);
      return paymentRedirect(orderId, provider, "failed", isoCode || responseCode);
    }

    if (!paymentSession.session_id || !paymentSession.session_key) {
      throw new Error("CardNET session credentials are missing");
    }

    const requestPayload = (paymentSession.request_payload || {}) as Record<string, string>;
    const sessionsUrl = String(requestPayload.sessions_url || getRequiredEnv("CARDNET_SESSIONS_URL")).replace(/\/$/, "");
    const verificationUrl = `${sessionsUrl}/${encodeURIComponent(paymentSession.session_id)}?sk=${encodeURIComponent(paymentSession.session_key)}`;
    const verificationResponse = await fetch(verificationUrl, { method: "GET" });
    const verificationText = await verificationResponse.text();
    if (!verificationResponse.ok) {
      throw new Error(`CardNET verification failed (${verificationResponse.status})`);
    }

    let cardnetResult: Record<string, string>;
    try {
      cardnetResult = JSON.parse(verificationText);
    } catch {
      throw new Error("CardNET returned an invalid verification response");
    }

    if (cardnetResult.OrdenID !== paymentSession.order_reference) {
      throw new Error("CardNET order reference does not match");
    }

    const cardnetPayload = sanitizePayload(cardnetResult);
    const responseCode = cardnetResult.ResponseCode || "";
    const providerReference = cardnetResult.RetrievalReferenceNumber
      || cardnetResult.RetrivalReferenceNumber
      || cardnetResult.AuthorizationCode
      || paymentSession.session_id;

    if (responseCode === "00") {
      await settleOrderPayment(admin, {
        orderId,
        provider,
        providerReferenceId: providerReference,
        authorizationCode: cardnetResult.AuthorizationCode || null,
        responseCode,
        payload: cardnetPayload,
      });
      await admin.from("payment_return_events").update({
        outcome: "approved",
        verified: true,
        response_code: responseCode,
        sanitized_payload: cardnetPayload,
        processed_at: new Date().toISOString(),
        error_message: null,
      }).eq("event_key", eventKey);
      return paymentRedirect(orderId, provider, "success", responseCode);
    }

    await failOrderPayment(admin, orderId, provider, `CardNET response ${responseCode || "unknown"}`, cardnetPayload);
    await admin.from("payment_return_events").update({
      outcome: "declined",
      verified: true,
      response_code: responseCode,
      sanitized_payload: cardnetPayload,
      processed_at: new Date().toISOString(),
    }).eq("event_key", eventKey);
    return paymentRedirect(orderId, provider, "failed", responseCode);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected callback error";
    console.error("card-payment-callback error", { provider, orderId, message });
    await admin.from("payment_return_events").update({
      outcome: "error",
      verified: false,
      error_message: message,
      processed_at: new Date().toISOString(),
    }).eq("event_key", eventKey);
    return paymentRedirect(orderId, provider, "error");
  }
});
