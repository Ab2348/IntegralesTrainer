(function (root) {
  "use strict";

  const App = (root.TrigTrainerApp = root.TrigTrainerApp || {});

  App.createControlsPanel = function createControlsPanel({
    Core,
    els,
    stateStore,
  }) {
    function selectedFamiliesFromDom() {
      return Array.from(
        els.familyChecklist.querySelectorAll("input[type='checkbox']:checked"),
      ).map((input) => input.value);
    }

    function renderFamilyChecklist() {
      const state = stateStore.getState();
      if (els.familyChecklist.replaceChildren) {
        els.familyChecklist.replaceChildren();
      } else {
        els.familyChecklist.textContent = "";
      }
      Core.FAMILIES.forEach((family) => {
        const label = document.createElement("label");
        label.className = "family-check";

        const input = document.createElement("input");
        input.type = "checkbox";
        input.value = family.id;
        input.checked = state.settings.activeFamilyIds.includes(family.id);
        input.addEventListener("change", () => {
          const selected = selectedFamiliesFromDom();
          stateStore.setCustomFamilies(selected);
          els.modeSelect.value = "custom";
        });

        const span = document.createElement("span");
        span.className = "family-check-label";
        if (Core.renderInto) {
          Core.renderInto(
            span,
            Core.familyLabelExpression
              ? Core.familyLabelExpression(family)
              : { latex: Core.familyLabelLatex ? Core.familyLabelLatex(family) : "" },
            { className: "family-math-label" },
          );
        } else {
          span.textContent = family.name;
        }

        label.append(input, span);
        els.familyChecklist.appendChild(label);
      });
    }

    function syncControlsFromState() {
      const state = stateStore.getState();
      if (Core.RANGE_LIMITS) {
        els.rangeMinInput.min = Core.RANGE_LIMITS.min;
        els.rangeMinInput.max = Core.RANGE_LIMITS.max;
        els.rangeMaxInput.min = Core.RANGE_LIMITS.min;
        els.rangeMaxInput.max = Core.RANGE_LIMITS.max;
      }
      els.modeSelect.value = state.settings.mode || "basic";
      els.difficultySelect.value = String(state.settings.difficulty || "1");
      els.rangeMinInput.value = state.settings.rangeMin;
      els.rangeMaxInput.value = state.settings.rangeMax;
      els.optionCountSelect.value = String(state.settings.optionCount || 4);
      renderFamilyChecklist();
    }

    function updateSettingsFromControls() {
      const settings = stateStore.updateSettings({
        mode: els.modeSelect.value,
        difficulty: els.difficultySelect.value,
        rangeMin: els.rangeMinInput.value,
        rangeMax: els.rangeMaxInput.value,
        optionCount: els.optionCountSelect.value,
        activeFamilyIds: selectedFamiliesFromDom(),
      });
      els.rangeMinInput.value = settings.rangeMin;
      els.rangeMaxInput.value = settings.rangeMax;
      return settings;
    }

    function applyModeFromControls() {
      stateStore.applyMode(els.modeSelect.value);
      renderFamilyChecklist();
    }

    function bindEvents() {
      els.modeSelect.addEventListener("change", applyModeFromControls);

      [
        els.difficultySelect,
        els.rangeMinInput,
        els.rangeMaxInput,
        els.optionCountSelect,
      ].forEach((control) => {
        control.addEventListener("change", updateSettingsFromControls);
      });
    }

    return {
      bindEvents,
      renderFamilyChecklist,
      syncControlsFromState,
      updateSettingsFromControls,
    };
  };
})(typeof window !== "undefined" ? window : globalThis);
