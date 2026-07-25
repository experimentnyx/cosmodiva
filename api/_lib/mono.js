// Monobank "plata by mono" acquiring client.
// Docs: https://api.monobank.ua/docs/acquiring.html
import crypto from "node:crypto";

const API = "https://api.monobank.ua";

function token() {
  const t = process.env.MONO_TOKEN;
  if (!t) throw new Error("MONO_TOKEN is not configured");
  return t;
}

// Create a hosted-checkout invoice. Returns { invoiceId, pageUrl }.
export async function createInvoice({ amount, reference, destination, redirectUrl, webHookUrl }) {
  const res = await fetch(API + "/api/merchant/invoice/create", {
    method: "POST",
    headers: { "X-Token": token(), "Content-Type": "application/json" },
    body: JSON.stringify({
      amount, // kopiykas
      ccy: 980, // UAH
      merchantPaymInfo: { reference, destination },
      redirectUrl,
      webHookUrl,
      validity: 3600, // invoice stays payable for 1 hour
    }),
  });
  if (!res.ok) {
    throw new Error("monobank invoice/create failed: " + res.status + " " + (await res.text()));
  }
  return res.json();
}

// Monobank signs each webhook body with its private key; we verify with the
// matching public key so a forged "success" POST cannot trigger free access.
let cachedKey = null;
async function publicKey() {
  if (cachedKey) return cachedKey;
  const res = await fetch(API + "/api/merchant/pubkey", { headers: { "X-Token": token() } });
  if (!res.ok) throw new Error("monobank pubkey failed: " + res.status);
  const data = await res.json();
  cachedKey = data.key; // base64-encoded public key
  return cachedKey;
}

export async function verifyWebhook(xSign, rawBody) {
  if (!xSign) return false;
  const keyBase64 = await publicKey();
  const pub = crypto.createPublicKey(Buffer.from(keyBase64, "base64").toString("utf8"));
  const verify = crypto.createVerify("SHA256");
  verify.update(rawBody);
  verify.end();
  return verify.verify(pub, Buffer.from(xSign, "base64"));
}
