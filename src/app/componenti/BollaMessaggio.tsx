import { TestoFormattato } from "./TestoFormattato";

const formatoOra = new Intl.DateTimeFormat("it-IT", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Europe/Rome",
});

// Un messaggio della conversazione: un ordine ("io") o una risposta ("agente").
export function BollaMessaggio({
  autore,
  testo,
  data,
  inScrittura = false,
}: {
  autore: "io" | "agente";
  testo: string;
  data: string; // ISO
  inScrittura?: boolean;
}) {
  return (
    <article
      className={`rounded-xl p-3 ${
        autore === "io" ? "ml-8 bg-foreground/10" : "mr-8 border border-current/15"
      }`}
    >
      <p className="mb-1 text-xs opacity-60">
        {autore === "io" ? "Tu" : "Agente"} ·{" "}
        {inScrittura ? "sta scrivendo…" : formatoOra.format(new Date(data))}
      </p>
      {autore === "agente" ? (
        testo ? (
          <TestoFormattato testo={testo} />
        ) : (
          <p className="opacity-60">L&apos;agente sta pensando…</p>
        )
      ) : (
        <p className="whitespace-pre-wrap break-words">{testo}</p>
      )}
    </article>
  );
}
