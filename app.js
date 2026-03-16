/* =========================================================
   COSTANTI E STATO GLOBALE DELL'APPLICAZIONE
   ========================================================= */

/* Chiave usata per salvare e recuperare i database dal localStorage */
const STORAGE_KEY = "quiz_app_saved_quizzes";

/* Stato centrale dell'applicazione */
const state = {
  quizzes: [],
  currentQuizId: null,
  currentQuestions: [],
  currentAnswers: {},
  lastSetup: null
};

/* =========================================================
   RIFERIMENTI AGLI ELEMENTI DEL DOM
   ========================================================= */

/* Schermate principali */
const homeScreen = document.getElementById("home-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultsScreen = document.getElementById("results-screen");

/* Elementi della schermata home */
const quizFileInput = document.getElementById("quiz-file");
const uploadBtn = document.getElementById("upload-btn");
const uploadMessage = document.getElementById("upload-message");
const savedQuizzesList = document.getElementById("saved-quizzes-list");
const selectedQuiz = document.getElementById("selected-quiz");
const questionCountInput = document.getElementById("question-count");
const poolInfo = document.getElementById("pool-info");
const startQuizBtn = document.getElementById("start-quiz-btn");
const clearStorageBtn = document.getElementById("clear-storage-btn");

/* Elementi della schermata test */
const quizTitle = document.getElementById("quiz-title");
const quizDescription = document.getElementById("quiz-description");
const questionsContainer = document.getElementById("questions-container");
const quizForm = document.getElementById("quiz-form");
const backHomeBtn = document.getElementById("back-home-btn");

/* Elementi della schermata risultati */
const resultsSummary = document.getElementById("results-summary");
const resultsDetails = document.getElementById("results-details");
const resultsHomeBtn = document.getElementById("results-home-btn");
const retryBtn = document.getElementById("retry-btn");
const errorMessage = document.getElementById("error-message");

/* Pulsante flottante per tornare in cima */
const backToTopBtn = document.getElementById("back-to-top-btn");

/* =========================================================
   GESTIONE SCHERMATE
   ========================================================= */

/* Mostra una schermata e nasconde le altre */
function showScreen(screen) {
  homeScreen.classList.remove("active");
  quizScreen.classList.remove("active");
  resultsScreen.classList.remove("active");
  screen.classList.add("active");
}

/* Porta la pagina in cima con uno scorrimento fluido */
function scrollPageToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

/* Mostra o nasconde il pulsante "torna in cima" in base alla posizione di scroll */
function updateBackToTopButtonVisibility() {
  if (window.scrollY > 200) {
    backToTopBtn.classList.remove("hidden");
  } else {
    backToTopBtn.classList.add("hidden");
  }
}

/* =========================================================
   PERSISTENZA DEI DATABASE NEL BROWSER
   ========================================================= */

/* Salva tutti i database correnti nel localStorage */
function saveQuizzesToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.quizzes));
}

/* Carica i database salvati dal localStorage */
function loadQuizzesFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    state.quizzes = [];
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    state.quizzes = Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Errore nel caricamento dei quiz salvati:", error);
    state.quizzes = [];
  }
}

/* =========================================================
   FUNZIONI DI SUPPORTO GENERALI
   ========================================================= */

/* Genera un identificatore locale univoco per ogni database */
function generateLocalId() {
  return "quiz_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
}

/* Crea una copia profonda di un oggetto o array */
function deepClone(data) {
  return JSON.parse(JSON.stringify(data));
}

/* Mescola casualmente un array */
function shuffleArray(array) {
  const cloned = [...array];
  for (let i = cloned.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
}

/* Riconosce le opzioni che devono comparire come ultima scelta */
function isLastOptionCandidate(optionText) {
  if (typeof optionText !== "string") return false;

  const normalized = optionText
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,;:!?()[\]"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const patterns = [
    /^nessuna delle precedenti\b/,
    /^nessuna delle altre\b/,
    /^nessuna delle risposte precedenti\b/,
    /^nessuna delle opzioni precedenti\b/,
    /^nessuna delle seguenti\b/,
    /^tutte le precedenti\b/,
    /^tutte le altre\b/,
    /^tutte le risposte precedenti\b/,
    /^tutte le opzioni precedenti\b/,
    /^tutte le seguenti\b/,
    /^altro\b/,
    /^altra\b/,
    /^altre\b/
  ];

  return patterns.some((pattern) => pattern.test(normalized));
}

