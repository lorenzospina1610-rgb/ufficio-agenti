// Chiamata all'IA per far rispondere l'agente di una stanza.
// Chiave e modello arrivano SOLO dalle variabili d'ambiente.
import Anthropic from "@anthropic-ai/sdk";
import type { Stanza } from "./stanze";

export class ErroreAgente extends Error {}

const ISTRUZIONI_BASE =
  "Sei un agente IA che lavora in una stanza dell'ufficio di Lorenzo. " +
  "Lorenzo ti dà ordini e tu li esegui. Rispondi sempre in italiano, " +
  "in modo chiaro e concreto.";

function configurazione() {
  const apiKey = process.env.AGENTS_ANTHROPIC_KEY;
  const modello = process.env.AGENTS_MODEL;
  if (!apiKey) throw new ErroreAgente("Manca la chiave IA (AGENTS_ANTHROPIC_KEY).");
  if (!modello) throw new ErroreAgente("Manca il modello IA (AGENTS_MODEL).");
  return { apiKey, modello };
}

export async function rispostaAgente(stanza: Stanza): Promise<string> {
  const { apiKey, modello } = configurazione();
  const client = new Anthropic({ apiKey });

  const messages: Anthropic.MessageParam[] = stanza.messaggi.map((m) => ({
    role: m.autore === "io" ? "user" : "assistant",
    content: m.testo,
  }));

  const system = stanza.istruzioni.trim()
    ? `${ISTRUZIONI_BASE}\n\nIl tuo ruolo in questa stanza (${stanza.nome}):\n${stanza.istruzioni}`
    : `${ISTRUZIONI_BASE}\n\nLa stanza si chiama: ${stanza.nome}.`;

  let risposta: Anthropic.Message;
  try {
    risposta = await client.messages.create({
      model: modello,
      max_tokens: 16000,
      system,
      messages,
    });
  } catch (errore) {
    if (errore instanceof Anthropic.AuthenticationError) {
      throw new ErroreAgente("La chiave IA non è valida.");
    }
    if (errore instanceof Anthropic.NotFoundError) {
      throw new ErroreAgente(`Il modello "${modello}" non esiste o non è disponibile.`);
    }
    if (errore instanceof Anthropic.RateLimitError) {
      throw new ErroreAgente("Troppe richieste all'IA. Riprova tra poco.");
    }
    if (errore instanceof Anthropic.APIError) {
      throw new ErroreAgente(`L'IA ha risposto con un errore (${errore.status ?? "rete"}).`);
    }
    throw errore;
  }

  if (risposta.stop_reason === "refusal") {
    throw new ErroreAgente("L'agente ha rifiutato questa richiesta.");
  }

  const testo = risposta.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  if (!testo) throw new ErroreAgente("L'agente non ha dato una risposta.");
  if (risposta.stop_reason === "max_tokens") {
    return `${testo}\n\n[Risposta interrotta perché troppo lunga.]`;
  }
  return testo;
}
