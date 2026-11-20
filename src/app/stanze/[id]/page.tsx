import Link from "next/link";
import { notFound } from "next/navigation";
import { trovaStanza } from "@/lib/stanze";
import { chiudiStanza } from "../azioni";
import { BollaMessaggio } from "../../componenti/BollaMessaggio";
import { ConversazioneInDiretta } from "./ConversazioneInDiretta";

export const dynamic = "force-dynamic";

export default async function PaginaStanza({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const stanza = await trovaStanza(id);
  if (!stanza) notFound();

  const inAttesa = stanza.messaggi.at(-1)?.autore === "io";

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2">
        <Link href="/" className="text-sm opacity-70 hover:opacity-100">
          ← Tutte le stanze
        </Link>
        <h1 className="text-3xl font-bold break-words">{stanza.nome}</h1>
        {stanza.istruzioni && (
          <p className="text-sm whitespace-pre-wrap opacity-70">{stanza.istruzioni}</p>
        )}
      </header>

      <section className="flex flex-col gap-3">
        {stanza.messaggi.length === 0 ? (
          <p className="opacity-70">Nessun ordine ancora. Scrivi il primo qui sotto.</p>
        ) : (
          stanza.messaggi.map((m, i) => (
            <BollaMessaggio key={i} autore={m.autore} testo={m.testo} data={m.data} />
          ))
        )}
      </section>

      <ConversazioneInDiretta idStanza={stanza.id} inAttesa={inAttesa} />

      <form action={chiudiStanza.bind(null, stanza.id)} className="mt-6 border-t border-current/10 pt-4">
        <button type="submit" className="text-sm text-red-600 hover:underline dark:text-red-400">
          Elimina stanza
        </button>
      </form>
    </main>
  );
}
