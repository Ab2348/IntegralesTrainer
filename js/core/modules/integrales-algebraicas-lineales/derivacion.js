(function (root) {
  "use strict";

  if (typeof require === "function") {
    require("../../racionales.js");
    require("./formato.js");
  }

  const Rational = root.TrigRationalUtils || {};
  const Format = root.TrigAlgebraicLinearFormat || {};
  const { rational, multiplyInt, rationalLatex } = Rational;
  const {
    contentNode,
    mathInline,
    powerLatex,
    logTermLatex,
    powerTermLatex,
    integralTermLatex,
  } = Format;

  function derivativeBaseLatex(exercise) {
    if (exercise.answerKind === "log") {
      return `\\frac{1}{${exercise.argument.displayLatex}}`;
    }
    return `${exercise.correctExponent}${powerLatex(
      exercise.argument,
      exercise.correctExponent - 1,
    )}`;
  }

  function answerBodyLatex(exercise) {
    if (exercise.answerKind === "log") {
      return logTermLatex(exercise.correctCoefficient, exercise.argument);
    }
    return powerTermLatex(
      exercise.correctCoefficient,
      exercise.argument,
      exercise.correctExponent,
    );
  }

  function derivationContent(exercise) {
    const body = answerBodyLatex(exercise);
    const derivativeBase = derivativeBaseLatex(exercise);
    const chain = rationalLatex(exercise.k);
    const coefficient = rationalLatex(exercise.correctCoefficient);
    return [
      contentNode("p", "", [contentNode("strong", "", ["Verificacion por derivada"])]),
      contentNode("p", "", [mathInline(`\\frac{d}{dx}\\left[${body}\\right]`)]),
      contentNode("p", "", [
        mathInline(`= ${coefficient}\\left(${derivativeBase}\\right)${chain}`),
      ]),
      contentNode("p", "", [mathInline(`= ${integralTermLatex(exercise)}`)]),
      contentNode("p", "", ["El resultado coincide con el integrando."]),
    ];
  }

  root.TrigAlgebraicLinearDerivation = {
    derivativeBaseLatex,
    answerBodyLatex,
    derivationContent,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigAlgebraicLinearDerivation;
  }
})(typeof window !== "undefined" ? window : globalThis);
