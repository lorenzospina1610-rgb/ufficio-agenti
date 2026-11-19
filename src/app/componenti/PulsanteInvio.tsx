"use client";

import { useFormStatus } from "react-dom";

// Pulsante che si disattiva e cambia testo mentre il modulo viene inviato.
export function PulsanteInvio({
  testo,
  testoAttesa,
  variante = "pieno",
}: {
  testo: string;
  testoAttesa: string;
  variante?: "pieno" | "bordo";
}) {
  const { pending } = useFormStatus();
  const stile =
    variante === "pieno"
      ? "bg-foreground text-background hover:opacity-90"
      : "border border-current/20 hover:border-current/50";
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-lg px-3 py-2 font-medium disabled:opacity-50 ${stile}`}
    >
      {pending ? testoAttesa : testo}
    </button>
  );
}
