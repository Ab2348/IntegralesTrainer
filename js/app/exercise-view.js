(function (root) {
  "use strict";

  const App = (root.TrigTrainerApp = root.TrigTrainerApp || {});
  const Dom = App.DomUtils;
  const UIData = App.UIData;

  App.createExerciseView = function createExerciseView({ Core, els }) {
    function renderFamilyLabel(family) {
      Dom.clearElement(els.familyLabel);
      els.familyLabel.append(document.createTextNode("Familia "));
      const label = document.createElement("span");
      Dom.renderMathInto(
        Core,
        label,
        UIData.familyLabelExpression(Core, family),
        { className: "family-math-label" },
        family.name,
      );
      els.familyLabel.appendChild(label);
    }

    function clearDerivation() {
      Dom.clearElement(els.derivationZone);
      App.CollapseAnimator.setOpen(els.derivationButton, els.derivationZone, false, {
        animate: false,
        force: true,
      });
      els.derivationZone.classList.add("hidden");
      els.derivationButton.classList.add("hidden");
      els.derivationButton.textContent = "Ver derivación";
    }

    function renderPracticeTip(exercise) {
      if (!exercise) {
        return;
      }
      const tip = UIData.randomPracticeTip();
      Dom.clearElement(els.feedbackZone);
      els.feedbackZone.className = "feedback-zone practice-tip";

      const title = document.createElement("p");
      title.className = "practice-tip-title";
      Dom.renderContentInto(Core, title, [tip.title], tip.title);

      const copy = document.createElement("p");
      copy.className = "practice-tip-copy";
      copy.textContent = tip.copy;

      els.feedbackZone.append(title, copy);
    }

    function renderGenerationError(error, settings) {
      els.familyLabel.textContent = "Familia";
      els.difficultyLabel.textContent = `Nivel ${settings.difficulty}`;
      els.exerciseDisplay.textContent = "";
      Dom.clearElement(els.optionsContainer);
      clearDerivation();

      const title = document.createElement("div");
      title.className = "feedback-title";
      title.textContent = "No se pudo generar el ejercicio";

      const message = document.createElement("p");
      message.textContent =
        error && error.message
          ? error.message
          : "Revisa la configuracion e intenta de nuevo.";

      Dom.clearElement(els.feedbackZone);
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
      Dom.renderMathInto(Core, els.exerciseDisplay, integralDisplay);
      Dom.clearElement(els.optionsContainer);
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
        Dom.renderMathInto(Core, optionMath, optionDisplay || option.display);
        button.append(optionIndex, optionMath);
        button.addEventListener("click", () => onAnswer(option.id));
        els.optionsContainer.appendChild(button);
      });

      renderPracticeTip(exercise);
    }

    function appendDiagnosticRow(container, latex) {
      const item = document.createElement("div");
      item.className = "diagnostic-value";
      Dom.renderContentInto(Core, item, [
        { type: "math", latex, display: "inline" },
      ]);
      container.appendChild(item);
    }

    function appendMathSection(container, label, latex) {
      const section = document.createElement("section");
      section.className = "diagnostic-section";
      const title = document.createElement("h3");
      title.textContent = label;
      const formula = document.createElement("div");
      formula.className = "centered-formula diagnostic-formula";
      Dom.renderLatexInto(Core, formula, latex, { display: "block" });
      section.append(title, formula);
      container.appendChild(section);
    }

    function renderVisualFeedback(exercise, chosen, validation) {
      if (chosen && chosen.isCorrect) {
        return;
      }
      const vars = Core.feedbackVariables(exercise, chosen);
      Dom.clearElement(els.feedbackZone);
      els.feedbackZone.className =
        "feedback-zone incorrect diagnostic-feedback";

      const title = document.createElement("div");
      title.className = "feedback-title";
      const errorTag =
        (validation && validation.errorTag) ||
        (chosen && chosen.errorTag) ||
        "generic-coefficient-error";
      Dom.renderContentInto(Core, title, [
        "Incorrecto: ",
        ...(Core.errorLabelContent
          ? Core.errorLabelContent(errorTag)
          : [errorTag]),
      ]);

      const explanation = document.createElement("p");
      explanation.className = "diagnostic-copy";
      explanation.textContent =
        "La opción elegida no coincide con la familia, el signo o el factor de cadena que exige este ejercicio.";

      const values = document.createElement("div");
      values.className = "diagnostic-values";
      appendDiagnosticRow(values, `A = ${vars.ALatex}`);
      appendDiagnosticRow(values, `k = ${vars.kLatex}`);
      appendDiagnosticRow(values, `b = ${vars.bLatex}`);
      appendDiagnosticRow(values, `u = ${vars.uLatex}`);
      appendDiagnosticRow(values, `f(u) = ${vars.fULatex}`);
      appendDiagnosticRow(values, `F(u) = ${vars.FULatex}`);

      els.feedbackZone.append(title, explanation, values);
      appendMathSection(els.feedbackZone, "Regla base", vars.baseRuleLatex);
      appendMathSection(
        els.feedbackZone,
        "Regla general",
        vars.generalRuleLatex,
      );
      appendMathSection(
        els.feedbackZone,
        "Sustituyendo",
        vars.substitutionExpressionLatex,
      );
      appendMathSection(
        els.feedbackZone,
        "Resultado simplificado",
        vars.correctExpressionLatex,
      );
    }

    function renderAnsweredState(exercise, chosen, validation) {
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

      Dom.renderContentInto(
        Core,
        els.feedbackZone,
        Core.feedbackContent ? Core.feedbackContent(exercise, chosen) : [],
      );
      els.feedbackZone.className = `feedback-zone ${
        chosen.isCorrect ? "correct" : "incorrect"
      }`;
      renderVisualFeedback(exercise, chosen, validation);
      els.derivationButton.classList.remove("hidden");
    }

    function toggleDerivation(exercise, answered) {
      if (!exercise || !answered) {
        return;
      }
      const open =
        els.derivationButton.getAttribute("aria-expanded") === "true";
      if (!open) {
        Dom.renderContentInto(
          Core,
          els.derivationZone,
          Core.derivationContent ? Core.derivationContent(exercise) : [],
        );
        els.derivationZone.classList.remove("hidden");
        els.derivationButton.textContent = "Ocultar derivación";
        App.CollapseAnimator.setOpen(els.derivationButton, els.derivationZone, true);
      } else {
        els.derivationButton.textContent = "Ver derivación";
        App.CollapseAnimator.setOpen(els.derivationButton, els.derivationZone, false, {
          onAfterClose: () => {
            els.derivationZone.classList.add("hidden");
          },
        });
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
