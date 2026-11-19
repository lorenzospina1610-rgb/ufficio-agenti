// Archivio delle stanze. Solo lato server.
// - Online su Netlify: Netlify Blobs, una voce per stanza (chiave = id).
// - Sul tuo computer: il file data/stanze.json.
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { getStore } from "@netlify/blobs";

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

type Archivio = {
  tutte(): Promise<Stanza[]>;
  una(id: string): Promise<Stanza | null>;
  salva(stanza: Stanza): Promise<void>;
  elimina(id: string): Promise<void>;
};

// --- Netlify Blobs --------------------------------------------------------

function archivioNetlify(): Archivio | null {
  let store: ReturnType<typeof getStore>;
  try {
    // Lettura "strong": dopo una modifica si vede subito il dato aggiornato.
    store = getStore({ name: "stanze", consistency: "strong" });
  } catch {
    return null; // non siamo su Netlify
  }
  return {
    async tutte() {
      const { blobs } = await store.list();
      const stanze = await Promise.all(
        blobs.map((b) => store.get(b.key, { type: "json" }) as Promise<Stanza | null>),
      );
      return stanze.filter((s): s is Stanza => s !== null);
    },
    async una(id) {
      return (await store.get(id, { type: "json" })) as Stanza | null;
    },
    async salva(stanza) {
      await store.setJSON(stanza.id, stanza);
    },
    async elimina(id) {
      await store.delete(id);
    },
  };
}

// --- File locale ----------------------------------------------------------

const CARTELLA = path.join(process.cwd(), "data");
const FILE = path.join(CARTELLA, "stanze.json");

async function leggiFile(): Promise<Stanza[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as Stanza[];
  } catch (errore) {
    if ((errore as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw errore;
  }
}

async function scriviFile(stanze: Stanza[]): Promise<void> {
  await fs.mkdir(CARTELLA, { recursive: true });
  // Scrive su un file temporaneo e poi lo rinomina, così il file non resta mai a metà.
  const temporaneo = `${FILE}.${randomUUID()}.tmp`;
  await fs.writeFile(temporaneo, JSON.stringify(stanze, null, 2), "utf8");
  await fs.rename(temporaneo, FILE);
}

const archivioFile: Archivio = {
  tutte: leggiFile,
  async una(id) {
    return (await leggiFile()).find((s) => s.id === id) ?? null;
  },
  async salva(stanza) {
    const stanze = await leggiFile();
    const i = stanze.findIndex((s) => s.id === stanza.id);
    if (i === -1) stanze.push(stanza);
    else stanze[i] = stanza;
    await scriviFile(stanze);
  },
  async elimina(id) {
    await scriviFile((await leggiFile()).filter((s) => s.id !== id));
  },
};

function archivio(): Archivio {
  return archivioNetlify() ?? archivioFile;
}

// --- Funzioni usate dall'app ------------------------------------------------

export async function elencoStanze(): Promise<Stanza[]> {
  const stanze = await archivio().tutte();
  return stanze.sort((a, b) => b.creata.localeCompare(a.creata));
}

export async function trovaStanza(id: string): Promise<Stanza | null> {
  return archivio().una(id);
}

export async function creaStanza(nome: string, istruzioni: string): Promise<Stanza> {
  const stanza: Stanza = {
    id: randomUUID(),
    nome,
    istruzioni,
    creata: new Date().toISOString(),
    messaggi: [],
  };
  await archivio().salva(stanza);
  return stanza;
}

export async function aggiungiMessaggio(
  id: string,
  autore: Messaggio["autore"],
  testo: string,
): Promise<Stanza | null> {
  const a = archivio();
  const stanza = await a.una(id);
  if (!stanza) return null;
  stanza.messaggi.push({ autore, testo, data: new Date().toISOString() });
  await a.salva(stanza);
  return stanza;
}

export async function eliminaStanza(id: string): Promise<void> {
  await archivio().elimina(id);
}