/* Mescola le opzioni ma sposta in fondo quelle speciali, se presenti */
function shuffleOptionsKeepingSpecialLast(options) {
  const shuffled = shuffleArray(options);
  const normalOptions = [];
  const specialOptions = [];

  shuffled.forEach((option) => {
    if (isLastOptionCandidate(option.testo)) {
      specialOptions.push(option);
    } else {
      normalOptions.push(option);
    }
  });

  return [...normalOptions, ...specialOptions];
}

/* Applica la regola di arrotondamento personalizzata del voto */
function customRoundGrade(value) {
  const integerPart = Math.floor(value);
  const decimalPart = value - integerPart;
  return decimalPart >= 0.75 ? integerPart + 1 : integerPart;
}

/* Confronta due insiemi di risposte ignorando l'ordine */
function areSetsEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  const set1 = new Set(arr1);
  const set2 = new Set(arr2);
  if (set1.size !== set2.size) return false;
  for (const item of set1) {
    if (!set2.has(item)) return false;
  }
  return true;
}

/* =========================================================
   VALIDAZIONE DEL FILE JSON IMPORTATO
   ========================================================= */

/* Controlla che il database JSON abbia la struttura corretta */
function validateQuizData(data) {
  if (!data || typeof data !== "object") {
    return { valid: false, message: "Il file JSON non contiene un oggetto valido." };
  }

  if (!data.titolo || typeof data.titolo !== "string") {
    return { valid: false, message: "Il quiz deve avere un campo 'titolo' valido." };
  }

  if (!Array.isArray(data.domande) || data.domande.length === 0) {
    return { valid: false, message: "Il quiz deve contenere almeno una domanda nell'array 'domande'." };
  }

  for (let i = 0; i < data.domande.length; i++) {
    const domanda = data.domande[i];

    if (!domanda.testo || typeof domanda.testo !== "string") {
      return { valid: false, message: `La domanda ${i + 1} non ha un testo valido.` };
    }

    if (!["singola", "multipla"].includes(domanda.tipo)) {
      return { valid: false, message: `La domanda ${i + 1} deve avere tipo 'singola' o 'multipla'.` };
    }

    if (!Array.isArray(domanda.opzioni) || domanda.opzioni.length < 2) {
      return { valid: false, message: `La domanda ${i + 1} deve avere almeno 2 opzioni.` };
    }

    if (!Array.isArray(domanda.corrette) || domanda.corrette.length === 0) {
      return { valid: false, message: `La domanda ${i + 1} deve avere almeno una risposta corretta.` };
    }

    if (domanda.tipo === "singola" && domanda.corrette.length !== 1) {
      return { valid: false, message: `La domanda ${i + 1} è di tipo singola ma ha più di una risposta corretta.` };
    }

    const optionIds = new Set();

    for (const opzione of domanda.opzioni) {
      if (!opzione || typeof opzione !== "object") {
        return { valid: false, message: `Una opzione della domanda ${i + 1} non è valida.` };
      }

      if (!opzione.id || typeof opzione.id !== "string") {
        return { valid: false, message: `Una opzione della domanda ${i + 1} non ha un id valido.` };
      }

      if (!opzione.testo || typeof opzione.testo !== "string") {
        return { valid: false, message: `Una opzione della domanda ${i + 1} non ha un testo valido.` };
      }

      if (optionIds.has(opzione.id)) {
        return { valid: false, message: `La domanda ${i + 1} contiene opzioni con id duplicato.` };
      }

      optionIds.add(opzione.id);
    }

    for (const corretta of domanda.corrette) {
      if (!optionIds.has(corretta)) {
        return { valid: false, message: `La domanda ${i + 1} contiene una risposta corretta non presente nelle opzioni.` };
      }
    }
  }

  return { valid: true };
}

/* =========================================================
   RENDER DELLA LISTA DEI DATABASE SALVATI
   ========================================================= */

