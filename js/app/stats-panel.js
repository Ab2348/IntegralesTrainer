(function (root) {
  "use strict";

  const App = (root.TrigTrainerApp = root.TrigTrainerApp || {});

  App.createStatsPanel = function createStatsPanel({ Core, els, stateStore }) {
    function trustedHtml(html) {
      return { type: "html", value: html };
    }

    function plainText(text) {
      return { type: "text", value: String(text) };
    }

    function appendLabel(label, target) {
      if (label.type === "html") {
        target.innerHTML = label.value;
      } else {
        target.textContent = label.value;
      }
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

    function appendTooltipRow(container, labelText, valueText, valueHtml) {
      const row = document.createElement("div");
      row.className = "error-tooltip-row";

      const label = document.createElement("span");
      label.className = "error-tooltip-label";
      label.textContent = labelText;

      const value = document.createElement("span");
      value.className = "error-tooltip-value";
      if (valueHtml) {
        value.innerHTML = valueHtml;
      } else {
        value.textContent = valueText || "Sin datos";
      }

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
        const math = Core.errorExampleMathHtml
          ? Core.errorExampleMathHtml(example)
          : null;
        appendTooltipRow(
          tooltip,
          "Ejercicio",
          example.exercisePlain,
          math ? math.exerciseHtml : Core.plainMathHtml(example.exercisePlain),
        );
        appendTooltipRow(
          tooltip,
          "Elegiste",
          example.chosenPlain,
          math ? math.chosenHtml : Core.plainMathHtml(example.chosenPlain),
        );
        appendTooltipRow(
          tooltip,
          "Correcta",
          example.correctPlain,
          math ? math.correctHtml : Core.plainMathHtml(example.correctPlain),
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

      els.errorList.innerHTML = "";
      if (!entries.length) {
        const item = document.createElement("li");
        item.className = "empty-stat";
        item.textContent = "Sin datos";
        els.errorList.appendChild(item);
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
        appendLabel(trustedHtml(Core.errorLabelHtml(tag)), label);

        const count = document.createElement("span");
        count.className = "stat-item-count";
        count.textContent = value;

        trigger.append(label, count);
        item.appendChild(trigger);
        trigger.setAttribute("aria-describedby", appendErrorTooltip(item, tag));
        els.errorList.appendChild(item);
      });
    }

    function renderRankedList(container, data, labelFn) {
      const entries = Object.entries(data || {})
        .filter((entry) => entry[1] > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      container.innerHTML = "";
      if (!entries.length) {
        const item = document.createElement("li");
        item.className = "empty-stat";
        item.textContent = "Sin datos";
        container.appendChild(item);
        return;
      }

      entries.forEach(([key, value]) => {
        const item = document.createElement("li");
        const label = document.createElement("span");
        label.className = "stat-item-label";
        appendLabel(labelFn(key), label);

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
        (familyId) => {
          const family = Core.FAMILY_MAP[familyId];
          return family
            ? trustedHtml(Core.familyLabelHtml(family))
            : plainText(familyId);
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
      if (
        !chosen ||
        chosen.isCorrect ||
        !stateStore.isValidErrorTag(chosen.errorTag)
      ) {
        return;
      }
      const tag = chosen.errorTag;
      const examples = Array.isArray(state.errorExamplesByTag[tag])
        ? state.errorExamplesByTag[tag]
        : [];
      const example = {
        id: `err-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        timestamp: Date.now(),
        errorTag: tag,
        familyId: exercise.familyId,
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
      state.totalAnswered += 1;
      incrementCounter(state.familyCounts, familyId);
      incrementCounter(state.mathFamilyCounts, mathFamilyId);
      incrementCounter(state.methodCounts, methodId);
      incrementCounter(state.submethodCounts, submethodId);
      incrementCounter(state.difficultyCounts, difficulty);
      incrementCounter(state.templateCounts, templateId);

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
      pushErrorExample(exercise, chosen, validation);
    }

    return {
      recordAnswer,
      render,
    };
  };
})(typeof window !== "undefined" ? window : globalThis);
