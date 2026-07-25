// Order store, backed by Upstash Redis (Vercel KV also speaks this API).
//
// Two jobs:
//  1. Remember who bought what. /api/checkout writes {email, plan, …} keyed by the
//     Monobank invoiceId; the webhook — which fires later and knows only the
//     invoiceId — reads it back to know where to send access.
//  2. Idempotency. Monobank may deliver the "success" webhook more than once;
//     markFulfilled() is an atomic set-if-absent so access is emailed exactly once.
//
// Reads UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN from the environment.
import { Redis } from "@upstash/redis";

let redis = null;
function client() {
  if (!redis) redis = Redis.fromEnv();
  return redis;
}

const WEEK = 60 * 60 * 24 * 7;
const MONTH = 60 * 60 * 24 * 30;

export async function saveOrder(invoiceId, order) {
  await client().set("order:" + invoiceId, order, { ex: WEEK });
}

export async function getOrder(invoiceId) {
  return client().get("order:" + invoiceId);
}

// Returns true only the FIRST time it is called for an invoice — the caller
// should deliver access only when it gets true. `nx` makes this atomic.
export async function markFulfilled(invoiceId) {
  const res = await client().set("fulfilled:" + invoiceId, 1, { nx: true, ex: MONTH });
  return res === "OK";
}
