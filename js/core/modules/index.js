(function (root) {
  "use strict";

  const MODULE_MANIFEST = [
    {
      moduleId: "integrales-lineales",
      basePath: "integrales-lineales/",
      scripts: [
        "familias.js",
        "errores.js",
        "variantes.js",
        "parametros.js",
        "formato.js",
        "formulas.js",
        "snapshots.js",
        "distractores.js",
        "feedback.js",
        "generacion.js",
        "derivacion.js",
        "renderer.js",
        "templates.js",
        "index.js",
      ],
      nodeEntry: "./integrales-lineales/index.js",
    },
    {
      moduleId: "integrales-algebraicas-lineales",
      basePath: "integrales-algebraicas-lineales/",
      scripts: [
        "familias.js",
        "errores.js",
        "variantes.js",
        "parametros.js",
        "formato.js",
        "formulas.js",
        "snapshots.js",
        "distractores.js",
        "feedback.js",
        "generacion.js",
        "derivacion.js",
        "renderer.js",
        "templates.js",
        "index.js",
      ],
      nodeEntry: "./integrales-algebraicas-lineales/index.js",
    },
  ];

  // Bootstrap buildless/IIFE: cargar este archivo como script sincrono durante
  // el parseo inicial. No usar con defer ni cargar dinamicamente cuando
  // document.readyState ya no sea "loading"; document.write() depende de eso.
  function moduleRegistered(moduleId) {
    return Boolean(
      root.TrigCoreRegistry &&
        root.TrigCoreRegistry.get &&
        root.TrigCoreRegistry.get(moduleId),
    );
  }

  function moduleScriptPaths(moduleDefinition) {
    return moduleDefinition.scripts.map(
      (scriptPath) => `${moduleDefinition.basePath}${scriptPath}`,
    );
  }

  function allModuleScriptPaths() {
    return MODULE_MANIFEST.flatMap(moduleScriptPaths);
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
    const pendingModules = MODULE_MANIFEST.filter(
      (moduleDefinition) => !moduleRegistered(moduleDefinition.moduleId),
    );
    if (!pendingModules.length) {
      return;
    }

    const doc = root.document;
    assertSynchronousBootstrap(doc);

    const basePath = moduleBasePath();
    pendingModules.forEach((moduleDefinition) => {
      moduleScriptPaths(moduleDefinition).forEach((scriptPath) => {
        writeScript(doc, `${basePath}${scriptPath}`);
      });
    });
  }

  function loadNodeModules() {
    MODULE_MANIFEST.forEach((moduleDefinition) => {
      require(moduleDefinition.nodeEntry);
    });
  }

  if (typeof require === "function") {
    loadNodeModules();
  } else {
    loadBrowserModules();
  }

  root.TrigCoreModuleBootstrap = {
    modules: MODULE_MANIFEST.map((moduleDefinition) => ({
      moduleId: moduleDefinition.moduleId,
      basePath: moduleDefinition.basePath,
      scripts: moduleDefinition.scripts.slice(),
      nodeEntry: moduleDefinition.nodeEntry,
    })),
    moduleScripts: allModuleScriptPaths(),
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigCoreModuleBootstrap;
  }
})(typeof window !== "undefined" ? window : globalThis);
