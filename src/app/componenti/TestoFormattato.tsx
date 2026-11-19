import type { ReactNode } from "react";

// Mostra il Markdown semplice che scrivono gli agenti: titoli, grassetto,
// corsivo, codice, elenchi puntati e numerati, paragrafi.
// Crea solo elementi React (niente HTML inserito), quindi è sicuro.

type Blocco =
  | { tipo: "titolo"; livello: number; testo: string }
  | { tipo: "puntato"; voci: string[] }
  | { tipo: "numerato"; inizio: number; voci: string[] }
  | { tipo: "codice"; righe: string[] }
  | { tipo: "paragrafo"; righe: string[] };

const RE_TITOLO = /^(#{1,6})\s+(.*)$/;
const RE_PUNTATO = /^\s*[-*•]\s+(.*)$/;
const RE_NUMERATO = /^\s*(\d+)[.)]\s+(.*)$/;
const RE_SEPARATORE = /^\s*([-*_])(\s*\1){2,}\s*$/;

function dividiInBlocchi(testo: string): Blocco[] {
  const righe = testo.replace(/\r\n/g, "\n").split("\n");
  const blocchi: Blocco[] = [];
  let i = 0;

  while (i < righe.length) {
    const riga = righe[i];

    if (riga.trim() === "" || RE_SEPARATORE.test(riga)) {
      i++;
      continue;
    }

    if (riga.trim().startsWith("```")) {
      const codice: string[] = [];
      i++;
      while (i < righe.length && !righe[i].trim().startsWith("```")) codice.push(righe[i++]);
      i++; // salta la chiusura
      blocchi.push({ tipo: "codice", righe: codice });
      continue;
    }

    const titolo = riga.match(RE_TITOLO);
    if (titolo) {
      blocchi.push({ tipo: "titolo", livello: titolo[1].length, testo: titolo[2] });
      i++;
      continue;
    }

    if (RE_PUNTATO.test(riga) || RE_NUMERATO.test(riga)) {
      const numerato = RE_NUMERATO.test(riga);
      const re = numerato ? RE_NUMERATO : RE_PUNTATO;
      const inizio = numerato ? Number(riga.match(RE_NUMERATO)![1]) : 1;
      const voci: string[] = [];
      // Le voci possono essere separate da righe vuote e continuare su più righe.
      while (i < righe.length) {
        const r = righe[i];
        const m = r.match(re);
        if (m) {
          voci.push(numerato ? m[2] : m[1]);
          i++;
        } else if (r.trim() === "") {
          let j = i;
          while (j < righe.length && righe[j].trim() === "") j++;
          if (j < righe.length && re.test(righe[j])) i = j;
          else break;
        } else if (/^\s+\S/.test(r) || !(RE_TITOLO.test(r) || r.trim().startsWith("```") || RE_PUNTATO.test(r) || RE_NUMERATO.test(r))) {
          voci[voci.length - 1] += "\n" + r.trim();
          i++;
        } else break;
      }
      blocchi.push(numerato ? { tipo: "numerato", inizio, voci } : { tipo: "puntato", voci });
      continue;
    }

    const paragrafo: string[] = [];
    while (
      i < righe.length &&
      righe[i].trim() !== "" &&
      !RE_TITOLO.test(righe[i]) &&
      !RE_PUNTATO.test(righe[i]) &&
      !RE_NUMERATO.test(righe[i]) &&
      !righe[i].trim().startsWith("```")
    ) {
      paragrafo.push(righe[i++]);
    }
    blocchi.push({ tipo: "paragrafo", righe: paragrafo });
  }
  return blocchi;
}

// Grassetto (**testo** o __testo__), corsivo (*testo* o _testo_), codice (`testo`).
const RE_IN_LINEA = /(`[^`\n]+`|\*\*[^*\n]+?\*\*|__[^_\n]+?__|(?<![\p{L}\p{N}*])\*[^*\s][^*\n]*?\*(?![\p{L}\p{N}*])|(?<![\p{L}\p{N}])_[^_\s][^_\n]*?_(?![\p{L}\p{N}]))/gu;

function inLinea(testo: string, chiave: string): ReactNode[] {
  const pezzi: ReactNode[] = [];
  let ultimo = 0;
  let n = 0;
  for (const m of testo.matchAll(RE_IN_LINEA)) {
    const t = m[0];
    const pos = m.index ?? 0;
    if (pos > ultimo) pezzi.push(testo.slice(ultimo, pos));
    const k = `${chiave}-${n++}`;
    if (t.startsWith("`")) {
      pezzi.push(
        <code key={k} className="rounded bg-foreground/10 px-1 py-0.5 font-mono text-[0.9em]">
          {t.slice(1, -1)}
        </code>,
      );
    } else if (t.startsWith("**") || t.startsWith("__")) {
      pezzi.push(<strong key={k}>{inLinea(t.slice(2, -2), k)}</strong>);
    } else {
      pezzi.push(<em key={k}>{inLinea(t.slice(1, -1), k)}</em>);
    }
    ultimo = pos + t.length;
  }
  if (ultimo < testo.length) pezzi.push(testo.slice(ultimo));
  return pezzi;
}

// Righe a capo dentro un paragrafo o una voce restano a capo.
function conAcapo(testo: string, chiave: string): ReactNode[] {
  return testo.split("\n").flatMap((riga, i) =>
    i === 0 ? inLinea(riga, `${chiave}-${i}`) : [<br key={`${chiave}-br${i}`} />, ...inLinea(riga, `${chiave}-${i}`)],
  );
}

const stileTitolo: Record<number, string> = {
  1: "text-xl font-bold",
  2: "text-lg font-bold",
  3: "font-semibold",
};

export function TestoFormattato({ testo }: { testo: string }) {
  const blocchi = dividiInBlocchi(testo);
  return (
    <div className="flex flex-col gap-3 break-words">
      {blocchi.map((b, i) => {
        const k = String(i);
        switch (b.tipo) {
          case "titolo":
            return (
              <p key={k} className={stileTitolo[b.livello] ?? "font-semibold"}>
                {inLinea(b.testo, k)}
              </p>
            );
          case "puntato":
            return (
              <ul key={k} className="flex list-disc flex-col gap-1 pl-5">
                {b.voci.map((v, j) => (
                  <li key={j}>{conAcapo(v, `${k}-${j}`)}</li>
                ))}
              </ul>
            );
          case "numerato":
            return (
              <ol key={k} start={b.inizio} className="flex list-decimal flex-col gap-2 pl-5">
                {b.voci.map((v, j) => (
                  <li key={j}>{conAcapo(v, `${k}-${j}`)}</li>
                ))}
              </ol>
            );
          case "codice":
            return (
              <pre key={k} className="overflow-x-auto rounded-lg bg-foreground/10 p-3 font-mono text-sm">
                {b.righe.join("\n")}
              </pre>
            );
          case "paragrafo":
            return <p key={k}>{conAcapo(b.righe.join("\n"), k)}</p>;
        }
      })}
    </div>
  );
}
