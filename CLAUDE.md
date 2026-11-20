# Progetto: Ufficio Agenti di Lorenzo
Web app privata dove agenti IA lavorano in "stanze" e io do ordini.

## Regole di lavoro
- Stack: Next.js + TypeScript + Tailwind. Interfaccia in italiano.
- Chiave IA: leggi SEMPRE process.env.AGENTS_ANTHROPIC_KEY, mai scriverla nel codice. Modello: process.env.AGENTS_MODEL.
- L'app è privata: accesso protetto da APP_PASSWORD.
- Lavora a piccoli passi: ogni funzione deve compilare (npm run build) prima di passare alla successiva.
- Dopo ogni modifica importante fai commit con un messaggio chiaro in italiano.
- Se una richiesta è ambigua, scegli la soluzione più semplice e scrivila nel riepilogo finale.
- Non aggiungere librerie pesanti senza motivo.

## Memoria del progetto
- Prima di iniziare leggi docs/MEMORIA-PROGETTO.md: stato, decisioni, problemi già risolti e linee guida di lavoro. Aggiornalo quando cambia qualcosa di importante.
