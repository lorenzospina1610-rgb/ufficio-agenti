import type { Metadata } from "next";
import { accessoConfigurato } from "@/lib/auth";
import { entra } from "./azioni";

export const metadata: Metadata = { title: "Accesso · Ufficio Agenti" };
export const dynamic = "force-dynamic";

export default async function Accesso({
  searchParams,
}: {
  searchParams: Promise<{ errore?: string }>;
}) {
  const { errore } = await searchParams;
  const configurato = accessoConfigurato();

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4 py-12">
      <div>
        <h1 className="text-3xl font-bold">Ufficio Agenti</h1>
        <p className="mt-2 opacity-70">Area privata. Inserisci la password per entrare.</p>
      </div>

      {!configurato ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          La password dell&apos;app non è impostata. Aggiungi la variabile
          APP_PASSWORD e riavvia l&apos;app.
        </p>
      ) : (
        <form action={entra} className="flex flex-col gap-3">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoFocus
            autoComplete="current-password"
            className="rounded-lg border border-current/20 bg-transparent px-3 py-2 text-base outline-none focus:border-current/60"
          />
          {errore && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              Password sbagliata. Riprova.
            </p>
          )}
          <button
            type="submit"
            className="rounded-lg bg-foreground px-3 py-2 font-medium text-background hover:opacity-90"
          >
            Entra
          </button>
        </form>
      )}
    </main>
  );
}
