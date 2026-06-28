(function (root) {
  "use strict";

  const App = (root.TrigTrainerApp = root.TrigTrainerApp || {});
  const Dom = App.DomUtils;

  App.createPracticeScopeSelector = function createPracticeScopeSelector({
    Core,
    workspace,
    practicePanel,
    controlsPanel,
    onConfirm,
  }) {
    let selectorRoot = null;
    let isOpen = false;
    let selectedTypeIds = new Set();
    const trainerNodes = [practicePanel, controlsPanel].filter(Boolean);

    function currentScopeTypeIds() {
      const scope =
        Core && typeof Core.getPracticeScope === "function"
          ? Core.getPracticeScope()
          : { typeIds: [] };
      return Array.isArray(scope.typeIds) ? scope.typeIds : [];
    }

    function availableTypes() {
      return Core && typeof Core.getPracticeTypes === "function"
        ? Core.getPracticeTypes()
        : [];
    }

    function buttonText() {
      return selectedTypeIds.size ? "Confirmar selección" : "Seleccionar todos";
    }

    function syncSelectionState() {
      if (!selectorRoot) {
        return;
      }
      selectorRoot
        .querySelectorAll(".practice-type-card")
        .forEach((card) => {
          const selected = selectedTypeIds.has(card.dataset.typeId);
          card.classList.toggle("is-selected", selected);
          card.setAttribute("aria-pressed", String(selected));
        });
      const button = selectorRoot.querySelector(".practice-scope-confirm");
      if (button) {
        button.textContent = buttonText();
      }
    }

    function toggleType(typeId) {
      if (selectedTypeIds.has(typeId)) {
        selectedTypeIds.delete(typeId);
      } else {
        selectedTypeIds.add(typeId);
      }
      syncSelectionState();
    }

    function createPreview(type) {
      const list = document.createElement("ul");
      list.className = "practice-type-preview";
      (type.preview || []).slice(0, 6).forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        list.appendChild(li);
      });
      return list;
    }

    function createCard(type) {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "practice-type-card";
      card.dataset.typeId = type.id;
      card.setAttribute("aria-pressed", "false");

      const label = document.createElement("span");
      label.className = "practice-type-label";
      label.textContent = type.shortLabel || type.title;

      const title = document.createElement("strong");
      title.className = "practice-type-title";
      title.textContent = type.title;

      const description = document.createElement("span");
      description.className = "practice-type-description";
      description.textContent = type.description;

      card.append(label, title, description, createPreview(type));
      card.addEventListener("click", () => toggleType(type.id));
      return card;
    }

    function createSelector() {
      const rootElement = document.createElement("section");
      rootElement.className = "practice-scope-view";
      rootElement.setAttribute("aria-label", "Selección de tipos de práctica");

      const header = document.createElement("div");
      header.className = "practice-scope-head";

      const title = document.createElement("h2");
      title.textContent = "¿Qué tipo de ejercicios quieres practicar hoy?";

      const copy = document.createElement("p");
      copy.textContent =
        "Elige uno o varios tipos para generar ejercicios aleatorios desde esas familias.";

      header.append(title, copy);

      const grid = document.createElement("div");
      grid.className = "practice-type-grid";

      const types = availableTypes();
      if (!types.length) {
        const empty = document.createElement("p");
        empty.className = "practice-scope-empty";
        empty.textContent = "No hay tipos de práctica disponibles.";
        grid.appendChild(empty);
      } else {
        types.forEach((type) => grid.appendChild(createCard(type)));
      }

      const actions = document.createElement("div");
      actions.className = "practice-scope-actions";

      const confirm = document.createElement("button");
      confirm.type = "button";
      confirm.className = "btn primary practice-scope-confirm";
      confirm.textContent = buttonText();
      confirm.addEventListener("click", () => {
        if (!selectedTypeIds.size) {
          selectedTypeIds = new Set(types.map((type) => type.id));
          syncSelectionState();
          return;
        }
        if (typeof onConfirm === "function") {
          onConfirm(Array.from(selectedTypeIds));
        }
      });

      actions.appendChild(confirm);
      rootElement.append(header, grid, actions);
      return rootElement;
    }

    function render(initialTypeIds) {
      selectedTypeIds = new Set(initialTypeIds || currentScopeTypeIds());
      selectorRoot = createSelector();
      syncSelectionState();
    }

    function show(options) {
      const source = options || {};
      if (!workspace) {
        return;
      }
      if (isOpen && selectorRoot) {
        render(source.selectedTypeIds);
        workspace.replaceChildren(selectorRoot);
        return;
      }
      render(source.selectedTypeIds);
      workspace.replaceChildren(selectorRoot);
      isOpen = true;
    }

    function hide() {
      if (!workspace || !isOpen) {
        return;
      }
      workspace.replaceChildren();
      trainerNodes.forEach((node) => workspace.appendChild(node));
      selectorRoot = null;
      isOpen = false;
    }

    function isSelectorOpen() {
      return isOpen;
    }

    return {
      show,
      hide,
      isOpen: isSelectorOpen,
    };
  };
})(typeof window !== "undefined" ? window : globalThis);
