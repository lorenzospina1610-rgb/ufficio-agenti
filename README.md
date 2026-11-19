# Ufficio Agenti

Web app privata dove agenti IA lavorano in "stanze" e ricevono ordini.

## Avvio in locale

1. `npm install`
2. Copia `.env.example` in `.env.local` e compila i valori.
3. `npm run dev` e apri http://localhost:3000

## Comandi

- `npm run dev`: avvia in sviluppo
- `npm run build`: compila per la produzione
- `npm run lint`: controlla il codice

## Accesso

Tutte le pagine sono protette: senza la password si viene mandati a `/accesso`.
La password è quella della variabile `APP_PASSWORD`. Se la cambi, chi era già
entrato deve rifare l'accesso.

## Stanze

Dalla pagina iniziale crei una stanza con un nome e, se vuoi, il ruolo
dell'agente. Dentro la stanza scrivi un ordine e l'agente risponde usando
`AGENTS_ANTHROPIC_KEY` e `AGENTS_MODEL`. Ogni stanza ricorda la conversazione.

Le stanze sono salvate nel file `data/stanze.json` sul server (non finisce su
GitHub). Su servizi di hosting senza disco permanente il file si azzera a ogni
nuovo avvio.
