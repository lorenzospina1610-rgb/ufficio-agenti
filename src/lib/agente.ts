// Chiamata all'IA per far rispondere l'agente di una stanza.
// Chiave e modello arrivano SOLO dalle variabili d'ambiente.
import Anthropic from "@anthropic-ai/sdk";
import type { Stanza } from "./stanze";

export class ErroreAgente extends Error {}

const ISTRUZIONI_BASE =
  "Sei un agente IA che lavora in una stanza dell'ufficio di Lorenzo. " +
  "Lorenzo ti dà ordini e tu li esegui. Rispondi sempre in italiano, " +
  "in modo chiaro e concreto.";

// Online, Netlify interrompe ogni richiesta dopo 60 secondi, anche quando la
// risposta arriva a pezzi. A 45 secondi fermiamo l'IA e salviamo la parte già
// scritta, lasciando il tempo di salvarla.
const LIMITE_SCRITTURA_MS = 45_000;

const NOTA_TEMPO =
  '[Risposta interrotta per il limite di tempo. Scrivi "continua" per il resto.]';
const NOTA_LUNGHEZZA = "[Risposta interrotta perché troppo lunga.]";
const NOTA_ERRORE =
  '[Risposta interrotta per un errore dell\'IA. Scrivi "continua" per il resto.]';

function configurazione() {
  const apiKey = process.env.AGENTS_ANTHROPIC_KEY;
  const modello = process.env.AGENTS_MODEL;
  if (!apiKey) throw new ErroreAgente("Manca la chiave IA (AGENTS_ANTHROPIC_KEY).");
  if (!modello) throw new ErroreAgente("Manca il modello IA (AGENTS_MODEL).");
  return { apiKey, modello };
}

function traduciErrore(errore: unknown, modello: string): ErroreAgente | null {
  if (errore instanceof Anthropic.APIUserAbortError) {
    return new ErroreAgente(
      "L'agente ci ha messo troppo a rispondere. Prova a chiedere qualcosa di più breve, oppure riprova.",
    );
  }
  if (errore instanceof Anthropic.APIConnectionTimeoutError) {
    return new ErroreAgente("L'IA non ha risposto in tempo. Riprova.");
  }
  if (errore instanceof Anthropic.AuthenticationError) {
    return new ErroreAgente("La chiave IA non è valida.");
  }
  if (errore instanceof Anthropic.NotFoundError) {
    return new ErroreAgente(`Il modello "${modello}" non esiste o non è disponibile.`);
  }
  if (errore instanceof Anthropic.RateLimitError) {
    return new ErroreAgente("Troppe richieste all'IA. Riprova tra poco.");
  }
  if (errore instanceof Anthropic.APIError) {
    return new ErroreAgente(`L'IA ha risposto con un errore (${errore.status ?? "rete"}).`);
  }
  return null;
}

/**
 * Fa rispondere l'agente "parola per parola": `suTesto` riceve ogni pezzo
 * appena arriva. Restituisce il testo completo da salvare (con una nota in
 * fondo se la risposta è stata interrotta). Se l'agente non ha scritto niente
 * lancia un `ErroreAgente` con un messaggio in italiano.
 */
export async function rispostaAgenteInDiretta(
  stanza: Stanza,
  suTesto: (pezzo: string) => void,
): Promise<string> {
  const { apiKey, modello } = configurazione();
  // Indirizzo fisso di Anthropic: su Netlify la variabile ANTHROPIC_BASE_URL
  // manderebbe le richieste al suo "AI Gateway", che rifiuta la nostra chiave.
  // Niente tentativi automatici, che sforerebbero il limite di tempo.
  const client = new Anthropic({
    apiKey,
    baseURL: "https://api.anthropic.com",
    timeout: 50_000,
    maxRetries: 0,
  });

  const messages: Anthropic.MessageParam[] = stanza.messaggi.map((m) => ({
    role: m.autore === "io" ? "user" : "assistant",
    content: m.testo,
  }));

  const system = stanza.istruzioni.trim()
    ? `${ISTRUZIONI_BASE}\n\nIl tuo ruolo in questa stanza (${stanza.nome}):\n${stanza.istruzioni}`
    : `${ISTRUZIONI_BASE}\n\nLa stanza si chiama: ${stanza.nome}.`;

  const fermo = new AbortController();
  const timer = setTimeout(() => fermo.abort(), LIMITE_SCRITTURA_MS);

  let testo = "";
  let motivoFine: string | null = null;
  let nota: string | null = null;

  try {
    const stream = client.messages.stream(
      { model: modello, max_tokens: 8000, system, messages },
      { signal: fermo.signal },
    );
    for await (const evento of stream) {
      if (evento.type === "content_block_delta" && evento.delta.type === "text_delta") {
        testo += evento.delta.text;
        suTesto(evento.delta.text);
      } else if (evento.type === "message_delta") {
        motivoFine = evento.delta.stop_reason;
      }
    }
  } catch (errore) {
    const tradotto = traduciErrore(errore, modello);
    if (!tradotto) throw errore;
    // Se l'agente aveva già scritto qualcosa, lo teniamo con una nota.
    if (!testo.trim()) throw tradotto;
    nota = errore instanceof Anthropic.APIUserAbortError ? NOTA_TEMPO : NOTA_ERRORE;
  } finally {
    clearTimeout(timer);
  }

  if (motivoFine === "refusal") {
    throw new ErroreAgente("L'agente ha rifiutato questa richiesta.");
  }
  if (!testo.trim()) throw new ErroreAgente("L'agente non ha dato una risposta.");
  if (!nota && motivoFine === "max_tokens") nota = NOTA_LUNGHEZZA;

  if (nota) {
    const coda = `\n\n${nota}`;
    suTesto(coda);
    return testo.trim() + coda;
  }
  return testo.trim();
}
