(function (root) {
  "use strict";

  if (typeof require === "function") {
    require("../../racionales.js");
    require("../../math-renderer.js");
    require("../../math-content.js");
    require("./familias.js");
  }

  const MathRenderer = root.TrigMathRenderer || {};
  const MathContent = root.TrigMathContent || {};
  const Families = root.TrigLinearFamilies || {};
  const Rational = root.TrigRationalUtils || {};
  const { NEGATIVE_CORES } = Families;
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

  if (!mathInline || !mathBlock || !contentNode) {
    throw new Error("TrigMathContent debe cargarse antes de TrigLinearFormat.");
  }

  function plainMathLatex(value) {
    return String(value || "")
      .replace(/\bint\b/g, "\\int")
      .replace(/\bdx\b/g, "\\,dx")
      .replace(
        /\b(arctan|arcsin|arccos|sin|cos|tan|cot|sec|csc|sqrt|ln)\b/g,
        "\\$1",
      );
  }

  function plainMathExpression(value) {
    const plain = String(value || "");
    return {
      plain,
      latex: plainMathLatex(plain),
    };
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
    if (b > 0) {
      return `${xPart} + ${b}`;
    }
    return `${xPart} - ${Math.abs(b)}`;
  }

  function formatArgumentLatex(kValue, bValue) {
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
    if (b > 0) {
      return `${xPart} + ${b}`;
    }
    return `${xPart} - ${Math.abs(b)}`;
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

  function createSymbolArgument(symbol) {
    return {
      k: rational(1, 1),
      b: rational(0, 1),
      display: symbol,
      displayLatex: symbol,
      key: symbol,
    };
  }

  function denominatorOnePlusUSquaredPlain(argumentPlain) {
    return `1 + (${argumentPlain})^2`;
  }

  function denominatorOneMinusUSquaredPlain(argumentPlain) {
    return `1 - (${argumentPlain})^2`;
  }

  function corePlain(core, argument) {
    const u = argument.display;
    switch (core) {
      case "sin":
      case "cos":
      case "tan":
      case "cot":
      case "sec":
      case "csc":
      case "arctan":
      case "arcsin":
      case "arccos":
        return `${core}(${u})`;
      case "sec2":
        return `sec^2(${u})`;
      case "csc2":
        return `csc^2(${u})`;
      case "secTan":
        return `sec(${u}) tan(${u})`;
      case "cscCot":
        return `csc(${u}) cot(${u})`;
      case "lnAbsCos":
        return `ln |cos(${u})|`;
      case "lnAbsSin":
        return `ln |sin(${u})|`;
      case "lnAbsSecPlusTan":
        return `ln |sec(${u}) + tan(${u})|`;
      case "lnAbsCscMinusCot":
        return `ln |csc(${u}) - cot(${u})|`;
      case "atanDerivative":
        return `1 / (${denominatorOnePlusUSquaredPlain(u)})`;
      case "asinDerivative":
        return `1 / sqrt(${denominatorOneMinusUSquaredPlain(u)})`;
      case "acosDerivative":
        return `-1 / sqrt(${denominatorOneMinusUSquaredPlain(u)})`;
      default:
        throw new Error(`Unknown core: ${core}`);
    }
  }

  function coreLatex(core, argument) {
    const u = argument.displayLatex || argument.display;
    const wrapped = parensLatex(u);
    switch (core) {
      case "sin":
      case "cos":
      case "tan":
      case "cot":
      case "sec":
      case "csc":
        return `\\${core}${wrapped}`;
      case "arctan":
      case "arcsin":
      case "arccos":
        return `\\${core}${wrapped}`;
      case "sec2":
        return `\\sec^2${wrapped}`;
      case "csc2":
        return `\\csc^2${wrapped}`;
      case "secTan":
        return `\\sec${wrapped}\\tan${wrapped}`;
      case "cscCot":
        return `\\csc${wrapped}\\cot${wrapped}`;
      case "lnAbsCos":
        return `\\ln ${absLatex(`\\cos${wrapped}`)}`;
      case "lnAbsSin":
        return `\\ln ${absLatex(`\\sin${wrapped}`)}`;
      case "lnAbsSecPlusTan":
        return `\\ln ${absLatex(`\\sec${wrapped} + \\tan${wrapped}`)}`;
      case "lnAbsCscMinusCot":
        return `\\ln ${absLatex(`\\csc${wrapped} - \\cot${wrapped}`)}`;
      case "atanDerivative":
        return `\\frac{1}{1 + ${wrapped}^2}`;
      case "asinDerivative":
        return `\\frac{1}{\\sqrt{1 - ${wrapped}^2}}`;
      case "acosDerivative":
        return `-\\frac{1}{\\sqrt{1 - ${wrapped}^2}}`;
      default:
        throw new Error(`Unknown core: ${core}`);
    }
  }

  function termPlain(coefficient, core, argument) {
    const body = corePlain(core, argument);
    if (
      NEGATIVE_CORES.has(core) &&
      !(coefficient.n === 1 && coefficient.d === 1)
    ) {
      return `${rationalPlain(coefficient)} (${body})`;
    }
    if (coefficient.n === 1 && coefficient.d === 1) {
      return body;
    }
    if (coefficient.n === -1 && coefficient.d === 1) {
      return `-${body}`;
    }
    return `${rationalPlain(coefficient)} ${body}`;
  }

  function termLatex(coefficient, core, argument) {
    const body = coreLatex(core, argument);
    if (
      NEGATIVE_CORES.has(core) &&
      !(coefficient.n === 1 && coefficient.d === 1)
    ) {
      return `${rationalLatex(coefficient)} ${parensLatex(body)}`;
    }
    if (coefficient.n === 1 && coefficient.d === 1) {
      return body;
    }
    if (coefficient.n === -1 && coefficient.d === 1) {
      return `-${body}`;
    }
    return `${rationalLatex(coefficient)} ${body}`;
  }

  function expressionPlain(option) {
    return `${termPlain(option.coefficient, option.core, option.argument)} + C`;
  }

  function expressionLatex(option) {
    return `${termLatex(option.coefficient, option.core, option.argument)} + C`;
  }

  function integralTermPlain(family, coefficient, argument) {
    if (family.integrandCore === "atanDerivative") {
      return `${rationalPlain(coefficient)} / (${denominatorOnePlusUSquaredPlain(argument.display)})`;
    }
    if (family.integrandCore === "asinDerivative") {
      return `${rationalPlain(coefficient)} / sqrt(${denominatorOneMinusUSquaredPlain(argument.display)})`;
    }
    if (family.integrandCore === "acosDerivative") {
      return termPlain(coefficient, "acosDerivative", argument);
    }
    return termPlain(coefficient, family.integrandCore, argument);
  }

  function integralTermLatex(family, coefficient, argument) {
    if (family.integrandCore === "atanDerivative") {
      return `\\frac{${rationalLatex(coefficient)}}{1 + ${parensLatex(argument.displayLatex)}^2}`;
    }
    if (family.integrandCore === "asinDerivative") {
      return `\\frac{${rationalLatex(coefficient)}}{\\sqrt{1 - ${parensLatex(argument.displayLatex)}^2}}`;
    }
    if (family.integrandCore === "acosDerivative") {
      return termLatex(coefficient, "acosDerivative", argument);
    }
    return termLatex(coefficient, family.integrandCore, argument);
  }

  function integralPlain(exercise) {
    return `int ${integralTermPlain(exercise.family, exercise.A, exercise.argument)} dx`;
  }

  function integralLatex(exercise) {
    return `\\int ${integralTermLatex(exercise.family, exercise.A, exercise.argument)}\\,dx`;
  }

  function renderIntegral(exercise) {
    return MathRenderer.integralForExercise
      ? MathRenderer.integralForExercise(exercise)
      : {
          plain: exercise.integrandExpression || "",
          latex: exercise.integrandLatex || "",
        };
  }

  function renderOption(option) {
    return MathRenderer.expressionForOption
      ? MathRenderer.expressionForOption(option)
      : {
          plain: option.displayPlain || option.displayExpression || "",
          latex: option.displayLatex || "",
        };
  }

  function correctCoefficient(A, family, k) {
    return divide(multiplyInt(A, family.baseSign), k);
  }

  root.TrigLinearFormat = {
    rational,
    multiplyInt,
    divide,
    rationalPlain,
    rationalLatex,
    rationalKey,
    parensLatex,
    absLatex,
    mathInline,
    mathBlock,
    contentNode,
    plainMathLatex,
    plainMathExpression,
    formatArgumentPlain,
    formatArgumentLatex,
    createArgument,
    createSymbolArgument,
    denominatorOnePlusUSquaredPlain,
    denominatorOneMinusUSquaredPlain,
    corePlain,
    coreLatex,
    termPlain,
    termLatex,
    expressionPlain,
    expressionLatex,
    integralTermPlain,
    integralTermLatex,
    integralPlain,
    integralLatex,
    renderIntegral,
    renderOption,
    correctCoefficient,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigLinearFormat;
  }
})(typeof window !== "undefined" ? window : globalThis);
