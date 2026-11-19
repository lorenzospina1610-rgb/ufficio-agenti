"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  COOKIE_SESSIONE,
  DURATA_SESSIONE_SECONDI,
  creaToken,
  passwordCorretta,
} from "@/lib/auth";

export async function entra(formData: FormData) {
  const tentativo = String(formData.get("password") ?? "");

  if (!(await passwordCorretta(tentativo))) {
    redirect("/accesso?errore=1");
  }

  const token = await creaToken();
  if (!token) redirect("/accesso");

  const archivio = await cookies();
  archivio.set(COOKIE_SESSIONE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURATA_SESSIONE_SECONDI,
  });
  redirect("/");
}

export async function esci() {
  const archivio = await cookies();
  archivio.delete(COOKIE_SESSIONE);
  redirect("/accesso");
}
