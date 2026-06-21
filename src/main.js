import './style.css';
import { problems } from './problems.js';

// Core Application State
let currentScreen = 'list'; // 'list' | 'typing' | 'results'
let selectedProblem = null;
let characters = [];
let currentIndex = 0;
let startTime = null;
let endTime = null;
let mistakes = 0;
let totalKeystrokes = 0;
let timerInterval = null;
let typingTimeout = null;

// DOM Elements
const problemListSection = document.getElementById('problem-list-section');
const typingSection = document.getElementById('typing-section');
const resultsSection = document.getElementById('results-section');

const problemSearchInput = document.getElementById('problem-search');
const problemsGrid = document.getElementById('problems-grid');

const btnBackToList = document.getElementById('btn-back-to-list');
const activeProblemTitle = document.getElementById('active-problem-title');
const activeProblemDifficulty = document.getElementById('active-problem-difficulty');
const activeProblemDesc = document.getElementById('active-problem-desc');

const liveWpm = document.getElementById('live-wpm');
const liveAccuracy = document.getElementById('live-accuracy');
const liveTime = document.getElementById('live-time');
const liveMistakes = document.getElementById('live-mistakes');

const typingInput = document.getElementById('typing-input');
const codeEditorBody = document.getElementById('code-editor-body');
const focusOverlay = document.getElementById('focus-overlay');
const typingStatusText = document.getElementById('typing-status-text');

const resultsProblemTitle = document.getElementById('results-problem-title');
const resultWpm = document.getElementById('result-wpm');
const resultAccuracy = document.getElementById('result-accuracy');
const resultTime = document.getElementById('result-time');
const resultMistakes = document.getElementById('result-mistakes');

const btnRetry = document.getElementById('btn-retry');
const btnBackToProblems = document.getElementById('btn-back-to-problems');
const logoHeader = document.querySelector('.header-logo');

// --- Screen Router ---
function changeScreen(screenName) {
  currentScreen = screenName;
  
  // Hide all screens
  problemListSection.classList.remove('active');
  typingSection.classList.remove('active');
  resultsSection.classList.remove('active');
  
  // Show active screen after a slight delay to allow smooth transition
  setTimeout(() => {
    if (screenName === 'list') {
      problemListSection.classList.add('active');
      stopTimer();
      selectedProblem = null;
    } else if (screenName === 'typing') {
      typingSection.classList.add('active');
      typingInput.focus();
    } else if (screenName === 'results') {
      resultsSection.classList.add('active');
      stopTimer();
    }
  }, 50);
}

// --- Problem List Renderer ---
function renderProblemsList(problemsList) {
  problemsGrid.innerHTML = '';
  
  if (problemsList.length === 0) {
    problemsGrid.innerHTML = `
      <div class="no-results" style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">
        <svg xmlns="http://www.w3.org/2000/svg" style="width: 48px; height: 48px; margin-bottom: 12px; opacity: 0.5;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
        <p>No coding challenges found matching your filters.</p>
      </div>
    `;
    return;
  }
  
  problemsList.forEach(problem => {
    const card = document.createElement('div');
    card.className = 'problem-card';
    card.dataset.id = problem.id;
    
    const diffCapitalized = problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1);
    
    card.innerHTML = `
      <div class="card-top">
        <h3 class="card-title">${problem.title}</h3>
        <span class="difficulty-badge ${problem.difficulty}">${diffCapitalized}</span>
      </div>
      <p class="card-description">${problem.description}</p>
      <div class="card-footer">
        <div class="lang-indicator">
          <span class="lang-dot"></span>
          <span>JavaScript</span>
        </div>
        <div class="start-prompt">
          <span>Type code</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </div>
      </div>
    `;
    
    card.addEventListener('click', () => {
      startSession(problem);
    });
    
    problemsGrid.appendChild(card);
  });
}

function filterProblems() {
  const query = problemSearchInput.value.toLowerCase();
  const activeFilterBtn = document.querySelector('.filter-btn.active');
  const difficultyFilter = activeFilterBtn ? activeFilterBtn.dataset.filter : 'all';
  
  const filtered = problems.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(query) || p.description.toLowerCase().includes(query);
    const matchesDifficulty = (difficultyFilter === 'all') || (p.difficulty === difficultyFilter);
    return matchesSearch && matchesDifficulty;
  });
  
  renderProblemsList(filtered);
}

