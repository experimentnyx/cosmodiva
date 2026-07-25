// Transactional email via Resend. Sends buyers their access after payment, and
// notifies the owner of each sale. Web3Forms (used by the contact form) only
// delivers to one fixed inbox, so it cannot email arbitrary buyers — hence Resend.
import { Resend } from "resend";

let resend = null;
function client() {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

const FROM = process.env.MAIL_FROM || "Anastasiia <onboarding@resend.dev>";
const OWNER = process.env.OWNER_EMAIL || "";

function esc(s) {
  return String(s || "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

// `deliverables` may hold URLs; turn bare links into anchors, keep line breaks.
function renderAccess(text) {
  return esc(text)
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>')
    .replace(/\n/g, "<br>");
}

export async function sendAccessEmail({ to, name, plan }) {
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#111">
      <h2 style="margin:0 0 12px">Дякую за покупку, ${esc(name)}!</h2>
      <p style="margin:0 0 8px">Ваш доступ до «<strong>${esc(plan.label)}</strong>»:</p>
      <div style="padding:16px;background:#f5f5f7;border-radius:12px;line-height:1.6">
        ${renderAccess(plan.deliverables) || "Найближчим часом я надішлю деталі доступу вручну."}
      </div>
      <p style="margin:16px 0 0;color:#666;font-size:13px">
        Якщо виникли питання — просто дайте відповідь на цей лист.
      </p>
    </div>`;
  return client().emails.send({
    from: FROM,
    to,
    subject: "Ваш доступ — " + plan.label,
    html,
  });
}

export async function notifyOwner({ order, plan, invoiceId }) {
  if (!OWNER) return;
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif">
      <h3>Нова оплата: ${esc(plan.label)}</h3>
      <p>
        Ім'я: ${esc(order.name)}<br>
        Email: ${esc(order.email)}<br>
        Telegram: ${esc(order.telegram) || "—"}<br>
        Invoice: ${esc(invoiceId)}
      </p>
    </div>`;
  return client().emails.send({
    from: FROM,
    to: OWNER,
    subject: "Нова оплата — " + plan.label,
    html,
  });
}
