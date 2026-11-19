import Link from "next/link";
import { elencoStanze } from "@/lib/stanze";
import { esci } from "./accesso/azioni";
import { nuovaStanza } from "./stanze/azioni";
import { PulsanteInvio } from "./componenti/PulsanteInvio";

export const dynamic = "force-dynamic";

// Testo dell'ultimo messaggio senza i segni del Markdown, su una riga.
function anteprima(testo: string): string {
  return testo
    .replace(/^\s*([-*_])(\s*\1){2,}\s*$/gm, "")
    .replace(/\*\*|__|`/g, "")
    .replace(/(?<![\p{L}\p{N}])\*(?=\S)|(?<=\S)\*(?![\p{L}\p{N}])/gu, "")
    .replace(/^\s*(#{1,6}|[-*•]|\d+[.)])\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

const campo =
  "w-full rounded-lg border border-current/20 bg-transparent px-3 py-2 text-base outline-none focus:border-current/60";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ errore?: string }>;
}) {
  const { errore } = await searchParams;
  const stanze = await elencoStanze();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-4 py-10">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Ufficio Agenti</h1>
        <form action={esci}>
          <button
            type="submit"
            className="rounded-lg border border-current/20 px-3 py-1.5 text-sm hover:border-current/50"
          >
            Esci
          </button>
        </form>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Stanze</h2>
        {stanze.length === 0 ? (
          <p className="opacity-70">Nessuna stanza ancora. Creane una qui sotto.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {stanze.map((s) => {
              const ultimo = s.messaggi.at(-1);
              return (
                <li key={s.id}>
                  <Link
                    href={`/stanze/${s.id}`}
                    className="block rounded-xl border border-current/15 p-4 hover:border-current/40"
                  >
                    <span className="font-medium">{s.nome}</span>
                    <span className="mt-1 block truncate text-sm opacity-70">
                      {ultimo
                        ? `${ultimo.autore === "io" ? "Tu" : "Agente"}: ${anteprima(ultimo.testo)}`
                        : "Nessun ordine ancora"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-current/15 p-4">
        <h2 className="mb-3 font-semibold">Nuova stanza</h2>
        <form action={nuovaStanza} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="nome" className="text-sm font-medium">
              Nome
            </label>
            <input id="nome" name="nome" required maxLength={80} placeholder="Es. Ricerca" className={campo} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="istruzioni" className="text-sm font-medium">
              Ruolo dell&apos;agente <span className="font-normal opacity-60">(facoltativo)</span>
            </label>
            <textarea
              id="istruzioni"
              name="istruzioni"
              rows={3}
              maxLength={4000}
              placeholder="Es. Sei un ricercatore: trovi informazioni e le riassumi in punti."
              className={campo}
            />
          </div>
          {errore === "nome" && (
            <p className="text-sm text-red-600 dark:text-red-400">Dai un nome alla stanza.</p>
          )}
          <div>
            <PulsanteInvio testo="Crea stanza" testoAttesa="Creo…" />
          </div>
        </form>
      </section>
    </main>
  );
}
