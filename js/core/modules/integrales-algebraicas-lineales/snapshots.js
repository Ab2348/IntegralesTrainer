(function (root) {
  "use strict";

  if (typeof require === "function") {
    require("./familias.js");
    require("./formato.js");
  }

  const Families = root.TrigAlgebraicLinearFamilies || {};
  const Format = root.TrigAlgebraicLinearFormat || {};
  const { FAMILY_MAP } = Families;

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
      n: exercise.n,
      familyId: exercise.familyId,
    };
  }

  function optionSnapshot(option) {
    return {
      coefficient: rationalSnapshot(option.coefficient),
      answerKind: option.answerKind,
      exponent: option.exponent,
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
    return Format.rational(value.n, value.d);
  }

  function restoreArgumentSnapshot(value) {
    if (!value) {
      throw new Error("Invalid argument snapshot.");
    }
    return Format.createArgument(
      restoreRationalSnapshot(value.k),
      restoreRationalSnapshot(value.b),
    );
  }

  function restoreOptionSnapshot(value) {
    if (!value || typeof value.answerKind !== "string") {
      throw new Error("Invalid option snapshot.");
    }
    return {
      coefficient: restoreRationalSnapshot(value.coefficient),
      answerKind: value.answerKind,
      exponent: value.exponent,
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
      const n = example.exerciseMath.n;
      const argument = Format.createArgument(k, b);
      const shape = Format.correctAnswerShape(A, k, n);
      const correctOption = {
        coefficient: shape.coefficient,
        answerKind: shape.answerKind,
        exponent: shape.exponent,
        argument,
      };
      const exercise = { A, k, b, n, familyId: family.id, family, argument };
      return {
        exercise: {
          plain: Format.integralPlain(exercise),
          latex: Format.integralLatex(exercise),
        },
        chosen: {
          plain: Format.expressionPlain(restoreOptionSnapshot(example.chosenMath)),
          latex: Format.expressionLatex(restoreOptionSnapshot(example.chosenMath)),
        },
        correct: {
          plain: Format.expressionPlain(correctOption),
          latex: Format.expressionLatex(correctOption),
        },
      };
    } catch (error) {
      return null;
    }
  }

  root.TrigAlgebraicLinearSnapshots = {
    rationalSnapshot,
    argumentSnapshot,
    exerciseSnapshot,
    optionSnapshot,
    restoreRationalSnapshot,
    restoreArgumentSnapshot,
    restoreOptionSnapshot,
    errorExampleMath,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigAlgebraicLinearSnapshots;
  }
})(typeof window !== "undefined" ? window : globalThis);
