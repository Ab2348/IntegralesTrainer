(function (root) {
  "use strict";

  const App = root.TrigTrainerApp;
  if (!App) {
    return;
  }

  App.visualInteractionsCompat = {
    status: "migrated",
  };
})(typeof window !== "undefined" ? window : globalThis);
