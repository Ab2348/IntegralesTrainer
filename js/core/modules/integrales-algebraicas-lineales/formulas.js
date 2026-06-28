(function (root) {
  "use strict";

  if (typeof require === "function") {
    require("../../math-content.js");
    require("./familias.js");
    require("./errores.js");
  }

  const Families = root.TrigAlgebraicLinearFamilies || {};
  const Errors = root.TrigAlgebraicLinearErrors || {};
  const MathContent = root.TrigMathContent || {};
  const { FAMILY_DEFINITIONS, FAMILY_MAP } = Families;
  const { ERROR_LABELS } = Errors;
  const { mathInline } = MathContent;

  function generalRuleLatex() {
    return "\\int A\\left(kx+b\\right)^n\\,dx = \\frac{A}{k(n+1)}\\left(kx+b\\right)^{n+1}+C,\\quad n\\ne -1";
  }

  function logarithmicRuleLatex() {
    return "\\int \\frac{A}{kx+b}\\,dx = \\frac{A}{k}\\ln\\left|kx+b\\right|+C";
  }

  function baseRuleLatex(family) {
    return family && family.kind === "log" ? logarithmicRuleLatex() : generalRuleLatex();
  }

  function linearFormulaLatex(family) {
    return baseRuleLatex(family);
  }

  function linearFormulaPlain(family) {
    return family && family.kind === "log"
      ? "int A/(kx + b) dx = (A/k) ln |kx + b| + C"
      : "int A(kx + b)^n dx = A/(k(n + 1)) (kx + b)^(n + 1) + C, n != -1";
  }

  function familyLabelLatex(familyOrId) {
    const family =
      typeof familyOrId === "string" ? FAMILY_MAP[familyOrId] : familyOrId;
    if (!family) {
      return "";
    }
    if (family.id === "reciproca-lineal") {
      return "\\frac{A}{kx+b}";
    }
    return "A(kx+b)^n";
  }

  function familyLabelExpression(familyOrId) {
    const family =
      typeof familyOrId === "string" ? FAMILY_MAP[familyOrId] : familyOrId;
    return {
      plain: family ? family.name : "",
      latex: familyLabelLatex(family),
    };
  }

  function formulaCatalog() {
    return FAMILY_DEFINITIONS.map((family) => ({
      id: family.id,
      name: family.name,
      labelLatex: familyLabelLatex(family),
      basePlain: linearFormulaPlain(family),
      baseLatex: baseRuleLatex(family),
      linearPlain: linearFormulaPlain(family),
      linearLatex: linearFormulaLatex(family),
    }));
  }

  function errorLabelContent(errorTag) {
    if (errorTag === "forgot-chain-factor") {
      return ["Falta compensar ", mathInline("u'=k")];
    }
    return [ERROR_LABELS[errorTag] || errorTag];
  }

  root.TrigAlgebraicLinearFormulas = {
    generalRuleLatex,
    logarithmicRuleLatex,
    baseRuleLatex,
    linearFormulaLatex,
    linearFormulaPlain,
    formulaCatalog,
    familyLabelLatex,
    familyLabelExpression,
    errorLabelContent,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigAlgebraicLinearFormulas;
  }
})(typeof window !== "undefined" ? window : globalThis);
