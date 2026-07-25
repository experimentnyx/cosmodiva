// POST /api/checkout
// Receives { plan, name, email, telegram } from the checkout modal, creates a
// Monobank invoice for the plan's server-side price, remembers the order, and
// returns { pageUrl } for the browser to redirect to Monobank's hosted page.
import { getPlan } from "./_lib/catalog.js";
import { saveOrder } from "./_lib/store.js";
import { createInvoice } from "./_lib/mono.js";

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function isEmail(v) {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export async function POST(request) {
  // Fail loud-but-clean if the provider secrets are not wired yet — the front
  // end turns a 503 into a friendly "payment is still being set up" message.
  if (!process.env.MONO_TOKEN) return json(503, { error: "not_configured" });

  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "bad_json" });
  }

  const { plan: planId, name, email, telegram } = body || {};
  if (!planId || !name || !isEmail(email)) return json(400, { error: "invalid_input" });

  const plan = getPlan(planId);
  if (!plan) return json(400, { error: "unknown_plan" });

  const origin = new URL(request.url).origin;
  const reference = "cd-" + planId + "-" + Date.now();

  let invoice;
  try {
    invoice = await createInvoice({
      amount: plan.amount,
      reference,
      destination: plan.label,
      redirectUrl: origin + "/success/",
      webHookUrl: origin + "/api/monobank-webhook",
    });
  } catch (err) {
    console.error("checkout: invoice creation failed", err);
    return json(502, { error: "provider_error" });
  }

  try {
    await saveOrder(invoice.invoiceId, {
      planId,
      name: String(name).slice(0, 120),
      email,
      telegram: String(telegram || "").slice(0, 120),
      reference,
    });
  } catch (err) {
    // The invoice exists but we could not persist the order — do not send the
    // buyer to pay for something the webhook won't be able to fulfil.
    console.error("checkout: could not persist order", err);
    return json(502, { error: "store_error" });
  }

  return json(200, { pageUrl: invoice.pageUrl });
}
