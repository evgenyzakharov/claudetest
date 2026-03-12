'use strict';

const { Calculator } = require('./calculator');

describe('Calculator', () => {
  let calc;

  beforeEach(() => {
    calc = new Calculator();
  });

  // ─── Initial state ────────────────────────────────────────────────────────
  describe('initial state', () => {
    test('display shows 0', () => {
      expect(calc.display).toBe('0');
    });

    test('expression is empty', () => {
      expect(calc.expression).toBe('');
    });
  });

  // ─── input() ──────────────────────────────────────────────────────────────
  describe('input(digit)', () => {
    test('replaces initial zero', () => {
      calc.input('5');
      expect(calc.display).toBe('5');
    });

    test('appends subsequent digits', () => {
      calc.input('1').input('2').input('3');
      expect(calc.display).toBe('123');
    });

    test('does not create leading zeros', () => {
      calc.input('0').input('0').input('0');
      expect(calc.display).toBe('0');
    });

    test('allows 0 after other digits', () => {
      calc.input('5').input('0');
      expect(calc.display).toBe('50');
    });

    test('resets display after calculate()', () => {
      calc.input('5').setOperator('+').input('3').calculate().input('9');
      expect(calc.display).toBe('9');
    });

    test('resets display after setOperator()', () => {
      calc.input('5').setOperator('+').input('7');
      expect(calc.display).toBe('7');
    });

    test('limits to MAX_DIGITS characters', () => {
      for (let i = 0; i < 20; i++) { calc.input('1'); }
      expect(calc.display.length).toBeLessThanOrEqual(Calculator.MAX_DIGITS);
    });

    test('recovers from error state', () => {
      calc.input('5').setOperator('/').input('0').calculate();
      calc.input('7');
      expect(calc.display).toBe('7');
    });
  });

  // ─── inputDot() ───────────────────────────────────────────────────────────
  describe('inputDot()', () => {
    test('appends decimal point', () => {
      calc.input('3').inputDot();
      expect(calc.display).toBe('3.');
    });

    test('does not add a second decimal point', () => {
      calc.input('3').inputDot().inputDot().inputDot();
      expect(calc.display).toBe('3.');
    });

    test('starts with 0. when resetNext is active', () => {
      calc.input('5').setOperator('+').inputDot();
      expect(calc.display).toBe('0.');
    });

    test('allows decimal digits after dot', () => {
      calc.input('3').inputDot().input('1').input('4');
      expect(calc.display).toBe('3.14');
    });

    test('recovers from error state to 0.', () => {
      calc.input('1').setOperator('/').input('0').calculate();
      calc.inputDot();
      expect(calc.display).toBe('0.');
    });
  });

  // ─── setOperator() ────────────────────────────────────────────────────────
  describe('setOperator(op)', () => {
    test('keeps current value in display', () => {
      calc.input('5').setOperator('+');
      expect(calc.display).toBe('5');
    });

    test('sets expression for +', () => {
      calc.input('5').setOperator('+');
      expect(calc.expression).toBe('5 +');
    });

    test('sets expression for −', () => {
      calc.input('5').setOperator('-');
      expect(calc.expression).toBe('5 −');
    });

    test('sets expression for ×', () => {
      calc.input('5').setOperator('*');
      expect(calc.expression).toBe('5 ×');
    });

    test('sets expression for ÷', () => {
      calc.input('5').setOperator('/');
      expect(calc.expression).toBe('5 ÷');
    });

    test('chains: computes previous result before setting new operator', () => {
      calc.input('5').setOperator('+').input('3').setOperator('*');
      expect(calc.display).toBe('8');
      expect(calc.expression).toBe('8 ×');
    });

    test('does nothing in error state', () => {
      calc.input('1').setOperator('/').input('0').calculate();
      calc.setOperator('+');
      expect(calc.display).toBe(Calculator.ERROR);
    });
  });

  // ─── calculate() ──────────────────────────────────────────────────────────
  describe('calculate()', () => {
    test('adds two numbers', () => {
      calc.input('5').setOperator('+').input('3').calculate();
      expect(calc.display).toBe('8');
    });

    test('subtracts two numbers', () => {
      calc.input('9').setOperator('-').input('4').calculate();
      expect(calc.display).toBe('5');
    });

    test('multiplies two numbers', () => {
      calc.input('6').setOperator('*').input('7').calculate();
      expect(calc.display).toBe('42');
    });

    test('divides two numbers', () => {
      calc.input('1').input('0').setOperator('/').input('2').calculate();
      expect(calc.display).toBe('5');
    });

    test('returns Error on division by zero', () => {
      calc.input('5').setOperator('/').input('0').calculate();
      expect(calc.display).toBe(Calculator.ERROR);
    });

    test('handles 0.1 + 0.2 without floating-point artifacts', () => {
      calc.input('0').inputDot().input('1')
        .setOperator('+')
        .input('0').inputDot().input('2')
        .calculate();
      expect(calc.display).toBe('0.3');
    });

    test('does nothing if no operator is set', () => {
      calc.input('5').calculate();
      expect(calc.display).toBe('5');
    });

    test('updates expression with = sign', () => {
      calc.input('5').setOperator('+').input('3').calculate();
      expect(calc.expression).toBe('5 + 3 =');
    });

    test('handles negative results', () => {
      calc.input('3').setOperator('-').input('7').calculate();
      expect(calc.display).toBe('-4');
    });

    test('handles decimal results', () => {
      calc.input('1').setOperator('/').input('4').calculate();
      expect(calc.display).toBe('0.25');
    });

    test('result can immediately start a new operation', () => {
      calc.input('5').setOperator('+').input('3').calculate();
      calc.setOperator('*').input('2').calculate();
      expect(calc.display).toBe('16');
    });
  });

  // ─── clearAll() ───────────────────────────────────────────────────────────
  describe('clearAll()', () => {
    test('resets display to 0', () => {
      calc.input('5').input('3').clearAll();
      expect(calc.display).toBe('0');
    });

    test('clears expression', () => {
      calc.input('5').setOperator('+').clearAll();
      expect(calc.expression).toBe('');
    });

    test('clears error state', () => {
      calc.input('1').setOperator('/').input('0').calculate().clearAll();
      expect(calc.display).toBe('0');
      expect(calc.expression).toBe('');
    });

    test('allows fresh input after clear', () => {
      calc.input('5').clearAll().input('3');
      expect(calc.display).toBe('3');
    });
  });

  // ─── toggleSign() ─────────────────────────────────────────────────────────
  describe('toggleSign()', () => {
    test('negates a positive number', () => {
      calc.input('5').toggleSign();
      expect(calc.display).toBe('-5');
    });

    test('un-negates a negative number', () => {
      calc.input('5').toggleSign().toggleSign();
      expect(calc.display).toBe('5');
    });

    test('does nothing to 0', () => {
      calc.toggleSign();
      expect(calc.display).toBe('0');
    });

    test('does nothing in error state', () => {
      calc.input('1').setOperator('/').input('0').calculate().toggleSign();
      expect(calc.display).toBe(Calculator.ERROR);
    });

    test('preserves decimal part', () => {
      calc.input('3').inputDot().input('5').toggleSign();
      expect(calc.display).toBe('-3.5');
    });

    test('un-negates decimal number', () => {
      calc.input('3').inputDot().input('5').toggleSign().toggleSign();
      expect(calc.display).toBe('3.5');
    });
  });

  // ─── percent() ────────────────────────────────────────────────────────────
  describe('percent()', () => {
    test('divides by 100', () => {
      calc.input('5').input('0').percent();
      expect(calc.display).toBe('0.5');
    });

    test('100% = 1', () => {
      calc.input('1').input('0').input('0').percent();
      expect(calc.display).toBe('1');
    });

    test('does nothing in error state', () => {
      calc.input('1').setOperator('/').input('0').calculate().percent();
      expect(calc.display).toBe(Calculator.ERROR);
    });
  });

  // ─── backspace() ──────────────────────────────────────────────────────────
  describe('backspace()', () => {
    test('removes last digit', () => {
      calc.input('1').input('2').input('3').backspace();
      expect(calc.display).toBe('12');
    });

    test('returns 0 when single digit remains', () => {
      calc.input('5').backspace();
      expect(calc.display).toBe('0');
    });

    test('removes decimal point', () => {
      calc.input('3').inputDot().backspace();
      expect(calc.display).toBe('3');
    });

    test('does nothing in error state', () => {
      calc.input('1').setOperator('/').input('0').calculate().backspace();
      expect(calc.display).toBe(Calculator.ERROR);
    });

    test('does nothing when resetNext is active (after operator)', () => {
      calc.input('5').setOperator('+').backspace();
      expect(calc.display).toBe('5');
    });
  });

  // ─── Integration ──────────────────────────────────────────────────────────
  describe('chained operations', () => {
    test('5 + 3 + 2 = 10', () => {
      calc.input('5').setOperator('+').input('3').setOperator('+').input('2').calculate();
      expect(calc.display).toBe('10');
    });

    test('5 + 3 * 2 = 16 (left-to-right, no precedence)', () => {
      calc.input('5').setOperator('+').input('3').setOperator('*').input('2').calculate();
      expect(calc.display).toBe('16');
    });

    test('clear mid-operation starts fresh', () => {
      calc.input('5').setOperator('+').clearAll().input('3').setOperator('*').input('4').calculate();
      expect(calc.display).toBe('12');
    });

    test('full sequence: ((10 / 2) - 1) * 3 = 12', () => {
      calc.input('1').input('0').setOperator('/').input('2')
        .setOperator('-').input('1')
        .setOperator('*').input('3')
        .calculate();
      expect(calc.display).toBe('12');
    });
  });
});
