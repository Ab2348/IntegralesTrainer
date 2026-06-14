(function (root) {
  "use strict";

  const App = (root.TrigTrainerApp = root.TrigTrainerApp || {});

  App.createExerciseView = function createExerciseView({ Core, els }) {
    function clearDerivation() {
      els.derivationZone.innerHTML = "";
      els.derivationZone.classList.add("hidden");
      els.derivationButton.classList.add("hidden");
      els.derivationButton.textContent = "Ver derivación";
      els.derivationButton.setAttribute("aria-expanded", "false");
    }

    function renderGenerationError(error, settings) {
      els.familyLabel.textContent = "Familia";
      els.difficultyLabel.textContent = `Nivel ${settings.difficulty}`;
      els.exerciseDisplay.textContent = "";
      els.optionsContainer.innerHTML = "";
      clearDerivation();

      const title = document.createElement("div");
      title.className = "feedback-title";
      title.textContent = "No se pudo generar el ejercicio";

      const message = document.createElement("p");
      message.textContent =
        error && error.message
          ? error.message
          : "Revisa la configuracion e intenta de nuevo.";

      els.feedbackZone.innerHTML = "";
      els.feedbackZone.className = "feedback-zone incorrect";
      els.feedbackZone.append(title, message);
    }

    function renderExercise(exercise, settings, onAnswer) {
      const family = exercise.family;
      els.familyLabel.innerHTML = `Familia ${Core.familyLabelHtml(family)}`;
      els.difficultyLabel.textContent = `Nivel ${settings.difficulty}`;
      const integralDisplay = Core.renderIntegral
        ? Core.renderIntegral(exercise)
        : exercise.integralShown;
      els.exerciseDisplay.innerHTML =
        integralDisplay && integralDisplay.html
          ? integralDisplay.html
          : exercise.integrandHtml;
      els.optionsContainer.innerHTML = "";
      els.feedbackZone.innerHTML = "";
      els.feedbackZone.className = "feedback-zone";
      clearDerivation();
      els.nextExerciseButton.textContent = "Siguiente ejercicio";

      exercise.options.forEach((option, index) => {
        const optionDisplay = Core.renderOption
          ? Core.renderOption(option)
          : option.display;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "option-button";
        button.dataset.optionId = option.id;
        button.innerHTML = `
          <span class="option-index">Opción ${index + 1}</span>
          <span class="option-math">${optionDisplay && optionDisplay.html ? optionDisplay.html : option.displayHtml}</span>`;
        button.addEventListener("click", () => onAnswer(option.id));
        els.optionsContainer.appendChild(button);
      });
    }

    function renderAnsweredState(exercise, chosen) {
      const buttons = Array.from(
        els.optionsContainer.querySelectorAll(".option-button"),
      );
      buttons.forEach((button) => {
        const option = exercise.options.find(
          (item) => item.id === button.dataset.optionId,
        );
        button.disabled = true;
        if (option.isCorrect) {
          button.classList.add("is-correct");
        }
        if (option.id === chosen.id) {
          button.classList.add("is-selected");
          if (!option.isCorrect) {
            button.classList.add("is-incorrect");
          }
        }
      });

      els.feedbackZone.innerHTML = Core.feedbackHtml(exercise, chosen);
      els.feedbackZone.className = `feedback-zone ${
        chosen.isCorrect ? "correct" : "incorrect"
      }`;
      els.derivationButton.classList.remove("hidden");
    }

    function toggleDerivation(exercise, answered) {
      if (!exercise || !answered) {
        return;
      }
      const hidden = els.derivationZone.classList.contains("hidden");
      if (hidden) {
        els.derivationZone.innerHTML = Core.derivationHtml(exercise);
        els.derivationZone.classList.remove("hidden");
        els.derivationButton.textContent = "Ocultar derivación";
        els.derivationButton.setAttribute("aria-expanded", "true");
      } else {
        els.derivationZone.classList.add("hidden");
        els.derivationButton.textContent = "Ver derivación";
        els.derivationButton.setAttribute("aria-expanded", "false");
      }
    }

    return {
      renderAnsweredState,
      renderExercise,
      renderGenerationError,
      toggleDerivation,
    };
  };
})(typeof window !== "undefined" ? window : globalThis);
