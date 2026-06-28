(function (root) {
  "use strict";

  if (typeof require === "function") {
    require("../../racionales.js");
    require("../../math-renderer.js");
    require("../../math-content.js");
  }

  const MathRenderer = root.TrigMathRenderer || {};
  const MathContent = root.TrigMathContent || {};
  const Rational = root.TrigRationalUtils || {};
  const {
    rational,
    multiplyInt,
    divide,
    rationalPlain,
    rationalLatex,
    rationalKey,
  } = Rational;
  const { mathInline, mathBlock, contentNode } = MathContent;

  function parensLatex(content) {
    return `\\left(${content}\\right)`;
  }

  function absLatex(content) {
    return `\\left|${content}\\right|`;
  }

  function formatArgumentPlain(kValue, bValue) {
    const k = kValue.n;
    const b = bValue.n;
    let xPart;
    if (k === 1) {
      xPart = "x";
    } else if (k === -1) {
      xPart = "-x";
    } else {
      xPart = `${k}x`;
    }
    if (b === 0) {
      return xPart;
    }
    return b > 0 ? `${xPart} + ${b}` : `${xPart} - ${Math.abs(b)}`;
  }

  function formatArgumentLatex(kValue, bValue) {
    return formatArgumentPlain(kValue, bValue);
  }

  function createArgument(kValue, bValue) {
    const k = typeof kValue === "number" ? rational(kValue, 1) : kValue;
    const b = typeof bValue === "number" ? rational(bValue, 1) : bValue;
    return {
      k,
      b,
      display: formatArgumentPlain(k, b),
      displayLatex: formatArgumentLatex(k, b),
      key: `${rationalKey(k)}|${rationalKey(b)}`,
    };
  }

  function coefficientPrefixPlain(coefficient) {
    if (coefficient.n === 1 && coefficient.d === 1) {
      return "";
    }
    if (coefficient.n === -1 && coefficient.d === 1) {
      return "-";
    }
    return coefficient.d === 1
      ? `${coefficient.n}`
      : `(${rationalPlain(coefficient)})`;
  }

  function coefficientPrefixLatex(coefficient) {
    if (coefficient.n === 1 && coefficient.d === 1) {
      return "";
    }
    if (coefficient.n === -1 && coefficient.d === 1) {
      return "-";
    }
    return rationalLatex(coefficient);
  }

  function powerPlain(argument, exponent) {
    const base = `(${argument.display})`;
    return exponent === 1 ? base : `${base}^${exponent < 0 ? `(${exponent})` : exponent}`;
  }

  function powerLatex(argument, exponent) {
    const base = parensLatex(argument.displayLatex);
    return exponent === 1 ? base : `${base}^{${exponent}}`;
  }

  function powerTermPlain(coefficient, argument, exponent) {
    const prefix = coefficientPrefixPlain(coefficient);
    return `${prefix}${powerPlain(argument, exponent)}`;
  }

  function powerTermLatex(coefficient, argument, exponent) {
    return `${coefficientPrefixLatex(coefficient)}${powerLatex(argument, exponent)}`;
  }

  function logTermPlain(coefficient, argument) {
    const prefix = coefficientPrefixPlain(coefficient);
    return `${prefix}ln |${argument.display}|`;
  }

  function logTermLatex(coefficient, argument) {
    return `${coefficientPrefixLatex(coefficient)}\\ln ${absLatex(argument.displayLatex)}`;
  }

  function expressionPlain(option) {
    const body =
      option.answerKind === "log"
        ? logTermPlain(option.coefficient, option.argument)
        : powerTermPlain(option.coefficient, option.argument, option.exponent);
    return `${body} + C`;
  }

  function expressionLatex(option) {
    const body =
      option.answerKind === "log"
        ? logTermLatex(option.coefficient, option.argument)
        : powerTermLatex(option.coefficient, option.argument, option.exponent);
    return `${body} + C`;
  }

  function reciprocalPlain(coefficient, argument) {
    if (coefficient.n === 1 && coefficient.d === 1) {
      return `1 / (${argument.display})`;
    }
    if (coefficient.n === -1 && coefficient.d === 1) {
      return `-1 / (${argument.display})`;
    }
    return `${rationalPlain(coefficient)} / (${argument.display})`;
  }

  function reciprocalLatex(coefficient, argument) {
    if (coefficient.n === 1 && coefficient.d === 1) {
      return `\\frac{1}{${argument.displayLatex}}`;
    }
    if (coefficient.n === -1 && coefficient.d === 1) {
      return `-\\frac{1}{${argument.displayLatex}}`;
    }
    return `${rationalLatex(coefficient)}\\frac{1}{${argument.displayLatex}}`;
  }

  function integralTermPlain(exercise) {
    if (exercise.n === -1) {
      return reciprocalPlain(exercise.A, exercise.argument);
    }
    return powerTermPlain(exercise.A, exercise.argument, exercise.n);
  }

  function integralTermLatex(exercise) {
    if (exercise.n === -1) {
      return reciprocalLatex(exercise.A, exercise.argument);
    }
    return powerTermLatex(exercise.A, exercise.argument, exercise.n);
  }

  function integralPlain(exercise) {
    return `int ${integralTermPlain(exercise)} dx`;
  }

  function integralLatex(exercise) {
    return `\\int ${integralTermLatex(exercise)}\\,dx`;
  }

  function correctAnswerShape(A, k, n) {
    if (n === -1) {
      return {
        answerKind: "log",
        exponent: null,
        coefficient: divide(A, k),
      };
    }
    return {
      answerKind: "power",
      exponent: n + 1,
      coefficient: divide(A, multiplyInt(k, n + 1)),
    };
  }

  function correctCoefficient(A, family, k, n) {
    return correctAnswerShape(A, k, n).coefficient;
  }

  function renderIntegral(exercise) {
    return MathRenderer.integralForExercise
      ? MathRenderer.integralForExercise(exercise)
      : { plain: exercise.integrandExpression || "", latex: exercise.integrandLatex || "" };
  }

  function renderOption(option) {
    return MathRenderer.expressionForOption
      ? MathRenderer.expressionForOption(option)
      : { plain: option.displayPlain || "", latex: option.displayLatex || "" };
  }

  root.TrigAlgebraicLinearFormat = {
    rational,
    multiplyInt,
    divide,
    rationalPlain,
    rationalLatex,
    rationalKey,
    mathInline,
    mathBlock,
    contentNode,
    parensLatex,
    absLatex,
    formatArgumentPlain,
    formatArgumentLatex,
    createArgument,
    coefficientPrefixPlain,
    coefficientPrefixLatex,
    powerPlain,
    powerLatex,
    powerTermPlain,
    powerTermLatex,
    logTermPlain,
    logTermLatex,
    expressionPlain,
    expressionLatex,
    reciprocalPlain,
    reciprocalLatex,
    integralTermPlain,
    integralTermLatex,
    integralPlain,
    integralLatex,
    correctAnswerShape,
    correctCoefficient,
    renderIntegral,
    renderOption,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigAlgebraicLinearFormat;
  }
})(typeof window !== "undefined" ? window : globalThis);
