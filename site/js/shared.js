// ============================================================
// Dati condivisi tra sito pubblico e pannello admin
// ============================================================

const CATEGORIES = [
  { key: "casa",           label: "Casa",             icon: "assets/icons/casa.png" },
  { key: "spettacolo",     label: "Spettacolo",       icon: "assets/icons/spettacolo.png" },
  { key: "libri",          label: "Libri",            icon: "assets/icons/libri.png" },
  { key: "vestiti",        label: "Vestiti",          icon: "assets/icons/vestiti.png" },
  { key: "giochi",         label: "Giochi",           icon: "assets/icons/giochi.png" },
  { key: "moda-accessori", label: "Moda & Accessori", icon: "assets/icons/moda-accessori.png" },
  { key: "altro",          label: "Altro",            icon: "assets/icons/altro.png" },
];

const PRICE_RANGES = [
  { key: "regalini",    label: "Regalini" },
  { key: "costosetti",  label: "Costosetti" },
  { key: "impegnativi", label: "Impegnativi" },
];

function categoryByKey(key) {
  return CATEGORIES.find((c) => c.key === key);
}
function priceLabel(key) {
  const p = PRICE_RANGES.find((p) => p.key === key);
  return p ? p.label : key;
}

function getSupabaseClient() {
  if (!window.SUPABASE_URL || window.SUPABASE_URL.startsWith("INSERISCI")) {
    console.warn("Configura js/config.js con le chiavi del tuo progetto Supabase.");
  }
  return window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
}

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function todayISO() {
  const d = new Date();
  const tz = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tz * 60000);
  return local.toISOString().slice(0, 10);
}
