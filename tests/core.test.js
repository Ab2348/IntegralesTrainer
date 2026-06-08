const assert = require("assert");
const Core = require("../core.js");

function correct(params) {
  const exercise = Core.buildExerciseFromParams(params, 4, Math.random);
  return exercise.correctAnswer.displayExpression;
}

assert.strictEqual(
  correct({ A: -6, k: -3, b: 4, familyId: "cos" }),
  "2 sin(-3x + 4) + C"
);

assert.strictEqual(
  correct({ A: 5, k: 4, b: -7, familyId: "sin" }),
  "-5/4 cos(4x - 7) + C"
);

assert.strictEqual(
  correct({ A: 8, k: -2, b: 5, familyId: "csc2" }),
  "4 cot(-2x + 5) + C"
);

assert.strictEqual(
  correct({ A: -9, k: 3, b: 1, familyId: "sec2" }),
  "-3 tan(3x + 1) + C"
);

assert.strictEqual(
  correct({ A: 6, k: -2, b: 3, familyId: "arctan" }),
  "-3 arctan(-2x + 3) + C"
);

assert.strictEqual(
  correct({ A: 3, k: -2, b: 0, familyId: "tan" }),
  "3/2 ln |cos(-2x)| + C"
);

assert.strictEqual(Core.formatArgumentPlain(Core.rational(3), Core.rational(-4)), "3x - 4");
assert.strictEqual(Core.formatArgumentPlain(Core.rational(1), Core.rational(0)), "x");
assert.strictEqual(Core.formatArgumentPlain(Core.rational(-1), Core.rational(0)), "-x");
assert.strictEqual(Core.rationalPlain(Core.rational(-6, -4)), "3/2");

for (const family of Core.FAMILIES) {
  const exercise = Core.buildExerciseFromParams({ A: -6, k: -3, b: 4, familyId: family.id }, 4, Math.random);
  const correctOptions = exercise.options.filter((option) => option.isCorrect);
  const keys = new Set(exercise.options.map((option) => option.key));
  assert.strictEqual(correctOptions.length, 1, family.id);
  assert.strictEqual(keys.size, exercise.options.length, family.id);
}

console.log("core tests passed");
