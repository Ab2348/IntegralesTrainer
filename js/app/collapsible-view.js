(function (root) {
  "use strict";

  const App = (root.TrigTrainerApp = root.TrigTrainerApp || {});

  function appendBadge(parent, badge) {
    if (!badge) {
      return;
    }
    const badgeNode = document.createElement("span");
    badgeNode.className = "collapsible-badge";
    badgeNode.textContent = badge;
    parent.appendChild(badgeNode);
  }

  function appendChevron(parent) {
    const chevron = document.createElement("span");
    chevron.className = "collapsible-chevron";
    chevron.setAttribute("aria-hidden", "true");
    chevron.textContent = "⌄";
    parent.appendChild(chevron);
  }

  function createBaseSection({ id, title, badge, level, className }) {
    const section = document.createElement("section");
    section.className = `collapsible ${className || ""}`.trim();
    if (level) {
      section.dataset.level = String(level);
    }

    const label = document.createElement("span");
    label.className = "collapsible-title";
    label.textContent = title || "";

    const content = document.createElement("div");
    content.className = "collapsible-content";
    content.id = `${id}-content`;

    return { section, label, content, badge };
  }

  function createCollapsible({
    id,
    title,
    badge,
    defaultOpen,
    level,
    className,
  }) {
    const CollapseAnimator = App.CollapseAnimator;
    const { section, label, content } = createBaseSection({
      id,
      title,
      badge,
      level,
      className,
    });

    const button = document.createElement("button");
    button.type = "button";
    button.className = "collapsible-trigger";
    button.id = `${id}-trigger`;
    button.setAttribute("aria-expanded", String(Boolean(defaultOpen)));
    button.setAttribute("aria-controls", content.id);

    button.appendChild(label);
    appendBadge(button, badge);
    appendChevron(button);

    content.setAttribute("role", "region");
    content.setAttribute("aria-labelledby", button.id);
    CollapseAnimator.enhance({
      trigger: button,
      content,
      defaultOpen: Boolean(defaultOpen),
    });

    section.append(button, content);
    return { section, button, content };
  }

  function createStaticSection({ id, title, badge, level, className }) {
    const { section, label, content } = createBaseSection({
      id,
      title,
      badge,
      level,
      className: `static-collapsible ${className || ""}`.trim(),
    });

    const header = document.createElement("div");
    header.className = "collapsible-trigger static-collapsible-header";
    header.id = `${id}-trigger`;
    header.appendChild(label);
    appendBadge(header, badge);

    section.append(header, content);
    return { section, header, content };
  }

  function setOpen(id, open) {
    const CollapseAnimator = App.CollapseAnimator;
    const trigger = document.getElementById(`${id}-trigger`);
    const content = document.getElementById(`${id}-content`);
    if (!trigger || !content) {
      return;
    }
    CollapseAnimator.setOpen(trigger, content, Boolean(open));
  }

  App.CollapsibleView = {
    createCollapsible,
    createStaticSection,
    setOpen,
  };
})(typeof window !== "undefined" ? window : globalThis);
