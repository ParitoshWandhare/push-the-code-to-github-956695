// Calculator State
let currentOperand = '0';
let previousOperand = '';
let currentOperation = null;
let shouldResetDisplay = false;
let history = [];

// DOM Elements
const primaryDisplay = document.getElementById('primary-display');
const expressionDisplay = document.getElementById('expression-display');
const historyList = document.getElementById('history-list');
const historyPanel = document.getElementById('history-panel');
const historyToggle = document.getElementById('history-toggle');
const clearHistoryBtn = document.getElementById('clear-history');
const themeToggle = document.getElementById('theme-toggle');
const themeIconSun = document.getElementById('theme-icon-sun');
const themeIconMoon = document.getElementById('theme-icon-moon');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadThemePreference();
  loadHistory();
  updateDisplay();
});

function setupEventListeners() {
  // Keypad clicks
  document.querySelectorAll('.key').forEach((key) => {
    key.addEventListener('click', () => {
      const action = key.dataset.action;
      const value = key.dataset.value;

      if (!action) {
        appendNumber(value);
      } else {
        handleAction(action, value);
      }
      updateDisplay();
    });
  });

  // History controls
  if (historyToggle) historyToggle.addEventListener('click', toggleHistoryPanel);
  if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', clearHistory);

  // Theme switch
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

  // Keyboard shortcut listener
  window.addEventListener('keydown', handleKeyboardInput);
}

function handleAction(action, value) {
  switch (action) {
    case 'clear':
      clear();
      break;
    case 'backspace':
      backspace();
      break;
    case 'percentage':
      calculatePercentage();
      break;
    case 'negate':
      toggleNegative();
      break;
    case 'operator':
      chooseOperation(value);
      break;
    case 'equals':
      calculate();
      break;
  }
}

function appendNumber(number) {
  if (number === '.') {
    if (shouldResetDisplay) {
      currentOperand = '0.';
      shouldResetDisplay = false;
      return;
    }
    if (currentOperand.includes('.')) return;
  }

  if (currentOperand === '0' || shouldResetDisplay) {
    currentOperand = number === '.' ? '0.' : number;
    shouldResetDisplay = false;
  } else {
    currentOperand += number;
  }
}

function chooseOperation(operation) {
  if (currentOperation !== null && !shouldResetDisplay) {
    calculate();
  }
  previousOperand = currentOperand;
  currentOperation = operation;
  shouldResetDisplay = true;
}

function calculate() {
  if (currentOperation === null || shouldResetDisplay) return;

  const prev = parseFloat(previousOperand);
  const current = parseFloat(currentOperand);
  if (Number.isNaN(prev) || Number.isNaN(current)) return;

  let result = 0;
  switch (currentOperation) {
    case '+':
      result = prev + current;
      break;
    case '-':
      result = prev - current;
      break;
    case '×':
      result = prev * current;
      break;
    case '÷':
      if (current === 0) {
        currentOperand = 'Error';
        previousOperand = '';
        currentOperation = null;
        shouldResetDisplay = true;
        updateDisplay();
        return;
      }
      result = prev / current;
      break;
    default:
      return;
  }

  saveCalculationToHistory(`${previousOperand} ${currentOperation} ${currentOperand}`, result);
  currentOperand = formatResult(result);
  currentOperation = null;
  previousOperand = '';
  shouldResetDisplay = true;
}

function calculatePercentage() {
  const current = parseFloat(currentOperand);
  if (Number.isNaN(current)) return;
  currentOperand = formatResult(current / 100);
}

function toggleNegative() {
  if (currentOperand === '0' || currentOperand === 'Error') return;
  if (currentOperand.startsWith('-')) {
    currentOperand = currentOperand.slice(1);
  } else {
    currentOperand = `-${currentOperand}`;
  }
}

function clear() {
  currentOperand = '0';
  previousOperand = '';
  currentOperation = null;
  shouldResetDisplay = false;
}

