'use strict';

class Calculator {
  constructor() {
    this._current = '0';
    this._previous = null;
    this._operator = null;
    this._resetNext = false;
    this._expression = '';
    this._history = [];
  }

  get display() { return this._current; }
  get expression() { return this._expression; }
  get history() { return [...this._history]; }

  input(digit) {
    if (this._current === Calculator.ERROR) {
      this._current = digit === '0' ? '0' : digit;
      return this;
    }
    if (this._resetNext) {
      this._current = digit;
      this._resetNext = false;
    } else {
      this._current = this._current === '0' ? digit : this._current + digit;
    }
    const limit = this._current.startsWith('-') ? Calculator.MAX_DIGITS + 1 : Calculator.MAX_DIGITS;
    if (this._current.length > limit) {
      this._current = this._current.slice(0, limit);
    }
    return this;
  }

  inputDot() {
    if (this._current === Calculator.ERROR) {
      this._current = '0.';
      return this;
    }
    if (this._resetNext) {
      this._current = '0.';
      this._resetNext = false;
      return this;
    }
    if (!this._current.includes('.')) {
      this._current += '.';
    }
    return this;
  }

  setOperator(op) {
    if (this._current === Calculator.ERROR) { return this; }
    if (this._operator !== null && !this._resetNext) {
      this._compute(false);
      if (this._current === Calculator.ERROR) { return this; }
    }
    this._previous = parseFloat(this._current);
    this._operator = op;
    this._resetNext = true;
    this._expression = `${this._previous} ${Calculator.SYMBOLS[op]}`;
    return this;
  }

  calculate() {
    if (this._operator === null || this._previous === null) { return this; }
    this._compute(true);
    return this;
  }

  _compute(showEquals) {
    const a = this._previous;
    const b = parseFloat(this._current);

    if (showEquals) {
      this._expression = `${a} ${Calculator.SYMBOLS[this._operator]} ${b} =`;
    }

    let result;
    switch (this._operator) {
      case '+': result = a + b; break;
      case '-': result = a - b; break;
      case '*': result = a * b; break;
      case '/':
        if (b === 0) {
          this._current = Calculator.ERROR;
          this._operator = null;
          this._previous = null;
          this._resetNext = true;
          return;
        }
        result = a / b;
        break;
      default:
        return;
    }

    if (!isFinite(result)) {
      this._current = Calculator.ERROR;
      this._operator = null;
      this._previous = null;
      this._resetNext = true;
      return;
    }
    this._current = parseFloat(result.toFixed(10)).toString();
    if (showEquals) {
      this._history.unshift({ expression: this._expression, result: this._current });
      if (this._history.length > Calculator.MAX_HISTORY) {
        this._history.pop();
      }
    }
    this._operator = null;
    this._previous = null;
    this._resetNext = true;
  }

  backspace() {
    if (this._current === Calculator.ERROR || this._resetNext) { return this; }
    this._current = this._current.length > 1 ? this._current.slice(0, -1) : '0';
    return this;
  }

  clearAll() {
    this._current = '0';
    this._previous = null;
    this._operator = null;
    this._resetNext = false;
    this._expression = '';
    return this;
  }

  clearHistory() {
    this._history = [];
    return this;
  }

  useHistoryResult(index) {
    const entry = this._history[index];
    if (!entry) { return this; }
    this._current = entry.result;
    this._resetNext = true;
    this._expression = '';
    return this;
  }

  toggleSign() {
    if (this._current === Calculator.ERROR || this._current === '0') { return this; }
    this._current = this._current.startsWith('-')
      ? this._current.slice(1)
      : '-' + this._current;
    return this;
  }

  percent() {
    if (this._current === Calculator.ERROR) { return this; }
    this._current = parseFloat((parseFloat(this._current) / 100).toFixed(10)).toString();
    return this;
  }
}

Calculator.SYMBOLS = { '+': '+', '-': '−', '*': '×', '/': '÷' };
Calculator.MAX_DIGITS = 12;
Calculator.MAX_HISTORY = 50;
Calculator.ERROR = 'Error';

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Calculator };
}