/* Disegna a schermo tutti i database salvati e collega i pulsanti */
function renderSavedQuizzes() {
  savedQuizzesList.innerHTML = "";

  if (state.quizzes.length === 0) {
    savedQuizzesList.innerHTML = `<p class="empty-state">Non hai ancora salvato nessun database.</p>`;
    return;
  }

  state.quizzes.forEach((quiz, index) => {
    const item = document.createElement("div");
    const isSelected = state.currentQuizId === quiz.localId;
    const questionTotal = Array.isArray(quiz.domande) ? quiz.domande.length : 0;

    item.className = `saved-quiz-item ${isSelected ? "selected-database" : ""}`;
    item.setAttribute("draggable", "true");
    item.dataset.index = index;
    item.dataset.id = quiz.localId;

    item.innerHTML = `
      <div class="saved-quiz-info">
        <h4>${escapeHtml(quiz.titolo)}</h4>
        <p>${escapeHtml(quiz.descrizione || "Nessuna descrizione")}</p>
        <p class="saved-quiz-meta">${questionTotal} domande nel database</p>
      </div>
      <div class="actions">
        <button class="btn ${isSelected ? "success" : "secondary"} select-quiz-btn" data-id="${quiz.localId}">
          ${isSelected ? "Database in uso" : "Usa database"}
        </button>
        <button class="btn danger delete-quiz-btn" data-id="${quiz.localId}">Elimina</button>
      </div>
    `;

    savedQuizzesList.appendChild(item);
  });

  document.querySelectorAll(".select-quiz-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const clickedId = btn.dataset.id;

      if (state.currentQuizId === clickedId) {
        state.currentQuizId = null;
        selectedQuiz.value = "";
        poolInfo.textContent = "";
        uploadMessage.textContent = "Nessun database selezionato.";
      } else {
        state.currentQuizId = clickedId;
        selectedQuiz.value = clickedId;
        updatePoolInfo();
        uploadMessage.textContent = "Database selezionato correttamente.";
      }

      clearError();
      renderSavedQuizzes();
      renderQuizSelect();
    });
  });

  document.querySelectorAll(".delete-quiz-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const quizId = btn.dataset.id;
      state.quizzes = state.quizzes.filter((quiz) => quiz.localId !== quizId);

      if (state.currentQuizId === quizId) {
        state.currentQuizId = null;
        selectedQuiz.value = "";
        poolInfo.textContent = "";
      }

      saveQuizzesToStorage();
      renderSavedQuizzes();
      renderQuizSelect();
      updatePoolInfo();
      uploadMessage.textContent = "Database eliminato correttamente.";
      clearError();
    });
  });

  enableDragAndDrop();
}

/* =========================================================
   DRAG & DROP DEI DATABASE
   ========================================================= */

/* Permette di riordinare i database trascinando le card */
function enableDragAndDrop() {
  const items = document.querySelectorAll(".saved-quiz-item");
  let draggedIndex = null;

  items.forEach((item) => {
    item.addEventListener("dragstart", () => {
      draggedIndex = Number(item.dataset.index);
      item.classList.add("dragging");
    });

    item.addEventListener("dragend", () => {
      item.classList.remove("dragging");
      draggedIndex = null;

      document.querySelectorAll(".saved-quiz-item").forEach((el) => {
        el.classList.remove("drag-over");
      });
    });

    item.addEventListener("dragover", (event) => {
      event.preventDefault();
      item.classList.add("drag-over");
    });

    item.addEventListener("dragleave", () => {
      item.classList.remove("drag-over");
    });

    item.addEventListener("drop", () => {
      item.classList.remove("drag-over");

      const targetIndex = Number(item.dataset.index);

      if (draggedIndex === null || draggedIndex === targetIndex) {
        return;
      }

      const movedItem = state.quizzes.splice(draggedIndex, 1)[0];
      state.quizzes.splice(targetIndex, 0, movedItem);

      saveQuizzesToStorage();
      renderAllHome();
    });
  });
}

/* =========================================================
   MENU A TENDINA DEL DATABASE SELEZIONATO
   ========================================================= */

/* Aggiorna il select con tutti i database disponibili */
function renderQuizSelect() {
  selectedQuiz.innerHTML = "";

  if (state.quizzes.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Nessun database disponibile";
    selectedQuiz.appendChild(option);
    return;
  }

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Seleziona un database";
  selectedQuiz.appendChild(placeholder);

  state.quizzes.forEach((quiz) => {
    const option = document.createElement("option");
    option.value = quiz.localId;
    option.textContent = quiz.titolo;
    selectedQuiz.appendChild(option);
  });

  if (state.currentQuizId) {
    selectedQuiz.value = state.currentQuizId;
  } else {
    selectedQuiz.value = "";
  }
}

/* Mostra il numero di domande contenute nel database selezionato */
function updatePoolInfo() {
  const quizId = selectedQuiz.value;
  const quiz = state.quizzes.find((q) => q.localId === quizId);

  if (!quiz) {
    poolInfo.textContent = "";
    return;
  }

  poolInfo.textContent = `Il database selezionato contiene ${quiz.domande.length} domande.`;
}