// --- Syntax Tokenizer ---
function tokenizeJS(code) {
  const rules = [
    { type: 'comment', regex: /^\/\/.*|^\/\*[\s\S]*?\*\// },
    { type: 'string', regex: /^"(?:[^"\\]|\\.)*"|^'(?:[^'\\]|\\.)*'|^`(?:[^`\\]|\\.)*`/ },
    { type: 'number', regex: /^\b0x[a-fA-F0-9]+\b|^\b\d+(?:\.\d+)?\b/ },
    { type: 'keyword', regex: /^\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|class|extends|import|export|from|default|try|catch|finally|throw|typeof|instanceof|async|await|in|of)\b/ },
    { type: 'boolean', regex: /^\b(true|false|null|undefined)\b/ },
    { type: 'builtin', regex: /^\b(Map|Set|Array|Object|String|Number|Boolean|Math|console|Promise|RegExp)\b/ },
    { type: 'function', regex: /^\b[a-zA-Z_]\w*(?=\s*\()/ },
    { type: 'identifier', regex: /^\b[a-zA-Z_]\w*\b/ },
    { type: 'operator', regex: /^(=>|===|!==|==|!=|<=|>=|&&|\|\||\+\+|\-\-|\+=|\-=|\*=|\/=|\+|-|\*|\/|=|<|>)/ },
    { type: 'punctuation', regex: /^[{}[\]();.,:]/ },
    { type: 'whitespace', regex: /^\s+/ },
    { type: 'text', regex: /^./ }
  ];

  let remaining = code;
  const tokens = [];

  while (remaining.length > 0) {
    let matched = false;
    for (const rule of rules) {
      const match = remaining.match(rule.regex);
      if (match) {
        tokens.push({ text: match[0], type: rule.type });
        remaining = remaining.slice(match[0].length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      tokens.push({ text: remaining[0], type: 'text' });
      remaining = remaining.slice(1);
    }
  }
  return tokens;
}

// --- Character Model Builder ---
function buildCharacterList(code) {
  const tokens = tokenizeJS(code);
  const chars = [];
  let currentLine = 0;
  let currentCharInLine = 0;
  
  tokens.forEach(token => {
    const text = token.text;
    const type = token.type;
    
    const parts = text.split('\n');
    parts.forEach((part, pIndex) => {
      // Add newline character if it's a multi-line token split point
      if (pIndex > 0) {
        chars.push({
          char: '\n',
          type: 'whitespace',
          state: 'pending',
          typedChar: null,
          isIndent: false,
          lineIndex: currentLine,
          charIndex: currentCharInLine
        });
        currentLine++;
        currentCharInLine = 0;
      }
      
      // Add regular characters of the token part
      for (let c = 0; c < part.length; c++) {
        chars.push({
          char: part[c],
          type: type,
          state: 'pending',
          typedChar: null,
          isIndent: false, // determined in next pass
          lineIndex: currentLine,
          charIndex: currentCharInLine
        });
        currentCharInLine++;
      }
    });
  });
  
  // Second pass: Mark leading indentation
  const linesMap = {};
  chars.forEach(charObj => {
    if (!linesMap[charObj.lineIndex]) {
      linesMap[charObj.lineIndex] = [];
    }
    linesMap[charObj.lineIndex].push(charObj);
  });
  
  Object.keys(linesMap).forEach(lineIndex => {
    const lineChars = linesMap[lineIndex];
    let indentCount = 0;
    while (indentCount < lineChars.length && (lineChars[indentCount].char === ' ' || lineChars[indentCount].char === '\t')) {
      indentCount++;
    }
    for (let i = 0; i < indentCount; i++) {
      lineChars[i].isIndent = true;
    }
  });
  
  return chars;
}

// --- Render Editor Code ---
function renderCode(chars, container) {
  container.innerHTML = '';
  
  // Group characters by lineIndex
  const lines = [];
  chars.forEach(charObj => {
    if (!lines[charObj.lineIndex]) {
      lines[charObj.lineIndex] = [];
    }
    lines[charObj.lineIndex].push(charObj);
  });
  
  lines.forEach((lineChars, lIdx) => {
    const lineDiv = document.createElement('div');
    lineDiv.className = 'code-line';
    lineDiv.dataset.line = lIdx;
    
    lineChars.forEach(charObj => {
      const span = document.createElement('span');
      span.className = `char ${charObj.type}`;
      if (charObj.isIndent) {
        span.classList.add('indent');
      }
      
      // Store DOM reference directly in state object
      charObj.element = span;
      
      if (charObj.char === '\n') {
        span.innerHTML = '↵';
        span.classList.add('newline');
      } else if (charObj.char === ' ') {
        span.innerHTML = '&nbsp;';
        span.classList.add('space');
      } else {
        span.textContent = charObj.char;
      }
      
      lineDiv.appendChild(span);
    });
    
    container.appendChild(lineDiv);
  });
  
  // Add caret cursor
  const caret = document.createElement('div');
  caret.className = 'caret';
  container.appendChild(caret);
}

// --- Smooth Caret Positioning ---
function updateCaret(caret, activeElement) {
  if (!activeElement || !caret) return;
  
  const parent = caret.parentElement;
  const parentRect = parent.getBoundingClientRect();
  const rect = activeElement.getBoundingClientRect();
  
  const left = rect.left - parentRect.left + parent.scrollLeft;
  const top = rect.top - parentRect.top + parent.scrollTop;
  
  caret.style.left = `${left}px`;
  caret.style.top = `${top}px`;
  caret.style.height = `${rect.height}px`;
  
  // Prevent caret blink during active typing
  caret.classList.add('typing');
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    caret.classList.remove('typing');
  }, 500);
}

