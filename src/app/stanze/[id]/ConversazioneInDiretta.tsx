"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BollaMessaggio } from "../../componenti/BollaMessaggio";
import { PulsanteInvio } from "../../componenti/PulsanteInvio";

type Lavoro = {
  ordine: string | null; // null = "Riprova"
  testo: string;
  inizio: string;
};

const ERRORE_CONNESSIONE =
  "La connessione si è interrotta. Se tra poco la risposta non compare, tocca Riprova.";

// Mostra l'ordine appena inviato e la risposta dell'agente mentre la scrive.
// Quando ha finito, la pagina si ricarica con la conversazione salvata.
export function ConversazioneInDiretta({
  idStanza,
  inAttesa,
}: {
  idStanza: string;
  inAttesa: boolean;
}) {
  const router = useRouter();
  const [lavoro, setLavoro] = useState<Lavoro | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [aggiornamento, startTransition] = useTransition();
  const campo = useRef<HTMLTextAreaElement>(null);
  const bolla = useRef<HTMLDivElement>(null);

  const occupato = lavoro !== null || aggiornamento;

  useEffect(() => {
    if (lavoro?.inizio) bolla.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [lavoro?.inizio]);

  async function lavora(ordine: string | null) {
    setErrore(null);
    setLavoro({ ordine, testo: "", inizio: new Date().toISOString() });
    let erroreFinale: string | null = null;

    try {
      const risposta = await fetch(`/stanze/${idStanza}/risposta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ordine ? { ordine } : {}),
      });
      const tipo = risposta.headers.get("Content-Type") ?? "";

      if (!tipo.includes("json")) {
        // Sessione scaduta: il middleware ci ha mandato alla pagina di accesso.
        window.location.href = "/accesso";
        return;
      }
      if (!risposta.ok || !risposta.body) {
        const dati = (await risposta.json().catch(() => ({}))) as { errore?: string };
        erroreFinale = dati.errore ?? "Errore imprevisto. Riprova.";
        return;
      }

      const lettore = risposta.body.getReader();
      const decodifica = new TextDecoder();
      let resto = "";
      let finito = false;
      for (;;) {
        const { done, value } = await lettore.read();
        if (done) break;
        resto += decodifica.decode(value, { stream: true });
        const righe = resto.split("\n");
        resto = righe.pop() ?? "";
        for (const riga of righe) {
          if (!riga.trim()) continue;
          const evento = JSON.parse(riga) as { testo?: string; fine?: true; errore?: string };
          if (evento.testo) {
            const pezzo = evento.testo;
            setLavoro((l) => (l ? { ...l, testo: l.testo + pezzo } : l));
          }
          if (evento.errore) erroreFinale = evento.errore;
          if (evento.fine || evento.errore) finito = true;
        }
      }
      if (!finito) erroreFinale = ERRORE_CONNESSIONE;
    } catch {
      erroreFinale = ERRORE_CONNESSIONE;
    } finally {
      // Ricarica la conversazione salvata e, nello stesso momento, togli
      // la versione "in diretta": così non si vede niente sparire o doppio.
      startTransition(() => {
        router.refresh();
        setLavoro(null);
        setErrore(erroreFinale);
      });
    }
  }

  function inviaOrdine(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const ordine = campo.current?.value.trim() ?? "";
    if (!ordine || occupato) return;
    if (campo.current) campo.current.value = "";
    void lavora(ordine);
  }

  return (
    <>
      {lavoro && (
        <section className="flex flex-col gap-3" aria-live="polite">
          {lavoro.ordine && <BollaMessaggio autore="io" testo={lavoro.ordine} data={lavoro.inizio} />}
          <div ref={bolla}>
            <BollaMessaggio autore="agente" testo={lavoro.testo} data={lavoro.inizio} inScrittura />
          </div>
        </section>
      )}

      {!occupato && (errore || inAttesa) && (
        <div
          role="status"
          className="flex flex-col gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm"
        >
          <p>{errore ?? "L'agente non ha ancora risposto all'ultimo ordine."}</p>
          {inAttesa && (
            <div>
              <button
                type="button"
                onClick={() => void lavora(null)}
                className="rounded-lg border border-current/20 px-3 py-2 font-medium hover:border-current/50"
              >
                Riprova
              </button>
            </div>
          )}
        </div>
      )}

      <form onSubmit={inviaOrdine} className="flex flex-col gap-2">
        <label htmlFor="ordine" className="text-sm font-medium">
          Il tuo ordine
        </label>
        <textarea
          ref={campo}
          id="ordine"
          name="ordine"
          required
          rows={3}
          maxLength={20000}
          placeholder="Scrivi cosa deve fare l'agente…"
          className="w-full rounded-lg border border-current/20 bg-transparent px-3 py-2 text-base outline-none focus:border-current/60"
        />
        <div>
          <PulsanteInvio testo="Invia ordine" testoAttesa="L'agente sta scrivendo…" occupato={occupato} />
        </div>
      </form>
    </>
  );
}