/* Ridisegna tutta la home */
function renderAllHome() {
  renderSavedQuizzes();
  renderQuizSelect();
  updatePoolInfo();
}

/* =========================================================
   SICUREZZA HTML
   ========================================================= */

/* Escapa i caratteri speciali prima di inserirli nell'HTML */
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =========================================================
   IMPORTAZIONE DEL DATABASE DA FILE JSON
   ========================================================= */

/* Legge il file JSON, lo valida e lo salva nel browser */
async function importQuizFromFile() {
  clearError();
  uploadMessage.textContent = "";

  const file = quizFileInput.files[0];

  if (!file) {
    showError("Seleziona prima un file JSON.");
    return;
  }

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);

    const validation = validateQuizData(parsed);
    if (!validation.valid) {
      showError(validation.message);
      return;
    }

    const quizToSave = {
      ...deepClone(parsed),
      localId: generateLocalId(),
      importedAt: new Date().toISOString()
    };

    const existingIndex = state.quizzes.findIndex(
      (quiz) => quiz.titolo.trim().toLowerCase() === quizToSave.titolo.trim().toLowerCase()
    );

    if (existingIndex >= 0) {
      state.quizzes[existingIndex] = {
        ...quizToSave,
        localId: state.quizzes[existingIndex].localId
      };
      state.currentQuizId = state.quizzes[existingIndex].localId;
      uploadMessage.textContent = "Esisteva già un database con questo titolo: è stato aggiornato.";
    } else {
      state.quizzes.push(quizToSave);
      state.currentQuizId = quizToSave.localId;
      uploadMessage.textContent = "Database importato e salvato correttamente.";
    }

    saveQuizzesToStorage();
    renderAllHome();
    selectedQuiz.value = state.currentQuizId;
    updatePoolInfo();

    quizFileInput.value = "";
  } catch (error) {
    console.error(error);
    showError("Errore durante la lettura del file JSON.");
  }
}

/* =========================================================
   PREPARAZIONE DEL TEST
   ========================================================= */

/* Estrae casualmente le domande e mescola le opzioni */
function prepareQuizQuestions(quiz, count) {
  const clonedQuestions = deepClone(quiz.domande).map((question, index) => ({
    ...question,
    internalId: question.id ?? `domanda_${index + 1}`,
    opzioni: shuffleOptionsKeepingSpecialLast(question.opzioni)
  }));

  const shuffledQuestions = shuffleArray(clonedQuestions);
  return shuffledQuestions.slice(0, count);
}

/* =========================================================
   RENDER DEL TEST
   ========================================================= */

/* Costruisce la schermata con le domande estratte */
function renderQuiz(quiz, questions) {
  quizTitle.textContent = quiz.titolo;
  quizDescription.textContent = quiz.descrizione || "";

  questionsContainer.innerHTML = "";

  questions.forEach((question, index) => {
    const card = document.createElement("div");
    card.className = "question-card";

    const inputType = question.tipo === "singola" ? "radio" : "checkbox";
    const groupName = `question_${index}`;

    const optionsHtml = question.opzioni.map((option) => {
      const inputId = `${groupName}_${option.id}`;
      return `
        <div class="option-item">
          <label class="option-label" for="${inputId}">
            <input
              type="${inputType}"
              id="${inputId}"
              name="${groupName}"
              value="${escapeHtml(option.id)}"
              data-question-index="${index}"
              data-question-type="${question.tipo}"
            />
            <span>${escapeHtml(option.testo)}</span>
          </label>
        </div>
      `;
    }).join("");

    card.innerHTML = `
      <div class="question-header">
        <div class="question-number">Domanda ${index + 1}</div>
        <div class="question-text">${escapeHtml(question.testo)}</div>
        <div class="question-type">
          ${question.tipo === "singola" ? "Una sola risposta corretta" : "Più risposte corrette"}
        </div>
      </div>
      <div class="options-list">
        ${optionsHtml}
      </div>
    `;

    questionsContainer.appendChild(card);
  });

  attachAnswerListeners();
}

/* Collega gli eventi agli input delle risposte */
function attachAnswerListeners() {
  const allInputs = questionsContainer.querySelectorAll("input[type='radio'], input[type='checkbox']");

  allInputs.forEach((input) => {
    input.addEventListener("change", () => {
      const index = Number(input.dataset.questionIndex);
      const type = input.dataset.questionType;

      if (type === "singola") {
        const checked = questionsContainer.querySelector(`input[name="question_${index}"]:checked`);
        state.currentAnswers[index] = checked ? [checked.value] : [];
      } else {
        const checked = Array.from(
          questionsContainer.querySelectorAll(`input[name="question_${index}"]:checked`)
        ).map((el) => el.value);

        state.currentAnswers[index] = checked;
      }
    });
  });
}

