const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const rootDir = path.resolve(__dirname, "..");

function createCore() {
  return {
    MODE_FAMILIES: {
      basic: ["sin"],
      custom: ["sin"],
    },
    ERROR_TYPES: [],
    ERROR_TAGS: [],
    FAMILIES: [{ id: "sin" }],
    MATH_FAMILIES: [{ id: "trigonometrica-directa" }],
    METHODS: [{ id: "directa" }],
    sanitizeRange(min, max) {
      return {
        min: Number.parseInt(min, 10),
        max: Number.parseInt(max, 10),
      };
    },
    optionCountForDifficulty(difficulty) {
      return ["4", "5"].includes(String(difficulty)) ? 6 : 4;
    },
    listTemplates() {
      return [];
    },
  };
}

function createLocalStorage(initialValue) {
  const store = new Map();
  if (initialValue !== undefined) {
    store.set("trig-integral-trainer:v1", JSON.stringify(initialValue));
  }
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    lastSaved() {
      const raw = store.get("trig-integral-trainer:v1");
      return raw ? JSON.parse(raw) : null;
    },
  };
}

function createStateStore(savedState) {
  const context = {
    console,
    localStorage: createLocalStorage(savedState),
    TrigTrainerApp: {},
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  const filename = path.join(rootDir, "js/app/state.js");
  vm.runInContext(fs.readFileSync(filename, "utf8"), context, { filename });
  return {
    context,
    store: context.TrigTrainerApp.createStateStore(createCore()),
  };
}

function testOldOptionCountIsIgnoredWhenLoadingState() {
  [
    { difficulty: "1", optionCount: 6 },
    { difficulty: "5", optionCount: 4 },
  ].forEach((settings) => {
    const { store } = createStateStore({
      settings: {
        mode: "basic",
        rangeMin: -20,
        rangeMax: 20,
        activeFamilyIds: ["sin"],
        ...settings,
      },
    });

    assert.equal(store.getState().settings.difficulty, settings.difficulty);
    assert.equal(
      Object.prototype.hasOwnProperty.call(
        store.getState().settings,
        "optionCount",
      ),
      false,
    );
  });
}

function testOptionCountIsNotPersistedFromUpdates() {
  const { context, store } = createStateStore();

  store.updateSettings({
    mode: "basic",
    difficulty: "5",
    rangeMin: -20,
    rangeMax: 20,
    optionCount: 4,
    activeFamilyIds: ["sin"],
  });

  assert.equal(store.getState().settings.difficulty, "5");
  assert.equal(
    Object.prototype.hasOwnProperty.call(store.getState().settings, "optionCount"),
    false,
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      context.localStorage.lastSaved().settings,
      "optionCount",
    ),
    false,
  );
}

function testModuleDefaultsComeFromCoreMetadata() {
  const { store } = createStateStore();
  const settings = store.getState().settings;

  assert.deepEqual(Array.from(settings.activeMathFamilyIds), [
    "trigonometrica-directa",
  ]);
  assert.deepEqual(Array.from(settings.activeMethodIds), ["directa"]);
}

function run() {
  testOldOptionCountIsIgnoredWhenLoadingState();
  testOptionCountIsNotPersistedFromUpdates();
  testModuleDefaultsComeFromCoreMetadata();
  console.log("State tests passed!");
}

run();
