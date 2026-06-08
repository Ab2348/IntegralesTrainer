(function (root) {
  "use strict";

  const App = (root.TrigTrainerApp = root.TrigTrainerApp || {});

  App.createAnswerController = function createAnswerController({
    exerciseView,
    getCurrentExercise,
    getAnswered,
    setAnswered,
    statsPanel,
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

      setAnswered(true);
      statsPanel.recordAnswer(currentExercise, chosen);
      exerciseView.renderAnsweredState(currentExercise, chosen);
      statsPanel.render();
      stateStore.saveState();
    }

    return {
      answer,
    };
  };
})(typeof window !== "undefined" ? window : globalThis);
