// Authoritative product catalog — the ONLY source of truth for what a plan costs.
// The browser sends a plan id; the price is resolved here, server-side, so a
// tampered checkout payload can never change the amount that is charged.
//
// `amount` is in kopiykas (1 UAH = 100). `deliverables` is the access content
// emailed to the buyer after a successful payment; it is read from an env var so
// the actual course links / PDF URL / Telegram invite never live in the repo.
export const CATALOG = {
  "bodyweight-mfr": {
    label: "Тренування з власною вагою + МФР",
    amount: 210000,
    recurring: false,
    deliverables: process.env.DELIVER_BODYWEIGHT_MFR || "",
  },
  "individual": {
    label: "Індивідуальний онлайн-супровід",
    amount: 500000,
    recurring: false,
    deliverables: process.env.DELIVER_INDIVIDUAL || "",
  },
  "meal-plan": {
    label: "Раціон харчування на місяць",
    amount: 150000,
    recurring: false,
    deliverables: process.env.DELIVER_MEAL_PLAN || "",
  },
  "telegram": {
    // Launch scope: a one-off monthly payment. Auto-renewing subscriptions
    // (card tokenisation + a monthly charge) are a deliberate phase-2 item.
    label: "Доступ до Telegram-каналу",
    amount: 59900,
    recurring: false,
    deliverables: process.env.DELIVER_TELEGRAM || "",
  },
};

export function getPlan(id) {
  return Object.prototype.hasOwnProperty.call(CATALOG, id) ? CATALOG[id] : null;
}