function backspace() {
  if (shouldResetDisplay || currentOperand === 'Error') {
    clear();
    return;
  }
  if (currentOperand.length > 1) {
    currentOperand = currentOperand.slice(0, -1);
    if (currentOperand === '-') currentOperand = '0';
  } else {
    currentOperand = '0';
  }
}

function updateDisplay() {
  if (primaryDisplay) {
    primaryDisplay.textContent = currentOperand;
  }
  if (expressionDisplay) {
    if (currentOperation !== null) {
      expressionDisplay.textContent = `${previousOperand} ${currentOperation}`;
    } else {
      expressionDisplay.innerHTML = '&nbsp;';
    }
  }
}

function formatResult(number) {
  const rounded = Number(Math.round(Number(number + 'e10')) + 'e-10');
  return rounded.toString();
}

function saveCalculationToHistory(expression, result) {
  const formattedResult = formatResult(result);
  history.unshift({ expression, result: formattedResult });
  if (history.length > 20) history.pop();
  try {
    localStorage.setItem('calcHistory', JSON.stringify(history));
  } catch (err) {
    console.warn('Storage unavailable', err);
  }
  updateHistoryDisplay();
}

function loadHistory() {
  try {
    const saved = localStorage.getItem('calcHistory');
    if (saved) {
      history = JSON.parse(saved);
    }
  } catch (err) {
    history = [];
  }
  updateHistoryDisplay();
}

function updateHistoryDisplay() {
  if (!historyList) return;
  if (history.length === 0) {
    historyList.innerHTML = '<p class="history-empty">No calculations yet</p>';
    return;
  }

  historyList.innerHTML = history
    .map(
      (item) => `
    <div class="history-item" tabindex="0" role="button" aria-label="Use ${item.result}">
      <div class="history-expression">${item.expression}</div>
      <div class="history-result">${item.result}</div>
    </div>
  `
    )
    .join('');

  historyList.querySelectorAll('.history-item').forEach((item, index) => {
    item.addEventListener('click', () => {
      currentOperand = history[index].result;
      shouldResetDisplay = true;
      updateDisplay();
    });
  });
}

function clearHistory() {
  history = [];
  try {
    localStorage.removeItem('calcHistory');
  } catch (err) {
    console.warn(err);
  }
  updateHistoryDisplay();
}

function toggleHistoryPanel() {
  if (historyPanel) {
    historyPanel.classList.toggle('hidden');
  }
}

function toggleTheme() {
  const isDark = document.body.getAttribute('data-theme') === 'dark';
  const newTheme = isDark ? 'light' : 'dark';
  applyTheme(newTheme);
}

function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  try {
    localStorage.setItem('calcTheme', theme);
  } catch (err) {
    console.warn(err);
  }
  if (themeIconSun && themeIconMoon) {
    if (theme === 'dark') {
      themeIconSun.classList.add('hidden');
      themeIconMoon.classList.remove('hidden');
    } else {
      themeIconSun.classList.remove('hidden');
      themeIconMoon.classList.add('hidden');
    }
  }
}

function loadThemePreference() {
  let savedTheme = 'light';
  try {
    savedTheme = localStorage.getItem('calcTheme') || 'light';
  } catch (err) {
    savedTheme = 'light';
  }
  applyTheme(savedTheme);
}

function handleKeyboardInput(e) {
  if ((e.key >= '0' && e.key <= '9') || e.key === '.') {
    appendNumber(e.key);
  } else if (e.key === '+') {
    chooseOperation('+');
  } else if (e.key === '-') {
    chooseOperation('-');
  } else if (e.key === '*' || e.key === 'x' || e.key === 'X') {
    chooseOperation('×');
  } else if (e.key === '/') {
    e.preventDefault();
    chooseOperation('÷');
  } else if (e.key === 'Enter' || e.key === '=') {
    e.preventDefault();
    calculate();
  } else if (e.key === 'Backspace') {
    backspace();
  } else if (e.key === 'Escape') {
    clear();
  } else if (e.key === '%') {
    calculatePercentage();
  }
  updateDisplay();
}