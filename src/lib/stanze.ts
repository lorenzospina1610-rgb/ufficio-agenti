// Archivio delle stanze: un semplice file JSON in data/stanze.json.
// Solo lato server.
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export type Messaggio = {
  autore: "io" | "agente";
  testo: string;
  data: string; // ISO
};

export type Stanza = {
  id: string;
  nome: string;
  istruzioni: string; // chi è l'agente e come deve lavorare
  creata: string; // ISO
  messaggi: Messaggio[];
};

const CARTELLA = path.join(process.cwd(), "data");
const FILE = path.join(CARTELLA, "stanze.json");

async function leggiTutte(): Promise<Stanza[]> {
  try {
    const testo = await fs.readFile(FILE, "utf8");
    return JSON.parse(testo) as Stanza[];
  } catch (errore) {
    if ((errore as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw errore;
  }
}

async function salvaTutte(stanze: Stanza[]): Promise<void> {
  await fs.mkdir(CARTELLA, { recursive: true });
  // Scrive su un file temporaneo e poi lo rinomina, così il file non resta mai a metà.
  const temporaneo = `${FILE}.${randomUUID()}.tmp`;
  await fs.writeFile(temporaneo, JSON.stringify(stanze, null, 2), "utf8");
  await fs.rename(temporaneo, FILE);
}

export async function elencoStanze(): Promise<Stanza[]> {
  const stanze = await leggiTutte();
  return stanze.sort((a, b) => b.creata.localeCompare(a.creata));
}

export async function trovaStanza(id: string): Promise<Stanza | null> {
  const stanze = await leggiTutte();
  return stanze.find((s) => s.id === id) ?? null;
}

export async function creaStanza(nome: string, istruzioni: string): Promise<Stanza> {
  const stanze = await leggiTutte();
  const stanza: Stanza = {
    id: randomUUID(),
    nome,
    istruzioni,
    creata: new Date().toISOString(),
    messaggi: [],
  };
  stanze.push(stanza);
  await salvaTutte(stanze);
  return stanza;
}

export async function aggiungiMessaggio(
  id: string,
  autore: Messaggio["autore"],
  testo: string,
): Promise<Stanza | null> {
  const stanze = await leggiTutte();
  const stanza = stanze.find((s) => s.id === id);
  if (!stanza) return null;
  stanza.messaggi.push({ autore, testo, data: new Date().toISOString() });
  await salvaTutte(stanze);
  return stanza;
}

export async function eliminaStanza(id: string): Promise<void> {
  const stanze = await leggiTutte();
  await salvaTutte(stanze.filter((s) => s.id !== id));
}
