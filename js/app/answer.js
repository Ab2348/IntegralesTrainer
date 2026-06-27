(function (root) {
  "use strict";

  const App = (root.TrigTrainerApp = root.TrigTrainerApp || {});

  App.createAnswerController = function createAnswerController({
    Core,
    exerciseView,
    getCurrentExercise,
    getAnswered,
    setAnswered,
    statsPanel,
    statsService,
    stateStore,
  }) {
    function answer(optionId) {
      const currentExercise = getCurrentExercise();
      if (getAnswered() || !currentExercise) {
        return;
      }
      const chosen = currentExercise.options.find(
        (option) => option.id === optionId,
      );
      if (!chosen) {
        return;
      }

      const validation = Core && Core.validateAnswer
        ? Core.validateAnswer(currentExercise, optionId)
        : {
            isValid: true,
            isCorrect: Boolean(chosen.isCorrect),
            selectedOption: chosen,
            errorTag: chosen.errorTag,
            errorType: chosen.errorType || chosen.errorTag,
            stats: currentExercise.statsInfo || {},
          };

      setAnswered(true);
      const recorder = statsService || statsPanel;
      recorder.recordAnswer(currentExercise, validation);
      exerciseView.renderAnsweredState(currentExercise, chosen, validation);
      statsPanel.render();
      stateStore.saveState();
    }

    return {
      answer,
    };
  };
})(typeof window !== "undefined" ? window : globalThis);