// --- UI Sync Engine ---
function updateEditorUI() {
  characters.forEach((charObj, idx) => {
    if (!charObj.element) return;
    
    // Efficiently update styling state without replacing nodes
    charObj.element.classList.remove('pending', 'correct', 'incorrect', 'active');
    
    if (idx === currentIndex) {
      charObj.element.classList.add('active');
    }
    charObj.element.classList.add(charObj.state);
  });
  
  // Place caret and scroll container
  const activeSpan = characters[currentIndex]?.element;
  const caret = document.querySelector('.caret');
  
  if (activeSpan && caret) {
    updateCaret(caret, activeSpan);
    
    // Auto-scroll terminal container
    const terminalBody = codeEditorBody;
    const terminalRect = terminalBody.getBoundingClientRect();
    const activeRect = activeSpan.getBoundingClientRect();
    
    if (activeRect.bottom > terminalRect.bottom - 40) {
      terminalBody.scrollTop += (activeRect.bottom - terminalRect.bottom + 40);
    } else if (activeRect.top < terminalRect.top + 40) {
      terminalBody.scrollTop -= (terminalRect.top - activeRect.top + 40);
    }
  } else if (currentIndex >= characters.length && caret) {
    // Session complete, lock caret at the end of last character
    const lastSpan = characters[characters.length - 1]?.element;
    if (lastSpan) {
      const parent = caret.parentElement;
      const parentRect = parent.getBoundingClientRect();
      const rect = lastSpan.getBoundingClientRect();
      
      const left = rect.right - parentRect.left + parent.scrollLeft;
      const top = rect.top - parentRect.top + parent.scrollTop;
      
      caret.style.left = `${left}px`;
      caret.style.top = `${top}px`;
      caret.style.height = `${rect.height}px`;
    }
  }
}

// --- Live WPM & Accuracy calculator ---
function updateMetrics() {
  if (!startTime) return;
  
  const timeElapsed = (Date.now() - startTime) / 1000;
  
  // Only count correct non-indent characters to prevent false high speeds
  const correctTypedCount = characters.filter((c, idx) => c.state === 'correct' && !c.isIndent && idx < currentIndex).length;
  
  // Net Speed calculation
  const timeInMinutes = timeElapsed / 60;
  const wpm = timeInMinutes > 0 ? Math.round((correctTypedCount / 5) / timeInMinutes) : 0;
  
  // Accuracy calculation
  const accuracy = totalKeystrokes > 0 ? Math.round((correctTypedCount / totalKeystrokes) * 100) : 100;
  
  // Inject text content
  liveWpm.textContent = wpm;
  liveAccuracy.textContent = `${accuracy}%`;
  liveTime.textContent = `${timeElapsed.toFixed(1)}s`;
  liveMistakes.textContent = mistakes;
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    updateMetrics();
  }, 100);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// --- Typing State Management ---
function startSession(problem) {
  selectedProblem = problem;
  characters = buildCharacterList(problem.code);
  currentIndex = 0;
  startTime = null;
  endTime = null;
  mistakes = 0;
  totalKeystrokes = 0;
  
  // Update problem details
  activeProblemTitle.textContent = problem.title;
  activeProblemDifficulty.className = `difficulty-badge ${problem.difficulty}`;
  activeProblemDifficulty.textContent = problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1);
  activeProblemDesc.textContent = problem.description;
  
  // Clean live metrics
  liveWpm.textContent = '0';
  liveAccuracy.textContent = '100%';
  liveTime.textContent = '0.0s';
  liveMistakes.textContent = '0';
  typingStatusText.textContent = 'Ready to type';
  
  // Render structure
  renderCode(characters, codeEditorBody);
  
  // Switch to typing screen
  changeScreen('typing');
  
  // Auto-skip leading whitespace on the first line
  skipIndentation();
  updateEditorUI();
}

function skipIndentation() {
  while (currentIndex < characters.length && characters[currentIndex].isIndent) {
    characters[currentIndex].state = 'correct';
    characters[currentIndex].typedChar = characters[currentIndex].char;
    currentIndex++;
  }
}

