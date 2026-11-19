// Gestione dell'accesso con APP_PASSWORD.
// Usa solo Web Crypto, così funziona sia nel middleware (edge) sia sul server.

export const COOKIE_SESSIONE = "ufficio_sessione";
export const DURATA_SESSIONE_SECONDI = 60 * 60 * 24 * 30; // 30 giorni

const encoder = new TextEncoder();

async function hmac(chiave: string, messaggio: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(chiave),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const firma = await crypto.subtle.sign("HMAC", key, encoder.encode(messaggio));
  return Array.from(new Uint8Array(firma))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Confronto a tempo costante, per non rivelare informazioni con i tempi di risposta.
function uguali(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function passwordConfigurata(): string | null {
  const password = process.env.APP_PASSWORD;
  return password && password.length > 0 ? password : null;
}

export function accessoConfigurato(): boolean {
  return passwordConfigurata() !== null;
}

// Il valore del cookie dipende dalla password: se la password cambia,
// tutte le sessioni esistenti smettono di valere.
async function tokenAtteso(): Promise<string | null> {
  const password = passwordConfigurata();
  if (!password) return null;
  return hmac(password, "ufficio-agenti:sessione:v1");
}

export async function creaToken(): Promise<string | null> {
  return tokenAtteso();
}

export async function passwordCorretta(tentativo: string): Promise<boolean> {
  const password = passwordConfigurata();
  if (!password) return false;
  // Confronta le firme (stessa lunghezza) invece delle password in chiaro.
  const [a, b] = await Promise.all([
    hmac("confronto", tentativo),
    hmac("confronto", password),
  ]);
  return uguali(a, b);
}

export async function tokenValido(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const atteso = await tokenAtteso();
  if (!atteso) return false;
  return uguali(token, atteso);
}
