(function (root) {
  "use strict";

  const App = (root.TrigTrainerApp = root.TrigTrainerApp || {});

  App.createStatsService = function createStatsService({ Core, stateStore }) {
    function incrementCounter(map, key) {
      if (!key) {
        return;
      }
      map[key] = (map[key] || 0) + 1;
    }

    function normalizeValidation(exercise, resultOrOption) {
      if (resultOrOption && resultOrOption.selectedOption) {
        return resultOrOption;
      }
      const chosen = resultOrOption;
      return {
        isValid: Boolean(chosen),
        isCorrect: Boolean(chosen && chosen.isCorrect),
        selectedOption: chosen || null,
        errorTag: chosen ? chosen.errorTag : "",
        errorType: chosen ? chosen.errorType || chosen.errorTag : "",
        stats: exercise.statsInfo || {},
      };
    }

    function pushErrorExample(exercise, chosen, validation) {
      const state = stateStore.getState();
      const tag =
        (validation && (validation.errorType || validation.errorTag)) ||
        (chosen && (chosen.errorType || chosen.errorTag)) ||
        "";
      if (!chosen || chosen.isCorrect || !stateStore.isValidErrorTag(tag)) {
        return;
      }

      const examples = Array.isArray(state.errorExamplesByTag[tag])
        ? state.errorExamplesByTag[tag]
        : [];
      const example = {
        id: `err-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        timestamp: Date.now(),
        errorTag: tag,
        moduleId:
          exercise.moduleId ||
          (exercise.statsInfo && exercise.statsInfo.moduleId) ||
          "",
        familyId: exercise.familyId,
        mathFamilyId:
          validation.mathFamilyId || validation.stats.mathFamilyId || "",
        exercisePlain: exercise.integrandExpression,
        chosenPlain: chosen.displayExpression,
        correctPlain: exercise.correctAnswer.displayExpression,
        exerciseMath: Core.exerciseSnapshot(exercise),
        chosenMath: Core.optionSnapshot(chosen),
        methodId: validation.methodId || validation.stats.methodId || "",
        submethodId:
          validation.submethodId || validation.stats.submethodId || "",
        difficulty: validation.difficulty || validation.stats.difficulty || "",
        templateId: validation.templateId || validation.stats.templateId || "",
        variantId: validation.variantId || validation.stats.variantId || "",
      };
      state.errorExamplesByTag[tag] = [example]
        .concat(examples)
        .slice(0, stateStore.constants.ERROR_EXAMPLES_PER_TAG_LIMIT);
      state.recentErrorHistory = [example]
        .concat(Array.isArray(state.recentErrorHistory) ? state.recentErrorHistory : [])
        .slice(0, 20);
    }

    function recordAnswer(exercise, resultOrOption) {
      const state = stateStore.getState();
      const validation = normalizeValidation(exercise, resultOrOption);
      const chosen = validation.selectedOption;
      const stats = validation.stats || exercise.statsInfo || {};
      const familyId = stats.familyId || validation.familyId || exercise.familyId;
      const mathFamilyId =
        stats.mathFamilyId || validation.mathFamilyId || exercise.mathFamilyId;
      const methodId =
        stats.methodId || validation.methodId || exercise.methodId;
      const submethodId =
        stats.submethodId || validation.submethodId || exercise.submethodId;
      const difficulty =
        String(stats.difficulty || validation.difficulty || exercise.difficulty || "");
      const templateId =
        stats.templateId || validation.templateId || exercise.templateId;
      const variantId =
        stats.variantId || validation.variantId || exercise.variantId;

      state.totalAnswered += 1;
      incrementCounter(state.familyCounts, familyId);
      incrementCounter(state.mathFamilyCounts, mathFamilyId);
      incrementCounter(state.methodCounts, methodId);
      incrementCounter(state.submethodCounts, submethodId);
      incrementCounter(state.difficultyCounts, difficulty);
      incrementCounter(state.templateCounts, templateId);
      incrementCounter(state.variantCounts, variantId);

      if (validation.isCorrect) {
        state.totalCorrect += 1;
        return validation;
      }

      state.totalIncorrect += 1;
      incrementCounter(state.errorCountsByTag, validation.errorTag);
      incrementCounter(state.familyErrorCounts, familyId);
      incrementCounter(state.mathFamilyErrorCounts, mathFamilyId);
      incrementCounter(state.methodErrorCounts, methodId);
      incrementCounter(state.submethodErrorCounts, submethodId);
      incrementCounter(state.difficultyErrorCounts, difficulty);
      incrementCounter(state.templateErrorCounts, templateId);
      incrementCounter(state.variantErrorCounts, variantId);
      pushErrorExample(exercise, chosen, validation);
      return validation;
    }

    function rankedEntries(data, limit = 5) {
      return Object.entries(data || {})
        .filter((entry) => entry[1] > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);
    }

    function latestErrorExample(tag) {
      const state = stateStore.getState();
      const examples = Array.isArray(state.errorExamplesByTag[tag])
        ? state.errorExamplesByTag[tag]
        : [];
      if (!examples.length) {
        return null;
      }
      return examples.reduce((latest, example) =>
        example.timestamp > latest.timestamp ? example : latest,
      );
    }

    function getStatsViewModel() {
      const state = stateStore.getState();
      const total = state.totalAnswered || 0;
      const correct = state.totalCorrect || 0;
      const incorrect = state.totalIncorrect || 0;
      return {
        accuracy: total ? Math.round((correct / total) * 100) : 0,
        correct,
        errorEntries: rankedEntries(state.errorCountsByTag),
        familyErrorEntries: rankedEntries(state.familyErrorCounts),
        incorrect,
        total,
      };
    }

    return {
      getStatsViewModel,
      latestErrorExample,
      normalizeValidation,
      recordAnswer,
    };
  };
})(typeof window !== "undefined" ? window : globalThis);
