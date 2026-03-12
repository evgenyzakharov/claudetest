# Code Review: calculator.html (original)

**Reviewer:** Claude
**Date:** 2026-03-12
**Status:** ✅ Fixed in refactor

---

## Summary

The calculator works correctly for the happy path but has **3 bugs** in error-state
handling, **1 code quality issue** (duplicated constant), and **1 architectural problem**
that makes unit testing impossible (logic coupled to the DOM).

---

## 🔴 BUG-1 — `toggleSign()` does not handle error state

**Location:** `toggleSign()`, original line 218
**Severity:** Medium

```js
// Before (broken)
function toggleSign() {
  current = (parseFloat(current) * -1).toString();
  // parseFloat('Ошибка') → NaN  →  NaN * -1 → NaN
}
```

When the display shows `'Ошибка'` (division by zero), calling `toggleSign()` sets
`current = 'NaN'`. Subsequent operations on `NaN` propagate further `NaN` values.

```js
// After (fixed)
toggleSign() {
  if (this._current === Calculator.ERROR) { return this; }
  // ...
}
```

---

## 🔴 BUG-2 — `percent()` does not handle error state

**Location:** `percent()`, original line 222
**Severity:** Medium

Same root cause as BUG-1: `parseFloat('Ошибка') / 100` produces `NaN`.

```js
// After (fixed)
percent() {
  if (this._current === Calculator.ERROR) { return this; }
  // ...
}
```

---

## 🟡 BUG-3 — `Backspace` key modifies the error string

**Location:** keyboard handler, original line 237
**Severity:** Low

```js
// Before (broken)
current = current.length > 1 ? current.slice(0, -1) : '0';
// 'Ошибка' → 'Ошибк' → 'Ошибк' → …
```

When `current = 'Ошибка'`, pressing Backspace removes characters one by one from the
error string. The user can clear it by pressing a digit (since `resetNext = true`),
so this is only a visual glitch — but still unexpected behaviour.

```js
// After (fixed)
backspace() {
  if (this._current === Calculator.ERROR || this._resetNext) { return this; }
  // ...
}
```

---

## 🟡 QUALITY-1 — `symbols` object defined twice

**Location:** `setOperator()` line 184 and `calculate()` line 192

```js
// Same object copy-pasted in two places
const symbols = { '+': '+', '-': '−', '*': '×', '/': '÷' };
```

If a symbol ever needs changing, it must be updated in both places.

```js
// After (fixed) — single source of truth
Calculator.SYMBOLS = { '+': '+', '-': '−', '*': '×', '/': '÷' };
```

---

## 🔵 ARCH-1 — Logic is coupled to the DOM

**Location:** entire `<script>` block
**Severity:** High (maintainability / testability)

Every function reads or writes `resultEl.textContent` and `expressionEl.textContent`
directly. There is no way to test the calculation logic without spinning up a browser.

```js
// After (fixed) — pure Calculator class, no DOM access
// UI layer is ~10 lines that call class methods and read .display / .expression
const calc = new Calculator();
function onCalculate() { calc.calculate(); updateDisplay(); }
```

The `Calculator` class can now be imported in Node.js and tested with Jest.

---

## What Was Changed

| # | Issue | Fix |
|---|-------|-----|
| BUG-1 | `toggleSign()` → NaN on error | Guard: `if ERROR return this` |
| BUG-2 | `percent()` → NaN on error | Guard: `if ERROR return this` |
| BUG-3 | Backspace trims error string | Guard: `if ERROR or resetNext return this` |
| QUALITY-1 | `symbols` duplicated | `Calculator.SYMBOLS` static constant |
| ARCH-1 | Logic + DOM coupled | `Calculator` class extracted to `calculator.js` |

**New:** `backspace()` promoted to a proper class method (was only in the keyboard handler).