function handleCharInput(typedChar) {
  if (currentIndex >= characters.length) return;
  
  // Launch timer on first keystroke
  if (!startTime) {
    startTime = Date.now();
    startTimer();
    typingStatusText.textContent = 'Typing...';
  }
  
  const expectedChar = characters[currentIndex].char;
  
  totalKeystrokes++;
  
  if (typedChar === expectedChar) {
    characters[currentIndex].state = 'correct';
    characters[currentIndex].typedChar = typedChar;
    currentIndex++;
    skipIndentation();
  } else {
    characters[currentIndex].state = 'incorrect';
    characters[currentIndex].typedChar = typedChar;
    mistakes++;
    currentIndex++;
    skipIndentation();
  }
  
  updateEditorUI();
  updateMetrics();
  
  // End session if all code typed
  if (currentIndex >= characters.length) {
    finishSession();
  }
}

function handleBackspace() {
  if (currentIndex <= 0) return;
  
  currentIndex--;
  
  // Auto-rewind past indentation characters on current line
  while (currentIndex > 0 && characters[currentIndex].isIndent) {
    characters[currentIndex].state = 'pending';
    characters[currentIndex].typedChar = null;
    currentIndex--;
  }
  
  // Reset character that the user manually typed
  characters[currentIndex].state = 'pending';
  characters[currentIndex].typedChar = null;
  
  updateEditorUI();
  updateMetrics();
}

function resetSession() {
  if (selectedProblem) {
    startSession(selectedProblem);
  }
}

function finishSession() {
  stopTimer();
  endTime = Date.now();
  
  const timeElapsed = (endTime - startTime) / 1000;
  const correctTypedCount = characters.filter((c, idx) => c.state === 'correct' && !c.isIndent).length;
  
  const timeInMinutes = timeElapsed / 60;
  const finalWpm = timeInMinutes > 0 ? Math.round((correctTypedCount / 5) / timeInMinutes) : 0;
  const finalAccuracy = totalKeystrokes > 0 ? Math.round((correctTypedCount / totalKeystrokes) * 1000) / 10 : 100;
  
  // Populate results dashboard
  resultsProblemTitle.textContent = selectedProblem.title;
  resultWpm.textContent = finalWpm;
  resultAccuracy.textContent = `${finalAccuracy}%`;
  resultTime.textContent = `${timeElapsed.toFixed(1)}s`;
  resultMistakes.textContent = mistakes;
  
  // Slide to results screen
  changeScreen('results');
}

// --- Event Listeners ---

// Focus Capturing
typingInput.addEventListener('focus', () => {
  focusOverlay.classList.add('hidden');
  typingStatusText.textContent = startTime ? 'Typing...' : 'Ready to type';
  typingStatusText.parentElement.querySelector('.status-indicator-dot').classList.add('typing-status');
});

typingInput.addEventListener('blur', () => {
  if (currentScreen === 'typing') {
    focusOverlay.classList.remove('hidden');
    typingStatusText.textContent = 'Paused (click editor to resume)';
    typingStatusText.parentElement.querySelector('.status-indicator-dot').classList.remove('typing-status');
  }
});

// Click editor container to focus textarea
document.getElementById('typing-section').addEventListener('click', (e) => {
  if (currentScreen === 'typing') {
    typingInput.focus();
  }
});

// Global Shortcuts and Typestream Capturing
typingInput.addEventListener('keydown', (e) => {
  if (currentScreen !== 'typing') return;
  
  // Escape key to reset session
  if (e.key === 'Escape') {
    e.preventDefault();
    resetSession();
    return;
  }
  
  // Ctrl + R shortcut support (standard in typing trainers)
  if (e.ctrlKey && e.key.toLowerCase() === 'r') {
    e.preventDefault();
    resetSession();
    return;
  }
  
  // Backspace handler
  if (e.key === 'Backspace') {
    e.preventDefault();
    handleBackspace();
    return;
  }
  
  let typed = e.key;
  if (typed === 'Enter') {
    typed = '\n';
  }
  
  // Ignore modifier / cursor keys
  if (e.key.length > 1 && e.key !== 'Enter') {
    return;
  }
  
  // Intercept standard input to prevent page actions (e.g. spacebar scrolling down)
  e.preventDefault();
  handleCharInput(typed);
});

// Back Navigation
btnBackToList.addEventListener('click', () => {
  changeScreen('list');
});

btnBackToProblems.addEventListener('click', () => {
  changeScreen('list');
});

btnRetry.addEventListener('click', () => {
  resetSession();
});

logoHeader.addEventListener('click', () => {
  changeScreen('list');
});

// Search & Filter Events
problemSearchInput.addEventListener('input', filterProblems);

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    filterProblems();
  });
});

// Initialise App
function init() {
  renderProblemsList(problems);
  changeScreen('list');
}

window.addEventListener('DOMContentLoaded', init);
