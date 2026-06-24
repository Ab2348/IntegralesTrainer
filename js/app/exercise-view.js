(function (root) {
  "use strict";

  const App = (root.TrigTrainerApp = root.TrigTrainerApp || {});

  App.createExerciseView = function createExerciseView({ Core, els }) {
    function clearElement(element) {
      if (element.replaceChildren) {
        element.replaceChildren();
      } else {
        element.textContent = "";
      }
    }

    function renderMathInto(element, expression, options) {
      if (Core.renderInto) {
        Core.renderInto(element, expression, options || {});
        return;
      }
      element.textContent =
        (expression && (expression.plain || expression.latex)) || "";
    }

    function renderContentInto(element, content) {
      if (Core.renderContentInto) {
        Core.renderContentInto(element, content);
        return;
      }
      clearElement(element);
    }

    function renderFamilyLabel(family) {
      clearElement(els.familyLabel);
      els.familyLabel.append(document.createTextNode("Familia "));
      const label = document.createElement("span");
      renderMathInto(
        label,
        Core.familyLabelExpression
          ? Core.familyLabelExpression(family)
          : { latex: Core.familyLabelLatex ? Core.familyLabelLatex(family) : "" },
        { className: "family-math-label" },
      );
      els.familyLabel.appendChild(label);
    }

    function clearDerivation() {
      clearElement(els.derivationZone);
      els.derivationZone.classList.add("hidden");
      els.derivationButton.classList.add("hidden");
      els.derivationButton.textContent = "Ver derivación";
      els.derivationButton.setAttribute("aria-expanded", "false");
    }

    function renderGenerationError(error, settings) {
      els.familyLabel.textContent = "Familia";
      els.difficultyLabel.textContent = `Nivel ${settings.difficulty}`;
      els.exerciseDisplay.textContent = "";
      clearElement(els.optionsContainer);
      clearDerivation();

      const title = document.createElement("div");
      title.className = "feedback-title";
      title.textContent = "No se pudo generar el ejercicio";

      const message = document.createElement("p");
      message.textContent =
        error && error.message
          ? error.message
          : "Revisa la configuracion e intenta de nuevo.";

      clearElement(els.feedbackZone);
      els.feedbackZone.className = "feedback-zone incorrect";
      els.feedbackZone.append(title, message);
    }

    function renderExercise(exercise, settings, onAnswer) {
      const family = exercise.family;
      renderFamilyLabel(family);
      els.difficultyLabel.textContent = `Nivel ${settings.difficulty}`;
      const integralDisplay = Core.renderIntegral
        ? Core.renderIntegral(exercise)
        : exercise.integralShown;
      renderMathInto(els.exerciseDisplay, integralDisplay);
      clearElement(els.optionsContainer);
      clearElement(els.feedbackZone);
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
        const optionIndex = document.createElement("span");
        optionIndex.className = "option-index";
        optionIndex.textContent = `Opción ${index + 1}`;
        const optionMath = document.createElement("span");
        optionMath.className = "option-math";
        renderMathInto(optionMath, optionDisplay || option.display);
        button.append(optionIndex, optionMath);
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

      renderContentInto(
        els.feedbackZone,
        Core.feedbackContent ? Core.feedbackContent(exercise, chosen) : [],
      );
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
        renderContentInto(
          els.derivationZone,
          Core.derivationContent ? Core.derivationContent(exercise) : [],
        );
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
