(function (root) {
  "use strict";

  const Taxonomy = root.TrigExerciseTaxonomy || {};
  const ExerciseModel = root.TrigExerciseModel || {};
  const OptionEngine = root.TrigOptionEngine || {};
  const Validation = root.TrigValidation || {};
  const FeedbackEngine = root.TrigFeedbackEngine || {};
  const ExerciseGenerator = root.TrigExerciseGenerator || {};
  const MathRenderer = root.TrigMathRenderer || {};

  const TRIG_LINEAR_RENDERER_ID = "trig-linear-renderer";

  const ERROR_TAGS = [
    "wrong-family",
    "wrong-base-sign",
    "forgot-chain-factor",
    "ignored-negative-k",
    "lost-external-sign",
    "copied-integrand",
    "lost-argument-shift",
    "generic-coefficient-error",
  ];

  const ERROR_LABELS = {
    "wrong-family": "Familia incorrecta",
    "wrong-base-sign": "Signo base incorrecto",
    "forgot-chain-factor": "Factor de cadena olvidado",
    "ignored-negative-k": "Signo de k ignorado",
    "lost-external-sign": "Signo externo perdido",
    "copied-integrand": "Forma del integrando copiada",
    "lost-argument-shift": "Desplazamiento perdido",
    "generic-coefficient-error": "Coeficiente incorrecto",
    correct: "Correcto",
  };

  const ERROR_LABELS_HTML = {
    "wrong-family": "Familia incorrecta",
    "wrong-base-sign": "Signo base incorrecto",
    "forgot-chain-factor": "Factor de cadena olvidado",
    "ignored-negative-k":
      'Signo de <span class="math-inline"><span class="math-var">k</span></span> ignorado',
    "lost-external-sign": "Signo externo perdido",
    "copied-integrand": "Forma del integrando copiada",
    "lost-argument-shift": "Desplazamiento perdido",
    "generic-coefficient-error": "Coeficiente incorrecto",
    correct: "Correcto",
  };

  const FAMILY_DEFINITIONS = [
    {
      id: "sin",
      name: "sin",
      group: "basica",
      fDisplay: "sin(u)",
      FDisplay: "-cos(u)",
      baseSign: -1,
      baseCore: "cos",
      integrandCore: "sin",
      derivativeCore: "-sin(u)",
    },
    {
      id: "cos",
      name: "cos",
      group: "basica",
      fDisplay: "cos(u)",
      FDisplay: "sin(u)",
      baseSign: 1,
      baseCore: "sin",
      integrandCore: "cos",
      derivativeCore: "cos(u)",
    },
    {
      id: "tan",
      name: "tan",
      group: "logaritmica",
      fDisplay: "tan(u)",
      FDisplay: "-ln |cos(u)|",
      baseSign: -1,
      baseCore: "lnAbsCos",
      integrandCore: "tan",
      derivativeCore: "-tan(u)",
    },
    {
      id: "cot",
      name: "cot",
      group: "logaritmica",
      fDisplay: "cot(u)",
      FDisplay: "ln |sin(u)|",
      baseSign: 1,
      baseCore: "lnAbsSin",
      integrandCore: "cot",
      derivativeCore: "cot(u)",
    },
    {
      id: "sec2",
      name: "sec^2",
      group: "intermedia",
      fDisplay: "sec^2(u)",
      FDisplay: "tan(u)",
      baseSign: 1,
      baseCore: "tan",
      integrandCore: "sec2",
      derivativeCore: "sec^2(u)",
    },
    {
      id: "csc2",
      name: "csc^2",
      group: "intermedia",
      fDisplay: "csc^2(u)",
      FDisplay: "-cot(u)",
      baseSign: -1,
      baseCore: "cot",
      integrandCore: "csc2",
      derivativeCore: "-csc^2(u)",
    },
    {
      id: "secTan",
      name: "sec tan",
      group: "producto",
      fDisplay: "sec(u) tan(u)",
      FDisplay: "sec(u)",
      baseSign: 1,
      baseCore: "sec",
      integrandCore: "secTan",
      derivativeCore: "sec(u) tan(u)",
    },
    {
      id: "cscCot",
      name: "csc cot",
      group: "producto",
      fDisplay: "csc(u) cot(u)",
      FDisplay: "-csc(u)",
      baseSign: -1,
      baseCore: "csc",
      integrandCore: "cscCot",
      derivativeCore: "-csc(u) cot(u)",
    },
    {
      id: "sec",
      name: "sec",
      group: "logaritmica",
      fDisplay: "sec(u)",
      FDisplay: "ln |sec(u) + tan(u)|",
      baseSign: 1,
      baseCore: "lnAbsSecPlusTan",
      integrandCore: "sec",
      derivativeCore: "sec(u)",
    },
    {
      id: "csc",
      name: "csc",
      group: "logaritmica",
      fDisplay: "csc(u)",
      FDisplay: "ln |csc(u) - cot(u)|",
      baseSign: 1,
      baseCore: "lnAbsCscMinusCot",
      integrandCore: "csc",
      derivativeCore: "csc(u)",
    },
    {
      id: "arctan",
      name: "arctan",
      group: "inversa",
      fDisplay: "1 / (1 + u^2)",
      FDisplay: "arctan(u)",
      baseSign: 1,
      baseCore: "arctan",
      integrandCore: "atanDerivative",
      derivativeCore: "1 / (1 + u^2)",
    },
    {
      id: "arcsin",
      name: "arcsin",
      group: "inversa",
      fDisplay: "1 / sqrt(1 - u^2)",
      FDisplay: "arcsin(u)",
      baseSign: 1,
      baseCore: "arcsin",
      integrandCore: "asinDerivative",
      derivativeCore: "1 / sqrt(1 - u^2)",
    },
    {
      id: "arccos",
      name: "arccos",
      group: "inversa",
      fDisplay: "-1 / sqrt(1 - u^2)",
      FDisplay: "arccos(u)",
      baseSign: 1,
      baseCore: "arccos",
      integrandCore: "acosDerivative",
      derivativeCore: "-1 / sqrt(1 - u^2)",
    },
  ];

  const FAMILY_MAP = FAMILY_DEFINITIONS.reduce((map, family) => {
    map[family.id] = family;
    return map;
  }, {});

  const MODE_FAMILIES = {
    basic: ["sin", "cos"],
    intermediate: ["sin", "cos", "sec2", "csc2"],
    products: ["secTan", "cscCot"],
    logarithmic: ["tan", "cot", "sec", "csc"],
    inverse: ["arctan", "arcsin", "arccos"],
    mixed: FAMILY_DEFINITIONS.map((family) => family.id),
    custom: ["sin", "cos"],
  };

  const DEFAULT_MATH_FAMILY_ID = "trigonometrica-directa";
  const DEFAULT_METHOD_ID = "directa";
  const DEFAULT_SUBMETHOD_ID = "argumento-lineal";
  const BASE_VARIANT = {
    id: "lineal",
    name: "Argumento lineal",
    description: "Integral directa con argumento kx + b.",
    appliesToTemplate: "*",
    difficultyModifier: 0,
    parameterOverrides: {},
    renderHints: { rendererId: TRIG_LINEAR_RENDERER_ID },
  };
  const TRIG_LINEAR_DIFFICULTY_PROFILE = {
    id: "trig-linear-direct",
    name: "Dificultad para integrales directas con argumento lineal",
    levels: [
      {
        id: "1",
        name: "Base",
        description: "A vale -1 o 1, k = 1 y b = 0.",
        parameterRules: { A: "unit", k: "one", b: "zero" },
      },
      {
        id: "2",
        name: "Cadena simple",
        description: "A vale -1 o 1, k es no cero y b = 0.",
        parameterRules: { A: "unit", k: "non-zero", b: "zero" },
      },
      {
        id: "3",
        name: "Coeficiente",
        description: "A y k son no cero, b = 0.",
        parameterRules: { A: "non-zero", k: "non-zero", b: "zero" },
      },
      {
        id: "4",
        name: "Desplazamiento",
        description: "A, k y b varian; A y k no pueden ser cero.",
        parameterRules: { A: "non-zero", k: "non-zero", b: "integer" },
      },
      {
        id: "5",
        name: "Fraccionario",
        description: "Busca coeficiente final fraccionario y b no cero.",
        parameterRules: {
          A: "non-zero",
          k: "non-zero",
          b: "non-zero",
          result: "fractional-coefficient",
        },
      },
    ],
  };
  const DISTRACTOR_STRATEGIES = [
    "wrong-family",
    "wrong-base-sign",
    "forgot-chain-factor",
    "ignored-negative-k",
    "lost-external-sign",
    "copied-integrand",
    "lost-argument-shift",
    "generic-coefficient-error",
  ];

  const ANSWER_CORES = [
    "sin",
    "cos",
    "tan",
    "cot",
    "sec",
    "csc",
    "lnAbsCos",
    "lnAbsSin",
    "lnAbsSecPlusTan",
    "lnAbsCscMinusCot",
    "arctan",
    "arcsin",
    "arccos",
  ];

  const NEGATIVE_CORES = new Set(["acosDerivative"]);
  const RANGE_LIMITS = {
    min: -50,
    max: 50,
  };

  const WRONG_CORE_MAP = {
    sin: ["cos", "tan", "arcsin"],
    cos: ["sin", "cot", "arccos"],
    tan: ["cot", "sec", "sin"],
    cot: ["tan", "csc", "cos"],
    sec: ["tan", "lnAbsSecPlusTan", "sin"],
    csc: ["cot", "lnAbsCscMinusCot", "cos"],
    lnAbsCos: ["sin", "cos", "lnAbsSin"],
    lnAbsSin: ["cos", "sin", "lnAbsCos"],
    lnAbsSecPlusTan: ["sec", "tan", "lnAbsCos"],
    lnAbsCscMinusCot: ["csc", "cot", "lnAbsSin"],
    arctan: ["arcsin", "arccos", "tan"],
    arcsin: ["arctan", "arccos", "sin"],
    arccos: ["arcsin", "arctan", "cos"],
  };

  function gcd(a, b) {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y !== 0) {
      const next = x % y;
      x = y;
      y = next;
    }
    return x || 1;
  }

  function rational(numerator, denominator) {
    const den = denominator === undefined ? 1 : denominator;
    if (!Number.isInteger(numerator) || !Number.isInteger(den)) {
      throw new Error("Rational values must use integers.");
    }
    if (den === 0) {
      throw new Error("Rational denominator cannot be zero.");
    }
    if (numerator === 0) {
      return { n: 0, d: 1 };
    }
    const sign = den < 0 ? -1 : 1;
    const signedNumerator = numerator * sign;
    const positiveDenominator = Math.abs(den);
    const divisor = gcd(signedNumerator, positiveDenominator);
    return {
      n: signedNumerator / divisor,
      d: positiveDenominator / divisor,
    };
  }

  function multiply(a, b) {
    return rational(a.n * b.n, a.d * b.d);
  }

  function multiplyInt(value, factor) {
    return rational(value.n * factor, value.d);
  }

  function divide(a, b) {
    if (b.n === 0) {
      throw new Error("Cannot divide by zero.");
    }
    return rational(a.n * b.d, a.d * b.n);
  }

  function divideInt(value, divisor) {
    return divide(value, rational(divisor, 1));
  }

  function negate(value) {
    return rational(-value.n, value.d);
  }

  function absRational(value) {
    return rational(Math.abs(value.n), value.d);
  }

  function equals(a, b) {
    return a.n === b.n && a.d === b.d;
  }

  function rationalKey(value) {
    return `${value.n}/${value.d}`;
  }

  function rationalPlain(value) {
    if (value.d === 1) {
      return String(value.n);
    }
    return `${value.n}/${value.d}`;
  }

  function rationalLatex(value) {
    if (value.d === 1) {
      return String(value.n);
    }
    const sign = value.n < 0 ? "-" : "";
    return `${sign}\\frac{${Math.abs(value.n)}}{${value.d}}`;
  }

  function minusHtml() {
    return "&minus;";
  }

  function intHtml(value) {
    return value < 0 ? `${minusHtml()}${Math.abs(value)}` : String(value);
  }

  function rationalHtml(value) {
    if (value.d === 1) {
      return `<span class="math-num">${intHtml(value.n)}</span>`;
    }
    const sign = value.n < 0 ? `${minusHtml()}` : "";
    const absNum = Math.abs(value.n);
    return `${sign}<span class="math-frac" aria-label="${rationalPlain(value)}"><span>${absNum}</span><span>${value.d}</span></span>`;
  }

  function varHtml(name) {
    return `<span class="math-var">${name}</span>`;
  }

  function numHtml(value) {
    return `<span class="math-num">${value}</span>`;
  }

  function opHtml(value) {
    return `<span class="math-op">${value}</span>`;
  }

  function signHtml(value) {
    return `<span class="math-sign">${value}</span>`;
  }

  function parensHtml(content) {
    return `<span class="math-paren">(</span>${content}<span class="math-paren">)</span>`;
  }

  function funcHtml(name, argument, power) {
    const exponent = power ? `<sup class="math-sup">${power}</sup>` : "";
    const className = name.length === 1 ? "math-var" : "math-func";
    return `<span class="${className}">${name}</span>${exponent}${parensHtml(argument)}`;
  }

  function absHtml(content) {
    return `<span class="math-bar">|</span>${content}<span class="math-bar">|</span>`;
  }

  function sqrtHtml(content) {
    return `<span class="math-sqrt"><span class="math-radical">&radic;</span><span class="math-radicand">${content}</span></span>`;
  }

  function fracHtml(numerator, denominator, label) {
    const aria = label ? ` aria-label="${label}"` : "";
    return `<span class="math-frac"${aria}><span>${numerator}</span><span>${denominator}</span></span>`;
  }

  function mathExpression(content) {
    return `<span class="math-expression">${content}</span>`;
  }

  function parensLatex(content) {
    return `\\left(${content}\\right)`;
  }

  function absLatex(content) {
    return `\\left|${content}\\right|`;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function plainMathHtml(value) {
    const source = String(value || "").slice(0, 500);
    const tokenPattern =
      /\b(arctan|arcsin|arccos|sin|cos|tan|cot|sec|csc|sqrt|ln)\b|\bint\b|\bdx\b|\bC\b|\bx\b|-?\d+\/\d+/g;
    let result = "";
    let cursor = 0;
    let match = tokenPattern.exec(source);
    while (match) {
      result += escapeHtml(source.slice(cursor, match.index));
      const token = match[0];
      if (token === "int") {
        result += '<span class="math-integral small">&int;</span>';
      } else if (token === "dx") {
        result += differentialHtml("x");
      } else if (token === "x" || token === "C") {
        result += varHtml(token);
      } else if (/^-?\d+\/\d+$/.test(token)) {
        const parts = token.split("/");
        result += rationalHtml(
          rational(
            Number.parseInt(parts[0], 10),
            Number.parseInt(parts[1], 10),
          ),
        );
      } else {
        result += `<span class="math-func">${escapeHtml(token)}</span>`;
      }
      cursor = match.index + token.length;
      match = tokenPattern.exec(source);
    }
    result += escapeHtml(source.slice(cursor));
    return mathExpression(result);
  }

  function differentialHtml(variableName) {
    return `<span class="math-d">d</span>${varHtml(variableName)}`;
  }

  function plusCHtml() {
    return `${opHtml("+")} ${varHtml("C")}`;
  }

  function randomInt(min, max, rng) {
    return Math.floor(rng() * (max - min + 1)) + min;
  }

  function choose(items, rng) {
    return items[Math.floor(rng() * items.length)];
  }

  function shuffle(items, rng) {
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      const temp = result[i];
      result[i] = result[j];
      result[j] = temp;
    }
    return result;
  }

  function randomNonZero(min, max, rng) {
    const zeroCount = min <= 0 && max >= 0 ? 1 : 0;
    const valueCount = max - min + 1 - zeroCount;
    if (valueCount <= 0) {
      throw new Error("Range must include at least one non-zero value.");
    }
    const offset = randomInt(0, valueCount - 1, rng);
    const candidate = min + offset;
    return candidate >= 0 && min <= 0 ? candidate + 1 : candidate;
  }

  function sanitizeRange(minValue, maxValue) {
    let min = Number.parseInt(minValue, 10);
    let max = Number.parseInt(maxValue, 10);
    if (!Number.isFinite(min)) {
      min = -10;
    }
    if (!Number.isFinite(max)) {
      max = 10;
    }
    if (min > max) {
      const temp = min;
      min = max;
      max = temp;
    }
    min = Math.max(RANGE_LIMITS.min, Math.min(RANGE_LIMITS.max, min));
    max = Math.max(RANGE_LIMITS.min, Math.min(RANGE_LIMITS.max, max));
    if (min === 0 && max === 0) {
      min = -10;
      max = 10;
    }
    return { min, max };
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

  function formatArgumentHtml(kValue, bValue) {
    const k = kValue.n;
    const b = bValue.n;
    let xPart;
    if (k === 1) {
      xPart = varHtml("x");
    } else if (k === -1) {
      xPart = `${signHtml(minusHtml())}${varHtml("x")}`;
    } else {
      xPart = `${intHtml(k)}${varHtml("x")}`;
    }
    if (b === 0) {
      return xPart;
    }
    if (b > 0) {
      return `${xPart} ${opHtml("+")} ${numHtml(b)}`;
    }
    return `${xPart} ${opHtml(minusHtml())} ${numHtml(Math.abs(b))}`;
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
      displayHtml: formatArgumentHtml(k, b),
      key: `${rationalKey(k)}|${rationalKey(b)}`,
    };
  }

  function createSymbolArgument(symbol) {
    return {
      k: rational(1, 1),
      b: rational(0, 1),
      display: symbol,
      displayLatex: symbol,
      displayHtml: varHtml(symbol),
      key: symbol,
    };
  }

  function denominatorOnePlusUSquared(argumentHtml) {
    return `${numHtml(1)} ${opHtml("+")} ${parensHtml(argumentHtml)}<sup class="math-sup">2</sup>`;
  }

  function denominatorOneMinusUSquared(argumentHtml) {
    return `${numHtml(1)} ${opHtml(minusHtml())} ${parensHtml(argumentHtml)}<sup class="math-sup">2</sup>`;
  }

  function denominatorOnePlusUSquaredPlain(argumentPlain) {
    return `1 + (${argumentPlain})^2`;
  }

  function denominatorOneMinusUSquaredPlain(argumentPlain) {
    return `1 - (${argumentPlain})^2`;
  }

  function coreHtml(core, argument) {
    const u = argument.displayHtml;
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
        return funcHtml(core, u);
      case "sec2":
        return funcHtml("sec", u, 2);
      case "csc2":
        return funcHtml("csc", u, 2);
      case "secTan":
        return `${funcHtml("sec", u)}<span class="math-thin-space"></span>${funcHtml("tan", u)}`;
      case "cscCot":
        return `${funcHtml("csc", u)}<span class="math-thin-space"></span>${funcHtml("cot", u)}`;
      case "lnAbsCos":
        return `<span class="math-func">ln</span><span class="math-thin-space"></span>${absHtml(funcHtml("cos", u))}`;
      case "lnAbsSin":
        return `<span class="math-func">ln</span><span class="math-thin-space"></span>${absHtml(funcHtml("sin", u))}`;
      case "lnAbsSecPlusTan":
        return `<span class="math-func">ln</span><span class="math-thin-space"></span>${absHtml(`${funcHtml("sec", u)} ${opHtml("+")} ${funcHtml("tan", u)}`)}`;
      case "lnAbsCscMinusCot":
        return `<span class="math-func">ln</span><span class="math-thin-space"></span>${absHtml(`${funcHtml("csc", u)} ${opHtml(minusHtml())} ${funcHtml("cot", u)}`)}`;
      case "atanDerivative":
        return fracHtml(
          numHtml(1),
          denominatorOnePlusUSquared(u),
          `1 / (${denominatorOnePlusUSquaredPlain(argument.display)})`,
        );
      case "asinDerivative":
        return fracHtml(
          numHtml(1),
          sqrtHtml(denominatorOneMinusUSquared(u)),
          `1 / sqrt(${denominatorOneMinusUSquaredPlain(argument.display)})`,
        );
      case "acosDerivative":
        return `${signHtml(minusHtml())}${fracHtml(numHtml(1), sqrtHtml(denominatorOneMinusUSquared(u)), `-1 / sqrt(${denominatorOneMinusUSquaredPlain(argument.display)})`)}`;
      default:
        throw new Error(`Unknown core: ${core}`);
    }
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

  function termHtml(coefficient, core, argument) {
    const body = coreHtml(core, argument);
    if (
      NEGATIVE_CORES.has(core) &&
      !(coefficient.n === 1 && coefficient.d === 1)
    ) {
      return `<span class="math-term">${rationalHtml(coefficient)}<span class="math-thin-space"></span>${parensHtml(body)}</span>`;
    }
    if (coefficient.n === 1 && coefficient.d === 1) {
      return body;
    }
    if (coefficient.n === -1 && coefficient.d === 1) {
      return `<span class="math-term">${signHtml(minusHtml())}<span class="math-thin-space"></span>${body}</span>`;
    }
    return `<span class="math-term">${rationalHtml(coefficient)}<span class="math-thin-space"></span>${body}</span>`;
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

  function expressionHtml(option) {
    return mathExpression(
      `${termHtml(option.coefficient, option.core, option.argument)} ${plusCHtml()}`,
    );
  }

  function expressionPlain(option) {
    return `${termPlain(option.coefficient, option.core, option.argument)} + C`;
  }

  function expressionLatex(option) {
    return `${termLatex(option.coefficient, option.core, option.argument)} + C`;
  }

  function integralTermHtml(family, coefficient, argument) {
    if (family.integrandCore === "atanDerivative") {
      const denominator = denominatorOnePlusUSquared(argument.displayHtml);
      return fracHtml(rationalHtml(coefficient), denominator);
    }
    if (family.integrandCore === "asinDerivative") {
      const denominator = sqrtHtml(
        denominatorOneMinusUSquared(argument.displayHtml),
      );
      return fracHtml(rationalHtml(coefficient), denominator);
    }
    if (family.integrandCore === "acosDerivative") {
      return termHtml(coefficient, "acosDerivative", argument);
    }
    return termHtml(coefficient, family.integrandCore, argument);
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

  function integralHtml(exercise) {
    return mathExpression(
      `<span class="math-integral">&int;</span>${integralTermHtml(exercise.family, exercise.A, exercise.argument)}<span class="math-thin-space"></span>${differentialHtml("x")}`,
    );
  }

  function integralPlain(exercise) {
    return `int ${integralTermPlain(exercise.family, exercise.A, exercise.argument)} dx`;
  }

  function integralLatex(exercise) {
    return `\\int ${integralTermLatex(exercise.family, exercise.A, exercise.argument)}\\,dx`;
  }

  function familyIntegrandHtml(family) {
    return coreHtml(family.integrandCore, createSymbolArgument("u"));
  }

  function familyAntiderivativeHtml(family) {
    return termHtml(
      rational(family.baseSign, 1),
      family.baseCore,
      createSymbolArgument("u"),
    );
  }

  function familyAntiderivativePlain(family) {
    return termPlain(
      rational(family.baseSign, 1),
      family.baseCore,
      createSymbolArgument("u"),
    );
  }

  function antiderivativeWithArgumentHtml(family, argument) {
    return termHtml(rational(family.baseSign, 1), family.baseCore, argument);
  }

  function antiderivativeWithArgumentPlain(family, argument) {
    return termPlain(rational(family.baseSign, 1), family.baseCore, argument);
  }

  function baseRuleHtml(family) {
    return mathExpression(
      `<span class="math-integral small">&int;</span>${familyIntegrandHtml(family)}<span class="math-thin-space"></span>${differentialHtml("u")} ${opHtml("=")} ${familyAntiderivativeHtml(family)} ${plusCHtml()}`,
    );
  }

  function generalRuleHtml() {
    const kxPlusB = `${varHtml("k")}${varHtml("x")} ${opHtml("+")} ${varHtml("b")}`;
    const left = `${varHtml("A")} ${funcHtml("f", kxPlusB)}`;
    const right = `${fracHtml(varHtml("A"), varHtml("k"))}<span class="math-thin-space"></span>${funcHtml("F", kxPlusB)} ${plusCHtml()}`;
    return mathExpression(
      `<span class="math-integral small">&int;</span>${left}<span class="math-thin-space"></span>${differentialHtml("x")} ${opHtml("=")} ${right}`,
    );
  }

  function symbolicLinearArgument() {
    return {
      k: rational(1, 1),
      b: rational(0, 1),
      display: "kx + b",
      displayLatex: "kx + b",
      displayHtml: `${varHtml("k")}${varHtml("x")} ${opHtml("+")} ${varHtml("b")}`,
      key: "kx+b",
    };
  }

  function linearFormulaHtml(family) {
    const argument = symbolicLinearArgument();
    const left = coreHtml(family.integrandCore, argument);
    const sign = family.baseSign < 0 ? `${signHtml(minusHtml())}` : "";
    const right = `${sign}${fracHtml(numHtml(1), varHtml("k"))}<span class="math-thin-space"></span>${coreHtml(family.baseCore, argument)} ${plusCHtml()}`;
    return mathExpression(
      `<span class="math-integral small">&int;</span>${left}<span class="math-thin-space"></span>${differentialHtml("x")} ${opHtml("=")} ${right}`,
    );
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
      labelHtml: familyLabelHtml(family),
      basePlain: `int ${family.fDisplay} du = ${family.FDisplay} + C`,
      baseHtml: baseRuleHtml(family),
      linearPlain: linearFormulaPlain(family),
      linearHtml: linearFormulaHtml(family),
    }));
  }

  function familyLabelHtml(familyOrId) {
    const family =
      typeof familyOrId === "string" ? FAMILY_MAP[familyOrId] : familyOrId;
    if (!family) {
      return "";
    }

    const func = (name, power) => {
      const exponent = power ? `<sup class="math-sup">${power}</sup>` : "";
      return `<span class="math-func">${name}</span>${exponent}`;
    };

    const labels = {
      sin: func("sin"),
      cos: func("cos"),
      tan: func("tan"),
      cot: func("cot"),
      sec2: func("sec", 2),
      csc2: func("csc", 2),
      secTan: `${func("sec")}<span class="math-thin-space"></span>${func("tan")}`,
      cscCot: `${func("csc")}<span class="math-thin-space"></span>${func("cot")}`,
      sec: func("sec"),
      csc: func("csc"),
      arctan: func("arctan"),
      arcsin: func("arcsin"),
      arccos: func("arccos"),
    };

    return `<span class="math-expression family-math-label">${labels[family.id] || family.name}</span>`;
  }

  function errorLabelHtml(errorTag) {
    return ERROR_LABELS_HTML[errorTag] || ERROR_LABELS[errorTag] || errorTag;
  }

  function optionKey(coefficient, core, argument) {
    return `${rationalKey(coefficient)}|${core}|${argument.key}`;
  }

  function createOption(params) {
    const displayPlain = expressionPlain(params);
    const displayLatex = expressionLatex(params);
    const displayHtml = expressionHtml(params);
    const option = {
      id: params.id || `opt-${Math.random().toString(36).slice(2)}`,
      value: displayPlain,
      isCorrect: Boolean(params.isCorrect),
      errorTag: params.errorTag,
      errorType: params.errorType || params.errorTag,
      sourceStrategy: params.sourceStrategy || params.errorType || params.errorTag,
      explanation: params.explanation || "",
      coefficient: params.coefficient,
      core: params.core,
      argument: params.argument,
      rendererId: TRIG_LINEAR_RENDERER_ID,
      displayPlain,
      displayLatex,
      displayHtml,
      displayExpression: displayPlain,
      display: {
        plain: displayPlain,
        latex: displayLatex,
        html: displayHtml,
      },
      debugData: params.debugData || {},
      metadata: params.metadata || {},
    };
    option.key = optionKey(option.coefficient, option.core, option.argument);
    return option;
  }

  function distractorOption(params) {
    return createOption({
      ...params,
      isCorrect: false,
      sourceStrategy: params.sourceStrategy || params.errorTag,
      metadata: {
        ...(params.metadata || {}),
        sourceStrategy: params.sourceStrategy || params.errorTag,
      },
    });
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

  function errorExampleMathHtml(example) {
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
        exerciseHtml: integralHtml(exercise),
        chosenHtml: expressionHtml(restoreOptionSnapshot(example.chosenMath)),
        correctHtml: expressionHtml(correctOption),
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
          html: exercise.integrandHtml || "",
        };
  }

  function renderOption(option) {
    return MathRenderer.expressionForOption
      ? MathRenderer.expressionForOption(option, TRIG_LINEAR_RENDERER_ID)
      : {
          plain: option.displayPlain || option.displayExpression || "",
          latex: option.displayLatex || "",
          html: option.displayHtml || "",
        };
  }

  function correctCoefficient(A, family, k) {
    return divide(multiplyInt(A, family.baseSign), k);
  }

  function exerciseSignature(params) {
    return `${params.A}|${params.familyId}|${params.k}|${params.b}`;
  }

  function buildCorrectOption(exercise) {
    return createOption({
      isCorrect: true,
      errorTag: "correct",
      coefficient: exercise.correctCoefficient,
      core: exercise.family.baseCore,
      argument: exercise.argument,
    });
  }

  function addUniqueOption(target, seen, option, correctKey) {
    if (!option || option.key === correctKey || seen.has(option.key)) {
      return false;
    }
    seen.add(option.key);
    target.push(option);
    return true;
  }

  function wrongFamilyCandidates(exercise) {
    const configured = WRONG_CORE_MAP[exercise.family.baseCore] || [];
    const fallback = ANSWER_CORES.filter(
      (core) => core !== exercise.family.baseCore,
    );
    const cores = configured.concat(
      fallback.filter((core) => !configured.includes(core)),
    );
    return cores.map((core) =>
      distractorOption({
        errorTag: "wrong-family",
        coefficient: exercise.correctCoefficient,
        core,
        argument: exercise.argument,
      }),
    );
  }

  function genericCoefficientVariants(coefficient) {
    const variants = [];
    if (coefficient.d !== 1 && Math.abs(coefficient.n) !== 1) {
      const sign = coefficient.n < 0 ? -1 : 1;
      variants.push(rational(sign * coefficient.d, Math.abs(coefficient.n)));
    }
    variants.push(
      rational(coefficient.n + (coefficient.n >= 0 ? 1 : -1), coefficient.d),
    );
    variants.push(rational(coefficient.n, coefficient.d + 1));
    variants.push(rational(coefficient.n * 2, coefficient.d));
    return variants.filter(
      (value) => value.n !== 0 && !equals(value, coefficient),
    );
  }

  function buildDistractorCandidates(exercise, rng) {
    const candidates = [];
    const A = exercise.A;
    const k = exercise.k;
    const family = exercise.family;
    const argument = exercise.argument;

    candidates.push(...wrongFamilyCandidates(exercise));

    candidates.push(
      distractorOption({
        errorTag: "wrong-base-sign",
        coefficient: negate(exercise.correctCoefficient),
        core: family.baseCore,
        argument,
      }),
    );

    candidates.push(
      distractorOption({
        errorTag: "forgot-chain-factor",
        coefficient: multiplyInt(A, family.baseSign),
        core: family.baseCore,
        argument,
      }),
    );

    if (k.n < 0) {
      candidates.push(
        distractorOption({
          errorTag: "ignored-negative-k",
          coefficient: divide(multiplyInt(A, family.baseSign), absRational(k)),
          core: family.baseCore,
          argument,
        }),
      );
    }

    candidates.push(
      distractorOption({
        errorTag: "lost-external-sign",
        coefficient: divide(multiplyInt(negate(A), family.baseSign), k),
        core: family.baseCore,
        argument,
      }),
    );

    candidates.push(
      distractorOption({
        errorTag: "copied-integrand",
        coefficient: exercise.correctCoefficient,
        core: family.integrandCore,
        argument,
      }),
    );

    if (exercise.b.n !== 0) {
      candidates.push(
        distractorOption({
          errorTag: "lost-argument-shift",
          coefficient: exercise.correctCoefficient,
          core: family.baseCore,
          argument: createArgument(k, rational(0, 1)),
        }),
      );
    }

    const primary = shuffle(candidates, rng);
    const generic = genericCoefficientVariants(exercise.correctCoefficient).map(
      (coefficient) =>
        distractorOption({
          errorTag: "generic-coefficient-error",
          coefficient,
          core: family.baseCore,
          argument,
        }),
    );

    return primary.concat(generic);
  }

  function buildOptions(exercise, optionCount, rng) {
    const correct = buildCorrectOption(exercise);
    const candidates = buildDistractorCandidates(exercise, rng);
    if (OptionEngine.buildOptionSet) {
      return OptionEngine.buildOptionSet({
        correctOption: correct,
        candidates,
        correctKey: correct.key,
        optionCount,
        rng,
        shuffle,
      });
    }

    const distractors = [];
    const seen = new Set();
    for (const candidate of candidates) {
      addUniqueOption(distractors, seen, candidate, correct.key);
      if (distractors.length >= optionCount - 1) {
        break;
      }
    }
    if (distractors.length < optionCount - 1) {
      return null;
    }
    return {
      correctOption: correct,
      distractors,
      options: shuffle([correct].concat(distractors), rng),
    };
  }

  function buildExerciseFromParams(params, optionCount, rng, metadata) {
    const family = FAMILY_MAP[params.familyId];
    if (!family) {
      throw new Error(`Unknown family: ${params.familyId}`);
    }

    const A = rational(params.A, 1);
    const k = rational(params.k, 1);
    const b = rational(params.b, 1);
    if (A.n === 0 || k.n === 0) {
      throw new Error("A and k must be non-zero.");
    }

    const argument = createArgument(k, b);
    const coefficient = correctCoefficient(A, family, k);
    const meta = metadata || {};
    const templateId = meta.templateId || `trig-linear-${family.id}`;
    const difficulty = String(meta.difficulty || params.difficulty || "1");
    const exercise = {
      id: `ex-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      A,
      k,
      b,
      familyId: family.id,
      family,
      mathFamilyId: meta.mathFamilyId || DEFAULT_MATH_FAMILY_ID,
      methodId: meta.methodId || DEFAULT_METHOD_ID,
      submethodId: meta.submethodId || DEFAULT_SUBMETHOD_ID,
      templateId,
      variantId: meta.variantId || "lineal",
      difficulty,
      generatorId: meta.generatorId || "integrales-lineales",
      rendererId: meta.rendererId || TRIG_LINEAR_RENDERER_ID,
      generationParams: { A: params.A, k: params.k, b: params.b },
      argument,
      correctCoefficient: coefficient,
      signature: exerciseSignature(params),
    };
    exercise.integrandExpression = integralPlain(exercise);
    exercise.integrandLatex = integralLatex(exercise);
    exercise.integrandHtml = integralHtml(exercise);
    exercise.integralShown = {
      plain: exercise.integrandExpression,
      latex: exercise.integrandLatex,
      html: exercise.integrandHtml,
    };
    const optionSet = buildOptions(
      exercise,
      optionCount || 4,
      rng || Math.random,
    );
    if (!optionSet) {
      return null;
    }
    exercise.options = optionSet.options;
    exercise.correctAnswer =
      exercise.options.find((option) => option.isCorrect) ||
      optionSet.correctOption;
    exercise.distractors = optionSet.distractors;
    if (ExerciseModel.createUniversalExercise) {
      return ExerciseModel.createUniversalExercise(exercise);
    }
    return exercise;
  }

  function paramsForDifficulty(difficulty, familyIds, range, rng) {
    const level = Number.parseInt(difficulty, 10) || 1;
    const familyId = choose(familyIds, rng);
    if (level === 1) {
      return { A: choose([-1, 1], rng), k: 1, b: 0, familyId };
    }
    if (level === 2) {
      return {
        A: choose([-1, 1], rng),
        k: randomNonZero(range.min, range.max, rng),
        b: 0,
        familyId,
      };
    }
    if (level === 3) {
      return {
        A: randomNonZero(range.min, range.max, rng),
        k: randomNonZero(range.min, range.max, rng),
        b: 0,
        familyId,
      };
    }
    if (level === 4) {
      return {
        A: randomNonZero(range.min, range.max, rng),
        k: randomNonZero(range.min, range.max, rng),
        b: randomInt(range.min, range.max, rng),
        familyId,
      };
    }

    const family = FAMILY_MAP[familyId];
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const A = randomNonZero(range.min, range.max, rng);
      const k = randomNonZero(range.min, range.max, rng);
      const b = randomNonZero(range.min, range.max, rng);
      const coefficient = correctCoefficient(
        rational(A, 1),
        family,
        rational(k, 1),
      );
      if (coefficient.d !== 1) {
        return { A, k, b, familyId };
      }
    }

    return {
      A: randomNonZero(range.min, range.max, rng),
      k: randomNonZero(range.min, range.max, rng),
      b: randomNonZero(range.min, range.max, rng),
      familyId,
    };
  }

  function normalizeFamilyIds(ids) {
    const valid = Array.isArray(ids)
      ? ids.filter((id, index) => FAMILY_MAP[id] && ids.indexOf(id) === index)
      : [];
    return valid.length ? valid : MODE_FAMILIES.basic.slice();
  }

  function normalizeMethodIds(ids) {
    const methodMap = Taxonomy.METHOD_MAP || { [DEFAULT_METHOD_ID]: true };
    const valid = Array.isArray(ids)
      ? ids.filter((id, index) => methodMap[id] && ids.indexOf(id) === index)
      : [];
    return valid.length ? valid : [DEFAULT_METHOD_ID];
  }

  function normalizeMathFamilyIds(ids) {
    const mathFamilyMap = Taxonomy.MATH_FAMILY_MAP || {
      [DEFAULT_MATH_FAMILY_ID]: true,
    };
    const valid = Array.isArray(ids)
      ? ids.filter(
          (id, index) => mathFamilyMap[id] && ids.indexOf(id) === index,
        )
      : [];
    return valid.length ? valid : [DEFAULT_MATH_FAMILY_ID];
  }

  function registerLinearTemplates() {
    if (!ExerciseGenerator.registerTemplate) {
      return;
    }
    FAMILY_DEFINITIONS.forEach((family) => {
      const templateId = `trig-linear-${family.id}`;
      ExerciseGenerator.registerTemplate({
        id: templateId,
        name: `Integral directa de ${family.name}`,
        familyId: family.id,
        mathFamilyId: DEFAULT_MATH_FAMILY_ID,
        methodId: DEFAULT_METHOD_ID,
        submethodId: DEFAULT_SUBMETHOD_ID,
        difficultyMin: 1,
        difficultyMax: 5,
        variants: [{ ...BASE_VARIANT, appliesToTemplate: templateId }],
        commonErrors: ERROR_TAGS.slice(),
        distractorStrategies: DISTRACTOR_STRATEGIES.slice(),
        difficultyProfile: TRIG_LINEAR_DIFFICULTY_PROFILE,
        parameters: ["A", "k", "b"],
        restrictions: ["A != 0", "k != 0"],
        buildIntegral(exercise) {
          return {
            plain: integralPlain(exercise),
            latex: integralLatex(exercise),
            html: integralHtml(exercise),
          };
        },
        buildCorrectAnswer: buildCorrectOption,
        buildDistractors: buildDistractorCandidates,
        buildExplanation(exercise) {
          return {
            plain: `Aplicar int A f(kx + b) dx = (A/k) F(kx + b) + C para ${exercise.family.name}.`,
          };
        },
        generate(context) {
          const template = context.template || {};
          const settings = context.settings || {};
          const params = paramsForDifficulty(
            settings.difficulty,
            [family.id],
            context.range || sanitizeRange(settings.rangeMin, settings.rangeMax),
            context.rng || Math.random,
          );
          return buildExerciseFromParams(
            params,
            context.optionCount || 4,
            context.rng || Math.random,
            {
              templateId: template.id || `trig-linear-${family.id}`,
              mathFamilyId: template.mathFamilyId || DEFAULT_MATH_FAMILY_ID,
              methodId: template.methodId || DEFAULT_METHOD_ID,
              submethodId: template.submethodId || DEFAULT_SUBMETHOD_ID,
              difficulty: settings.difficulty,
              generatorId: "integrales-lineales",
              variantId: BASE_VARIANT.id,
              rendererId: TRIG_LINEAR_RENDERER_ID,
            },
          );
        },
      });
    });
  }

  function registerLinearRenderer() {
    if (!MathRenderer.registerRenderer) {
      return;
    }
    MathRenderer.registerRenderer({
      id: TRIG_LINEAR_RENDERER_ID,
      renderIntegral(exercise) {
        return {
          plain: integralPlain(exercise),
          latex: integralLatex(exercise),
          html: integralHtml(exercise),
        };
      },
      renderOption(option) {
        return {
          plain: option.displayPlain || expressionPlain(option),
          latex: option.displayLatex || expressionLatex(option),
          html: option.displayHtml || expressionHtml(option),
        };
      },
      renderFeedbackHtml(exercise, chosen) {
        return feedbackHtml(exercise, chosen);
      },
      renderDerivationHtml(exercise) {
        return derivationHtml(exercise);
      },
      renderFamilyLabelHtml(family) {
        return familyLabelHtml(family);
      },
      renderFormulaCatalog() {
        return formulaCatalog();
      },
      renderErrorExampleMathHtml(example) {
        return errorExampleMathHtml(example);
      },
    });
  }

  function generateExercise(settings, recentSignatures, rng) {
    const random = rng || Math.random;
    const optionCount = Math.max(
      4,
      Math.min(6, Number.parseInt(settings.optionCount, 10) || 4),
    );
    const familyIds = normalizeFamilyIds(
      settings.activeFamilyIds || MODE_FAMILIES[settings.mode],
    );
    const mathFamilyIds = normalizeMathFamilyIds(settings.activeMathFamilyIds);
    const methodIds = normalizeMethodIds(settings.activeMethodIds);
    const range = sanitizeRange(settings.rangeMin, settings.rangeMax);
    const recent = new Set(
      Array.isArray(recentSignatures) ? recentSignatures : [],
    );

    if (ExerciseGenerator.generateExercise) {
      const generated = ExerciseGenerator.generateExercise({
        settings,
        recentSignatures,
        rng: random,
        familyIds,
        mathFamilyIds,
        methodIds,
        range,
        optionCount,
      });
      if (generated) {
        return generated;
      }
      throw new Error(
        "No hay plantillas compatibles con la configuracion actual.",
      );
    }

    for (let attempt = 0; attempt < 300; attempt += 1) {
      const params = paramsForDifficulty(
        settings.difficulty,
        familyIds,
        range,
        random,
      );
      if (recent.has(exerciseSignature(params)) && attempt < 250) {
        continue;
      }
      const exercise = buildExerciseFromParams(params, optionCount, random, {
        difficulty: settings.difficulty,
        mathFamilyId: mathFamilyIds[0] || DEFAULT_MATH_FAMILY_ID,
      });
      if (exercise) {
        return exercise;
      }
    }

    throw new Error(
      "No se pudo generar un ejercicio unico con la configuracion actual.",
    );
  }

  function feedbackVariables(exercise, chosen) {
    const aOverK = divide(exercise.A, exercise.k);
    const substitutionRightHtml = `${termHtml(exercise.correctCoefficient, exercise.family.baseCore, exercise.argument)} ${plusCHtml()}`;
    const substitutionRightPlain = `${termPlain(exercise.correctCoefficient, exercise.family.baseCore, exercise.argument)} + C`;
    return {
      A: rationalPlain(exercise.A),
      AHtml: rationalHtml(exercise.A),
      k: rationalPlain(exercise.k),
      kHtml: rationalHtml(exercise.k),
      b: rationalPlain(exercise.b),
      bHtml: rationalHtml(exercise.b),
      u: exercise.argument.display,
      uHtml: exercise.argument.displayHtml,
      fU: exercise.family.fDisplay,
      fUHtml: familyIntegrandHtml(exercise.family),
      FU: exercise.family.FDisplay,
      FUHtml: familyAntiderivativeHtml(exercise.family),
      FWithArgument: antiderivativeWithArgumentPlain(
        exercise.family,
        exercise.argument,
      ),
      FWithArgumentHtml: antiderivativeWithArgumentHtml(
        exercise.family,
        exercise.argument,
      ),
      baseRule: `int ${exercise.family.fDisplay} du = ${exercise.family.FDisplay} + C`,
      baseRuleHtml: baseRuleHtml(exercise.family),
      generalRule: "int A f(kx + b) dx = (A/k) F(kx + b) + C",
      generalRuleHtml: generalRuleHtml(),
      AOverK: rationalPlain(aOverK),
      AOverKHtml: rationalHtml(aOverK),
      currentIntegral: exercise.integrandExpression,
      currentIntegralHtml: exercise.integrandHtml,
      substitutionExpression: `${exercise.integrandExpression} = ${substitutionRightPlain}`,
      substitutionExpressionHtml: mathExpression(
        `${integralHtml(exercise)} ${opHtml("=")} ${substitutionRightHtml}`,
      ),
      correctCoefficient: rationalPlain(exercise.correctCoefficient),
      correctCoefficientHtml: rationalHtml(exercise.correctCoefficient),
      chosenExpression: chosen ? chosen.displayExpression : "",
      chosenExpressionHtml: chosen ? chosen.displayHtml : "",
      correctExpression: exercise.correctAnswer.displayExpression,
      correctExpressionHtml: exercise.correctAnswer.displayHtml,
      familyName: exercise.family.name,
      baseCore: exercise.family.baseCore,
      baseSign: String(exercise.family.baseSign),
      absK: rationalPlain(absRational(exercise.k)),
    };
  }

  function htmlLine(label, value) {
    return `<div><strong>${label}</strong><span>${value}</span></div>`;
  }

  function reconstructionHtml(exercise, vars) {
    return `
      <div class="reconstruction">
        <span class="section-label">Para este ejercicio</span>
        <div class="feedback-values">
          ${htmlLine("A", vars.AHtml)}
          ${htmlLine("k", vars.kHtml)}
          ${htmlLine("b", vars.bHtml)}
          ${htmlLine("u", vars.uHtml)}
          ${htmlLine("f(u)", vars.fUHtml)}
          ${htmlLine("F(u)", vars.FUHtml)}
        </div>
        <div class="rule-box">
          <p>La regla base es:</p>
          <div class="centered-formula">${vars.baseRuleHtml}</div>
          <p>Regla general:</p>
          <div class="centered-formula">${vars.generalRuleHtml}</div>
          <p>Sustituyendo:</p>
          <div class="centered-formula">${vars.substitutionExpressionHtml}</div>
          <p>Resultado simplificado:</p>
          <div class="centered-formula">${vars.correctExpressionHtml}</div>
        </div>
      </div>`;
  }

  function feedbackHtml(exercise, chosen) {
    function renderCorrect(context) {
      const vars = feedbackVariables(exercise, context.chosen || chosen);
      return `
        <div class="feedback-title">Correcto</div>
        <p>Identificaste la antiderivada base F(u) = <span class="math-inline">${vars.FUHtml}</span> y compensaste la derivada del argumento u' = <span class="math-inline">${vars.kHtml}</span>.</p>
        <p><strong class="math-inline">${vars.correctExpressionHtml}</strong></p>`;
    }

    function renderIncorrect(context) {
      const activeChoice = context.chosen || chosen;
      const vars = feedbackVariables(exercise, activeChoice);
      const errorTag =
        (context.validation && context.validation.errorTag) ||
        (activeChoice && activeChoice.errorTag) ||
        "generic-coefficient-error";
      const templates = {
        "wrong-family": `Usaste una familia incorrecta como antiderivada. En este ejercicio el integrando usa f(u) = <span class="math-inline">${vars.fUHtml}</span>, cuya antiderivada base es F(u) = <span class="math-inline">${vars.FUHtml}</span>. Por eso la respuesta debe usar F(u), no la familia que elegiste.`,
        "wrong-base-sign": `Recordaste la familia correcta, pero fallaste el signo base de la integral. Para esta familia se cumple que <span class="math-inline">${vars.baseRuleHtml}</span>. Ese signo debe aplicarse antes de dividir entre k.`,
        "forgot-chain-factor": `Usaste la antiderivada base correcta, pero olvidaste compensar la derivada del argumento. El argumento es u = <span class="math-inline">${vars.uHtml}</span>, por lo tanto u' = <span class="math-inline">${vars.kHtml}</span>. Por eso la antiderivada debe multiplicarse por <span class="math-inline">${fracHtml(numHtml(1), vars.kHtml)}</span>.`,
        "ignored-negative-k": `Compensaste la derivada del argumento, pero ignoraste su signo. El argumento es u = <span class="math-inline">${vars.uHtml}</span>, asi que u' = <span class="math-inline">${vars.kHtml}</span>, no ${vars.absK}. Debias dividir entre <span class="math-inline">${vars.kHtml}</span>, no solamente entre su valor positivo.`,
        "lost-external-sign": `Perdiste el signo del coeficiente externo. El integrando completo esta multiplicado por A = <span class="math-inline">${vars.AHtml}</span>. Ese valor debe entrar completo en el coeficiente A/k, incluyendo su signo.`,
        "copied-integrand": `Tu respuesta conserva demasiado la forma del integrando. Integrar significa buscar una funcion que, al derivarse, regrese al integrando original. Aqui el integrando usa f(u) = <span class="math-inline">${vars.fUHtml}</span>, pero la antiderivada base debe ser F(u) = <span class="math-inline">${vars.FUHtml}</span>.`,
        "lost-argument-shift": `Usaste la estructura correcta, pero cambiaste el argumento. El argumento original es u = <span class="math-inline">${vars.uHtml}</span>. La antiderivada debe conservar exactamente ese argumento, porque al derivarlo aparece el factor u' = <span class="math-inline">${vars.kHtml}</span>.`,
        "generic-coefficient-error": `El tipo de funcion es correcto, pero el coeficiente no coincide. El coeficiente correcto se obtiene con A por el signo base, dividido entre k. En este ejercicio eso da <span class="math-inline">${vars.correctCoefficientHtml}</span>.`,
      };

      return `
        <div class="feedback-title">Incorrecto: ${errorLabelHtml(errorTag)}</div>
        <p>${templates[errorTag] || templates["generic-coefficient-error"]}</p>
        <div class="divider"></div>
        ${reconstructionHtml(exercise, vars)}`;
    }

    if (FeedbackEngine.buildFeedbackHtml) {
      return FeedbackEngine.buildFeedbackHtml(exercise, chosen, {
        validation: chosen ? validateAnswer(exercise, chosen.id) : null,
        correct: renderCorrect,
        incorrect: renderIncorrect,
      });
    }

    return !chosen || chosen.isCorrect
      ? renderCorrect({ chosen })
      : renderIncorrect({ chosen });
  }

  function validateAnswer(exercise, optionId) {
    if (Validation.validateMultipleChoice) {
      return Validation.validateMultipleChoice(exercise, optionId);
    }
    const chosen = exercise.options.find((option) => option.id === optionId);
    return {
      isValid: Boolean(chosen),
      isCorrect: Boolean(chosen && chosen.isCorrect),
      selectedOption: chosen || null,
      errorTag: chosen ? chosen.errorTag : "invalid-option",
      errorType: chosen ? chosen.errorType || chosen.errorTag : "invalid-option",
      stats: exercise.statsInfo || {},
    };
  }

  function derivativeBaseHtml(family, argument) {
    switch (family.baseCore) {
      case "cos":
        return termHtml(rational(-1, 1), "sin", argument);
      case "sin":
        return coreHtml("cos", argument);
      case "lnAbsCos":
        return termHtml(rational(-1, 1), "tan", argument);
      case "lnAbsSin":
        return coreHtml("cot", argument);
      case "tan":
        return coreHtml("sec2", argument);
      case "cot":
        return termHtml(rational(-1, 1), "csc2", argument);
      case "sec":
        return coreHtml("secTan", argument);
      case "csc":
        return termHtml(rational(-1, 1), "cscCot", argument);
      case "lnAbsSecPlusTan":
        return coreHtml("sec", argument);
      case "lnAbsCscMinusCot":
        return coreHtml("csc", argument);
      case "arctan":
        return coreHtml("atanDerivative", argument);
      case "arcsin":
        return coreHtml("asinDerivative", argument);
      case "arccos":
        return coreHtml("acosDerivative", argument);
      default:
        return family.derivativeCore.replaceAll("u", argument.display);
    }
  }

  function derivationHtml(exercise) {
    const correctBody = termHtml(
      exercise.correctCoefficient,
      exercise.family.baseCore,
      exercise.argument,
    );
    const derivativeCore = derivativeBaseHtml(
      exercise.family,
      exercise.argument,
    );
    return `
      <p><strong>Verificación por derivada</strong></p>
      <p><span class="math-inline">${mathExpression(`${fracHtml('<span class="math-d">d</span>', differentialHtml("x"))}<span class="math-bracket">[</span>${correctBody}<span class="math-bracket">]</span>`)}</span></p>
      <p><span class="math-inline">${mathExpression(`${opHtml("=")} ${rationalHtml(exercise.correctCoefficient)}<span class="math-thin-space"></span>${parensHtml(derivativeCore)}<span class="math-thin-space"></span>${rationalHtml(exercise.k)}`)}</span></p>
      <p><span class="math-inline">${mathExpression(`${opHtml("=")} ${integralTermHtml(exercise.family, exercise.A, exercise.argument)}`)}</span></p>
      <p>El resultado coincide con el integrando.</p>`;
  }

  registerLinearRenderer();
  registerLinearTemplates();

  const api = {
    moduleId: "integrales-lineales",
    moduleName: "Integrales con argumento lineal",
    modelVersion: "1.3",
    ERROR_TAGS,
    ERROR_LABELS,
    ERROR_LABELS_HTML,
    MATH_FAMILIES: Taxonomy.MATH_FAMILIES || [],
    MATH_FAMILY_MAP: Taxonomy.MATH_FAMILY_MAP || {},
    METHODS: Taxonomy.METHODS || [],
    METHOD_MAP: Taxonomy.METHOD_MAP || {},
    ERROR_TYPES: Taxonomy.ERROR_TYPES || [],
    ERROR_TYPE_MAP: Taxonomy.ERROR_TYPE_MAP || {},
    FAMILIES: FAMILY_DEFINITIONS,
    FAMILY_MAP,
    MODE_FAMILIES,
    RANGE_LIMITS,
    rational,
    rationalPlain,
    rationalLatex,
    rationalHtml,
    rationalKey,
    equals,
    createArgument,
    formatArgumentPlain,
    formatArgumentHtml,
    corePlain,
    coreHtml,
    expressionPlain,
    expressionLatex,
    expressionHtml,
    integralPlain,
    integralLatex,
    integralHtml,
    plainMathHtml,
    correctCoefficient,
    buildExerciseFromParams,
    generateExercise,
    registerTemplate: ExerciseGenerator.registerTemplate,
    listTemplates: ExerciseGenerator.listTemplates,
    findTemplates: ExerciseGenerator.findTemplates,
    validateAnswer,
    sanitizeRange,
    exerciseSnapshot,
    optionSnapshot,
    errorExampleMathHtml,
    renderIntegral,
    renderOption,
    feedbackHtml,
    derivationHtml,
    feedbackVariables,
    generalRuleHtml,
    formulaCatalog,
    familyLabelHtml,
    errorLabelHtml,
    normalizeMethodIds,
    normalizeMathFamilyIds,
    shuffle,
  };

  root.TrigCoreModules = root.TrigCoreModules || {};
  root.TrigCoreModules.integralesLineales = api;
  if (root.TrigCoreRegistry) {
    root.TrigCoreRegistry.register(api);
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
