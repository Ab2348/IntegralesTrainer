(function (root) {
  "use strict";

  const MODULE_SCRIPTS = [
    "integrales-lineales/familias.js",
    "integrales-lineales/errores.js",
    "integrales-lineales/variantes.js",
    "integrales-lineales/parametros.js",
    "integrales-lineales/formato.js",
    "integrales-lineales/formulas.js",
    "integrales-lineales/snapshots.js",
    "integrales-lineales/distractores.js",
    "integrales-lineales/feedback.js",
    "integrales-lineales/generacion.js",
    "integrales-lineales/derivacion.js",
    "integrales-lineales/renderer.js",
    "integrales-lineales/templates.js",
    "integrales-lineales/index.js",
  ];

  // Bootstrap buildless/IIFE: cargar este archivo como script sincrono durante
  // el parseo inicial. No usar con defer ni cargar dinamicamente cuando
  // document.readyState ya no sea "loading"; document.write() depende de eso.
  function linearModuleRegistered() {
    return Boolean(
      root.TrigCoreRegistry &&
        root.TrigCoreRegistry.get &&
        root.TrigCoreRegistry.get("integrales-lineales"),
    );
  }

  function currentScriptSrc() {
    const doc = root.document;
    const script = doc && doc.currentScript;
    if (!script) {
      return "";
    }
    if (typeof script.getAttribute === "function") {
      return script.getAttribute("src") || "";
    }
    return script.src || "";
  }

  function moduleBasePath() {
    const src = currentScriptSrc();
    if (!src) {
      return "js/core/modules/";
    }
    return src.replace(/index\.js(?:[?#].*)?$/, "");
  }

  function writeScript(doc, src) {
    doc.write(`<script src="${src.replace(/"/g, "&quot;")}"><\/script>`);
  }

  function assertSynchronousBootstrap(doc) {
    if (!doc || typeof doc.write !== "function") {
      throw new Error(
        "js/core/modules/index.js debe cargarse como script sincrono durante el arranque.",
      );
    }
    if (doc.readyState && doc.readyState !== "loading") {
      throw new Error(
        "js/core/modules/index.js solo puede usar document.write() durante el parseo inicial del documento.",
      );
    }
  }

  function loadBrowserModules() {
    if (linearModuleRegistered()) {
      return;
    }

    const doc = root.document;
    assertSynchronousBootstrap(doc);

    const basePath = moduleBasePath();
    MODULE_SCRIPTS.forEach((scriptPath) => {
      writeScript(doc, `${basePath}${scriptPath}`);
    });
  }

  function loadNodeModules() {
    require("./integrales-lineales/index.js");
  }

  if (typeof require === "function") {
    loadNodeModules();
  } else {
    loadBrowserModules();
  }

  root.TrigCoreModuleBootstrap = {
    moduleScripts: MODULE_SCRIPTS.slice(),
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigCoreModuleBootstrap;
  }
})(typeof window !== "undefined" ? window : globalThis);
