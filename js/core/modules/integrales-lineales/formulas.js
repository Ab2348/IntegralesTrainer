(function (root) {
  "use strict";

  if (typeof require === "function") {
    require("../../math-content.js");
    require("./familias.js");
    require("./errores.js");
    require("./formato.js");
  }

  const Families = root.TrigLinearFamilies || {};
  const Errors = root.TrigLinearErrors || {};
  const Format = root.TrigLinearFormat || {};
  const MathContent = root.TrigMathContent || {};
  const { FAMILY_DEFINITIONS, FAMILY_MAP } = Families;
  const { ERROR_LABELS } = Errors;
  const { mathInline } = MathContent;

  function familyAntiderivativePlain(family) {
    return Format.termPlain(
      Format.rational(family.baseSign, 1),
      family.baseCore,
      Format.createSymbolArgument("u"),
    );
  }

  function familyAntiderivativeLatex(family) {
    return Format.termLatex(
      Format.rational(family.baseSign, 1),
      family.baseCore,
      Format.createSymbolArgument("u"),
    );
  }

  function antiderivativeWithArgumentPlain(family, argument) {
    return Format.termPlain(
      Format.rational(family.baseSign, 1),
      family.baseCore,
      argument,
    );
  }

  function baseRuleLatex(family) {
    return `\\int ${Format.coreLatex(family.integrandCore, Format.createSymbolArgument("u"))}\\,du = ${familyAntiderivativeLatex(family)} + C`;
  }

  function generalRuleLatex() {
    const argument = "kx + b";
    return `\\int A f\\left(${argument}\\right)\\,dx = \\frac{A}{k} F\\left(${argument}\\right) + C`;
  }

  function symbolicLinearArgument() {
    return {
      k: Format.rational(1, 1),
      b: Format.rational(0, 1),
      display: "kx + b",
      displayLatex: "kx + b",
      key: "kx+b",
    };
  }

  function linearFormulaLatex(family) {
    const argument = symbolicLinearArgument();
    const coefficient = family.baseSign < 0 ? "-\\frac{1}{k}" : "\\frac{1}{k}";
    return `\\int ${Format.coreLatex(family.integrandCore, argument)}\\,dx = ${coefficient} ${Format.coreLatex(family.baseCore, argument)} + C`;
  }

  function linearFormulaPlain(family) {
    const argument = symbolicLinearArgument();
    const coefficient = family.baseSign < 0 ? "-(1/k)" : "(1/k)";
    return `int ${Format.corePlain(family.integrandCore, argument)} dx = ${coefficient} ${Format.corePlain(family.baseCore, argument)} + C`;
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

  function errorLabelContent(errorTag) {
    if (errorTag === "ignored-negative-k") {
      return ["Signo de ", mathInline("k"), " ignorado"];
    }
    return [ERROR_LABELS[errorTag] || errorTag];
  }

  const api = {
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
  };

  root.TrigLinearFormulas = api;
  root.TrigLinearFormat = {
    ...(root.TrigLinearFormat || {}),
    ...api,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigLinearFormulas;
  }
})(typeof window !== "undefined" ? window : globalThis);
