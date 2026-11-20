// Fa rispondere l'agente "parola per parola".
// POST con { ordine: "..." } per un nuovo ordine, oppure senza ordine per
// riprovare a rispondere all'ultimo ordine rimasto senza risposta.
// La risposta è una riga JSON per ogni evento:
//   {"testo":"..."}   un pezzo di risposta
//   {"fine":true}     risposta completa e salvata
//   {"errore":"..."}  qualcosa non è andato (l'ordine resta salvato)
// La pagina è protetta dal middleware come tutte le altre.
import { revalidatePath } from "next/cache";
import { aggiungiMessaggio, trovaStanza } from "@/lib/stanze";
import { ErroreAgente, rispostaAgenteInDiretta } from "@/lib/agente";

export const dynamic = "force-dynamic";

const MAX_ORDINE = 20000;

function errore(messaggio: string, status: number) {
  return Response.json({ errore: messaggio }, { status });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let corpo: { ordine?: unknown } = {};
  try {
    corpo = await request.json();
  } catch {
    // corpo vuoto: è un "Riprova"
  }
  const ordine =
    typeof corpo.ordine === "string" ? corpo.ordine.trim().slice(0, MAX_ORDINE) : "";

  let stanza = await trovaStanza(id);
  if (!stanza) return errore("Questa stanza non esiste più.", 404);

  if (ordine) {
    stanza = await aggiungiMessaggio(id, "io", ordine);
    if (!stanza) return errore("Questa stanza non esiste più.", 404);
  } else if (stanza.messaggi.at(-1)?.autore !== "io") {
    return errore("Non c'è nessun ordine in attesa di risposta.", 400);
  }
  const stanzaPronta = stanza;

  const codifica = new TextEncoder();
  const corpoRisposta = new ReadableStream<Uint8Array>({
    async start(controller) {
      // Se la pagina viene chiusa a metà, l'agente finisce lo stesso e la
      // risposta viene salvata: smettiamo solo di spedirla.
      let aperta = true;
      const invia = (dati: object) => {
        if (!aperta) return;
        try {
          controller.enqueue(codifica.encode(JSON.stringify(dati) + "\n"));
        } catch {
          aperta = false;
        }
      };
      try {
        const testo = await rispostaAgenteInDiretta(stanzaPronta, (pezzo) =>
          invia({ testo: pezzo }),
        );
        await aggiungiMessaggio(id, "agente", testo);
        invia({ fine: true });
      } catch (e) {
        if (!(e instanceof ErroreAgente)) console.error("Errore agente:", e);
        invia({
          errore: e instanceof ErroreAgente ? e.message : "Errore imprevisto. Riprova.",
        });
      } finally {
        revalidatePath(`/stanze/${id}`);
        revalidatePath("/");
        try {
          controller.close();
        } catch {
          // già chiusa dalla pagina
        }
      }
    },
  });

  return new Response(corpoRisposta, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
