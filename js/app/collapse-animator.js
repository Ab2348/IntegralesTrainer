(function (root) {
  "use strict";

  const App = (root.TrigTrainerApp = root.TrigTrainerApp || {});
  const COLLAPSE_CLASS = "collapse-content";
  const COLLAPSE_FALLBACK_MS = 320;
  const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

  function prefersReducedMotion() {
    return (
      root.matchMedia && root.matchMedia(REDUCED_MOTION).matches
    );
  }

  function setAvailability(content, isOpen) {
    content.setAttribute("aria-hidden", String(!isOpen));
    if ("inert" in content) {
      content.inert = !isOpen;
    }
  }

  function setState(content, state) {
    content.dataset.collapseState = state;
  }

  function setExpanded(trigger, open) {
    if (trigger) {
      trigger.setAttribute("aria-expanded", String(Boolean(open)));
    }
  }

  function prepare(content) {
    content.classList.add(COLLAPSE_CLASS);
    if (!content.dataset.collapseState) {
      setState(content, content.hidden ? "closed" : "open");
    }
  }

  function cleanup(content) {
    if (content.__collapseCleanup) {
      content.__collapseCleanup();
      content.__collapseCleanup = null;
    }
    if (content.__collapseTimer) {
      clearTimeout(content.__collapseTimer);
      content.__collapseTimer = null;
    }
  }

  function finish(content, open, options) {
    content.style.height = "";
    content.style.overflow = "";
    content.hidden = !open;
    setAvailability(content, open);
    setState(content, open ? "open" : "closed");

    if (open && typeof options.onAfterOpen === "function") {
      options.onAfterOpen();
    }
    if (!open && typeof options.onAfterClose === "function") {
      options.onAfterClose();
    }
  }

  function setInstant(trigger, content, open, options) {
    cleanup(content);
    prepare(content);
    setExpanded(trigger, open);
    content.style.height = "";
    content.style.overflow = "";
    finish(content, open, options);
  }

  function setOpen(trigger, content, open, options = {}) {
    if (!content) {
      return;
    }

    const nextOpen = Boolean(open);
    prepare(content);
    cleanup(content);

    const currentOpen =
      content.dataset.collapseState === "open" ||
      content.dataset.collapseState === "opening" ||
      (!content.hidden && trigger && trigger.getAttribute("aria-expanded") === "true");

    if (currentOpen === nextOpen && !options.force) {
      setExpanded(trigger, nextOpen);
      return;
    }

    if (options.animate === false || prefersReducedMotion()) {
      setInstant(trigger, content, nextOpen, options);
      return;
    }

    setExpanded(trigger, nextOpen);
    content.hidden = false;
    setAvailability(content, nextOpen);
    content.style.overflow = "hidden";

    const startHeight = nextOpen
      ? 0
      : content.getBoundingClientRect().height || content.scrollHeight;

    content.style.height = `${startHeight}px`;
    setState(content, nextOpen ? "opening" : "closing");

    const handleTransitionEnd = (event) => {
      if (event.target !== content || event.propertyName !== "height") {
        return;
      }
      cleanup(content);
      finish(content, nextOpen, options);
    };

    content.addEventListener("transitionend", handleTransitionEnd);
    content.__collapseCleanup = () => {
      content.removeEventListener("transitionend", handleTransitionEnd);
    };
    content.__collapseTimer = root.setTimeout(() => {
      cleanup(content);
      finish(content, nextOpen, options);
    }, COLLAPSE_FALLBACK_MS);

    requestAnimationFrame(() => {
      const targetHeight = nextOpen ? content.scrollHeight : 0;
      content.style.height = `${targetHeight}px`;
    });
  }

  function toggle(trigger, content, options) {
    const open = trigger
      ? trigger.getAttribute("aria-expanded") !== "true"
      : content.hidden;
    setOpen(trigger, content, open, options);
  }

  function refresh(content) {
    if (
      content &&
      content.dataset.collapseState === "open" &&
      content.style.height
    ) {
      content.style.height = `${content.scrollHeight}px`;
    }
  }

  function enhance({
    trigger,
    content,
    defaultOpen = true,
    animateInitial = false,
    onAfterOpen,
    onAfterClose,
    allowToggle = () => true,
  }) {
    if (!trigger || !content) {
      return null;
    }

    const options = { onAfterOpen, onAfterClose };
    prepare(content);
    setOpen(trigger, content, defaultOpen, {
      ...options,
      animate: animateInitial,
      force: true,
    });

    trigger.addEventListener("click", () => {
      if (allowToggle()) {
        toggle(trigger, content, options);
      }
    });

    let resizeObserver = null;
    if (root.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        if (content.dataset.collapseState === "opening") {
          content.style.height = `${content.scrollHeight}px`;
        }
      });
      resizeObserver.observe(content);
    }

    return {
      open: (animate = true) => setOpen(trigger, content, true, {
        ...options,
        animate,
      }),
      close: (animate = true) => setOpen(trigger, content, false, {
        ...options,
        animate,
      }),
      toggle: () => toggle(trigger, content, options),
      refresh: () => refresh(content),
      destroy: () => {
        cleanup(content);
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
      },
    };
  }

  App.CollapseAnimator = {
    COLLAPSE_FALLBACK_MS,
    enhance,
    refresh,
    setOpen,
    toggle,
  };
})(typeof window !== "undefined" ? window : globalThis);
