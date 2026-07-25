// POST /api/monobank-webhook
// Monobank calls this on every invoice status change. On a verified "success"
// we look up the order and email the buyer their access — exactly once.
import { getOrder, markFulfilled } from "./_lib/store.js";
import { verifyWebhook } from "./_lib/mono.js";
import { getPlan } from "./_lib/catalog.js";
import { sendAccessEmail, notifyOwner } from "./_lib/email.js";

export async function POST(request) {
  // Read the RAW body — the signature is over the exact bytes, so it must be
  // verified before parsing.
  const raw = await request.text();

  let valid = false;
  try {
    valid = await verifyWebhook(request.headers.get("x-sign"), raw);
  } catch (err) {
    console.error("webhook: signature check errored", err);
  }
  if (!valid) return new Response("invalid signature", { status: 401 });

  let evt;
  try {
    evt = JSON.parse(raw);
  } catch {
    return new Response("bad json", { status: 400 });
  }

  // Only a completed payment delivers access; every other status is acknowledged
  // with 200 so Monobank stops retrying it.
  if (evt.status !== "success") return new Response("ok", { status: 200 });

  const order = await getOrder(evt.invoiceId);
  if (!order) {
    console.warn("webhook: no order for invoice", evt.invoiceId);
    return new Response("ok", { status: 200 });
  }

  // Idempotency: deliver only on the first successful webhook for this invoice.
  const first = await markFulfilled(evt.invoiceId);
  if (!first) return new Response("ok", { status: 200 });

  const plan = getPlan(order.planId);
  try {
    await sendAccessEmail({ to: order.email, name: order.name, plan });
    await notifyOwner({ order, plan, invoiceId: evt.invoiceId });
  } catch (err) {
    // Access mail failed after we already claimed the idempotency lock. Log
    // loudly so it can be re-sent by hand; still return 200 so Monobank does not
    // hammer the endpoint (a retry would be swallowed by the lock anyway).
    console.error("webhook: delivery failed for", evt.invoiceId, order.email, err);
  }

  return new Response("ok", { status: 200 });
}
