# Test a risposta multipla

Applicativo web statico per svolgere test a risposta multipla partendo da un database di domande in formato JSON.

L'applicazione consente di importare uno o più database di domande, salvarli nel browser, scegliere quante domande estrarre casualmente e svolgere un test con correzione finale dettagliata.

## Obiettivo del progetto

Questo progetto è stato realizzato per avere uno strumento semplice, veloce e gratuito per esercitarsi con domande a risposta multipla, in modo simile a un modulo online, ma con maggiore controllo sul formato dei dati e sulla correzione finale.

L'app è pensata in particolare per creare database di domande relativi a corsi universitari o altri argomenti di studio, e permette di riutilizzare facilmente la stessa struttura JSON per creare nuovi archivi di domande in futuro.

## Tecnologie utilizzate

Il progetto è realizzato interamente con tecnologie frontend statiche:

- HTML
- CSS
- JavaScript vanilla
- localStorage del browser

Non sono presenti:
- backend
- database remoto
- autenticazione
- framework come React o Vue

## Funzionalità principali

L'applicazione permette di:

- importare un database di domande in formato JSON
- salvare il database nel browser
- gestire più database contemporaneamente
- selezionare un database da usare per il test
- scegliere quante domande estrarre dal pool
- randomizzare l'ordine delle domande
- randomizzare l'ordine delle opzioni di risposta
- supportare domande:
  - a risposta singola
  - a risposta multipla
- correggere automaticamente il test
- mostrare:
  - numero di risposte corrette
  - numero di risposte errate
  - numero di domande non risposte
  - voto finale in trentesimi
- visualizzare una revisione completa domanda per domanda
- riordinare i database salvati tramite drag & drop

## Come funziona l'app

### 1. Importazione del database

L'utente carica un file `.json` contenente il database delle domande.

Il file viene:
- letto dal browser
- validato
- salvato nel `localStorage`

Se un database con lo stesso titolo esiste già, viene aggiornato.

### 2. Selezione del database

Dopo l'importazione, il database può essere selezionato:
- cliccando sul pulsante `Usa database`
- oppure scegliendolo dal menu a tendina

### 3. Scelta del numero di domande

L'utente inserisce quante domande vuole estrarre dal database.

Il numero richiesto non può superare il numero totale di domande disponibili.

### 4. Generazione del test

Quando il test viene avviato:
- le domande vengono mescolate casualmente
- viene estratto solo il numero richiesto di domande
- anche le opzioni di ogni domanda vengono mescolate casualmente

### 5. Svolgimento del test

L'utente risponde alle domande direttamente nell'interfaccia web.

Sono supportati due tipi di domanda:

- `singola` → una sola risposta corretta
- `multipla` → più risposte corrette

### 6. Correzione finale

Alla consegna del test, l'app mostra:

- corrette / totale
- numero di errate
- numero di non risposte
- voto in trentesimi
- revisione completa di tutte le domande

## Metodo di valutazione

### Domande a risposta singola

Una domanda di tipo `singola` è considerata corretta solo se l'utente seleziona esattamente la risposta corretta.

### Domande a risposta multipla

Una domanda di tipo `multipla` è considerata corretta solo se l'utente seleziona **tutte e sole** le risposte corrette.

Quindi:
- se manca anche una sola risposta corretta, la domanda è errata
- se viene selezionata anche una sola risposta sbagliata, la domanda è errata
- se entrambe le cose accadono, la domanda è comunque errata

### Domande non risposte

Se una domanda viene lasciata vuota:
- viene conteggiata come `non risposta`
- vale `0`
- non produce penalizzazioni aggiuntive

## Calcolo del voto

Il voto in trentesimi viene calcolato con questa formula:

