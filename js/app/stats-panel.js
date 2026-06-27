(function (root) {
  "use strict";

  const App = (root.TrigTrainerApp = root.TrigTrainerApp || {});

  App.createStatsPanel = function createStatsPanel({ Core, els, stateStore }) {
    function clearElement(element) {
      if (element.replaceChildren) {
        element.replaceChildren();
      } else {
        element.textContent = "";
      }
    }

    function renderContentInto(target, content, fallbackText) {
      if (Core.renderContentInto && content) {
        Core.renderContentInto(target, content);
      } else {
        target.textContent = fallbackText || "";
      }
    }

    function renderMathInto(target, expression, fallbackText, options) {
      if (Core.renderInto && expression) {
        Core.renderInto(target, expression, options || {});
      } else {
        target.textContent = fallbackText || "";
      }
    }

    function appendEmptyState(container, description) {
      const item = document.createElement("li");
      item.className = "empty-stat";

      const title = document.createElement("strong");
      title.className = "empty-stat-title";
      title.textContent = "Aún no hay datos";

      const copy = document.createElement("span");
      copy.className = "empty-stat-copy";
      copy.textContent = description;

      item.append(title, copy);
      container.appendChild(item);
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

    function appendTooltipRow(container, labelText, valueText, expression) {
      const row = document.createElement("div");
      row.className = "error-tooltip-row";

      const label = document.createElement("span");
      label.className = "error-tooltip-label";
      label.textContent = labelText;

      const value = document.createElement("span");
      value.className = "error-tooltip-value";
      renderMathInto(value, expression, valueText || "Sin datos");

      row.append(label, value);
      container.appendChild(row);
    }

    function appendErrorTooltip(item, tag) {
      const tooltip = document.createElement("div");
      const tooltipId = `error-tooltip-${tag}`;
      tooltip.className = "error-tooltip";
      tooltip.id = tooltipId;
      tooltip.setAttribute("role", "tooltip");

      const example = latestErrorExample(tag);
      if (example) {
        const math = Core.errorExampleMath
          ? Core.errorExampleMath(example)
          : null;
        appendTooltipRow(
          tooltip,
          "Ejercicio",
          example.exercisePlain,
          math
            ? math.exercise
            : Core.plainMathExpression
              ? Core.plainMathExpression(example.exercisePlain)
              : null,
        );
        appendTooltipRow(
          tooltip,
          "Elegiste",
          example.chosenPlain,
          math
            ? math.chosen
            : Core.plainMathExpression
              ? Core.plainMathExpression(example.chosenPlain)
              : null,
        );
        appendTooltipRow(
          tooltip,
          "Correcta",
          example.correctPlain,
          math
            ? math.correct
            : Core.plainMathExpression
              ? Core.plainMathExpression(example.correctPlain)
              : null,
        );
      } else {
        const fallback = document.createElement("p");
        fallback.className = "error-tooltip-empty";
        fallback.textContent = "Sin ejemplo reciente disponible";
        tooltip.appendChild(fallback);
      }

      item.appendChild(tooltip);
      return tooltipId;
    }

    function renderErrorList() {
      const state = stateStore.getState();
      const entries = Object.entries(state.errorCountsByTag || {})
        .filter((entry) => entry[1] > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      clearElement(els.errorList);
      if (!entries.length) {
        appendEmptyState(
          els.errorList,
          "Resuelve ejercicios para ver tu diagnóstico personalizado.",
        );
        return;
      }

      entries.forEach(([tag, value]) => {
        const item = document.createElement("li");
        item.className = "stat-error-item";

        const trigger = document.createElement("button");
        trigger.type = "button";
        trigger.className = "stat-error-trigger";

        const label = document.createElement("span");
        label.className = "stat-item-label";
        renderContentInto(
          label,
          Core.errorLabelContent ? Core.errorLabelContent(tag) : [tag],
          tag,
        );

        const count = document.createElement("span");
        count.className = "stat-item-count";
        count.textContent = value;

        trigger.append(label, count);
        item.appendChild(trigger);
        trigger.setAttribute("aria-describedby", appendErrorTooltip(item, tag));
        els.errorList.appendChild(item);
      });
    }

    function renderRankedList(container, data, renderLabel) {
      const entries = Object.entries(data || {})
        .filter((entry) => entry[1] > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      clearElement(container);
      if (!entries.length) {
        appendEmptyState(
          container,
          "Resuelve ejercicios para ver las familias con más errores.",
        );
        return;
      }

      entries.forEach(([key, value]) => {
        const item = document.createElement("li");
        const label = document.createElement("span");
        label.className = "stat-item-label";
        renderLabel(label, key);

        const count = document.createElement("span");
        count.className = "stat-item-count";
        count.textContent = value;

        item.append(label, count);
        container.appendChild(item);
      });
    }

    function render() {
      const state = stateStore.getState();
      const total = state.totalAnswered || 0;
      const correct = state.totalCorrect || 0;
      const incorrect = state.totalIncorrect || 0;
      const accuracy = total ? Math.round((correct / total) * 100) : 0;

      els.totalAnswered.textContent = total;
      els.totalCorrect.textContent = correct;
      els.totalIncorrect.textContent = incorrect;
      els.accuracyRate.textContent = `${accuracy}%`;

      renderErrorList();
      renderRankedList(
        els.familyErrorList,
        state.familyErrorCounts,
        (label, familyId) => {
          const family = Core.FAMILY_MAP[familyId];
          if (family) {
            renderMathInto(
              label,
              Core.familyLabelExpression
                ? Core.familyLabelExpression(family)
                : { latex: Core.familyLabelLatex ? Core.familyLabelLatex(family) : "" },
              family.name,
              { className: "family-math-label" },
            );
            return;
          }
          label.textContent = familyId;
        },
      );
    }

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
      if (
        !chosen ||
        chosen.isCorrect ||
        !stateStore.isValidErrorTag(tag)
      ) {
        return;
      }
      const examples = Array.isArray(state.errorExamplesByTag[tag])
        ? state.errorExamplesByTag[tag]
        : [];
      const example = {
        id: `err-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        timestamp: Date.now(),
        errorTag: tag,
        familyId: exercise.familyId,
        mathFamilyId: validation.mathFamilyId || validation.stats.mathFamilyId || "",
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
        return;
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
    }

    return {
      recordAnswer,
      render,
    };
  };
})(typeof window !== "undefined" ? window : globalThis);
