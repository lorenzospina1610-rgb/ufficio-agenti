# Memoria del progetto: Ufficio Agenti

Documento di passaggio di consegne. Chi riprende il lavoro (persona o Claude
su un'altra macchina) deve leggerlo per intero prima di toccare il codice.
Aggiornato al 20/11/2026.

---

## 1. Cos'è

Web app privata di Lorenzo. Ci sono delle **stanze**: in ognuna lavora un
agente IA con un ruolo (per esempio "Creator Youtube"). Lorenzo scrive ordini
nella stanza e l'agente risponde. Ogni stanza ricorda tutta la conversazione.

- **Online:** https://ufficio-agenti.netlify.app
- **Repository:** `lorenzospina1610-rgb/ufficio-agenti` (branch principale `main`)
- **Regole di base:** in `CLAUDE.md` (valgono sempre, hanno la precedenza).

## 2. Stato attuale

Funziona (verificato):
- Accesso protetto da password (`APP_PASSWORD`), sessione di 30 giorni, pulsante Esci.
- Elenco stanze, creazione stanza (nome + ruolo facoltativo), eliminazione.
- Ordini all'agente con risposta reale di Anthropic; l'agente ricorda la conversazione.
- Risposte formattate (grassetto, corsivo, titoli, elenchi, codice).
- Se l'IA fallisce, l'ordine resta salvato e compare il pulsante **Riprova**.
- Pubblicazione online su Netlify con aggiornamento automatico a ogni merge su `main`.
- Accesso online e creazione della prima stanza ("Creator Youtube") verificati da Lorenzo.

**Da verificare online:** la prima risposta reale di un agente su Netlify, dopo
la correzione della PR #6 (vedi §6, problema 4). Se Lorenzo non l'ha ancora
confermata, chiedigli di toccare **Riprova** nella stanza "Creator Youtube" e
controlla i log di Netlify.

## 3. Come è fatta

Stack: **Next.js 15 (App Router) + TypeScript + Tailwind 4**, interfaccia in italiano.
Dipendenze aggiunte oltre a Next/React: solo `@anthropic-ai/sdk` e `@netlify/blobs`.

| File | Cosa fa |
|---|---|
| `src/middleware.ts` | Blocca ogni pagina senza sessione valida e rimanda a `/accesso`. |
| `src/lib/auth.ts` | Password e sessione. Il cookie `ufficio_sessione` è un HMAC-SHA256 derivato da `APP_PASSWORD` (Web Crypto, funziona anche nel middleware). Cambiare la password chiude tutte le sessioni. Confronti a tempo costante. |
| `src/app/accesso/` | Pagina di accesso e azioni `entra` / `esci`. |
| `src/lib/stanze.ts` | Archivio delle stanze con due modalità scelte da sole: **Netlify Blobs** online (store `stanze`, una voce per stanza con chiave = id, lettura `strong`), **file `data/stanze.json`** in locale (escluso da git). |
| `src/lib/agente.ts` | Chiamata ad Anthropic. Chiave da `AGENTS_ANTHROPIC_KEY`, modello da `AGENTS_MODEL`. `baseURL` fisso su `https://api.anthropic.com`, timeout 50 s, nessun tentativo automatico, `max_tokens` 8000. Errori tradotti in italiano (`ErroreAgente`). |
| `src/app/stanze/azioni.ts` | Azioni server: `nuovaStanza`, `daiOrdine`, `riprova`, `chiudiStanza`. |
| `src/app/page.tsx` | Pagina iniziale: elenco stanze con anteprima, modulo nuova stanza. |
| `src/app/stanze/[id]/page.tsx` | Pagina della stanza: conversazione, errore + Riprova, campo ordine, elimina. |
| `src/app/componenti/TestoFormattato.tsx` | Formattatore Markdown scritto a mano: crea solo elementi React, mai HTML inserito. |
| `src/app/componenti/PulsanteInvio.tsx` | Pulsante che mostra "L'agente sta lavorando…" durante l'invio. |
| `netlify.toml` | Build `npm run build`, pubblicazione `.next`. |
| `.env.example` | Elenco delle variabili da impostare (senza valori). |

Il prompt di sistema di ogni agente = istruzioni di base (italiano, chiaro,
concreto, "Lorenzo ti dà ordini") + il ruolo scritto nella stanza.

## 4. Variabili d'ambiente

| Nome | A cosa serve | Dove è impostata |
|---|---|---|
| `AGENTS_ANTHROPIC_KEY` | Chiave API di Anthropic (segreta) | Netlify (Production + Deploy Previews, segreta); ambiente cloud di Claude Code "Default" |
| `AGENTS_MODEL` | Modello IA. Attuale: `claude-sonnet-5-5` | Netlify (tutti i contesti); ambiente cloud "Default" |
| `APP_PASSWORD` | Password di accesso all'app (segreta) | Netlify (Production + Deploy Previews, segreta); ambiente cloud "Default" |

- **Mai** scrivere i valori nel codice, nei commit, nella chat o in questo file.
- Su una nuova macchina: copia `.env.example` in `.env.local` e chiedi a Lorenzo
  di inserire i valori lui stesso.
- La chiave attuale è stata creata nella Console Anthropic il 19/11/2026 con una
  scadenza scelta da Lorenzo (consigliati 6–12 mesi). Quando scade, gli agenti
  rispondono "La chiave IA non è valida": va creata una chiave nuova e
  sostituita **in tutti i posti** della tabella.
- Su Netlify ogni modifica a una variabile richiede una nuova pubblicazione per
  avere effetto.

## 5. Pubblicazione (Netlify)

- Progetto Netlify: `ufficio-agenti` (site id `369798c0-44d7-4d9c-8e1d-6fe50993de8d`),
  account di Lorenzo, piano gratuito.
- **Aggiornamento automatico:** collegato a GitHub, branch `main`. Ogni merge
  pubblica da solo in 2–3 minuti. Ogni pull request riceve una **Deploy Preview**
  (`deploy-preview-N--ufficio-agenti.netlify.app`) e un commento del bot Netlify.
- **Protezione Netlify "team login" attiva** su tutto il sito: prima della
  password dell'app, il visitatore deve accedere con un account Netlify. Lorenzo
  non ha ancora deciso se toglierla.
- I dati online stanno in **Netlify Blobs**, store `stanze`. Lo store è unico
  per tutto il sito: **le Deploy Preview leggono e modificano gli stessi dati
  della produzione.** Non fare prove distruttive dalle preview.
- Limiti: ogni richiesta ha al massimo **60 secondi** (per questo il timeout
  dell'IA è 50 s). Copioni molto lunghi vanno chiesti a pezzi.
- Log delle richieste: tramite il connettore Netlify (observability, `get-request-logs`)
  o nel pannello Netlify → Logs.

## 6. Problemi incontrati e soluzioni

1. **Push su GitHub rifiutato (403).** L'app GitHub di Claude non aveva accesso al
   repository. Risolto da Lorenzo installando l'app e ricollegando GitHub.
2. **Chiave IA troncata** nell'ambiente cloud (20 caratteri invece di ~106).
   Anthropic mostra una chiave una sola volta: ne è stata creata una nuova.
3. **L'ambiente cloud di Claude Code non raggiunge Netlify** (rete bloccata):
   non si può caricare il sito da lì con la CLI. Soluzione: collegare Netlify a
   GitHub e pubblicare tramite merge.
4. **Online gli agenti ricevevano 401.** Netlify imposta `ANTHROPIC_BASE_URL` e
   l'SDK mandava le richieste al suo "AI Gateway", che non accetta la chiave
   Anthropic. Risolto con `baseURL` fisso in `src/lib/agente.ts` (PR #6). Non
   toglierlo.
5. **Le risposte mostravano gli asterischi del Markdown.** Risolto con
   `TestoFormattato` (PR #4).
6. Un controllo di sicurezza impedisce a Claude di leggere i valori segreti
   dall'ambiente: è giusto così. I segreti li inserisce sempre Lorenzo.

## 7. Cronologia

| PR | Contenuto |
|---|---|
| #1 | `CLAUDE.md` con le regole di lavoro |
| #2 | Base Next.js + pagina di accesso con `APP_PASSWORD` |
| #3 | Stanze con agenti IA, salvataggio su file, Riprova |
| #4 | Formattazione Markdown delle risposte |
| #5 | Preparazione per Netlify: Blobs, `netlify.toml`, timeout 50 s |
| #6 | `baseURL` fisso: correzione del 401 su Netlify |

## 8. Prossimi passi possibili

Proposti a Lorenzo, non ancora decisi. Chiedere prima di partire.
- **Risposte parola per parola** (streaming) invece di attendere la fine.
  Aiuterebbe anche con il limite dei 60 secondi.
- **Togliere o tenere** la protezione "team login" di Netlify.
- **Modificare una stanza** (nome e ruolo) dopo averla creata.
- **Tabelle** nelle risposte (ora appaiono come testo semplice).
- **Accesso al web per gli agenti** (es. ricerche sui competitor YouTube): oggi
  l'agente non naviga e lavora solo su ciò che Lorenzo incolla. Richiederebbe
  uno strumento di ricerca web: valutare costi e complessità.
- **Limite di spesa** sulla Console Anthropic (consigliato a Lorenzo, non
  verificato).

## 9. Linee guida di lavoro

Valgono insieme a `CLAUDE.md`.

### Comunicazione con Lorenzo
- Scrivi sempre in **italiano semplice**. Lorenzo non è uno sviluppatore e lavora
  spesso **dal telefono**.
- Quando deve fare qualcosa lui, dai **passi numerati**, con i nomi esatti di
  pulsanti e menu e i link diretti. Se si blocca, chiedi uno screenshot.
- Una domanda alla volta. Quando c'è da scegliere, dai una raccomandazione.
- Non chiedere mai di incollare chiavi o password in chat: le inserisce lui
  nelle impostazioni (Netlify o ambiente).
- Nel riepilogo finale: cosa è fatto, cosa è verificato e cosa no, le scelte
  semplici fatte al suo posto, il prossimo passo.

### Modo di lavorare
- **Piccoli passi.** Ogni modifica deve passare `npm run build` e `npm run lint`
  prima di andare avanti.
- **Prova davvero** nel browser (Playwright: accesso, stanza, ordine, Riprova,
  eliminazione) prima di dire che funziona. Se qualcosa non è stato provato,
  dillo chiaramente.
- **Una pull request per funzione**, con titolo e descrizione in italiano
  (Cosa cambia, Verifiche, Limiti). È Lorenzo a fare il merge.
- Dopo il merge, Netlify pubblica da solo: verifica lo stato della
  pubblicazione e, se qualcosa non va online, **leggi i log di Netlify** prima
  di ipotizzare.
- Non mettere nel repository screenshot, file di prova o `data/`.
- Prove con l'IA vera: brevi ("Rispondi solo con: ok"), costano soldi a Lorenzo.
- Per simulare Netlify in locale, avvia l'app con `ANTHROPIC_BASE_URL` impostato
  a un indirizzo finto: l'agente deve rispondere lo stesso.
- Niente librerie pesanti: finora sono bastati SDK Anthropic e Netlify Blobs.

### Da non rompere
- `baseURL` fisso in `src/lib/agente.ts`.
- Chiave e modello letti **solo** da `AGENTS_ANTHROPIC_KEY` e `AGENTS_MODEL`.
- Il middleware deve proteggere **tutto** tranne `/accesso` e i file statici.
- `TestoFormattato` non deve mai usare `dangerouslySetInnerHTML`.
- Timeout dell'IA sotto i 60 secondi di Netlify.

## 10. Avvio su una nuova macchina

```bash
git clone https://github.com/lorenzospina1610-rgb/ufficio-agenti.git
cd ufficio-agenti
npm install
cp .env.example .env.local   # Lorenzo inserisce i tre valori
npm run dev                  # http://localhost:3000
```

In locale le stanze vengono salvate in `data/stanze.json`. Quelle online
restano su Netlify Blobs, separate.
