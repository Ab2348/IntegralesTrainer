(function (root) {
  "use strict";

  const App = (root.TrigTrainerApp = root.TrigTrainerApp || {});

  App.createFloatingLayer = function createFloatingLayer({
    trigger,
    layer,
    hoverTarget,
    visibleClass = "is-visible",
    hideDelay = 120,
  }) {
    const target = hoverTarget || trigger;
    let hideTimer = null;

    function cancelHide() {
      if (hideTimer) {
        root.clearTimeout(hideTimer);
        hideTimer = null;
      }
    }

    function position() {
      if (!trigger || !layer || !layer.classList.contains(visibleClass)) {
        return;
      }

      const documentElement = root.document.documentElement;
      const triggerRect = trigger.getBoundingClientRect();
      const viewportWidth = root.innerWidth || documentElement.clientWidth;
      const viewportHeight = root.innerHeight || documentElement.clientHeight;
      const margin = 12;
      const gap = 8;

      layer.style.left = "0";
      layer.style.top = "0";
      layer.style.maxWidth = `calc(100vw - ${margin * 2}px)`;

      const layerRect = layer.getBoundingClientRect();
      const layerWidth = layerRect.width;
      const layerHeight = layerRect.height;
      const maxLeft = Math.max(margin, viewportWidth - layerWidth - margin);
      const preferredLeft = triggerRect.right - layerWidth;
      const left = Math.min(Math.max(margin, preferredLeft), maxLeft);
      const topAbove = triggerRect.top - layerHeight - gap;
      const topBelow = triggerRect.bottom + gap;
      const maxTop = Math.max(margin, viewportHeight - layerHeight - margin);
      const top = topAbove >= margin ? topAbove : Math.min(topBelow, maxTop);

      layer.style.left = `${left}px`;
      layer.style.top = `${Math.max(margin, top)}px`;
    }

    function show() {
      cancelHide();
      layer.classList.add(visibleClass);
      position();
      root.addEventListener("scroll", position, true);
      root.addEventListener("resize", position);
      if (root.requestAnimationFrame) {
        root.requestAnimationFrame(position);
      }
    }

    function hide() {
      cancelHide();
      layer.classList.remove(visibleClass);
      root.removeEventListener("scroll", position, true);
      root.removeEventListener("resize", position);
    }

    function scheduleHide() {
      cancelHide();
      hideTimer = root.setTimeout(hide, hideDelay);
    }

    target.addEventListener("pointerenter", show);
    target.addEventListener("pointerleave", scheduleHide);
    trigger.addEventListener("focus", show);
    trigger.addEventListener("blur", scheduleHide);
    layer.addEventListener("pointerenter", cancelHide);
    layer.addEventListener("pointerleave", scheduleHide);

    return {
      cleanup() {
        hide();
        target.removeEventListener("pointerenter", show);
        target.removeEventListener("pointerleave", scheduleHide);
        trigger.removeEventListener("focus", show);
        trigger.removeEventListener("blur", scheduleHide);
        layer.removeEventListener("pointerenter", cancelHide);
        layer.removeEventListener("pointerleave", scheduleHide);
        layer.remove();
      },
      hide,
      position,
      show,
    };
  };
})(typeof window !== "undefined" ? window : globalThis);