/* Avvia il test dopo aver verificato che tutto sia valido */
function startQuiz() {
  clearError();
  uploadMessage.textContent = "";

  const quizId = selectedQuiz.value;
  const quiz = state.quizzes.find((q) => q.localId === quizId);

  if (!quiz) {
    showError("Seleziona un database valido prima di iniziare.");
    return;
  }

  const requestedCount = Number(questionCountInput.value);

  if (!Number.isInteger(requestedCount) || requestedCount <= 0) {
    showError("Inserisci un numero di domande valido.");
    return;
  }

  if (requestedCount > quiz.domande.length) {
    showError(`Hai richiesto ${requestedCount} domande, ma il database ne contiene solo ${quiz.domande.length}.`);
    return;
  }

  state.currentQuizId = quizId;
  state.currentQuestions = prepareQuizQuestions(quiz, requestedCount);
  state.currentAnswers = {};
  state.lastSetup = { quizId, count: requestedCount };

  renderQuiz(quiz, state.currentQuestions);
  showScreen(quizScreen);
  scrollPageToTop();
}

/* =========================================================
   VALUTAZIONE DEL TEST
   ========================================================= */

/* Calcola corrette, errate, non risposte e spiegazioni dettagliate */
function evaluateQuiz() {
  let correct = 0;
  let wrong = 0;
  let unanswered = 0;

  const details = state.currentQuestions.map((question, index) => {
    const userAnswers = Array.isArray(state.currentAnswers[index]) ? state.currentAnswers[index] : [];
    const correctAnswers = question.corrette;

    let status = "";
    let explanation = "";

    if (userAnswers.length === 0) {
      unanswered++;
      status = "unanswered";
      explanation = "Nessuna risposta selezionata.";
    } else if (areSetsEqual(userAnswers, correctAnswers)) {
      correct++;
      status = "correct";
      explanation = question.tipo === "multipla"
        ? "Sono state selezionate correttamente tutte le risposte esatte."
        : "La risposta selezionata è corretta.";
    } else {
      wrong++;
      status = "wrong";

      if (question.tipo === "multipla") {
        const missingCorrect = correctAnswers.filter(ans => !userAnswers.includes(ans));
        const extraWrong = userAnswers.filter(ans => !correctAnswers.includes(ans));

        if (missingCorrect.length > 0 && extraWrong.length > 0) {
          explanation = "Non sono state selezionate tutte le risposte corrette e sono state selezionate anche risposte non corrette.";
        } else if (missingCorrect.length > 0) {
          explanation = "Non sono state selezionate tutte le risposte corrette.";
        } else if (extraWrong.length > 0) {
          explanation = "Sono state selezionate una o più risposte non corrette.";
        } else {
          explanation = "La risposta è errata.";
        }
      } else {
        explanation = "La risposta selezionata non è corretta.";
      }
    }

    return {
      question,
      userAnswers,
      correctAnswers,
      status,
      explanation,
      index
    };
  });

  const rawGrade = (correct / state.currentQuestions.length) * 30;
  const roundedGrade = customRoundGrade(rawGrade);

  return {
    total: state.currentQuestions.length,
    correct,
    wrong,
    unanswered,
    rawGrade,
    roundedGrade,
    details
  };
}

/* =========================================================
   RENDER DEI RISULTATI FINALI
   ========================================================= */

