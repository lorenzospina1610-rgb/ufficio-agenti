"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  aggiungiMessaggio,
  creaStanza,
  eliminaStanza,
  trovaStanza,
} from "@/lib/stanze";
import { ErroreAgente, rispostaAgente } from "@/lib/agente";

const MAX_NOME = 80;
const MAX_ISTRUZIONI = 4000;
const MAX_ORDINE = 20000;

export async function nuovaStanza(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim().slice(0, MAX_NOME);
  const istruzioni = String(formData.get("istruzioni") ?? "")
    .trim()
    .slice(0, MAX_ISTRUZIONI);
  if (!nome) redirect("/?errore=nome");

  const stanza = await creaStanza(nome, istruzioni);
  revalidatePath("/");
  redirect(`/stanze/${stanza.id}`);
}

export async function daiOrdine(id: string, formData: FormData) {
  const ordine = String(formData.get("ordine") ?? "").trim().slice(0, MAX_ORDINE);
  if (!ordine) redirect(`/stanze/${id}`);

  const stanza = await aggiungiMessaggio(id, "io", ordine);
  if (!stanza) redirect("/");

  let errore: string | null = null;
  try {
    const risposta = await rispostaAgente(stanza);
    await aggiungiMessaggio(id, "agente", risposta);
  } catch (e) {
    if (!(e instanceof ErroreAgente)) console.error("Errore agente:", e);
    errore = e instanceof ErroreAgente ? e.message : "Errore imprevisto. Riprova.";
  }

  revalidatePath(`/stanze/${id}`);
  redirect(
    errore
      ? `/stanze/${id}?errore=${encodeURIComponent(errore)}`
      : `/stanze/${id}`,
  );
}

export async function riprova(id: string) {
  const stanza = await trovaStanza(id);
  if (!stanza) redirect("/");

  let errore: string | null = null;
  try {
    const risposta = await rispostaAgente(stanza);
    await aggiungiMessaggio(id, "agente", risposta);
  } catch (e) {
    if (!(e instanceof ErroreAgente)) console.error("Errore agente:", e);
    errore = e instanceof ErroreAgente ? e.message : "Errore imprevisto. Riprova.";
  }

  revalidatePath(`/stanze/${id}`);
  redirect(
    errore
      ? `/stanze/${id}?errore=${encodeURIComponent(errore)}`
      : `/stanze/${id}`,
  );
}

export async function chiudiStanza(id: string) {
  await eliminaStanza(id);
  revalidatePath("/");
  redirect("/");
}
