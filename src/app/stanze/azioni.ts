"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { creaStanza, eliminaStanza } from "@/lib/stanze";

const MAX_NOME = 80;
const MAX_ISTRUZIONI = 4000;

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

export async function chiudiStanza(id: string) {
  await eliminaStanza(id);
  revalidatePath("/");
  redirect("/");
}
