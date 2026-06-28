(function (root) {
  "use strict";

  const App = (root.TrigTrainerApp = root.TrigTrainerApp || {});
  const Dom = App.DomUtils;
  const UIData = App.UIData;
  const CollapsibleView = App.CollapsibleView;

  App.createControlsPanel = function createControlsPanel({
    Core,
    els,
    stateStore,
    onChangePracticeTypes,
  }) {
    let pendingSettings = null;
    let familyInteractionPending = false;

    function cloneSettings(settings) {
      return JSON.parse(JSON.stringify(settings || {}));
    }

    function activeModeIds() {
      return Array.isArray(pendingSettings && pendingSettings.activeModeIds)
        ? pendingSettings.activeModeIds
        : [];
    }

    function modeGroups() {
      return Core && typeof Core.getModeGroups === "function"
        ? Core.getModeGroups()
        : [];
    }

    function customModeId() {
      return Core.customModeId || "custom";
    }

    function uniqueStrings(values) {
      return (Array.isArray(values) ? values : []).filter(
        (value, index) =>
          typeof value === "string" &&
          value &&
          values.indexOf(value) === index,
      );
    }

    function selectedFamiliesFromDom() {
      return Array.from(
        els.familyChecklist.querySelectorAll("input[type='checkbox']:checked"),
      ).map((input) => input.value);
    }

    function updateFamilyBadges() {
      const familyGroups = UIData.getFamilyGroups(Core);
      const activeIds = pendingSettings.activeFamilyIds || [];
      const rootBadge = els.familyChecklist.querySelector(
        "#families-active-trigger .collapsible-badge",
      );
      if (rootBadge) {
        rootBadge.textContent = UIData.countBadge(
          activeIds,
          familyGroups.flatMap((group) => group.families),
        );
      }
      familyGroups.forEach((group) => {
        const badge = els.familyChecklist.querySelector(
          `#family-group-${group.id}-trigger .collapsible-badge`,
        );
        if (badge) {
          badge.textContent = UIData.countBadge(activeIds, group.families);
        }
      });
    }

    function syncFamilyCheckboxes() {
      const activeIds = pendingSettings.activeFamilyIds || [];
      els.familyChecklist
        .querySelectorAll("input[type='checkbox']")
        .forEach((input) => {
          input.checked = activeIds.includes(input.value);
        });
      updateFamilyBadges();
    }

    function syncModeCheckboxes() {
      const selected = activeModeIds();
      if (!els.modeSelector) {
        return;
      }
      els.modeSelector
        .querySelectorAll("input[type='checkbox']")
        .forEach((input) => {
          input.checked = selected.includes(input.value);
        });
    }

    function derivePendingFromModeIds(modeIds) {
      const normalized =
        Core && typeof Core.normalizeActiveModeIds === "function"
          ? Core.normalizeActiveModeIds(modeIds)
          : uniqueStrings(modeIds);
      if (!normalized.length) {
        pendingSettings.activeModeIds = [];
        pendingSettings.mode = customModeId();
        return;
      }
      const derived =
        Core && typeof Core.settingsFromModeIds === "function"
          ? Core.settingsFromModeIds(normalized, pendingSettings)
          : { ...pendingSettings, activeModeIds: normalized };
      pendingSettings = {
        ...pendingSettings,
        ...derived,
        activeModeIds: normalized,
      };
    }

    function renderModeSelector() {
      if (!els.modeSelector) {
        return;
      }
      Dom.clearElement(els.modeSelector);
      const groups = modeGroups();
      if (!groups.length) {
        const empty = document.createElement("p");
        empty.className = "mode-selector-empty";
        empty.textContent = "Selecciona un tipo de práctica.";
        els.modeSelector.appendChild(empty);
        return;
      }

      groups.forEach((group, index) => {
        const groupSection = CollapsibleView.createCollapsible({
          id: `mode-group-${group.id}`,
          title: group.label,
          badge: `${group.items.length}`,
          defaultOpen: index === 0 || groups.length === 1,
          level: 2,
          className: "mode-group",
        });

        const list = document.createElement("div");
        list.className = "mode-group-list";
        group.items.forEach((item) => {
          const label = document.createElement("label");
          label.className = "mode-check";

          const input = document.createElement("input");
          input.type = "checkbox";
          input.value = item.id;
          input.checked = activeModeIds().includes(item.id);
          input.addEventListener("change", () => {
            const selected = Array.from(
              els.modeSelector.querySelectorAll(
                "input[type='checkbox']:checked",
              ),
            ).map((checkedInput) => checkedInput.value);
            derivePendingFromModeIds(selected);
            syncFamilyCheckboxes();
            syncModeCheckboxes();
          });

          const span = document.createElement("span");
          span.className = "mode-check-label";
          span.textContent = item.label;

          label.append(input, span);
          list.appendChild(label);
        });

        groupSection.content.appendChild(list);
        els.modeSelector.appendChild(groupSection.section);
      });
    }

    function renderFamilyChecklist() {
      const activeIds = pendingSettings.activeFamilyIds || [];
      const familyGroups = UIData.getFamilyGroups(Core);
      Dom.clearElement(els.familyChecklist);

      const rootSection = CollapsibleView.createCollapsible({
        id: "families-active",
        title: "Familias activas",
        badge: UIData.countBadge(
          activeIds,
          familyGroups.flatMap((group) => group.families),
        ),
        defaultOpen: true,
        level: 1,
        className: "family-root",
      });

      familyGroups.forEach((group) => {
        const groupSection = CollapsibleView.createCollapsible({
          id: `family-group-${group.id}`,
          title: group.label,
          badge: UIData.countBadge(activeIds, group.families),
          defaultOpen: false,
          level: 2,
          className: "family-group",
        });

        const list = document.createElement("div");
        list.className = "family-group-list";
        group.families.forEach((familyId) => {
          const family = Core.FAMILY_MAP[familyId];
          if (!family) {
            return;
          }

          const label = document.createElement("label");
          label.className = "family-check";

          const input = document.createElement("input");
          input.type = "checkbox";
          input.value = family.id;
          input.checked = activeIds.includes(family.id);
          input.addEventListener("change", () => {
            pendingSettings.activeFamilyIds = selectedFamiliesFromDom();
            pendingSettings.activeModeIds = [];
            pendingSettings.mode = customModeId();
            familyInteractionPending = true;
            syncModeCheckboxes();
            updateFamilyBadges();
          });

          const span = document.createElement("span");
          span.className = "family-check-label";
          Dom.renderMathInto(
            Core,
            span,
            UIData.familyLabelExpression(Core, family),
            { className: "family-math-label" },
            family.name,
          );

          label.append(input, span);
          list.appendChild(label);
        });

        groupSection.content.appendChild(list);
        rootSection.content.appendChild(groupSection.section);
      });

      els.familyChecklist.appendChild(rootSection.section);
    }

    function syncControlsFromState() {
      const state = stateStore.getState();
      pendingSettings = cloneSettings(state.settings);
      familyInteractionPending = false;
      if (Core.RANGE_LIMITS) {
        els.rangeMinInput.min = Core.RANGE_LIMITS.min;
        els.rangeMinInput.max = Core.RANGE_LIMITS.max;
        els.rangeMaxInput.min = Core.RANGE_LIMITS.min;
        els.rangeMaxInput.max = Core.RANGE_LIMITS.max;
      }
      els.difficultySelect.value = String(pendingSettings.difficulty || "1");
      els.rangeMinInput.value = pendingSettings.rangeMin;
      els.rangeMaxInput.value = pendingSettings.rangeMax;
      renderModeSelector();
      renderFamilyChecklist();
    }

    function updatePendingFromSimpleControls() {
      pendingSettings.difficulty = els.difficultySelect.value;
      pendingSettings.rangeMin = els.rangeMinInput.value;
      pendingSettings.rangeMax = els.rangeMaxInput.value;
    }

    function updateSettingsFromControls() {
      updatePendingFromSimpleControls();
      const settings = stateStore.updateSettings(pendingSettings);
      pendingSettings = cloneSettings(settings);
      els.rangeMinInput.value = settings.rangeMin;
      els.rangeMaxInput.value = settings.rangeMax;
      familyInteractionPending = false;
      return settings;
    }

    function syncCurrentFamilyGroup(familyId) {
      if (familyInteractionPending) {
        return;
      }
      const familyGroups = UIData.getFamilyGroups(Core);
      const currentGroup = UIData.groupForFamily(Core, familyId);
      CollapsibleView.setOpen("families-active", true);
      familyGroups.forEach((group) => {
        const isCurrent = Boolean(currentGroup && group.id === currentGroup.id);
        CollapsibleView.setOpen(`family-group-${group.id}`, isCurrent);
      });
    }

    function bindEvents() {
      [
        els.difficultySelect,
        els.rangeMinInput,
        els.rangeMaxInput,
      ].forEach((control) => {
        control.addEventListener("change", updatePendingFromSimpleControls);
      });
      if (els.changePracticeTypesButton) {
        els.changePracticeTypesButton.addEventListener("click", () => {
          if (typeof onChangePracticeTypes === "function") {
            onChangePracticeTypes();
          }
        });
      }
    }

    return {
      bindEvents,
      renderFamilyChecklist,
      syncControlsFromState,
      syncCurrentFamilyGroup,
      updateSettingsFromControls,
    };
  };
})(typeof window !== "undefined" ? window : globalThis);