```text
(corrette / totale_domande) * 30
````

### Regola di arrotondamento

L'arrotondamento finale segue questa regola:

* se la parte decimale è minore di `0.75`, si arrotonda per difetto
* se la parte decimale è maggiore o uguale a `0.75`, si arrotonda per eccesso

### Esempi

* `23.46` → `23`
* `23.74` → `23`
* `23.75` → `24`
* `23.90` → `24`

## Visualizzazione della correzione

Nella schermata finale, ogni opzione può assumere uno stato visivo diverso:

* **verde** → risposta selezionata correttamente
* **rosso** → risposta selezionata ma errata
* **giallo** → risposta corretta non selezionata
* **neutro** → opzione non rilevante

In questo modo la revisione finale è leggibile anche a colpo d'occhio.

## Struttura del progetto

```text
test-risposta-multipla/
├── index.html
├── style.css
├── app.js
├── README.md
├── .gitignore
└── database-esempio.json
```

## Avvio in locale

Per usare l'app in locale è sufficiente:

1. scaricare o clonare il repository
2. aprire il file `index.html` nel browser

Non è necessario installare dipendenze.

## Pubblicazione online

Poiché il progetto è composto solo da file statici, può essere pubblicato gratuitamente con servizi come:

* GitHub Pages
* Netlify
* Vercel

La soluzione più semplice, in questo caso, è GitHub Pages.

## Formato del file JSON

Ogni database deve avere questa struttura:

```json
{
  "titolo": "Nome del database",
  "descrizione": "Breve descrizione del contenuto",
  "domande": [
    {
      "id": 1,
      "tipo": "singola",
      "testo": "Testo della domanda",
      "opzioni": [
        { "id": "a", "testo": "Prima opzione" },
        { "id": "b", "testo": "Seconda opzione" },
        { "id": "c", "testo": "Terza opzione" }
      ],
      "corrette": ["b"]
    },
    {
      "id": 2,
      "tipo": "multipla",
      "testo": "Testo di una domanda con più risposte corrette",
      "opzioni": [
        { "id": "a", "testo": "Opzione A" },
        { "id": "b", "testo": "Opzione B" },
        { "id": "c", "testo": "Opzione C" },
        { "id": "d", "testo": "Opzione D" }
      ],
      "corrette": ["a", "c"]
    }
  ]
}
```

## Significato dei campi del JSON

### Campi principali

* `titolo`
  Nome del database

* `descrizione`
  Breve descrizione del contenuto del database

* `domande`
  Array contenente tutte le domande

### Campi di ogni domanda

* `id`
  Identificatore della domanda

* `tipo`
  Può assumere solo uno di questi valori:

  * `singola`
  * `multipla`

* `testo`
  Testo della domanda

* `opzioni`
  Array delle possibili risposte

* `corrette`
  Array contenente gli `id` delle opzioni corrette

### Campi di ogni opzione

* `id`
  Identificatore univoco dell'opzione all'interno della domanda

* `testo`
  Testo visualizzato per l'opzione

## Regole da rispettare nel JSON

Per essere considerato valido, il file JSON deve rispettare queste regole:

* deve contenere un oggetto JSON valido
* `titolo` deve essere una stringa
* `domande` deve essere un array non vuoto
* ogni domanda deve avere:

  * `testo`
  * `tipo`
  * `opzioni`
  * `corrette`
* `tipo` deve essere `singola` oppure `multipla`
* ogni domanda deve avere almeno 2 opzioni
* ogni opzione deve avere:

  * `id`
  * `testo`
* gli `id` delle opzioni devono essere univoci nella stessa domanda
* ogni valore contenuto in `corrette` deve corrispondere a un `id` realmente presente nelle opzioni
* se `tipo` è `singola`, `corrette` deve contenere una sola risposta
* se `tipo` è `multipla`, `corrette` può contenere più risposte

## File di esempio

Nel progetto è presente il file `database-esempio.json`, che può essere usato come base per creare nuovi database relativi ad altri corsi o ad altri argomenti.

## Possibili estensioni future

Il progetto può essere ampliato in futuro con funzionalità come:

* cronologia dei tentativi
* esportazione dei risultati
* filtri per argomento
* timer
* supporto a categorie o tag
* salvataggio cloud
* autenticazione utente