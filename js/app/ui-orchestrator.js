(function (root) {
  "use strict";

  const App = (root.TrigTrainerApp = root.TrigTrainerApp || {});

  App.createUIOrchestrator = function createUIOrchestrator({ els }) {
    const CollapseAnimator = App.CollapseAnimator;
    const LayoutMode = App.LayoutMode;
    const mobileNavLinks = Array.from(
      document.querySelectorAll("#mobileSectionNav a"),
    );

    function setMobileNavOpen(isOpen, animate = true) {
      if (!els.mobileSectionNav) {
        return;
      }
      CollapseAnimator.setOpen(
        els.mobileMenuToggle,
        els.mobileSectionNav,
        Boolean(isOpen),
        { animate },
      );
    }

    function toggleMobileNav() {
      setMobileNavOpen(
        els.mobileMenuToggle.getAttribute("aria-expanded") !== "true",
      );
    }

    function scrollToTop() {
      root.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }

    function bindMobileNavigation() {
      if (els.mobileMenuToggle) {
        els.mobileMenuToggle.addEventListener("click", toggleMobileNav);
      }

      if (els.mobileQuickNavButton) {
        els.mobileQuickNavButton.addEventListener("click", scrollToTop);
      }

      mobileNavLinks.forEach((link) => {
        link.addEventListener("click", () => {
          setMobileNavOpen(false);
        });
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          setMobileNavOpen(false);
        }
      });

      LayoutMode.onChange((mode) => {
        if (mode === "desktop") {
          setMobileNavOpen(false, false);
        }
      });

      setMobileNavOpen(false, false);
    }

    function setSettingsPanelOpen(isOpen, animate = true) {
      if (!els.settingsToggle || !els.settingsContent || !els.controlsPanel) {
        return;
      }

      if (LayoutMode.isDesktop()) {
        els.settingsToggle.setAttribute("aria-expanded", "true");
        els.settingsToggle.tabIndex = -1;
        els.controlsPanel.dataset.settingsCollapsed = "false";
        CollapseAnimator.setOpen(els.settingsToggle, els.settingsContent, true, {
          animate: false,
          force: true,
        });
        return;
      }

      const open = Boolean(isOpen);
      els.settingsToggle.tabIndex = 0;
      els.controlsPanel.dataset.settingsCollapsed = String(!open);
      CollapseAnimator.setOpen(els.settingsToggle, els.settingsContent, open, {
        animate,
        force: !animate,
      });
    }

    function bindMobileSettingsPanel() {
      if (!els.settingsToggle || !els.settingsContent) {
        return;
      }

      CollapseAnimator.enhance({
        trigger: els.settingsToggle,
        content: els.settingsContent,
        defaultOpen: LayoutMode.isDesktop(),
        allowToggle: () => false,
      });

      els.settingsToggle.addEventListener("click", () => {
        if (LayoutMode.isMobile()) {
          setSettingsPanelOpen(
            els.settingsToggle.getAttribute("aria-expanded") !== "true",
          );
        }
      });

      LayoutMode.onChange(() => {
        setSettingsPanelOpen(LayoutMode.isDesktop(), false);
      });

      setSettingsPanelOpen(LayoutMode.isDesktop(), false);
    }

    function enhanceSidebar() {
      document.querySelectorAll(".nav-section").forEach((section, index) => {
        const trigger = section.querySelector(".nav-item .chev")
          ? section.querySelector(".nav-item")
          : null;
        if (!trigger || trigger.dataset.stableAccordion === "true") {
          return;
        }

        const items = Array.from(
          section.querySelectorAll(".nav-sub, .sidebar-formula-catalog"),
        );
        if (!items.length) {
          return;
        }

        const content = document.createElement("div");
        const contentId = `sidebar-nav-group-${index}`;
        content.className = "nav-subgroup";
        content.id = contentId;
        items[0].before(content);
        items.forEach((item) => content.appendChild(item));

        const open = trigger.textContent.includes("Entrenar");
        trigger.dataset.stableAccordion = "true";
        trigger.setAttribute("aria-controls", contentId);
        CollapseAnimator.enhance({
          trigger,
          content,
          defaultOpen: open,
        });
      });
    }

    function enhanceRightCards() {
      document.querySelectorAll(".right-card").forEach((card, index) => {
        const head = card.querySelector(":scope > .card-head");
        if (!head || head.dataset.stableAccordion === "true") {
          return;
        }

        const children = Array.from(card.children).filter(
          (child) => child !== head,
        );
        if (!children.length) {
          return;
        }

        const content = document.createElement("div");
        const contentId = `right-card-content-${index}`;
        content.className = "right-card-content";
        content.id = contentId;
        children[0].before(content);
        children.forEach((child) => content.appendChild(child));

        const button = document.createElement("button");
        button.type = "button";
        button.className = "card-toggle";
        button.setAttribute("aria-controls", contentId);
        while (head.firstChild) {
          button.appendChild(head.firstChild);
        }

        const chevron = document.createElement("span");
        chevron.className = "collapsible-chevron";
        chevron.setAttribute("aria-hidden", "true");
        chevron.textContent = "⌄";
        button.appendChild(chevron);
        head.appendChild(button);
        head.dataset.stableAccordion = "true";
        CollapseAnimator.enhance({
          trigger: button,
          content,
          defaultOpen: true,
        });
      });
    }

    function bindNextExerciseProxies() {
      document
        .querySelectorAll("[data-next-exercise-proxy]")
        .forEach((button) => {
          if (button.dataset.nextExerciseBound === "true") {
            return;
          }
          button.dataset.nextExerciseBound = "true";
          button.addEventListener("click", () => {
            const target = document.getElementById("nextExerciseButton");
            if (target && target !== button) {
              target.click();
            }
          });
        });
    }

    function init() {
      enhanceSidebar();
      enhanceRightCards();
      bindNextExerciseProxies();
      bindMobileNavigation();
      bindMobileSettingsPanel();
    }

    return {
      init,
      onExerciseChanged(exercise, panels) {
        if (!exercise || !exercise.family) {
          return;
        }
        if (panels.controlsPanel && panels.controlsPanel.syncCurrentFamilyGroup) {
          panels.controlsPanel.syncCurrentFamilyGroup(exercise.family.id);
        }
        if (panels.formulaPanel && panels.formulaPanel.renderCurrentFamily) {
          panels.formulaPanel.renderCurrentFamily(exercise.family.id);
        }
      },
      setMobileNavOpen,
      setSettingsPanelOpen,
    };
  };
})(typeof window !== "undefined" ? window : globalThis);
