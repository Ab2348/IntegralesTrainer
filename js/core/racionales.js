(function (root) {
  "use strict";

  function gcd(a, b) {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y !== 0) {
      const next = x % y;
      x = y;
      y = next;
    }
    return x || 1;
  }

  function rational(numerator, denominator) {
    const den = denominator === undefined ? 1 : denominator;
    if (!Number.isInteger(numerator) || !Number.isInteger(den)) {
      throw new Error("Rational values must use integers.");
    }
    if (den === 0) {
      throw new Error("Rational denominator cannot be zero.");
    }
    if (numerator === 0) {
      return { n: 0, d: 1 };
    }
    const sign = den < 0 ? -1 : 1;
    const signedNumerator = numerator * sign;
    const positiveDenominator = Math.abs(den);
    const divisor = gcd(signedNumerator, positiveDenominator);
    return {
      n: signedNumerator / divisor,
      d: positiveDenominator / divisor,
    };
  }

  function multiply(a, b) {
    return rational(a.n * b.n, a.d * b.d);
  }

  function multiplyInt(value, factor) {
    return rational(value.n * factor, value.d);
  }

  function divide(a, b) {
    if (b.n === 0) {
      throw new Error("Cannot divide by zero.");
    }
    return rational(a.n * b.d, a.d * b.n);
  }

  function divideInt(value, divisor) {
    return divide(value, rational(divisor, 1));
  }

  function negate(value) {
    return rational(-value.n, value.d);
  }

  function absRational(value) {
    return rational(Math.abs(value.n), value.d);
  }

  function equals(a, b) {
    return Boolean(a && b && a.n === b.n && a.d === b.d);
  }

  function rationalKey(value) {
    return `${value.n}/${value.d}`;
  }

  function rationalPlain(value) {
    if (value.d === 1) {
      return String(value.n);
    }
    return `${value.n}/${value.d}`;
  }

  function rationalLatex(value) {
    if (value.d === 1) {
      return String(value.n);
    }
    const sign = value.n < 0 ? "-" : "";
    return `${sign}\\frac{${Math.abs(value.n)}}{${value.d}}`;
  }

  root.TrigRationalUtils = {
    gcd,
    rational,
    multiply,
    multiplyInt,
    divide,
    divideInt,
    negate,
    absRational,
    equals,
    rationalKey,
    rationalPlain,
    rationalLatex,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigRationalUtils;
  }
})(typeof window !== "undefined" ? window : globalThis);
