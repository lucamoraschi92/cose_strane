# Cose Strane sul Web — guida al setup

Questa è la guida per mettere online il sito. Non serve scrivere codice: solo
creare due account gratuiti (Supabase e Vercel) e seguire i passaggi.

Tempo stimato: 30-40 minuti la prima volta.

---

## 1. Crea il progetto su Supabase (database + immagini + login)

1. Vai su [supabase.com](https://supabase.com) e crea un account gratuito.
2. Crea un **nuovo progetto** (scegli una password del database, salvala da
   qualche parte sicura, non ti servirà quasi mai ma è bene conservarla).
3. Aspetta 1-2 minuti che il progetto sia pronto.
4. Nel menu a sinistra vai su **SQL Editor** → **New query**.
5. Apri il file `supabase/schema.sql` incluso in questo progetto, copia tutto
   il contenuto, incollalo nell'editor e premi **Run**.
   Questo crea le tabelle dei prodotti e degli iscritti newsletter.
6. Vai su **Storage** (menu a sinistra) → **New bucket**.
   - Nome: `product-images`
   - Attiva **Public bucket**
   - Crea.
7. Vai su **Authentication** → **Users** → **Add user** → **Create new user**.
   - Inserisci la tua email e una password: sarà il tuo accesso al pannello
     admin del sito. Conferma l'email come "già verificata" se te lo chiede.
8. Vai su **Project Settings** (icona ingranaggio) → **API**.
   - Copia il valore **Project URL**
   - Copia il valore **anon public** key

## 2. Inserisci le chiavi nel codice

1. Apri il file `js/config.js` con un editor di testo qualsiasi (anche il
   Blocco Note va bene).
2. Sostituisci:
   - `INSERISCI_QUI_IL_TUO_PROJECT_URL` con il **Project URL** copiato prima
   - `INSERISCI_QUI_LA_TUA_ANON_PUBLIC_KEY` con la **anon public key**
3. Salva il file.

## 3. Carica il progetto su GitHub

1. Crea un account gratuito su [github.com](https://github.com) se non ce l'hai.
2. Crea un nuovo repository (es. `cose-strane-sul-web`), **privato** o pubblico,
   come preferisci.
3. Carica tutti i file di questa cartella nel repository. Il modo più semplice
   senza usare il terminale: nella pagina del repository su GitHub, usa
   **"Add file" → "Upload files"** e trascina dentro tutta la cartella.

## 4. Metti online il sito con Vercel

1. Vai su [vercel.com](https://vercel.com) e registrati **con il tuo account
   GitHub** (più semplice, collega tutto automaticamente).
2. Clicca **Add New → Project**, scegli il repository che hai appena caricato.
3. Framework: lascia **"Other"** (il sito non ne ha bisogno, è già pronto).
4. Prima di premere Deploy, apri **Environment Variables** e aggiungi:
   - Name: `ANTHROPIC_API_KEY`
   - Value: la tua chiave API (vedi punto 5 sotto per ottenerla)
5. Premi **Deploy**. Dopo 1 minuto il sito è online su un indirizzo tipo
   `https://cose-strane-sul-web.vercel.app`.

## 5. Ottieni una chiave API per il suggerimento AI

Questa chiave serve solo per il pulsante "Suggerisci testo con l'AI" nel
pannello admin. Il costo è a consumo, pochi centesimi per ogni testo generato
(con un prodotto al giorno, parliamo di pochi euro all'anno).

1. Vai su [console.anthropic.com](https://console.anthropic.com), crea un account.
2. Nella sezione **API Keys**, crea una nuova chiave.
3. Aggiungi qualche euro di credito (pay-as-you-go, nessun abbonamento).
4. Copia la chiave e incollala su Vercel come spiegato al punto 4.4.

*(In alternativa puoi lasciare vuota questa variabile: il sito funziona
comunque, semplicemente il pulsante "Suggerisci con l'AI" darà errore e dovrai
scrivere i testi a mano.)*

## 6. Collega il tuo dominio (opzionale)

Se hai acquistato un dominio (es. su Namecheap, Register.it, ecc.):

1. Su Vercel, apri il progetto → **Settings → Domains** → aggiungi il tuo
   dominio.
2. Vercel ti mostrerà uno o due record DNS da aggiungere dal pannello del tuo
   registrar (di solito un record "A" e uno "CNAME"). Vercel guida passo
   passo, basta copiare i valori mostrati.
3. In pochi minuti/ore (a seconda del provider) il dominio sarà attivo.

## 7. Uso quotidiano

- Vai su `tuosito.com/admin.html` (o `.../admin.html` sul dominio vercel.app)
- Fai login con l'email/password creati al punto 1.7
- Compila il form prodotto, eventualmente premi "Suggerisci testo con l'AI",
  scegli la data di pubblicazione futura, premi **"Programma pubblicazione"**
- Il prodotto comparirà da solo sul sito pubblico alla data scelta

Per la newsletter: gli iscritti si accumulano nella tabella
`newsletter_subscribers` su Supabase (Table Editor). Puoi esportarli in CSV da
lì quando vuoi scrivere l'email settimanale.

---

## Struttura del progetto

```
index.html          → sito pubblico
admin.html           → pannello riservato
css/style.css         → stile del sito
js/config.js           → le tue chiavi Supabase (da compilare)
js/shared.js            → categorie, fasce prezzo, funzioni comuni
js/app.js                → logica sito pubblico
js/admin.js                → logica pannello admin
api/suggest-description.js  → funzione AI (gira su Vercel, chiave protetta)
assets/                       → logo e icone categorie
supabase/schema.sql            → struttura del database da eseguire una volta
```

## Costi ricorrenti attesi

- Supabase: gratuito (per questi volumi)
- Vercel: gratuito
- Dominio: 10-15€/anno (se lo acquisti)
- API AI: pochi centesimi a descrizione generata, pay-as-you-go
