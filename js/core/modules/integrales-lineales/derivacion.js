(function (root) {
  "use strict";

  if (typeof require === "function") {
    require("../../racionales.js");
    require("./formato.js");
  }

  const Rational = root.TrigRationalUtils || {};
  const Format = root.TrigLinearFormat || {};
  const { rational, rationalLatex } = Rational;
  const { termLatex, coreLatex, integralTermLatex, contentNode, mathInline } = Format;

  function derivativeBaseLatex(family, argument) {
    switch (family.baseCore) {
      case "cos":
        return termLatex(rational(-1, 1), "sin", argument);
      case "sin":
        return coreLatex("cos", argument);
      case "lnAbsCos":
        return termLatex(rational(-1, 1), "tan", argument);
      case "lnAbsSin":
        return coreLatex("cot", argument);
      case "tan":
        return coreLatex("sec2", argument);
      case "cot":
        return termLatex(rational(-1, 1), "csc2", argument);
      case "sec":
        return coreLatex("secTan", argument);
      case "csc":
        return termLatex(rational(-1, 1), "cscCot", argument);
      case "lnAbsSecPlusTan":
        return coreLatex("sec", argument);
      case "lnAbsCscMinusCot":
        return coreLatex("csc", argument);
      case "arctan":
        return coreLatex("atanDerivative", argument);
      case "arcsin":
        return coreLatex("asinDerivative", argument);
      case "arccos":
        return coreLatex("acosDerivative", argument);
      default:
        return family.derivativeCore.replaceAll("u", argument.display);
    }
  }

  function derivationContent(exercise) {
    const correctBodyLatex = termLatex(
      exercise.correctCoefficient,
      exercise.family.baseCore,
      exercise.argument,
    );
    const derivativeCoreLatex = derivativeBaseLatex(
      exercise.family,
      exercise.argument,
    );
    return [
      contentNode("p", "", [contentNode("strong", "", ["Verificación por derivada"])]),
      contentNode("p", "", [
        mathInline(`\\frac{d}{dx}\\left[${correctBodyLatex}\\right]`),
      ]),
      contentNode("p", "", [
        mathInline(
          `= ${rationalLatex(exercise.correctCoefficient)}\\left(${derivativeCoreLatex}\\right)${rationalLatex(exercise.k)}`,
        ),
      ]),
      contentNode("p", "", [
        mathInline(
          `= ${integralTermLatex(exercise.family, exercise.A, exercise.argument)}`,
        ),
      ]),
      contentNode("p", "", ["El resultado coincide con el integrando."]),
    ];
  }

  root.TrigLinearDerivation = {
    derivativeBaseLatex,
    derivationContent,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigLinearDerivation;
  }
})(typeof window !== "undefined" ? window : globalThis);
