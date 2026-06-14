(function (root) {
  "use strict";

  const Model = root.TrigExerciseModel || {};

  function defaultShuffle(items, rng) {
    const random = rng || Math.random;
    const result = items.slice();
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      const temp = result[index];
      result[index] = result[swapIndex];
      result[swapIndex] = temp;
    }
    return result;
  }

  function buildOptionSet(config) {
    const source = config || {};
    const optionCount = Math.max(2, Number.parseInt(source.optionCount, 10) || 4);
    const correctOption = Model.normalizeOption
      ? Model.normalizeOption(source.correctOption)
      : source.correctOption;
    const candidates = Array.isArray(source.candidates) ? source.candidates : [];
    const correctKey = source.correctKey || (correctOption && correctOption.key);
    const seen = new Set();
    const distractors = [];

    for (const candidate of candidates) {
      if (!candidate) {
        continue;
      }
      const option = Model.normalizeOption
        ? Model.normalizeOption(candidate)
        : candidate;
      const key = option.key || option.id;
      if (key === correctKey || seen.has(key)) {
        continue;
      }
      seen.add(key);
      distractors.push(option);
      if (distractors.length >= optionCount - 1) {
        break;
      }
    }

    if (!correctOption || distractors.length < optionCount - 1) {
      return null;
    }

    const shuffle = source.shuffle || defaultShuffle;
    const options = shuffle([correctOption].concat(distractors), source.rng);
    return {
      correctOption,
      distractors,
      options,
    };
  }

  root.TrigOptionEngine = {
    buildOptionSet,
    defaultShuffle,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigOptionEngine;
  }
})(typeof window !== "undefined" ? window : globalThis);
