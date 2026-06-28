(function (root) {
  "use strict";

  if (typeof require === "function") {
    require("./familias.js");
    require("./formato.js");
  }

  const Families = root.TrigLinearFamilies || {};
  const Format = root.TrigLinearFormat || {};
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
      const argument = Format.createArgument(k, b);
      const exercise = {
        A,
        k,
        b,
        familyId: family.id,
        family,
        argument,
      };
      const correctOption = {
        coefficient: Format.correctCoefficient(A, family, k),
        core: family.baseCore,
        argument,
      };
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

  const api = {
    rationalSnapshot,
    argumentSnapshot,
    exerciseSnapshot,
    optionSnapshot,
    restoreRationalSnapshot,
    restoreArgumentSnapshot,
    restoreOptionSnapshot,
    errorExampleMath,
  };

  root.TrigLinearSnapshots = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigLinearSnapshots;
  }
})(typeof window !== "undefined" ? window : globalThis);
