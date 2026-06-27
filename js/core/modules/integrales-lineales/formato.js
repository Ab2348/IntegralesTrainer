(function (root) {
  "use strict";

  if (typeof require === "function") {
    require("../../racionales.js");
    require("../../math-renderer.js");
    require("./datos.js");
  }

  const MathRenderer = root.TrigMathRenderer || {};
  const Data = root.TrigLinearData || {};
  const Rational = root.TrigRationalUtils || {};
  const { ERROR_LABELS, FAMILY_DEFINITIONS, FAMILY_MAP, NEGATIVE_CORES } = Data;
  const { rational, multiplyInt, divide, rationalPlain, rationalLatex, rationalKey } = Rational;

  function parensLatex(content) {
    return `\\left(${content}\\right)`;
  }

  function absLatex(content) {
    return `\\left|${content}\\right|`;
  }

  function mathInline(latex, plain) {
    return MathRenderer.inlineMath
      ? MathRenderer.inlineMath(latex, { plain })
      : { type: "math", latex, plain: plain || "", display: "inline" };
  }

  function mathBlock(latex, plain) {
    return MathRenderer.blockMath
      ? MathRenderer.blockMath(latex, { plain })
      : { type: "math", latex, plain: plain || "", display: "block" };
  }

  function contentNode(type, className, children) {
    return { type, className: className || "", children: children || [] };
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

  function familyAntiderivativePlain(family) {
    return termPlain(
      rational(family.baseSign, 1),
      family.baseCore,
      createSymbolArgument("u"),
    );
  }

  function familyAntiderivativeLatex(family) {
    return termLatex(
      rational(family.baseSign, 1),
      family.baseCore,
      createSymbolArgument("u"),
    );
  }

  function antiderivativeWithArgumentPlain(family, argument) {
    return termPlain(rational(family.baseSign, 1), family.baseCore, argument);
  }

  function baseRuleLatex(family) {
    return `\\int ${coreLatex(family.integrandCore, createSymbolArgument("u"))}\\,du = ${familyAntiderivativeLatex(family)} + C`;
  }

  function generalRuleLatex() {
    const argument = "kx + b";
    return `\\int A f\\left(${argument}\\right)\\,dx = \\frac{A}{k} F\\left(${argument}\\right) + C`;
  }

  function symbolicLinearArgument() {
    return {
      k: rational(1, 1),
      b: rational(0, 1),
      display: "kx + b",
      displayLatex: "kx + b",
      key: "kx+b",
    };
  }

  function linearFormulaLatex(family) {
    const argument = symbolicLinearArgument();
    const coefficient = family.baseSign < 0 ? "-\\frac{1}{k}" : "\\frac{1}{k}";
    return `\\int ${coreLatex(family.integrandCore, argument)}\\,dx = ${coefficient} ${coreLatex(family.baseCore, argument)} + C`;
  }

  function linearFormulaPlain(family) {
    const argument = symbolicLinearArgument();
    const coefficient = family.baseSign < 0 ? "-(1/k)" : "(1/k)";
    return `int ${corePlain(family.integrandCore, argument)} dx = ${coefficient} ${corePlain(family.baseCore, argument)} + C`;
  }

  function formulaCatalog() {
    return FAMILY_DEFINITIONS.map((family) => ({
      id: family.id,
      name: family.name,
      labelLatex: familyLabelLatex(family),
      basePlain: `int ${family.fDisplay} du = ${family.FDisplay} + C`,
      baseLatex: baseRuleLatex(family),
      linearPlain: linearFormulaPlain(family),
      linearLatex: linearFormulaLatex(family),
    }));
  }

  function familyLabelLatex(familyOrId) {
    const family =
      typeof familyOrId === "string" ? FAMILY_MAP[familyOrId] : familyOrId;
    if (!family) {
      return "";
    }
    const labels = {
      sin: "\\sin",
      cos: "\\cos",
      tan: "\\tan",
      cot: "\\cot",
      sec2: "\\sec^2",
      csc2: "\\csc^2",
      secTan: "\\sec\\tan",
      cscCot: "\\csc\\cot",
      sec: "\\sec",
      csc: "\\csc",
      arctan: "\\arctan",
      arcsin: "\\arcsin",
      arccos: "\\arccos",
    };
    return labels[family.id] || family.name;
  }

  function familyLabelExpression(familyOrId) {
    return {
      plain:
        (typeof familyOrId === "string" ? FAMILY_MAP[familyOrId] : familyOrId)
          ?.name || "",
      latex: familyLabelLatex(familyOrId),
    };
  }

  function errorLabelContent(errorTag) {
    if (errorTag === "ignored-negative-k") {
      return ["Signo de ", mathInline("k"), " ignorado"];
    }
    return [ERROR_LABELS[errorTag] || errorTag];
  }

  function rationalSnapshot(value) {
    return { n: value.n, d: value.d };
  }

  function argumentSnapshot(argument) {
    return {
      k: rationalSnapshot(argument.k),
      b: rationalSnapshot(argument.b),
    };
  }

  function exerciseSnapshot(exercise) {
    return {
      A: rationalSnapshot(exercise.A),
      k: rationalSnapshot(exercise.k),
      b: rationalSnapshot(exercise.b),
      familyId: exercise.familyId,
    };
  }

  function optionSnapshot(option) {
    return {
      coefficient: rationalSnapshot(option.coefficient),
      core: option.core,
      argument: argumentSnapshot(option.argument),
    };
  }

  function restoreRationalSnapshot(value) {
    if (
      !value ||
      !Number.isInteger(value.n) ||
      !Number.isInteger(value.d) ||
      value.d === 0
    ) {
      throw new Error("Invalid rational snapshot.");
    }
    return rational(value.n, value.d);
  }

  function restoreArgumentSnapshot(value) {
    if (!value) {
      throw new Error("Invalid argument snapshot.");
    }
    return createArgument(
      restoreRationalSnapshot(value.k),
      restoreRationalSnapshot(value.b),
    );
  }

  function restoreOptionSnapshot(value) {
    if (!value || typeof value.core !== "string") {
      throw new Error("Invalid option snapshot.");
    }
    return {
      coefficient: restoreRationalSnapshot(value.coefficient),
      core: value.core,
      argument: restoreArgumentSnapshot(value.argument),
    };
  }

  function errorExampleMath(example) {
    try {
      if (!example || !example.exerciseMath || !example.chosenMath) {
        return null;
      }
      const family = FAMILY_MAP[example.exerciseMath.familyId];
      if (!family) {
        return null;
      }
      const A = restoreRationalSnapshot(example.exerciseMath.A);
      const k = restoreRationalSnapshot(example.exerciseMath.k);
      const b = restoreRationalSnapshot(example.exerciseMath.b);
      const argument = createArgument(k, b);
      const exercise = {
        A,
        k,
        b,
        familyId: family.id,
        family,
        argument,
      };
      const correctOption = {
        coefficient: correctCoefficient(A, family, k),
        core: family.baseCore,
        argument,
      };
      return {
        exercise: {
          plain: integralPlain(exercise),
          latex: integralLatex(exercise),
        },
        chosen: {
          plain: expressionPlain(restoreOptionSnapshot(example.chosenMath)),
          latex: expressionLatex(restoreOptionSnapshot(example.chosenMath)),
        },
        correct: {
          plain: expressionPlain(correctOption),
          latex: expressionLatex(correctOption),
        },
      };
    } catch (error) {
      return null;
    }
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
    familyAntiderivativePlain,
    familyAntiderivativeLatex,
    antiderivativeWithArgumentPlain,
    baseRuleLatex,
    generalRuleLatex,
    symbolicLinearArgument,
    linearFormulaLatex,
    linearFormulaPlain,
    formulaCatalog,
    familyLabelLatex,
    familyLabelExpression,
    errorLabelContent,
    rationalSnapshot,
    argumentSnapshot,
    exerciseSnapshot,
    optionSnapshot,
    restoreRationalSnapshot,
    restoreArgumentSnapshot,
    restoreOptionSnapshot,
    errorExampleMath,
    renderIntegral,
    renderOption,
    correctCoefficient,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigLinearFormat;
  }
})(typeof window !== "undefined" ? window : globalThis);
