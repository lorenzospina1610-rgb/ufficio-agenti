import Link from "next/link";
import { notFound } from "next/navigation";
import { trovaStanza } from "@/lib/stanze";
import { chiudiStanza, daiOrdine, riprova } from "../azioni";
import { PulsanteInvio } from "../../componenti/PulsanteInvio";
import { TestoFormattato } from "../../componenti/TestoFormattato";

export const dynamic = "force-dynamic";

const formatoOra = new Intl.DateTimeFormat("it-IT", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Europe/Rome",
});

export default async function PaginaStanza({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ errore?: string }>;
}) {
  const { id } = await params;
  const { errore } = await searchParams;
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
            <article
              key={i}
              className={`rounded-xl p-3 ${
                m.autore === "io"
                  ? "ml-8 bg-foreground/10"
                  : "mr-8 border border-current/15"
              }`}
            >
              <p className="mb-1 text-xs opacity-60">
                {m.autore === "io" ? "Tu" : "Agente"} · {formatoOra.format(new Date(m.data))}
              </p>
              {m.autore === "agente" ? (
                <TestoFormattato testo={m.testo} />
              ) : (
                <p className="whitespace-pre-wrap break-words">{m.testo}</p>
              )}
            </article>
          ))
        )}
      </section>

      {(errore || inAttesa) && (
        <div
          role="status"
          className="flex flex-col gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm"
        >
          <p>{errore ?? "L'agente non ha ancora risposto all'ultimo ordine."}</p>
          {inAttesa && (
            <form action={riprova.bind(null, stanza.id)}>
              <PulsanteInvio testo="Riprova" testoAttesa="L'agente sta lavorando…" variante="bordo" />
            </form>
          )}
        </div>
      )}

      <form action={daiOrdine.bind(null, stanza.id)} className="flex flex-col gap-2">
        <label htmlFor="ordine" className="text-sm font-medium">
          Il tuo ordine
        </label>
        <textarea
          id="ordine"
          name="ordine"
          required
          rows={3}
          maxLength={20000}
          placeholder="Scrivi cosa deve fare l'agente…"
          className="w-full rounded-lg border border-current/20 bg-transparent px-3 py-2 text-base outline-none focus:border-current/60"
        />
        <div>
          <PulsanteInvio testo="Invia ordine" testoAttesa="L'agente sta lavorando…" />
        </div>
      </form>

      <form action={chiudiStanza.bind(null, stanza.id)} className="mt-6 border-t border-current/10 pt-4">
        <button type="submit" className="text-sm text-red-600 hover:underline dark:text-red-400">
          Elimina stanza
        </button>
      </form>
    </main>
  );
}