/* Mostra riepilogo finale e correzione dettagliata domanda per domanda */
function renderResults(result) {
  resultsSummary.innerHTML = `
    <div class="summary-box">
      <h3>Corrette</h3>
      <p>${result.correct}/${result.total}</p>
    </div>
    <div class="summary-box">
      <h3>Errate</h3>
      <p>${result.wrong}</p>
    </div>
    <div class="summary-box">
      <h3>Non risposte</h3>
      <p>${result.unanswered}</p>
    </div>
    <div class="summary-box">
      <h3>Voto in 30</h3>
      <p>${result.roundedGrade}/30</p>
    </div>
  `;

  resultsDetails.innerHTML = "";

  result.details.forEach((item, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = `result-question ${item.status}`;

    let statusText = "";
    if (item.status === "correct") statusText = "Corretta";
    if (item.status === "wrong") statusText = "Errata";
    if (item.status === "unanswered") statusText = "Non risposta";

    const optionsHtml = item.question.opzioni.map((option) => {
      const isCorrect = item.correctAnswers.includes(option.id);
      const isSelected = item.userAnswers.includes(option.id);

      let classes = "result-option";
      let legend = "";

      if (isSelected && isCorrect) {
        classes += " selected-correct";
        legend = "Selezionata correttamente";
      } else if (isSelected && !isCorrect) {
        classes += " selected-wrong";
        legend = "Selezionata ma errata";
      } else if (!isSelected && isCorrect) {
        classes += " missed-correct";
        legend = "Corretta ma non selezionata";
      } else {
        classes += " neutral-option";
      }

      return `
        <div class="${classes}">
          <strong>${escapeHtml(option.testo)}</strong>
          ${legend ? `<div class="result-legend">${legend}</div>` : ""}
        </div>
      `;
    }).join("");

    wrapper.innerHTML = `
      <div class="question-number">Domanda ${index + 1}</div>
      <div class="question-text">${escapeHtml(item.question.testo)}</div>
      <div class="result-status ${item.status}">${statusText}</div>
      <div class="result-explanation ${item.status}">${escapeHtml(item.explanation)}</div>
      <div class="result-options">${optionsHtml}</div>
    `;

    resultsDetails.appendChild(wrapper);
  });
}

/* =========================================================
   NAVIGAZIONE E RESET
   ========================================================= */

/* Ritorna alla schermata iniziale */
function resetToHome() {
  showScreen(homeScreen);
  scrollPageToTop();
}

/* Ripete il test usando lo stesso database e lo stesso numero di domande */
function retryQuiz() {
  if (!state.lastSetup) {
    showScreen(homeScreen);
    return;
  }

  const quiz = state.quizzes.find((q) => q.localId === state.lastSetup.quizId);

  if (!quiz) {
    showScreen(homeScreen);
    return;
  }

  state.currentQuestions = prepareQuizQuestions(quiz, state.lastSetup.count);
  state.currentAnswers = {};
  renderQuiz(quiz, state.currentQuestions);
  showScreen(quizScreen);
  scrollPageToTop();
}

/* Cancella tutti i database salvati nel browser */
function clearAllQuizzes() {
  const confirmed = window.confirm("Vuoi davvero cancellare tutti i database salvati nel browser?");
  if (!confirmed) return;

  state.quizzes = [];
  state.currentQuizId = null;
  saveQuizzesToStorage();
  renderAllHome();
  uploadMessage.textContent = "Tutti i database salvati sono stati rimossi.";
  clearError();
}

/* =========================================================
   EVENT LISTENERS PRINCIPALI
   ========================================================= */

/* Importazione del file JSON */
uploadBtn.addEventListener("click", importQuizFromFile);

/* Selezione manuale del database dal menu a tendina */
selectedQuiz.addEventListener("change", () => {
  state.currentQuizId = selectedQuiz.value || null;
  updatePoolInfo();
  clearError();

  if (state.currentQuizId) {
    uploadMessage.textContent = "Database selezionato correttamente.";
  } else {
    uploadMessage.textContent = "Nessun database selezionato.";
  }

  renderSavedQuizzes();
});

/* Pulsanti principali dell'app */
startQuizBtn.addEventListener("click", startQuiz);
clearStorageBtn.addEventListener("click", clearAllQuizzes);
backHomeBtn.addEventListener("click", resetToHome);
resultsHomeBtn.addEventListener("click", resetToHome);
retryBtn.addEventListener("click", retryQuiz);

/* Gestione del pulsante flottante "torna in cima" */
backToTopBtn.addEventListener("click", scrollPageToTop);
window.addEventListener("scroll", updateBackToTopButtonVisibility);

/* Consegna del test */
quizForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const result = evaluateQuiz();
  renderResults(result);
  showScreen(resultsScreen);
  scrollPageToTop();
});

/* =========================================================
   INIZIALIZZAZIONE DELL'APPLICAZIONE
   ========================================================= */

/* Carica i database salvati e mostra la home all'avvio */
loadQuizzesFromStorage();
renderAllHome();
showScreen(homeScreen);
updateBackToTopButtonVisibility();

/* =========================================================
   GESTIONE DEI MESSAGGI DI ERRORE
   ========================================================= */

/* Nasconde il box degli errori */
function clearError() {
  errorMessage.textContent = "";
  errorMessage.classList.add("hidden");
}

/* Mostra un messaggio di errore */
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove("hidden");
}