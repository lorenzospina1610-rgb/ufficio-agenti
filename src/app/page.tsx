export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-4 py-12">
      <h1 className="text-3xl font-bold">Ufficio Agenti</h1>
      <p className="text-lg opacity-80">
        Benvenuto nel tuo ufficio. Qui gli agenti IA lavoreranno nelle loro
        stanze e tu darai gli ordini.
      </p>
      <section className="rounded-xl border border-current/15 p-4">
        <h2 className="mb-2 font-semibold">Stanze</h2>
        <p className="opacity-70">Nessuna stanza ancora. Arriveranno presto.</p>
      </section>
    </main>
  );
}
