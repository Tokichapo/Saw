var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ../../aws-cdk-lib/assertions/lib/matcher.ts
var matcher_exports = {};
__export(matcher_exports, {
  MatchResult: () => MatchResult,
  Matcher: () => Matcher
});
function* range(n) {
  for (let i = 0; i < n; i++) {
    yield i;
  }
}
function* enumFirst(xs) {
  let first = true;
  for (const x of xs) {
    yield [first, x];
    first = false;
  }
}
var Matcher, MatchResult;
var init_matcher = __esm({
  "../../aws-cdk-lib/assertions/lib/matcher.ts"() {
    "use strict";
    Matcher = class {
      /**
       * Check whether the provided object is a subtype of the `IMatcher`.
       */
      static isMatcher(x) {
        return x && x instanceof Matcher;
      }
    };
    MatchResult = class {
      constructor(target) {
        this.failuresHere = /* @__PURE__ */ new Map();
        this.captures = /* @__PURE__ */ new Map();
        this.finalized = false;
        this.innerMatchFailures = /* @__PURE__ */ new Map();
        this._hasFailed = false;
        this._failCount = 0;
        this._cost = 0;
        this.target = target;
      }
      /**
       * DEPRECATED
       * @deprecated use recordFailure()
       */
      push(matcher, path, message) {
        return this.recordFailure({ matcher, path, message });
      }
      /**
       * Record a new failure into this result at a specific path.
       */
      recordFailure(failure) {
        const failKey = failure.path.join(".");
        let list = this.failuresHere.get(failKey);
        if (!list) {
          list = [];
          this.failuresHere.set(failKey, list);
        }
        this._failCount += 1;
        this._cost += failure.cost ?? 1;
        list.push(failure);
        this._hasFailed = true;
        return this;
      }
      /** Whether the match is a success */
      get isSuccess() {
        return !this._hasFailed;
      }
      /** Does the result contain any failures. If not, the result is a success */
      hasFailed() {
        return this._hasFailed;
      }
      /** The number of failures */
      get failCount() {
        return this._failCount;
      }
      /** The cost of the failures so far */
      get failCost() {
        return this._cost;
      }
      /**
       * Compose the results of a previous match as a subtree.
       * @param id the id of the parent tree.
       */
      compose(id, inner) {
        if (inner.hasFailed()) {
          this._hasFailed = true;
          this._failCount += inner.failCount;
          this._cost += inner._cost;
          this.innerMatchFailures.set(id, inner);
        }
        inner.captures.forEach((vals, capture) => {
          vals.forEach((value) => this.recordCapture({ capture, value }));
        });
        return this;
      }
      /**
       * Prepare the result to be analyzed.
       * This API *must* be called prior to analyzing these results.
       */
      finished() {
        if (this.finalized) {
          return this;
        }
        if (this.failCount === 0) {
          this.captures.forEach((vals, cap) => cap._captured.push(...vals));
        }
        this.finalized = true;
        return this;
      }
      /**
       * Render the failed match in a presentable way
       *
       * Prefer using `renderMismatch` over this method. It is left for backwards
       * compatibility for test suites that expect it, but `renderMismatch()` will
       * produce better output.
       */
      toHumanStrings() {
        const failures = new Array();
        debugger;
        recurse(this, []);
        return failures.map((r) => {
          const loc = r.path.length === 0 ? "" : ` at /${r.path.join("/")}`;
          return "" + r.message + loc + ` (using ${r.matcher.name} matcher)`;
        });
        function recurse(x, prefix) {
          for (const fail of Array.from(x.failuresHere.values()).flat()) {
            failures.push({
              matcher: fail.matcher,
              message: fail.message,
              path: [...prefix, ...fail.path]
            });
          }
          for (const [key, inner] of x.innerMatchFailures.entries()) {
            recurse(inner, [...prefix, key]);
          }
        }
      }
      /**
       * Do a deep render of the match result, showing the structure mismatches in context
       */
      renderMismatch() {
        if (!this.hasFailed()) {
          return "<match>";
        }
        const parts = new Array();
        const indents = new Array();
        emitFailures(this, "");
        recurse(this);
        return moveMarkersToFront(parts.join("").trimEnd());
        function emit(x) {
          if (x === void 0) {
            debugger;
          }
          parts.push(x.replace(/\n/g, `
${indents.join("")}`));
        }
        function emitFailures(r, path, scrapSet) {
          for (const fail of r.failuresHere.get(path) ?? []) {
            emit(`!! ${fail.message}
`);
          }
          scrapSet == null ? void 0 : scrapSet.delete(path);
        }
        function recurse(r) {
          const remainingFailures = new Set(Array.from(r.failuresHere.keys()).filter((x) => x !== ""));
          if (Array.isArray(r.target)) {
            indents.push("  ");
            emit("[\n");
            for (const [first, i] of enumFirst(range(r.target.length))) {
              if (!first) {
                emit(",\n");
              }
              emitFailures(r, `${i}`, remainingFailures);
              const innerMatcher = r.innerMatchFailures.get(`${i}`);
              if (innerMatcher) {
                emitFailures(innerMatcher, "");
                recurseComparingValues(innerMatcher, r.target[i]);
              } else {
                emit(renderAbridged(r.target[i]));
              }
            }
            emitRemaining();
            indents.pop();
            emit("\n]");
            return;
          }
          if (r.target && typeof r.target === "object") {
            indents.push("  ");
            emit("{\n");
            const keys = Array.from(/* @__PURE__ */ new Set([
              ...Object.keys(r.target),
              ...Array.from(remainingFailures)
            ])).sort();
            for (const [first, key] of enumFirst(keys)) {
              if (!first) {
                emit(",\n");
              }
              emitFailures(r, key, remainingFailures);
              const innerMatcher = r.innerMatchFailures.get(key);
              if (innerMatcher) {
                emitFailures(innerMatcher, "");
                emit(`${jsonify(key)}: `);
                recurseComparingValues(innerMatcher, r.target[key]);
              } else {
                emit(`${jsonify(key)}: `);
                emit(renderAbridged(r.target[key]));
              }
            }
            emitRemaining();
            indents.pop();
            emit("\n}");
            return;
          }
          emitRemaining();
          emit(jsonify(r.target));
          function emitRemaining() {
            if (remainingFailures.size > 0) {
              emit("\n");
            }
            for (const key of remainingFailures) {
              emitFailures(r, key);
            }
          }
        }
        function recurseComparingValues(inner, actualValue) {
          if (inner.target === actualValue) {
            return recurse(inner);
          }
          emit(renderAbridged(actualValue));
          emit(" <*> ");
          recurse(inner);
        }
        function renderAbridged(x) {
          if (Array.isArray(x)) {
            switch (x.length) {
              case 0:
                return "[]";
              case 1:
                return `[ ${renderAbridged(x[0])} ]`;
              case 2:
                if (x.every((e) => ["number", "boolean", "string"].includes(typeof e))) {
                  return `[ ${x.map(renderAbridged).join(", ")} ]`;
                }
                return "[ ... ]";
              default:
                return "[ ... ]";
            }
          }
          if (x && typeof x === "object") {
            const keys = Object.keys(x);
            switch (keys.length) {
              case 0:
                return "{}";
              case 1:
                return `{ ${JSON.stringify(keys[0])}: ${renderAbridged(x[keys[0]])} }`;
              default:
                return "{ ... }";
            }
          }
          return jsonify(x);
        }
        function jsonify(x) {
          return JSON.stringify(x) ?? "undefined";
        }
        function moveMarkersToFront(x) {
          const re = /^(\s+)!!/gm;
          return x.replace(re, (_, spaces) => `!!${spaces.substring(0, spaces.length - 2)}`);
        }
      }
      /**
       * Record a capture against in this match result.
       */
      recordCapture(options) {
        let values = this.captures.get(options.capture);
        if (values === void 0) {
          values = [];
        }
        values.push(options.value);
        this.captures.set(options.capture, values);
      }
    };
  }
});

// ../../aws-cdk-lib/assertions/lib/private/matchers/absent.ts
var AbsentMatch;
var init_absent = __esm({
  "../../aws-cdk-lib/assertions/lib/private/matchers/absent.ts"() {
    "use strict";
    init_matcher();
    AbsentMatch = class extends Matcher {
      constructor(name) {
        super();
        this.name = name;
      }
      test(actual) {
        const result = new MatchResult(actual);
        if (actual !== void 0) {
          result.recordFailure({
            matcher: this,
            path: [],
            message: `Received ${actual}, but key should be absent`
          });
        }
        return result;
      }
    };
  }
});

// ../../aws-cdk-lib/assertions/lib/private/sorting.ts
function sortKeyComparator(keyFn) {
  return (a, b) => {
    const ak = keyFn(a);
    const bk = keyFn(b);
    for (let i = 0; i < ak.length && i < bk.length; i++) {
      const av = ak[i];
      const bv = bk[i];
      let diff = 0;
      if (typeof av === "number" && typeof bv === "number") {
        diff = av - bv;
      } else if (typeof av === "string" && typeof bv === "string") {
        diff = av.localeCompare(bv);
      }
      if (diff !== 0) {
        return diff;
      }
    }
    return bk.length - ak.length;
  };
}
var init_sorting = __esm({
  "../../aws-cdk-lib/assertions/lib/private/sorting.ts"() {
    "use strict";
  }
});

// ../../aws-cdk-lib/assertions/lib/private/sparse-matrix.ts
var SparseMatrix;
var init_sparse_matrix = __esm({
  "../../aws-cdk-lib/assertions/lib/private/sparse-matrix.ts"() {
    "use strict";
    SparseMatrix = class {
      constructor() {
        this.matrix = /* @__PURE__ */ new Map();
      }
      get(row, col) {
        var _a;
        return (_a = this.matrix.get(row)) == null ? void 0 : _a.get(col);
      }
      row(row) {
        var _a;
        return Array.from(((_a = this.matrix.get(row)) == null ? void 0 : _a.entries()) ?? []);
      }
      set(row, col, value) {
        let r = this.matrix.get(row);
        if (!r) {
          r = /* @__PURE__ */ new Map();
          this.matrix.set(row, r);
        }
        r.set(col, value);
      }
    };
  }
});

// ../../aws-cdk-lib/assertions/lib/private/type.ts
function getType(obj) {
  return Array.isArray(obj) ? "array" : typeof obj;
}
var init_type = __esm({
  "../../aws-cdk-lib/assertions/lib/private/type.ts"() {
    "use strict";
  }
});

// ../../aws-cdk-lib/assertions/lib/match.ts
var match_exports = {};
__export(match_exports, {
  Match: () => Match
});
var Match, LiteralMatch, ArrayMatch, ObjectMatch, SerializedJson, NotMatch, AnyMatch, StringLikeRegexpMatch;
var init_match = __esm({
  "../../aws-cdk-lib/assertions/lib/match.ts"() {
    "use strict";
    init_matcher();
    init_absent();
    init_sorting();
    init_sparse_matrix();
    init_type();
    Match = class {
      /**
       * Use this matcher in the place of a field's value, if the field must not be present.
       */
      static absent() {
        return new AbsentMatch("absent");
      }
      /**
       * Matches the specified pattern with the array found in the same relative path of the target.
       * The set of elements (or matchers) must be in the same order as would be found.
       * @param pattern the pattern to match
       */
      static arrayWith(pattern) {
        return new ArrayMatch("arrayWith", pattern);
      }
      /**
       * Matches the specified pattern with the array found in the same relative path of the target.
       * The set of elements (or matchers) must match exactly and in order.
       * @param pattern the pattern to match
       */
      static arrayEquals(pattern) {
        return new ArrayMatch("arrayEquals", pattern, { subsequence: false });
      }
      /**
       * Deep exact matching of the specified pattern to the target.
       * @param pattern the pattern to match
       */
      static exact(pattern) {
        return new LiteralMatch("exact", pattern, { partialObjects: false });
      }
      /**
       * Matches the specified pattern to an object found in the same relative path of the target.
       * The keys and their values (or matchers) must be present in the target but the target can be a superset.
       * @param pattern the pattern to match
       */
      static objectLike(pattern) {
        return new ObjectMatch("objectLike", pattern);
      }
      /**
       * Matches the specified pattern to an object found in the same relative path of the target.
       * The keys and their values (or matchers) must match exactly with the target.
       * @param pattern the pattern to match
       */
      static objectEquals(pattern) {
        return new ObjectMatch("objectEquals", pattern, { partial: false });
      }
      /**
       * Matches any target which does NOT follow the specified pattern.
       * @param pattern the pattern to NOT match
       */
      static not(pattern) {
        return new NotMatch("not", pattern);
      }
      /**
       * Matches any string-encoded JSON and applies the specified pattern after parsing it.
       * @param pattern the pattern to match after parsing the encoded JSON.
       */
      static serializedJson(pattern) {
        return new SerializedJson("serializedJson", pattern);
      }
      /**
       * Matches any non-null value at the target.
       */
      static anyValue() {
        return new AnyMatch("anyValue");
      }
      /**
       * Matches targets according to a regular expression
       */
      static stringLikeRegexp(pattern) {
        return new StringLikeRegexpMatch("stringLikeRegexp", pattern);
      }
    };
    LiteralMatch = class extends Matcher {
      constructor(name, pattern, options = {}) {
        super();
        this.name = name;
        this.pattern = pattern;
        this.partialObjects = options.partialObjects ?? false;
        if (Matcher.isMatcher(this.pattern)) {
          throw new Error("LiteralMatch cannot directly contain another matcher. Remove the top-level matcher or nest it more deeply.");
        }
      }
      test(actual) {
        if (Array.isArray(this.pattern)) {
          return new ArrayMatch(this.name, this.pattern, { subsequence: false, partialObjects: this.partialObjects }).test(actual);
        }
        if (typeof this.pattern === "object") {
          return new ObjectMatch(this.name, this.pattern, { partial: this.partialObjects }).test(actual);
        }
        const result = new MatchResult(actual);
        if (typeof this.pattern !== typeof actual) {
          result.recordFailure({
            matcher: this,
            path: [],
            message: `Expected type ${typeof this.pattern} but received ${getType(actual)}`
          });
          return result;
        }
        if (actual !== this.pattern) {
          result.recordFailure({
            matcher: this,
            path: [],
            message: `Expected ${this.pattern} but received ${actual}`
          });
        }
        return result;
      }
    };
    ArrayMatch = class extends Matcher {
      constructor(name, pattern, options = {}) {
        super();
        this.name = name;
        this.pattern = pattern;
        this.subsequence = options.subsequence ?? true;
        this.partialObjects = options.partialObjects ?? false;
      }
      test(actual) {
        if (!Array.isArray(actual)) {
          return new MatchResult(actual).recordFailure({
            matcher: this,
            path: [],
            message: `Expected type array but received ${getType(actual)}`
          });
        }
        return this.subsequence ? this.testSubsequence(actual) : this.testFullArray(actual);
      }
      testFullArray(actual) {
        const result = new MatchResult(actual);
        let i = 0;
        for (; i < this.pattern.length && i < actual.length; i++) {
          const patternElement = this.pattern[i];
          const matcher = Matcher.isMatcher(patternElement) ? patternElement : new LiteralMatch(this.name, patternElement, { partialObjects: this.partialObjects });
          const innerResult = matcher.test(actual[i]);
          result.compose(`${i}`, innerResult);
        }
        if (i < this.pattern.length) {
          result.recordFailure({
            matcher: this,
            message: `Not enough elements in array (expecting ${this.pattern.length}, got ${actual.length})`,
            path: [`${i}`]
          });
        }
        if (i < actual.length) {
          result.recordFailure({
            matcher: this,
            message: `Too many elements in array (expecting ${this.pattern.length}, got ${actual.length})`,
            path: [`${i}`]
          });
        }
        return result;
      }
      testSubsequence(actual) {
        const result = new MatchResult(actual);
        let patternIdx = 0;
        let actualIdx = 0;
        const matches = new SparseMatrix();
        while (patternIdx < this.pattern.length && actualIdx < actual.length) {
          const patternElement = this.pattern[patternIdx];
          const matcher = Matcher.isMatcher(patternElement) ? patternElement : new LiteralMatch(this.name, patternElement, { partialObjects: this.partialObjects });
          const matcherName = matcher.name;
          if (matcherName == "absent" || matcherName == "anyValue") {
            throw new Error(`The Matcher ${matcherName}() cannot be nested within arrayWith()`);
          }
          const innerResult = matcher.test(actual[actualIdx]);
          matches.set(patternIdx, actualIdx, innerResult);
          actualIdx++;
          if (innerResult.isSuccess) {
            result.compose(`${actualIdx}`, innerResult);
            patternIdx++;
          }
        }
        if (patternIdx < this.pattern.length) {
          for (let spi = 0; spi < patternIdx; spi++) {
            const foundMatch = matches.row(spi).find(([, r]) => r.isSuccess);
            if (!foundMatch) {
              continue;
            }
            const [index] = foundMatch;
            result.compose(`${index}`, new MatchResult(actual[index]).recordFailure({
              matcher: this,
              message: `arrayWith pattern ${spi} matched here`,
              path: [],
              cost: 0
              // This is an informational message so it would be unfair to assign it cost
            }));
          }
          const failedMatches = matches.row(patternIdx);
          failedMatches.sort(sortKeyComparator(([i, r]) => [r.failCost, i]));
          if (failedMatches.length > 0) {
            const [index, innerResult] = failedMatches[0];
            result.recordFailure({
              matcher: this,
              message: `Could not match arrayWith pattern ${patternIdx}. This is the closest match`,
              path: [`${index}`],
              cost: 0
              //  Informational message
            });
            result.compose(`${index}`, innerResult);
          } else {
            result.recordFailure({
              matcher: this,
              message: `Could not match arrayWith pattern ${patternIdx}. No more elements to try`,
              path: [`${actual.length}`]
            });
          }
        }
        return result;
      }
    };
    ObjectMatch = class extends Matcher {
      constructor(name, pattern, options = {}) {
        super();
        this.name = name;
        this.pattern = pattern;
        this.partial = options.partial ?? true;
      }
      test(actual) {
        if (typeof actual !== "object" || Array.isArray(actual)) {
          return new MatchResult(actual).recordFailure({
            matcher: this,
            path: [],
            message: `Expected type object but received ${getType(actual)}`
          });
        }
        const result = new MatchResult(actual);
        if (!this.partial) {
          for (const a of Object.keys(actual)) {
            if (!(a in this.pattern)) {
              result.recordFailure({
                matcher: this,
                path: [a],
                message: `Unexpected key ${a}`
              });
            }
          }
        }
        for (const [patternKey, patternVal] of Object.entries(this.pattern)) {
          if (!(patternKey in actual) && !(patternVal instanceof AbsentMatch)) {
            result.recordFailure({
              matcher: this,
              path: [patternKey],
              message: `Missing key '${patternKey}'`
            });
            continue;
          }
          const matcher = Matcher.isMatcher(patternVal) ? patternVal : new LiteralMatch(this.name, patternVal, { partialObjects: this.partial });
          const inner = matcher.test(actual[patternKey]);
          result.compose(patternKey, inner);
        }
        return result;
      }
    };
    SerializedJson = class extends Matcher {
      constructor(name, pattern) {
        super();
        this.name = name;
        this.pattern = pattern;
      }
      test(actual) {
        if (getType(actual) !== "string") {
          return new MatchResult(actual).recordFailure({
            matcher: this,
            path: [],
            message: `Expected JSON as a string but found ${getType(actual)}`
          });
        }
        let parsed;
        try {
          parsed = JSON.parse(actual);
        } catch (err) {
          if (err instanceof SyntaxError) {
            return new MatchResult(actual).recordFailure({
              matcher: this,
              path: [],
              message: `Invalid JSON string: ${actual}`
            });
          } else {
            throw err;
          }
        }
        const matcher = Matcher.isMatcher(this.pattern) ? this.pattern : new LiteralMatch(this.name, this.pattern);
        const innerResult = matcher.test(parsed);
        if (innerResult.hasFailed()) {
          innerResult.recordFailure({
            matcher: this,
            path: [],
            message: "Encoded JSON value does not match"
          });
        }
        return innerResult;
      }
    };
    NotMatch = class extends Matcher {
      constructor(name, pattern) {
        super();
        this.name = name;
        this.pattern = pattern;
      }
      test(actual) {
        const matcher = Matcher.isMatcher(this.pattern) ? this.pattern : new LiteralMatch(this.name, this.pattern);
        const innerResult = matcher.test(actual);
        const result = new MatchResult(actual);
        if (innerResult.failCount === 0) {
          result.recordFailure({
            matcher: this,
            path: [],
            message: `Found unexpected match: ${JSON.stringify(actual, void 0, 2)}`
          });
        }
        return result;
      }
    };
    AnyMatch = class extends Matcher {
      constructor(name) {
        super();
        this.name = name;
      }
      test(actual) {
        const result = new MatchResult(actual);
        if (actual == null) {
          result.recordFailure({
            matcher: this,
            path: [],
            message: "Expected a value but found none"
          });
        }
        return result;
      }
    };
    StringLikeRegexpMatch = class extends Matcher {
      constructor(name, pattern) {
        super();
        this.name = name;
        this.pattern = pattern;
      }
      test(actual) {
        const result = new MatchResult(actual);
        const regex = new RegExp(this.pattern, "gm");
        if (typeof actual !== "string") {
          result.recordFailure({
            matcher: this,
            path: [],
            message: `Expected a string, but got '${typeof actual}'`
          });
        }
        if (!regex.test(actual)) {
          result.recordFailure({
            matcher: this,
            path: [],
            message: `String '${actual}' did not match pattern '${this.pattern}'`
          });
        }
        return result;
      }
    };
  }
});

// ../../aws-cdk-lib/assertions/lib/helpers-internal/index.js
var require_helpers_internal = __commonJS({
  "../../aws-cdk-lib/assertions/lib/helpers-internal/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m)
        if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
          __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar((init_match(), __toCommonJS(match_exports)), exports);
    __exportStar((init_matcher(), __toCommonJS(matcher_exports)), exports);
  }
});

// ../../../node_modules/webidl-conversions/lib/index.js
var require_lib = __commonJS({
  "../../../node_modules/webidl-conversions/lib/index.js"(exports, module2) {
    "use strict";
    var conversions = {};
    module2.exports = conversions;
    function sign(x) {
      return x < 0 ? -1 : 1;
    }
    function evenRound(x) {
      if (x % 1 === 0.5 && (x & 1) === 0) {
        return Math.floor(x);
      } else {
        return Math.round(x);
      }
    }
    function createNumberConversion(bitLength, typeOpts) {
      if (!typeOpts.unsigned) {
        --bitLength;
      }
      const lowerBound = typeOpts.unsigned ? 0 : -Math.pow(2, bitLength);
      const upperBound = Math.pow(2, bitLength) - 1;
      const moduloVal = typeOpts.moduloBitLength ? Math.pow(2, typeOpts.moduloBitLength) : Math.pow(2, bitLength);
      const moduloBound = typeOpts.moduloBitLength ? Math.pow(2, typeOpts.moduloBitLength - 1) : Math.pow(2, bitLength - 1);
      return function(V, opts) {
        if (!opts)
          opts = {};
        let x = +V;
        if (opts.enforceRange) {
          if (!Number.isFinite(x)) {
            throw new TypeError("Argument is not a finite number");
          }
          x = sign(x) * Math.floor(Math.abs(x));
          if (x < lowerBound || x > upperBound) {
            throw new TypeError("Argument is not in byte range");
          }
          return x;
        }
        if (!isNaN(x) && opts.clamp) {
          x = evenRound(x);
          if (x < lowerBound)
            x = lowerBound;
          if (x > upperBound)
            x = upperBound;
          return x;
        }
        if (!Number.isFinite(x) || x === 0) {
          return 0;
        }
        x = sign(x) * Math.floor(Math.abs(x));
        x = x % moduloVal;
        if (!typeOpts.unsigned && x >= moduloBound) {
          return x - moduloVal;
        } else if (typeOpts.unsigned) {
          if (x < 0) {
            x += moduloVal;
          } else if (x === -0) {
            return 0;
          }
        }
        return x;
      };
    }
    conversions["void"] = function() {
      return void 0;
    };
    conversions["boolean"] = function(val) {
      return !!val;
    };
    conversions["byte"] = createNumberConversion(8, { unsigned: false });
    conversions["octet"] = createNumberConversion(8, { unsigned: true });
    conversions["short"] = createNumberConversion(16, { unsigned: false });
    conversions["unsigned short"] = createNumberConversion(16, { unsigned: true });
    conversions["long"] = createNumberConversion(32, { unsigned: false });
    conversions["unsigned long"] = createNumberConversion(32, { unsigned: true });
    conversions["long long"] = createNumberConversion(32, { unsigned: false, moduloBitLength: 64 });
    conversions["unsigned long long"] = createNumberConversion(32, { unsigned: true, moduloBitLength: 64 });
    conversions["double"] = function(V) {
      const x = +V;
      if (!Number.isFinite(x)) {
        throw new TypeError("Argument is not a finite floating-point value");
      }
      return x;
    };
    conversions["unrestricted double"] = function(V) {
      const x = +V;
      if (isNaN(x)) {
        throw new TypeError("Argument is NaN");
      }
      return x;
    };
    conversions["float"] = conversions["double"];
    conversions["unrestricted float"] = conversions["unrestricted double"];
    conversions["DOMString"] = function(V, opts) {
      if (!opts)
        opts = {};
      if (opts.treatNullAsEmptyString && V === null) {
        return "";
      }
      return String(V);
    };
    conversions["ByteString"] = function(V, opts) {
      const x = String(V);
      let c = void 0;
      for (let i = 0; (c = x.codePointAt(i)) !== void 0; ++i) {
        if (c > 255) {
          throw new TypeError("Argument is not a valid bytestring");
        }
      }
      return x;
    };
    conversions["USVString"] = function(V) {
      const S = String(V);
      const n = S.length;
      const U = [];
      for (let i = 0; i < n; ++i) {
        const c = S.charCodeAt(i);
        if (c < 55296 || c > 57343) {
          U.push(String.fromCodePoint(c));
        } else if (56320 <= c && c <= 57343) {
          U.push(String.fromCodePoint(65533));
        } else {
          if (i === n - 1) {
            U.push(String.fromCodePoint(65533));
          } else {
            const d = S.charCodeAt(i + 1);
            if (56320 <= d && d <= 57343) {
              const a = c & 1023;
              const b = d & 1023;
              U.push(String.fromCodePoint((2 << 15) + (2 << 9) * a + b));
              ++i;
            } else {
              U.push(String.fromCodePoint(65533));
            }
          }
        }
      }
      return U.join("");
    };
    conversions["Date"] = function(V, opts) {
      if (!(V instanceof Date)) {
        throw new TypeError("Argument is not a Date object");
      }
      if (isNaN(V)) {
        return void 0;
      }
      return V;
    };
    conversions["RegExp"] = function(V, opts) {
      if (!(V instanceof RegExp)) {
        V = new RegExp(V);
      }
      return V;
    };
  }
});

// ../../../node_modules/whatwg-url/lib/utils.js
var require_utils = __commonJS({
  "../../../node_modules/whatwg-url/lib/utils.js"(exports, module2) {
    "use strict";
    module2.exports.mixin = function mixin(target, source) {
      const keys = Object.getOwnPropertyNames(source);
      for (let i = 0; i < keys.length; ++i) {
        Object.defineProperty(target, keys[i], Object.getOwnPropertyDescriptor(source, keys[i]));
      }
    };
    module2.exports.wrapperSymbol = Symbol("wrapper");
    module2.exports.implSymbol = Symbol("impl");
    module2.exports.wrapperForImpl = function(impl) {
      return impl[module2.exports.wrapperSymbol];
    };
    module2.exports.implForWrapper = function(wrapper) {
      return wrapper[module2.exports.implSymbol];
    };
  }
});

// ../../../node_modules/tr46/lib/mappingTable.json
var require_mappingTable = __commonJS({
  "../../../node_modules/tr46/lib/mappingTable.json"(exports, module2) {
    module2.exports = [[[0, 44], "disallowed_STD3_valid"], [[45, 46], "valid"], [[47, 47], "disallowed_STD3_valid"], [[48, 57], "valid"], [[58, 64], "disallowed_STD3_valid"], [[65, 65], "mapped", [97]], [[66, 66], "mapped", [98]], [[67, 67], "mapped", [99]], [[68, 68], "mapped", [100]], [[69, 69], "mapped", [101]], [[70, 70], "mapped", [102]], [[71, 71], "mapped", [103]], [[72, 72], "mapped", [104]], [[73, 73], "mapped", [105]], [[74, 74], "mapped", [106]], [[75, 75], "mapped", [107]], [[76, 76], "mapped", [108]], [[77, 77], "mapped", [109]], [[78, 78], "mapped", [110]], [[79, 79], "mapped", [111]], [[80, 80], "mapped", [112]], [[81, 81], "mapped", [113]], [[82, 82], "mapped", [114]], [[83, 83], "mapped", [115]], [[84, 84], "mapped", [116]], [[85, 85], "mapped", [117]], [[86, 86], "mapped", [118]], [[87, 87], "mapped", [119]], [[88, 88], "mapped", [120]], [[89, 89], "mapped", [121]], [[90, 90], "mapped", [122]], [[91, 96], "disallowed_STD3_valid"], [[97, 122], "valid"], [[123, 127], "disallowed_STD3_valid"], [[128, 159], "disallowed"], [[160, 160], "disallowed_STD3_mapped", [32]], [[161, 167], "valid", [], "NV8"], [[168, 168], "disallowed_STD3_mapped", [32, 776]], [[169, 169], "valid", [], "NV8"], [[170, 170], "mapped", [97]], [[171, 172], "valid", [], "NV8"], [[173, 173], "ignored"], [[174, 174], "valid", [], "NV8"], [[175, 175], "disallowed_STD3_mapped", [32, 772]], [[176, 177], "valid", [], "NV8"], [[178, 178], "mapped", [50]], [[179, 179], "mapped", [51]], [[180, 180], "disallowed_STD3_mapped", [32, 769]], [[181, 181], "mapped", [956]], [[182, 182], "valid", [], "NV8"], [[183, 183], "valid"], [[184, 184], "disallowed_STD3_mapped", [32, 807]], [[185, 185], "mapped", [49]], [[186, 186], "mapped", [111]], [[187, 187], "valid", [], "NV8"], [[188, 188], "mapped", [49, 8260, 52]], [[189, 189], "mapped", [49, 8260, 50]], [[190, 190], "mapped", [51, 8260, 52]], [[191, 191], "valid", [], "NV8"], [[192, 192], "mapped", [224]], [[193, 193], "mapped", [225]], [[194, 194], "mapped", [226]], [[195, 195], "mapped", [227]], [[196, 196], "mapped", [228]], [[197, 197], "mapped", [229]], [[198, 198], "mapped", [230]], [[199, 199], "mapped", [231]], [[200, 200], "mapped", [232]], [[201, 201], "mapped", [233]], [[202, 202], "mapped", [234]], [[203, 203], "mapped", [235]], [[204, 204], "mapped", [236]], [[205, 205], "mapped", [237]], [[206, 206], "mapped", [238]], [[207, 207], "mapped", [239]], [[208, 208], "mapped", [240]], [[209, 209], "mapped", [241]], [[210, 210], "mapped", [242]], [[211, 211], "mapped", [243]], [[212, 212], "mapped", [244]], [[213, 213], "mapped", [245]], [[214, 214], "mapped", [246]], [[215, 215], "valid", [], "NV8"], [[216, 216], "mapped", [248]], [[217, 217], "mapped", [249]], [[218, 218], "mapped", [250]], [[219, 219], "mapped", [251]], [[220, 220], "mapped", [252]], [[221, 221], "mapped", [253]], [[222, 222], "mapped", [254]], [[223, 223], "deviation", [115, 115]], [[224, 246], "valid"], [[247, 247], "valid", [], "NV8"], [[248, 255], "valid"], [[256, 256], "mapped", [257]], [[257, 257], "valid"], [[258, 258], "mapped", [259]], [[259, 259], "valid"], [[260, 260], "mapped", [261]], [[261, 261], "valid"], [[262, 262], "mapped", [263]], [[263, 263], "valid"], [[264, 264], "mapped", [265]], [[265, 265], "valid"], [[266, 266], "mapped", [267]], [[267, 267], "valid"], [[268, 268], "mapped", [269]], [[269, 269], "valid"], [[270, 270], "mapped", [271]], [[271, 271], "valid"], [[272, 272], "mapped", [273]], [[273, 273], "valid"], [[274, 274], "mapped", [275]], [[275, 275], "valid"], [[276, 276], "mapped", [277]], [[277, 277], "valid"], [[278, 278], "mapped", [279]], [[279, 279], "valid"], [[280, 280], "mapped", [281]], [[281, 281], "valid"], [[282, 282], "mapped", [283]], [[283, 283], "valid"], [[284, 284], "mapped", [285]], [[285, 285], "valid"], [[286, 286], "mapped", [287]], [[287, 287], "valid"], [[288, 288], "mapped", [289]], [[289, 289], "valid"], [[290, 290], "mapped", [291]], [[291, 291], "valid"], [[292, 292], "mapped", [293]], [[293, 293], "valid"], [[294, 294], "mapped", [295]], [[295, 295], "valid"], [[296, 296], "mapped", [297]], [[297, 297], "valid"], [[298, 298], "mapped", [299]], [[299, 299], "valid"], [[300, 300], "mapped", [301]], [[301, 301], "valid"], [[302, 302], "mapped", [303]], [[303, 303], "valid"], [[304, 304], "mapped", [105, 775]], [[305, 305], "valid"], [[306, 307], "mapped", [105, 106]], [[308, 308], "mapped", [309]], [[309, 309], "valid"], [[310, 310], "mapped", [311]], [[311, 312], "valid"], [[313, 313], "mapped", [314]], [[314, 314], "valid"], [[315, 315], "mapped", [316]], [[316, 316], "valid"], [[317, 317], "mapped", [318]], [[318, 318], "valid"], [[319, 320], "mapped", [108, 183]], [[321, 321], "mapped", [322]], [[322, 322], "valid"], [[323, 323], "mapped", [324]], [[324, 324], "valid"], [[325, 325], "mapped", [326]], [[326, 326], "valid"], [[327, 327], "mapped", [328]], [[328, 328], "valid"], [[329, 329], "mapped", [700, 110]], [[330, 330], "mapped", [331]], [[331, 331], "valid"], [[332, 332], "mapped", [333]], [[333, 333], "valid"], [[334, 334], "mapped", [335]], [[335, 335], "valid"], [[336, 336], "mapped", [337]], [[337, 337], "valid"], [[338, 338], "mapped", [339]], [[339, 339], "valid"], [[340, 340], "mapped", [341]], [[341, 341], "valid"], [[342, 342], "mapped", [343]], [[343, 343], "valid"], [[344, 344], "mapped", [345]], [[345, 345], "valid"], [[346, 346], "mapped", [347]], [[347, 347], "valid"], [[348, 348], "mapped", [349]], [[349, 349], "valid"], [[350, 350], "mapped", [351]], [[351, 351], "valid"], [[352, 352], "mapped", [353]], [[353, 353], "valid"], [[354, 354], "mapped", [355]], [[355, 355], "valid"], [[356, 356], "mapped", [357]], [[357, 357], "valid"], [[358, 358], "mapped", [359]], [[359, 359], "valid"], [[360, 360], "mapped", [361]], [[361, 361], "valid"], [[362, 362], "mapped", [363]], [[363, 363], "valid"], [[364, 364], "mapped", [365]], [[365, 365], "valid"], [[366, 366], "mapped", [367]], [[367, 367], "valid"], [[368, 368], "mapped", [369]], [[369, 369], "valid"], [[370, 370], "mapped", [371]], [[371, 371], "valid"], [[372, 372], "mapped", [373]], [[373, 373], "valid"], [[374, 374], "mapped", [375]], [[375, 375], "valid"], [[376, 376], "mapped", [255]], [[377, 377], "mapped", [378]], [[378, 378], "valid"], [[379, 379], "mapped", [380]], [[380, 380], "valid"], [[381, 381], "mapped", [382]], [[382, 382], "valid"], [[383, 383], "mapped", [115]], [[384, 384], "valid"], [[385, 385], "mapped", [595]], [[386, 386], "mapped", [387]], [[387, 387], "valid"], [[388, 388], "mapped", [389]], [[389, 389], "valid"], [[390, 390], "mapped", [596]], [[391, 391], "mapped", [392]], [[392, 392], "valid"], [[393, 393], "mapped", [598]], [[394, 394], "mapped", [599]], [[395, 395], "mapped", [396]], [[396, 397], "valid"], [[398, 398], "mapped", [477]], [[399, 399], "mapped", [601]], [[400, 400], "mapped", [603]], [[401, 401], "mapped", [402]], [[402, 402], "valid"], [[403, 403], "mapped", [608]], [[404, 404], "mapped", [611]], [[405, 405], "valid"], [[406, 406], "mapped", [617]], [[407, 407], "mapped", [616]], [[408, 408], "mapped", [409]], [[409, 411], "valid"], [[412, 412], "mapped", [623]], [[413, 413], "mapped", [626]], [[414, 414], "valid"], [[415, 415], "mapped", [629]], [[416, 416], "mapped", [417]], [[417, 417], "valid"], [[418, 418], "mapped", [419]], [[419, 419], "valid"], [[420, 420], "mapped", [421]], [[421, 421], "valid"], [[422, 422], "mapped", [640]], [[423, 423], "mapped", [424]], [[424, 424], "valid"], [[425, 425], "mapped", [643]], [[426, 427], "valid"], [[428, 428], "mapped", [429]], [[429, 429], "valid"], [[430, 430], "mapped", [648]], [[431, 431], "mapped", [432]], [[432, 432], "valid"], [[433, 433], "mapped", [650]], [[434, 434], "mapped", [651]], [[435, 435], "mapped", [436]], [[436, 436], "valid"], [[437, 437], "mapped", [438]], [[438, 438], "valid"], [[439, 439], "mapped", [658]], [[440, 440], "mapped", [441]], [[441, 443], "valid"], [[444, 444], "mapped", [445]], [[445, 451], "valid"], [[452, 454], "mapped", [100, 382]], [[455, 457], "mapped", [108, 106]], [[458, 460], "mapped", [110, 106]], [[461, 461], "mapped", [462]], [[462, 462], "valid"], [[463, 463], "mapped", [464]], [[464, 464], "valid"], [[465, 465], "mapped", [466]], [[466, 466], "valid"], [[467, 467], "mapped", [468]], [[468, 468], "valid"], [[469, 469], "mapped", [470]], [[470, 470], "valid"], [[471, 471], "mapped", [472]], [[472, 472], "valid"], [[473, 473], "mapped", [474]], [[474, 474], "valid"], [[475, 475], "mapped", [476]], [[476, 477], "valid"], [[478, 478], "mapped", [479]], [[479, 479], "valid"], [[480, 480], "mapped", [481]], [[481, 481], "valid"], [[482, 482], "mapped", [483]], [[483, 483], "valid"], [[484, 484], "mapped", [485]], [[485, 485], "valid"], [[486, 486], "mapped", [487]], [[487, 487], "valid"], [[488, 488], "mapped", [489]], [[489, 489], "valid"], [[490, 490], "mapped", [491]], [[491, 491], "valid"], [[492, 492], "mapped", [493]], [[493, 493], "valid"], [[494, 494], "mapped", [495]], [[495, 496], "valid"], [[497, 499], "mapped", [100, 122]], [[500, 500], "mapped", [501]], [[501, 501], "valid"], [[502, 502], "mapped", [405]], [[503, 503], "mapped", [447]], [[504, 504], "mapped", [505]], [[505, 505], "valid"], [[506, 506], "mapped", [507]], [[507, 507], "valid"], [[508, 508], "mapped", [509]], [[509, 509], "valid"], [[510, 510], "mapped", [511]], [[511, 511], "valid"], [[512, 512], "mapped", [513]], [[513, 513], "valid"], [[514, 514], "mapped", [515]], [[515, 515], "valid"], [[516, 516], "mapped", [517]], [[517, 517], "valid"], [[518, 518], "mapped", [519]], [[519, 519], "valid"], [[520, 520], "mapped", [521]], [[521, 521], "valid"], [[522, 522], "mapped", [523]], [[523, 523], "valid"], [[524, 524], "mapped", [525]], [[525, 525], "valid"], [[526, 526], "mapped", [527]], [[527, 527], "valid"], [[528, 528], "mapped", [529]], [[529, 529], "valid"], [[530, 530], "mapped", [531]], [[531, 531], "valid"], [[532, 532], "mapped", [533]], [[533, 533], "valid"], [[534, 534], "mapped", [535]], [[535, 535], "valid"], [[536, 536], "mapped", [537]], [[537, 537], "valid"], [[538, 538], "mapped", [539]], [[539, 539], "valid"], [[540, 540], "mapped", [541]], [[541, 541], "valid"], [[542, 542], "mapped", [543]], [[543, 543], "valid"], [[544, 544], "mapped", [414]], [[545, 545], "valid"], [[546, 546], "mapped", [547]], [[547, 547], "valid"], [[548, 548], "mapped", [549]], [[549, 549], "valid"], [[550, 550], "mapped", [551]], [[551, 551], "valid"], [[552, 552], "mapped", [553]], [[553, 553], "valid"], [[554, 554], "mapped", [555]], [[555, 555], "valid"], [[556, 556], "mapped", [557]], [[557, 557], "valid"], [[558, 558], "mapped", [559]], [[559, 559], "valid"], [[560, 560], "mapped", [561]], [[561, 561], "valid"], [[562, 562], "mapped", [563]], [[563, 563], "valid"], [[564, 566], "valid"], [[567, 569], "valid"], [[570, 570], "mapped", [11365]], [[571, 571], "mapped", [572]], [[572, 572], "valid"], [[573, 573], "mapped", [410]], [[574, 574], "mapped", [11366]], [[575, 576], "valid"], [[577, 577], "mapped", [578]], [[578, 578], "valid"], [[579, 579], "mapped", [384]], [[580, 580], "mapped", [649]], [[581, 581], "mapped", [652]], [[582, 582], "mapped", [583]], [[583, 583], "valid"], [[584, 584], "mapped", [585]], [[585, 585], "valid"], [[586, 586], "mapped", [587]], [[587, 587], "valid"], [[588, 588], "mapped", [589]], [[589, 589], "valid"], [[590, 590], "mapped", [591]], [[591, 591], "valid"], [[592, 680], "valid"], [[681, 685], "valid"], [[686, 687], "valid"], [[688, 688], "mapped", [104]], [[689, 689], "mapped", [614]], [[690, 690], "mapped", [106]], [[691, 691], "mapped", [114]], [[692, 692], "mapped", [633]], [[693, 693], "mapped", [635]], [[694, 694], "mapped", [641]], [[695, 695], "mapped", [119]], [[696, 696], "mapped", [121]], [[697, 705], "valid"], [[706, 709], "valid", [], "NV8"], [[710, 721], "valid"], [[722, 727], "valid", [], "NV8"], [[728, 728], "disallowed_STD3_mapped", [32, 774]], [[729, 729], "disallowed_STD3_mapped", [32, 775]], [[730, 730], "disallowed_STD3_mapped", [32, 778]], [[731, 731], "disallowed_STD3_mapped", [32, 808]], [[732, 732], "disallowed_STD3_mapped", [32, 771]], [[733, 733], "disallowed_STD3_mapped", [32, 779]], [[734, 734], "valid", [], "NV8"], [[735, 735], "valid", [], "NV8"], [[736, 736], "mapped", [611]], [[737, 737], "mapped", [108]], [[738, 738], "mapped", [115]], [[739, 739], "mapped", [120]], [[740, 740], "mapped", [661]], [[741, 745], "valid", [], "NV8"], [[746, 747], "valid", [], "NV8"], [[748, 748], "valid"], [[749, 749], "valid", [], "NV8"], [[750, 750], "valid"], [[751, 767], "valid", [], "NV8"], [[768, 831], "valid"], [[832, 832], "mapped", [768]], [[833, 833], "mapped", [769]], [[834, 834], "valid"], [[835, 835], "mapped", [787]], [[836, 836], "mapped", [776, 769]], [[837, 837], "mapped", [953]], [[838, 846], "valid"], [[847, 847], "ignored"], [[848, 855], "valid"], [[856, 860], "valid"], [[861, 863], "valid"], [[864, 865], "valid"], [[866, 866], "valid"], [[867, 879], "valid"], [[880, 880], "mapped", [881]], [[881, 881], "valid"], [[882, 882], "mapped", [883]], [[883, 883], "valid"], [[884, 884], "mapped", [697]], [[885, 885], "valid"], [[886, 886], "mapped", [887]], [[887, 887], "valid"], [[888, 889], "disallowed"], [[890, 890], "disallowed_STD3_mapped", [32, 953]], [[891, 893], "valid"], [[894, 894], "disallowed_STD3_mapped", [59]], [[895, 895], "mapped", [1011]], [[896, 899], "disallowed"], [[900, 900], "disallowed_STD3_mapped", [32, 769]], [[901, 901], "disallowed_STD3_mapped", [32, 776, 769]], [[902, 902], "mapped", [940]], [[903, 903], "mapped", [183]], [[904, 904], "mapped", [941]], [[905, 905], "mapped", [942]], [[906, 906], "mapped", [943]], [[907, 907], "disallowed"], [[908, 908], "mapped", [972]], [[909, 909], "disallowed"], [[910, 910], "mapped", [973]], [[911, 911], "mapped", [974]], [[912, 912], "valid"], [[913, 913], "mapped", [945]], [[914, 914], "mapped", [946]], [[915, 915], "mapped", [947]], [[916, 916], "mapped", [948]], [[917, 917], "mapped", [949]], [[918, 918], "mapped", [950]], [[919, 919], "mapped", [951]], [[920, 920], "mapped", [952]], [[921, 921], "mapped", [953]], [[922, 922], "mapped", [954]], [[923, 923], "mapped", [955]], [[924, 924], "mapped", [956]], [[925, 925], "mapped", [957]], [[926, 926], "mapped", [958]], [[927, 927], "mapped", [959]], [[928, 928], "mapped", [960]], [[929, 929], "mapped", [961]], [[930, 930], "disallowed"], [[931, 931], "mapped", [963]], [[932, 932], "mapped", [964]], [[933, 933], "mapped", [965]], [[934, 934], "mapped", [966]], [[935, 935], "mapped", [967]], [[936, 936], "mapped", [968]], [[937, 937], "mapped", [969]], [[938, 938], "mapped", [970]], [[939, 939], "mapped", [971]], [[940, 961], "valid"], [[962, 962], "deviation", [963]], [[963, 974], "valid"], [[975, 975], "mapped", [983]], [[976, 976], "mapped", [946]], [[977, 977], "mapped", [952]], [[978, 978], "mapped", [965]], [[979, 979], "mapped", [973]], [[980, 980], "mapped", [971]], [[981, 981], "mapped", [966]], [[982, 982], "mapped", [960]], [[983, 983], "valid"], [[984, 984], "mapped", [985]], [[985, 985], "valid"], [[986, 986], "mapped", [987]], [[987, 987], "valid"], [[988, 988], "mapped", [989]], [[989, 989], "valid"], [[990, 990], "mapped", [991]], [[991, 991], "valid"], [[992, 992], "mapped", [993]], [[993, 993], "valid"], [[994, 994], "mapped", [995]], [[995, 995], "valid"], [[996, 996], "mapped", [997]], [[997, 997], "valid"], [[998, 998], "mapped", [999]], [[999, 999], "valid"], [[1e3, 1e3], "mapped", [1001]], [[1001, 1001], "valid"], [[1002, 1002], "mapped", [1003]], [[1003, 1003], "valid"], [[1004, 1004], "mapped", [1005]], [[1005, 1005], "valid"], [[1006, 1006], "mapped", [1007]], [[1007, 1007], "valid"], [[1008, 1008], "mapped", [954]], [[1009, 1009], "mapped", [961]], [[1010, 1010], "mapped", [963]], [[1011, 1011], "valid"], [[1012, 1012], "mapped", [952]], [[1013, 1013], "mapped", [949]], [[1014, 1014], "valid", [], "NV8"], [[1015, 1015], "mapped", [1016]], [[1016, 1016], "valid"], [[1017, 1017], "mapped", [963]], [[1018, 1018], "mapped", [1019]], [[1019, 1019], "valid"], [[1020, 1020], "valid"], [[1021, 1021], "mapped", [891]], [[1022, 1022], "mapped", [892]], [[1023, 1023], "mapped", [893]], [[1024, 1024], "mapped", [1104]], [[1025, 1025], "mapped", [1105]], [[1026, 1026], "mapped", [1106]], [[1027, 1027], "mapped", [1107]], [[1028, 1028], "mapped", [1108]], [[1029, 1029], "mapped", [1109]], [[1030, 1030], "mapped", [1110]], [[1031, 1031], "mapped", [1111]], [[1032, 1032], "mapped", [1112]], [[1033, 1033], "mapped", [1113]], [[1034, 1034], "mapped", [1114]], [[1035, 1035], "mapped", [1115]], [[1036, 1036], "mapped", [1116]], [[1037, 1037], "mapped", [1117]], [[1038, 1038], "mapped", [1118]], [[1039, 1039], "mapped", [1119]], [[1040, 1040], "mapped", [1072]], [[1041, 1041], "mapped", [1073]], [[1042, 1042], "mapped", [1074]], [[1043, 1043], "mapped", [1075]], [[1044, 1044], "mapped", [1076]], [[1045, 1045], "mapped", [1077]], [[1046, 1046], "mapped", [1078]], [[1047, 1047], "mapped", [1079]], [[1048, 1048], "mapped", [1080]], [[1049, 1049], "mapped", [1081]], [[1050, 1050], "mapped", [1082]], [[1051, 1051], "mapped", [1083]], [[1052, 1052], "mapped", [1084]], [[1053, 1053], "mapped", [1085]], [[1054, 1054], "mapped", [1086]], [[1055, 1055], "mapped", [1087]], [[1056, 1056], "mapped", [1088]], [[1057, 1057], "mapped", [1089]], [[1058, 1058], "mapped", [1090]], [[1059, 1059], "mapped", [1091]], [[1060, 1060], "mapped", [1092]], [[1061, 1061], "mapped", [1093]], [[1062, 1062], "mapped", [1094]], [[1063, 1063], "mapped", [1095]], [[1064, 1064], "mapped", [1096]], [[1065, 1065], "mapped", [1097]], [[1066, 1066], "mapped", [1098]], [[1067, 1067], "mapped", [1099]], [[1068, 1068], "mapped", [1100]], [[1069, 1069], "mapped", [1101]], [[1070, 1070], "mapped", [1102]], [[1071, 1071], "mapped", [1103]], [[1072, 1103], "valid"], [[1104, 1104], "valid"], [[1105, 1116], "valid"], [[1117, 1117], "valid"], [[1118, 1119], "valid"], [[1120, 1120], "mapped", [1121]], [[1121, 1121], "valid"], [[1122, 1122], "mapped", [1123]], [[1123, 1123], "valid"], [[1124, 1124], "mapped", [1125]], [[1125, 1125], "valid"], [[1126, 1126], "mapped", [1127]], [[1127, 1127], "valid"], [[1128, 1128], "mapped", [1129]], [[1129, 1129], "valid"], [[1130, 1130], "mapped", [1131]], [[1131, 1131], "valid"], [[1132, 1132], "mapped", [1133]], [[1133, 1133], "valid"], [[1134, 1134], "mapped", [1135]], [[1135, 1135], "valid"], [[1136, 1136], "mapped", [1137]], [[1137, 1137], "valid"], [[1138, 1138], "mapped", [1139]], [[1139, 1139], "valid"], [[1140, 1140], "mapped", [1141]], [[1141, 1141], "valid"], [[1142, 1142], "mapped", [1143]], [[1143, 1143], "valid"], [[1144, 1144], "mapped", [1145]], [[1145, 1145], "valid"], [[1146, 1146], "mapped", [1147]], [[1147, 1147], "valid"], [[1148, 1148], "mapped", [1149]], [[1149, 1149], "valid"], [[1150, 1150], "mapped", [1151]], [[1151, 1151], "valid"], [[1152, 1152], "mapped", [1153]], [[1153, 1153], "valid"], [[1154, 1154], "valid", [], "NV8"], [[1155, 1158], "valid"], [[1159, 1159], "valid"], [[1160, 1161], "valid", [], "NV8"], [[1162, 1162], "mapped", [1163]], [[1163, 1163], "valid"], [[1164, 1164], "mapped", [1165]], [[1165, 1165], "valid"], [[1166, 1166], "mapped", [1167]], [[1167, 1167], "valid"], [[1168, 1168], "mapped", [1169]], [[1169, 1169], "valid"], [[1170, 1170], "mapped", [1171]], [[1171, 1171], "valid"], [[1172, 1172], "mapped", [1173]], [[1173, 1173], "valid"], [[1174, 1174], "mapped", [1175]], [[1175, 1175], "valid"], [[1176, 1176], "mapped", [1177]], [[1177, 1177], "valid"], [[1178, 1178], "mapped", [1179]], [[1179, 1179], "valid"], [[1180, 1180], "mapped", [1181]], [[1181, 1181], "valid"], [[1182, 1182], "mapped", [1183]], [[1183, 1183], "valid"], [[1184, 1184], "mapped", [1185]], [[1185, 1185], "valid"], [[1186, 1186], "mapped", [1187]], [[1187, 1187], "valid"], [[1188, 1188], "mapped", [1189]], [[1189, 1189], "valid"], [[1190, 1190], "mapped", [1191]], [[1191, 1191], "valid"], [[1192, 1192], "mapped", [1193]], [[1193, 1193], "valid"], [[1194, 1194], "mapped", [1195]], [[1195, 1195], "valid"], [[1196, 1196], "mapped", [1197]], [[1197, 1197], "valid"], [[1198, 1198], "mapped", [1199]], [[1199, 1199], "valid"], [[1200, 1200], "mapped", [1201]], [[1201, 1201], "valid"], [[1202, 1202], "mapped", [1203]], [[1203, 1203], "valid"], [[1204, 1204], "mapped", [1205]], [[1205, 1205], "valid"], [[1206, 1206], "mapped", [1207]], [[1207, 1207], "valid"], [[1208, 1208], "mapped", [1209]], [[1209, 1209], "valid"], [[1210, 1210], "mapped", [1211]], [[1211, 1211], "valid"], [[1212, 1212], "mapped", [1213]], [[1213, 1213], "valid"], [[1214, 1214], "mapped", [1215]], [[1215, 1215], "valid"], [[1216, 1216], "disallowed"], [[1217, 1217], "mapped", [1218]], [[1218, 1218], "valid"], [[1219, 1219], "mapped", [1220]], [[1220, 1220], "valid"], [[1221, 1221], "mapped", [1222]], [[1222, 1222], "valid"], [[1223, 1223], "mapped", [1224]], [[1224, 1224], "valid"], [[1225, 1225], "mapped", [1226]], [[1226, 1226], "valid"], [[1227, 1227], "mapped", [1228]], [[1228, 1228], "valid"], [[1229, 1229], "mapped", [1230]], [[1230, 1230], "valid"], [[1231, 1231], "valid"], [[1232, 1232], "mapped", [1233]], [[1233, 1233], "valid"], [[1234, 1234], "mapped", [1235]], [[1235, 1235], "valid"], [[1236, 1236], "mapped", [1237]], [[1237, 1237], "valid"], [[1238, 1238], "mapped", [1239]], [[1239, 1239], "valid"], [[1240, 1240], "mapped", [1241]], [[1241, 1241], "valid"], [[1242, 1242], "mapped", [1243]], [[1243, 1243], "valid"], [[1244, 1244], "mapped", [1245]], [[1245, 1245], "valid"], [[1246, 1246], "mapped", [1247]], [[1247, 1247], "valid"], [[1248, 1248], "mapped", [1249]], [[1249, 1249], "valid"], [[1250, 1250], "mapped", [1251]], [[1251, 1251], "valid"], [[1252, 1252], "mapped", [1253]], [[1253, 1253], "valid"], [[1254, 1254], "mapped", [1255]], [[1255, 1255], "valid"], [[1256, 1256], "mapped", [1257]], [[1257, 1257], "valid"], [[1258, 1258], "mapped", [1259]], [[1259, 1259], "valid"], [[1260, 1260], "mapped", [1261]], [[1261, 1261], "valid"], [[1262, 1262], "mapped", [1263]], [[1263, 1263], "valid"], [[1264, 1264], "mapped", [1265]], [[1265, 1265], "valid"], [[1266, 1266], "mapped", [1267]], [[1267, 1267], "valid"], [[1268, 1268], "mapped", [1269]], [[1269, 1269], "valid"], [[1270, 1270], "mapped", [1271]], [[1271, 1271], "valid"], [[1272, 1272], "mapped", [1273]], [[1273, 1273], "valid"], [[1274, 1274], "mapped", [1275]], [[1275, 1275], "valid"], [[1276, 1276], "mapped", [1277]], [[1277, 1277], "valid"], [[1278, 1278], "mapped", [1279]], [[1279, 1279], "valid"], [[1280, 1280], "mapped", [1281]], [[1281, 1281], "valid"], [[1282, 1282], "mapped", [1283]], [[1283, 1283], "valid"], [[1284, 1284], "mapped", [1285]], [[1285, 1285], "valid"], [[1286, 1286], "mapped", [1287]], [[1287, 1287], "valid"], [[1288, 1288], "mapped", [1289]], [[1289, 1289], "valid"], [[1290, 1290], "mapped", [1291]], [[1291, 1291], "valid"], [[1292, 1292], "mapped", [1293]], [[1293, 1293], "valid"], [[1294, 1294], "mapped", [1295]], [[1295, 1295], "valid"], [[1296, 1296], "mapped", [1297]], [[1297, 1297], "valid"], [[1298, 1298], "mapped", [1299]], [[1299, 1299], "valid"], [[1300, 1300], "mapped", [1301]], [[1301, 1301], "valid"], [[1302, 1302], "mapped", [1303]], [[1303, 1303], "valid"], [[1304, 1304], "mapped", [1305]], [[1305, 1305], "valid"], [[1306, 1306], "mapped", [1307]], [[1307, 1307], "valid"], [[1308, 1308], "mapped", [1309]], [[1309, 1309], "valid"], [[1310, 1310], "mapped", [1311]], [[1311, 1311], "valid"], [[1312, 1312], "mapped", [1313]], [[1313, 1313], "valid"], [[1314, 1314], "mapped", [1315]], [[1315, 1315], "valid"], [[1316, 1316], "mapped", [1317]], [[1317, 1317], "valid"], [[1318, 1318], "mapped", [1319]], [[1319, 1319], "valid"], [[1320, 1320], "mapped", [1321]], [[1321, 1321], "valid"], [[1322, 1322], "mapped", [1323]], [[1323, 1323], "valid"], [[1324, 1324], "mapped", [1325]], [[1325, 1325], "valid"], [[1326, 1326], "mapped", [1327]], [[1327, 1327], "valid"], [[1328, 1328], "disallowed"], [[1329, 1329], "mapped", [1377]], [[1330, 1330], "mapped", [1378]], [[1331, 1331], "mapped", [1379]], [[1332, 1332], "mapped", [1380]], [[1333, 1333], "mapped", [1381]], [[1334, 1334], "mapped", [1382]], [[1335, 1335], "mapped", [1383]], [[1336, 1336], "mapped", [1384]], [[1337, 1337], "mapped", [1385]], [[1338, 1338], "mapped", [1386]], [[1339, 1339], "mapped", [1387]], [[1340, 1340], "mapped", [1388]], [[1341, 1341], "mapped", [1389]], [[1342, 1342], "mapped", [1390]], [[1343, 1343], "mapped", [1391]], [[1344, 1344], "mapped", [1392]], [[1345, 1345], "mapped", [1393]], [[1346, 1346], "mapped", [1394]], [[1347, 1347], "mapped", [1395]], [[1348, 1348], "mapped", [1396]], [[1349, 1349], "mapped", [1397]], [[1350, 1350], "mapped", [1398]], [[1351, 1351], "mapped", [1399]], [[1352, 1352], "mapped", [1400]], [[1353, 1353], "mapped", [1401]], [[1354, 1354], "mapped", [1402]], [[1355, 1355], "mapped", [1403]], [[1356, 1356], "mapped", [1404]], [[1357, 1357], "mapped", [1405]], [[1358, 1358], "mapped", [1406]], [[1359, 1359], "mapped", [1407]], [[1360, 1360], "mapped", [1408]], [[1361, 1361], "mapped", [1409]], [[1362, 1362], "mapped", [1410]], [[1363, 1363], "mapped", [1411]], [[1364, 1364], "mapped", [1412]], [[1365, 1365], "mapped", [1413]], [[1366, 1366], "mapped", [1414]], [[1367, 1368], "disallowed"], [[1369, 1369], "valid"], [[1370, 1375], "valid", [], "NV8"], [[1376, 1376], "disallowed"], [[1377, 1414], "valid"], [[1415, 1415], "mapped", [1381, 1410]], [[1416, 1416], "disallowed"], [[1417, 1417], "valid", [], "NV8"], [[1418, 1418], "valid", [], "NV8"], [[1419, 1420], "disallowed"], [[1421, 1422], "valid", [], "NV8"], [[1423, 1423], "valid", [], "NV8"], [[1424, 1424], "disallowed"], [[1425, 1441], "valid"], [[1442, 1442], "valid"], [[1443, 1455], "valid"], [[1456, 1465], "valid"], [[1466, 1466], "valid"], [[1467, 1469], "valid"], [[1470, 1470], "valid", [], "NV8"], [[1471, 1471], "valid"], [[1472, 1472], "valid", [], "NV8"], [[1473, 1474], "valid"], [[1475, 1475], "valid", [], "NV8"], [[1476, 1476], "valid"], [[1477, 1477], "valid"], [[1478, 1478], "valid", [], "NV8"], [[1479, 1479], "valid"], [[1480, 1487], "disallowed"], [[1488, 1514], "valid"], [[1515, 1519], "disallowed"], [[1520, 1524], "valid"], [[1525, 1535], "disallowed"], [[1536, 1539], "disallowed"], [[1540, 1540], "disallowed"], [[1541, 1541], "disallowed"], [[1542, 1546], "valid", [], "NV8"], [[1547, 1547], "valid", [], "NV8"], [[1548, 1548], "valid", [], "NV8"], [[1549, 1551], "valid", [], "NV8"], [[1552, 1557], "valid"], [[1558, 1562], "valid"], [[1563, 1563], "valid", [], "NV8"], [[1564, 1564], "disallowed"], [[1565, 1565], "disallowed"], [[1566, 1566], "valid", [], "NV8"], [[1567, 1567], "valid", [], "NV8"], [[1568, 1568], "valid"], [[1569, 1594], "valid"], [[1595, 1599], "valid"], [[1600, 1600], "valid", [], "NV8"], [[1601, 1618], "valid"], [[1619, 1621], "valid"], [[1622, 1624], "valid"], [[1625, 1630], "valid"], [[1631, 1631], "valid"], [[1632, 1641], "valid"], [[1642, 1645], "valid", [], "NV8"], [[1646, 1647], "valid"], [[1648, 1652], "valid"], [[1653, 1653], "mapped", [1575, 1652]], [[1654, 1654], "mapped", [1608, 1652]], [[1655, 1655], "mapped", [1735, 1652]], [[1656, 1656], "mapped", [1610, 1652]], [[1657, 1719], "valid"], [[1720, 1721], "valid"], [[1722, 1726], "valid"], [[1727, 1727], "valid"], [[1728, 1742], "valid"], [[1743, 1743], "valid"], [[1744, 1747], "valid"], [[1748, 1748], "valid", [], "NV8"], [[1749, 1756], "valid"], [[1757, 1757], "disallowed"], [[1758, 1758], "valid", [], "NV8"], [[1759, 1768], "valid"], [[1769, 1769], "valid", [], "NV8"], [[1770, 1773], "valid"], [[1774, 1775], "valid"], [[1776, 1785], "valid"], [[1786, 1790], "valid"], [[1791, 1791], "valid"], [[1792, 1805], "valid", [], "NV8"], [[1806, 1806], "disallowed"], [[1807, 1807], "disallowed"], [[1808, 1836], "valid"], [[1837, 1839], "valid"], [[1840, 1866], "valid"], [[1867, 1868], "disallowed"], [[1869, 1871], "valid"], [[1872, 1901], "valid"], [[1902, 1919], "valid"], [[1920, 1968], "valid"], [[1969, 1969], "valid"], [[1970, 1983], "disallowed"], [[1984, 2037], "valid"], [[2038, 2042], "valid", [], "NV8"], [[2043, 2047], "disallowed"], [[2048, 2093], "valid"], [[2094, 2095], "disallowed"], [[2096, 2110], "valid", [], "NV8"], [[2111, 2111], "disallowed"], [[2112, 2139], "valid"], [[2140, 2141], "disallowed"], [[2142, 2142], "valid", [], "NV8"], [[2143, 2207], "disallowed"], [[2208, 2208], "valid"], [[2209, 2209], "valid"], [[2210, 2220], "valid"], [[2221, 2226], "valid"], [[2227, 2228], "valid"], [[2229, 2274], "disallowed"], [[2275, 2275], "valid"], [[2276, 2302], "valid"], [[2303, 2303], "valid"], [[2304, 2304], "valid"], [[2305, 2307], "valid"], [[2308, 2308], "valid"], [[2309, 2361], "valid"], [[2362, 2363], "valid"], [[2364, 2381], "valid"], [[2382, 2382], "valid"], [[2383, 2383], "valid"], [[2384, 2388], "valid"], [[2389, 2389], "valid"], [[2390, 2391], "valid"], [[2392, 2392], "mapped", [2325, 2364]], [[2393, 2393], "mapped", [2326, 2364]], [[2394, 2394], "mapped", [2327, 2364]], [[2395, 2395], "mapped", [2332, 2364]], [[2396, 2396], "mapped", [2337, 2364]], [[2397, 2397], "mapped", [2338, 2364]], [[2398, 2398], "mapped", [2347, 2364]], [[2399, 2399], "mapped", [2351, 2364]], [[2400, 2403], "valid"], [[2404, 2405], "valid", [], "NV8"], [[2406, 2415], "valid"], [[2416, 2416], "valid", [], "NV8"], [[2417, 2418], "valid"], [[2419, 2423], "valid"], [[2424, 2424], "valid"], [[2425, 2426], "valid"], [[2427, 2428], "valid"], [[2429, 2429], "valid"], [[2430, 2431], "valid"], [[2432, 2432], "valid"], [[2433, 2435], "valid"], [[2436, 2436], "disallowed"], [[2437, 2444], "valid"], [[2445, 2446], "disallowed"], [[2447, 2448], "valid"], [[2449, 2450], "disallowed"], [[2451, 2472], "valid"], [[2473, 2473], "disallowed"], [[2474, 2480], "valid"], [[2481, 2481], "disallowed"], [[2482, 2482], "valid"], [[2483, 2485], "disallowed"], [[2486, 2489], "valid"], [[2490, 2491], "disallowed"], [[2492, 2492], "valid"], [[2493, 2493], "valid"], [[2494, 2500], "valid"], [[2501, 2502], "disallowed"], [[2503, 2504], "valid"], [[2505, 2506], "disallowed"], [[2507, 2509], "valid"], [[2510, 2510], "valid"], [[2511, 2518], "disallowed"], [[2519, 2519], "valid"], [[2520, 2523], "disallowed"], [[2524, 2524], "mapped", [2465, 2492]], [[2525, 2525], "mapped", [2466, 2492]], [[2526, 2526], "disallowed"], [[2527, 2527], "mapped", [2479, 2492]], [[2528, 2531], "valid"], [[2532, 2533], "disallowed"], [[2534, 2545], "valid"], [[2546, 2554], "valid", [], "NV8"], [[2555, 2555], "valid", [], "NV8"], [[2556, 2560], "disallowed"], [[2561, 2561], "valid"], [[2562, 2562], "valid"], [[2563, 2563], "valid"], [[2564, 2564], "disallowed"], [[2565, 2570], "valid"], [[2571, 2574], "disallowed"], [[2575, 2576], "valid"], [[2577, 2578], "disallowed"], [[2579, 2600], "valid"], [[2601, 2601], "disallowed"], [[2602, 2608], "valid"], [[2609, 2609], "disallowed"], [[2610, 2610], "valid"], [[2611, 2611], "mapped", [2610, 2620]], [[2612, 2612], "disallowed"], [[2613, 2613], "valid"], [[2614, 2614], "mapped", [2616, 2620]], [[2615, 2615], "disallowed"], [[2616, 2617], "valid"], [[2618, 2619], "disallowed"], [[2620, 2620], "valid"], [[2621, 2621], "disallowed"], [[2622, 2626], "valid"], [[2627, 2630], "disallowed"], [[2631, 2632], "valid"], [[2633, 2634], "disallowed"], [[2635, 2637], "valid"], [[2638, 2640], "disallowed"], [[2641, 2641], "valid"], [[2642, 2648], "disallowed"], [[2649, 2649], "mapped", [2582, 2620]], [[2650, 2650], "mapped", [2583, 2620]], [[2651, 2651], "mapped", [2588, 2620]], [[2652, 2652], "valid"], [[2653, 2653], "disallowed"], [[2654, 2654], "mapped", [2603, 2620]], [[2655, 2661], "disallowed"], [[2662, 2676], "valid"], [[2677, 2677], "valid"], [[2678, 2688], "disallowed"], [[2689, 2691], "valid"], [[2692, 2692], "disallowed"], [[2693, 2699], "valid"], [[2700, 2700], "valid"], [[2701, 2701], "valid"], [[2702, 2702], "disallowed"], [[2703, 2705], "valid"], [[2706, 2706], "disallowed"], [[2707, 2728], "valid"], [[2729, 2729], "disallowed"], [[2730, 2736], "valid"], [[2737, 2737], "disallowed"], [[2738, 2739], "valid"], [[2740, 2740], "disallowed"], [[2741, 2745], "valid"], [[2746, 2747], "disallowed"], [[2748, 2757], "valid"], [[2758, 2758], "disallowed"], [[2759, 2761], "valid"], [[2762, 2762], "disallowed"], [[2763, 2765], "valid"], [[2766, 2767], "disallowed"], [[2768, 2768], "valid"], [[2769, 2783], "disallowed"], [[2784, 2784], "valid"], [[2785, 2787], "valid"], [[2788, 2789], "disallowed"], [[2790, 2799], "valid"], [[2800, 2800], "valid", [], "NV8"], [[2801, 2801], "valid", [], "NV8"], [[2802, 2808], "disallowed"], [[2809, 2809], "valid"], [[2810, 2816], "disallowed"], [[2817, 2819], "valid"], [[2820, 2820], "disallowed"], [[2821, 2828], "valid"], [[2829, 2830], "disallowed"], [[2831, 2832], "valid"], [[2833, 2834], "disallowed"], [[2835, 2856], "valid"], [[2857, 2857], "disallowed"], [[2858, 2864], "valid"], [[2865, 2865], "disallowed"], [[2866, 2867], "valid"], [[2868, 2868], "disallowed"], [[2869, 2869], "valid"], [[2870, 2873], "valid"], [[2874, 2875], "disallowed"], [[2876, 2883], "valid"], [[2884, 2884], "valid"], [[2885, 2886], "disallowed"], [[2887, 2888], "valid"], [[2889, 2890], "disallowed"], [[2891, 2893], "valid"], [[2894, 2901], "disallowed"], [[2902, 2903], "valid"], [[2904, 2907], "disallowed"], [[2908, 2908], "mapped", [2849, 2876]], [[2909, 2909], "mapped", [2850, 2876]], [[2910, 2910], "disallowed"], [[2911, 2913], "valid"], [[2914, 2915], "valid"], [[2916, 2917], "disallowed"], [[2918, 2927], "valid"], [[2928, 2928], "valid", [], "NV8"], [[2929, 2929], "valid"], [[2930, 2935], "valid", [], "NV8"], [[2936, 2945], "disallowed"], [[2946, 2947], "valid"], [[2948, 2948], "disallowed"], [[2949, 2954], "valid"], [[2955, 2957], "disallowed"], [[2958, 2960], "valid"], [[2961, 2961], "disallowed"], [[2962, 2965], "valid"], [[2966, 2968], "disallowed"], [[2969, 2970], "valid"], [[2971, 2971], "disallowed"], [[2972, 2972], "valid"], [[2973, 2973], "disallowed"], [[2974, 2975], "valid"], [[2976, 2978], "disallowed"], [[2979, 2980], "valid"], [[2981, 2983], "disallowed"], [[2984, 2986], "valid"], [[2987, 2989], "disallowed"], [[2990, 2997], "valid"], [[2998, 2998], "valid"], [[2999, 3001], "valid"], [[3002, 3005], "disallowed"], [[3006, 3010], "valid"], [[3011, 3013], "disallowed"], [[3014, 3016], "valid"], [[3017, 3017], "disallowed"], [[3018, 3021], "valid"], [[3022, 3023], "disallowed"], [[3024, 3024], "valid"], [[3025, 3030], "disallowed"], [[3031, 3031], "valid"], [[3032, 3045], "disallowed"], [[3046, 3046], "valid"], [[3047, 3055], "valid"], [[3056, 3058], "valid", [], "NV8"], [[3059, 3066], "valid", [], "NV8"], [[3067, 3071], "disallowed"], [[3072, 3072], "valid"], [[3073, 3075], "valid"], [[3076, 3076], "disallowed"], [[3077, 3084], "valid"], [[3085, 3085], "disallowed"], [[3086, 3088], "valid"], [[3089, 3089], "disallowed"], [[3090, 3112], "valid"], [[3113, 3113], "disallowed"], [[3114, 3123], "valid"], [[3124, 3124], "valid"], [[3125, 3129], "valid"], [[3130, 3132], "disallowed"], [[3133, 3133], "valid"], [[3134, 3140], "valid"], [[3141, 3141], "disallowed"], [[3142, 3144], "valid"], [[3145, 3145], "disallowed"], [[3146, 3149], "valid"], [[3150, 3156], "disallowed"], [[3157, 3158], "valid"], [[3159, 3159], "disallowed"], [[3160, 3161], "valid"], [[3162, 3162], "valid"], [[3163, 3167], "disallowed"], [[3168, 3169], "valid"], [[3170, 3171], "valid"], [[3172, 3173], "disallowed"], [[3174, 3183], "valid"], [[3184, 3191], "disallowed"], [[3192, 3199], "valid", [], "NV8"], [[3200, 3200], "disallowed"], [[3201, 3201], "valid"], [[3202, 3203], "valid"], [[3204, 3204], "disallowed"], [[3205, 3212], "valid"], [[3213, 3213], "disallowed"], [[3214, 3216], "valid"], [[3217, 3217], "disallowed"], [[3218, 3240], "valid"], [[3241, 3241], "disallowed"], [[3242, 3251], "valid"], [[3252, 3252], "disallowed"], [[3253, 3257], "valid"], [[3258, 3259], "disallowed"], [[3260, 3261], "valid"], [[3262, 3268], "valid"], [[3269, 3269], "disallowed"], [[3270, 3272], "valid"], [[3273, 3273], "disallowed"], [[3274, 3277], "valid"], [[3278, 3284], "disallowed"], [[3285, 3286], "valid"], [[3287, 3293], "disallowed"], [[3294, 3294], "valid"], [[3295, 3295], "disallowed"], [[3296, 3297], "valid"], [[3298, 3299], "valid"], [[3300, 3301], "disallowed"], [[3302, 3311], "valid"], [[3312, 3312], "disallowed"], [[3313, 3314], "valid"], [[3315, 3328], "disallowed"], [[3329, 3329], "valid"], [[3330, 3331], "valid"], [[3332, 3332], "disallowed"], [[3333, 3340], "valid"], [[3341, 3341], "disallowed"], [[3342, 3344], "valid"], [[3345, 3345], "disallowed"], [[3346, 3368], "valid"], [[3369, 3369], "valid"], [[3370, 3385], "valid"], [[3386, 3386], "valid"], [[3387, 3388], "disallowed"], [[3389, 3389], "valid"], [[3390, 3395], "valid"], [[3396, 3396], "valid"], [[3397, 3397], "disallowed"], [[3398, 3400], "valid"], [[3401, 3401], "disallowed"], [[3402, 3405], "valid"], [[3406, 3406], "valid"], [[3407, 3414], "disallowed"], [[3415, 3415], "valid"], [[3416, 3422], "disallowed"], [[3423, 3423], "valid"], [[3424, 3425], "valid"], [[3426, 3427], "valid"], [[3428, 3429], "disallowed"], [[3430, 3439], "valid"], [[3440, 3445], "valid", [], "NV8"], [[3446, 3448], "disallowed"], [[3449, 3449], "valid", [], "NV8"], [[3450, 3455], "valid"], [[3456, 3457], "disallowed"], [[3458, 3459], "valid"], [[3460, 3460], "disallowed"], [[3461, 3478], "valid"], [[3479, 3481], "disallowed"], [[3482, 3505], "valid"], [[3506, 3506], "disallowed"], [[3507, 3515], "valid"], [[3516, 3516], "disallowed"], [[3517, 3517], "valid"], [[3518, 3519], "disallowed"], [[3520, 3526], "valid"], [[3527, 3529], "disallowed"], [[3530, 3530], "valid"], [[3531, 3534], "disallowed"], [[3535, 3540], "valid"], [[3541, 3541], "disallowed"], [[3542, 3542], "valid"], [[3543, 3543], "disallowed"], [[3544, 3551], "valid"], [[3552, 3557], "disallowed"], [[3558, 3567], "valid"], [[3568, 3569], "disallowed"], [[3570, 3571], "valid"], [[3572, 3572], "valid", [], "NV8"], [[3573, 3584], "disallowed"], [[3585, 3634], "valid"], [[3635, 3635], "mapped", [3661, 3634]], [[3636, 3642], "valid"], [[3643, 3646], "disallowed"], [[3647, 3647], "valid", [], "NV8"], [[3648, 3662], "valid"], [[3663, 3663], "valid", [], "NV8"], [[3664, 3673], "valid"], [[3674, 3675], "valid", [], "NV8"], [[3676, 3712], "disallowed"], [[3713, 3714], "valid"], [[3715, 3715], "disallowed"], [[3716, 3716], "valid"], [[3717, 3718], "disallowed"], [[3719, 3720], "valid"], [[3721, 3721], "disallowed"], [[3722, 3722], "valid"], [[3723, 3724], "disallowed"], [[3725, 3725], "valid"], [[3726, 3731], "disallowed"], [[3732, 3735], "valid"], [[3736, 3736], "disallowed"], [[3737, 3743], "valid"], [[3744, 3744], "disallowed"], [[3745, 3747], "valid"], [[3748, 3748], "disallowed"], [[3749, 3749], "valid"], [[3750, 3750], "disallowed"], [[3751, 3751], "valid"], [[3752, 3753], "disallowed"], [[3754, 3755], "valid"], [[3756, 3756], "disallowed"], [[3757, 3762], "valid"], [[3763, 3763], "mapped", [3789, 3762]], [[3764, 3769], "valid"], [[3770, 3770], "disallowed"], [[3771, 3773], "valid"], [[3774, 3775], "disallowed"], [[3776, 3780], "valid"], [[3781, 3781], "disallowed"], [[3782, 3782], "valid"], [[3783, 3783], "disallowed"], [[3784, 3789], "valid"], [[3790, 3791], "disallowed"], [[3792, 3801], "valid"], [[3802, 3803], "disallowed"], [[3804, 3804], "mapped", [3755, 3737]], [[3805, 3805], "mapped", [3755, 3745]], [[3806, 3807], "valid"], [[3808, 3839], "disallowed"], [[3840, 3840], "valid"], [[3841, 3850], "valid", [], "NV8"], [[3851, 3851], "valid"], [[3852, 3852], "mapped", [3851]], [[3853, 3863], "valid", [], "NV8"], [[3864, 3865], "valid"], [[3866, 3871], "valid", [], "NV8"], [[3872, 3881], "valid"], [[3882, 3892], "valid", [], "NV8"], [[3893, 3893], "valid"], [[3894, 3894], "valid", [], "NV8"], [[3895, 3895], "valid"], [[3896, 3896], "valid", [], "NV8"], [[3897, 3897], "valid"], [[3898, 3901], "valid", [], "NV8"], [[3902, 3906], "valid"], [[3907, 3907], "mapped", [3906, 4023]], [[3908, 3911], "valid"], [[3912, 3912], "disallowed"], [[3913, 3916], "valid"], [[3917, 3917], "mapped", [3916, 4023]], [[3918, 3921], "valid"], [[3922, 3922], "mapped", [3921, 4023]], [[3923, 3926], "valid"], [[3927, 3927], "mapped", [3926, 4023]], [[3928, 3931], "valid"], [[3932, 3932], "mapped", [3931, 4023]], [[3933, 3944], "valid"], [[3945, 3945], "mapped", [3904, 4021]], [[3946, 3946], "valid"], [[3947, 3948], "valid"], [[3949, 3952], "disallowed"], [[3953, 3954], "valid"], [[3955, 3955], "mapped", [3953, 3954]], [[3956, 3956], "valid"], [[3957, 3957], "mapped", [3953, 3956]], [[3958, 3958], "mapped", [4018, 3968]], [[3959, 3959], "mapped", [4018, 3953, 3968]], [[3960, 3960], "mapped", [4019, 3968]], [[3961, 3961], "mapped", [4019, 3953, 3968]], [[3962, 3968], "valid"], [[3969, 3969], "mapped", [3953, 3968]], [[3970, 3972], "valid"], [[3973, 3973], "valid", [], "NV8"], [[3974, 3979], "valid"], [[3980, 3983], "valid"], [[3984, 3986], "valid"], [[3987, 3987], "mapped", [3986, 4023]], [[3988, 3989], "valid"], [[3990, 3990], "valid"], [[3991, 3991], "valid"], [[3992, 3992], "disallowed"], [[3993, 3996], "valid"], [[3997, 3997], "mapped", [3996, 4023]], [[3998, 4001], "valid"], [[4002, 4002], "mapped", [4001, 4023]], [[4003, 4006], "valid"], [[4007, 4007], "mapped", [4006, 4023]], [[4008, 4011], "valid"], [[4012, 4012], "mapped", [4011, 4023]], [[4013, 4013], "valid"], [[4014, 4016], "valid"], [[4017, 4023], "valid"], [[4024, 4024], "valid"], [[4025, 4025], "mapped", [3984, 4021]], [[4026, 4028], "valid"], [[4029, 4029], "disallowed"], [[4030, 4037], "valid", [], "NV8"], [[4038, 4038], "valid"], [[4039, 4044], "valid", [], "NV8"], [[4045, 4045], "disallowed"], [[4046, 4046], "valid", [], "NV8"], [[4047, 4047], "valid", [], "NV8"], [[4048, 4049], "valid", [], "NV8"], [[4050, 4052], "valid", [], "NV8"], [[4053, 4056], "valid", [], "NV8"], [[4057, 4058], "valid", [], "NV8"], [[4059, 4095], "disallowed"], [[4096, 4129], "valid"], [[4130, 4130], "valid"], [[4131, 4135], "valid"], [[4136, 4136], "valid"], [[4137, 4138], "valid"], [[4139, 4139], "valid"], [[4140, 4146], "valid"], [[4147, 4149], "valid"], [[4150, 4153], "valid"], [[4154, 4159], "valid"], [[4160, 4169], "valid"], [[4170, 4175], "valid", [], "NV8"], [[4176, 4185], "valid"], [[4186, 4249], "valid"], [[4250, 4253], "valid"], [[4254, 4255], "valid", [], "NV8"], [[4256, 4293], "disallowed"], [[4294, 4294], "disallowed"], [[4295, 4295], "mapped", [11559]], [[4296, 4300], "disallowed"], [[4301, 4301], "mapped", [11565]], [[4302, 4303], "disallowed"], [[4304, 4342], "valid"], [[4343, 4344], "valid"], [[4345, 4346], "valid"], [[4347, 4347], "valid", [], "NV8"], [[4348, 4348], "mapped", [4316]], [[4349, 4351], "valid"], [[4352, 4441], "valid", [], "NV8"], [[4442, 4446], "valid", [], "NV8"], [[4447, 4448], "disallowed"], [[4449, 4514], "valid", [], "NV8"], [[4515, 4519], "valid", [], "NV8"], [[4520, 4601], "valid", [], "NV8"], [[4602, 4607], "valid", [], "NV8"], [[4608, 4614], "valid"], [[4615, 4615], "valid"], [[4616, 4678], "valid"], [[4679, 4679], "valid"], [[4680, 4680], "valid"], [[4681, 4681], "disallowed"], [[4682, 4685], "valid"], [[4686, 4687], "disallowed"], [[4688, 4694], "valid"], [[4695, 4695], "disallowed"], [[4696, 4696], "valid"], [[4697, 4697], "disallowed"], [[4698, 4701], "valid"], [[4702, 4703], "disallowed"], [[4704, 4742], "valid"], [[4743, 4743], "valid"], [[4744, 4744], "valid"], [[4745, 4745], "disallowed"], [[4746, 4749], "valid"], [[4750, 4751], "disallowed"], [[4752, 4782], "valid"], [[4783, 4783], "valid"], [[4784, 4784], "valid"], [[4785, 4785], "disallowed"], [[4786, 4789], "valid"], [[4790, 4791], "disallowed"], [[4792, 4798], "valid"], [[4799, 4799], "disallowed"], [[4800, 4800], "valid"], [[4801, 4801], "disallowed"], [[4802, 4805], "valid"], [[4806, 4807], "disallowed"], [[4808, 4814], "valid"], [[4815, 4815], "valid"], [[4816, 4822], "valid"], [[4823, 4823], "disallowed"], [[4824, 4846], "valid"], [[4847, 4847], "valid"], [[4848, 4878], "valid"], [[4879, 4879], "valid"], [[4880, 4880], "valid"], [[4881, 4881], "disallowed"], [[4882, 4885], "valid"], [[4886, 4887], "disallowed"], [[4888, 4894], "valid"], [[4895, 4895], "valid"], [[4896, 4934], "valid"], [[4935, 4935], "valid"], [[4936, 4954], "valid"], [[4955, 4956], "disallowed"], [[4957, 4958], "valid"], [[4959, 4959], "valid"], [[4960, 4960], "valid", [], "NV8"], [[4961, 4988], "valid", [], "NV8"], [[4989, 4991], "disallowed"], [[4992, 5007], "valid"], [[5008, 5017], "valid", [], "NV8"], [[5018, 5023], "disallowed"], [[5024, 5108], "valid"], [[5109, 5109], "valid"], [[5110, 5111], "disallowed"], [[5112, 5112], "mapped", [5104]], [[5113, 5113], "mapped", [5105]], [[5114, 5114], "mapped", [5106]], [[5115, 5115], "mapped", [5107]], [[5116, 5116], "mapped", [5108]], [[5117, 5117], "mapped", [5109]], [[5118, 5119], "disallowed"], [[5120, 5120], "valid", [], "NV8"], [[5121, 5740], "valid"], [[5741, 5742], "valid", [], "NV8"], [[5743, 5750], "valid"], [[5751, 5759], "valid"], [[5760, 5760], "disallowed"], [[5761, 5786], "valid"], [[5787, 5788], "valid", [], "NV8"], [[5789, 5791], "disallowed"], [[5792, 5866], "valid"], [[5867, 5872], "valid", [], "NV8"], [[5873, 5880], "valid"], [[5881, 5887], "disallowed"], [[5888, 5900], "valid"], [[5901, 5901], "disallowed"], [[5902, 5908], "valid"], [[5909, 5919], "disallowed"], [[5920, 5940], "valid"], [[5941, 5942], "valid", [], "NV8"], [[5943, 5951], "disallowed"], [[5952, 5971], "valid"], [[5972, 5983], "disallowed"], [[5984, 5996], "valid"], [[5997, 5997], "disallowed"], [[5998, 6e3], "valid"], [[6001, 6001], "disallowed"], [[6002, 6003], "valid"], [[6004, 6015], "disallowed"], [[6016, 6067], "valid"], [[6068, 6069], "disallowed"], [[6070, 6099], "valid"], [[6100, 6102], "valid", [], "NV8"], [[6103, 6103], "valid"], [[6104, 6107], "valid", [], "NV8"], [[6108, 6108], "valid"], [[6109, 6109], "valid"], [[6110, 6111], "disallowed"], [[6112, 6121], "valid"], [[6122, 6127], "disallowed"], [[6128, 6137], "valid", [], "NV8"], [[6138, 6143], "disallowed"], [[6144, 6149], "valid", [], "NV8"], [[6150, 6150], "disallowed"], [[6151, 6154], "valid", [], "NV8"], [[6155, 6157], "ignored"], [[6158, 6158], "disallowed"], [[6159, 6159], "disallowed"], [[6160, 6169], "valid"], [[6170, 6175], "disallowed"], [[6176, 6263], "valid"], [[6264, 6271], "disallowed"], [[6272, 6313], "valid"], [[6314, 6314], "valid"], [[6315, 6319], "disallowed"], [[6320, 6389], "valid"], [[6390, 6399], "disallowed"], [[6400, 6428], "valid"], [[6429, 6430], "valid"], [[6431, 6431], "disallowed"], [[6432, 6443], "valid"], [[6444, 6447], "disallowed"], [[6448, 6459], "valid"], [[6460, 6463], "disallowed"], [[6464, 6464], "valid", [], "NV8"], [[6465, 6467], "disallowed"], [[6468, 6469], "valid", [], "NV8"], [[6470, 6509], "valid"], [[6510, 6511], "disallowed"], [[6512, 6516], "valid"], [[6517, 6527], "disallowed"], [[6528, 6569], "valid"], [[6570, 6571], "valid"], [[6572, 6575], "disallowed"], [[6576, 6601], "valid"], [[6602, 6607], "disallowed"], [[6608, 6617], "valid"], [[6618, 6618], "valid", [], "XV8"], [[6619, 6621], "disallowed"], [[6622, 6623], "valid", [], "NV8"], [[6624, 6655], "valid", [], "NV8"], [[6656, 6683], "valid"], [[6684, 6685], "disallowed"], [[6686, 6687], "valid", [], "NV8"], [[6688, 6750], "valid"], [[6751, 6751], "disallowed"], [[6752, 6780], "valid"], [[6781, 6782], "disallowed"], [[6783, 6793], "valid"], [[6794, 6799], "disallowed"], [[6800, 6809], "valid"], [[6810, 6815], "disallowed"], [[6816, 6822], "valid", [], "NV8"], [[6823, 6823], "valid"], [[6824, 6829], "valid", [], "NV8"], [[6830, 6831], "disallowed"], [[6832, 6845], "valid"], [[6846, 6846], "valid", [], "NV8"], [[6847, 6911], "disallowed"], [[6912, 6987], "valid"], [[6988, 6991], "disallowed"], [[6992, 7001], "valid"], [[7002, 7018], "valid", [], "NV8"], [[7019, 7027], "valid"], [[7028, 7036], "valid", [], "NV8"], [[7037, 7039], "disallowed"], [[7040, 7082], "valid"], [[7083, 7085], "valid"], [[7086, 7097], "valid"], [[7098, 7103], "valid"], [[7104, 7155], "valid"], [[7156, 7163], "disallowed"], [[7164, 7167], "valid", [], "NV8"], [[7168, 7223], "valid"], [[7224, 7226], "disallowed"], [[7227, 7231], "valid", [], "NV8"], [[7232, 7241], "valid"], [[7242, 7244], "disallowed"], [[7245, 7293], "valid"], [[7294, 7295], "valid", [], "NV8"], [[7296, 7359], "disallowed"], [[7360, 7367], "valid", [], "NV8"], [[7368, 7375], "disallowed"], [[7376, 7378], "valid"], [[7379, 7379], "valid", [], "NV8"], [[7380, 7410], "valid"], [[7411, 7414], "valid"], [[7415, 7415], "disallowed"], [[7416, 7417], "valid"], [[7418, 7423], "disallowed"], [[7424, 7467], "valid"], [[7468, 7468], "mapped", [97]], [[7469, 7469], "mapped", [230]], [[7470, 7470], "mapped", [98]], [[7471, 7471], "valid"], [[7472, 7472], "mapped", [100]], [[7473, 7473], "mapped", [101]], [[7474, 7474], "mapped", [477]], [[7475, 7475], "mapped", [103]], [[7476, 7476], "mapped", [104]], [[7477, 7477], "mapped", [105]], [[7478, 7478], "mapped", [106]], [[7479, 7479], "mapped", [107]], [[7480, 7480], "mapped", [108]], [[7481, 7481], "mapped", [109]], [[7482, 7482], "mapped", [110]], [[7483, 7483], "valid"], [[7484, 7484], "mapped", [111]], [[7485, 7485], "mapped", [547]], [[7486, 7486], "mapped", [112]], [[7487, 7487], "mapped", [114]], [[7488, 7488], "mapped", [116]], [[7489, 7489], "mapped", [117]], [[7490, 7490], "mapped", [119]], [[7491, 7491], "mapped", [97]], [[7492, 7492], "mapped", [592]], [[7493, 7493], "mapped", [593]], [[7494, 7494], "mapped", [7426]], [[7495, 7495], "mapped", [98]], [[7496, 7496], "mapped", [100]], [[7497, 7497], "mapped", [101]], [[7498, 7498], "mapped", [601]], [[7499, 7499], "mapped", [603]], [[7500, 7500], "mapped", [604]], [[7501, 7501], "mapped", [103]], [[7502, 7502], "valid"], [[7503, 7503], "mapped", [107]], [[7504, 7504], "mapped", [109]], [[7505, 7505], "mapped", [331]], [[7506, 7506], "mapped", [111]], [[7507, 7507], "mapped", [596]], [[7508, 7508], "mapped", [7446]], [[7509, 7509], "mapped", [7447]], [[7510, 7510], "mapped", [112]], [[7511, 7511], "mapped", [116]], [[7512, 7512], "mapped", [117]], [[7513, 7513], "mapped", [7453]], [[7514, 7514], "mapped", [623]], [[7515, 7515], "mapped", [118]], [[7516, 7516], "mapped", [7461]], [[7517, 7517], "mapped", [946]], [[7518, 7518], "mapped", [947]], [[7519, 7519], "mapped", [948]], [[7520, 7520], "mapped", [966]], [[7521, 7521], "mapped", [967]], [[7522, 7522], "mapped", [105]], [[7523, 7523], "mapped", [114]], [[7524, 7524], "mapped", [117]], [[7525, 7525], "mapped", [118]], [[7526, 7526], "mapped", [946]], [[7527, 7527], "mapped", [947]], [[7528, 7528], "mapped", [961]], [[7529, 7529], "mapped", [966]], [[7530, 7530], "mapped", [967]], [[7531, 7531], "valid"], [[7532, 7543], "valid"], [[7544, 7544], "mapped", [1085]], [[7545, 7578], "valid"], [[7579, 7579], "mapped", [594]], [[7580, 7580], "mapped", [99]], [[7581, 7581], "mapped", [597]], [[7582, 7582], "mapped", [240]], [[7583, 7583], "mapped", [604]], [[7584, 7584], "mapped", [102]], [[7585, 7585], "mapped", [607]], [[7586, 7586], "mapped", [609]], [[7587, 7587], "mapped", [613]], [[7588, 7588], "mapped", [616]], [[7589, 7589], "mapped", [617]], [[7590, 7590], "mapped", [618]], [[7591, 7591], "mapped", [7547]], [[7592, 7592], "mapped", [669]], [[7593, 7593], "mapped", [621]], [[7594, 7594], "mapped", [7557]], [[7595, 7595], "mapped", [671]], [[7596, 7596], "mapped", [625]], [[7597, 7597], "mapped", [624]], [[7598, 7598], "mapped", [626]], [[7599, 7599], "mapped", [627]], [[7600, 7600], "mapped", [628]], [[7601, 7601], "mapped", [629]], [[7602, 7602], "mapped", [632]], [[7603, 7603], "mapped", [642]], [[7604, 7604], "mapped", [643]], [[7605, 7605], "mapped", [427]], [[7606, 7606], "mapped", [649]], [[7607, 7607], "mapped", [650]], [[7608, 7608], "mapped", [7452]], [[7609, 7609], "mapped", [651]], [[7610, 7610], "mapped", [652]], [[7611, 7611], "mapped", [122]], [[7612, 7612], "mapped", [656]], [[7613, 7613], "mapped", [657]], [[7614, 7614], "mapped", [658]], [[7615, 7615], "mapped", [952]], [[7616, 7619], "valid"], [[7620, 7626], "valid"], [[7627, 7654], "valid"], [[7655, 7669], "valid"], [[7670, 7675], "disallowed"], [[7676, 7676], "valid"], [[7677, 7677], "valid"], [[7678, 7679], "valid"], [[7680, 7680], "mapped", [7681]], [[7681, 7681], "valid"], [[7682, 7682], "mapped", [7683]], [[7683, 7683], "valid"], [[7684, 7684], "mapped", [7685]], [[7685, 7685], "valid"], [[7686, 7686], "mapped", [7687]], [[7687, 7687], "valid"], [[7688, 7688], "mapped", [7689]], [[7689, 7689], "valid"], [[7690, 7690], "mapped", [7691]], [[7691, 7691], "valid"], [[7692, 7692], "mapped", [7693]], [[7693, 7693], "valid"], [[7694, 7694], "mapped", [7695]], [[7695, 7695], "valid"], [[7696, 7696], "mapped", [7697]], [[7697, 7697], "valid"], [[7698, 7698], "mapped", [7699]], [[7699, 7699], "valid"], [[7700, 7700], "mapped", [7701]], [[7701, 7701], "valid"], [[7702, 7702], "mapped", [7703]], [[7703, 7703], "valid"], [[7704, 7704], "mapped", [7705]], [[7705, 7705], "valid"], [[7706, 7706], "mapped", [7707]], [[7707, 7707], "valid"], [[7708, 7708], "mapped", [7709]], [[7709, 7709], "valid"], [[7710, 7710], "mapped", [7711]], [[7711, 7711], "valid"], [[7712, 7712], "mapped", [7713]], [[7713, 7713], "valid"], [[7714, 7714], "mapped", [7715]], [[7715, 7715], "valid"], [[7716, 7716], "mapped", [7717]], [[7717, 7717], "valid"], [[7718, 7718], "mapped", [7719]], [[7719, 7719], "valid"], [[7720, 7720], "mapped", [7721]], [[7721, 7721], "valid"], [[7722, 7722], "mapped", [7723]], [[7723, 7723], "valid"], [[7724, 7724], "mapped", [7725]], [[7725, 7725], "valid"], [[7726, 7726], "mapped", [7727]], [[7727, 7727], "valid"], [[7728, 7728], "mapped", [7729]], [[7729, 7729], "valid"], [[7730, 7730], "mapped", [7731]], [[7731, 7731], "valid"], [[7732, 7732], "mapped", [7733]], [[7733, 7733], "valid"], [[7734, 7734], "mapped", [7735]], [[7735, 7735], "valid"], [[7736, 7736], "mapped", [7737]], [[7737, 7737], "valid"], [[7738, 7738], "mapped", [7739]], [[7739, 7739], "valid"], [[7740, 7740], "mapped", [7741]], [[7741, 7741], "valid"], [[7742, 7742], "mapped", [7743]], [[7743, 7743], "valid"], [[7744, 7744], "mapped", [7745]], [[7745, 7745], "valid"], [[7746, 7746], "mapped", [7747]], [[7747, 7747], "valid"], [[7748, 7748], "mapped", [7749]], [[7749, 7749], "valid"], [[7750, 7750], "mapped", [7751]], [[7751, 7751], "valid"], [[7752, 7752], "mapped", [7753]], [[7753, 7753], "valid"], [[7754, 7754], "mapped", [7755]], [[7755, 7755], "valid"], [[7756, 7756], "mapped", [7757]], [[7757, 7757], "valid"], [[7758, 7758], "mapped", [7759]], [[7759, 7759], "valid"], [[7760, 7760], "mapped", [7761]], [[7761, 7761], "valid"], [[7762, 7762], "mapped", [7763]], [[7763, 7763], "valid"], [[7764, 7764], "mapped", [7765]], [[7765, 7765], "valid"], [[7766, 7766], "mapped", [7767]], [[7767, 7767], "valid"], [[7768, 7768], "mapped", [7769]], [[7769, 7769], "valid"], [[7770, 7770], "mapped", [7771]], [[7771, 7771], "valid"], [[7772, 7772], "mapped", [7773]], [[7773, 7773], "valid"], [[7774, 7774], "mapped", [7775]], [[7775, 7775], "valid"], [[7776, 7776], "mapped", [7777]], [[7777, 7777], "valid"], [[7778, 7778], "mapped", [7779]], [[7779, 7779], "valid"], [[7780, 7780], "mapped", [7781]], [[7781, 7781], "valid"], [[7782, 7782], "mapped", [7783]], [[7783, 7783], "valid"], [[7784, 7784], "mapped", [7785]], [[7785, 7785], "valid"], [[7786, 7786], "mapped", [7787]], [[7787, 7787], "valid"], [[7788, 7788], "mapped", [7789]], [[7789, 7789], "valid"], [[7790, 7790], "mapped", [7791]], [[7791, 7791], "valid"], [[7792, 7792], "mapped", [7793]], [[7793, 7793], "valid"], [[7794, 7794], "mapped", [7795]], [[7795, 7795], "valid"], [[7796, 7796], "mapped", [7797]], [[7797, 7797], "valid"], [[7798, 7798], "mapped", [7799]], [[7799, 7799], "valid"], [[7800, 7800], "mapped", [7801]], [[7801, 7801], "valid"], [[7802, 7802], "mapped", [7803]], [[7803, 7803], "valid"], [[7804, 7804], "mapped", [7805]], [[7805, 7805], "valid"], [[7806, 7806], "mapped", [7807]], [[7807, 7807], "valid"], [[7808, 7808], "mapped", [7809]], [[7809, 7809], "valid"], [[7810, 7810], "mapped", [7811]], [[7811, 7811], "valid"], [[7812, 7812], "mapped", [7813]], [[7813, 7813], "valid"], [[7814, 7814], "mapped", [7815]], [[7815, 7815], "valid"], [[7816, 7816], "mapped", [7817]], [[7817, 7817], "valid"], [[7818, 7818], "mapped", [7819]], [[7819, 7819], "valid"], [[7820, 7820], "mapped", [7821]], [[7821, 7821], "valid"], [[7822, 7822], "mapped", [7823]], [[7823, 7823], "valid"], [[7824, 7824], "mapped", [7825]], [[7825, 7825], "valid"], [[7826, 7826], "mapped", [7827]], [[7827, 7827], "valid"], [[7828, 7828], "mapped", [7829]], [[7829, 7833], "valid"], [[7834, 7834], "mapped", [97, 702]], [[7835, 7835], "mapped", [7777]], [[7836, 7837], "valid"], [[7838, 7838], "mapped", [115, 115]], [[7839, 7839], "valid"], [[7840, 7840], "mapped", [7841]], [[7841, 7841], "valid"], [[7842, 7842], "mapped", [7843]], [[7843, 7843], "valid"], [[7844, 7844], "mapped", [7845]], [[7845, 7845], "valid"], [[7846, 7846], "mapped", [7847]], [[7847, 7847], "valid"], [[7848, 7848], "mapped", [7849]], [[7849, 7849], "valid"], [[7850, 7850], "mapped", [7851]], [[7851, 7851], "valid"], [[7852, 7852], "mapped", [7853]], [[7853, 7853], "valid"], [[7854, 7854], "mapped", [7855]], [[7855, 7855], "valid"], [[7856, 7856], "mapped", [7857]], [[7857, 7857], "valid"], [[7858, 7858], "mapped", [7859]], [[7859, 7859], "valid"], [[7860, 7860], "mapped", [7861]], [[7861, 7861], "valid"], [[7862, 7862], "mapped", [7863]], [[7863, 7863], "valid"], [[7864, 7864], "mapped", [7865]], [[7865, 7865], "valid"], [[7866, 7866], "mapped", [7867]], [[7867, 7867], "valid"], [[7868, 7868], "mapped", [7869]], [[7869, 7869], "valid"], [[7870, 7870], "mapped", [7871]], [[7871, 7871], "valid"], [[7872, 7872], "mapped", [7873]], [[7873, 7873], "valid"], [[7874, 7874], "mapped", [7875]], [[7875, 7875], "valid"], [[7876, 7876], "mapped", [7877]], [[7877, 7877], "valid"], [[7878, 7878], "mapped", [7879]], [[7879, 7879], "valid"], [[7880, 7880], "mapped", [7881]], [[7881, 7881], "valid"], [[7882, 7882], "mapped", [7883]], [[7883, 7883], "valid"], [[7884, 7884], "mapped", [7885]], [[7885, 7885], "valid"], [[7886, 7886], "mapped", [7887]], [[7887, 7887], "valid"], [[7888, 7888], "mapped", [7889]], [[7889, 7889], "valid"], [[7890, 7890], "mapped", [7891]], [[7891, 7891], "valid"], [[7892, 7892], "mapped", [7893]], [[7893, 7893], "valid"], [[7894, 7894], "mapped", [7895]], [[7895, 7895], "valid"], [[7896, 7896], "mapped", [7897]], [[7897, 7897], "valid"], [[7898, 7898], "mapped", [7899]], [[7899, 7899], "valid"], [[7900, 7900], "mapped", [7901]], [[7901, 7901], "valid"], [[7902, 7902], "mapped", [7903]], [[7903, 7903], "valid"], [[7904, 7904], "mapped", [7905]], [[7905, 7905], "valid"], [[7906, 7906], "mapped", [7907]], [[7907, 7907], "valid"], [[7908, 7908], "mapped", [7909]], [[7909, 7909], "valid"], [[7910, 7910], "mapped", [7911]], [[7911, 7911], "valid"], [[7912, 7912], "mapped", [7913]], [[7913, 7913], "valid"], [[7914, 7914], "mapped", [7915]], [[7915, 7915], "valid"], [[7916, 7916], "mapped", [7917]], [[7917, 7917], "valid"], [[7918, 7918], "mapped", [7919]], [[7919, 7919], "valid"], [[7920, 7920], "mapped", [7921]], [[7921, 7921], "valid"], [[7922, 7922], "mapped", [7923]], [[7923, 7923], "valid"], [[7924, 7924], "mapped", [7925]], [[7925, 7925], "valid"], [[7926, 7926], "mapped", [7927]], [[7927, 7927], "valid"], [[7928, 7928], "mapped", [7929]], [[7929, 7929], "valid"], [[7930, 7930], "mapped", [7931]], [[7931, 7931], "valid"], [[7932, 7932], "mapped", [7933]], [[7933, 7933], "valid"], [[7934, 7934], "mapped", [7935]], [[7935, 7935], "valid"], [[7936, 7943], "valid"], [[7944, 7944], "mapped", [7936]], [[7945, 7945], "mapped", [7937]], [[7946, 7946], "mapped", [7938]], [[7947, 7947], "mapped", [7939]], [[7948, 7948], "mapped", [7940]], [[7949, 7949], "mapped", [7941]], [[7950, 7950], "mapped", [7942]], [[7951, 7951], "mapped", [7943]], [[7952, 7957], "valid"], [[7958, 7959], "disallowed"], [[7960, 7960], "mapped", [7952]], [[7961, 7961], "mapped", [7953]], [[7962, 7962], "mapped", [7954]], [[7963, 7963], "mapped", [7955]], [[7964, 7964], "mapped", [7956]], [[7965, 7965], "mapped", [7957]], [[7966, 7967], "disallowed"], [[7968, 7975], "valid"], [[7976, 7976], "mapped", [7968]], [[7977, 7977], "mapped", [7969]], [[7978, 7978], "mapped", [7970]], [[7979, 7979], "mapped", [7971]], [[7980, 7980], "mapped", [7972]], [[7981, 7981], "mapped", [7973]], [[7982, 7982], "mapped", [7974]], [[7983, 7983], "mapped", [7975]], [[7984, 7991], "valid"], [[7992, 7992], "mapped", [7984]], [[7993, 7993], "mapped", [7985]], [[7994, 7994], "mapped", [7986]], [[7995, 7995], "mapped", [7987]], [[7996, 7996], "mapped", [7988]], [[7997, 7997], "mapped", [7989]], [[7998, 7998], "mapped", [7990]], [[7999, 7999], "mapped", [7991]], [[8e3, 8005], "valid"], [[8006, 8007], "disallowed"], [[8008, 8008], "mapped", [8e3]], [[8009, 8009], "mapped", [8001]], [[8010, 8010], "mapped", [8002]], [[8011, 8011], "mapped", [8003]], [[8012, 8012], "mapped", [8004]], [[8013, 8013], "mapped", [8005]], [[8014, 8015], "disallowed"], [[8016, 8023], "valid"], [[8024, 8024], "disallowed"], [[8025, 8025], "mapped", [8017]], [[8026, 8026], "disallowed"], [[8027, 8027], "mapped", [8019]], [[8028, 8028], "disallowed"], [[8029, 8029], "mapped", [8021]], [[8030, 8030], "disallowed"], [[8031, 8031], "mapped", [8023]], [[8032, 8039], "valid"], [[8040, 8040], "mapped", [8032]], [[8041, 8041], "mapped", [8033]], [[8042, 8042], "mapped", [8034]], [[8043, 8043], "mapped", [8035]], [[8044, 8044], "mapped", [8036]], [[8045, 8045], "mapped", [8037]], [[8046, 8046], "mapped", [8038]], [[8047, 8047], "mapped", [8039]], [[8048, 8048], "valid"], [[8049, 8049], "mapped", [940]], [[8050, 8050], "valid"], [[8051, 8051], "mapped", [941]], [[8052, 8052], "valid"], [[8053, 8053], "mapped", [942]], [[8054, 8054], "valid"], [[8055, 8055], "mapped", [943]], [[8056, 8056], "valid"], [[8057, 8057], "mapped", [972]], [[8058, 8058], "valid"], [[8059, 8059], "mapped", [973]], [[8060, 8060], "valid"], [[8061, 8061], "mapped", [974]], [[8062, 8063], "disallowed"], [[8064, 8064], "mapped", [7936, 953]], [[8065, 8065], "mapped", [7937, 953]], [[8066, 8066], "mapped", [7938, 953]], [[8067, 8067], "mapped", [7939, 953]], [[8068, 8068], "mapped", [7940, 953]], [[8069, 8069], "mapped", [7941, 953]], [[8070, 8070], "mapped", [7942, 953]], [[8071, 8071], "mapped", [7943, 953]], [[8072, 8072], "mapped", [7936, 953]], [[8073, 8073], "mapped", [7937, 953]], [[8074, 8074], "mapped", [7938, 953]], [[8075, 8075], "mapped", [7939, 953]], [[8076, 8076], "mapped", [7940, 953]], [[8077, 8077], "mapped", [7941, 953]], [[8078, 8078], "mapped", [7942, 953]], [[8079, 8079], "mapped", [7943, 953]], [[8080, 8080], "mapped", [7968, 953]], [[8081, 8081], "mapped", [7969, 953]], [[8082, 8082], "mapped", [7970, 953]], [[8083, 8083], "mapped", [7971, 953]], [[8084, 8084], "mapped", [7972, 953]], [[8085, 8085], "mapped", [7973, 953]], [[8086, 8086], "mapped", [7974, 953]], [[8087, 8087], "mapped", [7975, 953]], [[8088, 8088], "mapped", [7968, 953]], [[8089, 8089], "mapped", [7969, 953]], [[8090, 8090], "mapped", [7970, 953]], [[8091, 8091], "mapped", [7971, 953]], [[8092, 8092], "mapped", [7972, 953]], [[8093, 8093], "mapped", [7973, 953]], [[8094, 8094], "mapped", [7974, 953]], [[8095, 8095], "mapped", [7975, 953]], [[8096, 8096], "mapped", [8032, 953]], [[8097, 8097], "mapped", [8033, 953]], [[8098, 8098], "mapped", [8034, 953]], [[8099, 8099], "mapped", [8035, 953]], [[8100, 8100], "mapped", [8036, 953]], [[8101, 8101], "mapped", [8037, 953]], [[8102, 8102], "mapped", [8038, 953]], [[8103, 8103], "mapped", [8039, 953]], [[8104, 8104], "mapped", [8032, 953]], [[8105, 8105], "mapped", [8033, 953]], [[8106, 8106], "mapped", [8034, 953]], [[8107, 8107], "mapped", [8035, 953]], [[8108, 8108], "mapped", [8036, 953]], [[8109, 8109], "mapped", [8037, 953]], [[8110, 8110], "mapped", [8038, 953]], [[8111, 8111], "mapped", [8039, 953]], [[8112, 8113], "valid"], [[8114, 8114], "mapped", [8048, 953]], [[8115, 8115], "mapped", [945, 953]], [[8116, 8116], "mapped", [940, 953]], [[8117, 8117], "disallowed"], [[8118, 8118], "valid"], [[8119, 8119], "mapped", [8118, 953]], [[8120, 8120], "mapped", [8112]], [[8121, 8121], "mapped", [8113]], [[8122, 8122], "mapped", [8048]], [[8123, 8123], "mapped", [940]], [[8124, 8124], "mapped", [945, 953]], [[8125, 8125], "disallowed_STD3_mapped", [32, 787]], [[8126, 8126], "mapped", [953]], [[8127, 8127], "disallowed_STD3_mapped", [32, 787]], [[8128, 8128], "disallowed_STD3_mapped", [32, 834]], [[8129, 8129], "disallowed_STD3_mapped", [32, 776, 834]], [[8130, 8130], "mapped", [8052, 953]], [[8131, 8131], "mapped", [951, 953]], [[8132, 8132], "mapped", [942, 953]], [[8133, 8133], "disallowed"], [[8134, 8134], "valid"], [[8135, 8135], "mapped", [8134, 953]], [[8136, 8136], "mapped", [8050]], [[8137, 8137], "mapped", [941]], [[8138, 8138], "mapped", [8052]], [[8139, 8139], "mapped", [942]], [[8140, 8140], "mapped", [951, 953]], [[8141, 8141], "disallowed_STD3_mapped", [32, 787, 768]], [[8142, 8142], "disallowed_STD3_mapped", [32, 787, 769]], [[8143, 8143], "disallowed_STD3_mapped", [32, 787, 834]], [[8144, 8146], "valid"], [[8147, 8147], "mapped", [912]], [[8148, 8149], "disallowed"], [[8150, 8151], "valid"], [[8152, 8152], "mapped", [8144]], [[8153, 8153], "mapped", [8145]], [[8154, 8154], "mapped", [8054]], [[8155, 8155], "mapped", [943]], [[8156, 8156], "disallowed"], [[8157, 8157], "disallowed_STD3_mapped", [32, 788, 768]], [[8158, 8158], "disallowed_STD3_mapped", [32, 788, 769]], [[8159, 8159], "disallowed_STD3_mapped", [32, 788, 834]], [[8160, 8162], "valid"], [[8163, 8163], "mapped", [944]], [[8164, 8167], "valid"], [[8168, 8168], "mapped", [8160]], [[8169, 8169], "mapped", [8161]], [[8170, 8170], "mapped", [8058]], [[8171, 8171], "mapped", [973]], [[8172, 8172], "mapped", [8165]], [[8173, 8173], "disallowed_STD3_mapped", [32, 776, 768]], [[8174, 8174], "disallowed_STD3_mapped", [32, 776, 769]], [[8175, 8175], "disallowed_STD3_mapped", [96]], [[8176, 8177], "disallowed"], [[8178, 8178], "mapped", [8060, 953]], [[8179, 8179], "mapped", [969, 953]], [[8180, 8180], "mapped", [974, 953]], [[8181, 8181], "disallowed"], [[8182, 8182], "valid"], [[8183, 8183], "mapped", [8182, 953]], [[8184, 8184], "mapped", [8056]], [[8185, 8185], "mapped", [972]], [[8186, 8186], "mapped", [8060]], [[8187, 8187], "mapped", [974]], [[8188, 8188], "mapped", [969, 953]], [[8189, 8189], "disallowed_STD3_mapped", [32, 769]], [[8190, 8190], "disallowed_STD3_mapped", [32, 788]], [[8191, 8191], "disallowed"], [[8192, 8202], "disallowed_STD3_mapped", [32]], [[8203, 8203], "ignored"], [[8204, 8205], "deviation", []], [[8206, 8207], "disallowed"], [[8208, 8208], "valid", [], "NV8"], [[8209, 8209], "mapped", [8208]], [[8210, 8214], "valid", [], "NV8"], [[8215, 8215], "disallowed_STD3_mapped", [32, 819]], [[8216, 8227], "valid", [], "NV8"], [[8228, 8230], "disallowed"], [[8231, 8231], "valid", [], "NV8"], [[8232, 8238], "disallowed"], [[8239, 8239], "disallowed_STD3_mapped", [32]], [[8240, 8242], "valid", [], "NV8"], [[8243, 8243], "mapped", [8242, 8242]], [[8244, 8244], "mapped", [8242, 8242, 8242]], [[8245, 8245], "valid", [], "NV8"], [[8246, 8246], "mapped", [8245, 8245]], [[8247, 8247], "mapped", [8245, 8245, 8245]], [[8248, 8251], "valid", [], "NV8"], [[8252, 8252], "disallowed_STD3_mapped", [33, 33]], [[8253, 8253], "valid", [], "NV8"], [[8254, 8254], "disallowed_STD3_mapped", [32, 773]], [[8255, 8262], "valid", [], "NV8"], [[8263, 8263], "disallowed_STD3_mapped", [63, 63]], [[8264, 8264], "disallowed_STD3_mapped", [63, 33]], [[8265, 8265], "disallowed_STD3_mapped", [33, 63]], [[8266, 8269], "valid", [], "NV8"], [[8270, 8274], "valid", [], "NV8"], [[8275, 8276], "valid", [], "NV8"], [[8277, 8278], "valid", [], "NV8"], [[8279, 8279], "mapped", [8242, 8242, 8242, 8242]], [[8280, 8286], "valid", [], "NV8"], [[8287, 8287], "disallowed_STD3_mapped", [32]], [[8288, 8288], "ignored"], [[8289, 8291], "disallowed"], [[8292, 8292], "ignored"], [[8293, 8293], "disallowed"], [[8294, 8297], "disallowed"], [[8298, 8303], "disallowed"], [[8304, 8304], "mapped", [48]], [[8305, 8305], "mapped", [105]], [[8306, 8307], "disallowed"], [[8308, 8308], "mapped", [52]], [[8309, 8309], "mapped", [53]], [[8310, 8310], "mapped", [54]], [[8311, 8311], "mapped", [55]], [[8312, 8312], "mapped", [56]], [[8313, 8313], "mapped", [57]], [[8314, 8314], "disallowed_STD3_mapped", [43]], [[8315, 8315], "mapped", [8722]], [[8316, 8316], "disallowed_STD3_mapped", [61]], [[8317, 8317], "disallowed_STD3_mapped", [40]], [[8318, 8318], "disallowed_STD3_mapped", [41]], [[8319, 8319], "mapped", [110]], [[8320, 8320], "mapped", [48]], [[8321, 8321], "mapped", [49]], [[8322, 8322], "mapped", [50]], [[8323, 8323], "mapped", [51]], [[8324, 8324], "mapped", [52]], [[8325, 8325], "mapped", [53]], [[8326, 8326], "mapped", [54]], [[8327, 8327], "mapped", [55]], [[8328, 8328], "mapped", [56]], [[8329, 8329], "mapped", [57]], [[8330, 8330], "disallowed_STD3_mapped", [43]], [[8331, 8331], "mapped", [8722]], [[8332, 8332], "disallowed_STD3_mapped", [61]], [[8333, 8333], "disallowed_STD3_mapped", [40]], [[8334, 8334], "disallowed_STD3_mapped", [41]], [[8335, 8335], "disallowed"], [[8336, 8336], "mapped", [97]], [[8337, 8337], "mapped", [101]], [[8338, 8338], "mapped", [111]], [[8339, 8339], "mapped", [120]], [[8340, 8340], "mapped", [601]], [[8341, 8341], "mapped", [104]], [[8342, 8342], "mapped", [107]], [[8343, 8343], "mapped", [108]], [[8344, 8344], "mapped", [109]], [[8345, 8345], "mapped", [110]], [[8346, 8346], "mapped", [112]], [[8347, 8347], "mapped", [115]], [[8348, 8348], "mapped", [116]], [[8349, 8351], "disallowed"], [[8352, 8359], "valid", [], "NV8"], [[8360, 8360], "mapped", [114, 115]], [[8361, 8362], "valid", [], "NV8"], [[8363, 8363], "valid", [], "NV8"], [[8364, 8364], "valid", [], "NV8"], [[8365, 8367], "valid", [], "NV8"], [[8368, 8369], "valid", [], "NV8"], [[8370, 8373], "valid", [], "NV8"], [[8374, 8376], "valid", [], "NV8"], [[8377, 8377], "valid", [], "NV8"], [[8378, 8378], "valid", [], "NV8"], [[8379, 8381], "valid", [], "NV8"], [[8382, 8382], "valid", [], "NV8"], [[8383, 8399], "disallowed"], [[8400, 8417], "valid", [], "NV8"], [[8418, 8419], "valid", [], "NV8"], [[8420, 8426], "valid", [], "NV8"], [[8427, 8427], "valid", [], "NV8"], [[8428, 8431], "valid", [], "NV8"], [[8432, 8432], "valid", [], "NV8"], [[8433, 8447], "disallowed"], [[8448, 8448], "disallowed_STD3_mapped", [97, 47, 99]], [[8449, 8449], "disallowed_STD3_mapped", [97, 47, 115]], [[8450, 8450], "mapped", [99]], [[8451, 8451], "mapped", [176, 99]], [[8452, 8452], "valid", [], "NV8"], [[8453, 8453], "disallowed_STD3_mapped", [99, 47, 111]], [[8454, 8454], "disallowed_STD3_mapped", [99, 47, 117]], [[8455, 8455], "mapped", [603]], [[8456, 8456], "valid", [], "NV8"], [[8457, 8457], "mapped", [176, 102]], [[8458, 8458], "mapped", [103]], [[8459, 8462], "mapped", [104]], [[8463, 8463], "mapped", [295]], [[8464, 8465], "mapped", [105]], [[8466, 8467], "mapped", [108]], [[8468, 8468], "valid", [], "NV8"], [[8469, 8469], "mapped", [110]], [[8470, 8470], "mapped", [110, 111]], [[8471, 8472], "valid", [], "NV8"], [[8473, 8473], "mapped", [112]], [[8474, 8474], "mapped", [113]], [[8475, 8477], "mapped", [114]], [[8478, 8479], "valid", [], "NV8"], [[8480, 8480], "mapped", [115, 109]], [[8481, 8481], "mapped", [116, 101, 108]], [[8482, 8482], "mapped", [116, 109]], [[8483, 8483], "valid", [], "NV8"], [[8484, 8484], "mapped", [122]], [[8485, 8485], "valid", [], "NV8"], [[8486, 8486], "mapped", [969]], [[8487, 8487], "valid", [], "NV8"], [[8488, 8488], "mapped", [122]], [[8489, 8489], "valid", [], "NV8"], [[8490, 8490], "mapped", [107]], [[8491, 8491], "mapped", [229]], [[8492, 8492], "mapped", [98]], [[8493, 8493], "mapped", [99]], [[8494, 8494], "valid", [], "NV8"], [[8495, 8496], "mapped", [101]], [[8497, 8497], "mapped", [102]], [[8498, 8498], "disallowed"], [[8499, 8499], "mapped", [109]], [[8500, 8500], "mapped", [111]], [[8501, 8501], "mapped", [1488]], [[8502, 8502], "mapped", [1489]], [[8503, 8503], "mapped", [1490]], [[8504, 8504], "mapped", [1491]], [[8505, 8505], "mapped", [105]], [[8506, 8506], "valid", [], "NV8"], [[8507, 8507], "mapped", [102, 97, 120]], [[8508, 8508], "mapped", [960]], [[8509, 8510], "mapped", [947]], [[8511, 8511], "mapped", [960]], [[8512, 8512], "mapped", [8721]], [[8513, 8516], "valid", [], "NV8"], [[8517, 8518], "mapped", [100]], [[8519, 8519], "mapped", [101]], [[8520, 8520], "mapped", [105]], [[8521, 8521], "mapped", [106]], [[8522, 8523], "valid", [], "NV8"], [[8524, 8524], "valid", [], "NV8"], [[8525, 8525], "valid", [], "NV8"], [[8526, 8526], "valid"], [[8527, 8527], "valid", [], "NV8"], [[8528, 8528], "mapped", [49, 8260, 55]], [[8529, 8529], "mapped", [49, 8260, 57]], [[8530, 8530], "mapped", [49, 8260, 49, 48]], [[8531, 8531], "mapped", [49, 8260, 51]], [[8532, 8532], "mapped", [50, 8260, 51]], [[8533, 8533], "mapped", [49, 8260, 53]], [[8534, 8534], "mapped", [50, 8260, 53]], [[8535, 8535], "mapped", [51, 8260, 53]], [[8536, 8536], "mapped", [52, 8260, 53]], [[8537, 8537], "mapped", [49, 8260, 54]], [[8538, 8538], "mapped", [53, 8260, 54]], [[8539, 8539], "mapped", [49, 8260, 56]], [[8540, 8540], "mapped", [51, 8260, 56]], [[8541, 8541], "mapped", [53, 8260, 56]], [[8542, 8542], "mapped", [55, 8260, 56]], [[8543, 8543], "mapped", [49, 8260]], [[8544, 8544], "mapped", [105]], [[8545, 8545], "mapped", [105, 105]], [[8546, 8546], "mapped", [105, 105, 105]], [[8547, 8547], "mapped", [105, 118]], [[8548, 8548], "mapped", [118]], [[8549, 8549], "mapped", [118, 105]], [[8550, 8550], "mapped", [118, 105, 105]], [[8551, 8551], "mapped", [118, 105, 105, 105]], [[8552, 8552], "mapped", [105, 120]], [[8553, 8553], "mapped", [120]], [[8554, 8554], "mapped", [120, 105]], [[8555, 8555], "mapped", [120, 105, 105]], [[8556, 8556], "mapped", [108]], [[8557, 8557], "mapped", [99]], [[8558, 8558], "mapped", [100]], [[8559, 8559], "mapped", [109]], [[8560, 8560], "mapped", [105]], [[8561, 8561], "mapped", [105, 105]], [[8562, 8562], "mapped", [105, 105, 105]], [[8563, 8563], "mapped", [105, 118]], [[8564, 8564], "mapped", [118]], [[8565, 8565], "mapped", [118, 105]], [[8566, 8566], "mapped", [118, 105, 105]], [[8567, 8567], "mapped", [118, 105, 105, 105]], [[8568, 8568], "mapped", [105, 120]], [[8569, 8569], "mapped", [120]], [[8570, 8570], "mapped", [120, 105]], [[8571, 8571], "mapped", [120, 105, 105]], [[8572, 8572], "mapped", [108]], [[8573, 8573], "mapped", [99]], [[8574, 8574], "mapped", [100]], [[8575, 8575], "mapped", [109]], [[8576, 8578], "valid", [], "NV8"], [[8579, 8579], "disallowed"], [[8580, 8580], "valid"], [[8581, 8584], "valid", [], "NV8"], [[8585, 8585], "mapped", [48, 8260, 51]], [[8586, 8587], "valid", [], "NV8"], [[8588, 8591], "disallowed"], [[8592, 8682], "valid", [], "NV8"], [[8683, 8691], "valid", [], "NV8"], [[8692, 8703], "valid", [], "NV8"], [[8704, 8747], "valid", [], "NV8"], [[8748, 8748], "mapped", [8747, 8747]], [[8749, 8749], "mapped", [8747, 8747, 8747]], [[8750, 8750], "valid", [], "NV8"], [[8751, 8751], "mapped", [8750, 8750]], [[8752, 8752], "mapped", [8750, 8750, 8750]], [[8753, 8799], "valid", [], "NV8"], [[8800, 8800], "disallowed_STD3_valid"], [[8801, 8813], "valid", [], "NV8"], [[8814, 8815], "disallowed_STD3_valid"], [[8816, 8945], "valid", [], "NV8"], [[8946, 8959], "valid", [], "NV8"], [[8960, 8960], "valid", [], "NV8"], [[8961, 8961], "valid", [], "NV8"], [[8962, 9e3], "valid", [], "NV8"], [[9001, 9001], "mapped", [12296]], [[9002, 9002], "mapped", [12297]], [[9003, 9082], "valid", [], "NV8"], [[9083, 9083], "valid", [], "NV8"], [[9084, 9084], "valid", [], "NV8"], [[9085, 9114], "valid", [], "NV8"], [[9115, 9166], "valid", [], "NV8"], [[9167, 9168], "valid", [], "NV8"], [[9169, 9179], "valid", [], "NV8"], [[9180, 9191], "valid", [], "NV8"], [[9192, 9192], "valid", [], "NV8"], [[9193, 9203], "valid", [], "NV8"], [[9204, 9210], "valid", [], "NV8"], [[9211, 9215], "disallowed"], [[9216, 9252], "valid", [], "NV8"], [[9253, 9254], "valid", [], "NV8"], [[9255, 9279], "disallowed"], [[9280, 9290], "valid", [], "NV8"], [[9291, 9311], "disallowed"], [[9312, 9312], "mapped", [49]], [[9313, 9313], "mapped", [50]], [[9314, 9314], "mapped", [51]], [[9315, 9315], "mapped", [52]], [[9316, 9316], "mapped", [53]], [[9317, 9317], "mapped", [54]], [[9318, 9318], "mapped", [55]], [[9319, 9319], "mapped", [56]], [[9320, 9320], "mapped", [57]], [[9321, 9321], "mapped", [49, 48]], [[9322, 9322], "mapped", [49, 49]], [[9323, 9323], "mapped", [49, 50]], [[9324, 9324], "mapped", [49, 51]], [[9325, 9325], "mapped", [49, 52]], [[9326, 9326], "mapped", [49, 53]], [[9327, 9327], "mapped", [49, 54]], [[9328, 9328], "mapped", [49, 55]], [[9329, 9329], "mapped", [49, 56]], [[9330, 9330], "mapped", [49, 57]], [[9331, 9331], "mapped", [50, 48]], [[9332, 9332], "disallowed_STD3_mapped", [40, 49, 41]], [[9333, 9333], "disallowed_STD3_mapped", [40, 50, 41]], [[9334, 9334], "disallowed_STD3_mapped", [40, 51, 41]], [[9335, 9335], "disallowed_STD3_mapped", [40, 52, 41]], [[9336, 9336], "disallowed_STD3_mapped", [40, 53, 41]], [[9337, 9337], "disallowed_STD3_mapped", [40, 54, 41]], [[9338, 9338], "disallowed_STD3_mapped", [40, 55, 41]], [[9339, 9339], "disallowed_STD3_mapped", [40, 56, 41]], [[9340, 9340], "disallowed_STD3_mapped", [40, 57, 41]], [[9341, 9341], "disallowed_STD3_mapped", [40, 49, 48, 41]], [[9342, 9342], "disallowed_STD3_mapped", [40, 49, 49, 41]], [[9343, 9343], "disallowed_STD3_mapped", [40, 49, 50, 41]], [[9344, 9344], "disallowed_STD3_mapped", [40, 49, 51, 41]], [[9345, 9345], "disallowed_STD3_mapped", [40, 49, 52, 41]], [[9346, 9346], "disallowed_STD3_mapped", [40, 49, 53, 41]], [[9347, 9347], "disallowed_STD3_mapped", [40, 49, 54, 41]], [[9348, 9348], "disallowed_STD3_mapped", [40, 49, 55, 41]], [[9349, 9349], "disallowed_STD3_mapped", [40, 49, 56, 41]], [[9350, 9350], "disallowed_STD3_mapped", [40, 49, 57, 41]], [[9351, 9351], "disallowed_STD3_mapped", [40, 50, 48, 41]], [[9352, 9371], "disallowed"], [[9372, 9372], "disallowed_STD3_mapped", [40, 97, 41]], [[9373, 9373], "disallowed_STD3_mapped", [40, 98, 41]], [[9374, 9374], "disallowed_STD3_mapped", [40, 99, 41]], [[9375, 9375], "disallowed_STD3_mapped", [40, 100, 41]], [[9376, 9376], "disallowed_STD3_mapped", [40, 101, 41]], [[9377, 9377], "disallowed_STD3_mapped", [40, 102, 41]], [[9378, 9378], "disallowed_STD3_mapped", [40, 103, 41]], [[9379, 9379], "disallowed_STD3_mapped", [40, 104, 41]], [[9380, 9380], "disallowed_STD3_mapped", [40, 105, 41]], [[9381, 9381], "disallowed_STD3_mapped", [40, 106, 41]], [[9382, 9382], "disallowed_STD3_mapped", [40, 107, 41]], [[9383, 9383], "disallowed_STD3_mapped", [40, 108, 41]], [[9384, 9384], "disallowed_STD3_mapped", [40, 109, 41]], [[9385, 9385], "disallowed_STD3_mapped", [40, 110, 41]], [[9386, 9386], "disallowed_STD3_mapped", [40, 111, 41]], [[9387, 9387], "disallowed_STD3_mapped", [40, 112, 41]], [[9388, 9388], "disallowed_STD3_mapped", [40, 113, 41]], [[9389, 9389], "disallowed_STD3_mapped", [40, 114, 41]], [[9390, 9390], "disallowed_STD3_mapped", [40, 115, 41]], [[9391, 9391], "disallowed_STD3_mapped", [40, 116, 41]], [[9392, 9392], "disallowed_STD3_mapped", [40, 117, 41]], [[9393, 9393], "disallowed_STD3_mapped", [40, 118, 41]], [[9394, 9394], "disallowed_STD3_mapped", [40, 119, 41]], [[9395, 9395], "disallowed_STD3_mapped", [40, 120, 41]], [[9396, 9396], "disallowed_STD3_mapped", [40, 121, 41]], [[9397, 9397], "disallowed_STD3_mapped", [40, 122, 41]], [[9398, 9398], "mapped", [97]], [[9399, 9399], "mapped", [98]], [[9400, 9400], "mapped", [99]], [[9401, 9401], "mapped", [100]], [[9402, 9402], "mapped", [101]], [[9403, 9403], "mapped", [102]], [[9404, 9404], "mapped", [103]], [[9405, 9405], "mapped", [104]], [[9406, 9406], "mapped", [105]], [[9407, 9407], "mapped", [106]], [[9408, 9408], "mapped", [107]], [[9409, 9409], "mapped", [108]], [[9410, 9410], "mapped", [109]], [[9411, 9411], "mapped", [110]], [[9412, 9412], "mapped", [111]], [[9413, 9413], "mapped", [112]], [[9414, 9414], "mapped", [113]], [[9415, 9415], "mapped", [114]], [[9416, 9416], "mapped", [115]], [[9417, 9417], "mapped", [116]], [[9418, 9418], "mapped", [117]], [[9419, 9419], "mapped", [118]], [[9420, 9420], "mapped", [119]], [[9421, 9421], "mapped", [120]], [[9422, 9422], "mapped", [121]], [[9423, 9423], "mapped", [122]], [[9424, 9424], "mapped", [97]], [[9425, 9425], "mapped", [98]], [[9426, 9426], "mapped", [99]], [[9427, 9427], "mapped", [100]], [[9428, 9428], "mapped", [101]], [[9429, 9429], "mapped", [102]], [[9430, 9430], "mapped", [103]], [[9431, 9431], "mapped", [104]], [[9432, 9432], "mapped", [105]], [[9433, 9433], "mapped", [106]], [[9434, 9434], "mapped", [107]], [[9435, 9435], "mapped", [108]], [[9436, 9436], "mapped", [109]], [[9437, 9437], "mapped", [110]], [[9438, 9438], "mapped", [111]], [[9439, 9439], "mapped", [112]], [[9440, 9440], "mapped", [113]], [[9441, 9441], "mapped", [114]], [[9442, 9442], "mapped", [115]], [[9443, 9443], "mapped", [116]], [[9444, 9444], "mapped", [117]], [[9445, 9445], "mapped", [118]], [[9446, 9446], "mapped", [119]], [[9447, 9447], "mapped", [120]], [[9448, 9448], "mapped", [121]], [[9449, 9449], "mapped", [122]], [[9450, 9450], "mapped", [48]], [[9451, 9470], "valid", [], "NV8"], [[9471, 9471], "valid", [], "NV8"], [[9472, 9621], "valid", [], "NV8"], [[9622, 9631], "valid", [], "NV8"], [[9632, 9711], "valid", [], "NV8"], [[9712, 9719], "valid", [], "NV8"], [[9720, 9727], "valid", [], "NV8"], [[9728, 9747], "valid", [], "NV8"], [[9748, 9749], "valid", [], "NV8"], [[9750, 9751], "valid", [], "NV8"], [[9752, 9752], "valid", [], "NV8"], [[9753, 9753], "valid", [], "NV8"], [[9754, 9839], "valid", [], "NV8"], [[9840, 9841], "valid", [], "NV8"], [[9842, 9853], "valid", [], "NV8"], [[9854, 9855], "valid", [], "NV8"], [[9856, 9865], "valid", [], "NV8"], [[9866, 9873], "valid", [], "NV8"], [[9874, 9884], "valid", [], "NV8"], [[9885, 9885], "valid", [], "NV8"], [[9886, 9887], "valid", [], "NV8"], [[9888, 9889], "valid", [], "NV8"], [[9890, 9905], "valid", [], "NV8"], [[9906, 9906], "valid", [], "NV8"], [[9907, 9916], "valid", [], "NV8"], [[9917, 9919], "valid", [], "NV8"], [[9920, 9923], "valid", [], "NV8"], [[9924, 9933], "valid", [], "NV8"], [[9934, 9934], "valid", [], "NV8"], [[9935, 9953], "valid", [], "NV8"], [[9954, 9954], "valid", [], "NV8"], [[9955, 9955], "valid", [], "NV8"], [[9956, 9959], "valid", [], "NV8"], [[9960, 9983], "valid", [], "NV8"], [[9984, 9984], "valid", [], "NV8"], [[9985, 9988], "valid", [], "NV8"], [[9989, 9989], "valid", [], "NV8"], [[9990, 9993], "valid", [], "NV8"], [[9994, 9995], "valid", [], "NV8"], [[9996, 10023], "valid", [], "NV8"], [[10024, 10024], "valid", [], "NV8"], [[10025, 10059], "valid", [], "NV8"], [[10060, 10060], "valid", [], "NV8"], [[10061, 10061], "valid", [], "NV8"], [[10062, 10062], "valid", [], "NV8"], [[10063, 10066], "valid", [], "NV8"], [[10067, 10069], "valid", [], "NV8"], [[10070, 10070], "valid", [], "NV8"], [[10071, 10071], "valid", [], "NV8"], [[10072, 10078], "valid", [], "NV8"], [[10079, 10080], "valid", [], "NV8"], [[10081, 10087], "valid", [], "NV8"], [[10088, 10101], "valid", [], "NV8"], [[10102, 10132], "valid", [], "NV8"], [[10133, 10135], "valid", [], "NV8"], [[10136, 10159], "valid", [], "NV8"], [[10160, 10160], "valid", [], "NV8"], [[10161, 10174], "valid", [], "NV8"], [[10175, 10175], "valid", [], "NV8"], [[10176, 10182], "valid", [], "NV8"], [[10183, 10186], "valid", [], "NV8"], [[10187, 10187], "valid", [], "NV8"], [[10188, 10188], "valid", [], "NV8"], [[10189, 10189], "valid", [], "NV8"], [[10190, 10191], "valid", [], "NV8"], [[10192, 10219], "valid", [], "NV8"], [[10220, 10223], "valid", [], "NV8"], [[10224, 10239], "valid", [], "NV8"], [[10240, 10495], "valid", [], "NV8"], [[10496, 10763], "valid", [], "NV8"], [[10764, 10764], "mapped", [8747, 8747, 8747, 8747]], [[10765, 10867], "valid", [], "NV8"], [[10868, 10868], "disallowed_STD3_mapped", [58, 58, 61]], [[10869, 10869], "disallowed_STD3_mapped", [61, 61]], [[10870, 10870], "disallowed_STD3_mapped", [61, 61, 61]], [[10871, 10971], "valid", [], "NV8"], [[10972, 10972], "mapped", [10973, 824]], [[10973, 11007], "valid", [], "NV8"], [[11008, 11021], "valid", [], "NV8"], [[11022, 11027], "valid", [], "NV8"], [[11028, 11034], "valid", [], "NV8"], [[11035, 11039], "valid", [], "NV8"], [[11040, 11043], "valid", [], "NV8"], [[11044, 11084], "valid", [], "NV8"], [[11085, 11087], "valid", [], "NV8"], [[11088, 11092], "valid", [], "NV8"], [[11093, 11097], "valid", [], "NV8"], [[11098, 11123], "valid", [], "NV8"], [[11124, 11125], "disallowed"], [[11126, 11157], "valid", [], "NV8"], [[11158, 11159], "disallowed"], [[11160, 11193], "valid", [], "NV8"], [[11194, 11196], "disallowed"], [[11197, 11208], "valid", [], "NV8"], [[11209, 11209], "disallowed"], [[11210, 11217], "valid", [], "NV8"], [[11218, 11243], "disallowed"], [[11244, 11247], "valid", [], "NV8"], [[11248, 11263], "disallowed"], [[11264, 11264], "mapped", [11312]], [[11265, 11265], "mapped", [11313]], [[11266, 11266], "mapped", [11314]], [[11267, 11267], "mapped", [11315]], [[11268, 11268], "mapped", [11316]], [[11269, 11269], "mapped", [11317]], [[11270, 11270], "mapped", [11318]], [[11271, 11271], "mapped", [11319]], [[11272, 11272], "mapped", [11320]], [[11273, 11273], "mapped", [11321]], [[11274, 11274], "mapped", [11322]], [[11275, 11275], "mapped", [11323]], [[11276, 11276], "mapped", [11324]], [[11277, 11277], "mapped", [11325]], [[11278, 11278], "mapped", [11326]], [[11279, 11279], "mapped", [11327]], [[11280, 11280], "mapped", [11328]], [[11281, 11281], "mapped", [11329]], [[11282, 11282], "mapped", [11330]], [[11283, 11283], "mapped", [11331]], [[11284, 11284], "mapped", [11332]], [[11285, 11285], "mapped", [11333]], [[11286, 11286], "mapped", [11334]], [[11287, 11287], "mapped", [11335]], [[11288, 11288], "mapped", [11336]], [[11289, 11289], "mapped", [11337]], [[11290, 11290], "mapped", [11338]], [[11291, 11291], "mapped", [11339]], [[11292, 11292], "mapped", [11340]], [[11293, 11293], "mapped", [11341]], [[11294, 11294], "mapped", [11342]], [[11295, 11295], "mapped", [11343]], [[11296, 11296], "mapped", [11344]], [[11297, 11297], "mapped", [11345]], [[11298, 11298], "mapped", [11346]], [[11299, 11299], "mapped", [11347]], [[11300, 11300], "mapped", [11348]], [[11301, 11301], "mapped", [11349]], [[11302, 11302], "mapped", [11350]], [[11303, 11303], "mapped", [11351]], [[11304, 11304], "mapped", [11352]], [[11305, 11305], "mapped", [11353]], [[11306, 11306], "mapped", [11354]], [[11307, 11307], "mapped", [11355]], [[11308, 11308], "mapped", [11356]], [[11309, 11309], "mapped", [11357]], [[11310, 11310], "mapped", [11358]], [[11311, 11311], "disallowed"], [[11312, 11358], "valid"], [[11359, 11359], "disallowed"], [[11360, 11360], "mapped", [11361]], [[11361, 11361], "valid"], [[11362, 11362], "mapped", [619]], [[11363, 11363], "mapped", [7549]], [[11364, 11364], "mapped", [637]], [[11365, 11366], "valid"], [[11367, 11367], "mapped", [11368]], [[11368, 11368], "valid"], [[11369, 11369], "mapped", [11370]], [[11370, 11370], "valid"], [[11371, 11371], "mapped", [11372]], [[11372, 11372], "valid"], [[11373, 11373], "mapped", [593]], [[11374, 11374], "mapped", [625]], [[11375, 11375], "mapped", [592]], [[11376, 11376], "mapped", [594]], [[11377, 11377], "valid"], [[11378, 11378], "mapped", [11379]], [[11379, 11379], "valid"], [[11380, 11380], "valid"], [[11381, 11381], "mapped", [11382]], [[11382, 11383], "valid"], [[11384, 11387], "valid"], [[11388, 11388], "mapped", [106]], [[11389, 11389], "mapped", [118]], [[11390, 11390], "mapped", [575]], [[11391, 11391], "mapped", [576]], [[11392, 11392], "mapped", [11393]], [[11393, 11393], "valid"], [[11394, 11394], "mapped", [11395]], [[11395, 11395], "valid"], [[11396, 11396], "mapped", [11397]], [[11397, 11397], "valid"], [[11398, 11398], "mapped", [11399]], [[11399, 11399], "valid"], [[11400, 11400], "mapped", [11401]], [[11401, 11401], "valid"], [[11402, 11402], "mapped", [11403]], [[11403, 11403], "valid"], [[11404, 11404], "mapped", [11405]], [[11405, 11405], "valid"], [[11406, 11406], "mapped", [11407]], [[11407, 11407], "valid"], [[11408, 11408], "mapped", [11409]], [[11409, 11409], "valid"], [[11410, 11410], "mapped", [11411]], [[11411, 11411], "valid"], [[11412, 11412], "mapped", [11413]], [[11413, 11413], "valid"], [[11414, 11414], "mapped", [11415]], [[11415, 11415], "valid"], [[11416, 11416], "mapped", [11417]], [[11417, 11417], "valid"], [[11418, 11418], "mapped", [11419]], [[11419, 11419], "valid"], [[11420, 11420], "mapped", [11421]], [[11421, 11421], "valid"], [[11422, 11422], "mapped", [11423]], [[11423, 11423], "valid"], [[11424, 11424], "mapped", [11425]], [[11425, 11425], "valid"], [[11426, 11426], "mapped", [11427]], [[11427, 11427], "valid"], [[11428, 11428], "mapped", [11429]], [[11429, 11429], "valid"], [[11430, 11430], "mapped", [11431]], [[11431, 11431], "valid"], [[11432, 11432], "mapped", [11433]], [[11433, 11433], "valid"], [[11434, 11434], "mapped", [11435]], [[11435, 11435], "valid"], [[11436, 11436], "mapped", [11437]], [[11437, 11437], "valid"], [[11438, 11438], "mapped", [11439]], [[11439, 11439], "valid"], [[11440, 11440], "mapped", [11441]], [[11441, 11441], "valid"], [[11442, 11442], "mapped", [11443]], [[11443, 11443], "valid"], [[11444, 11444], "mapped", [11445]], [[11445, 11445], "valid"], [[11446, 11446], "mapped", [11447]], [[11447, 11447], "valid"], [[11448, 11448], "mapped", [11449]], [[11449, 11449], "valid"], [[11450, 11450], "mapped", [11451]], [[11451, 11451], "valid"], [[11452, 11452], "mapped", [11453]], [[11453, 11453], "valid"], [[11454, 11454], "mapped", [11455]], [[11455, 11455], "valid"], [[11456, 11456], "mapped", [11457]], [[11457, 11457], "valid"], [[11458, 11458], "mapped", [11459]], [[11459, 11459], "valid"], [[11460, 11460], "mapped", [11461]], [[11461, 11461], "valid"], [[11462, 11462], "mapped", [11463]], [[11463, 11463], "valid"], [[11464, 11464], "mapped", [11465]], [[11465, 11465], "valid"], [[11466, 11466], "mapped", [11467]], [[11467, 11467], "valid"], [[11468, 11468], "mapped", [11469]], [[11469, 11469], "valid"], [[11470, 11470], "mapped", [11471]], [[11471, 11471], "valid"], [[11472, 11472], "mapped", [11473]], [[11473, 11473], "valid"], [[11474, 11474], "mapped", [11475]], [[11475, 11475], "valid"], [[11476, 11476], "mapped", [11477]], [[11477, 11477], "valid"], [[11478, 11478], "mapped", [11479]], [[11479, 11479], "valid"], [[11480, 11480], "mapped", [11481]], [[11481, 11481], "valid"], [[11482, 11482], "mapped", [11483]], [[11483, 11483], "valid"], [[11484, 11484], "mapped", [11485]], [[11485, 11485], "valid"], [[11486, 11486], "mapped", [11487]], [[11487, 11487], "valid"], [[11488, 11488], "mapped", [11489]], [[11489, 11489], "valid"], [[11490, 11490], "mapped", [11491]], [[11491, 11492], "valid"], [[11493, 11498], "valid", [], "NV8"], [[11499, 11499], "mapped", [11500]], [[11500, 11500], "valid"], [[11501, 11501], "mapped", [11502]], [[11502, 11505], "valid"], [[11506, 11506], "mapped", [11507]], [[11507, 11507], "valid"], [[11508, 11512], "disallowed"], [[11513, 11519], "valid", [], "NV8"], [[11520, 11557], "valid"], [[11558, 11558], "disallowed"], [[11559, 11559], "valid"], [[11560, 11564], "disallowed"], [[11565, 11565], "valid"], [[11566, 11567], "disallowed"], [[11568, 11621], "valid"], [[11622, 11623], "valid"], [[11624, 11630], "disallowed"], [[11631, 11631], "mapped", [11617]], [[11632, 11632], "valid", [], "NV8"], [[11633, 11646], "disallowed"], [[11647, 11647], "valid"], [[11648, 11670], "valid"], [[11671, 11679], "disallowed"], [[11680, 11686], "valid"], [[11687, 11687], "disallowed"], [[11688, 11694], "valid"], [[11695, 11695], "disallowed"], [[11696, 11702], "valid"], [[11703, 11703], "disallowed"], [[11704, 11710], "valid"], [[11711, 11711], "disallowed"], [[11712, 11718], "valid"], [[11719, 11719], "disallowed"], [[11720, 11726], "valid"], [[11727, 11727], "disallowed"], [[11728, 11734], "valid"], [[11735, 11735], "disallowed"], [[11736, 11742], "valid"], [[11743, 11743], "disallowed"], [[11744, 11775], "valid"], [[11776, 11799], "valid", [], "NV8"], [[11800, 11803], "valid", [], "NV8"], [[11804, 11805], "valid", [], "NV8"], [[11806, 11822], "valid", [], "NV8"], [[11823, 11823], "valid"], [[11824, 11824], "valid", [], "NV8"], [[11825, 11825], "valid", [], "NV8"], [[11826, 11835], "valid", [], "NV8"], [[11836, 11842], "valid", [], "NV8"], [[11843, 11903], "disallowed"], [[11904, 11929], "valid", [], "NV8"], [[11930, 11930], "disallowed"], [[11931, 11934], "valid", [], "NV8"], [[11935, 11935], "mapped", [27597]], [[11936, 12018], "valid", [], "NV8"], [[12019, 12019], "mapped", [40863]], [[12020, 12031], "disallowed"], [[12032, 12032], "mapped", [19968]], [[12033, 12033], "mapped", [20008]], [[12034, 12034], "mapped", [20022]], [[12035, 12035], "mapped", [20031]], [[12036, 12036], "mapped", [20057]], [[12037, 12037], "mapped", [20101]], [[12038, 12038], "mapped", [20108]], [[12039, 12039], "mapped", [20128]], [[12040, 12040], "mapped", [20154]], [[12041, 12041], "mapped", [20799]], [[12042, 12042], "mapped", [20837]], [[12043, 12043], "mapped", [20843]], [[12044, 12044], "mapped", [20866]], [[12045, 12045], "mapped", [20886]], [[12046, 12046], "mapped", [20907]], [[12047, 12047], "mapped", [20960]], [[12048, 12048], "mapped", [20981]], [[12049, 12049], "mapped", [20992]], [[12050, 12050], "mapped", [21147]], [[12051, 12051], "mapped", [21241]], [[12052, 12052], "mapped", [21269]], [[12053, 12053], "mapped", [21274]], [[12054, 12054], "mapped", [21304]], [[12055, 12055], "mapped", [21313]], [[12056, 12056], "mapped", [21340]], [[12057, 12057], "mapped", [21353]], [[12058, 12058], "mapped", [21378]], [[12059, 12059], "mapped", [21430]], [[12060, 12060], "mapped", [21448]], [[12061, 12061], "mapped", [21475]], [[12062, 12062], "mapped", [22231]], [[12063, 12063], "mapped", [22303]], [[12064, 12064], "mapped", [22763]], [[12065, 12065], "mapped", [22786]], [[12066, 12066], "mapped", [22794]], [[12067, 12067], "mapped", [22805]], [[12068, 12068], "mapped", [22823]], [[12069, 12069], "mapped", [22899]], [[12070, 12070], "mapped", [23376]], [[12071, 12071], "mapped", [23424]], [[12072, 12072], "mapped", [23544]], [[12073, 12073], "mapped", [23567]], [[12074, 12074], "mapped", [23586]], [[12075, 12075], "mapped", [23608]], [[12076, 12076], "mapped", [23662]], [[12077, 12077], "mapped", [23665]], [[12078, 12078], "mapped", [24027]], [[12079, 12079], "mapped", [24037]], [[12080, 12080], "mapped", [24049]], [[12081, 12081], "mapped", [24062]], [[12082, 12082], "mapped", [24178]], [[12083, 12083], "mapped", [24186]], [[12084, 12084], "mapped", [24191]], [[12085, 12085], "mapped", [24308]], [[12086, 12086], "mapped", [24318]], [[12087, 12087], "mapped", [24331]], [[12088, 12088], "mapped", [24339]], [[12089, 12089], "mapped", [24400]], [[12090, 12090], "mapped", [24417]], [[12091, 12091], "mapped", [24435]], [[12092, 12092], "mapped", [24515]], [[12093, 12093], "mapped", [25096]], [[12094, 12094], "mapped", [25142]], [[12095, 12095], "mapped", [25163]], [[12096, 12096], "mapped", [25903]], [[12097, 12097], "mapped", [25908]], [[12098, 12098], "mapped", [25991]], [[12099, 12099], "mapped", [26007]], [[12100, 12100], "mapped", [26020]], [[12101, 12101], "mapped", [26041]], [[12102, 12102], "mapped", [26080]], [[12103, 12103], "mapped", [26085]], [[12104, 12104], "mapped", [26352]], [[12105, 12105], "mapped", [26376]], [[12106, 12106], "mapped", [26408]], [[12107, 12107], "mapped", [27424]], [[12108, 12108], "mapped", [27490]], [[12109, 12109], "mapped", [27513]], [[12110, 12110], "mapped", [27571]], [[12111, 12111], "mapped", [27595]], [[12112, 12112], "mapped", [27604]], [[12113, 12113], "mapped", [27611]], [[12114, 12114], "mapped", [27663]], [[12115, 12115], "mapped", [27668]], [[12116, 12116], "mapped", [27700]], [[12117, 12117], "mapped", [28779]], [[12118, 12118], "mapped", [29226]], [[12119, 12119], "mapped", [29238]], [[12120, 12120], "mapped", [29243]], [[12121, 12121], "mapped", [29247]], [[12122, 12122], "mapped", [29255]], [[12123, 12123], "mapped", [29273]], [[12124, 12124], "mapped", [29275]], [[12125, 12125], "mapped", [29356]], [[12126, 12126], "mapped", [29572]], [[12127, 12127], "mapped", [29577]], [[12128, 12128], "mapped", [29916]], [[12129, 12129], "mapped", [29926]], [[12130, 12130], "mapped", [29976]], [[12131, 12131], "mapped", [29983]], [[12132, 12132], "mapped", [29992]], [[12133, 12133], "mapped", [3e4]], [[12134, 12134], "mapped", [30091]], [[12135, 12135], "mapped", [30098]], [[12136, 12136], "mapped", [30326]], [[12137, 12137], "mapped", [30333]], [[12138, 12138], "mapped", [30382]], [[12139, 12139], "mapped", [30399]], [[12140, 12140], "mapped", [30446]], [[12141, 12141], "mapped", [30683]], [[12142, 12142], "mapped", [30690]], [[12143, 12143], "mapped", [30707]], [[12144, 12144], "mapped", [31034]], [[12145, 12145], "mapped", [31160]], [[12146, 12146], "mapped", [31166]], [[12147, 12147], "mapped", [31348]], [[12148, 12148], "mapped", [31435]], [[12149, 12149], "mapped", [31481]], [[12150, 12150], "mapped", [31859]], [[12151, 12151], "mapped", [31992]], [[12152, 12152], "mapped", [32566]], [[12153, 12153], "mapped", [32593]], [[12154, 12154], "mapped", [32650]], [[12155, 12155], "mapped", [32701]], [[12156, 12156], "mapped", [32769]], [[12157, 12157], "mapped", [32780]], [[12158, 12158], "mapped", [32786]], [[12159, 12159], "mapped", [32819]], [[12160, 12160], "mapped", [32895]], [[12161, 12161], "mapped", [32905]], [[12162, 12162], "mapped", [33251]], [[12163, 12163], "mapped", [33258]], [[12164, 12164], "mapped", [33267]], [[12165, 12165], "mapped", [33276]], [[12166, 12166], "mapped", [33292]], [[12167, 12167], "mapped", [33307]], [[12168, 12168], "mapped", [33311]], [[12169, 12169], "mapped", [33390]], [[12170, 12170], "mapped", [33394]], [[12171, 12171], "mapped", [33400]], [[12172, 12172], "mapped", [34381]], [[12173, 12173], "mapped", [34411]], [[12174, 12174], "mapped", [34880]], [[12175, 12175], "mapped", [34892]], [[12176, 12176], "mapped", [34915]], [[12177, 12177], "mapped", [35198]], [[12178, 12178], "mapped", [35211]], [[12179, 12179], "mapped", [35282]], [[12180, 12180], "mapped", [35328]], [[12181, 12181], "mapped", [35895]], [[12182, 12182], "mapped", [35910]], [[12183, 12183], "mapped", [35925]], [[12184, 12184], "mapped", [35960]], [[12185, 12185], "mapped", [35997]], [[12186, 12186], "mapped", [36196]], [[12187, 12187], "mapped", [36208]], [[12188, 12188], "mapped", [36275]], [[12189, 12189], "mapped", [36523]], [[12190, 12190], "mapped", [36554]], [[12191, 12191], "mapped", [36763]], [[12192, 12192], "mapped", [36784]], [[12193, 12193], "mapped", [36789]], [[12194, 12194], "mapped", [37009]], [[12195, 12195], "mapped", [37193]], [[12196, 12196], "mapped", [37318]], [[12197, 12197], "mapped", [37324]], [[12198, 12198], "mapped", [37329]], [[12199, 12199], "mapped", [38263]], [[12200, 12200], "mapped", [38272]], [[12201, 12201], "mapped", [38428]], [[12202, 12202], "mapped", [38582]], [[12203, 12203], "mapped", [38585]], [[12204, 12204], "mapped", [38632]], [[12205, 12205], "mapped", [38737]], [[12206, 12206], "mapped", [38750]], [[12207, 12207], "mapped", [38754]], [[12208, 12208], "mapped", [38761]], [[12209, 12209], "mapped", [38859]], [[12210, 12210], "mapped", [38893]], [[12211, 12211], "mapped", [38899]], [[12212, 12212], "mapped", [38913]], [[12213, 12213], "mapped", [39080]], [[12214, 12214], "mapped", [39131]], [[12215, 12215], "mapped", [39135]], [[12216, 12216], "mapped", [39318]], [[12217, 12217], "mapped", [39321]], [[12218, 12218], "mapped", [39340]], [[12219, 12219], "mapped", [39592]], [[12220, 12220], "mapped", [39640]], [[12221, 12221], "mapped", [39647]], [[12222, 12222], "mapped", [39717]], [[12223, 12223], "mapped", [39727]], [[12224, 12224], "mapped", [39730]], [[12225, 12225], "mapped", [39740]], [[12226, 12226], "mapped", [39770]], [[12227, 12227], "mapped", [40165]], [[12228, 12228], "mapped", [40565]], [[12229, 12229], "mapped", [40575]], [[12230, 12230], "mapped", [40613]], [[12231, 12231], "mapped", [40635]], [[12232, 12232], "mapped", [40643]], [[12233, 12233], "mapped", [40653]], [[12234, 12234], "mapped", [40657]], [[12235, 12235], "mapped", [40697]], [[12236, 12236], "mapped", [40701]], [[12237, 12237], "mapped", [40718]], [[12238, 12238], "mapped", [40723]], [[12239, 12239], "mapped", [40736]], [[12240, 12240], "mapped", [40763]], [[12241, 12241], "mapped", [40778]], [[12242, 12242], "mapped", [40786]], [[12243, 12243], "mapped", [40845]], [[12244, 12244], "mapped", [40860]], [[12245, 12245], "mapped", [40864]], [[12246, 12271], "disallowed"], [[12272, 12283], "disallowed"], [[12284, 12287], "disallowed"], [[12288, 12288], "disallowed_STD3_mapped", [32]], [[12289, 12289], "valid", [], "NV8"], [[12290, 12290], "mapped", [46]], [[12291, 12292], "valid", [], "NV8"], [[12293, 12295], "valid"], [[12296, 12329], "valid", [], "NV8"], [[12330, 12333], "valid"], [[12334, 12341], "valid", [], "NV8"], [[12342, 12342], "mapped", [12306]], [[12343, 12343], "valid", [], "NV8"], [[12344, 12344], "mapped", [21313]], [[12345, 12345], "mapped", [21316]], [[12346, 12346], "mapped", [21317]], [[12347, 12347], "valid", [], "NV8"], [[12348, 12348], "valid"], [[12349, 12349], "valid", [], "NV8"], [[12350, 12350], "valid", [], "NV8"], [[12351, 12351], "valid", [], "NV8"], [[12352, 12352], "disallowed"], [[12353, 12436], "valid"], [[12437, 12438], "valid"], [[12439, 12440], "disallowed"], [[12441, 12442], "valid"], [[12443, 12443], "disallowed_STD3_mapped", [32, 12441]], [[12444, 12444], "disallowed_STD3_mapped", [32, 12442]], [[12445, 12446], "valid"], [[12447, 12447], "mapped", [12424, 12426]], [[12448, 12448], "valid", [], "NV8"], [[12449, 12542], "valid"], [[12543, 12543], "mapped", [12467, 12488]], [[12544, 12548], "disallowed"], [[12549, 12588], "valid"], [[12589, 12589], "valid"], [[12590, 12592], "disallowed"], [[12593, 12593], "mapped", [4352]], [[12594, 12594], "mapped", [4353]], [[12595, 12595], "mapped", [4522]], [[12596, 12596], "mapped", [4354]], [[12597, 12597], "mapped", [4524]], [[12598, 12598], "mapped", [4525]], [[12599, 12599], "mapped", [4355]], [[12600, 12600], "mapped", [4356]], [[12601, 12601], "mapped", [4357]], [[12602, 12602], "mapped", [4528]], [[12603, 12603], "mapped", [4529]], [[12604, 12604], "mapped", [4530]], [[12605, 12605], "mapped", [4531]], [[12606, 12606], "mapped", [4532]], [[12607, 12607], "mapped", [4533]], [[12608, 12608], "mapped", [4378]], [[12609, 12609], "mapped", [4358]], [[12610, 12610], "mapped", [4359]], [[12611, 12611], "mapped", [4360]], [[12612, 12612], "mapped", [4385]], [[12613, 12613], "mapped", [4361]], [[12614, 12614], "mapped", [4362]], [[12615, 12615], "mapped", [4363]], [[12616, 12616], "mapped", [4364]], [[12617, 12617], "mapped", [4365]], [[12618, 12618], "mapped", [4366]], [[12619, 12619], "mapped", [4367]], [[12620, 12620], "mapped", [4368]], [[12621, 12621], "mapped", [4369]], [[12622, 12622], "mapped", [4370]], [[12623, 12623], "mapped", [4449]], [[12624, 12624], "mapped", [4450]], [[12625, 12625], "mapped", [4451]], [[12626, 12626], "mapped", [4452]], [[12627, 12627], "mapped", [4453]], [[12628, 12628], "mapped", [4454]], [[12629, 12629], "mapped", [4455]], [[12630, 12630], "mapped", [4456]], [[12631, 12631], "mapped", [4457]], [[12632, 12632], "mapped", [4458]], [[12633, 12633], "mapped", [4459]], [[12634, 12634], "mapped", [4460]], [[12635, 12635], "mapped", [4461]], [[12636, 12636], "mapped", [4462]], [[12637, 12637], "mapped", [4463]], [[12638, 12638], "mapped", [4464]], [[12639, 12639], "mapped", [4465]], [[12640, 12640], "mapped", [4466]], [[12641, 12641], "mapped", [4467]], [[12642, 12642], "mapped", [4468]], [[12643, 12643], "mapped", [4469]], [[12644, 12644], "disallowed"], [[12645, 12645], "mapped", [4372]], [[12646, 12646], "mapped", [4373]], [[12647, 12647], "mapped", [4551]], [[12648, 12648], "mapped", [4552]], [[12649, 12649], "mapped", [4556]], [[12650, 12650], "mapped", [4558]], [[12651, 12651], "mapped", [4563]], [[12652, 12652], "mapped", [4567]], [[12653, 12653], "mapped", [4569]], [[12654, 12654], "mapped", [4380]], [[12655, 12655], "mapped", [4573]], [[12656, 12656], "mapped", [4575]], [[12657, 12657], "mapped", [4381]], [[12658, 12658], "mapped", [4382]], [[12659, 12659], "mapped", [4384]], [[12660, 12660], "mapped", [4386]], [[12661, 12661], "mapped", [4387]], [[12662, 12662], "mapped", [4391]], [[12663, 12663], "mapped", [4393]], [[12664, 12664], "mapped", [4395]], [[12665, 12665], "mapped", [4396]], [[12666, 12666], "mapped", [4397]], [[12667, 12667], "mapped", [4398]], [[12668, 12668], "mapped", [4399]], [[12669, 12669], "mapped", [4402]], [[12670, 12670], "mapped", [4406]], [[12671, 12671], "mapped", [4416]], [[12672, 12672], "mapped", [4423]], [[12673, 12673], "mapped", [4428]], [[12674, 12674], "mapped", [4593]], [[12675, 12675], "mapped", [4594]], [[12676, 12676], "mapped", [4439]], [[12677, 12677], "mapped", [4440]], [[12678, 12678], "mapped", [4441]], [[12679, 12679], "mapped", [4484]], [[12680, 12680], "mapped", [4485]], [[12681, 12681], "mapped", [4488]], [[12682, 12682], "mapped", [4497]], [[12683, 12683], "mapped", [4498]], [[12684, 12684], "mapped", [4500]], [[12685, 12685], "mapped", [4510]], [[12686, 12686], "mapped", [4513]], [[12687, 12687], "disallowed"], [[12688, 12689], "valid", [], "NV8"], [[12690, 12690], "mapped", [19968]], [[12691, 12691], "mapped", [20108]], [[12692, 12692], "mapped", [19977]], [[12693, 12693], "mapped", [22235]], [[12694, 12694], "mapped", [19978]], [[12695, 12695], "mapped", [20013]], [[12696, 12696], "mapped", [19979]], [[12697, 12697], "mapped", [30002]], [[12698, 12698], "mapped", [20057]], [[12699, 12699], "mapped", [19993]], [[12700, 12700], "mapped", [19969]], [[12701, 12701], "mapped", [22825]], [[12702, 12702], "mapped", [22320]], [[12703, 12703], "mapped", [20154]], [[12704, 12727], "valid"], [[12728, 12730], "valid"], [[12731, 12735], "disallowed"], [[12736, 12751], "valid", [], "NV8"], [[12752, 12771], "valid", [], "NV8"], [[12772, 12783], "disallowed"], [[12784, 12799], "valid"], [[12800, 12800], "disallowed_STD3_mapped", [40, 4352, 41]], [[12801, 12801], "disallowed_STD3_mapped", [40, 4354, 41]], [[12802, 12802], "disallowed_STD3_mapped", [40, 4355, 41]], [[12803, 12803], "disallowed_STD3_mapped", [40, 4357, 41]], [[12804, 12804], "disallowed_STD3_mapped", [40, 4358, 41]], [[12805, 12805], "disallowed_STD3_mapped", [40, 4359, 41]], [[12806, 12806], "disallowed_STD3_mapped", [40, 4361, 41]], [[12807, 12807], "disallowed_STD3_mapped", [40, 4363, 41]], [[12808, 12808], "disallowed_STD3_mapped", [40, 4364, 41]], [[12809, 12809], "disallowed_STD3_mapped", [40, 4366, 41]], [[12810, 12810], "disallowed_STD3_mapped", [40, 4367, 41]], [[12811, 12811], "disallowed_STD3_mapped", [40, 4368, 41]], [[12812, 12812], "disallowed_STD3_mapped", [40, 4369, 41]], [[12813, 12813], "disallowed_STD3_mapped", [40, 4370, 41]], [[12814, 12814], "disallowed_STD3_mapped", [40, 44032, 41]], [[12815, 12815], "disallowed_STD3_mapped", [40, 45208, 41]], [[12816, 12816], "disallowed_STD3_mapped", [40, 45796, 41]], [[12817, 12817], "disallowed_STD3_mapped", [40, 46972, 41]], [[12818, 12818], "disallowed_STD3_mapped", [40, 47560, 41]], [[12819, 12819], "disallowed_STD3_mapped", [40, 48148, 41]], [[12820, 12820], "disallowed_STD3_mapped", [40, 49324, 41]], [[12821, 12821], "disallowed_STD3_mapped", [40, 50500, 41]], [[12822, 12822], "disallowed_STD3_mapped", [40, 51088, 41]], [[12823, 12823], "disallowed_STD3_mapped", [40, 52264, 41]], [[12824, 12824], "disallowed_STD3_mapped", [40, 52852, 41]], [[12825, 12825], "disallowed_STD3_mapped", [40, 53440, 41]], [[12826, 12826], "disallowed_STD3_mapped", [40, 54028, 41]], [[12827, 12827], "disallowed_STD3_mapped", [40, 54616, 41]], [[12828, 12828], "disallowed_STD3_mapped", [40, 51452, 41]], [[12829, 12829], "disallowed_STD3_mapped", [40, 50724, 51204, 41]], [[12830, 12830], "disallowed_STD3_mapped", [40, 50724, 54980, 41]], [[12831, 12831], "disallowed"], [[12832, 12832], "disallowed_STD3_mapped", [40, 19968, 41]], [[12833, 12833], "disallowed_STD3_mapped", [40, 20108, 41]], [[12834, 12834], "disallowed_STD3_mapped", [40, 19977, 41]], [[12835, 12835], "disallowed_STD3_mapped", [40, 22235, 41]], [[12836, 12836], "disallowed_STD3_mapped", [40, 20116, 41]], [[12837, 12837], "disallowed_STD3_mapped", [40, 20845, 41]], [[12838, 12838], "disallowed_STD3_mapped", [40, 19971, 41]], [[12839, 12839], "disallowed_STD3_mapped", [40, 20843, 41]], [[12840, 12840], "disallowed_STD3_mapped", [40, 20061, 41]], [[12841, 12841], "disallowed_STD3_mapped", [40, 21313, 41]], [[12842, 12842], "disallowed_STD3_mapped", [40, 26376, 41]], [[12843, 12843], "disallowed_STD3_mapped", [40, 28779, 41]], [[12844, 12844], "disallowed_STD3_mapped", [40, 27700, 41]], [[12845, 12845], "disallowed_STD3_mapped", [40, 26408, 41]], [[12846, 12846], "disallowed_STD3_mapped", [40, 37329, 41]], [[12847, 12847], "disallowed_STD3_mapped", [40, 22303, 41]], [[12848, 12848], "disallowed_STD3_mapped", [40, 26085, 41]], [[12849, 12849], "disallowed_STD3_mapped", [40, 26666, 41]], [[12850, 12850], "disallowed_STD3_mapped", [40, 26377, 41]], [[12851, 12851], "disallowed_STD3_mapped", [40, 31038, 41]], [[12852, 12852], "disallowed_STD3_mapped", [40, 21517, 41]], [[12853, 12853], "disallowed_STD3_mapped", [40, 29305, 41]], [[12854, 12854], "disallowed_STD3_mapped", [40, 36001, 41]], [[12855, 12855], "disallowed_STD3_mapped", [40, 31069, 41]], [[12856, 12856], "disallowed_STD3_mapped", [40, 21172, 41]], [[12857, 12857], "disallowed_STD3_mapped", [40, 20195, 41]], [[12858, 12858], "disallowed_STD3_mapped", [40, 21628, 41]], [[12859, 12859], "disallowed_STD3_mapped", [40, 23398, 41]], [[12860, 12860], "disallowed_STD3_mapped", [40, 30435, 41]], [[12861, 12861], "disallowed_STD3_mapped", [40, 20225, 41]], [[12862, 12862], "disallowed_STD3_mapped", [40, 36039, 41]], [[12863, 12863], "disallowed_STD3_mapped", [40, 21332, 41]], [[12864, 12864], "disallowed_STD3_mapped", [40, 31085, 41]], [[12865, 12865], "disallowed_STD3_mapped", [40, 20241, 41]], [[12866, 12866], "disallowed_STD3_mapped", [40, 33258, 41]], [[12867, 12867], "disallowed_STD3_mapped", [40, 33267, 41]], [[12868, 12868], "mapped", [21839]], [[12869, 12869], "mapped", [24188]], [[12870, 12870], "mapped", [25991]], [[12871, 12871], "mapped", [31631]], [[12872, 12879], "valid", [], "NV8"], [[12880, 12880], "mapped", [112, 116, 101]], [[12881, 12881], "mapped", [50, 49]], [[12882, 12882], "mapped", [50, 50]], [[12883, 12883], "mapped", [50, 51]], [[12884, 12884], "mapped", [50, 52]], [[12885, 12885], "mapped", [50, 53]], [[12886, 12886], "mapped", [50, 54]], [[12887, 12887], "mapped", [50, 55]], [[12888, 12888], "mapped", [50, 56]], [[12889, 12889], "mapped", [50, 57]], [[12890, 12890], "mapped", [51, 48]], [[12891, 12891], "mapped", [51, 49]], [[12892, 12892], "mapped", [51, 50]], [[12893, 12893], "mapped", [51, 51]], [[12894, 12894], "mapped", [51, 52]], [[12895, 12895], "mapped", [51, 53]], [[12896, 12896], "mapped", [4352]], [[12897, 12897], "mapped", [4354]], [[12898, 12898], "mapped", [4355]], [[12899, 12899], "mapped", [4357]], [[12900, 12900], "mapped", [4358]], [[12901, 12901], "mapped", [4359]], [[12902, 12902], "mapped", [4361]], [[12903, 12903], "mapped", [4363]], [[12904, 12904], "mapped", [4364]], [[12905, 12905], "mapped", [4366]], [[12906, 12906], "mapped", [4367]], [[12907, 12907], "mapped", [4368]], [[12908, 12908], "mapped", [4369]], [[12909, 12909], "mapped", [4370]], [[12910, 12910], "mapped", [44032]], [[12911, 12911], "mapped", [45208]], [[12912, 12912], "mapped", [45796]], [[12913, 12913], "mapped", [46972]], [[12914, 12914], "mapped", [47560]], [[12915, 12915], "mapped", [48148]], [[12916, 12916], "mapped", [49324]], [[12917, 12917], "mapped", [50500]], [[12918, 12918], "mapped", [51088]], [[12919, 12919], "mapped", [52264]], [[12920, 12920], "mapped", [52852]], [[12921, 12921], "mapped", [53440]], [[12922, 12922], "mapped", [54028]], [[12923, 12923], "mapped", [54616]], [[12924, 12924], "mapped", [52280, 44256]], [[12925, 12925], "mapped", [51452, 51032]], [[12926, 12926], "mapped", [50864]], [[12927, 12927], "valid", [], "NV8"], [[12928, 12928], "mapped", [19968]], [[12929, 12929], "mapped", [20108]], [[12930, 12930], "mapped", [19977]], [[12931, 12931], "mapped", [22235]], [[12932, 12932], "mapped", [20116]], [[12933, 12933], "mapped", [20845]], [[12934, 12934], "mapped", [19971]], [[12935, 12935], "mapped", [20843]], [[12936, 12936], "mapped", [20061]], [[12937, 12937], "mapped", [21313]], [[12938, 12938], "mapped", [26376]], [[12939, 12939], "mapped", [28779]], [[12940, 12940], "mapped", [27700]], [[12941, 12941], "mapped", [26408]], [[12942, 12942], "mapped", [37329]], [[12943, 12943], "mapped", [22303]], [[12944, 12944], "mapped", [26085]], [[12945, 12945], "mapped", [26666]], [[12946, 12946], "mapped", [26377]], [[12947, 12947], "mapped", [31038]], [[12948, 12948], "mapped", [21517]], [[12949, 12949], "mapped", [29305]], [[12950, 12950], "mapped", [36001]], [[12951, 12951], "mapped", [31069]], [[12952, 12952], "mapped", [21172]], [[12953, 12953], "mapped", [31192]], [[12954, 12954], "mapped", [30007]], [[12955, 12955], "mapped", [22899]], [[12956, 12956], "mapped", [36969]], [[12957, 12957], "mapped", [20778]], [[12958, 12958], "mapped", [21360]], [[12959, 12959], "mapped", [27880]], [[12960, 12960], "mapped", [38917]], [[12961, 12961], "mapped", [20241]], [[12962, 12962], "mapped", [20889]], [[12963, 12963], "mapped", [27491]], [[12964, 12964], "mapped", [19978]], [[12965, 12965], "mapped", [20013]], [[12966, 12966], "mapped", [19979]], [[12967, 12967], "mapped", [24038]], [[12968, 12968], "mapped", [21491]], [[12969, 12969], "mapped", [21307]], [[12970, 12970], "mapped", [23447]], [[12971, 12971], "mapped", [23398]], [[12972, 12972], "mapped", [30435]], [[12973, 12973], "mapped", [20225]], [[12974, 12974], "mapped", [36039]], [[12975, 12975], "mapped", [21332]], [[12976, 12976], "mapped", [22812]], [[12977, 12977], "mapped", [51, 54]], [[12978, 12978], "mapped", [51, 55]], [[12979, 12979], "mapped", [51, 56]], [[12980, 12980], "mapped", [51, 57]], [[12981, 12981], "mapped", [52, 48]], [[12982, 12982], "mapped", [52, 49]], [[12983, 12983], "mapped", [52, 50]], [[12984, 12984], "mapped", [52, 51]], [[12985, 12985], "mapped", [52, 52]], [[12986, 12986], "mapped", [52, 53]], [[12987, 12987], "mapped", [52, 54]], [[12988, 12988], "mapped", [52, 55]], [[12989, 12989], "mapped", [52, 56]], [[12990, 12990], "mapped", [52, 57]], [[12991, 12991], "mapped", [53, 48]], [[12992, 12992], "mapped", [49, 26376]], [[12993, 12993], "mapped", [50, 26376]], [[12994, 12994], "mapped", [51, 26376]], [[12995, 12995], "mapped", [52, 26376]], [[12996, 12996], "mapped", [53, 26376]], [[12997, 12997], "mapped", [54, 26376]], [[12998, 12998], "mapped", [55, 26376]], [[12999, 12999], "mapped", [56, 26376]], [[13e3, 13e3], "mapped", [57, 26376]], [[13001, 13001], "mapped", [49, 48, 26376]], [[13002, 13002], "mapped", [49, 49, 26376]], [[13003, 13003], "mapped", [49, 50, 26376]], [[13004, 13004], "mapped", [104, 103]], [[13005, 13005], "mapped", [101, 114, 103]], [[13006, 13006], "mapped", [101, 118]], [[13007, 13007], "mapped", [108, 116, 100]], [[13008, 13008], "mapped", [12450]], [[13009, 13009], "mapped", [12452]], [[13010, 13010], "mapped", [12454]], [[13011, 13011], "mapped", [12456]], [[13012, 13012], "mapped", [12458]], [[13013, 13013], "mapped", [12459]], [[13014, 13014], "mapped", [12461]], [[13015, 13015], "mapped", [12463]], [[13016, 13016], "mapped", [12465]], [[13017, 13017], "mapped", [12467]], [[13018, 13018], "mapped", [12469]], [[13019, 13019], "mapped", [12471]], [[13020, 13020], "mapped", [12473]], [[13021, 13021], "mapped", [12475]], [[13022, 13022], "mapped", [12477]], [[13023, 13023], "mapped", [12479]], [[13024, 13024], "mapped", [12481]], [[13025, 13025], "mapped", [12484]], [[13026, 13026], "mapped", [12486]], [[13027, 13027], "mapped", [12488]], [[13028, 13028], "mapped", [12490]], [[13029, 13029], "mapped", [12491]], [[13030, 13030], "mapped", [12492]], [[13031, 13031], "mapped", [12493]], [[13032, 13032], "mapped", [12494]], [[13033, 13033], "mapped", [12495]], [[13034, 13034], "mapped", [12498]], [[13035, 13035], "mapped", [12501]], [[13036, 13036], "mapped", [12504]], [[13037, 13037], "mapped", [12507]], [[13038, 13038], "mapped", [12510]], [[13039, 13039], "mapped", [12511]], [[13040, 13040], "mapped", [12512]], [[13041, 13041], "mapped", [12513]], [[13042, 13042], "mapped", [12514]], [[13043, 13043], "mapped", [12516]], [[13044, 13044], "mapped", [12518]], [[13045, 13045], "mapped", [12520]], [[13046, 13046], "mapped", [12521]], [[13047, 13047], "mapped", [12522]], [[13048, 13048], "mapped", [12523]], [[13049, 13049], "mapped", [12524]], [[13050, 13050], "mapped", [12525]], [[13051, 13051], "mapped", [12527]], [[13052, 13052], "mapped", [12528]], [[13053, 13053], "mapped", [12529]], [[13054, 13054], "mapped", [12530]], [[13055, 13055], "disallowed"], [[13056, 13056], "mapped", [12450, 12497, 12540, 12488]], [[13057, 13057], "mapped", [12450, 12523, 12501, 12449]], [[13058, 13058], "mapped", [12450, 12531, 12506, 12450]], [[13059, 13059], "mapped", [12450, 12540, 12523]], [[13060, 13060], "mapped", [12452, 12491, 12531, 12464]], [[13061, 13061], "mapped", [12452, 12531, 12481]], [[13062, 13062], "mapped", [12454, 12457, 12531]], [[13063, 13063], "mapped", [12456, 12473, 12463, 12540, 12489]], [[13064, 13064], "mapped", [12456, 12540, 12459, 12540]], [[13065, 13065], "mapped", [12458, 12531, 12473]], [[13066, 13066], "mapped", [12458, 12540, 12512]], [[13067, 13067], "mapped", [12459, 12452, 12522]], [[13068, 13068], "mapped", [12459, 12521, 12483, 12488]], [[13069, 13069], "mapped", [12459, 12525, 12522, 12540]], [[13070, 13070], "mapped", [12460, 12525, 12531]], [[13071, 13071], "mapped", [12460, 12531, 12510]], [[13072, 13072], "mapped", [12462, 12460]], [[13073, 13073], "mapped", [12462, 12491, 12540]], [[13074, 13074], "mapped", [12461, 12517, 12522, 12540]], [[13075, 13075], "mapped", [12462, 12523, 12480, 12540]], [[13076, 13076], "mapped", [12461, 12525]], [[13077, 13077], "mapped", [12461, 12525, 12464, 12521, 12512]], [[13078, 13078], "mapped", [12461, 12525, 12513, 12540, 12488, 12523]], [[13079, 13079], "mapped", [12461, 12525, 12527, 12483, 12488]], [[13080, 13080], "mapped", [12464, 12521, 12512]], [[13081, 13081], "mapped", [12464, 12521, 12512, 12488, 12531]], [[13082, 13082], "mapped", [12463, 12523, 12476, 12452, 12525]], [[13083, 13083], "mapped", [12463, 12525, 12540, 12493]], [[13084, 13084], "mapped", [12465, 12540, 12473]], [[13085, 13085], "mapped", [12467, 12523, 12490]], [[13086, 13086], "mapped", [12467, 12540, 12509]], [[13087, 13087], "mapped", [12469, 12452, 12463, 12523]], [[13088, 13088], "mapped", [12469, 12531, 12481, 12540, 12512]], [[13089, 13089], "mapped", [12471, 12522, 12531, 12464]], [[13090, 13090], "mapped", [12475, 12531, 12481]], [[13091, 13091], "mapped", [12475, 12531, 12488]], [[13092, 13092], "mapped", [12480, 12540, 12473]], [[13093, 13093], "mapped", [12487, 12471]], [[13094, 13094], "mapped", [12489, 12523]], [[13095, 13095], "mapped", [12488, 12531]], [[13096, 13096], "mapped", [12490, 12494]], [[13097, 13097], "mapped", [12494, 12483, 12488]], [[13098, 13098], "mapped", [12495, 12452, 12484]], [[13099, 13099], "mapped", [12497, 12540, 12475, 12531, 12488]], [[13100, 13100], "mapped", [12497, 12540, 12484]], [[13101, 13101], "mapped", [12496, 12540, 12524, 12523]], [[13102, 13102], "mapped", [12500, 12450, 12473, 12488, 12523]], [[13103, 13103], "mapped", [12500, 12463, 12523]], [[13104, 13104], "mapped", [12500, 12467]], [[13105, 13105], "mapped", [12499, 12523]], [[13106, 13106], "mapped", [12501, 12449, 12521, 12483, 12489]], [[13107, 13107], "mapped", [12501, 12451, 12540, 12488]], [[13108, 13108], "mapped", [12502, 12483, 12471, 12455, 12523]], [[13109, 13109], "mapped", [12501, 12521, 12531]], [[13110, 13110], "mapped", [12504, 12463, 12479, 12540, 12523]], [[13111, 13111], "mapped", [12506, 12477]], [[13112, 13112], "mapped", [12506, 12491, 12498]], [[13113, 13113], "mapped", [12504, 12523, 12484]], [[13114, 13114], "mapped", [12506, 12531, 12473]], [[13115, 13115], "mapped", [12506, 12540, 12472]], [[13116, 13116], "mapped", [12505, 12540, 12479]], [[13117, 13117], "mapped", [12509, 12452, 12531, 12488]], [[13118, 13118], "mapped", [12508, 12523, 12488]], [[13119, 13119], "mapped", [12507, 12531]], [[13120, 13120], "mapped", [12509, 12531, 12489]], [[13121, 13121], "mapped", [12507, 12540, 12523]], [[13122, 13122], "mapped", [12507, 12540, 12531]], [[13123, 13123], "mapped", [12510, 12452, 12463, 12525]], [[13124, 13124], "mapped", [12510, 12452, 12523]], [[13125, 13125], "mapped", [12510, 12483, 12495]], [[13126, 13126], "mapped", [12510, 12523, 12463]], [[13127, 13127], "mapped", [12510, 12531, 12471, 12519, 12531]], [[13128, 13128], "mapped", [12511, 12463, 12525, 12531]], [[13129, 13129], "mapped", [12511, 12522]], [[13130, 13130], "mapped", [12511, 12522, 12496, 12540, 12523]], [[13131, 13131], "mapped", [12513, 12460]], [[13132, 13132], "mapped", [12513, 12460, 12488, 12531]], [[13133, 13133], "mapped", [12513, 12540, 12488, 12523]], [[13134, 13134], "mapped", [12516, 12540, 12489]], [[13135, 13135], "mapped", [12516, 12540, 12523]], [[13136, 13136], "mapped", [12518, 12450, 12531]], [[13137, 13137], "mapped", [12522, 12483, 12488, 12523]], [[13138, 13138], "mapped", [12522, 12521]], [[13139, 13139], "mapped", [12523, 12500, 12540]], [[13140, 13140], "mapped", [12523, 12540, 12502, 12523]], [[13141, 13141], "mapped", [12524, 12512]], [[13142, 13142], "mapped", [12524, 12531, 12488, 12466, 12531]], [[13143, 13143], "mapped", [12527, 12483, 12488]], [[13144, 13144], "mapped", [48, 28857]], [[13145, 13145], "mapped", [49, 28857]], [[13146, 13146], "mapped", [50, 28857]], [[13147, 13147], "mapped", [51, 28857]], [[13148, 13148], "mapped", [52, 28857]], [[13149, 13149], "mapped", [53, 28857]], [[13150, 13150], "mapped", [54, 28857]], [[13151, 13151], "mapped", [55, 28857]], [[13152, 13152], "mapped", [56, 28857]], [[13153, 13153], "mapped", [57, 28857]], [[13154, 13154], "mapped", [49, 48, 28857]], [[13155, 13155], "mapped", [49, 49, 28857]], [[13156, 13156], "mapped", [49, 50, 28857]], [[13157, 13157], "mapped", [49, 51, 28857]], [[13158, 13158], "mapped", [49, 52, 28857]], [[13159, 13159], "mapped", [49, 53, 28857]], [[13160, 13160], "mapped", [49, 54, 28857]], [[13161, 13161], "mapped", [49, 55, 28857]], [[13162, 13162], "mapped", [49, 56, 28857]], [[13163, 13163], "mapped", [49, 57, 28857]], [[13164, 13164], "mapped", [50, 48, 28857]], [[13165, 13165], "mapped", [50, 49, 28857]], [[13166, 13166], "mapped", [50, 50, 28857]], [[13167, 13167], "mapped", [50, 51, 28857]], [[13168, 13168], "mapped", [50, 52, 28857]], [[13169, 13169], "mapped", [104, 112, 97]], [[13170, 13170], "mapped", [100, 97]], [[13171, 13171], "mapped", [97, 117]], [[13172, 13172], "mapped", [98, 97, 114]], [[13173, 13173], "mapped", [111, 118]], [[13174, 13174], "mapped", [112, 99]], [[13175, 13175], "mapped", [100, 109]], [[13176, 13176], "mapped", [100, 109, 50]], [[13177, 13177], "mapped", [100, 109, 51]], [[13178, 13178], "mapped", [105, 117]], [[13179, 13179], "mapped", [24179, 25104]], [[13180, 13180], "mapped", [26157, 21644]], [[13181, 13181], "mapped", [22823, 27491]], [[13182, 13182], "mapped", [26126, 27835]], [[13183, 13183], "mapped", [26666, 24335, 20250, 31038]], [[13184, 13184], "mapped", [112, 97]], [[13185, 13185], "mapped", [110, 97]], [[13186, 13186], "mapped", [956, 97]], [[13187, 13187], "mapped", [109, 97]], [[13188, 13188], "mapped", [107, 97]], [[13189, 13189], "mapped", [107, 98]], [[13190, 13190], "mapped", [109, 98]], [[13191, 13191], "mapped", [103, 98]], [[13192, 13192], "mapped", [99, 97, 108]], [[13193, 13193], "mapped", [107, 99, 97, 108]], [[13194, 13194], "mapped", [112, 102]], [[13195, 13195], "mapped", [110, 102]], [[13196, 13196], "mapped", [956, 102]], [[13197, 13197], "mapped", [956, 103]], [[13198, 13198], "mapped", [109, 103]], [[13199, 13199], "mapped", [107, 103]], [[13200, 13200], "mapped", [104, 122]], [[13201, 13201], "mapped", [107, 104, 122]], [[13202, 13202], "mapped", [109, 104, 122]], [[13203, 13203], "mapped", [103, 104, 122]], [[13204, 13204], "mapped", [116, 104, 122]], [[13205, 13205], "mapped", [956, 108]], [[13206, 13206], "mapped", [109, 108]], [[13207, 13207], "mapped", [100, 108]], [[13208, 13208], "mapped", [107, 108]], [[13209, 13209], "mapped", [102, 109]], [[13210, 13210], "mapped", [110, 109]], [[13211, 13211], "mapped", [956, 109]], [[13212, 13212], "mapped", [109, 109]], [[13213, 13213], "mapped", [99, 109]], [[13214, 13214], "mapped", [107, 109]], [[13215, 13215], "mapped", [109, 109, 50]], [[13216, 13216], "mapped", [99, 109, 50]], [[13217, 13217], "mapped", [109, 50]], [[13218, 13218], "mapped", [107, 109, 50]], [[13219, 13219], "mapped", [109, 109, 51]], [[13220, 13220], "mapped", [99, 109, 51]], [[13221, 13221], "mapped", [109, 51]], [[13222, 13222], "mapped", [107, 109, 51]], [[13223, 13223], "mapped", [109, 8725, 115]], [[13224, 13224], "mapped", [109, 8725, 115, 50]], [[13225, 13225], "mapped", [112, 97]], [[13226, 13226], "mapped", [107, 112, 97]], [[13227, 13227], "mapped", [109, 112, 97]], [[13228, 13228], "mapped", [103, 112, 97]], [[13229, 13229], "mapped", [114, 97, 100]], [[13230, 13230], "mapped", [114, 97, 100, 8725, 115]], [[13231, 13231], "mapped", [114, 97, 100, 8725, 115, 50]], [[13232, 13232], "mapped", [112, 115]], [[13233, 13233], "mapped", [110, 115]], [[13234, 13234], "mapped", [956, 115]], [[13235, 13235], "mapped", [109, 115]], [[13236, 13236], "mapped", [112, 118]], [[13237, 13237], "mapped", [110, 118]], [[13238, 13238], "mapped", [956, 118]], [[13239, 13239], "mapped", [109, 118]], [[13240, 13240], "mapped", [107, 118]], [[13241, 13241], "mapped", [109, 118]], [[13242, 13242], "mapped", [112, 119]], [[13243, 13243], "mapped", [110, 119]], [[13244, 13244], "mapped", [956, 119]], [[13245, 13245], "mapped", [109, 119]], [[13246, 13246], "mapped", [107, 119]], [[13247, 13247], "mapped", [109, 119]], [[13248, 13248], "mapped", [107, 969]], [[13249, 13249], "mapped", [109, 969]], [[13250, 13250], "disallowed"], [[13251, 13251], "mapped", [98, 113]], [[13252, 13252], "mapped", [99, 99]], [[13253, 13253], "mapped", [99, 100]], [[13254, 13254], "mapped", [99, 8725, 107, 103]], [[13255, 13255], "disallowed"], [[13256, 13256], "mapped", [100, 98]], [[13257, 13257], "mapped", [103, 121]], [[13258, 13258], "mapped", [104, 97]], [[13259, 13259], "mapped", [104, 112]], [[13260, 13260], "mapped", [105, 110]], [[13261, 13261], "mapped", [107, 107]], [[13262, 13262], "mapped", [107, 109]], [[13263, 13263], "mapped", [107, 116]], [[13264, 13264], "mapped", [108, 109]], [[13265, 13265], "mapped", [108, 110]], [[13266, 13266], "mapped", [108, 111, 103]], [[13267, 13267], "mapped", [108, 120]], [[13268, 13268], "mapped", [109, 98]], [[13269, 13269], "mapped", [109, 105, 108]], [[13270, 13270], "mapped", [109, 111, 108]], [[13271, 13271], "mapped", [112, 104]], [[13272, 13272], "disallowed"], [[13273, 13273], "mapped", [112, 112, 109]], [[13274, 13274], "mapped", [112, 114]], [[13275, 13275], "mapped", [115, 114]], [[13276, 13276], "mapped", [115, 118]], [[13277, 13277], "mapped", [119, 98]], [[13278, 13278], "mapped", [118, 8725, 109]], [[13279, 13279], "mapped", [97, 8725, 109]], [[13280, 13280], "mapped", [49, 26085]], [[13281, 13281], "mapped", [50, 26085]], [[13282, 13282], "mapped", [51, 26085]], [[13283, 13283], "mapped", [52, 26085]], [[13284, 13284], "mapped", [53, 26085]], [[13285, 13285], "mapped", [54, 26085]], [[13286, 13286], "mapped", [55, 26085]], [[13287, 13287], "mapped", [56, 26085]], [[13288, 13288], "mapped", [57, 26085]], [[13289, 13289], "mapped", [49, 48, 26085]], [[13290, 13290], "mapped", [49, 49, 26085]], [[13291, 13291], "mapped", [49, 50, 26085]], [[13292, 13292], "mapped", [49, 51, 26085]], [[13293, 13293], "mapped", [49, 52, 26085]], [[13294, 13294], "mapped", [49, 53, 26085]], [[13295, 13295], "mapped", [49, 54, 26085]], [[13296, 13296], "mapped", [49, 55, 26085]], [[13297, 13297], "mapped", [49, 56, 26085]], [[13298, 13298], "mapped", [49, 57, 26085]], [[13299, 13299], "mapped", [50, 48, 26085]], [[13300, 13300], "mapped", [50, 49, 26085]], [[13301, 13301], "mapped", [50, 50, 26085]], [[13302, 13302], "mapped", [50, 51, 26085]], [[13303, 13303], "mapped", [50, 52, 26085]], [[13304, 13304], "mapped", [50, 53, 26085]], [[13305, 13305], "mapped", [50, 54, 26085]], [[13306, 13306], "mapped", [50, 55, 26085]], [[13307, 13307], "mapped", [50, 56, 26085]], [[13308, 13308], "mapped", [50, 57, 26085]], [[13309, 13309], "mapped", [51, 48, 26085]], [[13310, 13310], "mapped", [51, 49, 26085]], [[13311, 13311], "mapped", [103, 97, 108]], [[13312, 19893], "valid"], [[19894, 19903], "disallowed"], [[19904, 19967], "valid", [], "NV8"], [[19968, 40869], "valid"], [[40870, 40891], "valid"], [[40892, 40899], "valid"], [[40900, 40907], "valid"], [[40908, 40908], "valid"], [[40909, 40917], "valid"], [[40918, 40959], "disallowed"], [[40960, 42124], "valid"], [[42125, 42127], "disallowed"], [[42128, 42145], "valid", [], "NV8"], [[42146, 42147], "valid", [], "NV8"], [[42148, 42163], "valid", [], "NV8"], [[42164, 42164], "valid", [], "NV8"], [[42165, 42176], "valid", [], "NV8"], [[42177, 42177], "valid", [], "NV8"], [[42178, 42180], "valid", [], "NV8"], [[42181, 42181], "valid", [], "NV8"], [[42182, 42182], "valid", [], "NV8"], [[42183, 42191], "disallowed"], [[42192, 42237], "valid"], [[42238, 42239], "valid", [], "NV8"], [[42240, 42508], "valid"], [[42509, 42511], "valid", [], "NV8"], [[42512, 42539], "valid"], [[42540, 42559], "disallowed"], [[42560, 42560], "mapped", [42561]], [[42561, 42561], "valid"], [[42562, 42562], "mapped", [42563]], [[42563, 42563], "valid"], [[42564, 42564], "mapped", [42565]], [[42565, 42565], "valid"], [[42566, 42566], "mapped", [42567]], [[42567, 42567], "valid"], [[42568, 42568], "mapped", [42569]], [[42569, 42569], "valid"], [[42570, 42570], "mapped", [42571]], [[42571, 42571], "valid"], [[42572, 42572], "mapped", [42573]], [[42573, 42573], "valid"], [[42574, 42574], "mapped", [42575]], [[42575, 42575], "valid"], [[42576, 42576], "mapped", [42577]], [[42577, 42577], "valid"], [[42578, 42578], "mapped", [42579]], [[42579, 42579], "valid"], [[42580, 42580], "mapped", [42581]], [[42581, 42581], "valid"], [[42582, 42582], "mapped", [42583]], [[42583, 42583], "valid"], [[42584, 42584], "mapped", [42585]], [[42585, 42585], "valid"], [[42586, 42586], "mapped", [42587]], [[42587, 42587], "valid"], [[42588, 42588], "mapped", [42589]], [[42589, 42589], "valid"], [[42590, 42590], "mapped", [42591]], [[42591, 42591], "valid"], [[42592, 42592], "mapped", [42593]], [[42593, 42593], "valid"], [[42594, 42594], "mapped", [42595]], [[42595, 42595], "valid"], [[42596, 42596], "mapped", [42597]], [[42597, 42597], "valid"], [[42598, 42598], "mapped", [42599]], [[42599, 42599], "valid"], [[42600, 42600], "mapped", [42601]], [[42601, 42601], "valid"], [[42602, 42602], "mapped", [42603]], [[42603, 42603], "valid"], [[42604, 42604], "mapped", [42605]], [[42605, 42607], "valid"], [[42608, 42611], "valid", [], "NV8"], [[42612, 42619], "valid"], [[42620, 42621], "valid"], [[42622, 42622], "valid", [], "NV8"], [[42623, 42623], "valid"], [[42624, 42624], "mapped", [42625]], [[42625, 42625], "valid"], [[42626, 42626], "mapped", [42627]], [[42627, 42627], "valid"], [[42628, 42628], "mapped", [42629]], [[42629, 42629], "valid"], [[42630, 42630], "mapped", [42631]], [[42631, 42631], "valid"], [[42632, 42632], "mapped", [42633]], [[42633, 42633], "valid"], [[42634, 42634], "mapped", [42635]], [[42635, 42635], "valid"], [[42636, 42636], "mapped", [42637]], [[42637, 42637], "valid"], [[42638, 42638], "mapped", [42639]], [[42639, 42639], "valid"], [[42640, 42640], "mapped", [42641]], [[42641, 42641], "valid"], [[42642, 42642], "mapped", [42643]], [[42643, 42643], "valid"], [[42644, 42644], "mapped", [42645]], [[42645, 42645], "valid"], [[42646, 42646], "mapped", [42647]], [[42647, 42647], "valid"], [[42648, 42648], "mapped", [42649]], [[42649, 42649], "valid"], [[42650, 42650], "mapped", [42651]], [[42651, 42651], "valid"], [[42652, 42652], "mapped", [1098]], [[42653, 42653], "mapped", [1100]], [[42654, 42654], "valid"], [[42655, 42655], "valid"], [[42656, 42725], "valid"], [[42726, 42735], "valid", [], "NV8"], [[42736, 42737], "valid"], [[42738, 42743], "valid", [], "NV8"], [[42744, 42751], "disallowed"], [[42752, 42774], "valid", [], "NV8"], [[42775, 42778], "valid"], [[42779, 42783], "valid"], [[42784, 42785], "valid", [], "NV8"], [[42786, 42786], "mapped", [42787]], [[42787, 42787], "valid"], [[42788, 42788], "mapped", [42789]], [[42789, 42789], "valid"], [[42790, 42790], "mapped", [42791]], [[42791, 42791], "valid"], [[42792, 42792], "mapped", [42793]], [[42793, 42793], "valid"], [[42794, 42794], "mapped", [42795]], [[42795, 42795], "valid"], [[42796, 42796], "mapped", [42797]], [[42797, 42797], "valid"], [[42798, 42798], "mapped", [42799]], [[42799, 42801], "valid"], [[42802, 42802], "mapped", [42803]], [[42803, 42803], "valid"], [[42804, 42804], "mapped", [42805]], [[42805, 42805], "valid"], [[42806, 42806], "mapped", [42807]], [[42807, 42807], "valid"], [[42808, 42808], "mapped", [42809]], [[42809, 42809], "valid"], [[42810, 42810], "mapped", [42811]], [[42811, 42811], "valid"], [[42812, 42812], "mapped", [42813]], [[42813, 42813], "valid"], [[42814, 42814], "mapped", [42815]], [[42815, 42815], "valid"], [[42816, 42816], "mapped", [42817]], [[42817, 42817], "valid"], [[42818, 42818], "mapped", [42819]], [[42819, 42819], "valid"], [[42820, 42820], "mapped", [42821]], [[42821, 42821], "valid"], [[42822, 42822], "mapped", [42823]], [[42823, 42823], "valid"], [[42824, 42824], "mapped", [42825]], [[42825, 42825], "valid"], [[42826, 42826], "mapped", [42827]], [[42827, 42827], "valid"], [[42828, 42828], "mapped", [42829]], [[42829, 42829], "valid"], [[42830, 42830], "mapped", [42831]], [[42831, 42831], "valid"], [[42832, 42832], "mapped", [42833]], [[42833, 42833], "valid"], [[42834, 42834], "mapped", [42835]], [[42835, 42835], "valid"], [[42836, 42836], "mapped", [42837]], [[42837, 42837], "valid"], [[42838, 42838], "mapped", [42839]], [[42839, 42839], "valid"], [[42840, 42840], "mapped", [42841]], [[42841, 42841], "valid"], [[42842, 42842], "mapped", [42843]], [[42843, 42843], "valid"], [[42844, 42844], "mapped", [42845]], [[42845, 42845], "valid"], [[42846, 42846], "mapped", [42847]], [[42847, 42847], "valid"], [[42848, 42848], "mapped", [42849]], [[42849, 42849], "valid"], [[42850, 42850], "mapped", [42851]], [[42851, 42851], "valid"], [[42852, 42852], "mapped", [42853]], [[42853, 42853], "valid"], [[42854, 42854], "mapped", [42855]], [[42855, 42855], "valid"], [[42856, 42856], "mapped", [42857]], [[42857, 42857], "valid"], [[42858, 42858], "mapped", [42859]], [[42859, 42859], "valid"], [[42860, 42860], "mapped", [42861]], [[42861, 42861], "valid"], [[42862, 42862], "mapped", [42863]], [[42863, 42863], "valid"], [[42864, 42864], "mapped", [42863]], [[42865, 42872], "valid"], [[42873, 42873], "mapped", [42874]], [[42874, 42874], "valid"], [[42875, 42875], "mapped", [42876]], [[42876, 42876], "valid"], [[42877, 42877], "mapped", [7545]], [[42878, 42878], "mapped", [42879]], [[42879, 42879], "valid"], [[42880, 42880], "mapped", [42881]], [[42881, 42881], "valid"], [[42882, 42882], "mapped", [42883]], [[42883, 42883], "valid"], [[42884, 42884], "mapped", [42885]], [[42885, 42885], "valid"], [[42886, 42886], "mapped", [42887]], [[42887, 42888], "valid"], [[42889, 42890], "valid", [], "NV8"], [[42891, 42891], "mapped", [42892]], [[42892, 42892], "valid"], [[42893, 42893], "mapped", [613]], [[42894, 42894], "valid"], [[42895, 42895], "valid"], [[42896, 42896], "mapped", [42897]], [[42897, 42897], "valid"], [[42898, 42898], "mapped", [42899]], [[42899, 42899], "valid"], [[42900, 42901], "valid"], [[42902, 42902], "mapped", [42903]], [[42903, 42903], "valid"], [[42904, 42904], "mapped", [42905]], [[42905, 42905], "valid"], [[42906, 42906], "mapped", [42907]], [[42907, 42907], "valid"], [[42908, 42908], "mapped", [42909]], [[42909, 42909], "valid"], [[42910, 42910], "mapped", [42911]], [[42911, 42911], "valid"], [[42912, 42912], "mapped", [42913]], [[42913, 42913], "valid"], [[42914, 42914], "mapped", [42915]], [[42915, 42915], "valid"], [[42916, 42916], "mapped", [42917]], [[42917, 42917], "valid"], [[42918, 42918], "mapped", [42919]], [[42919, 42919], "valid"], [[42920, 42920], "mapped", [42921]], [[42921, 42921], "valid"], [[42922, 42922], "mapped", [614]], [[42923, 42923], "mapped", [604]], [[42924, 42924], "mapped", [609]], [[42925, 42925], "mapped", [620]], [[42926, 42927], "disallowed"], [[42928, 42928], "mapped", [670]], [[42929, 42929], "mapped", [647]], [[42930, 42930], "mapped", [669]], [[42931, 42931], "mapped", [43859]], [[42932, 42932], "mapped", [42933]], [[42933, 42933], "valid"], [[42934, 42934], "mapped", [42935]], [[42935, 42935], "valid"], [[42936, 42998], "disallowed"], [[42999, 42999], "valid"], [[43e3, 43e3], "mapped", [295]], [[43001, 43001], "mapped", [339]], [[43002, 43002], "valid"], [[43003, 43007], "valid"], [[43008, 43047], "valid"], [[43048, 43051], "valid", [], "NV8"], [[43052, 43055], "disallowed"], [[43056, 43065], "valid", [], "NV8"], [[43066, 43071], "disallowed"], [[43072, 43123], "valid"], [[43124, 43127], "valid", [], "NV8"], [[43128, 43135], "disallowed"], [[43136, 43204], "valid"], [[43205, 43213], "disallowed"], [[43214, 43215], "valid", [], "NV8"], [[43216, 43225], "valid"], [[43226, 43231], "disallowed"], [[43232, 43255], "valid"], [[43256, 43258], "valid", [], "NV8"], [[43259, 43259], "valid"], [[43260, 43260], "valid", [], "NV8"], [[43261, 43261], "valid"], [[43262, 43263], "disallowed"], [[43264, 43309], "valid"], [[43310, 43311], "valid", [], "NV8"], [[43312, 43347], "valid"], [[43348, 43358], "disallowed"], [[43359, 43359], "valid", [], "NV8"], [[43360, 43388], "valid", [], "NV8"], [[43389, 43391], "disallowed"], [[43392, 43456], "valid"], [[43457, 43469], "valid", [], "NV8"], [[43470, 43470], "disallowed"], [[43471, 43481], "valid"], [[43482, 43485], "disallowed"], [[43486, 43487], "valid", [], "NV8"], [[43488, 43518], "valid"], [[43519, 43519], "disallowed"], [[43520, 43574], "valid"], [[43575, 43583], "disallowed"], [[43584, 43597], "valid"], [[43598, 43599], "disallowed"], [[43600, 43609], "valid"], [[43610, 43611], "disallowed"], [[43612, 43615], "valid", [], "NV8"], [[43616, 43638], "valid"], [[43639, 43641], "valid", [], "NV8"], [[43642, 43643], "valid"], [[43644, 43647], "valid"], [[43648, 43714], "valid"], [[43715, 43738], "disallowed"], [[43739, 43741], "valid"], [[43742, 43743], "valid", [], "NV8"], [[43744, 43759], "valid"], [[43760, 43761], "valid", [], "NV8"], [[43762, 43766], "valid"], [[43767, 43776], "disallowed"], [[43777, 43782], "valid"], [[43783, 43784], "disallowed"], [[43785, 43790], "valid"], [[43791, 43792], "disallowed"], [[43793, 43798], "valid"], [[43799, 43807], "disallowed"], [[43808, 43814], "valid"], [[43815, 43815], "disallowed"], [[43816, 43822], "valid"], [[43823, 43823], "disallowed"], [[43824, 43866], "valid"], [[43867, 43867], "valid", [], "NV8"], [[43868, 43868], "mapped", [42791]], [[43869, 43869], "mapped", [43831]], [[43870, 43870], "mapped", [619]], [[43871, 43871], "mapped", [43858]], [[43872, 43875], "valid"], [[43876, 43877], "valid"], [[43878, 43887], "disallowed"], [[43888, 43888], "mapped", [5024]], [[43889, 43889], "mapped", [5025]], [[43890, 43890], "mapped", [5026]], [[43891, 43891], "mapped", [5027]], [[43892, 43892], "mapped", [5028]], [[43893, 43893], "mapped", [5029]], [[43894, 43894], "mapped", [5030]], [[43895, 43895], "mapped", [5031]], [[43896, 43896], "mapped", [5032]], [[43897, 43897], "mapped", [5033]], [[43898, 43898], "mapped", [5034]], [[43899, 43899], "mapped", [5035]], [[43900, 43900], "mapped", [5036]], [[43901, 43901], "mapped", [5037]], [[43902, 43902], "mapped", [5038]], [[43903, 43903], "mapped", [5039]], [[43904, 43904], "mapped", [5040]], [[43905, 43905], "mapped", [5041]], [[43906, 43906], "mapped", [5042]], [[43907, 43907], "mapped", [5043]], [[43908, 43908], "mapped", [5044]], [[43909, 43909], "mapped", [5045]], [[43910, 43910], "mapped", [5046]], [[43911, 43911], "mapped", [5047]], [[43912, 43912], "mapped", [5048]], [[43913, 43913], "mapped", [5049]], [[43914, 43914], "mapped", [5050]], [[43915, 43915], "mapped", [5051]], [[43916, 43916], "mapped", [5052]], [[43917, 43917], "mapped", [5053]], [[43918, 43918], "mapped", [5054]], [[43919, 43919], "mapped", [5055]], [[43920, 43920], "mapped", [5056]], [[43921, 43921], "mapped", [5057]], [[43922, 43922], "mapped", [5058]], [[43923, 43923], "mapped", [5059]], [[43924, 43924], "mapped", [5060]], [[43925, 43925], "mapped", [5061]], [[43926, 43926], "mapped", [5062]], [[43927, 43927], "mapped", [5063]], [[43928, 43928], "mapped", [5064]], [[43929, 43929], "mapped", [5065]], [[43930, 43930], "mapped", [5066]], [[43931, 43931], "mapped", [5067]], [[43932, 43932], "mapped", [5068]], [[43933, 43933], "mapped", [5069]], [[43934, 43934], "mapped", [5070]], [[43935, 43935], "mapped", [5071]], [[43936, 43936], "mapped", [5072]], [[43937, 43937], "mapped", [5073]], [[43938, 43938], "mapped", [5074]], [[43939, 43939], "mapped", [5075]], [[43940, 43940], "mapped", [5076]], [[43941, 43941], "mapped", [5077]], [[43942, 43942], "mapped", [5078]], [[43943, 43943], "mapped", [5079]], [[43944, 43944], "mapped", [5080]], [[43945, 43945], "mapped", [5081]], [[43946, 43946], "mapped", [5082]], [[43947, 43947], "mapped", [5083]], [[43948, 43948], "mapped", [5084]], [[43949, 43949], "mapped", [5085]], [[43950, 43950], "mapped", [5086]], [[43951, 43951], "mapped", [5087]], [[43952, 43952], "mapped", [5088]], [[43953, 43953], "mapped", [5089]], [[43954, 43954], "mapped", [5090]], [[43955, 43955], "mapped", [5091]], [[43956, 43956], "mapped", [5092]], [[43957, 43957], "mapped", [5093]], [[43958, 43958], "mapped", [5094]], [[43959, 43959], "mapped", [5095]], [[43960, 43960], "mapped", [5096]], [[43961, 43961], "mapped", [5097]], [[43962, 43962], "mapped", [5098]], [[43963, 43963], "mapped", [5099]], [[43964, 43964], "mapped", [5100]], [[43965, 43965], "mapped", [5101]], [[43966, 43966], "mapped", [5102]], [[43967, 43967], "mapped", [5103]], [[43968, 44010], "valid"], [[44011, 44011], "valid", [], "NV8"], [[44012, 44013], "valid"], [[44014, 44015], "disallowed"], [[44016, 44025], "valid"], [[44026, 44031], "disallowed"], [[44032, 55203], "valid"], [[55204, 55215], "disallowed"], [[55216, 55238], "valid", [], "NV8"], [[55239, 55242], "disallowed"], [[55243, 55291], "valid", [], "NV8"], [[55292, 55295], "disallowed"], [[55296, 57343], "disallowed"], [[57344, 63743], "disallowed"], [[63744, 63744], "mapped", [35912]], [[63745, 63745], "mapped", [26356]], [[63746, 63746], "mapped", [36554]], [[63747, 63747], "mapped", [36040]], [[63748, 63748], "mapped", [28369]], [[63749, 63749], "mapped", [20018]], [[63750, 63750], "mapped", [21477]], [[63751, 63752], "mapped", [40860]], [[63753, 63753], "mapped", [22865]], [[63754, 63754], "mapped", [37329]], [[63755, 63755], "mapped", [21895]], [[63756, 63756], "mapped", [22856]], [[63757, 63757], "mapped", [25078]], [[63758, 63758], "mapped", [30313]], [[63759, 63759], "mapped", [32645]], [[63760, 63760], "mapped", [34367]], [[63761, 63761], "mapped", [34746]], [[63762, 63762], "mapped", [35064]], [[63763, 63763], "mapped", [37007]], [[63764, 63764], "mapped", [27138]], [[63765, 63765], "mapped", [27931]], [[63766, 63766], "mapped", [28889]], [[63767, 63767], "mapped", [29662]], [[63768, 63768], "mapped", [33853]], [[63769, 63769], "mapped", [37226]], [[63770, 63770], "mapped", [39409]], [[63771, 63771], "mapped", [20098]], [[63772, 63772], "mapped", [21365]], [[63773, 63773], "mapped", [27396]], [[63774, 63774], "mapped", [29211]], [[63775, 63775], "mapped", [34349]], [[63776, 63776], "mapped", [40478]], [[63777, 63777], "mapped", [23888]], [[63778, 63778], "mapped", [28651]], [[63779, 63779], "mapped", [34253]], [[63780, 63780], "mapped", [35172]], [[63781, 63781], "mapped", [25289]], [[63782, 63782], "mapped", [33240]], [[63783, 63783], "mapped", [34847]], [[63784, 63784], "mapped", [24266]], [[63785, 63785], "mapped", [26391]], [[63786, 63786], "mapped", [28010]], [[63787, 63787], "mapped", [29436]], [[63788, 63788], "mapped", [37070]], [[63789, 63789], "mapped", [20358]], [[63790, 63790], "mapped", [20919]], [[63791, 63791], "mapped", [21214]], [[63792, 63792], "mapped", [25796]], [[63793, 63793], "mapped", [27347]], [[63794, 63794], "mapped", [29200]], [[63795, 63795], "mapped", [30439]], [[63796, 63796], "mapped", [32769]], [[63797, 63797], "mapped", [34310]], [[63798, 63798], "mapped", [34396]], [[63799, 63799], "mapped", [36335]], [[63800, 63800], "mapped", [38706]], [[63801, 63801], "mapped", [39791]], [[63802, 63802], "mapped", [40442]], [[63803, 63803], "mapped", [30860]], [[63804, 63804], "mapped", [31103]], [[63805, 63805], "mapped", [32160]], [[63806, 63806], "mapped", [33737]], [[63807, 63807], "mapped", [37636]], [[63808, 63808], "mapped", [40575]], [[63809, 63809], "mapped", [35542]], [[63810, 63810], "mapped", [22751]], [[63811, 63811], "mapped", [24324]], [[63812, 63812], "mapped", [31840]], [[63813, 63813], "mapped", [32894]], [[63814, 63814], "mapped", [29282]], [[63815, 63815], "mapped", [30922]], [[63816, 63816], "mapped", [36034]], [[63817, 63817], "mapped", [38647]], [[63818, 63818], "mapped", [22744]], [[63819, 63819], "mapped", [23650]], [[63820, 63820], "mapped", [27155]], [[63821, 63821], "mapped", [28122]], [[63822, 63822], "mapped", [28431]], [[63823, 63823], "mapped", [32047]], [[63824, 63824], "mapped", [32311]], [[63825, 63825], "mapped", [38475]], [[63826, 63826], "mapped", [21202]], [[63827, 63827], "mapped", [32907]], [[63828, 63828], "mapped", [20956]], [[63829, 63829], "mapped", [20940]], [[63830, 63830], "mapped", [31260]], [[63831, 63831], "mapped", [32190]], [[63832, 63832], "mapped", [33777]], [[63833, 63833], "mapped", [38517]], [[63834, 63834], "mapped", [35712]], [[63835, 63835], "mapped", [25295]], [[63836, 63836], "mapped", [27138]], [[63837, 63837], "mapped", [35582]], [[63838, 63838], "mapped", [20025]], [[63839, 63839], "mapped", [23527]], [[63840, 63840], "mapped", [24594]], [[63841, 63841], "mapped", [29575]], [[63842, 63842], "mapped", [30064]], [[63843, 63843], "mapped", [21271]], [[63844, 63844], "mapped", [30971]], [[63845, 63845], "mapped", [20415]], [[63846, 63846], "mapped", [24489]], [[63847, 63847], "mapped", [19981]], [[63848, 63848], "mapped", [27852]], [[63849, 63849], "mapped", [25976]], [[63850, 63850], "mapped", [32034]], [[63851, 63851], "mapped", [21443]], [[63852, 63852], "mapped", [22622]], [[63853, 63853], "mapped", [30465]], [[63854, 63854], "mapped", [33865]], [[63855, 63855], "mapped", [35498]], [[63856, 63856], "mapped", [27578]], [[63857, 63857], "mapped", [36784]], [[63858, 63858], "mapped", [27784]], [[63859, 63859], "mapped", [25342]], [[63860, 63860], "mapped", [33509]], [[63861, 63861], "mapped", [25504]], [[63862, 63862], "mapped", [30053]], [[63863, 63863], "mapped", [20142]], [[63864, 63864], "mapped", [20841]], [[63865, 63865], "mapped", [20937]], [[63866, 63866], "mapped", [26753]], [[63867, 63867], "mapped", [31975]], [[63868, 63868], "mapped", [33391]], [[63869, 63869], "mapped", [35538]], [[63870, 63870], "mapped", [37327]], [[63871, 63871], "mapped", [21237]], [[63872, 63872], "mapped", [21570]], [[63873, 63873], "mapped", [22899]], [[63874, 63874], "mapped", [24300]], [[63875, 63875], "mapped", [26053]], [[63876, 63876], "mapped", [28670]], [[63877, 63877], "mapped", [31018]], [[63878, 63878], "mapped", [38317]], [[63879, 63879], "mapped", [39530]], [[63880, 63880], "mapped", [40599]], [[63881, 63881], "mapped", [40654]], [[63882, 63882], "mapped", [21147]], [[63883, 63883], "mapped", [26310]], [[63884, 63884], "mapped", [27511]], [[63885, 63885], "mapped", [36706]], [[63886, 63886], "mapped", [24180]], [[63887, 63887], "mapped", [24976]], [[63888, 63888], "mapped", [25088]], [[63889, 63889], "mapped", [25754]], [[63890, 63890], "mapped", [28451]], [[63891, 63891], "mapped", [29001]], [[63892, 63892], "mapped", [29833]], [[63893, 63893], "mapped", [31178]], [[63894, 63894], "mapped", [32244]], [[63895, 63895], "mapped", [32879]], [[63896, 63896], "mapped", [36646]], [[63897, 63897], "mapped", [34030]], [[63898, 63898], "mapped", [36899]], [[63899, 63899], "mapped", [37706]], [[63900, 63900], "mapped", [21015]], [[63901, 63901], "mapped", [21155]], [[63902, 63902], "mapped", [21693]], [[63903, 63903], "mapped", [28872]], [[63904, 63904], "mapped", [35010]], [[63905, 63905], "mapped", [35498]], [[63906, 63906], "mapped", [24265]], [[63907, 63907], "mapped", [24565]], [[63908, 63908], "mapped", [25467]], [[63909, 63909], "mapped", [27566]], [[63910, 63910], "mapped", [31806]], [[63911, 63911], "mapped", [29557]], [[63912, 63912], "mapped", [20196]], [[63913, 63913], "mapped", [22265]], [[63914, 63914], "mapped", [23527]], [[63915, 63915], "mapped", [23994]], [[63916, 63916], "mapped", [24604]], [[63917, 63917], "mapped", [29618]], [[63918, 63918], "mapped", [29801]], [[63919, 63919], "mapped", [32666]], [[63920, 63920], "mapped", [32838]], [[63921, 63921], "mapped", [37428]], [[63922, 63922], "mapped", [38646]], [[63923, 63923], "mapped", [38728]], [[63924, 63924], "mapped", [38936]], [[63925, 63925], "mapped", [20363]], [[63926, 63926], "mapped", [31150]], [[63927, 63927], "mapped", [37300]], [[63928, 63928], "mapped", [38584]], [[63929, 63929], "mapped", [24801]], [[63930, 63930], "mapped", [20102]], [[63931, 63931], "mapped", [20698]], [[63932, 63932], "mapped", [23534]], [[63933, 63933], "mapped", [23615]], [[63934, 63934], "mapped", [26009]], [[63935, 63935], "mapped", [27138]], [[63936, 63936], "mapped", [29134]], [[63937, 63937], "mapped", [30274]], [[63938, 63938], "mapped", [34044]], [[63939, 63939], "mapped", [36988]], [[63940, 63940], "mapped", [40845]], [[63941, 63941], "mapped", [26248]], [[63942, 63942], "mapped", [38446]], [[63943, 63943], "mapped", [21129]], [[63944, 63944], "mapped", [26491]], [[63945, 63945], "mapped", [26611]], [[63946, 63946], "mapped", [27969]], [[63947, 63947], "mapped", [28316]], [[63948, 63948], "mapped", [29705]], [[63949, 63949], "mapped", [30041]], [[63950, 63950], "mapped", [30827]], [[63951, 63951], "mapped", [32016]], [[63952, 63952], "mapped", [39006]], [[63953, 63953], "mapped", [20845]], [[63954, 63954], "mapped", [25134]], [[63955, 63955], "mapped", [38520]], [[63956, 63956], "mapped", [20523]], [[63957, 63957], "mapped", [23833]], [[63958, 63958], "mapped", [28138]], [[63959, 63959], "mapped", [36650]], [[63960, 63960], "mapped", [24459]], [[63961, 63961], "mapped", [24900]], [[63962, 63962], "mapped", [26647]], [[63963, 63963], "mapped", [29575]], [[63964, 63964], "mapped", [38534]], [[63965, 63965], "mapped", [21033]], [[63966, 63966], "mapped", [21519]], [[63967, 63967], "mapped", [23653]], [[63968, 63968], "mapped", [26131]], [[63969, 63969], "mapped", [26446]], [[63970, 63970], "mapped", [26792]], [[63971, 63971], "mapped", [27877]], [[63972, 63972], "mapped", [29702]], [[63973, 63973], "mapped", [30178]], [[63974, 63974], "mapped", [32633]], [[63975, 63975], "mapped", [35023]], [[63976, 63976], "mapped", [35041]], [[63977, 63977], "mapped", [37324]], [[63978, 63978], "mapped", [38626]], [[63979, 63979], "mapped", [21311]], [[63980, 63980], "mapped", [28346]], [[63981, 63981], "mapped", [21533]], [[63982, 63982], "mapped", [29136]], [[63983, 63983], "mapped", [29848]], [[63984, 63984], "mapped", [34298]], [[63985, 63985], "mapped", [38563]], [[63986, 63986], "mapped", [40023]], [[63987, 63987], "mapped", [40607]], [[63988, 63988], "mapped", [26519]], [[63989, 63989], "mapped", [28107]], [[63990, 63990], "mapped", [33256]], [[63991, 63991], "mapped", [31435]], [[63992, 63992], "mapped", [31520]], [[63993, 63993], "mapped", [31890]], [[63994, 63994], "mapped", [29376]], [[63995, 63995], "mapped", [28825]], [[63996, 63996], "mapped", [35672]], [[63997, 63997], "mapped", [20160]], [[63998, 63998], "mapped", [33590]], [[63999, 63999], "mapped", [21050]], [[64e3, 64e3], "mapped", [20999]], [[64001, 64001], "mapped", [24230]], [[64002, 64002], "mapped", [25299]], [[64003, 64003], "mapped", [31958]], [[64004, 64004], "mapped", [23429]], [[64005, 64005], "mapped", [27934]], [[64006, 64006], "mapped", [26292]], [[64007, 64007], "mapped", [36667]], [[64008, 64008], "mapped", [34892]], [[64009, 64009], "mapped", [38477]], [[64010, 64010], "mapped", [35211]], [[64011, 64011], "mapped", [24275]], [[64012, 64012], "mapped", [20800]], [[64013, 64013], "mapped", [21952]], [[64014, 64015], "valid"], [[64016, 64016], "mapped", [22618]], [[64017, 64017], "valid"], [[64018, 64018], "mapped", [26228]], [[64019, 64020], "valid"], [[64021, 64021], "mapped", [20958]], [[64022, 64022], "mapped", [29482]], [[64023, 64023], "mapped", [30410]], [[64024, 64024], "mapped", [31036]], [[64025, 64025], "mapped", [31070]], [[64026, 64026], "mapped", [31077]], [[64027, 64027], "mapped", [31119]], [[64028, 64028], "mapped", [38742]], [[64029, 64029], "mapped", [31934]], [[64030, 64030], "mapped", [32701]], [[64031, 64031], "valid"], [[64032, 64032], "mapped", [34322]], [[64033, 64033], "valid"], [[64034, 64034], "mapped", [35576]], [[64035, 64036], "valid"], [[64037, 64037], "mapped", [36920]], [[64038, 64038], "mapped", [37117]], [[64039, 64041], "valid"], [[64042, 64042], "mapped", [39151]], [[64043, 64043], "mapped", [39164]], [[64044, 64044], "mapped", [39208]], [[64045, 64045], "mapped", [40372]], [[64046, 64046], "mapped", [37086]], [[64047, 64047], "mapped", [38583]], [[64048, 64048], "mapped", [20398]], [[64049, 64049], "mapped", [20711]], [[64050, 64050], "mapped", [20813]], [[64051, 64051], "mapped", [21193]], [[64052, 64052], "mapped", [21220]], [[64053, 64053], "mapped", [21329]], [[64054, 64054], "mapped", [21917]], [[64055, 64055], "mapped", [22022]], [[64056, 64056], "mapped", [22120]], [[64057, 64057], "mapped", [22592]], [[64058, 64058], "mapped", [22696]], [[64059, 64059], "mapped", [23652]], [[64060, 64060], "mapped", [23662]], [[64061, 64061], "mapped", [24724]], [[64062, 64062], "mapped", [24936]], [[64063, 64063], "mapped", [24974]], [[64064, 64064], "mapped", [25074]], [[64065, 64065], "mapped", [25935]], [[64066, 64066], "mapped", [26082]], [[64067, 64067], "mapped", [26257]], [[64068, 64068], "mapped", [26757]], [[64069, 64069], "mapped", [28023]], [[64070, 64070], "mapped", [28186]], [[64071, 64071], "mapped", [28450]], [[64072, 64072], "mapped", [29038]], [[64073, 64073], "mapped", [29227]], [[64074, 64074], "mapped", [29730]], [[64075, 64075], "mapped", [30865]], [[64076, 64076], "mapped", [31038]], [[64077, 64077], "mapped", [31049]], [[64078, 64078], "mapped", [31048]], [[64079, 64079], "mapped", [31056]], [[64080, 64080], "mapped", [31062]], [[64081, 64081], "mapped", [31069]], [[64082, 64082], "mapped", [31117]], [[64083, 64083], "mapped", [31118]], [[64084, 64084], "mapped", [31296]], [[64085, 64085], "mapped", [31361]], [[64086, 64086], "mapped", [31680]], [[64087, 64087], "mapped", [32244]], [[64088, 64088], "mapped", [32265]], [[64089, 64089], "mapped", [32321]], [[64090, 64090], "mapped", [32626]], [[64091, 64091], "mapped", [32773]], [[64092, 64092], "mapped", [33261]], [[64093, 64094], "mapped", [33401]], [[64095, 64095], "mapped", [33879]], [[64096, 64096], "mapped", [35088]], [[64097, 64097], "mapped", [35222]], [[64098, 64098], "mapped", [35585]], [[64099, 64099], "mapped", [35641]], [[64100, 64100], "mapped", [36051]], [[64101, 64101], "mapped", [36104]], [[64102, 64102], "mapped", [36790]], [[64103, 64103], "mapped", [36920]], [[64104, 64104], "mapped", [38627]], [[64105, 64105], "mapped", [38911]], [[64106, 64106], "mapped", [38971]], [[64107, 64107], "mapped", [24693]], [[64108, 64108], "mapped", [148206]], [[64109, 64109], "mapped", [33304]], [[64110, 64111], "disallowed"], [[64112, 64112], "mapped", [20006]], [[64113, 64113], "mapped", [20917]], [[64114, 64114], "mapped", [20840]], [[64115, 64115], "mapped", [20352]], [[64116, 64116], "mapped", [20805]], [[64117, 64117], "mapped", [20864]], [[64118, 64118], "mapped", [21191]], [[64119, 64119], "mapped", [21242]], [[64120, 64120], "mapped", [21917]], [[64121, 64121], "mapped", [21845]], [[64122, 64122], "mapped", [21913]], [[64123, 64123], "mapped", [21986]], [[64124, 64124], "mapped", [22618]], [[64125, 64125], "mapped", [22707]], [[64126, 64126], "mapped", [22852]], [[64127, 64127], "mapped", [22868]], [[64128, 64128], "mapped", [23138]], [[64129, 64129], "mapped", [23336]], [[64130, 64130], "mapped", [24274]], [[64131, 64131], "mapped", [24281]], [[64132, 64132], "mapped", [24425]], [[64133, 64133], "mapped", [24493]], [[64134, 64134], "mapped", [24792]], [[64135, 64135], "mapped", [24910]], [[64136, 64136], "mapped", [24840]], [[64137, 64137], "mapped", [24974]], [[64138, 64138], "mapped", [24928]], [[64139, 64139], "mapped", [25074]], [[64140, 64140], "mapped", [25140]], [[64141, 64141], "mapped", [25540]], [[64142, 64142], "mapped", [25628]], [[64143, 64143], "mapped", [25682]], [[64144, 64144], "mapped", [25942]], [[64145, 64145], "mapped", [26228]], [[64146, 64146], "mapped", [26391]], [[64147, 64147], "mapped", [26395]], [[64148, 64148], "mapped", [26454]], [[64149, 64149], "mapped", [27513]], [[64150, 64150], "mapped", [27578]], [[64151, 64151], "mapped", [27969]], [[64152, 64152], "mapped", [28379]], [[64153, 64153], "mapped", [28363]], [[64154, 64154], "mapped", [28450]], [[64155, 64155], "mapped", [28702]], [[64156, 64156], "mapped", [29038]], [[64157, 64157], "mapped", [30631]], [[64158, 64158], "mapped", [29237]], [[64159, 64159], "mapped", [29359]], [[64160, 64160], "mapped", [29482]], [[64161, 64161], "mapped", [29809]], [[64162, 64162], "mapped", [29958]], [[64163, 64163], "mapped", [30011]], [[64164, 64164], "mapped", [30237]], [[64165, 64165], "mapped", [30239]], [[64166, 64166], "mapped", [30410]], [[64167, 64167], "mapped", [30427]], [[64168, 64168], "mapped", [30452]], [[64169, 64169], "mapped", [30538]], [[64170, 64170], "mapped", [30528]], [[64171, 64171], "mapped", [30924]], [[64172, 64172], "mapped", [31409]], [[64173, 64173], "mapped", [31680]], [[64174, 64174], "mapped", [31867]], [[64175, 64175], "mapped", [32091]], [[64176, 64176], "mapped", [32244]], [[64177, 64177], "mapped", [32574]], [[64178, 64178], "mapped", [32773]], [[64179, 64179], "mapped", [33618]], [[64180, 64180], "mapped", [33775]], [[64181, 64181], "mapped", [34681]], [[64182, 64182], "mapped", [35137]], [[64183, 64183], "mapped", [35206]], [[64184, 64184], "mapped", [35222]], [[64185, 64185], "mapped", [35519]], [[64186, 64186], "mapped", [35576]], [[64187, 64187], "mapped", [35531]], [[64188, 64188], "mapped", [35585]], [[64189, 64189], "mapped", [35582]], [[64190, 64190], "mapped", [35565]], [[64191, 64191], "mapped", [35641]], [[64192, 64192], "mapped", [35722]], [[64193, 64193], "mapped", [36104]], [[64194, 64194], "mapped", [36664]], [[64195, 64195], "mapped", [36978]], [[64196, 64196], "mapped", [37273]], [[64197, 64197], "mapped", [37494]], [[64198, 64198], "mapped", [38524]], [[64199, 64199], "mapped", [38627]], [[64200, 64200], "mapped", [38742]], [[64201, 64201], "mapped", [38875]], [[64202, 64202], "mapped", [38911]], [[64203, 64203], "mapped", [38923]], [[64204, 64204], "mapped", [38971]], [[64205, 64205], "mapped", [39698]], [[64206, 64206], "mapped", [40860]], [[64207, 64207], "mapped", [141386]], [[64208, 64208], "mapped", [141380]], [[64209, 64209], "mapped", [144341]], [[64210, 64210], "mapped", [15261]], [[64211, 64211], "mapped", [16408]], [[64212, 64212], "mapped", [16441]], [[64213, 64213], "mapped", [152137]], [[64214, 64214], "mapped", [154832]], [[64215, 64215], "mapped", [163539]], [[64216, 64216], "mapped", [40771]], [[64217, 64217], "mapped", [40846]], [[64218, 64255], "disallowed"], [[64256, 64256], "mapped", [102, 102]], [[64257, 64257], "mapped", [102, 105]], [[64258, 64258], "mapped", [102, 108]], [[64259, 64259], "mapped", [102, 102, 105]], [[64260, 64260], "mapped", [102, 102, 108]], [[64261, 64262], "mapped", [115, 116]], [[64263, 64274], "disallowed"], [[64275, 64275], "mapped", [1396, 1398]], [[64276, 64276], "mapped", [1396, 1381]], [[64277, 64277], "mapped", [1396, 1387]], [[64278, 64278], "mapped", [1406, 1398]], [[64279, 64279], "mapped", [1396, 1389]], [[64280, 64284], "disallowed"], [[64285, 64285], "mapped", [1497, 1460]], [[64286, 64286], "valid"], [[64287, 64287], "mapped", [1522, 1463]], [[64288, 64288], "mapped", [1506]], [[64289, 64289], "mapped", [1488]], [[64290, 64290], "mapped", [1491]], [[64291, 64291], "mapped", [1492]], [[64292, 64292], "mapped", [1499]], [[64293, 64293], "mapped", [1500]], [[64294, 64294], "mapped", [1501]], [[64295, 64295], "mapped", [1512]], [[64296, 64296], "mapped", [1514]], [[64297, 64297], "disallowed_STD3_mapped", [43]], [[64298, 64298], "mapped", [1513, 1473]], [[64299, 64299], "mapped", [1513, 1474]], [[64300, 64300], "mapped", [1513, 1468, 1473]], [[64301, 64301], "mapped", [1513, 1468, 1474]], [[64302, 64302], "mapped", [1488, 1463]], [[64303, 64303], "mapped", [1488, 1464]], [[64304, 64304], "mapped", [1488, 1468]], [[64305, 64305], "mapped", [1489, 1468]], [[64306, 64306], "mapped", [1490, 1468]], [[64307, 64307], "mapped", [1491, 1468]], [[64308, 64308], "mapped", [1492, 1468]], [[64309, 64309], "mapped", [1493, 1468]], [[64310, 64310], "mapped", [1494, 1468]], [[64311, 64311], "disallowed"], [[64312, 64312], "mapped", [1496, 1468]], [[64313, 64313], "mapped", [1497, 1468]], [[64314, 64314], "mapped", [1498, 1468]], [[64315, 64315], "mapped", [1499, 1468]], [[64316, 64316], "mapped", [1500, 1468]], [[64317, 64317], "disallowed"], [[64318, 64318], "mapped", [1502, 1468]], [[64319, 64319], "disallowed"], [[64320, 64320], "mapped", [1504, 1468]], [[64321, 64321], "mapped", [1505, 1468]], [[64322, 64322], "disallowed"], [[64323, 64323], "mapped", [1507, 1468]], [[64324, 64324], "mapped", [1508, 1468]], [[64325, 64325], "disallowed"], [[64326, 64326], "mapped", [1510, 1468]], [[64327, 64327], "mapped", [1511, 1468]], [[64328, 64328], "mapped", [1512, 1468]], [[64329, 64329], "mapped", [1513, 1468]], [[64330, 64330], "mapped", [1514, 1468]], [[64331, 64331], "mapped", [1493, 1465]], [[64332, 64332], "mapped", [1489, 1471]], [[64333, 64333], "mapped", [1499, 1471]], [[64334, 64334], "mapped", [1508, 1471]], [[64335, 64335], "mapped", [1488, 1500]], [[64336, 64337], "mapped", [1649]], [[64338, 64341], "mapped", [1659]], [[64342, 64345], "mapped", [1662]], [[64346, 64349], "mapped", [1664]], [[64350, 64353], "mapped", [1658]], [[64354, 64357], "mapped", [1663]], [[64358, 64361], "mapped", [1657]], [[64362, 64365], "mapped", [1700]], [[64366, 64369], "mapped", [1702]], [[64370, 64373], "mapped", [1668]], [[64374, 64377], "mapped", [1667]], [[64378, 64381], "mapped", [1670]], [[64382, 64385], "mapped", [1671]], [[64386, 64387], "mapped", [1677]], [[64388, 64389], "mapped", [1676]], [[64390, 64391], "mapped", [1678]], [[64392, 64393], "mapped", [1672]], [[64394, 64395], "mapped", [1688]], [[64396, 64397], "mapped", [1681]], [[64398, 64401], "mapped", [1705]], [[64402, 64405], "mapped", [1711]], [[64406, 64409], "mapped", [1715]], [[64410, 64413], "mapped", [1713]], [[64414, 64415], "mapped", [1722]], [[64416, 64419], "mapped", [1723]], [[64420, 64421], "mapped", [1728]], [[64422, 64425], "mapped", [1729]], [[64426, 64429], "mapped", [1726]], [[64430, 64431], "mapped", [1746]], [[64432, 64433], "mapped", [1747]], [[64434, 64449], "valid", [], "NV8"], [[64450, 64466], "disallowed"], [[64467, 64470], "mapped", [1709]], [[64471, 64472], "mapped", [1735]], [[64473, 64474], "mapped", [1734]], [[64475, 64476], "mapped", [1736]], [[64477, 64477], "mapped", [1735, 1652]], [[64478, 64479], "mapped", [1739]], [[64480, 64481], "mapped", [1733]], [[64482, 64483], "mapped", [1737]], [[64484, 64487], "mapped", [1744]], [[64488, 64489], "mapped", [1609]], [[64490, 64491], "mapped", [1574, 1575]], [[64492, 64493], "mapped", [1574, 1749]], [[64494, 64495], "mapped", [1574, 1608]], [[64496, 64497], "mapped", [1574, 1735]], [[64498, 64499], "mapped", [1574, 1734]], [[64500, 64501], "mapped", [1574, 1736]], [[64502, 64504], "mapped", [1574, 1744]], [[64505, 64507], "mapped", [1574, 1609]], [[64508, 64511], "mapped", [1740]], [[64512, 64512], "mapped", [1574, 1580]], [[64513, 64513], "mapped", [1574, 1581]], [[64514, 64514], "mapped", [1574, 1605]], [[64515, 64515], "mapped", [1574, 1609]], [[64516, 64516], "mapped", [1574, 1610]], [[64517, 64517], "mapped", [1576, 1580]], [[64518, 64518], "mapped", [1576, 1581]], [[64519, 64519], "mapped", [1576, 1582]], [[64520, 64520], "mapped", [1576, 1605]], [[64521, 64521], "mapped", [1576, 1609]], [[64522, 64522], "mapped", [1576, 1610]], [[64523, 64523], "mapped", [1578, 1580]], [[64524, 64524], "mapped", [1578, 1581]], [[64525, 64525], "mapped", [1578, 1582]], [[64526, 64526], "mapped", [1578, 1605]], [[64527, 64527], "mapped", [1578, 1609]], [[64528, 64528], "mapped", [1578, 1610]], [[64529, 64529], "mapped", [1579, 1580]], [[64530, 64530], "mapped", [1579, 1605]], [[64531, 64531], "mapped", [1579, 1609]], [[64532, 64532], "mapped", [1579, 1610]], [[64533, 64533], "mapped", [1580, 1581]], [[64534, 64534], "mapped", [1580, 1605]], [[64535, 64535], "mapped", [1581, 1580]], [[64536, 64536], "mapped", [1581, 1605]], [[64537, 64537], "mapped", [1582, 1580]], [[64538, 64538], "mapped", [1582, 1581]], [[64539, 64539], "mapped", [1582, 1605]], [[64540, 64540], "mapped", [1587, 1580]], [[64541, 64541], "mapped", [1587, 1581]], [[64542, 64542], "mapped", [1587, 1582]], [[64543, 64543], "mapped", [1587, 1605]], [[64544, 64544], "mapped", [1589, 1581]], [[64545, 64545], "mapped", [1589, 1605]], [[64546, 64546], "mapped", [1590, 1580]], [[64547, 64547], "mapped", [1590, 1581]], [[64548, 64548], "mapped", [1590, 1582]], [[64549, 64549], "mapped", [1590, 1605]], [[64550, 64550], "mapped", [1591, 1581]], [[64551, 64551], "mapped", [1591, 1605]], [[64552, 64552], "mapped", [1592, 1605]], [[64553, 64553], "mapped", [1593, 1580]], [[64554, 64554], "mapped", [1593, 1605]], [[64555, 64555], "mapped", [1594, 1580]], [[64556, 64556], "mapped", [1594, 1605]], [[64557, 64557], "mapped", [1601, 1580]], [[64558, 64558], "mapped", [1601, 1581]], [[64559, 64559], "mapped", [1601, 1582]], [[64560, 64560], "mapped", [1601, 1605]], [[64561, 64561], "mapped", [1601, 1609]], [[64562, 64562], "mapped", [1601, 1610]], [[64563, 64563], "mapped", [1602, 1581]], [[64564, 64564], "mapped", [1602, 1605]], [[64565, 64565], "mapped", [1602, 1609]], [[64566, 64566], "mapped", [1602, 1610]], [[64567, 64567], "mapped", [1603, 1575]], [[64568, 64568], "mapped", [1603, 1580]], [[64569, 64569], "mapped", [1603, 1581]], [[64570, 64570], "mapped", [1603, 1582]], [[64571, 64571], "mapped", [1603, 1604]], [[64572, 64572], "mapped", [1603, 1605]], [[64573, 64573], "mapped", [1603, 1609]], [[64574, 64574], "mapped", [1603, 1610]], [[64575, 64575], "mapped", [1604, 1580]], [[64576, 64576], "mapped", [1604, 1581]], [[64577, 64577], "mapped", [1604, 1582]], [[64578, 64578], "mapped", [1604, 1605]], [[64579, 64579], "mapped", [1604, 1609]], [[64580, 64580], "mapped", [1604, 1610]], [[64581, 64581], "mapped", [1605, 1580]], [[64582, 64582], "mapped", [1605, 1581]], [[64583, 64583], "mapped", [1605, 1582]], [[64584, 64584], "mapped", [1605, 1605]], [[64585, 64585], "mapped", [1605, 1609]], [[64586, 64586], "mapped", [1605, 1610]], [[64587, 64587], "mapped", [1606, 1580]], [[64588, 64588], "mapped", [1606, 1581]], [[64589, 64589], "mapped", [1606, 1582]], [[64590, 64590], "mapped", [1606, 1605]], [[64591, 64591], "mapped", [1606, 1609]], [[64592, 64592], "mapped", [1606, 1610]], [[64593, 64593], "mapped", [1607, 1580]], [[64594, 64594], "mapped", [1607, 1605]], [[64595, 64595], "mapped", [1607, 1609]], [[64596, 64596], "mapped", [1607, 1610]], [[64597, 64597], "mapped", [1610, 1580]], [[64598, 64598], "mapped", [1610, 1581]], [[64599, 64599], "mapped", [1610, 1582]], [[64600, 64600], "mapped", [1610, 1605]], [[64601, 64601], "mapped", [1610, 1609]], [[64602, 64602], "mapped", [1610, 1610]], [[64603, 64603], "mapped", [1584, 1648]], [[64604, 64604], "mapped", [1585, 1648]], [[64605, 64605], "mapped", [1609, 1648]], [[64606, 64606], "disallowed_STD3_mapped", [32, 1612, 1617]], [[64607, 64607], "disallowed_STD3_mapped", [32, 1613, 1617]], [[64608, 64608], "disallowed_STD3_mapped", [32, 1614, 1617]], [[64609, 64609], "disallowed_STD3_mapped", [32, 1615, 1617]], [[64610, 64610], "disallowed_STD3_mapped", [32, 1616, 1617]], [[64611, 64611], "disallowed_STD3_mapped", [32, 1617, 1648]], [[64612, 64612], "mapped", [1574, 1585]], [[64613, 64613], "mapped", [1574, 1586]], [[64614, 64614], "mapped", [1574, 1605]], [[64615, 64615], "mapped", [1574, 1606]], [[64616, 64616], "mapped", [1574, 1609]], [[64617, 64617], "mapped", [1574, 1610]], [[64618, 64618], "mapped", [1576, 1585]], [[64619, 64619], "mapped", [1576, 1586]], [[64620, 64620], "mapped", [1576, 1605]], [[64621, 64621], "mapped", [1576, 1606]], [[64622, 64622], "mapped", [1576, 1609]], [[64623, 64623], "mapped", [1576, 1610]], [[64624, 64624], "mapped", [1578, 1585]], [[64625, 64625], "mapped", [1578, 1586]], [[64626, 64626], "mapped", [1578, 1605]], [[64627, 64627], "mapped", [1578, 1606]], [[64628, 64628], "mapped", [1578, 1609]], [[64629, 64629], "mapped", [1578, 1610]], [[64630, 64630], "mapped", [1579, 1585]], [[64631, 64631], "mapped", [1579, 1586]], [[64632, 64632], "mapped", [1579, 1605]], [[64633, 64633], "mapped", [1579, 1606]], [[64634, 64634], "mapped", [1579, 1609]], [[64635, 64635], "mapped", [1579, 1610]], [[64636, 64636], "mapped", [1601, 1609]], [[64637, 64637], "mapped", [1601, 1610]], [[64638, 64638], "mapped", [1602, 1609]], [[64639, 64639], "mapped", [1602, 1610]], [[64640, 64640], "mapped", [1603, 1575]], [[64641, 64641], "mapped", [1603, 1604]], [[64642, 64642], "mapped", [1603, 1605]], [[64643, 64643], "mapped", [1603, 1609]], [[64644, 64644], "mapped", [1603, 1610]], [[64645, 64645], "mapped", [1604, 1605]], [[64646, 64646], "mapped", [1604, 1609]], [[64647, 64647], "mapped", [1604, 1610]], [[64648, 64648], "mapped", [1605, 1575]], [[64649, 64649], "mapped", [1605, 1605]], [[64650, 64650], "mapped", [1606, 1585]], [[64651, 64651], "mapped", [1606, 1586]], [[64652, 64652], "mapped", [1606, 1605]], [[64653, 64653], "mapped", [1606, 1606]], [[64654, 64654], "mapped", [1606, 1609]], [[64655, 64655], "mapped", [1606, 1610]], [[64656, 64656], "mapped", [1609, 1648]], [[64657, 64657], "mapped", [1610, 1585]], [[64658, 64658], "mapped", [1610, 1586]], [[64659, 64659], "mapped", [1610, 1605]], [[64660, 64660], "mapped", [1610, 1606]], [[64661, 64661], "mapped", [1610, 1609]], [[64662, 64662], "mapped", [1610, 1610]], [[64663, 64663], "mapped", [1574, 1580]], [[64664, 64664], "mapped", [1574, 1581]], [[64665, 64665], "mapped", [1574, 1582]], [[64666, 64666], "mapped", [1574, 1605]], [[64667, 64667], "mapped", [1574, 1607]], [[64668, 64668], "mapped", [1576, 1580]], [[64669, 64669], "mapped", [1576, 1581]], [[64670, 64670], "mapped", [1576, 1582]], [[64671, 64671], "mapped", [1576, 1605]], [[64672, 64672], "mapped", [1576, 1607]], [[64673, 64673], "mapped", [1578, 1580]], [[64674, 64674], "mapped", [1578, 1581]], [[64675, 64675], "mapped", [1578, 1582]], [[64676, 64676], "mapped", [1578, 1605]], [[64677, 64677], "mapped", [1578, 1607]], [[64678, 64678], "mapped", [1579, 1605]], [[64679, 64679], "mapped", [1580, 1581]], [[64680, 64680], "mapped", [1580, 1605]], [[64681, 64681], "mapped", [1581, 1580]], [[64682, 64682], "mapped", [1581, 1605]], [[64683, 64683], "mapped", [1582, 1580]], [[64684, 64684], "mapped", [1582, 1605]], [[64685, 64685], "mapped", [1587, 1580]], [[64686, 64686], "mapped", [1587, 1581]], [[64687, 64687], "mapped", [1587, 1582]], [[64688, 64688], "mapped", [1587, 1605]], [[64689, 64689], "mapped", [1589, 1581]], [[64690, 64690], "mapped", [1589, 1582]], [[64691, 64691], "mapped", [1589, 1605]], [[64692, 64692], "mapped", [1590, 1580]], [[64693, 64693], "mapped", [1590, 1581]], [[64694, 64694], "mapped", [1590, 1582]], [[64695, 64695], "mapped", [1590, 1605]], [[64696, 64696], "mapped", [1591, 1581]], [[64697, 64697], "mapped", [1592, 1605]], [[64698, 64698], "mapped", [1593, 1580]], [[64699, 64699], "mapped", [1593, 1605]], [[64700, 64700], "mapped", [1594, 1580]], [[64701, 64701], "mapped", [1594, 1605]], [[64702, 64702], "mapped", [1601, 1580]], [[64703, 64703], "mapped", [1601, 1581]], [[64704, 64704], "mapped", [1601, 1582]], [[64705, 64705], "mapped", [1601, 1605]], [[64706, 64706], "mapped", [1602, 1581]], [[64707, 64707], "mapped", [1602, 1605]], [[64708, 64708], "mapped", [1603, 1580]], [[64709, 64709], "mapped", [1603, 1581]], [[64710, 64710], "mapped", [1603, 1582]], [[64711, 64711], "mapped", [1603, 1604]], [[64712, 64712], "mapped", [1603, 1605]], [[64713, 64713], "mapped", [1604, 1580]], [[64714, 64714], "mapped", [1604, 1581]], [[64715, 64715], "mapped", [1604, 1582]], [[64716, 64716], "mapped", [1604, 1605]], [[64717, 64717], "mapped", [1604, 1607]], [[64718, 64718], "mapped", [1605, 1580]], [[64719, 64719], "mapped", [1605, 1581]], [[64720, 64720], "mapped", [1605, 1582]], [[64721, 64721], "mapped", [1605, 1605]], [[64722, 64722], "mapped", [1606, 1580]], [[64723, 64723], "mapped", [1606, 1581]], [[64724, 64724], "mapped", [1606, 1582]], [[64725, 64725], "mapped", [1606, 1605]], [[64726, 64726], "mapped", [1606, 1607]], [[64727, 64727], "mapped", [1607, 1580]], [[64728, 64728], "mapped", [1607, 1605]], [[64729, 64729], "mapped", [1607, 1648]], [[64730, 64730], "mapped", [1610, 1580]], [[64731, 64731], "mapped", [1610, 1581]], [[64732, 64732], "mapped", [1610, 1582]], [[64733, 64733], "mapped", [1610, 1605]], [[64734, 64734], "mapped", [1610, 1607]], [[64735, 64735], "mapped", [1574, 1605]], [[64736, 64736], "mapped", [1574, 1607]], [[64737, 64737], "mapped", [1576, 1605]], [[64738, 64738], "mapped", [1576, 1607]], [[64739, 64739], "mapped", [1578, 1605]], [[64740, 64740], "mapped", [1578, 1607]], [[64741, 64741], "mapped", [1579, 1605]], [[64742, 64742], "mapped", [1579, 1607]], [[64743, 64743], "mapped", [1587, 1605]], [[64744, 64744], "mapped", [1587, 1607]], [[64745, 64745], "mapped", [1588, 1605]], [[64746, 64746], "mapped", [1588, 1607]], [[64747, 64747], "mapped", [1603, 1604]], [[64748, 64748], "mapped", [1603, 1605]], [[64749, 64749], "mapped", [1604, 1605]], [[64750, 64750], "mapped", [1606, 1605]], [[64751, 64751], "mapped", [1606, 1607]], [[64752, 64752], "mapped", [1610, 1605]], [[64753, 64753], "mapped", [1610, 1607]], [[64754, 64754], "mapped", [1600, 1614, 1617]], [[64755, 64755], "mapped", [1600, 1615, 1617]], [[64756, 64756], "mapped", [1600, 1616, 1617]], [[64757, 64757], "mapped", [1591, 1609]], [[64758, 64758], "mapped", [1591, 1610]], [[64759, 64759], "mapped", [1593, 1609]], [[64760, 64760], "mapped", [1593, 1610]], [[64761, 64761], "mapped", [1594, 1609]], [[64762, 64762], "mapped", [1594, 1610]], [[64763, 64763], "mapped", [1587, 1609]], [[64764, 64764], "mapped", [1587, 1610]], [[64765, 64765], "mapped", [1588, 1609]], [[64766, 64766], "mapped", [1588, 1610]], [[64767, 64767], "mapped", [1581, 1609]], [[64768, 64768], "mapped", [1581, 1610]], [[64769, 64769], "mapped", [1580, 1609]], [[64770, 64770], "mapped", [1580, 1610]], [[64771, 64771], "mapped", [1582, 1609]], [[64772, 64772], "mapped", [1582, 1610]], [[64773, 64773], "mapped", [1589, 1609]], [[64774, 64774], "mapped", [1589, 1610]], [[64775, 64775], "mapped", [1590, 1609]], [[64776, 64776], "mapped", [1590, 1610]], [[64777, 64777], "mapped", [1588, 1580]], [[64778, 64778], "mapped", [1588, 1581]], [[64779, 64779], "mapped", [1588, 1582]], [[64780, 64780], "mapped", [1588, 1605]], [[64781, 64781], "mapped", [1588, 1585]], [[64782, 64782], "mapped", [1587, 1585]], [[64783, 64783], "mapped", [1589, 1585]], [[64784, 64784], "mapped", [1590, 1585]], [[64785, 64785], "mapped", [1591, 1609]], [[64786, 64786], "mapped", [1591, 1610]], [[64787, 64787], "mapped", [1593, 1609]], [[64788, 64788], "mapped", [1593, 1610]], [[64789, 64789], "mapped", [1594, 1609]], [[64790, 64790], "mapped", [1594, 1610]], [[64791, 64791], "mapped", [1587, 1609]], [[64792, 64792], "mapped", [1587, 1610]], [[64793, 64793], "mapped", [1588, 1609]], [[64794, 64794], "mapped", [1588, 1610]], [[64795, 64795], "mapped", [1581, 1609]], [[64796, 64796], "mapped", [1581, 1610]], [[64797, 64797], "mapped", [1580, 1609]], [[64798, 64798], "mapped", [1580, 1610]], [[64799, 64799], "mapped", [1582, 1609]], [[64800, 64800], "mapped", [1582, 1610]], [[64801, 64801], "mapped", [1589, 1609]], [[64802, 64802], "mapped", [1589, 1610]], [[64803, 64803], "mapped", [1590, 1609]], [[64804, 64804], "mapped", [1590, 1610]], [[64805, 64805], "mapped", [1588, 1580]], [[64806, 64806], "mapped", [1588, 1581]], [[64807, 64807], "mapped", [1588, 1582]], [[64808, 64808], "mapped", [1588, 1605]], [[64809, 64809], "mapped", [1588, 1585]], [[64810, 64810], "mapped", [1587, 1585]], [[64811, 64811], "mapped", [1589, 1585]], [[64812, 64812], "mapped", [1590, 1585]], [[64813, 64813], "mapped", [1588, 1580]], [[64814, 64814], "mapped", [1588, 1581]], [[64815, 64815], "mapped", [1588, 1582]], [[64816, 64816], "mapped", [1588, 1605]], [[64817, 64817], "mapped", [1587, 1607]], [[64818, 64818], "mapped", [1588, 1607]], [[64819, 64819], "mapped", [1591, 1605]], [[64820, 64820], "mapped", [1587, 1580]], [[64821, 64821], "mapped", [1587, 1581]], [[64822, 64822], "mapped", [1587, 1582]], [[64823, 64823], "mapped", [1588, 1580]], [[64824, 64824], "mapped", [1588, 1581]], [[64825, 64825], "mapped", [1588, 1582]], [[64826, 64826], "mapped", [1591, 1605]], [[64827, 64827], "mapped", [1592, 1605]], [[64828, 64829], "mapped", [1575, 1611]], [[64830, 64831], "valid", [], "NV8"], [[64832, 64847], "disallowed"], [[64848, 64848], "mapped", [1578, 1580, 1605]], [[64849, 64850], "mapped", [1578, 1581, 1580]], [[64851, 64851], "mapped", [1578, 1581, 1605]], [[64852, 64852], "mapped", [1578, 1582, 1605]], [[64853, 64853], "mapped", [1578, 1605, 1580]], [[64854, 64854], "mapped", [1578, 1605, 1581]], [[64855, 64855], "mapped", [1578, 1605, 1582]], [[64856, 64857], "mapped", [1580, 1605, 1581]], [[64858, 64858], "mapped", [1581, 1605, 1610]], [[64859, 64859], "mapped", [1581, 1605, 1609]], [[64860, 64860], "mapped", [1587, 1581, 1580]], [[64861, 64861], "mapped", [1587, 1580, 1581]], [[64862, 64862], "mapped", [1587, 1580, 1609]], [[64863, 64864], "mapped", [1587, 1605, 1581]], [[64865, 64865], "mapped", [1587, 1605, 1580]], [[64866, 64867], "mapped", [1587, 1605, 1605]], [[64868, 64869], "mapped", [1589, 1581, 1581]], [[64870, 64870], "mapped", [1589, 1605, 1605]], [[64871, 64872], "mapped", [1588, 1581, 1605]], [[64873, 64873], "mapped", [1588, 1580, 1610]], [[64874, 64875], "mapped", [1588, 1605, 1582]], [[64876, 64877], "mapped", [1588, 1605, 1605]], [[64878, 64878], "mapped", [1590, 1581, 1609]], [[64879, 64880], "mapped", [1590, 1582, 1605]], [[64881, 64882], "mapped", [1591, 1605, 1581]], [[64883, 64883], "mapped", [1591, 1605, 1605]], [[64884, 64884], "mapped", [1591, 1605, 1610]], [[64885, 64885], "mapped", [1593, 1580, 1605]], [[64886, 64887], "mapped", [1593, 1605, 1605]], [[64888, 64888], "mapped", [1593, 1605, 1609]], [[64889, 64889], "mapped", [1594, 1605, 1605]], [[64890, 64890], "mapped", [1594, 1605, 1610]], [[64891, 64891], "mapped", [1594, 1605, 1609]], [[64892, 64893], "mapped", [1601, 1582, 1605]], [[64894, 64894], "mapped", [1602, 1605, 1581]], [[64895, 64895], "mapped", [1602, 1605, 1605]], [[64896, 64896], "mapped", [1604, 1581, 1605]], [[64897, 64897], "mapped", [1604, 1581, 1610]], [[64898, 64898], "mapped", [1604, 1581, 1609]], [[64899, 64900], "mapped", [1604, 1580, 1580]], [[64901, 64902], "mapped", [1604, 1582, 1605]], [[64903, 64904], "mapped", [1604, 1605, 1581]], [[64905, 64905], "mapped", [1605, 1581, 1580]], [[64906, 64906], "mapped", [1605, 1581, 1605]], [[64907, 64907], "mapped", [1605, 1581, 1610]], [[64908, 64908], "mapped", [1605, 1580, 1581]], [[64909, 64909], "mapped", [1605, 1580, 1605]], [[64910, 64910], "mapped", [1605, 1582, 1580]], [[64911, 64911], "mapped", [1605, 1582, 1605]], [[64912, 64913], "disallowed"], [[64914, 64914], "mapped", [1605, 1580, 1582]], [[64915, 64915], "mapped", [1607, 1605, 1580]], [[64916, 64916], "mapped", [1607, 1605, 1605]], [[64917, 64917], "mapped", [1606, 1581, 1605]], [[64918, 64918], "mapped", [1606, 1581, 1609]], [[64919, 64920], "mapped", [1606, 1580, 1605]], [[64921, 64921], "mapped", [1606, 1580, 1609]], [[64922, 64922], "mapped", [1606, 1605, 1610]], [[64923, 64923], "mapped", [1606, 1605, 1609]], [[64924, 64925], "mapped", [1610, 1605, 1605]], [[64926, 64926], "mapped", [1576, 1582, 1610]], [[64927, 64927], "mapped", [1578, 1580, 1610]], [[64928, 64928], "mapped", [1578, 1580, 1609]], [[64929, 64929], "mapped", [1578, 1582, 1610]], [[64930, 64930], "mapped", [1578, 1582, 1609]], [[64931, 64931], "mapped", [1578, 1605, 1610]], [[64932, 64932], "mapped", [1578, 1605, 1609]], [[64933, 64933], "mapped", [1580, 1605, 1610]], [[64934, 64934], "mapped", [1580, 1581, 1609]], [[64935, 64935], "mapped", [1580, 1605, 1609]], [[64936, 64936], "mapped", [1587, 1582, 1609]], [[64937, 64937], "mapped", [1589, 1581, 1610]], [[64938, 64938], "mapped", [1588, 1581, 1610]], [[64939, 64939], "mapped", [1590, 1581, 1610]], [[64940, 64940], "mapped", [1604, 1580, 1610]], [[64941, 64941], "mapped", [1604, 1605, 1610]], [[64942, 64942], "mapped", [1610, 1581, 1610]], [[64943, 64943], "mapped", [1610, 1580, 1610]], [[64944, 64944], "mapped", [1610, 1605, 1610]], [[64945, 64945], "mapped", [1605, 1605, 1610]], [[64946, 64946], "mapped", [1602, 1605, 1610]], [[64947, 64947], "mapped", [1606, 1581, 1610]], [[64948, 64948], "mapped", [1602, 1605, 1581]], [[64949, 64949], "mapped", [1604, 1581, 1605]], [[64950, 64950], "mapped", [1593, 1605, 1610]], [[64951, 64951], "mapped", [1603, 1605, 1610]], [[64952, 64952], "mapped", [1606, 1580, 1581]], [[64953, 64953], "mapped", [1605, 1582, 1610]], [[64954, 64954], "mapped", [1604, 1580, 1605]], [[64955, 64955], "mapped", [1603, 1605, 1605]], [[64956, 64956], "mapped", [1604, 1580, 1605]], [[64957, 64957], "mapped", [1606, 1580, 1581]], [[64958, 64958], "mapped", [1580, 1581, 1610]], [[64959, 64959], "mapped", [1581, 1580, 1610]], [[64960, 64960], "mapped", [1605, 1580, 1610]], [[64961, 64961], "mapped", [1601, 1605, 1610]], [[64962, 64962], "mapped", [1576, 1581, 1610]], [[64963, 64963], "mapped", [1603, 1605, 1605]], [[64964, 64964], "mapped", [1593, 1580, 1605]], [[64965, 64965], "mapped", [1589, 1605, 1605]], [[64966, 64966], "mapped", [1587, 1582, 1610]], [[64967, 64967], "mapped", [1606, 1580, 1610]], [[64968, 64975], "disallowed"], [[64976, 65007], "disallowed"], [[65008, 65008], "mapped", [1589, 1604, 1746]], [[65009, 65009], "mapped", [1602, 1604, 1746]], [[65010, 65010], "mapped", [1575, 1604, 1604, 1607]], [[65011, 65011], "mapped", [1575, 1603, 1576, 1585]], [[65012, 65012], "mapped", [1605, 1581, 1605, 1583]], [[65013, 65013], "mapped", [1589, 1604, 1593, 1605]], [[65014, 65014], "mapped", [1585, 1587, 1608, 1604]], [[65015, 65015], "mapped", [1593, 1604, 1610, 1607]], [[65016, 65016], "mapped", [1608, 1587, 1604, 1605]], [[65017, 65017], "mapped", [1589, 1604, 1609]], [[65018, 65018], "disallowed_STD3_mapped", [1589, 1604, 1609, 32, 1575, 1604, 1604, 1607, 32, 1593, 1604, 1610, 1607, 32, 1608, 1587, 1604, 1605]], [[65019, 65019], "disallowed_STD3_mapped", [1580, 1604, 32, 1580, 1604, 1575, 1604, 1607]], [[65020, 65020], "mapped", [1585, 1740, 1575, 1604]], [[65021, 65021], "valid", [], "NV8"], [[65022, 65023], "disallowed"], [[65024, 65039], "ignored"], [[65040, 65040], "disallowed_STD3_mapped", [44]], [[65041, 65041], "mapped", [12289]], [[65042, 65042], "disallowed"], [[65043, 65043], "disallowed_STD3_mapped", [58]], [[65044, 65044], "disallowed_STD3_mapped", [59]], [[65045, 65045], "disallowed_STD3_mapped", [33]], [[65046, 65046], "disallowed_STD3_mapped", [63]], [[65047, 65047], "mapped", [12310]], [[65048, 65048], "mapped", [12311]], [[65049, 65049], "disallowed"], [[65050, 65055], "disallowed"], [[65056, 65059], "valid"], [[65060, 65062], "valid"], [[65063, 65069], "valid"], [[65070, 65071], "valid"], [[65072, 65072], "disallowed"], [[65073, 65073], "mapped", [8212]], [[65074, 65074], "mapped", [8211]], [[65075, 65076], "disallowed_STD3_mapped", [95]], [[65077, 65077], "disallowed_STD3_mapped", [40]], [[65078, 65078], "disallowed_STD3_mapped", [41]], [[65079, 65079], "disallowed_STD3_mapped", [123]], [[65080, 65080], "disallowed_STD3_mapped", [125]], [[65081, 65081], "mapped", [12308]], [[65082, 65082], "mapped", [12309]], [[65083, 65083], "mapped", [12304]], [[65084, 65084], "mapped", [12305]], [[65085, 65085], "mapped", [12298]], [[65086, 65086], "mapped", [12299]], [[65087, 65087], "mapped", [12296]], [[65088, 65088], "mapped", [12297]], [[65089, 65089], "mapped", [12300]], [[65090, 65090], "mapped", [12301]], [[65091, 65091], "mapped", [12302]], [[65092, 65092], "mapped", [12303]], [[65093, 65094], "valid", [], "NV8"], [[65095, 65095], "disallowed_STD3_mapped", [91]], [[65096, 65096], "disallowed_STD3_mapped", [93]], [[65097, 65100], "disallowed_STD3_mapped", [32, 773]], [[65101, 65103], "disallowed_STD3_mapped", [95]], [[65104, 65104], "disallowed_STD3_mapped", [44]], [[65105, 65105], "mapped", [12289]], [[65106, 65106], "disallowed"], [[65107, 65107], "disallowed"], [[65108, 65108], "disallowed_STD3_mapped", [59]], [[65109, 65109], "disallowed_STD3_mapped", [58]], [[65110, 65110], "disallowed_STD3_mapped", [63]], [[65111, 65111], "disallowed_STD3_mapped", [33]], [[65112, 65112], "mapped", [8212]], [[65113, 65113], "disallowed_STD3_mapped", [40]], [[65114, 65114], "disallowed_STD3_mapped", [41]], [[65115, 65115], "disallowed_STD3_mapped", [123]], [[65116, 65116], "disallowed_STD3_mapped", [125]], [[65117, 65117], "mapped", [12308]], [[65118, 65118], "mapped", [12309]], [[65119, 65119], "disallowed_STD3_mapped", [35]], [[65120, 65120], "disallowed_STD3_mapped", [38]], [[65121, 65121], "disallowed_STD3_mapped", [42]], [[65122, 65122], "disallowed_STD3_mapped", [43]], [[65123, 65123], "mapped", [45]], [[65124, 65124], "disallowed_STD3_mapped", [60]], [[65125, 65125], "disallowed_STD3_mapped", [62]], [[65126, 65126], "disallowed_STD3_mapped", [61]], [[65127, 65127], "disallowed"], [[65128, 65128], "disallowed_STD3_mapped", [92]], [[65129, 65129], "disallowed_STD3_mapped", [36]], [[65130, 65130], "disallowed_STD3_mapped", [37]], [[65131, 65131], "disallowed_STD3_mapped", [64]], [[65132, 65135], "disallowed"], [[65136, 65136], "disallowed_STD3_mapped", [32, 1611]], [[65137, 65137], "mapped", [1600, 1611]], [[65138, 65138], "disallowed_STD3_mapped", [32, 1612]], [[65139, 65139], "valid"], [[65140, 65140], "disallowed_STD3_mapped", [32, 1613]], [[65141, 65141], "disallowed"], [[65142, 65142], "disallowed_STD3_mapped", [32, 1614]], [[65143, 65143], "mapped", [1600, 1614]], [[65144, 65144], "disallowed_STD3_mapped", [32, 1615]], [[65145, 65145], "mapped", [1600, 1615]], [[65146, 65146], "disallowed_STD3_mapped", [32, 1616]], [[65147, 65147], "mapped", [1600, 1616]], [[65148, 65148], "disallowed_STD3_mapped", [32, 1617]], [[65149, 65149], "mapped", [1600, 1617]], [[65150, 65150], "disallowed_STD3_mapped", [32, 1618]], [[65151, 65151], "mapped", [1600, 1618]], [[65152, 65152], "mapped", [1569]], [[65153, 65154], "mapped", [1570]], [[65155, 65156], "mapped", [1571]], [[65157, 65158], "mapped", [1572]], [[65159, 65160], "mapped", [1573]], [[65161, 65164], "mapped", [1574]], [[65165, 65166], "mapped", [1575]], [[65167, 65170], "mapped", [1576]], [[65171, 65172], "mapped", [1577]], [[65173, 65176], "mapped", [1578]], [[65177, 65180], "mapped", [1579]], [[65181, 65184], "mapped", [1580]], [[65185, 65188], "mapped", [1581]], [[65189, 65192], "mapped", [1582]], [[65193, 65194], "mapped", [1583]], [[65195, 65196], "mapped", [1584]], [[65197, 65198], "mapped", [1585]], [[65199, 65200], "mapped", [1586]], [[65201, 65204], "mapped", [1587]], [[65205, 65208], "mapped", [1588]], [[65209, 65212], "mapped", [1589]], [[65213, 65216], "mapped", [1590]], [[65217, 65220], "mapped", [1591]], [[65221, 65224], "mapped", [1592]], [[65225, 65228], "mapped", [1593]], [[65229, 65232], "mapped", [1594]], [[65233, 65236], "mapped", [1601]], [[65237, 65240], "mapped", [1602]], [[65241, 65244], "mapped", [1603]], [[65245, 65248], "mapped", [1604]], [[65249, 65252], "mapped", [1605]], [[65253, 65256], "mapped", [1606]], [[65257, 65260], "mapped", [1607]], [[65261, 65262], "mapped", [1608]], [[65263, 65264], "mapped", [1609]], [[65265, 65268], "mapped", [1610]], [[65269, 65270], "mapped", [1604, 1570]], [[65271, 65272], "mapped", [1604, 1571]], [[65273, 65274], "mapped", [1604, 1573]], [[65275, 65276], "mapped", [1604, 1575]], [[65277, 65278], "disallowed"], [[65279, 65279], "ignored"], [[65280, 65280], "disallowed"], [[65281, 65281], "disallowed_STD3_mapped", [33]], [[65282, 65282], "disallowed_STD3_mapped", [34]], [[65283, 65283], "disallowed_STD3_mapped", [35]], [[65284, 65284], "disallowed_STD3_mapped", [36]], [[65285, 65285], "disallowed_STD3_mapped", [37]], [[65286, 65286], "disallowed_STD3_mapped", [38]], [[65287, 65287], "disallowed_STD3_mapped", [39]], [[65288, 65288], "disallowed_STD3_mapped", [40]], [[65289, 65289], "disallowed_STD3_mapped", [41]], [[65290, 65290], "disallowed_STD3_mapped", [42]], [[65291, 65291], "disallowed_STD3_mapped", [43]], [[65292, 65292], "disallowed_STD3_mapped", [44]], [[65293, 65293], "mapped", [45]], [[65294, 65294], "mapped", [46]], [[65295, 65295], "disallowed_STD3_mapped", [47]], [[65296, 65296], "mapped", [48]], [[65297, 65297], "mapped", [49]], [[65298, 65298], "mapped", [50]], [[65299, 65299], "mapped", [51]], [[65300, 65300], "mapped", [52]], [[65301, 65301], "mapped", [53]], [[65302, 65302], "mapped", [54]], [[65303, 65303], "mapped", [55]], [[65304, 65304], "mapped", [56]], [[65305, 65305], "mapped", [57]], [[65306, 65306], "disallowed_STD3_mapped", [58]], [[65307, 65307], "disallowed_STD3_mapped", [59]], [[65308, 65308], "disallowed_STD3_mapped", [60]], [[65309, 65309], "disallowed_STD3_mapped", [61]], [[65310, 65310], "disallowed_STD3_mapped", [62]], [[65311, 65311], "disallowed_STD3_mapped", [63]], [[65312, 65312], "disallowed_STD3_mapped", [64]], [[65313, 65313], "mapped", [97]], [[65314, 65314], "mapped", [98]], [[65315, 65315], "mapped", [99]], [[65316, 65316], "mapped", [100]], [[65317, 65317], "mapped", [101]], [[65318, 65318], "mapped", [102]], [[65319, 65319], "mapped", [103]], [[65320, 65320], "mapped", [104]], [[65321, 65321], "mapped", [105]], [[65322, 65322], "mapped", [106]], [[65323, 65323], "mapped", [107]], [[65324, 65324], "mapped", [108]], [[65325, 65325], "mapped", [109]], [[65326, 65326], "mapped", [110]], [[65327, 65327], "mapped", [111]], [[65328, 65328], "mapped", [112]], [[65329, 65329], "mapped", [113]], [[65330, 65330], "mapped", [114]], [[65331, 65331], "mapped", [115]], [[65332, 65332], "mapped", [116]], [[65333, 65333], "mapped", [117]], [[65334, 65334], "mapped", [118]], [[65335, 65335], "mapped", [119]], [[65336, 65336], "mapped", [120]], [[65337, 65337], "mapped", [121]], [[65338, 65338], "mapped", [122]], [[65339, 65339], "disallowed_STD3_mapped", [91]], [[65340, 65340], "disallowed_STD3_mapped", [92]], [[65341, 65341], "disallowed_STD3_mapped", [93]], [[65342, 65342], "disallowed_STD3_mapped", [94]], [[65343, 65343], "disallowed_STD3_mapped", [95]], [[65344, 65344], "disallowed_STD3_mapped", [96]], [[65345, 65345], "mapped", [97]], [[65346, 65346], "mapped", [98]], [[65347, 65347], "mapped", [99]], [[65348, 65348], "mapped", [100]], [[65349, 65349], "mapped", [101]], [[65350, 65350], "mapped", [102]], [[65351, 65351], "mapped", [103]], [[65352, 65352], "mapped", [104]], [[65353, 65353], "mapped", [105]], [[65354, 65354], "mapped", [106]], [[65355, 65355], "mapped", [107]], [[65356, 65356], "mapped", [108]], [[65357, 65357], "mapped", [109]], [[65358, 65358], "mapped", [110]], [[65359, 65359], "mapped", [111]], [[65360, 65360], "mapped", [112]], [[65361, 65361], "mapped", [113]], [[65362, 65362], "mapped", [114]], [[65363, 65363], "mapped", [115]], [[65364, 65364], "mapped", [116]], [[65365, 65365], "mapped", [117]], [[65366, 65366], "mapped", [118]], [[65367, 65367], "mapped", [119]], [[65368, 65368], "mapped", [120]], [[65369, 65369], "mapped", [121]], [[65370, 65370], "mapped", [122]], [[65371, 65371], "disallowed_STD3_mapped", [123]], [[65372, 65372], "disallowed_STD3_mapped", [124]], [[65373, 65373], "disallowed_STD3_mapped", [125]], [[65374, 65374], "disallowed_STD3_mapped", [126]], [[65375, 65375], "mapped", [10629]], [[65376, 65376], "mapped", [10630]], [[65377, 65377], "mapped", [46]], [[65378, 65378], "mapped", [12300]], [[65379, 65379], "mapped", [12301]], [[65380, 65380], "mapped", [12289]], [[65381, 65381], "mapped", [12539]], [[65382, 65382], "mapped", [12530]], [[65383, 65383], "mapped", [12449]], [[65384, 65384], "mapped", [12451]], [[65385, 65385], "mapped", [12453]], [[65386, 65386], "mapped", [12455]], [[65387, 65387], "mapped", [12457]], [[65388, 65388], "mapped", [12515]], [[65389, 65389], "mapped", [12517]], [[65390, 65390], "mapped", [12519]], [[65391, 65391], "mapped", [12483]], [[65392, 65392], "mapped", [12540]], [[65393, 65393], "mapped", [12450]], [[65394, 65394], "mapped", [12452]], [[65395, 65395], "mapped", [12454]], [[65396, 65396], "mapped", [12456]], [[65397, 65397], "mapped", [12458]], [[65398, 65398], "mapped", [12459]], [[65399, 65399], "mapped", [12461]], [[65400, 65400], "mapped", [12463]], [[65401, 65401], "mapped", [12465]], [[65402, 65402], "mapped", [12467]], [[65403, 65403], "mapped", [12469]], [[65404, 65404], "mapped", [12471]], [[65405, 65405], "mapped", [12473]], [[65406, 65406], "mapped", [12475]], [[65407, 65407], "mapped", [12477]], [[65408, 65408], "mapped", [12479]], [[65409, 65409], "mapped", [12481]], [[65410, 65410], "mapped", [12484]], [[65411, 65411], "mapped", [12486]], [[65412, 65412], "mapped", [12488]], [[65413, 65413], "mapped", [12490]], [[65414, 65414], "mapped", [12491]], [[65415, 65415], "mapped", [12492]], [[65416, 65416], "mapped", [12493]], [[65417, 65417], "mapped", [12494]], [[65418, 65418], "mapped", [12495]], [[65419, 65419], "mapped", [12498]], [[65420, 65420], "mapped", [12501]], [[65421, 65421], "mapped", [12504]], [[65422, 65422], "mapped", [12507]], [[65423, 65423], "mapped", [12510]], [[65424, 65424], "mapped", [12511]], [[65425, 65425], "mapped", [12512]], [[65426, 65426], "mapped", [12513]], [[65427, 65427], "mapped", [12514]], [[65428, 65428], "mapped", [12516]], [[65429, 65429], "mapped", [12518]], [[65430, 65430], "mapped", [12520]], [[65431, 65431], "mapped", [12521]], [[65432, 65432], "mapped", [12522]], [[65433, 65433], "mapped", [12523]], [[65434, 65434], "mapped", [12524]], [[65435, 65435], "mapped", [12525]], [[65436, 65436], "mapped", [12527]], [[65437, 65437], "mapped", [12531]], [[65438, 65438], "mapped", [12441]], [[65439, 65439], "mapped", [12442]], [[65440, 65440], "disallowed"], [[65441, 65441], "mapped", [4352]], [[65442, 65442], "mapped", [4353]], [[65443, 65443], "mapped", [4522]], [[65444, 65444], "mapped", [4354]], [[65445, 65445], "mapped", [4524]], [[65446, 65446], "mapped", [4525]], [[65447, 65447], "mapped", [4355]], [[65448, 65448], "mapped", [4356]], [[65449, 65449], "mapped", [4357]], [[65450, 65450], "mapped", [4528]], [[65451, 65451], "mapped", [4529]], [[65452, 65452], "mapped", [4530]], [[65453, 65453], "mapped", [4531]], [[65454, 65454], "mapped", [4532]], [[65455, 65455], "mapped", [4533]], [[65456, 65456], "mapped", [4378]], [[65457, 65457], "mapped", [4358]], [[65458, 65458], "mapped", [4359]], [[65459, 65459], "mapped", [4360]], [[65460, 65460], "mapped", [4385]], [[65461, 65461], "mapped", [4361]], [[65462, 65462], "mapped", [4362]], [[65463, 65463], "mapped", [4363]], [[65464, 65464], "mapped", [4364]], [[65465, 65465], "mapped", [4365]], [[65466, 65466], "mapped", [4366]], [[65467, 65467], "mapped", [4367]], [[65468, 65468], "mapped", [4368]], [[65469, 65469], "mapped", [4369]], [[65470, 65470], "mapped", [4370]], [[65471, 65473], "disallowed"], [[65474, 65474], "mapped", [4449]], [[65475, 65475], "mapped", [4450]], [[65476, 65476], "mapped", [4451]], [[65477, 65477], "mapped", [4452]], [[65478, 65478], "mapped", [4453]], [[65479, 65479], "mapped", [4454]], [[65480, 65481], "disallowed"], [[65482, 65482], "mapped", [4455]], [[65483, 65483], "mapped", [4456]], [[65484, 65484], "mapped", [4457]], [[65485, 65485], "mapped", [4458]], [[65486, 65486], "mapped", [4459]], [[65487, 65487], "mapped", [4460]], [[65488, 65489], "disallowed"], [[65490, 65490], "mapped", [4461]], [[65491, 65491], "mapped", [4462]], [[65492, 65492], "mapped", [4463]], [[65493, 65493], "mapped", [4464]], [[65494, 65494], "mapped", [4465]], [[65495, 65495], "mapped", [4466]], [[65496, 65497], "disallowed"], [[65498, 65498], "mapped", [4467]], [[65499, 65499], "mapped", [4468]], [[65500, 65500], "mapped", [4469]], [[65501, 65503], "disallowed"], [[65504, 65504], "mapped", [162]], [[65505, 65505], "mapped", [163]], [[65506, 65506], "mapped", [172]], [[65507, 65507], "disallowed_STD3_mapped", [32, 772]], [[65508, 65508], "mapped", [166]], [[65509, 65509], "mapped", [165]], [[65510, 65510], "mapped", [8361]], [[65511, 65511], "disallowed"], [[65512, 65512], "mapped", [9474]], [[65513, 65513], "mapped", [8592]], [[65514, 65514], "mapped", [8593]], [[65515, 65515], "mapped", [8594]], [[65516, 65516], "mapped", [8595]], [[65517, 65517], "mapped", [9632]], [[65518, 65518], "mapped", [9675]], [[65519, 65528], "disallowed"], [[65529, 65531], "disallowed"], [[65532, 65532], "disallowed"], [[65533, 65533], "disallowed"], [[65534, 65535], "disallowed"], [[65536, 65547], "valid"], [[65548, 65548], "disallowed"], [[65549, 65574], "valid"], [[65575, 65575], "disallowed"], [[65576, 65594], "valid"], [[65595, 65595], "disallowed"], [[65596, 65597], "valid"], [[65598, 65598], "disallowed"], [[65599, 65613], "valid"], [[65614, 65615], "disallowed"], [[65616, 65629], "valid"], [[65630, 65663], "disallowed"], [[65664, 65786], "valid"], [[65787, 65791], "disallowed"], [[65792, 65794], "valid", [], "NV8"], [[65795, 65798], "disallowed"], [[65799, 65843], "valid", [], "NV8"], [[65844, 65846], "disallowed"], [[65847, 65855], "valid", [], "NV8"], [[65856, 65930], "valid", [], "NV8"], [[65931, 65932], "valid", [], "NV8"], [[65933, 65935], "disallowed"], [[65936, 65947], "valid", [], "NV8"], [[65948, 65951], "disallowed"], [[65952, 65952], "valid", [], "NV8"], [[65953, 65999], "disallowed"], [[66e3, 66044], "valid", [], "NV8"], [[66045, 66045], "valid"], [[66046, 66175], "disallowed"], [[66176, 66204], "valid"], [[66205, 66207], "disallowed"], [[66208, 66256], "valid"], [[66257, 66271], "disallowed"], [[66272, 66272], "valid"], [[66273, 66299], "valid", [], "NV8"], [[66300, 66303], "disallowed"], [[66304, 66334], "valid"], [[66335, 66335], "valid"], [[66336, 66339], "valid", [], "NV8"], [[66340, 66351], "disallowed"], [[66352, 66368], "valid"], [[66369, 66369], "valid", [], "NV8"], [[66370, 66377], "valid"], [[66378, 66378], "valid", [], "NV8"], [[66379, 66383], "disallowed"], [[66384, 66426], "valid"], [[66427, 66431], "disallowed"], [[66432, 66461], "valid"], [[66462, 66462], "disallowed"], [[66463, 66463], "valid", [], "NV8"], [[66464, 66499], "valid"], [[66500, 66503], "disallowed"], [[66504, 66511], "valid"], [[66512, 66517], "valid", [], "NV8"], [[66518, 66559], "disallowed"], [[66560, 66560], "mapped", [66600]], [[66561, 66561], "mapped", [66601]], [[66562, 66562], "mapped", [66602]], [[66563, 66563], "mapped", [66603]], [[66564, 66564], "mapped", [66604]], [[66565, 66565], "mapped", [66605]], [[66566, 66566], "mapped", [66606]], [[66567, 66567], "mapped", [66607]], [[66568, 66568], "mapped", [66608]], [[66569, 66569], "mapped", [66609]], [[66570, 66570], "mapped", [66610]], [[66571, 66571], "mapped", [66611]], [[66572, 66572], "mapped", [66612]], [[66573, 66573], "mapped", [66613]], [[66574, 66574], "mapped", [66614]], [[66575, 66575], "mapped", [66615]], [[66576, 66576], "mapped", [66616]], [[66577, 66577], "mapped", [66617]], [[66578, 66578], "mapped", [66618]], [[66579, 66579], "mapped", [66619]], [[66580, 66580], "mapped", [66620]], [[66581, 66581], "mapped", [66621]], [[66582, 66582], "mapped", [66622]], [[66583, 66583], "mapped", [66623]], [[66584, 66584], "mapped", [66624]], [[66585, 66585], "mapped", [66625]], [[66586, 66586], "mapped", [66626]], [[66587, 66587], "mapped", [66627]], [[66588, 66588], "mapped", [66628]], [[66589, 66589], "mapped", [66629]], [[66590, 66590], "mapped", [66630]], [[66591, 66591], "mapped", [66631]], [[66592, 66592], "mapped", [66632]], [[66593, 66593], "mapped", [66633]], [[66594, 66594], "mapped", [66634]], [[66595, 66595], "mapped", [66635]], [[66596, 66596], "mapped", [66636]], [[66597, 66597], "mapped", [66637]], [[66598, 66598], "mapped", [66638]], [[66599, 66599], "mapped", [66639]], [[66600, 66637], "valid"], [[66638, 66717], "valid"], [[66718, 66719], "disallowed"], [[66720, 66729], "valid"], [[66730, 66815], "disallowed"], [[66816, 66855], "valid"], [[66856, 66863], "disallowed"], [[66864, 66915], "valid"], [[66916, 66926], "disallowed"], [[66927, 66927], "valid", [], "NV8"], [[66928, 67071], "disallowed"], [[67072, 67382], "valid"], [[67383, 67391], "disallowed"], [[67392, 67413], "valid"], [[67414, 67423], "disallowed"], [[67424, 67431], "valid"], [[67432, 67583], "disallowed"], [[67584, 67589], "valid"], [[67590, 67591], "disallowed"], [[67592, 67592], "valid"], [[67593, 67593], "disallowed"], [[67594, 67637], "valid"], [[67638, 67638], "disallowed"], [[67639, 67640], "valid"], [[67641, 67643], "disallowed"], [[67644, 67644], "valid"], [[67645, 67646], "disallowed"], [[67647, 67647], "valid"], [[67648, 67669], "valid"], [[67670, 67670], "disallowed"], [[67671, 67679], "valid", [], "NV8"], [[67680, 67702], "valid"], [[67703, 67711], "valid", [], "NV8"], [[67712, 67742], "valid"], [[67743, 67750], "disallowed"], [[67751, 67759], "valid", [], "NV8"], [[67760, 67807], "disallowed"], [[67808, 67826], "valid"], [[67827, 67827], "disallowed"], [[67828, 67829], "valid"], [[67830, 67834], "disallowed"], [[67835, 67839], "valid", [], "NV8"], [[67840, 67861], "valid"], [[67862, 67865], "valid", [], "NV8"], [[67866, 67867], "valid", [], "NV8"], [[67868, 67870], "disallowed"], [[67871, 67871], "valid", [], "NV8"], [[67872, 67897], "valid"], [[67898, 67902], "disallowed"], [[67903, 67903], "valid", [], "NV8"], [[67904, 67967], "disallowed"], [[67968, 68023], "valid"], [[68024, 68027], "disallowed"], [[68028, 68029], "valid", [], "NV8"], [[68030, 68031], "valid"], [[68032, 68047], "valid", [], "NV8"], [[68048, 68049], "disallowed"], [[68050, 68095], "valid", [], "NV8"], [[68096, 68099], "valid"], [[68100, 68100], "disallowed"], [[68101, 68102], "valid"], [[68103, 68107], "disallowed"], [[68108, 68115], "valid"], [[68116, 68116], "disallowed"], [[68117, 68119], "valid"], [[68120, 68120], "disallowed"], [[68121, 68147], "valid"], [[68148, 68151], "disallowed"], [[68152, 68154], "valid"], [[68155, 68158], "disallowed"], [[68159, 68159], "valid"], [[68160, 68167], "valid", [], "NV8"], [[68168, 68175], "disallowed"], [[68176, 68184], "valid", [], "NV8"], [[68185, 68191], "disallowed"], [[68192, 68220], "valid"], [[68221, 68223], "valid", [], "NV8"], [[68224, 68252], "valid"], [[68253, 68255], "valid", [], "NV8"], [[68256, 68287], "disallowed"], [[68288, 68295], "valid"], [[68296, 68296], "valid", [], "NV8"], [[68297, 68326], "valid"], [[68327, 68330], "disallowed"], [[68331, 68342], "valid", [], "NV8"], [[68343, 68351], "disallowed"], [[68352, 68405], "valid"], [[68406, 68408], "disallowed"], [[68409, 68415], "valid", [], "NV8"], [[68416, 68437], "valid"], [[68438, 68439], "disallowed"], [[68440, 68447], "valid", [], "NV8"], [[68448, 68466], "valid"], [[68467, 68471], "disallowed"], [[68472, 68479], "valid", [], "NV8"], [[68480, 68497], "valid"], [[68498, 68504], "disallowed"], [[68505, 68508], "valid", [], "NV8"], [[68509, 68520], "disallowed"], [[68521, 68527], "valid", [], "NV8"], [[68528, 68607], "disallowed"], [[68608, 68680], "valid"], [[68681, 68735], "disallowed"], [[68736, 68736], "mapped", [68800]], [[68737, 68737], "mapped", [68801]], [[68738, 68738], "mapped", [68802]], [[68739, 68739], "mapped", [68803]], [[68740, 68740], "mapped", [68804]], [[68741, 68741], "mapped", [68805]], [[68742, 68742], "mapped", [68806]], [[68743, 68743], "mapped", [68807]], [[68744, 68744], "mapped", [68808]], [[68745, 68745], "mapped", [68809]], [[68746, 68746], "mapped", [68810]], [[68747, 68747], "mapped", [68811]], [[68748, 68748], "mapped", [68812]], [[68749, 68749], "mapped", [68813]], [[68750, 68750], "mapped", [68814]], [[68751, 68751], "mapped", [68815]], [[68752, 68752], "mapped", [68816]], [[68753, 68753], "mapped", [68817]], [[68754, 68754], "mapped", [68818]], [[68755, 68755], "mapped", [68819]], [[68756, 68756], "mapped", [68820]], [[68757, 68757], "mapped", [68821]], [[68758, 68758], "mapped", [68822]], [[68759, 68759], "mapped", [68823]], [[68760, 68760], "mapped", [68824]], [[68761, 68761], "mapped", [68825]], [[68762, 68762], "mapped", [68826]], [[68763, 68763], "mapped", [68827]], [[68764, 68764], "mapped", [68828]], [[68765, 68765], "mapped", [68829]], [[68766, 68766], "mapped", [68830]], [[68767, 68767], "mapped", [68831]], [[68768, 68768], "mapped", [68832]], [[68769, 68769], "mapped", [68833]], [[68770, 68770], "mapped", [68834]], [[68771, 68771], "mapped", [68835]], [[68772, 68772], "mapped", [68836]], [[68773, 68773], "mapped", [68837]], [[68774, 68774], "mapped", [68838]], [[68775, 68775], "mapped", [68839]], [[68776, 68776], "mapped", [68840]], [[68777, 68777], "mapped", [68841]], [[68778, 68778], "mapped", [68842]], [[68779, 68779], "mapped", [68843]], [[68780, 68780], "mapped", [68844]], [[68781, 68781], "mapped", [68845]], [[68782, 68782], "mapped", [68846]], [[68783, 68783], "mapped", [68847]], [[68784, 68784], "mapped", [68848]], [[68785, 68785], "mapped", [68849]], [[68786, 68786], "mapped", [68850]], [[68787, 68799], "disallowed"], [[68800, 68850], "valid"], [[68851, 68857], "disallowed"], [[68858, 68863], "valid", [], "NV8"], [[68864, 69215], "disallowed"], [[69216, 69246], "valid", [], "NV8"], [[69247, 69631], "disallowed"], [[69632, 69702], "valid"], [[69703, 69709], "valid", [], "NV8"], [[69710, 69713], "disallowed"], [[69714, 69733], "valid", [], "NV8"], [[69734, 69743], "valid"], [[69744, 69758], "disallowed"], [[69759, 69759], "valid"], [[69760, 69818], "valid"], [[69819, 69820], "valid", [], "NV8"], [[69821, 69821], "disallowed"], [[69822, 69825], "valid", [], "NV8"], [[69826, 69839], "disallowed"], [[69840, 69864], "valid"], [[69865, 69871], "disallowed"], [[69872, 69881], "valid"], [[69882, 69887], "disallowed"], [[69888, 69940], "valid"], [[69941, 69941], "disallowed"], [[69942, 69951], "valid"], [[69952, 69955], "valid", [], "NV8"], [[69956, 69967], "disallowed"], [[69968, 70003], "valid"], [[70004, 70005], "valid", [], "NV8"], [[70006, 70006], "valid"], [[70007, 70015], "disallowed"], [[70016, 70084], "valid"], [[70085, 70088], "valid", [], "NV8"], [[70089, 70089], "valid", [], "NV8"], [[70090, 70092], "valid"], [[70093, 70093], "valid", [], "NV8"], [[70094, 70095], "disallowed"], [[70096, 70105], "valid"], [[70106, 70106], "valid"], [[70107, 70107], "valid", [], "NV8"], [[70108, 70108], "valid"], [[70109, 70111], "valid", [], "NV8"], [[70112, 70112], "disallowed"], [[70113, 70132], "valid", [], "NV8"], [[70133, 70143], "disallowed"], [[70144, 70161], "valid"], [[70162, 70162], "disallowed"], [[70163, 70199], "valid"], [[70200, 70205], "valid", [], "NV8"], [[70206, 70271], "disallowed"], [[70272, 70278], "valid"], [[70279, 70279], "disallowed"], [[70280, 70280], "valid"], [[70281, 70281], "disallowed"], [[70282, 70285], "valid"], [[70286, 70286], "disallowed"], [[70287, 70301], "valid"], [[70302, 70302], "disallowed"], [[70303, 70312], "valid"], [[70313, 70313], "valid", [], "NV8"], [[70314, 70319], "disallowed"], [[70320, 70378], "valid"], [[70379, 70383], "disallowed"], [[70384, 70393], "valid"], [[70394, 70399], "disallowed"], [[70400, 70400], "valid"], [[70401, 70403], "valid"], [[70404, 70404], "disallowed"], [[70405, 70412], "valid"], [[70413, 70414], "disallowed"], [[70415, 70416], "valid"], [[70417, 70418], "disallowed"], [[70419, 70440], "valid"], [[70441, 70441], "disallowed"], [[70442, 70448], "valid"], [[70449, 70449], "disallowed"], [[70450, 70451], "valid"], [[70452, 70452], "disallowed"], [[70453, 70457], "valid"], [[70458, 70459], "disallowed"], [[70460, 70468], "valid"], [[70469, 70470], "disallowed"], [[70471, 70472], "valid"], [[70473, 70474], "disallowed"], [[70475, 70477], "valid"], [[70478, 70479], "disallowed"], [[70480, 70480], "valid"], [[70481, 70486], "disallowed"], [[70487, 70487], "valid"], [[70488, 70492], "disallowed"], [[70493, 70499], "valid"], [[70500, 70501], "disallowed"], [[70502, 70508], "valid"], [[70509, 70511], "disallowed"], [[70512, 70516], "valid"], [[70517, 70783], "disallowed"], [[70784, 70853], "valid"], [[70854, 70854], "valid", [], "NV8"], [[70855, 70855], "valid"], [[70856, 70863], "disallowed"], [[70864, 70873], "valid"], [[70874, 71039], "disallowed"], [[71040, 71093], "valid"], [[71094, 71095], "disallowed"], [[71096, 71104], "valid"], [[71105, 71113], "valid", [], "NV8"], [[71114, 71127], "valid", [], "NV8"], [[71128, 71133], "valid"], [[71134, 71167], "disallowed"], [[71168, 71232], "valid"], [[71233, 71235], "valid", [], "NV8"], [[71236, 71236], "valid"], [[71237, 71247], "disallowed"], [[71248, 71257], "valid"], [[71258, 71295], "disallowed"], [[71296, 71351], "valid"], [[71352, 71359], "disallowed"], [[71360, 71369], "valid"], [[71370, 71423], "disallowed"], [[71424, 71449], "valid"], [[71450, 71452], "disallowed"], [[71453, 71467], "valid"], [[71468, 71471], "disallowed"], [[71472, 71481], "valid"], [[71482, 71487], "valid", [], "NV8"], [[71488, 71839], "disallowed"], [[71840, 71840], "mapped", [71872]], [[71841, 71841], "mapped", [71873]], [[71842, 71842], "mapped", [71874]], [[71843, 71843], "mapped", [71875]], [[71844, 71844], "mapped", [71876]], [[71845, 71845], "mapped", [71877]], [[71846, 71846], "mapped", [71878]], [[71847, 71847], "mapped", [71879]], [[71848, 71848], "mapped", [71880]], [[71849, 71849], "mapped", [71881]], [[71850, 71850], "mapped", [71882]], [[71851, 71851], "mapped", [71883]], [[71852, 71852], "mapped", [71884]], [[71853, 71853], "mapped", [71885]], [[71854, 71854], "mapped", [71886]], [[71855, 71855], "mapped", [71887]], [[71856, 71856], "mapped", [71888]], [[71857, 71857], "mapped", [71889]], [[71858, 71858], "mapped", [71890]], [[71859, 71859], "mapped", [71891]], [[71860, 71860], "mapped", [71892]], [[71861, 71861], "mapped", [71893]], [[71862, 71862], "mapped", [71894]], [[71863, 71863], "mapped", [71895]], [[71864, 71864], "mapped", [71896]], [[71865, 71865], "mapped", [71897]], [[71866, 71866], "mapped", [71898]], [[71867, 71867], "mapped", [71899]], [[71868, 71868], "mapped", [71900]], [[71869, 71869], "mapped", [71901]], [[71870, 71870], "mapped", [71902]], [[71871, 71871], "mapped", [71903]], [[71872, 71913], "valid"], [[71914, 71922], "valid", [], "NV8"], [[71923, 71934], "disallowed"], [[71935, 71935], "valid"], [[71936, 72383], "disallowed"], [[72384, 72440], "valid"], [[72441, 73727], "disallowed"], [[73728, 74606], "valid"], [[74607, 74648], "valid"], [[74649, 74649], "valid"], [[74650, 74751], "disallowed"], [[74752, 74850], "valid", [], "NV8"], [[74851, 74862], "valid", [], "NV8"], [[74863, 74863], "disallowed"], [[74864, 74867], "valid", [], "NV8"], [[74868, 74868], "valid", [], "NV8"], [[74869, 74879], "disallowed"], [[74880, 75075], "valid"], [[75076, 77823], "disallowed"], [[77824, 78894], "valid"], [[78895, 82943], "disallowed"], [[82944, 83526], "valid"], [[83527, 92159], "disallowed"], [[92160, 92728], "valid"], [[92729, 92735], "disallowed"], [[92736, 92766], "valid"], [[92767, 92767], "disallowed"], [[92768, 92777], "valid"], [[92778, 92781], "disallowed"], [[92782, 92783], "valid", [], "NV8"], [[92784, 92879], "disallowed"], [[92880, 92909], "valid"], [[92910, 92911], "disallowed"], [[92912, 92916], "valid"], [[92917, 92917], "valid", [], "NV8"], [[92918, 92927], "disallowed"], [[92928, 92982], "valid"], [[92983, 92991], "valid", [], "NV8"], [[92992, 92995], "valid"], [[92996, 92997], "valid", [], "NV8"], [[92998, 93007], "disallowed"], [[93008, 93017], "valid"], [[93018, 93018], "disallowed"], [[93019, 93025], "valid", [], "NV8"], [[93026, 93026], "disallowed"], [[93027, 93047], "valid"], [[93048, 93052], "disallowed"], [[93053, 93071], "valid"], [[93072, 93951], "disallowed"], [[93952, 94020], "valid"], [[94021, 94031], "disallowed"], [[94032, 94078], "valid"], [[94079, 94094], "disallowed"], [[94095, 94111], "valid"], [[94112, 110591], "disallowed"], [[110592, 110593], "valid"], [[110594, 113663], "disallowed"], [[113664, 113770], "valid"], [[113771, 113775], "disallowed"], [[113776, 113788], "valid"], [[113789, 113791], "disallowed"], [[113792, 113800], "valid"], [[113801, 113807], "disallowed"], [[113808, 113817], "valid"], [[113818, 113819], "disallowed"], [[113820, 113820], "valid", [], "NV8"], [[113821, 113822], "valid"], [[113823, 113823], "valid", [], "NV8"], [[113824, 113827], "ignored"], [[113828, 118783], "disallowed"], [[118784, 119029], "valid", [], "NV8"], [[119030, 119039], "disallowed"], [[119040, 119078], "valid", [], "NV8"], [[119079, 119080], "disallowed"], [[119081, 119081], "valid", [], "NV8"], [[119082, 119133], "valid", [], "NV8"], [[119134, 119134], "mapped", [119127, 119141]], [[119135, 119135], "mapped", [119128, 119141]], [[119136, 119136], "mapped", [119128, 119141, 119150]], [[119137, 119137], "mapped", [119128, 119141, 119151]], [[119138, 119138], "mapped", [119128, 119141, 119152]], [[119139, 119139], "mapped", [119128, 119141, 119153]], [[119140, 119140], "mapped", [119128, 119141, 119154]], [[119141, 119154], "valid", [], "NV8"], [[119155, 119162], "disallowed"], [[119163, 119226], "valid", [], "NV8"], [[119227, 119227], "mapped", [119225, 119141]], [[119228, 119228], "mapped", [119226, 119141]], [[119229, 119229], "mapped", [119225, 119141, 119150]], [[119230, 119230], "mapped", [119226, 119141, 119150]], [[119231, 119231], "mapped", [119225, 119141, 119151]], [[119232, 119232], "mapped", [119226, 119141, 119151]], [[119233, 119261], "valid", [], "NV8"], [[119262, 119272], "valid", [], "NV8"], [[119273, 119295], "disallowed"], [[119296, 119365], "valid", [], "NV8"], [[119366, 119551], "disallowed"], [[119552, 119638], "valid", [], "NV8"], [[119639, 119647], "disallowed"], [[119648, 119665], "valid", [], "NV8"], [[119666, 119807], "disallowed"], [[119808, 119808], "mapped", [97]], [[119809, 119809], "mapped", [98]], [[119810, 119810], "mapped", [99]], [[119811, 119811], "mapped", [100]], [[119812, 119812], "mapped", [101]], [[119813, 119813], "mapped", [102]], [[119814, 119814], "mapped", [103]], [[119815, 119815], "mapped", [104]], [[119816, 119816], "mapped", [105]], [[119817, 119817], "mapped", [106]], [[119818, 119818], "mapped", [107]], [[119819, 119819], "mapped", [108]], [[119820, 119820], "mapped", [109]], [[119821, 119821], "mapped", [110]], [[119822, 119822], "mapped", [111]], [[119823, 119823], "mapped", [112]], [[119824, 119824], "mapped", [113]], [[119825, 119825], "mapped", [114]], [[119826, 119826], "mapped", [115]], [[119827, 119827], "mapped", [116]], [[119828, 119828], "mapped", [117]], [[119829, 119829], "mapped", [118]], [[119830, 119830], "mapped", [119]], [[119831, 119831], "mapped", [120]], [[119832, 119832], "mapped", [121]], [[119833, 119833], "mapped", [122]], [[119834, 119834], "mapped", [97]], [[119835, 119835], "mapped", [98]], [[119836, 119836], "mapped", [99]], [[119837, 119837], "mapped", [100]], [[119838, 119838], "mapped", [101]], [[119839, 119839], "mapped", [102]], [[119840, 119840], "mapped", [103]], [[119841, 119841], "mapped", [104]], [[119842, 119842], "mapped", [105]], [[119843, 119843], "mapped", [106]], [[119844, 119844], "mapped", [107]], [[119845, 119845], "mapped", [108]], [[119846, 119846], "mapped", [109]], [[119847, 119847], "mapped", [110]], [[119848, 119848], "mapped", [111]], [[119849, 119849], "mapped", [112]], [[119850, 119850], "mapped", [113]], [[119851, 119851], "mapped", [114]], [[119852, 119852], "mapped", [115]], [[119853, 119853], "mapped", [116]], [[119854, 119854], "mapped", [117]], [[119855, 119855], "mapped", [118]], [[119856, 119856], "mapped", [119]], [[119857, 119857], "mapped", [120]], [[119858, 119858], "mapped", [121]], [[119859, 119859], "mapped", [122]], [[119860, 119860], "mapped", [97]], [[119861, 119861], "mapped", [98]], [[119862, 119862], "mapped", [99]], [[119863, 119863], "mapped", [100]], [[119864, 119864], "mapped", [101]], [[119865, 119865], "mapped", [102]], [[119866, 119866], "mapped", [103]], [[119867, 119867], "mapped", [104]], [[119868, 119868], "mapped", [105]], [[119869, 119869], "mapped", [106]], [[119870, 119870], "mapped", [107]], [[119871, 119871], "mapped", [108]], [[119872, 119872], "mapped", [109]], [[119873, 119873], "mapped", [110]], [[119874, 119874], "mapped", [111]], [[119875, 119875], "mapped", [112]], [[119876, 119876], "mapped", [113]], [[119877, 119877], "mapped", [114]], [[119878, 119878], "mapped", [115]], [[119879, 119879], "mapped", [116]], [[119880, 119880], "mapped", [117]], [[119881, 119881], "mapped", [118]], [[119882, 119882], "mapped", [119]], [[119883, 119883], "mapped", [120]], [[119884, 119884], "mapped", [121]], [[119885, 119885], "mapped", [122]], [[119886, 119886], "mapped", [97]], [[119887, 119887], "mapped", [98]], [[119888, 119888], "mapped", [99]], [[119889, 119889], "mapped", [100]], [[119890, 119890], "mapped", [101]], [[119891, 119891], "mapped", [102]], [[119892, 119892], "mapped", [103]], [[119893, 119893], "disallowed"], [[119894, 119894], "mapped", [105]], [[119895, 119895], "mapped", [106]], [[119896, 119896], "mapped", [107]], [[119897, 119897], "mapped", [108]], [[119898, 119898], "mapped", [109]], [[119899, 119899], "mapped", [110]], [[119900, 119900], "mapped", [111]], [[119901, 119901], "mapped", [112]], [[119902, 119902], "mapped", [113]], [[119903, 119903], "mapped", [114]], [[119904, 119904], "mapped", [115]], [[119905, 119905], "mapped", [116]], [[119906, 119906], "mapped", [117]], [[119907, 119907], "mapped", [118]], [[119908, 119908], "mapped", [119]], [[119909, 119909], "mapped", [120]], [[119910, 119910], "mapped", [121]], [[119911, 119911], "mapped", [122]], [[119912, 119912], "mapped", [97]], [[119913, 119913], "mapped", [98]], [[119914, 119914], "mapped", [99]], [[119915, 119915], "mapped", [100]], [[119916, 119916], "mapped", [101]], [[119917, 119917], "mapped", [102]], [[119918, 119918], "mapped", [103]], [[119919, 119919], "mapped", [104]], [[119920, 119920], "mapped", [105]], [[119921, 119921], "mapped", [106]], [[119922, 119922], "mapped", [107]], [[119923, 119923], "mapped", [108]], [[119924, 119924], "mapped", [109]], [[119925, 119925], "mapped", [110]], [[119926, 119926], "mapped", [111]], [[119927, 119927], "mapped", [112]], [[119928, 119928], "mapped", [113]], [[119929, 119929], "mapped", [114]], [[119930, 119930], "mapped", [115]], [[119931, 119931], "mapped", [116]], [[119932, 119932], "mapped", [117]], [[119933, 119933], "mapped", [118]], [[119934, 119934], "mapped", [119]], [[119935, 119935], "mapped", [120]], [[119936, 119936], "mapped", [121]], [[119937, 119937], "mapped", [122]], [[119938, 119938], "mapped", [97]], [[119939, 119939], "mapped", [98]], [[119940, 119940], "mapped", [99]], [[119941, 119941], "mapped", [100]], [[119942, 119942], "mapped", [101]], [[119943, 119943], "mapped", [102]], [[119944, 119944], "mapped", [103]], [[119945, 119945], "mapped", [104]], [[119946, 119946], "mapped", [105]], [[119947, 119947], "mapped", [106]], [[119948, 119948], "mapped", [107]], [[119949, 119949], "mapped", [108]], [[119950, 119950], "mapped", [109]], [[119951, 119951], "mapped", [110]], [[119952, 119952], "mapped", [111]], [[119953, 119953], "mapped", [112]], [[119954, 119954], "mapped", [113]], [[119955, 119955], "mapped", [114]], [[119956, 119956], "mapped", [115]], [[119957, 119957], "mapped", [116]], [[119958, 119958], "mapped", [117]], [[119959, 119959], "mapped", [118]], [[119960, 119960], "mapped", [119]], [[119961, 119961], "mapped", [120]], [[119962, 119962], "mapped", [121]], [[119963, 119963], "mapped", [122]], [[119964, 119964], "mapped", [97]], [[119965, 119965], "disallowed"], [[119966, 119966], "mapped", [99]], [[119967, 119967], "mapped", [100]], [[119968, 119969], "disallowed"], [[119970, 119970], "mapped", [103]], [[119971, 119972], "disallowed"], [[119973, 119973], "mapped", [106]], [[119974, 119974], "mapped", [107]], [[119975, 119976], "disallowed"], [[119977, 119977], "mapped", [110]], [[119978, 119978], "mapped", [111]], [[119979, 119979], "mapped", [112]], [[119980, 119980], "mapped", [113]], [[119981, 119981], "disallowed"], [[119982, 119982], "mapped", [115]], [[119983, 119983], "mapped", [116]], [[119984, 119984], "mapped", [117]], [[119985, 119985], "mapped", [118]], [[119986, 119986], "mapped", [119]], [[119987, 119987], "mapped", [120]], [[119988, 119988], "mapped", [121]], [[119989, 119989], "mapped", [122]], [[119990, 119990], "mapped", [97]], [[119991, 119991], "mapped", [98]], [[119992, 119992], "mapped", [99]], [[119993, 119993], "mapped", [100]], [[119994, 119994], "disallowed"], [[119995, 119995], "mapped", [102]], [[119996, 119996], "disallowed"], [[119997, 119997], "mapped", [104]], [[119998, 119998], "mapped", [105]], [[119999, 119999], "mapped", [106]], [[12e4, 12e4], "mapped", [107]], [[120001, 120001], "mapped", [108]], [[120002, 120002], "mapped", [109]], [[120003, 120003], "mapped", [110]], [[120004, 120004], "disallowed"], [[120005, 120005], "mapped", [112]], [[120006, 120006], "mapped", [113]], [[120007, 120007], "mapped", [114]], [[120008, 120008], "mapped", [115]], [[120009, 120009], "mapped", [116]], [[120010, 120010], "mapped", [117]], [[120011, 120011], "mapped", [118]], [[120012, 120012], "mapped", [119]], [[120013, 120013], "mapped", [120]], [[120014, 120014], "mapped", [121]], [[120015, 120015], "mapped", [122]], [[120016, 120016], "mapped", [97]], [[120017, 120017], "mapped", [98]], [[120018, 120018], "mapped", [99]], [[120019, 120019], "mapped", [100]], [[120020, 120020], "mapped", [101]], [[120021, 120021], "mapped", [102]], [[120022, 120022], "mapped", [103]], [[120023, 120023], "mapped", [104]], [[120024, 120024], "mapped", [105]], [[120025, 120025], "mapped", [106]], [[120026, 120026], "mapped", [107]], [[120027, 120027], "mapped", [108]], [[120028, 120028], "mapped", [109]], [[120029, 120029], "mapped", [110]], [[120030, 120030], "mapped", [111]], [[120031, 120031], "mapped", [112]], [[120032, 120032], "mapped", [113]], [[120033, 120033], "mapped", [114]], [[120034, 120034], "mapped", [115]], [[120035, 120035], "mapped", [116]], [[120036, 120036], "mapped", [117]], [[120037, 120037], "mapped", [118]], [[120038, 120038], "mapped", [119]], [[120039, 120039], "mapped", [120]], [[120040, 120040], "mapped", [121]], [[120041, 120041], "mapped", [122]], [[120042, 120042], "mapped", [97]], [[120043, 120043], "mapped", [98]], [[120044, 120044], "mapped", [99]], [[120045, 120045], "mapped", [100]], [[120046, 120046], "mapped", [101]], [[120047, 120047], "mapped", [102]], [[120048, 120048], "mapped", [103]], [[120049, 120049], "mapped", [104]], [[120050, 120050], "mapped", [105]], [[120051, 120051], "mapped", [106]], [[120052, 120052], "mapped", [107]], [[120053, 120053], "mapped", [108]], [[120054, 120054], "mapped", [109]], [[120055, 120055], "mapped", [110]], [[120056, 120056], "mapped", [111]], [[120057, 120057], "mapped", [112]], [[120058, 120058], "mapped", [113]], [[120059, 120059], "mapped", [114]], [[120060, 120060], "mapped", [115]], [[120061, 120061], "mapped", [116]], [[120062, 120062], "mapped", [117]], [[120063, 120063], "mapped", [118]], [[120064, 120064], "mapped", [119]], [[120065, 120065], "mapped", [120]], [[120066, 120066], "mapped", [121]], [[120067, 120067], "mapped", [122]], [[120068, 120068], "mapped", [97]], [[120069, 120069], "mapped", [98]], [[120070, 120070], "disallowed"], [[120071, 120071], "mapped", [100]], [[120072, 120072], "mapped", [101]], [[120073, 120073], "mapped", [102]], [[120074, 120074], "mapped", [103]], [[120075, 120076], "disallowed"], [[120077, 120077], "mapped", [106]], [[120078, 120078], "mapped", [107]], [[120079, 120079], "mapped", [108]], [[120080, 120080], "mapped", [109]], [[120081, 120081], "mapped", [110]], [[120082, 120082], "mapped", [111]], [[120083, 120083], "mapped", [112]], [[120084, 120084], "mapped", [113]], [[120085, 120085], "disallowed"], [[120086, 120086], "mapped", [115]], [[120087, 120087], "mapped", [116]], [[120088, 120088], "mapped", [117]], [[120089, 120089], "mapped", [118]], [[120090, 120090], "mapped", [119]], [[120091, 120091], "mapped", [120]], [[120092, 120092], "mapped", [121]], [[120093, 120093], "disallowed"], [[120094, 120094], "mapped", [97]], [[120095, 120095], "mapped", [98]], [[120096, 120096], "mapped", [99]], [[120097, 120097], "mapped", [100]], [[120098, 120098], "mapped", [101]], [[120099, 120099], "mapped", [102]], [[120100, 120100], "mapped", [103]], [[120101, 120101], "mapped", [104]], [[120102, 120102], "mapped", [105]], [[120103, 120103], "mapped", [106]], [[120104, 120104], "mapped", [107]], [[120105, 120105], "mapped", [108]], [[120106, 120106], "mapped", [109]], [[120107, 120107], "mapped", [110]], [[120108, 120108], "mapped", [111]], [[120109, 120109], "mapped", [112]], [[120110, 120110], "mapped", [113]], [[120111, 120111], "mapped", [114]], [[120112, 120112], "mapped", [115]], [[120113, 120113], "mapped", [116]], [[120114, 120114], "mapped", [117]], [[120115, 120115], "mapped", [118]], [[120116, 120116], "mapped", [119]], [[120117, 120117], "mapped", [120]], [[120118, 120118], "mapped", [121]], [[120119, 120119], "mapped", [122]], [[120120, 120120], "mapped", [97]], [[120121, 120121], "mapped", [98]], [[120122, 120122], "disallowed"], [[120123, 120123], "mapped", [100]], [[120124, 120124], "mapped", [101]], [[120125, 120125], "mapped", [102]], [[120126, 120126], "mapped", [103]], [[120127, 120127], "disallowed"], [[120128, 120128], "mapped", [105]], [[120129, 120129], "mapped", [106]], [[120130, 120130], "mapped", [107]], [[120131, 120131], "mapped", [108]], [[120132, 120132], "mapped", [109]], [[120133, 120133], "disallowed"], [[120134, 120134], "mapped", [111]], [[120135, 120137], "disallowed"], [[120138, 120138], "mapped", [115]], [[120139, 120139], "mapped", [116]], [[120140, 120140], "mapped", [117]], [[120141, 120141], "mapped", [118]], [[120142, 120142], "mapped", [119]], [[120143, 120143], "mapped", [120]], [[120144, 120144], "mapped", [121]], [[120145, 120145], "disallowed"], [[120146, 120146], "mapped", [97]], [[120147, 120147], "mapped", [98]], [[120148, 120148], "mapped", [99]], [[120149, 120149], "mapped", [100]], [[120150, 120150], "mapped", [101]], [[120151, 120151], "mapped", [102]], [[120152, 120152], "mapped", [103]], [[120153, 120153], "mapped", [104]], [[120154, 120154], "mapped", [105]], [[120155, 120155], "mapped", [106]], [[120156, 120156], "mapped", [107]], [[120157, 120157], "mapped", [108]], [[120158, 120158], "mapped", [109]], [[120159, 120159], "mapped", [110]], [[120160, 120160], "mapped", [111]], [[120161, 120161], "mapped", [112]], [[120162, 120162], "mapped", [113]], [[120163, 120163], "mapped", [114]], [[120164, 120164], "mapped", [115]], [[120165, 120165], "mapped", [116]], [[120166, 120166], "mapped", [117]], [[120167, 120167], "mapped", [118]], [[120168, 120168], "mapped", [119]], [[120169, 120169], "mapped", [120]], [[120170, 120170], "mapped", [121]], [[120171, 120171], "mapped", [122]], [[120172, 120172], "mapped", [97]], [[120173, 120173], "mapped", [98]], [[120174, 120174], "mapped", [99]], [[120175, 120175], "mapped", [100]], [[120176, 120176], "mapped", [101]], [[120177, 120177], "mapped", [102]], [[120178, 120178], "mapped", [103]], [[120179, 120179], "mapped", [104]], [[120180, 120180], "mapped", [105]], [[120181, 120181], "mapped", [106]], [[120182, 120182], "mapped", [107]], [[120183, 120183], "mapped", [108]], [[120184, 120184], "mapped", [109]], [[120185, 120185], "mapped", [110]], [[120186, 120186], "mapped", [111]], [[120187, 120187], "mapped", [112]], [[120188, 120188], "mapped", [113]], [[120189, 120189], "mapped", [114]], [[120190, 120190], "mapped", [115]], [[120191, 120191], "mapped", [116]], [[120192, 120192], "mapped", [117]], [[120193, 120193], "mapped", [118]], [[120194, 120194], "mapped", [119]], [[120195, 120195], "mapped", [120]], [[120196, 120196], "mapped", [121]], [[120197, 120197], "mapped", [122]], [[120198, 120198], "mapped", [97]], [[120199, 120199], "mapped", [98]], [[120200, 120200], "mapped", [99]], [[120201, 120201], "mapped", [100]], [[120202, 120202], "mapped", [101]], [[120203, 120203], "mapped", [102]], [[120204, 120204], "mapped", [103]], [[120205, 120205], "mapped", [104]], [[120206, 120206], "mapped", [105]], [[120207, 120207], "mapped", [106]], [[120208, 120208], "mapped", [107]], [[120209, 120209], "mapped", [108]], [[120210, 120210], "mapped", [109]], [[120211, 120211], "mapped", [110]], [[120212, 120212], "mapped", [111]], [[120213, 120213], "mapped", [112]], [[120214, 120214], "mapped", [113]], [[120215, 120215], "mapped", [114]], [[120216, 120216], "mapped", [115]], [[120217, 120217], "mapped", [116]], [[120218, 120218], "mapped", [117]], [[120219, 120219], "mapped", [118]], [[120220, 120220], "mapped", [119]], [[120221, 120221], "mapped", [120]], [[120222, 120222], "mapped", [121]], [[120223, 120223], "mapped", [122]], [[120224, 120224], "mapped", [97]], [[120225, 120225], "mapped", [98]], [[120226, 120226], "mapped", [99]], [[120227, 120227], "mapped", [100]], [[120228, 120228], "mapped", [101]], [[120229, 120229], "mapped", [102]], [[120230, 120230], "mapped", [103]], [[120231, 120231], "mapped", [104]], [[120232, 120232], "mapped", [105]], [[120233, 120233], "mapped", [106]], [[120234, 120234], "mapped", [107]], [[120235, 120235], "mapped", [108]], [[120236, 120236], "mapped", [109]], [[120237, 120237], "mapped", [110]], [[120238, 120238], "mapped", [111]], [[120239, 120239], "mapped", [112]], [[120240, 120240], "mapped", [113]], [[120241, 120241], "mapped", [114]], [[120242, 120242], "mapped", [115]], [[120243, 120243], "mapped", [116]], [[120244, 120244], "mapped", [117]], [[120245, 120245], "mapped", [118]], [[120246, 120246], "mapped", [119]], [[120247, 120247], "mapped", [120]], [[120248, 120248], "mapped", [121]], [[120249, 120249], "mapped", [122]], [[120250, 120250], "mapped", [97]], [[120251, 120251], "mapped", [98]], [[120252, 120252], "mapped", [99]], [[120253, 120253], "mapped", [100]], [[120254, 120254], "mapped", [101]], [[120255, 120255], "mapped", [102]], [[120256, 120256], "mapped", [103]], [[120257, 120257], "mapped", [104]], [[120258, 120258], "mapped", [105]], [[120259, 120259], "mapped", [106]], [[120260, 120260], "mapped", [107]], [[120261, 120261], "mapped", [108]], [[120262, 120262], "mapped", [109]], [[120263, 120263], "mapped", [110]], [[120264, 120264], "mapped", [111]], [[120265, 120265], "mapped", [112]], [[120266, 120266], "mapped", [113]], [[120267, 120267], "mapped", [114]], [[120268, 120268], "mapped", [115]], [[120269, 120269], "mapped", [116]], [[120270, 120270], "mapped", [117]], [[120271, 120271], "mapped", [118]], [[120272, 120272], "mapped", [119]], [[120273, 120273], "mapped", [120]], [[120274, 120274], "mapped", [121]], [[120275, 120275], "mapped", [122]], [[120276, 120276], "mapped", [97]], [[120277, 120277], "mapped", [98]], [[120278, 120278], "mapped", [99]], [[120279, 120279], "mapped", [100]], [[120280, 120280], "mapped", [101]], [[120281, 120281], "mapped", [102]], [[120282, 120282], "mapped", [103]], [[120283, 120283], "mapped", [104]], [[120284, 120284], "mapped", [105]], [[120285, 120285], "mapped", [106]], [[120286, 120286], "mapped", [107]], [[120287, 120287], "mapped", [108]], [[120288, 120288], "mapped", [109]], [[120289, 120289], "mapped", [110]], [[120290, 120290], "mapped", [111]], [[120291, 120291], "mapped", [112]], [[120292, 120292], "mapped", [113]], [[120293, 120293], "mapped", [114]], [[120294, 120294], "mapped", [115]], [[120295, 120295], "mapped", [116]], [[120296, 120296], "mapped", [117]], [[120297, 120297], "mapped", [118]], [[120298, 120298], "mapped", [119]], [[120299, 120299], "mapped", [120]], [[120300, 120300], "mapped", [121]], [[120301, 120301], "mapped", [122]], [[120302, 120302], "mapped", [97]], [[120303, 120303], "mapped", [98]], [[120304, 120304], "mapped", [99]], [[120305, 120305], "mapped", [100]], [[120306, 120306], "mapped", [101]], [[120307, 120307], "mapped", [102]], [[120308, 120308], "mapped", [103]], [[120309, 120309], "mapped", [104]], [[120310, 120310], "mapped", [105]], [[120311, 120311], "mapped", [106]], [[120312, 120312], "mapped", [107]], [[120313, 120313], "mapped", [108]], [[120314, 120314], "mapped", [109]], [[120315, 120315], "mapped", [110]], [[120316, 120316], "mapped", [111]], [[120317, 120317], "mapped", [112]], [[120318, 120318], "mapped", [113]], [[120319, 120319], "mapped", [114]], [[120320, 120320], "mapped", [115]], [[120321, 120321], "mapped", [116]], [[120322, 120322], "mapped", [117]], [[120323, 120323], "mapped", [118]], [[120324, 120324], "mapped", [119]], [[120325, 120325], "mapped", [120]], [[120326, 120326], "mapped", [121]], [[120327, 120327], "mapped", [122]], [[120328, 120328], "mapped", [97]], [[120329, 120329], "mapped", [98]], [[120330, 120330], "mapped", [99]], [[120331, 120331], "mapped", [100]], [[120332, 120332], "mapped", [101]], [[120333, 120333], "mapped", [102]], [[120334, 120334], "mapped", [103]], [[120335, 120335], "mapped", [104]], [[120336, 120336], "mapped", [105]], [[120337, 120337], "mapped", [106]], [[120338, 120338], "mapped", [107]], [[120339, 120339], "mapped", [108]], [[120340, 120340], "mapped", [109]], [[120341, 120341], "mapped", [110]], [[120342, 120342], "mapped", [111]], [[120343, 120343], "mapped", [112]], [[120344, 120344], "mapped", [113]], [[120345, 120345], "mapped", [114]], [[120346, 120346], "mapped", [115]], [[120347, 120347], "mapped", [116]], [[120348, 120348], "mapped", [117]], [[120349, 120349], "mapped", [118]], [[120350, 120350], "mapped", [119]], [[120351, 120351], "mapped", [120]], [[120352, 120352], "mapped", [121]], [[120353, 120353], "mapped", [122]], [[120354, 120354], "mapped", [97]], [[120355, 120355], "mapped", [98]], [[120356, 120356], "mapped", [99]], [[120357, 120357], "mapped", [100]], [[120358, 120358], "mapped", [101]], [[120359, 120359], "mapped", [102]], [[120360, 120360], "mapped", [103]], [[120361, 120361], "mapped", [104]], [[120362, 120362], "mapped", [105]], [[120363, 120363], "mapped", [106]], [[120364, 120364], "mapped", [107]], [[120365, 120365], "mapped", [108]], [[120366, 120366], "mapped", [109]], [[120367, 120367], "mapped", [110]], [[120368, 120368], "mapped", [111]], [[120369, 120369], "mapped", [112]], [[120370, 120370], "mapped", [113]], [[120371, 120371], "mapped", [114]], [[120372, 120372], "mapped", [115]], [[120373, 120373], "mapped", [116]], [[120374, 120374], "mapped", [117]], [[120375, 120375], "mapped", [118]], [[120376, 120376], "mapped", [119]], [[120377, 120377], "mapped", [120]], [[120378, 120378], "mapped", [121]], [[120379, 120379], "mapped", [122]], [[120380, 120380], "mapped", [97]], [[120381, 120381], "mapped", [98]], [[120382, 120382], "mapped", [99]], [[120383, 120383], "mapped", [100]], [[120384, 120384], "mapped", [101]], [[120385, 120385], "mapped", [102]], [[120386, 120386], "mapped", [103]], [[120387, 120387], "mapped", [104]], [[120388, 120388], "mapped", [105]], [[120389, 120389], "mapped", [106]], [[120390, 120390], "mapped", [107]], [[120391, 120391], "mapped", [108]], [[120392, 120392], "mapped", [109]], [[120393, 120393], "mapped", [110]], [[120394, 120394], "mapped", [111]], [[120395, 120395], "mapped", [112]], [[120396, 120396], "mapped", [113]], [[120397, 120397], "mapped", [114]], [[120398, 120398], "mapped", [115]], [[120399, 120399], "mapped", [116]], [[120400, 120400], "mapped", [117]], [[120401, 120401], "mapped", [118]], [[120402, 120402], "mapped", [119]], [[120403, 120403], "mapped", [120]], [[120404, 120404], "mapped", [121]], [[120405, 120405], "mapped", [122]], [[120406, 120406], "mapped", [97]], [[120407, 120407], "mapped", [98]], [[120408, 120408], "mapped", [99]], [[120409, 120409], "mapped", [100]], [[120410, 120410], "mapped", [101]], [[120411, 120411], "mapped", [102]], [[120412, 120412], "mapped", [103]], [[120413, 120413], "mapped", [104]], [[120414, 120414], "mapped", [105]], [[120415, 120415], "mapped", [106]], [[120416, 120416], "mapped", [107]], [[120417, 120417], "mapped", [108]], [[120418, 120418], "mapped", [109]], [[120419, 120419], "mapped", [110]], [[120420, 120420], "mapped", [111]], [[120421, 120421], "mapped", [112]], [[120422, 120422], "mapped", [113]], [[120423, 120423], "mapped", [114]], [[120424, 120424], "mapped", [115]], [[120425, 120425], "mapped", [116]], [[120426, 120426], "mapped", [117]], [[120427, 120427], "mapped", [118]], [[120428, 120428], "mapped", [119]], [[120429, 120429], "mapped", [120]], [[120430, 120430], "mapped", [121]], [[120431, 120431], "mapped", [122]], [[120432, 120432], "mapped", [97]], [[120433, 120433], "mapped", [98]], [[120434, 120434], "mapped", [99]], [[120435, 120435], "mapped", [100]], [[120436, 120436], "mapped", [101]], [[120437, 120437], "mapped", [102]], [[120438, 120438], "mapped", [103]], [[120439, 120439], "mapped", [104]], [[120440, 120440], "mapped", [105]], [[120441, 120441], "mapped", [106]], [[120442, 120442], "mapped", [107]], [[120443, 120443], "mapped", [108]], [[120444, 120444], "mapped", [109]], [[120445, 120445], "mapped", [110]], [[120446, 120446], "mapped", [111]], [[120447, 120447], "mapped", [112]], [[120448, 120448], "mapped", [113]], [[120449, 120449], "mapped", [114]], [[120450, 120450], "mapped", [115]], [[120451, 120451], "mapped", [116]], [[120452, 120452], "mapped", [117]], [[120453, 120453], "mapped", [118]], [[120454, 120454], "mapped", [119]], [[120455, 120455], "mapped", [120]], [[120456, 120456], "mapped", [121]], [[120457, 120457], "mapped", [122]], [[120458, 120458], "mapped", [97]], [[120459, 120459], "mapped", [98]], [[120460, 120460], "mapped", [99]], [[120461, 120461], "mapped", [100]], [[120462, 120462], "mapped", [101]], [[120463, 120463], "mapped", [102]], [[120464, 120464], "mapped", [103]], [[120465, 120465], "mapped", [104]], [[120466, 120466], "mapped", [105]], [[120467, 120467], "mapped", [106]], [[120468, 120468], "mapped", [107]], [[120469, 120469], "mapped", [108]], [[120470, 120470], "mapped", [109]], [[120471, 120471], "mapped", [110]], [[120472, 120472], "mapped", [111]], [[120473, 120473], "mapped", [112]], [[120474, 120474], "mapped", [113]], [[120475, 120475], "mapped", [114]], [[120476, 120476], "mapped", [115]], [[120477, 120477], "mapped", [116]], [[120478, 120478], "mapped", [117]], [[120479, 120479], "mapped", [118]], [[120480, 120480], "mapped", [119]], [[120481, 120481], "mapped", [120]], [[120482, 120482], "mapped", [121]], [[120483, 120483], "mapped", [122]], [[120484, 120484], "mapped", [305]], [[120485, 120485], "mapped", [567]], [[120486, 120487], "disallowed"], [[120488, 120488], "mapped", [945]], [[120489, 120489], "mapped", [946]], [[120490, 120490], "mapped", [947]], [[120491, 120491], "mapped", [948]], [[120492, 120492], "mapped", [949]], [[120493, 120493], "mapped", [950]], [[120494, 120494], "mapped", [951]], [[120495, 120495], "mapped", [952]], [[120496, 120496], "mapped", [953]], [[120497, 120497], "mapped", [954]], [[120498, 120498], "mapped", [955]], [[120499, 120499], "mapped", [956]], [[120500, 120500], "mapped", [957]], [[120501, 120501], "mapped", [958]], [[120502, 120502], "mapped", [959]], [[120503, 120503], "mapped", [960]], [[120504, 120504], "mapped", [961]], [[120505, 120505], "mapped", [952]], [[120506, 120506], "mapped", [963]], [[120507, 120507], "mapped", [964]], [[120508, 120508], "mapped", [965]], [[120509, 120509], "mapped", [966]], [[120510, 120510], "mapped", [967]], [[120511, 120511], "mapped", [968]], [[120512, 120512], "mapped", [969]], [[120513, 120513], "mapped", [8711]], [[120514, 120514], "mapped", [945]], [[120515, 120515], "mapped", [946]], [[120516, 120516], "mapped", [947]], [[120517, 120517], "mapped", [948]], [[120518, 120518], "mapped", [949]], [[120519, 120519], "mapped", [950]], [[120520, 120520], "mapped", [951]], [[120521, 120521], "mapped", [952]], [[120522, 120522], "mapped", [953]], [[120523, 120523], "mapped", [954]], [[120524, 120524], "mapped", [955]], [[120525, 120525], "mapped", [956]], [[120526, 120526], "mapped", [957]], [[120527, 120527], "mapped", [958]], [[120528, 120528], "mapped", [959]], [[120529, 120529], "mapped", [960]], [[120530, 120530], "mapped", [961]], [[120531, 120532], "mapped", [963]], [[120533, 120533], "mapped", [964]], [[120534, 120534], "mapped", [965]], [[120535, 120535], "mapped", [966]], [[120536, 120536], "mapped", [967]], [[120537, 120537], "mapped", [968]], [[120538, 120538], "mapped", [969]], [[120539, 120539], "mapped", [8706]], [[120540, 120540], "mapped", [949]], [[120541, 120541], "mapped", [952]], [[120542, 120542], "mapped", [954]], [[120543, 120543], "mapped", [966]], [[120544, 120544], "mapped", [961]], [[120545, 120545], "mapped", [960]], [[120546, 120546], "mapped", [945]], [[120547, 120547], "mapped", [946]], [[120548, 120548], "mapped", [947]], [[120549, 120549], "mapped", [948]], [[120550, 120550], "mapped", [949]], [[120551, 120551], "mapped", [950]], [[120552, 120552], "mapped", [951]], [[120553, 120553], "mapped", [952]], [[120554, 120554], "mapped", [953]], [[120555, 120555], "mapped", [954]], [[120556, 120556], "mapped", [955]], [[120557, 120557], "mapped", [956]], [[120558, 120558], "mapped", [957]], [[120559, 120559], "mapped", [958]], [[120560, 120560], "mapped", [959]], [[120561, 120561], "mapped", [960]], [[120562, 120562], "mapped", [961]], [[120563, 120563], "mapped", [952]], [[120564, 120564], "mapped", [963]], [[120565, 120565], "mapped", [964]], [[120566, 120566], "mapped", [965]], [[120567, 120567], "mapped", [966]], [[120568, 120568], "mapped", [967]], [[120569, 120569], "mapped", [968]], [[120570, 120570], "mapped", [969]], [[120571, 120571], "mapped", [8711]], [[120572, 120572], "mapped", [945]], [[120573, 120573], "mapped", [946]], [[120574, 120574], "mapped", [947]], [[120575, 120575], "mapped", [948]], [[120576, 120576], "mapped", [949]], [[120577, 120577], "mapped", [950]], [[120578, 120578], "mapped", [951]], [[120579, 120579], "mapped", [952]], [[120580, 120580], "mapped", [953]], [[120581, 120581], "mapped", [954]], [[120582, 120582], "mapped", [955]], [[120583, 120583], "mapped", [956]], [[120584, 120584], "mapped", [957]], [[120585, 120585], "mapped", [958]], [[120586, 120586], "mapped", [959]], [[120587, 120587], "mapped", [960]], [[120588, 120588], "mapped", [961]], [[120589, 120590], "mapped", [963]], [[120591, 120591], "mapped", [964]], [[120592, 120592], "mapped", [965]], [[120593, 120593], "mapped", [966]], [[120594, 120594], "mapped", [967]], [[120595, 120595], "mapped", [968]], [[120596, 120596], "mapped", [969]], [[120597, 120597], "mapped", [8706]], [[120598, 120598], "mapped", [949]], [[120599, 120599], "mapped", [952]], [[120600, 120600], "mapped", [954]], [[120601, 120601], "mapped", [966]], [[120602, 120602], "mapped", [961]], [[120603, 120603], "mapped", [960]], [[120604, 120604], "mapped", [945]], [[120605, 120605], "mapped", [946]], [[120606, 120606], "mapped", [947]], [[120607, 120607], "mapped", [948]], [[120608, 120608], "mapped", [949]], [[120609, 120609], "mapped", [950]], [[120610, 120610], "mapped", [951]], [[120611, 120611], "mapped", [952]], [[120612, 120612], "mapped", [953]], [[120613, 120613], "mapped", [954]], [[120614, 120614], "mapped", [955]], [[120615, 120615], "mapped", [956]], [[120616, 120616], "mapped", [957]], [[120617, 120617], "mapped", [958]], [[120618, 120618], "mapped", [959]], [[120619, 120619], "mapped", [960]], [[120620, 120620], "mapped", [961]], [[120621, 120621], "mapped", [952]], [[120622, 120622], "mapped", [963]], [[120623, 120623], "mapped", [964]], [[120624, 120624], "mapped", [965]], [[120625, 120625], "mapped", [966]], [[120626, 120626], "mapped", [967]], [[120627, 120627], "mapped", [968]], [[120628, 120628], "mapped", [969]], [[120629, 120629], "mapped", [8711]], [[120630, 120630], "mapped", [945]], [[120631, 120631], "mapped", [946]], [[120632, 120632], "mapped", [947]], [[120633, 120633], "mapped", [948]], [[120634, 120634], "mapped", [949]], [[120635, 120635], "mapped", [950]], [[120636, 120636], "mapped", [951]], [[120637, 120637], "mapped", [952]], [[120638, 120638], "mapped", [953]], [[120639, 120639], "mapped", [954]], [[120640, 120640], "mapped", [955]], [[120641, 120641], "mapped", [956]], [[120642, 120642], "mapped", [957]], [[120643, 120643], "mapped", [958]], [[120644, 120644], "mapped", [959]], [[120645, 120645], "mapped", [960]], [[120646, 120646], "mapped", [961]], [[120647, 120648], "mapped", [963]], [[120649, 120649], "mapped", [964]], [[120650, 120650], "mapped", [965]], [[120651, 120651], "mapped", [966]], [[120652, 120652], "mapped", [967]], [[120653, 120653], "mapped", [968]], [[120654, 120654], "mapped", [969]], [[120655, 120655], "mapped", [8706]], [[120656, 120656], "mapped", [949]], [[120657, 120657], "mapped", [952]], [[120658, 120658], "mapped", [954]], [[120659, 120659], "mapped", [966]], [[120660, 120660], "mapped", [961]], [[120661, 120661], "mapped", [960]], [[120662, 120662], "mapped", [945]], [[120663, 120663], "mapped", [946]], [[120664, 120664], "mapped", [947]], [[120665, 120665], "mapped", [948]], [[120666, 120666], "mapped", [949]], [[120667, 120667], "mapped", [950]], [[120668, 120668], "mapped", [951]], [[120669, 120669], "mapped", [952]], [[120670, 120670], "mapped", [953]], [[120671, 120671], "mapped", [954]], [[120672, 120672], "mapped", [955]], [[120673, 120673], "mapped", [956]], [[120674, 120674], "mapped", [957]], [[120675, 120675], "mapped", [958]], [[120676, 120676], "mapped", [959]], [[120677, 120677], "mapped", [960]], [[120678, 120678], "mapped", [961]], [[120679, 120679], "mapped", [952]], [[120680, 120680], "mapped", [963]], [[120681, 120681], "mapped", [964]], [[120682, 120682], "mapped", [965]], [[120683, 120683], "mapped", [966]], [[120684, 120684], "mapped", [967]], [[120685, 120685], "mapped", [968]], [[120686, 120686], "mapped", [969]], [[120687, 120687], "mapped", [8711]], [[120688, 120688], "mapped", [945]], [[120689, 120689], "mapped", [946]], [[120690, 120690], "mapped", [947]], [[120691, 120691], "mapped", [948]], [[120692, 120692], "mapped", [949]], [[120693, 120693], "mapped", [950]], [[120694, 120694], "mapped", [951]], [[120695, 120695], "mapped", [952]], [[120696, 120696], "mapped", [953]], [[120697, 120697], "mapped", [954]], [[120698, 120698], "mapped", [955]], [[120699, 120699], "mapped", [956]], [[120700, 120700], "mapped", [957]], [[120701, 120701], "mapped", [958]], [[120702, 120702], "mapped", [959]], [[120703, 120703], "mapped", [960]], [[120704, 120704], "mapped", [961]], [[120705, 120706], "mapped", [963]], [[120707, 120707], "mapped", [964]], [[120708, 120708], "mapped", [965]], [[120709, 120709], "mapped", [966]], [[120710, 120710], "mapped", [967]], [[120711, 120711], "mapped", [968]], [[120712, 120712], "mapped", [969]], [[120713, 120713], "mapped", [8706]], [[120714, 120714], "mapped", [949]], [[120715, 120715], "mapped", [952]], [[120716, 120716], "mapped", [954]], [[120717, 120717], "mapped", [966]], [[120718, 120718], "mapped", [961]], [[120719, 120719], "mapped", [960]], [[120720, 120720], "mapped", [945]], [[120721, 120721], "mapped", [946]], [[120722, 120722], "mapped", [947]], [[120723, 120723], "mapped", [948]], [[120724, 120724], "mapped", [949]], [[120725, 120725], "mapped", [950]], [[120726, 120726], "mapped", [951]], [[120727, 120727], "mapped", [952]], [[120728, 120728], "mapped", [953]], [[120729, 120729], "mapped", [954]], [[120730, 120730], "mapped", [955]], [[120731, 120731], "mapped", [956]], [[120732, 120732], "mapped", [957]], [[120733, 120733], "mapped", [958]], [[120734, 120734], "mapped", [959]], [[120735, 120735], "mapped", [960]], [[120736, 120736], "mapped", [961]], [[120737, 120737], "mapped", [952]], [[120738, 120738], "mapped", [963]], [[120739, 120739], "mapped", [964]], [[120740, 120740], "mapped", [965]], [[120741, 120741], "mapped", [966]], [[120742, 120742], "mapped", [967]], [[120743, 120743], "mapped", [968]], [[120744, 120744], "mapped", [969]], [[120745, 120745], "mapped", [8711]], [[120746, 120746], "mapped", [945]], [[120747, 120747], "mapped", [946]], [[120748, 120748], "mapped", [947]], [[120749, 120749], "mapped", [948]], [[120750, 120750], "mapped", [949]], [[120751, 120751], "mapped", [950]], [[120752, 120752], "mapped", [951]], [[120753, 120753], "mapped", [952]], [[120754, 120754], "mapped", [953]], [[120755, 120755], "mapped", [954]], [[120756, 120756], "mapped", [955]], [[120757, 120757], "mapped", [956]], [[120758, 120758], "mapped", [957]], [[120759, 120759], "mapped", [958]], [[120760, 120760], "mapped", [959]], [[120761, 120761], "mapped", [960]], [[120762, 120762], "mapped", [961]], [[120763, 120764], "mapped", [963]], [[120765, 120765], "mapped", [964]], [[120766, 120766], "mapped", [965]], [[120767, 120767], "mapped", [966]], [[120768, 120768], "mapped", [967]], [[120769, 120769], "mapped", [968]], [[120770, 120770], "mapped", [969]], [[120771, 120771], "mapped", [8706]], [[120772, 120772], "mapped", [949]], [[120773, 120773], "mapped", [952]], [[120774, 120774], "mapped", [954]], [[120775, 120775], "mapped", [966]], [[120776, 120776], "mapped", [961]], [[120777, 120777], "mapped", [960]], [[120778, 120779], "mapped", [989]], [[120780, 120781], "disallowed"], [[120782, 120782], "mapped", [48]], [[120783, 120783], "mapped", [49]], [[120784, 120784], "mapped", [50]], [[120785, 120785], "mapped", [51]], [[120786, 120786], "mapped", [52]], [[120787, 120787], "mapped", [53]], [[120788, 120788], "mapped", [54]], [[120789, 120789], "mapped", [55]], [[120790, 120790], "mapped", [56]], [[120791, 120791], "mapped", [57]], [[120792, 120792], "mapped", [48]], [[120793, 120793], "mapped", [49]], [[120794, 120794], "mapped", [50]], [[120795, 120795], "mapped", [51]], [[120796, 120796], "mapped", [52]], [[120797, 120797], "mapped", [53]], [[120798, 120798], "mapped", [54]], [[120799, 120799], "mapped", [55]], [[120800, 120800], "mapped", [56]], [[120801, 120801], "mapped", [57]], [[120802, 120802], "mapped", [48]], [[120803, 120803], "mapped", [49]], [[120804, 120804], "mapped", [50]], [[120805, 120805], "mapped", [51]], [[120806, 120806], "mapped", [52]], [[120807, 120807], "mapped", [53]], [[120808, 120808], "mapped", [54]], [[120809, 120809], "mapped", [55]], [[120810, 120810], "mapped", [56]], [[120811, 120811], "mapped", [57]], [[120812, 120812], "mapped", [48]], [[120813, 120813], "mapped", [49]], [[120814, 120814], "mapped", [50]], [[120815, 120815], "mapped", [51]], [[120816, 120816], "mapped", [52]], [[120817, 120817], "mapped", [53]], [[120818, 120818], "mapped", [54]], [[120819, 120819], "mapped", [55]], [[120820, 120820], "mapped", [56]], [[120821, 120821], "mapped", [57]], [[120822, 120822], "mapped", [48]], [[120823, 120823], "mapped", [49]], [[120824, 120824], "mapped", [50]], [[120825, 120825], "mapped", [51]], [[120826, 120826], "mapped", [52]], [[120827, 120827], "mapped", [53]], [[120828, 120828], "mapped", [54]], [[120829, 120829], "mapped", [55]], [[120830, 120830], "mapped", [56]], [[120831, 120831], "mapped", [57]], [[120832, 121343], "valid", [], "NV8"], [[121344, 121398], "valid"], [[121399, 121402], "valid", [], "NV8"], [[121403, 121452], "valid"], [[121453, 121460], "valid", [], "NV8"], [[121461, 121461], "valid"], [[121462, 121475], "valid", [], "NV8"], [[121476, 121476], "valid"], [[121477, 121483], "valid", [], "NV8"], [[121484, 121498], "disallowed"], [[121499, 121503], "valid"], [[121504, 121504], "disallowed"], [[121505, 121519], "valid"], [[121520, 124927], "disallowed"], [[124928, 125124], "valid"], [[125125, 125126], "disallowed"], [[125127, 125135], "valid", [], "NV8"], [[125136, 125142], "valid"], [[125143, 126463], "disallowed"], [[126464, 126464], "mapped", [1575]], [[126465, 126465], "mapped", [1576]], [[126466, 126466], "mapped", [1580]], [[126467, 126467], "mapped", [1583]], [[126468, 126468], "disallowed"], [[126469, 126469], "mapped", [1608]], [[126470, 126470], "mapped", [1586]], [[126471, 126471], "mapped", [1581]], [[126472, 126472], "mapped", [1591]], [[126473, 126473], "mapped", [1610]], [[126474, 126474], "mapped", [1603]], [[126475, 126475], "mapped", [1604]], [[126476, 126476], "mapped", [1605]], [[126477, 126477], "mapped", [1606]], [[126478, 126478], "mapped", [1587]], [[126479, 126479], "mapped", [1593]], [[126480, 126480], "mapped", [1601]], [[126481, 126481], "mapped", [1589]], [[126482, 126482], "mapped", [1602]], [[126483, 126483], "mapped", [1585]], [[126484, 126484], "mapped", [1588]], [[126485, 126485], "mapped", [1578]], [[126486, 126486], "mapped", [1579]], [[126487, 126487], "mapped", [1582]], [[126488, 126488], "mapped", [1584]], [[126489, 126489], "mapped", [1590]], [[126490, 126490], "mapped", [1592]], [[126491, 126491], "mapped", [1594]], [[126492, 126492], "mapped", [1646]], [[126493, 126493], "mapped", [1722]], [[126494, 126494], "mapped", [1697]], [[126495, 126495], "mapped", [1647]], [[126496, 126496], "disallowed"], [[126497, 126497], "mapped", [1576]], [[126498, 126498], "mapped", [1580]], [[126499, 126499], "disallowed"], [[126500, 126500], "mapped", [1607]], [[126501, 126502], "disallowed"], [[126503, 126503], "mapped", [1581]], [[126504, 126504], "disallowed"], [[126505, 126505], "mapped", [1610]], [[126506, 126506], "mapped", [1603]], [[126507, 126507], "mapped", [1604]], [[126508, 126508], "mapped", [1605]], [[126509, 126509], "mapped", [1606]], [[126510, 126510], "mapped", [1587]], [[126511, 126511], "mapped", [1593]], [[126512, 126512], "mapped", [1601]], [[126513, 126513], "mapped", [1589]], [[126514, 126514], "mapped", [1602]], [[126515, 126515], "disallowed"], [[126516, 126516], "mapped", [1588]], [[126517, 126517], "mapped", [1578]], [[126518, 126518], "mapped", [1579]], [[126519, 126519], "mapped", [1582]], [[126520, 126520], "disallowed"], [[126521, 126521], "mapped", [1590]], [[126522, 126522], "disallowed"], [[126523, 126523], "mapped", [1594]], [[126524, 126529], "disallowed"], [[126530, 126530], "mapped", [1580]], [[126531, 126534], "disallowed"], [[126535, 126535], "mapped", [1581]], [[126536, 126536], "disallowed"], [[126537, 126537], "mapped", [1610]], [[126538, 126538], "disallowed"], [[126539, 126539], "mapped", [1604]], [[126540, 126540], "disallowed"], [[126541, 126541], "mapped", [1606]], [[126542, 126542], "mapped", [1587]], [[126543, 126543], "mapped", [1593]], [[126544, 126544], "disallowed"], [[126545, 126545], "mapped", [1589]], [[126546, 126546], "mapped", [1602]], [[126547, 126547], "disallowed"], [[126548, 126548], "mapped", [1588]], [[126549, 126550], "disallowed"], [[126551, 126551], "mapped", [1582]], [[126552, 126552], "disallowed"], [[126553, 126553], "mapped", [1590]], [[126554, 126554], "disallowed"], [[126555, 126555], "mapped", [1594]], [[126556, 126556], "disallowed"], [[126557, 126557], "mapped", [1722]], [[126558, 126558], "disallowed"], [[126559, 126559], "mapped", [1647]], [[126560, 126560], "disallowed"], [[126561, 126561], "mapped", [1576]], [[126562, 126562], "mapped", [1580]], [[126563, 126563], "disallowed"], [[126564, 126564], "mapped", [1607]], [[126565, 126566], "disallowed"], [[126567, 126567], "mapped", [1581]], [[126568, 126568], "mapped", [1591]], [[126569, 126569], "mapped", [1610]], [[126570, 126570], "mapped", [1603]], [[126571, 126571], "disallowed"], [[126572, 126572], "mapped", [1605]], [[126573, 126573], "mapped", [1606]], [[126574, 126574], "mapped", [1587]], [[126575, 126575], "mapped", [1593]], [[126576, 126576], "mapped", [1601]], [[126577, 126577], "mapped", [1589]], [[126578, 126578], "mapped", [1602]], [[126579, 126579], "disallowed"], [[126580, 126580], "mapped", [1588]], [[126581, 126581], "mapped", [1578]], [[126582, 126582], "mapped", [1579]], [[126583, 126583], "mapped", [1582]], [[126584, 126584], "disallowed"], [[126585, 126585], "mapped", [1590]], [[126586, 126586], "mapped", [1592]], [[126587, 126587], "mapped", [1594]], [[126588, 126588], "mapped", [1646]], [[126589, 126589], "disallowed"], [[126590, 126590], "mapped", [1697]], [[126591, 126591], "disallowed"], [[126592, 126592], "mapped", [1575]], [[126593, 126593], "mapped", [1576]], [[126594, 126594], "mapped", [1580]], [[126595, 126595], "mapped", [1583]], [[126596, 126596], "mapped", [1607]], [[126597, 126597], "mapped", [1608]], [[126598, 126598], "mapped", [1586]], [[126599, 126599], "mapped", [1581]], [[126600, 126600], "mapped", [1591]], [[126601, 126601], "mapped", [1610]], [[126602, 126602], "disallowed"], [[126603, 126603], "mapped", [1604]], [[126604, 126604], "mapped", [1605]], [[126605, 126605], "mapped", [1606]], [[126606, 126606], "mapped", [1587]], [[126607, 126607], "mapped", [1593]], [[126608, 126608], "mapped", [1601]], [[126609, 126609], "mapped", [1589]], [[126610, 126610], "mapped", [1602]], [[126611, 126611], "mapped", [1585]], [[126612, 126612], "mapped", [1588]], [[126613, 126613], "mapped", [1578]], [[126614, 126614], "mapped", [1579]], [[126615, 126615], "mapped", [1582]], [[126616, 126616], "mapped", [1584]], [[126617, 126617], "mapped", [1590]], [[126618, 126618], "mapped", [1592]], [[126619, 126619], "mapped", [1594]], [[126620, 126624], "disallowed"], [[126625, 126625], "mapped", [1576]], [[126626, 126626], "mapped", [1580]], [[126627, 126627], "mapped", [1583]], [[126628, 126628], "disallowed"], [[126629, 126629], "mapped", [1608]], [[126630, 126630], "mapped", [1586]], [[126631, 126631], "mapped", [1581]], [[126632, 126632], "mapped", [1591]], [[126633, 126633], "mapped", [1610]], [[126634, 126634], "disallowed"], [[126635, 126635], "mapped", [1604]], [[126636, 126636], "mapped", [1605]], [[126637, 126637], "mapped", [1606]], [[126638, 126638], "mapped", [1587]], [[126639, 126639], "mapped", [1593]], [[126640, 126640], "mapped", [1601]], [[126641, 126641], "mapped", [1589]], [[126642, 126642], "mapped", [1602]], [[126643, 126643], "mapped", [1585]], [[126644, 126644], "mapped", [1588]], [[126645, 126645], "mapped", [1578]], [[126646, 126646], "mapped", [1579]], [[126647, 126647], "mapped", [1582]], [[126648, 126648], "mapped", [1584]], [[126649, 126649], "mapped", [1590]], [[126650, 126650], "mapped", [1592]], [[126651, 126651], "mapped", [1594]], [[126652, 126703], "disallowed"], [[126704, 126705], "valid", [], "NV8"], [[126706, 126975], "disallowed"], [[126976, 127019], "valid", [], "NV8"], [[127020, 127023], "disallowed"], [[127024, 127123], "valid", [], "NV8"], [[127124, 127135], "disallowed"], [[127136, 127150], "valid", [], "NV8"], [[127151, 127152], "disallowed"], [[127153, 127166], "valid", [], "NV8"], [[127167, 127167], "valid", [], "NV8"], [[127168, 127168], "disallowed"], [[127169, 127183], "valid", [], "NV8"], [[127184, 127184], "disallowed"], [[127185, 127199], "valid", [], "NV8"], [[127200, 127221], "valid", [], "NV8"], [[127222, 127231], "disallowed"], [[127232, 127232], "disallowed"], [[127233, 127233], "disallowed_STD3_mapped", [48, 44]], [[127234, 127234], "disallowed_STD3_mapped", [49, 44]], [[127235, 127235], "disallowed_STD3_mapped", [50, 44]], [[127236, 127236], "disallowed_STD3_mapped", [51, 44]], [[127237, 127237], "disallowed_STD3_mapped", [52, 44]], [[127238, 127238], "disallowed_STD3_mapped", [53, 44]], [[127239, 127239], "disallowed_STD3_mapped", [54, 44]], [[127240, 127240], "disallowed_STD3_mapped", [55, 44]], [[127241, 127241], "disallowed_STD3_mapped", [56, 44]], [[127242, 127242], "disallowed_STD3_mapped", [57, 44]], [[127243, 127244], "valid", [], "NV8"], [[127245, 127247], "disallowed"], [[127248, 127248], "disallowed_STD3_mapped", [40, 97, 41]], [[127249, 127249], "disallowed_STD3_mapped", [40, 98, 41]], [[127250, 127250], "disallowed_STD3_mapped", [40, 99, 41]], [[127251, 127251], "disallowed_STD3_mapped", [40, 100, 41]], [[127252, 127252], "disallowed_STD3_mapped", [40, 101, 41]], [[127253, 127253], "disallowed_STD3_mapped", [40, 102, 41]], [[127254, 127254], "disallowed_STD3_mapped", [40, 103, 41]], [[127255, 127255], "disallowed_STD3_mapped", [40, 104, 41]], [[127256, 127256], "disallowed_STD3_mapped", [40, 105, 41]], [[127257, 127257], "disallowed_STD3_mapped", [40, 106, 41]], [[127258, 127258], "disallowed_STD3_mapped", [40, 107, 41]], [[127259, 127259], "disallowed_STD3_mapped", [40, 108, 41]], [[127260, 127260], "disallowed_STD3_mapped", [40, 109, 41]], [[127261, 127261], "disallowed_STD3_mapped", [40, 110, 41]], [[127262, 127262], "disallowed_STD3_mapped", [40, 111, 41]], [[127263, 127263], "disallowed_STD3_mapped", [40, 112, 41]], [[127264, 127264], "disallowed_STD3_mapped", [40, 113, 41]], [[127265, 127265], "disallowed_STD3_mapped", [40, 114, 41]], [[127266, 127266], "disallowed_STD3_mapped", [40, 115, 41]], [[127267, 127267], "disallowed_STD3_mapped", [40, 116, 41]], [[127268, 127268], "disallowed_STD3_mapped", [40, 117, 41]], [[127269, 127269], "disallowed_STD3_mapped", [40, 118, 41]], [[127270, 127270], "disallowed_STD3_mapped", [40, 119, 41]], [[127271, 127271], "disallowed_STD3_mapped", [40, 120, 41]], [[127272, 127272], "disallowed_STD3_mapped", [40, 121, 41]], [[127273, 127273], "disallowed_STD3_mapped", [40, 122, 41]], [[127274, 127274], "mapped", [12308, 115, 12309]], [[127275, 127275], "mapped", [99]], [[127276, 127276], "mapped", [114]], [[127277, 127277], "mapped", [99, 100]], [[127278, 127278], "mapped", [119, 122]], [[127279, 127279], "disallowed"], [[127280, 127280], "mapped", [97]], [[127281, 127281], "mapped", [98]], [[127282, 127282], "mapped", [99]], [[127283, 127283], "mapped", [100]], [[127284, 127284], "mapped", [101]], [[127285, 127285], "mapped", [102]], [[127286, 127286], "mapped", [103]], [[127287, 127287], "mapped", [104]], [[127288, 127288], "mapped", [105]], [[127289, 127289], "mapped", [106]], [[127290, 127290], "mapped", [107]], [[127291, 127291], "mapped", [108]], [[127292, 127292], "mapped", [109]], [[127293, 127293], "mapped", [110]], [[127294, 127294], "mapped", [111]], [[127295, 127295], "mapped", [112]], [[127296, 127296], "mapped", [113]], [[127297, 127297], "mapped", [114]], [[127298, 127298], "mapped", [115]], [[127299, 127299], "mapped", [116]], [[127300, 127300], "mapped", [117]], [[127301, 127301], "mapped", [118]], [[127302, 127302], "mapped", [119]], [[127303, 127303], "mapped", [120]], [[127304, 127304], "mapped", [121]], [[127305, 127305], "mapped", [122]], [[127306, 127306], "mapped", [104, 118]], [[127307, 127307], "mapped", [109, 118]], [[127308, 127308], "mapped", [115, 100]], [[127309, 127309], "mapped", [115, 115]], [[127310, 127310], "mapped", [112, 112, 118]], [[127311, 127311], "mapped", [119, 99]], [[127312, 127318], "valid", [], "NV8"], [[127319, 127319], "valid", [], "NV8"], [[127320, 127326], "valid", [], "NV8"], [[127327, 127327], "valid", [], "NV8"], [[127328, 127337], "valid", [], "NV8"], [[127338, 127338], "mapped", [109, 99]], [[127339, 127339], "mapped", [109, 100]], [[127340, 127343], "disallowed"], [[127344, 127352], "valid", [], "NV8"], [[127353, 127353], "valid", [], "NV8"], [[127354, 127354], "valid", [], "NV8"], [[127355, 127356], "valid", [], "NV8"], [[127357, 127358], "valid", [], "NV8"], [[127359, 127359], "valid", [], "NV8"], [[127360, 127369], "valid", [], "NV8"], [[127370, 127373], "valid", [], "NV8"], [[127374, 127375], "valid", [], "NV8"], [[127376, 127376], "mapped", [100, 106]], [[127377, 127386], "valid", [], "NV8"], [[127387, 127461], "disallowed"], [[127462, 127487], "valid", [], "NV8"], [[127488, 127488], "mapped", [12411, 12363]], [[127489, 127489], "mapped", [12467, 12467]], [[127490, 127490], "mapped", [12469]], [[127491, 127503], "disallowed"], [[127504, 127504], "mapped", [25163]], [[127505, 127505], "mapped", [23383]], [[127506, 127506], "mapped", [21452]], [[127507, 127507], "mapped", [12487]], [[127508, 127508], "mapped", [20108]], [[127509, 127509], "mapped", [22810]], [[127510, 127510], "mapped", [35299]], [[127511, 127511], "mapped", [22825]], [[127512, 127512], "mapped", [20132]], [[127513, 127513], "mapped", [26144]], [[127514, 127514], "mapped", [28961]], [[127515, 127515], "mapped", [26009]], [[127516, 127516], "mapped", [21069]], [[127517, 127517], "mapped", [24460]], [[127518, 127518], "mapped", [20877]], [[127519, 127519], "mapped", [26032]], [[127520, 127520], "mapped", [21021]], [[127521, 127521], "mapped", [32066]], [[127522, 127522], "mapped", [29983]], [[127523, 127523], "mapped", [36009]], [[127524, 127524], "mapped", [22768]], [[127525, 127525], "mapped", [21561]], [[127526, 127526], "mapped", [28436]], [[127527, 127527], "mapped", [25237]], [[127528, 127528], "mapped", [25429]], [[127529, 127529], "mapped", [19968]], [[127530, 127530], "mapped", [19977]], [[127531, 127531], "mapped", [36938]], [[127532, 127532], "mapped", [24038]], [[127533, 127533], "mapped", [20013]], [[127534, 127534], "mapped", [21491]], [[127535, 127535], "mapped", [25351]], [[127536, 127536], "mapped", [36208]], [[127537, 127537], "mapped", [25171]], [[127538, 127538], "mapped", [31105]], [[127539, 127539], "mapped", [31354]], [[127540, 127540], "mapped", [21512]], [[127541, 127541], "mapped", [28288]], [[127542, 127542], "mapped", [26377]], [[127543, 127543], "mapped", [26376]], [[127544, 127544], "mapped", [30003]], [[127545, 127545], "mapped", [21106]], [[127546, 127546], "mapped", [21942]], [[127547, 127551], "disallowed"], [[127552, 127552], "mapped", [12308, 26412, 12309]], [[127553, 127553], "mapped", [12308, 19977, 12309]], [[127554, 127554], "mapped", [12308, 20108, 12309]], [[127555, 127555], "mapped", [12308, 23433, 12309]], [[127556, 127556], "mapped", [12308, 28857, 12309]], [[127557, 127557], "mapped", [12308, 25171, 12309]], [[127558, 127558], "mapped", [12308, 30423, 12309]], [[127559, 127559], "mapped", [12308, 21213, 12309]], [[127560, 127560], "mapped", [12308, 25943, 12309]], [[127561, 127567], "disallowed"], [[127568, 127568], "mapped", [24471]], [[127569, 127569], "mapped", [21487]], [[127570, 127743], "disallowed"], [[127744, 127776], "valid", [], "NV8"], [[127777, 127788], "valid", [], "NV8"], [[127789, 127791], "valid", [], "NV8"], [[127792, 127797], "valid", [], "NV8"], [[127798, 127798], "valid", [], "NV8"], [[127799, 127868], "valid", [], "NV8"], [[127869, 127869], "valid", [], "NV8"], [[127870, 127871], "valid", [], "NV8"], [[127872, 127891], "valid", [], "NV8"], [[127892, 127903], "valid", [], "NV8"], [[127904, 127940], "valid", [], "NV8"], [[127941, 127941], "valid", [], "NV8"], [[127942, 127946], "valid", [], "NV8"], [[127947, 127950], "valid", [], "NV8"], [[127951, 127955], "valid", [], "NV8"], [[127956, 127967], "valid", [], "NV8"], [[127968, 127984], "valid", [], "NV8"], [[127985, 127991], "valid", [], "NV8"], [[127992, 127999], "valid", [], "NV8"], [[128e3, 128062], "valid", [], "NV8"], [[128063, 128063], "valid", [], "NV8"], [[128064, 128064], "valid", [], "NV8"], [[128065, 128065], "valid", [], "NV8"], [[128066, 128247], "valid", [], "NV8"], [[128248, 128248], "valid", [], "NV8"], [[128249, 128252], "valid", [], "NV8"], [[128253, 128254], "valid", [], "NV8"], [[128255, 128255], "valid", [], "NV8"], [[128256, 128317], "valid", [], "NV8"], [[128318, 128319], "valid", [], "NV8"], [[128320, 128323], "valid", [], "NV8"], [[128324, 128330], "valid", [], "NV8"], [[128331, 128335], "valid", [], "NV8"], [[128336, 128359], "valid", [], "NV8"], [[128360, 128377], "valid", [], "NV8"], [[128378, 128378], "disallowed"], [[128379, 128419], "valid", [], "NV8"], [[128420, 128420], "disallowed"], [[128421, 128506], "valid", [], "NV8"], [[128507, 128511], "valid", [], "NV8"], [[128512, 128512], "valid", [], "NV8"], [[128513, 128528], "valid", [], "NV8"], [[128529, 128529], "valid", [], "NV8"], [[128530, 128532], "valid", [], "NV8"], [[128533, 128533], "valid", [], "NV8"], [[128534, 128534], "valid", [], "NV8"], [[128535, 128535], "valid", [], "NV8"], [[128536, 128536], "valid", [], "NV8"], [[128537, 128537], "valid", [], "NV8"], [[128538, 128538], "valid", [], "NV8"], [[128539, 128539], "valid", [], "NV8"], [[128540, 128542], "valid", [], "NV8"], [[128543, 128543], "valid", [], "NV8"], [[128544, 128549], "valid", [], "NV8"], [[128550, 128551], "valid", [], "NV8"], [[128552, 128555], "valid", [], "NV8"], [[128556, 128556], "valid", [], "NV8"], [[128557, 128557], "valid", [], "NV8"], [[128558, 128559], "valid", [], "NV8"], [[128560, 128563], "valid", [], "NV8"], [[128564, 128564], "valid", [], "NV8"], [[128565, 128576], "valid", [], "NV8"], [[128577, 128578], "valid", [], "NV8"], [[128579, 128580], "valid", [], "NV8"], [[128581, 128591], "valid", [], "NV8"], [[128592, 128639], "valid", [], "NV8"], [[128640, 128709], "valid", [], "NV8"], [[128710, 128719], "valid", [], "NV8"], [[128720, 128720], "valid", [], "NV8"], [[128721, 128735], "disallowed"], [[128736, 128748], "valid", [], "NV8"], [[128749, 128751], "disallowed"], [[128752, 128755], "valid", [], "NV8"], [[128756, 128767], "disallowed"], [[128768, 128883], "valid", [], "NV8"], [[128884, 128895], "disallowed"], [[128896, 128980], "valid", [], "NV8"], [[128981, 129023], "disallowed"], [[129024, 129035], "valid", [], "NV8"], [[129036, 129039], "disallowed"], [[129040, 129095], "valid", [], "NV8"], [[129096, 129103], "disallowed"], [[129104, 129113], "valid", [], "NV8"], [[129114, 129119], "disallowed"], [[129120, 129159], "valid", [], "NV8"], [[129160, 129167], "disallowed"], [[129168, 129197], "valid", [], "NV8"], [[129198, 129295], "disallowed"], [[129296, 129304], "valid", [], "NV8"], [[129305, 129407], "disallowed"], [[129408, 129412], "valid", [], "NV8"], [[129413, 129471], "disallowed"], [[129472, 129472], "valid", [], "NV8"], [[129473, 131069], "disallowed"], [[131070, 131071], "disallowed"], [[131072, 173782], "valid"], [[173783, 173823], "disallowed"], [[173824, 177972], "valid"], [[177973, 177983], "disallowed"], [[177984, 178205], "valid"], [[178206, 178207], "disallowed"], [[178208, 183969], "valid"], [[183970, 194559], "disallowed"], [[194560, 194560], "mapped", [20029]], [[194561, 194561], "mapped", [20024]], [[194562, 194562], "mapped", [20033]], [[194563, 194563], "mapped", [131362]], [[194564, 194564], "mapped", [20320]], [[194565, 194565], "mapped", [20398]], [[194566, 194566], "mapped", [20411]], [[194567, 194567], "mapped", [20482]], [[194568, 194568], "mapped", [20602]], [[194569, 194569], "mapped", [20633]], [[194570, 194570], "mapped", [20711]], [[194571, 194571], "mapped", [20687]], [[194572, 194572], "mapped", [13470]], [[194573, 194573], "mapped", [132666]], [[194574, 194574], "mapped", [20813]], [[194575, 194575], "mapped", [20820]], [[194576, 194576], "mapped", [20836]], [[194577, 194577], "mapped", [20855]], [[194578, 194578], "mapped", [132380]], [[194579, 194579], "mapped", [13497]], [[194580, 194580], "mapped", [20839]], [[194581, 194581], "mapped", [20877]], [[194582, 194582], "mapped", [132427]], [[194583, 194583], "mapped", [20887]], [[194584, 194584], "mapped", [20900]], [[194585, 194585], "mapped", [20172]], [[194586, 194586], "mapped", [20908]], [[194587, 194587], "mapped", [20917]], [[194588, 194588], "mapped", [168415]], [[194589, 194589], "mapped", [20981]], [[194590, 194590], "mapped", [20995]], [[194591, 194591], "mapped", [13535]], [[194592, 194592], "mapped", [21051]], [[194593, 194593], "mapped", [21062]], [[194594, 194594], "mapped", [21106]], [[194595, 194595], "mapped", [21111]], [[194596, 194596], "mapped", [13589]], [[194597, 194597], "mapped", [21191]], [[194598, 194598], "mapped", [21193]], [[194599, 194599], "mapped", [21220]], [[194600, 194600], "mapped", [21242]], [[194601, 194601], "mapped", [21253]], [[194602, 194602], "mapped", [21254]], [[194603, 194603], "mapped", [21271]], [[194604, 194604], "mapped", [21321]], [[194605, 194605], "mapped", [21329]], [[194606, 194606], "mapped", [21338]], [[194607, 194607], "mapped", [21363]], [[194608, 194608], "mapped", [21373]], [[194609, 194611], "mapped", [21375]], [[194612, 194612], "mapped", [133676]], [[194613, 194613], "mapped", [28784]], [[194614, 194614], "mapped", [21450]], [[194615, 194615], "mapped", [21471]], [[194616, 194616], "mapped", [133987]], [[194617, 194617], "mapped", [21483]], [[194618, 194618], "mapped", [21489]], [[194619, 194619], "mapped", [21510]], [[194620, 194620], "mapped", [21662]], [[194621, 194621], "mapped", [21560]], [[194622, 194622], "mapped", [21576]], [[194623, 194623], "mapped", [21608]], [[194624, 194624], "mapped", [21666]], [[194625, 194625], "mapped", [21750]], [[194626, 194626], "mapped", [21776]], [[194627, 194627], "mapped", [21843]], [[194628, 194628], "mapped", [21859]], [[194629, 194630], "mapped", [21892]], [[194631, 194631], "mapped", [21913]], [[194632, 194632], "mapped", [21931]], [[194633, 194633], "mapped", [21939]], [[194634, 194634], "mapped", [21954]], [[194635, 194635], "mapped", [22294]], [[194636, 194636], "mapped", [22022]], [[194637, 194637], "mapped", [22295]], [[194638, 194638], "mapped", [22097]], [[194639, 194639], "mapped", [22132]], [[194640, 194640], "mapped", [20999]], [[194641, 194641], "mapped", [22766]], [[194642, 194642], "mapped", [22478]], [[194643, 194643], "mapped", [22516]], [[194644, 194644], "mapped", [22541]], [[194645, 194645], "mapped", [22411]], [[194646, 194646], "mapped", [22578]], [[194647, 194647], "mapped", [22577]], [[194648, 194648], "mapped", [22700]], [[194649, 194649], "mapped", [136420]], [[194650, 194650], "mapped", [22770]], [[194651, 194651], "mapped", [22775]], [[194652, 194652], "mapped", [22790]], [[194653, 194653], "mapped", [22810]], [[194654, 194654], "mapped", [22818]], [[194655, 194655], "mapped", [22882]], [[194656, 194656], "mapped", [136872]], [[194657, 194657], "mapped", [136938]], [[194658, 194658], "mapped", [23020]], [[194659, 194659], "mapped", [23067]], [[194660, 194660], "mapped", [23079]], [[194661, 194661], "mapped", [23e3]], [[194662, 194662], "mapped", [23142]], [[194663, 194663], "mapped", [14062]], [[194664, 194664], "disallowed"], [[194665, 194665], "mapped", [23304]], [[194666, 194667], "mapped", [23358]], [[194668, 194668], "mapped", [137672]], [[194669, 194669], "mapped", [23491]], [[194670, 194670], "mapped", [23512]], [[194671, 194671], "mapped", [23527]], [[194672, 194672], "mapped", [23539]], [[194673, 194673], "mapped", [138008]], [[194674, 194674], "mapped", [23551]], [[194675, 194675], "mapped", [23558]], [[194676, 194676], "disallowed"], [[194677, 194677], "mapped", [23586]], [[194678, 194678], "mapped", [14209]], [[194679, 194679], "mapped", [23648]], [[194680, 194680], "mapped", [23662]], [[194681, 194681], "mapped", [23744]], [[194682, 194682], "mapped", [23693]], [[194683, 194683], "mapped", [138724]], [[194684, 194684], "mapped", [23875]], [[194685, 194685], "mapped", [138726]], [[194686, 194686], "mapped", [23918]], [[194687, 194687], "mapped", [23915]], [[194688, 194688], "mapped", [23932]], [[194689, 194689], "mapped", [24033]], [[194690, 194690], "mapped", [24034]], [[194691, 194691], "mapped", [14383]], [[194692, 194692], "mapped", [24061]], [[194693, 194693], "mapped", [24104]], [[194694, 194694], "mapped", [24125]], [[194695, 194695], "mapped", [24169]], [[194696, 194696], "mapped", [14434]], [[194697, 194697], "mapped", [139651]], [[194698, 194698], "mapped", [14460]], [[194699, 194699], "mapped", [24240]], [[194700, 194700], "mapped", [24243]], [[194701, 194701], "mapped", [24246]], [[194702, 194702], "mapped", [24266]], [[194703, 194703], "mapped", [172946]], [[194704, 194704], "mapped", [24318]], [[194705, 194706], "mapped", [140081]], [[194707, 194707], "mapped", [33281]], [[194708, 194709], "mapped", [24354]], [[194710, 194710], "mapped", [14535]], [[194711, 194711], "mapped", [144056]], [[194712, 194712], "mapped", [156122]], [[194713, 194713], "mapped", [24418]], [[194714, 194714], "mapped", [24427]], [[194715, 194715], "mapped", [14563]], [[194716, 194716], "mapped", [24474]], [[194717, 194717], "mapped", [24525]], [[194718, 194718], "mapped", [24535]], [[194719, 194719], "mapped", [24569]], [[194720, 194720], "mapped", [24705]], [[194721, 194721], "mapped", [14650]], [[194722, 194722], "mapped", [14620]], [[194723, 194723], "mapped", [24724]], [[194724, 194724], "mapped", [141012]], [[194725, 194725], "mapped", [24775]], [[194726, 194726], "mapped", [24904]], [[194727, 194727], "mapped", [24908]], [[194728, 194728], "mapped", [24910]], [[194729, 194729], "mapped", [24908]], [[194730, 194730], "mapped", [24954]], [[194731, 194731], "mapped", [24974]], [[194732, 194732], "mapped", [25010]], [[194733, 194733], "mapped", [24996]], [[194734, 194734], "mapped", [25007]], [[194735, 194735], "mapped", [25054]], [[194736, 194736], "mapped", [25074]], [[194737, 194737], "mapped", [25078]], [[194738, 194738], "mapped", [25104]], [[194739, 194739], "mapped", [25115]], [[194740, 194740], "mapped", [25181]], [[194741, 194741], "mapped", [25265]], [[194742, 194742], "mapped", [25300]], [[194743, 194743], "mapped", [25424]], [[194744, 194744], "mapped", [142092]], [[194745, 194745], "mapped", [25405]], [[194746, 194746], "mapped", [25340]], [[194747, 194747], "mapped", [25448]], [[194748, 194748], "mapped", [25475]], [[194749, 194749], "mapped", [25572]], [[194750, 194750], "mapped", [142321]], [[194751, 194751], "mapped", [25634]], [[194752, 194752], "mapped", [25541]], [[194753, 194753], "mapped", [25513]], [[194754, 194754], "mapped", [14894]], [[194755, 194755], "mapped", [25705]], [[194756, 194756], "mapped", [25726]], [[194757, 194757], "mapped", [25757]], [[194758, 194758], "mapped", [25719]], [[194759, 194759], "mapped", [14956]], [[194760, 194760], "mapped", [25935]], [[194761, 194761], "mapped", [25964]], [[194762, 194762], "mapped", [143370]], [[194763, 194763], "mapped", [26083]], [[194764, 194764], "mapped", [26360]], [[194765, 194765], "mapped", [26185]], [[194766, 194766], "mapped", [15129]], [[194767, 194767], "mapped", [26257]], [[194768, 194768], "mapped", [15112]], [[194769, 194769], "mapped", [15076]], [[194770, 194770], "mapped", [20882]], [[194771, 194771], "mapped", [20885]], [[194772, 194772], "mapped", [26368]], [[194773, 194773], "mapped", [26268]], [[194774, 194774], "mapped", [32941]], [[194775, 194775], "mapped", [17369]], [[194776, 194776], "mapped", [26391]], [[194777, 194777], "mapped", [26395]], [[194778, 194778], "mapped", [26401]], [[194779, 194779], "mapped", [26462]], [[194780, 194780], "mapped", [26451]], [[194781, 194781], "mapped", [144323]], [[194782, 194782], "mapped", [15177]], [[194783, 194783], "mapped", [26618]], [[194784, 194784], "mapped", [26501]], [[194785, 194785], "mapped", [26706]], [[194786, 194786], "mapped", [26757]], [[194787, 194787], "mapped", [144493]], [[194788, 194788], "mapped", [26766]], [[194789, 194789], "mapped", [26655]], [[194790, 194790], "mapped", [26900]], [[194791, 194791], "mapped", [15261]], [[194792, 194792], "mapped", [26946]], [[194793, 194793], "mapped", [27043]], [[194794, 194794], "mapped", [27114]], [[194795, 194795], "mapped", [27304]], [[194796, 194796], "mapped", [145059]], [[194797, 194797], "mapped", [27355]], [[194798, 194798], "mapped", [15384]], [[194799, 194799], "mapped", [27425]], [[194800, 194800], "mapped", [145575]], [[194801, 194801], "mapped", [27476]], [[194802, 194802], "mapped", [15438]], [[194803, 194803], "mapped", [27506]], [[194804, 194804], "mapped", [27551]], [[194805, 194805], "mapped", [27578]], [[194806, 194806], "mapped", [27579]], [[194807, 194807], "mapped", [146061]], [[194808, 194808], "mapped", [138507]], [[194809, 194809], "mapped", [146170]], [[194810, 194810], "mapped", [27726]], [[194811, 194811], "mapped", [146620]], [[194812, 194812], "mapped", [27839]], [[194813, 194813], "mapped", [27853]], [[194814, 194814], "mapped", [27751]], [[194815, 194815], "mapped", [27926]], [[194816, 194816], "mapped", [27966]], [[194817, 194817], "mapped", [28023]], [[194818, 194818], "mapped", [27969]], [[194819, 194819], "mapped", [28009]], [[194820, 194820], "mapped", [28024]], [[194821, 194821], "mapped", [28037]], [[194822, 194822], "mapped", [146718]], [[194823, 194823], "mapped", [27956]], [[194824, 194824], "mapped", [28207]], [[194825, 194825], "mapped", [28270]], [[194826, 194826], "mapped", [15667]], [[194827, 194827], "mapped", [28363]], [[194828, 194828], "mapped", [28359]], [[194829, 194829], "mapped", [147153]], [[194830, 194830], "mapped", [28153]], [[194831, 194831], "mapped", [28526]], [[194832, 194832], "mapped", [147294]], [[194833, 194833], "mapped", [147342]], [[194834, 194834], "mapped", [28614]], [[194835, 194835], "mapped", [28729]], [[194836, 194836], "mapped", [28702]], [[194837, 194837], "mapped", [28699]], [[194838, 194838], "mapped", [15766]], [[194839, 194839], "mapped", [28746]], [[194840, 194840], "mapped", [28797]], [[194841, 194841], "mapped", [28791]], [[194842, 194842], "mapped", [28845]], [[194843, 194843], "mapped", [132389]], [[194844, 194844], "mapped", [28997]], [[194845, 194845], "mapped", [148067]], [[194846, 194846], "mapped", [29084]], [[194847, 194847], "disallowed"], [[194848, 194848], "mapped", [29224]], [[194849, 194849], "mapped", [29237]], [[194850, 194850], "mapped", [29264]], [[194851, 194851], "mapped", [149e3]], [[194852, 194852], "mapped", [29312]], [[194853, 194853], "mapped", [29333]], [[194854, 194854], "mapped", [149301]], [[194855, 194855], "mapped", [149524]], [[194856, 194856], "mapped", [29562]], [[194857, 194857], "mapped", [29579]], [[194858, 194858], "mapped", [16044]], [[194859, 194859], "mapped", [29605]], [[194860, 194861], "mapped", [16056]], [[194862, 194862], "mapped", [29767]], [[194863, 194863], "mapped", [29788]], [[194864, 194864], "mapped", [29809]], [[194865, 194865], "mapped", [29829]], [[194866, 194866], "mapped", [29898]], [[194867, 194867], "mapped", [16155]], [[194868, 194868], "mapped", [29988]], [[194869, 194869], "mapped", [150582]], [[194870, 194870], "mapped", [30014]], [[194871, 194871], "mapped", [150674]], [[194872, 194872], "mapped", [30064]], [[194873, 194873], "mapped", [139679]], [[194874, 194874], "mapped", [30224]], [[194875, 194875], "mapped", [151457]], [[194876, 194876], "mapped", [151480]], [[194877, 194877], "mapped", [151620]], [[194878, 194878], "mapped", [16380]], [[194879, 194879], "mapped", [16392]], [[194880, 194880], "mapped", [30452]], [[194881, 194881], "mapped", [151795]], [[194882, 194882], "mapped", [151794]], [[194883, 194883], "mapped", [151833]], [[194884, 194884], "mapped", [151859]], [[194885, 194885], "mapped", [30494]], [[194886, 194887], "mapped", [30495]], [[194888, 194888], "mapped", [30538]], [[194889, 194889], "mapped", [16441]], [[194890, 194890], "mapped", [30603]], [[194891, 194891], "mapped", [16454]], [[194892, 194892], "mapped", [16534]], [[194893, 194893], "mapped", [152605]], [[194894, 194894], "mapped", [30798]], [[194895, 194895], "mapped", [30860]], [[194896, 194896], "mapped", [30924]], [[194897, 194897], "mapped", [16611]], [[194898, 194898], "mapped", [153126]], [[194899, 194899], "mapped", [31062]], [[194900, 194900], "mapped", [153242]], [[194901, 194901], "mapped", [153285]], [[194902, 194902], "mapped", [31119]], [[194903, 194903], "mapped", [31211]], [[194904, 194904], "mapped", [16687]], [[194905, 194905], "mapped", [31296]], [[194906, 194906], "mapped", [31306]], [[194907, 194907], "mapped", [31311]], [[194908, 194908], "mapped", [153980]], [[194909, 194910], "mapped", [154279]], [[194911, 194911], "disallowed"], [[194912, 194912], "mapped", [16898]], [[194913, 194913], "mapped", [154539]], [[194914, 194914], "mapped", [31686]], [[194915, 194915], "mapped", [31689]], [[194916, 194916], "mapped", [16935]], [[194917, 194917], "mapped", [154752]], [[194918, 194918], "mapped", [31954]], [[194919, 194919], "mapped", [17056]], [[194920, 194920], "mapped", [31976]], [[194921, 194921], "mapped", [31971]], [[194922, 194922], "mapped", [32e3]], [[194923, 194923], "mapped", [155526]], [[194924, 194924], "mapped", [32099]], [[194925, 194925], "mapped", [17153]], [[194926, 194926], "mapped", [32199]], [[194927, 194927], "mapped", [32258]], [[194928, 194928], "mapped", [32325]], [[194929, 194929], "mapped", [17204]], [[194930, 194930], "mapped", [156200]], [[194931, 194931], "mapped", [156231]], [[194932, 194932], "mapped", [17241]], [[194933, 194933], "mapped", [156377]], [[194934, 194934], "mapped", [32634]], [[194935, 194935], "mapped", [156478]], [[194936, 194936], "mapped", [32661]], [[194937, 194937], "mapped", [32762]], [[194938, 194938], "mapped", [32773]], [[194939, 194939], "mapped", [156890]], [[194940, 194940], "mapped", [156963]], [[194941, 194941], "mapped", [32864]], [[194942, 194942], "mapped", [157096]], [[194943, 194943], "mapped", [32880]], [[194944, 194944], "mapped", [144223]], [[194945, 194945], "mapped", [17365]], [[194946, 194946], "mapped", [32946]], [[194947, 194947], "mapped", [33027]], [[194948, 194948], "mapped", [17419]], [[194949, 194949], "mapped", [33086]], [[194950, 194950], "mapped", [23221]], [[194951, 194951], "mapped", [157607]], [[194952, 194952], "mapped", [157621]], [[194953, 194953], "mapped", [144275]], [[194954, 194954], "mapped", [144284]], [[194955, 194955], "mapped", [33281]], [[194956, 194956], "mapped", [33284]], [[194957, 194957], "mapped", [36766]], [[194958, 194958], "mapped", [17515]], [[194959, 194959], "mapped", [33425]], [[194960, 194960], "mapped", [33419]], [[194961, 194961], "mapped", [33437]], [[194962, 194962], "mapped", [21171]], [[194963, 194963], "mapped", [33457]], [[194964, 194964], "mapped", [33459]], [[194965, 194965], "mapped", [33469]], [[194966, 194966], "mapped", [33510]], [[194967, 194967], "mapped", [158524]], [[194968, 194968], "mapped", [33509]], [[194969, 194969], "mapped", [33565]], [[194970, 194970], "mapped", [33635]], [[194971, 194971], "mapped", [33709]], [[194972, 194972], "mapped", [33571]], [[194973, 194973], "mapped", [33725]], [[194974, 194974], "mapped", [33767]], [[194975, 194975], "mapped", [33879]], [[194976, 194976], "mapped", [33619]], [[194977, 194977], "mapped", [33738]], [[194978, 194978], "mapped", [33740]], [[194979, 194979], "mapped", [33756]], [[194980, 194980], "mapped", [158774]], [[194981, 194981], "mapped", [159083]], [[194982, 194982], "mapped", [158933]], [[194983, 194983], "mapped", [17707]], [[194984, 194984], "mapped", [34033]], [[194985, 194985], "mapped", [34035]], [[194986, 194986], "mapped", [34070]], [[194987, 194987], "mapped", [160714]], [[194988, 194988], "mapped", [34148]], [[194989, 194989], "mapped", [159532]], [[194990, 194990], "mapped", [17757]], [[194991, 194991], "mapped", [17761]], [[194992, 194992], "mapped", [159665]], [[194993, 194993], "mapped", [159954]], [[194994, 194994], "mapped", [17771]], [[194995, 194995], "mapped", [34384]], [[194996, 194996], "mapped", [34396]], [[194997, 194997], "mapped", [34407]], [[194998, 194998], "mapped", [34409]], [[194999, 194999], "mapped", [34473]], [[195e3, 195e3], "mapped", [34440]], [[195001, 195001], "mapped", [34574]], [[195002, 195002], "mapped", [34530]], [[195003, 195003], "mapped", [34681]], [[195004, 195004], "mapped", [34600]], [[195005, 195005], "mapped", [34667]], [[195006, 195006], "mapped", [34694]], [[195007, 195007], "disallowed"], [[195008, 195008], "mapped", [34785]], [[195009, 195009], "mapped", [34817]], [[195010, 195010], "mapped", [17913]], [[195011, 195011], "mapped", [34912]], [[195012, 195012], "mapped", [34915]], [[195013, 195013], "mapped", [161383]], [[195014, 195014], "mapped", [35031]], [[195015, 195015], "mapped", [35038]], [[195016, 195016], "mapped", [17973]], [[195017, 195017], "mapped", [35066]], [[195018, 195018], "mapped", [13499]], [[195019, 195019], "mapped", [161966]], [[195020, 195020], "mapped", [162150]], [[195021, 195021], "mapped", [18110]], [[195022, 195022], "mapped", [18119]], [[195023, 195023], "mapped", [35488]], [[195024, 195024], "mapped", [35565]], [[195025, 195025], "mapped", [35722]], [[195026, 195026], "mapped", [35925]], [[195027, 195027], "mapped", [162984]], [[195028, 195028], "mapped", [36011]], [[195029, 195029], "mapped", [36033]], [[195030, 195030], "mapped", [36123]], [[195031, 195031], "mapped", [36215]], [[195032, 195032], "mapped", [163631]], [[195033, 195033], "mapped", [133124]], [[195034, 195034], "mapped", [36299]], [[195035, 195035], "mapped", [36284]], [[195036, 195036], "mapped", [36336]], [[195037, 195037], "mapped", [133342]], [[195038, 195038], "mapped", [36564]], [[195039, 195039], "mapped", [36664]], [[195040, 195040], "mapped", [165330]], [[195041, 195041], "mapped", [165357]], [[195042, 195042], "mapped", [37012]], [[195043, 195043], "mapped", [37105]], [[195044, 195044], "mapped", [37137]], [[195045, 195045], "mapped", [165678]], [[195046, 195046], "mapped", [37147]], [[195047, 195047], "mapped", [37432]], [[195048, 195048], "mapped", [37591]], [[195049, 195049], "mapped", [37592]], [[195050, 195050], "mapped", [37500]], [[195051, 195051], "mapped", [37881]], [[195052, 195052], "mapped", [37909]], [[195053, 195053], "mapped", [166906]], [[195054, 195054], "mapped", [38283]], [[195055, 195055], "mapped", [18837]], [[195056, 195056], "mapped", [38327]], [[195057, 195057], "mapped", [167287]], [[195058, 195058], "mapped", [18918]], [[195059, 195059], "mapped", [38595]], [[195060, 195060], "mapped", [23986]], [[195061, 195061], "mapped", [38691]], [[195062, 195062], "mapped", [168261]], [[195063, 195063], "mapped", [168474]], [[195064, 195064], "mapped", [19054]], [[195065, 195065], "mapped", [19062]], [[195066, 195066], "mapped", [38880]], [[195067, 195067], "mapped", [168970]], [[195068, 195068], "mapped", [19122]], [[195069, 195069], "mapped", [169110]], [[195070, 195071], "mapped", [38923]], [[195072, 195072], "mapped", [38953]], [[195073, 195073], "mapped", [169398]], [[195074, 195074], "mapped", [39138]], [[195075, 195075], "mapped", [19251]], [[195076, 195076], "mapped", [39209]], [[195077, 195077], "mapped", [39335]], [[195078, 195078], "mapped", [39362]], [[195079, 195079], "mapped", [39422]], [[195080, 195080], "mapped", [19406]], [[195081, 195081], "mapped", [170800]], [[195082, 195082], "mapped", [39698]], [[195083, 195083], "mapped", [4e4]], [[195084, 195084], "mapped", [40189]], [[195085, 195085], "mapped", [19662]], [[195086, 195086], "mapped", [19693]], [[195087, 195087], "mapped", [40295]], [[195088, 195088], "mapped", [172238]], [[195089, 195089], "mapped", [19704]], [[195090, 195090], "mapped", [172293]], [[195091, 195091], "mapped", [172558]], [[195092, 195092], "mapped", [172689]], [[195093, 195093], "mapped", [40635]], [[195094, 195094], "mapped", [19798]], [[195095, 195095], "mapped", [40697]], [[195096, 195096], "mapped", [40702]], [[195097, 195097], "mapped", [40709]], [[195098, 195098], "mapped", [40719]], [[195099, 195099], "mapped", [40726]], [[195100, 195100], "mapped", [40763]], [[195101, 195101], "mapped", [173568]], [[195102, 196605], "disallowed"], [[196606, 196607], "disallowed"], [[196608, 262141], "disallowed"], [[262142, 262143], "disallowed"], [[262144, 327677], "disallowed"], [[327678, 327679], "disallowed"], [[327680, 393213], "disallowed"], [[393214, 393215], "disallowed"], [[393216, 458749], "disallowed"], [[458750, 458751], "disallowed"], [[458752, 524285], "disallowed"], [[524286, 524287], "disallowed"], [[524288, 589821], "disallowed"], [[589822, 589823], "disallowed"], [[589824, 655357], "disallowed"], [[655358, 655359], "disallowed"], [[655360, 720893], "disallowed"], [[720894, 720895], "disallowed"], [[720896, 786429], "disallowed"], [[786430, 786431], "disallowed"], [[786432, 851965], "disallowed"], [[851966, 851967], "disallowed"], [[851968, 917501], "disallowed"], [[917502, 917503], "disallowed"], [[917504, 917504], "disallowed"], [[917505, 917505], "disallowed"], [[917506, 917535], "disallowed"], [[917536, 917631], "disallowed"], [[917632, 917759], "disallowed"], [[917760, 917999], "ignored"], [[918e3, 983037], "disallowed"], [[983038, 983039], "disallowed"], [[983040, 1048573], "disallowed"], [[1048574, 1048575], "disallowed"], [[1048576, 1114109], "disallowed"], [[1114110, 1114111], "disallowed"]];
  }
});

// ../../../node_modules/tr46/index.js
var require_tr46 = __commonJS({
  "../../../node_modules/tr46/index.js"(exports, module2) {
    "use strict";
    var punycode = require("punycode");
    var mappingTable = require_mappingTable();
    var PROCESSING_OPTIONS = {
      TRANSITIONAL: 0,
      NONTRANSITIONAL: 1
    };
    function normalize(str) {
      return str.split("\0").map(function(s) {
        return s.normalize("NFC");
      }).join("\0");
    }
    function findStatus(val) {
      var start = 0;
      var end = mappingTable.length - 1;
      while (start <= end) {
        var mid = Math.floor((start + end) / 2);
        var target = mappingTable[mid];
        if (target[0][0] <= val && target[0][1] >= val) {
          return target;
        } else if (target[0][0] > val) {
          end = mid - 1;
        } else {
          start = mid + 1;
        }
      }
      return null;
    }
    var regexAstralSymbols = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
    function countSymbols(string) {
      return string.replace(regexAstralSymbols, "_").length;
    }
    function mapChars(domain_name, useSTD3, processing_option) {
      var hasError = false;
      var processed = "";
      var len = countSymbols(domain_name);
      for (var i = 0; i < len; ++i) {
        var codePoint = domain_name.codePointAt(i);
        var status = findStatus(codePoint);
        switch (status[1]) {
          case "disallowed":
            hasError = true;
            processed += String.fromCodePoint(codePoint);
            break;
          case "ignored":
            break;
          case "mapped":
            processed += String.fromCodePoint.apply(String, status[2]);
            break;
          case "deviation":
            if (processing_option === PROCESSING_OPTIONS.TRANSITIONAL) {
              processed += String.fromCodePoint.apply(String, status[2]);
            } else {
              processed += String.fromCodePoint(codePoint);
            }
            break;
          case "valid":
            processed += String.fromCodePoint(codePoint);
            break;
          case "disallowed_STD3_mapped":
            if (useSTD3) {
              hasError = true;
              processed += String.fromCodePoint(codePoint);
            } else {
              processed += String.fromCodePoint.apply(String, status[2]);
            }
            break;
          case "disallowed_STD3_valid":
            if (useSTD3) {
              hasError = true;
            }
            processed += String.fromCodePoint(codePoint);
            break;
        }
      }
      return {
        string: processed,
        error: hasError
      };
    }
    var combiningMarksRegex = /[\u0300-\u036F\u0483-\u0489\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08E4-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B62\u0B63\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0C00-\u0C03\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C81-\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0D01-\u0D03\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D82\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EB9\u0EBB\u0EBC\u0EC8-\u0ECD\u0F18\u0F19\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102B-\u103E\u1056-\u1059\u105E-\u1060\u1062-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F\u109A-\u109D\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4-\u17D3\u17DD\u180B-\u180D\u18A9\u1920-\u192B\u1930-\u193B\u19B0-\u19C0\u19C8\u19C9\u1A17-\u1A1B\u1A55-\u1A5E\u1A60-\u1A7C\u1A7F\u1AB0-\u1ABE\u1B00-\u1B04\u1B34-\u1B44\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAD\u1BE6-\u1BF3\u1C24-\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CED\u1CF2-\u1CF4\u1CF8\u1CF9\u1DC0-\u1DF5\u1DFC-\u1DFF\u20D0-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\uA66F-\uA672\uA674-\uA67D\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA823-\uA827\uA880\uA881\uA8B4-\uA8C4\uA8E0-\uA8F1\uA926-\uA92D\uA947-\uA953\uA980-\uA983\uA9B3-\uA9C0\uA9E5\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uAA7B-\uAA7D\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEB-\uAAEF\uAAF5\uAAF6\uABE3-\uABEA\uABEC\uABED\uFB1E\uFE00-\uFE0F\uFE20-\uFE2D]|\uD800[\uDDFD\uDEE0\uDF76-\uDF7A]|\uD802[\uDE01-\uDE03\uDE05\uDE06\uDE0C-\uDE0F\uDE38-\uDE3A\uDE3F\uDEE5\uDEE6]|\uD804[\uDC00-\uDC02\uDC38-\uDC46\uDC7F-\uDC82\uDCB0-\uDCBA\uDD00-\uDD02\uDD27-\uDD34\uDD73\uDD80-\uDD82\uDDB3-\uDDC0\uDE2C-\uDE37\uDEDF-\uDEEA\uDF01-\uDF03\uDF3C\uDF3E-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF57\uDF62\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDCB0-\uDCC3\uDDAF-\uDDB5\uDDB8-\uDDC0\uDE30-\uDE40\uDEAB-\uDEB7]|\uD81A[\uDEF0-\uDEF4\uDF30-\uDF36]|\uD81B[\uDF51-\uDF7E\uDF8F-\uDF92]|\uD82F[\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD83A[\uDCD0-\uDCD6]|\uDB40[\uDD00-\uDDEF]/;
    function validateLabel(label, processing_option) {
      if (label.substr(0, 4) === "xn--") {
        label = punycode.toUnicode(label);
        processing_option = PROCESSING_OPTIONS.NONTRANSITIONAL;
      }
      var error = false;
      if (normalize(label) !== label || label[3] === "-" && label[4] === "-" || label[0] === "-" || label[label.length - 1] === "-" || label.indexOf(".") !== -1 || label.search(combiningMarksRegex) === 0) {
        error = true;
      }
      var len = countSymbols(label);
      for (var i = 0; i < len; ++i) {
        var status = findStatus(label.codePointAt(i));
        if (processing === PROCESSING_OPTIONS.TRANSITIONAL && status[1] !== "valid" || processing === PROCESSING_OPTIONS.NONTRANSITIONAL && status[1] !== "valid" && status[1] !== "deviation") {
          error = true;
          break;
        }
      }
      return {
        label,
        error
      };
    }
    function processing(domain_name, useSTD3, processing_option) {
      var result = mapChars(domain_name, useSTD3, processing_option);
      result.string = normalize(result.string);
      var labels = result.string.split(".");
      for (var i = 0; i < labels.length; ++i) {
        try {
          var validation = validateLabel(labels[i]);
          labels[i] = validation.label;
          result.error = result.error || validation.error;
        } catch (e) {
          result.error = true;
        }
      }
      return {
        string: labels.join("."),
        error: result.error
      };
    }
    module2.exports.toASCII = function(domain_name, useSTD3, processing_option, verifyDnsLength) {
      var result = processing(domain_name, useSTD3, processing_option);
      var labels = result.string.split(".");
      labels = labels.map(function(l) {
        try {
          return punycode.toASCII(l);
        } catch (e) {
          result.error = true;
          return l;
        }
      });
      if (verifyDnsLength) {
        var total = labels.slice(0, labels.length - 1).join(".").length;
        if (total.length > 253 || total.length === 0) {
          result.error = true;
        }
        for (var i = 0; i < labels.length; ++i) {
          if (labels.length > 63 || labels.length === 0) {
            result.error = true;
            break;
          }
        }
      }
      if (result.error)
        return null;
      return labels.join(".");
    };
    module2.exports.toUnicode = function(domain_name, useSTD3) {
      var result = processing(domain_name, useSTD3, PROCESSING_OPTIONS.NONTRANSITIONAL);
      return {
        domain: result.string,
        error: result.error
      };
    };
    module2.exports.PROCESSING_OPTIONS = PROCESSING_OPTIONS;
  }
});

// ../../../node_modules/whatwg-url/lib/url-state-machine.js
var require_url_state_machine = __commonJS({
  "../../../node_modules/whatwg-url/lib/url-state-machine.js"(exports, module2) {
    "use strict";
    var punycode = require("punycode");
    var tr46 = require_tr46();
    var specialSchemes = {
      ftp: 21,
      file: null,
      gopher: 70,
      http: 80,
      https: 443,
      ws: 80,
      wss: 443
    };
    var failure = Symbol("failure");
    function countSymbols(str) {
      return punycode.ucs2.decode(str).length;
    }
    function at(input, idx) {
      const c = input[idx];
      return isNaN(c) ? void 0 : String.fromCodePoint(c);
    }
    function isASCIIDigit(c) {
      return c >= 48 && c <= 57;
    }
    function isASCIIAlpha(c) {
      return c >= 65 && c <= 90 || c >= 97 && c <= 122;
    }
    function isASCIIAlphanumeric(c) {
      return isASCIIAlpha(c) || isASCIIDigit(c);
    }
    function isASCIIHex(c) {
      return isASCIIDigit(c) || c >= 65 && c <= 70 || c >= 97 && c <= 102;
    }
    function isSingleDot(buffer) {
      return buffer === "." || buffer.toLowerCase() === "%2e";
    }
    function isDoubleDot(buffer) {
      buffer = buffer.toLowerCase();
      return buffer === ".." || buffer === "%2e." || buffer === ".%2e" || buffer === "%2e%2e";
    }
    function isWindowsDriveLetterCodePoints(cp1, cp2) {
      return isASCIIAlpha(cp1) && (cp2 === 58 || cp2 === 124);
    }
    function isWindowsDriveLetterString(string) {
      return string.length === 2 && isASCIIAlpha(string.codePointAt(0)) && (string[1] === ":" || string[1] === "|");
    }
    function isNormalizedWindowsDriveLetterString(string) {
      return string.length === 2 && isASCIIAlpha(string.codePointAt(0)) && string[1] === ":";
    }
    function containsForbiddenHostCodePoint(string) {
      return string.search(/\u0000|\u0009|\u000A|\u000D|\u0020|#|%|\/|:|\?|@|\[|\\|\]/) !== -1;
    }
    function containsForbiddenHostCodePointExcludingPercent(string) {
      return string.search(/\u0000|\u0009|\u000A|\u000D|\u0020|#|\/|:|\?|@|\[|\\|\]/) !== -1;
    }
    function isSpecialScheme(scheme) {
      return specialSchemes[scheme] !== void 0;
    }
    function isSpecial(url2) {
      return isSpecialScheme(url2.scheme);
    }
    function defaultPort(scheme) {
      return specialSchemes[scheme];
    }
    function percentEncode(c) {
      let hex = c.toString(16).toUpperCase();
      if (hex.length === 1) {
        hex = "0" + hex;
      }
      return "%" + hex;
    }
    function utf8PercentEncode(c) {
      const buf = new Buffer(c);
      let str = "";
      for (let i = 0; i < buf.length; ++i) {
        str += percentEncode(buf[i]);
      }
      return str;
    }
    function utf8PercentDecode(str) {
      const input = new Buffer(str);
      const output = [];
      for (let i = 0; i < input.length; ++i) {
        if (input[i] !== 37) {
          output.push(input[i]);
        } else if (input[i] === 37 && isASCIIHex(input[i + 1]) && isASCIIHex(input[i + 2])) {
          output.push(parseInt(input.slice(i + 1, i + 3).toString(), 16));
          i += 2;
        } else {
          output.push(input[i]);
        }
      }
      return new Buffer(output).toString();
    }
    function isC0ControlPercentEncode(c) {
      return c <= 31 || c > 126;
    }
    var extraPathPercentEncodeSet = /* @__PURE__ */ new Set([32, 34, 35, 60, 62, 63, 96, 123, 125]);
    function isPathPercentEncode(c) {
      return isC0ControlPercentEncode(c) || extraPathPercentEncodeSet.has(c);
    }
    var extraUserinfoPercentEncodeSet = /* @__PURE__ */ new Set([47, 58, 59, 61, 64, 91, 92, 93, 94, 124]);
    function isUserinfoPercentEncode(c) {
      return isPathPercentEncode(c) || extraUserinfoPercentEncodeSet.has(c);
    }
    function percentEncodeChar(c, encodeSetPredicate) {
      const cStr = String.fromCodePoint(c);
      if (encodeSetPredicate(c)) {
        return utf8PercentEncode(cStr);
      }
      return cStr;
    }
    function parseIPv4Number(input) {
      let R = 10;
      if (input.length >= 2 && input.charAt(0) === "0" && input.charAt(1).toLowerCase() === "x") {
        input = input.substring(2);
        R = 16;
      } else if (input.length >= 2 && input.charAt(0) === "0") {
        input = input.substring(1);
        R = 8;
      }
      if (input === "") {
        return 0;
      }
      const regex = R === 10 ? /[^0-9]/ : R === 16 ? /[^0-9A-Fa-f]/ : /[^0-7]/;
      if (regex.test(input)) {
        return failure;
      }
      return parseInt(input, R);
    }
    function parseIPv4(input) {
      const parts = input.split(".");
      if (parts[parts.length - 1] === "") {
        if (parts.length > 1) {
          parts.pop();
        }
      }
      if (parts.length > 4) {
        return input;
      }
      const numbers = [];
      for (const part of parts) {
        if (part === "") {
          return input;
        }
        const n = parseIPv4Number(part);
        if (n === failure) {
          return input;
        }
        numbers.push(n);
      }
      for (let i = 0; i < numbers.length - 1; ++i) {
        if (numbers[i] > 255) {
          return failure;
        }
      }
      if (numbers[numbers.length - 1] >= Math.pow(256, 5 - numbers.length)) {
        return failure;
      }
      let ipv4 = numbers.pop();
      let counter = 0;
      for (const n of numbers) {
        ipv4 += n * Math.pow(256, 3 - counter);
        ++counter;
      }
      return ipv4;
    }
    function serializeIPv4(address) {
      let output = "";
      let n = address;
      for (let i = 1; i <= 4; ++i) {
        output = String(n % 256) + output;
        if (i !== 4) {
          output = "." + output;
        }
        n = Math.floor(n / 256);
      }
      return output;
    }
    function parseIPv6(input) {
      const address = [0, 0, 0, 0, 0, 0, 0, 0];
      let pieceIndex = 0;
      let compress = null;
      let pointer = 0;
      input = punycode.ucs2.decode(input);
      if (input[pointer] === 58) {
        if (input[pointer + 1] !== 58) {
          return failure;
        }
        pointer += 2;
        ++pieceIndex;
        compress = pieceIndex;
      }
      while (pointer < input.length) {
        if (pieceIndex === 8) {
          return failure;
        }
        if (input[pointer] === 58) {
          if (compress !== null) {
            return failure;
          }
          ++pointer;
          ++pieceIndex;
          compress = pieceIndex;
          continue;
        }
        let value = 0;
        let length = 0;
        while (length < 4 && isASCIIHex(input[pointer])) {
          value = value * 16 + parseInt(at(input, pointer), 16);
          ++pointer;
          ++length;
        }
        if (input[pointer] === 46) {
          if (length === 0) {
            return failure;
          }
          pointer -= length;
          if (pieceIndex > 6) {
            return failure;
          }
          let numbersSeen = 0;
          while (input[pointer] !== void 0) {
            let ipv4Piece = null;
            if (numbersSeen > 0) {
              if (input[pointer] === 46 && numbersSeen < 4) {
                ++pointer;
              } else {
                return failure;
              }
            }
            if (!isASCIIDigit(input[pointer])) {
              return failure;
            }
            while (isASCIIDigit(input[pointer])) {
              const number = parseInt(at(input, pointer));
              if (ipv4Piece === null) {
                ipv4Piece = number;
              } else if (ipv4Piece === 0) {
                return failure;
              } else {
                ipv4Piece = ipv4Piece * 10 + number;
              }
              if (ipv4Piece > 255) {
                return failure;
              }
              ++pointer;
            }
            address[pieceIndex] = address[pieceIndex] * 256 + ipv4Piece;
            ++numbersSeen;
            if (numbersSeen === 2 || numbersSeen === 4) {
              ++pieceIndex;
            }
          }
          if (numbersSeen !== 4) {
            return failure;
          }
          break;
        } else if (input[pointer] === 58) {
          ++pointer;
          if (input[pointer] === void 0) {
            return failure;
          }
        } else if (input[pointer] !== void 0) {
          return failure;
        }
        address[pieceIndex] = value;
        ++pieceIndex;
      }
      if (compress !== null) {
        let swaps = pieceIndex - compress;
        pieceIndex = 7;
        while (pieceIndex !== 0 && swaps > 0) {
          const temp = address[compress + swaps - 1];
          address[compress + swaps - 1] = address[pieceIndex];
          address[pieceIndex] = temp;
          --pieceIndex;
          --swaps;
        }
      } else if (compress === null && pieceIndex !== 8) {
        return failure;
      }
      return address;
    }
    function serializeIPv6(address) {
      let output = "";
      const seqResult = findLongestZeroSequence(address);
      const compress = seqResult.idx;
      let ignore0 = false;
      for (let pieceIndex = 0; pieceIndex <= 7; ++pieceIndex) {
        if (ignore0 && address[pieceIndex] === 0) {
          continue;
        } else if (ignore0) {
          ignore0 = false;
        }
        if (compress === pieceIndex) {
          const separator = pieceIndex === 0 ? "::" : ":";
          output += separator;
          ignore0 = true;
          continue;
        }
        output += address[pieceIndex].toString(16);
        if (pieceIndex !== 7) {
          output += ":";
        }
      }
      return output;
    }
    function parseHost(input, isSpecialArg) {
      if (input[0] === "[") {
        if (input[input.length - 1] !== "]") {
          return failure;
        }
        return parseIPv6(input.substring(1, input.length - 1));
      }
      if (!isSpecialArg) {
        return parseOpaqueHost(input);
      }
      const domain = utf8PercentDecode(input);
      const asciiDomain = tr46.toASCII(domain, false, tr46.PROCESSING_OPTIONS.NONTRANSITIONAL, false);
      if (asciiDomain === null) {
        return failure;
      }
      if (containsForbiddenHostCodePoint(asciiDomain)) {
        return failure;
      }
      const ipv4Host = parseIPv4(asciiDomain);
      if (typeof ipv4Host === "number" || ipv4Host === failure) {
        return ipv4Host;
      }
      return asciiDomain;
    }
    function parseOpaqueHost(input) {
      if (containsForbiddenHostCodePointExcludingPercent(input)) {
        return failure;
      }
      let output = "";
      const decoded = punycode.ucs2.decode(input);
      for (let i = 0; i < decoded.length; ++i) {
        output += percentEncodeChar(decoded[i], isC0ControlPercentEncode);
      }
      return output;
    }
    function findLongestZeroSequence(arr) {
      let maxIdx = null;
      let maxLen = 1;
      let currStart = null;
      let currLen = 0;
      for (let i = 0; i < arr.length; ++i) {
        if (arr[i] !== 0) {
          if (currLen > maxLen) {
            maxIdx = currStart;
            maxLen = currLen;
          }
          currStart = null;
          currLen = 0;
        } else {
          if (currStart === null) {
            currStart = i;
          }
          ++currLen;
        }
      }
      if (currLen > maxLen) {
        maxIdx = currStart;
        maxLen = currLen;
      }
      return {
        idx: maxIdx,
        len: maxLen
      };
    }
    function serializeHost(host) {
      if (typeof host === "number") {
        return serializeIPv4(host);
      }
      if (host instanceof Array) {
        return "[" + serializeIPv6(host) + "]";
      }
      return host;
    }
    function trimControlChars(url2) {
      return url2.replace(/^[\u0000-\u001F\u0020]+|[\u0000-\u001F\u0020]+$/g, "");
    }
    function trimTabAndNewline(url2) {
      return url2.replace(/\u0009|\u000A|\u000D/g, "");
    }
    function shortenPath(url2) {
      const path = url2.path;
      if (path.length === 0) {
        return;
      }
      if (url2.scheme === "file" && path.length === 1 && isNormalizedWindowsDriveLetter(path[0])) {
        return;
      }
      path.pop();
    }
    function includesCredentials(url2) {
      return url2.username !== "" || url2.password !== "";
    }
    function cannotHaveAUsernamePasswordPort(url2) {
      return url2.host === null || url2.host === "" || url2.cannotBeABaseURL || url2.scheme === "file";
    }
    function isNormalizedWindowsDriveLetter(string) {
      return /^[A-Za-z]:$/.test(string);
    }
    function URLStateMachine(input, base, encodingOverride, url2, stateOverride) {
      this.pointer = 0;
      this.input = input;
      this.base = base || null;
      this.encodingOverride = encodingOverride || "utf-8";
      this.stateOverride = stateOverride;
      this.url = url2;
      this.failure = false;
      this.parseError = false;
      if (!this.url) {
        this.url = {
          scheme: "",
          username: "",
          password: "",
          host: null,
          port: null,
          path: [],
          query: null,
          fragment: null,
          cannotBeABaseURL: false
        };
        const res2 = trimControlChars(this.input);
        if (res2 !== this.input) {
          this.parseError = true;
        }
        this.input = res2;
      }
      const res = trimTabAndNewline(this.input);
      if (res !== this.input) {
        this.parseError = true;
      }
      this.input = res;
      this.state = stateOverride || "scheme start";
      this.buffer = "";
      this.atFlag = false;
      this.arrFlag = false;
      this.passwordTokenSeenFlag = false;
      this.input = punycode.ucs2.decode(this.input);
      for (; this.pointer <= this.input.length; ++this.pointer) {
        const c = this.input[this.pointer];
        const cStr = isNaN(c) ? void 0 : String.fromCodePoint(c);
        const ret = this["parse " + this.state](c, cStr);
        if (!ret) {
          break;
        } else if (ret === failure) {
          this.failure = true;
          break;
        }
      }
    }
    URLStateMachine.prototype["parse scheme start"] = function parseSchemeStart(c, cStr) {
      if (isASCIIAlpha(c)) {
        this.buffer += cStr.toLowerCase();
        this.state = "scheme";
      } else if (!this.stateOverride) {
        this.state = "no scheme";
        --this.pointer;
      } else {
        this.parseError = true;
        return failure;
      }
      return true;
    };
    URLStateMachine.prototype["parse scheme"] = function parseScheme(c, cStr) {
      if (isASCIIAlphanumeric(c) || c === 43 || c === 45 || c === 46) {
        this.buffer += cStr.toLowerCase();
      } else if (c === 58) {
        if (this.stateOverride) {
          if (isSpecial(this.url) && !isSpecialScheme(this.buffer)) {
            return false;
          }
          if (!isSpecial(this.url) && isSpecialScheme(this.buffer)) {
            return false;
          }
          if ((includesCredentials(this.url) || this.url.port !== null) && this.buffer === "file") {
            return false;
          }
          if (this.url.scheme === "file" && (this.url.host === "" || this.url.host === null)) {
            return false;
          }
        }
        this.url.scheme = this.buffer;
        this.buffer = "";
        if (this.stateOverride) {
          return false;
        }
        if (this.url.scheme === "file") {
          if (this.input[this.pointer + 1] !== 47 || this.input[this.pointer + 2] !== 47) {
            this.parseError = true;
          }
          this.state = "file";
        } else if (isSpecial(this.url) && this.base !== null && this.base.scheme === this.url.scheme) {
          this.state = "special relative or authority";
        } else if (isSpecial(this.url)) {
          this.state = "special authority slashes";
        } else if (this.input[this.pointer + 1] === 47) {
          this.state = "path or authority";
          ++this.pointer;
        } else {
          this.url.cannotBeABaseURL = true;
          this.url.path.push("");
          this.state = "cannot-be-a-base-URL path";
        }
      } else if (!this.stateOverride) {
        this.buffer = "";
        this.state = "no scheme";
        this.pointer = -1;
      } else {
        this.parseError = true;
        return failure;
      }
      return true;
    };
    URLStateMachine.prototype["parse no scheme"] = function parseNoScheme(c) {
      if (this.base === null || this.base.cannotBeABaseURL && c !== 35) {
        return failure;
      } else if (this.base.cannotBeABaseURL && c === 35) {
        this.url.scheme = this.base.scheme;
        this.url.path = this.base.path.slice();
        this.url.query = this.base.query;
        this.url.fragment = "";
        this.url.cannotBeABaseURL = true;
        this.state = "fragment";
      } else if (this.base.scheme === "file") {
        this.state = "file";
        --this.pointer;
      } else {
        this.state = "relative";
        --this.pointer;
      }
      return true;
    };
    URLStateMachine.prototype["parse special relative or authority"] = function parseSpecialRelativeOrAuthority(c) {
      if (c === 47 && this.input[this.pointer + 1] === 47) {
        this.state = "special authority ignore slashes";
        ++this.pointer;
      } else {
        this.parseError = true;
        this.state = "relative";
        --this.pointer;
      }
      return true;
    };
    URLStateMachine.prototype["parse path or authority"] = function parsePathOrAuthority(c) {
      if (c === 47) {
        this.state = "authority";
      } else {
        this.state = "path";
        --this.pointer;
      }
      return true;
    };
    URLStateMachine.prototype["parse relative"] = function parseRelative(c) {
      this.url.scheme = this.base.scheme;
      if (isNaN(c)) {
        this.url.username = this.base.username;
        this.url.password = this.base.password;
        this.url.host = this.base.host;
        this.url.port = this.base.port;
        this.url.path = this.base.path.slice();
        this.url.query = this.base.query;
      } else if (c === 47) {
        this.state = "relative slash";
      } else if (c === 63) {
        this.url.username = this.base.username;
        this.url.password = this.base.password;
        this.url.host = this.base.host;
        this.url.port = this.base.port;
        this.url.path = this.base.path.slice();
        this.url.query = "";
        this.state = "query";
      } else if (c === 35) {
        this.url.username = this.base.username;
        this.url.password = this.base.password;
        this.url.host = this.base.host;
        this.url.port = this.base.port;
        this.url.path = this.base.path.slice();
        this.url.query = this.base.query;
        this.url.fragment = "";
        this.state = "fragment";
      } else if (isSpecial(this.url) && c === 92) {
        this.parseError = true;
        this.state = "relative slash";
      } else {
        this.url.username = this.base.username;
        this.url.password = this.base.password;
        this.url.host = this.base.host;
        this.url.port = this.base.port;
        this.url.path = this.base.path.slice(0, this.base.path.length - 1);
        this.state = "path";
        --this.pointer;
      }
      return true;
    };
    URLStateMachine.prototype["parse relative slash"] = function parseRelativeSlash(c) {
      if (isSpecial(this.url) && (c === 47 || c === 92)) {
        if (c === 92) {
          this.parseError = true;
        }
        this.state = "special authority ignore slashes";
      } else if (c === 47) {
        this.state = "authority";
      } else {
        this.url.username = this.base.username;
        this.url.password = this.base.password;
        this.url.host = this.base.host;
        this.url.port = this.base.port;
        this.state = "path";
        --this.pointer;
      }
      return true;
    };
    URLStateMachine.prototype["parse special authority slashes"] = function parseSpecialAuthoritySlashes(c) {
      if (c === 47 && this.input[this.pointer + 1] === 47) {
        this.state = "special authority ignore slashes";
        ++this.pointer;
      } else {
        this.parseError = true;
        this.state = "special authority ignore slashes";
        --this.pointer;
      }
      return true;
    };
    URLStateMachine.prototype["parse special authority ignore slashes"] = function parseSpecialAuthorityIgnoreSlashes(c) {
      if (c !== 47 && c !== 92) {
        this.state = "authority";
        --this.pointer;
      } else {
        this.parseError = true;
      }
      return true;
    };
    URLStateMachine.prototype["parse authority"] = function parseAuthority(c, cStr) {
      if (c === 64) {
        this.parseError = true;
        if (this.atFlag) {
          this.buffer = "%40" + this.buffer;
        }
        this.atFlag = true;
        const len = countSymbols(this.buffer);
        for (let pointer = 0; pointer < len; ++pointer) {
          const codePoint = this.buffer.codePointAt(pointer);
          if (codePoint === 58 && !this.passwordTokenSeenFlag) {
            this.passwordTokenSeenFlag = true;
            continue;
          }
          const encodedCodePoints = percentEncodeChar(codePoint, isUserinfoPercentEncode);
          if (this.passwordTokenSeenFlag) {
            this.url.password += encodedCodePoints;
          } else {
            this.url.username += encodedCodePoints;
          }
        }
        this.buffer = "";
      } else if (isNaN(c) || c === 47 || c === 63 || c === 35 || isSpecial(this.url) && c === 92) {
        if (this.atFlag && this.buffer === "") {
          this.parseError = true;
          return failure;
        }
        this.pointer -= countSymbols(this.buffer) + 1;
        this.buffer = "";
        this.state = "host";
      } else {
        this.buffer += cStr;
      }
      return true;
    };
    URLStateMachine.prototype["parse hostname"] = URLStateMachine.prototype["parse host"] = function parseHostName(c, cStr) {
      if (this.stateOverride && this.url.scheme === "file") {
        --this.pointer;
        this.state = "file host";
      } else if (c === 58 && !this.arrFlag) {
        if (this.buffer === "") {
          this.parseError = true;
          return failure;
        }
        const host = parseHost(this.buffer, isSpecial(this.url));
        if (host === failure) {
          return failure;
        }
        this.url.host = host;
        this.buffer = "";
        this.state = "port";
        if (this.stateOverride === "hostname") {
          return false;
        }
      } else if (isNaN(c) || c === 47 || c === 63 || c === 35 || isSpecial(this.url) && c === 92) {
        --this.pointer;
        if (isSpecial(this.url) && this.buffer === "") {
          this.parseError = true;
          return failure;
        } else if (this.stateOverride && this.buffer === "" && (includesCredentials(this.url) || this.url.port !== null)) {
          this.parseError = true;
          return false;
        }
        const host = parseHost(this.buffer, isSpecial(this.url));
        if (host === failure) {
          return failure;
        }
        this.url.host = host;
        this.buffer = "";
        this.state = "path start";
        if (this.stateOverride) {
          return false;
        }
      } else {
        if (c === 91) {
          this.arrFlag = true;
        } else if (c === 93) {
          this.arrFlag = false;
        }
        this.buffer += cStr;
      }
      return true;
    };
    URLStateMachine.prototype["parse port"] = function parsePort(c, cStr) {
      if (isASCIIDigit(c)) {
        this.buffer += cStr;
      } else if (isNaN(c) || c === 47 || c === 63 || c === 35 || isSpecial(this.url) && c === 92 || this.stateOverride) {
        if (this.buffer !== "") {
          const port = parseInt(this.buffer);
          if (port > Math.pow(2, 16) - 1) {
            this.parseError = true;
            return failure;
          }
          this.url.port = port === defaultPort(this.url.scheme) ? null : port;
          this.buffer = "";
        }
        if (this.stateOverride) {
          return false;
        }
        this.state = "path start";
        --this.pointer;
      } else {
        this.parseError = true;
        return failure;
      }
      return true;
    };
    var fileOtherwiseCodePoints = /* @__PURE__ */ new Set([47, 92, 63, 35]);
    URLStateMachine.prototype["parse file"] = function parseFile(c) {
      this.url.scheme = "file";
      if (c === 47 || c === 92) {
        if (c === 92) {
          this.parseError = true;
        }
        this.state = "file slash";
      } else if (this.base !== null && this.base.scheme === "file") {
        if (isNaN(c)) {
          this.url.host = this.base.host;
          this.url.path = this.base.path.slice();
          this.url.query = this.base.query;
        } else if (c === 63) {
          this.url.host = this.base.host;
          this.url.path = this.base.path.slice();
          this.url.query = "";
          this.state = "query";
        } else if (c === 35) {
          this.url.host = this.base.host;
          this.url.path = this.base.path.slice();
          this.url.query = this.base.query;
          this.url.fragment = "";
          this.state = "fragment";
        } else {
          if (this.input.length - this.pointer - 1 === 0 || // remaining consists of 0 code points
          !isWindowsDriveLetterCodePoints(c, this.input[this.pointer + 1]) || this.input.length - this.pointer - 1 >= 2 && // remaining has at least 2 code points
          !fileOtherwiseCodePoints.has(this.input[this.pointer + 2])) {
            this.url.host = this.base.host;
            this.url.path = this.base.path.slice();
            shortenPath(this.url);
          } else {
            this.parseError = true;
          }
          this.state = "path";
          --this.pointer;
        }
      } else {
        this.state = "path";
        --this.pointer;
      }
      return true;
    };
    URLStateMachine.prototype["parse file slash"] = function parseFileSlash(c) {
      if (c === 47 || c === 92) {
        if (c === 92) {
          this.parseError = true;
        }
        this.state = "file host";
      } else {
        if (this.base !== null && this.base.scheme === "file") {
          if (isNormalizedWindowsDriveLetterString(this.base.path[0])) {
            this.url.path.push(this.base.path[0]);
          } else {
            this.url.host = this.base.host;
          }
        }
        this.state = "path";
        --this.pointer;
      }
      return true;
    };
    URLStateMachine.prototype["parse file host"] = function parseFileHost(c, cStr) {
      if (isNaN(c) || c === 47 || c === 92 || c === 63 || c === 35) {
        --this.pointer;
        if (!this.stateOverride && isWindowsDriveLetterString(this.buffer)) {
          this.parseError = true;
          this.state = "path";
        } else if (this.buffer === "") {
          this.url.host = "";
          if (this.stateOverride) {
            return false;
          }
          this.state = "path start";
        } else {
          let host = parseHost(this.buffer, isSpecial(this.url));
          if (host === failure) {
            return failure;
          }
          if (host === "localhost") {
            host = "";
          }
          this.url.host = host;
          if (this.stateOverride) {
            return false;
          }
          this.buffer = "";
          this.state = "path start";
        }
      } else {
        this.buffer += cStr;
      }
      return true;
    };
    URLStateMachine.prototype["parse path start"] = function parsePathStart(c) {
      if (isSpecial(this.url)) {
        if (c === 92) {
          this.parseError = true;
        }
        this.state = "path";
        if (c !== 47 && c !== 92) {
          --this.pointer;
        }
      } else if (!this.stateOverride && c === 63) {
        this.url.query = "";
        this.state = "query";
      } else if (!this.stateOverride && c === 35) {
        this.url.fragment = "";
        this.state = "fragment";
      } else if (c !== void 0) {
        this.state = "path";
        if (c !== 47) {
          --this.pointer;
        }
      }
      return true;
    };
    URLStateMachine.prototype["parse path"] = function parsePath(c) {
      if (isNaN(c) || c === 47 || isSpecial(this.url) && c === 92 || !this.stateOverride && (c === 63 || c === 35)) {
        if (isSpecial(this.url) && c === 92) {
          this.parseError = true;
        }
        if (isDoubleDot(this.buffer)) {
          shortenPath(this.url);
          if (c !== 47 && !(isSpecial(this.url) && c === 92)) {
            this.url.path.push("");
          }
        } else if (isSingleDot(this.buffer) && c !== 47 && !(isSpecial(this.url) && c === 92)) {
          this.url.path.push("");
        } else if (!isSingleDot(this.buffer)) {
          if (this.url.scheme === "file" && this.url.path.length === 0 && isWindowsDriveLetterString(this.buffer)) {
            if (this.url.host !== "" && this.url.host !== null) {
              this.parseError = true;
              this.url.host = "";
            }
            this.buffer = this.buffer[0] + ":";
          }
          this.url.path.push(this.buffer);
        }
        this.buffer = "";
        if (this.url.scheme === "file" && (c === void 0 || c === 63 || c === 35)) {
          while (this.url.path.length > 1 && this.url.path[0] === "") {
            this.parseError = true;
            this.url.path.shift();
          }
        }
        if (c === 63) {
          this.url.query = "";
          this.state = "query";
        }
        if (c === 35) {
          this.url.fragment = "";
          this.state = "fragment";
        }
      } else {
        if (c === 37 && (!isASCIIHex(this.input[this.pointer + 1]) || !isASCIIHex(this.input[this.pointer + 2]))) {
          this.parseError = true;
        }
        this.buffer += percentEncodeChar(c, isPathPercentEncode);
      }
      return true;
    };
    URLStateMachine.prototype["parse cannot-be-a-base-URL path"] = function parseCannotBeABaseURLPath(c) {
      if (c === 63) {
        this.url.query = "";
        this.state = "query";
      } else if (c === 35) {
        this.url.fragment = "";
        this.state = "fragment";
      } else {
        if (!isNaN(c) && c !== 37) {
          this.parseError = true;
        }
        if (c === 37 && (!isASCIIHex(this.input[this.pointer + 1]) || !isASCIIHex(this.input[this.pointer + 2]))) {
          this.parseError = true;
        }
        if (!isNaN(c)) {
          this.url.path[0] = this.url.path[0] + percentEncodeChar(c, isC0ControlPercentEncode);
        }
      }
      return true;
    };
    URLStateMachine.prototype["parse query"] = function parseQuery(c, cStr) {
      if (isNaN(c) || !this.stateOverride && c === 35) {
        if (!isSpecial(this.url) || this.url.scheme === "ws" || this.url.scheme === "wss") {
          this.encodingOverride = "utf-8";
        }
        const buffer = new Buffer(this.buffer);
        for (let i = 0; i < buffer.length; ++i) {
          if (buffer[i] < 33 || buffer[i] > 126 || buffer[i] === 34 || buffer[i] === 35 || buffer[i] === 60 || buffer[i] === 62) {
            this.url.query += percentEncode(buffer[i]);
          } else {
            this.url.query += String.fromCodePoint(buffer[i]);
          }
        }
        this.buffer = "";
        if (c === 35) {
          this.url.fragment = "";
          this.state = "fragment";
        }
      } else {
        if (c === 37 && (!isASCIIHex(this.input[this.pointer + 1]) || !isASCIIHex(this.input[this.pointer + 2]))) {
          this.parseError = true;
        }
        this.buffer += cStr;
      }
      return true;
    };
    URLStateMachine.prototype["parse fragment"] = function parseFragment(c) {
      if (isNaN(c)) {
      } else if (c === 0) {
        this.parseError = true;
      } else {
        if (c === 37 && (!isASCIIHex(this.input[this.pointer + 1]) || !isASCIIHex(this.input[this.pointer + 2]))) {
          this.parseError = true;
        }
        this.url.fragment += percentEncodeChar(c, isC0ControlPercentEncode);
      }
      return true;
    };
    function serializeURL(url2, excludeFragment) {
      let output = url2.scheme + ":";
      if (url2.host !== null) {
        output += "//";
        if (url2.username !== "" || url2.password !== "") {
          output += url2.username;
          if (url2.password !== "") {
            output += ":" + url2.password;
          }
          output += "@";
        }
        output += serializeHost(url2.host);
        if (url2.port !== null) {
          output += ":" + url2.port;
        }
      } else if (url2.host === null && url2.scheme === "file") {
        output += "//";
      }
      if (url2.cannotBeABaseURL) {
        output += url2.path[0];
      } else {
        for (const string of url2.path) {
          output += "/" + string;
        }
      }
      if (url2.query !== null) {
        output += "?" + url2.query;
      }
      if (!excludeFragment && url2.fragment !== null) {
        output += "#" + url2.fragment;
      }
      return output;
    }
    function serializeOrigin(tuple) {
      let result = tuple.scheme + "://";
      result += serializeHost(tuple.host);
      if (tuple.port !== null) {
        result += ":" + tuple.port;
      }
      return result;
    }
    module2.exports.serializeURL = serializeURL;
    module2.exports.serializeURLOrigin = function(url2) {
      switch (url2.scheme) {
        case "blob":
          try {
            return module2.exports.serializeURLOrigin(module2.exports.parseURL(url2.path[0]));
          } catch (e) {
            return "null";
          }
        case "ftp":
        case "gopher":
        case "http":
        case "https":
        case "ws":
        case "wss":
          return serializeOrigin({
            scheme: url2.scheme,
            host: url2.host,
            port: url2.port
          });
        case "file":
          return "file://";
        default:
          return "null";
      }
    };
    module2.exports.basicURLParse = function(input, options) {
      if (options === void 0) {
        options = {};
      }
      const usm = new URLStateMachine(input, options.baseURL, options.encodingOverride, options.url, options.stateOverride);
      if (usm.failure) {
        return "failure";
      }
      return usm.url;
    };
    module2.exports.setTheUsername = function(url2, username) {
      url2.username = "";
      const decoded = punycode.ucs2.decode(username);
      for (let i = 0; i < decoded.length; ++i) {
        url2.username += percentEncodeChar(decoded[i], isUserinfoPercentEncode);
      }
    };
    module2.exports.setThePassword = function(url2, password) {
      url2.password = "";
      const decoded = punycode.ucs2.decode(password);
      for (let i = 0; i < decoded.length; ++i) {
        url2.password += percentEncodeChar(decoded[i], isUserinfoPercentEncode);
      }
    };
    module2.exports.serializeHost = serializeHost;
    module2.exports.cannotHaveAUsernamePasswordPort = cannotHaveAUsernamePasswordPort;
    module2.exports.serializeInteger = function(integer) {
      return String(integer);
    };
    module2.exports.parseURL = function(input, options) {
      if (options === void 0) {
        options = {};
      }
      return module2.exports.basicURLParse(input, { baseURL: options.baseURL, encodingOverride: options.encodingOverride });
    };
  }
});

// ../../../node_modules/whatwg-url/lib/URL-impl.js
var require_URL_impl = __commonJS({
  "../../../node_modules/whatwg-url/lib/URL-impl.js"(exports) {
    "use strict";
    var usm = require_url_state_machine();
    exports.implementation = class URLImpl {
      constructor(constructorArgs) {
        const url2 = constructorArgs[0];
        const base = constructorArgs[1];
        let parsedBase = null;
        if (base !== void 0) {
          parsedBase = usm.basicURLParse(base);
          if (parsedBase === "failure") {
            throw new TypeError("Invalid base URL");
          }
        }
        const parsedURL = usm.basicURLParse(url2, { baseURL: parsedBase });
        if (parsedURL === "failure") {
          throw new TypeError("Invalid URL");
        }
        this._url = parsedURL;
      }
      get href() {
        return usm.serializeURL(this._url);
      }
      set href(v) {
        const parsedURL = usm.basicURLParse(v);
        if (parsedURL === "failure") {
          throw new TypeError("Invalid URL");
        }
        this._url = parsedURL;
      }
      get origin() {
        return usm.serializeURLOrigin(this._url);
      }
      get protocol() {
        return this._url.scheme + ":";
      }
      set protocol(v) {
        usm.basicURLParse(v + ":", { url: this._url, stateOverride: "scheme start" });
      }
      get username() {
        return this._url.username;
      }
      set username(v) {
        if (usm.cannotHaveAUsernamePasswordPort(this._url)) {
          return;
        }
        usm.setTheUsername(this._url, v);
      }
      get password() {
        return this._url.password;
      }
      set password(v) {
        if (usm.cannotHaveAUsernamePasswordPort(this._url)) {
          return;
        }
        usm.setThePassword(this._url, v);
      }
      get host() {
        const url2 = this._url;
        if (url2.host === null) {
          return "";
        }
        if (url2.port === null) {
          return usm.serializeHost(url2.host);
        }
        return usm.serializeHost(url2.host) + ":" + usm.serializeInteger(url2.port);
      }
      set host(v) {
        if (this._url.cannotBeABaseURL) {
          return;
        }
        usm.basicURLParse(v, { url: this._url, stateOverride: "host" });
      }
      get hostname() {
        if (this._url.host === null) {
          return "";
        }
        return usm.serializeHost(this._url.host);
      }
      set hostname(v) {
        if (this._url.cannotBeABaseURL) {
          return;
        }
        usm.basicURLParse(v, { url: this._url, stateOverride: "hostname" });
      }
      get port() {
        if (this._url.port === null) {
          return "";
        }
        return usm.serializeInteger(this._url.port);
      }
      set port(v) {
        if (usm.cannotHaveAUsernamePasswordPort(this._url)) {
          return;
        }
        if (v === "") {
          this._url.port = null;
        } else {
          usm.basicURLParse(v, { url: this._url, stateOverride: "port" });
        }
      }
      get pathname() {
        if (this._url.cannotBeABaseURL) {
          return this._url.path[0];
        }
        if (this._url.path.length === 0) {
          return "";
        }
        return "/" + this._url.path.join("/");
      }
      set pathname(v) {
        if (this._url.cannotBeABaseURL) {
          return;
        }
        this._url.path = [];
        usm.basicURLParse(v, { url: this._url, stateOverride: "path start" });
      }
      get search() {
        if (this._url.query === null || this._url.query === "") {
          return "";
        }
        return "?" + this._url.query;
      }
      set search(v) {
        const url2 = this._url;
        if (v === "") {
          url2.query = null;
          return;
        }
        const input = v[0] === "?" ? v.substring(1) : v;
        url2.query = "";
        usm.basicURLParse(input, { url: url2, stateOverride: "query" });
      }
      get hash() {
        if (this._url.fragment === null || this._url.fragment === "") {
          return "";
        }
        return "#" + this._url.fragment;
      }
      set hash(v) {
        if (v === "") {
          this._url.fragment = null;
          return;
        }
        const input = v[0] === "#" ? v.substring(1) : v;
        this._url.fragment = "";
        usm.basicURLParse(input, { url: this._url, stateOverride: "fragment" });
      }
      toJSON() {
        return this.href;
      }
    };
  }
});

// ../../../node_modules/whatwg-url/lib/URL.js
var require_URL = __commonJS({
  "../../../node_modules/whatwg-url/lib/URL.js"(exports, module2) {
    "use strict";
    var conversions = require_lib();
    var utils = require_utils();
    var Impl = require_URL_impl();
    var impl = utils.implSymbol;
    function URL(url2) {
      if (!this || this[impl] || !(this instanceof URL)) {
        throw new TypeError("Failed to construct 'URL': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
      }
      if (arguments.length < 1) {
        throw new TypeError("Failed to construct 'URL': 1 argument required, but only " + arguments.length + " present.");
      }
      const args = [];
      for (let i = 0; i < arguments.length && i < 2; ++i) {
        args[i] = arguments[i];
      }
      args[0] = conversions["USVString"](args[0]);
      if (args[1] !== void 0) {
        args[1] = conversions["USVString"](args[1]);
      }
      module2.exports.setup(this, args);
    }
    URL.prototype.toJSON = function toJSON() {
      if (!this || !module2.exports.is(this)) {
        throw new TypeError("Illegal invocation");
      }
      const args = [];
      for (let i = 0; i < arguments.length && i < 0; ++i) {
        args[i] = arguments[i];
      }
      return this[impl].toJSON.apply(this[impl], args);
    };
    Object.defineProperty(URL.prototype, "href", {
      get() {
        return this[impl].href;
      },
      set(V) {
        V = conversions["USVString"](V);
        this[impl].href = V;
      },
      enumerable: true,
      configurable: true
    });
    URL.prototype.toString = function() {
      if (!this || !module2.exports.is(this)) {
        throw new TypeError("Illegal invocation");
      }
      return this.href;
    };
    Object.defineProperty(URL.prototype, "origin", {
      get() {
        return this[impl].origin;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(URL.prototype, "protocol", {
      get() {
        return this[impl].protocol;
      },
      set(V) {
        V = conversions["USVString"](V);
        this[impl].protocol = V;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(URL.prototype, "username", {
      get() {
        return this[impl].username;
      },
      set(V) {
        V = conversions["USVString"](V);
        this[impl].username = V;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(URL.prototype, "password", {
      get() {
        return this[impl].password;
      },
      set(V) {
        V = conversions["USVString"](V);
        this[impl].password = V;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(URL.prototype, "host", {
      get() {
        return this[impl].host;
      },
      set(V) {
        V = conversions["USVString"](V);
        this[impl].host = V;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(URL.prototype, "hostname", {
      get() {
        return this[impl].hostname;
      },
      set(V) {
        V = conversions["USVString"](V);
        this[impl].hostname = V;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(URL.prototype, "port", {
      get() {
        return this[impl].port;
      },
      set(V) {
        V = conversions["USVString"](V);
        this[impl].port = V;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(URL.prototype, "pathname", {
      get() {
        return this[impl].pathname;
      },
      set(V) {
        V = conversions["USVString"](V);
        this[impl].pathname = V;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(URL.prototype, "search", {
      get() {
        return this[impl].search;
      },
      set(V) {
        V = conversions["USVString"](V);
        this[impl].search = V;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(URL.prototype, "hash", {
      get() {
        return this[impl].hash;
      },
      set(V) {
        V = conversions["USVString"](V);
        this[impl].hash = V;
      },
      enumerable: true,
      configurable: true
    });
    module2.exports = {
      is(obj) {
        return !!obj && obj[impl] instanceof Impl.implementation;
      },
      create(constructorArgs, privateData) {
        let obj = Object.create(URL.prototype);
        this.setup(obj, constructorArgs, privateData);
        return obj;
      },
      setup(obj, constructorArgs, privateData) {
        if (!privateData)
          privateData = {};
        privateData.wrapper = obj;
        obj[impl] = new Impl.implementation(constructorArgs, privateData);
        obj[impl][utils.wrapperSymbol] = obj;
      },
      interface: URL,
      expose: {
        Window: { URL },
        Worker: { URL }
      }
    };
  }
});

// ../../../node_modules/whatwg-url/lib/public-api.js
var require_public_api = __commonJS({
  "../../../node_modules/whatwg-url/lib/public-api.js"(exports) {
    "use strict";
    exports.URL = require_URL().interface;
    exports.serializeURL = require_url_state_machine().serializeURL;
    exports.serializeURLOrigin = require_url_state_machine().serializeURLOrigin;
    exports.basicURLParse = require_url_state_machine().basicURLParse;
    exports.setTheUsername = require_url_state_machine().setTheUsername;
    exports.setThePassword = require_url_state_machine().setThePassword;
    exports.serializeHost = require_url_state_machine().serializeHost;
    exports.serializeInteger = require_url_state_machine().serializeInteger;
    exports.parseURL = require_url_state_machine().parseURL;
  }
});

// ../../../node_modules/safer-buffer/safer.js
var require_safer = __commonJS({
  "../../../node_modules/safer-buffer/safer.js"(exports, module2) {
    "use strict";
    var buffer = require("buffer");
    var Buffer2 = buffer.Buffer;
    var safer = {};
    var key;
    for (key in buffer) {
      if (!buffer.hasOwnProperty(key))
        continue;
      if (key === "SlowBuffer" || key === "Buffer")
        continue;
      safer[key] = buffer[key];
    }
    var Safer = safer.Buffer = {};
    for (key in Buffer2) {
      if (!Buffer2.hasOwnProperty(key))
        continue;
      if (key === "allocUnsafe" || key === "allocUnsafeSlow")
        continue;
      Safer[key] = Buffer2[key];
    }
    safer.Buffer.prototype = Buffer2.prototype;
    if (!Safer.from || Safer.from === Uint8Array.from) {
      Safer.from = function(value, encodingOrOffset, length) {
        if (typeof value === "number") {
          throw new TypeError('The "value" argument must not be of type number. Received type ' + typeof value);
        }
        if (value && typeof value.length === "undefined") {
          throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value);
        }
        return Buffer2(value, encodingOrOffset, length);
      };
    }
    if (!Safer.alloc) {
      Safer.alloc = function(size, fill, encoding) {
        if (typeof size !== "number") {
          throw new TypeError('The "size" argument must be of type number. Received type ' + typeof size);
        }
        if (size < 0 || size >= 2 * (1 << 30)) {
          throw new RangeError('The value "' + size + '" is invalid for option "size"');
        }
        var buf = Buffer2(size);
        if (!fill || fill.length === 0) {
          buf.fill(0);
        } else if (typeof encoding === "string") {
          buf.fill(fill, encoding);
        } else {
          buf.fill(fill);
        }
        return buf;
      };
    }
    if (!safer.kStringMaxLength) {
      try {
        safer.kStringMaxLength = process.binding("buffer").kStringMaxLength;
      } catch (e) {
      }
    }
    if (!safer.constants) {
      safer.constants = {
        MAX_LENGTH: safer.kMaxLength
      };
      if (safer.kStringMaxLength) {
        safer.constants.MAX_STRING_LENGTH = safer.kStringMaxLength;
      }
    }
    module2.exports = safer;
  }
});

// ../../../node_modules/encoding/node_modules/iconv-lite/lib/bom-handling.js
var require_bom_handling = __commonJS({
  "../../../node_modules/encoding/node_modules/iconv-lite/lib/bom-handling.js"(exports) {
    "use strict";
    var BOMChar = "\uFEFF";
    exports.PrependBOM = PrependBOMWrapper;
    function PrependBOMWrapper(encoder, options) {
      this.encoder = encoder;
      this.addBOM = true;
    }
    PrependBOMWrapper.prototype.write = function(str) {
      if (this.addBOM) {
        str = BOMChar + str;
        this.addBOM = false;
      }
      return this.encoder.write(str);
    };
    PrependBOMWrapper.prototype.end = function() {
      return this.encoder.end();
    };
    exports.StripBOM = StripBOMWrapper;
    function StripBOMWrapper(decoder, options) {
      this.decoder = decoder;
      this.pass = false;
      this.options = options || {};
    }
    StripBOMWrapper.prototype.write = function(buf) {
      var res = this.decoder.write(buf);
      if (this.pass || !res)
        return res;
      if (res[0] === BOMChar) {
        res = res.slice(1);
        if (typeof this.options.stripBOM === "function")
          this.options.stripBOM();
      }
      this.pass = true;
      return res;
    };
    StripBOMWrapper.prototype.end = function() {
      return this.decoder.end();
    };
  }
});

// ../../../node_modules/encoding/node_modules/iconv-lite/encodings/internal.js
var require_internal = __commonJS({
  "../../../node_modules/encoding/node_modules/iconv-lite/encodings/internal.js"(exports, module2) {
    "use strict";
    var Buffer2 = require_safer().Buffer;
    module2.exports = {
      // Encodings
      utf8: { type: "_internal", bomAware: true },
      cesu8: { type: "_internal", bomAware: true },
      unicode11utf8: "utf8",
      ucs2: { type: "_internal", bomAware: true },
      utf16le: "ucs2",
      binary: { type: "_internal" },
      base64: { type: "_internal" },
      hex: { type: "_internal" },
      // Codec.
      _internal: InternalCodec
    };
    function InternalCodec(codecOptions, iconv) {
      this.enc = codecOptions.encodingName;
      this.bomAware = codecOptions.bomAware;
      if (this.enc === "base64")
        this.encoder = InternalEncoderBase64;
      else if (this.enc === "cesu8") {
        this.enc = "utf8";
        this.encoder = InternalEncoderCesu8;
        if (Buffer2.from("eda0bdedb2a9", "hex").toString() !== "\u{1F4A9}") {
          this.decoder = InternalDecoderCesu8;
          this.defaultCharUnicode = iconv.defaultCharUnicode;
        }
      }
    }
    InternalCodec.prototype.encoder = InternalEncoder;
    InternalCodec.prototype.decoder = InternalDecoder;
    var StringDecoder = require("string_decoder").StringDecoder;
    if (!StringDecoder.prototype.end)
      StringDecoder.prototype.end = function() {
      };
    function InternalDecoder(options, codec) {
      this.decoder = new StringDecoder(codec.enc);
    }
    InternalDecoder.prototype.write = function(buf) {
      if (!Buffer2.isBuffer(buf)) {
        buf = Buffer2.from(buf);
      }
      return this.decoder.write(buf);
    };
    InternalDecoder.prototype.end = function() {
      return this.decoder.end();
    };
    function InternalEncoder(options, codec) {
      this.enc = codec.enc;
    }
    InternalEncoder.prototype.write = function(str) {
      return Buffer2.from(str, this.enc);
    };
    InternalEncoder.prototype.end = function() {
    };
    function InternalEncoderBase64(options, codec) {
      this.prevStr = "";
    }
    InternalEncoderBase64.prototype.write = function(str) {
      str = this.prevStr + str;
      var completeQuads = str.length - str.length % 4;
      this.prevStr = str.slice(completeQuads);
      str = str.slice(0, completeQuads);
      return Buffer2.from(str, "base64");
    };
    InternalEncoderBase64.prototype.end = function() {
      return Buffer2.from(this.prevStr, "base64");
    };
    function InternalEncoderCesu8(options, codec) {
    }
    InternalEncoderCesu8.prototype.write = function(str) {
      var buf = Buffer2.alloc(str.length * 3), bufIdx = 0;
      for (var i = 0; i < str.length; i++) {
        var charCode = str.charCodeAt(i);
        if (charCode < 128)
          buf[bufIdx++] = charCode;
        else if (charCode < 2048) {
          buf[bufIdx++] = 192 + (charCode >>> 6);
          buf[bufIdx++] = 128 + (charCode & 63);
        } else {
          buf[bufIdx++] = 224 + (charCode >>> 12);
          buf[bufIdx++] = 128 + (charCode >>> 6 & 63);
          buf[bufIdx++] = 128 + (charCode & 63);
        }
      }
      return buf.slice(0, bufIdx);
    };
    InternalEncoderCesu8.prototype.end = function() {
    };
    function InternalDecoderCesu8(options, codec) {
      this.acc = 0;
      this.contBytes = 0;
      this.accBytes = 0;
      this.defaultCharUnicode = codec.defaultCharUnicode;
    }
    InternalDecoderCesu8.prototype.write = function(buf) {
      var acc = this.acc, contBytes = this.contBytes, accBytes = this.accBytes, res = "";
      for (var i = 0; i < buf.length; i++) {
        var curByte = buf[i];
        if ((curByte & 192) !== 128) {
          if (contBytes > 0) {
            res += this.defaultCharUnicode;
            contBytes = 0;
          }
          if (curByte < 128) {
            res += String.fromCharCode(curByte);
          } else if (curByte < 224) {
            acc = curByte & 31;
            contBytes = 1;
            accBytes = 1;
          } else if (curByte < 240) {
            acc = curByte & 15;
            contBytes = 2;
            accBytes = 1;
          } else {
            res += this.defaultCharUnicode;
          }
        } else {
          if (contBytes > 0) {
            acc = acc << 6 | curByte & 63;
            contBytes--;
            accBytes++;
            if (contBytes === 0) {
              if (accBytes === 2 && acc < 128 && acc > 0)
                res += this.defaultCharUnicode;
              else if (accBytes === 3 && acc < 2048)
                res += this.defaultCharUnicode;
              else
                res += String.fromCharCode(acc);
            }
          } else {
            res += this.defaultCharUnicode;
          }
        }
      }
      this.acc = acc;
      this.contBytes = contBytes;
      this.accBytes = accBytes;
      return res;
    };
    InternalDecoderCesu8.prototype.end = function() {
      var res = 0;
      if (this.contBytes > 0)
        res += this.defaultCharUnicode;
      return res;
    };
  }
});

// ../../../node_modules/encoding/node_modules/iconv-lite/encodings/utf32.js
var require_utf32 = __commonJS({
  "../../../node_modules/encoding/node_modules/iconv-lite/encodings/utf32.js"(exports) {
    "use strict";
    var Buffer2 = require_safer().Buffer;
    exports._utf32 = Utf32Codec;
    function Utf32Codec(codecOptions, iconv) {
      this.iconv = iconv;
      this.bomAware = true;
      this.isLE = codecOptions.isLE;
    }
    exports.utf32le = { type: "_utf32", isLE: true };
    exports.utf32be = { type: "_utf32", isLE: false };
    exports.ucs4le = "utf32le";
    exports.ucs4be = "utf32be";
    Utf32Codec.prototype.encoder = Utf32Encoder;
    Utf32Codec.prototype.decoder = Utf32Decoder;
    function Utf32Encoder(options, codec) {
      this.isLE = codec.isLE;
      this.highSurrogate = 0;
    }
    Utf32Encoder.prototype.write = function(str) {
      var src = Buffer2.from(str, "ucs2");
      var dst = Buffer2.alloc(src.length * 2);
      var write32 = this.isLE ? dst.writeUInt32LE : dst.writeUInt32BE;
      var offset = 0;
      for (var i = 0; i < src.length; i += 2) {
        var code = src.readUInt16LE(i);
        var isHighSurrogate = 55296 <= code && code < 56320;
        var isLowSurrogate = 56320 <= code && code < 57344;
        if (this.highSurrogate) {
          if (isHighSurrogate || !isLowSurrogate) {
            write32.call(dst, this.highSurrogate, offset);
            offset += 4;
          } else {
            var codepoint = (this.highSurrogate - 55296 << 10 | code - 56320) + 65536;
            write32.call(dst, codepoint, offset);
            offset += 4;
            this.highSurrogate = 0;
            continue;
          }
        }
        if (isHighSurrogate)
          this.highSurrogate = code;
        else {
          write32.call(dst, code, offset);
          offset += 4;
          this.highSurrogate = 0;
        }
      }
      if (offset < dst.length)
        dst = dst.slice(0, offset);
      return dst;
    };
    Utf32Encoder.prototype.end = function() {
      if (!this.highSurrogate)
        return;
      var buf = Buffer2.alloc(4);
      if (this.isLE)
        buf.writeUInt32LE(this.highSurrogate, 0);
      else
        buf.writeUInt32BE(this.highSurrogate, 0);
      this.highSurrogate = 0;
      return buf;
    };
    function Utf32Decoder(options, codec) {
      this.isLE = codec.isLE;
      this.badChar = codec.iconv.defaultCharUnicode.charCodeAt(0);
      this.overflow = [];
    }
    Utf32Decoder.prototype.write = function(src) {
      if (src.length === 0)
        return "";
      var i = 0;
      var codepoint = 0;
      var dst = Buffer2.alloc(src.length + 4);
      var offset = 0;
      var isLE = this.isLE;
      var overflow = this.overflow;
      var badChar = this.badChar;
      if (overflow.length > 0) {
        for (; i < src.length && overflow.length < 4; i++)
          overflow.push(src[i]);
        if (overflow.length === 4) {
          if (isLE) {
            codepoint = overflow[i] | overflow[i + 1] << 8 | overflow[i + 2] << 16 | overflow[i + 3] << 24;
          } else {
            codepoint = overflow[i + 3] | overflow[i + 2] << 8 | overflow[i + 1] << 16 | overflow[i] << 24;
          }
          overflow.length = 0;
          offset = _writeCodepoint(dst, offset, codepoint, badChar);
        }
      }
      for (; i < src.length - 3; i += 4) {
        if (isLE) {
          codepoint = src[i] | src[i + 1] << 8 | src[i + 2] << 16 | src[i + 3] << 24;
        } else {
          codepoint = src[i + 3] | src[i + 2] << 8 | src[i + 1] << 16 | src[i] << 24;
        }
        offset = _writeCodepoint(dst, offset, codepoint, badChar);
      }
      for (; i < src.length; i++) {
        overflow.push(src[i]);
      }
      return dst.slice(0, offset).toString("ucs2");
    };
    function _writeCodepoint(dst, offset, codepoint, badChar) {
      if (codepoint < 0 || codepoint > 1114111) {
        codepoint = badChar;
      }
      if (codepoint >= 65536) {
        codepoint -= 65536;
        var high = 55296 | codepoint >> 10;
        dst[offset++] = high & 255;
        dst[offset++] = high >> 8;
        var codepoint = 56320 | codepoint & 1023;
      }
      dst[offset++] = codepoint & 255;
      dst[offset++] = codepoint >> 8;
      return offset;
    }
    Utf32Decoder.prototype.end = function() {
      this.overflow.length = 0;
    };
    exports.utf32 = Utf32AutoCodec;
    exports.ucs4 = "utf32";
    function Utf32AutoCodec(options, iconv) {
      this.iconv = iconv;
    }
    Utf32AutoCodec.prototype.encoder = Utf32AutoEncoder;
    Utf32AutoCodec.prototype.decoder = Utf32AutoDecoder;
    function Utf32AutoEncoder(options, codec) {
      options = options || {};
      if (options.addBOM === void 0)
        options.addBOM = true;
      this.encoder = codec.iconv.getEncoder(options.defaultEncoding || "utf-32le", options);
    }
    Utf32AutoEncoder.prototype.write = function(str) {
      return this.encoder.write(str);
    };
    Utf32AutoEncoder.prototype.end = function() {
      return this.encoder.end();
    };
    function Utf32AutoDecoder(options, codec) {
      this.decoder = null;
      this.initialBufs = [];
      this.initialBufsLen = 0;
      this.options = options || {};
      this.iconv = codec.iconv;
    }
    Utf32AutoDecoder.prototype.write = function(buf) {
      if (!this.decoder) {
        this.initialBufs.push(buf);
        this.initialBufsLen += buf.length;
        if (this.initialBufsLen < 32)
          return "";
        var encoding = detectEncoding(this.initialBufs, this.options.defaultEncoding);
        this.decoder = this.iconv.getDecoder(encoding, this.options);
        var resStr = "";
        for (var i = 0; i < this.initialBufs.length; i++)
          resStr += this.decoder.write(this.initialBufs[i]);
        this.initialBufs.length = this.initialBufsLen = 0;
        return resStr;
      }
      return this.decoder.write(buf);
    };
    Utf32AutoDecoder.prototype.end = function() {
      if (!this.decoder) {
        var encoding = detectEncoding(this.initialBufs, this.options.defaultEncoding);
        this.decoder = this.iconv.getDecoder(encoding, this.options);
        var resStr = "";
        for (var i = 0; i < this.initialBufs.length; i++)
          resStr += this.decoder.write(this.initialBufs[i]);
        var trail = this.decoder.end();
        if (trail)
          resStr += trail;
        this.initialBufs.length = this.initialBufsLen = 0;
        return resStr;
      }
      return this.decoder.end();
    };
    function detectEncoding(bufs, defaultEncoding) {
      var b = [];
      var charsProcessed = 0;
      var invalidLE = 0, invalidBE = 0;
      var bmpCharsLE = 0, bmpCharsBE = 0;
      outer_loop:
        for (var i = 0; i < bufs.length; i++) {
          var buf = bufs[i];
          for (var j = 0; j < buf.length; j++) {
            b.push(buf[j]);
            if (b.length === 4) {
              if (charsProcessed === 0) {
                if (b[0] === 255 && b[1] === 254 && b[2] === 0 && b[3] === 0) {
                  return "utf-32le";
                }
                if (b[0] === 0 && b[1] === 0 && b[2] === 254 && b[3] === 255) {
                  return "utf-32be";
                }
              }
              if (b[0] !== 0 || b[1] > 16)
                invalidBE++;
              if (b[3] !== 0 || b[2] > 16)
                invalidLE++;
              if (b[0] === 0 && b[1] === 0 && (b[2] !== 0 || b[3] !== 0))
                bmpCharsBE++;
              if ((b[0] !== 0 || b[1] !== 0) && b[2] === 0 && b[3] === 0)
                bmpCharsLE++;
              b.length = 0;
              charsProcessed++;
              if (charsProcessed >= 100) {
                break outer_loop;
              }
            }
          }
        }
      if (bmpCharsBE - invalidBE > bmpCharsLE - invalidLE)
        return "utf-32be";
      if (bmpCharsBE - invalidBE < bmpCharsLE - invalidLE)
        return "utf-32le";
      return defaultEncoding || "utf-32le";
    }
  }
});

// ../../../node_modules/encoding/node_modules/iconv-lite/encodings/utf16.js
var require_utf16 = __commonJS({
  "../../../node_modules/encoding/node_modules/iconv-lite/encodings/utf16.js"(exports) {
    "use strict";
    var Buffer2 = require_safer().Buffer;
    exports.utf16be = Utf16BECodec;
    function Utf16BECodec() {
    }
    Utf16BECodec.prototype.encoder = Utf16BEEncoder;
    Utf16BECodec.prototype.decoder = Utf16BEDecoder;
    Utf16BECodec.prototype.bomAware = true;
    function Utf16BEEncoder() {
    }
    Utf16BEEncoder.prototype.write = function(str) {
      var buf = Buffer2.from(str, "ucs2");
      for (var i = 0; i < buf.length; i += 2) {
        var tmp = buf[i];
        buf[i] = buf[i + 1];
        buf[i + 1] = tmp;
      }
      return buf;
    };
    Utf16BEEncoder.prototype.end = function() {
    };
    function Utf16BEDecoder() {
      this.overflowByte = -1;
    }
    Utf16BEDecoder.prototype.write = function(buf) {
      if (buf.length == 0)
        return "";
      var buf2 = Buffer2.alloc(buf.length + 1), i = 0, j = 0;
      if (this.overflowByte !== -1) {
        buf2[0] = buf[0];
        buf2[1] = this.overflowByte;
        i = 1;
        j = 2;
      }
      for (; i < buf.length - 1; i += 2, j += 2) {
        buf2[j] = buf[i + 1];
        buf2[j + 1] = buf[i];
      }
      this.overflowByte = i == buf.length - 1 ? buf[buf.length - 1] : -1;
      return buf2.slice(0, j).toString("ucs2");
    };
    Utf16BEDecoder.prototype.end = function() {
      this.overflowByte = -1;
    };
    exports.utf16 = Utf16Codec;
    function Utf16Codec(codecOptions, iconv) {
      this.iconv = iconv;
    }
    Utf16Codec.prototype.encoder = Utf16Encoder;
    Utf16Codec.prototype.decoder = Utf16Decoder;
    function Utf16Encoder(options, codec) {
      options = options || {};
      if (options.addBOM === void 0)
        options.addBOM = true;
      this.encoder = codec.iconv.getEncoder("utf-16le", options);
    }
    Utf16Encoder.prototype.write = function(str) {
      return this.encoder.write(str);
    };
    Utf16Encoder.prototype.end = function() {
      return this.encoder.end();
    };
    function Utf16Decoder(options, codec) {
      this.decoder = null;
      this.initialBufs = [];
      this.initialBufsLen = 0;
      this.options = options || {};
      this.iconv = codec.iconv;
    }
    Utf16Decoder.prototype.write = function(buf) {
      if (!this.decoder) {
        this.initialBufs.push(buf);
        this.initialBufsLen += buf.length;
        if (this.initialBufsLen < 16)
          return "";
        var encoding = detectEncoding(this.initialBufs, this.options.defaultEncoding);
        this.decoder = this.iconv.getDecoder(encoding, this.options);
        var resStr = "";
        for (var i = 0; i < this.initialBufs.length; i++)
          resStr += this.decoder.write(this.initialBufs[i]);
        this.initialBufs.length = this.initialBufsLen = 0;
        return resStr;
      }
      return this.decoder.write(buf);
    };
    Utf16Decoder.prototype.end = function() {
      if (!this.decoder) {
        var encoding = detectEncoding(this.initialBufs, this.options.defaultEncoding);
        this.decoder = this.iconv.getDecoder(encoding, this.options);
        var resStr = "";
        for (var i = 0; i < this.initialBufs.length; i++)
          resStr += this.decoder.write(this.initialBufs[i]);
        var trail = this.decoder.end();
        if (trail)
          resStr += trail;
        this.initialBufs.length = this.initialBufsLen = 0;
        return resStr;
      }
      return this.decoder.end();
    };
    function detectEncoding(bufs, defaultEncoding) {
      var b = [];
      var charsProcessed = 0;
      var asciiCharsLE = 0, asciiCharsBE = 0;
      outer_loop:
        for (var i = 0; i < bufs.length; i++) {
          var buf = bufs[i];
          for (var j = 0; j < buf.length; j++) {
            b.push(buf[j]);
            if (b.length === 2) {
              if (charsProcessed === 0) {
                if (b[0] === 255 && b[1] === 254)
                  return "utf-16le";
                if (b[0] === 254 && b[1] === 255)
                  return "utf-16be";
              }
              if (b[0] === 0 && b[1] !== 0)
                asciiCharsBE++;
              if (b[0] !== 0 && b[1] === 0)
                asciiCharsLE++;
              b.length = 0;
              charsProcessed++;
              if (charsProcessed >= 100) {
                break outer_loop;
              }
            }
          }
        }
      if (asciiCharsBE > asciiCharsLE)
        return "utf-16be";
      if (asciiCharsBE < asciiCharsLE)
        return "utf-16le";
      return defaultEncoding || "utf-16le";
    }
  }
});

// ../../../node_modules/encoding/node_modules/iconv-lite/encodings/utf7.js
var require_utf7 = __commonJS({
  "../../../node_modules/encoding/node_modules/iconv-lite/encodings/utf7.js"(exports) {
    "use strict";
    var Buffer2 = require_safer().Buffer;
    exports.utf7 = Utf7Codec;
    exports.unicode11utf7 = "utf7";
    function Utf7Codec(codecOptions, iconv) {
      this.iconv = iconv;
    }
    Utf7Codec.prototype.encoder = Utf7Encoder;
    Utf7Codec.prototype.decoder = Utf7Decoder;
    Utf7Codec.prototype.bomAware = true;
    var nonDirectChars = /[^A-Za-z0-9'\(\),-\.\/:\? \n\r\t]+/g;
    function Utf7Encoder(options, codec) {
      this.iconv = codec.iconv;
    }
    Utf7Encoder.prototype.write = function(str) {
      return Buffer2.from(str.replace(nonDirectChars, function(chunk) {
        return "+" + (chunk === "+" ? "" : this.iconv.encode(chunk, "utf16-be").toString("base64").replace(/=+$/, "")) + "-";
      }.bind(this)));
    };
    Utf7Encoder.prototype.end = function() {
    };
    function Utf7Decoder(options, codec) {
      this.iconv = codec.iconv;
      this.inBase64 = false;
      this.base64Accum = "";
    }
    var base64Regex = /[A-Za-z0-9\/+]/;
    var base64Chars = [];
    for (i = 0; i < 256; i++)
      base64Chars[i] = base64Regex.test(String.fromCharCode(i));
    var i;
    var plusChar = "+".charCodeAt(0);
    var minusChar = "-".charCodeAt(0);
    var andChar = "&".charCodeAt(0);
    Utf7Decoder.prototype.write = function(buf) {
      var res = "", lastI = 0, inBase64 = this.inBase64, base64Accum = this.base64Accum;
      for (var i2 = 0; i2 < buf.length; i2++) {
        if (!inBase64) {
          if (buf[i2] == plusChar) {
            res += this.iconv.decode(buf.slice(lastI, i2), "ascii");
            lastI = i2 + 1;
            inBase64 = true;
          }
        } else {
          if (!base64Chars[buf[i2]]) {
            if (i2 == lastI && buf[i2] == minusChar) {
              res += "+";
            } else {
              var b64str = base64Accum + this.iconv.decode(buf.slice(lastI, i2), "ascii");
              res += this.iconv.decode(Buffer2.from(b64str, "base64"), "utf16-be");
            }
            if (buf[i2] != minusChar)
              i2--;
            lastI = i2 + 1;
            inBase64 = false;
            base64Accum = "";
          }
        }
      }
      if (!inBase64) {
        res += this.iconv.decode(buf.slice(lastI), "ascii");
      } else {
        var b64str = base64Accum + this.iconv.decode(buf.slice(lastI), "ascii");
        var canBeDecoded = b64str.length - b64str.length % 8;
        base64Accum = b64str.slice(canBeDecoded);
        b64str = b64str.slice(0, canBeDecoded);
        res += this.iconv.decode(Buffer2.from(b64str, "base64"), "utf16-be");
      }
      this.inBase64 = inBase64;
      this.base64Accum = base64Accum;
      return res;
    };
    Utf7Decoder.prototype.end = function() {
      var res = "";
      if (this.inBase64 && this.base64Accum.length > 0)
        res = this.iconv.decode(Buffer2.from(this.base64Accum, "base64"), "utf16-be");
      this.inBase64 = false;
      this.base64Accum = "";
      return res;
    };
    exports.utf7imap = Utf7IMAPCodec;
    function Utf7IMAPCodec(codecOptions, iconv) {
      this.iconv = iconv;
    }
    Utf7IMAPCodec.prototype.encoder = Utf7IMAPEncoder;
    Utf7IMAPCodec.prototype.decoder = Utf7IMAPDecoder;
    Utf7IMAPCodec.prototype.bomAware = true;
    function Utf7IMAPEncoder(options, codec) {
      this.iconv = codec.iconv;
      this.inBase64 = false;
      this.base64Accum = Buffer2.alloc(6);
      this.base64AccumIdx = 0;
    }
    Utf7IMAPEncoder.prototype.write = function(str) {
      var inBase64 = this.inBase64, base64Accum = this.base64Accum, base64AccumIdx = this.base64AccumIdx, buf = Buffer2.alloc(str.length * 5 + 10), bufIdx = 0;
      for (var i2 = 0; i2 < str.length; i2++) {
        var uChar = str.charCodeAt(i2);
        if (32 <= uChar && uChar <= 126) {
          if (inBase64) {
            if (base64AccumIdx > 0) {
              bufIdx += buf.write(base64Accum.slice(0, base64AccumIdx).toString("base64").replace(/\//g, ",").replace(/=+$/, ""), bufIdx);
              base64AccumIdx = 0;
            }
            buf[bufIdx++] = minusChar;
            inBase64 = false;
          }
          if (!inBase64) {
            buf[bufIdx++] = uChar;
            if (uChar === andChar)
              buf[bufIdx++] = minusChar;
          }
        } else {
          if (!inBase64) {
            buf[bufIdx++] = andChar;
            inBase64 = true;
          }
          if (inBase64) {
            base64Accum[base64AccumIdx++] = uChar >> 8;
            base64Accum[base64AccumIdx++] = uChar & 255;
            if (base64AccumIdx == base64Accum.length) {
              bufIdx += buf.write(base64Accum.toString("base64").replace(/\//g, ","), bufIdx);
              base64AccumIdx = 0;
            }
          }
        }
      }
      this.inBase64 = inBase64;
      this.base64AccumIdx = base64AccumIdx;
      return buf.slice(0, bufIdx);
    };
    Utf7IMAPEncoder.prototype.end = function() {
      var buf = Buffer2.alloc(10), bufIdx = 0;
      if (this.inBase64) {
        if (this.base64AccumIdx > 0) {
          bufIdx += buf.write(this.base64Accum.slice(0, this.base64AccumIdx).toString("base64").replace(/\//g, ",").replace(/=+$/, ""), bufIdx);
          this.base64AccumIdx = 0;
        }
        buf[bufIdx++] = minusChar;
        this.inBase64 = false;
      }
      return buf.slice(0, bufIdx);
    };
    function Utf7IMAPDecoder(options, codec) {
      this.iconv = codec.iconv;
      this.inBase64 = false;
      this.base64Accum = "";
    }
    var base64IMAPChars = base64Chars.slice();
    base64IMAPChars[",".charCodeAt(0)] = true;
    Utf7IMAPDecoder.prototype.write = function(buf) {
      var res = "", lastI = 0, inBase64 = this.inBase64, base64Accum = this.base64Accum;
      for (var i2 = 0; i2 < buf.length; i2++) {
        if (!inBase64) {
          if (buf[i2] == andChar) {
            res += this.iconv.decode(buf.slice(lastI, i2), "ascii");
            lastI = i2 + 1;
            inBase64 = true;
          }
        } else {
          if (!base64IMAPChars[buf[i2]]) {
            if (i2 == lastI && buf[i2] == minusChar) {
              res += "&";
            } else {
              var b64str = base64Accum + this.iconv.decode(buf.slice(lastI, i2), "ascii").replace(/,/g, "/");
              res += this.iconv.decode(Buffer2.from(b64str, "base64"), "utf16-be");
            }
            if (buf[i2] != minusChar)
              i2--;
            lastI = i2 + 1;
            inBase64 = false;
            base64Accum = "";
          }
        }
      }
      if (!inBase64) {
        res += this.iconv.decode(buf.slice(lastI), "ascii");
      } else {
        var b64str = base64Accum + this.iconv.decode(buf.slice(lastI), "ascii").replace(/,/g, "/");
        var canBeDecoded = b64str.length - b64str.length % 8;
        base64Accum = b64str.slice(canBeDecoded);
        b64str = b64str.slice(0, canBeDecoded);
        res += this.iconv.decode(Buffer2.from(b64str, "base64"), "utf16-be");
      }
      this.inBase64 = inBase64;
      this.base64Accum = base64Accum;
      return res;
    };
    Utf7IMAPDecoder.prototype.end = function() {
      var res = "";
      if (this.inBase64 && this.base64Accum.length > 0)
        res = this.iconv.decode(Buffer2.from(this.base64Accum, "base64"), "utf16-be");
      this.inBase64 = false;
      this.base64Accum = "";
      return res;
    };
  }
});

// ../../../node_modules/encoding/node_modules/iconv-lite/encodings/sbcs-codec.js
var require_sbcs_codec = __commonJS({
  "../../../node_modules/encoding/node_modules/iconv-lite/encodings/sbcs-codec.js"(exports) {
    "use strict";
    var Buffer2 = require_safer().Buffer;
    exports._sbcs = SBCSCodec;
    function SBCSCodec(codecOptions, iconv) {
      if (!codecOptions)
        throw new Error("SBCS codec is called without the data.");
      if (!codecOptions.chars || codecOptions.chars.length !== 128 && codecOptions.chars.length !== 256)
        throw new Error("Encoding '" + codecOptions.type + "' has incorrect 'chars' (must be of len 128 or 256)");
      if (codecOptions.chars.length === 128) {
        var asciiString = "";
        for (var i = 0; i < 128; i++)
          asciiString += String.fromCharCode(i);
        codecOptions.chars = asciiString + codecOptions.chars;
      }
      this.decodeBuf = Buffer2.from(codecOptions.chars, "ucs2");
      var encodeBuf = Buffer2.alloc(65536, iconv.defaultCharSingleByte.charCodeAt(0));
      for (var i = 0; i < codecOptions.chars.length; i++)
        encodeBuf[codecOptions.chars.charCodeAt(i)] = i;
      this.encodeBuf = encodeBuf;
    }
    SBCSCodec.prototype.encoder = SBCSEncoder;
    SBCSCodec.prototype.decoder = SBCSDecoder;
    function SBCSEncoder(options, codec) {
      this.encodeBuf = codec.encodeBuf;
    }
    SBCSEncoder.prototype.write = function(str) {
      var buf = Buffer2.alloc(str.length);
      for (var i = 0; i < str.length; i++)
        buf[i] = this.encodeBuf[str.charCodeAt(i)];
      return buf;
    };
    SBCSEncoder.prototype.end = function() {
    };
    function SBCSDecoder(options, codec) {
      this.decodeBuf = codec.decodeBuf;
    }
    SBCSDecoder.prototype.write = function(buf) {
      var decodeBuf = this.decodeBuf;
      var newBuf = Buffer2.alloc(buf.length * 2);
      var idx1 = 0, idx2 = 0;
      for (var i = 0; i < buf.length; i++) {
        idx1 = buf[i] * 2;
        idx2 = i * 2;
        newBuf[idx2] = decodeBuf[idx1];
        newBuf[idx2 + 1] = decodeBuf[idx1 + 1];
      }
      return newBuf.toString("ucs2");
    };
    SBCSDecoder.prototype.end = function() {
    };
  }
});

// ../../../node_modules/encoding/node_modules/iconv-lite/encodings/sbcs-data.js
var require_sbcs_data = __commonJS({
  "../../../node_modules/encoding/node_modules/iconv-lite/encodings/sbcs-data.js"(exports, module2) {
    "use strict";
    module2.exports = {
      // Not supported by iconv, not sure why.
      "10029": "maccenteuro",
      "maccenteuro": {
        "type": "_sbcs",
        "chars": "\xC4\u0100\u0101\xC9\u0104\xD6\xDC\xE1\u0105\u010C\xE4\u010D\u0106\u0107\xE9\u0179\u017A\u010E\xED\u010F\u0112\u0113\u0116\xF3\u0117\xF4\xF6\xF5\xFA\u011A\u011B\xFC\u2020\xB0\u0118\xA3\xA7\u2022\xB6\xDF\xAE\xA9\u2122\u0119\xA8\u2260\u0123\u012E\u012F\u012A\u2264\u2265\u012B\u0136\u2202\u2211\u0142\u013B\u013C\u013D\u013E\u0139\u013A\u0145\u0146\u0143\xAC\u221A\u0144\u0147\u2206\xAB\xBB\u2026\xA0\u0148\u0150\xD5\u0151\u014C\u2013\u2014\u201C\u201D\u2018\u2019\xF7\u25CA\u014D\u0154\u0155\u0158\u2039\u203A\u0159\u0156\u0157\u0160\u201A\u201E\u0161\u015A\u015B\xC1\u0164\u0165\xCD\u017D\u017E\u016A\xD3\xD4\u016B\u016E\xDA\u016F\u0170\u0171\u0172\u0173\xDD\xFD\u0137\u017B\u0141\u017C\u0122\u02C7"
      },
      "808": "cp808",
      "ibm808": "cp808",
      "cp808": {
        "type": "_sbcs",
        "chars": "\u0410\u0411\u0412\u0413\u0414\u0415\u0416\u0417\u0418\u0419\u041A\u041B\u041C\u041D\u041E\u041F\u0420\u0421\u0422\u0423\u0424\u0425\u0426\u0427\u0428\u0429\u042A\u042B\u042C\u042D\u042E\u042F\u0430\u0431\u0432\u0433\u0434\u0435\u0436\u0437\u0438\u0439\u043A\u043B\u043C\u043D\u043E\u043F\u2591\u2592\u2593\u2502\u2524\u2561\u2562\u2556\u2555\u2563\u2551\u2557\u255D\u255C\u255B\u2510\u2514\u2534\u252C\u251C\u2500\u253C\u255E\u255F\u255A\u2554\u2569\u2566\u2560\u2550\u256C\u2567\u2568\u2564\u2565\u2559\u2558\u2552\u2553\u256B\u256A\u2518\u250C\u2588\u2584\u258C\u2590\u2580\u0440\u0441\u0442\u0443\u0444\u0445\u0446\u0447\u0448\u0449\u044A\u044B\u044C\u044D\u044E\u044F\u0401\u0451\u0404\u0454\u0407\u0457\u040E\u045E\xB0\u2219\xB7\u221A\u2116\u20AC\u25A0\xA0"
      },
      "mik": {
        "type": "_sbcs",
        "chars": "\u0410\u0411\u0412\u0413\u0414\u0415\u0416\u0417\u0418\u0419\u041A\u041B\u041C\u041D\u041E\u041F\u0420\u0421\u0422\u0423\u0424\u0425\u0426\u0427\u0428\u0429\u042A\u042B\u042C\u042D\u042E\u042F\u0430\u0431\u0432\u0433\u0434\u0435\u0436\u0437\u0438\u0439\u043A\u043B\u043C\u043D\u043E\u043F\u0440\u0441\u0442\u0443\u0444\u0445\u0446\u0447\u0448\u0449\u044A\u044B\u044C\u044D\u044E\u044F\u2514\u2534\u252C\u251C\u2500\u253C\u2563\u2551\u255A\u2554\u2569\u2566\u2560\u2550\u256C\u2510\u2591\u2592\u2593\u2502\u2524\u2116\xA7\u2557\u255D\u2518\u250C\u2588\u2584\u258C\u2590\u2580\u03B1\xDF\u0393\u03C0\u03A3\u03C3\xB5\u03C4\u03A6\u0398\u03A9\u03B4\u221E\u03C6\u03B5\u2229\u2261\xB1\u2265\u2264\u2320\u2321\xF7\u2248\xB0\u2219\xB7\u221A\u207F\xB2\u25A0\xA0"
      },
      "cp720": {
        "type": "_sbcs",
        "chars": "\x80\x81\xE9\xE2\x84\xE0\x86\xE7\xEA\xEB\xE8\xEF\xEE\x8D\x8E\x8F\x90\u0651\u0652\xF4\xA4\u0640\xFB\xF9\u0621\u0622\u0623\u0624\xA3\u0625\u0626\u0627\u0628\u0629\u062A\u062B\u062C\u062D\u062E\u062F\u0630\u0631\u0632\u0633\u0634\u0635\xAB\xBB\u2591\u2592\u2593\u2502\u2524\u2561\u2562\u2556\u2555\u2563\u2551\u2557\u255D\u255C\u255B\u2510\u2514\u2534\u252C\u251C\u2500\u253C\u255E\u255F\u255A\u2554\u2569\u2566\u2560\u2550\u256C\u2567\u2568\u2564\u2565\u2559\u2558\u2552\u2553\u256B\u256A\u2518\u250C\u2588\u2584\u258C\u2590\u2580\u0636\u0637\u0638\u0639\u063A\u0641\xB5\u0642\u0643\u0644\u0645\u0646\u0647\u0648\u0649\u064A\u2261\u064B\u064C\u064D\u064E\u064F\u0650\u2248\xB0\u2219\xB7\u221A\u207F\xB2\u25A0\xA0"
      },
      // Aliases of generated encodings.
      "ascii8bit": "ascii",
      "usascii": "ascii",
      "ansix34": "ascii",
      "ansix341968": "ascii",
      "ansix341986": "ascii",
      "csascii": "ascii",
      "cp367": "ascii",
      "ibm367": "ascii",
      "isoir6": "ascii",
      "iso646us": "ascii",
      "iso646irv": "ascii",
      "us": "ascii",
      "latin1": "iso88591",
      "latin2": "iso88592",
      "latin3": "iso88593",
      "latin4": "iso88594",
      "latin5": "iso88599",
      "latin6": "iso885910",
      "latin7": "iso885913",
      "latin8": "iso885914",
      "latin9": "iso885915",
      "latin10": "iso885916",
      "csisolatin1": "iso88591",
      "csisolatin2": "iso88592",
      "csisolatin3": "iso88593",
      "csisolatin4": "iso88594",
      "csisolatincyrillic": "iso88595",
      "csisolatinarabic": "iso88596",
      "csisolatingreek": "iso88597",
      "csisolatinhebrew": "iso88598",
      "csisolatin5": "iso88599",
      "csisolatin6": "iso885910",
      "l1": "iso88591",
      "l2": "iso88592",
      "l3": "iso88593",
      "l4": "iso88594",
      "l5": "iso88599",
      "l6": "iso885910",
      "l7": "iso885913",
      "l8": "iso885914",
      "l9": "iso885915",
      "l10": "iso885916",
      "isoir14": "iso646jp",
      "isoir57": "iso646cn",
      "isoir100": "iso88591",
      "isoir101": "iso88592",
      "isoir109": "iso88593",
      "isoir110": "iso88594",
      "isoir144": "iso88595",
      "isoir127": "iso88596",
      "isoir126": "iso88597",
      "isoir138": "iso88598",
      "isoir148": "iso88599",
      "isoir157": "iso885910",
      "isoir166": "tis620",
      "isoir179": "iso885913",
      "isoir199": "iso885914",
      "isoir203": "iso885915",
      "isoir226": "iso885916",
      "cp819": "iso88591",
      "ibm819": "iso88591",
      "cyrillic": "iso88595",
      "arabic": "iso88596",
      "arabic8": "iso88596",
      "ecma114": "iso88596",
      "asmo708": "iso88596",
      "greek": "iso88597",
      "greek8": "iso88597",
      "ecma118": "iso88597",
      "elot928": "iso88597",
      "hebrew": "iso88598",
      "hebrew8": "iso88598",
      "turkish": "iso88599",
      "turkish8": "iso88599",
      "thai": "iso885911",
      "thai8": "iso885911",
      "celtic": "iso885914",
      "celtic8": "iso885914",
      "isoceltic": "iso885914",
      "tis6200": "tis620",
      "tis62025291": "tis620",
      "tis62025330": "tis620",
      "10000": "macroman",
      "10006": "macgreek",
      "10007": "maccyrillic",
      "10079": "maciceland",
      "10081": "macturkish",
      "cspc8codepage437": "cp437",
      "cspc775baltic": "cp775",
      "cspc850multilingual": "cp850",
      "cspcp852": "cp852",
      "cspc862latinhebrew": "cp862",
      "cpgr": "cp869",
      "msee": "cp1250",
      "mscyrl": "cp1251",
      "msansi": "cp1252",
      "msgreek": "cp1253",
      "msturk": "cp1254",
      "mshebr": "cp1255",
      "msarab": "cp1256",
      "winbaltrim": "cp1257",
      "cp20866": "koi8r",
      "20866": "koi8r",
      "ibm878": "koi8r",
      "cskoi8r": "koi8r",
      "cp21866": "koi8u",
      "21866": "koi8u",
      "ibm1168": "koi8u",
      "strk10482002": "rk1048",
      "tcvn5712": "tcvn",
      "tcvn57121": "tcvn",
      "gb198880": "iso646cn",
      "cn": "iso646cn",
      "csiso14jisc6220ro": "iso646jp",
      "jisc62201969ro": "iso646jp",
      "jp": "iso646jp",
      "cshproman8": "hproman8",
      "r8": "hproman8",
      "roman8": "hproman8",
      "xroman8": "hproman8",
      "ibm1051": "hproman8",
      "mac": "macintosh",
      "csmacintosh": "macintosh"
    };
  }
});

// ../../../node_modules/encoding/node_modules/iconv-lite/encodings/sbcs-data-generated.js
var require_sbcs_data_generated = __commonJS({
  "../../../node_modules/encoding/node_modules/iconv-lite/encodings/sbcs-data-generated.js"(exports, module2) {
    "use strict";
    module2.exports = {
      "437": "cp437",
      "737": "cp737",
      "775": "cp775",
      "850": "cp850",
      "852": "cp852",
      "855": "cp855",
      "856": "cp856",
      "857": "cp857",
      "858": "cp858",
      "860": "cp860",
      "861": "cp861",
      "862": "cp862",
      "863": "cp863",
      "864": "cp864",
      "865": "cp865",
      "866": "cp866",
      "869": "cp869",
      "874": "windows874",
      "922": "cp922",
      "1046": "cp1046",
      "1124": "cp1124",
      "1125": "cp1125",
      "1129": "cp1129",
      "1133": "cp1133",
      "1161": "cp1161",
      "1162": "cp1162",
      "1163": "cp1163",
      "1250": "windows1250",
      "1251": "windows1251",
      "1252": "windows1252",
      "1253": "windows1253",
      "1254": "windows1254",
      "1255": "windows1255",
      "1256": "windows1256",
      "1257": "windows1257",
      "1258": "windows1258",
      "28591": "iso88591",
      "28592": "iso88592",
      "28593": "iso88593",
      "28594": "iso88594",
      "28595": "iso88595",
      "28596": "iso88596",
      "28597": "iso88597",
      "28598": "iso88598",
      "28599": "iso88599",
      "28600": "iso885910",
      "28601": "iso885911",
      "28603": "iso885913",
      "28604": "iso885914",
      "28605": "iso885915",
      "28606": "iso885916",
      "windows874": {
        "type": "_sbcs",
        "chars": "\u20AC\uFFFD\uFFFD\uFFFD\uFFFD\u2026\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\u2018\u2019\u201C\u201D\u2022\u2013\u2014\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\xA0\u0E01\u0E02\u0E03\u0E04\u0E05\u0E06\u0E07\u0E08\u0E09\u0E0A\u0E0B\u0E0C\u0E0D\u0E0E\u0E0F\u0E10\u0E11\u0E12\u0E13\u0E14\u0E15\u0E16\u0E17\u0E18\u0E19\u0E1A\u0E1B\u0E1C\u0E1D\u0E1E\u0E1F\u0E20\u0E21\u0E22\u0E23\u0E24\u0E25\u0E26\u0E27\u0E28\u0E29\u0E2A\u0E2B\u0E2C\u0E2D\u0E2E\u0E2F\u0E30\u0E31\u0E32\u0E33\u0E34\u0E35\u0E36\u0E37\u0E38\u0E39\u0E3A\uFFFD\uFFFD\uFFFD\uFFFD\u0E3F\u0E40\u0E41\u0E42\u0E43\u0E44\u0E45\u0E46\u0E47\u0E48\u0E49\u0E4A\u0E4B\u0E4C\u0E4D\u0E4E\u0E4F\u0E50\u0E51\u0E52\u0E53\u0E54\u0E55\u0E56\u0E57\u0E58\u0E59\u0E5A\u0E5B\uFFFD\uFFFD\uFFFD\uFFFD"
      },
      "win874": "windows874",
      "cp874": "windows874",
      "windows1250": {
        "type": "_sbcs",
        "chars": "\u20AC\uFFFD\u201A\uFFFD\u201E\u2026\u2020\u2021\uFFFD\u2030\u0160\u2039\u015A\u0164\u017D\u0179\uFFFD\u2018\u2019\u201C\u201D\u2022\u2013\u2014\uFFFD\u2122\u0161\u203A\u015B\u0165\u017E\u017A\xA0\u02C7\u02D8\u0141\xA4\u0104\xA6\xA7\xA8\xA9\u015E\xAB\xAC\xAD\xAE\u017B\xB0\xB1\u02DB\u0142\xB4\xB5\xB6\xB7\xB8\u0105\u015F\xBB\u013D\u02DD\u013E\u017C\u0154\xC1\xC2\u0102\xC4\u0139\u0106\xC7\u010C\xC9\u0118\xCB\u011A\xCD\xCE\u010E\u0110\u0143\u0147\xD3\xD4\u0150\xD6\xD7\u0158\u016E\xDA\u0170\xDC\xDD\u0162\xDF\u0155\xE1\xE2\u0103\xE4\u013A\u0107\xE7\u010D\xE9\u0119\xEB\u011B\xED\xEE\u010F\u0111\u0144\u0148\xF3\xF4\u0151\xF6\xF7\u0159\u016F\xFA\u0171\xFC\xFD\u0163\u02D9"
      },
      "win1250": "windows1250",
      "cp1250": "windows1250",
      "windows1251": {
        "type": "_sbcs",
        "chars": "\u0402\u0403\u201A\u0453\u201E\u2026\u2020\u2021\u20AC\u2030\u0409\u2039\u040A\u040C\u040B\u040F\u0452\u2018\u2019\u201C\u201D\u2022\u2013\u2014\uFFFD\u2122\u0459\u203A\u045A\u045C\u045B\u045F\xA0\u040E\u045E\u0408\xA4\u0490\xA6\xA7\u0401\xA9\u0404\xAB\xAC\xAD\xAE\u0407\xB0\xB1\u0406\u0456\u0491\xB5\xB6\xB7\u0451\u2116\u0454\xBB\u0458\u0405\u0455\u0457\u0410\u0411\u0412\u0413\u0414\u0415\u0416\u0417\u0418\u0419\u041A\u041B\u041C\u041D\u041E\u041F\u0420\u0421\u0422\u0423\u0424\u0425\u0426\u0427\u0428\u0429\u042A\u042B\u042C\u042D\u042E\u042F\u0430\u0431\u0432\u0433\u0434\u0435\u0436\u0437\u0438\u0439\u043A\u043B\u043C\u043D\u043E\u043F\u0440\u0441\u0442\u0443\u0444\u0445\u0446\u0447\u0448\u0449\u044A\u044B\u044C\u044D\u044E\u044F"
      },
      "win1251": "windows1251",
      "cp1251": "windows1251",
      "windows1252": {
        "type": "_sbcs",
        "chars": "\u20AC\uFFFD\u201A\u0192\u201E\u2026\u2020\u2021\u02C6\u2030\u0160\u2039\u0152\uFFFD\u017D\uFFFD\uFFFD\u2018\u2019\u201C\u201D\u2022\u2013\u2014\u02DC\u2122\u0161\u203A\u0153\uFFFD\u017E\u0178\xA0\xA1\xA2\xA3\xA4\xA5\xA6\xA7\xA8\xA9\xAA\xAB\xAC\xAD\xAE\xAF\xB0\xB1\xB2\xB3\xB4\xB5\xB6\xB7\xB8\xB9\xBA\xBB\xBC\xBD\xBE\xBF\xC0\xC1\xC2\xC3\xC4\xC5\xC6\xC7\xC8\xC9\xCA\xCB\xCC\xCD\xCE\xCF\xD0\xD1\xD2\xD3\xD4\xD5\xD6\xD7\xD8\xD9\xDA\xDB\xDC\xDD\xDE\xDF\xE0\xE1\xE2\xE3\xE4\xE5\xE6\xE7\xE8\xE9\xEA\xEB\xEC\xED\xEE\xEF\xF0\xF1\xF2\xF3\xF4\xF5\xF6\xF7\xF8\xF9\xFA\xFB\xFC\xFD\xFE\xFF"
      },
      "win1252": "windows1252",
      "cp1252": "windows1252",
      "windows1253": {
        "type": "_sbcs",
        "chars": "\u20AC\uFFFD\u201A\u0192\u201E\u2026\u2020\u2021\uFFFD\u2030\uFFFD\u2039\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\u2018\u2019\u201C\u201D\u2022\u2013\u2014\uFFFD\u2122\uFFFD\u203A\uFFFD\uFFFD\uFFFD\uFFFD\xA0\u0385\u0386\xA3\xA4\xA5\xA6\xA7\xA8\xA9\uFFFD\xAB\xAC\xAD\xAE\u2015\xB0\xB1\xB2\xB3\u0384\xB5\xB6\xB7\u0388\u0389\u038A\xBB\u038C\xBD\u038E\u038F\u0390\u0391\u0392\u0393\u0394\u0395\u0396\u0397\u0398\u0399\u039A\u039B\u039C\u039D\u039E\u039F\u03A0\u03A1\uFFFD\u03A3\u03A4\u03A5\u03A6\u03A7\u03A8\u03A9\u03AA\u03AB\u03AC\u03AD\u03AE\u03AF\u03B0\u03B1\u03B2\u03B3\u03B4\u03B5\u03B6\u03B7\u03B8\u03B9\u03BA\u03BB\u03BC\u03BD\u03BE\u03BF\u03C0\u03C1\u03C2\u03C3\u03C4\u03C5\u03C6\u03C7\u03C8\u03C9\u03CA\u03CB\u03CC\u03CD\u03CE\uFFFD"
      },
      "win1253": "windows1253",
      "cp1253": "windows1253",
      "windows1254": {
        "type": "_sbcs",
        "chars": "\u20AC\uFFFD\u201A\u0192\u201E\u2026\u2020\u2021\u02C6\u2030\u0160\u2039\u0152\uFFFD\uFFFD\uFFFD\uFFFD\u2018\u2019\u201C\u201D\u2022\u2013\u2014\u02DC\u2122\u0161\u203A\u0153\uFFFD\uFFFD\u0178\xA0\xA1\xA2\xA3\xA4\xA5\xA6\xA7\xA8\xA9\xAA\xAB\xAC\xAD\xAE\xAF\xB0\xB1\xB2\xB3\xB4\xB5\xB6\xB7\xB8\xB9\xBA\xBB\xBC\xBD\xBE\xBF\xC0\xC1\xC2\xC3\xC4\xC5\xC6\xC7\xC8\xC9\xCA\xCB\xCC\xCD\xCE\xCF\u011E\xD1\xD2\xD3\xD4\xD5\xD6\xD7\xD8\xD9\xDA\xDB\xDC\u0130\u015E\xDF\xE0\xE1\xE2\xE3\xE4\xE5\xE6\xE7\xE8\xE9\xEA\xEB\xEC\xED\xEE\xEF\u011F\xF1\xF2\xF3\xF4\xF5\xF6\xF7\xF8\xF9\xFA\xFB\xFC\u0131\u015F\xFF"
      },
      "win1254": "windows1254",
      "cp1254": "windows1254",
      "windows1255": {
        "type": "_sbcs",
        "chars": "\u20AC\uFFFD\u201A\u0192\u201E\u2026\u2020\u2021\u02C6\u2030\uFFFD\u2039\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\u2018\u2019\u201C\u201D\u2022\u2013\u2014\u02DC\u2122\uFFFD\u203A\uFFFD\uFFFD\uFFFD\uFFFD\xA0\xA1\xA2\xA3\u20AA\xA5\xA6\xA7\xA8\xA9\xD7\xAB\xAC\xAD\xAE\xAF\xB0\xB1\xB2\xB3\xB4\xB5\xB6\xB7\xB8\xB9\xF7\xBB\xBC\xBD\xBE\xBF\u05B0\u05B1\u05B2\u05B3\u05B4\u05B5\u05B6\u05B7\u05B8\u05B9\u05BA\u05BB\u05BC\u05BD\u05BE\u05BF\u05C0\u05C1\u05C2\u05C3\u05F0\u05F1\u05F2\u05F3\u05F4\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\u05D0\u05D1\u05D2\u05D3\u05D4\u05D5\u05D6\u05D7\u05D8\u05D9\u05DA\u05DB\u05DC\u05DD\u05DE\u05DF\u05E0\u05E1\u05E2\u05E3\u05E4\u05E5\u05E6\u05E7\u05E8\u05E9\u05EA\uFFFD\uFFFD\u200E\u200F\uFFFD"
      },
      "win1255": "windows1255",
      "cp1255": "windows1255",
      "windows1256": {
        "type": "_sbcs",
        "chars": "\u20AC\u067E\u201A\u0192\u201E\u2026\u2020\u2021\u02C6\u2030\u0679\u2039\u0152\u0686\u0698\u0688\u06AF\u2018\u2019\u201C\u201D\u2022\u2013\u2014\u06A9\u2122\u0691\u203A\u0153\u200C\u200D\u06BA\xA0\u060C\xA2\xA3\xA4\xA5\xA6\xA7\xA8\xA9\u06BE\xAB\xAC\xAD\xAE\xAF\xB0\xB1\xB2\xB3\xB4\xB5\xB6\xB7\xB8\xB9\u061B\xBB\xBC\xBD\xBE\u061F\u06C1\u0621\u0622\u0623\u0624\u0625\u0626\u0627\u0628\u0629\u062A\u062B\u062C\u062D\u062E\u062F\u0630\u0631\u0632\u0633\u0634\u0635\u0636\xD7\u0637\u0638\u0639\u063A\u0640\u0641\u0642\u0643\xE0\u0644\xE2\u0645\u0646\u0647\u0648\xE7\xE8\xE9\xEA\xEB\u0649\u064A\xEE\xEF\u064B\u064C\u064D\u064E\xF4\u064F\u0650\xF7\u0651\xF9\u0652\xFB\xFC\u200E\u200F\u06D2"
      },
      "win1256": "windows1256",
      "cp1256": "windows1256",
      "windows1257": {
        "type": "_sbcs",
        "chars": "\u20AC\uFFFD\u201A\uFFFD\u201E\u2026\u2020\u2021\uFFFD\u2030\uFFFD\u2039\uFFFD\xA8\u02C7\xB8\uFFFD\u2018\u2019\u201C\u201D\u2022\u2013\u2014\uFFFD\u2122\uFFFD\u203A\uFFFD\xAF\u02DB\uFFFD\xA0\uFFFD\xA2\xA3\xA4\uFFFD\xA6\xA7\xD8\xA9\u0156\xAB\xAC\xAD\xAE\xC6\xB0\xB1\xB2\xB3\xB4\xB5\xB6\xB7\xF8\xB9\u0157\xBB\xBC\xBD\xBE\xE6\u0104\u012E\u0100\u0106\xC4\xC5\u0118\u0112\u010C\xC9\u0179\u0116\u0122\u0136\u012A\u013B\u0160\u0143\u0145\xD3\u014C\xD5\xD6\xD7\u0172\u0141\u015A\u016A\xDC\u017B\u017D\xDF\u0105\u012F\u0101\u0107\xE4\xE5\u0119\u0113\u010D\xE9\u017A\u0117\u0123\u0137\u012B\u013C\u0161\u0144\u0146\xF3\u014D\xF5\xF6\xF7\u0173\u0142\u015B\u016B\xFC\u017C\u017E\u02D9"
      },
      "win1257": "windows1257",
      "cp1257": "windows1257",
      "windows1258": {
        "type": "_sbcs",
        "chars": "\u20AC\uFFFD\u201A\u0192\u201E\u2026\u2020\u2021\u02C6\u2030\uFFFD\u2039\u0152\uFFFD\uFFFD\uFFFD\uFFFD\u2018\u2019\u201C\u201D\u2022\u2013\u2014\u02DC\u2122\uFFFD\u203A\u0153\uFFFD\uFFFD\u0178\xA0\xA1\xA2\xA3\xA4\xA5\xA6\xA7\xA8\xA9\xAA\xAB\xAC\xAD\xAE\xAF\xB0\xB1\xB2\xB3\xB4\xB5\xB6\xB7\xB8\xB9\xBA\xBB\xBC\xBD\xBE\xBF\xC0\xC1\xC2\u0102\xC4\xC5\xC6\xC7\xC8\xC9\xCA\xCB\u0300\xCD\xCE\xCF\u0110\xD1\u0309\xD3\xD4\u01A0\xD6\xD7\xD8\xD9\xDA\xDB\xDC\u01AF\u0303\xDF\xE0\xE1\xE2\u0103\xE4\xE5\xE6\xE7\xE8\xE9\xEA\xEB\u0301\xED\xEE\xEF\u0111\xF1\u0323\xF3\xF4\u01A1\xF6\xF7\xF8\xF9\xFA\xFB\xFC\u01B0\u20AB\xFF"
      },
      "win1258": "windows1258",
      "cp1258": "windows1258",
      "iso88591": {
        "type": "_sbcs",
        "chars": "\x80\x81\x82\x83\x84\x85\x86\x87\x88\x89\x8A\x8B\x8C\x8D\x8E\x8F\x90\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9A\x9B\x9C\x9D\x9E\x9F\xA0\xA1\xA2\xA3\xA4\xA5\xA6\xA7\xA8\xA9\xAA\xAB\xAC\xAD\xAE\xAF\xB0\xB1\xB2\xB3\xB4\xB5\xB6\xB7\xB8\xB9\xBA\xBB\xBC\xBD\xBE\xBF\xC0\xC1\xC2\xC3\xC4\xC5\xC6\xC7\xC8\xC9\xCA\xCB\xCC\xCD\xCE\xCF\xD0\xD1\xD2\xD3\xD4\xD5\xD6\xD7\xD8\xD9\xDA\xDB\xDC\xDD\xDE\xDF\xE0\xE1\xE2\xE3\xE4\xE5\xE6\xE7\xE8\xE9\xEA\xEB\xEC\xED\xEE\xEF\xF0\xF1\xF2\xF3\xF4\xF5\xF6\xF7\xF8\xF9\xFA\xFB\xFC\xFD\xFE\xFF"
      },
      "cp28591": "iso88591",
      "iso88592": {
        "type": "_sbcs",
        "chars": "\x80\x81\x82\x83\x84\x85\x86\x87\x88\x89\x8A\x8B\x8C\x8D\x8E\x8F\x90\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9A\x9B\x9C\x9D\x9E\x9F\xA0\u0104\u02D8\u0141\xA4\u013D\u015A\xA7\xA8\u0160\u015E\u0164\u0179\xAD\u017D\u017B\xB0\u0105\u02DB\u0142\xB4\u013E\u015B\u02C7\xB8\u0161\u015F\u0165\u017A\u02DD\u017E\u017C\u0154\xC1\xC2\u0102\xC4\u0139\u0106\xC7\u010C\xC9\u0118\xCB\u011A\xCD\xCE\u010E\u0110\u0143\u0147\xD3\xD4\u0150\xD6\xD7\u0158\u016E\xDA\u0170\xDC\xDD\u0162\xDF\u0155\xE1\xE2\u0103\xE4\u013A\u0107\xE7\u010D\xE9\u0119\xEB\u011B\xED\xEE\u010F\u0111\u0144\u0148\xF3\xF4\u0151\xF6\xF7\u0159\u016F\xFA\u0171\xFC\xFD\u0163\u02D9"
      },
      "cp28592": "iso88592",
      "iso88593": {
        "type": "_sbcs",
        "chars": "\x80\x81\x82\x83\x84\x85\x86\x87\x88\x89\x8A\x8B\x8C\x8D\x8E\x8F\x90\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9A\x9B\x9C\x9D\x9E\x9F\xA0\u0126\u02D8\xA3\xA4\uFFFD\u0124\xA7\xA8\u0130\u015E\u011E\u0134\xAD\uFFFD\u017B\xB0\u0127\xB2\xB3\xB4\xB5\u0125\xB7\xB8\u0131\u015F\u011F\u0135\xBD\uFFFD\u017C\xC0\xC1\xC2\uFFFD\xC4\u010A\u0108\xC7\xC8\xC9\xCA\xCB\xCC\xCD\xCE\xCF\uFFFD\xD1\xD2\xD3\xD4\u0120\xD6\xD7\u011C\xD9\xDA\xDB\xDC\u016C\u015C\xDF\xE0\xE1\xE2\uFFFD\xE4\u010B\u0109\xE7\xE8\xE9\xEA\xEB\xEC\xED\xEE\xEF\uFFFD\xF1\xF2\xF3\xF4\u0121\xF6\xF7\u011D\xF9\xFA\xFB\xFC\u016D\u015D\u02D9"
      },
      "cp28593": "iso88593",
      "iso88594": {
        "type": "_sbcs",
        "chars": "\x80\x81\x82\x83\x84\x85\x86\x87\x88\x89\x8A\x8B\x8C\x8D\x8E\x8F\x90\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9A\x9B\x9C\x9D\x9E\x9F\xA0\u0104\u0138\u0156\xA4\u0128\u013B\xA7\xA8\u0160\u0112\u0122\u0166\xAD\u017D\xAF\xB0\u0105\u02DB\u0157\xB4\u0129\u013C\u02C7\xB8\u0161\u0113\u0123\u0167\u014A\u017E\u014B\u0100\xC1\xC2\xC3\xC4\xC5\xC6\u012E\u010C\xC9\u0118\xCB\u0116\xCD\xCE\u012A\u0110\u0145\u014C\u0136\xD4\xD5\xD6\xD7\xD8\u0172\xDA\xDB\xDC\u0168\u016A\xDF\u0101\xE1\xE2\xE3\xE4\xE5\xE6\u012F\u010D\xE9\u0119\xEB\u0117\xED\xEE\u012B\u0111\u0146\u014D\u0137\xF4\xF5\xF6\xF7\xF8\u0173\xFA\xFB\xFC\u0169\u016B\u02D9"
      },
      "cp28594": "iso88594",
      "iso88595": {
        "type": "_sbcs",
        "chars": "\x80\x81\x82\x83\x84\x85\x86\x87\x88\x89\x8A\x8B\x8C\x8D\x8E\x8F\x90\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9A\x9B\x9C\x9D\x9E\x9F\xA0\u0401\u0402\u0403\u0404\u0405\u0406\u0407\u0408\u0409\u040A\u040B\u040C\xAD\u040E\u040F\u0410\u0411\u0412\u0413\u0414\u0415\u0416\u0417\u0418\u0419\u041A\u041B\u041C\u041D\u041E\u041F\u0420\u0421\u0422\u0423\u0424\u0425\u0426\u0427\u0428\u0429\u042A\u042B\u042C\u042D\u042E\u042F\u0430\u0431\u0432\u0433\u0434\u0435\u0436\u0437\u0438\u0439\u043A\u043B\u043C\u043D\u043E\u043F\u0440\u0441\u0442\u0443\u0444\u0445\u0446\u0447\u0448\u0449\u044A\u044B\u044C\u044D\u044E\u044F\u2116\u0451\u0452\u0453\u0454\u0455\u0456\u0457\u0458\u0459\u045A\u045B\u045C\xA7\u045E\u045F"
      },
      "cp28595": "iso88595",
      "iso88596": {
        "type": "_sbcs",
        "chars": "\x80\x81\x82\x83\x84\x85\x86\x87\x88\x89\x8A\x8B\x8C\x8D\x8E\x8F\x90\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9A\x9B\x9C\x9D\x9E\x9F\xA0\uFFFD\uFFFD\uFFFD\xA4\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\u060C\xAD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\u061B\uFFFD\uFFFD\uFFFD\u061F\uFFFD\u0621\u0622\u0623\u0624\u0625\u0626\u0627\u0628\u0629\u062A\u062B\u062C\u062D\u062E\u062F\u0630\u0631\u0632\u0633\u0634\u0635\u0636\u0637\u0638\u0639\u063A\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\u0640\u0641\u0642\u0643\u0644\u0645\u0646\u0647\u0648\u0649\u064A\u064B\u064C\u064D\u064E\u064F\u0650\u0651\u0652\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD"
      },
      "cp28596": "iso88596",
      "iso88597": {
        "type": "_sbcs",
        "chars": "\x80\x81\x82\x83\x84\x85\x86\x87\x88\x89\x8A\x8B\x8C\x8D\x8E\x8F\x90\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9A\x9B\x9C\x9D\x9E\x9F\xA0\u2018\u2019\xA3\u20AC\u20AF\xA6\xA7\xA8\xA9\u037A\xAB\xAC\xAD\uFFFD\u2015\xB0\xB1\xB2\xB3\u0384\u0385\u0386\xB7\u0388\u0389\u038A\xBB\u038C\xBD\u038E\u038F\u0390\u0391\u0392\u0393\u0394\u0395\u0396\u0397\u0398\u0399\u039A\u039B\u039C\u039D\u039E\u039F\u03A0\u03A1\uFFFD\u03A3\u03A4\u03A5\u03A6\u03A7\u03A8\u03A9\u03AA\u03AB\u03AC\u03AD\u03AE\u03AF\u03B0\u03B1\u03B2\u03B3\u03B4\u03B5\u03B6\u03B7\u03B8\u03B9\u03BA\u03BB\u03BC\u03BD\u03BE\u03BF\u03C0\u03C1\u03C2\u03C3\u03C4\u03C5\u03C6\u03C7\u03C8\u03C9\u03CA\u03CB\u03CC\u03CD\u03CE\uFFFD"
      },
      "cp28597": "iso88597",
      "iso88598": {
        "type": "_sbcs",
        "chars": "\x80\x81\x82\x83\x84\x85\x86\x87\x88\x89\x8A\x8B\x8C\x8D\x8E\x8F\x90\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9A\x9B\x9C\x9D\x9E\x9F\xA0\uFFFD\xA2\xA3\xA4\xA5\xA6\xA7\xA8\xA9\xD7\xAB\xAC\xAD\xAE\xAF\xB0\xB1\xB2\xB3\xB4\xB5\xB6\xB7\xB8\xB9\xF7\xBB\xBC\xBD\xBE\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\u2017\u05D0\u05D1\u05D2\u05D3\u05D4\u05D5\u05D6\u05D7\u05D8\u05D9\u05DA\u05DB\u05DC\u05DD\u05DE\u05DF\u05E0\u05E1\u05E2\u05E3\u05E4\u05E5\u05E6\u05E7\u05E8\u05E9\u05EA\uFFFD\uFFFD\u200E\u200F\uFFFD"
      },
      "cp28598": "iso88598",
      "iso88599": {
        "type": "_sbcs",
        "chars": "\x80\x81\x82\x83\x84\x85\x86\x87\x88\x89\x8A\x8B\x8C\x8D\x8E\x8F\x90\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9A\x9B\x9C\x9D\x9E\x9F\xA0\xA1\xA2\xA3\xA4\xA5\xA6\xA7\xA8\xA9\xAA\xAB\xAC\xAD\xAE\xAF\xB0\xB1\xB2\xB3\xB4\xB5\xB6\xB7\xB8\xB9\xBA\xBB\xBC\xBD\xBE\xBF\xC0\xC1\xC2\xC3\xC4\xC5\xC6\xC7\xC8\xC9\xCA\xCB\xCC\xCD\xCE\xCF\u011E\xD1\xD2\xD3\xD4\xD5\xD6\xD7\xD8\xD9\xDA\xDB\xDC\u0130\u015E\xDF\xE0\xE1\xE2\xE3\xE4\xE5\xE6\xE7\xE8\xE9\xEA\xEB\xEC\xED\xEE\xEF\u011F\xF1\xF2\xF3\xF4\xF5\xF6\xF7\xF8\xF9\xFA\xFB\xFC\u0131\u015F\xFF"
      },
      "cp28599": "iso88599",
      "iso885910": {
        "type": "_sbcs",
        "chars": "\x80\x81\x82\x83\x84\x85\x86\x87\x88\x89\x8A\x8B\x8C\x8D\x8E\x8F\x90\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9A\x9B\x9C\x9D\x9E\x9F\xA0\u0104\u0112\u0122\u012A\u0128\u0136\xA7\u013B\u0110\u0160\u0166\u017D\xAD\u016A\u014A\xB0\u0105\u0113\u0123\u012B\u0129\u0137\xB7\u013C\u0111\u0161\u0167\u017E\u2015\u016B\u014B\u0100\xC1\xC2\xC3\xC4\xC5\xC6\u012E\u010C\xC9\u0118\xCB\u0116\xCD\xCE\xCF\xD0\u0145\u014C\xD3\xD4\xD5\xD6\u0168\xD8\u0172\xDA\xDB\xDC\xDD\xDE\xDF\u0101\xE1\xE2\xE3\xE4\xE5\xE6\u012F\u010D\xE9\u0119\xEB\u0117\xED\xEE\xEF\xF0\u0146\u014D\xF3\xF4\xF5\xF6\u0169\xF8\u0173\xFA\xFB\xFC\xFD\xFE\u0138"
      },
      "cp28600": "iso885910",
      "iso885911": {
        "type": "_sbcs",
        "chars": "\x80\x81\x82\x83\x84\x85\x86\x87\x88\x89\x8A\x8B\x8C\x8D\x8E\x8F\x90\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9A\x9B\x9C\x9D\x9E\x9F\xA0\u0E01\u0E02\u0E03\u0E04\u0E05\u0E06\u0E07\u0E08\u0E09\u0E0A\u0E0B\u0E0C\u0E0D\u0E0E\u0E0F\u0E10\u0E11\u0E12\u0E13\u0E14\u0E15\u0E16\u0E17\u0E18\u0E19\u0E1A\u0E1B\u0E1C\u0E1D\u0E1E\u0E1F\u0E20\u0E21\u0E22\u0E23\u0E24\u0E25\u0E26\u0E27\u0E28\u0E29\u0E2A\u0E2B\u0E2C\u0E2D\u0E2E\u0E2F\u0E30\u0E31\u0E32\u0E33\u0E34\u0E35\u0E36\u0E37\u0E38\u0E39\u0E3A\uFFFD\uFFFD\uFFFD\uFFFD\u0E3F\u0E40\u0E41\u0E42\u0E43\u0E44\u0E45\u0E46\u0E47\u0E48\u0E49\u0E4A\u0E4B\u0E4C\u0E4D\u0E4E\u0E4F\u0E50\u0E51\u0E52\u0E53\u0E54\u0E55\u0E56\u0E57\u0E58\u0E59\u0E5A\u0E5B\uFFFD\uFFFD\uFFFD\uFFFD"
      },
      "cp28601": "iso885911",
      "iso885913": {
        "type": "_sbcs",
        "chars": "\x80\x81\x82\x83\x84\x85\x86\x87\x88\x89\x8A\x8B\x8C\x8D\x8E\x8F\x90\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9A\x9B\x9C\x9D\x9E\x9F\xA0\u201D\xA2\xA3\xA4\u201E\xA6\xA7\xD8\xA9\u0156\xAB\xAC\xAD\xAE\xC6\xB0\xB1\xB2\xB3\u201C\xB5\xB6\xB7\xF8\xB9\u0157\xBB\xBC\xBD\xBE\xE6\u0104\u012E\u0100\u0106\xC4\xC5\u0118\u0112\u010C\xC9\u0179\u0116\u0122\u0136\u012A\u013B\u0160\u0143\u0145\xD3\u014C\xD5\xD6\xD7\u0172\u0141\u015A\u016A\xDC\u017B\u017D\xDF\u0105\u012F\u0101\u0107\xE4\xE5\u0119\u0113\u010D\xE9\u017A\u0117\u0123\u0137\u012B\u013C\u0161\u0144\u0146\xF3\u014D\xF5\xF6\xF7\u0173\u0142\u015B\u016B\xFC\u017C\u017E\u2019"
      },
      "cp28603": "iso885913",
      "iso885914": {
        "type": "_sbcs",
        "chars": "\x80\x81\x82\x83\x84\x85\x86\x87\x88\x89\x8A\x8B\x8C\x8D\x8E\x8F\x90\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9A\x9B\x9C\x9D\x9E\x9F\xA0\u1E02\u1E03\xA3\u010A\u010B\u1E0A\xA7\u1E80\xA9\u1E82\u1E0B\u1EF2\xAD\xAE\u0178\u1E1E\u1E1F\u0120\u0121\u1E40\u1E41\xB6\u1E56\u1E81\u1E57\u1E83\u1E60\u1EF3\u1E84\u1E85\u1E61\xC0\xC1\xC2\xC3\xC4\xC5\xC6\xC7\xC8\xC9\xCA\xCB\xCC\xCD\xCE\xCF\u0174\xD1\xD2\xD3\xD4\xD5\xD6\u1E6A\xD8\xD9\xDA\xDB\xDC\xDD\u0176\xDF\xE0\xE1\xE2\xE3\xE4\xE5\xE6\xE7\xE8\xE9\xEA\xEB\xEC\xED\xEE\xEF\u0175\xF1\xF2\xF3\xF4\xF5\xF6\u1E6B\xF8\xF9\xFA\xFB\xFC\xFD\u0177\xFF"
      },
      "cp28604": "iso885914",
      "iso885915": {
        "type": "_sbcs",
        "chars": "\x80\x81\x82\x83\x84\x85\x86\x87\x88\x89\x8A\x8B\x8C\x8D\x8E\x8F\x90\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9A\x9B\x9C\x9D\x9E\x9F\xA0\xA1\xA2\xA3\u20AC\xA5\u0160\xA7\u0161\xA9\xAA\xAB\xAC\xAD\xAE\xAF\xB0\xB1\xB2\xB3\u017D\xB5\xB6\xB7\u017E\xB9\xBA\xBB\u0152\u0153\u0178\xBF\xC0\xC1\xC2\xC3\xC4\xC5\xC6\xC7\xC8\xC9\xCA\xCB\xCC\xCD\xCE\xCF\xD0\xD1\xD2\xD3\xD4\xD5\xD6\xD7\xD8\xD9\xDA\xDB\xDC\xDD\xDE\xDF\xE0\xE1\xE2\xE3\xE4\xE5\xE6\xE7\xE8\xE9\xEA\xEB\xEC\xED\xEE\xEF\xF0\xF1\xF2\xF3\xF4\xF5\xF6\xF7\xF8\xF9\xFA\xFB\xFC\xFD\xFE\xFF"
      },
      "cp28605": "iso885915",
      "iso885916": {
        "type": "_sbcs",
        "chars": "\x80\x81\x82\x83\x84\x85\x86\x87\x88\x89\x8A\x8B\x8C\x8D\x8E\x8F\x90\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9A\x9B\x9C\x9D\x9E\x9F\xA0\u0104\u0105\u0141\u20AC\u201E\u0160\xA7\u0161\xA9\u0218\xAB\u0179\xAD\u017A\u017B\xB0\xB1\u010C\u0142\u017D\u201D\xB6\xB7\u017E\u010D\u0219\xBB\u0152\u0153\u0178\u017C\xC0\xC1\xC2\u0102\xC4\u0106\xC6\xC7\xC8\xC9\xCA\xCB\xCC\xCD\xCE\xCF\u0110\u0143\xD2\xD3\xD4\u0150\xD6\u015A\u0170\xD9\xDA\xDB\xDC\u0118\u021A\xDF\xE0\xE1\xE2\u0103\xE4\u0107\xE6\xE7\xE8\xE9\xEA\xEB\xEC\xED\xEE\xEF\u0111\u0144\xF2\xF3\xF4\u0151\xF6\u015B\u0171\xF9\xFA\xFB\xFC\u0119\u021B\xFF"
      },
      "cp28606": "iso885916",
      "cp437": {
        "type": "_sbcs",
        "chars": "\xC7\xFC\xE9\xE2\xE4\xE0\xE5\xE7\xEA\xEB\xE8\xEF\xEE\xEC\xC4\xC5\xC9\xE6\xC6\xF4\xF6\xF2\xFB\xF9\xFF\xD6\xDC\xA2\xA3\xA5\u20A7\u0192\xE1\xED\xF3\xFA\xF1\xD1\xAA\xBA\xBF\u2310\xAC\xBD\xBC\xA1\xAB\xBB\u2591\u2592\u2593\u2502\u2524\u2561\u2562\u2556\u2555\u2563\u2551\u2557\u255D\u255C\u255B\u2510\u2514\u2534\u252C\u251C\u2500\u253C\u255E\u255F\u255A\u2554\u2569\u2566\u2560\u2550\u256C\u2567\u2568\u2564\u2565\u2559\u2558\u2552\u2553\u256B\u256A\u2518\u250C\u2588\u2584\u258C\u2590\u2580\u03B1\xDF\u0393\u03C0\u03A3\u03C3\xB5\u03C4\u03A6\u0398\u03A9\u03B4\u221E\u03C6\u03B5\u2229\u2261\xB1\u2265\u2264\u2320\u2321\xF7\u2248\xB0\u2219\xB7\u221A\u207F\xB2\u25A0\xA0"
      },
      "ibm437": "cp437",
      "csibm437": "cp437",
      "cp737": {
        "type": "_sbcs",
        "chars": "\u0391\u0392\u0393\u0394\u0395\u0396\u0397\u0398\u0399\u039A\u039B\u039C\u039D\u039E\u039F\u03A0\u03A1\u03A3\u03A4\u03A5\u03A6\u03A7\u03A8\u03A9\u03B1\u03B2\u03B3\u03B4\u03B5\u03B6\u03B7\u03B8\u03B9\u03BA\u03BB\u03BC\u03BD\u03BE\u03BF\u03C0\u03C1\u03C3\u03C2\u03C4\u03C5\u03C6\u03C7\u03C8\u2591\u2592\u2593\u2502\u2524\u2561\u2562\u2556\u2555\u2563\u2551\u2557\u255D\u255C\u255B\u2510\u2514\u2534\u252C\u251C\u2500\u253C\u255E\u255F\u255A\u2554\u2569\u2566\u2560\u2550\u256C\u2567\u2568\u2564\u2565\u2559\u2558\u2552\u2553\u256B\u256A\u2518\u250C\u2588\u2584\u258C\u2590\u2580\u03C9\u03AC\u03AD\u03AE\u03CA\u03AF\u03CC\u03CD\u03CB\u03CE\u0386\u0388\u0389\u038A\u038C\u038E\u038F\xB1\u2265\u2264\u03AA\u03AB\xF7\u2248\xB0\u2219\xB7\u221A\u207F\xB2\u25A0\xA0"
      },
      "ibm737": "cp737",
      "csibm737": "cp737",
      "cp775": {
        "type": "_sbcs",
        "chars": "\u0106\xFC\xE9\u0101\xE4\u0123\xE5\u0107\u0142\u0113\u0156\u0157\u012B\u0179\xC4\xC5\xC9\xE6\xC6\u014D\xF6\u0122\xA2\u015A\u015B\xD6\xDC\xF8\xA3\xD8\xD7\xA4\u0100\u012A\xF3\u017B\u017C\u017A\u201D\xA6\xA9\xAE\xAC\xBD\xBC\u0141\xAB\xBB\u2591\u2592\u2593\u2502\u2524\u0104\u010C\u0118\u0116\u2563\u2551\u2557\u255D\u012E\u0160\u2510\u2514\u2534\u252C\u251C\u2500\u253C\u0172\u016A\u255A\u2554\u2569\u2566\u2560\u2550\u256C\u017D\u0105\u010D\u0119\u0117\u012F\u0161\u0173\u016B\u017E\u2518\u250C\u2588\u2584\u258C\u2590\u2580\xD3\xDF\u014C\u0143\xF5\xD5\xB5\u0144\u0136\u0137\u013B\u013C\u0146\u0112\u0145\u2019\xAD\xB1\u201C\xBE\xB6\xA7\xF7\u201E\xB0\u2219\xB7\xB9\xB3\xB2\u25A0\xA0"
      },
      "ibm775": "cp775",
      "csibm775": "cp775",
      "cp850": {
        "type": "_sbcs",
        "chars": "\xC7\xFC\xE9\xE2\xE4\xE0\xE5\xE7\xEA\xEB\xE8\xEF\xEE\xEC\xC4\xC5\xC9\xE6\xC6\xF4\xF6\xF2\xFB\xF9\xFF\xD6\xDC\xF8\xA3\xD8\xD7\u0192\xE1\xED\xF3\xFA\xF1\xD1\xAA\xBA\xBF\xAE\xAC\xBD\xBC\xA1\xAB\xBB\u2591\u2592\u2593\u2502\u2524\xC1\xC2\xC0\xA9\u2563\u2551\u2557\u255D\xA2\xA5\u2510\u2514\u2534\u252C\u251C\u2500\u253C\xE3\xC3\u255A\u2554\u2569\u2566\u2560\u2550\u256C\xA4\xF0\xD0\xCA\xCB\xC8\u0131\xCD\xCE\xCF\u2518\u250C\u2588\u2584\xA6\xCC\u2580\xD3\xDF\xD4\xD2\xF5\xD5\xB5\xFE\xDE\xDA\xDB\xD9\xFD\xDD\xAF\xB4\xAD\xB1\u2017\xBE\xB6\xA7\xF7\xB8\xB0\xA8\xB7\xB9\xB3\xB2\u25A0\xA0"
      },
      "ibm850": "cp850",
      "csibm850": "cp850",
      "cp852": {
        "type": "_sbcs",
        "chars": "\xC7\xFC\xE9\xE2\xE4\u016F\u0107\xE7\u0142\xEB\u0150\u0151\xEE\u0179\xC4\u0106\xC9\u0139\u013A\xF4\xF6\u013D\u013E\u015A\u015B\xD6\xDC\u0164\u0165\u0141\xD7\u010D\xE1\xED\xF3\xFA\u0104\u0105\u017D\u017E\u0118\u0119\xAC\u017A\u010C\u015F\xAB\xBB\u2591\u2592\u2593\u2502\u2524\xC1\xC2\u011A\u015E\u2563\u2551\u2557\u255D\u017B\u017C\u2510\u2514\u2534\u252C\u251C\u2500\u253C\u0102\u0103\u255A\u2554\u2569\u2566\u2560\u2550\u256C\xA4\u0111\u0110\u010E\xCB\u010F\u0147\xCD\xCE\u011B\u2518\u250C\u2588\u2584\u0162\u016E\u2580\xD3\xDF\xD4\u0143\u0144\u0148\u0160\u0161\u0154\xDA\u0155\u0170\xFD\xDD\u0163\xB4\xAD\u02DD\u02DB\u02C7\u02D8\xA7\xF7\xB8\xB0\xA8\u02D9\u0171\u0158\u0159\u25A0\xA0"
      },
      "ibm852": "cp852",
      "csibm852": "cp852",
      "cp855": {
        "type": "_sbcs",
        "chars": "\u0452\u0402\u0453\u0403\u0451\u0401\u0454\u0404\u0455\u0405\u0456\u0406\u0457\u0407\u0458\u0408\u0459\u0409\u045A\u040A\u045B\u040B\u045C\u040C\u045E\u040E\u045F\u040F\u044E\u042E\u044A\u042A\u0430\u0410\u0431\u0411\u0446\u0426\u0434\u0414\u0435\u0415\u0444\u0424\u0433\u0413\xAB\xBB\u2591\u2592\u2593\u2502\u2524\u0445\u0425\u0438\u0418\u2563\u2551\u2557\u255D\u0439\u0419\u2510\u2514\u2534\u252C\u251C\u2500\u253C\u043A\u041A\u255A\u2554\u2569\u2566\u2560\u2550\u256C\xA4\u043B\u041B\u043C\u041C\u043D\u041D\u043E\u041E\u043F\u2518\u250C\u2588\u2584\u041F\u044F\u2580\u042F\u0440\u0420\u0441\u0421\u0442\u0422\u0443\u0423\u0436\u0416\u0432\u0412\u044C\u042C\u2116\xAD\u044B\u042B\u0437\u0417\u0448\u0428\u044D\u042D\u0449\u0429\u0447\u0427\xA7\u25A0\xA0"
      },
      "ibm855": "cp855",
      "csibm855": "cp855",
      "cp856": {
        "type": "_sbcs",
        "chars": "\u05D0\u05D1\u05D2\u05D3\u05D4\u05D5\u05D6\u05D7\u05D8\u05D9\u05DA\u05DB\u05DC\u05DD\u05DE\u05DF\u05E0\u05E1\u05E2\u05E3\u05E4\u05E5\u05E6\u05E7\u05E8\u05E9\u05EA\uFFFD\xA3\uFFFD\xD7\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\xAE\xAC\xBD\xBC\uFFFD\xAB\xBB\u2591\u2592\u2593\u2502\u2524\uFFFD\uFFFD\uFFFD\xA9\u2563\u2551\u2557\u255D\xA2\xA5\u2510\u2514\u2534\u252C\u251C\u2500\u253C\uFFFD\uFFFD\u255A\u2554\u2569\u2566\u2560\u2550\u256C\xA4\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\u2518\u250C\u2588\u2584\xA6\uFFFD\u2580\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\xB5\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\xAF\xB4\xAD\xB1\u2017\xBE\xB6\xA7\xF7\xB8\xB0\xA8\xB7\xB9\xB3\xB2\u25A0\xA0"
      },
      "ibm856": "cp856",
      "csibm856": "cp856",
      "cp857": {
        "type": "_sbcs",
        "chars": "\xC7\xFC\xE9\xE2\xE4\xE0\xE5\xE7\xEA\xEB\xE8\xEF\xEE\u0131\xC4\xC5\xC9\xE6\xC6\xF4\xF6\xF2\xFB\xF9\u0130\xD6\xDC\xF8\xA3\xD8\u015E\u015F\xE1\xED\xF3\xFA\xF1\xD1\u011E\u011F\xBF\xAE\xAC\xBD\xBC\xA1\xAB\xBB\u2591\u2592\u2593\u2502\u2524\xC1\xC2\xC0\xA9\u2563\u2551\u2557\u255D\xA2\xA5\u2510\u2514\u2534\u252C\u251C\u2500\u253C\xE3\xC3\u255A\u2554\u2569\u2566\u2560\u2550\u256C\xA4\xBA\xAA\xCA\xCB\xC8\uFFFD\xCD\xCE\xCF\u2518\u250C\u2588\u2584\xA6\xCC\u2580\xD3\xDF\xD4\xD2\xF5\xD5\xB5\uFFFD\xD7\xDA\xDB\xD9\xEC\xFF\xAF\xB4\xAD\xB1\uFFFD\xBE\xB6\xA7\xF7\xB8\xB0\xA8\xB7\xB9\xB3\xB2\u25A0\xA0"
      },
      "ibm857": "cp857",
      "csibm857": "cp857",
      "cp858": {
        "type": "_sbcs",
        "chars": "\xC7\xFC\xE9\xE2\xE4\xE0\xE5\xE7\xEA\xEB\xE8\xEF\xEE\xEC\xC4\xC5\xC9\xE6\xC6\xF4\xF6\xF2\xFB\xF9\xFF\xD6\xDC\xF8\xA3\xD8\xD7\u0192\xE1\xED\xF3\xFA\xF1\xD1\xAA\xBA\xBF\xAE\xAC\xBD\xBC\xA1\xAB\xBB\u2591\u2592\u2593\u2502\u2524\xC1\xC2\xC0\xA9\u2563\u2551\u2557\u255D\xA2\xA5\u2510\u2514\u2534\u252C\u251C\u2500\u253C\xE3\xC3\u255A\u2554\u2569\u2566\u2560\u2550\u256C\xA4\xF0\xD0\xCA\xCB\xC8\u20AC\xCD\xCE\xCF\u2518\u250C\u2588\u2584\xA6\xCC\u2580\xD3\xDF\xD4\xD2\xF5\xD5\xB5\xFE\xDE\xDA\xDB\xD9\xFD\xDD\xAF\xB4\xAD\xB1\u2017\xBE\xB6\xA7\xF7\xB8\xB0\xA8\xB7\xB9\xB3\xB2\u25A0\xA0"
      },
      "ibm858": "cp858",
      "csibm858": "cp858",
      "cp860": {
        "type": "_sbcs",
        "chars": "\xC7\xFC\xE9\xE2\xE3\xE0\xC1\xE7\xEA\xCA\xE8\xCD\xD4\xEC\xC3\xC2\xC9\xC0\xC8\xF4\xF5\xF2\xDA\xF9\xCC\xD5\xDC\xA2\xA3\xD9\u20A7\xD3\xE1\xED\xF3\xFA\xF1\xD1\xAA\xBA\xBF\xD2\xAC\xBD\xBC\xA1\xAB\xBB\u2591\u2592\u2593\u2502\u2524\u2561\u2562\u2556\u2555\u2563\u2551\u2557\u255D\u255C\u255B\u2510\u2514\u2534\u252C\u251C\u2500\u253C\u255E\u255F\u255A\u2554\u2569\u2566\u2560\u2550\u256C\u2567\u2568\u2564\u2565\u2559\u2558\u2552\u2553\u256B\u256A\u2518\u250C\u2588\u2584\u258C\u2590\u2580\u03B1\xDF\u0393\u03C0\u03A3\u03C3\xB5\u03C4\u03A6\u0398\u03A9\u03B4\u221E\u03C6\u03B5\u2229\u2261\xB1\u2265\u2264\u2320\u2321\xF7\u2248\xB0\u2219\xB7\u221A\u207F\xB2\u25A0\xA0"
      },
      "ibm860": "cp860",
      "csibm860": "cp860",
      "cp861": {
        "type": "_sbcs",
        "chars": "\xC7\xFC\xE9\xE2\xE4\xE0\xE5\xE7\xEA\xEB\xE8\xD0\xF0\xDE\xC4\xC5\xC9\xE6\xC6\xF4\xF6\xFE\xFB\xDD\xFD\xD6\xDC\xF8\xA3\xD8\u20A7\u0192\xE1\xED\xF3\xFA\xC1\xCD\xD3\xDA\xBF\u2310\xAC\xBD\xBC\xA1\xAB\xBB\u2591\u2592\u2593\u2502\u2524\u2561\u2562\u2556\u2555\u2563\u2551\u2557\u255D\u255C\u255B\u2510\u2514\u2534\u252C\u251C\u2500\u253C\u255E\u255F\u255A\u2554\u2569\u2566\u2560\u2550\u256C\u2567\u2568\u2564\u2565\u2559\u2558\u2552\u2553\u256B\u256A\u2518\u250C\u2588\u2584\u258C\u2590\u2580\u03B1\xDF\u0393\u03C0\u03A3\u03C3\xB5\u03C4\u03A6\u0398\u03A9\u03B4\u221E\u03C6\u03B5\u2229\u2261\xB1\u2265\u2264\u2320\u2321\xF7\u2248\xB0\u2219\xB7\u221A\u207F\xB2\u25A0\xA0"
      },
      "ibm861": "cp861",
      "csibm861": "cp861",
      "cp862": {
        "type": "_sbcs",
        "chars": "\u05D0\u05D1\u05D2\u05D3\u05D4\u05D5\u05D6\u05D7\u05D8\u05D9\u05DA\u05DB\u05DC\u05DD\u05DE\u05DF\u05E0\u05E1\u05E2\u05E3\u05E4\u05E5\u05E6\u05E7\u05E8\u05E9\u05EA\xA2\xA3\xA5\u20A7\u0192\xE1\xED\xF3\xFA\xF1\xD1\xAA\xBA\xBF\u2310\xAC\xBD\xBC\xA1\xAB\xBB\u2591\u2592\u2593\u2502\u2524\u2561\u2562\u2556\u2555\u2563\u2551\u2557\u255D\u255C\u255B\u2510\u2514\u2534\u252C\u251C\u2500\u253C\u255E\u255F\u255A\u2554\u2569\u2566\u2560\u2550\u256C\u2567\u2568\u2564\u2565\u2559\u2558\u2552\u2553\u256B\u256A\u2518\u250C\u2588\u2584\u258C\u2590\u2580\u03B1\xDF\u0393\u03C0\u03A3\u03C3\xB5\u03C4\u03A6\u0398\u03A9\u03B4\u221E\u03C6\u03B5\u2229\u2261\xB1\u2265\u2264\u2320\u2321\xF7\u2248\xB0\u2219\xB7\u221A\u207F\xB2\u25A0\xA0"
      },
      "ibm862": "cp862",
      "csibm862": "cp862",
      "cp863": {
        "type": "_sbcs",
        "chars": "\xC7\xFC\xE9\xE2\xC2\xE0\xB6\xE7\xEA\xEB\xE8\xEF\xEE\u2017\xC0\xA7\xC9\xC8\xCA\xF4\xCB\xCF\xFB\xF9\xA4\xD4\xDC\xA2\xA3\xD9\xDB\u0192\xA6\xB4\xF3\xFA\xA8\xB8\xB3\xAF\xCE\u2310\xAC\xBD\xBC\xBE\xAB\xBB\u2591\u2592\u2593\u2502\u2524\u2561\u2562\u2556\u2555\u2563\u2551\u2557\u255D\u255C\u255B\u2510\u2514\u2534\u252C\u251C\u2500\u253C\u255E\u255F\u255A\u2554\u2569\u2566\u2560\u2550\u256C\u2567\u2568\u2564\u2565\u2559\u2558\u2552\u2553\u256B\u256A\u2518\u250C\u2588\u2584\u258C\u2590\u2580\u03B1\xDF\u0393\u03C0\u03A3\u03C3\xB5\u03C4\u03A6\u0398\u03A9\u03B4\u221E\u03C6\u03B5\u2229\u2261\xB1\u2265\u2264\u2320\u2321\xF7\u2248\xB0\u2219\xB7\u221A\u207F\xB2\u25A0\xA0"
      },
      "ibm863": "cp863",
      "csibm863": "cp863",
      "cp864": {
        "type": "_sbcs",
        "chars": "\0\x07\b	\n\v\f\r\x1B !\"#$\u066A&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~\x7F\xB0\xB7\u2219\u221A\u2592\u2500\u2502\u253C\u2524\u252C\u251C\u2534\u2510\u250C\u2514\u2518\u03B2\u221E\u03C6\xB1\xBD\xBC\u2248\xAB\xBB\uFEF7\uFEF8\uFFFD\uFFFD\uFEFB\uFEFC\uFFFD\xA0\xAD\uFE82\xA3\xA4\uFE84\uFFFD\uFFFD\uFE8E\uFE8F\uFE95\uFE99\u060C\uFE9D\uFEA1\uFEA5\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669\uFED1\u061B\uFEB1\uFEB5\uFEB9\u061F\xA2\uFE80\uFE81\uFE83\uFE85\uFECA\uFE8B\uFE8D\uFE91\uFE93\uFE97\uFE9B\uFE9F\uFEA3\uFEA7\uFEA9\uFEAB\uFEAD\uFEAF\uFEB3\uFEB7\uFEBB\uFEBF\uFEC1\uFEC5\uFECB\uFECF\xA6\xAC\xF7\xD7\uFEC9\u0640\uFED3\uFED7\uFEDB\uFEDF\uFEE3\uFEE7\uFEEB\uFEED\uFEEF\uFEF3\uFEBD\uFECC\uFECE\uFECD\uFEE1\uFE7D\u0651\uFEE5\uFEE9\uFEEC\uFEF0\uFEF2\uFED0\uFED5\uFEF5\uFEF6\uFEDD\uFED9\uFEF1\u25A0\uFFFD"
      },
      "ibm864": "cp864",
      "csibm864": "cp864",
      "cp865": {
        "type": "_sbcs",
        "chars": "\xC7\xFC\xE9\xE2\xE4\xE0\xE5\xE7\xEA\xEB\xE8\xEF\xEE\xEC\xC4\xC5\xC9\xE6\xC6\xF4\xF6\xF2\xFB\xF9\xFF\xD6\xDC\xF8\xA3\xD8\u20A7\u0192\xE1\xED\xF3\xFA\xF1\xD1\xAA\xBA\xBF\u2310\xAC\xBD\xBC\xA1\xAB\xA4\u2591\u2592\u2593\u2502\u2524\u2561\u2562\u2556\u2555\u2563\u2551\u2557\u255D\u255C\u255B\u2510\u2514\u2534\u252C\u251C\u2500\u253C\u255E\u255F\u255A\u2554\u2569\u2566\u2560\u2550\u256C\u2567\u2568\u2564\u2565\u2559\u2558\u2552\u2553\u256B\u256A\u2518\u250C\u2588\u2584\u258C\u2590\u2580\u03B1\xDF\u0393\u03C0\u03A3\u03C3\xB5\u03C4\u03A6\u0398\u03A9\u03B4\u221E\u03C6\u03B5\u2229\u2261\xB1\u2265\u2264\u2320\u2321\xF7\u2248\xB0\u2219\xB7\u221A\u207F\xB2\u25A0\xA0"
      },
      "ibm865": "cp865",
      "csibm865": "cp865",
      "cp866": {
        "type": "_sbcs",
        "chars": "\u0410\u0411\u0412\u0413\u0414\u0415\u0416\u0417\u0418\u0419\u041A\u041B\u041C\u041D\u041E\u041F\u0420\u0421\u0422\u0423\u0424\u0425\u0426\u0427\u0428\u0429\u042A\u042B\u042C\u042D\u042E\u042F\u0430\u0431\u0432\u0433\u0434\u0435\u0436\u0437\u0438\u0439\u043A\u043B\u043C\u043D\u043E\u043F\u2591\u2592\u2593\u2502\u2524\u2561\u2562\u2556\u2555\u2563\u2551\u2557\u255D\u255C\u255B\u2510\u2514\u2534\u252C\u251C\u2500\u253C\u255E\u255F\u255A\u2554\u2569\u2566\u2560\u2550\u256C\u2567\u2568\u2564\u2565\u2559\u2558\u2552\u2553\u256B\u256A\u2518\u250C\u2588\u2584\u258C\u2590\u2580\u0440\u0441\u0442\u0443\u0444\u0445\u0446\u0447\u0448\u0449\u044A\u044B\u044C\u044D\u044E\u044F\u0401\u0451\u0404\u0454\u0407\u0457\u040E\u045E\xB0\u2219\xB7\u221A\u2116\xA4\u25A0\xA0"
      },
      "ibm866": "cp866",
      "csibm866": "cp866",
      "cp869": {
        "type": "_sbcs",
        "chars": "\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\u0386\uFFFD\xB7\xAC\xA6\u2018\u2019\u0388\u2015\u0389\u038A\u03AA\u038C\uFFFD\uFFFD\u038E\u03AB\xA9\u038F\xB2\xB3\u03AC\xA3\u03AD\u03AE\u03AF\u03CA\u0390\u03CC\u03CD\u0391\u0392\u0393\u0394\u0395\u0396\u0397\xBD\u0398\u0399\xAB\xBB\u2591\u2592\u2593\u2502\u2524\u039A\u039B\u039C\u039D\u2563\u2551\u2557\u255D\u039E\u039F\u2510\u2514\u2534\u252C\u251C\u2500\u253C\u03A0\u03A1\u255A\u2554\u2569\u2566\u2560\u2550\u256C\u03A3\u03A4\u03A5\u03A6\u03A7\u03A8\u03A9\u03B1\u03B2\u03B3\u2518\u250C\u2588\u2584\u03B4\u03B5\u2580\u03B6\u03B7\u03B8\u03B9\u03BA\u03BB\u03BC\u03BD\u03BE\u03BF\u03C0\u03C1\u03C3\u03C2\u03C4\u0384\xAD\xB1\u03C5\u03C6\u03C7\xA7\u03C8\u0385\xB0\xA8\u03C9\u03CB\u03B0\u03CE\u25A0\xA0"
      },
      "ibm869": "cp869",
      "csibm869": "cp869",
      "cp922": {
        "type": "_sbcs",
        "chars": "\x80\x81\x82\x83\x84\x85\x86\x87\x88\x89\x8A\x8B\x8C\x8D\x8E\x8F\x90\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9A\x9B\x9C\x9D\x9E\x9F\xA0\xA1\xA2\xA3\xA4\xA5\xA6\xA7\xA8\xA9\xAA\xAB\xAC\xAD\xAE\u203E\xB0\xB1\xB2\xB3\xB4\xB5\xB6\xB7\xB8\xB9\xBA\xBB\xBC\xBD\xBE\xBF\xC0\xC1\xC2\xC3\xC4\xC5\xC6\xC7\xC8\xC9\xCA\xCB\xCC\xCD\xCE\xCF\u0160\xD1\xD2\xD3\xD4\xD5\xD6\xD7\xD8\xD9\xDA\xDB\xDC\xDD\u017D\xDF\xE0\xE1\xE2\xE3\xE4\xE5\xE6\xE7\xE8\xE9\xEA\xEB\xEC\xED\xEE\xEF\u0161\xF1\xF2\xF3\xF4\xF5\xF6\xF7\xF8\xF9\xFA\xFB\xFC\xFD\u017E\xFF"
      },
      "ibm922": "cp922",
      "csibm922": "cp922",
      "cp1046": {
        "type": "_sbcs",
        "chars": "\uFE88\xD7\xF7\uF8F6\uF8F5\uF8F4\uF8F7\uFE71\x88\u25A0\u2502\u2500\u2510\u250C\u2514\u2518\uFE79\uFE7B\uFE7D\uFE7F\uFE77\uFE8A\uFEF0\uFEF3\uFEF2\uFECE\uFECF\uFED0\uFEF6\uFEF8\uFEFA\uFEFC\xA0\uF8FA\uF8F9\uF8F8\xA4\uF8FB\uFE8B\uFE91\uFE97\uFE9B\uFE9F\uFEA3\u060C\xAD\uFEA7\uFEB3\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669\uFEB7\u061B\uFEBB\uFEBF\uFECA\u061F\uFECB\u0621\u0622\u0623\u0624\u0625\u0626\u0627\u0628\u0629\u062A\u062B\u062C\u062D\u062E\u062F\u0630\u0631\u0632\u0633\u0634\u0635\u0636\u0637\uFEC7\u0639\u063A\uFECC\uFE82\uFE84\uFE8E\uFED3\u0640\u0641\u0642\u0643\u0644\u0645\u0646\u0647\u0648\u0649\u064A\u064B\u064C\u064D\u064E\u064F\u0650\u0651\u0652\uFED7\uFEDB\uFEDF\uF8FC\uFEF5\uFEF7\uFEF9\uFEFB\uFEE3\uFEE7\uFEEC\uFEE9\uFFFD"
      },
      "ibm1046": "cp1046",
      "csibm1046": "cp1046",
      "cp1124": {
        "type": "_sbcs",
        "chars": "\x80\x81\x82\x83\x84\x85\x86\x87\x88\x89\x8A\x8B\x8C\x8D\x8E\x8F\x90\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9A\x9B\x9C\x9D\x9E\x9F\xA0\u0401\u0402\u0490\u0404\u0405\u0406\u0407\u0408\u0409\u040A\u040B\u040C\xAD\u040E\u040F\u0410\u0411\u0412\u0413\u0414\u0415\u0416\u0417\u0418\u0419\u041A\u041B\u041C\u041D\u041E\u041F\u0420\u0421\u0422\u0423\u0424\u0425\u0426\u0427\u0428\u0429\u042A\u042B\u042C\u042D\u042E\u042F\u0430\u0431\u0432\u0433\u0434\u0435\u0436\u0437\u0438\u0439\u043A\u043B\u043C\u043D\u043E\u043F\u0440\u0441\u0442\u0443\u0444\u0445\u0446\u0447\u0448\u0449\u044A\u044B\u044C\u044D\u044E\u044F\u2116\u0451\u0452\u0491\u0454\u0455\u0456\u0457\u0458\u0459\u045A\u045B\u045C\xA7\u045E\u045F"
      },
      "ibm1124": "cp1124",
      "csibm1124": "cp1124",
      "cp1125": {
        "type": "_sbcs",
        "chars": "\u0410\u0411\u0412\u0413\u0414\u0415\u0416\u0417\u0418\u0419\u041A\u041B\u041C\u041D\u041E\u041F\u0420\u0421\u0422\u0423\u0424\u0425\u0426\u0427\u0428\u0429\u042A\u042B\u042C\u042D\u042E\u042F\u0430\u0431\u0432\u0433\u0434\u0435\u0436\u0437\u0438\u0439\u043A\u043B\u043C\u043D\u043E\u043F\u2591\u2592\u2593\u2502\u2524\u2561\u2562\u2556\u2555\u2563\u2551\u2557\u255D\u255C\u255B\u2510\u2514\u2534\u252C\u251C\u2500\u253C\u255E\u255F\u255A\u2554\u2569\u2566\u2560\u2550\u256C\u2567\u2568\u2564\u2565\u2559\u2558\u2552\u2553\u256B\u256A\u2518\u250C\u2588\u2584\u258C\u2590\u2580\u0440\u0441\u0442\u0443\u0444\u0445\u0446\u0447\u0448\u0449\u044A\u044B\u044C\u044D\u044E\u044F\u0401\u0451\u0490\u0491\u0404\u0454\u0406\u0456\u0407\u0457\xB7\u221A\u2116\xA4\u25A0\xA0"
      },
      "ibm1125": "cp1125",
      "csibm1125": "cp1125",
      "cp1129": {
        "type": "_sbcs",
        "chars": "\x80\x81\x82\x83\x84\x85\x86\x87\x88\x89\x8A\x8B\x8C\x8D\x8E\x8F\x90\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9A\x9B\x9C\x9D\x9E\x9F\xA0\xA1\xA2\xA3\xA4\xA5\xA6\xA7\u0153\xA9\xAA\xAB\xAC\xAD\xAE\xAF\xB0\xB1\xB2\xB3\u0178\xB5\xB6\xB7\u0152\xB9\xBA\xBB\xBC\xBD\xBE\xBF\xC0\xC1\xC2\u0102\xC4\xC5\xC6\xC7\xC8\xC9\xCA\xCB\u0300\xCD\xCE\xCF\u0110\xD1\u0309\xD3\xD4\u01A0\xD6\xD7\xD8\xD9\xDA\xDB\xDC\u01AF\u0303\xDF\xE0\xE1\xE2\u0103\xE4\xE5\xE6\xE7\xE8\xE9\xEA\xEB\u0301\xED\xEE\xEF\u0111\xF1\u0323\xF3\xF4\u01A1\xF6\xF7\xF8\xF9\xFA\xFB\xFC\u01B0\u20AB\xFF"
      },
      "ibm1129": "cp1129",
      "csibm1129": "cp1129",
      "cp1133": {
        "type": "_sbcs",
        "chars": "\x80\x81\x82\x83\x84\x85\x86\x87\x88\x89\x8A\x8B\x8C\x8D\x8E\x8F\x90\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9A\x9B\x9C\x9D\x9E\x9F\xA0\u0E81\u0E82\u0E84\u0E87\u0E88\u0EAA\u0E8A\u0E8D\u0E94\u0E95\u0E96\u0E97\u0E99\u0E9A\u0E9B\u0E9C\u0E9D\u0E9E\u0E9F\u0EA1\u0EA2\u0EA3\u0EA5\u0EA7\u0EAB\u0EAD\u0EAE\uFFFD\uFFFD\uFFFD\u0EAF\u0EB0\u0EB2\u0EB3\u0EB4\u0EB5\u0EB6\u0EB7\u0EB8\u0EB9\u0EBC\u0EB1\u0EBB\u0EBD\uFFFD\uFFFD\uFFFD\u0EC0\u0EC1\u0EC2\u0EC3\u0EC4\u0EC8\u0EC9\u0ECA\u0ECB\u0ECC\u0ECD\u0EC6\uFFFD\u0EDC\u0EDD\u20AD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\u0ED0\u0ED1\u0ED2\u0ED3\u0ED4\u0ED5\u0ED6\u0ED7\u0ED8\u0ED9\uFFFD\uFFFD\xA2\xAC\xA6\uFFFD"
      },
      "ibm1133": "cp1133",
      "csibm1133": "cp1133",
      "cp1161": {
        "type": "_sbcs",
        "chars": "\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\u0E48\u0E01\u0E02\u0E03\u0E04\u0E05\u0E06\u0E07\u0E08\u0E09\u0E0A\u0E0B\u0E0C\u0E0D\u0E0E\u0E0F\u0E10\u0E11\u0E12\u0E13\u0E14\u0E15\u0E16\u0E17\u0E18\u0E19\u0E1A\u0E1B\u0E1C\u0E1D\u0E1E\u0E1F\u0E20\u0E21\u0E22\u0E23\u0E24\u0E25\u0E26\u0E27\u0E28\u0E29\u0E2A\u0E2B\u0E2C\u0E2D\u0E2E\u0E2F\u0E30\u0E31\u0E32\u0E33\u0E34\u0E35\u0E36\u0E37\u0E38\u0E39\u0E3A\u0E49\u0E4A\u0E4B\u20AC\u0E3F\u0E40\u0E41\u0E42\u0E43\u0E44\u0E45\u0E46\u0E47\u0E48\u0E49\u0E4A\u0E4B\u0E4C\u0E4D\u0E4E\u0E4F\u0E50\u0E51\u0E52\u0E53\u0E54\u0E55\u0E56\u0E57\u0E58\u0E59\u0E5A\u0E5B\xA2\xAC\xA6\xA0"
      },
      "ibm1161": "cp1161",
      "csibm1161": "cp1161",
      "cp1162": {
        "type": "_sbcs",
        "chars": "\u20AC\x81\x82\x83\x84\u2026\x86\x87\x88\x89\x8A\x8B\x8C\x8D\x8E\x8F\x90\u2018\u2019\u201C\u201D\u2022\u2013\u2014\x98\x99\x9A\x9B\x9C\x9D\x9E\x9F\xA0\u0E01\u0E02\u0E03\u0E04\u0E05\u0E06\u0E07\u0E08\u0E09\u0E0A\u0E0B\u0E0C\u0E0D\u0E0E\u0E0F\u0E10\u0E11\u0E12\u0E13\u0E14\u0E15\u0E16\u0E17\u0E18\u0E19\u0E1A\u0E1B\u0E1C\u0E1D\u0E1E\u0E1F\u0E20\u0E21\u0E22\u0E23\u0E24\u0E25\u0E26\u0E27\u0E28\u0E29\u0E2A\u0E2B\u0E2C\u0E2D\u0E2E\u0E2F\u0E30\u0E31\u0E32\u0E33\u0E34\u0E35\u0E36\u0E37\u0E38\u0E39\u0E3A\uFFFD\uFFFD\uFFFD\uFFFD\u0E3F\u0E40\u0E41\u0E42\u0E43\u0E44\u0E45\u0E46\u0E47\u0E48\u0E49\u0E4A\u0E4B\u0E4C\u0E4D\u0E4E\u0E4F\u0E50\u0E51\u0E52\u0E53\u0E54\u0E55\u0E56\u0E57\u0E58\u0E59\u0E5A\u0E5B\uFFFD\uFFFD\uFFFD\uFFFD"
      },
      "ibm1162": "cp1162",
      "csibm1162": "cp1162",
      "cp1163": {
        "type": "_sbcs",
        "chars": "\x80\x81\x82\x83\x84\x85\x86\x87\x88\x89\x8A\x8B\x8C\x8D\x8E\x8F\x90\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9A\x9B\x9C\x9D\x9E\x9F\xA0\xA1\xA2\xA3\u20AC\xA5\xA6\xA7\u0153\xA9\xAA\xAB\xAC\xAD\xAE\xAF\xB0\xB1\xB2\xB3\u0178\xB5\xB6\xB7\u0152\xB9\xBA\xBB\xBC\xBD\xBE\xBF\xC0\xC1\xC2\u0102\xC4\xC5\xC6\xC7\xC8\xC9\xCA\xCB\u0300\xCD\xCE\xCF\u0110\xD1\u0309\xD3\xD4\u01A0\xD6\xD7\xD8\xD9\xDA\xDB\xDC\u01AF\u0303\xDF\xE0\xE1\xE2\u0103\xE4\xE5\xE6\xE7\xE8\xE9\xEA\xEB\u0301\xED\xEE\xEF\u0111\xF1\u0323\xF3\xF4\u01A1\xF6\xF7\xF8\xF9\xFA\xFB\xFC\u01B0\u20AB\xFF"
      },
      "ibm1163": "cp1163",
      "csibm1163": "cp1163",
      "maccroatian": {
        "type": "_sbcs",
        "chars": "\xC4\xC5\xC7\xC9\xD1\xD6\xDC\xE1\xE0\xE2\xE4\xE3\xE5\xE7\xE9\xE8\xEA\xEB\xED\xEC\xEE\xEF\xF1\xF3\xF2\xF4\xF6\xF5\xFA\xF9\xFB\xFC\u2020\xB0\xA2\xA3\xA7\u2022\xB6\xDF\xAE\u0160\u2122\xB4\xA8\u2260\u017D\xD8\u221E\xB1\u2264\u2265\u2206\xB5\u2202\u2211\u220F\u0161\u222B\xAA\xBA\u2126\u017E\xF8\xBF\xA1\xAC\u221A\u0192\u2248\u0106\xAB\u010C\u2026\xA0\xC0\xC3\xD5\u0152\u0153\u0110\u2014\u201C\u201D\u2018\u2019\xF7\u25CA\uFFFD\xA9\u2044\xA4\u2039\u203A\xC6\xBB\u2013\xB7\u201A\u201E\u2030\xC2\u0107\xC1\u010D\xC8\xCD\xCE\xCF\xCC\xD3\xD4\u0111\xD2\xDA\xDB\xD9\u0131\u02C6\u02DC\xAF\u03C0\xCB\u02DA\xB8\xCA\xE6\u02C7"
      },
      "maccyrillic": {
        "type": "_sbcs",
        "chars": "\u0410\u0411\u0412\u0413\u0414\u0415\u0416\u0417\u0418\u0419\u041A\u041B\u041C\u041D\u041E\u041F\u0420\u0421\u0422\u0423\u0424\u0425\u0426\u0427\u0428\u0429\u042A\u042B\u042C\u042D\u042E\u042F\u2020\xB0\xA2\xA3\xA7\u2022\xB6\u0406\xAE\xA9\u2122\u0402\u0452\u2260\u0403\u0453\u221E\xB1\u2264\u2265\u0456\xB5\u2202\u0408\u0404\u0454\u0407\u0457\u0409\u0459\u040A\u045A\u0458\u0405\xAC\u221A\u0192\u2248\u2206\xAB\xBB\u2026\xA0\u040B\u045B\u040C\u045C\u0455\u2013\u2014\u201C\u201D\u2018\u2019\xF7\u201E\u040E\u045E\u040F\u045F\u2116\u0401\u0451\u044F\u0430\u0431\u0432\u0433\u0434\u0435\u0436\u0437\u0438\u0439\u043A\u043B\u043C\u043D\u043E\u043F\u0440\u0441\u0442\u0443\u0444\u0445\u0446\u0447\u0448\u0449\u044A\u044B\u044C\u044D\u044E\xA4"
      },
      "macgreek": {
        "type": "_sbcs",
        "chars": "\xC4\xB9\xB2\xC9\xB3\xD6\xDC\u0385\xE0\xE2\xE4\u0384\xA8\xE7\xE9\xE8\xEA\xEB\xA3\u2122\xEE\xEF\u2022\xBD\u2030\xF4\xF6\xA6\xAD\xF9\xFB\xFC\u2020\u0393\u0394\u0398\u039B\u039E\u03A0\xDF\xAE\xA9\u03A3\u03AA\xA7\u2260\xB0\u0387\u0391\xB1\u2264\u2265\xA5\u0392\u0395\u0396\u0397\u0399\u039A\u039C\u03A6\u03AB\u03A8\u03A9\u03AC\u039D\xAC\u039F\u03A1\u2248\u03A4\xAB\xBB\u2026\xA0\u03A5\u03A7\u0386\u0388\u0153\u2013\u2015\u201C\u201D\u2018\u2019\xF7\u0389\u038A\u038C\u038E\u03AD\u03AE\u03AF\u03CC\u038F\u03CD\u03B1\u03B2\u03C8\u03B4\u03B5\u03C6\u03B3\u03B7\u03B9\u03BE\u03BA\u03BB\u03BC\u03BD\u03BF\u03C0\u03CE\u03C1\u03C3\u03C4\u03B8\u03C9\u03C2\u03C7\u03C5\u03B6\u03CA\u03CB\u0390\u03B0\uFFFD"
      },
      "maciceland": {
        "type": "_sbcs",
        "chars": "\xC4\xC5\xC7\xC9\xD1\xD6\xDC\xE1\xE0\xE2\xE4\xE3\xE5\xE7\xE9\xE8\xEA\xEB\xED\xEC\xEE\xEF\xF1\xF3\xF2\xF4\xF6\xF5\xFA\xF9\xFB\xFC\xDD\xB0\xA2\xA3\xA7\u2022\xB6\xDF\xAE\xA9\u2122\xB4\xA8\u2260\xC6\xD8\u221E\xB1\u2264\u2265\xA5\xB5\u2202\u2211\u220F\u03C0\u222B\xAA\xBA\u2126\xE6\xF8\xBF\xA1\xAC\u221A\u0192\u2248\u2206\xAB\xBB\u2026\xA0\xC0\xC3\xD5\u0152\u0153\u2013\u2014\u201C\u201D\u2018\u2019\xF7\u25CA\xFF\u0178\u2044\xA4\xD0\xF0\xDE\xFE\xFD\xB7\u201A\u201E\u2030\xC2\xCA\xC1\xCB\xC8\xCD\xCE\xCF\xCC\xD3\xD4\uFFFD\xD2\xDA\xDB\xD9\u0131\u02C6\u02DC\xAF\u02D8\u02D9\u02DA\xB8\u02DD\u02DB\u02C7"
      },
      "macroman": {
        "type": "_sbcs",
        "chars": "\xC4\xC5\xC7\xC9\xD1\xD6\xDC\xE1\xE0\xE2\xE4\xE3\xE5\xE7\xE9\xE8\xEA\xEB\xED\xEC\xEE\xEF\xF1\xF3\xF2\xF4\xF6\xF5\xFA\xF9\xFB\xFC\u2020\xB0\xA2\xA3\xA7\u2022\xB6\xDF\xAE\xA9\u2122\xB4\xA8\u2260\xC6\xD8\u221E\xB1\u2264\u2265\xA5\xB5\u2202\u2211\u220F\u03C0\u222B\xAA\xBA\u2126\xE6\xF8\xBF\xA1\xAC\u221A\u0192\u2248\u2206\xAB\xBB\u2026\xA0\xC0\xC3\xD5\u0152\u0153\u2013\u2014\u201C\u201D\u2018\u2019\xF7\u25CA\xFF\u0178\u2044\xA4\u2039\u203A\uFB01\uFB02\u2021\xB7\u201A\u201E\u2030\xC2\xCA\xC1\xCB\xC8\xCD\xCE\xCF\xCC\xD3\xD4\uFFFD\xD2\xDA\xDB\xD9\u0131\u02C6\u02DC\xAF\u02D8\u02D9\u02DA\xB8\u02DD\u02DB\u02C7"
      },
      "macromania": {
        "type": "_sbcs",
        "chars": "\xC4\xC5\xC7\xC9\xD1\xD6\xDC\xE1\xE0\xE2\xE4\xE3\xE5\xE7\xE9\xE8\xEA\xEB\xED\xEC\xEE\xEF\xF1\xF3\xF2\xF4\xF6\xF5\xFA\xF9\xFB\xFC\u2020\xB0\xA2\xA3\xA7\u2022\xB6\xDF\xAE\xA9\u2122\xB4\xA8\u2260\u0102\u015E\u221E\xB1\u2264\u2265\xA5\xB5\u2202\u2211\u220F\u03C0\u222B\xAA\xBA\u2126\u0103\u015F\xBF\xA1\xAC\u221A\u0192\u2248\u2206\xAB\xBB\u2026\xA0\xC0\xC3\xD5\u0152\u0153\u2013\u2014\u201C\u201D\u2018\u2019\xF7\u25CA\xFF\u0178\u2044\xA4\u2039\u203A\u0162\u0163\u2021\xB7\u201A\u201E\u2030\xC2\xCA\xC1\xCB\xC8\xCD\xCE\xCF\xCC\xD3\xD4\uFFFD\xD2\xDA\xDB\xD9\u0131\u02C6\u02DC\xAF\u02D8\u02D9\u02DA\xB8\u02DD\u02DB\u02C7"
      },
      "macthai": {
        "type": "_sbcs",
        "chars": "\xAB\xBB\u2026\uF88C\uF88F\uF892\uF895\uF898\uF88B\uF88E\uF891\uF894\uF897\u201C\u201D\uF899\uFFFD\u2022\uF884\uF889\uF885\uF886\uF887\uF888\uF88A\uF88D\uF890\uF893\uF896\u2018\u2019\uFFFD\xA0\u0E01\u0E02\u0E03\u0E04\u0E05\u0E06\u0E07\u0E08\u0E09\u0E0A\u0E0B\u0E0C\u0E0D\u0E0E\u0E0F\u0E10\u0E11\u0E12\u0E13\u0E14\u0E15\u0E16\u0E17\u0E18\u0E19\u0E1A\u0E1B\u0E1C\u0E1D\u0E1E\u0E1F\u0E20\u0E21\u0E22\u0E23\u0E24\u0E25\u0E26\u0E27\u0E28\u0E29\u0E2A\u0E2B\u0E2C\u0E2D\u0E2E\u0E2F\u0E30\u0E31\u0E32\u0E33\u0E34\u0E35\u0E36\u0E37\u0E38\u0E39\u0E3A\uFEFF\u200B\u2013\u2014\u0E3F\u0E40\u0E41\u0E42\u0E43\u0E44\u0E45\u0E46\u0E47\u0E48\u0E49\u0E4A\u0E4B\u0E4C\u0E4D\u2122\u0E4F\u0E50\u0E51\u0E52\u0E53\u0E54\u0E55\u0E56\u0E57\u0E58\u0E59\xAE\xA9\uFFFD\uFFFD\uFFFD\uFFFD"
      },
      "macturkish": {
        "type": "_sbcs",
        "chars": "\xC4\xC5\xC7\xC9\xD1\xD6\xDC\xE1\xE0\xE2\xE4\xE3\xE5\xE7\xE9\xE8\xEA\xEB\xED\xEC\xEE\xEF\xF1\xF3\xF2\xF4\xF6\xF5\xFA\xF9\xFB\xFC\u2020\xB0\xA2\xA3\xA7\u2022\xB6\xDF\xAE\xA9\u2122\xB4\xA8\u2260\xC6\xD8\u221E\xB1\u2264\u2265\xA5\xB5\u2202\u2211\u220F\u03C0\u222B\xAA\xBA\u2126\xE6\xF8\xBF\xA1\xAC\u221A\u0192\u2248\u2206\xAB\xBB\u2026\xA0\xC0\xC3\xD5\u0152\u0153\u2013\u2014\u201C\u201D\u2018\u2019\xF7\u25CA\xFF\u0178\u011E\u011F\u0130\u0131\u015E\u015F\u2021\xB7\u201A\u201E\u2030\xC2\xCA\xC1\xCB\xC8\xCD\xCE\xCF\xCC\xD3\xD4\uFFFD\xD2\xDA\xDB\xD9\uFFFD\u02C6\u02DC\xAF\u02D8\u02D9\u02DA\xB8\u02DD\u02DB\u02C7"
      },
      "macukraine": {
        "type": "_sbcs",
        "chars": "\u0410\u0411\u0412\u0413\u0414\u0415\u0416\u0417\u0418\u0419\u041A\u041B\u041C\u041D\u041E\u041F\u0420\u0421\u0422\u0423\u0424\u0425\u0426\u0427\u0428\u0429\u042A\u042B\u042C\u042D\u042E\u042F\u2020\xB0\u0490\xA3\xA7\u2022\xB6\u0406\xAE\xA9\u2122\u0402\u0452\u2260\u0403\u0453\u221E\xB1\u2264\u2265\u0456\xB5\u0491\u0408\u0404\u0454\u0407\u0457\u0409\u0459\u040A\u045A\u0458\u0405\xAC\u221A\u0192\u2248\u2206\xAB\xBB\u2026\xA0\u040B\u045B\u040C\u045C\u0455\u2013\u2014\u201C\u201D\u2018\u2019\xF7\u201E\u040E\u045E\u040F\u045F\u2116\u0401\u0451\u044F\u0430\u0431\u0432\u0433\u0434\u0435\u0436\u0437\u0438\u0439\u043A\u043B\u043C\u043D\u043E\u043F\u0440\u0441\u0442\u0443\u0444\u0445\u0446\u0447\u0448\u0449\u044A\u044B\u044C\u044D\u044E\xA4"
      },
      "koi8r": {
        "type": "_sbcs",
        "chars": "\u2500\u2502\u250C\u2510\u2514\u2518\u251C\u2524\u252C\u2534\u253C\u2580\u2584\u2588\u258C\u2590\u2591\u2592\u2593\u2320\u25A0\u2219\u221A\u2248\u2264\u2265\xA0\u2321\xB0\xB2\xB7\xF7\u2550\u2551\u2552\u0451\u2553\u2554\u2555\u2556\u2557\u2558\u2559\u255A\u255B\u255C\u255D\u255E\u255F\u2560\u2561\u0401\u2562\u2563\u2564\u2565\u2566\u2567\u2568\u2569\u256A\u256B\u256C\xA9\u044E\u0430\u0431\u0446\u0434\u0435\u0444\u0433\u0445\u0438\u0439\u043A\u043B\u043C\u043D\u043E\u043F\u044F\u0440\u0441\u0442\u0443\u0436\u0432\u044C\u044B\u0437\u0448\u044D\u0449\u0447\u044A\u042E\u0410\u0411\u0426\u0414\u0415\u0424\u0413\u0425\u0418\u0419\u041A\u041B\u041C\u041D\u041E\u041F\u042F\u0420\u0421\u0422\u0423\u0416\u0412\u042C\u042B\u0417\u0428\u042D\u0429\u0427\u042A"
      },
      "koi8u": {
        "type": "_sbcs",
        "chars": "\u2500\u2502\u250C\u2510\u2514\u2518\u251C\u2524\u252C\u2534\u253C\u2580\u2584\u2588\u258C\u2590\u2591\u2592\u2593\u2320\u25A0\u2219\u221A\u2248\u2264\u2265\xA0\u2321\xB0\xB2\xB7\xF7\u2550\u2551\u2552\u0451\u0454\u2554\u0456\u0457\u2557\u2558\u2559\u255A\u255B\u0491\u255D\u255E\u255F\u2560\u2561\u0401\u0404\u2563\u0406\u0407\u2566\u2567\u2568\u2569\u256A\u0490\u256C\xA9\u044E\u0430\u0431\u0446\u0434\u0435\u0444\u0433\u0445\u0438\u0439\u043A\u043B\u043C\u043D\u043E\u043F\u044F\u0440\u0441\u0442\u0443\u0436\u0432\u044C\u044B\u0437\u0448\u044D\u0449\u0447\u044A\u042E\u0410\u0411\u0426\u0414\u0415\u0424\u0413\u0425\u0418\u0419\u041A\u041B\u041C\u041D\u041E\u041F\u042F\u0420\u0421\u0422\u0423\u0416\u0412\u042C\u042B\u0417\u0428\u042D\u0429\u0427\u042A"
      },
      "koi8ru": {
        "type": "_sbcs",
        "chars": "\u2500\u2502\u250C\u2510\u2514\u2518\u251C\u2524\u252C\u2534\u253C\u2580\u2584\u2588\u258C\u2590\u2591\u2592\u2593\u2320\u25A0\u2219\u221A\u2248\u2264\u2265\xA0\u2321\xB0\xB2\xB7\xF7\u2550\u2551\u2552\u0451\u0454\u2554\u0456\u0457\u2557\u2558\u2559\u255A\u255B\u0491\u045E\u255E\u255F\u2560\u2561\u0401\u0404\u2563\u0406\u0407\u2566\u2567\u2568\u2569\u256A\u0490\u040E\xA9\u044E\u0430\u0431\u0446\u0434\u0435\u0444\u0433\u0445\u0438\u0439\u043A\u043B\u043C\u043D\u043E\u043F\u044F\u0440\u0441\u0442\u0443\u0436\u0432\u044C\u044B\u0437\u0448\u044D\u0449\u0447\u044A\u042E\u0410\u0411\u0426\u0414\u0415\u0424\u0413\u0425\u0418\u0419\u041A\u041B\u041C\u041D\u041E\u041F\u042F\u0420\u0421\u0422\u0423\u0416\u0412\u042C\u042B\u0417\u0428\u042D\u0429\u0427\u042A"
      },
      "koi8t": {
        "type": "_sbcs",
        "chars": "\u049B\u0493\u201A\u0492\u201E\u2026\u2020\u2021\uFFFD\u2030\u04B3\u2039\u04B2\u04B7\u04B6\uFFFD\u049A\u2018\u2019\u201C\u201D\u2022\u2013\u2014\uFFFD\u2122\uFFFD\u203A\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\u04EF\u04EE\u0451\xA4\u04E3\xA6\xA7\uFFFD\uFFFD\uFFFD\xAB\xAC\xAD\xAE\uFFFD\xB0\xB1\xB2\u0401\uFFFD\u04E2\xB6\xB7\uFFFD\u2116\uFFFD\xBB\uFFFD\uFFFD\uFFFD\xA9\u044E\u0430\u0431\u0446\u0434\u0435\u0444\u0433\u0445\u0438\u0439\u043A\u043B\u043C\u043D\u043E\u043F\u044F\u0440\u0441\u0442\u0443\u0436\u0432\u044C\u044B\u0437\u0448\u044D\u0449\u0447\u044A\u042E\u0410\u0411\u0426\u0414\u0415\u0424\u0413\u0425\u0418\u0419\u041A\u041B\u041C\u041D\u041E\u041F\u042F\u0420\u0421\u0422\u0423\u0416\u0412\u042C\u042B\u0417\u0428\u042D\u0429\u0427\u042A"
      },
      "armscii8": {
        "type": "_sbcs",
        "chars": "\x80\x81\x82\x83\x84\x85\x86\x87\x88\x89\x8A\x8B\x8C\x8D\x8E\x8F\x90\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9A\x9B\x9C\x9D\x9E\x9F\xA0\uFFFD\u0587\u0589)(\xBB\xAB\u2014.\u055D,-\u058A\u2026\u055C\u055B\u055E\u0531\u0561\u0532\u0562\u0533\u0563\u0534\u0564\u0535\u0565\u0536\u0566\u0537\u0567\u0538\u0568\u0539\u0569\u053A\u056A\u053B\u056B\u053C\u056C\u053D\u056D\u053E\u056E\u053F\u056F\u0540\u0570\u0541\u0571\u0542\u0572\u0543\u0573\u0544\u0574\u0545\u0575\u0546\u0576\u0547\u0577\u0548\u0578\u0549\u0579\u054A\u057A\u054B\u057B\u054C\u057C\u054D\u057D\u054E\u057E\u054F\u057F\u0550\u0580\u0551\u0581\u0552\u0582\u0553\u0583\u0554\u0584\u0555\u0585\u0556\u0586\u055A\uFFFD"
      },
      "rk1048": {
        "type": "_sbcs",
        "chars": "\u0402\u0403\u201A\u0453\u201E\u2026\u2020\u2021\u20AC\u2030\u0409\u2039\u040A\u049A\u04BA\u040F\u0452\u2018\u2019\u201C\u201D\u2022\u2013\u2014\uFFFD\u2122\u0459\u203A\u045A\u049B\u04BB\u045F\xA0\u04B0\u04B1\u04D8\xA4\u04E8\xA6\xA7\u0401\xA9\u0492\xAB\xAC\xAD\xAE\u04AE\xB0\xB1\u0406\u0456\u04E9\xB5\xB6\xB7\u0451\u2116\u0493\xBB\u04D9\u04A2\u04A3\u04AF\u0410\u0411\u0412\u0413\u0414\u0415\u0416\u0417\u0418\u0419\u041A\u041B\u041C\u041D\u041E\u041F\u0420\u0421\u0422\u0423\u0424\u0425\u0426\u0427\u0428\u0429\u042A\u042B\u042C\u042D\u042E\u042F\u0430\u0431\u0432\u0433\u0434\u0435\u0436\u0437\u0438\u0439\u043A\u043B\u043C\u043D\u043E\u043F\u0440\u0441\u0442\u0443\u0444\u0445\u0446\u0447\u0448\u0449\u044A\u044B\u044C\u044D\u044E\u044F"
      },
      "tcvn": {
        "type": "_sbcs",
        "chars": "\0\xDA\u1EE4\u1EEA\u1EEC\u1EEE\x07\b	\n\v\f\r\u1EE8\u1EF0\u1EF2\u1EF6\u1EF8\xDD\u1EF4\x1B !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~\x7F\xC0\u1EA2\xC3\xC1\u1EA0\u1EB6\u1EAC\xC8\u1EBA\u1EBC\xC9\u1EB8\u1EC6\xCC\u1EC8\u0128\xCD\u1ECA\xD2\u1ECE\xD5\xD3\u1ECC\u1ED8\u1EDC\u1EDE\u1EE0\u1EDA\u1EE2\xD9\u1EE6\u0168\xA0\u0102\xC2\xCA\xD4\u01A0\u01AF\u0110\u0103\xE2\xEA\xF4\u01A1\u01B0\u0111\u1EB0\u0300\u0309\u0303\u0301\u0323\xE0\u1EA3\xE3\xE1\u1EA1\u1EB2\u1EB1\u1EB3\u1EB5\u1EAF\u1EB4\u1EAE\u1EA6\u1EA8\u1EAA\u1EA4\u1EC0\u1EB7\u1EA7\u1EA9\u1EAB\u1EA5\u1EAD\xE8\u1EC2\u1EBB\u1EBD\xE9\u1EB9\u1EC1\u1EC3\u1EC5\u1EBF\u1EC7\xEC\u1EC9\u1EC4\u1EBE\u1ED2\u0129\xED\u1ECB\xF2\u1ED4\u1ECF\xF5\xF3\u1ECD\u1ED3\u1ED5\u1ED7\u1ED1\u1ED9\u1EDD\u1EDF\u1EE1\u1EDB\u1EE3\xF9\u1ED6\u1EE7\u0169\xFA\u1EE5\u1EEB\u1EED\u1EEF\u1EE9\u1EF1\u1EF3\u1EF7\u1EF9\xFD\u1EF5\u1ED0"
      },
      "georgianacademy": {
        "type": "_sbcs",
        "chars": "\x80\x81\u201A\u0192\u201E\u2026\u2020\u2021\u02C6\u2030\u0160\u2039\u0152\x8D\x8E\x8F\x90\u2018\u2019\u201C\u201D\u2022\u2013\u2014\u02DC\u2122\u0161\u203A\u0153\x9D\x9E\u0178\xA0\xA1\xA2\xA3\xA4\xA5\xA6\xA7\xA8\xA9\xAA\xAB\xAC\xAD\xAE\xAF\xB0\xB1\xB2\xB3\xB4\xB5\xB6\xB7\xB8\xB9\xBA\xBB\xBC\xBD\xBE\xBF\u10D0\u10D1\u10D2\u10D3\u10D4\u10D5\u10D6\u10D7\u10D8\u10D9\u10DA\u10DB\u10DC\u10DD\u10DE\u10DF\u10E0\u10E1\u10E2\u10E3\u10E4\u10E5\u10E6\u10E7\u10E8\u10E9\u10EA\u10EB\u10EC\u10ED\u10EE\u10EF\u10F0\u10F1\u10F2\u10F3\u10F4\u10F5\u10F6\xE7\xE8\xE9\xEA\xEB\xEC\xED\xEE\xEF\xF0\xF1\xF2\xF3\xF4\xF5\xF6\xF7\xF8\xF9\xFA\xFB\xFC\xFD\xFE\xFF"
      },
      "georgianps": {
        "type": "_sbcs",
        "chars": "\x80\x81\u201A\u0192\u201E\u2026\u2020\u2021\u02C6\u2030\u0160\u2039\u0152\x8D\x8E\x8F\x90\u2018\u2019\u201C\u201D\u2022\u2013\u2014\u02DC\u2122\u0161\u203A\u0153\x9D\x9E\u0178\xA0\xA1\xA2\xA3\xA4\xA5\xA6\xA7\xA8\xA9\xAA\xAB\xAC\xAD\xAE\xAF\xB0\xB1\xB2\xB3\xB4\xB5\xB6\xB7\xB8\xB9\xBA\xBB\xBC\xBD\xBE\xBF\u10D0\u10D1\u10D2\u10D3\u10D4\u10D5\u10D6\u10F1\u10D7\u10D8\u10D9\u10DA\u10DB\u10DC\u10F2\u10DD\u10DE\u10DF\u10E0\u10E1\u10E2\u10F3\u10E3\u10E4\u10E5\u10E6\u10E7\u10E8\u10E9\u10EA\u10EB\u10EC\u10ED\u10EE\u10F4\u10EF\u10F0\u10F5\xE6\xE7\xE8\xE9\xEA\xEB\xEC\xED\xEE\xEF\xF0\xF1\xF2\xF3\xF4\xF5\xF6\xF7\xF8\xF9\xFA\xFB\xFC\xFD\xFE\xFF"
      },
      "pt154": {
        "type": "_sbcs",
        "chars": "\u0496\u0492\u04EE\u0493\u201E\u2026\u04B6\u04AE\u04B2\u04AF\u04A0\u04E2\u04A2\u049A\u04BA\u04B8\u0497\u2018\u2019\u201C\u201D\u2022\u2013\u2014\u04B3\u04B7\u04A1\u04E3\u04A3\u049B\u04BB\u04B9\xA0\u040E\u045E\u0408\u04E8\u0498\u04B0\xA7\u0401\xA9\u04D8\xAB\xAC\u04EF\xAE\u049C\xB0\u04B1\u0406\u0456\u0499\u04E9\xB6\xB7\u0451\u2116\u04D9\xBB\u0458\u04AA\u04AB\u049D\u0410\u0411\u0412\u0413\u0414\u0415\u0416\u0417\u0418\u0419\u041A\u041B\u041C\u041D\u041E\u041F\u0420\u0421\u0422\u0423\u0424\u0425\u0426\u0427\u0428\u0429\u042A\u042B\u042C\u042D\u042E\u042F\u0430\u0431\u0432\u0433\u0434\u0435\u0436\u0437\u0438\u0439\u043A\u043B\u043C\u043D\u043E\u043F\u0440\u0441\u0442\u0443\u0444\u0445\u0446\u0447\u0448\u0449\u044A\u044B\u044C\u044D\u044E\u044F"
      },
      "viscii": {
        "type": "_sbcs",
        "chars": "\0\u1EB2\u1EB4\u1EAA\x07\b	\n\v\f\r\u1EF6\u1EF8\x1B\u1EF4 !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~\x7F\u1EA0\u1EAE\u1EB0\u1EB6\u1EA4\u1EA6\u1EA8\u1EAC\u1EBC\u1EB8\u1EBE\u1EC0\u1EC2\u1EC4\u1EC6\u1ED0\u1ED2\u1ED4\u1ED6\u1ED8\u1EE2\u1EDA\u1EDC\u1EDE\u1ECA\u1ECE\u1ECC\u1EC8\u1EE6\u0168\u1EE4\u1EF2\xD5\u1EAF\u1EB1\u1EB7\u1EA5\u1EA7\u1EA9\u1EAD\u1EBD\u1EB9\u1EBF\u1EC1\u1EC3\u1EC5\u1EC7\u1ED1\u1ED3\u1ED5\u1ED7\u1EE0\u01A0\u1ED9\u1EDD\u1EDF\u1ECB\u1EF0\u1EE8\u1EEA\u1EEC\u01A1\u1EDB\u01AF\xC0\xC1\xC2\xC3\u1EA2\u0102\u1EB3\u1EB5\xC8\xC9\xCA\u1EBA\xCC\xCD\u0128\u1EF3\u0110\u1EE9\xD2\xD3\xD4\u1EA1\u1EF7\u1EEB\u1EED\xD9\xDA\u1EF9\u1EF5\xDD\u1EE1\u01B0\xE0\xE1\xE2\xE3\u1EA3\u0103\u1EEF\u1EAB\xE8\xE9\xEA\u1EBB\xEC\xED\u0129\u1EC9\u0111\u1EF1\xF2\xF3\xF4\xF5\u1ECF\u1ECD\u1EE5\xF9\xFA\u0169\u1EE7\xFD\u1EE3\u1EEE"
      },
      "iso646cn": {
        "type": "_sbcs",
        "chars": "\0\x07\b	\n\v\f\r\x1B !\"#\xA5%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}\u203E\x7F\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD"
      },
      "iso646jp": {
        "type": "_sbcs",
        "chars": "\0\x07\b	\n\v\f\r\x1B !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\xA5]^_`abcdefghijklmnopqrstuvwxyz{|}\u203E\x7F\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD"
      },
      "hproman8": {
        "type": "_sbcs",
        "chars": "\x80\x81\x82\x83\x84\x85\x86\x87\x88\x89\x8A\x8B\x8C\x8D\x8E\x8F\x90\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9A\x9B\x9C\x9D\x9E\x9F\xA0\xC0\xC2\xC8\xCA\xCB\xCE\xCF\xB4\u02CB\u02C6\xA8\u02DC\xD9\xDB\u20A4\xAF\xDD\xFD\xB0\xC7\xE7\xD1\xF1\xA1\xBF\xA4\xA3\xA5\xA7\u0192\xA2\xE2\xEA\xF4\xFB\xE1\xE9\xF3\xFA\xE0\xE8\xF2\xF9\xE4\xEB\xF6\xFC\xC5\xEE\xD8\xC6\xE5\xED\xF8\xE6\xC4\xEC\xD6\xDC\xC9\xEF\xDF\xD4\xC1\xC3\xE3\xD0\xF0\xCD\xCC\xD3\xD2\xD5\xF5\u0160\u0161\xDA\u0178\xFF\xDE\xFE\xB7\xB5\xB6\xBE\u2014\xBC\xBD\xAA\xBA\xAB\u25A0\xBB\xB1\uFFFD"
      },
      "macintosh": {
        "type": "_sbcs",
        "chars": "\xC4\xC5\xC7\xC9\xD1\xD6\xDC\xE1\xE0\xE2\xE4\xE3\xE5\xE7\xE9\xE8\xEA\xEB\xED\xEC\xEE\xEF\xF1\xF3\xF2\xF4\xF6\xF5\xFA\xF9\xFB\xFC\u2020\xB0\xA2\xA3\xA7\u2022\xB6\xDF\xAE\xA9\u2122\xB4\xA8\u2260\xC6\xD8\u221E\xB1\u2264\u2265\xA5\xB5\u2202\u2211\u220F\u03C0\u222B\xAA\xBA\u2126\xE6\xF8\xBF\xA1\xAC\u221A\u0192\u2248\u2206\xAB\xBB\u2026\xA0\xC0\xC3\xD5\u0152\u0153\u2013\u2014\u201C\u201D\u2018\u2019\xF7\u25CA\xFF\u0178\u2044\xA4\u2039\u203A\uFB01\uFB02\u2021\xB7\u201A\u201E\u2030\xC2\xCA\xC1\xCB\xC8\xCD\xCE\xCF\xCC\xD3\xD4\uFFFD\xD2\xDA\xDB\xD9\u0131\u02C6\u02DC\xAF\u02D8\u02D9\u02DA\xB8\u02DD\u02DB\u02C7"
      },
      "ascii": {
        "type": "_sbcs",
        "chars": "\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD"
      },
      "tis620": {
        "type": "_sbcs",
        "chars": "\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\u0E01\u0E02\u0E03\u0E04\u0E05\u0E06\u0E07\u0E08\u0E09\u0E0A\u0E0B\u0E0C\u0E0D\u0E0E\u0E0F\u0E10\u0E11\u0E12\u0E13\u0E14\u0E15\u0E16\u0E17\u0E18\u0E19\u0E1A\u0E1B\u0E1C\u0E1D\u0E1E\u0E1F\u0E20\u0E21\u0E22\u0E23\u0E24\u0E25\u0E26\u0E27\u0E28\u0E29\u0E2A\u0E2B\u0E2C\u0E2D\u0E2E\u0E2F\u0E30\u0E31\u0E32\u0E33\u0E34\u0E35\u0E36\u0E37\u0E38\u0E39\u0E3A\uFFFD\uFFFD\uFFFD\uFFFD\u0E3F\u0E40\u0E41\u0E42\u0E43\u0E44\u0E45\u0E46\u0E47\u0E48\u0E49\u0E4A\u0E4B\u0E4C\u0E4D\u0E4E\u0E4F\u0E50\u0E51\u0E52\u0E53\u0E54\u0E55\u0E56\u0E57\u0E58\u0E59\u0E5A\u0E5B\uFFFD\uFFFD\uFFFD\uFFFD"
      }
    };
  }
});

// ../../../node_modules/encoding/node_modules/iconv-lite/encodings/dbcs-codec.js
var require_dbcs_codec = __commonJS({
  "../../../node_modules/encoding/node_modules/iconv-lite/encodings/dbcs-codec.js"(exports) {
    "use strict";
    var Buffer2 = require_safer().Buffer;
    exports._dbcs = DBCSCodec;
    var UNASSIGNED = -1;
    var GB18030_CODE = -2;
    var SEQ_START = -10;
    var NODE_START = -1e3;
    var UNASSIGNED_NODE = new Array(256);
    var DEF_CHAR = -1;
    for (i = 0; i < 256; i++)
      UNASSIGNED_NODE[i] = UNASSIGNED;
    var i;
    function DBCSCodec(codecOptions, iconv) {
      this.encodingName = codecOptions.encodingName;
      if (!codecOptions)
        throw new Error("DBCS codec is called without the data.");
      if (!codecOptions.table)
        throw new Error("Encoding '" + this.encodingName + "' has no data.");
      var mappingTable = codecOptions.table();
      this.decodeTables = [];
      this.decodeTables[0] = UNASSIGNED_NODE.slice(0);
      this.decodeTableSeq = [];
      for (var i2 = 0; i2 < mappingTable.length; i2++)
        this._addDecodeChunk(mappingTable[i2]);
      if (typeof codecOptions.gb18030 === "function") {
        this.gb18030 = codecOptions.gb18030();
        var commonThirdByteNodeIdx = this.decodeTables.length;
        this.decodeTables.push(UNASSIGNED_NODE.slice(0));
        var commonFourthByteNodeIdx = this.decodeTables.length;
        this.decodeTables.push(UNASSIGNED_NODE.slice(0));
        var firstByteNode = this.decodeTables[0];
        for (var i2 = 129; i2 <= 254; i2++) {
          var secondByteNode = this.decodeTables[NODE_START - firstByteNode[i2]];
          for (var j = 48; j <= 57; j++) {
            if (secondByteNode[j] === UNASSIGNED) {
              secondByteNode[j] = NODE_START - commonThirdByteNodeIdx;
            } else if (secondByteNode[j] > NODE_START) {
              throw new Error("gb18030 decode tables conflict at byte 2");
            }
            var thirdByteNode = this.decodeTables[NODE_START - secondByteNode[j]];
            for (var k = 129; k <= 254; k++) {
              if (thirdByteNode[k] === UNASSIGNED) {
                thirdByteNode[k] = NODE_START - commonFourthByteNodeIdx;
              } else if (thirdByteNode[k] === NODE_START - commonFourthByteNodeIdx) {
                continue;
              } else if (thirdByteNode[k] > NODE_START) {
                throw new Error("gb18030 decode tables conflict at byte 3");
              }
              var fourthByteNode = this.decodeTables[NODE_START - thirdByteNode[k]];
              for (var l = 48; l <= 57; l++) {
                if (fourthByteNode[l] === UNASSIGNED)
                  fourthByteNode[l] = GB18030_CODE;
              }
            }
          }
        }
      }
      this.defaultCharUnicode = iconv.defaultCharUnicode;
      this.encodeTable = [];
      this.encodeTableSeq = [];
      var skipEncodeChars = {};
      if (codecOptions.encodeSkipVals)
        for (var i2 = 0; i2 < codecOptions.encodeSkipVals.length; i2++) {
          var val = codecOptions.encodeSkipVals[i2];
          if (typeof val === "number")
            skipEncodeChars[val] = true;
          else
            for (var j = val.from; j <= val.to; j++)
              skipEncodeChars[j] = true;
        }
      this._fillEncodeTable(0, 0, skipEncodeChars);
      if (codecOptions.encodeAdd) {
        for (var uChar in codecOptions.encodeAdd)
          if (Object.prototype.hasOwnProperty.call(codecOptions.encodeAdd, uChar))
            this._setEncodeChar(uChar.charCodeAt(0), codecOptions.encodeAdd[uChar]);
      }
      this.defCharSB = this.encodeTable[0][iconv.defaultCharSingleByte.charCodeAt(0)];
      if (this.defCharSB === UNASSIGNED)
        this.defCharSB = this.encodeTable[0]["?"];
      if (this.defCharSB === UNASSIGNED)
        this.defCharSB = "?".charCodeAt(0);
    }
    DBCSCodec.prototype.encoder = DBCSEncoder;
    DBCSCodec.prototype.decoder = DBCSDecoder;
    DBCSCodec.prototype._getDecodeTrieNode = function(addr) {
      var bytes = [];
      for (; addr > 0; addr >>>= 8)
        bytes.push(addr & 255);
      if (bytes.length == 0)
        bytes.push(0);
      var node = this.decodeTables[0];
      for (var i2 = bytes.length - 1; i2 > 0; i2--) {
        var val = node[bytes[i2]];
        if (val == UNASSIGNED) {
          node[bytes[i2]] = NODE_START - this.decodeTables.length;
          this.decodeTables.push(node = UNASSIGNED_NODE.slice(0));
        } else if (val <= NODE_START) {
          node = this.decodeTables[NODE_START - val];
        } else
          throw new Error("Overwrite byte in " + this.encodingName + ", addr: " + addr.toString(16));
      }
      return node;
    };
    DBCSCodec.prototype._addDecodeChunk = function(chunk) {
      var curAddr = parseInt(chunk[0], 16);
      var writeTable = this._getDecodeTrieNode(curAddr);
      curAddr = curAddr & 255;
      for (var k = 1; k < chunk.length; k++) {
        var part = chunk[k];
        if (typeof part === "string") {
          for (var l = 0; l < part.length; ) {
            var code = part.charCodeAt(l++);
            if (55296 <= code && code < 56320) {
              var codeTrail = part.charCodeAt(l++);
              if (56320 <= codeTrail && codeTrail < 57344)
                writeTable[curAddr++] = 65536 + (code - 55296) * 1024 + (codeTrail - 56320);
              else
                throw new Error("Incorrect surrogate pair in " + this.encodingName + " at chunk " + chunk[0]);
            } else if (4080 < code && code <= 4095) {
              var len = 4095 - code + 2;
              var seq = [];
              for (var m = 0; m < len; m++)
                seq.push(part.charCodeAt(l++));
              writeTable[curAddr++] = SEQ_START - this.decodeTableSeq.length;
              this.decodeTableSeq.push(seq);
            } else
              writeTable[curAddr++] = code;
          }
        } else if (typeof part === "number") {
          var charCode = writeTable[curAddr - 1] + 1;
          for (var l = 0; l < part; l++)
            writeTable[curAddr++] = charCode++;
        } else
          throw new Error("Incorrect type '" + typeof part + "' given in " + this.encodingName + " at chunk " + chunk[0]);
      }
      if (curAddr > 255)
        throw new Error("Incorrect chunk in " + this.encodingName + " at addr " + chunk[0] + ": too long" + curAddr);
    };
    DBCSCodec.prototype._getEncodeBucket = function(uCode) {
      var high = uCode >> 8;
      if (this.encodeTable[high] === void 0)
        this.encodeTable[high] = UNASSIGNED_NODE.slice(0);
      return this.encodeTable[high];
    };
    DBCSCodec.prototype._setEncodeChar = function(uCode, dbcsCode) {
      var bucket = this._getEncodeBucket(uCode);
      var low = uCode & 255;
      if (bucket[low] <= SEQ_START)
        this.encodeTableSeq[SEQ_START - bucket[low]][DEF_CHAR] = dbcsCode;
      else if (bucket[low] == UNASSIGNED)
        bucket[low] = dbcsCode;
    };
    DBCSCodec.prototype._setEncodeSequence = function(seq, dbcsCode) {
      var uCode = seq[0];
      var bucket = this._getEncodeBucket(uCode);
      var low = uCode & 255;
      var node;
      if (bucket[low] <= SEQ_START) {
        node = this.encodeTableSeq[SEQ_START - bucket[low]];
      } else {
        node = {};
        if (bucket[low] !== UNASSIGNED)
          node[DEF_CHAR] = bucket[low];
        bucket[low] = SEQ_START - this.encodeTableSeq.length;
        this.encodeTableSeq.push(node);
      }
      for (var j = 1; j < seq.length - 1; j++) {
        var oldVal = node[uCode];
        if (typeof oldVal === "object")
          node = oldVal;
        else {
          node = node[uCode] = {};
          if (oldVal !== void 0)
            node[DEF_CHAR] = oldVal;
        }
      }
      uCode = seq[seq.length - 1];
      node[uCode] = dbcsCode;
    };
    DBCSCodec.prototype._fillEncodeTable = function(nodeIdx, prefix, skipEncodeChars) {
      var node = this.decodeTables[nodeIdx];
      var hasValues = false;
      var subNodeEmpty = {};
      for (var i2 = 0; i2 < 256; i2++) {
        var uCode = node[i2];
        var mbCode = prefix + i2;
        if (skipEncodeChars[mbCode])
          continue;
        if (uCode >= 0) {
          this._setEncodeChar(uCode, mbCode);
          hasValues = true;
        } else if (uCode <= NODE_START) {
          var subNodeIdx = NODE_START - uCode;
          if (!subNodeEmpty[subNodeIdx]) {
            var newPrefix = mbCode << 8 >>> 0;
            if (this._fillEncodeTable(subNodeIdx, newPrefix, skipEncodeChars))
              hasValues = true;
            else
              subNodeEmpty[subNodeIdx] = true;
          }
        } else if (uCode <= SEQ_START) {
          this._setEncodeSequence(this.decodeTableSeq[SEQ_START - uCode], mbCode);
          hasValues = true;
        }
      }
      return hasValues;
    };
    function DBCSEncoder(options, codec) {
      this.leadSurrogate = -1;
      this.seqObj = void 0;
      this.encodeTable = codec.encodeTable;
      this.encodeTableSeq = codec.encodeTableSeq;
      this.defaultCharSingleByte = codec.defCharSB;
      this.gb18030 = codec.gb18030;
    }
    DBCSEncoder.prototype.write = function(str) {
      var newBuf = Buffer2.alloc(str.length * (this.gb18030 ? 4 : 3)), leadSurrogate = this.leadSurrogate, seqObj = this.seqObj, nextChar = -1, i2 = 0, j = 0;
      while (true) {
        if (nextChar === -1) {
          if (i2 == str.length)
            break;
          var uCode = str.charCodeAt(i2++);
        } else {
          var uCode = nextChar;
          nextChar = -1;
        }
        if (55296 <= uCode && uCode < 57344) {
          if (uCode < 56320) {
            if (leadSurrogate === -1) {
              leadSurrogate = uCode;
              continue;
            } else {
              leadSurrogate = uCode;
              uCode = UNASSIGNED;
            }
          } else {
            if (leadSurrogate !== -1) {
              uCode = 65536 + (leadSurrogate - 55296) * 1024 + (uCode - 56320);
              leadSurrogate = -1;
            } else {
              uCode = UNASSIGNED;
            }
          }
        } else if (leadSurrogate !== -1) {
          nextChar = uCode;
          uCode = UNASSIGNED;
          leadSurrogate = -1;
        }
        var dbcsCode = UNASSIGNED;
        if (seqObj !== void 0 && uCode != UNASSIGNED) {
          var resCode = seqObj[uCode];
          if (typeof resCode === "object") {
            seqObj = resCode;
            continue;
          } else if (typeof resCode == "number") {
            dbcsCode = resCode;
          } else if (resCode == void 0) {
            resCode = seqObj[DEF_CHAR];
            if (resCode !== void 0) {
              dbcsCode = resCode;
              nextChar = uCode;
            } else {
            }
          }
          seqObj = void 0;
        } else if (uCode >= 0) {
          var subtable = this.encodeTable[uCode >> 8];
          if (subtable !== void 0)
            dbcsCode = subtable[uCode & 255];
          if (dbcsCode <= SEQ_START) {
            seqObj = this.encodeTableSeq[SEQ_START - dbcsCode];
            continue;
          }
          if (dbcsCode == UNASSIGNED && this.gb18030) {
            var idx = findIdx(this.gb18030.uChars, uCode);
            if (idx != -1) {
              var dbcsCode = this.gb18030.gbChars[idx] + (uCode - this.gb18030.uChars[idx]);
              newBuf[j++] = 129 + Math.floor(dbcsCode / 12600);
              dbcsCode = dbcsCode % 12600;
              newBuf[j++] = 48 + Math.floor(dbcsCode / 1260);
              dbcsCode = dbcsCode % 1260;
              newBuf[j++] = 129 + Math.floor(dbcsCode / 10);
              dbcsCode = dbcsCode % 10;
              newBuf[j++] = 48 + dbcsCode;
              continue;
            }
          }
        }
        if (dbcsCode === UNASSIGNED)
          dbcsCode = this.defaultCharSingleByte;
        if (dbcsCode < 256) {
          newBuf[j++] = dbcsCode;
        } else if (dbcsCode < 65536) {
          newBuf[j++] = dbcsCode >> 8;
          newBuf[j++] = dbcsCode & 255;
        } else if (dbcsCode < 16777216) {
          newBuf[j++] = dbcsCode >> 16;
          newBuf[j++] = dbcsCode >> 8 & 255;
          newBuf[j++] = dbcsCode & 255;
        } else {
          newBuf[j++] = dbcsCode >>> 24;
          newBuf[j++] = dbcsCode >>> 16 & 255;
          newBuf[j++] = dbcsCode >>> 8 & 255;
          newBuf[j++] = dbcsCode & 255;
        }
      }
      this.seqObj = seqObj;
      this.leadSurrogate = leadSurrogate;
      return newBuf.slice(0, j);
    };
    DBCSEncoder.prototype.end = function() {
      if (this.leadSurrogate === -1 && this.seqObj === void 0)
        return;
      var newBuf = Buffer2.alloc(10), j = 0;
      if (this.seqObj) {
        var dbcsCode = this.seqObj[DEF_CHAR];
        if (dbcsCode !== void 0) {
          if (dbcsCode < 256) {
            newBuf[j++] = dbcsCode;
          } else {
            newBuf[j++] = dbcsCode >> 8;
            newBuf[j++] = dbcsCode & 255;
          }
        } else {
        }
        this.seqObj = void 0;
      }
      if (this.leadSurrogate !== -1) {
        newBuf[j++] = this.defaultCharSingleByte;
        this.leadSurrogate = -1;
      }
      return newBuf.slice(0, j);
    };
    DBCSEncoder.prototype.findIdx = findIdx;
    function DBCSDecoder(options, codec) {
      this.nodeIdx = 0;
      this.prevBytes = [];
      this.decodeTables = codec.decodeTables;
      this.decodeTableSeq = codec.decodeTableSeq;
      this.defaultCharUnicode = codec.defaultCharUnicode;
      this.gb18030 = codec.gb18030;
    }
    DBCSDecoder.prototype.write = function(buf) {
      var newBuf = Buffer2.alloc(buf.length * 2), nodeIdx = this.nodeIdx, prevBytes = this.prevBytes, prevOffset = this.prevBytes.length, seqStart = -this.prevBytes.length, uCode;
      for (var i2 = 0, j = 0; i2 < buf.length; i2++) {
        var curByte = i2 >= 0 ? buf[i2] : prevBytes[i2 + prevOffset];
        var uCode = this.decodeTables[nodeIdx][curByte];
        if (uCode >= 0) {
        } else if (uCode === UNASSIGNED) {
          uCode = this.defaultCharUnicode.charCodeAt(0);
          i2 = seqStart;
        } else if (uCode === GB18030_CODE) {
          if (i2 >= 3) {
            var ptr = (buf[i2 - 3] - 129) * 12600 + (buf[i2 - 2] - 48) * 1260 + (buf[i2 - 1] - 129) * 10 + (curByte - 48);
          } else {
            var ptr = (prevBytes[i2 - 3 + prevOffset] - 129) * 12600 + ((i2 - 2 >= 0 ? buf[i2 - 2] : prevBytes[i2 - 2 + prevOffset]) - 48) * 1260 + ((i2 - 1 >= 0 ? buf[i2 - 1] : prevBytes[i2 - 1 + prevOffset]) - 129) * 10 + (curByte - 48);
          }
          var idx = findIdx(this.gb18030.gbChars, ptr);
          uCode = this.gb18030.uChars[idx] + ptr - this.gb18030.gbChars[idx];
        } else if (uCode <= NODE_START) {
          nodeIdx = NODE_START - uCode;
          continue;
        } else if (uCode <= SEQ_START) {
          var seq = this.decodeTableSeq[SEQ_START - uCode];
          for (var k = 0; k < seq.length - 1; k++) {
            uCode = seq[k];
            newBuf[j++] = uCode & 255;
            newBuf[j++] = uCode >> 8;
          }
          uCode = seq[seq.length - 1];
        } else
          throw new Error("iconv-lite internal error: invalid decoding table value " + uCode + " at " + nodeIdx + "/" + curByte);
        if (uCode >= 65536) {
          uCode -= 65536;
          var uCodeLead = 55296 | uCode >> 10;
          newBuf[j++] = uCodeLead & 255;
          newBuf[j++] = uCodeLead >> 8;
          uCode = 56320 | uCode & 1023;
        }
        newBuf[j++] = uCode & 255;
        newBuf[j++] = uCode >> 8;
        nodeIdx = 0;
        seqStart = i2 + 1;
      }
      this.nodeIdx = nodeIdx;
      this.prevBytes = seqStart >= 0 ? Array.prototype.slice.call(buf, seqStart) : prevBytes.slice(seqStart + prevOffset).concat(Array.prototype.slice.call(buf));
      return newBuf.slice(0, j).toString("ucs2");
    };
    DBCSDecoder.prototype.end = function() {
      var ret = "";
      while (this.prevBytes.length > 0) {
        ret += this.defaultCharUnicode;
        var bytesArr = this.prevBytes.slice(1);
        this.prevBytes = [];
        this.nodeIdx = 0;
        if (bytesArr.length > 0)
          ret += this.write(bytesArr);
      }
      this.prevBytes = [];
      this.nodeIdx = 0;
      return ret;
    };
    function findIdx(table, val) {
      if (table[0] > val)
        return -1;
      var l = 0, r = table.length;
      while (l < r - 1) {
        var mid = l + (r - l + 1 >> 1);
        if (table[mid] <= val)
          l = mid;
        else
          r = mid;
      }
      return l;
    }
  }
});

// ../../../node_modules/encoding/node_modules/iconv-lite/encodings/tables/shiftjis.json
var require_shiftjis = __commonJS({
  "../../../node_modules/encoding/node_modules/iconv-lite/encodings/tables/shiftjis.json"(exports, module2) {
    module2.exports = [
      ["0", "\0", 128],
      ["a1", "\uFF61", 62],
      ["8140", "\u3000\u3001\u3002\uFF0C\uFF0E\u30FB\uFF1A\uFF1B\uFF1F\uFF01\u309B\u309C\xB4\uFF40\xA8\uFF3E\uFFE3\uFF3F\u30FD\u30FE\u309D\u309E\u3003\u4EDD\u3005\u3006\u3007\u30FC\u2015\u2010\uFF0F\uFF3C\uFF5E\u2225\uFF5C\u2026\u2025\u2018\u2019\u201C\u201D\uFF08\uFF09\u3014\u3015\uFF3B\uFF3D\uFF5B\uFF5D\u3008", 9, "\uFF0B\uFF0D\xB1\xD7"],
      ["8180", "\xF7\uFF1D\u2260\uFF1C\uFF1E\u2266\u2267\u221E\u2234\u2642\u2640\xB0\u2032\u2033\u2103\uFFE5\uFF04\uFFE0\uFFE1\uFF05\uFF03\uFF06\uFF0A\uFF20\xA7\u2606\u2605\u25CB\u25CF\u25CE\u25C7\u25C6\u25A1\u25A0\u25B3\u25B2\u25BD\u25BC\u203B\u3012\u2192\u2190\u2191\u2193\u3013"],
      ["81b8", "\u2208\u220B\u2286\u2287\u2282\u2283\u222A\u2229"],
      ["81c8", "\u2227\u2228\uFFE2\u21D2\u21D4\u2200\u2203"],
      ["81da", "\u2220\u22A5\u2312\u2202\u2207\u2261\u2252\u226A\u226B\u221A\u223D\u221D\u2235\u222B\u222C"],
      ["81f0", "\u212B\u2030\u266F\u266D\u266A\u2020\u2021\xB6"],
      ["81fc", "\u25EF"],
      ["824f", "\uFF10", 9],
      ["8260", "\uFF21", 25],
      ["8281", "\uFF41", 25],
      ["829f", "\u3041", 82],
      ["8340", "\u30A1", 62],
      ["8380", "\u30E0", 22],
      ["839f", "\u0391", 16, "\u03A3", 6],
      ["83bf", "\u03B1", 16, "\u03C3", 6],
      ["8440", "\u0410", 5, "\u0401\u0416", 25],
      ["8470", "\u0430", 5, "\u0451\u0436", 7],
      ["8480", "\u043E", 17],
      ["849f", "\u2500\u2502\u250C\u2510\u2518\u2514\u251C\u252C\u2524\u2534\u253C\u2501\u2503\u250F\u2513\u251B\u2517\u2523\u2533\u252B\u253B\u254B\u2520\u252F\u2528\u2537\u253F\u251D\u2530\u2525\u2538\u2542"],
      ["8740", "\u2460", 19, "\u2160", 9],
      ["875f", "\u3349\u3314\u3322\u334D\u3318\u3327\u3303\u3336\u3351\u3357\u330D\u3326\u3323\u332B\u334A\u333B\u339C\u339D\u339E\u338E\u338F\u33C4\u33A1"],
      ["877e", "\u337B"],
      ["8780", "\u301D\u301F\u2116\u33CD\u2121\u32A4", 4, "\u3231\u3232\u3239\u337E\u337D\u337C\u2252\u2261\u222B\u222E\u2211\u221A\u22A5\u2220\u221F\u22BF\u2235\u2229\u222A"],
      ["889f", "\u4E9C\u5516\u5A03\u963F\u54C0\u611B\u6328\u59F6\u9022\u8475\u831C\u7A50\u60AA\u63E1\u6E25\u65ED\u8466\u82A6\u9BF5\u6893\u5727\u65A1\u6271\u5B9B\u59D0\u867B\u98F4\u7D62\u7DBE\u9B8E\u6216\u7C9F\u88B7\u5B89\u5EB5\u6309\u6697\u6848\u95C7\u978D\u674F\u4EE5\u4F0A\u4F4D\u4F9D\u5049\u56F2\u5937\u59D4\u5A01\u5C09\u60DF\u610F\u6170\u6613\u6905\u70BA\u754F\u7570\u79FB\u7DAD\u7DEF\u80C3\u840E\u8863\u8B02\u9055\u907A\u533B\u4E95\u4EA5\u57DF\u80B2\u90C1\u78EF\u4E00\u58F1\u6EA2\u9038\u7A32\u8328\u828B\u9C2F\u5141\u5370\u54BD\u54E1\u56E0\u59FB\u5F15\u98F2\u6DEB\u80E4\u852D"],
      ["8940", "\u9662\u9670\u96A0\u97FB\u540B\u53F3\u5B87\u70CF\u7FBD\u8FC2\u96E8\u536F\u9D5C\u7ABA\u4E11\u7893\u81FC\u6E26\u5618\u5504\u6B1D\u851A\u9C3B\u59E5\u53A9\u6D66\u74DC\u958F\u5642\u4E91\u904B\u96F2\u834F\u990C\u53E1\u55B6\u5B30\u5F71\u6620\u66F3\u6804\u6C38\u6CF3\u6D29\u745B\u76C8\u7A4E\u9834\u82F1\u885B\u8A60\u92ED\u6DB2\u75AB\u76CA\u99C5\u60A6\u8B01\u8D8A\u95B2\u698E\u53AD\u5186"],
      ["8980", "\u5712\u5830\u5944\u5BB4\u5EF6\u6028\u63A9\u63F4\u6CBF\u6F14\u708E\u7114\u7159\u71D5\u733F\u7E01\u8276\u82D1\u8597\u9060\u925B\u9D1B\u5869\u65BC\u6C5A\u7525\u51F9\u592E\u5965\u5F80\u5FDC\u62BC\u65FA\u6A2A\u6B27\u6BB4\u738B\u7FC1\u8956\u9D2C\u9D0E\u9EC4\u5CA1\u6C96\u837B\u5104\u5C4B\u61B6\u81C6\u6876\u7261\u4E59\u4FFA\u5378\u6069\u6E29\u7A4F\u97F3\u4E0B\u5316\u4EEE\u4F55\u4F3D\u4FA1\u4F73\u52A0\u53EF\u5609\u590F\u5AC1\u5BB6\u5BE1\u79D1\u6687\u679C\u67B6\u6B4C\u6CB3\u706B\u73C2\u798D\u79BE\u7A3C\u7B87\u82B1\u82DB\u8304\u8377\u83EF\u83D3\u8766\u8AB2\u5629\u8CA8\u8FE6\u904E\u971E\u868A\u4FC4\u5CE8\u6211\u7259\u753B\u81E5\u82BD\u86FE\u8CC0\u96C5\u9913\u99D5\u4ECB\u4F1A\u89E3\u56DE\u584A\u58CA\u5EFB\u5FEB\u602A\u6094\u6062\u61D0\u6212\u62D0\u6539"],
      ["8a40", "\u9B41\u6666\u68B0\u6D77\u7070\u754C\u7686\u7D75\u82A5\u87F9\u958B\u968E\u8C9D\u51F1\u52BE\u5916\u54B3\u5BB3\u5D16\u6168\u6982\u6DAF\u788D\u84CB\u8857\u8A72\u93A7\u9AB8\u6D6C\u99A8\u86D9\u57A3\u67FF\u86CE\u920E\u5283\u5687\u5404\u5ED3\u62E1\u64B9\u683C\u6838\u6BBB\u7372\u78BA\u7A6B\u899A\u89D2\u8D6B\u8F03\u90ED\u95A3\u9694\u9769\u5B66\u5CB3\u697D\u984D\u984E\u639B\u7B20\u6A2B"],
      ["8a80", "\u6A7F\u68B6\u9C0D\u6F5F\u5272\u559D\u6070\u62EC\u6D3B\u6E07\u6ED1\u845B\u8910\u8F44\u4E14\u9C39\u53F6\u691B\u6A3A\u9784\u682A\u515C\u7AC3\u84B2\u91DC\u938C\u565B\u9D28\u6822\u8305\u8431\u7CA5\u5208\u82C5\u74E6\u4E7E\u4F83\u51A0\u5BD2\u520A\u52D8\u52E7\u5DFB\u559A\u582A\u59E6\u5B8C\u5B98\u5BDB\u5E72\u5E79\u60A3\u611F\u6163\u61BE\u63DB\u6562\u67D1\u6853\u68FA\u6B3E\u6B53\u6C57\u6F22\u6F97\u6F45\u74B0\u7518\u76E3\u770B\u7AFF\u7BA1\u7C21\u7DE9\u7F36\u7FF0\u809D\u8266\u839E\u89B3\u8ACC\u8CAB\u9084\u9451\u9593\u9591\u95A2\u9665\u97D3\u9928\u8218\u4E38\u542B\u5CB8\u5DCC\u73A9\u764C\u773C\u5CA9\u7FEB\u8D0B\u96C1\u9811\u9854\u9858\u4F01\u4F0E\u5371\u559C\u5668\u57FA\u5947\u5B09\u5BC4\u5C90\u5E0C\u5E7E\u5FCC\u63EE\u673A\u65D7\u65E2\u671F\u68CB\u68C4"],
      ["8b40", "\u6A5F\u5E30\u6BC5\u6C17\u6C7D\u757F\u7948\u5B63\u7A00\u7D00\u5FBD\u898F\u8A18\u8CB4\u8D77\u8ECC\u8F1D\u98E2\u9A0E\u9B3C\u4E80\u507D\u5100\u5993\u5B9C\u622F\u6280\u64EC\u6B3A\u72A0\u7591\u7947\u7FA9\u87FB\u8ABC\u8B70\u63AC\u83CA\u97A0\u5409\u5403\u55AB\u6854\u6A58\u8A70\u7827\u6775\u9ECD\u5374\u5BA2\u811A\u8650\u9006\u4E18\u4E45\u4EC7\u4F11\u53CA\u5438\u5BAE\u5F13\u6025\u6551"],
      ["8b80", "\u673D\u6C42\u6C72\u6CE3\u7078\u7403\u7A76\u7AAE\u7B08\u7D1A\u7CFE\u7D66\u65E7\u725B\u53BB\u5C45\u5DE8\u62D2\u62E0\u6319\u6E20\u865A\u8A31\u8DDD\u92F8\u6F01\u79A6\u9B5A\u4EA8\u4EAB\u4EAC\u4F9B\u4FA0\u50D1\u5147\u7AF6\u5171\u51F6\u5354\u5321\u537F\u53EB\u55AC\u5883\u5CE1\u5F37\u5F4A\u602F\u6050\u606D\u631F\u6559\u6A4B\u6CC1\u72C2\u72ED\u77EF\u80F8\u8105\u8208\u854E\u90F7\u93E1\u97FF\u9957\u9A5A\u4EF0\u51DD\u5C2D\u6681\u696D\u5C40\u66F2\u6975\u7389\u6850\u7C81\u50C5\u52E4\u5747\u5DFE\u9326\u65A4\u6B23\u6B3D\u7434\u7981\u79BD\u7B4B\u7DCA\u82B9\u83CC\u887F\u895F\u8B39\u8FD1\u91D1\u541F\u9280\u4E5D\u5036\u53E5\u533A\u72D7\u7396\u77E9\u82E6\u8EAF\u99C6\u99C8\u99D2\u5177\u611A\u865E\u55B0\u7A7A\u5076\u5BD3\u9047\u9685\u4E32\u6ADB\u91E7\u5C51\u5C48"],
      ["8c40", "\u6398\u7A9F\u6C93\u9774\u8F61\u7AAA\u718A\u9688\u7C82\u6817\u7E70\u6851\u936C\u52F2\u541B\u85AB\u8A13\u7FA4\u8ECD\u90E1\u5366\u8888\u7941\u4FC2\u50BE\u5211\u5144\u5553\u572D\u73EA\u578B\u5951\u5F62\u5F84\u6075\u6176\u6167\u61A9\u63B2\u643A\u656C\u666F\u6842\u6E13\u7566\u7A3D\u7CFB\u7D4C\u7D99\u7E4B\u7F6B\u830E\u834A\u86CD\u8A08\u8A63\u8B66\u8EFD\u981A\u9D8F\u82B8\u8FCE\u9BE8"],
      ["8c80", "\u5287\u621F\u6483\u6FC0\u9699\u6841\u5091\u6B20\u6C7A\u6F54\u7A74\u7D50\u8840\u8A23\u6708\u4EF6\u5039\u5026\u5065\u517C\u5238\u5263\u55A7\u570F\u5805\u5ACC\u5EFA\u61B2\u61F8\u62F3\u6372\u691C\u6A29\u727D\u72AC\u732E\u7814\u786F\u7D79\u770C\u80A9\u898B\u8B19\u8CE2\u8ED2\u9063\u9375\u967A\u9855\u9A13\u9E78\u5143\u539F\u53B3\u5E7B\u5F26\u6E1B\u6E90\u7384\u73FE\u7D43\u8237\u8A00\u8AFA\u9650\u4E4E\u500B\u53E4\u547C\u56FA\u59D1\u5B64\u5DF1\u5EAB\u5F27\u6238\u6545\u67AF\u6E56\u72D0\u7CCA\u88B4\u80A1\u80E1\u83F0\u864E\u8A87\u8DE8\u9237\u96C7\u9867\u9F13\u4E94\u4E92\u4F0D\u5348\u5449\u543E\u5A2F\u5F8C\u5FA1\u609F\u68A7\u6A8E\u745A\u7881\u8A9E\u8AA4\u8B77\u9190\u4E5E\u9BC9\u4EA4\u4F7C\u4FAF\u5019\u5016\u5149\u516C\u529F\u52B9\u52FE\u539A\u53E3\u5411"],
      ["8d40", "\u540E\u5589\u5751\u57A2\u597D\u5B54\u5B5D\u5B8F\u5DE5\u5DE7\u5DF7\u5E78\u5E83\u5E9A\u5EB7\u5F18\u6052\u614C\u6297\u62D8\u63A7\u653B\u6602\u6643\u66F4\u676D\u6821\u6897\u69CB\u6C5F\u6D2A\u6D69\u6E2F\u6E9D\u7532\u7687\u786C\u7A3F\u7CE0\u7D05\u7D18\u7D5E\u7DB1\u8015\u8003\u80AF\u80B1\u8154\u818F\u822A\u8352\u884C\u8861\u8B1B\u8CA2\u8CFC\u90CA\u9175\u9271\u783F\u92FC\u95A4\u964D"],
      ["8d80", "\u9805\u9999\u9AD8\u9D3B\u525B\u52AB\u53F7\u5408\u58D5\u62F7\u6FE0\u8C6A\u8F5F\u9EB9\u514B\u523B\u544A\u56FD\u7A40\u9177\u9D60\u9ED2\u7344\u6F09\u8170\u7511\u5FFD\u60DA\u9AA8\u72DB\u8FBC\u6B64\u9803\u4ECA\u56F0\u5764\u58BE\u5A5A\u6068\u61C7\u660F\u6606\u6839\u68B1\u6DF7\u75D5\u7D3A\u826E\u9B42\u4E9B\u4F50\u53C9\u5506\u5D6F\u5DE6\u5DEE\u67FB\u6C99\u7473\u7802\u8A50\u9396\u88DF\u5750\u5EA7\u632B\u50B5\u50AC\u518D\u6700\u54C9\u585E\u59BB\u5BB0\u5F69\u624D\u63A1\u683D\u6B73\u6E08\u707D\u91C7\u7280\u7815\u7826\u796D\u658E\u7D30\u83DC\u88C1\u8F09\u969B\u5264\u5728\u6750\u7F6A\u8CA1\u51B4\u5742\u962A\u583A\u698A\u80B4\u54B2\u5D0E\u57FC\u7895\u9DFA\u4F5C\u524A\u548B\u643E\u6628\u6714\u67F5\u7A84\u7B56\u7D22\u932F\u685C\u9BAD\u7B39\u5319\u518A\u5237"],
      ["8e40", "\u5BDF\u62F6\u64AE\u64E6\u672D\u6BBA\u85A9\u96D1\u7690\u9BD6\u634C\u9306\u9BAB\u76BF\u6652\u4E09\u5098\u53C2\u5C71\u60E8\u6492\u6563\u685F\u71E6\u73CA\u7523\u7B97\u7E82\u8695\u8B83\u8CDB\u9178\u9910\u65AC\u66AB\u6B8B\u4ED5\u4ED4\u4F3A\u4F7F\u523A\u53F8\u53F2\u55E3\u56DB\u58EB\u59CB\u59C9\u59FF\u5B50\u5C4D\u5E02\u5E2B\u5FD7\u601D\u6307\u652F\u5B5C\u65AF\u65BD\u65E8\u679D\u6B62"],
      ["8e80", "\u6B7B\u6C0F\u7345\u7949\u79C1\u7CF8\u7D19\u7D2B\u80A2\u8102\u81F3\u8996\u8A5E\u8A69\u8A66\u8A8C\u8AEE\u8CC7\u8CDC\u96CC\u98FC\u6B6F\u4E8B\u4F3C\u4F8D\u5150\u5B57\u5BFA\u6148\u6301\u6642\u6B21\u6ECB\u6CBB\u723E\u74BD\u75D4\u78C1\u793A\u800C\u8033\u81EA\u8494\u8F9E\u6C50\u9E7F\u5F0F\u8B58\u9D2B\u7AFA\u8EF8\u5B8D\u96EB\u4E03\u53F1\u57F7\u5931\u5AC9\u5BA4\u6089\u6E7F\u6F06\u75BE\u8CEA\u5B9F\u8500\u7BE0\u5072\u67F4\u829D\u5C61\u854A\u7E1E\u820E\u5199\u5C04\u6368\u8D66\u659C\u716E\u793E\u7D17\u8005\u8B1D\u8ECA\u906E\u86C7\u90AA\u501F\u52FA\u5C3A\u6753\u707C\u7235\u914C\u91C8\u932B\u82E5\u5BC2\u5F31\u60F9\u4E3B\u53D6\u5B88\u624B\u6731\u6B8A\u72E9\u73E0\u7A2E\u816B\u8DA3\u9152\u9996\u5112\u53D7\u546A\u5BFF\u6388\u6A39\u7DAC\u9700\u56DA\u53CE\u5468"],
      ["8f40", "\u5B97\u5C31\u5DDE\u4FEE\u6101\u62FE\u6D32\u79C0\u79CB\u7D42\u7E4D\u7FD2\u81ED\u821F\u8490\u8846\u8972\u8B90\u8E74\u8F2F\u9031\u914B\u916C\u96C6\u919C\u4EC0\u4F4F\u5145\u5341\u5F93\u620E\u67D4\u6C41\u6E0B\u7363\u7E26\u91CD\u9283\u53D4\u5919\u5BBF\u6DD1\u795D\u7E2E\u7C9B\u587E\u719F\u51FA\u8853\u8FF0\u4FCA\u5CFB\u6625\u77AC\u7AE3\u821C\u99FF\u51C6\u5FAA\u65EC\u696F\u6B89\u6DF3"],
      ["8f80", "\u6E96\u6F64\u76FE\u7D14\u5DE1\u9075\u9187\u9806\u51E6\u521D\u6240\u6691\u66D9\u6E1A\u5EB6\u7DD2\u7F72\u66F8\u85AF\u85F7\u8AF8\u52A9\u53D9\u5973\u5E8F\u5F90\u6055\u92E4\u9664\u50B7\u511F\u52DD\u5320\u5347\u53EC\u54E8\u5546\u5531\u5617\u5968\u59BE\u5A3C\u5BB5\u5C06\u5C0F\u5C11\u5C1A\u5E84\u5E8A\u5EE0\u5F70\u627F\u6284\u62DB\u638C\u6377\u6607\u660C\u662D\u6676\u677E\u68A2\u6A1F\u6A35\u6CBC\u6D88\u6E09\u6E58\u713C\u7126\u7167\u75C7\u7701\u785D\u7901\u7965\u79F0\u7AE0\u7B11\u7CA7\u7D39\u8096\u83D6\u848B\u8549\u885D\u88F3\u8A1F\u8A3C\u8A54\u8A73\u8C61\u8CDE\u91A4\u9266\u937E\u9418\u969C\u9798\u4E0A\u4E08\u4E1E\u4E57\u5197\u5270\u57CE\u5834\u58CC\u5B22\u5E38\u60C5\u64FE\u6761\u6756\u6D44\u72B6\u7573\u7A63\u84B8\u8B72\u91B8\u9320\u5631\u57F4\u98FE"],
      ["9040", "\u62ED\u690D\u6B96\u71ED\u7E54\u8077\u8272\u89E6\u98DF\u8755\u8FB1\u5C3B\u4F38\u4FE1\u4FB5\u5507\u5A20\u5BDD\u5BE9\u5FC3\u614E\u632F\u65B0\u664B\u68EE\u699B\u6D78\u6DF1\u7533\u75B9\u771F\u795E\u79E6\u7D33\u81E3\u82AF\u85AA\u89AA\u8A3A\u8EAB\u8F9B\u9032\u91DD\u9707\u4EBA\u4EC1\u5203\u5875\u58EC\u5C0B\u751A\u5C3D\u814E\u8A0A\u8FC5\u9663\u976D\u7B25\u8ACF\u9808\u9162\u56F3\u53A8"],
      ["9080", "\u9017\u5439\u5782\u5E25\u63A8\u6C34\u708A\u7761\u7C8B\u7FE0\u8870\u9042\u9154\u9310\u9318\u968F\u745E\u9AC4\u5D07\u5D69\u6570\u67A2\u8DA8\u96DB\u636E\u6749\u6919\u83C5\u9817\u96C0\u88FE\u6F84\u647A\u5BF8\u4E16\u702C\u755D\u662F\u51C4\u5236\u52E2\u59D3\u5F81\u6027\u6210\u653F\u6574\u661F\u6674\u68F2\u6816\u6B63\u6E05\u7272\u751F\u76DB\u7CBE\u8056\u58F0\u88FD\u897F\u8AA0\u8A93\u8ACB\u901D\u9192\u9752\u9759\u6589\u7A0E\u8106\u96BB\u5E2D\u60DC\u621A\u65A5\u6614\u6790\u77F3\u7A4D\u7C4D\u7E3E\u810A\u8CAC\u8D64\u8DE1\u8E5F\u78A9\u5207\u62D9\u63A5\u6442\u6298\u8A2D\u7A83\u7BC0\u8AAC\u96EA\u7D76\u820C\u8749\u4ED9\u5148\u5343\u5360\u5BA3\u5C02\u5C16\u5DDD\u6226\u6247\u64B0\u6813\u6834\u6CC9\u6D45\u6D17\u67D3\u6F5C\u714E\u717D\u65CB\u7A7F\u7BAD\u7DDA"],
      ["9140", "\u7E4A\u7FA8\u817A\u821B\u8239\u85A6\u8A6E\u8CCE\u8DF5\u9078\u9077\u92AD\u9291\u9583\u9BAE\u524D\u5584\u6F38\u7136\u5168\u7985\u7E55\u81B3\u7CCE\u564C\u5851\u5CA8\u63AA\u66FE\u66FD\u695A\u72D9\u758F\u758E\u790E\u7956\u79DF\u7C97\u7D20\u7D44\u8607\u8A34\u963B\u9061\u9F20\u50E7\u5275\u53CC\u53E2\u5009\u55AA\u58EE\u594F\u723D\u5B8B\u5C64\u531D\u60E3\u60F3\u635C\u6383\u633F\u63BB"],
      ["9180", "\u64CD\u65E9\u66F9\u5DE3\u69CD\u69FD\u6F15\u71E5\u4E89\u75E9\u76F8\u7A93\u7CDF\u7DCF\u7D9C\u8061\u8349\u8358\u846C\u84BC\u85FB\u88C5\u8D70\u9001\u906D\u9397\u971C\u9A12\u50CF\u5897\u618E\u81D3\u8535\u8D08\u9020\u4FC3\u5074\u5247\u5373\u606F\u6349\u675F\u6E2C\u8DB3\u901F\u4FD7\u5C5E\u8CCA\u65CF\u7D9A\u5352\u8896\u5176\u63C3\u5B58\u5B6B\u5C0A\u640D\u6751\u905C\u4ED6\u591A\u592A\u6C70\u8A51\u553E\u5815\u59A5\u60F0\u6253\u67C1\u8235\u6955\u9640\u99C4\u9A28\u4F53\u5806\u5BFE\u8010\u5CB1\u5E2F\u5F85\u6020\u614B\u6234\u66FF\u6CF0\u6EDE\u80CE\u817F\u82D4\u888B\u8CB8\u9000\u902E\u968A\u9EDB\u9BDB\u4EE3\u53F0\u5927\u7B2C\u918D\u984C\u9DF9\u6EDD\u7027\u5353\u5544\u5B85\u6258\u629E\u62D3\u6CA2\u6FEF\u7422\u8A17\u9438\u6FC1\u8AFE\u8338\u51E7\u86F8\u53EA"],
      ["9240", "\u53E9\u4F46\u9054\u8FB0\u596A\u8131\u5DFD\u7AEA\u8FBF\u68DA\u8C37\u72F8\u9C48\u6A3D\u8AB0\u4E39\u5358\u5606\u5766\u62C5\u63A2\u65E6\u6B4E\u6DE1\u6E5B\u70AD\u77ED\u7AEF\u7BAA\u7DBB\u803D\u80C6\u86CB\u8A95\u935B\u56E3\u58C7\u5F3E\u65AD\u6696\u6A80\u6BB5\u7537\u8AC7\u5024\u77E5\u5730\u5F1B\u6065\u667A\u6C60\u75F4\u7A1A\u7F6E\u81F4\u8718\u9045\u99B3\u7BC9\u755C\u7AF9\u7B51\u84C4"],
      ["9280", "\u9010\u79E9\u7A92\u8336\u5AE1\u7740\u4E2D\u4EF2\u5B99\u5FE0\u62BD\u663C\u67F1\u6CE8\u866B\u8877\u8A3B\u914E\u92F3\u99D0\u6A17\u7026\u732A\u82E7\u8457\u8CAF\u4E01\u5146\u51CB\u558B\u5BF5\u5E16\u5E33\u5E81\u5F14\u5F35\u5F6B\u5FB4\u61F2\u6311\u66A2\u671D\u6F6E\u7252\u753A\u773A\u8074\u8139\u8178\u8776\u8ABF\u8ADC\u8D85\u8DF3\u929A\u9577\u9802\u9CE5\u52C5\u6357\u76F4\u6715\u6C88\u73CD\u8CC3\u93AE\u9673\u6D25\u589C\u690E\u69CC\u8FFD\u939A\u75DB\u901A\u585A\u6802\u63B4\u69FB\u4F43\u6F2C\u67D8\u8FBB\u8526\u7DB4\u9354\u693F\u6F70\u576A\u58F7\u5B2C\u7D2C\u722A\u540A\u91E3\u9DB4\u4EAD\u4F4E\u505C\u5075\u5243\u8C9E\u5448\u5824\u5B9A\u5E1D\u5E95\u5EAD\u5EF7\u5F1F\u608C\u62B5\u633A\u63D0\u68AF\u6C40\u7887\u798E\u7A0B\u7DE0\u8247\u8A02\u8AE6\u8E44\u9013"],
      ["9340", "\u90B8\u912D\u91D8\u9F0E\u6CE5\u6458\u64E2\u6575\u6EF4\u7684\u7B1B\u9069\u93D1\u6EBA\u54F2\u5FB9\u64A4\u8F4D\u8FED\u9244\u5178\u586B\u5929\u5C55\u5E97\u6DFB\u7E8F\u751C\u8CBC\u8EE2\u985B\u70B9\u4F1D\u6BBF\u6FB1\u7530\u96FB\u514E\u5410\u5835\u5857\u59AC\u5C60\u5F92\u6597\u675C\u6E21\u767B\u83DF\u8CED\u9014\u90FD\u934D\u7825\u783A\u52AA\u5EA6\u571F\u5974\u6012\u5012\u515A\u51AC"],
      ["9380", "\u51CD\u5200\u5510\u5854\u5858\u5957\u5B95\u5CF6\u5D8B\u60BC\u6295\u642D\u6771\u6843\u68BC\u68DF\u76D7\u6DD8\u6E6F\u6D9B\u706F\u71C8\u5F53\u75D8\u7977\u7B49\u7B54\u7B52\u7CD6\u7D71\u5230\u8463\u8569\u85E4\u8A0E\u8B04\u8C46\u8E0F\u9003\u900F\u9419\u9676\u982D\u9A30\u95D8\u50CD\u52D5\u540C\u5802\u5C0E\u61A7\u649E\u6D1E\u77B3\u7AE5\u80F4\u8404\u9053\u9285\u5CE0\u9D07\u533F\u5F97\u5FB3\u6D9C\u7279\u7763\u79BF\u7BE4\u6BD2\u72EC\u8AAD\u6803\u6A61\u51F8\u7A81\u6934\u5C4A\u9CF6\u82EB\u5BC5\u9149\u701E\u5678\u5C6F\u60C7\u6566\u6C8C\u8C5A\u9041\u9813\u5451\u66C7\u920D\u5948\u90A3\u5185\u4E4D\u51EA\u8599\u8B0E\u7058\u637A\u934B\u6962\u99B4\u7E04\u7577\u5357\u6960\u8EDF\u96E3\u6C5D\u4E8C\u5C3C\u5F10\u8FE9\u5302\u8CD1\u8089\u8679\u5EFF\u65E5\u4E73\u5165"],
      ["9440", "\u5982\u5C3F\u97EE\u4EFB\u598A\u5FCD\u8A8D\u6FE1\u79B0\u7962\u5BE7\u8471\u732B\u71B1\u5E74\u5FF5\u637B\u649A\u71C3\u7C98\u4E43\u5EFC\u4E4B\u57DC\u56A2\u60A9\u6FC3\u7D0D\u80FD\u8133\u81BF\u8FB2\u8997\u86A4\u5DF4\u628A\u64AD\u8987\u6777\u6CE2\u6D3E\u7436\u7834\u5A46\u7F75\u82AD\u99AC\u4FF3\u5EC3\u62DD\u6392\u6557\u676F\u76C3\u724C\u80CC\u80BA\u8F29\u914D\u500D\u57F9\u5A92\u6885"],
      ["9480", "\u6973\u7164\u72FD\u8CB7\u58F2\u8CE0\u966A\u9019\u877F\u79E4\u77E7\u8429\u4F2F\u5265\u535A\u62CD\u67CF\u6CCA\u767D\u7B94\u7C95\u8236\u8584\u8FEB\u66DD\u6F20\u7206\u7E1B\u83AB\u99C1\u9EA6\u51FD\u7BB1\u7872\u7BB8\u8087\u7B48\u6AE8\u5E61\u808C\u7551\u7560\u516B\u9262\u6E8C\u767A\u9197\u9AEA\u4F10\u7F70\u629C\u7B4F\u95A5\u9CE9\u567A\u5859\u86E4\u96BC\u4F34\u5224\u534A\u53CD\u53DB\u5E06\u642C\u6591\u677F\u6C3E\u6C4E\u7248\u72AF\u73ED\u7554\u7E41\u822C\u85E9\u8CA9\u7BC4\u91C6\u7169\u9812\u98EF\u633D\u6669\u756A\u76E4\u78D0\u8543\u86EE\u532A\u5351\u5426\u5983\u5E87\u5F7C\u60B2\u6249\u6279\u62AB\u6590\u6BD4\u6CCC\u75B2\u76AE\u7891\u79D8\u7DCB\u7F77\u80A5\u88AB\u8AB9\u8CBB\u907F\u975E\u98DB\u6A0B\u7C38\u5099\u5C3E\u5FAE\u6787\u6BD8\u7435\u7709\u7F8E"],
      ["9540", "\u9F3B\u67CA\u7A17\u5339\u758B\u9AED\u5F66\u819D\u83F1\u8098\u5F3C\u5FC5\u7562\u7B46\u903C\u6867\u59EB\u5A9B\u7D10\u767E\u8B2C\u4FF5\u5F6A\u6A19\u6C37\u6F02\u74E2\u7968\u8868\u8A55\u8C79\u5EDF\u63CF\u75C5\u79D2\u82D7\u9328\u92F2\u849C\u86ED\u9C2D\u54C1\u5F6C\u658C\u6D5C\u7015\u8CA7\u8CD3\u983B\u654F\u74F6\u4E0D\u4ED8\u57E0\u592B\u5A66\u5BCC\u51A8\u5E03\u5E9C\u6016\u6276\u6577"],
      ["9580", "\u65A7\u666E\u6D6E\u7236\u7B26\u8150\u819A\u8299\u8B5C\u8CA0\u8CE6\u8D74\u961C\u9644\u4FAE\u64AB\u6B66\u821E\u8461\u856A\u90E8\u5C01\u6953\u98A8\u847A\u8557\u4F0F\u526F\u5FA9\u5E45\u670D\u798F\u8179\u8907\u8986\u6DF5\u5F17\u6255\u6CB8\u4ECF\u7269\u9B92\u5206\u543B\u5674\u58B3\u61A4\u626E\u711A\u596E\u7C89\u7CDE\u7D1B\u96F0\u6587\u805E\u4E19\u4F75\u5175\u5840\u5E63\u5E73\u5F0A\u67C4\u4E26\u853D\u9589\u965B\u7C73\u9801\u50FB\u58C1\u7656\u78A7\u5225\u77A5\u8511\u7B86\u504F\u5909\u7247\u7BC7\u7DE8\u8FBA\u8FD4\u904D\u4FBF\u52C9\u5A29\u5F01\u97AD\u4FDD\u8217\u92EA\u5703\u6355\u6B69\u752B\u88DC\u8F14\u7A42\u52DF\u5893\u6155\u620A\u66AE\u6BCD\u7C3F\u83E9\u5023\u4FF8\u5305\u5446\u5831\u5949\u5B9D\u5CF0\u5CEF\u5D29\u5E96\u62B1\u6367\u653E\u65B9\u670B"],
      ["9640", "\u6CD5\u6CE1\u70F9\u7832\u7E2B\u80DE\u82B3\u840C\u84EC\u8702\u8912\u8A2A\u8C4A\u90A6\u92D2\u98FD\u9CF3\u9D6C\u4E4F\u4EA1\u508D\u5256\u574A\u59A8\u5E3D\u5FD8\u5FD9\u623F\u66B4\u671B\u67D0\u68D2\u5192\u7D21\u80AA\u81A8\u8B00\u8C8C\u8CBF\u927E\u9632\u5420\u982C\u5317\u50D5\u535C\u58A8\u64B2\u6734\u7267\u7766\u7A46\u91E6\u52C3\u6CA1\u6B86\u5800\u5E4C\u5954\u672C\u7FFB\u51E1\u76C6"],
      ["9680", "\u6469\u78E8\u9B54\u9EBB\u57CB\u59B9\u6627\u679A\u6BCE\u54E9\u69D9\u5E55\u819C\u6795\u9BAA\u67FE\u9C52\u685D\u4EA6\u4FE3\u53C8\u62B9\u672B\u6CAB\u8FC4\u4FAD\u7E6D\u9EBF\u4E07\u6162\u6E80\u6F2B\u8513\u5473\u672A\u9B45\u5DF3\u7B95\u5CAC\u5BC6\u871C\u6E4A\u84D1\u7A14\u8108\u5999\u7C8D\u6C11\u7720\u52D9\u5922\u7121\u725F\u77DB\u9727\u9D61\u690B\u5A7F\u5A18\u51A5\u540D\u547D\u660E\u76DF\u8FF7\u9298\u9CF4\u59EA\u725D\u6EC5\u514D\u68C9\u7DBF\u7DEC\u9762\u9EBA\u6478\u6A21\u8302\u5984\u5B5F\u6BDB\u731B\u76F2\u7DB2\u8017\u8499\u5132\u6728\u9ED9\u76EE\u6762\u52FF\u9905\u5C24\u623B\u7C7E\u8CB0\u554F\u60B6\u7D0B\u9580\u5301\u4E5F\u51B6\u591C\u723A\u8036\u91CE\u5F25\u77E2\u5384\u5F79\u7D04\u85AC\u8A33\u8E8D\u9756\u67F3\u85AE\u9453\u6109\u6108\u6CB9\u7652"],
      ["9740", "\u8AED\u8F38\u552F\u4F51\u512A\u52C7\u53CB\u5BA5\u5E7D\u60A0\u6182\u63D6\u6709\u67DA\u6E67\u6D8C\u7336\u7337\u7531\u7950\u88D5\u8A98\u904A\u9091\u90F5\u96C4\u878D\u5915\u4E88\u4F59\u4E0E\u8A89\u8F3F\u9810\u50AD\u5E7C\u5996\u5BB9\u5EB8\u63DA\u63FA\u64C1\u66DC\u694A\u69D8\u6D0B\u6EB6\u7194\u7528\u7AAF\u7F8A\u8000\u8449\u84C9\u8981\u8B21\u8E0A\u9065\u967D\u990A\u617E\u6291\u6B32"],
      ["9780", "\u6C83\u6D74\u7FCC\u7FFC\u6DC0\u7F85\u87BA\u88F8\u6765\u83B1\u983C\u96F7\u6D1B\u7D61\u843D\u916A\u4E71\u5375\u5D50\u6B04\u6FEB\u85CD\u862D\u89A7\u5229\u540F\u5C65\u674E\u68A8\u7406\u7483\u75E2\u88CF\u88E1\u91CC\u96E2\u9678\u5F8B\u7387\u7ACB\u844E\u63A0\u7565\u5289\u6D41\u6E9C\u7409\u7559\u786B\u7C92\u9686\u7ADC\u9F8D\u4FB6\u616E\u65C5\u865C\u4E86\u4EAE\u50DA\u4E21\u51CC\u5BEE\u6599\u6881\u6DBC\u731F\u7642\u77AD\u7A1C\u7CE7\u826F\u8AD2\u907C\u91CF\u9675\u9818\u529B\u7DD1\u502B\u5398\u6797\u6DCB\u71D0\u7433\u81E8\u8F2A\u96A3\u9C57\u9E9F\u7460\u5841\u6D99\u7D2F\u985E\u4EE4\u4F36\u4F8B\u51B7\u52B1\u5DBA\u601C\u73B2\u793C\u82D3\u9234\u96B7\u96F6\u970A\u9E97\u9F62\u66A6\u6B74\u5217\u52A3\u70C8\u88C2\u5EC9\u604B\u6190\u6F23\u7149\u7C3E\u7DF4\u806F"],
      ["9840", "\u84EE\u9023\u932C\u5442\u9B6F\u6AD3\u7089\u8CC2\u8DEF\u9732\u52B4\u5A41\u5ECA\u5F04\u6717\u697C\u6994\u6D6A\u6F0F\u7262\u72FC\u7BED\u8001\u807E\u874B\u90CE\u516D\u9E93\u7984\u808B\u9332\u8AD6\u502D\u548C\u8A71\u6B6A\u8CC4\u8107\u60D1\u67A0\u9DF2\u4E99\u4E98\u9C10\u8A6B\u85C1\u8568\u6900\u6E7E\u7897\u8155"],
      ["989f", "\u5F0C\u4E10\u4E15\u4E2A\u4E31\u4E36\u4E3C\u4E3F\u4E42\u4E56\u4E58\u4E82\u4E85\u8C6B\u4E8A\u8212\u5F0D\u4E8E\u4E9E\u4E9F\u4EA0\u4EA2\u4EB0\u4EB3\u4EB6\u4ECE\u4ECD\u4EC4\u4EC6\u4EC2\u4ED7\u4EDE\u4EED\u4EDF\u4EF7\u4F09\u4F5A\u4F30\u4F5B\u4F5D\u4F57\u4F47\u4F76\u4F88\u4F8F\u4F98\u4F7B\u4F69\u4F70\u4F91\u4F6F\u4F86\u4F96\u5118\u4FD4\u4FDF\u4FCE\u4FD8\u4FDB\u4FD1\u4FDA\u4FD0\u4FE4\u4FE5\u501A\u5028\u5014\u502A\u5025\u5005\u4F1C\u4FF6\u5021\u5029\u502C\u4FFE\u4FEF\u5011\u5006\u5043\u5047\u6703\u5055\u5050\u5048\u505A\u5056\u506C\u5078\u5080\u509A\u5085\u50B4\u50B2"],
      ["9940", "\u50C9\u50CA\u50B3\u50C2\u50D6\u50DE\u50E5\u50ED\u50E3\u50EE\u50F9\u50F5\u5109\u5101\u5102\u5116\u5115\u5114\u511A\u5121\u513A\u5137\u513C\u513B\u513F\u5140\u5152\u514C\u5154\u5162\u7AF8\u5169\u516A\u516E\u5180\u5182\u56D8\u518C\u5189\u518F\u5191\u5193\u5195\u5196\u51A4\u51A6\u51A2\u51A9\u51AA\u51AB\u51B3\u51B1\u51B2\u51B0\u51B5\u51BD\u51C5\u51C9\u51DB\u51E0\u8655\u51E9\u51ED"],
      ["9980", "\u51F0\u51F5\u51FE\u5204\u520B\u5214\u520E\u5227\u522A\u522E\u5233\u5239\u524F\u5244\u524B\u524C\u525E\u5254\u526A\u5274\u5269\u5273\u527F\u527D\u528D\u5294\u5292\u5271\u5288\u5291\u8FA8\u8FA7\u52AC\u52AD\u52BC\u52B5\u52C1\u52CD\u52D7\u52DE\u52E3\u52E6\u98ED\u52E0\u52F3\u52F5\u52F8\u52F9\u5306\u5308\u7538\u530D\u5310\u530F\u5315\u531A\u5323\u532F\u5331\u5333\u5338\u5340\u5346\u5345\u4E17\u5349\u534D\u51D6\u535E\u5369\u536E\u5918\u537B\u5377\u5382\u5396\u53A0\u53A6\u53A5\u53AE\u53B0\u53B6\u53C3\u7C12\u96D9\u53DF\u66FC\u71EE\u53EE\u53E8\u53ED\u53FA\u5401\u543D\u5440\u542C\u542D\u543C\u542E\u5436\u5429\u541D\u544E\u548F\u5475\u548E\u545F\u5471\u5477\u5470\u5492\u547B\u5480\u5476\u5484\u5490\u5486\u54C7\u54A2\u54B8\u54A5\u54AC\u54C4\u54C8\u54A8"],
      ["9a40", "\u54AB\u54C2\u54A4\u54BE\u54BC\u54D8\u54E5\u54E6\u550F\u5514\u54FD\u54EE\u54ED\u54FA\u54E2\u5539\u5540\u5563\u554C\u552E\u555C\u5545\u5556\u5557\u5538\u5533\u555D\u5599\u5580\u54AF\u558A\u559F\u557B\u557E\u5598\u559E\u55AE\u557C\u5583\u55A9\u5587\u55A8\u55DA\u55C5\u55DF\u55C4\u55DC\u55E4\u55D4\u5614\u55F7\u5616\u55FE\u55FD\u561B\u55F9\u564E\u5650\u71DF\u5634\u5636\u5632\u5638"],
      ["9a80", "\u566B\u5664\u562F\u566C\u566A\u5686\u5680\u568A\u56A0\u5694\u568F\u56A5\u56AE\u56B6\u56B4\u56C2\u56BC\u56C1\u56C3\u56C0\u56C8\u56CE\u56D1\u56D3\u56D7\u56EE\u56F9\u5700\u56FF\u5704\u5709\u5708\u570B\u570D\u5713\u5718\u5716\u55C7\u571C\u5726\u5737\u5738\u574E\u573B\u5740\u574F\u5769\u57C0\u5788\u5761\u577F\u5789\u5793\u57A0\u57B3\u57A4\u57AA\u57B0\u57C3\u57C6\u57D4\u57D2\u57D3\u580A\u57D6\u57E3\u580B\u5819\u581D\u5872\u5821\u5862\u584B\u5870\u6BC0\u5852\u583D\u5879\u5885\u58B9\u589F\u58AB\u58BA\u58DE\u58BB\u58B8\u58AE\u58C5\u58D3\u58D1\u58D7\u58D9\u58D8\u58E5\u58DC\u58E4\u58DF\u58EF\u58FA\u58F9\u58FB\u58FC\u58FD\u5902\u590A\u5910\u591B\u68A6\u5925\u592C\u592D\u5932\u5938\u593E\u7AD2\u5955\u5950\u594E\u595A\u5958\u5962\u5960\u5967\u596C\u5969"],
      ["9b40", "\u5978\u5981\u599D\u4F5E\u4FAB\u59A3\u59B2\u59C6\u59E8\u59DC\u598D\u59D9\u59DA\u5A25\u5A1F\u5A11\u5A1C\u5A09\u5A1A\u5A40\u5A6C\u5A49\u5A35\u5A36\u5A62\u5A6A\u5A9A\u5ABC\u5ABE\u5ACB\u5AC2\u5ABD\u5AE3\u5AD7\u5AE6\u5AE9\u5AD6\u5AFA\u5AFB\u5B0C\u5B0B\u5B16\u5B32\u5AD0\u5B2A\u5B36\u5B3E\u5B43\u5B45\u5B40\u5B51\u5B55\u5B5A\u5B5B\u5B65\u5B69\u5B70\u5B73\u5B75\u5B78\u6588\u5B7A\u5B80"],
      ["9b80", "\u5B83\u5BA6\u5BB8\u5BC3\u5BC7\u5BC9\u5BD4\u5BD0\u5BE4\u5BE6\u5BE2\u5BDE\u5BE5\u5BEB\u5BF0\u5BF6\u5BF3\u5C05\u5C07\u5C08\u5C0D\u5C13\u5C20\u5C22\u5C28\u5C38\u5C39\u5C41\u5C46\u5C4E\u5C53\u5C50\u5C4F\u5B71\u5C6C\u5C6E\u4E62\u5C76\u5C79\u5C8C\u5C91\u5C94\u599B\u5CAB\u5CBB\u5CB6\u5CBC\u5CB7\u5CC5\u5CBE\u5CC7\u5CD9\u5CE9\u5CFD\u5CFA\u5CED\u5D8C\u5CEA\u5D0B\u5D15\u5D17\u5D5C\u5D1F\u5D1B\u5D11\u5D14\u5D22\u5D1A\u5D19\u5D18\u5D4C\u5D52\u5D4E\u5D4B\u5D6C\u5D73\u5D76\u5D87\u5D84\u5D82\u5DA2\u5D9D\u5DAC\u5DAE\u5DBD\u5D90\u5DB7\u5DBC\u5DC9\u5DCD\u5DD3\u5DD2\u5DD6\u5DDB\u5DEB\u5DF2\u5DF5\u5E0B\u5E1A\u5E19\u5E11\u5E1B\u5E36\u5E37\u5E44\u5E43\u5E40\u5E4E\u5E57\u5E54\u5E5F\u5E62\u5E64\u5E47\u5E75\u5E76\u5E7A\u9EBC\u5E7F\u5EA0\u5EC1\u5EC2\u5EC8\u5ED0\u5ECF"],
      ["9c40", "\u5ED6\u5EE3\u5EDD\u5EDA\u5EDB\u5EE2\u5EE1\u5EE8\u5EE9\u5EEC\u5EF1\u5EF3\u5EF0\u5EF4\u5EF8\u5EFE\u5F03\u5F09\u5F5D\u5F5C\u5F0B\u5F11\u5F16\u5F29\u5F2D\u5F38\u5F41\u5F48\u5F4C\u5F4E\u5F2F\u5F51\u5F56\u5F57\u5F59\u5F61\u5F6D\u5F73\u5F77\u5F83\u5F82\u5F7F\u5F8A\u5F88\u5F91\u5F87\u5F9E\u5F99\u5F98\u5FA0\u5FA8\u5FAD\u5FBC\u5FD6\u5FFB\u5FE4\u5FF8\u5FF1\u5FDD\u60B3\u5FFF\u6021\u6060"],
      ["9c80", "\u6019\u6010\u6029\u600E\u6031\u601B\u6015\u602B\u6026\u600F\u603A\u605A\u6041\u606A\u6077\u605F\u604A\u6046\u604D\u6063\u6043\u6064\u6042\u606C\u606B\u6059\u6081\u608D\u60E7\u6083\u609A\u6084\u609B\u6096\u6097\u6092\u60A7\u608B\u60E1\u60B8\u60E0\u60D3\u60B4\u5FF0\u60BD\u60C6\u60B5\u60D8\u614D\u6115\u6106\u60F6\u60F7\u6100\u60F4\u60FA\u6103\u6121\u60FB\u60F1\u610D\u610E\u6147\u613E\u6128\u6127\u614A\u613F\u613C\u612C\u6134\u613D\u6142\u6144\u6173\u6177\u6158\u6159\u615A\u616B\u6174\u616F\u6165\u6171\u615F\u615D\u6153\u6175\u6199\u6196\u6187\u61AC\u6194\u619A\u618A\u6191\u61AB\u61AE\u61CC\u61CA\u61C9\u61F7\u61C8\u61C3\u61C6\u61BA\u61CB\u7F79\u61CD\u61E6\u61E3\u61F6\u61FA\u61F4\u61FF\u61FD\u61FC\u61FE\u6200\u6208\u6209\u620D\u620C\u6214\u621B"],
      ["9d40", "\u621E\u6221\u622A\u622E\u6230\u6232\u6233\u6241\u624E\u625E\u6263\u625B\u6260\u6268\u627C\u6282\u6289\u627E\u6292\u6293\u6296\u62D4\u6283\u6294\u62D7\u62D1\u62BB\u62CF\u62FF\u62C6\u64D4\u62C8\u62DC\u62CC\u62CA\u62C2\u62C7\u629B\u62C9\u630C\u62EE\u62F1\u6327\u6302\u6308\u62EF\u62F5\u6350\u633E\u634D\u641C\u634F\u6396\u638E\u6380\u63AB\u6376\u63A3\u638F\u6389\u639F\u63B5\u636B"],
      ["9d80", "\u6369\u63BE\u63E9\u63C0\u63C6\u63E3\u63C9\u63D2\u63F6\u63C4\u6416\u6434\u6406\u6413\u6426\u6436\u651D\u6417\u6428\u640F\u6467\u646F\u6476\u644E\u652A\u6495\u6493\u64A5\u64A9\u6488\u64BC\u64DA\u64D2\u64C5\u64C7\u64BB\u64D8\u64C2\u64F1\u64E7\u8209\u64E0\u64E1\u62AC\u64E3\u64EF\u652C\u64F6\u64F4\u64F2\u64FA\u6500\u64FD\u6518\u651C\u6505\u6524\u6523\u652B\u6534\u6535\u6537\u6536\u6538\u754B\u6548\u6556\u6555\u654D\u6558\u655E\u655D\u6572\u6578\u6582\u6583\u8B8A\u659B\u659F\u65AB\u65B7\u65C3\u65C6\u65C1\u65C4\u65CC\u65D2\u65DB\u65D9\u65E0\u65E1\u65F1\u6772\u660A\u6603\u65FB\u6773\u6635\u6636\u6634\u661C\u664F\u6644\u6649\u6641\u665E\u665D\u6664\u6667\u6668\u665F\u6662\u6670\u6683\u6688\u668E\u6689\u6684\u6698\u669D\u66C1\u66B9\u66C9\u66BE\u66BC"],
      ["9e40", "\u66C4\u66B8\u66D6\u66DA\u66E0\u663F\u66E6\u66E9\u66F0\u66F5\u66F7\u670F\u6716\u671E\u6726\u6727\u9738\u672E\u673F\u6736\u6741\u6738\u6737\u6746\u675E\u6760\u6759\u6763\u6764\u6789\u6770\u67A9\u677C\u676A\u678C\u678B\u67A6\u67A1\u6785\u67B7\u67EF\u67B4\u67EC\u67B3\u67E9\u67B8\u67E4\u67DE\u67DD\u67E2\u67EE\u67B9\u67CE\u67C6\u67E7\u6A9C\u681E\u6846\u6829\u6840\u684D\u6832\u684E"],
      ["9e80", "\u68B3\u682B\u6859\u6863\u6877\u687F\u689F\u688F\u68AD\u6894\u689D\u689B\u6883\u6AAE\u68B9\u6874\u68B5\u68A0\u68BA\u690F\u688D\u687E\u6901\u68CA\u6908\u68D8\u6922\u6926\u68E1\u690C\u68CD\u68D4\u68E7\u68D5\u6936\u6912\u6904\u68D7\u68E3\u6925\u68F9\u68E0\u68EF\u6928\u692A\u691A\u6923\u6921\u68C6\u6979\u6977\u695C\u6978\u696B\u6954\u697E\u696E\u6939\u6974\u693D\u6959\u6930\u6961\u695E\u695D\u6981\u696A\u69B2\u69AE\u69D0\u69BF\u69C1\u69D3\u69BE\u69CE\u5BE8\u69CA\u69DD\u69BB\u69C3\u69A7\u6A2E\u6991\u69A0\u699C\u6995\u69B4\u69DE\u69E8\u6A02\u6A1B\u69FF\u6B0A\u69F9\u69F2\u69E7\u6A05\u69B1\u6A1E\u69ED\u6A14\u69EB\u6A0A\u6A12\u6AC1\u6A23\u6A13\u6A44\u6A0C\u6A72\u6A36\u6A78\u6A47\u6A62\u6A59\u6A66\u6A48\u6A38\u6A22\u6A90\u6A8D\u6AA0\u6A84\u6AA2\u6AA3"],
      ["9f40", "\u6A97\u8617\u6ABB\u6AC3\u6AC2\u6AB8\u6AB3\u6AAC\u6ADE\u6AD1\u6ADF\u6AAA\u6ADA\u6AEA\u6AFB\u6B05\u8616\u6AFA\u6B12\u6B16\u9B31\u6B1F\u6B38\u6B37\u76DC\u6B39\u98EE\u6B47\u6B43\u6B49\u6B50\u6B59\u6B54\u6B5B\u6B5F\u6B61\u6B78\u6B79\u6B7F\u6B80\u6B84\u6B83\u6B8D\u6B98\u6B95\u6B9E\u6BA4\u6BAA\u6BAB\u6BAF\u6BB2\u6BB1\u6BB3\u6BB7\u6BBC\u6BC6\u6BCB\u6BD3\u6BDF\u6BEC\u6BEB\u6BF3\u6BEF"],
      ["9f80", "\u9EBE\u6C08\u6C13\u6C14\u6C1B\u6C24\u6C23\u6C5E\u6C55\u6C62\u6C6A\u6C82\u6C8D\u6C9A\u6C81\u6C9B\u6C7E\u6C68\u6C73\u6C92\u6C90\u6CC4\u6CF1\u6CD3\u6CBD\u6CD7\u6CC5\u6CDD\u6CAE\u6CB1\u6CBE\u6CBA\u6CDB\u6CEF\u6CD9\u6CEA\u6D1F\u884D\u6D36\u6D2B\u6D3D\u6D38\u6D19\u6D35\u6D33\u6D12\u6D0C\u6D63\u6D93\u6D64\u6D5A\u6D79\u6D59\u6D8E\u6D95\u6FE4\u6D85\u6DF9\u6E15\u6E0A\u6DB5\u6DC7\u6DE6\u6DB8\u6DC6\u6DEC\u6DDE\u6DCC\u6DE8\u6DD2\u6DC5\u6DFA\u6DD9\u6DE4\u6DD5\u6DEA\u6DEE\u6E2D\u6E6E\u6E2E\u6E19\u6E72\u6E5F\u6E3E\u6E23\u6E6B\u6E2B\u6E76\u6E4D\u6E1F\u6E43\u6E3A\u6E4E\u6E24\u6EFF\u6E1D\u6E38\u6E82\u6EAA\u6E98\u6EC9\u6EB7\u6ED3\u6EBD\u6EAF\u6EC4\u6EB2\u6ED4\u6ED5\u6E8F\u6EA5\u6EC2\u6E9F\u6F41\u6F11\u704C\u6EEC\u6EF8\u6EFE\u6F3F\u6EF2\u6F31\u6EEF\u6F32\u6ECC"],
      ["e040", "\u6F3E\u6F13\u6EF7\u6F86\u6F7A\u6F78\u6F81\u6F80\u6F6F\u6F5B\u6FF3\u6F6D\u6F82\u6F7C\u6F58\u6F8E\u6F91\u6FC2\u6F66\u6FB3\u6FA3\u6FA1\u6FA4\u6FB9\u6FC6\u6FAA\u6FDF\u6FD5\u6FEC\u6FD4\u6FD8\u6FF1\u6FEE\u6FDB\u7009\u700B\u6FFA\u7011\u7001\u700F\u6FFE\u701B\u701A\u6F74\u701D\u7018\u701F\u7030\u703E\u7032\u7051\u7063\u7099\u7092\u70AF\u70F1\u70AC\u70B8\u70B3\u70AE\u70DF\u70CB\u70DD"],
      ["e080", "\u70D9\u7109\u70FD\u711C\u7119\u7165\u7155\u7188\u7166\u7162\u714C\u7156\u716C\u718F\u71FB\u7184\u7195\u71A8\u71AC\u71D7\u71B9\u71BE\u71D2\u71C9\u71D4\u71CE\u71E0\u71EC\u71E7\u71F5\u71FC\u71F9\u71FF\u720D\u7210\u721B\u7228\u722D\u722C\u7230\u7232\u723B\u723C\u723F\u7240\u7246\u724B\u7258\u7274\u727E\u7282\u7281\u7287\u7292\u7296\u72A2\u72A7\u72B9\u72B2\u72C3\u72C6\u72C4\u72CE\u72D2\u72E2\u72E0\u72E1\u72F9\u72F7\u500F\u7317\u730A\u731C\u7316\u731D\u7334\u732F\u7329\u7325\u733E\u734E\u734F\u9ED8\u7357\u736A\u7368\u7370\u7378\u7375\u737B\u737A\u73C8\u73B3\u73CE\u73BB\u73C0\u73E5\u73EE\u73DE\u74A2\u7405\u746F\u7425\u73F8\u7432\u743A\u7455\u743F\u745F\u7459\u7441\u745C\u7469\u7470\u7463\u746A\u7476\u747E\u748B\u749E\u74A7\u74CA\u74CF\u74D4\u73F1"],
      ["e140", "\u74E0\u74E3\u74E7\u74E9\u74EE\u74F2\u74F0\u74F1\u74F8\u74F7\u7504\u7503\u7505\u750C\u750E\u750D\u7515\u7513\u751E\u7526\u752C\u753C\u7544\u754D\u754A\u7549\u755B\u7546\u755A\u7569\u7564\u7567\u756B\u756D\u7578\u7576\u7586\u7587\u7574\u758A\u7589\u7582\u7594\u759A\u759D\u75A5\u75A3\u75C2\u75B3\u75C3\u75B5\u75BD\u75B8\u75BC\u75B1\u75CD\u75CA\u75D2\u75D9\u75E3\u75DE\u75FE\u75FF"],
      ["e180", "\u75FC\u7601\u75F0\u75FA\u75F2\u75F3\u760B\u760D\u7609\u761F\u7627\u7620\u7621\u7622\u7624\u7634\u7630\u763B\u7647\u7648\u7646\u765C\u7658\u7661\u7662\u7668\u7669\u766A\u7667\u766C\u7670\u7672\u7676\u7678\u767C\u7680\u7683\u7688\u768B\u768E\u7696\u7693\u7699\u769A\u76B0\u76B4\u76B8\u76B9\u76BA\u76C2\u76CD\u76D6\u76D2\u76DE\u76E1\u76E5\u76E7\u76EA\u862F\u76FB\u7708\u7707\u7704\u7729\u7724\u771E\u7725\u7726\u771B\u7737\u7738\u7747\u775A\u7768\u776B\u775B\u7765\u777F\u777E\u7779\u778E\u778B\u7791\u77A0\u779E\u77B0\u77B6\u77B9\u77BF\u77BC\u77BD\u77BB\u77C7\u77CD\u77D7\u77DA\u77DC\u77E3\u77EE\u77FC\u780C\u7812\u7926\u7820\u792A\u7845\u788E\u7874\u7886\u787C\u789A\u788C\u78A3\u78B5\u78AA\u78AF\u78D1\u78C6\u78CB\u78D4\u78BE\u78BC\u78C5\u78CA\u78EC"],
      ["e240", "\u78E7\u78DA\u78FD\u78F4\u7907\u7912\u7911\u7919\u792C\u792B\u7940\u7960\u7957\u795F\u795A\u7955\u7953\u797A\u797F\u798A\u799D\u79A7\u9F4B\u79AA\u79AE\u79B3\u79B9\u79BA\u79C9\u79D5\u79E7\u79EC\u79E1\u79E3\u7A08\u7A0D\u7A18\u7A19\u7A20\u7A1F\u7980\u7A31\u7A3B\u7A3E\u7A37\u7A43\u7A57\u7A49\u7A61\u7A62\u7A69\u9F9D\u7A70\u7A79\u7A7D\u7A88\u7A97\u7A95\u7A98\u7A96\u7AA9\u7AC8\u7AB0"],
      ["e280", "\u7AB6\u7AC5\u7AC4\u7ABF\u9083\u7AC7\u7ACA\u7ACD\u7ACF\u7AD5\u7AD3\u7AD9\u7ADA\u7ADD\u7AE1\u7AE2\u7AE6\u7AED\u7AF0\u7B02\u7B0F\u7B0A\u7B06\u7B33\u7B18\u7B19\u7B1E\u7B35\u7B28\u7B36\u7B50\u7B7A\u7B04\u7B4D\u7B0B\u7B4C\u7B45\u7B75\u7B65\u7B74\u7B67\u7B70\u7B71\u7B6C\u7B6E\u7B9D\u7B98\u7B9F\u7B8D\u7B9C\u7B9A\u7B8B\u7B92\u7B8F\u7B5D\u7B99\u7BCB\u7BC1\u7BCC\u7BCF\u7BB4\u7BC6\u7BDD\u7BE9\u7C11\u7C14\u7BE6\u7BE5\u7C60\u7C00\u7C07\u7C13\u7BF3\u7BF7\u7C17\u7C0D\u7BF6\u7C23\u7C27\u7C2A\u7C1F\u7C37\u7C2B\u7C3D\u7C4C\u7C43\u7C54\u7C4F\u7C40\u7C50\u7C58\u7C5F\u7C64\u7C56\u7C65\u7C6C\u7C75\u7C83\u7C90\u7CA4\u7CAD\u7CA2\u7CAB\u7CA1\u7CA8\u7CB3\u7CB2\u7CB1\u7CAE\u7CB9\u7CBD\u7CC0\u7CC5\u7CC2\u7CD8\u7CD2\u7CDC\u7CE2\u9B3B\u7CEF\u7CF2\u7CF4\u7CF6\u7CFA\u7D06"],
      ["e340", "\u7D02\u7D1C\u7D15\u7D0A\u7D45\u7D4B\u7D2E\u7D32\u7D3F\u7D35\u7D46\u7D73\u7D56\u7D4E\u7D72\u7D68\u7D6E\u7D4F\u7D63\u7D93\u7D89\u7D5B\u7D8F\u7D7D\u7D9B\u7DBA\u7DAE\u7DA3\u7DB5\u7DC7\u7DBD\u7DAB\u7E3D\u7DA2\u7DAF\u7DDC\u7DB8\u7D9F\u7DB0\u7DD8\u7DDD\u7DE4\u7DDE\u7DFB\u7DF2\u7DE1\u7E05\u7E0A\u7E23\u7E21\u7E12\u7E31\u7E1F\u7E09\u7E0B\u7E22\u7E46\u7E66\u7E3B\u7E35\u7E39\u7E43\u7E37"],
      ["e380", "\u7E32\u7E3A\u7E67\u7E5D\u7E56\u7E5E\u7E59\u7E5A\u7E79\u7E6A\u7E69\u7E7C\u7E7B\u7E83\u7DD5\u7E7D\u8FAE\u7E7F\u7E88\u7E89\u7E8C\u7E92\u7E90\u7E93\u7E94\u7E96\u7E8E\u7E9B\u7E9C\u7F38\u7F3A\u7F45\u7F4C\u7F4D\u7F4E\u7F50\u7F51\u7F55\u7F54\u7F58\u7F5F\u7F60\u7F68\u7F69\u7F67\u7F78\u7F82\u7F86\u7F83\u7F88\u7F87\u7F8C\u7F94\u7F9E\u7F9D\u7F9A\u7FA3\u7FAF\u7FB2\u7FB9\u7FAE\u7FB6\u7FB8\u8B71\u7FC5\u7FC6\u7FCA\u7FD5\u7FD4\u7FE1\u7FE6\u7FE9\u7FF3\u7FF9\u98DC\u8006\u8004\u800B\u8012\u8018\u8019\u801C\u8021\u8028\u803F\u803B\u804A\u8046\u8052\u8058\u805A\u805F\u8062\u8068\u8073\u8072\u8070\u8076\u8079\u807D\u807F\u8084\u8086\u8085\u809B\u8093\u809A\u80AD\u5190\u80AC\u80DB\u80E5\u80D9\u80DD\u80C4\u80DA\u80D6\u8109\u80EF\u80F1\u811B\u8129\u8123\u812F\u814B"],
      ["e440", "\u968B\u8146\u813E\u8153\u8151\u80FC\u8171\u816E\u8165\u8166\u8174\u8183\u8188\u818A\u8180\u8182\u81A0\u8195\u81A4\u81A3\u815F\u8193\u81A9\u81B0\u81B5\u81BE\u81B8\u81BD\u81C0\u81C2\u81BA\u81C9\u81CD\u81D1\u81D9\u81D8\u81C8\u81DA\u81DF\u81E0\u81E7\u81FA\u81FB\u81FE\u8201\u8202\u8205\u8207\u820A\u820D\u8210\u8216\u8229\u822B\u8238\u8233\u8240\u8259\u8258\u825D\u825A\u825F\u8264"],
      ["e480", "\u8262\u8268\u826A\u826B\u822E\u8271\u8277\u8278\u827E\u828D\u8292\u82AB\u829F\u82BB\u82AC\u82E1\u82E3\u82DF\u82D2\u82F4\u82F3\u82FA\u8393\u8303\u82FB\u82F9\u82DE\u8306\u82DC\u8309\u82D9\u8335\u8334\u8316\u8332\u8331\u8340\u8339\u8350\u8345\u832F\u832B\u8317\u8318\u8385\u839A\u83AA\u839F\u83A2\u8396\u8323\u838E\u8387\u838A\u837C\u83B5\u8373\u8375\u83A0\u8389\u83A8\u83F4\u8413\u83EB\u83CE\u83FD\u8403\u83D8\u840B\u83C1\u83F7\u8407\u83E0\u83F2\u840D\u8422\u8420\u83BD\u8438\u8506\u83FB\u846D\u842A\u843C\u855A\u8484\u8477\u846B\u84AD\u846E\u8482\u8469\u8446\u842C\u846F\u8479\u8435\u84CA\u8462\u84B9\u84BF\u849F\u84D9\u84CD\u84BB\u84DA\u84D0\u84C1\u84C6\u84D6\u84A1\u8521\u84FF\u84F4\u8517\u8518\u852C\u851F\u8515\u8514\u84FC\u8540\u8563\u8558\u8548"],
      ["e540", "\u8541\u8602\u854B\u8555\u8580\u85A4\u8588\u8591\u858A\u85A8\u856D\u8594\u859B\u85EA\u8587\u859C\u8577\u857E\u8590\u85C9\u85BA\u85CF\u85B9\u85D0\u85D5\u85DD\u85E5\u85DC\u85F9\u860A\u8613\u860B\u85FE\u85FA\u8606\u8622\u861A\u8630\u863F\u864D\u4E55\u8654\u865F\u8667\u8671\u8693\u86A3\u86A9\u86AA\u868B\u868C\u86B6\u86AF\u86C4\u86C6\u86B0\u86C9\u8823\u86AB\u86D4\u86DE\u86E9\u86EC"],
      ["e580", "\u86DF\u86DB\u86EF\u8712\u8706\u8708\u8700\u8703\u86FB\u8711\u8709\u870D\u86F9\u870A\u8734\u873F\u8737\u873B\u8725\u8729\u871A\u8760\u875F\u8778\u874C\u874E\u8774\u8757\u8768\u876E\u8759\u8753\u8763\u876A\u8805\u87A2\u879F\u8782\u87AF\u87CB\u87BD\u87C0\u87D0\u96D6\u87AB\u87C4\u87B3\u87C7\u87C6\u87BB\u87EF\u87F2\u87E0\u880F\u880D\u87FE\u87F6\u87F7\u880E\u87D2\u8811\u8816\u8815\u8822\u8821\u8831\u8836\u8839\u8827\u883B\u8844\u8842\u8852\u8859\u885E\u8862\u886B\u8881\u887E\u889E\u8875\u887D\u88B5\u8872\u8882\u8897\u8892\u88AE\u8899\u88A2\u888D\u88A4\u88B0\u88BF\u88B1\u88C3\u88C4\u88D4\u88D8\u88D9\u88DD\u88F9\u8902\u88FC\u88F4\u88E8\u88F2\u8904\u890C\u890A\u8913\u8943\u891E\u8925\u892A\u892B\u8941\u8944\u893B\u8936\u8938\u894C\u891D\u8960\u895E"],
      ["e640", "\u8966\u8964\u896D\u896A\u896F\u8974\u8977\u897E\u8983\u8988\u898A\u8993\u8998\u89A1\u89A9\u89A6\u89AC\u89AF\u89B2\u89BA\u89BD\u89BF\u89C0\u89DA\u89DC\u89DD\u89E7\u89F4\u89F8\u8A03\u8A16\u8A10\u8A0C\u8A1B\u8A1D\u8A25\u8A36\u8A41\u8A5B\u8A52\u8A46\u8A48\u8A7C\u8A6D\u8A6C\u8A62\u8A85\u8A82\u8A84\u8AA8\u8AA1\u8A91\u8AA5\u8AA6\u8A9A\u8AA3\u8AC4\u8ACD\u8AC2\u8ADA\u8AEB\u8AF3\u8AE7"],
      ["e680", "\u8AE4\u8AF1\u8B14\u8AE0\u8AE2\u8AF7\u8ADE\u8ADB\u8B0C\u8B07\u8B1A\u8AE1\u8B16\u8B10\u8B17\u8B20\u8B33\u97AB\u8B26\u8B2B\u8B3E\u8B28\u8B41\u8B4C\u8B4F\u8B4E\u8B49\u8B56\u8B5B\u8B5A\u8B6B\u8B5F\u8B6C\u8B6F\u8B74\u8B7D\u8B80\u8B8C\u8B8E\u8B92\u8B93\u8B96\u8B99\u8B9A\u8C3A\u8C41\u8C3F\u8C48\u8C4C\u8C4E\u8C50\u8C55\u8C62\u8C6C\u8C78\u8C7A\u8C82\u8C89\u8C85\u8C8A\u8C8D\u8C8E\u8C94\u8C7C\u8C98\u621D\u8CAD\u8CAA\u8CBD\u8CB2\u8CB3\u8CAE\u8CB6\u8CC8\u8CC1\u8CE4\u8CE3\u8CDA\u8CFD\u8CFA\u8CFB\u8D04\u8D05\u8D0A\u8D07\u8D0F\u8D0D\u8D10\u9F4E\u8D13\u8CCD\u8D14\u8D16\u8D67\u8D6D\u8D71\u8D73\u8D81\u8D99\u8DC2\u8DBE\u8DBA\u8DCF\u8DDA\u8DD6\u8DCC\u8DDB\u8DCB\u8DEA\u8DEB\u8DDF\u8DE3\u8DFC\u8E08\u8E09\u8DFF\u8E1D\u8E1E\u8E10\u8E1F\u8E42\u8E35\u8E30\u8E34\u8E4A"],
      ["e740", "\u8E47\u8E49\u8E4C\u8E50\u8E48\u8E59\u8E64\u8E60\u8E2A\u8E63\u8E55\u8E76\u8E72\u8E7C\u8E81\u8E87\u8E85\u8E84\u8E8B\u8E8A\u8E93\u8E91\u8E94\u8E99\u8EAA\u8EA1\u8EAC\u8EB0\u8EC6\u8EB1\u8EBE\u8EC5\u8EC8\u8ECB\u8EDB\u8EE3\u8EFC\u8EFB\u8EEB\u8EFE\u8F0A\u8F05\u8F15\u8F12\u8F19\u8F13\u8F1C\u8F1F\u8F1B\u8F0C\u8F26\u8F33\u8F3B\u8F39\u8F45\u8F42\u8F3E\u8F4C\u8F49\u8F46\u8F4E\u8F57\u8F5C"],
      ["e780", "\u8F62\u8F63\u8F64\u8F9C\u8F9F\u8FA3\u8FAD\u8FAF\u8FB7\u8FDA\u8FE5\u8FE2\u8FEA\u8FEF\u9087\u8FF4\u9005\u8FF9\u8FFA\u9011\u9015\u9021\u900D\u901E\u9016\u900B\u9027\u9036\u9035\u9039\u8FF8\u904F\u9050\u9051\u9052\u900E\u9049\u903E\u9056\u9058\u905E\u9068\u906F\u9076\u96A8\u9072\u9082\u907D\u9081\u9080\u908A\u9089\u908F\u90A8\u90AF\u90B1\u90B5\u90E2\u90E4\u6248\u90DB\u9102\u9112\u9119\u9132\u9130\u914A\u9156\u9158\u9163\u9165\u9169\u9173\u9172\u918B\u9189\u9182\u91A2\u91AB\u91AF\u91AA\u91B5\u91B4\u91BA\u91C0\u91C1\u91C9\u91CB\u91D0\u91D6\u91DF\u91E1\u91DB\u91FC\u91F5\u91F6\u921E\u91FF\u9214\u922C\u9215\u9211\u925E\u9257\u9245\u9249\u9264\u9248\u9295\u923F\u924B\u9250\u929C\u9296\u9293\u929B\u925A\u92CF\u92B9\u92B7\u92E9\u930F\u92FA\u9344\u932E"],
      ["e840", "\u9319\u9322\u931A\u9323\u933A\u9335\u933B\u935C\u9360\u937C\u936E\u9356\u93B0\u93AC\u93AD\u9394\u93B9\u93D6\u93D7\u93E8\u93E5\u93D8\u93C3\u93DD\u93D0\u93C8\u93E4\u941A\u9414\u9413\u9403\u9407\u9410\u9436\u942B\u9435\u9421\u943A\u9441\u9452\u9444\u945B\u9460\u9462\u945E\u946A\u9229\u9470\u9475\u9477\u947D\u945A\u947C\u947E\u9481\u947F\u9582\u9587\u958A\u9594\u9596\u9598\u9599"],
      ["e880", "\u95A0\u95A8\u95A7\u95AD\u95BC\u95BB\u95B9\u95BE\u95CA\u6FF6\u95C3\u95CD\u95CC\u95D5\u95D4\u95D6\u95DC\u95E1\u95E5\u95E2\u9621\u9628\u962E\u962F\u9642\u964C\u964F\u964B\u9677\u965C\u965E\u965D\u965F\u9666\u9672\u966C\u968D\u9698\u9695\u9697\u96AA\u96A7\u96B1\u96B2\u96B0\u96B4\u96B6\u96B8\u96B9\u96CE\u96CB\u96C9\u96CD\u894D\u96DC\u970D\u96D5\u96F9\u9704\u9706\u9708\u9713\u970E\u9711\u970F\u9716\u9719\u9724\u972A\u9730\u9739\u973D\u973E\u9744\u9746\u9748\u9742\u9749\u975C\u9760\u9764\u9766\u9768\u52D2\u976B\u9771\u9779\u9785\u977C\u9781\u977A\u9786\u978B\u978F\u9790\u979C\u97A8\u97A6\u97A3\u97B3\u97B4\u97C3\u97C6\u97C8\u97CB\u97DC\u97ED\u9F4F\u97F2\u7ADF\u97F6\u97F5\u980F\u980C\u9838\u9824\u9821\u9837\u983D\u9846\u984F\u984B\u986B\u986F\u9870"],
      ["e940", "\u9871\u9874\u9873\u98AA\u98AF\u98B1\u98B6\u98C4\u98C3\u98C6\u98E9\u98EB\u9903\u9909\u9912\u9914\u9918\u9921\u991D\u991E\u9924\u9920\u992C\u992E\u993D\u993E\u9942\u9949\u9945\u9950\u994B\u9951\u9952\u994C\u9955\u9997\u9998\u99A5\u99AD\u99AE\u99BC\u99DF\u99DB\u99DD\u99D8\u99D1\u99ED\u99EE\u99F1\u99F2\u99FB\u99F8\u9A01\u9A0F\u9A05\u99E2\u9A19\u9A2B\u9A37\u9A45\u9A42\u9A40\u9A43"],
      ["e980", "\u9A3E\u9A55\u9A4D\u9A5B\u9A57\u9A5F\u9A62\u9A65\u9A64\u9A69\u9A6B\u9A6A\u9AAD\u9AB0\u9ABC\u9AC0\u9ACF\u9AD1\u9AD3\u9AD4\u9ADE\u9ADF\u9AE2\u9AE3\u9AE6\u9AEF\u9AEB\u9AEE\u9AF4\u9AF1\u9AF7\u9AFB\u9B06\u9B18\u9B1A\u9B1F\u9B22\u9B23\u9B25\u9B27\u9B28\u9B29\u9B2A\u9B2E\u9B2F\u9B32\u9B44\u9B43\u9B4F\u9B4D\u9B4E\u9B51\u9B58\u9B74\u9B93\u9B83\u9B91\u9B96\u9B97\u9B9F\u9BA0\u9BA8\u9BB4\u9BC0\u9BCA\u9BB9\u9BC6\u9BCF\u9BD1\u9BD2\u9BE3\u9BE2\u9BE4\u9BD4\u9BE1\u9C3A\u9BF2\u9BF1\u9BF0\u9C15\u9C14\u9C09\u9C13\u9C0C\u9C06\u9C08\u9C12\u9C0A\u9C04\u9C2E\u9C1B\u9C25\u9C24\u9C21\u9C30\u9C47\u9C32\u9C46\u9C3E\u9C5A\u9C60\u9C67\u9C76\u9C78\u9CE7\u9CEC\u9CF0\u9D09\u9D08\u9CEB\u9D03\u9D06\u9D2A\u9D26\u9DAF\u9D23\u9D1F\u9D44\u9D15\u9D12\u9D41\u9D3F\u9D3E\u9D46\u9D48"],
      ["ea40", "\u9D5D\u9D5E\u9D64\u9D51\u9D50\u9D59\u9D72\u9D89\u9D87\u9DAB\u9D6F\u9D7A\u9D9A\u9DA4\u9DA9\u9DB2\u9DC4\u9DC1\u9DBB\u9DB8\u9DBA\u9DC6\u9DCF\u9DC2\u9DD9\u9DD3\u9DF8\u9DE6\u9DED\u9DEF\u9DFD\u9E1A\u9E1B\u9E1E\u9E75\u9E79\u9E7D\u9E81\u9E88\u9E8B\u9E8C\u9E92\u9E95\u9E91\u9E9D\u9EA5\u9EA9\u9EB8\u9EAA\u9EAD\u9761\u9ECC\u9ECE\u9ECF\u9ED0\u9ED4\u9EDC\u9EDE\u9EDD\u9EE0\u9EE5\u9EE8\u9EEF"],
      ["ea80", "\u9EF4\u9EF6\u9EF7\u9EF9\u9EFB\u9EFC\u9EFD\u9F07\u9F08\u76B7\u9F15\u9F21\u9F2C\u9F3E\u9F4A\u9F52\u9F54\u9F63\u9F5F\u9F60\u9F61\u9F66\u9F67\u9F6C\u9F6A\u9F77\u9F72\u9F76\u9F95\u9F9C\u9FA0\u582F\u69C7\u9059\u7464\u51DC\u7199"],
      ["ed40", "\u7E8A\u891C\u9348\u9288\u84DC\u4FC9\u70BB\u6631\u68C8\u92F9\u66FB\u5F45\u4E28\u4EE1\u4EFC\u4F00\u4F03\u4F39\u4F56\u4F92\u4F8A\u4F9A\u4F94\u4FCD\u5040\u5022\u4FFF\u501E\u5046\u5070\u5042\u5094\u50F4\u50D8\u514A\u5164\u519D\u51BE\u51EC\u5215\u529C\u52A6\u52C0\u52DB\u5300\u5307\u5324\u5372\u5393\u53B2\u53DD\uFA0E\u549C\u548A\u54A9\u54FF\u5586\u5759\u5765\u57AC\u57C8\u57C7\uFA0F"],
      ["ed80", "\uFA10\u589E\u58B2\u590B\u5953\u595B\u595D\u5963\u59A4\u59BA\u5B56\u5BC0\u752F\u5BD8\u5BEC\u5C1E\u5CA6\u5CBA\u5CF5\u5D27\u5D53\uFA11\u5D42\u5D6D\u5DB8\u5DB9\u5DD0\u5F21\u5F34\u5F67\u5FB7\u5FDE\u605D\u6085\u608A\u60DE\u60D5\u6120\u60F2\u6111\u6137\u6130\u6198\u6213\u62A6\u63F5\u6460\u649D\u64CE\u654E\u6600\u6615\u663B\u6609\u662E\u661E\u6624\u6665\u6657\u6659\uFA12\u6673\u6699\u66A0\u66B2\u66BF\u66FA\u670E\uF929\u6766\u67BB\u6852\u67C0\u6801\u6844\u68CF\uFA13\u6968\uFA14\u6998\u69E2\u6A30\u6A6B\u6A46\u6A73\u6A7E\u6AE2\u6AE4\u6BD6\u6C3F\u6C5C\u6C86\u6C6F\u6CDA\u6D04\u6D87\u6D6F\u6D96\u6DAC\u6DCF\u6DF8\u6DF2\u6DFC\u6E39\u6E5C\u6E27\u6E3C\u6EBF\u6F88\u6FB5\u6FF5\u7005\u7007\u7028\u7085\u70AB\u710F\u7104\u715C\u7146\u7147\uFA15\u71C1\u71FE\u72B1"],
      ["ee40", "\u72BE\u7324\uFA16\u7377\u73BD\u73C9\u73D6\u73E3\u73D2\u7407\u73F5\u7426\u742A\u7429\u742E\u7462\u7489\u749F\u7501\u756F\u7682\u769C\u769E\u769B\u76A6\uFA17\u7746\u52AF\u7821\u784E\u7864\u787A\u7930\uFA18\uFA19\uFA1A\u7994\uFA1B\u799B\u7AD1\u7AE7\uFA1C\u7AEB\u7B9E\uFA1D\u7D48\u7D5C\u7DB7\u7DA0\u7DD6\u7E52\u7F47\u7FA1\uFA1E\u8301\u8362\u837F\u83C7\u83F6\u8448\u84B4\u8553\u8559"],
      ["ee80", "\u856B\uFA1F\u85B0\uFA20\uFA21\u8807\u88F5\u8A12\u8A37\u8A79\u8AA7\u8ABE\u8ADF\uFA22\u8AF6\u8B53\u8B7F\u8CF0\u8CF4\u8D12\u8D76\uFA23\u8ECF\uFA24\uFA25\u9067\u90DE\uFA26\u9115\u9127\u91DA\u91D7\u91DE\u91ED\u91EE\u91E4\u91E5\u9206\u9210\u920A\u923A\u9240\u923C\u924E\u9259\u9251\u9239\u9267\u92A7\u9277\u9278\u92E7\u92D7\u92D9\u92D0\uFA27\u92D5\u92E0\u92D3\u9325\u9321\u92FB\uFA28\u931E\u92FF\u931D\u9302\u9370\u9357\u93A4\u93C6\u93DE\u93F8\u9431\u9445\u9448\u9592\uF9DC\uFA29\u969D\u96AF\u9733\u973B\u9743\u974D\u974F\u9751\u9755\u9857\u9865\uFA2A\uFA2B\u9927\uFA2C\u999E\u9A4E\u9AD9\u9ADC\u9B75\u9B72\u9B8F\u9BB1\u9BBB\u9C00\u9D70\u9D6B\uFA2D\u9E19\u9ED1"],
      ["eeef", "\u2170", 9, "\uFFE2\uFFE4\uFF07\uFF02"],
      ["f040", "\uE000", 62],
      ["f080", "\uE03F", 124],
      ["f140", "\uE0BC", 62],
      ["f180", "\uE0FB", 124],
      ["f240", "\uE178", 62],
      ["f280", "\uE1B7", 124],
      ["f340", "\uE234", 62],
      ["f380", "\uE273", 124],
      ["f440", "\uE2F0", 62],
      ["f480", "\uE32F", 124],
      ["f540", "\uE3AC", 62],
      ["f580", "\uE3EB", 124],
      ["f640", "\uE468", 62],
      ["f680", "\uE4A7", 124],
      ["f740", "\uE524", 62],
      ["f780", "\uE563", 124],
      ["f840", "\uE5E0", 62],
      ["f880", "\uE61F", 124],
      ["f940", "\uE69C"],
      ["fa40", "\u2170", 9, "\u2160", 9, "\uFFE2\uFFE4\uFF07\uFF02\u3231\u2116\u2121\u2235\u7E8A\u891C\u9348\u9288\u84DC\u4FC9\u70BB\u6631\u68C8\u92F9\u66FB\u5F45\u4E28\u4EE1\u4EFC\u4F00\u4F03\u4F39\u4F56\u4F92\u4F8A\u4F9A\u4F94\u4FCD\u5040\u5022\u4FFF\u501E\u5046\u5070\u5042\u5094\u50F4\u50D8\u514A"],
      ["fa80", "\u5164\u519D\u51BE\u51EC\u5215\u529C\u52A6\u52C0\u52DB\u5300\u5307\u5324\u5372\u5393\u53B2\u53DD\uFA0E\u549C\u548A\u54A9\u54FF\u5586\u5759\u5765\u57AC\u57C8\u57C7\uFA0F\uFA10\u589E\u58B2\u590B\u5953\u595B\u595D\u5963\u59A4\u59BA\u5B56\u5BC0\u752F\u5BD8\u5BEC\u5C1E\u5CA6\u5CBA\u5CF5\u5D27\u5D53\uFA11\u5D42\u5D6D\u5DB8\u5DB9\u5DD0\u5F21\u5F34\u5F67\u5FB7\u5FDE\u605D\u6085\u608A\u60DE\u60D5\u6120\u60F2\u6111\u6137\u6130\u6198\u6213\u62A6\u63F5\u6460\u649D\u64CE\u654E\u6600\u6615\u663B\u6609\u662E\u661E\u6624\u6665\u6657\u6659\uFA12\u6673\u6699\u66A0\u66B2\u66BF\u66FA\u670E\uF929\u6766\u67BB\u6852\u67C0\u6801\u6844\u68CF\uFA13\u6968\uFA14\u6998\u69E2\u6A30\u6A6B\u6A46\u6A73\u6A7E\u6AE2\u6AE4\u6BD6\u6C3F\u6C5C\u6C86\u6C6F\u6CDA\u6D04\u6D87\u6D6F"],
      ["fb40", "\u6D96\u6DAC\u6DCF\u6DF8\u6DF2\u6DFC\u6E39\u6E5C\u6E27\u6E3C\u6EBF\u6F88\u6FB5\u6FF5\u7005\u7007\u7028\u7085\u70AB\u710F\u7104\u715C\u7146\u7147\uFA15\u71C1\u71FE\u72B1\u72BE\u7324\uFA16\u7377\u73BD\u73C9\u73D6\u73E3\u73D2\u7407\u73F5\u7426\u742A\u7429\u742E\u7462\u7489\u749F\u7501\u756F\u7682\u769C\u769E\u769B\u76A6\uFA17\u7746\u52AF\u7821\u784E\u7864\u787A\u7930\uFA18\uFA19"],
      ["fb80", "\uFA1A\u7994\uFA1B\u799B\u7AD1\u7AE7\uFA1C\u7AEB\u7B9E\uFA1D\u7D48\u7D5C\u7DB7\u7DA0\u7DD6\u7E52\u7F47\u7FA1\uFA1E\u8301\u8362\u837F\u83C7\u83F6\u8448\u84B4\u8553\u8559\u856B\uFA1F\u85B0\uFA20\uFA21\u8807\u88F5\u8A12\u8A37\u8A79\u8AA7\u8ABE\u8ADF\uFA22\u8AF6\u8B53\u8B7F\u8CF0\u8CF4\u8D12\u8D76\uFA23\u8ECF\uFA24\uFA25\u9067\u90DE\uFA26\u9115\u9127\u91DA\u91D7\u91DE\u91ED\u91EE\u91E4\u91E5\u9206\u9210\u920A\u923A\u9240\u923C\u924E\u9259\u9251\u9239\u9267\u92A7\u9277\u9278\u92E7\u92D7\u92D9\u92D0\uFA27\u92D5\u92E0\u92D3\u9325\u9321\u92FB\uFA28\u931E\u92FF\u931D\u9302\u9370\u9357\u93A4\u93C6\u93DE\u93F8\u9431\u9445\u9448\u9592\uF9DC\uFA29\u969D\u96AF\u9733\u973B\u9743\u974D\u974F\u9751\u9755\u9857\u9865\uFA2A\uFA2B\u9927\uFA2C\u999E\u9A4E\u9AD9"],
      ["fc40", "\u9ADC\u9B75\u9B72\u9B8F\u9BB1\u9BBB\u9C00\u9D70\u9D6B\uFA2D\u9E19\u9ED1"]
    ];
  }
});

// ../../../node_modules/encoding/node_modules/iconv-lite/encodings/tables/eucjp.json
var require_eucjp = __commonJS({
  "../../../node_modules/encoding/node_modules/iconv-lite/encodings/tables/eucjp.json"(exports, module2) {
    module2.exports = [
      ["0", "\0", 127],
      ["8ea1", "\uFF61", 62],
      ["a1a1", "\u3000\u3001\u3002\uFF0C\uFF0E\u30FB\uFF1A\uFF1B\uFF1F\uFF01\u309B\u309C\xB4\uFF40\xA8\uFF3E\uFFE3\uFF3F\u30FD\u30FE\u309D\u309E\u3003\u4EDD\u3005\u3006\u3007\u30FC\u2015\u2010\uFF0F\uFF3C\uFF5E\u2225\uFF5C\u2026\u2025\u2018\u2019\u201C\u201D\uFF08\uFF09\u3014\u3015\uFF3B\uFF3D\uFF5B\uFF5D\u3008", 9, "\uFF0B\uFF0D\xB1\xD7\xF7\uFF1D\u2260\uFF1C\uFF1E\u2266\u2267\u221E\u2234\u2642\u2640\xB0\u2032\u2033\u2103\uFFE5\uFF04\uFFE0\uFFE1\uFF05\uFF03\uFF06\uFF0A\uFF20\xA7\u2606\u2605\u25CB\u25CF\u25CE\u25C7"],
      ["a2a1", "\u25C6\u25A1\u25A0\u25B3\u25B2\u25BD\u25BC\u203B\u3012\u2192\u2190\u2191\u2193\u3013"],
      ["a2ba", "\u2208\u220B\u2286\u2287\u2282\u2283\u222A\u2229"],
      ["a2ca", "\u2227\u2228\uFFE2\u21D2\u21D4\u2200\u2203"],
      ["a2dc", "\u2220\u22A5\u2312\u2202\u2207\u2261\u2252\u226A\u226B\u221A\u223D\u221D\u2235\u222B\u222C"],
      ["a2f2", "\u212B\u2030\u266F\u266D\u266A\u2020\u2021\xB6"],
      ["a2fe", "\u25EF"],
      ["a3b0", "\uFF10", 9],
      ["a3c1", "\uFF21", 25],
      ["a3e1", "\uFF41", 25],
      ["a4a1", "\u3041", 82],
      ["a5a1", "\u30A1", 85],
      ["a6a1", "\u0391", 16, "\u03A3", 6],
      ["a6c1", "\u03B1", 16, "\u03C3", 6],
      ["a7a1", "\u0410", 5, "\u0401\u0416", 25],
      ["a7d1", "\u0430", 5, "\u0451\u0436", 25],
      ["a8a1", "\u2500\u2502\u250C\u2510\u2518\u2514\u251C\u252C\u2524\u2534\u253C\u2501\u2503\u250F\u2513\u251B\u2517\u2523\u2533\u252B\u253B\u254B\u2520\u252F\u2528\u2537\u253F\u251D\u2530\u2525\u2538\u2542"],
      ["ada1", "\u2460", 19, "\u2160", 9],
      ["adc0", "\u3349\u3314\u3322\u334D\u3318\u3327\u3303\u3336\u3351\u3357\u330D\u3326\u3323\u332B\u334A\u333B\u339C\u339D\u339E\u338E\u338F\u33C4\u33A1"],
      ["addf", "\u337B\u301D\u301F\u2116\u33CD\u2121\u32A4", 4, "\u3231\u3232\u3239\u337E\u337D\u337C\u2252\u2261\u222B\u222E\u2211\u221A\u22A5\u2220\u221F\u22BF\u2235\u2229\u222A"],
      ["b0a1", "\u4E9C\u5516\u5A03\u963F\u54C0\u611B\u6328\u59F6\u9022\u8475\u831C\u7A50\u60AA\u63E1\u6E25\u65ED\u8466\u82A6\u9BF5\u6893\u5727\u65A1\u6271\u5B9B\u59D0\u867B\u98F4\u7D62\u7DBE\u9B8E\u6216\u7C9F\u88B7\u5B89\u5EB5\u6309\u6697\u6848\u95C7\u978D\u674F\u4EE5\u4F0A\u4F4D\u4F9D\u5049\u56F2\u5937\u59D4\u5A01\u5C09\u60DF\u610F\u6170\u6613\u6905\u70BA\u754F\u7570\u79FB\u7DAD\u7DEF\u80C3\u840E\u8863\u8B02\u9055\u907A\u533B\u4E95\u4EA5\u57DF\u80B2\u90C1\u78EF\u4E00\u58F1\u6EA2\u9038\u7A32\u8328\u828B\u9C2F\u5141\u5370\u54BD\u54E1\u56E0\u59FB\u5F15\u98F2\u6DEB\u80E4\u852D"],
      ["b1a1", "\u9662\u9670\u96A0\u97FB\u540B\u53F3\u5B87\u70CF\u7FBD\u8FC2\u96E8\u536F\u9D5C\u7ABA\u4E11\u7893\u81FC\u6E26\u5618\u5504\u6B1D\u851A\u9C3B\u59E5\u53A9\u6D66\u74DC\u958F\u5642\u4E91\u904B\u96F2\u834F\u990C\u53E1\u55B6\u5B30\u5F71\u6620\u66F3\u6804\u6C38\u6CF3\u6D29\u745B\u76C8\u7A4E\u9834\u82F1\u885B\u8A60\u92ED\u6DB2\u75AB\u76CA\u99C5\u60A6\u8B01\u8D8A\u95B2\u698E\u53AD\u5186\u5712\u5830\u5944\u5BB4\u5EF6\u6028\u63A9\u63F4\u6CBF\u6F14\u708E\u7114\u7159\u71D5\u733F\u7E01\u8276\u82D1\u8597\u9060\u925B\u9D1B\u5869\u65BC\u6C5A\u7525\u51F9\u592E\u5965\u5F80\u5FDC"],
      ["b2a1", "\u62BC\u65FA\u6A2A\u6B27\u6BB4\u738B\u7FC1\u8956\u9D2C\u9D0E\u9EC4\u5CA1\u6C96\u837B\u5104\u5C4B\u61B6\u81C6\u6876\u7261\u4E59\u4FFA\u5378\u6069\u6E29\u7A4F\u97F3\u4E0B\u5316\u4EEE\u4F55\u4F3D\u4FA1\u4F73\u52A0\u53EF\u5609\u590F\u5AC1\u5BB6\u5BE1\u79D1\u6687\u679C\u67B6\u6B4C\u6CB3\u706B\u73C2\u798D\u79BE\u7A3C\u7B87\u82B1\u82DB\u8304\u8377\u83EF\u83D3\u8766\u8AB2\u5629\u8CA8\u8FE6\u904E\u971E\u868A\u4FC4\u5CE8\u6211\u7259\u753B\u81E5\u82BD\u86FE\u8CC0\u96C5\u9913\u99D5\u4ECB\u4F1A\u89E3\u56DE\u584A\u58CA\u5EFB\u5FEB\u602A\u6094\u6062\u61D0\u6212\u62D0\u6539"],
      ["b3a1", "\u9B41\u6666\u68B0\u6D77\u7070\u754C\u7686\u7D75\u82A5\u87F9\u958B\u968E\u8C9D\u51F1\u52BE\u5916\u54B3\u5BB3\u5D16\u6168\u6982\u6DAF\u788D\u84CB\u8857\u8A72\u93A7\u9AB8\u6D6C\u99A8\u86D9\u57A3\u67FF\u86CE\u920E\u5283\u5687\u5404\u5ED3\u62E1\u64B9\u683C\u6838\u6BBB\u7372\u78BA\u7A6B\u899A\u89D2\u8D6B\u8F03\u90ED\u95A3\u9694\u9769\u5B66\u5CB3\u697D\u984D\u984E\u639B\u7B20\u6A2B\u6A7F\u68B6\u9C0D\u6F5F\u5272\u559D\u6070\u62EC\u6D3B\u6E07\u6ED1\u845B\u8910\u8F44\u4E14\u9C39\u53F6\u691B\u6A3A\u9784\u682A\u515C\u7AC3\u84B2\u91DC\u938C\u565B\u9D28\u6822\u8305\u8431"],
      ["b4a1", "\u7CA5\u5208\u82C5\u74E6\u4E7E\u4F83\u51A0\u5BD2\u520A\u52D8\u52E7\u5DFB\u559A\u582A\u59E6\u5B8C\u5B98\u5BDB\u5E72\u5E79\u60A3\u611F\u6163\u61BE\u63DB\u6562\u67D1\u6853\u68FA\u6B3E\u6B53\u6C57\u6F22\u6F97\u6F45\u74B0\u7518\u76E3\u770B\u7AFF\u7BA1\u7C21\u7DE9\u7F36\u7FF0\u809D\u8266\u839E\u89B3\u8ACC\u8CAB\u9084\u9451\u9593\u9591\u95A2\u9665\u97D3\u9928\u8218\u4E38\u542B\u5CB8\u5DCC\u73A9\u764C\u773C\u5CA9\u7FEB\u8D0B\u96C1\u9811\u9854\u9858\u4F01\u4F0E\u5371\u559C\u5668\u57FA\u5947\u5B09\u5BC4\u5C90\u5E0C\u5E7E\u5FCC\u63EE\u673A\u65D7\u65E2\u671F\u68CB\u68C4"],
      ["b5a1", "\u6A5F\u5E30\u6BC5\u6C17\u6C7D\u757F\u7948\u5B63\u7A00\u7D00\u5FBD\u898F\u8A18\u8CB4\u8D77\u8ECC\u8F1D\u98E2\u9A0E\u9B3C\u4E80\u507D\u5100\u5993\u5B9C\u622F\u6280\u64EC\u6B3A\u72A0\u7591\u7947\u7FA9\u87FB\u8ABC\u8B70\u63AC\u83CA\u97A0\u5409\u5403\u55AB\u6854\u6A58\u8A70\u7827\u6775\u9ECD\u5374\u5BA2\u811A\u8650\u9006\u4E18\u4E45\u4EC7\u4F11\u53CA\u5438\u5BAE\u5F13\u6025\u6551\u673D\u6C42\u6C72\u6CE3\u7078\u7403\u7A76\u7AAE\u7B08\u7D1A\u7CFE\u7D66\u65E7\u725B\u53BB\u5C45\u5DE8\u62D2\u62E0\u6319\u6E20\u865A\u8A31\u8DDD\u92F8\u6F01\u79A6\u9B5A\u4EA8\u4EAB\u4EAC"],
      ["b6a1", "\u4F9B\u4FA0\u50D1\u5147\u7AF6\u5171\u51F6\u5354\u5321\u537F\u53EB\u55AC\u5883\u5CE1\u5F37\u5F4A\u602F\u6050\u606D\u631F\u6559\u6A4B\u6CC1\u72C2\u72ED\u77EF\u80F8\u8105\u8208\u854E\u90F7\u93E1\u97FF\u9957\u9A5A\u4EF0\u51DD\u5C2D\u6681\u696D\u5C40\u66F2\u6975\u7389\u6850\u7C81\u50C5\u52E4\u5747\u5DFE\u9326\u65A4\u6B23\u6B3D\u7434\u7981\u79BD\u7B4B\u7DCA\u82B9\u83CC\u887F\u895F\u8B39\u8FD1\u91D1\u541F\u9280\u4E5D\u5036\u53E5\u533A\u72D7\u7396\u77E9\u82E6\u8EAF\u99C6\u99C8\u99D2\u5177\u611A\u865E\u55B0\u7A7A\u5076\u5BD3\u9047\u9685\u4E32\u6ADB\u91E7\u5C51\u5C48"],
      ["b7a1", "\u6398\u7A9F\u6C93\u9774\u8F61\u7AAA\u718A\u9688\u7C82\u6817\u7E70\u6851\u936C\u52F2\u541B\u85AB\u8A13\u7FA4\u8ECD\u90E1\u5366\u8888\u7941\u4FC2\u50BE\u5211\u5144\u5553\u572D\u73EA\u578B\u5951\u5F62\u5F84\u6075\u6176\u6167\u61A9\u63B2\u643A\u656C\u666F\u6842\u6E13\u7566\u7A3D\u7CFB\u7D4C\u7D99\u7E4B\u7F6B\u830E\u834A\u86CD\u8A08\u8A63\u8B66\u8EFD\u981A\u9D8F\u82B8\u8FCE\u9BE8\u5287\u621F\u6483\u6FC0\u9699\u6841\u5091\u6B20\u6C7A\u6F54\u7A74\u7D50\u8840\u8A23\u6708\u4EF6\u5039\u5026\u5065\u517C\u5238\u5263\u55A7\u570F\u5805\u5ACC\u5EFA\u61B2\u61F8\u62F3\u6372"],
      ["b8a1", "\u691C\u6A29\u727D\u72AC\u732E\u7814\u786F\u7D79\u770C\u80A9\u898B\u8B19\u8CE2\u8ED2\u9063\u9375\u967A\u9855\u9A13\u9E78\u5143\u539F\u53B3\u5E7B\u5F26\u6E1B\u6E90\u7384\u73FE\u7D43\u8237\u8A00\u8AFA\u9650\u4E4E\u500B\u53E4\u547C\u56FA\u59D1\u5B64\u5DF1\u5EAB\u5F27\u6238\u6545\u67AF\u6E56\u72D0\u7CCA\u88B4\u80A1\u80E1\u83F0\u864E\u8A87\u8DE8\u9237\u96C7\u9867\u9F13\u4E94\u4E92\u4F0D\u5348\u5449\u543E\u5A2F\u5F8C\u5FA1\u609F\u68A7\u6A8E\u745A\u7881\u8A9E\u8AA4\u8B77\u9190\u4E5E\u9BC9\u4EA4\u4F7C\u4FAF\u5019\u5016\u5149\u516C\u529F\u52B9\u52FE\u539A\u53E3\u5411"],
      ["b9a1", "\u540E\u5589\u5751\u57A2\u597D\u5B54\u5B5D\u5B8F\u5DE5\u5DE7\u5DF7\u5E78\u5E83\u5E9A\u5EB7\u5F18\u6052\u614C\u6297\u62D8\u63A7\u653B\u6602\u6643\u66F4\u676D\u6821\u6897\u69CB\u6C5F\u6D2A\u6D69\u6E2F\u6E9D\u7532\u7687\u786C\u7A3F\u7CE0\u7D05\u7D18\u7D5E\u7DB1\u8015\u8003\u80AF\u80B1\u8154\u818F\u822A\u8352\u884C\u8861\u8B1B\u8CA2\u8CFC\u90CA\u9175\u9271\u783F\u92FC\u95A4\u964D\u9805\u9999\u9AD8\u9D3B\u525B\u52AB\u53F7\u5408\u58D5\u62F7\u6FE0\u8C6A\u8F5F\u9EB9\u514B\u523B\u544A\u56FD\u7A40\u9177\u9D60\u9ED2\u7344\u6F09\u8170\u7511\u5FFD\u60DA\u9AA8\u72DB\u8FBC"],
      ["baa1", "\u6B64\u9803\u4ECA\u56F0\u5764\u58BE\u5A5A\u6068\u61C7\u660F\u6606\u6839\u68B1\u6DF7\u75D5\u7D3A\u826E\u9B42\u4E9B\u4F50\u53C9\u5506\u5D6F\u5DE6\u5DEE\u67FB\u6C99\u7473\u7802\u8A50\u9396\u88DF\u5750\u5EA7\u632B\u50B5\u50AC\u518D\u6700\u54C9\u585E\u59BB\u5BB0\u5F69\u624D\u63A1\u683D\u6B73\u6E08\u707D\u91C7\u7280\u7815\u7826\u796D\u658E\u7D30\u83DC\u88C1\u8F09\u969B\u5264\u5728\u6750\u7F6A\u8CA1\u51B4\u5742\u962A\u583A\u698A\u80B4\u54B2\u5D0E\u57FC\u7895\u9DFA\u4F5C\u524A\u548B\u643E\u6628\u6714\u67F5\u7A84\u7B56\u7D22\u932F\u685C\u9BAD\u7B39\u5319\u518A\u5237"],
      ["bba1", "\u5BDF\u62F6\u64AE\u64E6\u672D\u6BBA\u85A9\u96D1\u7690\u9BD6\u634C\u9306\u9BAB\u76BF\u6652\u4E09\u5098\u53C2\u5C71\u60E8\u6492\u6563\u685F\u71E6\u73CA\u7523\u7B97\u7E82\u8695\u8B83\u8CDB\u9178\u9910\u65AC\u66AB\u6B8B\u4ED5\u4ED4\u4F3A\u4F7F\u523A\u53F8\u53F2\u55E3\u56DB\u58EB\u59CB\u59C9\u59FF\u5B50\u5C4D\u5E02\u5E2B\u5FD7\u601D\u6307\u652F\u5B5C\u65AF\u65BD\u65E8\u679D\u6B62\u6B7B\u6C0F\u7345\u7949\u79C1\u7CF8\u7D19\u7D2B\u80A2\u8102\u81F3\u8996\u8A5E\u8A69\u8A66\u8A8C\u8AEE\u8CC7\u8CDC\u96CC\u98FC\u6B6F\u4E8B\u4F3C\u4F8D\u5150\u5B57\u5BFA\u6148\u6301\u6642"],
      ["bca1", "\u6B21\u6ECB\u6CBB\u723E\u74BD\u75D4\u78C1\u793A\u800C\u8033\u81EA\u8494\u8F9E\u6C50\u9E7F\u5F0F\u8B58\u9D2B\u7AFA\u8EF8\u5B8D\u96EB\u4E03\u53F1\u57F7\u5931\u5AC9\u5BA4\u6089\u6E7F\u6F06\u75BE\u8CEA\u5B9F\u8500\u7BE0\u5072\u67F4\u829D\u5C61\u854A\u7E1E\u820E\u5199\u5C04\u6368\u8D66\u659C\u716E\u793E\u7D17\u8005\u8B1D\u8ECA\u906E\u86C7\u90AA\u501F\u52FA\u5C3A\u6753\u707C\u7235\u914C\u91C8\u932B\u82E5\u5BC2\u5F31\u60F9\u4E3B\u53D6\u5B88\u624B\u6731\u6B8A\u72E9\u73E0\u7A2E\u816B\u8DA3\u9152\u9996\u5112\u53D7\u546A\u5BFF\u6388\u6A39\u7DAC\u9700\u56DA\u53CE\u5468"],
      ["bda1", "\u5B97\u5C31\u5DDE\u4FEE\u6101\u62FE\u6D32\u79C0\u79CB\u7D42\u7E4D\u7FD2\u81ED\u821F\u8490\u8846\u8972\u8B90\u8E74\u8F2F\u9031\u914B\u916C\u96C6\u919C\u4EC0\u4F4F\u5145\u5341\u5F93\u620E\u67D4\u6C41\u6E0B\u7363\u7E26\u91CD\u9283\u53D4\u5919\u5BBF\u6DD1\u795D\u7E2E\u7C9B\u587E\u719F\u51FA\u8853\u8FF0\u4FCA\u5CFB\u6625\u77AC\u7AE3\u821C\u99FF\u51C6\u5FAA\u65EC\u696F\u6B89\u6DF3\u6E96\u6F64\u76FE\u7D14\u5DE1\u9075\u9187\u9806\u51E6\u521D\u6240\u6691\u66D9\u6E1A\u5EB6\u7DD2\u7F72\u66F8\u85AF\u85F7\u8AF8\u52A9\u53D9\u5973\u5E8F\u5F90\u6055\u92E4\u9664\u50B7\u511F"],
      ["bea1", "\u52DD\u5320\u5347\u53EC\u54E8\u5546\u5531\u5617\u5968\u59BE\u5A3C\u5BB5\u5C06\u5C0F\u5C11\u5C1A\u5E84\u5E8A\u5EE0\u5F70\u627F\u6284\u62DB\u638C\u6377\u6607\u660C\u662D\u6676\u677E\u68A2\u6A1F\u6A35\u6CBC\u6D88\u6E09\u6E58\u713C\u7126\u7167\u75C7\u7701\u785D\u7901\u7965\u79F0\u7AE0\u7B11\u7CA7\u7D39\u8096\u83D6\u848B\u8549\u885D\u88F3\u8A1F\u8A3C\u8A54\u8A73\u8C61\u8CDE\u91A4\u9266\u937E\u9418\u969C\u9798\u4E0A\u4E08\u4E1E\u4E57\u5197\u5270\u57CE\u5834\u58CC\u5B22\u5E38\u60C5\u64FE\u6761\u6756\u6D44\u72B6\u7573\u7A63\u84B8\u8B72\u91B8\u9320\u5631\u57F4\u98FE"],
      ["bfa1", "\u62ED\u690D\u6B96\u71ED\u7E54\u8077\u8272\u89E6\u98DF\u8755\u8FB1\u5C3B\u4F38\u4FE1\u4FB5\u5507\u5A20\u5BDD\u5BE9\u5FC3\u614E\u632F\u65B0\u664B\u68EE\u699B\u6D78\u6DF1\u7533\u75B9\u771F\u795E\u79E6\u7D33\u81E3\u82AF\u85AA\u89AA\u8A3A\u8EAB\u8F9B\u9032\u91DD\u9707\u4EBA\u4EC1\u5203\u5875\u58EC\u5C0B\u751A\u5C3D\u814E\u8A0A\u8FC5\u9663\u976D\u7B25\u8ACF\u9808\u9162\u56F3\u53A8\u9017\u5439\u5782\u5E25\u63A8\u6C34\u708A\u7761\u7C8B\u7FE0\u8870\u9042\u9154\u9310\u9318\u968F\u745E\u9AC4\u5D07\u5D69\u6570\u67A2\u8DA8\u96DB\u636E\u6749\u6919\u83C5\u9817\u96C0\u88FE"],
      ["c0a1", "\u6F84\u647A\u5BF8\u4E16\u702C\u755D\u662F\u51C4\u5236\u52E2\u59D3\u5F81\u6027\u6210\u653F\u6574\u661F\u6674\u68F2\u6816\u6B63\u6E05\u7272\u751F\u76DB\u7CBE\u8056\u58F0\u88FD\u897F\u8AA0\u8A93\u8ACB\u901D\u9192\u9752\u9759\u6589\u7A0E\u8106\u96BB\u5E2D\u60DC\u621A\u65A5\u6614\u6790\u77F3\u7A4D\u7C4D\u7E3E\u810A\u8CAC\u8D64\u8DE1\u8E5F\u78A9\u5207\u62D9\u63A5\u6442\u6298\u8A2D\u7A83\u7BC0\u8AAC\u96EA\u7D76\u820C\u8749\u4ED9\u5148\u5343\u5360\u5BA3\u5C02\u5C16\u5DDD\u6226\u6247\u64B0\u6813\u6834\u6CC9\u6D45\u6D17\u67D3\u6F5C\u714E\u717D\u65CB\u7A7F\u7BAD\u7DDA"],
      ["c1a1", "\u7E4A\u7FA8\u817A\u821B\u8239\u85A6\u8A6E\u8CCE\u8DF5\u9078\u9077\u92AD\u9291\u9583\u9BAE\u524D\u5584\u6F38\u7136\u5168\u7985\u7E55\u81B3\u7CCE\u564C\u5851\u5CA8\u63AA\u66FE\u66FD\u695A\u72D9\u758F\u758E\u790E\u7956\u79DF\u7C97\u7D20\u7D44\u8607\u8A34\u963B\u9061\u9F20\u50E7\u5275\u53CC\u53E2\u5009\u55AA\u58EE\u594F\u723D\u5B8B\u5C64\u531D\u60E3\u60F3\u635C\u6383\u633F\u63BB\u64CD\u65E9\u66F9\u5DE3\u69CD\u69FD\u6F15\u71E5\u4E89\u75E9\u76F8\u7A93\u7CDF\u7DCF\u7D9C\u8061\u8349\u8358\u846C\u84BC\u85FB\u88C5\u8D70\u9001\u906D\u9397\u971C\u9A12\u50CF\u5897\u618E"],
      ["c2a1", "\u81D3\u8535\u8D08\u9020\u4FC3\u5074\u5247\u5373\u606F\u6349\u675F\u6E2C\u8DB3\u901F\u4FD7\u5C5E\u8CCA\u65CF\u7D9A\u5352\u8896\u5176\u63C3\u5B58\u5B6B\u5C0A\u640D\u6751\u905C\u4ED6\u591A\u592A\u6C70\u8A51\u553E\u5815\u59A5\u60F0\u6253\u67C1\u8235\u6955\u9640\u99C4\u9A28\u4F53\u5806\u5BFE\u8010\u5CB1\u5E2F\u5F85\u6020\u614B\u6234\u66FF\u6CF0\u6EDE\u80CE\u817F\u82D4\u888B\u8CB8\u9000\u902E\u968A\u9EDB\u9BDB\u4EE3\u53F0\u5927\u7B2C\u918D\u984C\u9DF9\u6EDD\u7027\u5353\u5544\u5B85\u6258\u629E\u62D3\u6CA2\u6FEF\u7422\u8A17\u9438\u6FC1\u8AFE\u8338\u51E7\u86F8\u53EA"],
      ["c3a1", "\u53E9\u4F46\u9054\u8FB0\u596A\u8131\u5DFD\u7AEA\u8FBF\u68DA\u8C37\u72F8\u9C48\u6A3D\u8AB0\u4E39\u5358\u5606\u5766\u62C5\u63A2\u65E6\u6B4E\u6DE1\u6E5B\u70AD\u77ED\u7AEF\u7BAA\u7DBB\u803D\u80C6\u86CB\u8A95\u935B\u56E3\u58C7\u5F3E\u65AD\u6696\u6A80\u6BB5\u7537\u8AC7\u5024\u77E5\u5730\u5F1B\u6065\u667A\u6C60\u75F4\u7A1A\u7F6E\u81F4\u8718\u9045\u99B3\u7BC9\u755C\u7AF9\u7B51\u84C4\u9010\u79E9\u7A92\u8336\u5AE1\u7740\u4E2D\u4EF2\u5B99\u5FE0\u62BD\u663C\u67F1\u6CE8\u866B\u8877\u8A3B\u914E\u92F3\u99D0\u6A17\u7026\u732A\u82E7\u8457\u8CAF\u4E01\u5146\u51CB\u558B\u5BF5"],
      ["c4a1", "\u5E16\u5E33\u5E81\u5F14\u5F35\u5F6B\u5FB4\u61F2\u6311\u66A2\u671D\u6F6E\u7252\u753A\u773A\u8074\u8139\u8178\u8776\u8ABF\u8ADC\u8D85\u8DF3\u929A\u9577\u9802\u9CE5\u52C5\u6357\u76F4\u6715\u6C88\u73CD\u8CC3\u93AE\u9673\u6D25\u589C\u690E\u69CC\u8FFD\u939A\u75DB\u901A\u585A\u6802\u63B4\u69FB\u4F43\u6F2C\u67D8\u8FBB\u8526\u7DB4\u9354\u693F\u6F70\u576A\u58F7\u5B2C\u7D2C\u722A\u540A\u91E3\u9DB4\u4EAD\u4F4E\u505C\u5075\u5243\u8C9E\u5448\u5824\u5B9A\u5E1D\u5E95\u5EAD\u5EF7\u5F1F\u608C\u62B5\u633A\u63D0\u68AF\u6C40\u7887\u798E\u7A0B\u7DE0\u8247\u8A02\u8AE6\u8E44\u9013"],
      ["c5a1", "\u90B8\u912D\u91D8\u9F0E\u6CE5\u6458\u64E2\u6575\u6EF4\u7684\u7B1B\u9069\u93D1\u6EBA\u54F2\u5FB9\u64A4\u8F4D\u8FED\u9244\u5178\u586B\u5929\u5C55\u5E97\u6DFB\u7E8F\u751C\u8CBC\u8EE2\u985B\u70B9\u4F1D\u6BBF\u6FB1\u7530\u96FB\u514E\u5410\u5835\u5857\u59AC\u5C60\u5F92\u6597\u675C\u6E21\u767B\u83DF\u8CED\u9014\u90FD\u934D\u7825\u783A\u52AA\u5EA6\u571F\u5974\u6012\u5012\u515A\u51AC\u51CD\u5200\u5510\u5854\u5858\u5957\u5B95\u5CF6\u5D8B\u60BC\u6295\u642D\u6771\u6843\u68BC\u68DF\u76D7\u6DD8\u6E6F\u6D9B\u706F\u71C8\u5F53\u75D8\u7977\u7B49\u7B54\u7B52\u7CD6\u7D71\u5230"],
      ["c6a1", "\u8463\u8569\u85E4\u8A0E\u8B04\u8C46\u8E0F\u9003\u900F\u9419\u9676\u982D\u9A30\u95D8\u50CD\u52D5\u540C\u5802\u5C0E\u61A7\u649E\u6D1E\u77B3\u7AE5\u80F4\u8404\u9053\u9285\u5CE0\u9D07\u533F\u5F97\u5FB3\u6D9C\u7279\u7763\u79BF\u7BE4\u6BD2\u72EC\u8AAD\u6803\u6A61\u51F8\u7A81\u6934\u5C4A\u9CF6\u82EB\u5BC5\u9149\u701E\u5678\u5C6F\u60C7\u6566\u6C8C\u8C5A\u9041\u9813\u5451\u66C7\u920D\u5948\u90A3\u5185\u4E4D\u51EA\u8599\u8B0E\u7058\u637A\u934B\u6962\u99B4\u7E04\u7577\u5357\u6960\u8EDF\u96E3\u6C5D\u4E8C\u5C3C\u5F10\u8FE9\u5302\u8CD1\u8089\u8679\u5EFF\u65E5\u4E73\u5165"],
      ["c7a1", "\u5982\u5C3F\u97EE\u4EFB\u598A\u5FCD\u8A8D\u6FE1\u79B0\u7962\u5BE7\u8471\u732B\u71B1\u5E74\u5FF5\u637B\u649A\u71C3\u7C98\u4E43\u5EFC\u4E4B\u57DC\u56A2\u60A9\u6FC3\u7D0D\u80FD\u8133\u81BF\u8FB2\u8997\u86A4\u5DF4\u628A\u64AD\u8987\u6777\u6CE2\u6D3E\u7436\u7834\u5A46\u7F75\u82AD\u99AC\u4FF3\u5EC3\u62DD\u6392\u6557\u676F\u76C3\u724C\u80CC\u80BA\u8F29\u914D\u500D\u57F9\u5A92\u6885\u6973\u7164\u72FD\u8CB7\u58F2\u8CE0\u966A\u9019\u877F\u79E4\u77E7\u8429\u4F2F\u5265\u535A\u62CD\u67CF\u6CCA\u767D\u7B94\u7C95\u8236\u8584\u8FEB\u66DD\u6F20\u7206\u7E1B\u83AB\u99C1\u9EA6"],
      ["c8a1", "\u51FD\u7BB1\u7872\u7BB8\u8087\u7B48\u6AE8\u5E61\u808C\u7551\u7560\u516B\u9262\u6E8C\u767A\u9197\u9AEA\u4F10\u7F70\u629C\u7B4F\u95A5\u9CE9\u567A\u5859\u86E4\u96BC\u4F34\u5224\u534A\u53CD\u53DB\u5E06\u642C\u6591\u677F\u6C3E\u6C4E\u7248\u72AF\u73ED\u7554\u7E41\u822C\u85E9\u8CA9\u7BC4\u91C6\u7169\u9812\u98EF\u633D\u6669\u756A\u76E4\u78D0\u8543\u86EE\u532A\u5351\u5426\u5983\u5E87\u5F7C\u60B2\u6249\u6279\u62AB\u6590\u6BD4\u6CCC\u75B2\u76AE\u7891\u79D8\u7DCB\u7F77\u80A5\u88AB\u8AB9\u8CBB\u907F\u975E\u98DB\u6A0B\u7C38\u5099\u5C3E\u5FAE\u6787\u6BD8\u7435\u7709\u7F8E"],
      ["c9a1", "\u9F3B\u67CA\u7A17\u5339\u758B\u9AED\u5F66\u819D\u83F1\u8098\u5F3C\u5FC5\u7562\u7B46\u903C\u6867\u59EB\u5A9B\u7D10\u767E\u8B2C\u4FF5\u5F6A\u6A19\u6C37\u6F02\u74E2\u7968\u8868\u8A55\u8C79\u5EDF\u63CF\u75C5\u79D2\u82D7\u9328\u92F2\u849C\u86ED\u9C2D\u54C1\u5F6C\u658C\u6D5C\u7015\u8CA7\u8CD3\u983B\u654F\u74F6\u4E0D\u4ED8\u57E0\u592B\u5A66\u5BCC\u51A8\u5E03\u5E9C\u6016\u6276\u6577\u65A7\u666E\u6D6E\u7236\u7B26\u8150\u819A\u8299\u8B5C\u8CA0\u8CE6\u8D74\u961C\u9644\u4FAE\u64AB\u6B66\u821E\u8461\u856A\u90E8\u5C01\u6953\u98A8\u847A\u8557\u4F0F\u526F\u5FA9\u5E45\u670D"],
      ["caa1", "\u798F\u8179\u8907\u8986\u6DF5\u5F17\u6255\u6CB8\u4ECF\u7269\u9B92\u5206\u543B\u5674\u58B3\u61A4\u626E\u711A\u596E\u7C89\u7CDE\u7D1B\u96F0\u6587\u805E\u4E19\u4F75\u5175\u5840\u5E63\u5E73\u5F0A\u67C4\u4E26\u853D\u9589\u965B\u7C73\u9801\u50FB\u58C1\u7656\u78A7\u5225\u77A5\u8511\u7B86\u504F\u5909\u7247\u7BC7\u7DE8\u8FBA\u8FD4\u904D\u4FBF\u52C9\u5A29\u5F01\u97AD\u4FDD\u8217\u92EA\u5703\u6355\u6B69\u752B\u88DC\u8F14\u7A42\u52DF\u5893\u6155\u620A\u66AE\u6BCD\u7C3F\u83E9\u5023\u4FF8\u5305\u5446\u5831\u5949\u5B9D\u5CF0\u5CEF\u5D29\u5E96\u62B1\u6367\u653E\u65B9\u670B"],
      ["cba1", "\u6CD5\u6CE1\u70F9\u7832\u7E2B\u80DE\u82B3\u840C\u84EC\u8702\u8912\u8A2A\u8C4A\u90A6\u92D2\u98FD\u9CF3\u9D6C\u4E4F\u4EA1\u508D\u5256\u574A\u59A8\u5E3D\u5FD8\u5FD9\u623F\u66B4\u671B\u67D0\u68D2\u5192\u7D21\u80AA\u81A8\u8B00\u8C8C\u8CBF\u927E\u9632\u5420\u982C\u5317\u50D5\u535C\u58A8\u64B2\u6734\u7267\u7766\u7A46\u91E6\u52C3\u6CA1\u6B86\u5800\u5E4C\u5954\u672C\u7FFB\u51E1\u76C6\u6469\u78E8\u9B54\u9EBB\u57CB\u59B9\u6627\u679A\u6BCE\u54E9\u69D9\u5E55\u819C\u6795\u9BAA\u67FE\u9C52\u685D\u4EA6\u4FE3\u53C8\u62B9\u672B\u6CAB\u8FC4\u4FAD\u7E6D\u9EBF\u4E07\u6162\u6E80"],
      ["cca1", "\u6F2B\u8513\u5473\u672A\u9B45\u5DF3\u7B95\u5CAC\u5BC6\u871C\u6E4A\u84D1\u7A14\u8108\u5999\u7C8D\u6C11\u7720\u52D9\u5922\u7121\u725F\u77DB\u9727\u9D61\u690B\u5A7F\u5A18\u51A5\u540D\u547D\u660E\u76DF\u8FF7\u9298\u9CF4\u59EA\u725D\u6EC5\u514D\u68C9\u7DBF\u7DEC\u9762\u9EBA\u6478\u6A21\u8302\u5984\u5B5F\u6BDB\u731B\u76F2\u7DB2\u8017\u8499\u5132\u6728\u9ED9\u76EE\u6762\u52FF\u9905\u5C24\u623B\u7C7E\u8CB0\u554F\u60B6\u7D0B\u9580\u5301\u4E5F\u51B6\u591C\u723A\u8036\u91CE\u5F25\u77E2\u5384\u5F79\u7D04\u85AC\u8A33\u8E8D\u9756\u67F3\u85AE\u9453\u6109\u6108\u6CB9\u7652"],
      ["cda1", "\u8AED\u8F38\u552F\u4F51\u512A\u52C7\u53CB\u5BA5\u5E7D\u60A0\u6182\u63D6\u6709\u67DA\u6E67\u6D8C\u7336\u7337\u7531\u7950\u88D5\u8A98\u904A\u9091\u90F5\u96C4\u878D\u5915\u4E88\u4F59\u4E0E\u8A89\u8F3F\u9810\u50AD\u5E7C\u5996\u5BB9\u5EB8\u63DA\u63FA\u64C1\u66DC\u694A\u69D8\u6D0B\u6EB6\u7194\u7528\u7AAF\u7F8A\u8000\u8449\u84C9\u8981\u8B21\u8E0A\u9065\u967D\u990A\u617E\u6291\u6B32\u6C83\u6D74\u7FCC\u7FFC\u6DC0\u7F85\u87BA\u88F8\u6765\u83B1\u983C\u96F7\u6D1B\u7D61\u843D\u916A\u4E71\u5375\u5D50\u6B04\u6FEB\u85CD\u862D\u89A7\u5229\u540F\u5C65\u674E\u68A8\u7406\u7483"],
      ["cea1", "\u75E2\u88CF\u88E1\u91CC\u96E2\u9678\u5F8B\u7387\u7ACB\u844E\u63A0\u7565\u5289\u6D41\u6E9C\u7409\u7559\u786B\u7C92\u9686\u7ADC\u9F8D\u4FB6\u616E\u65C5\u865C\u4E86\u4EAE\u50DA\u4E21\u51CC\u5BEE\u6599\u6881\u6DBC\u731F\u7642\u77AD\u7A1C\u7CE7\u826F\u8AD2\u907C\u91CF\u9675\u9818\u529B\u7DD1\u502B\u5398\u6797\u6DCB\u71D0\u7433\u81E8\u8F2A\u96A3\u9C57\u9E9F\u7460\u5841\u6D99\u7D2F\u985E\u4EE4\u4F36\u4F8B\u51B7\u52B1\u5DBA\u601C\u73B2\u793C\u82D3\u9234\u96B7\u96F6\u970A\u9E97\u9F62\u66A6\u6B74\u5217\u52A3\u70C8\u88C2\u5EC9\u604B\u6190\u6F23\u7149\u7C3E\u7DF4\u806F"],
      ["cfa1", "\u84EE\u9023\u932C\u5442\u9B6F\u6AD3\u7089\u8CC2\u8DEF\u9732\u52B4\u5A41\u5ECA\u5F04\u6717\u697C\u6994\u6D6A\u6F0F\u7262\u72FC\u7BED\u8001\u807E\u874B\u90CE\u516D\u9E93\u7984\u808B\u9332\u8AD6\u502D\u548C\u8A71\u6B6A\u8CC4\u8107\u60D1\u67A0\u9DF2\u4E99\u4E98\u9C10\u8A6B\u85C1\u8568\u6900\u6E7E\u7897\u8155"],
      ["d0a1", "\u5F0C\u4E10\u4E15\u4E2A\u4E31\u4E36\u4E3C\u4E3F\u4E42\u4E56\u4E58\u4E82\u4E85\u8C6B\u4E8A\u8212\u5F0D\u4E8E\u4E9E\u4E9F\u4EA0\u4EA2\u4EB0\u4EB3\u4EB6\u4ECE\u4ECD\u4EC4\u4EC6\u4EC2\u4ED7\u4EDE\u4EED\u4EDF\u4EF7\u4F09\u4F5A\u4F30\u4F5B\u4F5D\u4F57\u4F47\u4F76\u4F88\u4F8F\u4F98\u4F7B\u4F69\u4F70\u4F91\u4F6F\u4F86\u4F96\u5118\u4FD4\u4FDF\u4FCE\u4FD8\u4FDB\u4FD1\u4FDA\u4FD0\u4FE4\u4FE5\u501A\u5028\u5014\u502A\u5025\u5005\u4F1C\u4FF6\u5021\u5029\u502C\u4FFE\u4FEF\u5011\u5006\u5043\u5047\u6703\u5055\u5050\u5048\u505A\u5056\u506C\u5078\u5080\u509A\u5085\u50B4\u50B2"],
      ["d1a1", "\u50C9\u50CA\u50B3\u50C2\u50D6\u50DE\u50E5\u50ED\u50E3\u50EE\u50F9\u50F5\u5109\u5101\u5102\u5116\u5115\u5114\u511A\u5121\u513A\u5137\u513C\u513B\u513F\u5140\u5152\u514C\u5154\u5162\u7AF8\u5169\u516A\u516E\u5180\u5182\u56D8\u518C\u5189\u518F\u5191\u5193\u5195\u5196\u51A4\u51A6\u51A2\u51A9\u51AA\u51AB\u51B3\u51B1\u51B2\u51B0\u51B5\u51BD\u51C5\u51C9\u51DB\u51E0\u8655\u51E9\u51ED\u51F0\u51F5\u51FE\u5204\u520B\u5214\u520E\u5227\u522A\u522E\u5233\u5239\u524F\u5244\u524B\u524C\u525E\u5254\u526A\u5274\u5269\u5273\u527F\u527D\u528D\u5294\u5292\u5271\u5288\u5291\u8FA8"],
      ["d2a1", "\u8FA7\u52AC\u52AD\u52BC\u52B5\u52C1\u52CD\u52D7\u52DE\u52E3\u52E6\u98ED\u52E0\u52F3\u52F5\u52F8\u52F9\u5306\u5308\u7538\u530D\u5310\u530F\u5315\u531A\u5323\u532F\u5331\u5333\u5338\u5340\u5346\u5345\u4E17\u5349\u534D\u51D6\u535E\u5369\u536E\u5918\u537B\u5377\u5382\u5396\u53A0\u53A6\u53A5\u53AE\u53B0\u53B6\u53C3\u7C12\u96D9\u53DF\u66FC\u71EE\u53EE\u53E8\u53ED\u53FA\u5401\u543D\u5440\u542C\u542D\u543C\u542E\u5436\u5429\u541D\u544E\u548F\u5475\u548E\u545F\u5471\u5477\u5470\u5492\u547B\u5480\u5476\u5484\u5490\u5486\u54C7\u54A2\u54B8\u54A5\u54AC\u54C4\u54C8\u54A8"],
      ["d3a1", "\u54AB\u54C2\u54A4\u54BE\u54BC\u54D8\u54E5\u54E6\u550F\u5514\u54FD\u54EE\u54ED\u54FA\u54E2\u5539\u5540\u5563\u554C\u552E\u555C\u5545\u5556\u5557\u5538\u5533\u555D\u5599\u5580\u54AF\u558A\u559F\u557B\u557E\u5598\u559E\u55AE\u557C\u5583\u55A9\u5587\u55A8\u55DA\u55C5\u55DF\u55C4\u55DC\u55E4\u55D4\u5614\u55F7\u5616\u55FE\u55FD\u561B\u55F9\u564E\u5650\u71DF\u5634\u5636\u5632\u5638\u566B\u5664\u562F\u566C\u566A\u5686\u5680\u568A\u56A0\u5694\u568F\u56A5\u56AE\u56B6\u56B4\u56C2\u56BC\u56C1\u56C3\u56C0\u56C8\u56CE\u56D1\u56D3\u56D7\u56EE\u56F9\u5700\u56FF\u5704\u5709"],
      ["d4a1", "\u5708\u570B\u570D\u5713\u5718\u5716\u55C7\u571C\u5726\u5737\u5738\u574E\u573B\u5740\u574F\u5769\u57C0\u5788\u5761\u577F\u5789\u5793\u57A0\u57B3\u57A4\u57AA\u57B0\u57C3\u57C6\u57D4\u57D2\u57D3\u580A\u57D6\u57E3\u580B\u5819\u581D\u5872\u5821\u5862\u584B\u5870\u6BC0\u5852\u583D\u5879\u5885\u58B9\u589F\u58AB\u58BA\u58DE\u58BB\u58B8\u58AE\u58C5\u58D3\u58D1\u58D7\u58D9\u58D8\u58E5\u58DC\u58E4\u58DF\u58EF\u58FA\u58F9\u58FB\u58FC\u58FD\u5902\u590A\u5910\u591B\u68A6\u5925\u592C\u592D\u5932\u5938\u593E\u7AD2\u5955\u5950\u594E\u595A\u5958\u5962\u5960\u5967\u596C\u5969"],
      ["d5a1", "\u5978\u5981\u599D\u4F5E\u4FAB\u59A3\u59B2\u59C6\u59E8\u59DC\u598D\u59D9\u59DA\u5A25\u5A1F\u5A11\u5A1C\u5A09\u5A1A\u5A40\u5A6C\u5A49\u5A35\u5A36\u5A62\u5A6A\u5A9A\u5ABC\u5ABE\u5ACB\u5AC2\u5ABD\u5AE3\u5AD7\u5AE6\u5AE9\u5AD6\u5AFA\u5AFB\u5B0C\u5B0B\u5B16\u5B32\u5AD0\u5B2A\u5B36\u5B3E\u5B43\u5B45\u5B40\u5B51\u5B55\u5B5A\u5B5B\u5B65\u5B69\u5B70\u5B73\u5B75\u5B78\u6588\u5B7A\u5B80\u5B83\u5BA6\u5BB8\u5BC3\u5BC7\u5BC9\u5BD4\u5BD0\u5BE4\u5BE6\u5BE2\u5BDE\u5BE5\u5BEB\u5BF0\u5BF6\u5BF3\u5C05\u5C07\u5C08\u5C0D\u5C13\u5C20\u5C22\u5C28\u5C38\u5C39\u5C41\u5C46\u5C4E\u5C53"],
      ["d6a1", "\u5C50\u5C4F\u5B71\u5C6C\u5C6E\u4E62\u5C76\u5C79\u5C8C\u5C91\u5C94\u599B\u5CAB\u5CBB\u5CB6\u5CBC\u5CB7\u5CC5\u5CBE\u5CC7\u5CD9\u5CE9\u5CFD\u5CFA\u5CED\u5D8C\u5CEA\u5D0B\u5D15\u5D17\u5D5C\u5D1F\u5D1B\u5D11\u5D14\u5D22\u5D1A\u5D19\u5D18\u5D4C\u5D52\u5D4E\u5D4B\u5D6C\u5D73\u5D76\u5D87\u5D84\u5D82\u5DA2\u5D9D\u5DAC\u5DAE\u5DBD\u5D90\u5DB7\u5DBC\u5DC9\u5DCD\u5DD3\u5DD2\u5DD6\u5DDB\u5DEB\u5DF2\u5DF5\u5E0B\u5E1A\u5E19\u5E11\u5E1B\u5E36\u5E37\u5E44\u5E43\u5E40\u5E4E\u5E57\u5E54\u5E5F\u5E62\u5E64\u5E47\u5E75\u5E76\u5E7A\u9EBC\u5E7F\u5EA0\u5EC1\u5EC2\u5EC8\u5ED0\u5ECF"],
      ["d7a1", "\u5ED6\u5EE3\u5EDD\u5EDA\u5EDB\u5EE2\u5EE1\u5EE8\u5EE9\u5EEC\u5EF1\u5EF3\u5EF0\u5EF4\u5EF8\u5EFE\u5F03\u5F09\u5F5D\u5F5C\u5F0B\u5F11\u5F16\u5F29\u5F2D\u5F38\u5F41\u5F48\u5F4C\u5F4E\u5F2F\u5F51\u5F56\u5F57\u5F59\u5F61\u5F6D\u5F73\u5F77\u5F83\u5F82\u5F7F\u5F8A\u5F88\u5F91\u5F87\u5F9E\u5F99\u5F98\u5FA0\u5FA8\u5FAD\u5FBC\u5FD6\u5FFB\u5FE4\u5FF8\u5FF1\u5FDD\u60B3\u5FFF\u6021\u6060\u6019\u6010\u6029\u600E\u6031\u601B\u6015\u602B\u6026\u600F\u603A\u605A\u6041\u606A\u6077\u605F\u604A\u6046\u604D\u6063\u6043\u6064\u6042\u606C\u606B\u6059\u6081\u608D\u60E7\u6083\u609A"],
      ["d8a1", "\u6084\u609B\u6096\u6097\u6092\u60A7\u608B\u60E1\u60B8\u60E0\u60D3\u60B4\u5FF0\u60BD\u60C6\u60B5\u60D8\u614D\u6115\u6106\u60F6\u60F7\u6100\u60F4\u60FA\u6103\u6121\u60FB\u60F1\u610D\u610E\u6147\u613E\u6128\u6127\u614A\u613F\u613C\u612C\u6134\u613D\u6142\u6144\u6173\u6177\u6158\u6159\u615A\u616B\u6174\u616F\u6165\u6171\u615F\u615D\u6153\u6175\u6199\u6196\u6187\u61AC\u6194\u619A\u618A\u6191\u61AB\u61AE\u61CC\u61CA\u61C9\u61F7\u61C8\u61C3\u61C6\u61BA\u61CB\u7F79\u61CD\u61E6\u61E3\u61F6\u61FA\u61F4\u61FF\u61FD\u61FC\u61FE\u6200\u6208\u6209\u620D\u620C\u6214\u621B"],
      ["d9a1", "\u621E\u6221\u622A\u622E\u6230\u6232\u6233\u6241\u624E\u625E\u6263\u625B\u6260\u6268\u627C\u6282\u6289\u627E\u6292\u6293\u6296\u62D4\u6283\u6294\u62D7\u62D1\u62BB\u62CF\u62FF\u62C6\u64D4\u62C8\u62DC\u62CC\u62CA\u62C2\u62C7\u629B\u62C9\u630C\u62EE\u62F1\u6327\u6302\u6308\u62EF\u62F5\u6350\u633E\u634D\u641C\u634F\u6396\u638E\u6380\u63AB\u6376\u63A3\u638F\u6389\u639F\u63B5\u636B\u6369\u63BE\u63E9\u63C0\u63C6\u63E3\u63C9\u63D2\u63F6\u63C4\u6416\u6434\u6406\u6413\u6426\u6436\u651D\u6417\u6428\u640F\u6467\u646F\u6476\u644E\u652A\u6495\u6493\u64A5\u64A9\u6488\u64BC"],
      ["daa1", "\u64DA\u64D2\u64C5\u64C7\u64BB\u64D8\u64C2\u64F1\u64E7\u8209\u64E0\u64E1\u62AC\u64E3\u64EF\u652C\u64F6\u64F4\u64F2\u64FA\u6500\u64FD\u6518\u651C\u6505\u6524\u6523\u652B\u6534\u6535\u6537\u6536\u6538\u754B\u6548\u6556\u6555\u654D\u6558\u655E\u655D\u6572\u6578\u6582\u6583\u8B8A\u659B\u659F\u65AB\u65B7\u65C3\u65C6\u65C1\u65C4\u65CC\u65D2\u65DB\u65D9\u65E0\u65E1\u65F1\u6772\u660A\u6603\u65FB\u6773\u6635\u6636\u6634\u661C\u664F\u6644\u6649\u6641\u665E\u665D\u6664\u6667\u6668\u665F\u6662\u6670\u6683\u6688\u668E\u6689\u6684\u6698\u669D\u66C1\u66B9\u66C9\u66BE\u66BC"],
      ["dba1", "\u66C4\u66B8\u66D6\u66DA\u66E0\u663F\u66E6\u66E9\u66F0\u66F5\u66F7\u670F\u6716\u671E\u6726\u6727\u9738\u672E\u673F\u6736\u6741\u6738\u6737\u6746\u675E\u6760\u6759\u6763\u6764\u6789\u6770\u67A9\u677C\u676A\u678C\u678B\u67A6\u67A1\u6785\u67B7\u67EF\u67B4\u67EC\u67B3\u67E9\u67B8\u67E4\u67DE\u67DD\u67E2\u67EE\u67B9\u67CE\u67C6\u67E7\u6A9C\u681E\u6846\u6829\u6840\u684D\u6832\u684E\u68B3\u682B\u6859\u6863\u6877\u687F\u689F\u688F\u68AD\u6894\u689D\u689B\u6883\u6AAE\u68B9\u6874\u68B5\u68A0\u68BA\u690F\u688D\u687E\u6901\u68CA\u6908\u68D8\u6922\u6926\u68E1\u690C\u68CD"],
      ["dca1", "\u68D4\u68E7\u68D5\u6936\u6912\u6904\u68D7\u68E3\u6925\u68F9\u68E0\u68EF\u6928\u692A\u691A\u6923\u6921\u68C6\u6979\u6977\u695C\u6978\u696B\u6954\u697E\u696E\u6939\u6974\u693D\u6959\u6930\u6961\u695E\u695D\u6981\u696A\u69B2\u69AE\u69D0\u69BF\u69C1\u69D3\u69BE\u69CE\u5BE8\u69CA\u69DD\u69BB\u69C3\u69A7\u6A2E\u6991\u69A0\u699C\u6995\u69B4\u69DE\u69E8\u6A02\u6A1B\u69FF\u6B0A\u69F9\u69F2\u69E7\u6A05\u69B1\u6A1E\u69ED\u6A14\u69EB\u6A0A\u6A12\u6AC1\u6A23\u6A13\u6A44\u6A0C\u6A72\u6A36\u6A78\u6A47\u6A62\u6A59\u6A66\u6A48\u6A38\u6A22\u6A90\u6A8D\u6AA0\u6A84\u6AA2\u6AA3"],
      ["dda1", "\u6A97\u8617\u6ABB\u6AC3\u6AC2\u6AB8\u6AB3\u6AAC\u6ADE\u6AD1\u6ADF\u6AAA\u6ADA\u6AEA\u6AFB\u6B05\u8616\u6AFA\u6B12\u6B16\u9B31\u6B1F\u6B38\u6B37\u76DC\u6B39\u98EE\u6B47\u6B43\u6B49\u6B50\u6B59\u6B54\u6B5B\u6B5F\u6B61\u6B78\u6B79\u6B7F\u6B80\u6B84\u6B83\u6B8D\u6B98\u6B95\u6B9E\u6BA4\u6BAA\u6BAB\u6BAF\u6BB2\u6BB1\u6BB3\u6BB7\u6BBC\u6BC6\u6BCB\u6BD3\u6BDF\u6BEC\u6BEB\u6BF3\u6BEF\u9EBE\u6C08\u6C13\u6C14\u6C1B\u6C24\u6C23\u6C5E\u6C55\u6C62\u6C6A\u6C82\u6C8D\u6C9A\u6C81\u6C9B\u6C7E\u6C68\u6C73\u6C92\u6C90\u6CC4\u6CF1\u6CD3\u6CBD\u6CD7\u6CC5\u6CDD\u6CAE\u6CB1\u6CBE"],
      ["dea1", "\u6CBA\u6CDB\u6CEF\u6CD9\u6CEA\u6D1F\u884D\u6D36\u6D2B\u6D3D\u6D38\u6D19\u6D35\u6D33\u6D12\u6D0C\u6D63\u6D93\u6D64\u6D5A\u6D79\u6D59\u6D8E\u6D95\u6FE4\u6D85\u6DF9\u6E15\u6E0A\u6DB5\u6DC7\u6DE6\u6DB8\u6DC6\u6DEC\u6DDE\u6DCC\u6DE8\u6DD2\u6DC5\u6DFA\u6DD9\u6DE4\u6DD5\u6DEA\u6DEE\u6E2D\u6E6E\u6E2E\u6E19\u6E72\u6E5F\u6E3E\u6E23\u6E6B\u6E2B\u6E76\u6E4D\u6E1F\u6E43\u6E3A\u6E4E\u6E24\u6EFF\u6E1D\u6E38\u6E82\u6EAA\u6E98\u6EC9\u6EB7\u6ED3\u6EBD\u6EAF\u6EC4\u6EB2\u6ED4\u6ED5\u6E8F\u6EA5\u6EC2\u6E9F\u6F41\u6F11\u704C\u6EEC\u6EF8\u6EFE\u6F3F\u6EF2\u6F31\u6EEF\u6F32\u6ECC"],
      ["dfa1", "\u6F3E\u6F13\u6EF7\u6F86\u6F7A\u6F78\u6F81\u6F80\u6F6F\u6F5B\u6FF3\u6F6D\u6F82\u6F7C\u6F58\u6F8E\u6F91\u6FC2\u6F66\u6FB3\u6FA3\u6FA1\u6FA4\u6FB9\u6FC6\u6FAA\u6FDF\u6FD5\u6FEC\u6FD4\u6FD8\u6FF1\u6FEE\u6FDB\u7009\u700B\u6FFA\u7011\u7001\u700F\u6FFE\u701B\u701A\u6F74\u701D\u7018\u701F\u7030\u703E\u7032\u7051\u7063\u7099\u7092\u70AF\u70F1\u70AC\u70B8\u70B3\u70AE\u70DF\u70CB\u70DD\u70D9\u7109\u70FD\u711C\u7119\u7165\u7155\u7188\u7166\u7162\u714C\u7156\u716C\u718F\u71FB\u7184\u7195\u71A8\u71AC\u71D7\u71B9\u71BE\u71D2\u71C9\u71D4\u71CE\u71E0\u71EC\u71E7\u71F5\u71FC"],
      ["e0a1", "\u71F9\u71FF\u720D\u7210\u721B\u7228\u722D\u722C\u7230\u7232\u723B\u723C\u723F\u7240\u7246\u724B\u7258\u7274\u727E\u7282\u7281\u7287\u7292\u7296\u72A2\u72A7\u72B9\u72B2\u72C3\u72C6\u72C4\u72CE\u72D2\u72E2\u72E0\u72E1\u72F9\u72F7\u500F\u7317\u730A\u731C\u7316\u731D\u7334\u732F\u7329\u7325\u733E\u734E\u734F\u9ED8\u7357\u736A\u7368\u7370\u7378\u7375\u737B\u737A\u73C8\u73B3\u73CE\u73BB\u73C0\u73E5\u73EE\u73DE\u74A2\u7405\u746F\u7425\u73F8\u7432\u743A\u7455\u743F\u745F\u7459\u7441\u745C\u7469\u7470\u7463\u746A\u7476\u747E\u748B\u749E\u74A7\u74CA\u74CF\u74D4\u73F1"],
      ["e1a1", "\u74E0\u74E3\u74E7\u74E9\u74EE\u74F2\u74F0\u74F1\u74F8\u74F7\u7504\u7503\u7505\u750C\u750E\u750D\u7515\u7513\u751E\u7526\u752C\u753C\u7544\u754D\u754A\u7549\u755B\u7546\u755A\u7569\u7564\u7567\u756B\u756D\u7578\u7576\u7586\u7587\u7574\u758A\u7589\u7582\u7594\u759A\u759D\u75A5\u75A3\u75C2\u75B3\u75C3\u75B5\u75BD\u75B8\u75BC\u75B1\u75CD\u75CA\u75D2\u75D9\u75E3\u75DE\u75FE\u75FF\u75FC\u7601\u75F0\u75FA\u75F2\u75F3\u760B\u760D\u7609\u761F\u7627\u7620\u7621\u7622\u7624\u7634\u7630\u763B\u7647\u7648\u7646\u765C\u7658\u7661\u7662\u7668\u7669\u766A\u7667\u766C\u7670"],
      ["e2a1", "\u7672\u7676\u7678\u767C\u7680\u7683\u7688\u768B\u768E\u7696\u7693\u7699\u769A\u76B0\u76B4\u76B8\u76B9\u76BA\u76C2\u76CD\u76D6\u76D2\u76DE\u76E1\u76E5\u76E7\u76EA\u862F\u76FB\u7708\u7707\u7704\u7729\u7724\u771E\u7725\u7726\u771B\u7737\u7738\u7747\u775A\u7768\u776B\u775B\u7765\u777F\u777E\u7779\u778E\u778B\u7791\u77A0\u779E\u77B0\u77B6\u77B9\u77BF\u77BC\u77BD\u77BB\u77C7\u77CD\u77D7\u77DA\u77DC\u77E3\u77EE\u77FC\u780C\u7812\u7926\u7820\u792A\u7845\u788E\u7874\u7886\u787C\u789A\u788C\u78A3\u78B5\u78AA\u78AF\u78D1\u78C6\u78CB\u78D4\u78BE\u78BC\u78C5\u78CA\u78EC"],
      ["e3a1", "\u78E7\u78DA\u78FD\u78F4\u7907\u7912\u7911\u7919\u792C\u792B\u7940\u7960\u7957\u795F\u795A\u7955\u7953\u797A\u797F\u798A\u799D\u79A7\u9F4B\u79AA\u79AE\u79B3\u79B9\u79BA\u79C9\u79D5\u79E7\u79EC\u79E1\u79E3\u7A08\u7A0D\u7A18\u7A19\u7A20\u7A1F\u7980\u7A31\u7A3B\u7A3E\u7A37\u7A43\u7A57\u7A49\u7A61\u7A62\u7A69\u9F9D\u7A70\u7A79\u7A7D\u7A88\u7A97\u7A95\u7A98\u7A96\u7AA9\u7AC8\u7AB0\u7AB6\u7AC5\u7AC4\u7ABF\u9083\u7AC7\u7ACA\u7ACD\u7ACF\u7AD5\u7AD3\u7AD9\u7ADA\u7ADD\u7AE1\u7AE2\u7AE6\u7AED\u7AF0\u7B02\u7B0F\u7B0A\u7B06\u7B33\u7B18\u7B19\u7B1E\u7B35\u7B28\u7B36\u7B50"],
      ["e4a1", "\u7B7A\u7B04\u7B4D\u7B0B\u7B4C\u7B45\u7B75\u7B65\u7B74\u7B67\u7B70\u7B71\u7B6C\u7B6E\u7B9D\u7B98\u7B9F\u7B8D\u7B9C\u7B9A\u7B8B\u7B92\u7B8F\u7B5D\u7B99\u7BCB\u7BC1\u7BCC\u7BCF\u7BB4\u7BC6\u7BDD\u7BE9\u7C11\u7C14\u7BE6\u7BE5\u7C60\u7C00\u7C07\u7C13\u7BF3\u7BF7\u7C17\u7C0D\u7BF6\u7C23\u7C27\u7C2A\u7C1F\u7C37\u7C2B\u7C3D\u7C4C\u7C43\u7C54\u7C4F\u7C40\u7C50\u7C58\u7C5F\u7C64\u7C56\u7C65\u7C6C\u7C75\u7C83\u7C90\u7CA4\u7CAD\u7CA2\u7CAB\u7CA1\u7CA8\u7CB3\u7CB2\u7CB1\u7CAE\u7CB9\u7CBD\u7CC0\u7CC5\u7CC2\u7CD8\u7CD2\u7CDC\u7CE2\u9B3B\u7CEF\u7CF2\u7CF4\u7CF6\u7CFA\u7D06"],
      ["e5a1", "\u7D02\u7D1C\u7D15\u7D0A\u7D45\u7D4B\u7D2E\u7D32\u7D3F\u7D35\u7D46\u7D73\u7D56\u7D4E\u7D72\u7D68\u7D6E\u7D4F\u7D63\u7D93\u7D89\u7D5B\u7D8F\u7D7D\u7D9B\u7DBA\u7DAE\u7DA3\u7DB5\u7DC7\u7DBD\u7DAB\u7E3D\u7DA2\u7DAF\u7DDC\u7DB8\u7D9F\u7DB0\u7DD8\u7DDD\u7DE4\u7DDE\u7DFB\u7DF2\u7DE1\u7E05\u7E0A\u7E23\u7E21\u7E12\u7E31\u7E1F\u7E09\u7E0B\u7E22\u7E46\u7E66\u7E3B\u7E35\u7E39\u7E43\u7E37\u7E32\u7E3A\u7E67\u7E5D\u7E56\u7E5E\u7E59\u7E5A\u7E79\u7E6A\u7E69\u7E7C\u7E7B\u7E83\u7DD5\u7E7D\u8FAE\u7E7F\u7E88\u7E89\u7E8C\u7E92\u7E90\u7E93\u7E94\u7E96\u7E8E\u7E9B\u7E9C\u7F38\u7F3A"],
      ["e6a1", "\u7F45\u7F4C\u7F4D\u7F4E\u7F50\u7F51\u7F55\u7F54\u7F58\u7F5F\u7F60\u7F68\u7F69\u7F67\u7F78\u7F82\u7F86\u7F83\u7F88\u7F87\u7F8C\u7F94\u7F9E\u7F9D\u7F9A\u7FA3\u7FAF\u7FB2\u7FB9\u7FAE\u7FB6\u7FB8\u8B71\u7FC5\u7FC6\u7FCA\u7FD5\u7FD4\u7FE1\u7FE6\u7FE9\u7FF3\u7FF9\u98DC\u8006\u8004\u800B\u8012\u8018\u8019\u801C\u8021\u8028\u803F\u803B\u804A\u8046\u8052\u8058\u805A\u805F\u8062\u8068\u8073\u8072\u8070\u8076\u8079\u807D\u807F\u8084\u8086\u8085\u809B\u8093\u809A\u80AD\u5190\u80AC\u80DB\u80E5\u80D9\u80DD\u80C4\u80DA\u80D6\u8109\u80EF\u80F1\u811B\u8129\u8123\u812F\u814B"],
      ["e7a1", "\u968B\u8146\u813E\u8153\u8151\u80FC\u8171\u816E\u8165\u8166\u8174\u8183\u8188\u818A\u8180\u8182\u81A0\u8195\u81A4\u81A3\u815F\u8193\u81A9\u81B0\u81B5\u81BE\u81B8\u81BD\u81C0\u81C2\u81BA\u81C9\u81CD\u81D1\u81D9\u81D8\u81C8\u81DA\u81DF\u81E0\u81E7\u81FA\u81FB\u81FE\u8201\u8202\u8205\u8207\u820A\u820D\u8210\u8216\u8229\u822B\u8238\u8233\u8240\u8259\u8258\u825D\u825A\u825F\u8264\u8262\u8268\u826A\u826B\u822E\u8271\u8277\u8278\u827E\u828D\u8292\u82AB\u829F\u82BB\u82AC\u82E1\u82E3\u82DF\u82D2\u82F4\u82F3\u82FA\u8393\u8303\u82FB\u82F9\u82DE\u8306\u82DC\u8309\u82D9"],
      ["e8a1", "\u8335\u8334\u8316\u8332\u8331\u8340\u8339\u8350\u8345\u832F\u832B\u8317\u8318\u8385\u839A\u83AA\u839F\u83A2\u8396\u8323\u838E\u8387\u838A\u837C\u83B5\u8373\u8375\u83A0\u8389\u83A8\u83F4\u8413\u83EB\u83CE\u83FD\u8403\u83D8\u840B\u83C1\u83F7\u8407\u83E0\u83F2\u840D\u8422\u8420\u83BD\u8438\u8506\u83FB\u846D\u842A\u843C\u855A\u8484\u8477\u846B\u84AD\u846E\u8482\u8469\u8446\u842C\u846F\u8479\u8435\u84CA\u8462\u84B9\u84BF\u849F\u84D9\u84CD\u84BB\u84DA\u84D0\u84C1\u84C6\u84D6\u84A1\u8521\u84FF\u84F4\u8517\u8518\u852C\u851F\u8515\u8514\u84FC\u8540\u8563\u8558\u8548"],
      ["e9a1", "\u8541\u8602\u854B\u8555\u8580\u85A4\u8588\u8591\u858A\u85A8\u856D\u8594\u859B\u85EA\u8587\u859C\u8577\u857E\u8590\u85C9\u85BA\u85CF\u85B9\u85D0\u85D5\u85DD\u85E5\u85DC\u85F9\u860A\u8613\u860B\u85FE\u85FA\u8606\u8622\u861A\u8630\u863F\u864D\u4E55\u8654\u865F\u8667\u8671\u8693\u86A3\u86A9\u86AA\u868B\u868C\u86B6\u86AF\u86C4\u86C6\u86B0\u86C9\u8823\u86AB\u86D4\u86DE\u86E9\u86EC\u86DF\u86DB\u86EF\u8712\u8706\u8708\u8700\u8703\u86FB\u8711\u8709\u870D\u86F9\u870A\u8734\u873F\u8737\u873B\u8725\u8729\u871A\u8760\u875F\u8778\u874C\u874E\u8774\u8757\u8768\u876E\u8759"],
      ["eaa1", "\u8753\u8763\u876A\u8805\u87A2\u879F\u8782\u87AF\u87CB\u87BD\u87C0\u87D0\u96D6\u87AB\u87C4\u87B3\u87C7\u87C6\u87BB\u87EF\u87F2\u87E0\u880F\u880D\u87FE\u87F6\u87F7\u880E\u87D2\u8811\u8816\u8815\u8822\u8821\u8831\u8836\u8839\u8827\u883B\u8844\u8842\u8852\u8859\u885E\u8862\u886B\u8881\u887E\u889E\u8875\u887D\u88B5\u8872\u8882\u8897\u8892\u88AE\u8899\u88A2\u888D\u88A4\u88B0\u88BF\u88B1\u88C3\u88C4\u88D4\u88D8\u88D9\u88DD\u88F9\u8902\u88FC\u88F4\u88E8\u88F2\u8904\u890C\u890A\u8913\u8943\u891E\u8925\u892A\u892B\u8941\u8944\u893B\u8936\u8938\u894C\u891D\u8960\u895E"],
      ["eba1", "\u8966\u8964\u896D\u896A\u896F\u8974\u8977\u897E\u8983\u8988\u898A\u8993\u8998\u89A1\u89A9\u89A6\u89AC\u89AF\u89B2\u89BA\u89BD\u89BF\u89C0\u89DA\u89DC\u89DD\u89E7\u89F4\u89F8\u8A03\u8A16\u8A10\u8A0C\u8A1B\u8A1D\u8A25\u8A36\u8A41\u8A5B\u8A52\u8A46\u8A48\u8A7C\u8A6D\u8A6C\u8A62\u8A85\u8A82\u8A84\u8AA8\u8AA1\u8A91\u8AA5\u8AA6\u8A9A\u8AA3\u8AC4\u8ACD\u8AC2\u8ADA\u8AEB\u8AF3\u8AE7\u8AE4\u8AF1\u8B14\u8AE0\u8AE2\u8AF7\u8ADE\u8ADB\u8B0C\u8B07\u8B1A\u8AE1\u8B16\u8B10\u8B17\u8B20\u8B33\u97AB\u8B26\u8B2B\u8B3E\u8B28\u8B41\u8B4C\u8B4F\u8B4E\u8B49\u8B56\u8B5B\u8B5A\u8B6B"],
      ["eca1", "\u8B5F\u8B6C\u8B6F\u8B74\u8B7D\u8B80\u8B8C\u8B8E\u8B92\u8B93\u8B96\u8B99\u8B9A\u8C3A\u8C41\u8C3F\u8C48\u8C4C\u8C4E\u8C50\u8C55\u8C62\u8C6C\u8C78\u8C7A\u8C82\u8C89\u8C85\u8C8A\u8C8D\u8C8E\u8C94\u8C7C\u8C98\u621D\u8CAD\u8CAA\u8CBD\u8CB2\u8CB3\u8CAE\u8CB6\u8CC8\u8CC1\u8CE4\u8CE3\u8CDA\u8CFD\u8CFA\u8CFB\u8D04\u8D05\u8D0A\u8D07\u8D0F\u8D0D\u8D10\u9F4E\u8D13\u8CCD\u8D14\u8D16\u8D67\u8D6D\u8D71\u8D73\u8D81\u8D99\u8DC2\u8DBE\u8DBA\u8DCF\u8DDA\u8DD6\u8DCC\u8DDB\u8DCB\u8DEA\u8DEB\u8DDF\u8DE3\u8DFC\u8E08\u8E09\u8DFF\u8E1D\u8E1E\u8E10\u8E1F\u8E42\u8E35\u8E30\u8E34\u8E4A"],
      ["eda1", "\u8E47\u8E49\u8E4C\u8E50\u8E48\u8E59\u8E64\u8E60\u8E2A\u8E63\u8E55\u8E76\u8E72\u8E7C\u8E81\u8E87\u8E85\u8E84\u8E8B\u8E8A\u8E93\u8E91\u8E94\u8E99\u8EAA\u8EA1\u8EAC\u8EB0\u8EC6\u8EB1\u8EBE\u8EC5\u8EC8\u8ECB\u8EDB\u8EE3\u8EFC\u8EFB\u8EEB\u8EFE\u8F0A\u8F05\u8F15\u8F12\u8F19\u8F13\u8F1C\u8F1F\u8F1B\u8F0C\u8F26\u8F33\u8F3B\u8F39\u8F45\u8F42\u8F3E\u8F4C\u8F49\u8F46\u8F4E\u8F57\u8F5C\u8F62\u8F63\u8F64\u8F9C\u8F9F\u8FA3\u8FAD\u8FAF\u8FB7\u8FDA\u8FE5\u8FE2\u8FEA\u8FEF\u9087\u8FF4\u9005\u8FF9\u8FFA\u9011\u9015\u9021\u900D\u901E\u9016\u900B\u9027\u9036\u9035\u9039\u8FF8"],
      ["eea1", "\u904F\u9050\u9051\u9052\u900E\u9049\u903E\u9056\u9058\u905E\u9068\u906F\u9076\u96A8\u9072\u9082\u907D\u9081\u9080\u908A\u9089\u908F\u90A8\u90AF\u90B1\u90B5\u90E2\u90E4\u6248\u90DB\u9102\u9112\u9119\u9132\u9130\u914A\u9156\u9158\u9163\u9165\u9169\u9173\u9172\u918B\u9189\u9182\u91A2\u91AB\u91AF\u91AA\u91B5\u91B4\u91BA\u91C0\u91C1\u91C9\u91CB\u91D0\u91D6\u91DF\u91E1\u91DB\u91FC\u91F5\u91F6\u921E\u91FF\u9214\u922C\u9215\u9211\u925E\u9257\u9245\u9249\u9264\u9248\u9295\u923F\u924B\u9250\u929C\u9296\u9293\u929B\u925A\u92CF\u92B9\u92B7\u92E9\u930F\u92FA\u9344\u932E"],
      ["efa1", "\u9319\u9322\u931A\u9323\u933A\u9335\u933B\u935C\u9360\u937C\u936E\u9356\u93B0\u93AC\u93AD\u9394\u93B9\u93D6\u93D7\u93E8\u93E5\u93D8\u93C3\u93DD\u93D0\u93C8\u93E4\u941A\u9414\u9413\u9403\u9407\u9410\u9436\u942B\u9435\u9421\u943A\u9441\u9452\u9444\u945B\u9460\u9462\u945E\u946A\u9229\u9470\u9475\u9477\u947D\u945A\u947C\u947E\u9481\u947F\u9582\u9587\u958A\u9594\u9596\u9598\u9599\u95A0\u95A8\u95A7\u95AD\u95BC\u95BB\u95B9\u95BE\u95CA\u6FF6\u95C3\u95CD\u95CC\u95D5\u95D4\u95D6\u95DC\u95E1\u95E5\u95E2\u9621\u9628\u962E\u962F\u9642\u964C\u964F\u964B\u9677\u965C\u965E"],
      ["f0a1", "\u965D\u965F\u9666\u9672\u966C\u968D\u9698\u9695\u9697\u96AA\u96A7\u96B1\u96B2\u96B0\u96B4\u96B6\u96B8\u96B9\u96CE\u96CB\u96C9\u96CD\u894D\u96DC\u970D\u96D5\u96F9\u9704\u9706\u9708\u9713\u970E\u9711\u970F\u9716\u9719\u9724\u972A\u9730\u9739\u973D\u973E\u9744\u9746\u9748\u9742\u9749\u975C\u9760\u9764\u9766\u9768\u52D2\u976B\u9771\u9779\u9785\u977C\u9781\u977A\u9786\u978B\u978F\u9790\u979C\u97A8\u97A6\u97A3\u97B3\u97B4\u97C3\u97C6\u97C8\u97CB\u97DC\u97ED\u9F4F\u97F2\u7ADF\u97F6\u97F5\u980F\u980C\u9838\u9824\u9821\u9837\u983D\u9846\u984F\u984B\u986B\u986F\u9870"],
      ["f1a1", "\u9871\u9874\u9873\u98AA\u98AF\u98B1\u98B6\u98C4\u98C3\u98C6\u98E9\u98EB\u9903\u9909\u9912\u9914\u9918\u9921\u991D\u991E\u9924\u9920\u992C\u992E\u993D\u993E\u9942\u9949\u9945\u9950\u994B\u9951\u9952\u994C\u9955\u9997\u9998\u99A5\u99AD\u99AE\u99BC\u99DF\u99DB\u99DD\u99D8\u99D1\u99ED\u99EE\u99F1\u99F2\u99FB\u99F8\u9A01\u9A0F\u9A05\u99E2\u9A19\u9A2B\u9A37\u9A45\u9A42\u9A40\u9A43\u9A3E\u9A55\u9A4D\u9A5B\u9A57\u9A5F\u9A62\u9A65\u9A64\u9A69\u9A6B\u9A6A\u9AAD\u9AB0\u9ABC\u9AC0\u9ACF\u9AD1\u9AD3\u9AD4\u9ADE\u9ADF\u9AE2\u9AE3\u9AE6\u9AEF\u9AEB\u9AEE\u9AF4\u9AF1\u9AF7"],
      ["f2a1", "\u9AFB\u9B06\u9B18\u9B1A\u9B1F\u9B22\u9B23\u9B25\u9B27\u9B28\u9B29\u9B2A\u9B2E\u9B2F\u9B32\u9B44\u9B43\u9B4F\u9B4D\u9B4E\u9B51\u9B58\u9B74\u9B93\u9B83\u9B91\u9B96\u9B97\u9B9F\u9BA0\u9BA8\u9BB4\u9BC0\u9BCA\u9BB9\u9BC6\u9BCF\u9BD1\u9BD2\u9BE3\u9BE2\u9BE4\u9BD4\u9BE1\u9C3A\u9BF2\u9BF1\u9BF0\u9C15\u9C14\u9C09\u9C13\u9C0C\u9C06\u9C08\u9C12\u9C0A\u9C04\u9C2E\u9C1B\u9C25\u9C24\u9C21\u9C30\u9C47\u9C32\u9C46\u9C3E\u9C5A\u9C60\u9C67\u9C76\u9C78\u9CE7\u9CEC\u9CF0\u9D09\u9D08\u9CEB\u9D03\u9D06\u9D2A\u9D26\u9DAF\u9D23\u9D1F\u9D44\u9D15\u9D12\u9D41\u9D3F\u9D3E\u9D46\u9D48"],
      ["f3a1", "\u9D5D\u9D5E\u9D64\u9D51\u9D50\u9D59\u9D72\u9D89\u9D87\u9DAB\u9D6F\u9D7A\u9D9A\u9DA4\u9DA9\u9DB2\u9DC4\u9DC1\u9DBB\u9DB8\u9DBA\u9DC6\u9DCF\u9DC2\u9DD9\u9DD3\u9DF8\u9DE6\u9DED\u9DEF\u9DFD\u9E1A\u9E1B\u9E1E\u9E75\u9E79\u9E7D\u9E81\u9E88\u9E8B\u9E8C\u9E92\u9E95\u9E91\u9E9D\u9EA5\u9EA9\u9EB8\u9EAA\u9EAD\u9761\u9ECC\u9ECE\u9ECF\u9ED0\u9ED4\u9EDC\u9EDE\u9EDD\u9EE0\u9EE5\u9EE8\u9EEF\u9EF4\u9EF6\u9EF7\u9EF9\u9EFB\u9EFC\u9EFD\u9F07\u9F08\u76B7\u9F15\u9F21\u9F2C\u9F3E\u9F4A\u9F52\u9F54\u9F63\u9F5F\u9F60\u9F61\u9F66\u9F67\u9F6C\u9F6A\u9F77\u9F72\u9F76\u9F95\u9F9C\u9FA0"],
      ["f4a1", "\u582F\u69C7\u9059\u7464\u51DC\u7199"],
      ["f9a1", "\u7E8A\u891C\u9348\u9288\u84DC\u4FC9\u70BB\u6631\u68C8\u92F9\u66FB\u5F45\u4E28\u4EE1\u4EFC\u4F00\u4F03\u4F39\u4F56\u4F92\u4F8A\u4F9A\u4F94\u4FCD\u5040\u5022\u4FFF\u501E\u5046\u5070\u5042\u5094\u50F4\u50D8\u514A\u5164\u519D\u51BE\u51EC\u5215\u529C\u52A6\u52C0\u52DB\u5300\u5307\u5324\u5372\u5393\u53B2\u53DD\uFA0E\u549C\u548A\u54A9\u54FF\u5586\u5759\u5765\u57AC\u57C8\u57C7\uFA0F\uFA10\u589E\u58B2\u590B\u5953\u595B\u595D\u5963\u59A4\u59BA\u5B56\u5BC0\u752F\u5BD8\u5BEC\u5C1E\u5CA6\u5CBA\u5CF5\u5D27\u5D53\uFA11\u5D42\u5D6D\u5DB8\u5DB9\u5DD0\u5F21\u5F34\u5F67\u5FB7"],
      ["faa1", "\u5FDE\u605D\u6085\u608A\u60DE\u60D5\u6120\u60F2\u6111\u6137\u6130\u6198\u6213\u62A6\u63F5\u6460\u649D\u64CE\u654E\u6600\u6615\u663B\u6609\u662E\u661E\u6624\u6665\u6657\u6659\uFA12\u6673\u6699\u66A0\u66B2\u66BF\u66FA\u670E\uF929\u6766\u67BB\u6852\u67C0\u6801\u6844\u68CF\uFA13\u6968\uFA14\u6998\u69E2\u6A30\u6A6B\u6A46\u6A73\u6A7E\u6AE2\u6AE4\u6BD6\u6C3F\u6C5C\u6C86\u6C6F\u6CDA\u6D04\u6D87\u6D6F\u6D96\u6DAC\u6DCF\u6DF8\u6DF2\u6DFC\u6E39\u6E5C\u6E27\u6E3C\u6EBF\u6F88\u6FB5\u6FF5\u7005\u7007\u7028\u7085\u70AB\u710F\u7104\u715C\u7146\u7147\uFA15\u71C1\u71FE\u72B1"],
      ["fba1", "\u72BE\u7324\uFA16\u7377\u73BD\u73C9\u73D6\u73E3\u73D2\u7407\u73F5\u7426\u742A\u7429\u742E\u7462\u7489\u749F\u7501\u756F\u7682\u769C\u769E\u769B\u76A6\uFA17\u7746\u52AF\u7821\u784E\u7864\u787A\u7930\uFA18\uFA19\uFA1A\u7994\uFA1B\u799B\u7AD1\u7AE7\uFA1C\u7AEB\u7B9E\uFA1D\u7D48\u7D5C\u7DB7\u7DA0\u7DD6\u7E52\u7F47\u7FA1\uFA1E\u8301\u8362\u837F\u83C7\u83F6\u8448\u84B4\u8553\u8559\u856B\uFA1F\u85B0\uFA20\uFA21\u8807\u88F5\u8A12\u8A37\u8A79\u8AA7\u8ABE\u8ADF\uFA22\u8AF6\u8B53\u8B7F\u8CF0\u8CF4\u8D12\u8D76\uFA23\u8ECF\uFA24\uFA25\u9067\u90DE\uFA26\u9115\u9127\u91DA"],
      ["fca1", "\u91D7\u91DE\u91ED\u91EE\u91E4\u91E5\u9206\u9210\u920A\u923A\u9240\u923C\u924E\u9259\u9251\u9239\u9267\u92A7\u9277\u9278\u92E7\u92D7\u92D9\u92D0\uFA27\u92D5\u92E0\u92D3\u9325\u9321\u92FB\uFA28\u931E\u92FF\u931D\u9302\u9370\u9357\u93A4\u93C6\u93DE\u93F8\u9431\u9445\u9448\u9592\uF9DC\uFA29\u969D\u96AF\u9733\u973B\u9743\u974D\u974F\u9751\u9755\u9857\u9865\uFA2A\uFA2B\u9927\uFA2C\u999E\u9A4E\u9AD9\u9ADC\u9B75\u9B72\u9B8F\u9BB1\u9BBB\u9C00\u9D70\u9D6B\uFA2D\u9E19\u9ED1"],
      ["fcf1", "\u2170", 9, "\uFFE2\uFFE4\uFF07\uFF02"],
      ["8fa2af", "\u02D8\u02C7\xB8\u02D9\u02DD\xAF\u02DB\u02DA\uFF5E\u0384\u0385"],
      ["8fa2c2", "\xA1\xA6\xBF"],
      ["8fa2eb", "\xBA\xAA\xA9\xAE\u2122\xA4\u2116"],
      ["8fa6e1", "\u0386\u0388\u0389\u038A\u03AA"],
      ["8fa6e7", "\u038C"],
      ["8fa6e9", "\u038E\u03AB"],
      ["8fa6ec", "\u038F"],
      ["8fa6f1", "\u03AC\u03AD\u03AE\u03AF\u03CA\u0390\u03CC\u03C2\u03CD\u03CB\u03B0\u03CE"],
      ["8fa7c2", "\u0402", 10, "\u040E\u040F"],
      ["8fa7f2", "\u0452", 10, "\u045E\u045F"],
      ["8fa9a1", "\xC6\u0110"],
      ["8fa9a4", "\u0126"],
      ["8fa9a6", "\u0132"],
      ["8fa9a8", "\u0141\u013F"],
      ["8fa9ab", "\u014A\xD8\u0152"],
      ["8fa9af", "\u0166\xDE"],
      ["8fa9c1", "\xE6\u0111\xF0\u0127\u0131\u0133\u0138\u0142\u0140\u0149\u014B\xF8\u0153\xDF\u0167\xFE"],
      ["8faaa1", "\xC1\xC0\xC4\xC2\u0102\u01CD\u0100\u0104\xC5\xC3\u0106\u0108\u010C\xC7\u010A\u010E\xC9\xC8\xCB\xCA\u011A\u0116\u0112\u0118"],
      ["8faaba", "\u011C\u011E\u0122\u0120\u0124\xCD\xCC\xCF\xCE\u01CF\u0130\u012A\u012E\u0128\u0134\u0136\u0139\u013D\u013B\u0143\u0147\u0145\xD1\xD3\xD2\xD6\xD4\u01D1\u0150\u014C\xD5\u0154\u0158\u0156\u015A\u015C\u0160\u015E\u0164\u0162\xDA\xD9\xDC\xDB\u016C\u01D3\u0170\u016A\u0172\u016E\u0168\u01D7\u01DB\u01D9\u01D5\u0174\xDD\u0178\u0176\u0179\u017D\u017B"],
      ["8faba1", "\xE1\xE0\xE4\xE2\u0103\u01CE\u0101\u0105\xE5\xE3\u0107\u0109\u010D\xE7\u010B\u010F\xE9\xE8\xEB\xEA\u011B\u0117\u0113\u0119\u01F5\u011D\u011F"],
      ["8fabbd", "\u0121\u0125\xED\xEC\xEF\xEE\u01D0"],
      ["8fabc5", "\u012B\u012F\u0129\u0135\u0137\u013A\u013E\u013C\u0144\u0148\u0146\xF1\xF3\xF2\xF6\xF4\u01D2\u0151\u014D\xF5\u0155\u0159\u0157\u015B\u015D\u0161\u015F\u0165\u0163\xFA\xF9\xFC\xFB\u016D\u01D4\u0171\u016B\u0173\u016F\u0169\u01D8\u01DC\u01DA\u01D6\u0175\xFD\xFF\u0177\u017A\u017E\u017C"],
      ["8fb0a1", "\u4E02\u4E04\u4E05\u4E0C\u4E12\u4E1F\u4E23\u4E24\u4E28\u4E2B\u4E2E\u4E2F\u4E30\u4E35\u4E40\u4E41\u4E44\u4E47\u4E51\u4E5A\u4E5C\u4E63\u4E68\u4E69\u4E74\u4E75\u4E79\u4E7F\u4E8D\u4E96\u4E97\u4E9D\u4EAF\u4EB9\u4EC3\u4ED0\u4EDA\u4EDB\u4EE0\u4EE1\u4EE2\u4EE8\u4EEF\u4EF1\u4EF3\u4EF5\u4EFD\u4EFE\u4EFF\u4F00\u4F02\u4F03\u4F08\u4F0B\u4F0C\u4F12\u4F15\u4F16\u4F17\u4F19\u4F2E\u4F31\u4F60\u4F33\u4F35\u4F37\u4F39\u4F3B\u4F3E\u4F40\u4F42\u4F48\u4F49\u4F4B\u4F4C\u4F52\u4F54\u4F56\u4F58\u4F5F\u4F63\u4F6A\u4F6C\u4F6E\u4F71\u4F77\u4F78\u4F79\u4F7A\u4F7D\u4F7E\u4F81\u4F82\u4F84"],
      ["8fb1a1", "\u4F85\u4F89\u4F8A\u4F8C\u4F8E\u4F90\u4F92\u4F93\u4F94\u4F97\u4F99\u4F9A\u4F9E\u4F9F\u4FB2\u4FB7\u4FB9\u4FBB\u4FBC\u4FBD\u4FBE\u4FC0\u4FC1\u4FC5\u4FC6\u4FC8\u4FC9\u4FCB\u4FCC\u4FCD\u4FCF\u4FD2\u4FDC\u4FE0\u4FE2\u4FF0\u4FF2\u4FFC\u4FFD\u4FFF\u5000\u5001\u5004\u5007\u500A\u500C\u500E\u5010\u5013\u5017\u5018\u501B\u501C\u501D\u501E\u5022\u5027\u502E\u5030\u5032\u5033\u5035\u5040\u5041\u5042\u5045\u5046\u504A\u504C\u504E\u5051\u5052\u5053\u5057\u5059\u505F\u5060\u5062\u5063\u5066\u5067\u506A\u506D\u5070\u5071\u503B\u5081\u5083\u5084\u5086\u508A\u508E\u508F\u5090"],
      ["8fb2a1", "\u5092\u5093\u5094\u5096\u509B\u509C\u509E", 4, "\u50AA\u50AF\u50B0\u50B9\u50BA\u50BD\u50C0\u50C3\u50C4\u50C7\u50CC\u50CE\u50D0\u50D3\u50D4\u50D8\u50DC\u50DD\u50DF\u50E2\u50E4\u50E6\u50E8\u50E9\u50EF\u50F1\u50F6\u50FA\u50FE\u5103\u5106\u5107\u5108\u510B\u510C\u510D\u510E\u50F2\u5110\u5117\u5119\u511B\u511C\u511D\u511E\u5123\u5127\u5128\u512C\u512D\u512F\u5131\u5133\u5134\u5135\u5138\u5139\u5142\u514A\u514F\u5153\u5155\u5157\u5158\u515F\u5164\u5166\u517E\u5183\u5184\u518B\u518E\u5198\u519D\u51A1\u51A3\u51AD\u51B8\u51BA\u51BC\u51BE\u51BF\u51C2"],
      ["8fb3a1", "\u51C8\u51CF\u51D1\u51D2\u51D3\u51D5\u51D8\u51DE\u51E2\u51E5\u51EE\u51F2\u51F3\u51F4\u51F7\u5201\u5202\u5205\u5212\u5213\u5215\u5216\u5218\u5222\u5228\u5231\u5232\u5235\u523C\u5245\u5249\u5255\u5257\u5258\u525A\u525C\u525F\u5260\u5261\u5266\u526E\u5277\u5278\u5279\u5280\u5282\u5285\u528A\u528C\u5293\u5295\u5296\u5297\u5298\u529A\u529C\u52A4\u52A5\u52A6\u52A7\u52AF\u52B0\u52B6\u52B7\u52B8\u52BA\u52BB\u52BD\u52C0\u52C4\u52C6\u52C8\u52CC\u52CF\u52D1\u52D4\u52D6\u52DB\u52DC\u52E1\u52E5\u52E8\u52E9\u52EA\u52EC\u52F0\u52F1\u52F4\u52F6\u52F7\u5300\u5303\u530A\u530B"],
      ["8fb4a1", "\u530C\u5311\u5313\u5318\u531B\u531C\u531E\u531F\u5325\u5327\u5328\u5329\u532B\u532C\u532D\u5330\u5332\u5335\u533C\u533D\u533E\u5342\u534C\u534B\u5359\u535B\u5361\u5363\u5365\u536C\u536D\u5372\u5379\u537E\u5383\u5387\u5388\u538E\u5393\u5394\u5399\u539D\u53A1\u53A4\u53AA\u53AB\u53AF\u53B2\u53B4\u53B5\u53B7\u53B8\u53BA\u53BD\u53C0\u53C5\u53CF\u53D2\u53D3\u53D5\u53DA\u53DD\u53DE\u53E0\u53E6\u53E7\u53F5\u5402\u5413\u541A\u5421\u5427\u5428\u542A\u542F\u5431\u5434\u5435\u5443\u5444\u5447\u544D\u544F\u545E\u5462\u5464\u5466\u5467\u5469\u546B\u546D\u546E\u5474\u547F"],
      ["8fb5a1", "\u5481\u5483\u5485\u5488\u5489\u548D\u5491\u5495\u5496\u549C\u549F\u54A1\u54A6\u54A7\u54A9\u54AA\u54AD\u54AE\u54B1\u54B7\u54B9\u54BA\u54BB\u54BF\u54C6\u54CA\u54CD\u54CE\u54E0\u54EA\u54EC\u54EF\u54F6\u54FC\u54FE\u54FF\u5500\u5501\u5505\u5508\u5509\u550C\u550D\u550E\u5515\u552A\u552B\u5532\u5535\u5536\u553B\u553C\u553D\u5541\u5547\u5549\u554A\u554D\u5550\u5551\u5558\u555A\u555B\u555E\u5560\u5561\u5564\u5566\u557F\u5581\u5582\u5586\u5588\u558E\u558F\u5591\u5592\u5593\u5594\u5597\u55A3\u55A4\u55AD\u55B2\u55BF\u55C1\u55C3\u55C6\u55C9\u55CB\u55CC\u55CE\u55D1\u55D2"],
      ["8fb6a1", "\u55D3\u55D7\u55D8\u55DB\u55DE\u55E2\u55E9\u55F6\u55FF\u5605\u5608\u560A\u560D", 5, "\u5619\u562C\u5630\u5633\u5635\u5637\u5639\u563B\u563C\u563D\u563F\u5640\u5641\u5643\u5644\u5646\u5649\u564B\u564D\u564F\u5654\u565E\u5660\u5661\u5662\u5663\u5666\u5669\u566D\u566F\u5671\u5672\u5675\u5684\u5685\u5688\u568B\u568C\u5695\u5699\u569A\u569D\u569E\u569F\u56A6\u56A7\u56A8\u56A9\u56AB\u56AC\u56AD\u56B1\u56B3\u56B7\u56BE\u56C5\u56C9\u56CA\u56CB\u56CF\u56D0\u56CC\u56CD\u56D9\u56DC\u56DD\u56DF\u56E1\u56E4", 4, "\u56F1\u56EB\u56ED"],
      ["8fb7a1", "\u56F6\u56F7\u5701\u5702\u5707\u570A\u570C\u5711\u5715\u571A\u571B\u571D\u5720\u5722\u5723\u5724\u5725\u5729\u572A\u572C\u572E\u572F\u5733\u5734\u573D\u573E\u573F\u5745\u5746\u574C\u574D\u5752\u5762\u5765\u5767\u5768\u576B\u576D", 4, "\u5773\u5774\u5775\u5777\u5779\u577A\u577B\u577C\u577E\u5781\u5783\u578C\u5794\u5797\u5799\u579A\u579C\u579D\u579E\u579F\u57A1\u5795\u57A7\u57A8\u57A9\u57AC\u57B8\u57BD\u57C7\u57C8\u57CC\u57CF\u57D5\u57DD\u57DE\u57E4\u57E6\u57E7\u57E9\u57ED\u57F0\u57F5\u57F6\u57F8\u57FD\u57FE\u57FF\u5803\u5804\u5808\u5809\u57E1"],
      ["8fb8a1", "\u580C\u580D\u581B\u581E\u581F\u5820\u5826\u5827\u582D\u5832\u5839\u583F\u5849\u584C\u584D\u584F\u5850\u5855\u585F\u5861\u5864\u5867\u5868\u5878\u587C\u587F\u5880\u5881\u5887\u5888\u5889\u588A\u588C\u588D\u588F\u5890\u5894\u5896\u589D\u58A0\u58A1\u58A2\u58A6\u58A9\u58B1\u58B2\u58C4\u58BC\u58C2\u58C8\u58CD\u58CE\u58D0\u58D2\u58D4\u58D6\u58DA\u58DD\u58E1\u58E2\u58E9\u58F3\u5905\u5906\u590B\u590C\u5912\u5913\u5914\u8641\u591D\u5921\u5923\u5924\u5928\u592F\u5930\u5933\u5935\u5936\u593F\u5943\u5946\u5952\u5953\u5959\u595B\u595D\u595E\u595F\u5961\u5963\u596B\u596D"],
      ["8fb9a1", "\u596F\u5972\u5975\u5976\u5979\u597B\u597C\u598B\u598C\u598E\u5992\u5995\u5997\u599F\u59A4\u59A7\u59AD\u59AE\u59AF\u59B0\u59B3\u59B7\u59BA\u59BC\u59C1\u59C3\u59C4\u59C8\u59CA\u59CD\u59D2\u59DD\u59DE\u59DF\u59E3\u59E4\u59E7\u59EE\u59EF\u59F1\u59F2\u59F4\u59F7\u5A00\u5A04\u5A0C\u5A0D\u5A0E\u5A12\u5A13\u5A1E\u5A23\u5A24\u5A27\u5A28\u5A2A\u5A2D\u5A30\u5A44\u5A45\u5A47\u5A48\u5A4C\u5A50\u5A55\u5A5E\u5A63\u5A65\u5A67\u5A6D\u5A77\u5A7A\u5A7B\u5A7E\u5A8B\u5A90\u5A93\u5A96\u5A99\u5A9C\u5A9E\u5A9F\u5AA0\u5AA2\u5AA7\u5AAC\u5AB1\u5AB2\u5AB3\u5AB5\u5AB8\u5ABA\u5ABB\u5ABF"],
      ["8fbaa1", "\u5AC4\u5AC6\u5AC8\u5ACF\u5ADA\u5ADC\u5AE0\u5AE5\u5AEA\u5AEE\u5AF5\u5AF6\u5AFD\u5B00\u5B01\u5B08\u5B17\u5B34\u5B19\u5B1B\u5B1D\u5B21\u5B25\u5B2D\u5B38\u5B41\u5B4B\u5B4C\u5B52\u5B56\u5B5E\u5B68\u5B6E\u5B6F\u5B7C\u5B7D\u5B7E\u5B7F\u5B81\u5B84\u5B86\u5B8A\u5B8E\u5B90\u5B91\u5B93\u5B94\u5B96\u5BA8\u5BA9\u5BAC\u5BAD\u5BAF\u5BB1\u5BB2\u5BB7\u5BBA\u5BBC\u5BC0\u5BC1\u5BCD\u5BCF\u5BD6", 4, "\u5BE0\u5BEF\u5BF1\u5BF4\u5BFD\u5C0C\u5C17\u5C1E\u5C1F\u5C23\u5C26\u5C29\u5C2B\u5C2C\u5C2E\u5C30\u5C32\u5C35\u5C36\u5C59\u5C5A\u5C5C\u5C62\u5C63\u5C67\u5C68\u5C69"],
      ["8fbba1", "\u5C6D\u5C70\u5C74\u5C75\u5C7A\u5C7B\u5C7C\u5C7D\u5C87\u5C88\u5C8A\u5C8F\u5C92\u5C9D\u5C9F\u5CA0\u5CA2\u5CA3\u5CA6\u5CAA\u5CB2\u5CB4\u5CB5\u5CBA\u5CC9\u5CCB\u5CD2\u5CDD\u5CD7\u5CEE\u5CF1\u5CF2\u5CF4\u5D01\u5D06\u5D0D\u5D12\u5D2B\u5D23\u5D24\u5D26\u5D27\u5D31\u5D34\u5D39\u5D3D\u5D3F\u5D42\u5D43\u5D46\u5D48\u5D55\u5D51\u5D59\u5D4A\u5D5F\u5D60\u5D61\u5D62\u5D64\u5D6A\u5D6D\u5D70\u5D79\u5D7A\u5D7E\u5D7F\u5D81\u5D83\u5D88\u5D8A\u5D92\u5D93\u5D94\u5D95\u5D99\u5D9B\u5D9F\u5DA0\u5DA7\u5DAB\u5DB0\u5DB4\u5DB8\u5DB9\u5DC3\u5DC7\u5DCB\u5DD0\u5DCE\u5DD8\u5DD9\u5DE0\u5DE4"],
      ["8fbca1", "\u5DE9\u5DF8\u5DF9\u5E00\u5E07\u5E0D\u5E12\u5E14\u5E15\u5E18\u5E1F\u5E20\u5E2E\u5E28\u5E32\u5E35\u5E3E\u5E4B\u5E50\u5E49\u5E51\u5E56\u5E58\u5E5B\u5E5C\u5E5E\u5E68\u5E6A", 4, "\u5E70\u5E80\u5E8B\u5E8E\u5EA2\u5EA4\u5EA5\u5EA8\u5EAA\u5EAC\u5EB1\u5EB3\u5EBD\u5EBE\u5EBF\u5EC6\u5ECC\u5ECB\u5ECE\u5ED1\u5ED2\u5ED4\u5ED5\u5EDC\u5EDE\u5EE5\u5EEB\u5F02\u5F06\u5F07\u5F08\u5F0E\u5F19\u5F1C\u5F1D\u5F21\u5F22\u5F23\u5F24\u5F28\u5F2B\u5F2C\u5F2E\u5F30\u5F34\u5F36\u5F3B\u5F3D\u5F3F\u5F40\u5F44\u5F45\u5F47\u5F4D\u5F50\u5F54\u5F58\u5F5B\u5F60\u5F63\u5F64\u5F67"],
      ["8fbda1", "\u5F6F\u5F72\u5F74\u5F75\u5F78\u5F7A\u5F7D\u5F7E\u5F89\u5F8D\u5F8F\u5F96\u5F9C\u5F9D\u5FA2\u5FA7\u5FAB\u5FA4\u5FAC\u5FAF\u5FB0\u5FB1\u5FB8\u5FC4\u5FC7\u5FC8\u5FC9\u5FCB\u5FD0", 4, "\u5FDE\u5FE1\u5FE2\u5FE8\u5FE9\u5FEA\u5FEC\u5FED\u5FEE\u5FEF\u5FF2\u5FF3\u5FF6\u5FFA\u5FFC\u6007\u600A\u600D\u6013\u6014\u6017\u6018\u601A\u601F\u6024\u602D\u6033\u6035\u6040\u6047\u6048\u6049\u604C\u6051\u6054\u6056\u6057\u605D\u6061\u6067\u6071\u607E\u607F\u6082\u6086\u6088\u608A\u608E\u6091\u6093\u6095\u6098\u609D\u609E\u60A2\u60A4\u60A5\u60A8\u60B0\u60B1\u60B7"],
      ["8fbea1", "\u60BB\u60BE\u60C2\u60C4\u60C8\u60C9\u60CA\u60CB\u60CE\u60CF\u60D4\u60D5\u60D9\u60DB\u60DD\u60DE\u60E2\u60E5\u60F2\u60F5\u60F8\u60FC\u60FD\u6102\u6107\u610A\u610C\u6110", 4, "\u6116\u6117\u6119\u611C\u611E\u6122\u612A\u612B\u6130\u6131\u6135\u6136\u6137\u6139\u6141\u6145\u6146\u6149\u615E\u6160\u616C\u6172\u6178\u617B\u617C\u617F\u6180\u6181\u6183\u6184\u618B\u618D\u6192\u6193\u6197\u6198\u619C\u619D\u619F\u61A0\u61A5\u61A8\u61AA\u61AD\u61B8\u61B9\u61BC\u61C0\u61C1\u61C2\u61CE\u61CF\u61D5\u61DC\u61DD\u61DE\u61DF\u61E1\u61E2\u61E7\u61E9\u61E5"],
      ["8fbfa1", "\u61EC\u61ED\u61EF\u6201\u6203\u6204\u6207\u6213\u6215\u621C\u6220\u6222\u6223\u6227\u6229\u622B\u6239\u623D\u6242\u6243\u6244\u6246\u624C\u6250\u6251\u6252\u6254\u6256\u625A\u625C\u6264\u626D\u626F\u6273\u627A\u627D\u628D\u628E\u628F\u6290\u62A6\u62A8\u62B3\u62B6\u62B7\u62BA\u62BE\u62BF\u62C4\u62CE\u62D5\u62D6\u62DA\u62EA\u62F2\u62F4\u62FC\u62FD\u6303\u6304\u630A\u630B\u630D\u6310\u6313\u6316\u6318\u6329\u632A\u632D\u6335\u6336\u6339\u633C\u6341\u6342\u6343\u6344\u6346\u634A\u634B\u634E\u6352\u6353\u6354\u6358\u635B\u6365\u6366\u636C\u636D\u6371\u6374\u6375"],
      ["8fc0a1", "\u6378\u637C\u637D\u637F\u6382\u6384\u6387\u638A\u6390\u6394\u6395\u6399\u639A\u639E\u63A4\u63A6\u63AD\u63AE\u63AF\u63BD\u63C1\u63C5\u63C8\u63CE\u63D1\u63D3\u63D4\u63D5\u63DC\u63E0\u63E5\u63EA\u63EC\u63F2\u63F3\u63F5\u63F8\u63F9\u6409\u640A\u6410\u6412\u6414\u6418\u641E\u6420\u6422\u6424\u6425\u6429\u642A\u642F\u6430\u6435\u643D\u643F\u644B\u644F\u6451\u6452\u6453\u6454\u645A\u645B\u645C\u645D\u645F\u6460\u6461\u6463\u646D\u6473\u6474\u647B\u647D\u6485\u6487\u648F\u6490\u6491\u6498\u6499\u649B\u649D\u649F\u64A1\u64A3\u64A6\u64A8\u64AC\u64B3\u64BD\u64BE\u64BF"],
      ["8fc1a1", "\u64C4\u64C9\u64CA\u64CB\u64CC\u64CE\u64D0\u64D1\u64D5\u64D7\u64E4\u64E5\u64E9\u64EA\u64ED\u64F0\u64F5\u64F7\u64FB\u64FF\u6501\u6504\u6508\u6509\u650A\u650F\u6513\u6514\u6516\u6519\u651B\u651E\u651F\u6522\u6526\u6529\u652E\u6531\u653A\u653C\u653D\u6543\u6547\u6549\u6550\u6552\u6554\u655F\u6560\u6567\u656B\u657A\u657D\u6581\u6585\u658A\u6592\u6595\u6598\u659D\u65A0\u65A3\u65A6\u65AE\u65B2\u65B3\u65B4\u65BF\u65C2\u65C8\u65C9\u65CE\u65D0\u65D4\u65D6\u65D8\u65DF\u65F0\u65F2\u65F4\u65F5\u65F9\u65FE\u65FF\u6600\u6604\u6608\u6609\u660D\u6611\u6612\u6615\u6616\u661D"],
      ["8fc2a1", "\u661E\u6621\u6622\u6623\u6624\u6626\u6629\u662A\u662B\u662C\u662E\u6630\u6631\u6633\u6639\u6637\u6640\u6645\u6646\u664A\u664C\u6651\u664E\u6657\u6658\u6659\u665B\u665C\u6660\u6661\u66FB\u666A\u666B\u666C\u667E\u6673\u6675\u667F\u6677\u6678\u6679\u667B\u6680\u667C\u668B\u668C\u668D\u6690\u6692\u6699\u669A\u669B\u669C\u669F\u66A0\u66A4\u66AD\u66B1\u66B2\u66B5\u66BB\u66BF\u66C0\u66C2\u66C3\u66C8\u66CC\u66CE\u66CF\u66D4\u66DB\u66DF\u66E8\u66EB\u66EC\u66EE\u66FA\u6705\u6707\u670E\u6713\u6719\u671C\u6720\u6722\u6733\u673E\u6745\u6747\u6748\u674C\u6754\u6755\u675D"],
      ["8fc3a1", "\u6766\u676C\u676E\u6774\u6776\u677B\u6781\u6784\u678E\u678F\u6791\u6793\u6796\u6798\u6799\u679B\u67B0\u67B1\u67B2\u67B5\u67BB\u67BC\u67BD\u67F9\u67C0\u67C2\u67C3\u67C5\u67C8\u67C9\u67D2\u67D7\u67D9\u67DC\u67E1\u67E6\u67F0\u67F2\u67F6\u67F7\u6852\u6814\u6819\u681D\u681F\u6828\u6827\u682C\u682D\u682F\u6830\u6831\u6833\u683B\u683F\u6844\u6845\u684A\u684C\u6855\u6857\u6858\u685B\u686B\u686E", 4, "\u6875\u6879\u687A\u687B\u687C\u6882\u6884\u6886\u6888\u6896\u6898\u689A\u689C\u68A1\u68A3\u68A5\u68A9\u68AA\u68AE\u68B2\u68BB\u68C5\u68C8\u68CC\u68CF"],
      ["8fc4a1", "\u68D0\u68D1\u68D3\u68D6\u68D9\u68DC\u68DD\u68E5\u68E8\u68EA\u68EB\u68EC\u68ED\u68F0\u68F1\u68F5\u68F6\u68FB\u68FC\u68FD\u6906\u6909\u690A\u6910\u6911\u6913\u6916\u6917\u6931\u6933\u6935\u6938\u693B\u6942\u6945\u6949\u694E\u6957\u695B\u6963\u6964\u6965\u6966\u6968\u6969\u696C\u6970\u6971\u6972\u697A\u697B\u697F\u6980\u698D\u6992\u6996\u6998\u69A1\u69A5\u69A6\u69A8\u69AB\u69AD\u69AF\u69B7\u69B8\u69BA\u69BC\u69C5\u69C8\u69D1\u69D6\u69D7\u69E2\u69E5\u69EE\u69EF\u69F1\u69F3\u69F5\u69FE\u6A00\u6A01\u6A03\u6A0F\u6A11\u6A15\u6A1A\u6A1D\u6A20\u6A24\u6A28\u6A30\u6A32"],
      ["8fc5a1", "\u6A34\u6A37\u6A3B\u6A3E\u6A3F\u6A45\u6A46\u6A49\u6A4A\u6A4E\u6A50\u6A51\u6A52\u6A55\u6A56\u6A5B\u6A64\u6A67\u6A6A\u6A71\u6A73\u6A7E\u6A81\u6A83\u6A86\u6A87\u6A89\u6A8B\u6A91\u6A9B\u6A9D\u6A9E\u6A9F\u6AA5\u6AAB\u6AAF\u6AB0\u6AB1\u6AB4\u6ABD\u6ABE\u6ABF\u6AC6\u6AC9\u6AC8\u6ACC\u6AD0\u6AD4\u6AD5\u6AD6\u6ADC\u6ADD\u6AE4\u6AE7\u6AEC\u6AF0\u6AF1\u6AF2\u6AFC\u6AFD\u6B02\u6B03\u6B06\u6B07\u6B09\u6B0F\u6B10\u6B11\u6B17\u6B1B\u6B1E\u6B24\u6B28\u6B2B\u6B2C\u6B2F\u6B35\u6B36\u6B3B\u6B3F\u6B46\u6B4A\u6B4D\u6B52\u6B56\u6B58\u6B5D\u6B60\u6B67\u6B6B\u6B6E\u6B70\u6B75\u6B7D"],
      ["8fc6a1", "\u6B7E\u6B82\u6B85\u6B97\u6B9B\u6B9F\u6BA0\u6BA2\u6BA3\u6BA8\u6BA9\u6BAC\u6BAD\u6BAE\u6BB0\u6BB8\u6BB9\u6BBD\u6BBE\u6BC3\u6BC4\u6BC9\u6BCC\u6BD6\u6BDA\u6BE1\u6BE3\u6BE6\u6BE7\u6BEE\u6BF1\u6BF7\u6BF9\u6BFF\u6C02\u6C04\u6C05\u6C09\u6C0D\u6C0E\u6C10\u6C12\u6C19\u6C1F\u6C26\u6C27\u6C28\u6C2C\u6C2E\u6C33\u6C35\u6C36\u6C3A\u6C3B\u6C3F\u6C4A\u6C4B\u6C4D\u6C4F\u6C52\u6C54\u6C59\u6C5B\u6C5C\u6C6B\u6C6D\u6C6F\u6C74\u6C76\u6C78\u6C79\u6C7B\u6C85\u6C86\u6C87\u6C89\u6C94\u6C95\u6C97\u6C98\u6C9C\u6C9F\u6CB0\u6CB2\u6CB4\u6CC2\u6CC6\u6CCD\u6CCF\u6CD0\u6CD1\u6CD2\u6CD4\u6CD6"],
      ["8fc7a1", "\u6CDA\u6CDC\u6CE0\u6CE7\u6CE9\u6CEB\u6CEC\u6CEE\u6CF2\u6CF4\u6D04\u6D07\u6D0A\u6D0E\u6D0F\u6D11\u6D13\u6D1A\u6D26\u6D27\u6D28\u6C67\u6D2E\u6D2F\u6D31\u6D39\u6D3C\u6D3F\u6D57\u6D5E\u6D5F\u6D61\u6D65\u6D67\u6D6F\u6D70\u6D7C\u6D82\u6D87\u6D91\u6D92\u6D94\u6D96\u6D97\u6D98\u6DAA\u6DAC\u6DB4\u6DB7\u6DB9\u6DBD\u6DBF\u6DC4\u6DC8\u6DCA\u6DCE\u6DCF\u6DD6\u6DDB\u6DDD\u6DDF\u6DE0\u6DE2\u6DE5\u6DE9\u6DEF\u6DF0\u6DF4\u6DF6\u6DFC\u6E00\u6E04\u6E1E\u6E22\u6E27\u6E32\u6E36\u6E39\u6E3B\u6E3C\u6E44\u6E45\u6E48\u6E49\u6E4B\u6E4F\u6E51\u6E52\u6E53\u6E54\u6E57\u6E5C\u6E5D\u6E5E"],
      ["8fc8a1", "\u6E62\u6E63\u6E68\u6E73\u6E7B\u6E7D\u6E8D\u6E93\u6E99\u6EA0\u6EA7\u6EAD\u6EAE\u6EB1\u6EB3\u6EBB\u6EBF\u6EC0\u6EC1\u6EC3\u6EC7\u6EC8\u6ECA\u6ECD\u6ECE\u6ECF\u6EEB\u6EED\u6EEE\u6EF9\u6EFB\u6EFD\u6F04\u6F08\u6F0A\u6F0C\u6F0D\u6F16\u6F18\u6F1A\u6F1B\u6F26\u6F29\u6F2A\u6F2F\u6F30\u6F33\u6F36\u6F3B\u6F3C\u6F2D\u6F4F\u6F51\u6F52\u6F53\u6F57\u6F59\u6F5A\u6F5D\u6F5E\u6F61\u6F62\u6F68\u6F6C\u6F7D\u6F7E\u6F83\u6F87\u6F88\u6F8B\u6F8C\u6F8D\u6F90\u6F92\u6F93\u6F94\u6F96\u6F9A\u6F9F\u6FA0\u6FA5\u6FA6\u6FA7\u6FA8\u6FAE\u6FAF\u6FB0\u6FB5\u6FB6\u6FBC\u6FC5\u6FC7\u6FC8\u6FCA"],
      ["8fc9a1", "\u6FDA\u6FDE\u6FE8\u6FE9\u6FF0\u6FF5\u6FF9\u6FFC\u6FFD\u7000\u7005\u7006\u7007\u700D\u7017\u7020\u7023\u702F\u7034\u7037\u7039\u703C\u7043\u7044\u7048\u7049\u704A\u704B\u7054\u7055\u705D\u705E\u704E\u7064\u7065\u706C\u706E\u7075\u7076\u707E\u7081\u7085\u7086\u7094", 4, "\u709B\u70A4\u70AB\u70B0\u70B1\u70B4\u70B7\u70CA\u70D1\u70D3\u70D4\u70D5\u70D6\u70D8\u70DC\u70E4\u70FA\u7103", 4, "\u710B\u710C\u710F\u711E\u7120\u712B\u712D\u712F\u7130\u7131\u7138\u7141\u7145\u7146\u7147\u714A\u714B\u7150\u7152\u7157\u715A\u715C\u715E\u7160"],
      ["8fcaa1", "\u7168\u7179\u7180\u7185\u7187\u718C\u7192\u719A\u719B\u71A0\u71A2\u71AF\u71B0\u71B2\u71B3\u71BA\u71BF\u71C0\u71C1\u71C4\u71CB\u71CC\u71D3\u71D6\u71D9\u71DA\u71DC\u71F8\u71FE\u7200\u7207\u7208\u7209\u7213\u7217\u721A\u721D\u721F\u7224\u722B\u722F\u7234\u7238\u7239\u7241\u7242\u7243\u7245\u724E\u724F\u7250\u7253\u7255\u7256\u725A\u725C\u725E\u7260\u7263\u7268\u726B\u726E\u726F\u7271\u7277\u7278\u727B\u727C\u727F\u7284\u7289\u728D\u728E\u7293\u729B\u72A8\u72AD\u72AE\u72B1\u72B4\u72BE\u72C1\u72C7\u72C9\u72CC\u72D5\u72D6\u72D8\u72DF\u72E5\u72F3\u72F4\u72FA\u72FB"],
      ["8fcba1", "\u72FE\u7302\u7304\u7305\u7307\u730B\u730D\u7312\u7313\u7318\u7319\u731E\u7322\u7324\u7327\u7328\u732C\u7331\u7332\u7335\u733A\u733B\u733D\u7343\u734D\u7350\u7352\u7356\u7358\u735D\u735E\u735F\u7360\u7366\u7367\u7369\u736B\u736C\u736E\u736F\u7371\u7377\u7379\u737C\u7380\u7381\u7383\u7385\u7386\u738E\u7390\u7393\u7395\u7397\u7398\u739C\u739E\u739F\u73A0\u73A2\u73A5\u73A6\u73AA\u73AB\u73AD\u73B5\u73B7\u73B9\u73BC\u73BD\u73BF\u73C5\u73C6\u73C9\u73CB\u73CC\u73CF\u73D2\u73D3\u73D6\u73D9\u73DD\u73E1\u73E3\u73E6\u73E7\u73E9\u73F4\u73F5\u73F7\u73F9\u73FA\u73FB\u73FD"],
      ["8fcca1", "\u73FF\u7400\u7401\u7404\u7407\u740A\u7411\u741A\u741B\u7424\u7426\u7428", 9, "\u7439\u7440\u7443\u7444\u7446\u7447\u744B\u744D\u7451\u7452\u7457\u745D\u7462\u7466\u7467\u7468\u746B\u746D\u746E\u7471\u7472\u7480\u7481\u7485\u7486\u7487\u7489\u748F\u7490\u7491\u7492\u7498\u7499\u749A\u749C\u749F\u74A0\u74A1\u74A3\u74A6\u74A8\u74A9\u74AA\u74AB\u74AE\u74AF\u74B1\u74B2\u74B5\u74B9\u74BB\u74BF\u74C8\u74C9\u74CC\u74D0\u74D3\u74D8\u74DA\u74DB\u74DE\u74DF\u74E4\u74E8\u74EA\u74EB\u74EF\u74F4\u74FA\u74FB\u74FC\u74FF\u7506"],
      ["8fcda1", "\u7512\u7516\u7517\u7520\u7521\u7524\u7527\u7529\u752A\u752F\u7536\u7539\u753D\u753E\u753F\u7540\u7543\u7547\u7548\u754E\u7550\u7552\u7557\u755E\u755F\u7561\u756F\u7571\u7579", 5, "\u7581\u7585\u7590\u7592\u7593\u7595\u7599\u759C\u75A2\u75A4\u75B4\u75BA\u75BF\u75C0\u75C1\u75C4\u75C6\u75CC\u75CE\u75CF\u75D7\u75DC\u75DF\u75E0\u75E1\u75E4\u75E7\u75EC\u75EE\u75EF\u75F1\u75F9\u7600\u7602\u7603\u7604\u7607\u7608\u760A\u760C\u760F\u7612\u7613\u7615\u7616\u7619\u761B\u761C\u761D\u761E\u7623\u7625\u7626\u7629\u762D\u7632\u7633\u7635\u7638\u7639"],
      ["8fcea1", "\u763A\u763C\u764A\u7640\u7641\u7643\u7644\u7645\u7649\u764B\u7655\u7659\u765F\u7664\u7665\u766D\u766E\u766F\u7671\u7674\u7681\u7685\u768C\u768D\u7695\u769B\u769C\u769D\u769F\u76A0\u76A2", 6, "\u76AA\u76AD\u76BD\u76C1\u76C5\u76C9\u76CB\u76CC\u76CE\u76D4\u76D9\u76E0\u76E6\u76E8\u76EC\u76F0\u76F1\u76F6\u76F9\u76FC\u7700\u7706\u770A\u770E\u7712\u7714\u7715\u7717\u7719\u771A\u771C\u7722\u7728\u772D\u772E\u772F\u7734\u7735\u7736\u7739\u773D\u773E\u7742\u7745\u7746\u774A\u774D\u774E\u774F\u7752\u7756\u7757\u775C\u775E\u775F\u7760\u7762"],
      ["8fcfa1", "\u7764\u7767\u776A\u776C\u7770\u7772\u7773\u7774\u777A\u777D\u7780\u7784\u778C\u778D\u7794\u7795\u7796\u779A\u779F\u77A2\u77A7\u77AA\u77AE\u77AF\u77B1\u77B5\u77BE\u77C3\u77C9\u77D1\u77D2\u77D5\u77D9\u77DE\u77DF\u77E0\u77E4\u77E6\u77EA\u77EC\u77F0\u77F1\u77F4\u77F8\u77FB\u7805\u7806\u7809\u780D\u780E\u7811\u781D\u7821\u7822\u7823\u782D\u782E\u7830\u7835\u7837\u7843\u7844\u7847\u7848\u784C\u784E\u7852\u785C\u785E\u7860\u7861\u7863\u7864\u7868\u786A\u786E\u787A\u787E\u788A\u788F\u7894\u7898\u78A1\u789D\u789E\u789F\u78A4\u78A8\u78AC\u78AD\u78B0\u78B1\u78B2\u78B3"],
      ["8fd0a1", "\u78BB\u78BD\u78BF\u78C7\u78C8\u78C9\u78CC\u78CE\u78D2\u78D3\u78D5\u78D6\u78E4\u78DB\u78DF\u78E0\u78E1\u78E6\u78EA\u78F2\u78F3\u7900\u78F6\u78F7\u78FA\u78FB\u78FF\u7906\u790C\u7910\u791A\u791C\u791E\u791F\u7920\u7925\u7927\u7929\u792D\u7931\u7934\u7935\u793B\u793D\u793F\u7944\u7945\u7946\u794A\u794B\u794F\u7951\u7954\u7958\u795B\u795C\u7967\u7969\u796B\u7972\u7979\u797B\u797C\u797E\u798B\u798C\u7991\u7993\u7994\u7995\u7996\u7998\u799B\u799C\u79A1\u79A8\u79A9\u79AB\u79AF\u79B1\u79B4\u79B8\u79BB\u79C2\u79C4\u79C7\u79C8\u79CA\u79CF\u79D4\u79D6\u79DA\u79DD\u79DE"],
      ["8fd1a1", "\u79E0\u79E2\u79E5\u79EA\u79EB\u79ED\u79F1\u79F8\u79FC\u7A02\u7A03\u7A07\u7A09\u7A0A\u7A0C\u7A11\u7A15\u7A1B\u7A1E\u7A21\u7A27\u7A2B\u7A2D\u7A2F\u7A30\u7A34\u7A35\u7A38\u7A39\u7A3A\u7A44\u7A45\u7A47\u7A48\u7A4C\u7A55\u7A56\u7A59\u7A5C\u7A5D\u7A5F\u7A60\u7A65\u7A67\u7A6A\u7A6D\u7A75\u7A78\u7A7E\u7A80\u7A82\u7A85\u7A86\u7A8A\u7A8B\u7A90\u7A91\u7A94\u7A9E\u7AA0\u7AA3\u7AAC\u7AB3\u7AB5\u7AB9\u7ABB\u7ABC\u7AC6\u7AC9\u7ACC\u7ACE\u7AD1\u7ADB\u7AE8\u7AE9\u7AEB\u7AEC\u7AF1\u7AF4\u7AFB\u7AFD\u7AFE\u7B07\u7B14\u7B1F\u7B23\u7B27\u7B29\u7B2A\u7B2B\u7B2D\u7B2E\u7B2F\u7B30"],
      ["8fd2a1", "\u7B31\u7B34\u7B3D\u7B3F\u7B40\u7B41\u7B47\u7B4E\u7B55\u7B60\u7B64\u7B66\u7B69\u7B6A\u7B6D\u7B6F\u7B72\u7B73\u7B77\u7B84\u7B89\u7B8E\u7B90\u7B91\u7B96\u7B9B\u7B9E\u7BA0\u7BA5\u7BAC\u7BAF\u7BB0\u7BB2\u7BB5\u7BB6\u7BBA\u7BBB\u7BBC\u7BBD\u7BC2\u7BC5\u7BC8\u7BCA\u7BD4\u7BD6\u7BD7\u7BD9\u7BDA\u7BDB\u7BE8\u7BEA\u7BF2\u7BF4\u7BF5\u7BF8\u7BF9\u7BFA\u7BFC\u7BFE\u7C01\u7C02\u7C03\u7C04\u7C06\u7C09\u7C0B\u7C0C\u7C0E\u7C0F\u7C19\u7C1B\u7C20\u7C25\u7C26\u7C28\u7C2C\u7C31\u7C33\u7C34\u7C36\u7C39\u7C3A\u7C46\u7C4A\u7C55\u7C51\u7C52\u7C53\u7C59", 5],
      ["8fd3a1", "\u7C61\u7C63\u7C67\u7C69\u7C6D\u7C6E\u7C70\u7C72\u7C79\u7C7C\u7C7D\u7C86\u7C87\u7C8F\u7C94\u7C9E\u7CA0\u7CA6\u7CB0\u7CB6\u7CB7\u7CBA\u7CBB\u7CBC\u7CBF\u7CC4\u7CC7\u7CC8\u7CC9\u7CCD\u7CCF\u7CD3\u7CD4\u7CD5\u7CD7\u7CD9\u7CDA\u7CDD\u7CE6\u7CE9\u7CEB\u7CF5\u7D03\u7D07\u7D08\u7D09\u7D0F\u7D11\u7D12\u7D13\u7D16\u7D1D\u7D1E\u7D23\u7D26\u7D2A\u7D2D\u7D31\u7D3C\u7D3D\u7D3E\u7D40\u7D41\u7D47\u7D48\u7D4D\u7D51\u7D53\u7D57\u7D59\u7D5A\u7D5C\u7D5D\u7D65\u7D67\u7D6A\u7D70\u7D78\u7D7A\u7D7B\u7D7F\u7D81\u7D82\u7D83\u7D85\u7D86\u7D88\u7D8B\u7D8C\u7D8D\u7D91\u7D96\u7D97\u7D9D"],
      ["8fd4a1", "\u7D9E\u7DA6\u7DA7\u7DAA\u7DB3\u7DB6\u7DB7\u7DB9\u7DC2", 4, "\u7DCC\u7DCD\u7DCE\u7DD7\u7DD9\u7E00\u7DE2\u7DE5\u7DE6\u7DEA\u7DEB\u7DED\u7DF1\u7DF5\u7DF6\u7DF9\u7DFA\u7E08\u7E10\u7E11\u7E15\u7E17\u7E1C\u7E1D\u7E20\u7E27\u7E28\u7E2C\u7E2D\u7E2F\u7E33\u7E36\u7E3F\u7E44\u7E45\u7E47\u7E4E\u7E50\u7E52\u7E58\u7E5F\u7E61\u7E62\u7E65\u7E6B\u7E6E\u7E6F\u7E73\u7E78\u7E7E\u7E81\u7E86\u7E87\u7E8A\u7E8D\u7E91\u7E95\u7E98\u7E9A\u7E9D\u7E9E\u7F3C\u7F3B\u7F3D\u7F3E\u7F3F\u7F43\u7F44\u7F47\u7F4F\u7F52\u7F53\u7F5B\u7F5C\u7F5D\u7F61\u7F63\u7F64\u7F65\u7F66\u7F6D"],
      ["8fd5a1", "\u7F71\u7F7D\u7F7E\u7F7F\u7F80\u7F8B\u7F8D\u7F8F\u7F90\u7F91\u7F96\u7F97\u7F9C\u7FA1\u7FA2\u7FA6\u7FAA\u7FAD\u7FB4\u7FBC\u7FBF\u7FC0\u7FC3\u7FC8\u7FCE\u7FCF\u7FDB\u7FDF\u7FE3\u7FE5\u7FE8\u7FEC\u7FEE\u7FEF\u7FF2\u7FFA\u7FFD\u7FFE\u7FFF\u8007\u8008\u800A\u800D\u800E\u800F\u8011\u8013\u8014\u8016\u801D\u801E\u801F\u8020\u8024\u8026\u802C\u802E\u8030\u8034\u8035\u8037\u8039\u803A\u803C\u803E\u8040\u8044\u8060\u8064\u8066\u806D\u8071\u8075\u8081\u8088\u808E\u809C\u809E\u80A6\u80A7\u80AB\u80B8\u80B9\u80C8\u80CD\u80CF\u80D2\u80D4\u80D5\u80D7\u80D8\u80E0\u80ED\u80EE"],
      ["8fd6a1", "\u80F0\u80F2\u80F3\u80F6\u80F9\u80FA\u80FE\u8103\u810B\u8116\u8117\u8118\u811C\u811E\u8120\u8124\u8127\u812C\u8130\u8135\u813A\u813C\u8145\u8147\u814A\u814C\u8152\u8157\u8160\u8161\u8167\u8168\u8169\u816D\u816F\u8177\u8181\u8190\u8184\u8185\u8186\u818B\u818E\u8196\u8198\u819B\u819E\u81A2\u81AE\u81B2\u81B4\u81BB\u81CB\u81C3\u81C5\u81CA\u81CE\u81CF\u81D5\u81D7\u81DB\u81DD\u81DE\u81E1\u81E4\u81EB\u81EC\u81F0\u81F1\u81F2\u81F5\u81F6\u81F8\u81F9\u81FD\u81FF\u8200\u8203\u820F\u8213\u8214\u8219\u821A\u821D\u8221\u8222\u8228\u8232\u8234\u823A\u8243\u8244\u8245\u8246"],
      ["8fd7a1", "\u824B\u824E\u824F\u8251\u8256\u825C\u8260\u8263\u8267\u826D\u8274\u827B\u827D\u827F\u8280\u8281\u8283\u8284\u8287\u8289\u828A\u828E\u8291\u8294\u8296\u8298\u829A\u829B\u82A0\u82A1\u82A3\u82A4\u82A7\u82A8\u82A9\u82AA\u82AE\u82B0\u82B2\u82B4\u82B7\u82BA\u82BC\u82BE\u82BF\u82C6\u82D0\u82D5\u82DA\u82E0\u82E2\u82E4\u82E8\u82EA\u82ED\u82EF\u82F6\u82F7\u82FD\u82FE\u8300\u8301\u8307\u8308\u830A\u830B\u8354\u831B\u831D\u831E\u831F\u8321\u8322\u832C\u832D\u832E\u8330\u8333\u8337\u833A\u833C\u833D\u8342\u8343\u8344\u8347\u834D\u834E\u8351\u8355\u8356\u8357\u8370\u8378"],
      ["8fd8a1", "\u837D\u837F\u8380\u8382\u8384\u8386\u838D\u8392\u8394\u8395\u8398\u8399\u839B\u839C\u839D\u83A6\u83A7\u83A9\u83AC\u83BE\u83BF\u83C0\u83C7\u83C9\u83CF\u83D0\u83D1\u83D4\u83DD\u8353\u83E8\u83EA\u83F6\u83F8\u83F9\u83FC\u8401\u8406\u840A\u840F\u8411\u8415\u8419\u83AD\u842F\u8439\u8445\u8447\u8448\u844A\u844D\u844F\u8451\u8452\u8456\u8458\u8459\u845A\u845C\u8460\u8464\u8465\u8467\u846A\u8470\u8473\u8474\u8476\u8478\u847C\u847D\u8481\u8485\u8492\u8493\u8495\u849E\u84A6\u84A8\u84A9\u84AA\u84AF\u84B1\u84B4\u84BA\u84BD\u84BE\u84C0\u84C2\u84C7\u84C8\u84CC\u84CF\u84D3"],
      ["8fd9a1", "\u84DC\u84E7\u84EA\u84EF\u84F0\u84F1\u84F2\u84F7\u8532\u84FA\u84FB\u84FD\u8502\u8503\u8507\u850C\u850E\u8510\u851C\u851E\u8522\u8523\u8524\u8525\u8527\u852A\u852B\u852F\u8533\u8534\u8536\u853F\u8546\u854F", 4, "\u8556\u8559\u855C", 6, "\u8564\u856B\u856F\u8579\u857A\u857B\u857D\u857F\u8581\u8585\u8586\u8589\u858B\u858C\u858F\u8593\u8598\u859D\u859F\u85A0\u85A2\u85A5\u85A7\u85B4\u85B6\u85B7\u85B8\u85BC\u85BD\u85BE\u85BF\u85C2\u85C7\u85CA\u85CB\u85CE\u85AD\u85D8\u85DA\u85DF\u85E0\u85E6\u85E8\u85ED\u85F3\u85F6\u85FC"],
      ["8fdaa1", "\u85FF\u8600\u8604\u8605\u860D\u860E\u8610\u8611\u8612\u8618\u8619\u861B\u861E\u8621\u8627\u8629\u8636\u8638\u863A\u863C\u863D\u8640\u8642\u8646\u8652\u8653\u8656\u8657\u8658\u8659\u865D\u8660", 4, "\u8669\u866C\u866F\u8675\u8676\u8677\u867A\u868D\u8691\u8696\u8698\u869A\u869C\u86A1\u86A6\u86A7\u86A8\u86AD\u86B1\u86B3\u86B4\u86B5\u86B7\u86B8\u86B9\u86BF\u86C0\u86C1\u86C3\u86C5\u86D1\u86D2\u86D5\u86D7\u86DA\u86DC\u86E0\u86E3\u86E5\u86E7\u8688\u86FA\u86FC\u86FD\u8704\u8705\u8707\u870B\u870E\u870F\u8710\u8713\u8714\u8719\u871E\u871F\u8721\u8723"],
      ["8fdba1", "\u8728\u872E\u872F\u8731\u8732\u8739\u873A\u873C\u873D\u873E\u8740\u8743\u8745\u874D\u8758\u875D\u8761\u8764\u8765\u876F\u8771\u8772\u877B\u8783", 6, "\u878B\u878C\u8790\u8793\u8795\u8797\u8798\u8799\u879E\u87A0\u87A3\u87A7\u87AC\u87AD\u87AE\u87B1\u87B5\u87BE\u87BF\u87C1\u87C8\u87C9\u87CA\u87CE\u87D5\u87D6\u87D9\u87DA\u87DC\u87DF\u87E2\u87E3\u87E4\u87EA\u87EB\u87ED\u87F1\u87F3\u87F8\u87FA\u87FF\u8801\u8803\u8806\u8809\u880A\u880B\u8810\u8819\u8812\u8813\u8814\u8818\u881A\u881B\u881C\u881E\u881F\u8828\u882D\u882E\u8830\u8832\u8835"],
      ["8fdca1", "\u883A\u883C\u8841\u8843\u8845\u8848\u8849\u884A\u884B\u884E\u8851\u8855\u8856\u8858\u885A\u885C\u885F\u8860\u8864\u8869\u8871\u8879\u887B\u8880\u8898\u889A\u889B\u889C\u889F\u88A0\u88A8\u88AA\u88BA\u88BD\u88BE\u88C0\u88CA", 4, "\u88D1\u88D2\u88D3\u88DB\u88DE\u88E7\u88EF\u88F0\u88F1\u88F5\u88F7\u8901\u8906\u890D\u890E\u890F\u8915\u8916\u8918\u8919\u891A\u891C\u8920\u8926\u8927\u8928\u8930\u8931\u8932\u8935\u8939\u893A\u893E\u8940\u8942\u8945\u8946\u8949\u894F\u8952\u8957\u895A\u895B\u895C\u8961\u8962\u8963\u896B\u896E\u8970\u8973\u8975\u897A"],
      ["8fdda1", "\u897B\u897C\u897D\u8989\u898D\u8990\u8994\u8995\u899B\u899C\u899F\u89A0\u89A5\u89B0\u89B4\u89B5\u89B6\u89B7\u89BC\u89D4", 4, "\u89E5\u89E9\u89EB\u89ED\u89F1\u89F3\u89F6\u89F9\u89FD\u89FF\u8A04\u8A05\u8A07\u8A0F\u8A11\u8A12\u8A14\u8A15\u8A1E\u8A20\u8A22\u8A24\u8A26\u8A2B\u8A2C\u8A2F\u8A35\u8A37\u8A3D\u8A3E\u8A40\u8A43\u8A45\u8A47\u8A49\u8A4D\u8A4E\u8A53\u8A56\u8A57\u8A58\u8A5C\u8A5D\u8A61\u8A65\u8A67\u8A75\u8A76\u8A77\u8A79\u8A7A\u8A7B\u8A7E\u8A7F\u8A80\u8A83\u8A86\u8A8B\u8A8F\u8A90\u8A92\u8A96\u8A97\u8A99\u8A9F\u8AA7\u8AA9\u8AAE\u8AAF\u8AB3"],
      ["8fdea1", "\u8AB6\u8AB7\u8ABB\u8ABE\u8AC3\u8AC6\u8AC8\u8AC9\u8ACA\u8AD1\u8AD3\u8AD4\u8AD5\u8AD7\u8ADD\u8ADF\u8AEC\u8AF0\u8AF4\u8AF5\u8AF6\u8AFC\u8AFF\u8B05\u8B06\u8B0B\u8B11\u8B1C\u8B1E\u8B1F\u8B0A\u8B2D\u8B30\u8B37\u8B3C\u8B42", 4, "\u8B48\u8B52\u8B53\u8B54\u8B59\u8B4D\u8B5E\u8B63\u8B6D\u8B76\u8B78\u8B79\u8B7C\u8B7E\u8B81\u8B84\u8B85\u8B8B\u8B8D\u8B8F\u8B94\u8B95\u8B9C\u8B9E\u8B9F\u8C38\u8C39\u8C3D\u8C3E\u8C45\u8C47\u8C49\u8C4B\u8C4F\u8C51\u8C53\u8C54\u8C57\u8C58\u8C5B\u8C5D\u8C59\u8C63\u8C64\u8C66\u8C68\u8C69\u8C6D\u8C73\u8C75\u8C76\u8C7B\u8C7E\u8C86"],
      ["8fdfa1", "\u8C87\u8C8B\u8C90\u8C92\u8C93\u8C99\u8C9B\u8C9C\u8CA4\u8CB9\u8CBA\u8CC5\u8CC6\u8CC9\u8CCB\u8CCF\u8CD6\u8CD5\u8CD9\u8CDD\u8CE1\u8CE8\u8CEC\u8CEF\u8CF0\u8CF2\u8CF5\u8CF7\u8CF8\u8CFE\u8CFF\u8D01\u8D03\u8D09\u8D12\u8D17\u8D1B\u8D65\u8D69\u8D6C\u8D6E\u8D7F\u8D82\u8D84\u8D88\u8D8D\u8D90\u8D91\u8D95\u8D9E\u8D9F\u8DA0\u8DA6\u8DAB\u8DAC\u8DAF\u8DB2\u8DB5\u8DB7\u8DB9\u8DBB\u8DC0\u8DC5\u8DC6\u8DC7\u8DC8\u8DCA\u8DCE\u8DD1\u8DD4\u8DD5\u8DD7\u8DD9\u8DE4\u8DE5\u8DE7\u8DEC\u8DF0\u8DBC\u8DF1\u8DF2\u8DF4\u8DFD\u8E01\u8E04\u8E05\u8E06\u8E0B\u8E11\u8E14\u8E16\u8E20\u8E21\u8E22"],
      ["8fe0a1", "\u8E23\u8E26\u8E27\u8E31\u8E33\u8E36\u8E37\u8E38\u8E39\u8E3D\u8E40\u8E41\u8E4B\u8E4D\u8E4E\u8E4F\u8E54\u8E5B\u8E5C\u8E5D\u8E5E\u8E61\u8E62\u8E69\u8E6C\u8E6D\u8E6F\u8E70\u8E71\u8E79\u8E7A\u8E7B\u8E82\u8E83\u8E89\u8E90\u8E92\u8E95\u8E9A\u8E9B\u8E9D\u8E9E\u8EA2\u8EA7\u8EA9\u8EAD\u8EAE\u8EB3\u8EB5\u8EBA\u8EBB\u8EC0\u8EC1\u8EC3\u8EC4\u8EC7\u8ECF\u8ED1\u8ED4\u8EDC\u8EE8\u8EEE\u8EF0\u8EF1\u8EF7\u8EF9\u8EFA\u8EED\u8F00\u8F02\u8F07\u8F08\u8F0F\u8F10\u8F16\u8F17\u8F18\u8F1E\u8F20\u8F21\u8F23\u8F25\u8F27\u8F28\u8F2C\u8F2D\u8F2E\u8F34\u8F35\u8F36\u8F37\u8F3A\u8F40\u8F41"],
      ["8fe1a1", "\u8F43\u8F47\u8F4F\u8F51", 4, "\u8F58\u8F5D\u8F5E\u8F65\u8F9D\u8FA0\u8FA1\u8FA4\u8FA5\u8FA6\u8FB5\u8FB6\u8FB8\u8FBE\u8FC0\u8FC1\u8FC6\u8FCA\u8FCB\u8FCD\u8FD0\u8FD2\u8FD3\u8FD5\u8FE0\u8FE3\u8FE4\u8FE8\u8FEE\u8FF1\u8FF5\u8FF6\u8FFB\u8FFE\u9002\u9004\u9008\u900C\u9018\u901B\u9028\u9029\u902F\u902A\u902C\u902D\u9033\u9034\u9037\u903F\u9043\u9044\u904C\u905B\u905D\u9062\u9066\u9067\u906C\u9070\u9074\u9079\u9085\u9088\u908B\u908C\u908E\u9090\u9095\u9097\u9098\u9099\u909B\u90A0\u90A1\u90A2\u90A5\u90B0\u90B2\u90B3\u90B4\u90B6\u90BD\u90CC\u90BE\u90C3"],
      ["8fe2a1", "\u90C4\u90C5\u90C7\u90C8\u90D5\u90D7\u90D8\u90D9\u90DC\u90DD\u90DF\u90E5\u90D2\u90F6\u90EB\u90EF\u90F0\u90F4\u90FE\u90FF\u9100\u9104\u9105\u9106\u9108\u910D\u9110\u9114\u9116\u9117\u9118\u911A\u911C\u911E\u9120\u9125\u9122\u9123\u9127\u9129\u912E\u912F\u9131\u9134\u9136\u9137\u9139\u913A\u913C\u913D\u9143\u9147\u9148\u914F\u9153\u9157\u9159\u915A\u915B\u9161\u9164\u9167\u916D\u9174\u9179\u917A\u917B\u9181\u9183\u9185\u9186\u918A\u918E\u9191\u9193\u9194\u9195\u9198\u919E\u91A1\u91A6\u91A8\u91AC\u91AD\u91AE\u91B0\u91B1\u91B2\u91B3\u91B6\u91BB\u91BC\u91BD\u91BF"],
      ["8fe3a1", "\u91C2\u91C3\u91C5\u91D3\u91D4\u91D7\u91D9\u91DA\u91DE\u91E4\u91E5\u91E9\u91EA\u91EC", 5, "\u91F7\u91F9\u91FB\u91FD\u9200\u9201\u9204\u9205\u9206\u9207\u9209\u920A\u920C\u9210\u9212\u9213\u9216\u9218\u921C\u921D\u9223\u9224\u9225\u9226\u9228\u922E\u922F\u9230\u9233\u9235\u9236\u9238\u9239\u923A\u923C\u923E\u9240\u9242\u9243\u9246\u9247\u924A\u924D\u924E\u924F\u9251\u9258\u9259\u925C\u925D\u9260\u9261\u9265\u9267\u9268\u9269\u926E\u926F\u9270\u9275", 4, "\u927B\u927C\u927D\u927F\u9288\u9289\u928A\u928D\u928E\u9292\u9297"],
      ["8fe4a1", "\u9299\u929F\u92A0\u92A4\u92A5\u92A7\u92A8\u92AB\u92AF\u92B2\u92B6\u92B8\u92BA\u92BB\u92BC\u92BD\u92BF", 4, "\u92C5\u92C6\u92C7\u92C8\u92CB\u92CC\u92CD\u92CE\u92D0\u92D3\u92D5\u92D7\u92D8\u92D9\u92DC\u92DD\u92DF\u92E0\u92E1\u92E3\u92E5\u92E7\u92E8\u92EC\u92EE\u92F0\u92F9\u92FB\u92FF\u9300\u9302\u9308\u930D\u9311\u9314\u9315\u931C\u931D\u931E\u931F\u9321\u9324\u9325\u9327\u9329\u932A\u9333\u9334\u9336\u9337\u9347\u9348\u9349\u9350\u9351\u9352\u9355\u9357\u9358\u935A\u935E\u9364\u9365\u9367\u9369\u936A\u936D\u936F\u9370\u9371\u9373\u9374\u9376"],
      ["8fe5a1", "\u937A\u937D\u937F\u9380\u9381\u9382\u9388\u938A\u938B\u938D\u938F\u9392\u9395\u9398\u939B\u939E\u93A1\u93A3\u93A4\u93A6\u93A8\u93AB\u93B4\u93B5\u93B6\u93BA\u93A9\u93C1\u93C4\u93C5\u93C6\u93C7\u93C9", 4, "\u93D3\u93D9\u93DC\u93DE\u93DF\u93E2\u93E6\u93E7\u93F9\u93F7\u93F8\u93FA\u93FB\u93FD\u9401\u9402\u9404\u9408\u9409\u940D\u940E\u940F\u9415\u9416\u9417\u941F\u942E\u942F\u9431\u9432\u9433\u9434\u943B\u943F\u943D\u9443\u9445\u9448\u944A\u944C\u9455\u9459\u945C\u945F\u9461\u9463\u9468\u946B\u946D\u946E\u946F\u9471\u9472\u9484\u9483\u9578\u9579"],
      ["8fe6a1", "\u957E\u9584\u9588\u958C\u958D\u958E\u959D\u959E\u959F\u95A1\u95A6\u95A9\u95AB\u95AC\u95B4\u95B6\u95BA\u95BD\u95BF\u95C6\u95C8\u95C9\u95CB\u95D0\u95D1\u95D2\u95D3\u95D9\u95DA\u95DD\u95DE\u95DF\u95E0\u95E4\u95E6\u961D\u961E\u9622\u9624\u9625\u9626\u962C\u9631\u9633\u9637\u9638\u9639\u963A\u963C\u963D\u9641\u9652\u9654\u9656\u9657\u9658\u9661\u966E\u9674\u967B\u967C\u967E\u967F\u9681\u9682\u9683\u9684\u9689\u9691\u9696\u969A\u969D\u969F\u96A4\u96A5\u96A6\u96A9\u96AE\u96AF\u96B3\u96BA\u96CA\u96D2\u5DB2\u96D8\u96DA\u96DD\u96DE\u96DF\u96E9\u96EF\u96F1\u96FA\u9702"],
      ["8fe7a1", "\u9703\u9705\u9709\u971A\u971B\u971D\u9721\u9722\u9723\u9728\u9731\u9733\u9741\u9743\u974A\u974E\u974F\u9755\u9757\u9758\u975A\u975B\u9763\u9767\u976A\u976E\u9773\u9776\u9777\u9778\u977B\u977D\u977F\u9780\u9789\u9795\u9796\u9797\u9799\u979A\u979E\u979F\u97A2\u97AC\u97AE\u97B1\u97B2\u97B5\u97B6\u97B8\u97B9\u97BA\u97BC\u97BE\u97BF\u97C1\u97C4\u97C5\u97C7\u97C9\u97CA\u97CC\u97CD\u97CE\u97D0\u97D1\u97D4\u97D7\u97D8\u97D9\u97DD\u97DE\u97E0\u97DB\u97E1\u97E4\u97EF\u97F1\u97F4\u97F7\u97F8\u97FA\u9807\u980A\u9819\u980D\u980E\u9814\u9816\u981C\u981E\u9820\u9823\u9826"],
      ["8fe8a1", "\u982B\u982E\u982F\u9830\u9832\u9833\u9835\u9825\u983E\u9844\u9847\u984A\u9851\u9852\u9853\u9856\u9857\u9859\u985A\u9862\u9863\u9865\u9866\u986A\u986C\u98AB\u98AD\u98AE\u98B0\u98B4\u98B7\u98B8\u98BA\u98BB\u98BF\u98C2\u98C5\u98C8\u98CC\u98E1\u98E3\u98E5\u98E6\u98E7\u98EA\u98F3\u98F6\u9902\u9907\u9908\u9911\u9915\u9916\u9917\u991A\u991B\u991C\u991F\u9922\u9926\u9927\u992B\u9931", 4, "\u9939\u993A\u993B\u993C\u9940\u9941\u9946\u9947\u9948\u994D\u994E\u9954\u9958\u9959\u995B\u995C\u995E\u995F\u9960\u999B\u999D\u999F\u99A6\u99B0\u99B1\u99B2\u99B5"],
      ["8fe9a1", "\u99B9\u99BA\u99BD\u99BF\u99C3\u99C9\u99D3\u99D4\u99D9\u99DA\u99DC\u99DE\u99E7\u99EA\u99EB\u99EC\u99F0\u99F4\u99F5\u99F9\u99FD\u99FE\u9A02\u9A03\u9A04\u9A0B\u9A0C\u9A10\u9A11\u9A16\u9A1E\u9A20\u9A22\u9A23\u9A24\u9A27\u9A2D\u9A2E\u9A33\u9A35\u9A36\u9A38\u9A47\u9A41\u9A44\u9A4A\u9A4B\u9A4C\u9A4E\u9A51\u9A54\u9A56\u9A5D\u9AAA\u9AAC\u9AAE\u9AAF\u9AB2\u9AB4\u9AB5\u9AB6\u9AB9\u9ABB\u9ABE\u9ABF\u9AC1\u9AC3\u9AC6\u9AC8\u9ACE\u9AD0\u9AD2\u9AD5\u9AD6\u9AD7\u9ADB\u9ADC\u9AE0\u9AE4\u9AE5\u9AE7\u9AE9\u9AEC\u9AF2\u9AF3\u9AF5\u9AF9\u9AFA\u9AFD\u9AFF", 4],
      ["8feaa1", "\u9B04\u9B05\u9B08\u9B09\u9B0B\u9B0C\u9B0D\u9B0E\u9B10\u9B12\u9B16\u9B19\u9B1B\u9B1C\u9B20\u9B26\u9B2B\u9B2D\u9B33\u9B34\u9B35\u9B37\u9B39\u9B3A\u9B3D\u9B48\u9B4B\u9B4C\u9B55\u9B56\u9B57\u9B5B\u9B5E\u9B61\u9B63\u9B65\u9B66\u9B68\u9B6A", 4, "\u9B73\u9B75\u9B77\u9B78\u9B79\u9B7F\u9B80\u9B84\u9B85\u9B86\u9B87\u9B89\u9B8A\u9B8B\u9B8D\u9B8F\u9B90\u9B94\u9B9A\u9B9D\u9B9E\u9BA6\u9BA7\u9BA9\u9BAC\u9BB0\u9BB1\u9BB2\u9BB7\u9BB8\u9BBB\u9BBC\u9BBE\u9BBF\u9BC1\u9BC7\u9BC8\u9BCE\u9BD0\u9BD7\u9BD8\u9BDD\u9BDF\u9BE5\u9BE7\u9BEA\u9BEB\u9BEF\u9BF3\u9BF7\u9BF8"],
      ["8feba1", "\u9BF9\u9BFA\u9BFD\u9BFF\u9C00\u9C02\u9C0B\u9C0F\u9C11\u9C16\u9C18\u9C19\u9C1A\u9C1C\u9C1E\u9C22\u9C23\u9C26", 4, "\u9C31\u9C35\u9C36\u9C37\u9C3D\u9C41\u9C43\u9C44\u9C45\u9C49\u9C4A\u9C4E\u9C4F\u9C50\u9C53\u9C54\u9C56\u9C58\u9C5B\u9C5D\u9C5E\u9C5F\u9C63\u9C69\u9C6A\u9C5C\u9C6B\u9C68\u9C6E\u9C70\u9C72\u9C75\u9C77\u9C7B\u9CE6\u9CF2\u9CF7\u9CF9\u9D0B\u9D02\u9D11\u9D17\u9D18\u9D1C\u9D1D\u9D1E\u9D2F\u9D30\u9D32\u9D33\u9D34\u9D3A\u9D3C\u9D45\u9D3D\u9D42\u9D43\u9D47\u9D4A\u9D53\u9D54\u9D5F\u9D63\u9D62\u9D65\u9D69\u9D6A\u9D6B\u9D70\u9D76\u9D77\u9D7B"],
      ["8feca1", "\u9D7C\u9D7E\u9D83\u9D84\u9D86\u9D8A\u9D8D\u9D8E\u9D92\u9D93\u9D95\u9D96\u9D97\u9D98\u9DA1\u9DAA\u9DAC\u9DAE\u9DB1\u9DB5\u9DB9\u9DBC\u9DBF\u9DC3\u9DC7\u9DC9\u9DCA\u9DD4\u9DD5\u9DD6\u9DD7\u9DDA\u9DDE\u9DDF\u9DE0\u9DE5\u9DE7\u9DE9\u9DEB\u9DEE\u9DF0\u9DF3\u9DF4\u9DFE\u9E0A\u9E02\u9E07\u9E0E\u9E10\u9E11\u9E12\u9E15\u9E16\u9E19\u9E1C\u9E1D\u9E7A\u9E7B\u9E7C\u9E80\u9E82\u9E83\u9E84\u9E85\u9E87\u9E8E\u9E8F\u9E96\u9E98\u9E9B\u9E9E\u9EA4\u9EA8\u9EAC\u9EAE\u9EAF\u9EB0\u9EB3\u9EB4\u9EB5\u9EC6\u9EC8\u9ECB\u9ED5\u9EDF\u9EE4\u9EE7\u9EEC\u9EED\u9EEE\u9EF0\u9EF1\u9EF2\u9EF5"],
      ["8feda1", "\u9EF8\u9EFF\u9F02\u9F03\u9F09\u9F0F\u9F10\u9F11\u9F12\u9F14\u9F16\u9F17\u9F19\u9F1A\u9F1B\u9F1F\u9F22\u9F26\u9F2A\u9F2B\u9F2F\u9F31\u9F32\u9F34\u9F37\u9F39\u9F3A\u9F3C\u9F3D\u9F3F\u9F41\u9F43", 4, "\u9F53\u9F55\u9F56\u9F57\u9F58\u9F5A\u9F5D\u9F5E\u9F68\u9F69\u9F6D", 4, "\u9F73\u9F75\u9F7A\u9F7D\u9F8F\u9F90\u9F91\u9F92\u9F94\u9F96\u9F97\u9F9E\u9FA1\u9FA2\u9FA3\u9FA5"]
    ];
  }
});

// ../../../node_modules/encoding/node_modules/iconv-lite/encodings/tables/cp936.json
var require_cp936 = __commonJS({
  "../../../node_modules/encoding/node_modules/iconv-lite/encodings/tables/cp936.json"(exports, module2) {
    module2.exports = [
      ["0", "\0", 127, "\u20AC"],
      ["8140", "\u4E02\u4E04\u4E05\u4E06\u4E0F\u4E12\u4E17\u4E1F\u4E20\u4E21\u4E23\u4E26\u4E29\u4E2E\u4E2F\u4E31\u4E33\u4E35\u4E37\u4E3C\u4E40\u4E41\u4E42\u4E44\u4E46\u4E4A\u4E51\u4E55\u4E57\u4E5A\u4E5B\u4E62\u4E63\u4E64\u4E65\u4E67\u4E68\u4E6A", 5, "\u4E72\u4E74", 9, "\u4E7F", 6, "\u4E87\u4E8A"],
      ["8180", "\u4E90\u4E96\u4E97\u4E99\u4E9C\u4E9D\u4E9E\u4EA3\u4EAA\u4EAF\u4EB0\u4EB1\u4EB4\u4EB6\u4EB7\u4EB8\u4EB9\u4EBC\u4EBD\u4EBE\u4EC8\u4ECC\u4ECF\u4ED0\u4ED2\u4EDA\u4EDB\u4EDC\u4EE0\u4EE2\u4EE6\u4EE7\u4EE9\u4EED\u4EEE\u4EEF\u4EF1\u4EF4\u4EF8\u4EF9\u4EFA\u4EFC\u4EFE\u4F00\u4F02", 6, "\u4F0B\u4F0C\u4F12", 4, "\u4F1C\u4F1D\u4F21\u4F23\u4F28\u4F29\u4F2C\u4F2D\u4F2E\u4F31\u4F33\u4F35\u4F37\u4F39\u4F3B\u4F3E", 4, "\u4F44\u4F45\u4F47", 5, "\u4F52\u4F54\u4F56\u4F61\u4F62\u4F66\u4F68\u4F6A\u4F6B\u4F6D\u4F6E\u4F71\u4F72\u4F75\u4F77\u4F78\u4F79\u4F7A\u4F7D\u4F80\u4F81\u4F82\u4F85\u4F86\u4F87\u4F8A\u4F8C\u4F8E\u4F90\u4F92\u4F93\u4F95\u4F96\u4F98\u4F99\u4F9A\u4F9C\u4F9E\u4F9F\u4FA1\u4FA2"],
      ["8240", "\u4FA4\u4FAB\u4FAD\u4FB0", 4, "\u4FB6", 8, "\u4FC0\u4FC1\u4FC2\u4FC6\u4FC7\u4FC8\u4FC9\u4FCB\u4FCC\u4FCD\u4FD2", 4, "\u4FD9\u4FDB\u4FE0\u4FE2\u4FE4\u4FE5\u4FE7\u4FEB\u4FEC\u4FF0\u4FF2\u4FF4\u4FF5\u4FF6\u4FF7\u4FF9\u4FFB\u4FFC\u4FFD\u4FFF", 11],
      ["8280", "\u500B\u500E\u5010\u5011\u5013\u5015\u5016\u5017\u501B\u501D\u501E\u5020\u5022\u5023\u5024\u5027\u502B\u502F", 10, "\u503B\u503D\u503F\u5040\u5041\u5042\u5044\u5045\u5046\u5049\u504A\u504B\u504D\u5050", 4, "\u5056\u5057\u5058\u5059\u505B\u505D", 7, "\u5066", 5, "\u506D", 8, "\u5078\u5079\u507A\u507C\u507D\u5081\u5082\u5083\u5084\u5086\u5087\u5089\u508A\u508B\u508C\u508E", 20, "\u50A4\u50A6\u50AA\u50AB\u50AD", 4, "\u50B3", 6, "\u50BC"],
      ["8340", "\u50BD", 17, "\u50D0", 5, "\u50D7\u50D8\u50D9\u50DB", 10, "\u50E8\u50E9\u50EA\u50EB\u50EF\u50F0\u50F1\u50F2\u50F4\u50F6", 4, "\u50FC", 9, "\u5108"],
      ["8380", "\u5109\u510A\u510C", 5, "\u5113", 13, "\u5122", 28, "\u5142\u5147\u514A\u514C\u514E\u514F\u5150\u5152\u5153\u5157\u5158\u5159\u515B\u515D", 4, "\u5163\u5164\u5166\u5167\u5169\u516A\u516F\u5172\u517A\u517E\u517F\u5183\u5184\u5186\u5187\u518A\u518B\u518E\u518F\u5190\u5191\u5193\u5194\u5198\u519A\u519D\u519E\u519F\u51A1\u51A3\u51A6", 4, "\u51AD\u51AE\u51B4\u51B8\u51B9\u51BA\u51BE\u51BF\u51C1\u51C2\u51C3\u51C5\u51C8\u51CA\u51CD\u51CE\u51D0\u51D2", 5],
      ["8440", "\u51D8\u51D9\u51DA\u51DC\u51DE\u51DF\u51E2\u51E3\u51E5", 5, "\u51EC\u51EE\u51F1\u51F2\u51F4\u51F7\u51FE\u5204\u5205\u5209\u520B\u520C\u520F\u5210\u5213\u5214\u5215\u521C\u521E\u521F\u5221\u5222\u5223\u5225\u5226\u5227\u522A\u522C\u522F\u5231\u5232\u5234\u5235\u523C\u523E\u5244", 5, "\u524B\u524E\u524F\u5252\u5253\u5255\u5257\u5258"],
      ["8480", "\u5259\u525A\u525B\u525D\u525F\u5260\u5262\u5263\u5264\u5266\u5268\u526B\u526C\u526D\u526E\u5270\u5271\u5273", 9, "\u527E\u5280\u5283", 4, "\u5289", 6, "\u5291\u5292\u5294", 6, "\u529C\u52A4\u52A5\u52A6\u52A7\u52AE\u52AF\u52B0\u52B4", 9, "\u52C0\u52C1\u52C2\u52C4\u52C5\u52C6\u52C8\u52CA\u52CC\u52CD\u52CE\u52CF\u52D1\u52D3\u52D4\u52D5\u52D7\u52D9", 5, "\u52E0\u52E1\u52E2\u52E3\u52E5", 10, "\u52F1", 7, "\u52FB\u52FC\u52FD\u5301\u5302\u5303\u5304\u5307\u5309\u530A\u530B\u530C\u530E"],
      ["8540", "\u5311\u5312\u5313\u5314\u5318\u531B\u531C\u531E\u531F\u5322\u5324\u5325\u5327\u5328\u5329\u532B\u532C\u532D\u532F", 9, "\u533C\u533D\u5340\u5342\u5344\u5346\u534B\u534C\u534D\u5350\u5354\u5358\u5359\u535B\u535D\u5365\u5368\u536A\u536C\u536D\u5372\u5376\u5379\u537B\u537C\u537D\u537E\u5380\u5381\u5383\u5387\u5388\u538A\u538E\u538F"],
      ["8580", "\u5390", 4, "\u5396\u5397\u5399\u539B\u539C\u539E\u53A0\u53A1\u53A4\u53A7\u53AA\u53AB\u53AC\u53AD\u53AF", 6, "\u53B7\u53B8\u53B9\u53BA\u53BC\u53BD\u53BE\u53C0\u53C3", 4, "\u53CE\u53CF\u53D0\u53D2\u53D3\u53D5\u53DA\u53DC\u53DD\u53DE\u53E1\u53E2\u53E7\u53F4\u53FA\u53FE\u53FF\u5400\u5402\u5405\u5407\u540B\u5414\u5418\u5419\u541A\u541C\u5422\u5424\u5425\u542A\u5430\u5433\u5436\u5437\u543A\u543D\u543F\u5441\u5442\u5444\u5445\u5447\u5449\u544C\u544D\u544E\u544F\u5451\u545A\u545D", 4, "\u5463\u5465\u5467\u5469", 7, "\u5474\u5479\u547A\u547E\u547F\u5481\u5483\u5485\u5487\u5488\u5489\u548A\u548D\u5491\u5493\u5497\u5498\u549C\u549E\u549F\u54A0\u54A1"],
      ["8640", "\u54A2\u54A5\u54AE\u54B0\u54B2\u54B5\u54B6\u54B7\u54B9\u54BA\u54BC\u54BE\u54C3\u54C5\u54CA\u54CB\u54D6\u54D8\u54DB\u54E0", 4, "\u54EB\u54EC\u54EF\u54F0\u54F1\u54F4", 5, "\u54FB\u54FE\u5500\u5502\u5503\u5504\u5505\u5508\u550A", 4, "\u5512\u5513\u5515", 5, "\u551C\u551D\u551E\u551F\u5521\u5525\u5526"],
      ["8680", "\u5528\u5529\u552B\u552D\u5532\u5534\u5535\u5536\u5538\u5539\u553A\u553B\u553D\u5540\u5542\u5545\u5547\u5548\u554B", 4, "\u5551\u5552\u5553\u5554\u5557", 4, "\u555D\u555E\u555F\u5560\u5562\u5563\u5568\u5569\u556B\u556F", 5, "\u5579\u557A\u557D\u557F\u5585\u5586\u558C\u558D\u558E\u5590\u5592\u5593\u5595\u5596\u5597\u559A\u559B\u559E\u55A0", 6, "\u55A8", 8, "\u55B2\u55B4\u55B6\u55B8\u55BA\u55BC\u55BF", 4, "\u55C6\u55C7\u55C8\u55CA\u55CB\u55CE\u55CF\u55D0\u55D5\u55D7", 4, "\u55DE\u55E0\u55E2\u55E7\u55E9\u55ED\u55EE\u55F0\u55F1\u55F4\u55F6\u55F8", 4, "\u55FF\u5602\u5603\u5604\u5605"],
      ["8740", "\u5606\u5607\u560A\u560B\u560D\u5610", 7, "\u5619\u561A\u561C\u561D\u5620\u5621\u5622\u5625\u5626\u5628\u5629\u562A\u562B\u562E\u562F\u5630\u5633\u5635\u5637\u5638\u563A\u563C\u563D\u563E\u5640", 11, "\u564F", 4, "\u5655\u5656\u565A\u565B\u565D", 4],
      ["8780", "\u5663\u5665\u5666\u5667\u566D\u566E\u566F\u5670\u5672\u5673\u5674\u5675\u5677\u5678\u5679\u567A\u567D", 7, "\u5687", 6, "\u5690\u5691\u5692\u5694", 14, "\u56A4", 10, "\u56B0", 6, "\u56B8\u56B9\u56BA\u56BB\u56BD", 12, "\u56CB", 8, "\u56D5\u56D6\u56D8\u56D9\u56DC\u56E3\u56E5", 5, "\u56EC\u56EE\u56EF\u56F2\u56F3\u56F6\u56F7\u56F8\u56FB\u56FC\u5700\u5701\u5702\u5705\u5707\u570B", 6],
      ["8840", "\u5712", 9, "\u571D\u571E\u5720\u5721\u5722\u5724\u5725\u5726\u5727\u572B\u5731\u5732\u5734", 4, "\u573C\u573D\u573F\u5741\u5743\u5744\u5745\u5746\u5748\u5749\u574B\u5752", 4, "\u5758\u5759\u5762\u5763\u5765\u5767\u576C\u576E\u5770\u5771\u5772\u5774\u5775\u5778\u5779\u577A\u577D\u577E\u577F\u5780"],
      ["8880", "\u5781\u5787\u5788\u5789\u578A\u578D", 4, "\u5794", 6, "\u579C\u579D\u579E\u579F\u57A5\u57A8\u57AA\u57AC\u57AF\u57B0\u57B1\u57B3\u57B5\u57B6\u57B7\u57B9", 8, "\u57C4", 6, "\u57CC\u57CD\u57D0\u57D1\u57D3\u57D6\u57D7\u57DB\u57DC\u57DE\u57E1\u57E2\u57E3\u57E5", 7, "\u57EE\u57F0\u57F1\u57F2\u57F3\u57F5\u57F6\u57F7\u57FB\u57FC\u57FE\u57FF\u5801\u5803\u5804\u5805\u5808\u5809\u580A\u580C\u580E\u580F\u5810\u5812\u5813\u5814\u5816\u5817\u5818\u581A\u581B\u581C\u581D\u581F\u5822\u5823\u5825", 4, "\u582B", 4, "\u5831\u5832\u5833\u5834\u5836", 7],
      ["8940", "\u583E", 5, "\u5845", 6, "\u584E\u584F\u5850\u5852\u5853\u5855\u5856\u5857\u5859", 4, "\u585F", 5, "\u5866", 4, "\u586D", 16, "\u587F\u5882\u5884\u5886\u5887\u5888\u588A\u588B\u588C"],
      ["8980", "\u588D", 4, "\u5894", 4, "\u589B\u589C\u589D\u58A0", 7, "\u58AA", 17, "\u58BD\u58BE\u58BF\u58C0\u58C2\u58C3\u58C4\u58C6", 10, "\u58D2\u58D3\u58D4\u58D6", 13, "\u58E5", 5, "\u58ED\u58EF\u58F1\u58F2\u58F4\u58F5\u58F7\u58F8\u58FA", 7, "\u5903\u5905\u5906\u5908", 4, "\u590E\u5910\u5911\u5912\u5913\u5917\u5918\u591B\u591D\u591E\u5920\u5921\u5922\u5923\u5926\u5928\u592C\u5930\u5932\u5933\u5935\u5936\u593B"],
      ["8a40", "\u593D\u593E\u593F\u5940\u5943\u5945\u5946\u594A\u594C\u594D\u5950\u5952\u5953\u5959\u595B", 4, "\u5961\u5963\u5964\u5966", 12, "\u5975\u5977\u597A\u597B\u597C\u597E\u597F\u5980\u5985\u5989\u598B\u598C\u598E\u598F\u5990\u5991\u5994\u5995\u5998\u599A\u599B\u599C\u599D\u599F\u59A0\u59A1\u59A2\u59A6"],
      ["8a80", "\u59A7\u59AC\u59AD\u59B0\u59B1\u59B3", 5, "\u59BA\u59BC\u59BD\u59BF", 6, "\u59C7\u59C8\u59C9\u59CC\u59CD\u59CE\u59CF\u59D5\u59D6\u59D9\u59DB\u59DE", 4, "\u59E4\u59E6\u59E7\u59E9\u59EA\u59EB\u59ED", 11, "\u59FA\u59FC\u59FD\u59FE\u5A00\u5A02\u5A0A\u5A0B\u5A0D\u5A0E\u5A0F\u5A10\u5A12\u5A14\u5A15\u5A16\u5A17\u5A19\u5A1A\u5A1B\u5A1D\u5A1E\u5A21\u5A22\u5A24\u5A26\u5A27\u5A28\u5A2A", 6, "\u5A33\u5A35\u5A37", 4, "\u5A3D\u5A3E\u5A3F\u5A41", 4, "\u5A47\u5A48\u5A4B", 9, "\u5A56\u5A57\u5A58\u5A59\u5A5B", 5],
      ["8b40", "\u5A61\u5A63\u5A64\u5A65\u5A66\u5A68\u5A69\u5A6B", 8, "\u5A78\u5A79\u5A7B\u5A7C\u5A7D\u5A7E\u5A80", 17, "\u5A93", 6, "\u5A9C", 13, "\u5AAB\u5AAC"],
      ["8b80", "\u5AAD", 4, "\u5AB4\u5AB6\u5AB7\u5AB9", 4, "\u5ABF\u5AC0\u5AC3", 5, "\u5ACA\u5ACB\u5ACD", 4, "\u5AD3\u5AD5\u5AD7\u5AD9\u5ADA\u5ADB\u5ADD\u5ADE\u5ADF\u5AE2\u5AE4\u5AE5\u5AE7\u5AE8\u5AEA\u5AEC", 4, "\u5AF2", 22, "\u5B0A", 11, "\u5B18", 25, "\u5B33\u5B35\u5B36\u5B38", 7, "\u5B41", 6],
      ["8c40", "\u5B48", 7, "\u5B52\u5B56\u5B5E\u5B60\u5B61\u5B67\u5B68\u5B6B\u5B6D\u5B6E\u5B6F\u5B72\u5B74\u5B76\u5B77\u5B78\u5B79\u5B7B\u5B7C\u5B7E\u5B7F\u5B82\u5B86\u5B8A\u5B8D\u5B8E\u5B90\u5B91\u5B92\u5B94\u5B96\u5B9F\u5BA7\u5BA8\u5BA9\u5BAC\u5BAD\u5BAE\u5BAF\u5BB1\u5BB2\u5BB7\u5BBA\u5BBB\u5BBC\u5BC0\u5BC1\u5BC3\u5BC8\u5BC9\u5BCA\u5BCB\u5BCD\u5BCE\u5BCF"],
      ["8c80", "\u5BD1\u5BD4", 8, "\u5BE0\u5BE2\u5BE3\u5BE6\u5BE7\u5BE9", 4, "\u5BEF\u5BF1", 6, "\u5BFD\u5BFE\u5C00\u5C02\u5C03\u5C05\u5C07\u5C08\u5C0B\u5C0C\u5C0D\u5C0E\u5C10\u5C12\u5C13\u5C17\u5C19\u5C1B\u5C1E\u5C1F\u5C20\u5C21\u5C23\u5C26\u5C28\u5C29\u5C2A\u5C2B\u5C2D\u5C2E\u5C2F\u5C30\u5C32\u5C33\u5C35\u5C36\u5C37\u5C43\u5C44\u5C46\u5C47\u5C4C\u5C4D\u5C52\u5C53\u5C54\u5C56\u5C57\u5C58\u5C5A\u5C5B\u5C5C\u5C5D\u5C5F\u5C62\u5C64\u5C67", 6, "\u5C70\u5C72", 6, "\u5C7B\u5C7C\u5C7D\u5C7E\u5C80\u5C83", 4, "\u5C89\u5C8A\u5C8B\u5C8E\u5C8F\u5C92\u5C93\u5C95\u5C9D", 4, "\u5CA4", 4],
      ["8d40", "\u5CAA\u5CAE\u5CAF\u5CB0\u5CB2\u5CB4\u5CB6\u5CB9\u5CBA\u5CBB\u5CBC\u5CBE\u5CC0\u5CC2\u5CC3\u5CC5", 5, "\u5CCC", 5, "\u5CD3", 5, "\u5CDA", 6, "\u5CE2\u5CE3\u5CE7\u5CE9\u5CEB\u5CEC\u5CEE\u5CEF\u5CF1", 9, "\u5CFC", 4],
      ["8d80", "\u5D01\u5D04\u5D05\u5D08", 5, "\u5D0F", 4, "\u5D15\u5D17\u5D18\u5D19\u5D1A\u5D1C\u5D1D\u5D1F", 4, "\u5D25\u5D28\u5D2A\u5D2B\u5D2C\u5D2F", 4, "\u5D35", 7, "\u5D3F", 7, "\u5D48\u5D49\u5D4D", 10, "\u5D59\u5D5A\u5D5C\u5D5E", 10, "\u5D6A\u5D6D\u5D6E\u5D70\u5D71\u5D72\u5D73\u5D75", 12, "\u5D83", 21, "\u5D9A\u5D9B\u5D9C\u5D9E\u5D9F\u5DA0"],
      ["8e40", "\u5DA1", 21, "\u5DB8", 12, "\u5DC6", 6, "\u5DCE", 12, "\u5DDC\u5DDF\u5DE0\u5DE3\u5DE4\u5DEA\u5DEC\u5DED"],
      ["8e80", "\u5DF0\u5DF5\u5DF6\u5DF8", 4, "\u5DFF\u5E00\u5E04\u5E07\u5E09\u5E0A\u5E0B\u5E0D\u5E0E\u5E12\u5E13\u5E17\u5E1E", 7, "\u5E28", 4, "\u5E2F\u5E30\u5E32", 4, "\u5E39\u5E3A\u5E3E\u5E3F\u5E40\u5E41\u5E43\u5E46", 5, "\u5E4D", 6, "\u5E56", 4, "\u5E5C\u5E5D\u5E5F\u5E60\u5E63", 14, "\u5E75\u5E77\u5E79\u5E7E\u5E81\u5E82\u5E83\u5E85\u5E88\u5E89\u5E8C\u5E8D\u5E8E\u5E92\u5E98\u5E9B\u5E9D\u5EA1\u5EA2\u5EA3\u5EA4\u5EA8", 4, "\u5EAE", 4, "\u5EB4\u5EBA\u5EBB\u5EBC\u5EBD\u5EBF", 6],
      ["8f40", "\u5EC6\u5EC7\u5EC8\u5ECB", 5, "\u5ED4\u5ED5\u5ED7\u5ED8\u5ED9\u5EDA\u5EDC", 11, "\u5EE9\u5EEB", 8, "\u5EF5\u5EF8\u5EF9\u5EFB\u5EFC\u5EFD\u5F05\u5F06\u5F07\u5F09\u5F0C\u5F0D\u5F0E\u5F10\u5F12\u5F14\u5F16\u5F19\u5F1A\u5F1C\u5F1D\u5F1E\u5F21\u5F22\u5F23\u5F24"],
      ["8f80", "\u5F28\u5F2B\u5F2C\u5F2E\u5F30\u5F32", 6, "\u5F3B\u5F3D\u5F3E\u5F3F\u5F41", 14, "\u5F51\u5F54\u5F59\u5F5A\u5F5B\u5F5C\u5F5E\u5F5F\u5F60\u5F63\u5F65\u5F67\u5F68\u5F6B\u5F6E\u5F6F\u5F72\u5F74\u5F75\u5F76\u5F78\u5F7A\u5F7D\u5F7E\u5F7F\u5F83\u5F86\u5F8D\u5F8E\u5F8F\u5F91\u5F93\u5F94\u5F96\u5F9A\u5F9B\u5F9D\u5F9E\u5F9F\u5FA0\u5FA2", 5, "\u5FA9\u5FAB\u5FAC\u5FAF", 5, "\u5FB6\u5FB8\u5FB9\u5FBA\u5FBB\u5FBE", 4, "\u5FC7\u5FC8\u5FCA\u5FCB\u5FCE\u5FD3\u5FD4\u5FD5\u5FDA\u5FDB\u5FDC\u5FDE\u5FDF\u5FE2\u5FE3\u5FE5\u5FE6\u5FE8\u5FE9\u5FEC\u5FEF\u5FF0\u5FF2\u5FF3\u5FF4\u5FF6\u5FF7\u5FF9\u5FFA\u5FFC\u6007"],
      ["9040", "\u6008\u6009\u600B\u600C\u6010\u6011\u6013\u6017\u6018\u601A\u601E\u601F\u6022\u6023\u6024\u602C\u602D\u602E\u6030", 4, "\u6036", 4, "\u603D\u603E\u6040\u6044", 6, "\u604C\u604E\u604F\u6051\u6053\u6054\u6056\u6057\u6058\u605B\u605C\u605E\u605F\u6060\u6061\u6065\u6066\u606E\u6071\u6072\u6074\u6075\u6077\u607E\u6080"],
      ["9080", "\u6081\u6082\u6085\u6086\u6087\u6088\u608A\u608B\u608E\u608F\u6090\u6091\u6093\u6095\u6097\u6098\u6099\u609C\u609E\u60A1\u60A2\u60A4\u60A5\u60A7\u60A9\u60AA\u60AE\u60B0\u60B3\u60B5\u60B6\u60B7\u60B9\u60BA\u60BD", 7, "\u60C7\u60C8\u60C9\u60CC", 4, "\u60D2\u60D3\u60D4\u60D6\u60D7\u60D9\u60DB\u60DE\u60E1", 4, "\u60EA\u60F1\u60F2\u60F5\u60F7\u60F8\u60FB", 4, "\u6102\u6103\u6104\u6105\u6107\u610A\u610B\u610C\u6110", 4, "\u6116\u6117\u6118\u6119\u611B\u611C\u611D\u611E\u6121\u6122\u6125\u6128\u6129\u612A\u612C", 18, "\u6140", 6],
      ["9140", "\u6147\u6149\u614B\u614D\u614F\u6150\u6152\u6153\u6154\u6156", 6, "\u615E\u615F\u6160\u6161\u6163\u6164\u6165\u6166\u6169", 6, "\u6171\u6172\u6173\u6174\u6176\u6178", 18, "\u618C\u618D\u618F", 4, "\u6195"],
      ["9180", "\u6196", 6, "\u619E", 8, "\u61AA\u61AB\u61AD", 9, "\u61B8", 5, "\u61BF\u61C0\u61C1\u61C3", 4, "\u61C9\u61CC", 4, "\u61D3\u61D5", 16, "\u61E7", 13, "\u61F6", 8, "\u6200", 5, "\u6207\u6209\u6213\u6214\u6219\u621C\u621D\u621E\u6220\u6223\u6226\u6227\u6228\u6229\u622B\u622D\u622F\u6230\u6231\u6232\u6235\u6236\u6238", 4, "\u6242\u6244\u6245\u6246\u624A"],
      ["9240", "\u624F\u6250\u6255\u6256\u6257\u6259\u625A\u625C", 6, "\u6264\u6265\u6268\u6271\u6272\u6274\u6275\u6277\u6278\u627A\u627B\u627D\u6281\u6282\u6283\u6285\u6286\u6287\u6288\u628B", 5, "\u6294\u6299\u629C\u629D\u629E\u62A3\u62A6\u62A7\u62A9\u62AA\u62AD\u62AE\u62AF\u62B0\u62B2\u62B3\u62B4\u62B6\u62B7\u62B8\u62BA\u62BE\u62C0\u62C1"],
      ["9280", "\u62C3\u62CB\u62CF\u62D1\u62D5\u62DD\u62DE\u62E0\u62E1\u62E4\u62EA\u62EB\u62F0\u62F2\u62F5\u62F8\u62F9\u62FA\u62FB\u6300\u6303\u6304\u6305\u6306\u630A\u630B\u630C\u630D\u630F\u6310\u6312\u6313\u6314\u6315\u6317\u6318\u6319\u631C\u6326\u6327\u6329\u632C\u632D\u632E\u6330\u6331\u6333", 5, "\u633B\u633C\u633E\u633F\u6340\u6341\u6344\u6347\u6348\u634A\u6351\u6352\u6353\u6354\u6356", 7, "\u6360\u6364\u6365\u6366\u6368\u636A\u636B\u636C\u636F\u6370\u6372\u6373\u6374\u6375\u6378\u6379\u637C\u637D\u637E\u637F\u6381\u6383\u6384\u6385\u6386\u638B\u638D\u6391\u6393\u6394\u6395\u6397\u6399", 6, "\u63A1\u63A4\u63A6\u63AB\u63AF\u63B1\u63B2\u63B5\u63B6\u63B9\u63BB\u63BD\u63BF\u63C0"],
      ["9340", "\u63C1\u63C2\u63C3\u63C5\u63C7\u63C8\u63CA\u63CB\u63CC\u63D1\u63D3\u63D4\u63D5\u63D7", 6, "\u63DF\u63E2\u63E4", 4, "\u63EB\u63EC\u63EE\u63EF\u63F0\u63F1\u63F3\u63F5\u63F7\u63F9\u63FA\u63FB\u63FC\u63FE\u6403\u6404\u6406", 4, "\u640D\u640E\u6411\u6412\u6415", 5, "\u641D\u641F\u6422\u6423\u6424"],
      ["9380", "\u6425\u6427\u6428\u6429\u642B\u642E", 5, "\u6435", 4, "\u643B\u643C\u643E\u6440\u6442\u6443\u6449\u644B", 6, "\u6453\u6455\u6456\u6457\u6459", 4, "\u645F", 7, "\u6468\u646A\u646B\u646C\u646E", 9, "\u647B", 6, "\u6483\u6486\u6488", 8, "\u6493\u6494\u6497\u6498\u649A\u649B\u649C\u649D\u649F", 4, "\u64A5\u64A6\u64A7\u64A8\u64AA\u64AB\u64AF\u64B1\u64B2\u64B3\u64B4\u64B6\u64B9\u64BB\u64BD\u64BE\u64BF\u64C1\u64C3\u64C4\u64C6", 6, "\u64CF\u64D1\u64D3\u64D4\u64D5\u64D6\u64D9\u64DA"],
      ["9440", "\u64DB\u64DC\u64DD\u64DF\u64E0\u64E1\u64E3\u64E5\u64E7", 24, "\u6501", 7, "\u650A", 7, "\u6513", 4, "\u6519", 8],
      ["9480", "\u6522\u6523\u6524\u6526", 4, "\u652C\u652D\u6530\u6531\u6532\u6533\u6537\u653A\u653C\u653D\u6540", 4, "\u6546\u6547\u654A\u654B\u654D\u654E\u6550\u6552\u6553\u6554\u6557\u6558\u655A\u655C\u655F\u6560\u6561\u6564\u6565\u6567\u6568\u6569\u656A\u656D\u656E\u656F\u6571\u6573\u6575\u6576\u6578", 14, "\u6588\u6589\u658A\u658D\u658E\u658F\u6592\u6594\u6595\u6596\u6598\u659A\u659D\u659E\u65A0\u65A2\u65A3\u65A6\u65A8\u65AA\u65AC\u65AE\u65B1", 7, "\u65BA\u65BB\u65BE\u65BF\u65C0\u65C2\u65C7\u65C8\u65C9\u65CA\u65CD\u65D0\u65D1\u65D3\u65D4\u65D5\u65D8", 7, "\u65E1\u65E3\u65E4\u65EA\u65EB"],
      ["9540", "\u65F2\u65F3\u65F4\u65F5\u65F8\u65F9\u65FB", 4, "\u6601\u6604\u6605\u6607\u6608\u6609\u660B\u660D\u6610\u6611\u6612\u6616\u6617\u6618\u661A\u661B\u661C\u661E\u6621\u6622\u6623\u6624\u6626\u6629\u662A\u662B\u662C\u662E\u6630\u6632\u6633\u6637", 4, "\u663D\u663F\u6640\u6642\u6644", 6, "\u664D\u664E\u6650\u6651\u6658"],
      ["9580", "\u6659\u665B\u665C\u665D\u665E\u6660\u6662\u6663\u6665\u6667\u6669", 4, "\u6671\u6672\u6673\u6675\u6678\u6679\u667B\u667C\u667D\u667F\u6680\u6681\u6683\u6685\u6686\u6688\u6689\u668A\u668B\u668D\u668E\u668F\u6690\u6692\u6693\u6694\u6695\u6698", 4, "\u669E", 8, "\u66A9", 4, "\u66AF", 4, "\u66B5\u66B6\u66B7\u66B8\u66BA\u66BB\u66BC\u66BD\u66BF", 25, "\u66DA\u66DE", 7, "\u66E7\u66E8\u66EA", 5, "\u66F1\u66F5\u66F6\u66F8\u66FA\u66FB\u66FD\u6701\u6702\u6703"],
      ["9640", "\u6704\u6705\u6706\u6707\u670C\u670E\u670F\u6711\u6712\u6713\u6716\u6718\u6719\u671A\u671C\u671E\u6720", 5, "\u6727\u6729\u672E\u6730\u6732\u6733\u6736\u6737\u6738\u6739\u673B\u673C\u673E\u673F\u6741\u6744\u6745\u6747\u674A\u674B\u674D\u6752\u6754\u6755\u6757", 4, "\u675D\u6762\u6763\u6764\u6766\u6767\u676B\u676C\u676E\u6771\u6774\u6776"],
      ["9680", "\u6778\u6779\u677A\u677B\u677D\u6780\u6782\u6783\u6785\u6786\u6788\u678A\u678C\u678D\u678E\u678F\u6791\u6792\u6793\u6794\u6796\u6799\u679B\u679F\u67A0\u67A1\u67A4\u67A6\u67A9\u67AC\u67AE\u67B1\u67B2\u67B4\u67B9", 7, "\u67C2\u67C5", 9, "\u67D5\u67D6\u67D7\u67DB\u67DF\u67E1\u67E3\u67E4\u67E6\u67E7\u67E8\u67EA\u67EB\u67ED\u67EE\u67F2\u67F5", 7, "\u67FE\u6801\u6802\u6803\u6804\u6806\u680D\u6810\u6812\u6814\u6815\u6818", 4, "\u681E\u681F\u6820\u6822", 6, "\u682B", 6, "\u6834\u6835\u6836\u683A\u683B\u683F\u6847\u684B\u684D\u684F\u6852\u6856", 5],
      ["9740", "\u685C\u685D\u685E\u685F\u686A\u686C", 7, "\u6875\u6878", 8, "\u6882\u6884\u6887", 7, "\u6890\u6891\u6892\u6894\u6895\u6896\u6898", 9, "\u68A3\u68A4\u68A5\u68A9\u68AA\u68AB\u68AC\u68AE\u68B1\u68B2\u68B4\u68B6\u68B7\u68B8"],
      ["9780", "\u68B9", 6, "\u68C1\u68C3", 5, "\u68CA\u68CC\u68CE\u68CF\u68D0\u68D1\u68D3\u68D4\u68D6\u68D7\u68D9\u68DB", 4, "\u68E1\u68E2\u68E4", 9, "\u68EF\u68F2\u68F3\u68F4\u68F6\u68F7\u68F8\u68FB\u68FD\u68FE\u68FF\u6900\u6902\u6903\u6904\u6906", 4, "\u690C\u690F\u6911\u6913", 11, "\u6921\u6922\u6923\u6925", 7, "\u692E\u692F\u6931\u6932\u6933\u6935\u6936\u6937\u6938\u693A\u693B\u693C\u693E\u6940\u6941\u6943", 16, "\u6955\u6956\u6958\u6959\u695B\u695C\u695F"],
      ["9840", "\u6961\u6962\u6964\u6965\u6967\u6968\u6969\u696A\u696C\u696D\u696F\u6970\u6972", 4, "\u697A\u697B\u697D\u697E\u697F\u6981\u6983\u6985\u698A\u698B\u698C\u698E", 5, "\u6996\u6997\u6999\u699A\u699D", 9, "\u69A9\u69AA\u69AC\u69AE\u69AF\u69B0\u69B2\u69B3\u69B5\u69B6\u69B8\u69B9\u69BA\u69BC\u69BD"],
      ["9880", "\u69BE\u69BF\u69C0\u69C2", 7, "\u69CB\u69CD\u69CF\u69D1\u69D2\u69D3\u69D5", 5, "\u69DC\u69DD\u69DE\u69E1", 11, "\u69EE\u69EF\u69F0\u69F1\u69F3", 9, "\u69FE\u6A00", 9, "\u6A0B", 11, "\u6A19", 5, "\u6A20\u6A22", 5, "\u6A29\u6A2B\u6A2C\u6A2D\u6A2E\u6A30\u6A32\u6A33\u6A34\u6A36", 6, "\u6A3F", 4, "\u6A45\u6A46\u6A48", 7, "\u6A51", 6, "\u6A5A"],
      ["9940", "\u6A5C", 4, "\u6A62\u6A63\u6A64\u6A66", 10, "\u6A72", 6, "\u6A7A\u6A7B\u6A7D\u6A7E\u6A7F\u6A81\u6A82\u6A83\u6A85", 8, "\u6A8F\u6A92", 4, "\u6A98", 7, "\u6AA1", 5],
      ["9980", "\u6AA7\u6AA8\u6AAA\u6AAD", 114, "\u6B25\u6B26\u6B28", 6],
      ["9a40", "\u6B2F\u6B30\u6B31\u6B33\u6B34\u6B35\u6B36\u6B38\u6B3B\u6B3C\u6B3D\u6B3F\u6B40\u6B41\u6B42\u6B44\u6B45\u6B48\u6B4A\u6B4B\u6B4D", 11, "\u6B5A", 7, "\u6B68\u6B69\u6B6B", 13, "\u6B7A\u6B7D\u6B7E\u6B7F\u6B80\u6B85\u6B88"],
      ["9a80", "\u6B8C\u6B8E\u6B8F\u6B90\u6B91\u6B94\u6B95\u6B97\u6B98\u6B99\u6B9C", 4, "\u6BA2", 7, "\u6BAB", 7, "\u6BB6\u6BB8", 6, "\u6BC0\u6BC3\u6BC4\u6BC6", 4, "\u6BCC\u6BCE\u6BD0\u6BD1\u6BD8\u6BDA\u6BDC", 4, "\u6BE2", 7, "\u6BEC\u6BED\u6BEE\u6BF0\u6BF1\u6BF2\u6BF4\u6BF6\u6BF7\u6BF8\u6BFA\u6BFB\u6BFC\u6BFE", 6, "\u6C08", 4, "\u6C0E\u6C12\u6C17\u6C1C\u6C1D\u6C1E\u6C20\u6C23\u6C25\u6C2B\u6C2C\u6C2D\u6C31\u6C33\u6C36\u6C37\u6C39\u6C3A\u6C3B\u6C3C\u6C3E\u6C3F\u6C43\u6C44\u6C45\u6C48\u6C4B", 4, "\u6C51\u6C52\u6C53\u6C56\u6C58"],
      ["9b40", "\u6C59\u6C5A\u6C62\u6C63\u6C65\u6C66\u6C67\u6C6B", 4, "\u6C71\u6C73\u6C75\u6C77\u6C78\u6C7A\u6C7B\u6C7C\u6C7F\u6C80\u6C84\u6C87\u6C8A\u6C8B\u6C8D\u6C8E\u6C91\u6C92\u6C95\u6C96\u6C97\u6C98\u6C9A\u6C9C\u6C9D\u6C9E\u6CA0\u6CA2\u6CA8\u6CAC\u6CAF\u6CB0\u6CB4\u6CB5\u6CB6\u6CB7\u6CBA\u6CC0\u6CC1\u6CC2\u6CC3\u6CC6\u6CC7\u6CC8\u6CCB\u6CCD\u6CCE\u6CCF\u6CD1\u6CD2\u6CD8"],
      ["9b80", "\u6CD9\u6CDA\u6CDC\u6CDD\u6CDF\u6CE4\u6CE6\u6CE7\u6CE9\u6CEC\u6CED\u6CF2\u6CF4\u6CF9\u6CFF\u6D00\u6D02\u6D03\u6D05\u6D06\u6D08\u6D09\u6D0A\u6D0D\u6D0F\u6D10\u6D11\u6D13\u6D14\u6D15\u6D16\u6D18\u6D1C\u6D1D\u6D1F", 5, "\u6D26\u6D28\u6D29\u6D2C\u6D2D\u6D2F\u6D30\u6D34\u6D36\u6D37\u6D38\u6D3A\u6D3F\u6D40\u6D42\u6D44\u6D49\u6D4C\u6D50\u6D55\u6D56\u6D57\u6D58\u6D5B\u6D5D\u6D5F\u6D61\u6D62\u6D64\u6D65\u6D67\u6D68\u6D6B\u6D6C\u6D6D\u6D70\u6D71\u6D72\u6D73\u6D75\u6D76\u6D79\u6D7A\u6D7B\u6D7D", 4, "\u6D83\u6D84\u6D86\u6D87\u6D8A\u6D8B\u6D8D\u6D8F\u6D90\u6D92\u6D96", 4, "\u6D9C\u6DA2\u6DA5\u6DAC\u6DAD\u6DB0\u6DB1\u6DB3\u6DB4\u6DB6\u6DB7\u6DB9", 5, "\u6DC1\u6DC2\u6DC3\u6DC8\u6DC9\u6DCA"],
      ["9c40", "\u6DCD\u6DCE\u6DCF\u6DD0\u6DD2\u6DD3\u6DD4\u6DD5\u6DD7\u6DDA\u6DDB\u6DDC\u6DDF\u6DE2\u6DE3\u6DE5\u6DE7\u6DE8\u6DE9\u6DEA\u6DED\u6DEF\u6DF0\u6DF2\u6DF4\u6DF5\u6DF6\u6DF8\u6DFA\u6DFD", 7, "\u6E06\u6E07\u6E08\u6E09\u6E0B\u6E0F\u6E12\u6E13\u6E15\u6E18\u6E19\u6E1B\u6E1C\u6E1E\u6E1F\u6E22\u6E26\u6E27\u6E28\u6E2A\u6E2C\u6E2E\u6E30\u6E31\u6E33\u6E35"],
      ["9c80", "\u6E36\u6E37\u6E39\u6E3B", 7, "\u6E45", 7, "\u6E4F\u6E50\u6E51\u6E52\u6E55\u6E57\u6E59\u6E5A\u6E5C\u6E5D\u6E5E\u6E60", 10, "\u6E6C\u6E6D\u6E6F", 14, "\u6E80\u6E81\u6E82\u6E84\u6E87\u6E88\u6E8A", 4, "\u6E91", 6, "\u6E99\u6E9A\u6E9B\u6E9D\u6E9E\u6EA0\u6EA1\u6EA3\u6EA4\u6EA6\u6EA8\u6EA9\u6EAB\u6EAC\u6EAD\u6EAE\u6EB0\u6EB3\u6EB5\u6EB8\u6EB9\u6EBC\u6EBE\u6EBF\u6EC0\u6EC3\u6EC4\u6EC5\u6EC6\u6EC8\u6EC9\u6ECA\u6ECC\u6ECD\u6ECE\u6ED0\u6ED2\u6ED6\u6ED8\u6ED9\u6EDB\u6EDC\u6EDD\u6EE3\u6EE7\u6EEA", 5],
      ["9d40", "\u6EF0\u6EF1\u6EF2\u6EF3\u6EF5\u6EF6\u6EF7\u6EF8\u6EFA", 7, "\u6F03\u6F04\u6F05\u6F07\u6F08\u6F0A", 4, "\u6F10\u6F11\u6F12\u6F16", 9, "\u6F21\u6F22\u6F23\u6F25\u6F26\u6F27\u6F28\u6F2C\u6F2E\u6F30\u6F32\u6F34\u6F35\u6F37", 6, "\u6F3F\u6F40\u6F41\u6F42"],
      ["9d80", "\u6F43\u6F44\u6F45\u6F48\u6F49\u6F4A\u6F4C\u6F4E", 9, "\u6F59\u6F5A\u6F5B\u6F5D\u6F5F\u6F60\u6F61\u6F63\u6F64\u6F65\u6F67", 5, "\u6F6F\u6F70\u6F71\u6F73\u6F75\u6F76\u6F77\u6F79\u6F7B\u6F7D", 6, "\u6F85\u6F86\u6F87\u6F8A\u6F8B\u6F8F", 12, "\u6F9D\u6F9E\u6F9F\u6FA0\u6FA2", 4, "\u6FA8", 10, "\u6FB4\u6FB5\u6FB7\u6FB8\u6FBA", 5, "\u6FC1\u6FC3", 5, "\u6FCA", 6, "\u6FD3", 10, "\u6FDF\u6FE2\u6FE3\u6FE4\u6FE5"],
      ["9e40", "\u6FE6", 7, "\u6FF0", 32, "\u7012", 7, "\u701C", 6, "\u7024", 6],
      ["9e80", "\u702B", 9, "\u7036\u7037\u7038\u703A", 17, "\u704D\u704E\u7050", 13, "\u705F", 11, "\u706E\u7071\u7072\u7073\u7074\u7077\u7079\u707A\u707B\u707D\u7081\u7082\u7083\u7084\u7086\u7087\u7088\u708B\u708C\u708D\u708F\u7090\u7091\u7093\u7097\u7098\u709A\u709B\u709E", 12, "\u70B0\u70B2\u70B4\u70B5\u70B6\u70BA\u70BE\u70BF\u70C4\u70C5\u70C6\u70C7\u70C9\u70CB", 12, "\u70DA"],
      ["9f40", "\u70DC\u70DD\u70DE\u70E0\u70E1\u70E2\u70E3\u70E5\u70EA\u70EE\u70F0", 6, "\u70F8\u70FA\u70FB\u70FC\u70FE", 10, "\u710B", 4, "\u7111\u7112\u7114\u7117\u711B", 10, "\u7127", 7, "\u7132\u7133\u7134"],
      ["9f80", "\u7135\u7137", 13, "\u7146\u7147\u7148\u7149\u714B\u714D\u714F", 12, "\u715D\u715F", 4, "\u7165\u7169", 4, "\u716F\u7170\u7171\u7174\u7175\u7176\u7177\u7179\u717B\u717C\u717E", 5, "\u7185", 4, "\u718B\u718C\u718D\u718E\u7190\u7191\u7192\u7193\u7195\u7196\u7197\u719A", 4, "\u71A1", 6, "\u71A9\u71AA\u71AB\u71AD", 5, "\u71B4\u71B6\u71B7\u71B8\u71BA", 8, "\u71C4", 9, "\u71CF", 4],
      ["a040", "\u71D6", 9, "\u71E1\u71E2\u71E3\u71E4\u71E6\u71E8", 5, "\u71EF", 9, "\u71FA", 11, "\u7207", 19],
      ["a080", "\u721B\u721C\u721E", 9, "\u7229\u722B\u722D\u722E\u722F\u7232\u7233\u7234\u723A\u723C\u723E\u7240", 6, "\u7249\u724A\u724B\u724E\u724F\u7250\u7251\u7253\u7254\u7255\u7257\u7258\u725A\u725C\u725E\u7260\u7263\u7264\u7265\u7268\u726A\u726B\u726C\u726D\u7270\u7271\u7273\u7274\u7276\u7277\u7278\u727B\u727C\u727D\u7282\u7283\u7285", 4, "\u728C\u728E\u7290\u7291\u7293", 11, "\u72A0", 11, "\u72AE\u72B1\u72B2\u72B3\u72B5\u72BA", 6, "\u72C5\u72C6\u72C7\u72C9\u72CA\u72CB\u72CC\u72CF\u72D1\u72D3\u72D4\u72D5\u72D6\u72D8\u72DA\u72DB"],
      ["a1a1", "\u3000\u3001\u3002\xB7\u02C9\u02C7\xA8\u3003\u3005\u2014\uFF5E\u2016\u2026\u2018\u2019\u201C\u201D\u3014\u3015\u3008", 7, "\u3016\u3017\u3010\u3011\xB1\xD7\xF7\u2236\u2227\u2228\u2211\u220F\u222A\u2229\u2208\u2237\u221A\u22A5\u2225\u2220\u2312\u2299\u222B\u222E\u2261\u224C\u2248\u223D\u221D\u2260\u226E\u226F\u2264\u2265\u221E\u2235\u2234\u2642\u2640\xB0\u2032\u2033\u2103\uFF04\xA4\uFFE0\uFFE1\u2030\xA7\u2116\u2606\u2605\u25CB\u25CF\u25CE\u25C7\u25C6\u25A1\u25A0\u25B3\u25B2\u203B\u2192\u2190\u2191\u2193\u3013"],
      ["a2a1", "\u2170", 9],
      ["a2b1", "\u2488", 19, "\u2474", 19, "\u2460", 9],
      ["a2e5", "\u3220", 9],
      ["a2f1", "\u2160", 11],
      ["a3a1", "\uFF01\uFF02\uFF03\uFFE5\uFF05", 88, "\uFFE3"],
      ["a4a1", "\u3041", 82],
      ["a5a1", "\u30A1", 85],
      ["a6a1", "\u0391", 16, "\u03A3", 6],
      ["a6c1", "\u03B1", 16, "\u03C3", 6],
      ["a6e0", "\uFE35\uFE36\uFE39\uFE3A\uFE3F\uFE40\uFE3D\uFE3E\uFE41\uFE42\uFE43\uFE44"],
      ["a6ee", "\uFE3B\uFE3C\uFE37\uFE38\uFE31"],
      ["a6f4", "\uFE33\uFE34"],
      ["a7a1", "\u0410", 5, "\u0401\u0416", 25],
      ["a7d1", "\u0430", 5, "\u0451\u0436", 25],
      ["a840", "\u02CA\u02CB\u02D9\u2013\u2015\u2025\u2035\u2105\u2109\u2196\u2197\u2198\u2199\u2215\u221F\u2223\u2252\u2266\u2267\u22BF\u2550", 35, "\u2581", 6],
      ["a880", "\u2588", 7, "\u2593\u2594\u2595\u25BC\u25BD\u25E2\u25E3\u25E4\u25E5\u2609\u2295\u3012\u301D\u301E"],
      ["a8a1", "\u0101\xE1\u01CE\xE0\u0113\xE9\u011B\xE8\u012B\xED\u01D0\xEC\u014D\xF3\u01D2\xF2\u016B\xFA\u01D4\xF9\u01D6\u01D8\u01DA\u01DC\xFC\xEA\u0251"],
      ["a8bd", "\u0144\u0148"],
      ["a8c0", "\u0261"],
      ["a8c5", "\u3105", 36],
      ["a940", "\u3021", 8, "\u32A3\u338E\u338F\u339C\u339D\u339E\u33A1\u33C4\u33CE\u33D1\u33D2\u33D5\uFE30\uFFE2\uFFE4"],
      ["a959", "\u2121\u3231"],
      ["a95c", "\u2010"],
      ["a960", "\u30FC\u309B\u309C\u30FD\u30FE\u3006\u309D\u309E\uFE49", 9, "\uFE54\uFE55\uFE56\uFE57\uFE59", 8],
      ["a980", "\uFE62", 4, "\uFE68\uFE69\uFE6A\uFE6B"],
      ["a996", "\u3007"],
      ["a9a4", "\u2500", 75],
      ["aa40", "\u72DC\u72DD\u72DF\u72E2", 5, "\u72EA\u72EB\u72F5\u72F6\u72F9\u72FD\u72FE\u72FF\u7300\u7302\u7304", 5, "\u730B\u730C\u730D\u730F\u7310\u7311\u7312\u7314\u7318\u7319\u731A\u731F\u7320\u7323\u7324\u7326\u7327\u7328\u732D\u732F\u7330\u7332\u7333\u7335\u7336\u733A\u733B\u733C\u733D\u7340", 8],
      ["aa80", "\u7349\u734A\u734B\u734C\u734E\u734F\u7351\u7353\u7354\u7355\u7356\u7358", 7, "\u7361", 10, "\u736E\u7370\u7371"],
      ["ab40", "\u7372", 11, "\u737F", 4, "\u7385\u7386\u7388\u738A\u738C\u738D\u738F\u7390\u7392\u7393\u7394\u7395\u7397\u7398\u7399\u739A\u739C\u739D\u739E\u73A0\u73A1\u73A3", 5, "\u73AA\u73AC\u73AD\u73B1\u73B4\u73B5\u73B6\u73B8\u73B9\u73BC\u73BD\u73BE\u73BF\u73C1\u73C3", 4],
      ["ab80", "\u73CB\u73CC\u73CE\u73D2", 6, "\u73DA\u73DB\u73DC\u73DD\u73DF\u73E1\u73E2\u73E3\u73E4\u73E6\u73E8\u73EA\u73EB\u73EC\u73EE\u73EF\u73F0\u73F1\u73F3", 4],
      ["ac40", "\u73F8", 10, "\u7404\u7407\u7408\u740B\u740C\u740D\u740E\u7411", 8, "\u741C", 5, "\u7423\u7424\u7427\u7429\u742B\u742D\u742F\u7431\u7432\u7437", 4, "\u743D\u743E\u743F\u7440\u7442", 11],
      ["ac80", "\u744E", 6, "\u7456\u7458\u745D\u7460", 12, "\u746E\u746F\u7471", 4, "\u7478\u7479\u747A"],
      ["ad40", "\u747B\u747C\u747D\u747F\u7482\u7484\u7485\u7486\u7488\u7489\u748A\u748C\u748D\u748F\u7491", 10, "\u749D\u749F", 7, "\u74AA", 15, "\u74BB", 12],
      ["ad80", "\u74C8", 9, "\u74D3", 8, "\u74DD\u74DF\u74E1\u74E5\u74E7", 6, "\u74F0\u74F1\u74F2"],
      ["ae40", "\u74F3\u74F5\u74F8", 6, "\u7500\u7501\u7502\u7503\u7505", 7, "\u750E\u7510\u7512\u7514\u7515\u7516\u7517\u751B\u751D\u751E\u7520", 4, "\u7526\u7527\u752A\u752E\u7534\u7536\u7539\u753C\u753D\u753F\u7541\u7542\u7543\u7544\u7546\u7547\u7549\u754A\u754D\u7550\u7551\u7552\u7553\u7555\u7556\u7557\u7558"],
      ["ae80", "\u755D", 7, "\u7567\u7568\u7569\u756B", 6, "\u7573\u7575\u7576\u7577\u757A", 4, "\u7580\u7581\u7582\u7584\u7585\u7587"],
      ["af40", "\u7588\u7589\u758A\u758C\u758D\u758E\u7590\u7593\u7595\u7598\u759B\u759C\u759E\u75A2\u75A6", 4, "\u75AD\u75B6\u75B7\u75BA\u75BB\u75BF\u75C0\u75C1\u75C6\u75CB\u75CC\u75CE\u75CF\u75D0\u75D1\u75D3\u75D7\u75D9\u75DA\u75DC\u75DD\u75DF\u75E0\u75E1\u75E5\u75E9\u75EC\u75ED\u75EE\u75EF\u75F2\u75F3\u75F5\u75F6\u75F7\u75F8\u75FA\u75FB\u75FD\u75FE\u7602\u7604\u7606\u7607"],
      ["af80", "\u7608\u7609\u760B\u760D\u760E\u760F\u7611\u7612\u7613\u7614\u7616\u761A\u761C\u761D\u761E\u7621\u7623\u7627\u7628\u762C\u762E\u762F\u7631\u7632\u7636\u7637\u7639\u763A\u763B\u763D\u7641\u7642\u7644"],
      ["b040", "\u7645", 6, "\u764E", 5, "\u7655\u7657", 4, "\u765D\u765F\u7660\u7661\u7662\u7664", 6, "\u766C\u766D\u766E\u7670", 7, "\u7679\u767A\u767C\u767F\u7680\u7681\u7683\u7685\u7689\u768A\u768C\u768D\u768F\u7690\u7692\u7694\u7695\u7697\u7698\u769A\u769B"],
      ["b080", "\u769C", 7, "\u76A5", 8, "\u76AF\u76B0\u76B3\u76B5", 9, "\u76C0\u76C1\u76C3\u554A\u963F\u57C3\u6328\u54CE\u5509\u54C0\u7691\u764C\u853C\u77EE\u827E\u788D\u7231\u9698\u978D\u6C28\u5B89\u4FFA\u6309\u6697\u5CB8\u80FA\u6848\u80AE\u6602\u76CE\u51F9\u6556\u71AC\u7FF1\u8884\u50B2\u5965\u61CA\u6FB3\u82AD\u634C\u6252\u53ED\u5427\u7B06\u516B\u75A4\u5DF4\u62D4\u8DCB\u9776\u628A\u8019\u575D\u9738\u7F62\u7238\u767D\u67CF\u767E\u6446\u4F70\u8D25\u62DC\u7A17\u6591\u73ED\u642C\u6273\u822C\u9881\u677F\u7248\u626E\u62CC\u4F34\u74E3\u534A\u529E\u7ECA\u90A6\u5E2E\u6886\u699C\u8180\u7ED1\u68D2\u78C5\u868C\u9551\u508D\u8C24\u82DE\u80DE\u5305\u8912\u5265"],
      ["b140", "\u76C4\u76C7\u76C9\u76CB\u76CC\u76D3\u76D5\u76D9\u76DA\u76DC\u76DD\u76DE\u76E0", 4, "\u76E6", 7, "\u76F0\u76F3\u76F5\u76F6\u76F7\u76FA\u76FB\u76FD\u76FF\u7700\u7702\u7703\u7705\u7706\u770A\u770C\u770E", 10, "\u771B\u771C\u771D\u771E\u7721\u7723\u7724\u7725\u7727\u772A\u772B"],
      ["b180", "\u772C\u772E\u7730", 4, "\u7739\u773B\u773D\u773E\u773F\u7742\u7744\u7745\u7746\u7748", 7, "\u7752", 7, "\u775C\u8584\u96F9\u4FDD\u5821\u9971\u5B9D\u62B1\u62A5\u66B4\u8C79\u9C8D\u7206\u676F\u7891\u60B2\u5351\u5317\u8F88\u80CC\u8D1D\u94A1\u500D\u72C8\u5907\u60EB\u7119\u88AB\u5954\u82EF\u672C\u7B28\u5D29\u7EF7\u752D\u6CF5\u8E66\u8FF8\u903C\u9F3B\u6BD4\u9119\u7B14\u5F7C\u78A7\u84D6\u853D\u6BD5\u6BD9\u6BD6\u5E01\u5E87\u75F9\u95ED\u655D\u5F0A\u5FC5\u8F9F\u58C1\u81C2\u907F\u965B\u97AD\u8FB9\u7F16\u8D2C\u6241\u4FBF\u53D8\u535E\u8FA8\u8FA9\u8FAB\u904D\u6807\u5F6A\u8198\u8868\u9CD6\u618B\u522B\u762A\u5F6C\u658C\u6FD2\u6EE8\u5BBE\u6448\u5175\u51B0\u67C4\u4E19\u79C9\u997C\u70B3"],
      ["b240", "\u775D\u775E\u775F\u7760\u7764\u7767\u7769\u776A\u776D", 11, "\u777A\u777B\u777C\u7781\u7782\u7783\u7786", 5, "\u778F\u7790\u7793", 11, "\u77A1\u77A3\u77A4\u77A6\u77A8\u77AB\u77AD\u77AE\u77AF\u77B1\u77B2\u77B4\u77B6", 4],
      ["b280", "\u77BC\u77BE\u77C0", 12, "\u77CE", 8, "\u77D8\u77D9\u77DA\u77DD", 4, "\u77E4\u75C5\u5E76\u73BB\u83E0\u64AD\u62E8\u94B5\u6CE2\u535A\u52C3\u640F\u94C2\u7B94\u4F2F\u5E1B\u8236\u8116\u818A\u6E24\u6CCA\u9A73\u6355\u535C\u54FA\u8865\u57E0\u4E0D\u5E03\u6B65\u7C3F\u90E8\u6016\u64E6\u731C\u88C1\u6750\u624D\u8D22\u776C\u8E29\u91C7\u5F69\u83DC\u8521\u9910\u53C2\u8695\u6B8B\u60ED\u60E8\u707F\u82CD\u8231\u4ED3\u6CA7\u85CF\u64CD\u7CD9\u69FD\u66F9\u8349\u5395\u7B56\u4FA7\u518C\u6D4B\u5C42\u8E6D\u63D2\u53C9\u832C\u8336\u67E5\u78B4\u643D\u5BDF\u5C94\u5DEE\u8BE7\u62C6\u67F4\u8C7A\u6400\u63BA\u8749\u998B\u8C17\u7F20\u94F2\u4EA7\u9610\u98A4\u660C\u7316"],
      ["b340", "\u77E6\u77E8\u77EA\u77EF\u77F0\u77F1\u77F2\u77F4\u77F5\u77F7\u77F9\u77FA\u77FB\u77FC\u7803", 5, "\u780A\u780B\u780E\u780F\u7810\u7813\u7815\u7819\u781B\u781E\u7820\u7821\u7822\u7824\u7828\u782A\u782B\u782E\u782F\u7831\u7832\u7833\u7835\u7836\u783D\u783F\u7841\u7842\u7843\u7844\u7846\u7848\u7849\u784A\u784B\u784D\u784F\u7851\u7853\u7854\u7858\u7859\u785A"],
      ["b380", "\u785B\u785C\u785E", 11, "\u786F", 7, "\u7878\u7879\u787A\u787B\u787D", 6, "\u573A\u5C1D\u5E38\u957F\u507F\u80A0\u5382\u655E\u7545\u5531\u5021\u8D85\u6284\u949E\u671D\u5632\u6F6E\u5DE2\u5435\u7092\u8F66\u626F\u64A4\u63A3\u5F7B\u6F88\u90F4\u81E3\u8FB0\u5C18\u6668\u5FF1\u6C89\u9648\u8D81\u886C\u6491\u79F0\u57CE\u6A59\u6210\u5448\u4E58\u7A0B\u60E9\u6F84\u8BDA\u627F\u901E\u9A8B\u79E4\u5403\u75F4\u6301\u5319\u6C60\u8FDF\u5F1B\u9A70\u803B\u9F7F\u4F88\u5C3A\u8D64\u7FC5\u65A5\u70BD\u5145\u51B2\u866B\u5D07\u5BA0\u62BD\u916C\u7574\u8E0C\u7A20\u6101\u7B79\u4EC7\u7EF8\u7785\u4E11\u81ED\u521D\u51FA\u6A71\u53A8\u8E87\u9504\u96CF\u6EC1\u9664\u695A"],
      ["b440", "\u7884\u7885\u7886\u7888\u788A\u788B\u788F\u7890\u7892\u7894\u7895\u7896\u7899\u789D\u789E\u78A0\u78A2\u78A4\u78A6\u78A8", 7, "\u78B5\u78B6\u78B7\u78B8\u78BA\u78BB\u78BC\u78BD\u78BF\u78C0\u78C2\u78C3\u78C4\u78C6\u78C7\u78C8\u78CC\u78CD\u78CE\u78CF\u78D1\u78D2\u78D3\u78D6\u78D7\u78D8\u78DA", 9],
      ["b480", "\u78E4\u78E5\u78E6\u78E7\u78E9\u78EA\u78EB\u78ED", 4, "\u78F3\u78F5\u78F6\u78F8\u78F9\u78FB", 5, "\u7902\u7903\u7904\u7906", 6, "\u7840\u50A8\u77D7\u6410\u89E6\u5904\u63E3\u5DDD\u7A7F\u693D\u4F20\u8239\u5598\u4E32\u75AE\u7A97\u5E62\u5E8A\u95EF\u521B\u5439\u708A\u6376\u9524\u5782\u6625\u693F\u9187\u5507\u6DF3\u7EAF\u8822\u6233\u7EF0\u75B5\u8328\u78C1\u96CC\u8F9E\u6148\u74F7\u8BCD\u6B64\u523A\u8D50\u6B21\u806A\u8471\u56F1\u5306\u4ECE\u4E1B\u51D1\u7C97\u918B\u7C07\u4FC3\u8E7F\u7BE1\u7A9C\u6467\u5D14\u50AC\u8106\u7601\u7CB9\u6DEC\u7FE0\u6751\u5B58\u5BF8\u78CB\u64AE\u6413\u63AA\u632B\u9519\u642D\u8FBE\u7B54\u7629\u6253\u5927\u5446\u6B79\u50A3\u6234\u5E26\u6B86\u4EE3\u8D37\u888B\u5F85\u902E"],
      ["b540", "\u790D", 5, "\u7914", 9, "\u791F", 4, "\u7925", 14, "\u7935", 4, "\u793D\u793F\u7942\u7943\u7944\u7945\u7947\u794A", 8, "\u7954\u7955\u7958\u7959\u7961\u7963"],
      ["b580", "\u7964\u7966\u7969\u796A\u796B\u796C\u796E\u7970", 6, "\u7979\u797B", 4, "\u7982\u7983\u7986\u7987\u7988\u7989\u798B\u798C\u798D\u798E\u7990\u7991\u7992\u6020\u803D\u62C5\u4E39\u5355\u90F8\u63B8\u80C6\u65E6\u6C2E\u4F46\u60EE\u6DE1\u8BDE\u5F39\u86CB\u5F53\u6321\u515A\u8361\u6863\u5200\u6363\u8E48\u5012\u5C9B\u7977\u5BFC\u5230\u7A3B\u60BC\u9053\u76D7\u5FB7\u5F97\u7684\u8E6C\u706F\u767B\u7B49\u77AA\u51F3\u9093\u5824\u4F4E\u6EF4\u8FEA\u654C\u7B1B\u72C4\u6DA4\u7FDF\u5AE1\u62B5\u5E95\u5730\u8482\u7B2C\u5E1D\u5F1F\u9012\u7F14\u98A0\u6382\u6EC7\u7898\u70B9\u5178\u975B\u57AB\u7535\u4F43\u7538\u5E97\u60E6\u5960\u6DC0\u6BBF\u7889\u53FC\u96D5\u51CB\u5201\u6389\u540A\u9493\u8C03\u8DCC\u7239\u789F\u8776\u8FED\u8C0D\u53E0"],
      ["b640", "\u7993", 6, "\u799B", 11, "\u79A8", 10, "\u79B4", 4, "\u79BC\u79BF\u79C2\u79C4\u79C5\u79C7\u79C8\u79CA\u79CC\u79CE\u79CF\u79D0\u79D3\u79D4\u79D6\u79D7\u79D9", 5, "\u79E0\u79E1\u79E2\u79E5\u79E8\u79EA"],
      ["b680", "\u79EC\u79EE\u79F1", 6, "\u79F9\u79FA\u79FC\u79FE\u79FF\u7A01\u7A04\u7A05\u7A07\u7A08\u7A09\u7A0A\u7A0C\u7A0F", 4, "\u7A15\u7A16\u7A18\u7A19\u7A1B\u7A1C\u4E01\u76EF\u53EE\u9489\u9876\u9F0E\u952D\u5B9A\u8BA2\u4E22\u4E1C\u51AC\u8463\u61C2\u52A8\u680B\u4F97\u606B\u51BB\u6D1E\u515C\u6296\u6597\u9661\u8C46\u9017\u75D8\u90FD\u7763\u6BD2\u728A\u72EC\u8BFB\u5835\u7779\u8D4C\u675C\u9540\u809A\u5EA6\u6E21\u5992\u7AEF\u77ED\u953B\u6BB5\u65AD\u7F0E\u5806\u5151\u961F\u5BF9\u58A9\u5428\u8E72\u6566\u987F\u56E4\u949D\u76FE\u9041\u6387\u54C6\u591A\u593A\u579B\u8EB2\u6735\u8DFA\u8235\u5241\u60F0\u5815\u86FE\u5CE8\u9E45\u4FC4\u989D\u8BB9\u5A25\u6076\u5384\u627C\u904F\u9102\u997F\u6069\u800C\u513F\u8033\u5C14\u9975\u6D31\u4E8C"],
      ["b740", "\u7A1D\u7A1F\u7A21\u7A22\u7A24", 14, "\u7A34\u7A35\u7A36\u7A38\u7A3A\u7A3E\u7A40", 5, "\u7A47", 9, "\u7A52", 4, "\u7A58", 16],
      ["b780", "\u7A69", 6, "\u7A71\u7A72\u7A73\u7A75\u7A7B\u7A7C\u7A7D\u7A7E\u7A82\u7A85\u7A87\u7A89\u7A8A\u7A8B\u7A8C\u7A8E\u7A8F\u7A90\u7A93\u7A94\u7A99\u7A9A\u7A9B\u7A9E\u7AA1\u7AA2\u8D30\u53D1\u7F5A\u7B4F\u4F10\u4E4F\u9600\u6CD5\u73D0\u85E9\u5E06\u756A\u7FFB\u6A0A\u77FE\u9492\u7E41\u51E1\u70E6\u53CD\u8FD4\u8303\u8D29\u72AF\u996D\u6CDB\u574A\u82B3\u65B9\u80AA\u623F\u9632\u59A8\u4EFF\u8BBF\u7EBA\u653E\u83F2\u975E\u5561\u98DE\u80A5\u532A\u8BFD\u5420\u80BA\u5E9F\u6CB8\u8D39\u82AC\u915A\u5429\u6C1B\u5206\u7EB7\u575F\u711A\u6C7E\u7C89\u594B\u4EFD\u5FFF\u6124\u7CAA\u4E30\u5C01\u67AB\u8702\u5CF0\u950B\u98CE\u75AF\u70FD\u9022\u51AF\u7F1D\u8BBD\u5949\u51E4\u4F5B\u5426\u592B\u6577\u80A4\u5B75\u6276\u62C2\u8F90\u5E45\u6C1F\u7B26\u4F0F\u4FD8\u670D"],
      ["b840", "\u7AA3\u7AA4\u7AA7\u7AA9\u7AAA\u7AAB\u7AAE", 4, "\u7AB4", 10, "\u7AC0", 10, "\u7ACC", 9, "\u7AD7\u7AD8\u7ADA\u7ADB\u7ADC\u7ADD\u7AE1\u7AE2\u7AE4\u7AE7", 5, "\u7AEE\u7AF0\u7AF1\u7AF2\u7AF3"],
      ["b880", "\u7AF4", 4, "\u7AFB\u7AFC\u7AFE\u7B00\u7B01\u7B02\u7B05\u7B07\u7B09\u7B0C\u7B0D\u7B0E\u7B10\u7B12\u7B13\u7B16\u7B17\u7B18\u7B1A\u7B1C\u7B1D\u7B1F\u7B21\u7B22\u7B23\u7B27\u7B29\u7B2D\u6D6E\u6DAA\u798F\u88B1\u5F17\u752B\u629A\u8F85\u4FEF\u91DC\u65A7\u812F\u8151\u5E9C\u8150\u8D74\u526F\u8986\u8D4B\u590D\u5085\u4ED8\u961C\u7236\u8179\u8D1F\u5BCC\u8BA3\u9644\u5987\u7F1A\u5490\u5676\u560E\u8BE5\u6539\u6982\u9499\u76D6\u6E89\u5E72\u7518\u6746\u67D1\u7AFF\u809D\u8D76\u611F\u79C6\u6562\u8D63\u5188\u521A\u94A2\u7F38\u809B\u7EB2\u5C97\u6E2F\u6760\u7BD9\u768B\u9AD8\u818F\u7F94\u7CD5\u641E\u9550\u7A3F\u544A\u54E5\u6B4C\u6401\u6208\u9E3D\u80F3\u7599\u5272\u9769\u845B\u683C\u86E4\u9601\u9694\u94EC\u4E2A\u5404\u7ED9\u6839\u8DDF\u8015\u66F4\u5E9A\u7FB9"],
      ["b940", "\u7B2F\u7B30\u7B32\u7B34\u7B35\u7B36\u7B37\u7B39\u7B3B\u7B3D\u7B3F", 5, "\u7B46\u7B48\u7B4A\u7B4D\u7B4E\u7B53\u7B55\u7B57\u7B59\u7B5C\u7B5E\u7B5F\u7B61\u7B63", 10, "\u7B6F\u7B70\u7B73\u7B74\u7B76\u7B78\u7B7A\u7B7C\u7B7D\u7B7F\u7B81\u7B82\u7B83\u7B84\u7B86", 6, "\u7B8E\u7B8F"],
      ["b980", "\u7B91\u7B92\u7B93\u7B96\u7B98\u7B99\u7B9A\u7B9B\u7B9E\u7B9F\u7BA0\u7BA3\u7BA4\u7BA5\u7BAE\u7BAF\u7BB0\u7BB2\u7BB3\u7BB5\u7BB6\u7BB7\u7BB9", 7, "\u7BC2\u7BC3\u7BC4\u57C2\u803F\u6897\u5DE5\u653B\u529F\u606D\u9F9A\u4F9B\u8EAC\u516C\u5BAB\u5F13\u5DE9\u6C5E\u62F1\u8D21\u5171\u94A9\u52FE\u6C9F\u82DF\u72D7\u57A2\u6784\u8D2D\u591F\u8F9C\u83C7\u5495\u7B8D\u4F30\u6CBD\u5B64\u59D1\u9F13\u53E4\u86CA\u9AA8\u8C37\u80A1\u6545\u987E\u56FA\u96C7\u522E\u74DC\u5250\u5BE1\u6302\u8902\u4E56\u62D0\u602A\u68FA\u5173\u5B98\u51A0\u89C2\u7BA1\u9986\u7F50\u60EF\u704C\u8D2F\u5149\u5E7F\u901B\u7470\u89C4\u572D\u7845\u5F52\u9F9F\u95FA\u8F68\u9B3C\u8BE1\u7678\u6842\u67DC\u8DEA\u8D35\u523D\u8F8A\u6EDA\u68CD\u9505\u90ED\u56FD\u679C\u88F9\u8FC7\u54C8"],
      ["ba40", "\u7BC5\u7BC8\u7BC9\u7BCA\u7BCB\u7BCD\u7BCE\u7BCF\u7BD0\u7BD2\u7BD4", 4, "\u7BDB\u7BDC\u7BDE\u7BDF\u7BE0\u7BE2\u7BE3\u7BE4\u7BE7\u7BE8\u7BE9\u7BEB\u7BEC\u7BED\u7BEF\u7BF0\u7BF2", 4, "\u7BF8\u7BF9\u7BFA\u7BFB\u7BFD\u7BFF", 7, "\u7C08\u7C09\u7C0A\u7C0D\u7C0E\u7C10", 5, "\u7C17\u7C18\u7C19"],
      ["ba80", "\u7C1A", 4, "\u7C20", 5, "\u7C28\u7C29\u7C2B", 12, "\u7C39", 5, "\u7C42\u9AB8\u5B69\u6D77\u6C26\u4EA5\u5BB3\u9A87\u9163\u61A8\u90AF\u97E9\u542B\u6DB5\u5BD2\u51FD\u558A\u7F55\u7FF0\u64BC\u634D\u65F1\u61BE\u608D\u710A\u6C57\u6C49\u592F\u676D\u822A\u58D5\u568E\u8C6A\u6BEB\u90DD\u597D\u8017\u53F7\u6D69\u5475\u559D\u8377\u83CF\u6838\u79BE\u548C\u4F55\u5408\u76D2\u8C89\u9602\u6CB3\u6DB8\u8D6B\u8910\u9E64\u8D3A\u563F\u9ED1\u75D5\u5F88\u72E0\u6068\u54FC\u4EA8\u6A2A\u8861\u6052\u8F70\u54C4\u70D8\u8679\u9E3F\u6D2A\u5B8F\u5F18\u7EA2\u5589\u4FAF\u7334\u543C\u539A\u5019\u540E\u547C\u4E4E\u5FFD\u745A\u58F6\u846B\u80E1\u8774\u72D0\u7CCA\u6E56"],
      ["bb40", "\u7C43", 9, "\u7C4E", 36, "\u7C75", 5, "\u7C7E", 9],
      ["bb80", "\u7C88\u7C8A", 6, "\u7C93\u7C94\u7C96\u7C99\u7C9A\u7C9B\u7CA0\u7CA1\u7CA3\u7CA6\u7CA7\u7CA8\u7CA9\u7CAB\u7CAC\u7CAD\u7CAF\u7CB0\u7CB4", 4, "\u7CBA\u7CBB\u5F27\u864E\u552C\u62A4\u4E92\u6CAA\u6237\u82B1\u54D7\u534E\u733E\u6ED1\u753B\u5212\u5316\u8BDD\u69D0\u5F8A\u6000\u6DEE\u574F\u6B22\u73AF\u6853\u8FD8\u7F13\u6362\u60A3\u5524\u75EA\u8C62\u7115\u6DA3\u5BA6\u5E7B\u8352\u614C\u9EC4\u78FA\u8757\u7C27\u7687\u51F0\u60F6\u714C\u6643\u5E4C\u604D\u8C0E\u7070\u6325\u8F89\u5FBD\u6062\u86D4\u56DE\u6BC1\u6094\u6167\u5349\u60E0\u6666\u8D3F\u79FD\u4F1A\u70E9\u6C47\u8BB3\u8BF2\u7ED8\u8364\u660F\u5A5A\u9B42\u6D51\u6DF7\u8C41\u6D3B\u4F19\u706B\u83B7\u6216\u60D1\u970D\u8D27\u7978\u51FB\u573E\u57FA\u673A\u7578\u7A3D\u79EF\u7B95"],
      ["bc40", "\u7CBF\u7CC0\u7CC2\u7CC3\u7CC4\u7CC6\u7CC9\u7CCB\u7CCE", 6, "\u7CD8\u7CDA\u7CDB\u7CDD\u7CDE\u7CE1", 6, "\u7CE9", 5, "\u7CF0", 7, "\u7CF9\u7CFA\u7CFC", 13, "\u7D0B", 5],
      ["bc80", "\u7D11", 14, "\u7D21\u7D23\u7D24\u7D25\u7D26\u7D28\u7D29\u7D2A\u7D2C\u7D2D\u7D2E\u7D30", 6, "\u808C\u9965\u8FF9\u6FC0\u8BA5\u9E21\u59EC\u7EE9\u7F09\u5409\u6781\u68D8\u8F91\u7C4D\u96C6\u53CA\u6025\u75BE\u6C72\u5373\u5AC9\u7EA7\u6324\u51E0\u810A\u5DF1\u84DF\u6280\u5180\u5B63\u4F0E\u796D\u5242\u60B8\u6D4E\u5BC4\u5BC2\u8BA1\u8BB0\u65E2\u5FCC\u9645\u5993\u7EE7\u7EAA\u5609\u67B7\u5939\u4F73\u5BB6\u52A0\u835A\u988A\u8D3E\u7532\u94BE\u5047\u7A3C\u4EF7\u67B6\u9A7E\u5AC1\u6B7C\u76D1\u575A\u5C16\u7B3A\u95F4\u714E\u517C\u80A9\u8270\u5978\u7F04\u8327\u68C0\u67EC\u78B1\u7877\u62E3\u6361\u7B80\u4FED\u526A\u51CF\u8350\u69DB\u9274\u8DF5\u8D31\u89C1\u952E\u7BAD\u4EF6"],
      ["bd40", "\u7D37", 54, "\u7D6F", 7],
      ["bd80", "\u7D78", 32, "\u5065\u8230\u5251\u996F\u6E10\u6E85\u6DA7\u5EFA\u50F5\u59DC\u5C06\u6D46\u6C5F\u7586\u848B\u6868\u5956\u8BB2\u5320\u9171\u964D\u8549\u6912\u7901\u7126\u80F6\u4EA4\u90CA\u6D47\u9A84\u5A07\u56BC\u6405\u94F0\u77EB\u4FA5\u811A\u72E1\u89D2\u997A\u7F34\u7EDE\u527F\u6559\u9175\u8F7F\u8F83\u53EB\u7A96\u63ED\u63A5\u7686\u79F8\u8857\u9636\u622A\u52AB\u8282\u6854\u6770\u6377\u776B\u7AED\u6D01\u7ED3\u89E3\u59D0\u6212\u85C9\u82A5\u754C\u501F\u4ECB\u75A5\u8BEB\u5C4A\u5DFE\u7B4B\u65A4\u91D1\u4ECA\u6D25\u895F\u7D27\u9526\u4EC5\u8C28\u8FDB\u9773\u664B\u7981\u8FD1\u70EC\u6D78"],
      ["be40", "\u7D99", 12, "\u7DA7", 6, "\u7DAF", 42],
      ["be80", "\u7DDA", 32, "\u5C3D\u52B2\u8346\u5162\u830E\u775B\u6676\u9CB8\u4EAC\u60CA\u7CBE\u7CB3\u7ECF\u4E95\u8B66\u666F\u9888\u9759\u5883\u656C\u955C\u5F84\u75C9\u9756\u7ADF\u7ADE\u51C0\u70AF\u7A98\u63EA\u7A76\u7EA0\u7396\u97ED\u4E45\u7078\u4E5D\u9152\u53A9\u6551\u65E7\u81FC\u8205\u548E\u5C31\u759A\u97A0\u62D8\u72D9\u75BD\u5C45\u9A79\u83CA\u5C40\u5480\u77E9\u4E3E\u6CAE\u805A\u62D2\u636E\u5DE8\u5177\u8DDD\u8E1E\u952F\u4FF1\u53E5\u60E7\u70AC\u5267\u6350\u9E43\u5A1F\u5026\u7737\u5377\u7EE2\u6485\u652B\u6289\u6398\u5014\u7235\u89C9\u51B3\u8BC0\u7EDD\u5747\u83CC\u94A7\u519B\u541B\u5CFB"],
      ["bf40", "\u7DFB", 62],
      ["bf80", "\u7E3A\u7E3C", 4, "\u7E42", 4, "\u7E48", 21, "\u4FCA\u7AE3\u6D5A\u90E1\u9A8F\u5580\u5496\u5361\u54AF\u5F00\u63E9\u6977\u51EF\u6168\u520A\u582A\u52D8\u574E\u780D\u770B\u5EB7\u6177\u7CE0\u625B\u6297\u4EA2\u7095\u8003\u62F7\u70E4\u9760\u5777\u82DB\u67EF\u68F5\u78D5\u9897\u79D1\u58F3\u54B3\u53EF\u6E34\u514B\u523B\u5BA2\u8BFE\u80AF\u5543\u57A6\u6073\u5751\u542D\u7A7A\u6050\u5B54\u63A7\u62A0\u53E3\u6263\u5BC7\u67AF\u54ED\u7A9F\u82E6\u9177\u5E93\u88E4\u5938\u57AE\u630E\u8DE8\u80EF\u5757\u7B77\u4FA9\u5FEB\u5BBD\u6B3E\u5321\u7B50\u72C2\u6846\u77FF\u7736\u65F7\u51B5\u4E8F\u76D4\u5CBF\u7AA5\u8475\u594E\u9B41\u5080"],
      ["c040", "\u7E5E", 35, "\u7E83", 23, "\u7E9C\u7E9D\u7E9E"],
      ["c080", "\u7EAE\u7EB4\u7EBB\u7EBC\u7ED6\u7EE4\u7EEC\u7EF9\u7F0A\u7F10\u7F1E\u7F37\u7F39\u7F3B", 6, "\u7F43\u7F46", 9, "\u7F52\u7F53\u9988\u6127\u6E83\u5764\u6606\u6346\u56F0\u62EC\u6269\u5ED3\u9614\u5783\u62C9\u5587\u8721\u814A\u8FA3\u5566\u83B1\u6765\u8D56\u84DD\u5A6A\u680F\u62E6\u7BEE\u9611\u5170\u6F9C\u8C30\u63FD\u89C8\u61D2\u7F06\u70C2\u6EE5\u7405\u6994\u72FC\u5ECA\u90CE\u6717\u6D6A\u635E\u52B3\u7262\u8001\u4F6C\u59E5\u916A\u70D9\u6D9D\u52D2\u4E50\u96F7\u956D\u857E\u78CA\u7D2F\u5121\u5792\u64C2\u808B\u7C7B\u6CEA\u68F1\u695E\u51B7\u5398\u68A8\u7281\u9ECE\u7BF1\u72F8\u79BB\u6F13\u7406\u674E\u91CC\u9CA4\u793C\u8389\u8354\u540F\u6817\u4E3D\u5389\u52B1\u783E\u5386\u5229\u5088\u4F8B\u4FD0"],
      ["c140", "\u7F56\u7F59\u7F5B\u7F5C\u7F5D\u7F5E\u7F60\u7F63", 4, "\u7F6B\u7F6C\u7F6D\u7F6F\u7F70\u7F73\u7F75\u7F76\u7F77\u7F78\u7F7A\u7F7B\u7F7C\u7F7D\u7F7F\u7F80\u7F82", 7, "\u7F8B\u7F8D\u7F8F", 4, "\u7F95", 4, "\u7F9B\u7F9C\u7FA0\u7FA2\u7FA3\u7FA5\u7FA6\u7FA8", 6, "\u7FB1"],
      ["c180", "\u7FB3", 4, "\u7FBA\u7FBB\u7FBE\u7FC0\u7FC2\u7FC3\u7FC4\u7FC6\u7FC7\u7FC8\u7FC9\u7FCB\u7FCD\u7FCF", 4, "\u7FD6\u7FD7\u7FD9", 5, "\u7FE2\u7FE3\u75E2\u7ACB\u7C92\u6CA5\u96B6\u529B\u7483\u54E9\u4FE9\u8054\u83B2\u8FDE\u9570\u5EC9\u601C\u6D9F\u5E18\u655B\u8138\u94FE\u604B\u70BC\u7EC3\u7CAE\u51C9\u6881\u7CB1\u826F\u4E24\u8F86\u91CF\u667E\u4EAE\u8C05\u64A9\u804A\u50DA\u7597\u71CE\u5BE5\u8FBD\u6F66\u4E86\u6482\u9563\u5ED6\u6599\u5217\u88C2\u70C8\u52A3\u730E\u7433\u6797\u78F7\u9716\u4E34\u90BB\u9CDE\u6DCB\u51DB\u8D41\u541D\u62CE\u73B2\u83F1\u96F6\u9F84\u94C3\u4F36\u7F9A\u51CC\u7075\u9675\u5CAD\u9886\u53E6\u4EE4\u6E9C\u7409\u69B4\u786B\u998F\u7559\u5218\u7624\u6D41\u67F3\u516D\u9F99\u804B\u5499\u7B3C\u7ABF"],
      ["c240", "\u7FE4\u7FE7\u7FE8\u7FEA\u7FEB\u7FEC\u7FED\u7FEF\u7FF2\u7FF4", 6, "\u7FFD\u7FFE\u7FFF\u8002\u8007\u8008\u8009\u800A\u800E\u800F\u8011\u8013\u801A\u801B\u801D\u801E\u801F\u8021\u8023\u8024\u802B", 5, "\u8032\u8034\u8039\u803A\u803C\u803E\u8040\u8041\u8044\u8045\u8047\u8048\u8049\u804E\u804F\u8050\u8051\u8053\u8055\u8056\u8057"],
      ["c280", "\u8059\u805B", 13, "\u806B", 5, "\u8072", 11, "\u9686\u5784\u62E2\u9647\u697C\u5A04\u6402\u7BD3\u6F0F\u964B\u82A6\u5362\u9885\u5E90\u7089\u63B3\u5364\u864F\u9C81\u9E93\u788C\u9732\u8DEF\u8D42\u9E7F\u6F5E\u7984\u5F55\u9646\u622E\u9A74\u5415\u94DD\u4FA3\u65C5\u5C65\u5C61\u7F15\u8651\u6C2F\u5F8B\u7387\u6EE4\u7EFF\u5CE6\u631B\u5B6A\u6EE6\u5375\u4E71\u63A0\u7565\u62A1\u8F6E\u4F26\u4ED1\u6CA6\u7EB6\u8BBA\u841D\u87BA\u7F57\u903B\u9523\u7BA9\u9AA1\u88F8\u843D\u6D1B\u9A86\u7EDC\u5988\u9EBB\u739B\u7801\u8682\u9A6C\u9A82\u561B\u5417\u57CB\u4E70\u9EA6\u5356\u8FC8\u8109\u7792\u9992\u86EE\u6EE1\u8513\u66FC\u6162\u6F2B"],
      ["c340", "\u807E\u8081\u8082\u8085\u8088\u808A\u808D", 5, "\u8094\u8095\u8097\u8099\u809E\u80A3\u80A6\u80A7\u80A8\u80AC\u80B0\u80B3\u80B5\u80B6\u80B8\u80B9\u80BB\u80C5\u80C7", 4, "\u80CF", 6, "\u80D8\u80DF\u80E0\u80E2\u80E3\u80E6\u80EE\u80F5\u80F7\u80F9\u80FB\u80FE\u80FF\u8100\u8101\u8103\u8104\u8105\u8107\u8108\u810B"],
      ["c380", "\u810C\u8115\u8117\u8119\u811B\u811C\u811D\u811F", 12, "\u812D\u812E\u8130\u8133\u8134\u8135\u8137\u8139", 4, "\u813F\u8C29\u8292\u832B\u76F2\u6C13\u5FD9\u83BD\u732B\u8305\u951A\u6BDB\u77DB\u94C6\u536F\u8302\u5192\u5E3D\u8C8C\u8D38\u4E48\u73AB\u679A\u6885\u9176\u9709\u7164\u6CA1\u7709\u5A92\u9541\u6BCF\u7F8E\u6627\u5BD0\u59B9\u5A9A\u95E8\u95F7\u4EEC\u840C\u8499\u6AAC\u76DF\u9530\u731B\u68A6\u5B5F\u772F\u919A\u9761\u7CDC\u8FF7\u8C1C\u5F25\u7C73\u79D8\u89C5\u6CCC\u871C\u5BC6\u5E42\u68C9\u7720\u7EF5\u5195\u514D\u52C9\u5A29\u7F05\u9762\u82D7\u63CF\u7784\u85D0\u79D2\u6E3A\u5E99\u5999\u8511\u706D\u6C11\u62BF\u76BF\u654F\u60AF\u95FD\u660E\u879F\u9E23\u94ED\u540D\u547D\u8C2C\u6478"],
      ["c440", "\u8140", 5, "\u8147\u8149\u814D\u814E\u814F\u8152\u8156\u8157\u8158\u815B", 4, "\u8161\u8162\u8163\u8164\u8166\u8168\u816A\u816B\u816C\u816F\u8172\u8173\u8175\u8176\u8177\u8178\u8181\u8183", 4, "\u8189\u818B\u818C\u818D\u818E\u8190\u8192", 5, "\u8199\u819A\u819E", 4, "\u81A4\u81A5"],
      ["c480", "\u81A7\u81A9\u81AB", 7, "\u81B4", 5, "\u81BC\u81BD\u81BE\u81BF\u81C4\u81C5\u81C7\u81C8\u81C9\u81CB\u81CD", 6, "\u6479\u8611\u6A21\u819C\u78E8\u6469\u9B54\u62B9\u672B\u83AB\u58A8\u9ED8\u6CAB\u6F20\u5BDE\u964C\u8C0B\u725F\u67D0\u62C7\u7261\u4EA9\u59C6\u6BCD\u5893\u66AE\u5E55\u52DF\u6155\u6728\u76EE\u7766\u7267\u7A46\u62FF\u54EA\u5450\u94A0\u90A3\u5A1C\u7EB3\u6C16\u4E43\u5976\u8010\u5948\u5357\u7537\u96BE\u56CA\u6320\u8111\u607C\u95F9\u6DD6\u5462\u9981\u5185\u5AE9\u80FD\u59AE\u9713\u502A\u6CE5\u5C3C\u62DF\u4F60\u533F\u817B\u9006\u6EBA\u852B\u62C8\u5E74\u78BE\u64B5\u637B\u5FF5\u5A18\u917F\u9E1F\u5C3F\u634F\u8042\u5B7D\u556E\u954A\u954D\u6D85\u60A8\u67E0\u72DE\u51DD\u5B81"],
      ["c540", "\u81D4", 14, "\u81E4\u81E5\u81E6\u81E8\u81E9\u81EB\u81EE", 4, "\u81F5", 5, "\u81FD\u81FF\u8203\u8207", 4, "\u820E\u820F\u8211\u8213\u8215", 5, "\u821D\u8220\u8224\u8225\u8226\u8227\u8229\u822E\u8232\u823A\u823C\u823D\u823F"],
      ["c580", "\u8240\u8241\u8242\u8243\u8245\u8246\u8248\u824A\u824C\u824D\u824E\u8250", 7, "\u8259\u825B\u825C\u825D\u825E\u8260", 7, "\u8269\u62E7\u6CDE\u725B\u626D\u94AE\u7EBD\u8113\u6D53\u519C\u5F04\u5974\u52AA\u6012\u5973\u6696\u8650\u759F\u632A\u61E6\u7CEF\u8BFA\u54E6\u6B27\u9E25\u6BB4\u85D5\u5455\u5076\u6CA4\u556A\u8DB4\u722C\u5E15\u6015\u7436\u62CD\u6392\u724C\u5F98\u6E43\u6D3E\u6500\u6F58\u76D8\u78D0\u76FC\u7554\u5224\u53DB\u4E53\u5E9E\u65C1\u802A\u80D6\u629B\u5486\u5228\u70AE\u888D\u8DD1\u6CE1\u5478\u80DA\u57F9\u88F4\u8D54\u966A\u914D\u4F69\u6C9B\u55B7\u76C6\u7830\u62A8\u70F9\u6F8E\u5F6D\u84EC\u68DA\u787C\u7BF7\u81A8\u670B\u9E4F\u6367\u78B0\u576F\u7812\u9739\u6279\u62AB\u5288\u7435\u6BD7"],
      ["c640", "\u826A\u826B\u826C\u826D\u8271\u8275\u8276\u8277\u8278\u827B\u827C\u8280\u8281\u8283\u8285\u8286\u8287\u8289\u828C\u8290\u8293\u8294\u8295\u8296\u829A\u829B\u829E\u82A0\u82A2\u82A3\u82A7\u82B2\u82B5\u82B6\u82BA\u82BB\u82BC\u82BF\u82C0\u82C2\u82C3\u82C5\u82C6\u82C9\u82D0\u82D6\u82D9\u82DA\u82DD\u82E2\u82E7\u82E8\u82E9\u82EA\u82EC\u82ED\u82EE\u82F0\u82F2\u82F3\u82F5\u82F6\u82F8"],
      ["c680", "\u82FA\u82FC", 4, "\u830A\u830B\u830D\u8310\u8312\u8313\u8316\u8318\u8319\u831D", 9, "\u8329\u832A\u832E\u8330\u8332\u8337\u833B\u833D\u5564\u813E\u75B2\u76AE\u5339\u75DE\u50FB\u5C41\u8B6C\u7BC7\u504F\u7247\u9A97\u98D8\u6F02\u74E2\u7968\u6487\u77A5\u62FC\u9891\u8D2B\u54C1\u8058\u4E52\u576A\u82F9\u840D\u5E73\u51ED\u74F6\u8BC4\u5C4F\u5761\u6CFC\u9887\u5A46\u7834\u9B44\u8FEB\u7C95\u5256\u6251\u94FA\u4EC6\u8386\u8461\u83E9\u84B2\u57D4\u6734\u5703\u666E\u6D66\u8C31\u66DD\u7011\u671F\u6B3A\u6816\u621A\u59BB\u4E03\u51C4\u6F06\u67D2\u6C8F\u5176\u68CB\u5947\u6B67\u7566\u5D0E\u8110\u9F50\u65D7\u7948\u7941\u9A91\u8D77\u5C82\u4E5E\u4F01\u542F\u5951\u780C\u5668\u6C14\u8FC4\u5F03\u6C7D\u6CE3\u8BAB\u6390"],
      ["c740", "\u833E\u833F\u8341\u8342\u8344\u8345\u8348\u834A", 4, "\u8353\u8355", 4, "\u835D\u8362\u8370", 6, "\u8379\u837A\u837E", 6, "\u8387\u8388\u838A\u838B\u838C\u838D\u838F\u8390\u8391\u8394\u8395\u8396\u8397\u8399\u839A\u839D\u839F\u83A1", 6, "\u83AC\u83AD\u83AE"],
      ["c780", "\u83AF\u83B5\u83BB\u83BE\u83BF\u83C2\u83C3\u83C4\u83C6\u83C8\u83C9\u83CB\u83CD\u83CE\u83D0\u83D1\u83D2\u83D3\u83D5\u83D7\u83D9\u83DA\u83DB\u83DE\u83E2\u83E3\u83E4\u83E6\u83E7\u83E8\u83EB\u83EC\u83ED\u6070\u6D3D\u7275\u6266\u948E\u94C5\u5343\u8FC1\u7B7E\u4EDF\u8C26\u4E7E\u9ED4\u94B1\u94B3\u524D\u6F5C\u9063\u6D45\u8C34\u5811\u5D4C\u6B20\u6B49\u67AA\u545B\u8154\u7F8C\u5899\u8537\u5F3A\u62A2\u6A47\u9539\u6572\u6084\u6865\u77A7\u4E54\u4FA8\u5DE7\u9798\u64AC\u7FD8\u5CED\u4FCF\u7A8D\u5207\u8304\u4E14\u602F\u7A83\u94A6\u4FB5\u4EB2\u79E6\u7434\u52E4\u82B9\u64D2\u79BD\u5BDD\u6C81\u9752\u8F7B\u6C22\u503E\u537F\u6E05\u64CE\u6674\u6C30\u60C5\u9877\u8BF7\u5E86\u743C\u7A77\u79CB\u4E18\u90B1\u7403\u6C42\u56DA\u914B\u6CC5\u8D8B\u533A\u86C6\u66F2\u8EAF\u5C48\u9A71\u6E20"],
      ["c840", "\u83EE\u83EF\u83F3", 4, "\u83FA\u83FB\u83FC\u83FE\u83FF\u8400\u8402\u8405\u8407\u8408\u8409\u840A\u8410\u8412", 5, "\u8419\u841A\u841B\u841E", 5, "\u8429", 7, "\u8432", 5, "\u8439\u843A\u843B\u843E", 7, "\u8447\u8448\u8449"],
      ["c880", "\u844A", 6, "\u8452", 4, "\u8458\u845D\u845E\u845F\u8460\u8462\u8464", 4, "\u846A\u846E\u846F\u8470\u8472\u8474\u8477\u8479\u847B\u847C\u53D6\u5A36\u9F8B\u8DA3\u53BB\u5708\u98A7\u6743\u919B\u6CC9\u5168\u75CA\u62F3\u72AC\u5238\u529D\u7F3A\u7094\u7638\u5374\u9E4A\u69B7\u786E\u96C0\u88D9\u7FA4\u7136\u71C3\u5189\u67D3\u74E4\u58E4\u6518\u56B7\u8BA9\u9976\u6270\u7ED5\u60F9\u70ED\u58EC\u4EC1\u4EBA\u5FCD\u97E7\u4EFB\u8BA4\u5203\u598A\u7EAB\u6254\u4ECD\u65E5\u620E\u8338\u84C9\u8363\u878D\u7194\u6EB6\u5BB9\u7ED2\u5197\u63C9\u67D4\u8089\u8339\u8815\u5112\u5B7A\u5982\u8FB1\u4E73\u6C5D\u5165\u8925\u8F6F\u962E\u854A\u745E\u9510\u95F0\u6DA6\u82E5\u5F31\u6492\u6D12\u8428\u816E\u9CC3\u585E\u8D5B\u4E09\u53C1"],
      ["c940", "\u847D", 4, "\u8483\u8484\u8485\u8486\u848A\u848D\u848F", 7, "\u8498\u849A\u849B\u849D\u849E\u849F\u84A0\u84A2", 12, "\u84B0\u84B1\u84B3\u84B5\u84B6\u84B7\u84BB\u84BC\u84BE\u84C0\u84C2\u84C3\u84C5\u84C6\u84C7\u84C8\u84CB\u84CC\u84CE\u84CF\u84D2\u84D4\u84D5\u84D7"],
      ["c980", "\u84D8", 4, "\u84DE\u84E1\u84E2\u84E4\u84E7", 4, "\u84ED\u84EE\u84EF\u84F1", 10, "\u84FD\u84FE\u8500\u8501\u8502\u4F1E\u6563\u6851\u55D3\u4E27\u6414\u9A9A\u626B\u5AC2\u745F\u8272\u6DA9\u68EE\u50E7\u838E\u7802\u6740\u5239\u6C99\u7EB1\u50BB\u5565\u715E\u7B5B\u6652\u73CA\u82EB\u6749\u5C71\u5220\u717D\u886B\u95EA\u9655\u64C5\u8D61\u81B3\u5584\u6C55\u6247\u7F2E\u5892\u4F24\u5546\u8D4F\u664C\u4E0A\u5C1A\u88F3\u68A2\u634E\u7A0D\u70E7\u828D\u52FA\u97F6\u5C11\u54E8\u90B5\u7ECD\u5962\u8D4A\u86C7\u820C\u820D\u8D66\u6444\u5C04\u6151\u6D89\u793E\u8BBE\u7837\u7533\u547B\u4F38\u8EAB\u6DF1\u5A20\u7EC5\u795E\u6C88\u5BA1\u5A76\u751A\u80BE\u614E\u6E17\u58F0\u751F\u7525\u7272\u5347\u7EF3"],
      ["ca40", "\u8503", 8, "\u850D\u850E\u850F\u8510\u8512\u8514\u8515\u8516\u8518\u8519\u851B\u851C\u851D\u851E\u8520\u8522", 8, "\u852D", 9, "\u853E", 4, "\u8544\u8545\u8546\u8547\u854B", 10],
      ["ca80", "\u8557\u8558\u855A\u855B\u855C\u855D\u855F", 4, "\u8565\u8566\u8567\u8569", 8, "\u8573\u8575\u8576\u8577\u8578\u857C\u857D\u857F\u8580\u8581\u7701\u76DB\u5269\u80DC\u5723\u5E08\u5931\u72EE\u65BD\u6E7F\u8BD7\u5C38\u8671\u5341\u77F3\u62FE\u65F6\u4EC0\u98DF\u8680\u5B9E\u8BC6\u53F2\u77E2\u4F7F\u5C4E\u9A76\u59CB\u5F0F\u793A\u58EB\u4E16\u67FF\u4E8B\u62ED\u8A93\u901D\u52BF\u662F\u55DC\u566C\u9002\u4ED5\u4F8D\u91CA\u9970\u6C0F\u5E02\u6043\u5BA4\u89C6\u8BD5\u6536\u624B\u9996\u5B88\u5BFF\u6388\u552E\u53D7\u7626\u517D\u852C\u67A2\u68B3\u6B8A\u6292\u8F93\u53D4\u8212\u6DD1\u758F\u4E66\u8D4E\u5B70\u719F\u85AF\u6691\u66D9\u7F72\u8700\u9ECD\u9F20\u5C5E\u672F\u8FF0\u6811\u675F\u620D\u7AD6\u5885\u5EB6\u6570\u6F31"],
      ["cb40", "\u8582\u8583\u8586\u8588", 6, "\u8590", 10, "\u859D", 6, "\u85A5\u85A6\u85A7\u85A9\u85AB\u85AC\u85AD\u85B1", 5, "\u85B8\u85BA", 6, "\u85C2", 6, "\u85CA", 4, "\u85D1\u85D2"],
      ["cb80", "\u85D4\u85D6", 5, "\u85DD", 6, "\u85E5\u85E6\u85E7\u85E8\u85EA", 14, "\u6055\u5237\u800D\u6454\u8870\u7529\u5E05\u6813\u62F4\u971C\u53CC\u723D\u8C01\u6C34\u7761\u7A0E\u542E\u77AC\u987A\u821C\u8BF4\u7855\u6714\u70C1\u65AF\u6495\u5636\u601D\u79C1\u53F8\u4E1D\u6B7B\u8086\u5BFA\u55E3\u56DB\u4F3A\u4F3C\u9972\u5DF3\u677E\u8038\u6002\u9882\u9001\u5B8B\u8BBC\u8BF5\u641C\u8258\u64DE\u55FD\u82CF\u9165\u4FD7\u7D20\u901F\u7C9F\u50F3\u5851\u6EAF\u5BBF\u8BC9\u8083\u9178\u849C\u7B97\u867D\u968B\u968F\u7EE5\u9AD3\u788E\u5C81\u7A57\u9042\u96A7\u795F\u5B59\u635F\u7B0B\u84D1\u68AD\u5506\u7F29\u7410\u7D22\u9501\u6240\u584C\u4ED6\u5B83\u5979\u5854"],
      ["cc40", "\u85F9\u85FA\u85FC\u85FD\u85FE\u8600", 4, "\u8606", 10, "\u8612\u8613\u8614\u8615\u8617", 15, "\u8628\u862A", 13, "\u8639\u863A\u863B\u863D\u863E\u863F\u8640"],
      ["cc80", "\u8641", 11, "\u8652\u8653\u8655", 4, "\u865B\u865C\u865D\u865F\u8660\u8661\u8663", 7, "\u736D\u631E\u8E4B\u8E0F\u80CE\u82D4\u62AC\u53F0\u6CF0\u915E\u592A\u6001\u6C70\u574D\u644A\u8D2A\u762B\u6EE9\u575B\u6A80\u75F0\u6F6D\u8C2D\u8C08\u5766\u6BEF\u8892\u78B3\u63A2\u53F9\u70AD\u6C64\u5858\u642A\u5802\u68E0\u819B\u5510\u7CD6\u5018\u8EBA\u6DCC\u8D9F\u70EB\u638F\u6D9B\u6ED4\u7EE6\u8404\u6843\u9003\u6DD8\u9676\u8BA8\u5957\u7279\u85E4\u817E\u75BC\u8A8A\u68AF\u5254\u8E22\u9511\u63D0\u9898\u8E44\u557C\u4F53\u66FF\u568F\u60D5\u6D95\u5243\u5C49\u5929\u6DFB\u586B\u7530\u751C\u606C\u8214\u8146\u6311\u6761\u8FE2\u773A\u8DF3\u8D34\u94C1\u5E16\u5385\u542C\u70C3"],
      ["cd40", "\u866D\u866F\u8670\u8672", 6, "\u8683", 6, "\u868E", 4, "\u8694\u8696", 5, "\u869E", 4, "\u86A5\u86A6\u86AB\u86AD\u86AE\u86B2\u86B3\u86B7\u86B8\u86B9\u86BB", 4, "\u86C1\u86C2\u86C3\u86C5\u86C8\u86CC\u86CD\u86D2\u86D3\u86D5\u86D6\u86D7\u86DA\u86DC"],
      ["cd80", "\u86DD\u86E0\u86E1\u86E2\u86E3\u86E5\u86E6\u86E7\u86E8\u86EA\u86EB\u86EC\u86EF\u86F5\u86F6\u86F7\u86FA\u86FB\u86FC\u86FD\u86FF\u8701\u8704\u8705\u8706\u870B\u870C\u870E\u870F\u8710\u8711\u8714\u8716\u6C40\u5EF7\u505C\u4EAD\u5EAD\u633A\u8247\u901A\u6850\u916E\u77B3\u540C\u94DC\u5F64\u7AE5\u6876\u6345\u7B52\u7EDF\u75DB\u5077\u6295\u5934\u900F\u51F8\u79C3\u7A81\u56FE\u5F92\u9014\u6D82\u5C60\u571F\u5410\u5154\u6E4D\u56E2\u63A8\u9893\u817F\u8715\u892A\u9000\u541E\u5C6F\u81C0\u62D6\u6258\u8131\u9E35\u9640\u9A6E\u9A7C\u692D\u59A5\u62D3\u553E\u6316\u54C7\u86D9\u6D3C\u5A03\u74E6\u889C\u6B6A\u5916\u8C4C\u5F2F\u6E7E\u73A9\u987D\u4E38\u70F7\u5B8C\u7897\u633D\u665A\u7696\u60CB\u5B9B\u5A49\u4E07\u8155\u6C6A\u738B\u4EA1\u6789\u7F51\u5F80\u65FA\u671B\u5FD8\u5984\u5A01"],
      ["ce40", "\u8719\u871B\u871D\u871F\u8720\u8724\u8726\u8727\u8728\u872A\u872B\u872C\u872D\u872F\u8730\u8732\u8733\u8735\u8736\u8738\u8739\u873A\u873C\u873D\u8740", 6, "\u874A\u874B\u874D\u874F\u8750\u8751\u8752\u8754\u8755\u8756\u8758\u875A", 5, "\u8761\u8762\u8766", 7, "\u876F\u8771\u8772\u8773\u8775"],
      ["ce80", "\u8777\u8778\u8779\u877A\u877F\u8780\u8781\u8784\u8786\u8787\u8789\u878A\u878C\u878E", 4, "\u8794\u8795\u8796\u8798", 6, "\u87A0", 4, "\u5DCD\u5FAE\u5371\u97E6\u8FDD\u6845\u56F4\u552F\u60DF\u4E3A\u6F4D\u7EF4\u82C7\u840E\u59D4\u4F1F\u4F2A\u5C3E\u7EAC\u672A\u851A\u5473\u754F\u80C3\u5582\u9B4F\u4F4D\u6E2D\u8C13\u5C09\u6170\u536B\u761F\u6E29\u868A\u6587\u95FB\u7EB9\u543B\u7A33\u7D0A\u95EE\u55E1\u7FC1\u74EE\u631D\u8717\u6DA1\u7A9D\u6211\u65A1\u5367\u63E1\u6C83\u5DEB\u545C\u94A8\u4E4C\u6C61\u8BEC\u5C4B\u65E0\u829C\u68A7\u543E\u5434\u6BCB\u6B66\u4E94\u6342\u5348\u821E\u4F0D\u4FAE\u575E\u620A\u96FE\u6664\u7269\u52FF\u52A1\u609F\u8BEF\u6614\u7199\u6790\u897F\u7852\u77FD\u6670\u563B\u5438\u9521\u727A"],
      ["cf40", "\u87A5\u87A6\u87A7\u87A9\u87AA\u87AE\u87B0\u87B1\u87B2\u87B4\u87B6\u87B7\u87B8\u87B9\u87BB\u87BC\u87BE\u87BF\u87C1", 4, "\u87C7\u87C8\u87C9\u87CC", 4, "\u87D4", 6, "\u87DC\u87DD\u87DE\u87DF\u87E1\u87E2\u87E3\u87E4\u87E6\u87E7\u87E8\u87E9\u87EB\u87EC\u87ED\u87EF", 9],
      ["cf80", "\u87FA\u87FB\u87FC\u87FD\u87FF\u8800\u8801\u8802\u8804", 5, "\u880B", 7, "\u8814\u8817\u8818\u8819\u881A\u881C", 4, "\u8823\u7A00\u606F\u5E0C\u6089\u819D\u5915\u60DC\u7184\u70EF\u6EAA\u6C50\u7280\u6A84\u88AD\u5E2D\u4E60\u5AB3\u559C\u94E3\u6D17\u7CFB\u9699\u620F\u7EC6\u778E\u867E\u5323\u971E\u8F96\u6687\u5CE1\u4FA0\u72ED\u4E0B\u53A6\u590F\u5413\u6380\u9528\u5148\u4ED9\u9C9C\u7EA4\u54B8\u8D24\u8854\u8237\u95F2\u6D8E\u5F26\u5ACC\u663E\u9669\u73B0\u732E\u53BF\u817A\u9985\u7FA1\u5BAA\u9677\u9650\u7EBF\u76F8\u53A2\u9576\u9999\u7BB1\u8944\u6E58\u4E61\u7FD4\u7965\u8BE6\u60F3\u54CD\u4EAB\u9879\u5DF7\u6A61\u50CF\u5411\u8C61\u8427\u785D\u9704\u524A\u54EE\u56A3\u9500\u6D88\u5BB5\u6DC6\u6653"],
      ["d040", "\u8824", 13, "\u8833", 5, "\u883A\u883B\u883D\u883E\u883F\u8841\u8842\u8843\u8846", 5, "\u884E", 5, "\u8855\u8856\u8858\u885A", 6, "\u8866\u8867\u886A\u886D\u886F\u8871\u8873\u8874\u8875\u8876\u8878\u8879\u887A"],
      ["d080", "\u887B\u887C\u8880\u8883\u8886\u8887\u8889\u888A\u888C\u888E\u888F\u8890\u8891\u8893\u8894\u8895\u8897", 4, "\u889D", 4, "\u88A3\u88A5", 5, "\u5C0F\u5B5D\u6821\u8096\u5578\u7B11\u6548\u6954\u4E9B\u6B47\u874E\u978B\u534F\u631F\u643A\u90AA\u659C\u80C1\u8C10\u5199\u68B0\u5378\u87F9\u61C8\u6CC4\u6CFB\u8C22\u5C51\u85AA\u82AF\u950C\u6B23\u8F9B\u65B0\u5FFB\u5FC3\u4FE1\u8845\u661F\u8165\u7329\u60FA\u5174\u5211\u578B\u5F62\u90A2\u884C\u9192\u5E78\u674F\u6027\u59D3\u5144\u51F6\u80F8\u5308\u6C79\u96C4\u718A\u4F11\u4FEE\u7F9E\u673D\u55C5\u9508\u79C0\u8896\u7EE3\u589F\u620C\u9700\u865A\u5618\u987B\u5F90\u8BB8\u84C4\u9157\u53D9\u65ED\u5E8F\u755C\u6064\u7D6E\u5A7F\u7EEA\u7EED\u8F69\u55A7\u5BA3\u60AC\u65CB\u7384"],
      ["d140", "\u88AC\u88AE\u88AF\u88B0\u88B2", 4, "\u88B8\u88B9\u88BA\u88BB\u88BD\u88BE\u88BF\u88C0\u88C3\u88C4\u88C7\u88C8\u88CA\u88CB\u88CC\u88CD\u88CF\u88D0\u88D1\u88D3\u88D6\u88D7\u88DA", 4, "\u88E0\u88E1\u88E6\u88E7\u88E9", 6, "\u88F2\u88F5\u88F6\u88F7\u88FA\u88FB\u88FD\u88FF\u8900\u8901\u8903", 5],
      ["d180", "\u8909\u890B", 4, "\u8911\u8914", 4, "\u891C", 4, "\u8922\u8923\u8924\u8926\u8927\u8928\u8929\u892C\u892D\u892E\u892F\u8931\u8932\u8933\u8935\u8937\u9009\u7663\u7729\u7EDA\u9774\u859B\u5B66\u7A74\u96EA\u8840\u52CB\u718F\u5FAA\u65EC\u8BE2\u5BFB\u9A6F\u5DE1\u6B89\u6C5B\u8BAD\u8BAF\u900A\u8FC5\u538B\u62BC\u9E26\u9E2D\u5440\u4E2B\u82BD\u7259\u869C\u5D16\u8859\u6DAF\u96C5\u54D1\u4E9A\u8BB6\u7109\u54BD\u9609\u70DF\u6DF9\u76D0\u4E25\u7814\u8712\u5CA9\u5EF6\u8A00\u989C\u960E\u708E\u6CBF\u5944\u63A9\u773C\u884D\u6F14\u8273\u5830\u71D5\u538C\u781A\u96C1\u5501\u5F66\u7130\u5BB4\u8C1A\u9A8C\u6B83\u592E\u9E2F\u79E7\u6768\u626C\u4F6F\u75A1\u7F8A\u6D0B\u9633\u6C27\u4EF0\u75D2\u517B\u6837\u6F3E\u9080\u8170\u5996\u7476"],
      ["d240", "\u8938", 8, "\u8942\u8943\u8945", 24, "\u8960", 5, "\u8967", 19, "\u897C"],
      ["d280", "\u897D\u897E\u8980\u8982\u8984\u8985\u8987", 26, "\u6447\u5C27\u9065\u7A91\u8C23\u59DA\u54AC\u8200\u836F\u8981\u8000\u6930\u564E\u8036\u7237\u91CE\u51B6\u4E5F\u9875\u6396\u4E1A\u53F6\u66F3\u814B\u591C\u6DB2\u4E00\u58F9\u533B\u63D6\u94F1\u4F9D\u4F0A\u8863\u9890\u5937\u9057\u79FB\u4EEA\u80F0\u7591\u6C82\u5B9C\u59E8\u5F5D\u6905\u8681\u501A\u5DF2\u4E59\u77E3\u4EE5\u827A\u6291\u6613\u9091\u5C79\u4EBF\u5F79\u81C6\u9038\u8084\u75AB\u4EA6\u88D4\u610F\u6BC5\u5FC6\u4E49\u76CA\u6EA2\u8BE3\u8BAE\u8C0A\u8BD1\u5F02\u7FFC\u7FCC\u7ECE\u8335\u836B\u56E0\u6BB7\u97F3\u9634\u59FB\u541F\u94F6\u6DEB\u5BC5\u996E\u5C39\u5F15\u9690"],
      ["d340", "\u89A2", 30, "\u89C3\u89CD\u89D3\u89D4\u89D5\u89D7\u89D8\u89D9\u89DB\u89DD\u89DF\u89E0\u89E1\u89E2\u89E4\u89E7\u89E8\u89E9\u89EA\u89EC\u89ED\u89EE\u89F0\u89F1\u89F2\u89F4", 6],
      ["d380", "\u89FB", 4, "\u8A01", 5, "\u8A08", 21, "\u5370\u82F1\u6A31\u5A74\u9E70\u5E94\u7F28\u83B9\u8424\u8425\u8367\u8747\u8FCE\u8D62\u76C8\u5F71\u9896\u786C\u6620\u54DF\u62E5\u4F63\u81C3\u75C8\u5EB8\u96CD\u8E0A\u86F9\u548F\u6CF3\u6D8C\u6C38\u607F\u52C7\u7528\u5E7D\u4F18\u60A0\u5FE7\u5C24\u7531\u90AE\u94C0\u72B9\u6CB9\u6E38\u9149\u6709\u53CB\u53F3\u4F51\u91C9\u8BF1\u53C8\u5E7C\u8FC2\u6DE4\u4E8E\u76C2\u6986\u865E\u611A\u8206\u4F59\u4FDE\u903E\u9C7C\u6109\u6E1D\u6E14\u9685\u4E88\u5A31\u96E8\u4E0E\u5C7F\u79B9\u5B87\u8BED\u7FBD\u7389\u57DF\u828B\u90C1\u5401\u9047\u55BB\u5CEA\u5FA1\u6108\u6B32\u72F1\u80B2\u8A89"],
      ["d440", "\u8A1E", 31, "\u8A3F", 8, "\u8A49", 21],
      ["d480", "\u8A5F", 25, "\u8A7A", 6, "\u6D74\u5BD3\u88D5\u9884\u8C6B\u9A6D\u9E33\u6E0A\u51A4\u5143\u57A3\u8881\u539F\u63F4\u8F95\u56ED\u5458\u5706\u733F\u6E90\u7F18\u8FDC\u82D1\u613F\u6028\u9662\u66F0\u7EA6\u8D8A\u8DC3\u94A5\u5CB3\u7CA4\u6708\u60A6\u9605\u8018\u4E91\u90E7\u5300\u9668\u5141\u8FD0\u8574\u915D\u6655\u97F5\u5B55\u531D\u7838\u6742\u683D\u54C9\u707E\u5BB0\u8F7D\u518D\u5728\u54B1\u6512\u6682\u8D5E\u8D43\u810F\u846C\u906D\u7CDF\u51FF\u85FB\u67A3\u65E9\u6FA1\u86A4\u8E81\u566A\u9020\u7682\u7076\u71E5\u8D23\u62E9\u5219\u6CFD\u8D3C\u600E\u589E\u618E\u66FE\u8D60\u624E\u55B3\u6E23\u672D\u8F67"],
      ["d540", "\u8A81", 7, "\u8A8B", 7, "\u8A94", 46],
      ["d580", "\u8AC3", 32, "\u94E1\u95F8\u7728\u6805\u69A8\u548B\u4E4D\u70B8\u8BC8\u6458\u658B\u5B85\u7A84\u503A\u5BE8\u77BB\u6BE1\u8A79\u7C98\u6CBE\u76CF\u65A9\u8F97\u5D2D\u5C55\u8638\u6808\u5360\u6218\u7AD9\u6E5B\u7EFD\u6A1F\u7AE0\u5F70\u6F33\u5F20\u638C\u6DA8\u6756\u4E08\u5E10\u8D26\u4ED7\u80C0\u7634\u969C\u62DB\u662D\u627E\u6CBC\u8D75\u7167\u7F69\u5146\u8087\u53EC\u906E\u6298\u54F2\u86F0\u8F99\u8005\u9517\u8517\u8FD9\u6D59\u73CD\u659F\u771F\u7504\u7827\u81FB\u8D1E\u9488\u4FA6\u6795\u75B9\u8BCA\u9707\u632F\u9547\u9635\u84B8\u6323\u7741\u5F81\u72F0\u4E89\u6014\u6574\u62EF\u6B63\u653F"],
      ["d640", "\u8AE4", 34, "\u8B08", 27],
      ["d680", "\u8B24\u8B25\u8B27", 30, "\u5E27\u75C7\u90D1\u8BC1\u829D\u679D\u652F\u5431\u8718\u77E5\u80A2\u8102\u6C41\u4E4B\u7EC7\u804C\u76F4\u690D\u6B96\u6267\u503C\u4F84\u5740\u6307\u6B62\u8DBE\u53EA\u65E8\u7EB8\u5FD7\u631A\u63B7\u81F3\u81F4\u7F6E\u5E1C\u5CD9\u5236\u667A\u79E9\u7A1A\u8D28\u7099\u75D4\u6EDE\u6CBB\u7A92\u4E2D\u76C5\u5FE0\u949F\u8877\u7EC8\u79CD\u80BF\u91CD\u4EF2\u4F17\u821F\u5468\u5DDE\u6D32\u8BCC\u7CA5\u8F74\u8098\u5E1A\u5492\u76B1\u5B99\u663C\u9AA4\u73E0\u682A\u86DB\u6731\u732A\u8BF8\u8BDB\u9010\u7AF9\u70DB\u716E\u62C4\u77A9\u5631\u4E3B\u8457\u67F1\u52A9\u86C0\u8D2E\u94F8\u7B51"],
      ["d740", "\u8B46", 31, "\u8B67", 4, "\u8B6D", 25],
      ["d780", "\u8B87", 24, "\u8BAC\u8BB1\u8BBB\u8BC7\u8BD0\u8BEA\u8C09\u8C1E\u4F4F\u6CE8\u795D\u9A7B\u6293\u722A\u62FD\u4E13\u7816\u8F6C\u64B0\u8D5A\u7BC6\u6869\u5E84\u88C5\u5986\u649E\u58EE\u72B6\u690E\u9525\u8FFD\u8D58\u5760\u7F00\u8C06\u51C6\u6349\u62D9\u5353\u684C\u7422\u8301\u914C\u5544\u7740\u707C\u6D4A\u5179\u54A8\u8D44\u59FF\u6ECB\u6DC4\u5B5C\u7D2B\u4ED4\u7C7D\u6ED3\u5B50\u81EA\u6E0D\u5B57\u9B03\u68D5\u8E2A\u5B97\u7EFC\u603B\u7EB5\u90B9\u8D70\u594F\u63CD\u79DF\u8DB3\u5352\u65CF\u7956\u8BC5\u963B\u7EC4\u94BB\u7E82\u5634\u9189\u6700\u7F6A\u5C0A\u9075\u6628\u5DE6\u4F50\u67DE\u505A\u4F5C\u5750\u5EA7"],
      ["d840", "\u8C38", 8, "\u8C42\u8C43\u8C44\u8C45\u8C48\u8C4A\u8C4B\u8C4D", 7, "\u8C56\u8C57\u8C58\u8C59\u8C5B", 5, "\u8C63", 6, "\u8C6C", 6, "\u8C74\u8C75\u8C76\u8C77\u8C7B", 6, "\u8C83\u8C84\u8C86\u8C87"],
      ["d880", "\u8C88\u8C8B\u8C8D", 6, "\u8C95\u8C96\u8C97\u8C99", 20, "\u4E8D\u4E0C\u5140\u4E10\u5EFF\u5345\u4E15\u4E98\u4E1E\u9B32\u5B6C\u5669\u4E28\u79BA\u4E3F\u5315\u4E47\u592D\u723B\u536E\u6C10\u56DF\u80E4\u9997\u6BD3\u777E\u9F17\u4E36\u4E9F\u9F10\u4E5C\u4E69\u4E93\u8288\u5B5B\u556C\u560F\u4EC4\u538D\u539D\u53A3\u53A5\u53AE\u9765\u8D5D\u531A\u53F5\u5326\u532E\u533E\u8D5C\u5366\u5363\u5202\u5208\u520E\u522D\u5233\u523F\u5240\u524C\u525E\u5261\u525C\u84AF\u527D\u5282\u5281\u5290\u5293\u5182\u7F54\u4EBB\u4EC3\u4EC9\u4EC2\u4EE8\u4EE1\u4EEB\u4EDE\u4F1B\u4EF3\u4F22\u4F64\u4EF5\u4F25\u4F27\u4F09\u4F2B\u4F5E\u4F67\u6538\u4F5A\u4F5D"],
      ["d940", "\u8CAE", 62],
      ["d980", "\u8CED", 32, "\u4F5F\u4F57\u4F32\u4F3D\u4F76\u4F74\u4F91\u4F89\u4F83\u4F8F\u4F7E\u4F7B\u4FAA\u4F7C\u4FAC\u4F94\u4FE6\u4FE8\u4FEA\u4FC5\u4FDA\u4FE3\u4FDC\u4FD1\u4FDF\u4FF8\u5029\u504C\u4FF3\u502C\u500F\u502E\u502D\u4FFE\u501C\u500C\u5025\u5028\u507E\u5043\u5055\u5048\u504E\u506C\u507B\u50A5\u50A7\u50A9\u50BA\u50D6\u5106\u50ED\u50EC\u50E6\u50EE\u5107\u510B\u4EDD\u6C3D\u4F58\u4F65\u4FCE\u9FA0\u6C46\u7C74\u516E\u5DFD\u9EC9\u9998\u5181\u5914\u52F9\u530D\u8A07\u5310\u51EB\u5919\u5155\u4EA0\u5156\u4EB3\u886E\u88A4\u4EB5\u8114\u88D2\u7980\u5B34\u8803\u7FB8\u51AB\u51B1\u51BD\u51BC"],
      ["da40", "\u8D0E", 14, "\u8D20\u8D51\u8D52\u8D57\u8D5F\u8D65\u8D68\u8D69\u8D6A\u8D6C\u8D6E\u8D6F\u8D71\u8D72\u8D78", 8, "\u8D82\u8D83\u8D86\u8D87\u8D88\u8D89\u8D8C", 4, "\u8D92\u8D93\u8D95", 9, "\u8DA0\u8DA1"],
      ["da80", "\u8DA2\u8DA4", 12, "\u8DB2\u8DB6\u8DB7\u8DB9\u8DBB\u8DBD\u8DC0\u8DC1\u8DC2\u8DC5\u8DC7\u8DC8\u8DC9\u8DCA\u8DCD\u8DD0\u8DD2\u8DD3\u8DD4\u51C7\u5196\u51A2\u51A5\u8BA0\u8BA6\u8BA7\u8BAA\u8BB4\u8BB5\u8BB7\u8BC2\u8BC3\u8BCB\u8BCF\u8BCE\u8BD2\u8BD3\u8BD4\u8BD6\u8BD8\u8BD9\u8BDC\u8BDF\u8BE0\u8BE4\u8BE8\u8BE9\u8BEE\u8BF0\u8BF3\u8BF6\u8BF9\u8BFC\u8BFF\u8C00\u8C02\u8C04\u8C07\u8C0C\u8C0F\u8C11\u8C12\u8C14\u8C15\u8C16\u8C19\u8C1B\u8C18\u8C1D\u8C1F\u8C20\u8C21\u8C25\u8C27\u8C2A\u8C2B\u8C2E\u8C2F\u8C32\u8C33\u8C35\u8C36\u5369\u537A\u961D\u9622\u9621\u9631\u962A\u963D\u963C\u9642\u9649\u9654\u965F\u9667\u966C\u9672\u9674\u9688\u968D\u9697\u96B0\u9097\u909B\u909D\u9099\u90AC\u90A1\u90B4\u90B3\u90B6\u90BA"],
      ["db40", "\u8DD5\u8DD8\u8DD9\u8DDC\u8DE0\u8DE1\u8DE2\u8DE5\u8DE6\u8DE7\u8DE9\u8DED\u8DEE\u8DF0\u8DF1\u8DF2\u8DF4\u8DF6\u8DFC\u8DFE", 6, "\u8E06\u8E07\u8E08\u8E0B\u8E0D\u8E0E\u8E10\u8E11\u8E12\u8E13\u8E15", 7, "\u8E20\u8E21\u8E24", 4, "\u8E2B\u8E2D\u8E30\u8E32\u8E33\u8E34\u8E36\u8E37\u8E38\u8E3B\u8E3C\u8E3E"],
      ["db80", "\u8E3F\u8E43\u8E45\u8E46\u8E4C", 4, "\u8E53", 5, "\u8E5A", 11, "\u8E67\u8E68\u8E6A\u8E6B\u8E6E\u8E71\u90B8\u90B0\u90CF\u90C5\u90BE\u90D0\u90C4\u90C7\u90D3\u90E6\u90E2\u90DC\u90D7\u90DB\u90EB\u90EF\u90FE\u9104\u9122\u911E\u9123\u9131\u912F\u9139\u9143\u9146\u520D\u5942\u52A2\u52AC\u52AD\u52BE\u54FF\u52D0\u52D6\u52F0\u53DF\u71EE\u77CD\u5EF4\u51F5\u51FC\u9B2F\u53B6\u5F01\u755A\u5DEF\u574C\u57A9\u57A1\u587E\u58BC\u58C5\u58D1\u5729\u572C\u572A\u5733\u5739\u572E\u572F\u575C\u573B\u5742\u5769\u5785\u576B\u5786\u577C\u577B\u5768\u576D\u5776\u5773\u57AD\u57A4\u578C\u57B2\u57CF\u57A7\u57B4\u5793\u57A0\u57D5\u57D8\u57DA\u57D9\u57D2\u57B8\u57F4\u57EF\u57F8\u57E4\u57DD"],
      ["dc40", "\u8E73\u8E75\u8E77", 4, "\u8E7D\u8E7E\u8E80\u8E82\u8E83\u8E84\u8E86\u8E88", 6, "\u8E91\u8E92\u8E93\u8E95", 6, "\u8E9D\u8E9F", 11, "\u8EAD\u8EAE\u8EB0\u8EB1\u8EB3", 6, "\u8EBB", 7],
      ["dc80", "\u8EC3", 10, "\u8ECF", 21, "\u580B\u580D\u57FD\u57ED\u5800\u581E\u5819\u5844\u5820\u5865\u586C\u5881\u5889\u589A\u5880\u99A8\u9F19\u61FF\u8279\u827D\u827F\u828F\u828A\u82A8\u8284\u828E\u8291\u8297\u8299\u82AB\u82B8\u82BE\u82B0\u82C8\u82CA\u82E3\u8298\u82B7\u82AE\u82CB\u82CC\u82C1\u82A9\u82B4\u82A1\u82AA\u829F\u82C4\u82CE\u82A4\u82E1\u8309\u82F7\u82E4\u830F\u8307\u82DC\u82F4\u82D2\u82D8\u830C\u82FB\u82D3\u8311\u831A\u8306\u8314\u8315\u82E0\u82D5\u831C\u8351\u835B\u835C\u8308\u8392\u833C\u8334\u8331\u839B\u835E\u832F\u834F\u8347\u8343\u835F\u8340\u8317\u8360\u832D\u833A\u8333\u8366\u8365"],
      ["dd40", "\u8EE5", 62],
      ["dd80", "\u8F24", 32, "\u8368\u831B\u8369\u836C\u836A\u836D\u836E\u83B0\u8378\u83B3\u83B4\u83A0\u83AA\u8393\u839C\u8385\u837C\u83B6\u83A9\u837D\u83B8\u837B\u8398\u839E\u83A8\u83BA\u83BC\u83C1\u8401\u83E5\u83D8\u5807\u8418\u840B\u83DD\u83FD\u83D6\u841C\u8438\u8411\u8406\u83D4\u83DF\u840F\u8403\u83F8\u83F9\u83EA\u83C5\u83C0\u8426\u83F0\u83E1\u845C\u8451\u845A\u8459\u8473\u8487\u8488\u847A\u8489\u8478\u843C\u8446\u8469\u8476\u848C\u848E\u8431\u846D\u84C1\u84CD\u84D0\u84E6\u84BD\u84D3\u84CA\u84BF\u84BA\u84E0\u84A1\u84B9\u84B4\u8497\u84E5\u84E3\u850C\u750D\u8538\u84F0\u8539\u851F\u853A"],
      ["de40", "\u8F45", 32, "\u8F6A\u8F80\u8F8C\u8F92\u8F9D\u8FA0\u8FA1\u8FA2\u8FA4\u8FA5\u8FA6\u8FA7\u8FAA\u8FAC\u8FAD\u8FAE\u8FAF\u8FB2\u8FB3\u8FB4\u8FB5\u8FB7\u8FB8\u8FBA\u8FBB\u8FBC\u8FBF\u8FC0\u8FC3\u8FC6"],
      ["de80", "\u8FC9", 4, "\u8FCF\u8FD2\u8FD6\u8FD7\u8FDA\u8FE0\u8FE1\u8FE3\u8FE7\u8FEC\u8FEF\u8FF1\u8FF2\u8FF4\u8FF5\u8FF6\u8FFA\u8FFB\u8FFC\u8FFE\u8FFF\u9007\u9008\u900C\u900E\u9013\u9015\u9018\u8556\u853B\u84FF\u84FC\u8559\u8548\u8568\u8564\u855E\u857A\u77A2\u8543\u8572\u857B\u85A4\u85A8\u8587\u858F\u8579\u85AE\u859C\u8585\u85B9\u85B7\u85B0\u85D3\u85C1\u85DC\u85FF\u8627\u8605\u8629\u8616\u863C\u5EFE\u5F08\u593C\u5941\u8037\u5955\u595A\u5958\u530F\u5C22\u5C25\u5C2C\u5C34\u624C\u626A\u629F\u62BB\u62CA\u62DA\u62D7\u62EE\u6322\u62F6\u6339\u634B\u6343\u63AD\u63F6\u6371\u637A\u638E\u63B4\u636D\u63AC\u638A\u6369\u63AE\u63BC\u63F2\u63F8\u63E0\u63FF\u63C4\u63DE\u63CE\u6452\u63C6\u63BE\u6445\u6441\u640B\u641B\u6420\u640C\u6426\u6421\u645E\u6484\u646D\u6496"],
      ["df40", "\u9019\u901C\u9023\u9024\u9025\u9027", 5, "\u9030", 4, "\u9037\u9039\u903A\u903D\u903F\u9040\u9043\u9045\u9046\u9048", 4, "\u904E\u9054\u9055\u9056\u9059\u905A\u905C", 5, "\u9064\u9066\u9067\u9069\u906A\u906B\u906C\u906F", 4, "\u9076", 6, "\u907E\u9081"],
      ["df80", "\u9084\u9085\u9086\u9087\u9089\u908A\u908C", 4, "\u9092\u9094\u9096\u9098\u909A\u909C\u909E\u909F\u90A0\u90A4\u90A5\u90A7\u90A8\u90A9\u90AB\u90AD\u90B2\u90B7\u90BC\u90BD\u90BF\u90C0\u647A\u64B7\u64B8\u6499\u64BA\u64C0\u64D0\u64D7\u64E4\u64E2\u6509\u6525\u652E\u5F0B\u5FD2\u7519\u5F11\u535F\u53F1\u53FD\u53E9\u53E8\u53FB\u5412\u5416\u5406\u544B\u5452\u5453\u5454\u5456\u5443\u5421\u5457\u5459\u5423\u5432\u5482\u5494\u5477\u5471\u5464\u549A\u549B\u5484\u5476\u5466\u549D\u54D0\u54AD\u54C2\u54B4\u54D2\u54A7\u54A6\u54D3\u54D4\u5472\u54A3\u54D5\u54BB\u54BF\u54CC\u54D9\u54DA\u54DC\u54A9\u54AA\u54A4\u54DD\u54CF\u54DE\u551B\u54E7\u5520\u54FD\u5514\u54F3\u5522\u5523\u550F\u5511\u5527\u552A\u5567\u558F\u55B5\u5549\u556D\u5541\u5555\u553F\u5550\u553C"],
      ["e040", "\u90C2\u90C3\u90C6\u90C8\u90C9\u90CB\u90CC\u90CD\u90D2\u90D4\u90D5\u90D6\u90D8\u90D9\u90DA\u90DE\u90DF\u90E0\u90E3\u90E4\u90E5\u90E9\u90EA\u90EC\u90EE\u90F0\u90F1\u90F2\u90F3\u90F5\u90F6\u90F7\u90F9\u90FA\u90FB\u90FC\u90FF\u9100\u9101\u9103\u9105", 19, "\u911A\u911B\u911C"],
      ["e080", "\u911D\u911F\u9120\u9121\u9124", 10, "\u9130\u9132", 6, "\u913A", 8, "\u9144\u5537\u5556\u5575\u5576\u5577\u5533\u5530\u555C\u558B\u55D2\u5583\u55B1\u55B9\u5588\u5581\u559F\u557E\u55D6\u5591\u557B\u55DF\u55BD\u55BE\u5594\u5599\u55EA\u55F7\u55C9\u561F\u55D1\u55EB\u55EC\u55D4\u55E6\u55DD\u55C4\u55EF\u55E5\u55F2\u55F3\u55CC\u55CD\u55E8\u55F5\u55E4\u8F94\u561E\u5608\u560C\u5601\u5624\u5623\u55FE\u5600\u5627\u562D\u5658\u5639\u5657\u562C\u564D\u5662\u5659\u565C\u564C\u5654\u5686\u5664\u5671\u566B\u567B\u567C\u5685\u5693\u56AF\u56D4\u56D7\u56DD\u56E1\u56F5\u56EB\u56F9\u56FF\u5704\u570A\u5709\u571C\u5E0F\u5E19\u5E14\u5E11\u5E31\u5E3B\u5E3C"],
      ["e140", "\u9145\u9147\u9148\u9151\u9153\u9154\u9155\u9156\u9158\u9159\u915B\u915C\u915F\u9160\u9166\u9167\u9168\u916B\u916D\u9173\u917A\u917B\u917C\u9180", 4, "\u9186\u9188\u918A\u918E\u918F\u9193", 6, "\u919C", 5, "\u91A4", 5, "\u91AB\u91AC\u91B0\u91B1\u91B2\u91B3\u91B6\u91B7\u91B8\u91B9\u91BB"],
      ["e180", "\u91BC", 10, "\u91C8\u91CB\u91D0\u91D2", 9, "\u91DD", 8, "\u5E37\u5E44\u5E54\u5E5B\u5E5E\u5E61\u5C8C\u5C7A\u5C8D\u5C90\u5C96\u5C88\u5C98\u5C99\u5C91\u5C9A\u5C9C\u5CB5\u5CA2\u5CBD\u5CAC\u5CAB\u5CB1\u5CA3\u5CC1\u5CB7\u5CC4\u5CD2\u5CE4\u5CCB\u5CE5\u5D02\u5D03\u5D27\u5D26\u5D2E\u5D24\u5D1E\u5D06\u5D1B\u5D58\u5D3E\u5D34\u5D3D\u5D6C\u5D5B\u5D6F\u5D5D\u5D6B\u5D4B\u5D4A\u5D69\u5D74\u5D82\u5D99\u5D9D\u8C73\u5DB7\u5DC5\u5F73\u5F77\u5F82\u5F87\u5F89\u5F8C\u5F95\u5F99\u5F9C\u5FA8\u5FAD\u5FB5\u5FBC\u8862\u5F61\u72AD\u72B0\u72B4\u72B7\u72B8\u72C3\u72C1\u72CE\u72CD\u72D2\u72E8\u72EF\u72E9\u72F2\u72F4\u72F7\u7301\u72F3\u7303\u72FA"],
      ["e240", "\u91E6", 62],
      ["e280", "\u9225", 32, "\u72FB\u7317\u7313\u7321\u730A\u731E\u731D\u7315\u7322\u7339\u7325\u732C\u7338\u7331\u7350\u734D\u7357\u7360\u736C\u736F\u737E\u821B\u5925\u98E7\u5924\u5902\u9963\u9967", 5, "\u9974\u9977\u997D\u9980\u9984\u9987\u998A\u998D\u9990\u9991\u9993\u9994\u9995\u5E80\u5E91\u5E8B\u5E96\u5EA5\u5EA0\u5EB9\u5EB5\u5EBE\u5EB3\u8D53\u5ED2\u5ED1\u5EDB\u5EE8\u5EEA\u81BA\u5FC4\u5FC9\u5FD6\u5FCF\u6003\u5FEE\u6004\u5FE1\u5FE4\u5FFE\u6005\u6006\u5FEA\u5FED\u5FF8\u6019\u6035\u6026\u601B\u600F\u600D\u6029\u602B\u600A\u603F\u6021\u6078\u6079\u607B\u607A\u6042"],
      ["e340", "\u9246", 45, "\u9275", 16],
      ["e380", "\u9286", 7, "\u928F", 24, "\u606A\u607D\u6096\u609A\u60AD\u609D\u6083\u6092\u608C\u609B\u60EC\u60BB\u60B1\u60DD\u60D8\u60C6\u60DA\u60B4\u6120\u6126\u6115\u6123\u60F4\u6100\u610E\u612B\u614A\u6175\u61AC\u6194\u61A7\u61B7\u61D4\u61F5\u5FDD\u96B3\u95E9\u95EB\u95F1\u95F3\u95F5\u95F6\u95FC\u95FE\u9603\u9604\u9606\u9608\u960A\u960B\u960C\u960D\u960F\u9612\u9615\u9616\u9617\u9619\u961A\u4E2C\u723F\u6215\u6C35\u6C54\u6C5C\u6C4A\u6CA3\u6C85\u6C90\u6C94\u6C8C\u6C68\u6C69\u6C74\u6C76\u6C86\u6CA9\u6CD0\u6CD4\u6CAD\u6CF7\u6CF8\u6CF1\u6CD7\u6CB2\u6CE0\u6CD6\u6CFA\u6CEB\u6CEE\u6CB1\u6CD3\u6CEF\u6CFE"],
      ["e440", "\u92A8", 5, "\u92AF", 24, "\u92C9", 31],
      ["e480", "\u92E9", 32, "\u6D39\u6D27\u6D0C\u6D43\u6D48\u6D07\u6D04\u6D19\u6D0E\u6D2B\u6D4D\u6D2E\u6D35\u6D1A\u6D4F\u6D52\u6D54\u6D33\u6D91\u6D6F\u6D9E\u6DA0\u6D5E\u6D93\u6D94\u6D5C\u6D60\u6D7C\u6D63\u6E1A\u6DC7\u6DC5\u6DDE\u6E0E\u6DBF\u6DE0\u6E11\u6DE6\u6DDD\u6DD9\u6E16\u6DAB\u6E0C\u6DAE\u6E2B\u6E6E\u6E4E\u6E6B\u6EB2\u6E5F\u6E86\u6E53\u6E54\u6E32\u6E25\u6E44\u6EDF\u6EB1\u6E98\u6EE0\u6F2D\u6EE2\u6EA5\u6EA7\u6EBD\u6EBB\u6EB7\u6ED7\u6EB4\u6ECF\u6E8F\u6EC2\u6E9F\u6F62\u6F46\u6F47\u6F24\u6F15\u6EF9\u6F2F\u6F36\u6F4B\u6F74\u6F2A\u6F09\u6F29\u6F89\u6F8D\u6F8C\u6F78\u6F72\u6F7C\u6F7A\u6FD1"],
      ["e540", "\u930A", 51, "\u933F", 10],
      ["e580", "\u934A", 31, "\u936B\u6FC9\u6FA7\u6FB9\u6FB6\u6FC2\u6FE1\u6FEE\u6FDE\u6FE0\u6FEF\u701A\u7023\u701B\u7039\u7035\u704F\u705E\u5B80\u5B84\u5B95\u5B93\u5BA5\u5BB8\u752F\u9A9E\u6434\u5BE4\u5BEE\u8930\u5BF0\u8E47\u8B07\u8FB6\u8FD3\u8FD5\u8FE5\u8FEE\u8FE4\u8FE9\u8FE6\u8FF3\u8FE8\u9005\u9004\u900B\u9026\u9011\u900D\u9016\u9021\u9035\u9036\u902D\u902F\u9044\u9051\u9052\u9050\u9068\u9058\u9062\u905B\u66B9\u9074\u907D\u9082\u9088\u9083\u908B\u5F50\u5F57\u5F56\u5F58\u5C3B\u54AB\u5C50\u5C59\u5B71\u5C63\u5C66\u7FBC\u5F2A\u5F29\u5F2D\u8274\u5F3C\u9B3B\u5C6E\u5981\u5983\u598D\u59A9\u59AA\u59A3"],
      ["e640", "\u936C", 34, "\u9390", 27],
      ["e680", "\u93AC", 29, "\u93CB\u93CC\u93CD\u5997\u59CA\u59AB\u599E\u59A4\u59D2\u59B2\u59AF\u59D7\u59BE\u5A05\u5A06\u59DD\u5A08\u59E3\u59D8\u59F9\u5A0C\u5A09\u5A32\u5A34\u5A11\u5A23\u5A13\u5A40\u5A67\u5A4A\u5A55\u5A3C\u5A62\u5A75\u80EC\u5AAA\u5A9B\u5A77\u5A7A\u5ABE\u5AEB\u5AB2\u5AD2\u5AD4\u5AB8\u5AE0\u5AE3\u5AF1\u5AD6\u5AE6\u5AD8\u5ADC\u5B09\u5B17\u5B16\u5B32\u5B37\u5B40\u5C15\u5C1C\u5B5A\u5B65\u5B73\u5B51\u5B53\u5B62\u9A75\u9A77\u9A78\u9A7A\u9A7F\u9A7D\u9A80\u9A81\u9A85\u9A88\u9A8A\u9A90\u9A92\u9A93\u9A96\u9A98\u9A9B\u9A9C\u9A9D\u9A9F\u9AA0\u9AA2\u9AA3\u9AA5\u9AA7\u7E9F\u7EA1\u7EA3\u7EA5\u7EA8\u7EA9"],
      ["e740", "\u93CE", 7, "\u93D7", 54],
      ["e780", "\u940E", 32, "\u7EAD\u7EB0\u7EBE\u7EC0\u7EC1\u7EC2\u7EC9\u7ECB\u7ECC\u7ED0\u7ED4\u7ED7\u7EDB\u7EE0\u7EE1\u7EE8\u7EEB\u7EEE\u7EEF\u7EF1\u7EF2\u7F0D\u7EF6\u7EFA\u7EFB\u7EFE\u7F01\u7F02\u7F03\u7F07\u7F08\u7F0B\u7F0C\u7F0F\u7F11\u7F12\u7F17\u7F19\u7F1C\u7F1B\u7F1F\u7F21", 6, "\u7F2A\u7F2B\u7F2C\u7F2D\u7F2F", 4, "\u7F35\u5E7A\u757F\u5DDB\u753E\u9095\u738E\u7391\u73AE\u73A2\u739F\u73CF\u73C2\u73D1\u73B7\u73B3\u73C0\u73C9\u73C8\u73E5\u73D9\u987C\u740A\u73E9\u73E7\u73DE\u73BA\u73F2\u740F\u742A\u745B\u7426\u7425\u7428\u7430\u742E\u742C"],
      ["e840", "\u942F", 14, "\u943F", 43, "\u946C\u946D\u946E\u946F"],
      ["e880", "\u9470", 20, "\u9491\u9496\u9498\u94C7\u94CF\u94D3\u94D4\u94DA\u94E6\u94FB\u951C\u9520\u741B\u741A\u7441\u745C\u7457\u7455\u7459\u7477\u746D\u747E\u749C\u748E\u7480\u7481\u7487\u748B\u749E\u74A8\u74A9\u7490\u74A7\u74D2\u74BA\u97EA\u97EB\u97EC\u674C\u6753\u675E\u6748\u6769\u67A5\u6787\u676A\u6773\u6798\u67A7\u6775\u67A8\u679E\u67AD\u678B\u6777\u677C\u67F0\u6809\u67D8\u680A\u67E9\u67B0\u680C\u67D9\u67B5\u67DA\u67B3\u67DD\u6800\u67C3\u67B8\u67E2\u680E\u67C1\u67FD\u6832\u6833\u6860\u6861\u684E\u6862\u6844\u6864\u6883\u681D\u6855\u6866\u6841\u6867\u6840\u683E\u684A\u6849\u6829\u68B5\u688F\u6874\u6877\u6893\u686B\u68C2\u696E\u68FC\u691F\u6920\u68F9"],
      ["e940", "\u9527\u9533\u953D\u9543\u9548\u954B\u9555\u955A\u9560\u956E\u9574\u9575\u9577", 7, "\u9580", 42],
      ["e980", "\u95AB", 32, "\u6924\u68F0\u690B\u6901\u6957\u68E3\u6910\u6971\u6939\u6960\u6942\u695D\u6984\u696B\u6980\u6998\u6978\u6934\u69CC\u6987\u6988\u69CE\u6989\u6966\u6963\u6979\u699B\u69A7\u69BB\u69AB\u69AD\u69D4\u69B1\u69C1\u69CA\u69DF\u6995\u69E0\u698D\u69FF\u6A2F\u69ED\u6A17\u6A18\u6A65\u69F2\u6A44\u6A3E\u6AA0\u6A50\u6A5B\u6A35\u6A8E\u6A79\u6A3D\u6A28\u6A58\u6A7C\u6A91\u6A90\u6AA9\u6A97\u6AAB\u7337\u7352\u6B81\u6B82\u6B87\u6B84\u6B92\u6B93\u6B8D\u6B9A\u6B9B\u6BA1\u6BAA\u8F6B\u8F6D\u8F71\u8F72\u8F73\u8F75\u8F76\u8F78\u8F77\u8F79\u8F7A\u8F7C\u8F7E\u8F81\u8F82\u8F84\u8F87\u8F8B"],
      ["ea40", "\u95CC", 27, "\u95EC\u95FF\u9607\u9613\u9618\u961B\u961E\u9620\u9623", 6, "\u962B\u962C\u962D\u962F\u9630\u9637\u9638\u9639\u963A\u963E\u9641\u9643\u964A\u964E\u964F\u9651\u9652\u9653\u9656\u9657"],
      ["ea80", "\u9658\u9659\u965A\u965C\u965D\u965E\u9660\u9663\u9665\u9666\u966B\u966D", 4, "\u9673\u9678", 12, "\u9687\u9689\u968A\u8F8D\u8F8E\u8F8F\u8F98\u8F9A\u8ECE\u620B\u6217\u621B\u621F\u6222\u6221\u6225\u6224\u622C\u81E7\u74EF\u74F4\u74FF\u750F\u7511\u7513\u6534\u65EE\u65EF\u65F0\u660A\u6619\u6772\u6603\u6615\u6600\u7085\u66F7\u661D\u6634\u6631\u6636\u6635\u8006\u665F\u6654\u6641\u664F\u6656\u6661\u6657\u6677\u6684\u668C\u66A7\u669D\u66BE\u66DB\u66DC\u66E6\u66E9\u8D32\u8D33\u8D36\u8D3B\u8D3D\u8D40\u8D45\u8D46\u8D48\u8D49\u8D47\u8D4D\u8D55\u8D59\u89C7\u89CA\u89CB\u89CC\u89CE\u89CF\u89D0\u89D1\u726E\u729F\u725D\u7266\u726F\u727E\u727F\u7284\u728B\u728D\u728F\u7292\u6308\u6332\u63B0"],
      ["eb40", "\u968C\u968E\u9691\u9692\u9693\u9695\u9696\u969A\u969B\u969D", 9, "\u96A8", 7, "\u96B1\u96B2\u96B4\u96B5\u96B7\u96B8\u96BA\u96BB\u96BF\u96C2\u96C3\u96C8\u96CA\u96CB\u96D0\u96D1\u96D3\u96D4\u96D6", 9, "\u96E1", 6, "\u96EB"],
      ["eb80", "\u96EC\u96ED\u96EE\u96F0\u96F1\u96F2\u96F4\u96F5\u96F8\u96FA\u96FB\u96FC\u96FD\u96FF\u9702\u9703\u9705\u970A\u970B\u970C\u9710\u9711\u9712\u9714\u9715\u9717", 4, "\u971D\u971F\u9720\u643F\u64D8\u8004\u6BEA\u6BF3\u6BFD\u6BF5\u6BF9\u6C05\u6C07\u6C06\u6C0D\u6C15\u6C18\u6C19\u6C1A\u6C21\u6C29\u6C24\u6C2A\u6C32\u6535\u6555\u656B\u724D\u7252\u7256\u7230\u8662\u5216\u809F\u809C\u8093\u80BC\u670A\u80BD\u80B1\u80AB\u80AD\u80B4\u80B7\u80E7\u80E8\u80E9\u80EA\u80DB\u80C2\u80C4\u80D9\u80CD\u80D7\u6710\u80DD\u80EB\u80F1\u80F4\u80ED\u810D\u810E\u80F2\u80FC\u6715\u8112\u8C5A\u8136\u811E\u812C\u8118\u8132\u8148\u814C\u8153\u8174\u8159\u815A\u8171\u8160\u8169\u817C\u817D\u816D\u8167\u584D\u5AB5\u8188\u8182\u8191\u6ED5\u81A3\u81AA\u81CC\u6726\u81CA\u81BB"],
      ["ec40", "\u9721", 8, "\u972B\u972C\u972E\u972F\u9731\u9733", 4, "\u973A\u973B\u973C\u973D\u973F", 18, "\u9754\u9755\u9757\u9758\u975A\u975C\u975D\u975F\u9763\u9764\u9766\u9767\u9768\u976A", 7],
      ["ec80", "\u9772\u9775\u9777", 4, "\u977D", 7, "\u9786", 4, "\u978C\u978E\u978F\u9790\u9793\u9795\u9796\u9797\u9799", 4, "\u81C1\u81A6\u6B24\u6B37\u6B39\u6B43\u6B46\u6B59\u98D1\u98D2\u98D3\u98D5\u98D9\u98DA\u6BB3\u5F40\u6BC2\u89F3\u6590\u9F51\u6593\u65BC\u65C6\u65C4\u65C3\u65CC\u65CE\u65D2\u65D6\u7080\u709C\u7096\u709D\u70BB\u70C0\u70B7\u70AB\u70B1\u70E8\u70CA\u7110\u7113\u7116\u712F\u7131\u7173\u715C\u7168\u7145\u7172\u714A\u7178\u717A\u7198\u71B3\u71B5\u71A8\u71A0\u71E0\u71D4\u71E7\u71F9\u721D\u7228\u706C\u7118\u7166\u71B9\u623E\u623D\u6243\u6248\u6249\u793B\u7940\u7946\u7949\u795B\u795C\u7953\u795A\u7962\u7957\u7960\u796F\u7967\u797A\u7985\u798A\u799A\u79A7\u79B3\u5FD1\u5FD0"],
      ["ed40", "\u979E\u979F\u97A1\u97A2\u97A4", 6, "\u97AC\u97AE\u97B0\u97B1\u97B3\u97B5", 46],
      ["ed80", "\u97E4\u97E5\u97E8\u97EE", 4, "\u97F4\u97F7", 23, "\u603C\u605D\u605A\u6067\u6041\u6059\u6063\u60AB\u6106\u610D\u615D\u61A9\u619D\u61CB\u61D1\u6206\u8080\u807F\u6C93\u6CF6\u6DFC\u77F6\u77F8\u7800\u7809\u7817\u7818\u7811\u65AB\u782D\u781C\u781D\u7839\u783A\u783B\u781F\u783C\u7825\u782C\u7823\u7829\u784E\u786D\u7856\u7857\u7826\u7850\u7847\u784C\u786A\u789B\u7893\u789A\u7887\u789C\u78A1\u78A3\u78B2\u78B9\u78A5\u78D4\u78D9\u78C9\u78EC\u78F2\u7905\u78F4\u7913\u7924\u791E\u7934\u9F9B\u9EF9\u9EFB\u9EFC\u76F1\u7704\u770D\u76F9\u7707\u7708\u771A\u7722\u7719\u772D\u7726\u7735\u7738\u7750\u7751\u7747\u7743\u775A\u7768"],
      ["ee40", "\u980F", 62],
      ["ee80", "\u984E", 32, "\u7762\u7765\u777F\u778D\u777D\u7780\u778C\u7791\u779F\u77A0\u77B0\u77B5\u77BD\u753A\u7540\u754E\u754B\u7548\u755B\u7572\u7579\u7583\u7F58\u7F61\u7F5F\u8A48\u7F68\u7F74\u7F71\u7F79\u7F81\u7F7E\u76CD\u76E5\u8832\u9485\u9486\u9487\u948B\u948A\u948C\u948D\u948F\u9490\u9494\u9497\u9495\u949A\u949B\u949C\u94A3\u94A4\u94AB\u94AA\u94AD\u94AC\u94AF\u94B0\u94B2\u94B4\u94B6", 4, "\u94BC\u94BD\u94BF\u94C4\u94C8", 6, "\u94D0\u94D1\u94D2\u94D5\u94D6\u94D7\u94D9\u94D8\u94DB\u94DE\u94DF\u94E0\u94E2\u94E4\u94E5\u94E7\u94E8\u94EA"],
      ["ef40", "\u986F", 5, "\u988B\u988E\u9892\u9895\u9899\u98A3\u98A8", 37, "\u98CF\u98D0\u98D4\u98D6\u98D7\u98DB\u98DC\u98DD\u98E0", 4],
      ["ef80", "\u98E5\u98E6\u98E9", 30, "\u94E9\u94EB\u94EE\u94EF\u94F3\u94F4\u94F5\u94F7\u94F9\u94FC\u94FD\u94FF\u9503\u9502\u9506\u9507\u9509\u950A\u950D\u950E\u950F\u9512", 4, "\u9518\u951B\u951D\u951E\u951F\u9522\u952A\u952B\u9529\u952C\u9531\u9532\u9534\u9536\u9537\u9538\u953C\u953E\u953F\u9542\u9535\u9544\u9545\u9546\u9549\u954C\u954E\u954F\u9552\u9553\u9554\u9556\u9557\u9558\u9559\u955B\u955E\u955F\u955D\u9561\u9562\u9564", 8, "\u956F\u9571\u9572\u9573\u953A\u77E7\u77EC\u96C9\u79D5\u79ED\u79E3\u79EB\u7A06\u5D47\u7A03\u7A02\u7A1E\u7A14"],
      ["f040", "\u9908", 4, "\u990E\u990F\u9911", 28, "\u992F", 26],
      ["f080", "\u994A", 9, "\u9956", 12, "\u9964\u9966\u9973\u9978\u9979\u997B\u997E\u9982\u9983\u9989\u7A39\u7A37\u7A51\u9ECF\u99A5\u7A70\u7688\u768E\u7693\u7699\u76A4\u74DE\u74E0\u752C\u9E20\u9E22\u9E28", 4, "\u9E32\u9E31\u9E36\u9E38\u9E37\u9E39\u9E3A\u9E3E\u9E41\u9E42\u9E44\u9E46\u9E47\u9E48\u9E49\u9E4B\u9E4C\u9E4E\u9E51\u9E55\u9E57\u9E5A\u9E5B\u9E5C\u9E5E\u9E63\u9E66", 6, "\u9E71\u9E6D\u9E73\u7592\u7594\u7596\u75A0\u759D\u75AC\u75A3\u75B3\u75B4\u75B8\u75C4\u75B1\u75B0\u75C3\u75C2\u75D6\u75CD\u75E3\u75E8\u75E6\u75E4\u75EB\u75E7\u7603\u75F1\u75FC\u75FF\u7610\u7600\u7605\u760C\u7617\u760A\u7625\u7618\u7615\u7619"],
      ["f140", "\u998C\u998E\u999A", 10, "\u99A6\u99A7\u99A9", 47],
      ["f180", "\u99D9", 32, "\u761B\u763C\u7622\u7620\u7640\u762D\u7630\u763F\u7635\u7643\u763E\u7633\u764D\u765E\u7654\u765C\u7656\u766B\u766F\u7FCA\u7AE6\u7A78\u7A79\u7A80\u7A86\u7A88\u7A95\u7AA6\u7AA0\u7AAC\u7AA8\u7AAD\u7AB3\u8864\u8869\u8872\u887D\u887F\u8882\u88A2\u88C6\u88B7\u88BC\u88C9\u88E2\u88CE\u88E3\u88E5\u88F1\u891A\u88FC\u88E8\u88FE\u88F0\u8921\u8919\u8913\u891B\u890A\u8934\u892B\u8936\u8941\u8966\u897B\u758B\u80E5\u76B2\u76B4\u77DC\u8012\u8014\u8016\u801C\u8020\u8022\u8025\u8026\u8027\u8029\u8028\u8031\u800B\u8035\u8043\u8046\u804D\u8052\u8069\u8071\u8983\u9878\u9880\u9883"],
      ["f240", "\u99FA", 62],
      ["f280", "\u9A39", 32, "\u9889\u988C\u988D\u988F\u9894\u989A\u989B\u989E\u989F\u98A1\u98A2\u98A5\u98A6\u864D\u8654\u866C\u866E\u867F\u867A\u867C\u867B\u86A8\u868D\u868B\u86AC\u869D\u86A7\u86A3\u86AA\u8693\u86A9\u86B6\u86C4\u86B5\u86CE\u86B0\u86BA\u86B1\u86AF\u86C9\u86CF\u86B4\u86E9\u86F1\u86F2\u86ED\u86F3\u86D0\u8713\u86DE\u86F4\u86DF\u86D8\u86D1\u8703\u8707\u86F8\u8708\u870A\u870D\u8709\u8723\u873B\u871E\u8725\u872E\u871A\u873E\u8748\u8734\u8731\u8729\u8737\u873F\u8782\u8722\u877D\u877E\u877B\u8760\u8770\u874C\u876E\u878B\u8753\u8763\u877C\u8764\u8759\u8765\u8793\u87AF\u87A8\u87D2"],
      ["f340", "\u9A5A", 17, "\u9A72\u9A83\u9A89\u9A8D\u9A8E\u9A94\u9A95\u9A99\u9AA6\u9AA9", 6, "\u9AB2\u9AB3\u9AB4\u9AB5\u9AB9\u9ABB\u9ABD\u9ABE\u9ABF\u9AC3\u9AC4\u9AC6", 4, "\u9ACD\u9ACE\u9ACF\u9AD0\u9AD2\u9AD4\u9AD5\u9AD6\u9AD7\u9AD9\u9ADA\u9ADB\u9ADC"],
      ["f380", "\u9ADD\u9ADE\u9AE0\u9AE2\u9AE3\u9AE4\u9AE5\u9AE7\u9AE8\u9AE9\u9AEA\u9AEC\u9AEE\u9AF0", 8, "\u9AFA\u9AFC", 6, "\u9B04\u9B05\u9B06\u87C6\u8788\u8785\u87AD\u8797\u8783\u87AB\u87E5\u87AC\u87B5\u87B3\u87CB\u87D3\u87BD\u87D1\u87C0\u87CA\u87DB\u87EA\u87E0\u87EE\u8816\u8813\u87FE\u880A\u881B\u8821\u8839\u883C\u7F36\u7F42\u7F44\u7F45\u8210\u7AFA\u7AFD\u7B08\u7B03\u7B04\u7B15\u7B0A\u7B2B\u7B0F\u7B47\u7B38\u7B2A\u7B19\u7B2E\u7B31\u7B20\u7B25\u7B24\u7B33\u7B3E\u7B1E\u7B58\u7B5A\u7B45\u7B75\u7B4C\u7B5D\u7B60\u7B6E\u7B7B\u7B62\u7B72\u7B71\u7B90\u7BA6\u7BA7\u7BB8\u7BAC\u7B9D\u7BA8\u7B85\u7BAA\u7B9C\u7BA2\u7BAB\u7BB4\u7BD1\u7BC1\u7BCC\u7BDD\u7BDA\u7BE5\u7BE6\u7BEA\u7C0C\u7BFE\u7BFC\u7C0F\u7C16\u7C0B"],
      ["f440", "\u9B07\u9B09", 5, "\u9B10\u9B11\u9B12\u9B14", 10, "\u9B20\u9B21\u9B22\u9B24", 10, "\u9B30\u9B31\u9B33", 7, "\u9B3D\u9B3E\u9B3F\u9B40\u9B46\u9B4A\u9B4B\u9B4C\u9B4E\u9B50\u9B52\u9B53\u9B55", 5],
      ["f480", "\u9B5B", 32, "\u7C1F\u7C2A\u7C26\u7C38\u7C41\u7C40\u81FE\u8201\u8202\u8204\u81EC\u8844\u8221\u8222\u8223\u822D\u822F\u8228\u822B\u8238\u823B\u8233\u8234\u823E\u8244\u8249\u824B\u824F\u825A\u825F\u8268\u887E\u8885\u8888\u88D8\u88DF\u895E\u7F9D\u7F9F\u7FA7\u7FAF\u7FB0\u7FB2\u7C7C\u6549\u7C91\u7C9D\u7C9C\u7C9E\u7CA2\u7CB2\u7CBC\u7CBD\u7CC1\u7CC7\u7CCC\u7CCD\u7CC8\u7CC5\u7CD7\u7CE8\u826E\u66A8\u7FBF\u7FCE\u7FD5\u7FE5\u7FE1\u7FE6\u7FE9\u7FEE\u7FF3\u7CF8\u7D77\u7DA6\u7DAE\u7E47\u7E9B\u9EB8\u9EB4\u8D73\u8D84\u8D94\u8D91\u8DB1\u8D67\u8D6D\u8C47\u8C49\u914A\u9150\u914E\u914F\u9164"],
      ["f540", "\u9B7C", 62],
      ["f580", "\u9BBB", 32, "\u9162\u9161\u9170\u9169\u916F\u917D\u917E\u9172\u9174\u9179\u918C\u9185\u9190\u918D\u9191\u91A2\u91A3\u91AA\u91AD\u91AE\u91AF\u91B5\u91B4\u91BA\u8C55\u9E7E\u8DB8\u8DEB\u8E05\u8E59\u8E69\u8DB5\u8DBF\u8DBC\u8DBA\u8DC4\u8DD6\u8DD7\u8DDA\u8DDE\u8DCE\u8DCF\u8DDB\u8DC6\u8DEC\u8DF7\u8DF8\u8DE3\u8DF9\u8DFB\u8DE4\u8E09\u8DFD\u8E14\u8E1D\u8E1F\u8E2C\u8E2E\u8E23\u8E2F\u8E3A\u8E40\u8E39\u8E35\u8E3D\u8E31\u8E49\u8E41\u8E42\u8E51\u8E52\u8E4A\u8E70\u8E76\u8E7C\u8E6F\u8E74\u8E85\u8E8F\u8E94\u8E90\u8E9C\u8E9E\u8C78\u8C82\u8C8A\u8C85\u8C98\u8C94\u659B\u89D6\u89DE\u89DA\u89DC"],
      ["f640", "\u9BDC", 62],
      ["f680", "\u9C1B", 32, "\u89E5\u89EB\u89EF\u8A3E\u8B26\u9753\u96E9\u96F3\u96EF\u9706\u9701\u9708\u970F\u970E\u972A\u972D\u9730\u973E\u9F80\u9F83\u9F85", 5, "\u9F8C\u9EFE\u9F0B\u9F0D\u96B9\u96BC\u96BD\u96CE\u96D2\u77BF\u96E0\u928E\u92AE\u92C8\u933E\u936A\u93CA\u938F\u943E\u946B\u9C7F\u9C82\u9C85\u9C86\u9C87\u9C88\u7A23\u9C8B\u9C8E\u9C90\u9C91\u9C92\u9C94\u9C95\u9C9A\u9C9B\u9C9E", 5, "\u9CA5", 4, "\u9CAB\u9CAD\u9CAE\u9CB0", 7, "\u9CBA\u9CBB\u9CBC\u9CBD\u9CC4\u9CC5\u9CC6\u9CC7\u9CCA\u9CCB"],
      ["f740", "\u9C3C", 62],
      ["f780", "\u9C7B\u9C7D\u9C7E\u9C80\u9C83\u9C84\u9C89\u9C8A\u9C8C\u9C8F\u9C93\u9C96\u9C97\u9C98\u9C99\u9C9D\u9CAA\u9CAC\u9CAF\u9CB9\u9CBE", 4, "\u9CC8\u9CC9\u9CD1\u9CD2\u9CDA\u9CDB\u9CE0\u9CE1\u9CCC", 4, "\u9CD3\u9CD4\u9CD5\u9CD7\u9CD8\u9CD9\u9CDC\u9CDD\u9CDF\u9CE2\u977C\u9785\u9791\u9792\u9794\u97AF\u97AB\u97A3\u97B2\u97B4\u9AB1\u9AB0\u9AB7\u9E58\u9AB6\u9ABA\u9ABC\u9AC1\u9AC0\u9AC5\u9AC2\u9ACB\u9ACC\u9AD1\u9B45\u9B43\u9B47\u9B49\u9B48\u9B4D\u9B51\u98E8\u990D\u992E\u9955\u9954\u9ADF\u9AE1\u9AE6\u9AEF\u9AEB\u9AFB\u9AED\u9AF9\u9B08\u9B0F\u9B13\u9B1F\u9B23\u9EBD\u9EBE\u7E3B\u9E82\u9E87\u9E88\u9E8B\u9E92\u93D6\u9E9D\u9E9F\u9EDB\u9EDC\u9EDD\u9EE0\u9EDF\u9EE2\u9EE9\u9EE7\u9EE5\u9EEA\u9EEF\u9F22\u9F2C\u9F2F\u9F39\u9F37\u9F3D\u9F3E\u9F44"],
      ["f840", "\u9CE3", 62],
      ["f880", "\u9D22", 32],
      ["f940", "\u9D43", 62],
      ["f980", "\u9D82", 32],
      ["fa40", "\u9DA3", 62],
      ["fa80", "\u9DE2", 32],
      ["fb40", "\u9E03", 27, "\u9E24\u9E27\u9E2E\u9E30\u9E34\u9E3B\u9E3C\u9E40\u9E4D\u9E50\u9E52\u9E53\u9E54\u9E56\u9E59\u9E5D\u9E5F\u9E60\u9E61\u9E62\u9E65\u9E6E\u9E6F\u9E72\u9E74", 9, "\u9E80"],
      ["fb80", "\u9E81\u9E83\u9E84\u9E85\u9E86\u9E89\u9E8A\u9E8C", 5, "\u9E94", 8, "\u9E9E\u9EA0", 5, "\u9EA7\u9EA8\u9EA9\u9EAA"],
      ["fc40", "\u9EAB", 8, "\u9EB5\u9EB6\u9EB7\u9EB9\u9EBA\u9EBC\u9EBF", 4, "\u9EC5\u9EC6\u9EC7\u9EC8\u9ECA\u9ECB\u9ECC\u9ED0\u9ED2\u9ED3\u9ED5\u9ED6\u9ED7\u9ED9\u9EDA\u9EDE\u9EE1\u9EE3\u9EE4\u9EE6\u9EE8\u9EEB\u9EEC\u9EED\u9EEE\u9EF0", 8, "\u9EFA\u9EFD\u9EFF", 6],
      ["fc80", "\u9F06", 4, "\u9F0C\u9F0F\u9F11\u9F12\u9F14\u9F15\u9F16\u9F18\u9F1A", 5, "\u9F21\u9F23", 8, "\u9F2D\u9F2E\u9F30\u9F31"],
      ["fd40", "\u9F32", 4, "\u9F38\u9F3A\u9F3C\u9F3F", 4, "\u9F45", 10, "\u9F52", 38],
      ["fd80", "\u9F79", 5, "\u9F81\u9F82\u9F8D", 11, "\u9F9C\u9F9D\u9F9E\u9FA1", 4, "\uF92C\uF979\uF995\uF9E7\uF9F1"],
      ["fe40", "\uFA0C\uFA0D\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA18\uFA1F\uFA20\uFA21\uFA23\uFA24\uFA27\uFA28\uFA29"]
    ];
  }
});

// ../../../node_modules/encoding/node_modules/iconv-lite/encodings/tables/gbk-added.json
var require_gbk_added = __commonJS({
  "../../../node_modules/encoding/node_modules/iconv-lite/encodings/tables/gbk-added.json"(exports, module2) {
    module2.exports = [
      ["a140", "\uE4C6", 62],
      ["a180", "\uE505", 32],
      ["a240", "\uE526", 62],
      ["a280", "\uE565", 32],
      ["a2ab", "\uE766", 5],
      ["a2e3", "\u20AC\uE76D"],
      ["a2ef", "\uE76E\uE76F"],
      ["a2fd", "\uE770\uE771"],
      ["a340", "\uE586", 62],
      ["a380", "\uE5C5", 31, "\u3000"],
      ["a440", "\uE5E6", 62],
      ["a480", "\uE625", 32],
      ["a4f4", "\uE772", 10],
      ["a540", "\uE646", 62],
      ["a580", "\uE685", 32],
      ["a5f7", "\uE77D", 7],
      ["a640", "\uE6A6", 62],
      ["a680", "\uE6E5", 32],
      ["a6b9", "\uE785", 7],
      ["a6d9", "\uE78D", 6],
      ["a6ec", "\uE794\uE795"],
      ["a6f3", "\uE796"],
      ["a6f6", "\uE797", 8],
      ["a740", "\uE706", 62],
      ["a780", "\uE745", 32],
      ["a7c2", "\uE7A0", 14],
      ["a7f2", "\uE7AF", 12],
      ["a896", "\uE7BC", 10],
      ["a8bc", "\u1E3F"],
      ["a8bf", "\u01F9"],
      ["a8c1", "\uE7C9\uE7CA\uE7CB\uE7CC"],
      ["a8ea", "\uE7CD", 20],
      ["a958", "\uE7E2"],
      ["a95b", "\uE7E3"],
      ["a95d", "\uE7E4\uE7E5\uE7E6"],
      ["a989", "\u303E\u2FF0", 11],
      ["a997", "\uE7F4", 12],
      ["a9f0", "\uE801", 14],
      ["aaa1", "\uE000", 93],
      ["aba1", "\uE05E", 93],
      ["aca1", "\uE0BC", 93],
      ["ada1", "\uE11A", 93],
      ["aea1", "\uE178", 93],
      ["afa1", "\uE1D6", 93],
      ["d7fa", "\uE810", 4],
      ["f8a1", "\uE234", 93],
      ["f9a1", "\uE292", 93],
      ["faa1", "\uE2F0", 93],
      ["fba1", "\uE34E", 93],
      ["fca1", "\uE3AC", 93],
      ["fda1", "\uE40A", 93],
      ["fe50", "\u2E81\uE816\uE817\uE818\u2E84\u3473\u3447\u2E88\u2E8B\uE81E\u359E\u361A\u360E\u2E8C\u2E97\u396E\u3918\uE826\u39CF\u39DF\u3A73\u39D0\uE82B\uE82C\u3B4E\u3C6E\u3CE0\u2EA7\uE831\uE832\u2EAA\u4056\u415F\u2EAE\u4337\u2EB3\u2EB6\u2EB7\uE83B\u43B1\u43AC\u2EBB\u43DD\u44D6\u4661\u464C\uE843"],
      ["fe80", "\u4723\u4729\u477C\u478D\u2ECA\u4947\u497A\u497D\u4982\u4983\u4985\u4986\u499F\u499B\u49B7\u49B6\uE854\uE855\u4CA3\u4C9F\u4CA0\u4CA1\u4C77\u4CA2\u4D13", 6, "\u4DAE\uE864\uE468", 93],
      ["8135f437", "\uE7C7"]
    ];
  }
});

// ../../../node_modules/encoding/node_modules/iconv-lite/encodings/tables/gb18030-ranges.json
var require_gb18030_ranges = __commonJS({
  "../../../node_modules/encoding/node_modules/iconv-lite/encodings/tables/gb18030-ranges.json"(exports, module2) {
    module2.exports = { uChars: [128, 165, 169, 178, 184, 216, 226, 235, 238, 244, 248, 251, 253, 258, 276, 284, 300, 325, 329, 334, 364, 463, 465, 467, 469, 471, 473, 475, 477, 506, 594, 610, 712, 716, 730, 930, 938, 962, 970, 1026, 1104, 1106, 8209, 8215, 8218, 8222, 8231, 8241, 8244, 8246, 8252, 8365, 8452, 8454, 8458, 8471, 8482, 8556, 8570, 8596, 8602, 8713, 8720, 8722, 8726, 8731, 8737, 8740, 8742, 8748, 8751, 8760, 8766, 8777, 8781, 8787, 8802, 8808, 8816, 8854, 8858, 8870, 8896, 8979, 9322, 9372, 9548, 9588, 9616, 9622, 9634, 9652, 9662, 9672, 9676, 9680, 9702, 9735, 9738, 9793, 9795, 11906, 11909, 11913, 11917, 11928, 11944, 11947, 11951, 11956, 11960, 11964, 11979, 12284, 12292, 12312, 12319, 12330, 12351, 12436, 12447, 12535, 12543, 12586, 12842, 12850, 12964, 13200, 13215, 13218, 13253, 13263, 13267, 13270, 13384, 13428, 13727, 13839, 13851, 14617, 14703, 14801, 14816, 14964, 15183, 15471, 15585, 16471, 16736, 17208, 17325, 17330, 17374, 17623, 17997, 18018, 18212, 18218, 18301, 18318, 18760, 18811, 18814, 18820, 18823, 18844, 18848, 18872, 19576, 19620, 19738, 19887, 40870, 59244, 59336, 59367, 59413, 59417, 59423, 59431, 59437, 59443, 59452, 59460, 59478, 59493, 63789, 63866, 63894, 63976, 63986, 64016, 64018, 64021, 64025, 64034, 64037, 64042, 65074, 65093, 65107, 65112, 65127, 65132, 65375, 65510, 65536], gbChars: [0, 36, 38, 45, 50, 81, 89, 95, 96, 100, 103, 104, 105, 109, 126, 133, 148, 172, 175, 179, 208, 306, 307, 308, 309, 310, 311, 312, 313, 341, 428, 443, 544, 545, 558, 741, 742, 749, 750, 805, 819, 820, 7922, 7924, 7925, 7927, 7934, 7943, 7944, 7945, 7950, 8062, 8148, 8149, 8152, 8164, 8174, 8236, 8240, 8262, 8264, 8374, 8380, 8381, 8384, 8388, 8390, 8392, 8393, 8394, 8396, 8401, 8406, 8416, 8419, 8424, 8437, 8439, 8445, 8482, 8485, 8496, 8521, 8603, 8936, 8946, 9046, 9050, 9063, 9066, 9076, 9092, 9100, 9108, 9111, 9113, 9131, 9162, 9164, 9218, 9219, 11329, 11331, 11334, 11336, 11346, 11361, 11363, 11366, 11370, 11372, 11375, 11389, 11682, 11686, 11687, 11692, 11694, 11714, 11716, 11723, 11725, 11730, 11736, 11982, 11989, 12102, 12336, 12348, 12350, 12384, 12393, 12395, 12397, 12510, 12553, 12851, 12962, 12973, 13738, 13823, 13919, 13933, 14080, 14298, 14585, 14698, 15583, 15847, 16318, 16434, 16438, 16481, 16729, 17102, 17122, 17315, 17320, 17402, 17418, 17859, 17909, 17911, 17915, 17916, 17936, 17939, 17961, 18664, 18703, 18814, 18962, 19043, 33469, 33470, 33471, 33484, 33485, 33490, 33497, 33501, 33505, 33513, 33520, 33536, 33550, 37845, 37921, 37948, 38029, 38038, 38064, 38065, 38066, 38069, 38075, 38076, 38078, 39108, 39109, 39113, 39114, 39115, 39116, 39265, 39394, 189e3] };
  }
});

// ../../../node_modules/encoding/node_modules/iconv-lite/encodings/tables/cp949.json
var require_cp949 = __commonJS({
  "../../../node_modules/encoding/node_modules/iconv-lite/encodings/tables/cp949.json"(exports, module2) {
    module2.exports = [
      ["0", "\0", 127],
      ["8141", "\uAC02\uAC03\uAC05\uAC06\uAC0B", 4, "\uAC18\uAC1E\uAC1F\uAC21\uAC22\uAC23\uAC25", 6, "\uAC2E\uAC32\uAC33\uAC34"],
      ["8161", "\uAC35\uAC36\uAC37\uAC3A\uAC3B\uAC3D\uAC3E\uAC3F\uAC41", 9, "\uAC4C\uAC4E", 5, "\uAC55"],
      ["8181", "\uAC56\uAC57\uAC59\uAC5A\uAC5B\uAC5D", 18, "\uAC72\uAC73\uAC75\uAC76\uAC79\uAC7B", 4, "\uAC82\uAC87\uAC88\uAC8D\uAC8E\uAC8F\uAC91\uAC92\uAC93\uAC95", 6, "\uAC9E\uACA2", 5, "\uACAB\uACAD\uACAE\uACB1", 6, "\uACBA\uACBE\uACBF\uACC0\uACC2\uACC3\uACC5\uACC6\uACC7\uACC9\uACCA\uACCB\uACCD", 7, "\uACD6\uACD8", 7, "\uACE2\uACE3\uACE5\uACE6\uACE9\uACEB\uACED\uACEE\uACF2\uACF4\uACF7", 4, "\uACFE\uACFF\uAD01\uAD02\uAD03\uAD05\uAD07", 4, "\uAD0E\uAD10\uAD12\uAD13"],
      ["8241", "\uAD14\uAD15\uAD16\uAD17\uAD19\uAD1A\uAD1B\uAD1D\uAD1E\uAD1F\uAD21", 7, "\uAD2A\uAD2B\uAD2E", 5],
      ["8261", "\uAD36\uAD37\uAD39\uAD3A\uAD3B\uAD3D", 6, "\uAD46\uAD48\uAD4A", 5, "\uAD51\uAD52\uAD53\uAD55\uAD56\uAD57"],
      ["8281", "\uAD59", 7, "\uAD62\uAD64", 7, "\uAD6E\uAD6F\uAD71\uAD72\uAD77\uAD78\uAD79\uAD7A\uAD7E\uAD80\uAD83", 4, "\uAD8A\uAD8B\uAD8D\uAD8E\uAD8F\uAD91", 10, "\uAD9E", 5, "\uADA5", 17, "\uADB8", 7, "\uADC2\uADC3\uADC5\uADC6\uADC7\uADC9", 6, "\uADD2\uADD4", 7, "\uADDD\uADDE\uADDF\uADE1\uADE2\uADE3\uADE5", 18],
      ["8341", "\uADFA\uADFB\uADFD\uADFE\uAE02", 5, "\uAE0A\uAE0C\uAE0E", 5, "\uAE15", 7],
      ["8361", "\uAE1D", 18, "\uAE32\uAE33\uAE35\uAE36\uAE39\uAE3B\uAE3C"],
      ["8381", "\uAE3D\uAE3E\uAE3F\uAE42\uAE44\uAE47\uAE48\uAE49\uAE4B\uAE4F\uAE51\uAE52\uAE53\uAE55\uAE57", 4, "\uAE5E\uAE62\uAE63\uAE64\uAE66\uAE67\uAE6A\uAE6B\uAE6D\uAE6E\uAE6F\uAE71", 6, "\uAE7A\uAE7E", 5, "\uAE86", 5, "\uAE8D", 46, "\uAEBF\uAEC1\uAEC2\uAEC3\uAEC5", 6, "\uAECE\uAED2", 5, "\uAEDA\uAEDB\uAEDD", 8],
      ["8441", "\uAEE6\uAEE7\uAEE9\uAEEA\uAEEC\uAEEE", 5, "\uAEF5\uAEF6\uAEF7\uAEF9\uAEFA\uAEFB\uAEFD", 8],
      ["8461", "\uAF06\uAF09\uAF0A\uAF0B\uAF0C\uAF0E\uAF0F\uAF11", 18],
      ["8481", "\uAF24", 7, "\uAF2E\uAF2F\uAF31\uAF33\uAF35", 6, "\uAF3E\uAF40\uAF44\uAF45\uAF46\uAF47\uAF4A", 5, "\uAF51", 10, "\uAF5E", 5, "\uAF66", 18, "\uAF7A", 5, "\uAF81\uAF82\uAF83\uAF85\uAF86\uAF87\uAF89", 6, "\uAF92\uAF93\uAF94\uAF96", 5, "\uAF9D", 26, "\uAFBA\uAFBB\uAFBD\uAFBE"],
      ["8541", "\uAFBF\uAFC1", 5, "\uAFCA\uAFCC\uAFCF", 4, "\uAFD5", 6, "\uAFDD", 4],
      ["8561", "\uAFE2", 5, "\uAFEA", 5, "\uAFF2\uAFF3\uAFF5\uAFF6\uAFF7\uAFF9", 6, "\uB002\uB003"],
      ["8581", "\uB005", 6, "\uB00D\uB00E\uB00F\uB011\uB012\uB013\uB015", 6, "\uB01E", 9, "\uB029", 26, "\uB046\uB047\uB049\uB04B\uB04D\uB04F\uB050\uB051\uB052\uB056\uB058\uB05A\uB05B\uB05C\uB05E", 29, "\uB07E\uB07F\uB081\uB082\uB083\uB085", 6, "\uB08E\uB090\uB092", 5, "\uB09B\uB09D\uB09E\uB0A3\uB0A4"],
      ["8641", "\uB0A5\uB0A6\uB0A7\uB0AA\uB0B0\uB0B2\uB0B6\uB0B7\uB0B9\uB0BA\uB0BB\uB0BD", 6, "\uB0C6\uB0CA", 5, "\uB0D2"],
      ["8661", "\uB0D3\uB0D5\uB0D6\uB0D7\uB0D9", 6, "\uB0E1\uB0E2\uB0E3\uB0E4\uB0E6", 10],
      ["8681", "\uB0F1", 22, "\uB10A\uB10D\uB10E\uB10F\uB111\uB114\uB115\uB116\uB117\uB11A\uB11E", 4, "\uB126\uB127\uB129\uB12A\uB12B\uB12D", 6, "\uB136\uB13A", 5, "\uB142\uB143\uB145\uB146\uB147\uB149", 6, "\uB152\uB153\uB156\uB157\uB159\uB15A\uB15B\uB15D\uB15E\uB15F\uB161", 22, "\uB17A\uB17B\uB17D\uB17E\uB17F\uB181\uB183", 4, "\uB18A\uB18C\uB18E\uB18F\uB190\uB191\uB195\uB196\uB197\uB199\uB19A\uB19B\uB19D"],
      ["8741", "\uB19E", 9, "\uB1A9", 15],
      ["8761", "\uB1B9", 18, "\uB1CD\uB1CE\uB1CF\uB1D1\uB1D2\uB1D3\uB1D5"],
      ["8781", "\uB1D6", 5, "\uB1DE\uB1E0", 7, "\uB1EA\uB1EB\uB1ED\uB1EE\uB1EF\uB1F1", 7, "\uB1FA\uB1FC\uB1FE", 5, "\uB206\uB207\uB209\uB20A\uB20D", 6, "\uB216\uB218\uB21A", 5, "\uB221", 18, "\uB235", 6, "\uB23D", 26, "\uB259\uB25A\uB25B\uB25D\uB25E\uB25F\uB261", 6, "\uB26A", 4],
      ["8841", "\uB26F", 4, "\uB276", 5, "\uB27D", 6, "\uB286\uB287\uB288\uB28A", 4],
      ["8861", "\uB28F\uB292\uB293\uB295\uB296\uB297\uB29B", 4, "\uB2A2\uB2A4\uB2A7\uB2A8\uB2A9\uB2AB\uB2AD\uB2AE\uB2AF\uB2B1\uB2B2\uB2B3\uB2B5\uB2B6\uB2B7"],
      ["8881", "\uB2B8", 15, "\uB2CA\uB2CB\uB2CD\uB2CE\uB2CF\uB2D1\uB2D3", 4, "\uB2DA\uB2DC\uB2DE\uB2DF\uB2E0\uB2E1\uB2E3\uB2E7\uB2E9\uB2EA\uB2F0\uB2F1\uB2F2\uB2F6\uB2FC\uB2FD\uB2FE\uB302\uB303\uB305\uB306\uB307\uB309", 6, "\uB312\uB316", 5, "\uB31D", 54, "\uB357\uB359\uB35A\uB35D\uB360\uB361\uB362\uB363"],
      ["8941", "\uB366\uB368\uB36A\uB36C\uB36D\uB36F\uB372\uB373\uB375\uB376\uB377\uB379", 6, "\uB382\uB386", 5, "\uB38D"],
      ["8961", "\uB38E\uB38F\uB391\uB392\uB393\uB395", 10, "\uB3A2", 5, "\uB3A9\uB3AA\uB3AB\uB3AD"],
      ["8981", "\uB3AE", 21, "\uB3C6\uB3C7\uB3C9\uB3CA\uB3CD\uB3CF\uB3D1\uB3D2\uB3D3\uB3D6\uB3D8\uB3DA\uB3DC\uB3DE\uB3DF\uB3E1\uB3E2\uB3E3\uB3E5\uB3E6\uB3E7\uB3E9", 18, "\uB3FD", 18, "\uB411", 6, "\uB419\uB41A\uB41B\uB41D\uB41E\uB41F\uB421", 6, "\uB42A\uB42C", 7, "\uB435", 15],
      ["8a41", "\uB445", 10, "\uB452\uB453\uB455\uB456\uB457\uB459", 6, "\uB462\uB464\uB466"],
      ["8a61", "\uB467", 4, "\uB46D", 18, "\uB481\uB482"],
      ["8a81", "\uB483", 4, "\uB489", 19, "\uB49E", 5, "\uB4A5\uB4A6\uB4A7\uB4A9\uB4AA\uB4AB\uB4AD", 7, "\uB4B6\uB4B8\uB4BA", 5, "\uB4C1\uB4C2\uB4C3\uB4C5\uB4C6\uB4C7\uB4C9", 6, "\uB4D1\uB4D2\uB4D3\uB4D4\uB4D6", 5, "\uB4DE\uB4DF\uB4E1\uB4E2\uB4E5\uB4E7", 4, "\uB4EE\uB4F0\uB4F2", 5, "\uB4F9", 26, "\uB516\uB517\uB519\uB51A\uB51D"],
      ["8b41", "\uB51E", 5, "\uB526\uB52B", 4, "\uB532\uB533\uB535\uB536\uB537\uB539", 6, "\uB542\uB546"],
      ["8b61", "\uB547\uB548\uB549\uB54A\uB54E\uB54F\uB551\uB552\uB553\uB555", 6, "\uB55E\uB562", 8],
      ["8b81", "\uB56B", 52, "\uB5A2\uB5A3\uB5A5\uB5A6\uB5A7\uB5A9\uB5AC\uB5AD\uB5AE\uB5AF\uB5B2\uB5B6", 4, "\uB5BE\uB5BF\uB5C1\uB5C2\uB5C3\uB5C5", 6, "\uB5CE\uB5D2", 5, "\uB5D9", 18, "\uB5ED", 18],
      ["8c41", "\uB600", 15, "\uB612\uB613\uB615\uB616\uB617\uB619", 4],
      ["8c61", "\uB61E", 6, "\uB626", 5, "\uB62D", 6, "\uB635", 5],
      ["8c81", "\uB63B", 12, "\uB649", 26, "\uB665\uB666\uB667\uB669", 50, "\uB69E\uB69F\uB6A1\uB6A2\uB6A3\uB6A5", 5, "\uB6AD\uB6AE\uB6AF\uB6B0\uB6B2", 16],
      ["8d41", "\uB6C3", 16, "\uB6D5", 8],
      ["8d61", "\uB6DE", 17, "\uB6F1\uB6F2\uB6F3\uB6F5\uB6F6\uB6F7\uB6F9\uB6FA"],
      ["8d81", "\uB6FB", 4, "\uB702\uB703\uB704\uB706", 33, "\uB72A\uB72B\uB72D\uB72E\uB731", 6, "\uB73A\uB73C", 7, "\uB745\uB746\uB747\uB749\uB74A\uB74B\uB74D", 6, "\uB756", 9, "\uB761\uB762\uB763\uB765\uB766\uB767\uB769", 6, "\uB772\uB774\uB776", 5, "\uB77E\uB77F\uB781\uB782\uB783\uB785", 6, "\uB78E\uB793\uB794\uB795\uB79A\uB79B\uB79D\uB79E"],
      ["8e41", "\uB79F\uB7A1", 6, "\uB7AA\uB7AE", 5, "\uB7B6\uB7B7\uB7B9", 8],
      ["8e61", "\uB7C2", 4, "\uB7C8\uB7CA", 19],
      ["8e81", "\uB7DE", 13, "\uB7EE\uB7EF\uB7F1\uB7F2\uB7F3\uB7F5", 6, "\uB7FE\uB802", 4, "\uB80A\uB80B\uB80D\uB80E\uB80F\uB811", 6, "\uB81A\uB81C\uB81E", 5, "\uB826\uB827\uB829\uB82A\uB82B\uB82D", 6, "\uB836\uB83A", 5, "\uB841\uB842\uB843\uB845", 11, "\uB852\uB854", 7, "\uB85E\uB85F\uB861\uB862\uB863\uB865", 6, "\uB86E\uB870\uB872", 5, "\uB879\uB87A\uB87B\uB87D", 7],
      ["8f41", "\uB885", 7, "\uB88E", 17],
      ["8f61", "\uB8A0", 7, "\uB8A9", 6, "\uB8B1\uB8B2\uB8B3\uB8B5\uB8B6\uB8B7\uB8B9", 4],
      ["8f81", "\uB8BE\uB8BF\uB8C2\uB8C4\uB8C6", 5, "\uB8CD\uB8CE\uB8CF\uB8D1\uB8D2\uB8D3\uB8D5", 7, "\uB8DE\uB8E0\uB8E2", 5, "\uB8EA\uB8EB\uB8ED\uB8EE\uB8EF\uB8F1", 6, "\uB8FA\uB8FC\uB8FE", 5, "\uB905", 18, "\uB919", 6, "\uB921", 26, "\uB93E\uB93F\uB941\uB942\uB943\uB945", 6, "\uB94D\uB94E\uB950\uB952", 5],
      ["9041", "\uB95A\uB95B\uB95D\uB95E\uB95F\uB961", 6, "\uB96A\uB96C\uB96E", 5, "\uB976\uB977\uB979\uB97A\uB97B\uB97D"],
      ["9061", "\uB97E", 5, "\uB986\uB988\uB98B\uB98C\uB98F", 15],
      ["9081", "\uB99F", 12, "\uB9AE\uB9AF\uB9B1\uB9B2\uB9B3\uB9B5", 6, "\uB9BE\uB9C0\uB9C2", 5, "\uB9CA\uB9CB\uB9CD\uB9D3", 4, "\uB9DA\uB9DC\uB9DF\uB9E0\uB9E2\uB9E6\uB9E7\uB9E9\uB9EA\uB9EB\uB9ED", 6, "\uB9F6\uB9FB", 4, "\uBA02", 5, "\uBA09", 11, "\uBA16", 33, "\uBA3A\uBA3B\uBA3D\uBA3E\uBA3F\uBA41\uBA43\uBA44\uBA45\uBA46"],
      ["9141", "\uBA47\uBA4A\uBA4C\uBA4F\uBA50\uBA51\uBA52\uBA56\uBA57\uBA59\uBA5A\uBA5B\uBA5D", 6, "\uBA66\uBA6A", 5],
      ["9161", "\uBA72\uBA73\uBA75\uBA76\uBA77\uBA79", 9, "\uBA86\uBA88\uBA89\uBA8A\uBA8B\uBA8D", 5],
      ["9181", "\uBA93", 20, "\uBAAA\uBAAD\uBAAE\uBAAF\uBAB1\uBAB3", 4, "\uBABA\uBABC\uBABE", 5, "\uBAC5\uBAC6\uBAC7\uBAC9", 14, "\uBADA", 33, "\uBAFD\uBAFE\uBAFF\uBB01\uBB02\uBB03\uBB05", 7, "\uBB0E\uBB10\uBB12", 5, "\uBB19\uBB1A\uBB1B\uBB1D\uBB1E\uBB1F\uBB21", 6],
      ["9241", "\uBB28\uBB2A\uBB2C", 7, "\uBB37\uBB39\uBB3A\uBB3F", 4, "\uBB46\uBB48\uBB4A\uBB4B\uBB4C\uBB4E\uBB51\uBB52"],
      ["9261", "\uBB53\uBB55\uBB56\uBB57\uBB59", 7, "\uBB62\uBB64", 7, "\uBB6D", 4],
      ["9281", "\uBB72", 21, "\uBB89\uBB8A\uBB8B\uBB8D\uBB8E\uBB8F\uBB91", 18, "\uBBA5\uBBA6\uBBA7\uBBA9\uBBAA\uBBAB\uBBAD", 6, "\uBBB5\uBBB6\uBBB8", 7, "\uBBC1\uBBC2\uBBC3\uBBC5\uBBC6\uBBC7\uBBC9", 6, "\uBBD1\uBBD2\uBBD4", 35, "\uBBFA\uBBFB\uBBFD\uBBFE\uBC01"],
      ["9341", "\uBC03", 4, "\uBC0A\uBC0E\uBC10\uBC12\uBC13\uBC19\uBC1A\uBC20\uBC21\uBC22\uBC23\uBC26\uBC28\uBC2A\uBC2B\uBC2C\uBC2E\uBC2F\uBC32\uBC33\uBC35"],
      ["9361", "\uBC36\uBC37\uBC39", 6, "\uBC42\uBC46\uBC47\uBC48\uBC4A\uBC4B\uBC4E\uBC4F\uBC51", 8],
      ["9381", "\uBC5A\uBC5B\uBC5C\uBC5E", 37, "\uBC86\uBC87\uBC89\uBC8A\uBC8D\uBC8F", 4, "\uBC96\uBC98\uBC9B", 4, "\uBCA2\uBCA3\uBCA5\uBCA6\uBCA9", 6, "\uBCB2\uBCB6", 5, "\uBCBE\uBCBF\uBCC1\uBCC2\uBCC3\uBCC5", 7, "\uBCCE\uBCD2\uBCD3\uBCD4\uBCD6\uBCD7\uBCD9\uBCDA\uBCDB\uBCDD", 22, "\uBCF7\uBCF9\uBCFA\uBCFB\uBCFD"],
      ["9441", "\uBCFE", 5, "\uBD06\uBD08\uBD0A", 5, "\uBD11\uBD12\uBD13\uBD15", 8],
      ["9461", "\uBD1E", 5, "\uBD25", 6, "\uBD2D", 12],
      ["9481", "\uBD3A", 5, "\uBD41", 6, "\uBD4A\uBD4B\uBD4D\uBD4E\uBD4F\uBD51", 6, "\uBD5A", 9, "\uBD65\uBD66\uBD67\uBD69", 22, "\uBD82\uBD83\uBD85\uBD86\uBD8B", 4, "\uBD92\uBD94\uBD96\uBD97\uBD98\uBD9B\uBD9D", 6, "\uBDA5", 10, "\uBDB1", 6, "\uBDB9", 24],
      ["9541", "\uBDD2\uBDD3\uBDD6\uBDD7\uBDD9\uBDDA\uBDDB\uBDDD", 11, "\uBDEA", 5, "\uBDF1"],
      ["9561", "\uBDF2\uBDF3\uBDF5\uBDF6\uBDF7\uBDF9", 6, "\uBE01\uBE02\uBE04\uBE06", 5, "\uBE0E\uBE0F\uBE11\uBE12\uBE13"],
      ["9581", "\uBE15", 6, "\uBE1E\uBE20", 35, "\uBE46\uBE47\uBE49\uBE4A\uBE4B\uBE4D\uBE4F", 4, "\uBE56\uBE58\uBE5C\uBE5D\uBE5E\uBE5F\uBE62\uBE63\uBE65\uBE66\uBE67\uBE69\uBE6B", 4, "\uBE72\uBE76", 4, "\uBE7E\uBE7F\uBE81\uBE82\uBE83\uBE85", 6, "\uBE8E\uBE92", 5, "\uBE9A", 13, "\uBEA9", 14],
      ["9641", "\uBEB8", 23, "\uBED2\uBED3"],
      ["9661", "\uBED5\uBED6\uBED9", 6, "\uBEE1\uBEE2\uBEE6", 5, "\uBEED", 8],
      ["9681", "\uBEF6", 10, "\uBF02", 5, "\uBF0A", 13, "\uBF1A\uBF1E", 33, "\uBF42\uBF43\uBF45\uBF46\uBF47\uBF49", 6, "\uBF52\uBF53\uBF54\uBF56", 44],
      ["9741", "\uBF83", 16, "\uBF95", 8],
      ["9761", "\uBF9E", 17, "\uBFB1", 7],
      ["9781", "\uBFB9", 11, "\uBFC6", 5, "\uBFCE\uBFCF\uBFD1\uBFD2\uBFD3\uBFD5", 6, "\uBFDD\uBFDE\uBFE0\uBFE2", 89, "\uC03D\uC03E\uC03F"],
      ["9841", "\uC040", 16, "\uC052", 5, "\uC059\uC05A\uC05B"],
      ["9861", "\uC05D\uC05E\uC05F\uC061", 6, "\uC06A", 15],
      ["9881", "\uC07A", 21, "\uC092\uC093\uC095\uC096\uC097\uC099", 6, "\uC0A2\uC0A4\uC0A6", 5, "\uC0AE\uC0B1\uC0B2\uC0B7", 4, "\uC0BE\uC0C2\uC0C3\uC0C4\uC0C6\uC0C7\uC0CA\uC0CB\uC0CD\uC0CE\uC0CF\uC0D1", 6, "\uC0DA\uC0DE", 5, "\uC0E6\uC0E7\uC0E9\uC0EA\uC0EB\uC0ED", 6, "\uC0F6\uC0F8\uC0FA", 5, "\uC101\uC102\uC103\uC105\uC106\uC107\uC109", 6, "\uC111\uC112\uC113\uC114\uC116", 5, "\uC121\uC122\uC125\uC128\uC129\uC12A\uC12B\uC12E"],
      ["9941", "\uC132\uC133\uC134\uC135\uC137\uC13A\uC13B\uC13D\uC13E\uC13F\uC141", 6, "\uC14A\uC14E", 5, "\uC156\uC157"],
      ["9961", "\uC159\uC15A\uC15B\uC15D", 6, "\uC166\uC16A", 5, "\uC171\uC172\uC173\uC175\uC176\uC177\uC179\uC17A\uC17B"],
      ["9981", "\uC17C", 8, "\uC186", 5, "\uC18F\uC191\uC192\uC193\uC195\uC197", 4, "\uC19E\uC1A0\uC1A2\uC1A3\uC1A4\uC1A6\uC1A7\uC1AA\uC1AB\uC1AD\uC1AE\uC1AF\uC1B1", 11, "\uC1BE", 5, "\uC1C5\uC1C6\uC1C7\uC1C9\uC1CA\uC1CB\uC1CD", 6, "\uC1D5\uC1D6\uC1D9", 6, "\uC1E1\uC1E2\uC1E3\uC1E5\uC1E6\uC1E7\uC1E9", 6, "\uC1F2\uC1F4", 7, "\uC1FE\uC1FF\uC201\uC202\uC203\uC205", 6, "\uC20E\uC210\uC212", 5, "\uC21A\uC21B\uC21D\uC21E\uC221\uC222\uC223"],
      ["9a41", "\uC224\uC225\uC226\uC227\uC22A\uC22C\uC22E\uC230\uC233\uC235", 16],
      ["9a61", "\uC246\uC247\uC249", 6, "\uC252\uC253\uC255\uC256\uC257\uC259", 6, "\uC261\uC262\uC263\uC264\uC266"],
      ["9a81", "\uC267", 4, "\uC26E\uC26F\uC271\uC272\uC273\uC275", 6, "\uC27E\uC280\uC282", 5, "\uC28A", 5, "\uC291", 6, "\uC299\uC29A\uC29C\uC29E", 5, "\uC2A6\uC2A7\uC2A9\uC2AA\uC2AB\uC2AE", 5, "\uC2B6\uC2B8\uC2BA", 33, "\uC2DE\uC2DF\uC2E1\uC2E2\uC2E5", 5, "\uC2EE\uC2F0\uC2F2\uC2F3\uC2F4\uC2F5\uC2F7\uC2FA\uC2FD\uC2FE\uC2FF\uC301", 6, "\uC30A\uC30B\uC30E\uC30F"],
      ["9b41", "\uC310\uC311\uC312\uC316\uC317\uC319\uC31A\uC31B\uC31D", 6, "\uC326\uC327\uC32A", 8],
      ["9b61", "\uC333", 17, "\uC346", 7],
      ["9b81", "\uC34E", 25, "\uC36A\uC36B\uC36D\uC36E\uC36F\uC371\uC373", 4, "\uC37A\uC37B\uC37E", 5, "\uC385\uC386\uC387\uC389\uC38A\uC38B\uC38D", 50, "\uC3C1", 22, "\uC3DA"],
      ["9c41", "\uC3DB\uC3DD\uC3DE\uC3E1\uC3E3", 4, "\uC3EA\uC3EB\uC3EC\uC3EE", 5, "\uC3F6\uC3F7\uC3F9", 5],
      ["9c61", "\uC3FF", 8, "\uC409", 6, "\uC411", 9],
      ["9c81", "\uC41B", 8, "\uC425", 6, "\uC42D\uC42E\uC42F\uC431\uC432\uC433\uC435", 6, "\uC43E", 9, "\uC449", 26, "\uC466\uC467\uC469\uC46A\uC46B\uC46D", 6, "\uC476\uC477\uC478\uC47A", 5, "\uC481", 18, "\uC495", 6, "\uC49D", 12],
      ["9d41", "\uC4AA", 13, "\uC4B9\uC4BA\uC4BB\uC4BD", 8],
      ["9d61", "\uC4C6", 25],
      ["9d81", "\uC4E0", 8, "\uC4EA", 5, "\uC4F2\uC4F3\uC4F5\uC4F6\uC4F7\uC4F9\uC4FB\uC4FC\uC4FD\uC4FE\uC502", 9, "\uC50D\uC50E\uC50F\uC511\uC512\uC513\uC515", 6, "\uC51D", 10, "\uC52A\uC52B\uC52D\uC52E\uC52F\uC531", 6, "\uC53A\uC53C\uC53E", 5, "\uC546\uC547\uC54B\uC54F\uC550\uC551\uC552\uC556\uC55A\uC55B\uC55C\uC55F\uC562\uC563\uC565\uC566\uC567\uC569", 6, "\uC572\uC576", 5, "\uC57E\uC57F\uC581\uC582\uC583\uC585\uC586\uC588\uC589\uC58A\uC58B\uC58E\uC590\uC592\uC593\uC594"],
      ["9e41", "\uC596\uC599\uC59A\uC59B\uC59D\uC59E\uC59F\uC5A1", 7, "\uC5AA", 9, "\uC5B6"],
      ["9e61", "\uC5B7\uC5BA\uC5BF", 4, "\uC5CB\uC5CD\uC5CF\uC5D2\uC5D3\uC5D5\uC5D6\uC5D7\uC5D9", 6, "\uC5E2\uC5E4\uC5E6\uC5E7"],
      ["9e81", "\uC5E8\uC5E9\uC5EA\uC5EB\uC5EF\uC5F1\uC5F2\uC5F3\uC5F5\uC5F8\uC5F9\uC5FA\uC5FB\uC602\uC603\uC604\uC609\uC60A\uC60B\uC60D\uC60E\uC60F\uC611", 6, "\uC61A\uC61D", 6, "\uC626\uC627\uC629\uC62A\uC62B\uC62F\uC631\uC632\uC636\uC638\uC63A\uC63C\uC63D\uC63E\uC63F\uC642\uC643\uC645\uC646\uC647\uC649", 6, "\uC652\uC656", 5, "\uC65E\uC65F\uC661", 10, "\uC66D\uC66E\uC670\uC672", 5, "\uC67A\uC67B\uC67D\uC67E\uC67F\uC681", 6, "\uC68A\uC68C\uC68E", 5, "\uC696\uC697\uC699\uC69A\uC69B\uC69D", 6, "\uC6A6"],
      ["9f41", "\uC6A8\uC6AA", 5, "\uC6B2\uC6B3\uC6B5\uC6B6\uC6B7\uC6BB", 4, "\uC6C2\uC6C4\uC6C6", 5, "\uC6CE"],
      ["9f61", "\uC6CF\uC6D1\uC6D2\uC6D3\uC6D5", 6, "\uC6DE\uC6DF\uC6E2", 5, "\uC6EA\uC6EB\uC6ED\uC6EE\uC6EF\uC6F1\uC6F2"],
      ["9f81", "\uC6F3", 4, "\uC6FA\uC6FB\uC6FC\uC6FE", 5, "\uC706\uC707\uC709\uC70A\uC70B\uC70D", 6, "\uC716\uC718\uC71A", 5, "\uC722\uC723\uC725\uC726\uC727\uC729", 6, "\uC732\uC734\uC736\uC738\uC739\uC73A\uC73B\uC73E\uC73F\uC741\uC742\uC743\uC745", 4, "\uC74B\uC74E\uC750\uC759\uC75A\uC75B\uC75D\uC75E\uC75F\uC761", 6, "\uC769\uC76A\uC76C", 7, "\uC776\uC777\uC779\uC77A\uC77B\uC77F\uC780\uC781\uC782\uC786\uC78B\uC78C\uC78D\uC78F\uC792\uC793\uC795\uC799\uC79B", 4, "\uC7A2\uC7A7", 4, "\uC7AE\uC7AF\uC7B1\uC7B2\uC7B3\uC7B5\uC7B6\uC7B7"],
      ["a041", "\uC7B8\uC7B9\uC7BA\uC7BB\uC7BE\uC7C2", 5, "\uC7CA\uC7CB\uC7CD\uC7CF\uC7D1", 6, "\uC7D9\uC7DA\uC7DB\uC7DC"],
      ["a061", "\uC7DE", 5, "\uC7E5\uC7E6\uC7E7\uC7E9\uC7EA\uC7EB\uC7ED", 13],
      ["a081", "\uC7FB", 4, "\uC802\uC803\uC805\uC806\uC807\uC809\uC80B", 4, "\uC812\uC814\uC817", 4, "\uC81E\uC81F\uC821\uC822\uC823\uC825", 6, "\uC82E\uC830\uC832", 5, "\uC839\uC83A\uC83B\uC83D\uC83E\uC83F\uC841", 6, "\uC84A\uC84B\uC84E", 5, "\uC855", 26, "\uC872\uC873\uC875\uC876\uC877\uC879\uC87B", 4, "\uC882\uC884\uC888\uC889\uC88A\uC88E", 5, "\uC895", 7, "\uC89E\uC8A0\uC8A2\uC8A3\uC8A4"],
      ["a141", "\uC8A5\uC8A6\uC8A7\uC8A9", 18, "\uC8BE\uC8BF\uC8C0\uC8C1"],
      ["a161", "\uC8C2\uC8C3\uC8C5\uC8C6\uC8C7\uC8C9\uC8CA\uC8CB\uC8CD", 6, "\uC8D6\uC8D8\uC8DA", 5, "\uC8E2\uC8E3\uC8E5"],
      ["a181", "\uC8E6", 14, "\uC8F6", 5, "\uC8FE\uC8FF\uC901\uC902\uC903\uC907", 4, "\uC90E\u3000\u3001\u3002\xB7\u2025\u2026\xA8\u3003\xAD\u2015\u2225\uFF3C\u223C\u2018\u2019\u201C\u201D\u3014\u3015\u3008", 9, "\xB1\xD7\xF7\u2260\u2264\u2265\u221E\u2234\xB0\u2032\u2033\u2103\u212B\uFFE0\uFFE1\uFFE5\u2642\u2640\u2220\u22A5\u2312\u2202\u2207\u2261\u2252\xA7\u203B\u2606\u2605\u25CB\u25CF\u25CE\u25C7\u25C6\u25A1\u25A0\u25B3\u25B2\u25BD\u25BC\u2192\u2190\u2191\u2193\u2194\u3013\u226A\u226B\u221A\u223D\u221D\u2235\u222B\u222C\u2208\u220B\u2286\u2287\u2282\u2283\u222A\u2229\u2227\u2228\uFFE2"],
      ["a241", "\uC910\uC912", 5, "\uC919", 18],
      ["a261", "\uC92D", 6, "\uC935", 18],
      ["a281", "\uC948", 7, "\uC952\uC953\uC955\uC956\uC957\uC959", 6, "\uC962\uC964", 7, "\uC96D\uC96E\uC96F\u21D2\u21D4\u2200\u2203\xB4\uFF5E\u02C7\u02D8\u02DD\u02DA\u02D9\xB8\u02DB\xA1\xBF\u02D0\u222E\u2211\u220F\xA4\u2109\u2030\u25C1\u25C0\u25B7\u25B6\u2664\u2660\u2661\u2665\u2667\u2663\u2299\u25C8\u25A3\u25D0\u25D1\u2592\u25A4\u25A5\u25A8\u25A7\u25A6\u25A9\u2668\u260F\u260E\u261C\u261E\xB6\u2020\u2021\u2195\u2197\u2199\u2196\u2198\u266D\u2669\u266A\u266C\u327F\u321C\u2116\u33C7\u2122\u33C2\u33D8\u2121\u20AC\xAE"],
      ["a341", "\uC971\uC972\uC973\uC975", 6, "\uC97D", 10, "\uC98A\uC98B\uC98D\uC98E\uC98F"],
      ["a361", "\uC991", 6, "\uC99A\uC99C\uC99E", 16],
      ["a381", "\uC9AF", 16, "\uC9C2\uC9C3\uC9C5\uC9C6\uC9C9\uC9CB", 4, "\uC9D2\uC9D4\uC9D7\uC9D8\uC9DB\uFF01", 58, "\uFFE6\uFF3D", 32, "\uFFE3"],
      ["a441", "\uC9DE\uC9DF\uC9E1\uC9E3\uC9E5\uC9E6\uC9E8\uC9E9\uC9EA\uC9EB\uC9EE\uC9F2", 5, "\uC9FA\uC9FB\uC9FD\uC9FE\uC9FF\uCA01\uCA02\uCA03\uCA04"],
      ["a461", "\uCA05\uCA06\uCA07\uCA0A\uCA0E", 5, "\uCA15\uCA16\uCA17\uCA19", 12],
      ["a481", "\uCA26\uCA27\uCA28\uCA2A", 28, "\u3131", 93],
      ["a541", "\uCA47", 4, "\uCA4E\uCA4F\uCA51\uCA52\uCA53\uCA55", 6, "\uCA5E\uCA62", 5, "\uCA69\uCA6A"],
      ["a561", "\uCA6B", 17, "\uCA7E", 5, "\uCA85\uCA86"],
      ["a581", "\uCA87", 16, "\uCA99", 14, "\u2170", 9],
      ["a5b0", "\u2160", 9],
      ["a5c1", "\u0391", 16, "\u03A3", 6],
      ["a5e1", "\u03B1", 16, "\u03C3", 6],
      ["a641", "\uCAA8", 19, "\uCABE\uCABF\uCAC1\uCAC2\uCAC3\uCAC5"],
      ["a661", "\uCAC6", 5, "\uCACE\uCAD0\uCAD2\uCAD4\uCAD5\uCAD6\uCAD7\uCADA", 5, "\uCAE1", 6],
      ["a681", "\uCAE8\uCAE9\uCAEA\uCAEB\uCAED", 6, "\uCAF5", 18, "\uCB09\uCB0A\u2500\u2502\u250C\u2510\u2518\u2514\u251C\u252C\u2524\u2534\u253C\u2501\u2503\u250F\u2513\u251B\u2517\u2523\u2533\u252B\u253B\u254B\u2520\u252F\u2528\u2537\u253F\u251D\u2530\u2525\u2538\u2542\u2512\u2511\u251A\u2519\u2516\u2515\u250E\u250D\u251E\u251F\u2521\u2522\u2526\u2527\u2529\u252A\u252D\u252E\u2531\u2532\u2535\u2536\u2539\u253A\u253D\u253E\u2540\u2541\u2543", 7],
      ["a741", "\uCB0B", 4, "\uCB11\uCB12\uCB13\uCB15\uCB16\uCB17\uCB19", 6, "\uCB22", 7],
      ["a761", "\uCB2A", 22, "\uCB42\uCB43\uCB44"],
      ["a781", "\uCB45\uCB46\uCB47\uCB4A\uCB4B\uCB4D\uCB4E\uCB4F\uCB51", 6, "\uCB5A\uCB5B\uCB5C\uCB5E", 5, "\uCB65", 7, "\u3395\u3396\u3397\u2113\u3398\u33C4\u33A3\u33A4\u33A5\u33A6\u3399", 9, "\u33CA\u338D\u338E\u338F\u33CF\u3388\u3389\u33C8\u33A7\u33A8\u33B0", 9, "\u3380", 4, "\u33BA", 5, "\u3390", 4, "\u2126\u33C0\u33C1\u338A\u338B\u338C\u33D6\u33C5\u33AD\u33AE\u33AF\u33DB\u33A9\u33AA\u33AB\u33AC\u33DD\u33D0\u33D3\u33C3\u33C9\u33DC\u33C6"],
      ["a841", "\uCB6D", 10, "\uCB7A", 14],
      ["a861", "\uCB89", 18, "\uCB9D", 6],
      ["a881", "\uCBA4", 19, "\uCBB9", 11, "\xC6\xD0\xAA\u0126"],
      ["a8a6", "\u0132"],
      ["a8a8", "\u013F\u0141\xD8\u0152\xBA\xDE\u0166\u014A"],
      ["a8b1", "\u3260", 27, "\u24D0", 25, "\u2460", 14, "\xBD\u2153\u2154\xBC\xBE\u215B\u215C\u215D\u215E"],
      ["a941", "\uCBC5", 14, "\uCBD5", 10],
      ["a961", "\uCBE0\uCBE1\uCBE2\uCBE3\uCBE5\uCBE6\uCBE8\uCBEA", 18],
      ["a981", "\uCBFD", 14, "\uCC0E\uCC0F\uCC11\uCC12\uCC13\uCC15", 6, "\uCC1E\uCC1F\uCC20\uCC23\uCC24\xE6\u0111\xF0\u0127\u0131\u0133\u0138\u0140\u0142\xF8\u0153\xDF\xFE\u0167\u014B\u0149\u3200", 27, "\u249C", 25, "\u2474", 14, "\xB9\xB2\xB3\u2074\u207F\u2081\u2082\u2083\u2084"],
      ["aa41", "\uCC25\uCC26\uCC2A\uCC2B\uCC2D\uCC2F\uCC31", 6, "\uCC3A\uCC3F", 4, "\uCC46\uCC47\uCC49\uCC4A\uCC4B\uCC4D\uCC4E"],
      ["aa61", "\uCC4F", 4, "\uCC56\uCC5A", 5, "\uCC61\uCC62\uCC63\uCC65\uCC67\uCC69", 6, "\uCC71\uCC72"],
      ["aa81", "\uCC73\uCC74\uCC76", 29, "\u3041", 82],
      ["ab41", "\uCC94\uCC95\uCC96\uCC97\uCC9A\uCC9B\uCC9D\uCC9E\uCC9F\uCCA1", 6, "\uCCAA\uCCAE", 5, "\uCCB6\uCCB7\uCCB9"],
      ["ab61", "\uCCBA\uCCBB\uCCBD", 6, "\uCCC6\uCCC8\uCCCA", 5, "\uCCD1\uCCD2\uCCD3\uCCD5", 5],
      ["ab81", "\uCCDB", 8, "\uCCE5", 6, "\uCCED\uCCEE\uCCEF\uCCF1", 12, "\u30A1", 85],
      ["ac41", "\uCCFE\uCCFF\uCD00\uCD02", 5, "\uCD0A\uCD0B\uCD0D\uCD0E\uCD0F\uCD11", 6, "\uCD1A\uCD1C\uCD1E\uCD1F\uCD20"],
      ["ac61", "\uCD21\uCD22\uCD23\uCD25\uCD26\uCD27\uCD29\uCD2A\uCD2B\uCD2D", 11, "\uCD3A", 4],
      ["ac81", "\uCD3F", 28, "\uCD5D\uCD5E\uCD5F\u0410", 5, "\u0401\u0416", 25],
      ["acd1", "\u0430", 5, "\u0451\u0436", 25],
      ["ad41", "\uCD61\uCD62\uCD63\uCD65", 6, "\uCD6E\uCD70\uCD72", 5, "\uCD79", 7],
      ["ad61", "\uCD81", 6, "\uCD89", 10, "\uCD96\uCD97\uCD99\uCD9A\uCD9B\uCD9D\uCD9E\uCD9F"],
      ["ad81", "\uCDA0\uCDA1\uCDA2\uCDA3\uCDA6\uCDA8\uCDAA", 5, "\uCDB1", 18, "\uCDC5"],
      ["ae41", "\uCDC6", 5, "\uCDCD\uCDCE\uCDCF\uCDD1", 16],
      ["ae61", "\uCDE2", 5, "\uCDE9\uCDEA\uCDEB\uCDED\uCDEE\uCDEF\uCDF1", 6, "\uCDFA\uCDFC\uCDFE", 4],
      ["ae81", "\uCE03\uCE05\uCE06\uCE07\uCE09\uCE0A\uCE0B\uCE0D", 6, "\uCE15\uCE16\uCE17\uCE18\uCE1A", 5, "\uCE22\uCE23\uCE25\uCE26\uCE27\uCE29\uCE2A\uCE2B"],
      ["af41", "\uCE2C\uCE2D\uCE2E\uCE2F\uCE32\uCE34\uCE36", 19],
      ["af61", "\uCE4A", 13, "\uCE5A\uCE5B\uCE5D\uCE5E\uCE62", 5, "\uCE6A\uCE6C"],
      ["af81", "\uCE6E", 5, "\uCE76\uCE77\uCE79\uCE7A\uCE7B\uCE7D", 6, "\uCE86\uCE88\uCE8A", 5, "\uCE92\uCE93\uCE95\uCE96\uCE97\uCE99"],
      ["b041", "\uCE9A", 5, "\uCEA2\uCEA6", 5, "\uCEAE", 12],
      ["b061", "\uCEBB", 5, "\uCEC2", 19],
      ["b081", "\uCED6", 13, "\uCEE6\uCEE7\uCEE9\uCEEA\uCEED", 6, "\uCEF6\uCEFA", 5, "\uAC00\uAC01\uAC04\uAC07\uAC08\uAC09\uAC0A\uAC10", 7, "\uAC19", 4, "\uAC20\uAC24\uAC2C\uAC2D\uAC2F\uAC30\uAC31\uAC38\uAC39\uAC3C\uAC40\uAC4B\uAC4D\uAC54\uAC58\uAC5C\uAC70\uAC71\uAC74\uAC77\uAC78\uAC7A\uAC80\uAC81\uAC83\uAC84\uAC85\uAC86\uAC89\uAC8A\uAC8B\uAC8C\uAC90\uAC94\uAC9C\uAC9D\uAC9F\uACA0\uACA1\uACA8\uACA9\uACAA\uACAC\uACAF\uACB0\uACB8\uACB9\uACBB\uACBC\uACBD\uACC1\uACC4\uACC8\uACCC\uACD5\uACD7\uACE0\uACE1\uACE4\uACE7\uACE8\uACEA\uACEC\uACEF\uACF0\uACF1\uACF3\uACF5\uACF6\uACFC\uACFD\uAD00\uAD04\uAD06"],
      ["b141", "\uCF02\uCF03\uCF05\uCF06\uCF07\uCF09", 6, "\uCF12\uCF14\uCF16", 5, "\uCF1D\uCF1E\uCF1F\uCF21\uCF22\uCF23"],
      ["b161", "\uCF25", 6, "\uCF2E\uCF32", 5, "\uCF39", 11],
      ["b181", "\uCF45", 14, "\uCF56\uCF57\uCF59\uCF5A\uCF5B\uCF5D", 6, "\uCF66\uCF68\uCF6A\uCF6B\uCF6C\uAD0C\uAD0D\uAD0F\uAD11\uAD18\uAD1C\uAD20\uAD29\uAD2C\uAD2D\uAD34\uAD35\uAD38\uAD3C\uAD44\uAD45\uAD47\uAD49\uAD50\uAD54\uAD58\uAD61\uAD63\uAD6C\uAD6D\uAD70\uAD73\uAD74\uAD75\uAD76\uAD7B\uAD7C\uAD7D\uAD7F\uAD81\uAD82\uAD88\uAD89\uAD8C\uAD90\uAD9C\uAD9D\uADA4\uADB7\uADC0\uADC1\uADC4\uADC8\uADD0\uADD1\uADD3\uADDC\uADE0\uADE4\uADF8\uADF9\uADFC\uADFF\uAE00\uAE01\uAE08\uAE09\uAE0B\uAE0D\uAE14\uAE30\uAE31\uAE34\uAE37\uAE38\uAE3A\uAE40\uAE41\uAE43\uAE45\uAE46\uAE4A\uAE4C\uAE4D\uAE4E\uAE50\uAE54\uAE56\uAE5C\uAE5D\uAE5F\uAE60\uAE61\uAE65\uAE68\uAE69\uAE6C\uAE70\uAE78"],
      ["b241", "\uCF6D\uCF6E\uCF6F\uCF72\uCF73\uCF75\uCF76\uCF77\uCF79", 6, "\uCF81\uCF82\uCF83\uCF84\uCF86", 5, "\uCF8D"],
      ["b261", "\uCF8E", 18, "\uCFA2", 5, "\uCFA9"],
      ["b281", "\uCFAA", 5, "\uCFB1", 18, "\uCFC5", 6, "\uAE79\uAE7B\uAE7C\uAE7D\uAE84\uAE85\uAE8C\uAEBC\uAEBD\uAEBE\uAEC0\uAEC4\uAECC\uAECD\uAECF\uAED0\uAED1\uAED8\uAED9\uAEDC\uAEE8\uAEEB\uAEED\uAEF4\uAEF8\uAEFC\uAF07\uAF08\uAF0D\uAF10\uAF2C\uAF2D\uAF30\uAF32\uAF34\uAF3C\uAF3D\uAF3F\uAF41\uAF42\uAF43\uAF48\uAF49\uAF50\uAF5C\uAF5D\uAF64\uAF65\uAF79\uAF80\uAF84\uAF88\uAF90\uAF91\uAF95\uAF9C\uAFB8\uAFB9\uAFBC\uAFC0\uAFC7\uAFC8\uAFC9\uAFCB\uAFCD\uAFCE\uAFD4\uAFDC\uAFE8\uAFE9\uAFF0\uAFF1\uAFF4\uAFF8\uB000\uB001\uB004\uB00C\uB010\uB014\uB01C\uB01D\uB028\uB044\uB045\uB048\uB04A\uB04C\uB04E\uB053\uB054\uB055\uB057\uB059"],
      ["b341", "\uCFCC", 19, "\uCFE2\uCFE3\uCFE5\uCFE6\uCFE7\uCFE9"],
      ["b361", "\uCFEA", 5, "\uCFF2\uCFF4\uCFF6", 5, "\uCFFD\uCFFE\uCFFF\uD001\uD002\uD003\uD005", 5],
      ["b381", "\uD00B", 5, "\uD012", 5, "\uD019", 19, "\uB05D\uB07C\uB07D\uB080\uB084\uB08C\uB08D\uB08F\uB091\uB098\uB099\uB09A\uB09C\uB09F\uB0A0\uB0A1\uB0A2\uB0A8\uB0A9\uB0AB", 4, "\uB0B1\uB0B3\uB0B4\uB0B5\uB0B8\uB0BC\uB0C4\uB0C5\uB0C7\uB0C8\uB0C9\uB0D0\uB0D1\uB0D4\uB0D8\uB0E0\uB0E5\uB108\uB109\uB10B\uB10C\uB110\uB112\uB113\uB118\uB119\uB11B\uB11C\uB11D\uB123\uB124\uB125\uB128\uB12C\uB134\uB135\uB137\uB138\uB139\uB140\uB141\uB144\uB148\uB150\uB151\uB154\uB155\uB158\uB15C\uB160\uB178\uB179\uB17C\uB180\uB182\uB188\uB189\uB18B\uB18D\uB192\uB193\uB194\uB198\uB19C\uB1A8\uB1CC\uB1D0\uB1D4\uB1DC\uB1DD"],
      ["b441", "\uD02E", 5, "\uD036\uD037\uD039\uD03A\uD03B\uD03D", 6, "\uD046\uD048\uD04A", 5],
      ["b461", "\uD051\uD052\uD053\uD055\uD056\uD057\uD059", 6, "\uD061", 10, "\uD06E\uD06F"],
      ["b481", "\uD071\uD072\uD073\uD075", 6, "\uD07E\uD07F\uD080\uD082", 18, "\uB1DF\uB1E8\uB1E9\uB1EC\uB1F0\uB1F9\uB1FB\uB1FD\uB204\uB205\uB208\uB20B\uB20C\uB214\uB215\uB217\uB219\uB220\uB234\uB23C\uB258\uB25C\uB260\uB268\uB269\uB274\uB275\uB27C\uB284\uB285\uB289\uB290\uB291\uB294\uB298\uB299\uB29A\uB2A0\uB2A1\uB2A3\uB2A5\uB2A6\uB2AA\uB2AC\uB2B0\uB2B4\uB2C8\uB2C9\uB2CC\uB2D0\uB2D2\uB2D8\uB2D9\uB2DB\uB2DD\uB2E2\uB2E4\uB2E5\uB2E6\uB2E8\uB2EB", 4, "\uB2F3\uB2F4\uB2F5\uB2F7", 4, "\uB2FF\uB300\uB301\uB304\uB308\uB310\uB311\uB313\uB314\uB315\uB31C\uB354\uB355\uB356\uB358\uB35B\uB35C\uB35E\uB35F\uB364\uB365"],
      ["b541", "\uD095", 14, "\uD0A6\uD0A7\uD0A9\uD0AA\uD0AB\uD0AD", 5],
      ["b561", "\uD0B3\uD0B6\uD0B8\uD0BA", 5, "\uD0C2\uD0C3\uD0C5\uD0C6\uD0C7\uD0CA", 5, "\uD0D2\uD0D6", 4],
      ["b581", "\uD0DB\uD0DE\uD0DF\uD0E1\uD0E2\uD0E3\uD0E5", 6, "\uD0EE\uD0F2", 5, "\uD0F9", 11, "\uB367\uB369\uB36B\uB36E\uB370\uB371\uB374\uB378\uB380\uB381\uB383\uB384\uB385\uB38C\uB390\uB394\uB3A0\uB3A1\uB3A8\uB3AC\uB3C4\uB3C5\uB3C8\uB3CB\uB3CC\uB3CE\uB3D0\uB3D4\uB3D5\uB3D7\uB3D9\uB3DB\uB3DD\uB3E0\uB3E4\uB3E8\uB3FC\uB410\uB418\uB41C\uB420\uB428\uB429\uB42B\uB434\uB450\uB451\uB454\uB458\uB460\uB461\uB463\uB465\uB46C\uB480\uB488\uB49D\uB4A4\uB4A8\uB4AC\uB4B5\uB4B7\uB4B9\uB4C0\uB4C4\uB4C8\uB4D0\uB4D5\uB4DC\uB4DD\uB4E0\uB4E3\uB4E4\uB4E6\uB4EC\uB4ED\uB4EF\uB4F1\uB4F8\uB514\uB515\uB518\uB51B\uB51C\uB524\uB525\uB527\uB528\uB529\uB52A\uB530\uB531\uB534\uB538"],
      ["b641", "\uD105", 7, "\uD10E", 17],
      ["b661", "\uD120", 15, "\uD132\uD133\uD135\uD136\uD137\uD139\uD13B\uD13C\uD13D\uD13E"],
      ["b681", "\uD13F\uD142\uD146", 5, "\uD14E\uD14F\uD151\uD152\uD153\uD155", 6, "\uD15E\uD160\uD162", 5, "\uD169\uD16A\uD16B\uD16D\uB540\uB541\uB543\uB544\uB545\uB54B\uB54C\uB54D\uB550\uB554\uB55C\uB55D\uB55F\uB560\uB561\uB5A0\uB5A1\uB5A4\uB5A8\uB5AA\uB5AB\uB5B0\uB5B1\uB5B3\uB5B4\uB5B5\uB5BB\uB5BC\uB5BD\uB5C0\uB5C4\uB5CC\uB5CD\uB5CF\uB5D0\uB5D1\uB5D8\uB5EC\uB610\uB611\uB614\uB618\uB625\uB62C\uB634\uB648\uB664\uB668\uB69C\uB69D\uB6A0\uB6A4\uB6AB\uB6AC\uB6B1\uB6D4\uB6F0\uB6F4\uB6F8\uB700\uB701\uB705\uB728\uB729\uB72C\uB72F\uB730\uB738\uB739\uB73B\uB744\uB748\uB74C\uB754\uB755\uB760\uB764\uB768\uB770\uB771\uB773\uB775\uB77C\uB77D\uB780\uB784\uB78C\uB78D\uB78F\uB790\uB791\uB792\uB796\uB797"],
      ["b741", "\uD16E", 13, "\uD17D", 6, "\uD185\uD186\uD187\uD189\uD18A"],
      ["b761", "\uD18B", 20, "\uD1A2\uD1A3\uD1A5\uD1A6\uD1A7"],
      ["b781", "\uD1A9", 6, "\uD1B2\uD1B4\uD1B6\uD1B7\uD1B8\uD1B9\uD1BB\uD1BD\uD1BE\uD1BF\uD1C1", 14, "\uB798\uB799\uB79C\uB7A0\uB7A8\uB7A9\uB7AB\uB7AC\uB7AD\uB7B4\uB7B5\uB7B8\uB7C7\uB7C9\uB7EC\uB7ED\uB7F0\uB7F4\uB7FC\uB7FD\uB7FF\uB800\uB801\uB807\uB808\uB809\uB80C\uB810\uB818\uB819\uB81B\uB81D\uB824\uB825\uB828\uB82C\uB834\uB835\uB837\uB838\uB839\uB840\uB844\uB851\uB853\uB85C\uB85D\uB860\uB864\uB86C\uB86D\uB86F\uB871\uB878\uB87C\uB88D\uB8A8\uB8B0\uB8B4\uB8B8\uB8C0\uB8C1\uB8C3\uB8C5\uB8CC\uB8D0\uB8D4\uB8DD\uB8DF\uB8E1\uB8E8\uB8E9\uB8EC\uB8F0\uB8F8\uB8F9\uB8FB\uB8FD\uB904\uB918\uB920\uB93C\uB93D\uB940\uB944\uB94C\uB94F\uB951\uB958\uB959\uB95C\uB960\uB968\uB969"],
      ["b841", "\uD1D0", 7, "\uD1D9", 17],
      ["b861", "\uD1EB", 8, "\uD1F5\uD1F6\uD1F7\uD1F9", 13],
      ["b881", "\uD208\uD20A", 5, "\uD211", 24, "\uB96B\uB96D\uB974\uB975\uB978\uB97C\uB984\uB985\uB987\uB989\uB98A\uB98D\uB98E\uB9AC\uB9AD\uB9B0\uB9B4\uB9BC\uB9BD\uB9BF\uB9C1\uB9C8\uB9C9\uB9CC\uB9CE", 4, "\uB9D8\uB9D9\uB9DB\uB9DD\uB9DE\uB9E1\uB9E3\uB9E4\uB9E5\uB9E8\uB9EC\uB9F4\uB9F5\uB9F7\uB9F8\uB9F9\uB9FA\uBA00\uBA01\uBA08\uBA15\uBA38\uBA39\uBA3C\uBA40\uBA42\uBA48\uBA49\uBA4B\uBA4D\uBA4E\uBA53\uBA54\uBA55\uBA58\uBA5C\uBA64\uBA65\uBA67\uBA68\uBA69\uBA70\uBA71\uBA74\uBA78\uBA83\uBA84\uBA85\uBA87\uBA8C\uBAA8\uBAA9\uBAAB\uBAAC\uBAB0\uBAB2\uBAB8\uBAB9\uBABB\uBABD\uBAC4\uBAC8\uBAD8\uBAD9\uBAFC"],
      ["b941", "\uD22A\uD22B\uD22E\uD22F\uD231\uD232\uD233\uD235", 6, "\uD23E\uD240\uD242", 5, "\uD249\uD24A\uD24B\uD24C"],
      ["b961", "\uD24D", 14, "\uD25D", 6, "\uD265\uD266\uD267\uD268"],
      ["b981", "\uD269", 22, "\uD282\uD283\uD285\uD286\uD287\uD289\uD28A\uD28B\uD28C\uBB00\uBB04\uBB0D\uBB0F\uBB11\uBB18\uBB1C\uBB20\uBB29\uBB2B\uBB34\uBB35\uBB36\uBB38\uBB3B\uBB3C\uBB3D\uBB3E\uBB44\uBB45\uBB47\uBB49\uBB4D\uBB4F\uBB50\uBB54\uBB58\uBB61\uBB63\uBB6C\uBB88\uBB8C\uBB90\uBBA4\uBBA8\uBBAC\uBBB4\uBBB7\uBBC0\uBBC4\uBBC8\uBBD0\uBBD3\uBBF8\uBBF9\uBBFC\uBBFF\uBC00\uBC02\uBC08\uBC09\uBC0B\uBC0C\uBC0D\uBC0F\uBC11\uBC14", 4, "\uBC1B", 4, "\uBC24\uBC25\uBC27\uBC29\uBC2D\uBC30\uBC31\uBC34\uBC38\uBC40\uBC41\uBC43\uBC44\uBC45\uBC49\uBC4C\uBC4D\uBC50\uBC5D\uBC84\uBC85\uBC88\uBC8B\uBC8C\uBC8E\uBC94\uBC95\uBC97"],
      ["ba41", "\uD28D\uD28E\uD28F\uD292\uD293\uD294\uD296", 5, "\uD29D\uD29E\uD29F\uD2A1\uD2A2\uD2A3\uD2A5", 6, "\uD2AD"],
      ["ba61", "\uD2AE\uD2AF\uD2B0\uD2B2", 5, "\uD2BA\uD2BB\uD2BD\uD2BE\uD2C1\uD2C3", 4, "\uD2CA\uD2CC", 5],
      ["ba81", "\uD2D2\uD2D3\uD2D5\uD2D6\uD2D7\uD2D9\uD2DA\uD2DB\uD2DD", 6, "\uD2E6", 9, "\uD2F2\uD2F3\uD2F5\uD2F6\uD2F7\uD2F9\uD2FA\uBC99\uBC9A\uBCA0\uBCA1\uBCA4\uBCA7\uBCA8\uBCB0\uBCB1\uBCB3\uBCB4\uBCB5\uBCBC\uBCBD\uBCC0\uBCC4\uBCCD\uBCCF\uBCD0\uBCD1\uBCD5\uBCD8\uBCDC\uBCF4\uBCF5\uBCF6\uBCF8\uBCFC\uBD04\uBD05\uBD07\uBD09\uBD10\uBD14\uBD24\uBD2C\uBD40\uBD48\uBD49\uBD4C\uBD50\uBD58\uBD59\uBD64\uBD68\uBD80\uBD81\uBD84\uBD87\uBD88\uBD89\uBD8A\uBD90\uBD91\uBD93\uBD95\uBD99\uBD9A\uBD9C\uBDA4\uBDB0\uBDB8\uBDD4\uBDD5\uBDD8\uBDDC\uBDE9\uBDF0\uBDF4\uBDF8\uBE00\uBE03\uBE05\uBE0C\uBE0D\uBE10\uBE14\uBE1C\uBE1D\uBE1F\uBE44\uBE45\uBE48\uBE4C\uBE4E\uBE54\uBE55\uBE57\uBE59\uBE5A\uBE5B\uBE60\uBE61\uBE64"],
      ["bb41", "\uD2FB", 4, "\uD302\uD304\uD306", 5, "\uD30F\uD311\uD312\uD313\uD315\uD317", 4, "\uD31E\uD322\uD323"],
      ["bb61", "\uD324\uD326\uD327\uD32A\uD32B\uD32D\uD32E\uD32F\uD331", 6, "\uD33A\uD33E", 5, "\uD346\uD347\uD348\uD349"],
      ["bb81", "\uD34A", 31, "\uBE68\uBE6A\uBE70\uBE71\uBE73\uBE74\uBE75\uBE7B\uBE7C\uBE7D\uBE80\uBE84\uBE8C\uBE8D\uBE8F\uBE90\uBE91\uBE98\uBE99\uBEA8\uBED0\uBED1\uBED4\uBED7\uBED8\uBEE0\uBEE3\uBEE4\uBEE5\uBEEC\uBF01\uBF08\uBF09\uBF18\uBF19\uBF1B\uBF1C\uBF1D\uBF40\uBF41\uBF44\uBF48\uBF50\uBF51\uBF55\uBF94\uBFB0\uBFC5\uBFCC\uBFCD\uBFD0\uBFD4\uBFDC\uBFDF\uBFE1\uC03C\uC051\uC058\uC05C\uC060\uC068\uC069\uC090\uC091\uC094\uC098\uC0A0\uC0A1\uC0A3\uC0A5\uC0AC\uC0AD\uC0AF\uC0B0\uC0B3\uC0B4\uC0B5\uC0B6\uC0BC\uC0BD\uC0BF\uC0C0\uC0C1\uC0C5\uC0C8\uC0C9\uC0CC\uC0D0\uC0D8\uC0D9\uC0DB\uC0DC\uC0DD\uC0E4"],
      ["bc41", "\uD36A", 17, "\uD37E\uD37F\uD381\uD382\uD383\uD385\uD386\uD387"],
      ["bc61", "\uD388\uD389\uD38A\uD38B\uD38E\uD392", 5, "\uD39A\uD39B\uD39D\uD39E\uD39F\uD3A1", 6, "\uD3AA\uD3AC\uD3AE"],
      ["bc81", "\uD3AF", 4, "\uD3B5\uD3B6\uD3B7\uD3B9\uD3BA\uD3BB\uD3BD", 6, "\uD3C6\uD3C7\uD3CA", 5, "\uD3D1", 5, "\uC0E5\uC0E8\uC0EC\uC0F4\uC0F5\uC0F7\uC0F9\uC100\uC104\uC108\uC110\uC115\uC11C", 4, "\uC123\uC124\uC126\uC127\uC12C\uC12D\uC12F\uC130\uC131\uC136\uC138\uC139\uC13C\uC140\uC148\uC149\uC14B\uC14C\uC14D\uC154\uC155\uC158\uC15C\uC164\uC165\uC167\uC168\uC169\uC170\uC174\uC178\uC185\uC18C\uC18D\uC18E\uC190\uC194\uC196\uC19C\uC19D\uC19F\uC1A1\uC1A5\uC1A8\uC1A9\uC1AC\uC1B0\uC1BD\uC1C4\uC1C8\uC1CC\uC1D4\uC1D7\uC1D8\uC1E0\uC1E4\uC1E8\uC1F0\uC1F1\uC1F3\uC1FC\uC1FD\uC200\uC204\uC20C\uC20D\uC20F\uC211\uC218\uC219\uC21C\uC21F\uC220\uC228\uC229\uC22B\uC22D"],
      ["bd41", "\uD3D7\uD3D9", 7, "\uD3E2\uD3E4", 7, "\uD3EE\uD3EF\uD3F1\uD3F2\uD3F3\uD3F5\uD3F6\uD3F7"],
      ["bd61", "\uD3F8\uD3F9\uD3FA\uD3FB\uD3FE\uD400\uD402", 5, "\uD409", 13],
      ["bd81", "\uD417", 5, "\uD41E", 25, "\uC22F\uC231\uC232\uC234\uC248\uC250\uC251\uC254\uC258\uC260\uC265\uC26C\uC26D\uC270\uC274\uC27C\uC27D\uC27F\uC281\uC288\uC289\uC290\uC298\uC29B\uC29D\uC2A4\uC2A5\uC2A8\uC2AC\uC2AD\uC2B4\uC2B5\uC2B7\uC2B9\uC2DC\uC2DD\uC2E0\uC2E3\uC2E4\uC2EB\uC2EC\uC2ED\uC2EF\uC2F1\uC2F6\uC2F8\uC2F9\uC2FB\uC2FC\uC300\uC308\uC309\uC30C\uC30D\uC313\uC314\uC315\uC318\uC31C\uC324\uC325\uC328\uC329\uC345\uC368\uC369\uC36C\uC370\uC372\uC378\uC379\uC37C\uC37D\uC384\uC388\uC38C\uC3C0\uC3D8\uC3D9\uC3DC\uC3DF\uC3E0\uC3E2\uC3E8\uC3E9\uC3ED\uC3F4\uC3F5\uC3F8\uC408\uC410\uC424\uC42C\uC430"],
      ["be41", "\uD438", 7, "\uD441\uD442\uD443\uD445", 14],
      ["be61", "\uD454", 7, "\uD45D\uD45E\uD45F\uD461\uD462\uD463\uD465", 7, "\uD46E\uD470\uD471\uD472"],
      ["be81", "\uD473", 4, "\uD47A\uD47B\uD47D\uD47E\uD481\uD483", 4, "\uD48A\uD48C\uD48E", 5, "\uD495", 8, "\uC434\uC43C\uC43D\uC448\uC464\uC465\uC468\uC46C\uC474\uC475\uC479\uC480\uC494\uC49C\uC4B8\uC4BC\uC4E9\uC4F0\uC4F1\uC4F4\uC4F8\uC4FA\uC4FF\uC500\uC501\uC50C\uC510\uC514\uC51C\uC528\uC529\uC52C\uC530\uC538\uC539\uC53B\uC53D\uC544\uC545\uC548\uC549\uC54A\uC54C\uC54D\uC54E\uC553\uC554\uC555\uC557\uC558\uC559\uC55D\uC55E\uC560\uC561\uC564\uC568\uC570\uC571\uC573\uC574\uC575\uC57C\uC57D\uC580\uC584\uC587\uC58C\uC58D\uC58F\uC591\uC595\uC597\uC598\uC59C\uC5A0\uC5A9\uC5B4\uC5B5\uC5B8\uC5B9\uC5BB\uC5BC\uC5BD\uC5BE\uC5C4", 6, "\uC5CC\uC5CE"],
      ["bf41", "\uD49E", 10, "\uD4AA", 14],
      ["bf61", "\uD4B9", 18, "\uD4CD\uD4CE\uD4CF\uD4D1\uD4D2\uD4D3\uD4D5"],
      ["bf81", "\uD4D6", 5, "\uD4DD\uD4DE\uD4E0", 7, "\uD4E9\uD4EA\uD4EB\uD4ED\uD4EE\uD4EF\uD4F1", 6, "\uD4F9\uD4FA\uD4FC\uC5D0\uC5D1\uC5D4\uC5D8\uC5E0\uC5E1\uC5E3\uC5E5\uC5EC\uC5ED\uC5EE\uC5F0\uC5F4\uC5F6\uC5F7\uC5FC", 5, "\uC605\uC606\uC607\uC608\uC60C\uC610\uC618\uC619\uC61B\uC61C\uC624\uC625\uC628\uC62C\uC62D\uC62E\uC630\uC633\uC634\uC635\uC637\uC639\uC63B\uC640\uC641\uC644\uC648\uC650\uC651\uC653\uC654\uC655\uC65C\uC65D\uC660\uC66C\uC66F\uC671\uC678\uC679\uC67C\uC680\uC688\uC689\uC68B\uC68D\uC694\uC695\uC698\uC69C\uC6A4\uC6A5\uC6A7\uC6A9\uC6B0\uC6B1\uC6B4\uC6B8\uC6B9\uC6BA\uC6C0\uC6C1\uC6C3\uC6C5\uC6CC\uC6CD\uC6D0\uC6D4\uC6DC\uC6DD\uC6E0\uC6E1\uC6E8"],
      ["c041", "\uD4FE", 5, "\uD505\uD506\uD507\uD509\uD50A\uD50B\uD50D", 6, "\uD516\uD518", 5],
      ["c061", "\uD51E", 25],
      ["c081", "\uD538\uD539\uD53A\uD53B\uD53E\uD53F\uD541\uD542\uD543\uD545", 6, "\uD54E\uD550\uD552", 5, "\uD55A\uD55B\uD55D\uD55E\uD55F\uD561\uD562\uD563\uC6E9\uC6EC\uC6F0\uC6F8\uC6F9\uC6FD\uC704\uC705\uC708\uC70C\uC714\uC715\uC717\uC719\uC720\uC721\uC724\uC728\uC730\uC731\uC733\uC735\uC737\uC73C\uC73D\uC740\uC744\uC74A\uC74C\uC74D\uC74F\uC751", 7, "\uC75C\uC760\uC768\uC76B\uC774\uC775\uC778\uC77C\uC77D\uC77E\uC783\uC784\uC785\uC787\uC788\uC789\uC78A\uC78E\uC790\uC791\uC794\uC796\uC797\uC798\uC79A\uC7A0\uC7A1\uC7A3\uC7A4\uC7A5\uC7A6\uC7AC\uC7AD\uC7B0\uC7B4\uC7BC\uC7BD\uC7BF\uC7C0\uC7C1\uC7C8\uC7C9\uC7CC\uC7CE\uC7D0\uC7D8\uC7DD\uC7E4\uC7E8\uC7EC\uC800\uC801\uC804\uC808\uC80A"],
      ["c141", "\uD564\uD566\uD567\uD56A\uD56C\uD56E", 5, "\uD576\uD577\uD579\uD57A\uD57B\uD57D", 6, "\uD586\uD58A\uD58B"],
      ["c161", "\uD58C\uD58D\uD58E\uD58F\uD591", 19, "\uD5A6\uD5A7"],
      ["c181", "\uD5A8", 31, "\uC810\uC811\uC813\uC815\uC816\uC81C\uC81D\uC820\uC824\uC82C\uC82D\uC82F\uC831\uC838\uC83C\uC840\uC848\uC849\uC84C\uC84D\uC854\uC870\uC871\uC874\uC878\uC87A\uC880\uC881\uC883\uC885\uC886\uC887\uC88B\uC88C\uC88D\uC894\uC89D\uC89F\uC8A1\uC8A8\uC8BC\uC8BD\uC8C4\uC8C8\uC8CC\uC8D4\uC8D5\uC8D7\uC8D9\uC8E0\uC8E1\uC8E4\uC8F5\uC8FC\uC8FD\uC900\uC904\uC905\uC906\uC90C\uC90D\uC90F\uC911\uC918\uC92C\uC934\uC950\uC951\uC954\uC958\uC960\uC961\uC963\uC96C\uC970\uC974\uC97C\uC988\uC989\uC98C\uC990\uC998\uC999\uC99B\uC99D\uC9C0\uC9C1\uC9C4\uC9C7\uC9C8\uC9CA\uC9D0\uC9D1\uC9D3"],
      ["c241", "\uD5CA\uD5CB\uD5CD\uD5CE\uD5CF\uD5D1\uD5D3", 4, "\uD5DA\uD5DC\uD5DE", 5, "\uD5E6\uD5E7\uD5E9\uD5EA\uD5EB\uD5ED\uD5EE"],
      ["c261", "\uD5EF", 4, "\uD5F6\uD5F8\uD5FA", 5, "\uD602\uD603\uD605\uD606\uD607\uD609", 6, "\uD612"],
      ["c281", "\uD616", 5, "\uD61D\uD61E\uD61F\uD621\uD622\uD623\uD625", 7, "\uD62E", 9, "\uD63A\uD63B\uC9D5\uC9D6\uC9D9\uC9DA\uC9DC\uC9DD\uC9E0\uC9E2\uC9E4\uC9E7\uC9EC\uC9ED\uC9EF\uC9F0\uC9F1\uC9F8\uC9F9\uC9FC\uCA00\uCA08\uCA09\uCA0B\uCA0C\uCA0D\uCA14\uCA18\uCA29\uCA4C\uCA4D\uCA50\uCA54\uCA5C\uCA5D\uCA5F\uCA60\uCA61\uCA68\uCA7D\uCA84\uCA98\uCABC\uCABD\uCAC0\uCAC4\uCACC\uCACD\uCACF\uCAD1\uCAD3\uCAD8\uCAD9\uCAE0\uCAEC\uCAF4\uCB08\uCB10\uCB14\uCB18\uCB20\uCB21\uCB41\uCB48\uCB49\uCB4C\uCB50\uCB58\uCB59\uCB5D\uCB64\uCB78\uCB79\uCB9C\uCBB8\uCBD4\uCBE4\uCBE7\uCBE9\uCC0C\uCC0D\uCC10\uCC14\uCC1C\uCC1D\uCC21\uCC22\uCC27\uCC28\uCC29\uCC2C\uCC2E\uCC30\uCC38\uCC39\uCC3B"],
      ["c341", "\uD63D\uD63E\uD63F\uD641\uD642\uD643\uD644\uD646\uD647\uD64A\uD64C\uD64E\uD64F\uD650\uD652\uD653\uD656\uD657\uD659\uD65A\uD65B\uD65D", 4],
      ["c361", "\uD662", 4, "\uD668\uD66A", 5, "\uD672\uD673\uD675", 11],
      ["c381", "\uD681\uD682\uD684\uD686", 5, "\uD68E\uD68F\uD691\uD692\uD693\uD695", 7, "\uD69E\uD6A0\uD6A2", 5, "\uD6A9\uD6AA\uCC3C\uCC3D\uCC3E\uCC44\uCC45\uCC48\uCC4C\uCC54\uCC55\uCC57\uCC58\uCC59\uCC60\uCC64\uCC66\uCC68\uCC70\uCC75\uCC98\uCC99\uCC9C\uCCA0\uCCA8\uCCA9\uCCAB\uCCAC\uCCAD\uCCB4\uCCB5\uCCB8\uCCBC\uCCC4\uCCC5\uCCC7\uCCC9\uCCD0\uCCD4\uCCE4\uCCEC\uCCF0\uCD01\uCD08\uCD09\uCD0C\uCD10\uCD18\uCD19\uCD1B\uCD1D\uCD24\uCD28\uCD2C\uCD39\uCD5C\uCD60\uCD64\uCD6C\uCD6D\uCD6F\uCD71\uCD78\uCD88\uCD94\uCD95\uCD98\uCD9C\uCDA4\uCDA5\uCDA7\uCDA9\uCDB0\uCDC4\uCDCC\uCDD0\uCDE8\uCDEC\uCDF0\uCDF8\uCDF9\uCDFB\uCDFD\uCE04\uCE08\uCE0C\uCE14\uCE19\uCE20\uCE21\uCE24\uCE28\uCE30\uCE31\uCE33\uCE35"],
      ["c441", "\uD6AB\uD6AD\uD6AE\uD6AF\uD6B1", 7, "\uD6BA\uD6BC", 7, "\uD6C6\uD6C7\uD6C9\uD6CA\uD6CB"],
      ["c461", "\uD6CD\uD6CE\uD6CF\uD6D0\uD6D2\uD6D3\uD6D5\uD6D6\uD6D8\uD6DA", 5, "\uD6E1\uD6E2\uD6E3\uD6E5\uD6E6\uD6E7\uD6E9", 4],
      ["c481", "\uD6EE\uD6EF\uD6F1\uD6F2\uD6F3\uD6F4\uD6F6", 5, "\uD6FE\uD6FF\uD701\uD702\uD703\uD705", 11, "\uD712\uD713\uD714\uCE58\uCE59\uCE5C\uCE5F\uCE60\uCE61\uCE68\uCE69\uCE6B\uCE6D\uCE74\uCE75\uCE78\uCE7C\uCE84\uCE85\uCE87\uCE89\uCE90\uCE91\uCE94\uCE98\uCEA0\uCEA1\uCEA3\uCEA4\uCEA5\uCEAC\uCEAD\uCEC1\uCEE4\uCEE5\uCEE8\uCEEB\uCEEC\uCEF4\uCEF5\uCEF7\uCEF8\uCEF9\uCF00\uCF01\uCF04\uCF08\uCF10\uCF11\uCF13\uCF15\uCF1C\uCF20\uCF24\uCF2C\uCF2D\uCF2F\uCF30\uCF31\uCF38\uCF54\uCF55\uCF58\uCF5C\uCF64\uCF65\uCF67\uCF69\uCF70\uCF71\uCF74\uCF78\uCF80\uCF85\uCF8C\uCFA1\uCFA8\uCFB0\uCFC4\uCFE0\uCFE1\uCFE4\uCFE8\uCFF0\uCFF1\uCFF3\uCFF5\uCFFC\uD000\uD004\uD011\uD018\uD02D\uD034\uD035\uD038\uD03C"],
      ["c541", "\uD715\uD716\uD717\uD71A\uD71B\uD71D\uD71E\uD71F\uD721", 6, "\uD72A\uD72C\uD72E", 5, "\uD736\uD737\uD739"],
      ["c561", "\uD73A\uD73B\uD73D", 6, "\uD745\uD746\uD748\uD74A", 5, "\uD752\uD753\uD755\uD75A", 4],
      ["c581", "\uD75F\uD762\uD764\uD766\uD767\uD768\uD76A\uD76B\uD76D\uD76E\uD76F\uD771\uD772\uD773\uD775", 6, "\uD77E\uD77F\uD780\uD782", 5, "\uD78A\uD78B\uD044\uD045\uD047\uD049\uD050\uD054\uD058\uD060\uD06C\uD06D\uD070\uD074\uD07C\uD07D\uD081\uD0A4\uD0A5\uD0A8\uD0AC\uD0B4\uD0B5\uD0B7\uD0B9\uD0C0\uD0C1\uD0C4\uD0C8\uD0C9\uD0D0\uD0D1\uD0D3\uD0D4\uD0D5\uD0DC\uD0DD\uD0E0\uD0E4\uD0EC\uD0ED\uD0EF\uD0F0\uD0F1\uD0F8\uD10D\uD130\uD131\uD134\uD138\uD13A\uD140\uD141\uD143\uD144\uD145\uD14C\uD14D\uD150\uD154\uD15C\uD15D\uD15F\uD161\uD168\uD16C\uD17C\uD184\uD188\uD1A0\uD1A1\uD1A4\uD1A8\uD1B0\uD1B1\uD1B3\uD1B5\uD1BA\uD1BC\uD1C0\uD1D8\uD1F4\uD1F8\uD207\uD209\uD210\uD22C\uD22D\uD230\uD234\uD23C\uD23D\uD23F\uD241\uD248\uD25C"],
      ["c641", "\uD78D\uD78E\uD78F\uD791", 6, "\uD79A\uD79C\uD79E", 5],
      ["c6a1", "\uD264\uD280\uD281\uD284\uD288\uD290\uD291\uD295\uD29C\uD2A0\uD2A4\uD2AC\uD2B1\uD2B8\uD2B9\uD2BC\uD2BF\uD2C0\uD2C2\uD2C8\uD2C9\uD2CB\uD2D4\uD2D8\uD2DC\uD2E4\uD2E5\uD2F0\uD2F1\uD2F4\uD2F8\uD300\uD301\uD303\uD305\uD30C\uD30D\uD30E\uD310\uD314\uD316\uD31C\uD31D\uD31F\uD320\uD321\uD325\uD328\uD329\uD32C\uD330\uD338\uD339\uD33B\uD33C\uD33D\uD344\uD345\uD37C\uD37D\uD380\uD384\uD38C\uD38D\uD38F\uD390\uD391\uD398\uD399\uD39C\uD3A0\uD3A8\uD3A9\uD3AB\uD3AD\uD3B4\uD3B8\uD3BC\uD3C4\uD3C5\uD3C8\uD3C9\uD3D0\uD3D8\uD3E1\uD3E3\uD3EC\uD3ED\uD3F0\uD3F4\uD3FC\uD3FD\uD3FF\uD401"],
      ["c7a1", "\uD408\uD41D\uD440\uD444\uD45C\uD460\uD464\uD46D\uD46F\uD478\uD479\uD47C\uD47F\uD480\uD482\uD488\uD489\uD48B\uD48D\uD494\uD4A9\uD4CC\uD4D0\uD4D4\uD4DC\uD4DF\uD4E8\uD4EC\uD4F0\uD4F8\uD4FB\uD4FD\uD504\uD508\uD50C\uD514\uD515\uD517\uD53C\uD53D\uD540\uD544\uD54C\uD54D\uD54F\uD551\uD558\uD559\uD55C\uD560\uD565\uD568\uD569\uD56B\uD56D\uD574\uD575\uD578\uD57C\uD584\uD585\uD587\uD588\uD589\uD590\uD5A5\uD5C8\uD5C9\uD5CC\uD5D0\uD5D2\uD5D8\uD5D9\uD5DB\uD5DD\uD5E4\uD5E5\uD5E8\uD5EC\uD5F4\uD5F5\uD5F7\uD5F9\uD600\uD601\uD604\uD608\uD610\uD611\uD613\uD614\uD615\uD61C\uD620"],
      ["c8a1", "\uD624\uD62D\uD638\uD639\uD63C\uD640\uD645\uD648\uD649\uD64B\uD64D\uD651\uD654\uD655\uD658\uD65C\uD667\uD669\uD670\uD671\uD674\uD683\uD685\uD68C\uD68D\uD690\uD694\uD69D\uD69F\uD6A1\uD6A8\uD6AC\uD6B0\uD6B9\uD6BB\uD6C4\uD6C5\uD6C8\uD6CC\uD6D1\uD6D4\uD6D7\uD6D9\uD6E0\uD6E4\uD6E8\uD6F0\uD6F5\uD6FC\uD6FD\uD700\uD704\uD711\uD718\uD719\uD71C\uD720\uD728\uD729\uD72B\uD72D\uD734\uD735\uD738\uD73C\uD744\uD747\uD749\uD750\uD751\uD754\uD756\uD757\uD758\uD759\uD760\uD761\uD763\uD765\uD769\uD76C\uD770\uD774\uD77C\uD77D\uD781\uD788\uD789\uD78C\uD790\uD798\uD799\uD79B\uD79D"],
      ["caa1", "\u4F3D\u4F73\u5047\u50F9\u52A0\u53EF\u5475\u54E5\u5609\u5AC1\u5BB6\u6687\u67B6\u67B7\u67EF\u6B4C\u73C2\u75C2\u7A3C\u82DB\u8304\u8857\u8888\u8A36\u8CC8\u8DCF\u8EFB\u8FE6\u99D5\u523B\u5374\u5404\u606A\u6164\u6BBC\u73CF\u811A\u89BA\u89D2\u95A3\u4F83\u520A\u58BE\u5978\u59E6\u5E72\u5E79\u61C7\u63C0\u6746\u67EC\u687F\u6F97\u764E\u770B\u78F5\u7A08\u7AFF\u7C21\u809D\u826E\u8271\u8AEB\u9593\u4E6B\u559D\u66F7\u6E34\u78A3\u7AED\u845B\u8910\u874E\u97A8\u52D8\u574E\u582A\u5D4C\u611F\u61BE\u6221\u6562\u67D1\u6A44\u6E1B\u7518\u75B3\u76E3\u77B0\u7D3A\u90AF\u9451\u9452\u9F95"],
      ["cba1", "\u5323\u5CAC\u7532\u80DB\u9240\u9598\u525B\u5808\u59DC\u5CA1\u5D17\u5EB7\u5F3A\u5F4A\u6177\u6C5F\u757A\u7586\u7CE0\u7D73\u7DB1\u7F8C\u8154\u8221\u8591\u8941\u8B1B\u92FC\u964D\u9C47\u4ECB\u4EF7\u500B\u51F1\u584F\u6137\u613E\u6168\u6539\u69EA\u6F11\u75A5\u7686\u76D6\u7B87\u82A5\u84CB\uF900\u93A7\u958B\u5580\u5BA2\u5751\uF901\u7CB3\u7FB9\u91B5\u5028\u53BB\u5C45\u5DE8\u62D2\u636E\u64DA\u64E7\u6E20\u70AC\u795B\u8DDD\u8E1E\uF902\u907D\u9245\u92F8\u4E7E\u4EF6\u5065\u5DFE\u5EFA\u6106\u6957\u8171\u8654\u8E47\u9375\u9A2B\u4E5E\u5091\u6770\u6840\u5109\u528D\u5292\u6AA2"],
      ["cca1", "\u77BC\u9210\u9ED4\u52AB\u602F\u8FF2\u5048\u61A9\u63ED\u64CA\u683C\u6A84\u6FC0\u8188\u89A1\u9694\u5805\u727D\u72AC\u7504\u7D79\u7E6D\u80A9\u898B\u8B74\u9063\u9D51\u6289\u6C7A\u6F54\u7D50\u7F3A\u8A23\u517C\u614A\u7B9D\u8B19\u9257\u938C\u4EAC\u4FD3\u501E\u50BE\u5106\u52C1\u52CD\u537F\u5770\u5883\u5E9A\u5F91\u6176\u61AC\u64CE\u656C\u666F\u66BB\u66F4\u6897\u6D87\u7085\u70F1\u749F\u74A5\u74CA\u75D9\u786C\u78EC\u7ADF\u7AF6\u7D45\u7D93\u8015\u803F\u811B\u8396\u8B66\u8F15\u9015\u93E1\u9803\u9838\u9A5A\u9BE8\u4FC2\u5553\u583A\u5951\u5B63\u5C46\u60B8\u6212\u6842\u68B0"],
      ["cda1", "\u68E8\u6EAA\u754C\u7678\u78CE\u7A3D\u7CFB\u7E6B\u7E7C\u8A08\u8AA1\u8C3F\u968E\u9DC4\u53E4\u53E9\u544A\u5471\u56FA\u59D1\u5B64\u5C3B\u5EAB\u62F7\u6537\u6545\u6572\u66A0\u67AF\u69C1\u6CBD\u75FC\u7690\u777E\u7A3F\u7F94\u8003\u80A1\u818F\u82E6\u82FD\u83F0\u85C1\u8831\u88B4\u8AA5\uF903\u8F9C\u932E\u96C7\u9867\u9AD8\u9F13\u54ED\u659B\u66F2\u688F\u7A40\u8C37\u9D60\u56F0\u5764\u5D11\u6606\u68B1\u68CD\u6EFE\u7428\u889E\u9BE4\u6C68\uF904\u9AA8\u4F9B\u516C\u5171\u529F\u5B54\u5DE5\u6050\u606D\u62F1\u63A7\u653B\u73D9\u7A7A\u86A3\u8CA2\u978F\u4E32\u5BE1\u6208\u679C\u74DC"],
      ["cea1", "\u79D1\u83D3\u8A87\u8AB2\u8DE8\u904E\u934B\u9846\u5ED3\u69E8\u85FF\u90ED\uF905\u51A0\u5B98\u5BEC\u6163\u68FA\u6B3E\u704C\u742F\u74D8\u7BA1\u7F50\u83C5\u89C0\u8CAB\u95DC\u9928\u522E\u605D\u62EC\u9002\u4F8A\u5149\u5321\u58D9\u5EE3\u66E0\u6D38\u709A\u72C2\u73D6\u7B50\u80F1\u945B\u5366\u639B\u7F6B\u4E56\u5080\u584A\u58DE\u602A\u6127\u62D0\u69D0\u9B41\u5B8F\u7D18\u80B1\u8F5F\u4EA4\u50D1\u54AC\u55AC\u5B0C\u5DA0\u5DE7\u652A\u654E\u6821\u6A4B\u72E1\u768E\u77EF\u7D5E\u7FF9\u81A0\u854E\u86DF\u8F03\u8F4E\u90CA\u9903\u9A55\u9BAB\u4E18\u4E45\u4E5D\u4EC7\u4FF1\u5177\u52FE"],
      ["cfa1", "\u5340\u53E3\u53E5\u548E\u5614\u5775\u57A2\u5BC7\u5D87\u5ED0\u61FC\u62D8\u6551\u67B8\u67E9\u69CB\u6B50\u6BC6\u6BEC\u6C42\u6E9D\u7078\u72D7\u7396\u7403\u77BF\u77E9\u7A76\u7D7F\u8009\u81FC\u8205\u820A\u82DF\u8862\u8B33\u8CFC\u8EC0\u9011\u90B1\u9264\u92B6\u99D2\u9A45\u9CE9\u9DD7\u9F9C\u570B\u5C40\u83CA\u97A0\u97AB\u9EB4\u541B\u7A98\u7FA4\u88D9\u8ECD\u90E1\u5800\u5C48\u6398\u7A9F\u5BAE\u5F13\u7A79\u7AAE\u828E\u8EAC\u5026\u5238\u52F8\u5377\u5708\u62F3\u6372\u6B0A\u6DC3\u7737\u53A5\u7357\u8568\u8E76\u95D5\u673A\u6AC3\u6F70\u8A6D\u8ECC\u994B\uF906\u6677\u6B78\u8CB4"],
      ["d0a1", "\u9B3C\uF907\u53EB\u572D\u594E\u63C6\u69FB\u73EA\u7845\u7ABA\u7AC5\u7CFE\u8475\u898F\u8D73\u9035\u95A8\u52FB\u5747\u7547\u7B60\u83CC\u921E\uF908\u6A58\u514B\u524B\u5287\u621F\u68D8\u6975\u9699\u50C5\u52A4\u52E4\u61C3\u65A4\u6839\u69FF\u747E\u7B4B\u82B9\u83EB\u89B2\u8B39\u8FD1\u9949\uF909\u4ECA\u5997\u64D2\u6611\u6A8E\u7434\u7981\u79BD\u82A9\u887E\u887F\u895F\uF90A\u9326\u4F0B\u53CA\u6025\u6271\u6C72\u7D1A\u7D66\u4E98\u5162\u77DC\u80AF\u4F01\u4F0E\u5176\u5180\u55DC\u5668\u573B\u57FA\u57FC\u5914\u5947\u5993\u5BC4\u5C90\u5D0E\u5DF1\u5E7E\u5FCC\u6280\u65D7\u65E3"],
      ["d1a1", "\u671E\u671F\u675E\u68CB\u68C4\u6A5F\u6B3A\u6C23\u6C7D\u6C82\u6DC7\u7398\u7426\u742A\u7482\u74A3\u7578\u757F\u7881\u78EF\u7941\u7947\u7948\u797A\u7B95\u7D00\u7DBA\u7F88\u8006\u802D\u808C\u8A18\u8B4F\u8C48\u8D77\u9321\u9324\u98E2\u9951\u9A0E\u9A0F\u9A65\u9E92\u7DCA\u4F76\u5409\u62EE\u6854\u91D1\u55AB\u513A\uF90B\uF90C\u5A1C\u61E6\uF90D\u62CF\u62FF\uF90E", 5, "\u90A3\uF914", 4, "\u8AFE\uF919\uF91A\uF91B\uF91C\u6696\uF91D\u7156\uF91E\uF91F\u96E3\uF920\u634F\u637A\u5357\uF921\u678F\u6960\u6E73\uF922\u7537\uF923\uF924\uF925"],
      ["d2a1", "\u7D0D\uF926\uF927\u8872\u56CA\u5A18\uF928", 4, "\u4E43\uF92D\u5167\u5948\u67F0\u8010\uF92E\u5973\u5E74\u649A\u79CA\u5FF5\u606C\u62C8\u637B\u5BE7\u5BD7\u52AA\uF92F\u5974\u5F29\u6012\uF930\uF931\uF932\u7459\uF933", 5, "\u99D1\uF939", 10, "\u6FC3\uF944\uF945\u81BF\u8FB2\u60F1\uF946\uF947\u8166\uF948\uF949\u5C3F\uF94A", 7, "\u5AE9\u8A25\u677B\u7D10\uF952", 5, "\u80FD\uF958\uF959\u5C3C\u6CE5\u533F\u6EBA\u591A\u8336"],
      ["d3a1", "\u4E39\u4EB6\u4F46\u55AE\u5718\u58C7\u5F56\u65B7\u65E6\u6A80\u6BB5\u6E4D\u77ED\u7AEF\u7C1E\u7DDE\u86CB\u8892\u9132\u935B\u64BB\u6FBE\u737A\u75B8\u9054\u5556\u574D\u61BA\u64D4\u66C7\u6DE1\u6E5B\u6F6D\u6FB9\u75F0\u8043\u81BD\u8541\u8983\u8AC7\u8B5A\u931F\u6C93\u7553\u7B54\u8E0F\u905D\u5510\u5802\u5858\u5E62\u6207\u649E\u68E0\u7576\u7CD6\u87B3\u9EE8\u4EE3\u5788\u576E\u5927\u5C0D\u5CB1\u5E36\u5F85\u6234\u64E1\u73B3\u81FA\u888B\u8CB8\u968A\u9EDB\u5B85\u5FB7\u60B3\u5012\u5200\u5230\u5716\u5835\u5857\u5C0E\u5C60\u5CF6\u5D8B\u5EA6\u5F92\u60BC\u6311\u6389\u6417\u6843"],
      ["d4a1", "\u68F9\u6AC2\u6DD8\u6E21\u6ED4\u6FE4\u71FE\u76DC\u7779\u79B1\u7A3B\u8404\u89A9\u8CED\u8DF3\u8E48\u9003\u9014\u9053\u90FD\u934D\u9676\u97DC\u6BD2\u7006\u7258\u72A2\u7368\u7763\u79BF\u7BE4\u7E9B\u8B80\u58A9\u60C7\u6566\u65FD\u66BE\u6C8C\u711E\u71C9\u8C5A\u9813\u4E6D\u7A81\u4EDD\u51AC\u51CD\u52D5\u540C\u61A7\u6771\u6850\u68DF\u6D1E\u6F7C\u75BC\u77B3\u7AE5\u80F4\u8463\u9285\u515C\u6597\u675C\u6793\u75D8\u7AC7\u8373\uF95A\u8C46\u9017\u982D\u5C6F\u81C0\u829A\u9041\u906F\u920D\u5F97\u5D9D\u6A59\u71C8\u767B\u7B49\u85E4\u8B04\u9127\u9A30\u5587\u61F6\uF95B\u7669\u7F85"],
      ["d5a1", "\u863F\u87BA\u88F8\u908F\uF95C\u6D1B\u70D9\u73DE\u7D61\u843D\uF95D\u916A\u99F1\uF95E\u4E82\u5375\u6B04\u6B12\u703E\u721B\u862D\u9E1E\u524C\u8FA3\u5D50\u64E5\u652C\u6B16\u6FEB\u7C43\u7E9C\u85CD\u8964\u89BD\u62C9\u81D8\u881F\u5ECA\u6717\u6D6A\u72FC\u7405\u746F\u8782\u90DE\u4F86\u5D0D\u5FA0\u840A\u51B7\u63A0\u7565\u4EAE\u5006\u5169\u51C9\u6881\u6A11\u7CAE\u7CB1\u7CE7\u826F\u8AD2\u8F1B\u91CF\u4FB6\u5137\u52F5\u5442\u5EEC\u616E\u623E\u65C5\u6ADA\u6FFE\u792A\u85DC\u8823\u95AD\u9A62\u9A6A\u9E97\u9ECE\u529B\u66C6\u6B77\u701D\u792B\u8F62\u9742\u6190\u6200\u6523\u6F23"],
      ["d6a1", "\u7149\u7489\u7DF4\u806F\u84EE\u8F26\u9023\u934A\u51BD\u5217\u52A3\u6D0C\u70C8\u88C2\u5EC9\u6582\u6BAE\u6FC2\u7C3E\u7375\u4EE4\u4F36\u56F9\uF95F\u5CBA\u5DBA\u601C\u73B2\u7B2D\u7F9A\u7FCE\u8046\u901E\u9234\u96F6\u9748\u9818\u9F61\u4F8B\u6FA7\u79AE\u91B4\u96B7\u52DE\uF960\u6488\u64C4\u6AD3\u6F5E\u7018\u7210\u76E7\u8001\u8606\u865C\u8DEF\u8F05\u9732\u9B6F\u9DFA\u9E75\u788C\u797F\u7DA0\u83C9\u9304\u9E7F\u9E93\u8AD6\u58DF\u5F04\u6727\u7027\u74CF\u7C60\u807E\u5121\u7028\u7262\u78CA\u8CC2\u8CDA\u8CF4\u96F7\u4E86\u50DA\u5BEE\u5ED6\u6599\u71CE\u7642\u77AD\u804A\u84FC"],
      ["d7a1", "\u907C\u9B27\u9F8D\u58D8\u5A41\u5C62\u6A13\u6DDA\u6F0F\u763B\u7D2F\u7E37\u851E\u8938\u93E4\u964B\u5289\u65D2\u67F3\u69B4\u6D41\u6E9C\u700F\u7409\u7460\u7559\u7624\u786B\u8B2C\u985E\u516D\u622E\u9678\u4F96\u502B\u5D19\u6DEA\u7DB8\u8F2A\u5F8B\u6144\u6817\uF961\u9686\u52D2\u808B\u51DC\u51CC\u695E\u7A1C\u7DBE\u83F1\u9675\u4FDA\u5229\u5398\u540F\u550E\u5C65\u60A7\u674E\u68A8\u6D6C\u7281\u72F8\u7406\u7483\uF962\u75E2\u7C6C\u7F79\u7FB8\u8389\u88CF\u88E1\u91CC\u91D0\u96E2\u9BC9\u541D\u6F7E\u71D0\u7498\u85FA\u8EAA\u96A3\u9C57\u9E9F\u6797\u6DCB\u7433\u81E8\u9716\u782C"],
      ["d8a1", "\u7ACB\u7B20\u7C92\u6469\u746A\u75F2\u78BC\u78E8\u99AC\u9B54\u9EBB\u5BDE\u5E55\u6F20\u819C\u83AB\u9088\u4E07\u534D\u5A29\u5DD2\u5F4E\u6162\u633D\u6669\u66FC\u6EFF\u6F2B\u7063\u779E\u842C\u8513\u883B\u8F13\u9945\u9C3B\u551C\u62B9\u672B\u6CAB\u8309\u896A\u977A\u4EA1\u5984\u5FD8\u5FD9\u671B\u7DB2\u7F54\u8292\u832B\u83BD\u8F1E\u9099\u57CB\u59B9\u5A92\u5BD0\u6627\u679A\u6885\u6BCF\u7164\u7F75\u8CB7\u8CE3\u9081\u9B45\u8108\u8C8A\u964C\u9A40\u9EA5\u5B5F\u6C13\u731B\u76F2\u76DF\u840C\u51AA\u8993\u514D\u5195\u52C9\u68C9\u6C94\u7704\u7720\u7DBF\u7DEC\u9762\u9EB5\u6EC5"],
      ["d9a1", "\u8511\u51A5\u540D\u547D\u660E\u669D\u6927\u6E9F\u76BF\u7791\u8317\u84C2\u879F\u9169\u9298\u9CF4\u8882\u4FAE\u5192\u52DF\u59C6\u5E3D\u6155\u6478\u6479\u66AE\u67D0\u6A21\u6BCD\u6BDB\u725F\u7261\u7441\u7738\u77DB\u8017\u82BC\u8305\u8B00\u8B28\u8C8C\u6728\u6C90\u7267\u76EE\u7766\u7A46\u9DA9\u6B7F\u6C92\u5922\u6726\u8499\u536F\u5893\u5999\u5EDF\u63CF\u6634\u6773\u6E3A\u732B\u7AD7\u82D7\u9328\u52D9\u5DEB\u61AE\u61CB\u620A\u62C7\u64AB\u65E0\u6959\u6B66\u6BCB\u7121\u73F7\u755D\u7E46\u821E\u8302\u856A\u8AA3\u8CBF\u9727\u9D61\u58A8\u9ED8\u5011\u520E\u543B\u554F\u6587"],
      ["daa1", "\u6C76\u7D0A\u7D0B\u805E\u868A\u9580\u96EF\u52FF\u6C95\u7269\u5473\u5A9A\u5C3E\u5D4B\u5F4C\u5FAE\u672A\u68B6\u6963\u6E3C\u6E44\u7709\u7C73\u7F8E\u8587\u8B0E\u8FF7\u9761\u9EF4\u5CB7\u60B6\u610D\u61AB\u654F\u65FB\u65FC\u6C11\u6CEF\u739F\u73C9\u7DE1\u9594\u5BC6\u871C\u8B10\u525D\u535A\u62CD\u640F\u64B2\u6734\u6A38\u6CCA\u73C0\u749E\u7B94\u7C95\u7E1B\u818A\u8236\u8584\u8FEB\u96F9\u99C1\u4F34\u534A\u53CD\u53DB\u62CC\u642C\u6500\u6591\u69C3\u6CEE\u6F58\u73ED\u7554\u7622\u76E4\u76FC\u78D0\u78FB\u792C\u7D46\u822C\u87E0\u8FD4\u9812\u98EF\u52C3\u62D4\u64A5\u6E24\u6F51"],
      ["dba1", "\u767C\u8DCB\u91B1\u9262\u9AEE\u9B43\u5023\u508D\u574A\u59A8\u5C28\u5E47\u5F77\u623F\u653E\u65B9\u65C1\u6609\u678B\u699C\u6EC2\u78C5\u7D21\u80AA\u8180\u822B\u82B3\u84A1\u868C\u8A2A\u8B17\u90A6\u9632\u9F90\u500D\u4FF3\uF963\u57F9\u5F98\u62DC\u6392\u676F\u6E43\u7119\u76C3\u80CC\u80DA\u88F4\u88F5\u8919\u8CE0\u8F29\u914D\u966A\u4F2F\u4F70\u5E1B\u67CF\u6822\u767D\u767E\u9B44\u5E61\u6A0A\u7169\u71D4\u756A\uF964\u7E41\u8543\u85E9\u98DC\u4F10\u7B4F\u7F70\u95A5\u51E1\u5E06\u68B5\u6C3E\u6C4E\u6CDB\u72AF\u7BC4\u8303\u6CD5\u743A\u50FB\u5288\u58C1\u64D8\u6A97\u74A7\u7656"],
      ["dca1", "\u78A7\u8617\u95E2\u9739\uF965\u535E\u5F01\u8B8A\u8FA8\u8FAF\u908A\u5225\u77A5\u9C49\u9F08\u4E19\u5002\u5175\u5C5B\u5E77\u661E\u663A\u67C4\u68C5\u70B3\u7501\u75C5\u79C9\u7ADD\u8F27\u9920\u9A08\u4FDD\u5821\u5831\u5BF6\u666E\u6B65\u6D11\u6E7A\u6F7D\u73E4\u752B\u83E9\u88DC\u8913\u8B5C\u8F14\u4F0F\u50D5\u5310\u535C\u5B93\u5FA9\u670D\u798F\u8179\u832F\u8514\u8907\u8986\u8F39\u8F3B\u99A5\u9C12\u672C\u4E76\u4FF8\u5949\u5C01\u5CEF\u5CF0\u6367\u68D2\u70FD\u71A2\u742B\u7E2B\u84EC\u8702\u9022\u92D2\u9CF3\u4E0D\u4ED8\u4FEF\u5085\u5256\u526F\u5426\u5490\u57E0\u592B\u5A66"],
      ["dda1", "\u5B5A\u5B75\u5BCC\u5E9C\uF966\u6276\u6577\u65A7\u6D6E\u6EA5\u7236\u7B26\u7C3F\u7F36\u8150\u8151\u819A\u8240\u8299\u83A9\u8A03\u8CA0\u8CE6\u8CFB\u8D74\u8DBA\u90E8\u91DC\u961C\u9644\u99D9\u9CE7\u5317\u5206\u5429\u5674\u58B3\u5954\u596E\u5FFF\u61A4\u626E\u6610\u6C7E\u711A\u76C6\u7C89\u7CDE\u7D1B\u82AC\u8CC1\u96F0\uF967\u4F5B\u5F17\u5F7F\u62C2\u5D29\u670B\u68DA\u787C\u7E43\u9D6C\u4E15\u5099\u5315\u532A\u5351\u5983\u5A62\u5E87\u60B2\u618A\u6249\u6279\u6590\u6787\u69A7\u6BD4\u6BD6\u6BD7\u6BD8\u6CB8\uF968\u7435\u75FA\u7812\u7891\u79D5\u79D8\u7C83\u7DCB\u7FE1\u80A5"],
      ["dea1", "\u813E\u81C2\u83F2\u871A\u88E8\u8AB9\u8B6C\u8CBB\u9119\u975E\u98DB\u9F3B\u56AC\u5B2A\u5F6C\u658C\u6AB3\u6BAF\u6D5C\u6FF1\u7015\u725D\u73AD\u8CA7\u8CD3\u983B\u6191\u6C37\u8058\u9A01\u4E4D\u4E8B\u4E9B\u4ED5\u4F3A\u4F3C\u4F7F\u4FDF\u50FF\u53F2\u53F8\u5506\u55E3\u56DB\u58EB\u5962\u5A11\u5BEB\u5BFA\u5C04\u5DF3\u5E2B\u5F99\u601D\u6368\u659C\u65AF\u67F6\u67FB\u68AD\u6B7B\u6C99\u6CD7\u6E23\u7009\u7345\u7802\u793E\u7940\u7960\u79C1\u7BE9\u7D17\u7D72\u8086\u820D\u838E\u84D1\u86C7\u88DF\u8A50\u8A5E\u8B1D\u8CDC\u8D66\u8FAD\u90AA\u98FC\u99DF\u9E9D\u524A\uF969\u6714\uF96A"],
      ["dfa1", "\u5098\u522A\u5C71\u6563\u6C55\u73CA\u7523\u759D\u7B97\u849C\u9178\u9730\u4E77\u6492\u6BBA\u715E\u85A9\u4E09\uF96B\u6749\u68EE\u6E17\u829F\u8518\u886B\u63F7\u6F81\u9212\u98AF\u4E0A\u50B7\u50CF\u511F\u5546\u55AA\u5617\u5B40\u5C19\u5CE0\u5E38\u5E8A\u5EA0\u5EC2\u60F3\u6851\u6A61\u6E58\u723D\u7240\u72C0\u76F8\u7965\u7BB1\u7FD4\u88F3\u89F4\u8A73\u8C61\u8CDE\u971C\u585E\u74BD\u8CFD\u55C7\uF96C\u7A61\u7D22\u8272\u7272\u751F\u7525\uF96D\u7B19\u5885\u58FB\u5DBC\u5E8F\u5EB6\u5F90\u6055\u6292\u637F\u654D\u6691\u66D9\u66F8\u6816\u68F2\u7280\u745E\u7B6E\u7D6E\u7DD6\u7F72"],
      ["e0a1", "\u80E5\u8212\u85AF\u897F\u8A93\u901D\u92E4\u9ECD\u9F20\u5915\u596D\u5E2D\u60DC\u6614\u6673\u6790\u6C50\u6DC5\u6F5F\u77F3\u78A9\u84C6\u91CB\u932B\u4ED9\u50CA\u5148\u5584\u5B0B\u5BA3\u6247\u657E\u65CB\u6E32\u717D\u7401\u7444\u7487\u74BF\u766C\u79AA\u7DDA\u7E55\u7FA8\u817A\u81B3\u8239\u861A\u87EC\u8A75\u8DE3\u9078\u9291\u9425\u994D\u9BAE\u5368\u5C51\u6954\u6CC4\u6D29\u6E2B\u820C\u859B\u893B\u8A2D\u8AAA\u96EA\u9F67\u5261\u66B9\u6BB2\u7E96\u87FE\u8D0D\u9583\u965D\u651D\u6D89\u71EE\uF96E\u57CE\u59D3\u5BAC\u6027\u60FA\u6210\u661F\u665F\u7329\u73F9\u76DB\u7701\u7B6C"],
      ["e1a1", "\u8056\u8072\u8165\u8AA0\u9192\u4E16\u52E2\u6B72\u6D17\u7A05\u7B39\u7D30\uF96F\u8CB0\u53EC\u562F\u5851\u5BB5\u5C0F\u5C11\u5DE2\u6240\u6383\u6414\u662D\u68B3\u6CBC\u6D88\u6EAF\u701F\u70A4\u71D2\u7526\u758F\u758E\u7619\u7B11\u7BE0\u7C2B\u7D20\u7D39\u852C\u856D\u8607\u8A34\u900D\u9061\u90B5\u92B7\u97F6\u9A37\u4FD7\u5C6C\u675F\u6D91\u7C9F\u7E8C\u8B16\u8D16\u901F\u5B6B\u5DFD\u640D\u84C0\u905C\u98E1\u7387\u5B8B\u609A\u677E\u6DDE\u8A1F\u8AA6\u9001\u980C\u5237\uF970\u7051\u788E\u9396\u8870\u91D7\u4FEE\u53D7\u55FD\u56DA\u5782\u58FD\u5AC2\u5B88\u5CAB\u5CC0\u5E25\u6101"],
      ["e2a1", "\u620D\u624B\u6388\u641C\u6536\u6578\u6A39\u6B8A\u6C34\u6D19\u6F31\u71E7\u72E9\u7378\u7407\u74B2\u7626\u7761\u79C0\u7A57\u7AEA\u7CB9\u7D8F\u7DAC\u7E61\u7F9E\u8129\u8331\u8490\u84DA\u85EA\u8896\u8AB0\u8B90\u8F38\u9042\u9083\u916C\u9296\u92B9\u968B\u96A7\u96A8\u96D6\u9700\u9808\u9996\u9AD3\u9B1A\u53D4\u587E\u5919\u5B70\u5BBF\u6DD1\u6F5A\u719F\u7421\u74B9\u8085\u83FD\u5DE1\u5F87\u5FAA\u6042\u65EC\u6812\u696F\u6A53\u6B89\u6D35\u6DF3\u73E3\u76FE\u77AC\u7B4D\u7D14\u8123\u821C\u8340\u84F4\u8563\u8A62\u8AC4\u9187\u931E\u9806\u99B4\u620C\u8853\u8FF0\u9265\u5D07\u5D27"],
      ["e3a1", "\u5D69\u745F\u819D\u8768\u6FD5\u62FE\u7FD2\u8936\u8972\u4E1E\u4E58\u50E7\u52DD\u5347\u627F\u6607\u7E69\u8805\u965E\u4F8D\u5319\u5636\u59CB\u5AA4\u5C38\u5C4E\u5C4D\u5E02\u5F11\u6043\u65BD\u662F\u6642\u67BE\u67F4\u731C\u77E2\u793A\u7FC5\u8494\u84CD\u8996\u8A66\u8A69\u8AE1\u8C55\u8C7A\u57F4\u5BD4\u5F0F\u606F\u62ED\u690D\u6B96\u6E5C\u7184\u7BD2\u8755\u8B58\u8EFE\u98DF\u98FE\u4F38\u4F81\u4FE1\u547B\u5A20\u5BB8\u613C\u65B0\u6668\u71FC\u7533\u795E\u7D33\u814E\u81E3\u8398\u85AA\u85CE\u8703\u8A0A\u8EAB\u8F9B\uF971\u8FC5\u5931\u5BA4\u5BE6\u6089\u5BE9\u5C0B\u5FC3\u6C81"],
      ["e4a1", "\uF972\u6DF1\u700B\u751A\u82AF\u8AF6\u4EC0\u5341\uF973\u96D9\u6C0F\u4E9E\u4FC4\u5152\u555E\u5A25\u5CE8\u6211\u7259\u82BD\u83AA\u86FE\u8859\u8A1D\u963F\u96C5\u9913\u9D09\u9D5D\u580A\u5CB3\u5DBD\u5E44\u60E1\u6115\u63E1\u6A02\u6E25\u9102\u9354\u984E\u9C10\u9F77\u5B89\u5CB8\u6309\u664F\u6848\u773C\u96C1\u978D\u9854\u9B9F\u65A1\u8B01\u8ECB\u95BC\u5535\u5CA9\u5DD6\u5EB5\u6697\u764C\u83F4\u95C7\u58D3\u62BC\u72CE\u9D28\u4EF0\u592E\u600F\u663B\u6B83\u79E7\u9D26\u5393\u54C0\u57C3\u5D16\u611B\u66D6\u6DAF\u788D\u827E\u9698\u9744\u5384\u627C\u6396\u6DB2\u7E0A\u814B\u984D"],
      ["e5a1", "\u6AFB\u7F4C\u9DAF\u9E1A\u4E5F\u503B\u51B6\u591C\u60F9\u63F6\u6930\u723A\u8036\uF974\u91CE\u5F31\uF975\uF976\u7D04\u82E5\u846F\u84BB\u85E5\u8E8D\uF977\u4F6F\uF978\uF979\u58E4\u5B43\u6059\u63DA\u6518\u656D\u6698\uF97A\u694A\u6A23\u6D0B\u7001\u716C\u75D2\u760D\u79B3\u7A70\uF97B\u7F8A\uF97C\u8944\uF97D\u8B93\u91C0\u967D\uF97E\u990A\u5704\u5FA1\u65BC\u6F01\u7600\u79A6\u8A9E\u99AD\u9B5A\u9F6C\u5104\u61B6\u6291\u6A8D\u81C6\u5043\u5830\u5F66\u7109\u8A00\u8AFA\u5B7C\u8616\u4FFA\u513C\u56B4\u5944\u63A9\u6DF9\u5DAA\u696D\u5186\u4E88\u4F59\uF97F\uF980\uF981\u5982\uF982"],
      ["e6a1", "\uF983\u6B5F\u6C5D\uF984\u74B5\u7916\uF985\u8207\u8245\u8339\u8F3F\u8F5D\uF986\u9918\uF987\uF988\uF989\u4EA6\uF98A\u57DF\u5F79\u6613\uF98B\uF98C\u75AB\u7E79\u8B6F\uF98D\u9006\u9A5B\u56A5\u5827\u59F8\u5A1F\u5BB4\uF98E\u5EF6\uF98F\uF990\u6350\u633B\uF991\u693D\u6C87\u6CBF\u6D8E\u6D93\u6DF5\u6F14\uF992\u70DF\u7136\u7159\uF993\u71C3\u71D5\uF994\u784F\u786F\uF995\u7B75\u7DE3\uF996\u7E2F\uF997\u884D\u8EDF\uF998\uF999\uF99A\u925B\uF99B\u9CF6\uF99C\uF99D\uF99E\u6085\u6D85\uF99F\u71B1\uF9A0\uF9A1\u95B1\u53AD\uF9A2\uF9A3\uF9A4\u67D3\uF9A5\u708E\u7130\u7430\u8276\u82D2"],
      ["e7a1", "\uF9A6\u95BB\u9AE5\u9E7D\u66C4\uF9A7\u71C1\u8449\uF9A8\uF9A9\u584B\uF9AA\uF9AB\u5DB8\u5F71\uF9AC\u6620\u668E\u6979\u69AE\u6C38\u6CF3\u6E36\u6F41\u6FDA\u701B\u702F\u7150\u71DF\u7370\uF9AD\u745B\uF9AE\u74D4\u76C8\u7A4E\u7E93\uF9AF\uF9B0\u82F1\u8A60\u8FCE\uF9B1\u9348\uF9B2\u9719\uF9B3\uF9B4\u4E42\u502A\uF9B5\u5208\u53E1\u66F3\u6C6D\u6FCA\u730A\u777F\u7A62\u82AE\u85DD\u8602\uF9B6\u88D4\u8A63\u8B7D\u8C6B\uF9B7\u92B3\uF9B8\u9713\u9810\u4E94\u4F0D\u4FC9\u50B2\u5348\u543E\u5433\u55DA\u5862\u58BA\u5967\u5A1B\u5BE4\u609F\uF9B9\u61CA\u6556\u65FF\u6664\u68A7\u6C5A\u6FB3"],
      ["e8a1", "\u70CF\u71AC\u7352\u7B7D\u8708\u8AA4\u9C32\u9F07\u5C4B\u6C83\u7344\u7389\u923A\u6EAB\u7465\u761F\u7A69\u7E15\u860A\u5140\u58C5\u64C1\u74EE\u7515\u7670\u7FC1\u9095\u96CD\u9954\u6E26\u74E6\u7AA9\u7AAA\u81E5\u86D9\u8778\u8A1B\u5A49\u5B8C\u5B9B\u68A1\u6900\u6D63\u73A9\u7413\u742C\u7897\u7DE9\u7FEB\u8118\u8155\u839E\u8C4C\u962E\u9811\u66F0\u5F80\u65FA\u6789\u6C6A\u738B\u502D\u5A03\u6B6A\u77EE\u5916\u5D6C\u5DCD\u7325\u754F\uF9BA\uF9BB\u50E5\u51F9\u582F\u592D\u5996\u59DA\u5BE5\uF9BC\uF9BD\u5DA2\u62D7\u6416\u6493\u64FE\uF9BE\u66DC\uF9BF\u6A48\uF9C0\u71FF\u7464\uF9C1"],
      ["e9a1", "\u7A88\u7AAF\u7E47\u7E5E\u8000\u8170\uF9C2\u87EF\u8981\u8B20\u9059\uF9C3\u9080\u9952\u617E\u6B32\u6D74\u7E1F\u8925\u8FB1\u4FD1\u50AD\u5197\u52C7\u57C7\u5889\u5BB9\u5EB8\u6142\u6995\u6D8C\u6E67\u6EB6\u7194\u7462\u7528\u752C\u8073\u8338\u84C9\u8E0A\u9394\u93DE\uF9C4\u4E8E\u4F51\u5076\u512A\u53C8\u53CB\u53F3\u5B87\u5BD3\u5C24\u611A\u6182\u65F4\u725B\u7397\u7440\u76C2\u7950\u7991\u79B9\u7D06\u7FBD\u828B\u85D5\u865E\u8FC2\u9047\u90F5\u91EA\u9685\u96E8\u96E9\u52D6\u5F67\u65ED\u6631\u682F\u715C\u7A36\u90C1\u980A\u4E91\uF9C5\u6A52\u6B9E\u6F90\u7189\u8018\u82B8\u8553"],
      ["eaa1", "\u904B\u9695\u96F2\u97FB\u851A\u9B31\u4E90\u718A\u96C4\u5143\u539F\u54E1\u5713\u5712\u57A3\u5A9B\u5AC4\u5BC3\u6028\u613F\u63F4\u6C85\u6D39\u6E72\u6E90\u7230\u733F\u7457\u82D1\u8881\u8F45\u9060\uF9C6\u9662\u9858\u9D1B\u6708\u8D8A\u925E\u4F4D\u5049\u50DE\u5371\u570D\u59D4\u5A01\u5C09\u6170\u6690\u6E2D\u7232\u744B\u7DEF\u80C3\u840E\u8466\u853F\u875F\u885B\u8918\u8B02\u9055\u97CB\u9B4F\u4E73\u4F91\u5112\u516A\uF9C7\u552F\u55A9\u5B7A\u5BA5\u5E7C\u5E7D\u5EBE\u60A0\u60DF\u6108\u6109\u63C4\u6538\u6709\uF9C8\u67D4\u67DA\uF9C9\u6961\u6962\u6CB9\u6D27\uF9CA\u6E38\uF9CB"],
      ["eba1", "\u6FE1\u7336\u7337\uF9CC\u745C\u7531\uF9CD\u7652\uF9CE\uF9CF\u7DAD\u81FE\u8438\u88D5\u8A98\u8ADB\u8AED\u8E30\u8E42\u904A\u903E\u907A\u9149\u91C9\u936E\uF9D0\uF9D1\u5809\uF9D2\u6BD3\u8089\u80B2\uF9D3\uF9D4\u5141\u596B\u5C39\uF9D5\uF9D6\u6F64\u73A7\u80E4\u8D07\uF9D7\u9217\u958F\uF9D8\uF9D9\uF9DA\uF9DB\u807F\u620E\u701C\u7D68\u878D\uF9DC\u57A0\u6069\u6147\u6BB7\u8ABE\u9280\u96B1\u4E59\u541F\u6DEB\u852D\u9670\u97F3\u98EE\u63D6\u6CE3\u9091\u51DD\u61C9\u81BA\u9DF9\u4F9D\u501A\u5100\u5B9C\u610F\u61FF\u64EC\u6905\u6BC5\u7591\u77E3\u7FA9\u8264\u858F\u87FB\u8863\u8ABC"],
      ["eca1", "\u8B70\u91AB\u4E8C\u4EE5\u4F0A\uF9DD\uF9DE\u5937\u59E8\uF9DF\u5DF2\u5F1B\u5F5B\u6021\uF9E0\uF9E1\uF9E2\uF9E3\u723E\u73E5\uF9E4\u7570\u75CD\uF9E5\u79FB\uF9E6\u800C\u8033\u8084\u82E1\u8351\uF9E7\uF9E8\u8CBD\u8CB3\u9087\uF9E9\uF9EA\u98F4\u990C\uF9EB\uF9EC\u7037\u76CA\u7FCA\u7FCC\u7FFC\u8B1A\u4EBA\u4EC1\u5203\u5370\uF9ED\u54BD\u56E0\u59FB\u5BC5\u5F15\u5FCD\u6E6E\uF9EE\uF9EF\u7D6A\u8335\uF9F0\u8693\u8A8D\uF9F1\u976D\u9777\uF9F2\uF9F3\u4E00\u4F5A\u4F7E\u58F9\u65E5\u6EA2\u9038\u93B0\u99B9\u4EFB\u58EC\u598A\u59D9\u6041\uF9F4\uF9F5\u7A14\uF9F6\u834F\u8CC3\u5165\u5344"],
      ["eda1", "\uF9F7\uF9F8\uF9F9\u4ECD\u5269\u5B55\u82BF\u4ED4\u523A\u54A8\u59C9\u59FF\u5B50\u5B57\u5B5C\u6063\u6148\u6ECB\u7099\u716E\u7386\u74F7\u75B5\u78C1\u7D2B\u8005\u81EA\u8328\u8517\u85C9\u8AEE\u8CC7\u96CC\u4F5C\u52FA\u56BC\u65AB\u6628\u707C\u70B8\u7235\u7DBD\u828D\u914C\u96C0\u9D72\u5B71\u68E7\u6B98\u6F7A\u76DE\u5C91\u66AB\u6F5B\u7BB4\u7C2A\u8836\u96DC\u4E08\u4ED7\u5320\u5834\u58BB\u58EF\u596C\u5C07\u5E33\u5E84\u5F35\u638C\u66B2\u6756\u6A1F\u6AA3\u6B0C\u6F3F\u7246\uF9FA\u7350\u748B\u7AE0\u7CA7\u8178\u81DF\u81E7\u838A\u846C\u8523\u8594\u85CF\u88DD\u8D13\u91AC\u9577"],
      ["eea1", "\u969C\u518D\u54C9\u5728\u5BB0\u624D\u6750\u683D\u6893\u6E3D\u6ED3\u707D\u7E21\u88C1\u8CA1\u8F09\u9F4B\u9F4E\u722D\u7B8F\u8ACD\u931A\u4F47\u4F4E\u5132\u5480\u59D0\u5E95\u62B5\u6775\u696E\u6A17\u6CAE\u6E1A\u72D9\u732A\u75BD\u7BB8\u7D35\u82E7\u83F9\u8457\u85F7\u8A5B\u8CAF\u8E87\u9019\u90B8\u96CE\u9F5F\u52E3\u540A\u5AE1\u5BC2\u6458\u6575\u6EF4\u72C4\uF9FB\u7684\u7A4D\u7B1B\u7C4D\u7E3E\u7FDF\u837B\u8B2B\u8CCA\u8D64\u8DE1\u8E5F\u8FEA\u8FF9\u9069\u93D1\u4F43\u4F7A\u50B3\u5168\u5178\u524D\u526A\u5861\u587C\u5960\u5C08\u5C55\u5EDB\u609B\u6230\u6813\u6BBF\u6C08\u6FB1"],
      ["efa1", "\u714E\u7420\u7530\u7538\u7551\u7672\u7B4C\u7B8B\u7BAD\u7BC6\u7E8F\u8A6E\u8F3E\u8F49\u923F\u9293\u9322\u942B\u96FB\u985A\u986B\u991E\u5207\u622A\u6298\u6D59\u7664\u7ACA\u7BC0\u7D76\u5360\u5CBE\u5E97\u6F38\u70B9\u7C98\u9711\u9B8E\u9EDE\u63A5\u647A\u8776\u4E01\u4E95\u4EAD\u505C\u5075\u5448\u59C3\u5B9A\u5E40\u5EAD\u5EF7\u5F81\u60C5\u633A\u653F\u6574\u65CC\u6676\u6678\u67FE\u6968\u6A89\u6B63\u6C40\u6DC0\u6DE8\u6E1F\u6E5E\u701E\u70A1\u738E\u73FD\u753A\u775B\u7887\u798E\u7A0B\u7A7D\u7CBE\u7D8E\u8247\u8A02\u8AEA\u8C9E\u912D\u914A\u91D8\u9266\u92CC\u9320\u9706\u9756"],
      ["f0a1", "\u975C\u9802\u9F0E\u5236\u5291\u557C\u5824\u5E1D\u5F1F\u608C\u63D0\u68AF\u6FDF\u796D\u7B2C\u81CD\u85BA\u88FD\u8AF8\u8E44\u918D\u9664\u969B\u973D\u984C\u9F4A\u4FCE\u5146\u51CB\u52A9\u5632\u5F14\u5F6B\u63AA\u64CD\u65E9\u6641\u66FA\u66F9\u671D\u689D\u68D7\u69FD\u6F15\u6F6E\u7167\u71E5\u722A\u74AA\u773A\u7956\u795A\u79DF\u7A20\u7A95\u7C97\u7CDF\u7D44\u7E70\u8087\u85FB\u86A4\u8A54\u8ABF\u8D99\u8E81\u9020\u906D\u91E3\u963B\u96D5\u9CE5\u65CF\u7C07\u8DB3\u93C3\u5B58\u5C0A\u5352\u62D9\u731D\u5027\u5B97\u5F9E\u60B0\u616B\u68D5\u6DD9\u742E\u7A2E\u7D42\u7D9C\u7E31\u816B"],
      ["f1a1", "\u8E2A\u8E35\u937E\u9418\u4F50\u5750\u5DE6\u5EA7\u632B\u7F6A\u4E3B\u4F4F\u4F8F\u505A\u59DD\u80C4\u546A\u5468\u55FE\u594F\u5B99\u5DDE\u5EDA\u665D\u6731\u67F1\u682A\u6CE8\u6D32\u6E4A\u6F8D\u70B7\u73E0\u7587\u7C4C\u7D02\u7D2C\u7DA2\u821F\u86DB\u8A3B\u8A85\u8D70\u8E8A\u8F33\u9031\u914E\u9152\u9444\u99D0\u7AF9\u7CA5\u4FCA\u5101\u51C6\u57C8\u5BEF\u5CFB\u6659\u6A3D\u6D5A\u6E96\u6FEC\u710C\u756F\u7AE3\u8822\u9021\u9075\u96CB\u99FF\u8301\u4E2D\u4EF2\u8846\u91CD\u537D\u6ADB\u696B\u6C41\u847A\u589E\u618E\u66FE\u62EF\u70DD\u7511\u75C7\u7E52\u84B8\u8B49\u8D08\u4E4B\u53EA"],
      ["f2a1", "\u54AB\u5730\u5740\u5FD7\u6301\u6307\u646F\u652F\u65E8\u667A\u679D\u67B3\u6B62\u6C60\u6C9A\u6F2C\u77E5\u7825\u7949\u7957\u7D19\u80A2\u8102\u81F3\u829D\u82B7\u8718\u8A8C\uF9FC\u8D04\u8DBE\u9072\u76F4\u7A19\u7A37\u7E54\u8077\u5507\u55D4\u5875\u632F\u6422\u6649\u664B\u686D\u699B\u6B84\u6D25\u6EB1\u73CD\u7468\u74A1\u755B\u75B9\u76E1\u771E\u778B\u79E6\u7E09\u7E1D\u81FB\u852F\u8897\u8A3A\u8CD1\u8EEB\u8FB0\u9032\u93AD\u9663\u9673\u9707\u4F84\u53F1\u59EA\u5AC9\u5E19\u684E\u74C6\u75BE\u79E9\u7A92\u81A3\u86ED\u8CEA\u8DCC\u8FED\u659F\u6715\uF9FD\u57F7\u6F57\u7DDD\u8F2F"],
      ["f3a1", "\u93F6\u96C6\u5FB5\u61F2\u6F84\u4E14\u4F98\u501F\u53C9\u55DF\u5D6F\u5DEE\u6B21\u6B64\u78CB\u7B9A\uF9FE\u8E49\u8ECA\u906E\u6349\u643E\u7740\u7A84\u932F\u947F\u9F6A\u64B0\u6FAF\u71E6\u74A8\u74DA\u7AC4\u7C12\u7E82\u7CB2\u7E98\u8B9A\u8D0A\u947D\u9910\u994C\u5239\u5BDF\u64E6\u672D\u7D2E\u50ED\u53C3\u5879\u6158\u6159\u61FA\u65AC\u7AD9\u8B92\u8B96\u5009\u5021\u5275\u5531\u5A3C\u5EE0\u5F70\u6134\u655E\u660C\u6636\u66A2\u69CD\u6EC4\u6F32\u7316\u7621\u7A93\u8139\u8259\u83D6\u84BC\u50B5\u57F0\u5BC0\u5BE8\u5F69\u63A1\u7826\u7DB5\u83DC\u8521\u91C7\u91F5\u518A\u67F5\u7B56"],
      ["f4a1", "\u8CAC\u51C4\u59BB\u60BD\u8655\u501C\uF9FF\u5254\u5C3A\u617D\u621A\u62D3\u64F2\u65A5\u6ECC\u7620\u810A\u8E60\u965F\u96BB\u4EDF\u5343\u5598\u5929\u5DDD\u64C5\u6CC9\u6DFA\u7394\u7A7F\u821B\u85A6\u8CE4\u8E10\u9077\u91E7\u95E1\u9621\u97C6\u51F8\u54F2\u5586\u5FB9\u64A4\u6F88\u7DB4\u8F1F\u8F4D\u9435\u50C9\u5C16\u6CBE\u6DFB\u751B\u77BB\u7C3D\u7C64\u8A79\u8AC2\u581E\u59BE\u5E16\u6377\u7252\u758A\u776B\u8ADC\u8CBC\u8F12\u5EF3\u6674\u6DF8\u807D\u83C1\u8ACB\u9751\u9BD6\uFA00\u5243\u66FF\u6D95\u6EEF\u7DE0\u8AE6\u902E\u905E\u9AD4\u521D\u527F\u54E8\u6194\u6284\u62DB\u68A2"],
      ["f5a1", "\u6912\u695A\u6A35\u7092\u7126\u785D\u7901\u790E\u79D2\u7A0D\u8096\u8278\u82D5\u8349\u8549\u8C82\u8D85\u9162\u918B\u91AE\u4FC3\u56D1\u71ED\u77D7\u8700\u89F8\u5BF8\u5FD6\u6751\u90A8\u53E2\u585A\u5BF5\u60A4\u6181\u6460\u7E3D\u8070\u8525\u9283\u64AE\u50AC\u5D14\u6700\u589C\u62BD\u63A8\u690E\u6978\u6A1E\u6E6B\u76BA\u79CB\u82BB\u8429\u8ACF\u8DA8\u8FFD\u9112\u914B\u919C\u9310\u9318\u939A\u96DB\u9A36\u9C0D\u4E11\u755C\u795D\u7AFA\u7B51\u7BC9\u7E2E\u84C4\u8E59\u8E74\u8EF8\u9010\u6625\u693F\u7443\u51FA\u672E\u9EDC\u5145\u5FE0\u6C96\u87F2\u885D\u8877\u60B4\u81B5\u8403"],
      ["f6a1", "\u8D05\u53D6\u5439\u5634\u5A36\u5C31\u708A\u7FE0\u805A\u8106\u81ED\u8DA3\u9189\u9A5F\u9DF2\u5074\u4EC4\u53A0\u60FB\u6E2C\u5C64\u4F88\u5024\u55E4\u5CD9\u5E5F\u6065\u6894\u6CBB\u6DC4\u71BE\u75D4\u75F4\u7661\u7A1A\u7A49\u7DC7\u7DFB\u7F6E\u81F4\u86A9\u8F1C\u96C9\u99B3\u9F52\u5247\u52C5\u98ED\u89AA\u4E03\u67D2\u6F06\u4FB5\u5BE2\u6795\u6C88\u6D78\u741B\u7827\u91DD\u937C\u87C4\u79E4\u7A31\u5FEB\u4ED6\u54A4\u553E\u58AE\u59A5\u60F0\u6253\u62D6\u6736\u6955\u8235\u9640\u99B1\u99DD\u502C\u5353\u5544\u577C\uFA01\u6258\uFA02\u64E2\u666B\u67DD\u6FC1\u6FEF\u7422\u7438\u8A17"],
      ["f7a1", "\u9438\u5451\u5606\u5766\u5F48\u619A\u6B4E\u7058\u70AD\u7DBB\u8A95\u596A\u812B\u63A2\u7708\u803D\u8CAA\u5854\u642D\u69BB\u5B95\u5E11\u6E6F\uFA03\u8569\u514C\u53F0\u592A\u6020\u614B\u6B86\u6C70\u6CF0\u7B1E\u80CE\u82D4\u8DC6\u90B0\u98B1\uFA04\u64C7\u6FA4\u6491\u6504\u514E\u5410\u571F\u8A0E\u615F\u6876\uFA05\u75DB\u7B52\u7D71\u901A\u5806\u69CC\u817F\u892A\u9000\u9839\u5078\u5957\u59AC\u6295\u900F\u9B2A\u615D\u7279\u95D6\u5761\u5A46\u5DF4\u628A\u64AD\u64FA\u6777\u6CE2\u6D3E\u722C\u7436\u7834\u7F77\u82AD\u8DDB\u9817\u5224\u5742\u677F\u7248\u74E3\u8CA9\u8FA6\u9211"],
      ["f8a1", "\u962A\u516B\u53ED\u634C\u4F69\u5504\u6096\u6557\u6C9B\u6D7F\u724C\u72FD\u7A17\u8987\u8C9D\u5F6D\u6F8E\u70F9\u81A8\u610E\u4FBF\u504F\u6241\u7247\u7BC7\u7DE8\u7FE9\u904D\u97AD\u9A19\u8CB6\u576A\u5E73\u67B0\u840D\u8A55\u5420\u5B16\u5E63\u5EE2\u5F0A\u6583\u80BA\u853D\u9589\u965B\u4F48\u5305\u530D\u530F\u5486\u54FA\u5703\u5E03\u6016\u629B\u62B1\u6355\uFA06\u6CE1\u6D66\u75B1\u7832\u80DE\u812F\u82DE\u8461\u84B2\u888D\u8912\u900B\u92EA\u98FD\u9B91\u5E45\u66B4\u66DD\u7011\u7206\uFA07\u4FF5\u527D\u5F6A\u6153\u6753\u6A19\u6F02\u74E2\u7968\u8868\u8C79\u98C7\u98C4\u9A43"],
      ["f9a1", "\u54C1\u7A1F\u6953\u8AF7\u8C4A\u98A8\u99AE\u5F7C\u62AB\u75B2\u76AE\u88AB\u907F\u9642\u5339\u5F3C\u5FC5\u6CCC\u73CC\u7562\u758B\u7B46\u82FE\u999D\u4E4F\u903C\u4E0B\u4F55\u53A6\u590F\u5EC8\u6630\u6CB3\u7455\u8377\u8766\u8CC0\u9050\u971E\u9C15\u58D1\u5B78\u8650\u8B14\u9DB4\u5BD2\u6068\u608D\u65F1\u6C57\u6F22\u6FA3\u701A\u7F55\u7FF0\u9591\u9592\u9650\u97D3\u5272\u8F44\u51FD\u542B\u54B8\u5563\u558A\u6ABB\u6DB5\u7DD8\u8266\u929C\u9677\u9E79\u5408\u54C8\u76D2\u86E4\u95A4\u95D4\u965C\u4EA2\u4F09\u59EE\u5AE6\u5DF7\u6052\u6297\u676D\u6841\u6C86\u6E2F\u7F38\u809B\u822A"],
      ["faa1", "\uFA08\uFA09\u9805\u4EA5\u5055\u54B3\u5793\u595A\u5B69\u5BB3\u61C8\u6977\u6D77\u7023\u87F9\u89E3\u8A72\u8AE7\u9082\u99ED\u9AB8\u52BE\u6838\u5016\u5E78\u674F\u8347\u884C\u4EAB\u5411\u56AE\u73E6\u9115\u97FF\u9909\u9957\u9999\u5653\u589F\u865B\u8A31\u61B2\u6AF6\u737B\u8ED2\u6B47\u96AA\u9A57\u5955\u7200\u8D6B\u9769\u4FD4\u5CF4\u5F26\u61F8\u665B\u6CEB\u70AB\u7384\u73B9\u73FE\u7729\u774D\u7D43\u7D62\u7E23\u8237\u8852\uFA0A\u8CE2\u9249\u986F\u5B51\u7A74\u8840\u9801\u5ACC\u4FE0\u5354\u593E\u5CFD\u633E\u6D79\u72F9\u8105\u8107\u83A2\u92CF\u9830\u4EA8\u5144\u5211\u578B"],
      ["fba1", "\u5F62\u6CC2\u6ECE\u7005\u7050\u70AF\u7192\u73E9\u7469\u834A\u87A2\u8861\u9008\u90A2\u93A3\u99A8\u516E\u5F57\u60E0\u6167\u66B3\u8559\u8E4A\u91AF\u978B\u4E4E\u4E92\u547C\u58D5\u58FA\u597D\u5CB5\u5F27\u6236\u6248\u660A\u6667\u6BEB\u6D69\u6DCF\u6E56\u6EF8\u6F94\u6FE0\u6FE9\u705D\u72D0\u7425\u745A\u74E0\u7693\u795C\u7CCA\u7E1E\u80E1\u82A6\u846B\u84BF\u864E\u865F\u8774\u8B77\u8C6A\u93AC\u9800\u9865\u60D1\u6216\u9177\u5A5A\u660F\u6DF7\u6E3E\u743F\u9B42\u5FFD\u60DA\u7B0F\u54C4\u5F18\u6C5E\u6CD3\u6D2A\u70D8\u7D05\u8679\u8A0C\u9D3B\u5316\u548C\u5B05\u6A3A\u706B\u7575"],
      ["fca1", "\u798D\u79BE\u82B1\u83EF\u8A71\u8B41\u8CA8\u9774\uFA0B\u64F4\u652B\u78BA\u78BB\u7A6B\u4E38\u559A\u5950\u5BA6\u5E7B\u60A3\u63DB\u6B61\u6665\u6853\u6E19\u7165\u74B0\u7D08\u9084\u9A69\u9C25\u6D3B\u6ED1\u733E\u8C41\u95CA\u51F0\u5E4C\u5FA8\u604D\u60F6\u6130\u614C\u6643\u6644\u69A5\u6CC1\u6E5F\u6EC9\u6F62\u714C\u749C\u7687\u7BC1\u7C27\u8352\u8757\u9051\u968D\u9EC3\u532F\u56DE\u5EFB\u5F8A\u6062\u6094\u61F7\u6666\u6703\u6A9C\u6DEE\u6FAE\u7070\u736A\u7E6A\u81BE\u8334\u86D4\u8AA8\u8CC4\u5283\u7372\u5B96\u6A6B\u9404\u54EE\u5686\u5B5D\u6548\u6585\u66C9\u689F\u6D8D\u6DC6"],
      ["fda1", "\u723B\u80B4\u9175\u9A4D\u4FAF\u5019\u539A\u540E\u543C\u5589\u55C5\u5E3F\u5F8C\u673D\u7166\u73DD\u9005\u52DB\u52F3\u5864\u58CE\u7104\u718F\u71FB\u85B0\u8A13\u6688\u85A8\u55A7\u6684\u714A\u8431\u5349\u5599\u6BC1\u5F59\u5FBD\u63EE\u6689\u7147\u8AF1\u8F1D\u9EBE\u4F11\u643A\u70CB\u7566\u8667\u6064\u8B4E\u9DF8\u5147\u51F6\u5308\u6D36\u80F8\u9ED1\u6615\u6B23\u7098\u75D5\u5403\u5C79\u7D07\u8A16\u6B20\u6B3D\u6B46\u5438\u6070\u6D3D\u7FD5\u8208\u50D6\u51DE\u559C\u566B\u56CD\u59EC\u5B09\u5E0C\u6199\u6198\u6231\u665E\u66E6\u7199\u71B9\u71BA\u72A7\u79A7\u7A00\u7FB2\u8A70"]
    ];
  }
});

// ../../../node_modules/encoding/node_modules/iconv-lite/encodings/tables/cp950.json
var require_cp950 = __commonJS({
  "../../../node_modules/encoding/node_modules/iconv-lite/encodings/tables/cp950.json"(exports, module2) {
    module2.exports = [
      ["0", "\0", 127],
      ["a140", "\u3000\uFF0C\u3001\u3002\uFF0E\u2027\uFF1B\uFF1A\uFF1F\uFF01\uFE30\u2026\u2025\uFE50\uFE51\uFE52\xB7\uFE54\uFE55\uFE56\uFE57\uFF5C\u2013\uFE31\u2014\uFE33\u2574\uFE34\uFE4F\uFF08\uFF09\uFE35\uFE36\uFF5B\uFF5D\uFE37\uFE38\u3014\u3015\uFE39\uFE3A\u3010\u3011\uFE3B\uFE3C\u300A\u300B\uFE3D\uFE3E\u3008\u3009\uFE3F\uFE40\u300C\u300D\uFE41\uFE42\u300E\u300F\uFE43\uFE44\uFE59\uFE5A"],
      ["a1a1", "\uFE5B\uFE5C\uFE5D\uFE5E\u2018\u2019\u201C\u201D\u301D\u301E\u2035\u2032\uFF03\uFF06\uFF0A\u203B\xA7\u3003\u25CB\u25CF\u25B3\u25B2\u25CE\u2606\u2605\u25C7\u25C6\u25A1\u25A0\u25BD\u25BC\u32A3\u2105\xAF\uFFE3\uFF3F\u02CD\uFE49\uFE4A\uFE4D\uFE4E\uFE4B\uFE4C\uFE5F\uFE60\uFE61\uFF0B\uFF0D\xD7\xF7\xB1\u221A\uFF1C\uFF1E\uFF1D\u2266\u2267\u2260\u221E\u2252\u2261\uFE62", 4, "\uFF5E\u2229\u222A\u22A5\u2220\u221F\u22BF\u33D2\u33D1\u222B\u222E\u2235\u2234\u2640\u2642\u2295\u2299\u2191\u2193\u2190\u2192\u2196\u2197\u2199\u2198\u2225\u2223\uFF0F"],
      ["a240", "\uFF3C\u2215\uFE68\uFF04\uFFE5\u3012\uFFE0\uFFE1\uFF05\uFF20\u2103\u2109\uFE69\uFE6A\uFE6B\u33D5\u339C\u339D\u339E\u33CE\u33A1\u338E\u338F\u33C4\xB0\u5159\u515B\u515E\u515D\u5161\u5163\u55E7\u74E9\u7CCE\u2581", 7, "\u258F\u258E\u258D\u258C\u258B\u258A\u2589\u253C\u2534\u252C\u2524\u251C\u2594\u2500\u2502\u2595\u250C\u2510\u2514\u2518\u256D"],
      ["a2a1", "\u256E\u2570\u256F\u2550\u255E\u256A\u2561\u25E2\u25E3\u25E5\u25E4\u2571\u2572\u2573\uFF10", 9, "\u2160", 9, "\u3021", 8, "\u5341\u5344\u5345\uFF21", 25, "\uFF41", 21],
      ["a340", "\uFF57\uFF58\uFF59\uFF5A\u0391", 16, "\u03A3", 6, "\u03B1", 16, "\u03C3", 6, "\u3105", 10],
      ["a3a1", "\u3110", 25, "\u02D9\u02C9\u02CA\u02C7\u02CB"],
      ["a3e1", "\u20AC"],
      ["a440", "\u4E00\u4E59\u4E01\u4E03\u4E43\u4E5D\u4E86\u4E8C\u4EBA\u513F\u5165\u516B\u51E0\u5200\u5201\u529B\u5315\u5341\u535C\u53C8\u4E09\u4E0B\u4E08\u4E0A\u4E2B\u4E38\u51E1\u4E45\u4E48\u4E5F\u4E5E\u4E8E\u4EA1\u5140\u5203\u52FA\u5343\u53C9\u53E3\u571F\u58EB\u5915\u5927\u5973\u5B50\u5B51\u5B53\u5BF8\u5C0F\u5C22\u5C38\u5C71\u5DDD\u5DE5\u5DF1\u5DF2\u5DF3\u5DFE\u5E72\u5EFE\u5F0B\u5F13\u624D"],
      ["a4a1", "\u4E11\u4E10\u4E0D\u4E2D\u4E30\u4E39\u4E4B\u5C39\u4E88\u4E91\u4E95\u4E92\u4E94\u4EA2\u4EC1\u4EC0\u4EC3\u4EC6\u4EC7\u4ECD\u4ECA\u4ECB\u4EC4\u5143\u5141\u5167\u516D\u516E\u516C\u5197\u51F6\u5206\u5207\u5208\u52FB\u52FE\u52FF\u5316\u5339\u5348\u5347\u5345\u535E\u5384\u53CB\u53CA\u53CD\u58EC\u5929\u592B\u592A\u592D\u5B54\u5C11\u5C24\u5C3A\u5C6F\u5DF4\u5E7B\u5EFF\u5F14\u5F15\u5FC3\u6208\u6236\u624B\u624E\u652F\u6587\u6597\u65A4\u65B9\u65E5\u66F0\u6708\u6728\u6B20\u6B62\u6B79\u6BCB\u6BD4\u6BDB\u6C0F\u6C34\u706B\u722A\u7236\u723B\u7247\u7259\u725B\u72AC\u738B\u4E19"],
      ["a540", "\u4E16\u4E15\u4E14\u4E18\u4E3B\u4E4D\u4E4F\u4E4E\u4EE5\u4ED8\u4ED4\u4ED5\u4ED6\u4ED7\u4EE3\u4EE4\u4ED9\u4EDE\u5145\u5144\u5189\u518A\u51AC\u51F9\u51FA\u51F8\u520A\u52A0\u529F\u5305\u5306\u5317\u531D\u4EDF\u534A\u5349\u5361\u5360\u536F\u536E\u53BB\u53EF\u53E4\u53F3\u53EC\u53EE\u53E9\u53E8\u53FC\u53F8\u53F5\u53EB\u53E6\u53EA\u53F2\u53F1\u53F0\u53E5\u53ED\u53FB\u56DB\u56DA\u5916"],
      ["a5a1", "\u592E\u5931\u5974\u5976\u5B55\u5B83\u5C3C\u5DE8\u5DE7\u5DE6\u5E02\u5E03\u5E73\u5E7C\u5F01\u5F18\u5F17\u5FC5\u620A\u6253\u6254\u6252\u6251\u65A5\u65E6\u672E\u672C\u672A\u672B\u672D\u6B63\u6BCD\u6C11\u6C10\u6C38\u6C41\u6C40\u6C3E\u72AF\u7384\u7389\u74DC\u74E6\u7518\u751F\u7528\u7529\u7530\u7531\u7532\u7533\u758B\u767D\u76AE\u76BF\u76EE\u77DB\u77E2\u77F3\u793A\u79BE\u7A74\u7ACB\u4E1E\u4E1F\u4E52\u4E53\u4E69\u4E99\u4EA4\u4EA6\u4EA5\u4EFF\u4F09\u4F19\u4F0A\u4F15\u4F0D\u4F10\u4F11\u4F0F\u4EF2\u4EF6\u4EFB\u4EF0\u4EF3\u4EFD\u4F01\u4F0B\u5149\u5147\u5146\u5148\u5168"],
      ["a640", "\u5171\u518D\u51B0\u5217\u5211\u5212\u520E\u5216\u52A3\u5308\u5321\u5320\u5370\u5371\u5409\u540F\u540C\u540A\u5410\u5401\u540B\u5404\u5411\u540D\u5408\u5403\u540E\u5406\u5412\u56E0\u56DE\u56DD\u5733\u5730\u5728\u572D\u572C\u572F\u5729\u5919\u591A\u5937\u5938\u5984\u5978\u5983\u597D\u5979\u5982\u5981\u5B57\u5B58\u5B87\u5B88\u5B85\u5B89\u5BFA\u5C16\u5C79\u5DDE\u5E06\u5E76\u5E74"],
      ["a6a1", "\u5F0F\u5F1B\u5FD9\u5FD6\u620E\u620C\u620D\u6210\u6263\u625B\u6258\u6536\u65E9\u65E8\u65EC\u65ED\u66F2\u66F3\u6709\u673D\u6734\u6731\u6735\u6B21\u6B64\u6B7B\u6C16\u6C5D\u6C57\u6C59\u6C5F\u6C60\u6C50\u6C55\u6C61\u6C5B\u6C4D\u6C4E\u7070\u725F\u725D\u767E\u7AF9\u7C73\u7CF8\u7F36\u7F8A\u7FBD\u8001\u8003\u800C\u8012\u8033\u807F\u8089\u808B\u808C\u81E3\u81EA\u81F3\u81FC\u820C\u821B\u821F\u826E\u8272\u827E\u866B\u8840\u884C\u8863\u897F\u9621\u4E32\u4EA8\u4F4D\u4F4F\u4F47\u4F57\u4F5E\u4F34\u4F5B\u4F55\u4F30\u4F50\u4F51\u4F3D\u4F3A\u4F38\u4F43\u4F54\u4F3C\u4F46\u4F63"],
      ["a740", "\u4F5C\u4F60\u4F2F\u4F4E\u4F36\u4F59\u4F5D\u4F48\u4F5A\u514C\u514B\u514D\u5175\u51B6\u51B7\u5225\u5224\u5229\u522A\u5228\u52AB\u52A9\u52AA\u52AC\u5323\u5373\u5375\u541D\u542D\u541E\u543E\u5426\u544E\u5427\u5446\u5443\u5433\u5448\u5442\u541B\u5429\u544A\u5439\u543B\u5438\u542E\u5435\u5436\u5420\u543C\u5440\u5431\u542B\u541F\u542C\u56EA\u56F0\u56E4\u56EB\u574A\u5751\u5740\u574D"],
      ["a7a1", "\u5747\u574E\u573E\u5750\u574F\u573B\u58EF\u593E\u599D\u5992\u59A8\u599E\u59A3\u5999\u5996\u598D\u59A4\u5993\u598A\u59A5\u5B5D\u5B5C\u5B5A\u5B5B\u5B8C\u5B8B\u5B8F\u5C2C\u5C40\u5C41\u5C3F\u5C3E\u5C90\u5C91\u5C94\u5C8C\u5DEB\u5E0C\u5E8F\u5E87\u5E8A\u5EF7\u5F04\u5F1F\u5F64\u5F62\u5F77\u5F79\u5FD8\u5FCC\u5FD7\u5FCD\u5FF1\u5FEB\u5FF8\u5FEA\u6212\u6211\u6284\u6297\u6296\u6280\u6276\u6289\u626D\u628A\u627C\u627E\u6279\u6273\u6292\u626F\u6298\u626E\u6295\u6293\u6291\u6286\u6539\u653B\u6538\u65F1\u66F4\u675F\u674E\u674F\u6750\u6751\u675C\u6756\u675E\u6749\u6746\u6760"],
      ["a840", "\u6753\u6757\u6B65\u6BCF\u6C42\u6C5E\u6C99\u6C81\u6C88\u6C89\u6C85\u6C9B\u6C6A\u6C7A\u6C90\u6C70\u6C8C\u6C68\u6C96\u6C92\u6C7D\u6C83\u6C72\u6C7E\u6C74\u6C86\u6C76\u6C8D\u6C94\u6C98\u6C82\u7076\u707C\u707D\u7078\u7262\u7261\u7260\u72C4\u72C2\u7396\u752C\u752B\u7537\u7538\u7682\u76EF\u77E3\u79C1\u79C0\u79BF\u7A76\u7CFB\u7F55\u8096\u8093\u809D\u8098\u809B\u809A\u80B2\u826F\u8292"],
      ["a8a1", "\u828B\u828D\u898B\u89D2\u8A00\u8C37\u8C46\u8C55\u8C9D\u8D64\u8D70\u8DB3\u8EAB\u8ECA\u8F9B\u8FB0\u8FC2\u8FC6\u8FC5\u8FC4\u5DE1\u9091\u90A2\u90AA\u90A6\u90A3\u9149\u91C6\u91CC\u9632\u962E\u9631\u962A\u962C\u4E26\u4E56\u4E73\u4E8B\u4E9B\u4E9E\u4EAB\u4EAC\u4F6F\u4F9D\u4F8D\u4F73\u4F7F\u4F6C\u4F9B\u4F8B\u4F86\u4F83\u4F70\u4F75\u4F88\u4F69\u4F7B\u4F96\u4F7E\u4F8F\u4F91\u4F7A\u5154\u5152\u5155\u5169\u5177\u5176\u5178\u51BD\u51FD\u523B\u5238\u5237\u523A\u5230\u522E\u5236\u5241\u52BE\u52BB\u5352\u5354\u5353\u5351\u5366\u5377\u5378\u5379\u53D6\u53D4\u53D7\u5473\u5475"],
      ["a940", "\u5496\u5478\u5495\u5480\u547B\u5477\u5484\u5492\u5486\u547C\u5490\u5471\u5476\u548C\u549A\u5462\u5468\u548B\u547D\u548E\u56FA\u5783\u5777\u576A\u5769\u5761\u5766\u5764\u577C\u591C\u5949\u5947\u5948\u5944\u5954\u59BE\u59BB\u59D4\u59B9\u59AE\u59D1\u59C6\u59D0\u59CD\u59CB\u59D3\u59CA\u59AF\u59B3\u59D2\u59C5\u5B5F\u5B64\u5B63\u5B97\u5B9A\u5B98\u5B9C\u5B99\u5B9B\u5C1A\u5C48\u5C45"],
      ["a9a1", "\u5C46\u5CB7\u5CA1\u5CB8\u5CA9\u5CAB\u5CB1\u5CB3\u5E18\u5E1A\u5E16\u5E15\u5E1B\u5E11\u5E78\u5E9A\u5E97\u5E9C\u5E95\u5E96\u5EF6\u5F26\u5F27\u5F29\u5F80\u5F81\u5F7F\u5F7C\u5FDD\u5FE0\u5FFD\u5FF5\u5FFF\u600F\u6014\u602F\u6035\u6016\u602A\u6015\u6021\u6027\u6029\u602B\u601B\u6216\u6215\u623F\u623E\u6240\u627F\u62C9\u62CC\u62C4\u62BF\u62C2\u62B9\u62D2\u62DB\u62AB\u62D3\u62D4\u62CB\u62C8\u62A8\u62BD\u62BC\u62D0\u62D9\u62C7\u62CD\u62B5\u62DA\u62B1\u62D8\u62D6\u62D7\u62C6\u62AC\u62CE\u653E\u65A7\u65BC\u65FA\u6614\u6613\u660C\u6606\u6602\u660E\u6600\u660F\u6615\u660A"],
      ["aa40", "\u6607\u670D\u670B\u676D\u678B\u6795\u6771\u679C\u6773\u6777\u6787\u679D\u6797\u676F\u6770\u677F\u6789\u677E\u6790\u6775\u679A\u6793\u677C\u676A\u6772\u6B23\u6B66\u6B67\u6B7F\u6C13\u6C1B\u6CE3\u6CE8\u6CF3\u6CB1\u6CCC\u6CE5\u6CB3\u6CBD\u6CBE\u6CBC\u6CE2\u6CAB\u6CD5\u6CD3\u6CB8\u6CC4\u6CB9\u6CC1\u6CAE\u6CD7\u6CC5\u6CF1\u6CBF\u6CBB\u6CE1\u6CDB\u6CCA\u6CAC\u6CEF\u6CDC\u6CD6\u6CE0"],
      ["aaa1", "\u7095\u708E\u7092\u708A\u7099\u722C\u722D\u7238\u7248\u7267\u7269\u72C0\u72CE\u72D9\u72D7\u72D0\u73A9\u73A8\u739F\u73AB\u73A5\u753D\u759D\u7599\u759A\u7684\u76C2\u76F2\u76F4\u77E5\u77FD\u793E\u7940\u7941\u79C9\u79C8\u7A7A\u7A79\u7AFA\u7CFE\u7F54\u7F8C\u7F8B\u8005\u80BA\u80A5\u80A2\u80B1\u80A1\u80AB\u80A9\u80B4\u80AA\u80AF\u81E5\u81FE\u820D\u82B3\u829D\u8299\u82AD\u82BD\u829F\u82B9\u82B1\u82AC\u82A5\u82AF\u82B8\u82A3\u82B0\u82BE\u82B7\u864E\u8671\u521D\u8868\u8ECB\u8FCE\u8FD4\u8FD1\u90B5\u90B8\u90B1\u90B6\u91C7\u91D1\u9577\u9580\u961C\u9640\u963F\u963B\u9644"],
      ["ab40", "\u9642\u96B9\u96E8\u9752\u975E\u4E9F\u4EAD\u4EAE\u4FE1\u4FB5\u4FAF\u4FBF\u4FE0\u4FD1\u4FCF\u4FDD\u4FC3\u4FB6\u4FD8\u4FDF\u4FCA\u4FD7\u4FAE\u4FD0\u4FC4\u4FC2\u4FDA\u4FCE\u4FDE\u4FB7\u5157\u5192\u5191\u51A0\u524E\u5243\u524A\u524D\u524C\u524B\u5247\u52C7\u52C9\u52C3\u52C1\u530D\u5357\u537B\u539A\u53DB\u54AC\u54C0\u54A8\u54CE\u54C9\u54B8\u54A6\u54B3\u54C7\u54C2\u54BD\u54AA\u54C1"],
      ["aba1", "\u54C4\u54C8\u54AF\u54AB\u54B1\u54BB\u54A9\u54A7\u54BF\u56FF\u5782\u578B\u57A0\u57A3\u57A2\u57CE\u57AE\u5793\u5955\u5951\u594F\u594E\u5950\u59DC\u59D8\u59FF\u59E3\u59E8\u5A03\u59E5\u59EA\u59DA\u59E6\u5A01\u59FB\u5B69\u5BA3\u5BA6\u5BA4\u5BA2\u5BA5\u5C01\u5C4E\u5C4F\u5C4D\u5C4B\u5CD9\u5CD2\u5DF7\u5E1D\u5E25\u5E1F\u5E7D\u5EA0\u5EA6\u5EFA\u5F08\u5F2D\u5F65\u5F88\u5F85\u5F8A\u5F8B\u5F87\u5F8C\u5F89\u6012\u601D\u6020\u6025\u600E\u6028\u604D\u6070\u6068\u6062\u6046\u6043\u606C\u606B\u606A\u6064\u6241\u62DC\u6316\u6309\u62FC\u62ED\u6301\u62EE\u62FD\u6307\u62F1\u62F7"],
      ["ac40", "\u62EF\u62EC\u62FE\u62F4\u6311\u6302\u653F\u6545\u65AB\u65BD\u65E2\u6625\u662D\u6620\u6627\u662F\u661F\u6628\u6631\u6624\u66F7\u67FF\u67D3\u67F1\u67D4\u67D0\u67EC\u67B6\u67AF\u67F5\u67E9\u67EF\u67C4\u67D1\u67B4\u67DA\u67E5\u67B8\u67CF\u67DE\u67F3\u67B0\u67D9\u67E2\u67DD\u67D2\u6B6A\u6B83\u6B86\u6BB5\u6BD2\u6BD7\u6C1F\u6CC9\u6D0B\u6D32\u6D2A\u6D41\u6D25\u6D0C\u6D31\u6D1E\u6D17"],
      ["aca1", "\u6D3B\u6D3D\u6D3E\u6D36\u6D1B\u6CF5\u6D39\u6D27\u6D38\u6D29\u6D2E\u6D35\u6D0E\u6D2B\u70AB\u70BA\u70B3\u70AC\u70AF\u70AD\u70B8\u70AE\u70A4\u7230\u7272\u726F\u7274\u72E9\u72E0\u72E1\u73B7\u73CA\u73BB\u73B2\u73CD\u73C0\u73B3\u751A\u752D\u754F\u754C\u754E\u754B\u75AB\u75A4\u75A5\u75A2\u75A3\u7678\u7686\u7687\u7688\u76C8\u76C6\u76C3\u76C5\u7701\u76F9\u76F8\u7709\u770B\u76FE\u76FC\u7707\u77DC\u7802\u7814\u780C\u780D\u7946\u7949\u7948\u7947\u79B9\u79BA\u79D1\u79D2\u79CB\u7A7F\u7A81\u7AFF\u7AFD\u7C7D\u7D02\u7D05\u7D00\u7D09\u7D07\u7D04\u7D06\u7F38\u7F8E\u7FBF\u8004"],
      ["ad40", "\u8010\u800D\u8011\u8036\u80D6\u80E5\u80DA\u80C3\u80C4\u80CC\u80E1\u80DB\u80CE\u80DE\u80E4\u80DD\u81F4\u8222\u82E7\u8303\u8305\u82E3\u82DB\u82E6\u8304\u82E5\u8302\u8309\u82D2\u82D7\u82F1\u8301\u82DC\u82D4\u82D1\u82DE\u82D3\u82DF\u82EF\u8306\u8650\u8679\u867B\u867A\u884D\u886B\u8981\u89D4\u8A08\u8A02\u8A03\u8C9E\u8CA0\u8D74\u8D73\u8DB4\u8ECD\u8ECC\u8FF0\u8FE6\u8FE2\u8FEA\u8FE5"],
      ["ada1", "\u8FED\u8FEB\u8FE4\u8FE8\u90CA\u90CE\u90C1\u90C3\u914B\u914A\u91CD\u9582\u9650\u964B\u964C\u964D\u9762\u9769\u97CB\u97ED\u97F3\u9801\u98A8\u98DB\u98DF\u9996\u9999\u4E58\u4EB3\u500C\u500D\u5023\u4FEF\u5026\u5025\u4FF8\u5029\u5016\u5006\u503C\u501F\u501A\u5012\u5011\u4FFA\u5000\u5014\u5028\u4FF1\u5021\u500B\u5019\u5018\u4FF3\u4FEE\u502D\u502A\u4FFE\u502B\u5009\u517C\u51A4\u51A5\u51A2\u51CD\u51CC\u51C6\u51CB\u5256\u525C\u5254\u525B\u525D\u532A\u537F\u539F\u539D\u53DF\u54E8\u5510\u5501\u5537\u54FC\u54E5\u54F2\u5506\u54FA\u5514\u54E9\u54ED\u54E1\u5509\u54EE\u54EA"],
      ["ae40", "\u54E6\u5527\u5507\u54FD\u550F\u5703\u5704\u57C2\u57D4\u57CB\u57C3\u5809\u590F\u5957\u5958\u595A\u5A11\u5A18\u5A1C\u5A1F\u5A1B\u5A13\u59EC\u5A20\u5A23\u5A29\u5A25\u5A0C\u5A09\u5B6B\u5C58\u5BB0\u5BB3\u5BB6\u5BB4\u5BAE\u5BB5\u5BB9\u5BB8\u5C04\u5C51\u5C55\u5C50\u5CED\u5CFD\u5CFB\u5CEA\u5CE8\u5CF0\u5CF6\u5D01\u5CF4\u5DEE\u5E2D\u5E2B\u5EAB\u5EAD\u5EA7\u5F31\u5F92\u5F91\u5F90\u6059"],
      ["aea1", "\u6063\u6065\u6050\u6055\u606D\u6069\u606F\u6084\u609F\u609A\u608D\u6094\u608C\u6085\u6096\u6247\u62F3\u6308\u62FF\u634E\u633E\u632F\u6355\u6342\u6346\u634F\u6349\u633A\u6350\u633D\u632A\u632B\u6328\u634D\u634C\u6548\u6549\u6599\u65C1\u65C5\u6642\u6649\u664F\u6643\u6652\u664C\u6645\u6641\u66F8\u6714\u6715\u6717\u6821\u6838\u6848\u6846\u6853\u6839\u6842\u6854\u6829\u68B3\u6817\u684C\u6851\u683D\u67F4\u6850\u6840\u683C\u6843\u682A\u6845\u6813\u6818\u6841\u6B8A\u6B89\u6BB7\u6C23\u6C27\u6C28\u6C26\u6C24\u6CF0\u6D6A\u6D95\u6D88\u6D87\u6D66\u6D78\u6D77\u6D59\u6D93"],
      ["af40", "\u6D6C\u6D89\u6D6E\u6D5A\u6D74\u6D69\u6D8C\u6D8A\u6D79\u6D85\u6D65\u6D94\u70CA\u70D8\u70E4\u70D9\u70C8\u70CF\u7239\u7279\u72FC\u72F9\u72FD\u72F8\u72F7\u7386\u73ED\u7409\u73EE\u73E0\u73EA\u73DE\u7554\u755D\u755C\u755A\u7559\u75BE\u75C5\u75C7\u75B2\u75B3\u75BD\u75BC\u75B9\u75C2\u75B8\u768B\u76B0\u76CA\u76CD\u76CE\u7729\u771F\u7720\u7728\u77E9\u7830\u7827\u7838\u781D\u7834\u7837"],
      ["afa1", "\u7825\u782D\u7820\u781F\u7832\u7955\u7950\u7960\u795F\u7956\u795E\u795D\u7957\u795A\u79E4\u79E3\u79E7\u79DF\u79E6\u79E9\u79D8\u7A84\u7A88\u7AD9\u7B06\u7B11\u7C89\u7D21\u7D17\u7D0B\u7D0A\u7D20\u7D22\u7D14\u7D10\u7D15\u7D1A\u7D1C\u7D0D\u7D19\u7D1B\u7F3A\u7F5F\u7F94\u7FC5\u7FC1\u8006\u8018\u8015\u8019\u8017\u803D\u803F\u80F1\u8102\u80F0\u8105\u80ED\u80F4\u8106\u80F8\u80F3\u8108\u80FD\u810A\u80FC\u80EF\u81ED\u81EC\u8200\u8210\u822A\u822B\u8228\u822C\u82BB\u832B\u8352\u8354\u834A\u8338\u8350\u8349\u8335\u8334\u834F\u8332\u8339\u8336\u8317\u8340\u8331\u8328\u8343"],
      ["b040", "\u8654\u868A\u86AA\u8693\u86A4\u86A9\u868C\u86A3\u869C\u8870\u8877\u8881\u8882\u887D\u8879\u8A18\u8A10\u8A0E\u8A0C\u8A15\u8A0A\u8A17\u8A13\u8A16\u8A0F\u8A11\u8C48\u8C7A\u8C79\u8CA1\u8CA2\u8D77\u8EAC\u8ED2\u8ED4\u8ECF\u8FB1\u9001\u9006\u8FF7\u9000\u8FFA\u8FF4\u9003\u8FFD\u9005\u8FF8\u9095\u90E1\u90DD\u90E2\u9152\u914D\u914C\u91D8\u91DD\u91D7\u91DC\u91D9\u9583\u9662\u9663\u9661"],
      ["b0a1", "\u965B\u965D\u9664\u9658\u965E\u96BB\u98E2\u99AC\u9AA8\u9AD8\u9B25\u9B32\u9B3C\u4E7E\u507A\u507D\u505C\u5047\u5043\u504C\u505A\u5049\u5065\u5076\u504E\u5055\u5075\u5074\u5077\u504F\u500F\u506F\u506D\u515C\u5195\u51F0\u526A\u526F\u52D2\u52D9\u52D8\u52D5\u5310\u530F\u5319\u533F\u5340\u533E\u53C3\u66FC\u5546\u556A\u5566\u5544\u555E\u5561\u5543\u554A\u5531\u5556\u554F\u5555\u552F\u5564\u5538\u552E\u555C\u552C\u5563\u5533\u5541\u5557\u5708\u570B\u5709\u57DF\u5805\u580A\u5806\u57E0\u57E4\u57FA\u5802\u5835\u57F7\u57F9\u5920\u5962\u5A36\u5A41\u5A49\u5A66\u5A6A\u5A40"],
      ["b140", "\u5A3C\u5A62\u5A5A\u5A46\u5A4A\u5B70\u5BC7\u5BC5\u5BC4\u5BC2\u5BBF\u5BC6\u5C09\u5C08\u5C07\u5C60\u5C5C\u5C5D\u5D07\u5D06\u5D0E\u5D1B\u5D16\u5D22\u5D11\u5D29\u5D14\u5D19\u5D24\u5D27\u5D17\u5DE2\u5E38\u5E36\u5E33\u5E37\u5EB7\u5EB8\u5EB6\u5EB5\u5EBE\u5F35\u5F37\u5F57\u5F6C\u5F69\u5F6B\u5F97\u5F99\u5F9E\u5F98\u5FA1\u5FA0\u5F9C\u607F\u60A3\u6089\u60A0\u60A8\u60CB\u60B4\u60E6\u60BD"],
      ["b1a1", "\u60C5\u60BB\u60B5\u60DC\u60BC\u60D8\u60D5\u60C6\u60DF\u60B8\u60DA\u60C7\u621A\u621B\u6248\u63A0\u63A7\u6372\u6396\u63A2\u63A5\u6377\u6367\u6398\u63AA\u6371\u63A9\u6389\u6383\u639B\u636B\u63A8\u6384\u6388\u6399\u63A1\u63AC\u6392\u638F\u6380\u637B\u6369\u6368\u637A\u655D\u6556\u6551\u6559\u6557\u555F\u654F\u6558\u6555\u6554\u659C\u659B\u65AC\u65CF\u65CB\u65CC\u65CE\u665D\u665A\u6664\u6668\u6666\u665E\u66F9\u52D7\u671B\u6881\u68AF\u68A2\u6893\u68B5\u687F\u6876\u68B1\u68A7\u6897\u68B0\u6883\u68C4\u68AD\u6886\u6885\u6894\u689D\u68A8\u689F\u68A1\u6882\u6B32\u6BBA"],
      ["b240", "\u6BEB\u6BEC\u6C2B\u6D8E\u6DBC\u6DF3\u6DD9\u6DB2\u6DE1\u6DCC\u6DE4\u6DFB\u6DFA\u6E05\u6DC7\u6DCB\u6DAF\u6DD1\u6DAE\u6DDE\u6DF9\u6DB8\u6DF7\u6DF5\u6DC5\u6DD2\u6E1A\u6DB5\u6DDA\u6DEB\u6DD8\u6DEA\u6DF1\u6DEE\u6DE8\u6DC6\u6DC4\u6DAA\u6DEC\u6DBF\u6DE6\u70F9\u7109\u710A\u70FD\u70EF\u723D\u727D\u7281\u731C\u731B\u7316\u7313\u7319\u7387\u7405\u740A\u7403\u7406\u73FE\u740D\u74E0\u74F6"],
      ["b2a1", "\u74F7\u751C\u7522\u7565\u7566\u7562\u7570\u758F\u75D4\u75D5\u75B5\u75CA\u75CD\u768E\u76D4\u76D2\u76DB\u7737\u773E\u773C\u7736\u7738\u773A\u786B\u7843\u784E\u7965\u7968\u796D\u79FB\u7A92\u7A95\u7B20\u7B28\u7B1B\u7B2C\u7B26\u7B19\u7B1E\u7B2E\u7C92\u7C97\u7C95\u7D46\u7D43\u7D71\u7D2E\u7D39\u7D3C\u7D40\u7D30\u7D33\u7D44\u7D2F\u7D42\u7D32\u7D31\u7F3D\u7F9E\u7F9A\u7FCC\u7FCE\u7FD2\u801C\u804A\u8046\u812F\u8116\u8123\u812B\u8129\u8130\u8124\u8202\u8235\u8237\u8236\u8239\u838E\u839E\u8398\u8378\u83A2\u8396\u83BD\u83AB\u8392\u838A\u8393\u8389\u83A0\u8377\u837B\u837C"],
      ["b340", "\u8386\u83A7\u8655\u5F6A\u86C7\u86C0\u86B6\u86C4\u86B5\u86C6\u86CB\u86B1\u86AF\u86C9\u8853\u889E\u8888\u88AB\u8892\u8896\u888D\u888B\u8993\u898F\u8A2A\u8A1D\u8A23\u8A25\u8A31\u8A2D\u8A1F\u8A1B\u8A22\u8C49\u8C5A\u8CA9\u8CAC\u8CAB\u8CA8\u8CAA\u8CA7\u8D67\u8D66\u8DBE\u8DBA\u8EDB\u8EDF\u9019\u900D\u901A\u9017\u9023\u901F\u901D\u9010\u9015\u901E\u9020\u900F\u9022\u9016\u901B\u9014"],
      ["b3a1", "\u90E8\u90ED\u90FD\u9157\u91CE\u91F5\u91E6\u91E3\u91E7\u91ED\u91E9\u9589\u966A\u9675\u9673\u9678\u9670\u9674\u9676\u9677\u966C\u96C0\u96EA\u96E9\u7AE0\u7ADF\u9802\u9803\u9B5A\u9CE5\u9E75\u9E7F\u9EA5\u9EBB\u50A2\u508D\u5085\u5099\u5091\u5080\u5096\u5098\u509A\u6700\u51F1\u5272\u5274\u5275\u5269\u52DE\u52DD\u52DB\u535A\u53A5\u557B\u5580\u55A7\u557C\u558A\u559D\u5598\u5582\u559C\u55AA\u5594\u5587\u558B\u5583\u55B3\u55AE\u559F\u553E\u55B2\u559A\u55BB\u55AC\u55B1\u557E\u5589\u55AB\u5599\u570D\u582F\u582A\u5834\u5824\u5830\u5831\u5821\u581D\u5820\u58F9\u58FA\u5960"],
      ["b440", "\u5A77\u5A9A\u5A7F\u5A92\u5A9B\u5AA7\u5B73\u5B71\u5BD2\u5BCC\u5BD3\u5BD0\u5C0A\u5C0B\u5C31\u5D4C\u5D50\u5D34\u5D47\u5DFD\u5E45\u5E3D\u5E40\u5E43\u5E7E\u5ECA\u5EC1\u5EC2\u5EC4\u5F3C\u5F6D\u5FA9\u5FAA\u5FA8\u60D1\u60E1\u60B2\u60B6\u60E0\u611C\u6123\u60FA\u6115\u60F0\u60FB\u60F4\u6168\u60F1\u610E\u60F6\u6109\u6100\u6112\u621F\u6249\u63A3\u638C\u63CF\u63C0\u63E9\u63C9\u63C6\u63CD"],
      ["b4a1", "\u63D2\u63E3\u63D0\u63E1\u63D6\u63ED\u63EE\u6376\u63F4\u63EA\u63DB\u6452\u63DA\u63F9\u655E\u6566\u6562\u6563\u6591\u6590\u65AF\u666E\u6670\u6674\u6676\u666F\u6691\u667A\u667E\u6677\u66FE\u66FF\u671F\u671D\u68FA\u68D5\u68E0\u68D8\u68D7\u6905\u68DF\u68F5\u68EE\u68E7\u68F9\u68D2\u68F2\u68E3\u68CB\u68CD\u690D\u6912\u690E\u68C9\u68DA\u696E\u68FB\u6B3E\u6B3A\u6B3D\u6B98\u6B96\u6BBC\u6BEF\u6C2E\u6C2F\u6C2C\u6E2F\u6E38\u6E54\u6E21\u6E32\u6E67\u6E4A\u6E20\u6E25\u6E23\u6E1B\u6E5B\u6E58\u6E24\u6E56\u6E6E\u6E2D\u6E26\u6E6F\u6E34\u6E4D\u6E3A\u6E2C\u6E43\u6E1D\u6E3E\u6ECB"],
      ["b540", "\u6E89\u6E19\u6E4E\u6E63\u6E44\u6E72\u6E69\u6E5F\u7119\u711A\u7126\u7130\u7121\u7136\u716E\u711C\u724C\u7284\u7280\u7336\u7325\u7334\u7329\u743A\u742A\u7433\u7422\u7425\u7435\u7436\u7434\u742F\u741B\u7426\u7428\u7525\u7526\u756B\u756A\u75E2\u75DB\u75E3\u75D9\u75D8\u75DE\u75E0\u767B\u767C\u7696\u7693\u76B4\u76DC\u774F\u77ED\u785D\u786C\u786F\u7A0D\u7A08\u7A0B\u7A05\u7A00\u7A98"],
      ["b5a1", "\u7A97\u7A96\u7AE5\u7AE3\u7B49\u7B56\u7B46\u7B50\u7B52\u7B54\u7B4D\u7B4B\u7B4F\u7B51\u7C9F\u7CA5\u7D5E\u7D50\u7D68\u7D55\u7D2B\u7D6E\u7D72\u7D61\u7D66\u7D62\u7D70\u7D73\u5584\u7FD4\u7FD5\u800B\u8052\u8085\u8155\u8154\u814B\u8151\u814E\u8139\u8146\u813E\u814C\u8153\u8174\u8212\u821C\u83E9\u8403\u83F8\u840D\u83E0\u83C5\u840B\u83C1\u83EF\u83F1\u83F4\u8457\u840A\u83F0\u840C\u83CC\u83FD\u83F2\u83CA\u8438\u840E\u8404\u83DC\u8407\u83D4\u83DF\u865B\u86DF\u86D9\u86ED\u86D4\u86DB\u86E4\u86D0\u86DE\u8857\u88C1\u88C2\u88B1\u8983\u8996\u8A3B\u8A60\u8A55\u8A5E\u8A3C\u8A41"],
      ["b640", "\u8A54\u8A5B\u8A50\u8A46\u8A34\u8A3A\u8A36\u8A56\u8C61\u8C82\u8CAF\u8CBC\u8CB3\u8CBD\u8CC1\u8CBB\u8CC0\u8CB4\u8CB7\u8CB6\u8CBF\u8CB8\u8D8A\u8D85\u8D81\u8DCE\u8DDD\u8DCB\u8DDA\u8DD1\u8DCC\u8DDB\u8DC6\u8EFB\u8EF8\u8EFC\u8F9C\u902E\u9035\u9031\u9038\u9032\u9036\u9102\u90F5\u9109\u90FE\u9163\u9165\u91CF\u9214\u9215\u9223\u9209\u921E\u920D\u9210\u9207\u9211\u9594\u958F\u958B\u9591"],
      ["b6a1", "\u9593\u9592\u958E\u968A\u968E\u968B\u967D\u9685\u9686\u968D\u9672\u9684\u96C1\u96C5\u96C4\u96C6\u96C7\u96EF\u96F2\u97CC\u9805\u9806\u9808\u98E7\u98EA\u98EF\u98E9\u98F2\u98ED\u99AE\u99AD\u9EC3\u9ECD\u9ED1\u4E82\u50AD\u50B5\u50B2\u50B3\u50C5\u50BE\u50AC\u50B7\u50BB\u50AF\u50C7\u527F\u5277\u527D\u52DF\u52E6\u52E4\u52E2\u52E3\u532F\u55DF\u55E8\u55D3\u55E6\u55CE\u55DC\u55C7\u55D1\u55E3\u55E4\u55EF\u55DA\u55E1\u55C5\u55C6\u55E5\u55C9\u5712\u5713\u585E\u5851\u5858\u5857\u585A\u5854\u586B\u584C\u586D\u584A\u5862\u5852\u584B\u5967\u5AC1\u5AC9\u5ACC\u5ABE\u5ABD\u5ABC"],
      ["b740", "\u5AB3\u5AC2\u5AB2\u5D69\u5D6F\u5E4C\u5E79\u5EC9\u5EC8\u5F12\u5F59\u5FAC\u5FAE\u611A\u610F\u6148\u611F\u60F3\u611B\u60F9\u6101\u6108\u614E\u614C\u6144\u614D\u613E\u6134\u6127\u610D\u6106\u6137\u6221\u6222\u6413\u643E\u641E\u642A\u642D\u643D\u642C\u640F\u641C\u6414\u640D\u6436\u6416\u6417\u6406\u656C\u659F\u65B0\u6697\u6689\u6687\u6688\u6696\u6684\u6698\u668D\u6703\u6994\u696D"],
      ["b7a1", "\u695A\u6977\u6960\u6954\u6975\u6930\u6982\u694A\u6968\u696B\u695E\u6953\u6979\u6986\u695D\u6963\u695B\u6B47\u6B72\u6BC0\u6BBF\u6BD3\u6BFD\u6EA2\u6EAF\u6ED3\u6EB6\u6EC2\u6E90\u6E9D\u6EC7\u6EC5\u6EA5\u6E98\u6EBC\u6EBA\u6EAB\u6ED1\u6E96\u6E9C\u6EC4\u6ED4\u6EAA\u6EA7\u6EB4\u714E\u7159\u7169\u7164\u7149\u7167\u715C\u716C\u7166\u714C\u7165\u715E\u7146\u7168\u7156\u723A\u7252\u7337\u7345\u733F\u733E\u746F\u745A\u7455\u745F\u745E\u7441\u743F\u7459\u745B\u745C\u7576\u7578\u7600\u75F0\u7601\u75F2\u75F1\u75FA\u75FF\u75F4\u75F3\u76DE\u76DF\u775B\u776B\u7766\u775E\u7763"],
      ["b840", "\u7779\u776A\u776C\u775C\u7765\u7768\u7762\u77EE\u788E\u78B0\u7897\u7898\u788C\u7889\u787C\u7891\u7893\u787F\u797A\u797F\u7981\u842C\u79BD\u7A1C\u7A1A\u7A20\u7A14\u7A1F\u7A1E\u7A9F\u7AA0\u7B77\u7BC0\u7B60\u7B6E\u7B67\u7CB1\u7CB3\u7CB5\u7D93\u7D79\u7D91\u7D81\u7D8F\u7D5B\u7F6E\u7F69\u7F6A\u7F72\u7FA9\u7FA8\u7FA4\u8056\u8058\u8086\u8084\u8171\u8170\u8178\u8165\u816E\u8173\u816B"],
      ["b8a1", "\u8179\u817A\u8166\u8205\u8247\u8482\u8477\u843D\u8431\u8475\u8466\u846B\u8449\u846C\u845B\u843C\u8435\u8461\u8463\u8469\u846D\u8446\u865E\u865C\u865F\u86F9\u8713\u8708\u8707\u8700\u86FE\u86FB\u8702\u8703\u8706\u870A\u8859\u88DF\u88D4\u88D9\u88DC\u88D8\u88DD\u88E1\u88CA\u88D5\u88D2\u899C\u89E3\u8A6B\u8A72\u8A73\u8A66\u8A69\u8A70\u8A87\u8A7C\u8A63\u8AA0\u8A71\u8A85\u8A6D\u8A62\u8A6E\u8A6C\u8A79\u8A7B\u8A3E\u8A68\u8C62\u8C8A\u8C89\u8CCA\u8CC7\u8CC8\u8CC4\u8CB2\u8CC3\u8CC2\u8CC5\u8DE1\u8DDF\u8DE8\u8DEF\u8DF3\u8DFA\u8DEA\u8DE4\u8DE6\u8EB2\u8F03\u8F09\u8EFE\u8F0A"],
      ["b940", "\u8F9F\u8FB2\u904B\u904A\u9053\u9042\u9054\u903C\u9055\u9050\u9047\u904F\u904E\u904D\u9051\u903E\u9041\u9112\u9117\u916C\u916A\u9169\u91C9\u9237\u9257\u9238\u923D\u9240\u923E\u925B\u924B\u9264\u9251\u9234\u9249\u924D\u9245\u9239\u923F\u925A\u9598\u9698\u9694\u9695\u96CD\u96CB\u96C9\u96CA\u96F7\u96FB\u96F9\u96F6\u9756\u9774\u9776\u9810\u9811\u9813\u980A\u9812\u980C\u98FC\u98F4"],
      ["b9a1", "\u98FD\u98FE\u99B3\u99B1\u99B4\u9AE1\u9CE9\u9E82\u9F0E\u9F13\u9F20\u50E7\u50EE\u50E5\u50D6\u50ED\u50DA\u50D5\u50CF\u50D1\u50F1\u50CE\u50E9\u5162\u51F3\u5283\u5282\u5331\u53AD\u55FE\u5600\u561B\u5617\u55FD\u5614\u5606\u5609\u560D\u560E\u55F7\u5616\u561F\u5608\u5610\u55F6\u5718\u5716\u5875\u587E\u5883\u5893\u588A\u5879\u5885\u587D\u58FD\u5925\u5922\u5924\u596A\u5969\u5AE1\u5AE6\u5AE9\u5AD7\u5AD6\u5AD8\u5AE3\u5B75\u5BDE\u5BE7\u5BE1\u5BE5\u5BE6\u5BE8\u5BE2\u5BE4\u5BDF\u5C0D\u5C62\u5D84\u5D87\u5E5B\u5E63\u5E55\u5E57\u5E54\u5ED3\u5ED6\u5F0A\u5F46\u5F70\u5FB9\u6147"],
      ["ba40", "\u613F\u614B\u6177\u6162\u6163\u615F\u615A\u6158\u6175\u622A\u6487\u6458\u6454\u64A4\u6478\u645F\u647A\u6451\u6467\u6434\u646D\u647B\u6572\u65A1\u65D7\u65D6\u66A2\u66A8\u669D\u699C\u69A8\u6995\u69C1\u69AE\u69D3\u69CB\u699B\u69B7\u69BB\u69AB\u69B4\u69D0\u69CD\u69AD\u69CC\u69A6\u69C3\u69A3\u6B49\u6B4C\u6C33\u6F33\u6F14\u6EFE\u6F13\u6EF4\u6F29\u6F3E\u6F20\u6F2C\u6F0F\u6F02\u6F22"],
      ["baa1", "\u6EFF\u6EEF\u6F06\u6F31\u6F38\u6F32\u6F23\u6F15\u6F2B\u6F2F\u6F88\u6F2A\u6EEC\u6F01\u6EF2\u6ECC\u6EF7\u7194\u7199\u717D\u718A\u7184\u7192\u723E\u7292\u7296\u7344\u7350\u7464\u7463\u746A\u7470\u746D\u7504\u7591\u7627\u760D\u760B\u7609\u7613\u76E1\u76E3\u7784\u777D\u777F\u7761\u78C1\u789F\u78A7\u78B3\u78A9\u78A3\u798E\u798F\u798D\u7A2E\u7A31\u7AAA\u7AA9\u7AED\u7AEF\u7BA1\u7B95\u7B8B\u7B75\u7B97\u7B9D\u7B94\u7B8F\u7BB8\u7B87\u7B84\u7CB9\u7CBD\u7CBE\u7DBB\u7DB0\u7D9C\u7DBD\u7DBE\u7DA0\u7DCA\u7DB4\u7DB2\u7DB1\u7DBA\u7DA2\u7DBF\u7DB5\u7DB8\u7DAD\u7DD2\u7DC7\u7DAC"],
      ["bb40", "\u7F70\u7FE0\u7FE1\u7FDF\u805E\u805A\u8087\u8150\u8180\u818F\u8188\u818A\u817F\u8182\u81E7\u81FA\u8207\u8214\u821E\u824B\u84C9\u84BF\u84C6\u84C4\u8499\u849E\u84B2\u849C\u84CB\u84B8\u84C0\u84D3\u8490\u84BC\u84D1\u84CA\u873F\u871C\u873B\u8722\u8725\u8734\u8718\u8755\u8737\u8729\u88F3\u8902\u88F4\u88F9\u88F8\u88FD\u88E8\u891A\u88EF\u8AA6\u8A8C\u8A9E\u8AA3\u8A8D\u8AA1\u8A93\u8AA4"],
      ["bba1", "\u8AAA\u8AA5\u8AA8\u8A98\u8A91\u8A9A\u8AA7\u8C6A\u8C8D\u8C8C\u8CD3\u8CD1\u8CD2\u8D6B\u8D99\u8D95\u8DFC\u8F14\u8F12\u8F15\u8F13\u8FA3\u9060\u9058\u905C\u9063\u9059\u905E\u9062\u905D\u905B\u9119\u9118\u911E\u9175\u9178\u9177\u9174\u9278\u9280\u9285\u9298\u9296\u927B\u9293\u929C\u92A8\u927C\u9291\u95A1\u95A8\u95A9\u95A3\u95A5\u95A4\u9699\u969C\u969B\u96CC\u96D2\u9700\u977C\u9785\u97F6\u9817\u9818\u98AF\u98B1\u9903\u9905\u990C\u9909\u99C1\u9AAF\u9AB0\u9AE6\u9B41\u9B42\u9CF4\u9CF6\u9CF3\u9EBC\u9F3B\u9F4A\u5104\u5100\u50FB\u50F5\u50F9\u5102\u5108\u5109\u5105\u51DC"],
      ["bc40", "\u5287\u5288\u5289\u528D\u528A\u52F0\u53B2\u562E\u563B\u5639\u5632\u563F\u5634\u5629\u5653\u564E\u5657\u5674\u5636\u562F\u5630\u5880\u589F\u589E\u58B3\u589C\u58AE\u58A9\u58A6\u596D\u5B09\u5AFB\u5B0B\u5AF5\u5B0C\u5B08\u5BEE\u5BEC\u5BE9\u5BEB\u5C64\u5C65\u5D9D\u5D94\u5E62\u5E5F\u5E61\u5EE2\u5EDA\u5EDF\u5EDD\u5EE3\u5EE0\u5F48\u5F71\u5FB7\u5FB5\u6176\u6167\u616E\u615D\u6155\u6182"],
      ["bca1", "\u617C\u6170\u616B\u617E\u61A7\u6190\u61AB\u618E\u61AC\u619A\u61A4\u6194\u61AE\u622E\u6469\u646F\u6479\u649E\u64B2\u6488\u6490\u64B0\u64A5\u6493\u6495\u64A9\u6492\u64AE\u64AD\u64AB\u649A\u64AC\u6499\u64A2\u64B3\u6575\u6577\u6578\u66AE\u66AB\u66B4\u66B1\u6A23\u6A1F\u69E8\u6A01\u6A1E\u6A19\u69FD\u6A21\u6A13\u6A0A\u69F3\u6A02\u6A05\u69ED\u6A11\u6B50\u6B4E\u6BA4\u6BC5\u6BC6\u6F3F\u6F7C\u6F84\u6F51\u6F66\u6F54\u6F86\u6F6D\u6F5B\u6F78\u6F6E\u6F8E\u6F7A\u6F70\u6F64\u6F97\u6F58\u6ED5\u6F6F\u6F60\u6F5F\u719F\u71AC\u71B1\u71A8\u7256\u729B\u734E\u7357\u7469\u748B\u7483"],
      ["bd40", "\u747E\u7480\u757F\u7620\u7629\u761F\u7624\u7626\u7621\u7622\u769A\u76BA\u76E4\u778E\u7787\u778C\u7791\u778B\u78CB\u78C5\u78BA\u78CA\u78BE\u78D5\u78BC\u78D0\u7A3F\u7A3C\u7A40\u7A3D\u7A37\u7A3B\u7AAF\u7AAE\u7BAD\u7BB1\u7BC4\u7BB4\u7BC6\u7BC7\u7BC1\u7BA0\u7BCC\u7CCA\u7DE0\u7DF4\u7DEF\u7DFB\u7DD8\u7DEC\u7DDD\u7DE8\u7DE3\u7DDA\u7DDE\u7DE9\u7D9E\u7DD9\u7DF2\u7DF9\u7F75\u7F77\u7FAF"],
      ["bda1", "\u7FE9\u8026\u819B\u819C\u819D\u81A0\u819A\u8198\u8517\u853D\u851A\u84EE\u852C\u852D\u8513\u8511\u8523\u8521\u8514\u84EC\u8525\u84FF\u8506\u8782\u8774\u8776\u8760\u8766\u8778\u8768\u8759\u8757\u874C\u8753\u885B\u885D\u8910\u8907\u8912\u8913\u8915\u890A\u8ABC\u8AD2\u8AC7\u8AC4\u8A95\u8ACB\u8AF8\u8AB2\u8AC9\u8AC2\u8ABF\u8AB0\u8AD6\u8ACD\u8AB6\u8AB9\u8ADB\u8C4C\u8C4E\u8C6C\u8CE0\u8CDE\u8CE6\u8CE4\u8CEC\u8CED\u8CE2\u8CE3\u8CDC\u8CEA\u8CE1\u8D6D\u8D9F\u8DA3\u8E2B\u8E10\u8E1D\u8E22\u8E0F\u8E29\u8E1F\u8E21\u8E1E\u8EBA\u8F1D\u8F1B\u8F1F\u8F29\u8F26\u8F2A\u8F1C\u8F1E"],
      ["be40", "\u8F25\u9069\u906E\u9068\u906D\u9077\u9130\u912D\u9127\u9131\u9187\u9189\u918B\u9183\u92C5\u92BB\u92B7\u92EA\u92AC\u92E4\u92C1\u92B3\u92BC\u92D2\u92C7\u92F0\u92B2\u95AD\u95B1\u9704\u9706\u9707\u9709\u9760\u978D\u978B\u978F\u9821\u982B\u981C\u98B3\u990A\u9913\u9912\u9918\u99DD\u99D0\u99DF\u99DB\u99D1\u99D5\u99D2\u99D9\u9AB7\u9AEE\u9AEF\u9B27\u9B45\u9B44\u9B77\u9B6F\u9D06\u9D09"],
      ["bea1", "\u9D03\u9EA9\u9EBE\u9ECE\u58A8\u9F52\u5112\u5118\u5114\u5110\u5115\u5180\u51AA\u51DD\u5291\u5293\u52F3\u5659\u566B\u5679\u5669\u5664\u5678\u566A\u5668\u5665\u5671\u566F\u566C\u5662\u5676\u58C1\u58BE\u58C7\u58C5\u596E\u5B1D\u5B34\u5B78\u5BF0\u5C0E\u5F4A\u61B2\u6191\u61A9\u618A\u61CD\u61B6\u61BE\u61CA\u61C8\u6230\u64C5\u64C1\u64CB\u64BB\u64BC\u64DA\u64C4\u64C7\u64C2\u64CD\u64BF\u64D2\u64D4\u64BE\u6574\u66C6\u66C9\u66B9\u66C4\u66C7\u66B8\u6A3D\u6A38\u6A3A\u6A59\u6A6B\u6A58\u6A39\u6A44\u6A62\u6A61\u6A4B\u6A47\u6A35\u6A5F\u6A48\u6B59\u6B77\u6C05\u6FC2\u6FB1\u6FA1"],
      ["bf40", "\u6FC3\u6FA4\u6FC1\u6FA7\u6FB3\u6FC0\u6FB9\u6FB6\u6FA6\u6FA0\u6FB4\u71BE\u71C9\u71D0\u71D2\u71C8\u71D5\u71B9\u71CE\u71D9\u71DC\u71C3\u71C4\u7368\u749C\u74A3\u7498\u749F\u749E\u74E2\u750C\u750D\u7634\u7638\u763A\u76E7\u76E5\u77A0\u779E\u779F\u77A5\u78E8\u78DA\u78EC\u78E7\u79A6\u7A4D\u7A4E\u7A46\u7A4C\u7A4B\u7ABA\u7BD9\u7C11\u7BC9\u7BE4\u7BDB\u7BE1\u7BE9\u7BE6\u7CD5\u7CD6\u7E0A"],
      ["bfa1", "\u7E11\u7E08\u7E1B\u7E23\u7E1E\u7E1D\u7E09\u7E10\u7F79\u7FB2\u7FF0\u7FF1\u7FEE\u8028\u81B3\u81A9\u81A8\u81FB\u8208\u8258\u8259\u854A\u8559\u8548\u8568\u8569\u8543\u8549\u856D\u856A\u855E\u8783\u879F\u879E\u87A2\u878D\u8861\u892A\u8932\u8925\u892B\u8921\u89AA\u89A6\u8AE6\u8AFA\u8AEB\u8AF1\u8B00\u8ADC\u8AE7\u8AEE\u8AFE\u8B01\u8B02\u8AF7\u8AED\u8AF3\u8AF6\u8AFC\u8C6B\u8C6D\u8C93\u8CF4\u8E44\u8E31\u8E34\u8E42\u8E39\u8E35\u8F3B\u8F2F\u8F38\u8F33\u8FA8\u8FA6\u9075\u9074\u9078\u9072\u907C\u907A\u9134\u9192\u9320\u9336\u92F8\u9333\u932F\u9322\u92FC\u932B\u9304\u931A"],
      ["c040", "\u9310\u9326\u9321\u9315\u932E\u9319\u95BB\u96A7\u96A8\u96AA\u96D5\u970E\u9711\u9716\u970D\u9713\u970F\u975B\u975C\u9766\u9798\u9830\u9838\u983B\u9837\u982D\u9839\u9824\u9910\u9928\u991E\u991B\u9921\u991A\u99ED\u99E2\u99F1\u9AB8\u9ABC\u9AFB\u9AED\u9B28\u9B91\u9D15\u9D23\u9D26\u9D28\u9D12\u9D1B\u9ED8\u9ED4\u9F8D\u9F9C\u512A\u511F\u5121\u5132\u52F5\u568E\u5680\u5690\u5685\u5687"],
      ["c0a1", "\u568F\u58D5\u58D3\u58D1\u58CE\u5B30\u5B2A\u5B24\u5B7A\u5C37\u5C68\u5DBC\u5DBA\u5DBD\u5DB8\u5E6B\u5F4C\u5FBD\u61C9\u61C2\u61C7\u61E6\u61CB\u6232\u6234\u64CE\u64CA\u64D8\u64E0\u64F0\u64E6\u64EC\u64F1\u64E2\u64ED\u6582\u6583\u66D9\u66D6\u6A80\u6A94\u6A84\u6AA2\u6A9C\u6ADB\u6AA3\u6A7E\u6A97\u6A90\u6AA0\u6B5C\u6BAE\u6BDA\u6C08\u6FD8\u6FF1\u6FDF\u6FE0\u6FDB\u6FE4\u6FEB\u6FEF\u6F80\u6FEC\u6FE1\u6FE9\u6FD5\u6FEE\u6FF0\u71E7\u71DF\u71EE\u71E6\u71E5\u71ED\u71EC\u71F4\u71E0\u7235\u7246\u7370\u7372\u74A9\u74B0\u74A6\u74A8\u7646\u7642\u764C\u76EA\u77B3\u77AA\u77B0\u77AC"],
      ["c140", "\u77A7\u77AD\u77EF\u78F7\u78FA\u78F4\u78EF\u7901\u79A7\u79AA\u7A57\u7ABF\u7C07\u7C0D\u7BFE\u7BF7\u7C0C\u7BE0\u7CE0\u7CDC\u7CDE\u7CE2\u7CDF\u7CD9\u7CDD\u7E2E\u7E3E\u7E46\u7E37\u7E32\u7E43\u7E2B\u7E3D\u7E31\u7E45\u7E41\u7E34\u7E39\u7E48\u7E35\u7E3F\u7E2F\u7F44\u7FF3\u7FFC\u8071\u8072\u8070\u806F\u8073\u81C6\u81C3\u81BA\u81C2\u81C0\u81BF\u81BD\u81C9\u81BE\u81E8\u8209\u8271\u85AA"],
      ["c1a1", "\u8584\u857E\u859C\u8591\u8594\u85AF\u859B\u8587\u85A8\u858A\u8667\u87C0\u87D1\u87B3\u87D2\u87C6\u87AB\u87BB\u87BA\u87C8\u87CB\u893B\u8936\u8944\u8938\u893D\u89AC\u8B0E\u8B17\u8B19\u8B1B\u8B0A\u8B20\u8B1D\u8B04\u8B10\u8C41\u8C3F\u8C73\u8CFA\u8CFD\u8CFC\u8CF8\u8CFB\u8DA8\u8E49\u8E4B\u8E48\u8E4A\u8F44\u8F3E\u8F42\u8F45\u8F3F\u907F\u907D\u9084\u9081\u9082\u9080\u9139\u91A3\u919E\u919C\u934D\u9382\u9328\u9375\u934A\u9365\u934B\u9318\u937E\u936C\u935B\u9370\u935A\u9354\u95CA\u95CB\u95CC\u95C8\u95C6\u96B1\u96B8\u96D6\u971C\u971E\u97A0\u97D3\u9846\u98B6\u9935\u9A01"],
      ["c240", "\u99FF\u9BAE\u9BAB\u9BAA\u9BAD\u9D3B\u9D3F\u9E8B\u9ECF\u9EDE\u9EDC\u9EDD\u9EDB\u9F3E\u9F4B\u53E2\u5695\u56AE\u58D9\u58D8\u5B38\u5F5D\u61E3\u6233\u64F4\u64F2\u64FE\u6506\u64FA\u64FB\u64F7\u65B7\u66DC\u6726\u6AB3\u6AAC\u6AC3\u6ABB\u6AB8\u6AC2\u6AAE\u6AAF\u6B5F\u6B78\u6BAF\u7009\u700B\u6FFE\u7006\u6FFA\u7011\u700F\u71FB\u71FC\u71FE\u71F8\u7377\u7375\u74A7\u74BF\u7515\u7656\u7658"],
      ["c2a1", "\u7652\u77BD\u77BF\u77BB\u77BC\u790E\u79AE\u7A61\u7A62\u7A60\u7AC4\u7AC5\u7C2B\u7C27\u7C2A\u7C1E\u7C23\u7C21\u7CE7\u7E54\u7E55\u7E5E\u7E5A\u7E61\u7E52\u7E59\u7F48\u7FF9\u7FFB\u8077\u8076\u81CD\u81CF\u820A\u85CF\u85A9\u85CD\u85D0\u85C9\u85B0\u85BA\u85B9\u85A6\u87EF\u87EC\u87F2\u87E0\u8986\u89B2\u89F4\u8B28\u8B39\u8B2C\u8B2B\u8C50\u8D05\u8E59\u8E63\u8E66\u8E64\u8E5F\u8E55\u8EC0\u8F49\u8F4D\u9087\u9083\u9088\u91AB\u91AC\u91D0\u9394\u938A\u9396\u93A2\u93B3\u93AE\u93AC\u93B0\u9398\u939A\u9397\u95D4\u95D6\u95D0\u95D5\u96E2\u96DC\u96D9\u96DB\u96DE\u9724\u97A3\u97A6"],
      ["c340", "\u97AD\u97F9\u984D\u984F\u984C\u984E\u9853\u98BA\u993E\u993F\u993D\u992E\u99A5\u9A0E\u9AC1\u9B03\u9B06\u9B4F\u9B4E\u9B4D\u9BCA\u9BC9\u9BFD\u9BC8\u9BC0\u9D51\u9D5D\u9D60\u9EE0\u9F15\u9F2C\u5133\u56A5\u58DE\u58DF\u58E2\u5BF5\u9F90\u5EEC\u61F2\u61F7\u61F6\u61F5\u6500\u650F\u66E0\u66DD\u6AE5\u6ADD\u6ADA\u6AD3\u701B\u701F\u7028\u701A\u701D\u7015\u7018\u7206\u720D\u7258\u72A2\u7378"],
      ["c3a1", "\u737A\u74BD\u74CA\u74E3\u7587\u7586\u765F\u7661\u77C7\u7919\u79B1\u7A6B\u7A69\u7C3E\u7C3F\u7C38\u7C3D\u7C37\u7C40\u7E6B\u7E6D\u7E79\u7E69\u7E6A\u7F85\u7E73\u7FB6\u7FB9\u7FB8\u81D8\u85E9\u85DD\u85EA\u85D5\u85E4\u85E5\u85F7\u87FB\u8805\u880D\u87F9\u87FE\u8960\u895F\u8956\u895E\u8B41\u8B5C\u8B58\u8B49\u8B5A\u8B4E\u8B4F\u8B46\u8B59\u8D08\u8D0A\u8E7C\u8E72\u8E87\u8E76\u8E6C\u8E7A\u8E74\u8F54\u8F4E\u8FAD\u908A\u908B\u91B1\u91AE\u93E1\u93D1\u93DF\u93C3\u93C8\u93DC\u93DD\u93D6\u93E2\u93CD\u93D8\u93E4\u93D7\u93E8\u95DC\u96B4\u96E3\u972A\u9727\u9761\u97DC\u97FB\u985E"],
      ["c440", "\u9858\u985B\u98BC\u9945\u9949\u9A16\u9A19\u9B0D\u9BE8\u9BE7\u9BD6\u9BDB\u9D89\u9D61\u9D72\u9D6A\u9D6C\u9E92\u9E97\u9E93\u9EB4\u52F8\u56A8\u56B7\u56B6\u56B4\u56BC\u58E4\u5B40\u5B43\u5B7D\u5BF6\u5DC9\u61F8\u61FA\u6518\u6514\u6519\u66E6\u6727\u6AEC\u703E\u7030\u7032\u7210\u737B\u74CF\u7662\u7665\u7926\u792A\u792C\u792B\u7AC7\u7AF6\u7C4C\u7C43\u7C4D\u7CEF\u7CF0\u8FAE\u7E7D\u7E7C"],
      ["c4a1", "\u7E82\u7F4C\u8000\u81DA\u8266\u85FB\u85F9\u8611\u85FA\u8606\u860B\u8607\u860A\u8814\u8815\u8964\u89BA\u89F8\u8B70\u8B6C\u8B66\u8B6F\u8B5F\u8B6B\u8D0F\u8D0D\u8E89\u8E81\u8E85\u8E82\u91B4\u91CB\u9418\u9403\u93FD\u95E1\u9730\u98C4\u9952\u9951\u99A8\u9A2B\u9A30\u9A37\u9A35\u9C13\u9C0D\u9E79\u9EB5\u9EE8\u9F2F\u9F5F\u9F63\u9F61\u5137\u5138\u56C1\u56C0\u56C2\u5914\u5C6C\u5DCD\u61FC\u61FE\u651D\u651C\u6595\u66E9\u6AFB\u6B04\u6AFA\u6BB2\u704C\u721B\u72A7\u74D6\u74D4\u7669\u77D3\u7C50\u7E8F\u7E8C\u7FBC\u8617\u862D\u861A\u8823\u8822\u8821\u881F\u896A\u896C\u89BD\u8B74"],
      ["c540", "\u8B77\u8B7D\u8D13\u8E8A\u8E8D\u8E8B\u8F5F\u8FAF\u91BA\u942E\u9433\u9435\u943A\u9438\u9432\u942B\u95E2\u9738\u9739\u9732\u97FF\u9867\u9865\u9957\u9A45\u9A43\u9A40\u9A3E\u9ACF\u9B54\u9B51\u9C2D\u9C25\u9DAF\u9DB4\u9DC2\u9DB8\u9E9D\u9EEF\u9F19\u9F5C\u9F66\u9F67\u513C\u513B\u56C8\u56CA\u56C9\u5B7F\u5DD4\u5DD2\u5F4E\u61FF\u6524\u6B0A\u6B61\u7051\u7058\u7380\u74E4\u758A\u766E\u766C"],
      ["c5a1", "\u79B3\u7C60\u7C5F\u807E\u807D\u81DF\u8972\u896F\u89FC\u8B80\u8D16\u8D17\u8E91\u8E93\u8F61\u9148\u9444\u9451\u9452\u973D\u973E\u97C3\u97C1\u986B\u9955\u9A55\u9A4D\u9AD2\u9B1A\u9C49\u9C31\u9C3E\u9C3B\u9DD3\u9DD7\u9F34\u9F6C\u9F6A\u9F94\u56CC\u5DD6\u6200\u6523\u652B\u652A\u66EC\u6B10\u74DA\u7ACA\u7C64\u7C63\u7C65\u7E93\u7E96\u7E94\u81E2\u8638\u863F\u8831\u8B8A\u9090\u908F\u9463\u9460\u9464\u9768\u986F\u995C\u9A5A\u9A5B\u9A57\u9AD3\u9AD4\u9AD1\u9C54\u9C57\u9C56\u9DE5\u9E9F\u9EF4\u56D1\u58E9\u652C\u705E\u7671\u7672\u77D7\u7F50\u7F88\u8836\u8839\u8862\u8B93\u8B92"],
      ["c640", "\u8B96\u8277\u8D1B\u91C0\u946A\u9742\u9748\u9744\u97C6\u9870\u9A5F\u9B22\u9B58\u9C5F\u9DF9\u9DFA\u9E7C\u9E7D\u9F07\u9F77\u9F72\u5EF3\u6B16\u7063\u7C6C\u7C6E\u883B\u89C0\u8EA1\u91C1\u9472\u9470\u9871\u995E\u9AD6\u9B23\u9ECC\u7064\u77DA\u8B9A\u9477\u97C9\u9A62\u9A65\u7E9C\u8B9C\u8EAA\u91C5\u947D\u947E\u947C\u9C77\u9C78\u9EF7\u8C54\u947F\u9E1A\u7228\u9A6A\u9B31\u9E1B\u9E1E\u7C72"],
      ["c940", "\u4E42\u4E5C\u51F5\u531A\u5382\u4E07\u4E0C\u4E47\u4E8D\u56D7\uFA0C\u5C6E\u5F73\u4E0F\u5187\u4E0E\u4E2E\u4E93\u4EC2\u4EC9\u4EC8\u5198\u52FC\u536C\u53B9\u5720\u5903\u592C\u5C10\u5DFF\u65E1\u6BB3\u6BCC\u6C14\u723F\u4E31\u4E3C\u4EE8\u4EDC\u4EE9\u4EE1\u4EDD\u4EDA\u520C\u531C\u534C\u5722\u5723\u5917\u592F\u5B81\u5B84\u5C12\u5C3B\u5C74\u5C73\u5E04\u5E80\u5E82\u5FC9\u6209\u6250\u6C15"],
      ["c9a1", "\u6C36\u6C43\u6C3F\u6C3B\u72AE\u72B0\u738A\u79B8\u808A\u961E\u4F0E\u4F18\u4F2C\u4EF5\u4F14\u4EF1\u4F00\u4EF7\u4F08\u4F1D\u4F02\u4F05\u4F22\u4F13\u4F04\u4EF4\u4F12\u51B1\u5213\u5209\u5210\u52A6\u5322\u531F\u534D\u538A\u5407\u56E1\u56DF\u572E\u572A\u5734\u593C\u5980\u597C\u5985\u597B\u597E\u5977\u597F\u5B56\u5C15\u5C25\u5C7C\u5C7A\u5C7B\u5C7E\u5DDF\u5E75\u5E84\u5F02\u5F1A\u5F74\u5FD5\u5FD4\u5FCF\u625C\u625E\u6264\u6261\u6266\u6262\u6259\u6260\u625A\u6265\u65EF\u65EE\u673E\u6739\u6738\u673B\u673A\u673F\u673C\u6733\u6C18\u6C46\u6C52\u6C5C\u6C4F\u6C4A\u6C54\u6C4B"],
      ["ca40", "\u6C4C\u7071\u725E\u72B4\u72B5\u738E\u752A\u767F\u7A75\u7F51\u8278\u827C\u8280\u827D\u827F\u864D\u897E\u9099\u9097\u9098\u909B\u9094\u9622\u9624\u9620\u9623\u4F56\u4F3B\u4F62\u4F49\u4F53\u4F64\u4F3E\u4F67\u4F52\u4F5F\u4F41\u4F58\u4F2D\u4F33\u4F3F\u4F61\u518F\u51B9\u521C\u521E\u5221\u52AD\u52AE\u5309\u5363\u5372\u538E\u538F\u5430\u5437\u542A\u5454\u5445\u5419\u541C\u5425\u5418"],
      ["caa1", "\u543D\u544F\u5441\u5428\u5424\u5447\u56EE\u56E7\u56E5\u5741\u5745\u574C\u5749\u574B\u5752\u5906\u5940\u59A6\u5998\u59A0\u5997\u598E\u59A2\u5990\u598F\u59A7\u59A1\u5B8E\u5B92\u5C28\u5C2A\u5C8D\u5C8F\u5C88\u5C8B\u5C89\u5C92\u5C8A\u5C86\u5C93\u5C95\u5DE0\u5E0A\u5E0E\u5E8B\u5E89\u5E8C\u5E88\u5E8D\u5F05\u5F1D\u5F78\u5F76\u5FD2\u5FD1\u5FD0\u5FED\u5FE8\u5FEE\u5FF3\u5FE1\u5FE4\u5FE3\u5FFA\u5FEF\u5FF7\u5FFB\u6000\u5FF4\u623A\u6283\u628C\u628E\u628F\u6294\u6287\u6271\u627B\u627A\u6270\u6281\u6288\u6277\u627D\u6272\u6274\u6537\u65F0\u65F4\u65F3\u65F2\u65F5\u6745\u6747"],
      ["cb40", "\u6759\u6755\u674C\u6748\u675D\u674D\u675A\u674B\u6BD0\u6C19\u6C1A\u6C78\u6C67\u6C6B\u6C84\u6C8B\u6C8F\u6C71\u6C6F\u6C69\u6C9A\u6C6D\u6C87\u6C95\u6C9C\u6C66\u6C73\u6C65\u6C7B\u6C8E\u7074\u707A\u7263\u72BF\u72BD\u72C3\u72C6\u72C1\u72BA\u72C5\u7395\u7397\u7393\u7394\u7392\u753A\u7539\u7594\u7595\u7681\u793D\u8034\u8095\u8099\u8090\u8092\u809C\u8290\u828F\u8285\u828E\u8291\u8293"],
      ["cba1", "\u828A\u8283\u8284\u8C78\u8FC9\u8FBF\u909F\u90A1\u90A5\u909E\u90A7\u90A0\u9630\u9628\u962F\u962D\u4E33\u4F98\u4F7C\u4F85\u4F7D\u4F80\u4F87\u4F76\u4F74\u4F89\u4F84\u4F77\u4F4C\u4F97\u4F6A\u4F9A\u4F79\u4F81\u4F78\u4F90\u4F9C\u4F94\u4F9E\u4F92\u4F82\u4F95\u4F6B\u4F6E\u519E\u51BC\u51BE\u5235\u5232\u5233\u5246\u5231\u52BC\u530A\u530B\u533C\u5392\u5394\u5487\u547F\u5481\u5491\u5482\u5488\u546B\u547A\u547E\u5465\u546C\u5474\u5466\u548D\u546F\u5461\u5460\u5498\u5463\u5467\u5464\u56F7\u56F9\u576F\u5772\u576D\u576B\u5771\u5770\u5776\u5780\u5775\u577B\u5773\u5774\u5762"],
      ["cc40", "\u5768\u577D\u590C\u5945\u59B5\u59BA\u59CF\u59CE\u59B2\u59CC\u59C1\u59B6\u59BC\u59C3\u59D6\u59B1\u59BD\u59C0\u59C8\u59B4\u59C7\u5B62\u5B65\u5B93\u5B95\u5C44\u5C47\u5CAE\u5CA4\u5CA0\u5CB5\u5CAF\u5CA8\u5CAC\u5C9F\u5CA3\u5CAD\u5CA2\u5CAA\u5CA7\u5C9D\u5CA5\u5CB6\u5CB0\u5CA6\u5E17\u5E14\u5E19\u5F28\u5F22\u5F23\u5F24\u5F54\u5F82\u5F7E\u5F7D\u5FDE\u5FE5\u602D\u6026\u6019\u6032\u600B"],
      ["cca1", "\u6034\u600A\u6017\u6033\u601A\u601E\u602C\u6022\u600D\u6010\u602E\u6013\u6011\u600C\u6009\u601C\u6214\u623D\u62AD\u62B4\u62D1\u62BE\u62AA\u62B6\u62CA\u62AE\u62B3\u62AF\u62BB\u62A9\u62B0\u62B8\u653D\u65A8\u65BB\u6609\u65FC\u6604\u6612\u6608\u65FB\u6603\u660B\u660D\u6605\u65FD\u6611\u6610\u66F6\u670A\u6785\u676C\u678E\u6792\u6776\u677B\u6798\u6786\u6784\u6774\u678D\u678C\u677A\u679F\u6791\u6799\u6783\u677D\u6781\u6778\u6779\u6794\u6B25\u6B80\u6B7E\u6BDE\u6C1D\u6C93\u6CEC\u6CEB\u6CEE\u6CD9\u6CB6\u6CD4\u6CAD\u6CE7\u6CB7\u6CD0\u6CC2\u6CBA\u6CC3\u6CC6\u6CED\u6CF2"],
      ["cd40", "\u6CD2\u6CDD\u6CB4\u6C8A\u6C9D\u6C80\u6CDE\u6CC0\u6D30\u6CCD\u6CC7\u6CB0\u6CF9\u6CCF\u6CE9\u6CD1\u7094\u7098\u7085\u7093\u7086\u7084\u7091\u7096\u7082\u709A\u7083\u726A\u72D6\u72CB\u72D8\u72C9\u72DC\u72D2\u72D4\u72DA\u72CC\u72D1\u73A4\u73A1\u73AD\u73A6\u73A2\u73A0\u73AC\u739D\u74DD\u74E8\u753F\u7540\u753E\u758C\u7598\u76AF\u76F3\u76F1\u76F0\u76F5\u77F8\u77FC\u77F9\u77FB\u77FA"],
      ["cda1", "\u77F7\u7942\u793F\u79C5\u7A78\u7A7B\u7AFB\u7C75\u7CFD\u8035\u808F\u80AE\u80A3\u80B8\u80B5\u80AD\u8220\u82A0\u82C0\u82AB\u829A\u8298\u829B\u82B5\u82A7\u82AE\u82BC\u829E\u82BA\u82B4\u82A8\u82A1\u82A9\u82C2\u82A4\u82C3\u82B6\u82A2\u8670\u866F\u866D\u866E\u8C56\u8FD2\u8FCB\u8FD3\u8FCD\u8FD6\u8FD5\u8FD7\u90B2\u90B4\u90AF\u90B3\u90B0\u9639\u963D\u963C\u963A\u9643\u4FCD\u4FC5\u4FD3\u4FB2\u4FC9\u4FCB\u4FC1\u4FD4\u4FDC\u4FD9\u4FBB\u4FB3\u4FDB\u4FC7\u4FD6\u4FBA\u4FC0\u4FB9\u4FEC\u5244\u5249\u52C0\u52C2\u533D\u537C\u5397\u5396\u5399\u5398\u54BA\u54A1\u54AD\u54A5\u54CF"],
      ["ce40", "\u54C3\u830D\u54B7\u54AE\u54D6\u54B6\u54C5\u54C6\u54A0\u5470\u54BC\u54A2\u54BE\u5472\u54DE\u54B0\u57B5\u579E\u579F\u57A4\u578C\u5797\u579D\u579B\u5794\u5798\u578F\u5799\u57A5\u579A\u5795\u58F4\u590D\u5953\u59E1\u59DE\u59EE\u5A00\u59F1\u59DD\u59FA\u59FD\u59FC\u59F6\u59E4\u59F2\u59F7\u59DB\u59E9\u59F3\u59F5\u59E0\u59FE\u59F4\u59ED\u5BA8\u5C4C\u5CD0\u5CD8\u5CCC\u5CD7\u5CCB\u5CDB"],
      ["cea1", "\u5CDE\u5CDA\u5CC9\u5CC7\u5CCA\u5CD6\u5CD3\u5CD4\u5CCF\u5CC8\u5CC6\u5CCE\u5CDF\u5CF8\u5DF9\u5E21\u5E22\u5E23\u5E20\u5E24\u5EB0\u5EA4\u5EA2\u5E9B\u5EA3\u5EA5\u5F07\u5F2E\u5F56\u5F86\u6037\u6039\u6054\u6072\u605E\u6045\u6053\u6047\u6049\u605B\u604C\u6040\u6042\u605F\u6024\u6044\u6058\u6066\u606E\u6242\u6243\u62CF\u630D\u630B\u62F5\u630E\u6303\u62EB\u62F9\u630F\u630C\u62F8\u62F6\u6300\u6313\u6314\u62FA\u6315\u62FB\u62F0\u6541\u6543\u65AA\u65BF\u6636\u6621\u6632\u6635\u661C\u6626\u6622\u6633\u662B\u663A\u661D\u6634\u6639\u662E\u670F\u6710\u67C1\u67F2\u67C8\u67BA"],
      ["cf40", "\u67DC\u67BB\u67F8\u67D8\u67C0\u67B7\u67C5\u67EB\u67E4\u67DF\u67B5\u67CD\u67B3\u67F7\u67F6\u67EE\u67E3\u67C2\u67B9\u67CE\u67E7\u67F0\u67B2\u67FC\u67C6\u67ED\u67CC\u67AE\u67E6\u67DB\u67FA\u67C9\u67CA\u67C3\u67EA\u67CB\u6B28\u6B82\u6B84\u6BB6\u6BD6\u6BD8\u6BE0\u6C20\u6C21\u6D28\u6D34\u6D2D\u6D1F\u6D3C\u6D3F\u6D12\u6D0A\u6CDA\u6D33\u6D04\u6D19\u6D3A\u6D1A\u6D11\u6D00\u6D1D\u6D42"],
      ["cfa1", "\u6D01\u6D18\u6D37\u6D03\u6D0F\u6D40\u6D07\u6D20\u6D2C\u6D08\u6D22\u6D09\u6D10\u70B7\u709F\u70BE\u70B1\u70B0\u70A1\u70B4\u70B5\u70A9\u7241\u7249\u724A\u726C\u7270\u7273\u726E\u72CA\u72E4\u72E8\u72EB\u72DF\u72EA\u72E6\u72E3\u7385\u73CC\u73C2\u73C8\u73C5\u73B9\u73B6\u73B5\u73B4\u73EB\u73BF\u73C7\u73BE\u73C3\u73C6\u73B8\u73CB\u74EC\u74EE\u752E\u7547\u7548\u75A7\u75AA\u7679\u76C4\u7708\u7703\u7704\u7705\u770A\u76F7\u76FB\u76FA\u77E7\u77E8\u7806\u7811\u7812\u7805\u7810\u780F\u780E\u7809\u7803\u7813\u794A\u794C\u794B\u7945\u7944\u79D5\u79CD\u79CF\u79D6\u79CE\u7A80"],
      ["d040", "\u7A7E\u7AD1\u7B00\u7B01\u7C7A\u7C78\u7C79\u7C7F\u7C80\u7C81\u7D03\u7D08\u7D01\u7F58\u7F91\u7F8D\u7FBE\u8007\u800E\u800F\u8014\u8037\u80D8\u80C7\u80E0\u80D1\u80C8\u80C2\u80D0\u80C5\u80E3\u80D9\u80DC\u80CA\u80D5\u80C9\u80CF\u80D7\u80E6\u80CD\u81FF\u8221\u8294\u82D9\u82FE\u82F9\u8307\u82E8\u8300\u82D5\u833A\u82EB\u82D6\u82F4\u82EC\u82E1\u82F2\u82F5\u830C\u82FB\u82F6\u82F0\u82EA"],
      ["d0a1", "\u82E4\u82E0\u82FA\u82F3\u82ED\u8677\u8674\u867C\u8673\u8841\u884E\u8867\u886A\u8869\u89D3\u8A04\u8A07\u8D72\u8FE3\u8FE1\u8FEE\u8FE0\u90F1\u90BD\u90BF\u90D5\u90C5\u90BE\u90C7\u90CB\u90C8\u91D4\u91D3\u9654\u964F\u9651\u9653\u964A\u964E\u501E\u5005\u5007\u5013\u5022\u5030\u501B\u4FF5\u4FF4\u5033\u5037\u502C\u4FF6\u4FF7\u5017\u501C\u5020\u5027\u5035\u502F\u5031\u500E\u515A\u5194\u5193\u51CA\u51C4\u51C5\u51C8\u51CE\u5261\u525A\u5252\u525E\u525F\u5255\u5262\u52CD\u530E\u539E\u5526\u54E2\u5517\u5512\u54E7\u54F3\u54E4\u551A\u54FF\u5504\u5508\u54EB\u5511\u5505\u54F1"],
      ["d140", "\u550A\u54FB\u54F7\u54F8\u54E0\u550E\u5503\u550B\u5701\u5702\u57CC\u5832\u57D5\u57D2\u57BA\u57C6\u57BD\u57BC\u57B8\u57B6\u57BF\u57C7\u57D0\u57B9\u57C1\u590E\u594A\u5A19\u5A16\u5A2D\u5A2E\u5A15\u5A0F\u5A17\u5A0A\u5A1E\u5A33\u5B6C\u5BA7\u5BAD\u5BAC\u5C03\u5C56\u5C54\u5CEC\u5CFF\u5CEE\u5CF1\u5CF7\u5D00\u5CF9\u5E29\u5E28\u5EA8\u5EAE\u5EAA\u5EAC\u5F33\u5F30\u5F67\u605D\u605A\u6067"],
      ["d1a1", "\u6041\u60A2\u6088\u6080\u6092\u6081\u609D\u6083\u6095\u609B\u6097\u6087\u609C\u608E\u6219\u6246\u62F2\u6310\u6356\u632C\u6344\u6345\u6336\u6343\u63E4\u6339\u634B\u634A\u633C\u6329\u6341\u6334\u6358\u6354\u6359\u632D\u6347\u6333\u635A\u6351\u6338\u6357\u6340\u6348\u654A\u6546\u65C6\u65C3\u65C4\u65C2\u664A\u665F\u6647\u6651\u6712\u6713\u681F\u681A\u6849\u6832\u6833\u683B\u684B\u684F\u6816\u6831\u681C\u6835\u682B\u682D\u682F\u684E\u6844\u6834\u681D\u6812\u6814\u6826\u6828\u682E\u684D\u683A\u6825\u6820\u6B2C\u6B2F\u6B2D\u6B31\u6B34\u6B6D\u8082\u6B88\u6BE6\u6BE4"],
      ["d240", "\u6BE8\u6BE3\u6BE2\u6BE7\u6C25\u6D7A\u6D63\u6D64\u6D76\u6D0D\u6D61\u6D92\u6D58\u6D62\u6D6D\u6D6F\u6D91\u6D8D\u6DEF\u6D7F\u6D86\u6D5E\u6D67\u6D60\u6D97\u6D70\u6D7C\u6D5F\u6D82\u6D98\u6D2F\u6D68\u6D8B\u6D7E\u6D80\u6D84\u6D16\u6D83\u6D7B\u6D7D\u6D75\u6D90\u70DC\u70D3\u70D1\u70DD\u70CB\u7F39\u70E2\u70D7\u70D2\u70DE\u70E0\u70D4\u70CD\u70C5\u70C6\u70C7\u70DA\u70CE\u70E1\u7242\u7278"],
      ["d2a1", "\u7277\u7276\u7300\u72FA\u72F4\u72FE\u72F6\u72F3\u72FB\u7301\u73D3\u73D9\u73E5\u73D6\u73BC\u73E7\u73E3\u73E9\u73DC\u73D2\u73DB\u73D4\u73DD\u73DA\u73D7\u73D8\u73E8\u74DE\u74DF\u74F4\u74F5\u7521\u755B\u755F\u75B0\u75C1\u75BB\u75C4\u75C0\u75BF\u75B6\u75BA\u768A\u76C9\u771D\u771B\u7710\u7713\u7712\u7723\u7711\u7715\u7719\u771A\u7722\u7727\u7823\u782C\u7822\u7835\u782F\u7828\u782E\u782B\u7821\u7829\u7833\u782A\u7831\u7954\u795B\u794F\u795C\u7953\u7952\u7951\u79EB\u79EC\u79E0\u79EE\u79ED\u79EA\u79DC\u79DE\u79DD\u7A86\u7A89\u7A85\u7A8B\u7A8C\u7A8A\u7A87\u7AD8\u7B10"],
      ["d340", "\u7B04\u7B13\u7B05\u7B0F\u7B08\u7B0A\u7B0E\u7B09\u7B12\u7C84\u7C91\u7C8A\u7C8C\u7C88\u7C8D\u7C85\u7D1E\u7D1D\u7D11\u7D0E\u7D18\u7D16\u7D13\u7D1F\u7D12\u7D0F\u7D0C\u7F5C\u7F61\u7F5E\u7F60\u7F5D\u7F5B\u7F96\u7F92\u7FC3\u7FC2\u7FC0\u8016\u803E\u8039\u80FA\u80F2\u80F9\u80F5\u8101\u80FB\u8100\u8201\u822F\u8225\u8333\u832D\u8344\u8319\u8351\u8325\u8356\u833F\u8341\u8326\u831C\u8322"],
      ["d3a1", "\u8342\u834E\u831B\u832A\u8308\u833C\u834D\u8316\u8324\u8320\u8337\u832F\u8329\u8347\u8345\u834C\u8353\u831E\u832C\u834B\u8327\u8348\u8653\u8652\u86A2\u86A8\u8696\u868D\u8691\u869E\u8687\u8697\u8686\u868B\u869A\u8685\u86A5\u8699\u86A1\u86A7\u8695\u8698\u868E\u869D\u8690\u8694\u8843\u8844\u886D\u8875\u8876\u8872\u8880\u8871\u887F\u886F\u8883\u887E\u8874\u887C\u8A12\u8C47\u8C57\u8C7B\u8CA4\u8CA3\u8D76\u8D78\u8DB5\u8DB7\u8DB6\u8ED1\u8ED3\u8FFE\u8FF5\u9002\u8FFF\u8FFB\u9004\u8FFC\u8FF6\u90D6\u90E0\u90D9\u90DA\u90E3\u90DF\u90E5\u90D8\u90DB\u90D7\u90DC\u90E4\u9150"],
      ["d440", "\u914E\u914F\u91D5\u91E2\u91DA\u965C\u965F\u96BC\u98E3\u9ADF\u9B2F\u4E7F\u5070\u506A\u5061\u505E\u5060\u5053\u504B\u505D\u5072\u5048\u504D\u5041\u505B\u504A\u5062\u5015\u5045\u505F\u5069\u506B\u5063\u5064\u5046\u5040\u506E\u5073\u5057\u5051\u51D0\u526B\u526D\u526C\u526E\u52D6\u52D3\u532D\u539C\u5575\u5576\u553C\u554D\u5550\u5534\u552A\u5551\u5562\u5536\u5535\u5530\u5552\u5545"],
      ["d4a1", "\u550C\u5532\u5565\u554E\u5539\u5548\u552D\u553B\u5540\u554B\u570A\u5707\u57FB\u5814\u57E2\u57F6\u57DC\u57F4\u5800\u57ED\u57FD\u5808\u57F8\u580B\u57F3\u57CF\u5807\u57EE\u57E3\u57F2\u57E5\u57EC\u57E1\u580E\u57FC\u5810\u57E7\u5801\u580C\u57F1\u57E9\u57F0\u580D\u5804\u595C\u5A60\u5A58\u5A55\u5A67\u5A5E\u5A38\u5A35\u5A6D\u5A50\u5A5F\u5A65\u5A6C\u5A53\u5A64\u5A57\u5A43\u5A5D\u5A52\u5A44\u5A5B\u5A48\u5A8E\u5A3E\u5A4D\u5A39\u5A4C\u5A70\u5A69\u5A47\u5A51\u5A56\u5A42\u5A5C\u5B72\u5B6E\u5BC1\u5BC0\u5C59\u5D1E\u5D0B\u5D1D\u5D1A\u5D20\u5D0C\u5D28\u5D0D\u5D26\u5D25\u5D0F"],
      ["d540", "\u5D30\u5D12\u5D23\u5D1F\u5D2E\u5E3E\u5E34\u5EB1\u5EB4\u5EB9\u5EB2\u5EB3\u5F36\u5F38\u5F9B\u5F96\u5F9F\u608A\u6090\u6086\u60BE\u60B0\u60BA\u60D3\u60D4\u60CF\u60E4\u60D9\u60DD\u60C8\u60B1\u60DB\u60B7\u60CA\u60BF\u60C3\u60CD\u60C0\u6332\u6365\u638A\u6382\u637D\u63BD\u639E\u63AD\u639D\u6397\u63AB\u638E\u636F\u6387\u6390\u636E\u63AF\u6375\u639C\u636D\u63AE\u637C\u63A4\u633B\u639F"],
      ["d5a1", "\u6378\u6385\u6381\u6391\u638D\u6370\u6553\u65CD\u6665\u6661\u665B\u6659\u665C\u6662\u6718\u6879\u6887\u6890\u689C\u686D\u686E\u68AE\u68AB\u6956\u686F\u68A3\u68AC\u68A9\u6875\u6874\u68B2\u688F\u6877\u6892\u687C\u686B\u6872\u68AA\u6880\u6871\u687E\u689B\u6896\u688B\u68A0\u6889\u68A4\u6878\u687B\u6891\u688C\u688A\u687D\u6B36\u6B33\u6B37\u6B38\u6B91\u6B8F\u6B8D\u6B8E\u6B8C\u6C2A\u6DC0\u6DAB\u6DB4\u6DB3\u6E74\u6DAC\u6DE9\u6DE2\u6DB7\u6DF6\u6DD4\u6E00\u6DC8\u6DE0\u6DDF\u6DD6\u6DBE\u6DE5\u6DDC\u6DDD\u6DDB\u6DF4\u6DCA\u6DBD\u6DED\u6DF0\u6DBA\u6DD5\u6DC2\u6DCF\u6DC9"],
      ["d640", "\u6DD0\u6DF2\u6DD3\u6DFD\u6DD7\u6DCD\u6DE3\u6DBB\u70FA\u710D\u70F7\u7117\u70F4\u710C\u70F0\u7104\u70F3\u7110\u70FC\u70FF\u7106\u7113\u7100\u70F8\u70F6\u710B\u7102\u710E\u727E\u727B\u727C\u727F\u731D\u7317\u7307\u7311\u7318\u730A\u7308\u72FF\u730F\u731E\u7388\u73F6\u73F8\u73F5\u7404\u7401\u73FD\u7407\u7400\u73FA\u73FC\u73FF\u740C\u740B\u73F4\u7408\u7564\u7563\u75CE\u75D2\u75CF"],
      ["d6a1", "\u75CB\u75CC\u75D1\u75D0\u768F\u7689\u76D3\u7739\u772F\u772D\u7731\u7732\u7734\u7733\u773D\u7725\u773B\u7735\u7848\u7852\u7849\u784D\u784A\u784C\u7826\u7845\u7850\u7964\u7967\u7969\u796A\u7963\u796B\u7961\u79BB\u79FA\u79F8\u79F6\u79F7\u7A8F\u7A94\u7A90\u7B35\u7B47\u7B34\u7B25\u7B30\u7B22\u7B24\u7B33\u7B18\u7B2A\u7B1D\u7B31\u7B2B\u7B2D\u7B2F\u7B32\u7B38\u7B1A\u7B23\u7C94\u7C98\u7C96\u7CA3\u7D35\u7D3D\u7D38\u7D36\u7D3A\u7D45\u7D2C\u7D29\u7D41\u7D47\u7D3E\u7D3F\u7D4A\u7D3B\u7D28\u7F63\u7F95\u7F9C\u7F9D\u7F9B\u7FCA\u7FCB\u7FCD\u7FD0\u7FD1\u7FC7\u7FCF\u7FC9\u801F"],
      ["d740", "\u801E\u801B\u8047\u8043\u8048\u8118\u8125\u8119\u811B\u812D\u811F\u812C\u811E\u8121\u8115\u8127\u811D\u8122\u8211\u8238\u8233\u823A\u8234\u8232\u8274\u8390\u83A3\u83A8\u838D\u837A\u8373\u83A4\u8374\u838F\u8381\u8395\u8399\u8375\u8394\u83A9\u837D\u8383\u838C\u839D\u839B\u83AA\u838B\u837E\u83A5\u83AF\u8388\u8397\u83B0\u837F\u83A6\u8387\u83AE\u8376\u839A\u8659\u8656\u86BF\u86B7"],
      ["d7a1", "\u86C2\u86C1\u86C5\u86BA\u86B0\u86C8\u86B9\u86B3\u86B8\u86CC\u86B4\u86BB\u86BC\u86C3\u86BD\u86BE\u8852\u8889\u8895\u88A8\u88A2\u88AA\u889A\u8891\u88A1\u889F\u8898\u88A7\u8899\u889B\u8897\u88A4\u88AC\u888C\u8893\u888E\u8982\u89D6\u89D9\u89D5\u8A30\u8A27\u8A2C\u8A1E\u8C39\u8C3B\u8C5C\u8C5D\u8C7D\u8CA5\u8D7D\u8D7B\u8D79\u8DBC\u8DC2\u8DB9\u8DBF\u8DC1\u8ED8\u8EDE\u8EDD\u8EDC\u8ED7\u8EE0\u8EE1\u9024\u900B\u9011\u901C\u900C\u9021\u90EF\u90EA\u90F0\u90F4\u90F2\u90F3\u90D4\u90EB\u90EC\u90E9\u9156\u9158\u915A\u9153\u9155\u91EC\u91F4\u91F1\u91F3\u91F8\u91E4\u91F9\u91EA"],
      ["d840", "\u91EB\u91F7\u91E8\u91EE\u957A\u9586\u9588\u967C\u966D\u966B\u9671\u966F\u96BF\u976A\u9804\u98E5\u9997\u509B\u5095\u5094\u509E\u508B\u50A3\u5083\u508C\u508E\u509D\u5068\u509C\u5092\u5082\u5087\u515F\u51D4\u5312\u5311\u53A4\u53A7\u5591\u55A8\u55A5\u55AD\u5577\u5645\u55A2\u5593\u5588\u558F\u55B5\u5581\u55A3\u5592\u55A4\u557D\u558C\u55A6\u557F\u5595\u55A1\u558E\u570C\u5829\u5837"],
      ["d8a1", "\u5819\u581E\u5827\u5823\u5828\u57F5\u5848\u5825\u581C\u581B\u5833\u583F\u5836\u582E\u5839\u5838\u582D\u582C\u583B\u5961\u5AAF\u5A94\u5A9F\u5A7A\u5AA2\u5A9E\u5A78\u5AA6\u5A7C\u5AA5\u5AAC\u5A95\u5AAE\u5A37\u5A84\u5A8A\u5A97\u5A83\u5A8B\u5AA9\u5A7B\u5A7D\u5A8C\u5A9C\u5A8F\u5A93\u5A9D\u5BEA\u5BCD\u5BCB\u5BD4\u5BD1\u5BCA\u5BCE\u5C0C\u5C30\u5D37\u5D43\u5D6B\u5D41\u5D4B\u5D3F\u5D35\u5D51\u5D4E\u5D55\u5D33\u5D3A\u5D52\u5D3D\u5D31\u5D59\u5D42\u5D39\u5D49\u5D38\u5D3C\u5D32\u5D36\u5D40\u5D45\u5E44\u5E41\u5F58\u5FA6\u5FA5\u5FAB\u60C9\u60B9\u60CC\u60E2\u60CE\u60C4\u6114"],
      ["d940", "\u60F2\u610A\u6116\u6105\u60F5\u6113\u60F8\u60FC\u60FE\u60C1\u6103\u6118\u611D\u6110\u60FF\u6104\u610B\u624A\u6394\u63B1\u63B0\u63CE\u63E5\u63E8\u63EF\u63C3\u649D\u63F3\u63CA\u63E0\u63F6\u63D5\u63F2\u63F5\u6461\u63DF\u63BE\u63DD\u63DC\u63C4\u63D8\u63D3\u63C2\u63C7\u63CC\u63CB\u63C8\u63F0\u63D7\u63D9\u6532\u6567\u656A\u6564\u655C\u6568\u6565\u658C\u659D\u659E\u65AE\u65D0\u65D2"],
      ["d9a1", "\u667C\u666C\u667B\u6680\u6671\u6679\u666A\u6672\u6701\u690C\u68D3\u6904\u68DC\u692A\u68EC\u68EA\u68F1\u690F\u68D6\u68F7\u68EB\u68E4\u68F6\u6913\u6910\u68F3\u68E1\u6907\u68CC\u6908\u6970\u68B4\u6911\u68EF\u68C6\u6914\u68F8\u68D0\u68FD\u68FC\u68E8\u690B\u690A\u6917\u68CE\u68C8\u68DD\u68DE\u68E6\u68F4\u68D1\u6906\u68D4\u68E9\u6915\u6925\u68C7\u6B39\u6B3B\u6B3F\u6B3C\u6B94\u6B97\u6B99\u6B95\u6BBD\u6BF0\u6BF2\u6BF3\u6C30\u6DFC\u6E46\u6E47\u6E1F\u6E49\u6E88\u6E3C\u6E3D\u6E45\u6E62\u6E2B\u6E3F\u6E41\u6E5D\u6E73\u6E1C\u6E33\u6E4B\u6E40\u6E51\u6E3B\u6E03\u6E2E\u6E5E"],
      ["da40", "\u6E68\u6E5C\u6E61\u6E31\u6E28\u6E60\u6E71\u6E6B\u6E39\u6E22\u6E30\u6E53\u6E65\u6E27\u6E78\u6E64\u6E77\u6E55\u6E79\u6E52\u6E66\u6E35\u6E36\u6E5A\u7120\u711E\u712F\u70FB\u712E\u7131\u7123\u7125\u7122\u7132\u711F\u7128\u713A\u711B\u724B\u725A\u7288\u7289\u7286\u7285\u728B\u7312\u730B\u7330\u7322\u7331\u7333\u7327\u7332\u732D\u7326\u7323\u7335\u730C\u742E\u742C\u7430\u742B\u7416"],
      ["daa1", "\u741A\u7421\u742D\u7431\u7424\u7423\u741D\u7429\u7420\u7432\u74FB\u752F\u756F\u756C\u75E7\u75DA\u75E1\u75E6\u75DD\u75DF\u75E4\u75D7\u7695\u7692\u76DA\u7746\u7747\u7744\u774D\u7745\u774A\u774E\u774B\u774C\u77DE\u77EC\u7860\u7864\u7865\u785C\u786D\u7871\u786A\u786E\u7870\u7869\u7868\u785E\u7862\u7974\u7973\u7972\u7970\u7A02\u7A0A\u7A03\u7A0C\u7A04\u7A99\u7AE6\u7AE4\u7B4A\u7B3B\u7B44\u7B48\u7B4C\u7B4E\u7B40\u7B58\u7B45\u7CA2\u7C9E\u7CA8\u7CA1\u7D58\u7D6F\u7D63\u7D53\u7D56\u7D67\u7D6A\u7D4F\u7D6D\u7D5C\u7D6B\u7D52\u7D54\u7D69\u7D51\u7D5F\u7D4E\u7F3E\u7F3F\u7F65"],
      ["db40", "\u7F66\u7FA2\u7FA0\u7FA1\u7FD7\u8051\u804F\u8050\u80FE\u80D4\u8143\u814A\u8152\u814F\u8147\u813D\u814D\u813A\u81E6\u81EE\u81F7\u81F8\u81F9\u8204\u823C\u823D\u823F\u8275\u833B\u83CF\u83F9\u8423\u83C0\u83E8\u8412\u83E7\u83E4\u83FC\u83F6\u8410\u83C6\u83C8\u83EB\u83E3\u83BF\u8401\u83DD\u83E5\u83D8\u83FF\u83E1\u83CB\u83CE\u83D6\u83F5\u83C9\u8409\u840F\u83DE\u8411\u8406\u83C2\u83F3"],
      ["dba1", "\u83D5\u83FA\u83C7\u83D1\u83EA\u8413\u83C3\u83EC\u83EE\u83C4\u83FB\u83D7\u83E2\u841B\u83DB\u83FE\u86D8\u86E2\u86E6\u86D3\u86E3\u86DA\u86EA\u86DD\u86EB\u86DC\u86EC\u86E9\u86D7\u86E8\u86D1\u8848\u8856\u8855\u88BA\u88D7\u88B9\u88B8\u88C0\u88BE\u88B6\u88BC\u88B7\u88BD\u88B2\u8901\u88C9\u8995\u8998\u8997\u89DD\u89DA\u89DB\u8A4E\u8A4D\u8A39\u8A59\u8A40\u8A57\u8A58\u8A44\u8A45\u8A52\u8A48\u8A51\u8A4A\u8A4C\u8A4F\u8C5F\u8C81\u8C80\u8CBA\u8CBE\u8CB0\u8CB9\u8CB5\u8D84\u8D80\u8D89\u8DD8\u8DD3\u8DCD\u8DC7\u8DD6\u8DDC\u8DCF\u8DD5\u8DD9\u8DC8\u8DD7\u8DC5\u8EEF\u8EF7\u8EFA"],
      ["dc40", "\u8EF9\u8EE6\u8EEE\u8EE5\u8EF5\u8EE7\u8EE8\u8EF6\u8EEB\u8EF1\u8EEC\u8EF4\u8EE9\u902D\u9034\u902F\u9106\u912C\u9104\u90FF\u90FC\u9108\u90F9\u90FB\u9101\u9100\u9107\u9105\u9103\u9161\u9164\u915F\u9162\u9160\u9201\u920A\u9225\u9203\u921A\u9226\u920F\u920C\u9200\u9212\u91FF\u91FD\u9206\u9204\u9227\u9202\u921C\u9224\u9219\u9217\u9205\u9216\u957B\u958D\u958C\u9590\u9687\u967E\u9688"],
      ["dca1", "\u9689\u9683\u9680\u96C2\u96C8\u96C3\u96F1\u96F0\u976C\u9770\u976E\u9807\u98A9\u98EB\u9CE6\u9EF9\u4E83\u4E84\u4EB6\u50BD\u50BF\u50C6\u50AE\u50C4\u50CA\u50B4\u50C8\u50C2\u50B0\u50C1\u50BA\u50B1\u50CB\u50C9\u50B6\u50B8\u51D7\u527A\u5278\u527B\u527C\u55C3\u55DB\u55CC\u55D0\u55CB\u55CA\u55DD\u55C0\u55D4\u55C4\u55E9\u55BF\u55D2\u558D\u55CF\u55D5\u55E2\u55D6\u55C8\u55F2\u55CD\u55D9\u55C2\u5714\u5853\u5868\u5864\u584F\u584D\u5849\u586F\u5855\u584E\u585D\u5859\u5865\u585B\u583D\u5863\u5871\u58FC\u5AC7\u5AC4\u5ACB\u5ABA\u5AB8\u5AB1\u5AB5\u5AB0\u5ABF\u5AC8\u5ABB\u5AC6"],
      ["dd40", "\u5AB7\u5AC0\u5ACA\u5AB4\u5AB6\u5ACD\u5AB9\u5A90\u5BD6\u5BD8\u5BD9\u5C1F\u5C33\u5D71\u5D63\u5D4A\u5D65\u5D72\u5D6C\u5D5E\u5D68\u5D67\u5D62\u5DF0\u5E4F\u5E4E\u5E4A\u5E4D\u5E4B\u5EC5\u5ECC\u5EC6\u5ECB\u5EC7\u5F40\u5FAF\u5FAD\u60F7\u6149\u614A\u612B\u6145\u6136\u6132\u612E\u6146\u612F\u614F\u6129\u6140\u6220\u9168\u6223\u6225\u6224\u63C5\u63F1\u63EB\u6410\u6412\u6409\u6420\u6424"],
      ["dda1", "\u6433\u6443\u641F\u6415\u6418\u6439\u6437\u6422\u6423\u640C\u6426\u6430\u6428\u6441\u6435\u642F\u640A\u641A\u6440\u6425\u6427\u640B\u63E7\u641B\u642E\u6421\u640E\u656F\u6592\u65D3\u6686\u668C\u6695\u6690\u668B\u668A\u6699\u6694\u6678\u6720\u6966\u695F\u6938\u694E\u6962\u6971\u693F\u6945\u696A\u6939\u6942\u6957\u6959\u697A\u6948\u6949\u6935\u696C\u6933\u693D\u6965\u68F0\u6978\u6934\u6969\u6940\u696F\u6944\u6976\u6958\u6941\u6974\u694C\u693B\u694B\u6937\u695C\u694F\u6951\u6932\u6952\u692F\u697B\u693C\u6B46\u6B45\u6B43\u6B42\u6B48\u6B41\u6B9B\uFA0D\u6BFB\u6BFC"],
      ["de40", "\u6BF9\u6BF7\u6BF8\u6E9B\u6ED6\u6EC8\u6E8F\u6EC0\u6E9F\u6E93\u6E94\u6EA0\u6EB1\u6EB9\u6EC6\u6ED2\u6EBD\u6EC1\u6E9E\u6EC9\u6EB7\u6EB0\u6ECD\u6EA6\u6ECF\u6EB2\u6EBE\u6EC3\u6EDC\u6ED8\u6E99\u6E92\u6E8E\u6E8D\u6EA4\u6EA1\u6EBF\u6EB3\u6ED0\u6ECA\u6E97\u6EAE\u6EA3\u7147\u7154\u7152\u7163\u7160\u7141\u715D\u7162\u7172\u7178\u716A\u7161\u7142\u7158\u7143\u714B\u7170\u715F\u7150\u7153"],
      ["dea1", "\u7144\u714D\u715A\u724F\u728D\u728C\u7291\u7290\u728E\u733C\u7342\u733B\u733A\u7340\u734A\u7349\u7444\u744A\u744B\u7452\u7451\u7457\u7440\u744F\u7450\u744E\u7442\u7446\u744D\u7454\u74E1\u74FF\u74FE\u74FD\u751D\u7579\u7577\u6983\u75EF\u760F\u7603\u75F7\u75FE\u75FC\u75F9\u75F8\u7610\u75FB\u75F6\u75ED\u75F5\u75FD\u7699\u76B5\u76DD\u7755\u775F\u7760\u7752\u7756\u775A\u7769\u7767\u7754\u7759\u776D\u77E0\u7887\u789A\u7894\u788F\u7884\u7895\u7885\u7886\u78A1\u7883\u7879\u7899\u7880\u7896\u787B\u797C\u7982\u797D\u7979\u7A11\u7A18\u7A19\u7A12\u7A17\u7A15\u7A22\u7A13"],
      ["df40", "\u7A1B\u7A10\u7AA3\u7AA2\u7A9E\u7AEB\u7B66\u7B64\u7B6D\u7B74\u7B69\u7B72\u7B65\u7B73\u7B71\u7B70\u7B61\u7B78\u7B76\u7B63\u7CB2\u7CB4\u7CAF\u7D88\u7D86\u7D80\u7D8D\u7D7F\u7D85\u7D7A\u7D8E\u7D7B\u7D83\u7D7C\u7D8C\u7D94\u7D84\u7D7D\u7D92\u7F6D\u7F6B\u7F67\u7F68\u7F6C\u7FA6\u7FA5\u7FA7\u7FDB\u7FDC\u8021\u8164\u8160\u8177\u815C\u8169\u815B\u8162\u8172\u6721\u815E\u8176\u8167\u816F"],
      ["dfa1", "\u8144\u8161\u821D\u8249\u8244\u8240\u8242\u8245\u84F1\u843F\u8456\u8476\u8479\u848F\u848D\u8465\u8451\u8440\u8486\u8467\u8430\u844D\u847D\u845A\u8459\u8474\u8473\u845D\u8507\u845E\u8437\u843A\u8434\u847A\u8443\u8478\u8432\u8445\u8429\u83D9\u844B\u842F\u8442\u842D\u845F\u8470\u8439\u844E\u844C\u8452\u846F\u84C5\u848E\u843B\u8447\u8436\u8433\u8468\u847E\u8444\u842B\u8460\u8454\u846E\u8450\u870B\u8704\u86F7\u870C\u86FA\u86D6\u86F5\u874D\u86F8\u870E\u8709\u8701\u86F6\u870D\u8705\u88D6\u88CB\u88CD\u88CE\u88DE\u88DB\u88DA\u88CC\u88D0\u8985\u899B\u89DF\u89E5\u89E4"],
      ["e040", "\u89E1\u89E0\u89E2\u89DC\u89E6\u8A76\u8A86\u8A7F\u8A61\u8A3F\u8A77\u8A82\u8A84\u8A75\u8A83\u8A81\u8A74\u8A7A\u8C3C\u8C4B\u8C4A\u8C65\u8C64\u8C66\u8C86\u8C84\u8C85\u8CCC\u8D68\u8D69\u8D91\u8D8C\u8D8E\u8D8F\u8D8D\u8D93\u8D94\u8D90\u8D92\u8DF0\u8DE0\u8DEC\u8DF1\u8DEE\u8DD0\u8DE9\u8DE3\u8DE2\u8DE7\u8DF2\u8DEB\u8DF4\u8F06\u8EFF\u8F01\u8F00\u8F05\u8F07\u8F08\u8F02\u8F0B\u9052\u903F"],
      ["e0a1", "\u9044\u9049\u903D\u9110\u910D\u910F\u9111\u9116\u9114\u910B\u910E\u916E\u916F\u9248\u9252\u9230\u923A\u9266\u9233\u9265\u925E\u9283\u922E\u924A\u9246\u926D\u926C\u924F\u9260\u9267\u926F\u9236\u9261\u9270\u9231\u9254\u9263\u9250\u9272\u924E\u9253\u924C\u9256\u9232\u959F\u959C\u959E\u959B\u9692\u9693\u9691\u9697\u96CE\u96FA\u96FD\u96F8\u96F5\u9773\u9777\u9778\u9772\u980F\u980D\u980E\u98AC\u98F6\u98F9\u99AF\u99B2\u99B0\u99B5\u9AAD\u9AAB\u9B5B\u9CEA\u9CED\u9CE7\u9E80\u9EFD\u50E6\u50D4\u50D7\u50E8\u50F3\u50DB\u50EA\u50DD\u50E4\u50D3\u50EC\u50F0\u50EF\u50E3\u50E0"],
      ["e140", "\u51D8\u5280\u5281\u52E9\u52EB\u5330\u53AC\u5627\u5615\u560C\u5612\u55FC\u560F\u561C\u5601\u5613\u5602\u55FA\u561D\u5604\u55FF\u55F9\u5889\u587C\u5890\u5898\u5886\u5881\u587F\u5874\u588B\u587A\u5887\u5891\u588E\u5876\u5882\u5888\u587B\u5894\u588F\u58FE\u596B\u5ADC\u5AEE\u5AE5\u5AD5\u5AEA\u5ADA\u5AED\u5AEB\u5AF3\u5AE2\u5AE0\u5ADB\u5AEC\u5ADE\u5ADD\u5AD9\u5AE8\u5ADF\u5B77\u5BE0"],
      ["e1a1", "\u5BE3\u5C63\u5D82\u5D80\u5D7D\u5D86\u5D7A\u5D81\u5D77\u5D8A\u5D89\u5D88\u5D7E\u5D7C\u5D8D\u5D79\u5D7F\u5E58\u5E59\u5E53\u5ED8\u5ED1\u5ED7\u5ECE\u5EDC\u5ED5\u5ED9\u5ED2\u5ED4\u5F44\u5F43\u5F6F\u5FB6\u612C\u6128\u6141\u615E\u6171\u6173\u6152\u6153\u6172\u616C\u6180\u6174\u6154\u617A\u615B\u6165\u613B\u616A\u6161\u6156\u6229\u6227\u622B\u642B\u644D\u645B\u645D\u6474\u6476\u6472\u6473\u647D\u6475\u6466\u64A6\u644E\u6482\u645E\u645C\u644B\u6453\u6460\u6450\u647F\u643F\u646C\u646B\u6459\u6465\u6477\u6573\u65A0\u66A1\u66A0\u669F\u6705\u6704\u6722\u69B1\u69B6\u69C9"],
      ["e240", "\u69A0\u69CE\u6996\u69B0\u69AC\u69BC\u6991\u6999\u698E\u69A7\u698D\u69A9\u69BE\u69AF\u69BF\u69C4\u69BD\u69A4\u69D4\u69B9\u69CA\u699A\u69CF\u69B3\u6993\u69AA\u69A1\u699E\u69D9\u6997\u6990\u69C2\u69B5\u69A5\u69C6\u6B4A\u6B4D\u6B4B\u6B9E\u6B9F\u6BA0\u6BC3\u6BC4\u6BFE\u6ECE\u6EF5\u6EF1\u6F03\u6F25\u6EF8\u6F37\u6EFB\u6F2E\u6F09\u6F4E\u6F19\u6F1A\u6F27\u6F18\u6F3B\u6F12\u6EED\u6F0A"],
      ["e2a1", "\u6F36\u6F73\u6EF9\u6EEE\u6F2D\u6F40\u6F30\u6F3C\u6F35\u6EEB\u6F07\u6F0E\u6F43\u6F05\u6EFD\u6EF6\u6F39\u6F1C\u6EFC\u6F3A\u6F1F\u6F0D\u6F1E\u6F08\u6F21\u7187\u7190\u7189\u7180\u7185\u7182\u718F\u717B\u7186\u7181\u7197\u7244\u7253\u7297\u7295\u7293\u7343\u734D\u7351\u734C\u7462\u7473\u7471\u7475\u7472\u7467\u746E\u7500\u7502\u7503\u757D\u7590\u7616\u7608\u760C\u7615\u7611\u760A\u7614\u76B8\u7781\u777C\u7785\u7782\u776E\u7780\u776F\u777E\u7783\u78B2\u78AA\u78B4\u78AD\u78A8\u787E\u78AB\u789E\u78A5\u78A0\u78AC\u78A2\u78A4\u7998\u798A\u798B\u7996\u7995\u7994\u7993"],
      ["e340", "\u7997\u7988\u7992\u7990\u7A2B\u7A4A\u7A30\u7A2F\u7A28\u7A26\u7AA8\u7AAB\u7AAC\u7AEE\u7B88\u7B9C\u7B8A\u7B91\u7B90\u7B96\u7B8D\u7B8C\u7B9B\u7B8E\u7B85\u7B98\u5284\u7B99\u7BA4\u7B82\u7CBB\u7CBF\u7CBC\u7CBA\u7DA7\u7DB7\u7DC2\u7DA3\u7DAA\u7DC1\u7DC0\u7DC5\u7D9D\u7DCE\u7DC4\u7DC6\u7DCB\u7DCC\u7DAF\u7DB9\u7D96\u7DBC\u7D9F\u7DA6\u7DAE\u7DA9\u7DA1\u7DC9\u7F73\u7FE2\u7FE3\u7FE5\u7FDE"],
      ["e3a1", "\u8024\u805D\u805C\u8189\u8186\u8183\u8187\u818D\u818C\u818B\u8215\u8497\u84A4\u84A1\u849F\u84BA\u84CE\u84C2\u84AC\u84AE\u84AB\u84B9\u84B4\u84C1\u84CD\u84AA\u849A\u84B1\u84D0\u849D\u84A7\u84BB\u84A2\u8494\u84C7\u84CC\u849B\u84A9\u84AF\u84A8\u84D6\u8498\u84B6\u84CF\u84A0\u84D7\u84D4\u84D2\u84DB\u84B0\u8491\u8661\u8733\u8723\u8728\u876B\u8740\u872E\u871E\u8721\u8719\u871B\u8743\u872C\u8741\u873E\u8746\u8720\u8732\u872A\u872D\u873C\u8712\u873A\u8731\u8735\u8742\u8726\u8727\u8738\u8724\u871A\u8730\u8711\u88F7\u88E7\u88F1\u88F2\u88FA\u88FE\u88EE\u88FC\u88F6\u88FB"],
      ["e440", "\u88F0\u88EC\u88EB\u899D\u89A1\u899F\u899E\u89E9\u89EB\u89E8\u8AAB\u8A99\u8A8B\u8A92\u8A8F\u8A96\u8C3D\u8C68\u8C69\u8CD5\u8CCF\u8CD7\u8D96\u8E09\u8E02\u8DFF\u8E0D\u8DFD\u8E0A\u8E03\u8E07\u8E06\u8E05\u8DFE\u8E00\u8E04\u8F10\u8F11\u8F0E\u8F0D\u9123\u911C\u9120\u9122\u911F\u911D\u911A\u9124\u9121\u911B\u917A\u9172\u9179\u9173\u92A5\u92A4\u9276\u929B\u927A\u92A0\u9294\u92AA\u928D"],
      ["e4a1", "\u92A6\u929A\u92AB\u9279\u9297\u927F\u92A3\u92EE\u928E\u9282\u9295\u92A2\u927D\u9288\u92A1\u928A\u9286\u928C\u9299\u92A7\u927E\u9287\u92A9\u929D\u928B\u922D\u969E\u96A1\u96FF\u9758\u977D\u977A\u977E\u9783\u9780\u9782\u977B\u9784\u9781\u977F\u97CE\u97CD\u9816\u98AD\u98AE\u9902\u9900\u9907\u999D\u999C\u99C3\u99B9\u99BB\u99BA\u99C2\u99BD\u99C7\u9AB1\u9AE3\u9AE7\u9B3E\u9B3F\u9B60\u9B61\u9B5F\u9CF1\u9CF2\u9CF5\u9EA7\u50FF\u5103\u5130\u50F8\u5106\u5107\u50F6\u50FE\u510B\u510C\u50FD\u510A\u528B\u528C\u52F1\u52EF\u5648\u5642\u564C\u5635\u5641\u564A\u5649\u5646\u5658"],
      ["e540", "\u565A\u5640\u5633\u563D\u562C\u563E\u5638\u562A\u563A\u571A\u58AB\u589D\u58B1\u58A0\u58A3\u58AF\u58AC\u58A5\u58A1\u58FF\u5AFF\u5AF4\u5AFD\u5AF7\u5AF6\u5B03\u5AF8\u5B02\u5AF9\u5B01\u5B07\u5B05\u5B0F\u5C67\u5D99\u5D97\u5D9F\u5D92\u5DA2\u5D93\u5D95\u5DA0\u5D9C\u5DA1\u5D9A\u5D9E\u5E69\u5E5D\u5E60\u5E5C\u7DF3\u5EDB\u5EDE\u5EE1\u5F49\u5FB2\u618B\u6183\u6179\u61B1\u61B0\u61A2\u6189"],
      ["e5a1", "\u619B\u6193\u61AF\u61AD\u619F\u6192\u61AA\u61A1\u618D\u6166\u61B3\u622D\u646E\u6470\u6496\u64A0\u6485\u6497\u649C\u648F\u648B\u648A\u648C\u64A3\u649F\u6468\u64B1\u6498\u6576\u657A\u6579\u657B\u65B2\u65B3\u66B5\u66B0\u66A9\u66B2\u66B7\u66AA\u66AF\u6A00\u6A06\u6A17\u69E5\u69F8\u6A15\u69F1\u69E4\u6A20\u69FF\u69EC\u69E2\u6A1B\u6A1D\u69FE\u6A27\u69F2\u69EE\u6A14\u69F7\u69E7\u6A40\u6A08\u69E6\u69FB\u6A0D\u69FC\u69EB\u6A09\u6A04\u6A18\u6A25\u6A0F\u69F6\u6A26\u6A07\u69F4\u6A16\u6B51\u6BA5\u6BA3\u6BA2\u6BA6\u6C01\u6C00\u6BFF\u6C02\u6F41\u6F26\u6F7E\u6F87\u6FC6\u6F92"],
      ["e640", "\u6F8D\u6F89\u6F8C\u6F62\u6F4F\u6F85\u6F5A\u6F96\u6F76\u6F6C\u6F82\u6F55\u6F72\u6F52\u6F50\u6F57\u6F94\u6F93\u6F5D\u6F00\u6F61\u6F6B\u6F7D\u6F67\u6F90\u6F53\u6F8B\u6F69\u6F7F\u6F95\u6F63\u6F77\u6F6A\u6F7B\u71B2\u71AF\u719B\u71B0\u71A0\u719A\u71A9\u71B5\u719D\u71A5\u719E\u71A4\u71A1\u71AA\u719C\u71A7\u71B3\u7298\u729A\u7358\u7352\u735E\u735F\u7360\u735D\u735B\u7361\u735A\u7359"],
      ["e6a1", "\u7362\u7487\u7489\u748A\u7486\u7481\u747D\u7485\u7488\u747C\u7479\u7508\u7507\u757E\u7625\u761E\u7619\u761D\u761C\u7623\u761A\u7628\u761B\u769C\u769D\u769E\u769B\u778D\u778F\u7789\u7788\u78CD\u78BB\u78CF\u78CC\u78D1\u78CE\u78D4\u78C8\u78C3\u78C4\u78C9\u799A\u79A1\u79A0\u799C\u79A2\u799B\u6B76\u7A39\u7AB2\u7AB4\u7AB3\u7BB7\u7BCB\u7BBE\u7BAC\u7BCE\u7BAF\u7BB9\u7BCA\u7BB5\u7CC5\u7CC8\u7CCC\u7CCB\u7DF7\u7DDB\u7DEA\u7DE7\u7DD7\u7DE1\u7E03\u7DFA\u7DE6\u7DF6\u7DF1\u7DF0\u7DEE\u7DDF\u7F76\u7FAC\u7FB0\u7FAD\u7FED\u7FEB\u7FEA\u7FEC\u7FE6\u7FE8\u8064\u8067\u81A3\u819F"],
      ["e740", "\u819E\u8195\u81A2\u8199\u8197\u8216\u824F\u8253\u8252\u8250\u824E\u8251\u8524\u853B\u850F\u8500\u8529\u850E\u8509\u850D\u851F\u850A\u8527\u851C\u84FB\u852B\u84FA\u8508\u850C\u84F4\u852A\u84F2\u8515\u84F7\u84EB\u84F3\u84FC\u8512\u84EA\u84E9\u8516\u84FE\u8528\u851D\u852E\u8502\u84FD\u851E\u84F6\u8531\u8526\u84E7\u84E8\u84F0\u84EF\u84F9\u8518\u8520\u8530\u850B\u8519\u852F\u8662"],
      ["e7a1", "\u8756\u8763\u8764\u8777\u87E1\u8773\u8758\u8754\u875B\u8752\u8761\u875A\u8751\u875E\u876D\u876A\u8750\u874E\u875F\u875D\u876F\u876C\u877A\u876E\u875C\u8765\u874F\u877B\u8775\u8762\u8767\u8769\u885A\u8905\u890C\u8914\u890B\u8917\u8918\u8919\u8906\u8916\u8911\u890E\u8909\u89A2\u89A4\u89A3\u89ED\u89F0\u89EC\u8ACF\u8AC6\u8AB8\u8AD3\u8AD1\u8AD4\u8AD5\u8ABB\u8AD7\u8ABE\u8AC0\u8AC5\u8AD8\u8AC3\u8ABA\u8ABD\u8AD9\u8C3E\u8C4D\u8C8F\u8CE5\u8CDF\u8CD9\u8CE8\u8CDA\u8CDD\u8CE7\u8DA0\u8D9C\u8DA1\u8D9B\u8E20\u8E23\u8E25\u8E24\u8E2E\u8E15\u8E1B\u8E16\u8E11\u8E19\u8E26\u8E27"],
      ["e840", "\u8E14\u8E12\u8E18\u8E13\u8E1C\u8E17\u8E1A\u8F2C\u8F24\u8F18\u8F1A\u8F20\u8F23\u8F16\u8F17\u9073\u9070\u906F\u9067\u906B\u912F\u912B\u9129\u912A\u9132\u9126\u912E\u9185\u9186\u918A\u9181\u9182\u9184\u9180\u92D0\u92C3\u92C4\u92C0\u92D9\u92B6\u92CF\u92F1\u92DF\u92D8\u92E9\u92D7\u92DD\u92CC\u92EF\u92C2\u92E8\u92CA\u92C8\u92CE\u92E6\u92CD\u92D5\u92C9\u92E0\u92DE\u92E7\u92D1\u92D3"],
      ["e8a1", "\u92B5\u92E1\u92C6\u92B4\u957C\u95AC\u95AB\u95AE\u95B0\u96A4\u96A2\u96D3\u9705\u9708\u9702\u975A\u978A\u978E\u9788\u97D0\u97CF\u981E\u981D\u9826\u9829\u9828\u9820\u981B\u9827\u98B2\u9908\u98FA\u9911\u9914\u9916\u9917\u9915\u99DC\u99CD\u99CF\u99D3\u99D4\u99CE\u99C9\u99D6\u99D8\u99CB\u99D7\u99CC\u9AB3\u9AEC\u9AEB\u9AF3\u9AF2\u9AF1\u9B46\u9B43\u9B67\u9B74\u9B71\u9B66\u9B76\u9B75\u9B70\u9B68\u9B64\u9B6C\u9CFC\u9CFA\u9CFD\u9CFF\u9CF7\u9D07\u9D00\u9CF9\u9CFB\u9D08\u9D05\u9D04\u9E83\u9ED3\u9F0F\u9F10\u511C\u5113\u5117\u511A\u5111\u51DE\u5334\u53E1\u5670\u5660\u566E"],
      ["e940", "\u5673\u5666\u5663\u566D\u5672\u565E\u5677\u571C\u571B\u58C8\u58BD\u58C9\u58BF\u58BA\u58C2\u58BC\u58C6\u5B17\u5B19\u5B1B\u5B21\u5B14\u5B13\u5B10\u5B16\u5B28\u5B1A\u5B20\u5B1E\u5BEF\u5DAC\u5DB1\u5DA9\u5DA7\u5DB5\u5DB0\u5DAE\u5DAA\u5DA8\u5DB2\u5DAD\u5DAF\u5DB4\u5E67\u5E68\u5E66\u5E6F\u5EE9\u5EE7\u5EE6\u5EE8\u5EE5\u5F4B\u5FBC\u619D\u61A8\u6196\u61C5\u61B4\u61C6\u61C1\u61CC\u61BA"],
      ["e9a1", "\u61BF\u61B8\u618C\u64D7\u64D6\u64D0\u64CF\u64C9\u64BD\u6489\u64C3\u64DB\u64F3\u64D9\u6533\u657F\u657C\u65A2\u66C8\u66BE\u66C0\u66CA\u66CB\u66CF\u66BD\u66BB\u66BA\u66CC\u6723\u6A34\u6A66\u6A49\u6A67\u6A32\u6A68\u6A3E\u6A5D\u6A6D\u6A76\u6A5B\u6A51\u6A28\u6A5A\u6A3B\u6A3F\u6A41\u6A6A\u6A64\u6A50\u6A4F\u6A54\u6A6F\u6A69\u6A60\u6A3C\u6A5E\u6A56\u6A55\u6A4D\u6A4E\u6A46\u6B55\u6B54\u6B56\u6BA7\u6BAA\u6BAB\u6BC8\u6BC7\u6C04\u6C03\u6C06\u6FAD\u6FCB\u6FA3\u6FC7\u6FBC\u6FCE\u6FC8\u6F5E\u6FC4\u6FBD\u6F9E\u6FCA\u6FA8\u7004\u6FA5\u6FAE\u6FBA\u6FAC\u6FAA\u6FCF\u6FBF\u6FB8"],
      ["ea40", "\u6FA2\u6FC9\u6FAB\u6FCD\u6FAF\u6FB2\u6FB0\u71C5\u71C2\u71BF\u71B8\u71D6\u71C0\u71C1\u71CB\u71D4\u71CA\u71C7\u71CF\u71BD\u71D8\u71BC\u71C6\u71DA\u71DB\u729D\u729E\u7369\u7366\u7367\u736C\u7365\u736B\u736A\u747F\u749A\u74A0\u7494\u7492\u7495\u74A1\u750B\u7580\u762F\u762D\u7631\u763D\u7633\u763C\u7635\u7632\u7630\u76BB\u76E6\u779A\u779D\u77A1\u779C\u779B\u77A2\u77A3\u7795\u7799"],
      ["eaa1", "\u7797\u78DD\u78E9\u78E5\u78EA\u78DE\u78E3\u78DB\u78E1\u78E2\u78ED\u78DF\u78E0\u79A4\u7A44\u7A48\u7A47\u7AB6\u7AB8\u7AB5\u7AB1\u7AB7\u7BDE\u7BE3\u7BE7\u7BDD\u7BD5\u7BE5\u7BDA\u7BE8\u7BF9\u7BD4\u7BEA\u7BE2\u7BDC\u7BEB\u7BD8\u7BDF\u7CD2\u7CD4\u7CD7\u7CD0\u7CD1\u7E12\u7E21\u7E17\u7E0C\u7E1F\u7E20\u7E13\u7E0E\u7E1C\u7E15\u7E1A\u7E22\u7E0B\u7E0F\u7E16\u7E0D\u7E14\u7E25\u7E24\u7F43\u7F7B\u7F7C\u7F7A\u7FB1\u7FEF\u802A\u8029\u806C\u81B1\u81A6\u81AE\u81B9\u81B5\u81AB\u81B0\u81AC\u81B4\u81B2\u81B7\u81A7\u81F2\u8255\u8256\u8257\u8556\u8545\u856B\u854D\u8553\u8561\u8558"],
      ["eb40", "\u8540\u8546\u8564\u8541\u8562\u8544\u8551\u8547\u8563\u853E\u855B\u8571\u854E\u856E\u8575\u8555\u8567\u8560\u858C\u8566\u855D\u8554\u8565\u856C\u8663\u8665\u8664\u879B\u878F\u8797\u8793\u8792\u8788\u8781\u8796\u8798\u8779\u8787\u87A3\u8785\u8790\u8791\u879D\u8784\u8794\u879C\u879A\u8789\u891E\u8926\u8930\u892D\u892E\u8927\u8931\u8922\u8929\u8923\u892F\u892C\u891F\u89F1\u8AE0"],
      ["eba1", "\u8AE2\u8AF2\u8AF4\u8AF5\u8ADD\u8B14\u8AE4\u8ADF\u8AF0\u8AC8\u8ADE\u8AE1\u8AE8\u8AFF\u8AEF\u8AFB\u8C91\u8C92\u8C90\u8CF5\u8CEE\u8CF1\u8CF0\u8CF3\u8D6C\u8D6E\u8DA5\u8DA7\u8E33\u8E3E\u8E38\u8E40\u8E45\u8E36\u8E3C\u8E3D\u8E41\u8E30\u8E3F\u8EBD\u8F36\u8F2E\u8F35\u8F32\u8F39\u8F37\u8F34\u9076\u9079\u907B\u9086\u90FA\u9133\u9135\u9136\u9193\u9190\u9191\u918D\u918F\u9327\u931E\u9308\u931F\u9306\u930F\u937A\u9338\u933C\u931B\u9323\u9312\u9301\u9346\u932D\u930E\u930D\u92CB\u931D\u92FA\u9325\u9313\u92F9\u92F7\u9334\u9302\u9324\u92FF\u9329\u9339\u9335\u932A\u9314\u930C"],
      ["ec40", "\u930B\u92FE\u9309\u9300\u92FB\u9316\u95BC\u95CD\u95BE\u95B9\u95BA\u95B6\u95BF\u95B5\u95BD\u96A9\u96D4\u970B\u9712\u9710\u9799\u9797\u9794\u97F0\u97F8\u9835\u982F\u9832\u9924\u991F\u9927\u9929\u999E\u99EE\u99EC\u99E5\u99E4\u99F0\u99E3\u99EA\u99E9\u99E7\u9AB9\u9ABF\u9AB4\u9ABB\u9AF6\u9AFA\u9AF9\u9AF7\u9B33\u9B80\u9B85\u9B87\u9B7C\u9B7E\u9B7B\u9B82\u9B93\u9B92\u9B90\u9B7A\u9B95"],
      ["eca1", "\u9B7D\u9B88\u9D25\u9D17\u9D20\u9D1E\u9D14\u9D29\u9D1D\u9D18\u9D22\u9D10\u9D19\u9D1F\u9E88\u9E86\u9E87\u9EAE\u9EAD\u9ED5\u9ED6\u9EFA\u9F12\u9F3D\u5126\u5125\u5122\u5124\u5120\u5129\u52F4\u5693\u568C\u568D\u5686\u5684\u5683\u567E\u5682\u567F\u5681\u58D6\u58D4\u58CF\u58D2\u5B2D\u5B25\u5B32\u5B23\u5B2C\u5B27\u5B26\u5B2F\u5B2E\u5B7B\u5BF1\u5BF2\u5DB7\u5E6C\u5E6A\u5FBE\u5FBB\u61C3\u61B5\u61BC\u61E7\u61E0\u61E5\u61E4\u61E8\u61DE\u64EF\u64E9\u64E3\u64EB\u64E4\u64E8\u6581\u6580\u65B6\u65DA\u66D2\u6A8D\u6A96\u6A81\u6AA5\u6A89\u6A9F\u6A9B\u6AA1\u6A9E\u6A87\u6A93\u6A8E"],
      ["ed40", "\u6A95\u6A83\u6AA8\u6AA4\u6A91\u6A7F\u6AA6\u6A9A\u6A85\u6A8C\u6A92\u6B5B\u6BAD\u6C09\u6FCC\u6FA9\u6FF4\u6FD4\u6FE3\u6FDC\u6FED\u6FE7\u6FE6\u6FDE\u6FF2\u6FDD\u6FE2\u6FE8\u71E1\u71F1\u71E8\u71F2\u71E4\u71F0\u71E2\u7373\u736E\u736F\u7497\u74B2\u74AB\u7490\u74AA\u74AD\u74B1\u74A5\u74AF\u7510\u7511\u7512\u750F\u7584\u7643\u7648\u7649\u7647\u76A4\u76E9\u77B5\u77AB\u77B2\u77B7\u77B6"],
      ["eda1", "\u77B4\u77B1\u77A8\u77F0\u78F3\u78FD\u7902\u78FB\u78FC\u78F2\u7905\u78F9\u78FE\u7904\u79AB\u79A8\u7A5C\u7A5B\u7A56\u7A58\u7A54\u7A5A\u7ABE\u7AC0\u7AC1\u7C05\u7C0F\u7BF2\u7C00\u7BFF\u7BFB\u7C0E\u7BF4\u7C0B\u7BF3\u7C02\u7C09\u7C03\u7C01\u7BF8\u7BFD\u7C06\u7BF0\u7BF1\u7C10\u7C0A\u7CE8\u7E2D\u7E3C\u7E42\u7E33\u9848\u7E38\u7E2A\u7E49\u7E40\u7E47\u7E29\u7E4C\u7E30\u7E3B\u7E36\u7E44\u7E3A\u7F45\u7F7F\u7F7E\u7F7D\u7FF4\u7FF2\u802C\u81BB\u81C4\u81CC\u81CA\u81C5\u81C7\u81BC\u81E9\u825B\u825A\u825C\u8583\u8580\u858F\u85A7\u8595\u85A0\u858B\u85A3\u857B\u85A4\u859A\u859E"],
      ["ee40", "\u8577\u857C\u8589\u85A1\u857A\u8578\u8557\u858E\u8596\u8586\u858D\u8599\u859D\u8581\u85A2\u8582\u8588\u8585\u8579\u8576\u8598\u8590\u859F\u8668\u87BE\u87AA\u87AD\u87C5\u87B0\u87AC\u87B9\u87B5\u87BC\u87AE\u87C9\u87C3\u87C2\u87CC\u87B7\u87AF\u87C4\u87CA\u87B4\u87B6\u87BF\u87B8\u87BD\u87DE\u87B2\u8935\u8933\u893C\u893E\u8941\u8952\u8937\u8942\u89AD\u89AF\u89AE\u89F2\u89F3\u8B1E"],
      ["eea1", "\u8B18\u8B16\u8B11\u8B05\u8B0B\u8B22\u8B0F\u8B12\u8B15\u8B07\u8B0D\u8B08\u8B06\u8B1C\u8B13\u8B1A\u8C4F\u8C70\u8C72\u8C71\u8C6F\u8C95\u8C94\u8CF9\u8D6F\u8E4E\u8E4D\u8E53\u8E50\u8E4C\u8E47\u8F43\u8F40\u9085\u907E\u9138\u919A\u91A2\u919B\u9199\u919F\u91A1\u919D\u91A0\u93A1\u9383\u93AF\u9364\u9356\u9347\u937C\u9358\u935C\u9376\u9349\u9350\u9351\u9360\u936D\u938F\u934C\u936A\u9379\u9357\u9355\u9352\u934F\u9371\u9377\u937B\u9361\u935E\u9363\u9367\u9380\u934E\u9359\u95C7\u95C0\u95C9\u95C3\u95C5\u95B7\u96AE\u96B0\u96AC\u9720\u971F\u9718\u971D\u9719\u979A\u97A1\u979C"],
      ["ef40", "\u979E\u979D\u97D5\u97D4\u97F1\u9841\u9844\u984A\u9849\u9845\u9843\u9925\u992B\u992C\u992A\u9933\u9932\u992F\u992D\u9931\u9930\u9998\u99A3\u99A1\u9A02\u99FA\u99F4\u99F7\u99F9\u99F8\u99F6\u99FB\u99FD\u99FE\u99FC\u9A03\u9ABE\u9AFE\u9AFD\u9B01\u9AFC\u9B48\u9B9A\u9BA8\u9B9E\u9B9B\u9BA6\u9BA1\u9BA5\u9BA4\u9B86\u9BA2\u9BA0\u9BAF\u9D33\u9D41\u9D67\u9D36\u9D2E\u9D2F\u9D31\u9D38\u9D30"],
      ["efa1", "\u9D45\u9D42\u9D43\u9D3E\u9D37\u9D40\u9D3D\u7FF5\u9D2D\u9E8A\u9E89\u9E8D\u9EB0\u9EC8\u9EDA\u9EFB\u9EFF\u9F24\u9F23\u9F22\u9F54\u9FA0\u5131\u512D\u512E\u5698\u569C\u5697\u569A\u569D\u5699\u5970\u5B3C\u5C69\u5C6A\u5DC0\u5E6D\u5E6E\u61D8\u61DF\u61ED\u61EE\u61F1\u61EA\u61F0\u61EB\u61D6\u61E9\u64FF\u6504\u64FD\u64F8\u6501\u6503\u64FC\u6594\u65DB\u66DA\u66DB\u66D8\u6AC5\u6AB9\u6ABD\u6AE1\u6AC6\u6ABA\u6AB6\u6AB7\u6AC7\u6AB4\u6AAD\u6B5E\u6BC9\u6C0B\u7007\u700C\u700D\u7001\u7005\u7014\u700E\u6FFF\u7000\u6FFB\u7026\u6FFC\u6FF7\u700A\u7201\u71FF\u71F9\u7203\u71FD\u7376"],
      ["f040", "\u74B8\u74C0\u74B5\u74C1\u74BE\u74B6\u74BB\u74C2\u7514\u7513\u765C\u7664\u7659\u7650\u7653\u7657\u765A\u76A6\u76BD\u76EC\u77C2\u77BA\u78FF\u790C\u7913\u7914\u7909\u7910\u7912\u7911\u79AD\u79AC\u7A5F\u7C1C\u7C29\u7C19\u7C20\u7C1F\u7C2D\u7C1D\u7C26\u7C28\u7C22\u7C25\u7C30\u7E5C\u7E50\u7E56\u7E63\u7E58\u7E62\u7E5F\u7E51\u7E60\u7E57\u7E53\u7FB5\u7FB3\u7FF7\u7FF8\u8075\u81D1\u81D2"],
      ["f0a1", "\u81D0\u825F\u825E\u85B4\u85C6\u85C0\u85C3\u85C2\u85B3\u85B5\u85BD\u85C7\u85C4\u85BF\u85CB\u85CE\u85C8\u85C5\u85B1\u85B6\u85D2\u8624\u85B8\u85B7\u85BE\u8669\u87E7\u87E6\u87E2\u87DB\u87EB\u87EA\u87E5\u87DF\u87F3\u87E4\u87D4\u87DC\u87D3\u87ED\u87D8\u87E3\u87A4\u87D7\u87D9\u8801\u87F4\u87E8\u87DD\u8953\u894B\u894F\u894C\u8946\u8950\u8951\u8949\u8B2A\u8B27\u8B23\u8B33\u8B30\u8B35\u8B47\u8B2F\u8B3C\u8B3E\u8B31\u8B25\u8B37\u8B26\u8B36\u8B2E\u8B24\u8B3B\u8B3D\u8B3A\u8C42\u8C75\u8C99\u8C98\u8C97\u8CFE\u8D04\u8D02\u8D00\u8E5C\u8E62\u8E60\u8E57\u8E56\u8E5E\u8E65\u8E67"],
      ["f140", "\u8E5B\u8E5A\u8E61\u8E5D\u8E69\u8E54\u8F46\u8F47\u8F48\u8F4B\u9128\u913A\u913B\u913E\u91A8\u91A5\u91A7\u91AF\u91AA\u93B5\u938C\u9392\u93B7\u939B\u939D\u9389\u93A7\u938E\u93AA\u939E\u93A6\u9395\u9388\u9399\u939F\u938D\u93B1\u9391\u93B2\u93A4\u93A8\u93B4\u93A3\u93A5\u95D2\u95D3\u95D1\u96B3\u96D7\u96DA\u5DC2\u96DF\u96D8\u96DD\u9723\u9722\u9725\u97AC\u97AE\u97A8\u97AB\u97A4\u97AA"],
      ["f1a1", "\u97A2\u97A5\u97D7\u97D9\u97D6\u97D8\u97FA\u9850\u9851\u9852\u98B8\u9941\u993C\u993A\u9A0F\u9A0B\u9A09\u9A0D\u9A04\u9A11\u9A0A\u9A05\u9A07\u9A06\u9AC0\u9ADC\u9B08\u9B04\u9B05\u9B29\u9B35\u9B4A\u9B4C\u9B4B\u9BC7\u9BC6\u9BC3\u9BBF\u9BC1\u9BB5\u9BB8\u9BD3\u9BB6\u9BC4\u9BB9\u9BBD\u9D5C\u9D53\u9D4F\u9D4A\u9D5B\u9D4B\u9D59\u9D56\u9D4C\u9D57\u9D52\u9D54\u9D5F\u9D58\u9D5A\u9E8E\u9E8C\u9EDF\u9F01\u9F00\u9F16\u9F25\u9F2B\u9F2A\u9F29\u9F28\u9F4C\u9F55\u5134\u5135\u5296\u52F7\u53B4\u56AB\u56AD\u56A6\u56A7\u56AA\u56AC\u58DA\u58DD\u58DB\u5912\u5B3D\u5B3E\u5B3F\u5DC3\u5E70"],
      ["f240", "\u5FBF\u61FB\u6507\u6510\u650D\u6509\u650C\u650E\u6584\u65DE\u65DD\u66DE\u6AE7\u6AE0\u6ACC\u6AD1\u6AD9\u6ACB\u6ADF\u6ADC\u6AD0\u6AEB\u6ACF\u6ACD\u6ADE\u6B60\u6BB0\u6C0C\u7019\u7027\u7020\u7016\u702B\u7021\u7022\u7023\u7029\u7017\u7024\u701C\u702A\u720C\u720A\u7207\u7202\u7205\u72A5\u72A6\u72A4\u72A3\u72A1\u74CB\u74C5\u74B7\u74C3\u7516\u7660\u77C9\u77CA\u77C4\u77F1\u791D\u791B"],
      ["f2a1", "\u7921\u791C\u7917\u791E\u79B0\u7A67\u7A68\u7C33\u7C3C\u7C39\u7C2C\u7C3B\u7CEC\u7CEA\u7E76\u7E75\u7E78\u7E70\u7E77\u7E6F\u7E7A\u7E72\u7E74\u7E68\u7F4B\u7F4A\u7F83\u7F86\u7FB7\u7FFD\u7FFE\u8078\u81D7\u81D5\u8264\u8261\u8263\u85EB\u85F1\u85ED\u85D9\u85E1\u85E8\u85DA\u85D7\u85EC\u85F2\u85F8\u85D8\u85DF\u85E3\u85DC\u85D1\u85F0\u85E6\u85EF\u85DE\u85E2\u8800\u87FA\u8803\u87F6\u87F7\u8809\u880C\u880B\u8806\u87FC\u8808\u87FF\u880A\u8802\u8962\u895A\u895B\u8957\u8961\u895C\u8958\u895D\u8959\u8988\u89B7\u89B6\u89F6\u8B50\u8B48\u8B4A\u8B40\u8B53\u8B56\u8B54\u8B4B\u8B55"],
      ["f340", "\u8B51\u8B42\u8B52\u8B57\u8C43\u8C77\u8C76\u8C9A\u8D06\u8D07\u8D09\u8DAC\u8DAA\u8DAD\u8DAB\u8E6D\u8E78\u8E73\u8E6A\u8E6F\u8E7B\u8EC2\u8F52\u8F51\u8F4F\u8F50\u8F53\u8FB4\u9140\u913F\u91B0\u91AD\u93DE\u93C7\u93CF\u93C2\u93DA\u93D0\u93F9\u93EC\u93CC\u93D9\u93A9\u93E6\u93CA\u93D4\u93EE\u93E3\u93D5\u93C4\u93CE\u93C0\u93D2\u93E7\u957D\u95DA\u95DB\u96E1\u9729\u972B\u972C\u9728\u9726"],
      ["f3a1", "\u97B3\u97B7\u97B6\u97DD\u97DE\u97DF\u985C\u9859\u985D\u9857\u98BF\u98BD\u98BB\u98BE\u9948\u9947\u9943\u99A6\u99A7\u9A1A\u9A15\u9A25\u9A1D\u9A24\u9A1B\u9A22\u9A20\u9A27\u9A23\u9A1E\u9A1C\u9A14\u9AC2\u9B0B\u9B0A\u9B0E\u9B0C\u9B37\u9BEA\u9BEB\u9BE0\u9BDE\u9BE4\u9BE6\u9BE2\u9BF0\u9BD4\u9BD7\u9BEC\u9BDC\u9BD9\u9BE5\u9BD5\u9BE1\u9BDA\u9D77\u9D81\u9D8A\u9D84\u9D88\u9D71\u9D80\u9D78\u9D86\u9D8B\u9D8C\u9D7D\u9D6B\u9D74\u9D75\u9D70\u9D69\u9D85\u9D73\u9D7B\u9D82\u9D6F\u9D79\u9D7F\u9D87\u9D68\u9E94\u9E91\u9EC0\u9EFC\u9F2D\u9F40\u9F41\u9F4D\u9F56\u9F57\u9F58\u5337\u56B2"],
      ["f440", "\u56B5\u56B3\u58E3\u5B45\u5DC6\u5DC7\u5EEE\u5EEF\u5FC0\u5FC1\u61F9\u6517\u6516\u6515\u6513\u65DF\u66E8\u66E3\u66E4\u6AF3\u6AF0\u6AEA\u6AE8\u6AF9\u6AF1\u6AEE\u6AEF\u703C\u7035\u702F\u7037\u7034\u7031\u7042\u7038\u703F\u703A\u7039\u7040\u703B\u7033\u7041\u7213\u7214\u72A8\u737D\u737C\u74BA\u76AB\u76AA\u76BE\u76ED\u77CC\u77CE\u77CF\u77CD\u77F2\u7925\u7923\u7927\u7928\u7924\u7929"],
      ["f4a1", "\u79B2\u7A6E\u7A6C\u7A6D\u7AF7\u7C49\u7C48\u7C4A\u7C47\u7C45\u7CEE\u7E7B\u7E7E\u7E81\u7E80\u7FBA\u7FFF\u8079\u81DB\u81D9\u820B\u8268\u8269\u8622\u85FF\u8601\u85FE\u861B\u8600\u85F6\u8604\u8609\u8605\u860C\u85FD\u8819\u8810\u8811\u8817\u8813\u8816\u8963\u8966\u89B9\u89F7\u8B60\u8B6A\u8B5D\u8B68\u8B63\u8B65\u8B67\u8B6D\u8DAE\u8E86\u8E88\u8E84\u8F59\u8F56\u8F57\u8F55\u8F58\u8F5A\u908D\u9143\u9141\u91B7\u91B5\u91B2\u91B3\u940B\u9413\u93FB\u9420\u940F\u9414\u93FE\u9415\u9410\u9428\u9419\u940D\u93F5\u9400\u93F7\u9407\u940E\u9416\u9412\u93FA\u9409\u93F8\u940A\u93FF"],
      ["f540", "\u93FC\u940C\u93F6\u9411\u9406\u95DE\u95E0\u95DF\u972E\u972F\u97B9\u97BB\u97FD\u97FE\u9860\u9862\u9863\u985F\u98C1\u98C2\u9950\u994E\u9959\u994C\u994B\u9953\u9A32\u9A34\u9A31\u9A2C\u9A2A\u9A36\u9A29\u9A2E\u9A38\u9A2D\u9AC7\u9ACA\u9AC6\u9B10\u9B12\u9B11\u9C0B\u9C08\u9BF7\u9C05\u9C12\u9BF8\u9C40\u9C07\u9C0E\u9C06\u9C17\u9C14\u9C09\u9D9F\u9D99\u9DA4\u9D9D\u9D92\u9D98\u9D90\u9D9B"],
      ["f5a1", "\u9DA0\u9D94\u9D9C\u9DAA\u9D97\u9DA1\u9D9A\u9DA2\u9DA8\u9D9E\u9DA3\u9DBF\u9DA9\u9D96\u9DA6\u9DA7\u9E99\u9E9B\u9E9A\u9EE5\u9EE4\u9EE7\u9EE6\u9F30\u9F2E\u9F5B\u9F60\u9F5E\u9F5D\u9F59\u9F91\u513A\u5139\u5298\u5297\u56C3\u56BD\u56BE\u5B48\u5B47\u5DCB\u5DCF\u5EF1\u61FD\u651B\u6B02\u6AFC\u6B03\u6AF8\u6B00\u7043\u7044\u704A\u7048\u7049\u7045\u7046\u721D\u721A\u7219\u737E\u7517\u766A\u77D0\u792D\u7931\u792F\u7C54\u7C53\u7CF2\u7E8A\u7E87\u7E88\u7E8B\u7E86\u7E8D\u7F4D\u7FBB\u8030\u81DD\u8618\u862A\u8626\u861F\u8623\u861C\u8619\u8627\u862E\u8621\u8620\u8629\u861E\u8625"],
      ["f640", "\u8829\u881D\u881B\u8820\u8824\u881C\u882B\u884A\u896D\u8969\u896E\u896B\u89FA\u8B79\u8B78\u8B45\u8B7A\u8B7B\u8D10\u8D14\u8DAF\u8E8E\u8E8C\u8F5E\u8F5B\u8F5D\u9146\u9144\u9145\u91B9\u943F\u943B\u9436\u9429\u943D\u943C\u9430\u9439\u942A\u9437\u942C\u9440\u9431\u95E5\u95E4\u95E3\u9735\u973A\u97BF\u97E1\u9864\u98C9\u98C6\u98C0\u9958\u9956\u9A39\u9A3D\u9A46\u9A44\u9A42\u9A41\u9A3A"],
      ["f6a1", "\u9A3F\u9ACD\u9B15\u9B17\u9B18\u9B16\u9B3A\u9B52\u9C2B\u9C1D\u9C1C\u9C2C\u9C23\u9C28\u9C29\u9C24\u9C21\u9DB7\u9DB6\u9DBC\u9DC1\u9DC7\u9DCA\u9DCF\u9DBE\u9DC5\u9DC3\u9DBB\u9DB5\u9DCE\u9DB9\u9DBA\u9DAC\u9DC8\u9DB1\u9DAD\u9DCC\u9DB3\u9DCD\u9DB2\u9E7A\u9E9C\u9EEB\u9EEE\u9EED\u9F1B\u9F18\u9F1A\u9F31\u9F4E\u9F65\u9F64\u9F92\u4EB9\u56C6\u56C5\u56CB\u5971\u5B4B\u5B4C\u5DD5\u5DD1\u5EF2\u6521\u6520\u6526\u6522\u6B0B\u6B08\u6B09\u6C0D\u7055\u7056\u7057\u7052\u721E\u721F\u72A9\u737F\u74D8\u74D5\u74D9\u74D7\u766D\u76AD\u7935\u79B4\u7A70\u7A71\u7C57\u7C5C\u7C59\u7C5B\u7C5A"],
      ["f740", "\u7CF4\u7CF1\u7E91\u7F4F\u7F87\u81DE\u826B\u8634\u8635\u8633\u862C\u8632\u8636\u882C\u8828\u8826\u882A\u8825\u8971\u89BF\u89BE\u89FB\u8B7E\u8B84\u8B82\u8B86\u8B85\u8B7F\u8D15\u8E95\u8E94\u8E9A\u8E92\u8E90\u8E96\u8E97\u8F60\u8F62\u9147\u944C\u9450\u944A\u944B\u944F\u9447\u9445\u9448\u9449\u9446\u973F\u97E3\u986A\u9869\u98CB\u9954\u995B\u9A4E\u9A53\u9A54\u9A4C\u9A4F\u9A48\u9A4A"],
      ["f7a1", "\u9A49\u9A52\u9A50\u9AD0\u9B19\u9B2B\u9B3B\u9B56\u9B55\u9C46\u9C48\u9C3F\u9C44\u9C39\u9C33\u9C41\u9C3C\u9C37\u9C34\u9C32\u9C3D\u9C36\u9DDB\u9DD2\u9DDE\u9DDA\u9DCB\u9DD0\u9DDC\u9DD1\u9DDF\u9DE9\u9DD9\u9DD8\u9DD6\u9DF5\u9DD5\u9DDD\u9EB6\u9EF0\u9F35\u9F33\u9F32\u9F42\u9F6B\u9F95\u9FA2\u513D\u5299\u58E8\u58E7\u5972\u5B4D\u5DD8\u882F\u5F4F\u6201\u6203\u6204\u6529\u6525\u6596\u66EB\u6B11\u6B12\u6B0F\u6BCA\u705B\u705A\u7222\u7382\u7381\u7383\u7670\u77D4\u7C67\u7C66\u7E95\u826C\u863A\u8640\u8639\u863C\u8631\u863B\u863E\u8830\u8832\u882E\u8833\u8976\u8974\u8973\u89FE"],
      ["f840", "\u8B8C\u8B8E\u8B8B\u8B88\u8C45\u8D19\u8E98\u8F64\u8F63\u91BC\u9462\u9455\u945D\u9457\u945E\u97C4\u97C5\u9800\u9A56\u9A59\u9B1E\u9B1F\u9B20\u9C52\u9C58\u9C50\u9C4A\u9C4D\u9C4B\u9C55\u9C59\u9C4C\u9C4E\u9DFB\u9DF7\u9DEF\u9DE3\u9DEB\u9DF8\u9DE4\u9DF6\u9DE1\u9DEE\u9DE6\u9DF2\u9DF0\u9DE2\u9DEC\u9DF4\u9DF3\u9DE8\u9DED\u9EC2\u9ED0\u9EF2\u9EF3\u9F06\u9F1C\u9F38\u9F37\u9F36\u9F43\u9F4F"],
      ["f8a1", "\u9F71\u9F70\u9F6E\u9F6F\u56D3\u56CD\u5B4E\u5C6D\u652D\u66ED\u66EE\u6B13\u705F\u7061\u705D\u7060\u7223\u74DB\u74E5\u77D5\u7938\u79B7\u79B6\u7C6A\u7E97\u7F89\u826D\u8643\u8838\u8837\u8835\u884B\u8B94\u8B95\u8E9E\u8E9F\u8EA0\u8E9D\u91BE\u91BD\u91C2\u946B\u9468\u9469\u96E5\u9746\u9743\u9747\u97C7\u97E5\u9A5E\u9AD5\u9B59\u9C63\u9C67\u9C66\u9C62\u9C5E\u9C60\u9E02\u9DFE\u9E07\u9E03\u9E06\u9E05\u9E00\u9E01\u9E09\u9DFF\u9DFD\u9E04\u9EA0\u9F1E\u9F46\u9F74\u9F75\u9F76\u56D4\u652E\u65B8\u6B18\u6B19\u6B17\u6B1A\u7062\u7226\u72AA\u77D8\u77D9\u7939\u7C69\u7C6B\u7CF6\u7E9A"],
      ["f940", "\u7E98\u7E9B\u7E99\u81E0\u81E1\u8646\u8647\u8648\u8979\u897A\u897C\u897B\u89FF\u8B98\u8B99\u8EA5\u8EA4\u8EA3\u946E\u946D\u946F\u9471\u9473\u9749\u9872\u995F\u9C68\u9C6E\u9C6D\u9E0B\u9E0D\u9E10\u9E0F\u9E12\u9E11\u9EA1\u9EF5\u9F09\u9F47\u9F78\u9F7B\u9F7A\u9F79\u571E\u7066\u7C6F\u883C\u8DB2\u8EA6\u91C3\u9474\u9478\u9476\u9475\u9A60\u9C74\u9C73\u9C71\u9C75\u9E14\u9E13\u9EF6\u9F0A"],
      ["f9a1", "\u9FA4\u7068\u7065\u7CF7\u866A\u883E\u883D\u883F\u8B9E\u8C9C\u8EA9\u8EC9\u974B\u9873\u9874\u98CC\u9961\u99AB\u9A64\u9A66\u9A67\u9B24\u9E15\u9E17\u9F48\u6207\u6B1E\u7227\u864C\u8EA8\u9482\u9480\u9481\u9A69\u9A68\u9B2E\u9E19\u7229\u864B\u8B9F\u9483\u9C79\u9EB7\u7675\u9A6B\u9C7A\u9E1D\u7069\u706A\u9EA4\u9F7E\u9F49\u9F98\u7881\u92B9\u88CF\u58BB\u6052\u7CA7\u5AFA\u2554\u2566\u2557\u2560\u256C\u2563\u255A\u2569\u255D\u2552\u2564\u2555\u255E\u256A\u2561\u2558\u2567\u255B\u2553\u2565\u2556\u255F\u256B\u2562\u2559\u2568\u255C\u2551\u2550\u256D\u256E\u2570\u256F\u2593"]
    ];
  }
});

// ../../../node_modules/encoding/node_modules/iconv-lite/encodings/tables/big5-added.json
var require_big5_added = __commonJS({
  "../../../node_modules/encoding/node_modules/iconv-lite/encodings/tables/big5-added.json"(exports, module2) {
    module2.exports = [
      ["8740", "\u43F0\u4C32\u4603\u45A6\u4578\u{27267}\u4D77\u45B3\u{27CB1}\u4CE2\u{27CC5}\u3B95\u4736\u4744\u4C47\u4C40\u{242BF}\u{23617}\u{27352}\u{26E8B}\u{270D2}\u4C57\u{2A351}\u474F\u45DA\u4C85\u{27C6C}\u4D07\u4AA4\u46A1\u{26B23}\u7225\u{25A54}\u{21A63}\u{23E06}\u{23F61}\u664D\u56FB"],
      ["8767", "\u7D95\u591D\u{28BB9}\u3DF4\u9734\u{27BEF}\u5BDB\u{21D5E}\u5AA4\u3625\u{29EB0}\u5AD1\u5BB7\u5CFC\u676E\u8593\u{29945}\u7461\u749D\u3875\u{21D53}\u{2369E}\u{26021}\u3EEC"],
      ["87a1", "\u{258DE}\u3AF5\u7AFC\u9F97\u{24161}\u{2890D}\u{231EA}\u{20A8A}\u{2325E}\u430A\u8484\u9F96\u942F\u4930\u8613\u5896\u974A\u9218\u79D0\u7A32\u6660\u6A29\u889D\u744C\u7BC5\u6782\u7A2C\u524F\u9046\u34E6\u73C4\u{25DB9}\u74C6\u9FC7\u57B3\u492F\u544C\u4131\u{2368E}\u5818\u7A72\u{27B65}\u8B8F\u46AE\u{26E88}\u4181\u{25D99}\u7BAE\u{224BC}\u9FC8\u{224C1}\u{224C9}\u{224CC}\u9FC9\u8504\u{235BB}\u40B4\u9FCA\u44E1\u{2ADFF}\u62C1\u706E\u9FCB"],
      ["8840", "\u31C0", 4, "\u{2010C}\u31C5\u{200D1}\u{200CD}\u31C6\u31C7\u{200CB}\u{21FE8}\u31C8\u{200CA}\u31C9\u31CA\u31CB\u31CC\u{2010E}\u31CD\u31CE\u0100\xC1\u01CD\xC0\u0112\xC9\u011A\xC8\u014C\xD3\u01D1\xD2\u0FFF\xCA\u0304\u1EBE\u0FFF\xCA\u030C\u1EC0\xCA\u0101\xE1\u01CE\xE0\u0251\u0113\xE9\u011B\xE8\u012B\xED\u01D0\xEC\u014D\xF3\u01D2\xF2\u016B\xFA\u01D4\xF9\u01D6\u01D8\u01DA"],
      ["88a1", "\u01DC\xFC\u0FFF\xEA\u0304\u1EBF\u0FFF\xEA\u030C\u1EC1\xEA\u0261\u23DA\u23DB"],
      ["8940", "\u{2A3A9}\u{21145}"],
      ["8943", "\u650A"],
      ["8946", "\u4E3D\u6EDD\u9D4E\u91DF"],
      ["894c", "\u{27735}\u6491\u4F1A\u4F28\u4FA8\u5156\u5174\u519C\u51E4\u52A1\u52A8\u533B\u534E\u53D1\u53D8\u56E2\u58F0\u5904\u5907\u5932\u5934\u5B66\u5B9E\u5B9F\u5C9A\u5E86\u603B\u6589\u67FE\u6804\u6865\u6D4E\u70BC\u7535\u7EA4\u7EAC\u7EBA\u7EC7\u7ECF\u7EDF\u7F06\u7F37\u827A\u82CF\u836F\u89C6\u8BBE\u8BE2\u8F66\u8F67\u8F6E"],
      ["89a1", "\u7411\u7CFC\u7DCD\u6946\u7AC9\u5227"],
      ["89ab", "\u918C\u78B8\u915E\u80BC"],
      ["89b0", "\u8D0B\u80F6\u{209E7}"],
      ["89b5", "\u809F\u9EC7\u4CCD\u9DC9\u9E0C\u4C3E\u{29DF6}\u{2700E}\u9E0A\u{2A133}\u35C1"],
      ["89c1", "\u6E9A\u823E\u7519"],
      ["89c5", "\u4911\u9A6C\u9A8F\u9F99\u7987\u{2846C}\u{21DCA}\u{205D0}\u{22AE6}\u4E24\u4E81\u4E80\u4E87\u4EBF\u4EEB\u4F37\u344C\u4FBD\u3E48\u5003\u5088\u347D\u3493\u34A5\u5186\u5905\u51DB\u51FC\u5205\u4E89\u5279\u5290\u5327\u35C7\u53A9\u3551\u53B0\u3553\u53C2\u5423\u356D\u3572\u3681\u5493\u54A3\u54B4\u54B9\u54D0\u54EF\u5518\u5523\u5528\u3598\u553F\u35A5\u35BF\u55D7\u35C5"],
      ["8a40", "\u{27D84}\u5525"],
      ["8a43", "\u{20C42}\u{20D15}\u{2512B}\u5590\u{22CC6}\u39EC\u{20341}\u8E46\u{24DB8}\u{294E5}\u4053\u{280BE}\u777A\u{22C38}\u3A34\u47D5\u{2815D}\u{269F2}\u{24DEA}\u64DD\u{20D7C}\u{20FB4}\u{20CD5}\u{210F4}\u648D\u8E7E\u{20E96}\u{20C0B}\u{20F64}\u{22CA9}\u{28256}\u{244D3}"],
      ["8a64", "\u{20D46}\u{29A4D}\u{280E9}\u47F4\u{24EA7}\u{22CC2}\u9AB2\u3A67\u{295F4}\u3FED\u3506\u{252C7}\u{297D4}\u{278C8}\u{22D44}\u9D6E\u9815"],
      ["8a76", "\u43D9\u{260A5}\u64B4\u54E3\u{22D4C}\u{22BCA}\u{21077}\u39FB\u{2106F}"],
      ["8aa1", "\u{266DA}\u{26716}\u{279A0}\u64EA\u{25052}\u{20C43}\u8E68\u{221A1}\u{28B4C}\u{20731}"],
      ["8aac", "\u480B\u{201A9}\u3FFA\u5873\u{22D8D}"],
      ["8ab2", "\u{245C8}\u{204FC}\u{26097}\u{20F4C}\u{20D96}\u5579\u40BB\u43BA"],
      ["8abb", "\u4AB4\u{22A66}\u{2109D}\u81AA\u98F5\u{20D9C}\u6379\u39FE\u{22775}\u8DC0\u56A1\u647C\u3E43"],
      ["8ac9", "\u{2A601}\u{20E09}\u{22ACF}\u{22CC9}"],
      ["8ace", "\u{210C8}\u{239C2}\u3992\u3A06\u{2829B}\u3578\u{25E49}\u{220C7}\u5652\u{20F31}\u{22CB2}\u{29720}\u34BC\u6C3D\u{24E3B}"],
      ["8adf", "\u{27574}\u{22E8B}\u{22208}\u{2A65B}\u{28CCD}\u{20E7A}\u{20C34}\u{2681C}\u7F93\u{210CF}\u{22803}\u{22939}\u35FB\u{251E3}\u{20E8C}\u{20F8D}\u{20EAA}\u3F93\u{20F30}\u{20D47}\u{2114F}\u{20E4C}"],
      ["8af6", "\u{20EAB}\u{20BA9}\u{20D48}\u{210C0}\u{2113D}\u3FF9\u{22696}\u6432\u{20FAD}"],
      ["8b40", "\u{233F4}\u{27639}\u{22BCE}\u{20D7E}\u{20D7F}\u{22C51}\u{22C55}\u3A18\u{20E98}\u{210C7}\u{20F2E}\u{2A632}\u{26B50}\u{28CD2}\u{28D99}\u{28CCA}\u95AA\u54CC\u82C4\u55B9"],
      ["8b55", "\u{29EC3}\u9C26\u9AB6\u{2775E}\u{22DEE}\u7140\u816D\u80EC\u5C1C\u{26572}\u8134\u3797\u535F\u{280BD}\u91B6\u{20EFA}\u{20E0F}\u{20E77}\u{20EFB}\u35DD\u{24DEB}\u3609\u{20CD6}\u56AF\u{227B5}\u{210C9}\u{20E10}\u{20E78}\u{21078}\u{21148}\u{28207}\u{21455}\u{20E79}\u{24E50}\u{22DA4}\u5A54\u{2101D}\u{2101E}\u{210F5}\u{210F6}\u579C\u{20E11}"],
      ["8ba1", "\u{27694}\u{282CD}\u{20FB5}\u{20E7B}\u{2517E}\u3703\u{20FB6}\u{21180}\u{252D8}\u{2A2BD}\u{249DA}\u{2183A}\u{24177}\u{2827C}\u5899\u5268\u361A\u{2573D}\u7BB2\u5B68\u4800\u4B2C\u9F27\u49E7\u9C1F\u9B8D\u{25B74}\u{2313D}\u55FB\u35F2\u5689\u4E28\u5902\u{21BC1}\u{2F878}\u9751\u{20086}\u4E5B\u4EBB\u353E\u5C23\u5F51\u5FC4\u38FA\u624C\u6535\u6B7A\u6C35\u6C3A\u706C\u722B\u4E2C\u72AD\u{248E9}\u7F52\u793B\u7CF9\u7F53\u{2626A}\u34C1"],
      ["8bde", "\u{2634B}\u8002\u8080\u{26612}\u{26951}\u535D\u8864\u89C1\u{278B2}\u8BA0\u8D1D\u9485\u9578\u957F\u95E8\u{28E0F}\u97E6\u9875\u98CE\u98DE\u9963\u{29810}\u9C7C\u9E1F\u9EC4\u6B6F\uF907\u4E37\u{20087}\u961D\u6237\u94A2"],
      ["8c40", "\u503B\u6DFE\u{29C73}\u9FA6\u3DC9\u888F\u{2414E}\u7077\u5CF5\u4B20\u{251CD}\u3559\u{25D30}\u6122\u{28A32}\u8FA7\u91F6\u7191\u6719\u73BA\u{23281}\u{2A107}\u3C8B\u{21980}\u4B10\u78E4\u7402\u51AE\u{2870F}\u4009\u6A63\u{2A2BA}\u4223\u860F\u{20A6F}\u7A2A\u{29947}\u{28AEA}\u9755\u704D\u5324\u{2207E}\u93F4\u76D9\u{289E3}\u9FA7\u77DD\u4EA3\u4FF0\u50BC\u4E2F\u4F17\u9FA8\u5434\u7D8B\u5892\u58D0\u{21DB6}\u5E92\u5E99\u5FC2\u{22712}\u658B"],
      ["8ca1", "\u{233F9}\u6919\u6A43\u{23C63}\u6CFF"],
      ["8ca7", "\u7200\u{24505}\u738C\u3EDB\u{24A13}\u5B15\u74B9\u8B83\u{25CA4}\u{25695}\u7A93\u7BEC\u7CC3\u7E6C\u82F8\u8597\u9FA9\u8890\u9FAA\u8EB9\u9FAB\u8FCF\u855F\u99E0\u9221\u9FAC\u{28DB9}\u{2143F}\u4071\u42A2\u5A1A"],
      ["8cc9", "\u9868\u676B\u4276\u573D"],
      ["8cce", "\u85D6\u{2497B}\u82BF\u{2710D}\u4C81\u{26D74}\u5D7B\u{26B15}\u{26FBE}\u9FAD\u9FAE\u5B96\u9FAF\u66E7\u7E5B\u6E57\u79CA\u3D88\u44C3\u{23256}\u{22796}\u439A\u4536"],
      ["8ce6", "\u5CD5\u{23B1A}\u8AF9\u5C78\u3D12\u{23551}\u5D78\u9FB2\u7157\u4558\u{240EC}\u{21E23}\u4C77\u3978\u344A\u{201A4}\u{26C41}\u8ACC\u4FB4\u{20239}\u59BF\u816C\u9856\u{298FA}\u5F3B"],
      ["8d40", "\u{20B9F}"],
      ["8d42", "\u{221C1}\u{2896D}\u4102\u46BB\u{29079}\u3F07\u9FB3\u{2A1B5}\u40F8\u37D6\u46F7\u{26C46}\u417C\u{286B2}\u{273FF}\u456D\u38D4\u{2549A}\u4561\u451B\u4D89\u4C7B\u4D76\u45EA\u3FC8\u{24B0F}\u3661\u44DE\u44BD\u41ED\u5D3E\u5D48\u5D56\u3DFC\u380F\u5DA4\u5DB9\u3820\u3838\u5E42\u5EBD\u5F25\u5F83\u3908\u3914\u393F\u394D\u60D7\u613D\u5CE5\u3989\u61B7\u61B9\u61CF\u39B8\u622C\u6290\u62E5\u6318\u39F8\u56B1"],
      ["8da1", "\u3A03\u63E2\u63FB\u6407\u645A\u3A4B\u64C0\u5D15\u5621\u9F9F\u3A97\u6586\u3ABD\u65FF\u6653\u3AF2\u6692\u3B22\u6716\u3B42\u67A4\u6800\u3B58\u684A\u6884\u3B72\u3B71\u3B7B\u6909\u6943\u725C\u6964\u699F\u6985\u3BBC\u69D6\u3BDD\u6A65\u6A74\u6A71\u6A82\u3BEC\u6A99\u3BF2\u6AAB\u6AB5\u6AD4\u6AF6\u6B81\u6BC1\u6BEA\u6C75\u6CAA\u3CCB\u6D02\u6D06\u6D26\u6D81\u3CEF\u6DA4\u6DB1\u6E15\u6E18\u6E29\u6E86\u{289C0}\u6EBB\u6EE2\u6EDA\u9F7F\u6EE8\u6EE9\u6F24\u6F34\u3D46\u{23F41}\u6F81\u6FBE\u3D6A\u3D75\u71B7\u5C99\u3D8A\u702C\u3D91\u7050\u7054\u706F\u707F\u7089\u{20325}\u43C1\u35F1\u{20ED8}"],
      ["8e40", "\u{23ED7}\u57BE\u{26ED3}\u713E\u{257E0}\u364E\u69A2\u{28BE9}\u5B74\u7A49\u{258E1}\u{294D9}\u7A65\u7A7D\u{259AC}\u7ABB\u7AB0\u7AC2\u7AC3\u71D1\u{2648D}\u41CA\u7ADA\u7ADD\u7AEA\u41EF\u54B2\u{25C01}\u7B0B\u7B55\u7B29\u{2530E}\u{25CFE}\u7BA2\u7B6F\u839C\u{25BB4}\u{26C7F}\u7BD0\u8421\u7B92\u7BB8\u{25D20}\u3DAD\u{25C65}\u8492\u7BFA\u7C06\u7C35\u{25CC1}\u7C44\u7C83\u{24882}\u7CA6\u667D\u{24578}\u7CC9\u7CC7\u7CE6\u7C74\u7CF3\u7CF5\u7CCE"],
      ["8ea1", "\u7E67\u451D\u{26E44}\u7D5D\u{26ED6}\u748D\u7D89\u7DAB\u7135\u7DB3\u7DD2\u{24057}\u{26029}\u7DE4\u3D13\u7DF5\u{217F9}\u7DE5\u{2836D}\u7E1D\u{26121}\u{2615A}\u7E6E\u7E92\u432B\u946C\u7E27\u7F40\u7F41\u7F47\u7936\u{262D0}\u99E1\u7F97\u{26351}\u7FA3\u{21661}\u{20068}\u455C\u{23766}\u4503\u{2833A}\u7FFA\u{26489}\u8005\u8008\u801D\u8028\u802F\u{2A087}\u{26CC3}\u803B\u803C\u8061\u{22714}\u4989\u{26626}\u{23DE3}\u{266E8}\u6725\u80A7\u{28A48}\u8107\u811A\u58B0\u{226F6}\u6C7F\u{26498}\u{24FB8}\u64E7\u{2148A}\u8218\u{2185E}\u6A53\u{24A65}\u{24A95}\u447A\u8229\u{20B0D}\u{26A52}\u{23D7E}\u4FF9\u{214FD}\u84E2\u8362\u{26B0A}\u{249A7}\u{23530}\u{21773}\u{23DF8}\u82AA\u691B\u{2F994}\u41DB"],
      ["8f40", "\u854B\u82D0\u831A\u{20E16}\u{217B4}\u36C1\u{2317D}\u{2355A}\u827B\u82E2\u8318\u{23E8B}\u{26DA3}\u{26B05}\u{26B97}\u{235CE}\u3DBF\u831D\u55EC\u8385\u450B\u{26DA5}\u83AC\u83C1\u83D3\u347E\u{26ED4}\u6A57\u855A\u3496\u{26E42}\u{22EEF}\u8458\u{25BE4}\u8471\u3DD3\u44E4\u6AA7\u844A\u{23CB5}\u7958\u84A8\u{26B96}\u{26E77}\u{26E43}\u84DE\u840F\u8391\u44A0\u8493\u84E4\u{25C91}\u4240\u{25CC0}\u4543\u8534\u5AF2\u{26E99}\u4527\u8573\u4516\u67BF\u8616"],
      ["8fa1", "\u{28625}\u{2863B}\u85C1\u{27088}\u8602\u{21582}\u{270CD}\u{2F9B2}\u456A\u8628\u3648\u{218A2}\u53F7\u{2739A}\u867E\u8771\u{2A0F8}\u87EE\u{22C27}\u87B1\u87DA\u880F\u5661\u866C\u6856\u460F\u8845\u8846\u{275E0}\u{23DB9}\u{275E4}\u885E\u889C\u465B\u88B4\u88B5\u63C1\u88C5\u7777\u{2770F}\u8987\u898A\u89A6\u89A9\u89A7\u89BC\u{28A25}\u89E7\u{27924}\u{27ABD}\u8A9C\u7793\u91FE\u8A90\u{27A59}\u7AE9\u{27B3A}\u{23F8F}\u4713\u{27B38}\u717C\u8B0C\u8B1F\u{25430}\u{25565}\u8B3F\u8B4C\u8B4D\u8AA9\u{24A7A}\u8B90\u8B9B\u8AAF\u{216DF}\u4615\u884F\u8C9B\u{27D54}\u{27D8F}\u{2F9D4}\u3725\u{27D53}\u8CD6\u{27D98}\u{27DBD}\u8D12\u8D03\u{21910}\u8CDB\u705C\u8D11\u{24CC9}\u3ED0\u8D77"],
      ["9040", "\u8DA9\u{28002}\u{21014}\u{2498A}\u3B7C\u{281BC}\u{2710C}\u7AE7\u8EAD\u8EB6\u8EC3\u92D4\u8F19\u8F2D\u{28365}\u{28412}\u8FA5\u9303\u{2A29F}\u{20A50}\u8FB3\u492A\u{289DE}\u{2853D}\u{23DBB}\u5EF8\u{23262}\u8FF9\u{2A014}\u{286BC}\u{28501}\u{22325}\u3980\u{26ED7}\u9037\u{2853C}\u{27ABE}\u9061\u{2856C}\u{2860B}\u90A8\u{28713}\u90C4\u{286E6}\u90AE\u90FD\u9167\u3AF0\u91A9\u91C4\u7CAC\u{28933}\u{21E89}\u920E\u6C9F\u9241\u9262\u{255B9}\u92B9\u{28AC6}\u{23C9B}\u{28B0C}\u{255DB}"],
      ["90a1", "\u{20D31}\u932C\u936B\u{28AE1}\u{28BEB}\u708F\u5AC3\u{28AE2}\u{28AE5}\u4965\u9244\u{28BEC}\u{28C39}\u{28BFF}\u9373\u945B\u8EBC\u9585\u95A6\u9426\u95A0\u6FF6\u42B9\u{2267A}\u{286D8}\u{2127C}\u{23E2E}\u49DF\u6C1C\u967B\u9696\u416C\u96A3\u{26ED5}\u61DA\u96B6\u78F5\u{28AE0}\u96BD\u53CC\u49A1\u{26CB8}\u{20274}\u{26410}\u{290AF}\u{290E5}\u{24AD1}\u{21915}\u{2330A}\u9731\u8642\u9736\u4A0F\u453D\u4585\u{24AE9}\u7075\u5B41\u971B\u975C\u{291D5}\u9757\u5B4A\u{291EB}\u975F\u9425\u50D0\u{230B7}\u{230BC}\u9789\u979F\u97B1\u97BE\u97C0\u97D2\u97E0\u{2546C}\u97EE\u741C\u{29433}\u97FF\u97F5\u{2941D}\u{2797A}\u4AD1\u9834\u9833\u984B\u9866\u3B0E\u{27175}\u3D51\u{20630}\u{2415C}"],
      ["9140", "\u{25706}\u98CA\u98B7\u98C8\u98C7\u4AFF\u{26D27}\u{216D3}\u55B0\u98E1\u98E6\u98EC\u9378\u9939\u{24A29}\u4B72\u{29857}\u{29905}\u99F5\u9A0C\u9A3B\u9A10\u9A58\u{25725}\u36C4\u{290B1}\u{29BD5}\u9AE0\u9AE2\u{29B05}\u9AF4\u4C0E\u9B14\u9B2D\u{28600}\u5034\u9B34\u{269A8}\u38C3\u{2307D}\u9B50\u9B40\u{29D3E}\u5A45\u{21863}\u9B8E\u{2424B}\u9C02\u9BFF\u9C0C\u{29E68}\u9DD4\u{29FB7}\u{2A192}\u{2A1AB}\u{2A0E1}\u{2A123}\u{2A1DF}\u9D7E\u9D83\u{2A134}\u9E0E\u6888"],
      ["91a1", "\u9DC4\u{2215B}\u{2A193}\u{2A220}\u{2193B}\u{2A233}\u9D39\u{2A0B9}\u{2A2B4}\u9E90\u9E95\u9E9E\u9EA2\u4D34\u9EAA\u9EAF\u{24364}\u9EC1\u3B60\u39E5\u3D1D\u4F32\u37BE\u{28C2B}\u9F02\u9F08\u4B96\u9424\u{26DA2}\u9F17\u9F16\u9F39\u569F\u568A\u9F45\u99B8\u{2908B}\u97F2\u847F\u9F62\u9F69\u7ADC\u9F8E\u7216\u4BBE\u{24975}\u{249BB}\u7177\u{249F8}\u{24348}\u{24A51}\u739E\u{28BDA}\u{218FA}\u799F\u{2897E}\u{28E36}\u9369\u93F3\u{28A44}\u92EC\u9381\u93CB\u{2896C}\u{244B9}\u7217\u3EEB\u7772\u7A43\u70D0\u{24473}\u{243F8}\u717E\u{217EF}\u70A3\u{218BE}\u{23599}\u3EC7\u{21885}\u{2542F}\u{217F8}\u3722\u{216FB}\u{21839}\u36E1\u{21774}\u{218D1}\u{25F4B}\u3723\u{216C0}\u575B\u{24A25}\u{213FE}\u{212A8}"],
      ["9240", "\u{213C6}\u{214B6}\u8503\u{236A6}\u8503\u8455\u{24994}\u{27165}\u{23E31}\u{2555C}\u{23EFB}\u{27052}\u44F4\u{236EE}\u{2999D}\u{26F26}\u67F9\u3733\u3C15\u3DE7\u586C\u{21922}\u6810\u4057\u{2373F}\u{240E1}\u{2408B}\u{2410F}\u{26C21}\u54CB\u569E\u{266B1}\u5692\u{20FDF}\u{20BA8}\u{20E0D}\u93C6\u{28B13}\u939C\u4EF8\u512B\u3819\u{24436}\u4EBC\u{20465}\u{2037F}\u4F4B\u4F8A\u{25651}\u5A68\u{201AB}\u{203CB}\u3999\u{2030A}\u{20414}\u3435\u4F29\u{202C0}\u{28EB3}\u{20275}\u8ADA\u{2020C}\u4E98"],
      ["92a1", "\u50CD\u510D\u4FA2\u4F03\u{24A0E}\u{23E8A}\u4F42\u502E\u506C\u5081\u4FCC\u4FE5\u5058\u50FC\u5159\u515B\u515D\u515E\u6E76\u{23595}\u{23E39}\u{23EBF}\u6D72\u{21884}\u{23E89}\u51A8\u51C3\u{205E0}\u44DD\u{204A3}\u{20492}\u{20491}\u8D7A\u{28A9C}\u{2070E}\u5259\u52A4\u{20873}\u52E1\u936E\u467A\u718C\u{2438C}\u{20C20}\u{249AC}\u{210E4}\u69D1\u{20E1D}\u7479\u3EDE\u7499\u7414\u7456\u7398\u4B8E\u{24ABC}\u{2408D}\u53D0\u3584\u720F\u{240C9}\u55B4\u{20345}\u54CD\u{20BC6}\u571D\u925D\u96F4\u9366\u57DD\u578D\u577F\u363E\u58CB\u5A99\u{28A46}\u{216FA}\u{2176F}\u{21710}\u5A2C\u59B8\u928F\u5A7E\u5ACF\u5A12\u{25946}\u{219F3}\u{21861}\u{24295}\u36F5\u6D05\u7443\u5A21\u{25E83}"],
      ["9340", "\u5A81\u{28BD7}\u{20413}\u93E0\u748C\u{21303}\u7105\u4972\u9408\u{289FB}\u93BD\u37A0\u5C1E\u5C9E\u5E5E\u5E48\u{21996}\u{2197C}\u{23AEE}\u5ECD\u5B4F\u{21903}\u{21904}\u3701\u{218A0}\u36DD\u{216FE}\u36D3\u812A\u{28A47}\u{21DBA}\u{23472}\u{289A8}\u5F0C\u5F0E\u{21927}\u{217AB}\u5A6B\u{2173B}\u5B44\u8614\u{275FD}\u8860\u607E\u{22860}\u{2262B}\u5FDB\u3EB8\u{225AF}\u{225BE}\u{29088}\u{26F73}\u61C0\u{2003E}\u{20046}\u{2261B}\u6199\u6198\u6075\u{22C9B}\u{22D07}\u{246D4}\u{2914D}"],
      ["93a1", "\u6471\u{24665}\u{22B6A}\u3A29\u{22B22}\u{23450}\u{298EA}\u{22E78}\u6337\u{2A45B}\u64B6\u6331\u63D1\u{249E3}\u{22D67}\u62A4\u{22CA1}\u643B\u656B\u6972\u3BF4\u{2308E}\u{232AD}\u{24989}\u{232AB}\u550D\u{232E0}\u{218D9}\u{2943F}\u66CE\u{23289}\u{231B3}\u3AE0\u4190\u{25584}\u{28B22}\u{2558F}\u{216FC}\u{2555B}\u{25425}\u78EE\u{23103}\u{2182A}\u{23234}\u3464\u{2320F}\u{23182}\u{242C9}\u668E\u{26D24}\u666B\u4B93\u6630\u{27870}\u{21DEB}\u6663\u{232D2}\u{232E1}\u661E\u{25872}\u38D1\u{2383A}\u{237BC}\u3B99\u{237A2}\u{233FE}\u74D0\u3B96\u678F\u{2462A}\u68B6\u681E\u3BC4\u6ABE\u3863\u{237D5}\u{24487}\u6A33\u6A52\u6AC9\u6B05\u{21912}\u6511\u6898\u6A4C\u3BD7\u6A7A\u6B57\u{23FC0}\u{23C9A}\u93A0\u92F2\u{28BEA}\u{28ACB}"],
      ["9440", "\u9289\u{2801E}\u{289DC}\u9467\u6DA5\u6F0B\u{249EC}\u6D67\u{23F7F}\u3D8F\u6E04\u{2403C}\u5A3D\u6E0A\u5847\u6D24\u7842\u713B\u{2431A}\u{24276}\u70F1\u7250\u7287\u7294\u{2478F}\u{24725}\u5179\u{24AA4}\u{205EB}\u747A\u{23EF8}\u{2365F}\u{24A4A}\u{24917}\u{25FE1}\u3F06\u3EB1\u{24ADF}\u{28C23}\u{23F35}\u60A7\u3EF3\u74CC\u743C\u9387\u7437\u449F\u{26DEA}\u4551\u7583\u3F63\u{24CD9}\u{24D06}\u3F58\u7555\u7673\u{2A5C6}\u3B19\u7468\u{28ACC}\u{249AB}\u{2498E}\u3AFB"],
      ["94a1", "\u3DCD\u{24A4E}\u3EFF\u{249C5}\u{248F3}\u91FA\u5732\u9342\u{28AE3}\u{21864}\u50DF\u{25221}\u{251E7}\u7778\u{23232}\u770E\u770F\u777B\u{24697}\u{23781}\u3A5E\u{248F0}\u7438\u749B\u3EBF\u{24ABA}\u{24AC7}\u40C8\u{24A96}\u{261AE}\u9307\u{25581}\u781E\u788D\u7888\u78D2\u73D0\u7959\u{27741}\u{256E3}\u410E\u799B\u8496\u79A5\u6A2D\u{23EFA}\u7A3A\u79F4\u416E\u{216E6}\u4132\u9235\u79F1\u{20D4C}\u{2498C}\u{20299}\u{23DBA}\u{2176E}\u3597\u556B\u3570\u36AA\u{201D4}\u{20C0D}\u7AE2\u5A59\u{226F5}\u{25AAF}\u{25A9C}\u5A0D\u{2025B}\u78F0\u5A2A\u{25BC6}\u7AFE\u41F9\u7C5D\u7C6D\u4211\u{25BB3}\u{25EBC}\u{25EA6}\u7CCD\u{249F9}\u{217B0}\u7C8E\u7C7C\u7CAE\u6AB2\u7DDC\u7E07\u7DD3\u7F4E\u{26261}"],
      ["9540", "\u{2615C}\u{27B48}\u7D97\u{25E82}\u426A\u{26B75}\u{20916}\u67D6\u{2004E}\u{235CF}\u57C4\u{26412}\u{263F8}\u{24962}\u7FDD\u7B27\u{2082C}\u{25AE9}\u{25D43}\u7B0C\u{25E0E}\u99E6\u8645\u9A63\u6A1C\u{2343F}\u39E2\u{249F7}\u{265AD}\u9A1F\u{265A0}\u8480\u{27127}\u{26CD1}\u44EA\u8137\u4402\u80C6\u8109\u8142\u{267B4}\u98C3\u{26A42}\u8262\u8265\u{26A51}\u8453\u{26DA7}\u8610\u{2721B}\u5A86\u417F\u{21840}\u5B2B\u{218A1}\u5AE4\u{218D8}\u86A0\u{2F9BC}\u{23D8F}\u882D\u{27422}\u5A02"],
      ["95a1", "\u886E\u4F45\u8887\u88BF\u88E6\u8965\u894D\u{25683}\u8954\u{27785}\u{27784}\u{28BF5}\u{28BD9}\u{28B9C}\u{289F9}\u3EAD\u84A3\u46F5\u46CF\u37F2\u8A3D\u8A1C\u{29448}\u5F4D\u922B\u{24284}\u65D4\u7129\u70C4\u{21845}\u9D6D\u8C9F\u8CE9\u{27DDC}\u599A\u77C3\u59F0\u436E\u36D4\u8E2A\u8EA7\u{24C09}\u8F30\u8F4A\u42F4\u6C58\u6FBB\u{22321}\u489B\u6F79\u6E8B\u{217DA}\u9BE9\u36B5\u{2492F}\u90BB\u9097\u5571\u4906\u91BB\u9404\u{28A4B}\u4062\u{28AFC}\u9427\u{28C1D}\u{28C3B}\u84E5\u8A2B\u9599\u95A7\u9597\u9596\u{28D34}\u7445\u3EC2\u{248FF}\u{24A42}\u{243EA}\u3EE7\u{23225}\u968F\u{28EE7}\u{28E66}\u{28E65}\u3ECC\u{249ED}\u{24A78}\u{23FEE}\u7412\u746B\u3EFC\u9741\u{290B0}"],
      ["9640", "\u6847\u4A1D\u{29093}\u{257DF}\u975D\u9368\u{28989}\u{28C26}\u{28B2F}\u{263BE}\u92BA\u5B11\u8B69\u493C\u73F9\u{2421B}\u979B\u9771\u9938\u{20F26}\u5DC1\u{28BC5}\u{24AB2}\u981F\u{294DA}\u92F6\u{295D7}\u91E5\u44C0\u{28B50}\u{24A67}\u{28B64}\u98DC\u{28A45}\u3F00\u922A\u4925\u8414\u993B\u994D\u{27B06}\u3DFD\u999B\u4B6F\u99AA\u9A5C\u{28B65}\u{258C8}\u6A8F\u9A21\u5AFE\u9A2F\u{298F1}\u4B90\u{29948}\u99BC\u4BBD\u4B97\u937D\u5872\u{21302}\u5822\u{249B8}"],
      ["96a1", "\u{214E8}\u7844\u{2271F}\u{23DB8}\u68C5\u3D7D\u9458\u3927\u6150\u{22781}\u{2296B}\u6107\u9C4F\u9C53\u9C7B\u9C35\u9C10\u9B7F\u9BCF\u{29E2D}\u9B9F\u{2A1F5}\u{2A0FE}\u9D21\u4CAE\u{24104}\u9E18\u4CB0\u9D0C\u{2A1B4}\u{2A0ED}\u{2A0F3}\u{2992F}\u9DA5\u84BD\u{26E12}\u{26FDF}\u{26B82}\u85FC\u4533\u{26DA4}\u{26E84}\u{26DF0}\u8420\u85EE\u{26E00}\u{237D7}\u{26064}\u79E2\u{2359C}\u{23640}\u492D\u{249DE}\u3D62\u93DB\u92BE\u9348\u{202BF}\u78B9\u9277\u944D\u4FE4\u3440\u9064\u{2555D}\u783D\u7854\u78B6\u784B\u{21757}\u{231C9}\u{24941}\u369A\u4F72\u6FDA\u6FD9\u701E\u701E\u5414\u{241B5}\u57BB\u58F3\u578A\u9D16\u57D7\u7134\u34AF\u{241AC}\u71EB\u{26C40}\u{24F97}\u5B28\u{217B5}\u{28A49}"],
      ["9740", "\u610C\u5ACE\u5A0B\u42BC\u{24488}\u372C\u4B7B\u{289FC}\u93BB\u93B8\u{218D6}\u{20F1D}\u8472\u{26CC0}\u{21413}\u{242FA}\u{22C26}\u{243C1}\u5994\u{23DB7}\u{26741}\u7DA8\u{2615B}\u{260A4}\u{249B9}\u{2498B}\u{289FA}\u92E5\u73E2\u3EE9\u74B4\u{28B63}\u{2189F}\u3EE1\u{24AB3}\u6AD8\u73F3\u73FB\u3ED6\u{24A3E}\u{24A94}\u{217D9}\u{24A66}\u{203A7}\u{21424}\u{249E5}\u7448\u{24916}\u70A5\u{24976}\u9284\u73E6\u935F\u{204FE}\u9331\u{28ACE}\u{28A16}\u9386\u{28BE7}\u{255D5}\u4935\u{28A82}\u716B"],
      ["97a1", "\u{24943}\u{20CFF}\u56A4\u{2061A}\u{20BEB}\u{20CB8}\u5502\u79C4\u{217FA}\u7DFE\u{216C2}\u{24A50}\u{21852}\u452E\u9401\u370A\u{28AC0}\u{249AD}\u59B0\u{218BF}\u{21883}\u{27484}\u5AA1\u36E2\u{23D5B}\u36B0\u925F\u5A79\u{28A81}\u{21862}\u9374\u3CCD\u{20AB4}\u4A96\u398A\u50F4\u3D69\u3D4C\u{2139C}\u7175\u42FB\u{28218}\u6E0F\u{290E4}\u44EB\u6D57\u{27E4F}\u7067\u6CAF\u3CD6\u{23FED}\u{23E2D}\u6E02\u6F0C\u3D6F\u{203F5}\u7551\u36BC\u34C8\u4680\u3EDA\u4871\u59C4\u926E\u493E\u8F41\u{28C1C}\u{26BC0}\u5812\u57C8\u36D6\u{21452}\u70FE\u{24362}\u{24A71}\u{22FE3}\u{212B0}\u{223BD}\u68B9\u6967\u{21398}\u{234E5}\u{27BF4}\u{236DF}\u{28A83}\u{237D6}\u{233FA}\u{24C9F}\u6A1A\u{236AD}\u{26CB7}\u843E\u44DF\u44CE"],
      ["9840", "\u{26D26}\u{26D51}\u{26C82}\u{26FDE}\u6F17\u{27109}\u833D\u{2173A}\u83ED\u{26C80}\u{27053}\u{217DB}\u5989\u5A82\u{217B3}\u5A61\u5A71\u{21905}\u{241FC}\u372D\u59EF\u{2173C}\u36C7\u718E\u9390\u669A\u{242A5}\u5A6E\u5A2B\u{24293}\u6A2B\u{23EF9}\u{27736}\u{2445B}\u{242CA}\u711D\u{24259}\u{289E1}\u4FB0\u{26D28}\u5CC2\u{244CE}\u{27E4D}\u{243BD}\u6A0C\u{24256}\u{21304}\u70A6\u7133\u{243E9}\u3DA5\u6CDF\u{2F825}\u{24A4F}\u7E65\u59EB\u5D2F\u3DF3\u5F5C\u{24A5D}\u{217DF}\u7DA4\u8426"],
      ["98a1", "\u5485\u{23AFA}\u{23300}\u{20214}\u577E\u{208D5}\u{20619}\u3FE5\u{21F9E}\u{2A2B6}\u7003\u{2915B}\u5D70\u738F\u7CD3\u{28A59}\u{29420}\u4FC8\u7FE7\u72CD\u7310\u{27AF4}\u7338\u7339\u{256F6}\u7341\u7348\u3EA9\u{27B18}\u906C\u71F5\u{248F2}\u73E1\u81F6\u3ECA\u770C\u3ED1\u6CA2\u56FD\u7419\u741E\u741F\u3EE2\u3EF0\u3EF4\u3EFA\u74D3\u3F0E\u3F53\u7542\u756D\u7572\u758D\u3F7C\u75C8\u75DC\u3FC0\u764D\u3FD7\u7674\u3FDC\u767A\u{24F5C}\u7188\u5623\u8980\u5869\u401D\u7743\u4039\u6761\u4045\u35DB\u7798\u406A\u406F\u5C5E\u77BE\u77CB\u58F2\u7818\u70B9\u781C\u40A8\u7839\u7847\u7851\u7866\u8448\u{25535}\u7933\u6803\u7932\u4103"],
      ["9940", "\u4109\u7991\u7999\u8FBB\u7A06\u8FBC\u4167\u7A91\u41B2\u7ABC\u8279\u41C4\u7ACF\u7ADB\u41CF\u4E21\u7B62\u7B6C\u7B7B\u7C12\u7C1B\u4260\u427A\u7C7B\u7C9C\u428C\u7CB8\u4294\u7CED\u8F93\u70C0\u{20CCF}\u7DCF\u7DD4\u7DD0\u7DFD\u7FAE\u7FB4\u729F\u4397\u8020\u8025\u7B39\u802E\u8031\u8054\u3DCC\u57B4\u70A0\u80B7\u80E9\u43ED\u810C\u732A\u810E\u8112\u7560\u8114\u4401\u3B39\u8156\u8159\u815A"],
      ["99a1", "\u4413\u583A\u817C\u8184\u4425\u8193\u442D\u81A5\u57EF\u81C1\u81E4\u8254\u448F\u82A6\u8276\u82CA\u82D8\u82FF\u44B0\u8357\u9669\u698A\u8405\u70F5\u8464\u60E3\u8488\u4504\u84BE\u84E1\u84F8\u8510\u8538\u8552\u453B\u856F\u8570\u85E0\u4577\u8672\u8692\u86B2\u86EF\u9645\u878B\u4606\u4617\u88AE\u88FF\u8924\u8947\u8991\u{27967}\u8A29\u8A38\u8A94\u8AB4\u8C51\u8CD4\u8CF2\u8D1C\u4798\u585F\u8DC3\u47ED\u4EEE\u8E3A\u55D8\u5754\u8E71\u55F5\u8EB0\u4837\u8ECE\u8EE2\u8EE4\u8EED\u8EF2\u8FB7\u8FC1\u8FCA\u8FCC\u9033\u99C4\u48AD\u98E0\u9213\u491E\u9228\u9258\u926B\u92B1\u92AE\u92BF"],
      ["9a40", "\u92E3\u92EB\u92F3\u92F4\u92FD\u9343\u9384\u93AD\u4945\u4951\u9EBF\u9417\u5301\u941D\u942D\u943E\u496A\u9454\u9479\u952D\u95A2\u49A7\u95F4\u9633\u49E5\u67A0\u4A24\u9740\u4A35\u97B2\u97C2\u5654\u4AE4\u60E8\u98B9\u4B19\u98F1\u5844\u990E\u9919\u51B4\u991C\u9937\u9942\u995D\u9962\u4B70\u99C5\u4B9D\u9A3C\u9B0F\u7A83\u9B69\u9B81\u9BDD\u9BF1\u9BF4\u4C6D\u9C20\u376F\u{21BC2}\u9D49\u9C3A"],
      ["9aa1", "\u9EFE\u5650\u9D93\u9DBD\u9DC0\u9DFC\u94F6\u8FB6\u9E7B\u9EAC\u9EB1\u9EBD\u9EC6\u94DC\u9EE2\u9EF1\u9EF8\u7AC8\u9F44\u{20094}\u{202B7}\u{203A0}\u691A\u94C3\u59AC\u{204D7}\u5840\u94C1\u37B9\u{205D5}\u{20615}\u{20676}\u{216BA}\u5757\u7173\u{20AC2}\u{20ACD}\u{20BBF}\u546A\u{2F83B}\u{20BCB}\u549E\u{20BFB}\u{20C3B}\u{20C53}\u{20C65}\u{20C7C}\u60E7\u{20C8D}\u567A\u{20CB5}\u{20CDD}\u{20CED}\u{20D6F}\u{20DB2}\u{20DC8}\u6955\u9C2F\u87A5\u{20E04}\u{20E0E}\u{20ED7}\u{20F90}\u{20F2D}\u{20E73}\u5C20\u{20FBC}\u5E0B\u{2105C}\u{2104F}\u{21076}\u671E\u{2107B}\u{21088}\u{21096}\u3647\u{210BF}\u{210D3}\u{2112F}\u{2113B}\u5364\u84AD\u{212E3}\u{21375}\u{21336}\u8B81\u{21577}\u{21619}\u{217C3}\u{217C7}\u4E78\u70BB\u{2182D}\u{2196A}"],
      ["9b40", "\u{21A2D}\u{21A45}\u{21C2A}\u{21C70}\u{21CAC}\u{21EC8}\u62C3\u{21ED5}\u{21F15}\u7198\u6855\u{22045}\u69E9\u36C8\u{2227C}\u{223D7}\u{223FA}\u{2272A}\u{22871}\u{2294F}\u82FD\u{22967}\u{22993}\u{22AD5}\u89A5\u{22AE8}\u8FA0\u{22B0E}\u97B8\u{22B3F}\u9847\u9ABD\u{22C4C}"],
      ["9b62", "\u{22C88}\u{22CB7}\u{25BE8}\u{22D08}\u{22D12}\u{22DB7}\u{22D95}\u{22E42}\u{22F74}\u{22FCC}\u{23033}\u{23066}\u{2331F}\u{233DE}\u5FB1\u6648\u66BF\u{27A79}\u{23567}\u{235F3}\u7201\u{249BA}\u77D7\u{2361A}\u{23716}\u7E87\u{20346}\u58B5\u670E"],
      ["9ba1", "\u6918\u{23AA7}\u{27657}\u{25FE2}\u{23E11}\u{23EB9}\u{275FE}\u{2209A}\u48D0\u4AB8\u{24119}\u{28A9A}\u{242EE}\u{2430D}\u{2403B}\u{24334}\u{24396}\u{24A45}\u{205CA}\u51D2\u{20611}\u599F\u{21EA8}\u3BBE\u{23CFF}\u{24404}\u{244D6}\u5788\u{24674}\u399B\u{2472F}\u{285E8}\u{299C9}\u3762\u{221C3}\u8B5E\u{28B4E}\u99D6\u{24812}\u{248FB}\u{24A15}\u7209\u{24AC0}\u{20C78}\u5965\u{24EA5}\u{24F86}\u{20779}\u8EDA\u{2502C}\u528F\u573F\u7171\u{25299}\u{25419}\u{23F4A}\u{24AA7}\u55BC\u{25446}\u{2546E}\u{26B52}\u91D4\u3473\u{2553F}\u{27632}\u{2555E}\u4718\u{25562}\u{25566}\u{257C7}\u{2493F}\u{2585D}\u5066\u34FB\u{233CC}\u60DE\u{25903}\u477C\u{28948}\u{25AAE}\u{25B89}\u{25C06}\u{21D90}\u57A1\u7151\u6FB6\u{26102}\u{27C12}\u9056\u{261B2}\u{24F9A}\u8B62\u{26402}\u{2644A}"],
      ["9c40", "\u5D5B\u{26BF7}\u8F36\u{26484}\u{2191C}\u8AEA\u{249F6}\u{26488}\u{23FEF}\u{26512}\u4BC0\u{265BF}\u{266B5}\u{2271B}\u9465\u{257E1}\u6195\u5A27\u{2F8CD}\u4FBB\u56B9\u{24521}\u{266FC}\u4E6A\u{24934}\u9656\u6D8F\u{26CBD}\u3618\u8977\u{26799}\u{2686E}\u{26411}\u{2685E}\u71DF\u{268C7}\u7B42\u{290C0}\u{20A11}\u{26926}\u9104\u{26939}\u7A45\u9DF0\u{269FA}\u9A26\u{26A2D}\u365F\u{26469}\u{20021}\u7983\u{26A34}\u{26B5B}\u5D2C\u{23519}\u83CF\u{26B9D}\u46D0\u{26CA4}\u753B\u8865\u{26DAE}\u58B6"],
      ["9ca1", "\u371C\u{2258D}\u{2704B}\u{271CD}\u3C54\u{27280}\u{27285}\u9281\u{2217A}\u{2728B}\u9330\u{272E6}\u{249D0}\u6C39\u949F\u{27450}\u{20EF8}\u8827\u88F5\u{22926}\u{28473}\u{217B1}\u6EB8\u{24A2A}\u{21820}\u39A4\u36B9\u5C10\u79E3\u453F\u66B6\u{29CAD}\u{298A4}\u8943\u{277CC}\u{27858}\u56D6\u40DF\u{2160A}\u39A1\u{2372F}\u{280E8}\u{213C5}\u71AD\u8366\u{279DD}\u{291A8}\u5A67\u4CB7\u{270AF}\u{289AB}\u{279FD}\u{27A0A}\u{27B0B}\u{27D66}\u{2417A}\u7B43\u797E\u{28009}\u6FB5\u{2A2DF}\u6A03\u{28318}\u53A2\u{26E07}\u93BF\u6836\u975D\u{2816F}\u{28023}\u{269B5}\u{213ED}\u{2322F}\u{28048}\u5D85\u{28C30}\u{28083}\u5715\u9823\u{28949}\u5DAB\u{24988}\u65BE\u69D5\u53D2\u{24AA5}\u{23F81}\u3C11\u6736\u{28090}\u{280F4}\u{2812E}\u{21FA1}\u{2814F}"],
      ["9d40", "\u{28189}\u{281AF}\u{2821A}\u{28306}\u{2832F}\u{2838A}\u35CA\u{28468}\u{286AA}\u48FA\u63E6\u{28956}\u7808\u9255\u{289B8}\u43F2\u{289E7}\u43DF\u{289E8}\u{28B46}\u{28BD4}\u59F8\u{28C09}\u8F0B\u{28FC5}\u{290EC}\u7B51\u{29110}\u{2913C}\u3DF7\u{2915E}\u{24ACA}\u8FD0\u728F\u568B\u{294E7}\u{295E9}\u{295B0}\u{295B8}\u{29732}\u{298D1}\u{29949}\u{2996A}\u{299C3}\u{29A28}\u{29B0E}\u{29D5A}\u{29D9B}\u7E9F\u{29EF8}\u{29F23}\u4CA4\u9547\u{2A293}\u71A2\u{2A2FF}\u4D91\u9012\u{2A5CB}\u4D9C\u{20C9C}\u8FBE\u55C1"],
      ["9da1", "\u8FBA\u{224B0}\u8FB9\u{24A93}\u4509\u7E7F\u6F56\u6AB1\u4EEA\u34E4\u{28B2C}\u{2789D}\u373A\u8E80\u{217F5}\u{28024}\u{28B6C}\u{28B99}\u{27A3E}\u{266AF}\u3DEB\u{27655}\u{23CB7}\u{25635}\u{25956}\u4E9A\u{25E81}\u{26258}\u56BF\u{20E6D}\u8E0E\u5B6D\u{23E88}\u{24C9E}\u63DE\u62D0\u{217F6}\u{2187B}\u6530\u562D\u{25C4A}\u541A\u{25311}\u3DC6\u{29D98}\u4C7D\u5622\u561E\u7F49\u{25ED8}\u5975\u{23D40}\u8770\u4E1C\u{20FEA}\u{20D49}\u{236BA}\u8117\u9D5E\u8D18\u763B\u9C45\u764E\u77B9\u9345\u5432\u8148\u82F7\u5625\u8132\u8418\u80BD\u55EA\u7962\u5643\u5416\u{20E9D}\u35CE\u5605\u55F1\u66F1\u{282E2}\u362D\u7534\u55F0\u55BA\u5497\u5572\u{20C41}\u{20C96}\u5ED0\u{25148}\u{20E76}\u{22C62}"],
      ["9e40", "\u{20EA2}\u9EAB\u7D5A\u55DE\u{21075}\u629D\u976D\u5494\u8CCD\u71F6\u9176\u63FC\u63B9\u63FE\u5569\u{22B43}\u9C72\u{22EB3}\u519A\u34DF\u{20DA7}\u51A7\u544D\u551E\u5513\u7666\u8E2D\u{2688A}\u75B1\u80B6\u8804\u8786\u88C7\u81B6\u841C\u{210C1}\u44EC\u7304\u{24706}\u5B90\u830B\u{26893}\u567B\u{226F4}\u{27D2F}\u{241A3}\u{27D73}\u{26ED0}\u{272B6}\u9170\u{211D9}\u9208\u{23CFC}\u{2A6A9}\u{20EAC}\u{20EF9}\u7266\u{21CA2}\u474E\u{24FC2}\u{27FF9}\u{20FEB}\u40FA"],
      ["9ea1", "\u9C5D\u651F\u{22DA0}\u48F3\u{247E0}\u{29D7C}\u{20FEC}\u{20E0A}\u6062\u{275A3}\u{20FED}"],
      ["9ead", "\u{26048}\u{21187}\u71A3\u7E8E\u9D50\u4E1A\u4E04\u3577\u5B0D\u6CB2\u5367\u36AC\u39DC\u537D\u36A5\u{24618}\u589A\u{24B6E}\u822D\u544B\u57AA\u{25A95}\u{20979}"],
      ["9ec5", "\u3A52\u{22465}\u7374\u{29EAC}\u4D09\u9BED\u{23CFE}\u{29F30}\u4C5B\u{24FA9}\u{2959E}\u{29FDE}\u845C\u{23DB6}\u{272B2}\u{267B3}\u{23720}\u632E\u7D25\u{23EF7}\u{23E2C}\u3A2A\u9008\u52CC\u3E74\u367A\u45E9\u{2048E}\u7640\u5AF0\u{20EB6}\u787A\u{27F2E}\u58A7\u40BF\u567C\u9B8B\u5D74\u7654\u{2A434}\u9E85\u4CE1\u75F9\u37FB\u6119\u{230DA}\u{243F2}"],
      ["9ef5", "\u565D\u{212A9}\u57A7\u{24963}\u{29E06}\u5234\u{270AE}\u35AD\u6C4A\u9D7C"],
      ["9f40", "\u7C56\u9B39\u57DE\u{2176C}\u5C53\u64D3\u{294D0}\u{26335}\u{27164}\u86AD\u{20D28}\u{26D22}\u{24AE2}\u{20D71}"],
      ["9f4f", "\u51FE\u{21F0F}\u5D8E\u9703\u{21DD1}\u9E81\u904C\u7B1F\u9B02\u5CD1\u7BA3\u6268\u6335\u9AFF\u7BCF\u9B2A\u7C7E\u9B2E\u7C42\u7C86\u9C15\u7BFC\u9B09\u9F17\u9C1B\u{2493E}\u9F5A\u5573\u5BC3\u4FFD\u9E98\u4FF2\u5260\u3E06\u52D1\u5767\u5056\u59B7\u5E12\u97C8\u9DAB\u8F5C\u5469\u97B4\u9940\u97BA\u532C\u6130"],
      ["9fa1", "\u692C\u53DA\u9C0A\u9D02\u4C3B\u9641\u6980\u50A6\u7546\u{2176D}\u99DA\u5273"],
      ["9fae", "\u9159\u9681\u915C"],
      ["9fb2", "\u9151\u{28E97}\u637F\u{26D23}\u6ACA\u5611\u918E\u757A\u6285\u{203FC}\u734F\u7C70\u{25C21}\u{23CFD}"],
      ["9fc1", "\u{24919}\u76D6\u9B9D\u4E2A\u{20CD4}\u83BE\u8842"],
      ["9fc9", "\u5C4A\u69C0\u50ED\u577A\u521F\u5DF5\u4ECE\u6C31\u{201F2}\u4F39\u549C\u54DA\u529A\u8D82\u35FE\u5F0C\u35F3"],
      ["9fdb", "\u6B52\u917C\u9FA5\u9B97\u982E\u98B4\u9ABA\u9EA8\u9E84\u717A\u7B14"],
      ["9fe7", "\u6BFA\u8818\u7F78"],
      ["9feb", "\u5620\u{2A64A}\u8E77\u9F53"],
      ["9ff0", "\u8DD4\u8E4F\u9E1C\u8E01\u6282\u{2837D}\u8E28\u8E75\u7AD3\u{24A77}\u7A3E\u78D8\u6CEA\u8A67\u7607"],
      ["a040", "\u{28A5A}\u9F26\u6CCE\u87D6\u75C3\u{2A2B2}\u7853\u{2F840}\u8D0C\u72E2\u7371\u8B2D\u7302\u74F1\u8CEB\u{24ABB}\u862F\u5FBA\u88A0\u44B7"],
      ["a055", "\u{2183B}\u{26E05}"],
      ["a058", "\u8A7E\u{2251B}"],
      ["a05b", "\u60FD\u7667\u9AD7\u9D44\u936E\u9B8F\u87F5"],
      ["a063", "\u880F\u8CF7\u732C\u9721\u9BB0\u35D6\u72B2\u4C07\u7C51\u994A\u{26159}\u6159\u4C04\u9E96\u617D"],
      ["a073", "\u575F\u616F\u62A6\u6239\u62CE\u3A5C\u61E2\u53AA\u{233F5}\u6364\u6802\u35D2"],
      ["a0a1", "\u5D57\u{28BC2}\u8FDA\u{28E39}"],
      ["a0a6", "\u50D9\u{21D46}\u7906\u5332\u9638\u{20F3B}\u4065"],
      ["a0ae", "\u77FE"],
      ["a0b0", "\u7CC2\u{25F1A}\u7CDA\u7A2D\u8066\u8063\u7D4D\u7505\u74F2\u8994\u821A\u670C\u8062\u{27486}\u805B\u74F0\u8103\u7724\u8989\u{267CC}\u7553\u{26ED1}\u87A9\u87CE\u81C8\u878C\u8A49\u8CAD\u8B43\u772B\u74F8\u84DA\u3635\u69B2\u8DA6"],
      ["a0d4", "\u89A9\u7468\u6DB9\u87C1\u{24011}\u74E7\u3DDB\u7176\u60A4\u619C\u3CD1\u7162\u6077"],
      ["a0e2", "\u7F71\u{28B2D}\u7250\u60E9\u4B7E\u5220\u3C18\u{23CC7}\u{25ED7}\u{27656}\u{25531}\u{21944}\u{212FE}\u{29903}\u{26DDC}\u{270AD}\u5CC1\u{261AD}\u{28A0F}\u{23677}\u{200EE}\u{26846}\u{24F0E}\u4562\u5B1F\u{2634C}\u9F50\u9EA6\u{2626B}"],
      ["a3c0", "\u2400", 31, "\u2421"],
      ["c6a1", "\u2460", 9, "\u2474", 9, "\u2170", 9, "\u4E36\u4E3F\u4E85\u4EA0\u5182\u5196\u51AB\u52F9\u5338\u5369\u53B6\u590A\u5B80\u5DDB\u2F33\u5E7F\u5EF4\u5F50\u5F61\u6534\u65E0\u7592\u7676\u8FB5\u96B6\xA8\u02C6\u30FD\u30FE\u309D\u309E\u3003\u4EDD\u3005\u3006\u3007\u30FC\uFF3B\uFF3D\u273D\u3041", 23],
      ["c740", "\u3059", 58, "\u30A1\u30A2\u30A3\u30A4"],
      ["c7a1", "\u30A5", 81, "\u0410", 5, "\u0401\u0416", 4],
      ["c840", "\u041B", 26, "\u0451\u0436", 25, "\u21E7\u21B8\u21B9\u31CF\u{200CC}\u4E5A\u{2008A}\u5202\u4491"],
      ["c8a1", "\u9FB0\u5188\u9FB1\u{27607}"],
      ["c8cd", "\uFFE2\uFFE4\uFF07\uFF02\u3231\u2116\u2121\u309B\u309C\u2E80\u2E84\u2E86\u2E87\u2E88\u2E8A\u2E8C\u2E8D\u2E95\u2E9C\u2E9D\u2EA5\u2EA7\u2EAA\u2EAC\u2EAE\u2EB6\u2EBC\u2EBE\u2EC6\u2ECA\u2ECC\u2ECD\u2ECF\u2ED6\u2ED7\u2EDE\u2EE3"],
      ["c8f5", "\u0283\u0250\u025B\u0254\u0275\u0153\xF8\u014B\u028A\u026A"],
      ["f9fe", "\uFFED"],
      ["fa40", "\u{20547}\u92DB\u{205DF}\u{23FC5}\u854C\u42B5\u73EF\u51B5\u3649\u{24942}\u{289E4}\u9344\u{219DB}\u82EE\u{23CC8}\u783C\u6744\u62DF\u{24933}\u{289AA}\u{202A0}\u{26BB3}\u{21305}\u4FAB\u{224ED}\u5008\u{26D29}\u{27A84}\u{23600}\u{24AB1}\u{22513}\u5029\u{2037E}\u5FA4\u{20380}\u{20347}\u6EDB\u{2041F}\u507D\u5101\u347A\u510E\u986C\u3743\u8416\u{249A4}\u{20487}\u5160\u{233B4}\u516A\u{20BFF}\u{220FC}\u{202E5}\u{22530}\u{2058E}\u{23233}\u{21983}\u5B82\u877D\u{205B3}\u{23C99}\u51B2\u51B8"],
      ["faa1", "\u9D34\u51C9\u51CF\u51D1\u3CDC\u51D3\u{24AA6}\u51B3\u51E2\u5342\u51ED\u83CD\u693E\u{2372D}\u5F7B\u520B\u5226\u523C\u52B5\u5257\u5294\u52B9\u52C5\u7C15\u8542\u52E0\u860D\u{26B13}\u5305\u{28ADE}\u5549\u6ED9\u{23F80}\u{20954}\u{23FEC}\u5333\u5344\u{20BE2}\u6CCB\u{21726}\u681B\u73D5\u604A\u3EAA\u38CC\u{216E8}\u71DD\u44A2\u536D\u5374\u{286AB}\u537E\u537F\u{21596}\u{21613}\u77E6\u5393\u{28A9B}\u53A0\u53AB\u53AE\u73A7\u{25772}\u3F59\u739C\u53C1\u53C5\u6C49\u4E49\u57FE\u53D9\u3AAB\u{20B8F}\u53E0\u{23FEB}\u{22DA3}\u53F6\u{20C77}\u5413\u7079\u552B\u6657\u6D5B\u546D\u{26B53}\u{20D74}\u555D\u548F\u54A4\u47A6\u{2170D}\u{20EDD}\u3DB4\u{20D4D}"],
      ["fb40", "\u{289BC}\u{22698}\u5547\u4CED\u542F\u7417\u5586\u55A9\u5605\u{218D7}\u{2403A}\u4552\u{24435}\u66B3\u{210B4}\u5637\u66CD\u{2328A}\u66A4\u66AD\u564D\u564F\u78F1\u56F1\u9787\u53FE\u5700\u56EF\u56ED\u{28B66}\u3623\u{2124F}\u5746\u{241A5}\u6C6E\u708B\u5742\u36B1\u{26C7E}\u57E6\u{21416}\u5803\u{21454}\u{24363}\u5826\u{24BF5}\u585C\u58AA\u3561\u58E0\u58DC\u{2123C}\u58FB\u5BFF\u5743\u{2A150}\u{24278}\u93D3\u35A1\u591F\u68A6\u36C3\u6E59"],
      ["fba1", "\u{2163E}\u5A24\u5553\u{21692}\u8505\u59C9\u{20D4E}\u{26C81}\u{26D2A}\u{217DC}\u59D9\u{217FB}\u{217B2}\u{26DA6}\u6D71\u{21828}\u{216D5}\u59F9\u{26E45}\u5AAB\u5A63\u36E6\u{249A9}\u5A77\u3708\u5A96\u7465\u5AD3\u{26FA1}\u{22554}\u3D85\u{21911}\u3732\u{216B8}\u5E83\u52D0\u5B76\u6588\u5B7C\u{27A0E}\u4004\u485D\u{20204}\u5BD5\u6160\u{21A34}\u{259CC}\u{205A5}\u5BF3\u5B9D\u4D10\u5C05\u{21B44}\u5C13\u73CE\u5C14\u{21CA5}\u{26B28}\u5C49\u48DD\u5C85\u5CE9\u5CEF\u5D8B\u{21DF9}\u{21E37}\u5D10\u5D18\u5D46\u{21EA4}\u5CBA\u5DD7\u82FC\u382D\u{24901}\u{22049}\u{22173}\u8287\u3836\u3BC2\u5E2E\u6A8A\u5E75\u5E7A\u{244BC}\u{20CD3}\u53A6\u4EB7\u5ED0\u53A8\u{21771}\u5E09\u5EF4\u{28482}"],
      ["fc40", "\u5EF9\u5EFB\u38A0\u5EFC\u683E\u941B\u5F0D\u{201C1}\u{2F894}\u3ADE\u48AE\u{2133A}\u5F3A\u{26888}\u{223D0}\u5F58\u{22471}\u5F63\u97BD\u{26E6E}\u5F72\u9340\u{28A36}\u5FA7\u5DB6\u3D5F\u{25250}\u{21F6A}\u{270F8}\u{22668}\u91D6\u{2029E}\u{28A29}\u6031\u6685\u{21877}\u3963\u3DC7\u3639\u5790\u{227B4}\u7971\u3E40\u609E\u60A4\u60B3\u{24982}\u{2498F}\u{27A53}\u74A4\u50E1\u5AA0\u6164\u8424\u6142\u{2F8A6}\u{26ED2}\u6181\u51F4\u{20656}\u6187\u5BAA\u{23FB7}"],
      ["fca1", "\u{2285F}\u61D3\u{28B9D}\u{2995D}\u61D0\u3932\u{22980}\u{228C1}\u6023\u615C\u651E\u638B\u{20118}\u62C5\u{21770}\u62D5\u{22E0D}\u636C\u{249DF}\u3A17\u6438\u63F8\u{2138E}\u{217FC}\u6490\u6F8A\u{22E36}\u9814\u{2408C}\u{2571D}\u64E1\u64E5\u947B\u3A66\u643A\u3A57\u654D\u6F16\u{24A28}\u{24A23}\u6585\u656D\u655F\u{2307E}\u65B5\u{24940}\u4B37\u65D1\u40D8\u{21829}\u65E0\u65E3\u5FDF\u{23400}\u6618\u{231F7}\u{231F8}\u6644\u{231A4}\u{231A5}\u664B\u{20E75}\u6667\u{251E6}\u6673\u6674\u{21E3D}\u{23231}\u{285F4}\u{231C8}\u{25313}\u77C5\u{228F7}\u99A4\u6702\u{2439C}\u{24A21}\u3B2B\u69FA\u{237C2}\u675E\u6767\u6762\u{241CD}\u{290ED}\u67D7\u44E9\u6822\u6E50\u923C\u6801\u{233E6}\u{26DA0}\u685D"],
      ["fd40", "\u{2346F}\u69E1\u6A0B\u{28ADF}\u6973\u68C3\u{235CD}\u6901\u6900\u3D32\u3A01\u{2363C}\u3B80\u67AC\u6961\u{28A4A}\u42FC\u6936\u6998\u3BA1\u{203C9}\u8363\u5090\u69F9\u{23659}\u{2212A}\u6A45\u{23703}\u6A9D\u3BF3\u67B1\u6AC8\u{2919C}\u3C0D\u6B1D\u{20923}\u60DE\u6B35\u6B74\u{227CD}\u6EB5\u{23ADB}\u{203B5}\u{21958}\u3740\u5421\u{23B5A}\u6BE1\u{23EFC}\u6BDC\u6C37\u{2248B}\u{248F1}\u{26B51}\u6C5A\u8226\u6C79\u{23DBC}\u44C5\u{23DBD}\u{241A4}\u{2490C}\u{24900}"],
      ["fda1", "\u{23CC9}\u36E5\u3CEB\u{20D32}\u9B83\u{231F9}\u{22491}\u7F8F\u6837\u{26D25}\u{26DA1}\u{26DEB}\u6D96\u6D5C\u6E7C\u6F04\u{2497F}\u{24085}\u{26E72}\u8533\u{26F74}\u51C7\u6C9C\u6E1D\u842E\u{28B21}\u6E2F\u{23E2F}\u7453\u{23F82}\u79CC\u6E4F\u5A91\u{2304B}\u6FF8\u370D\u6F9D\u{23E30}\u6EFA\u{21497}\u{2403D}\u4555\u93F0\u6F44\u6F5C\u3D4E\u6F74\u{29170}\u3D3B\u6F9F\u{24144}\u6FD3\u{24091}\u{24155}\u{24039}\u{23FF0}\u{23FB4}\u{2413F}\u51DF\u{24156}\u{24157}\u{24140}\u{261DD}\u704B\u707E\u70A7\u7081\u70CC\u70D5\u70D6\u70DF\u4104\u3DE8\u71B4\u7196\u{24277}\u712B\u7145\u5A88\u714A\u716E\u5C9C\u{24365}\u714F\u9362\u{242C1}\u712C\u{2445A}\u{24A27}\u{24A22}\u71BA\u{28BE8}\u70BD\u720E"],
      ["fe40", "\u9442\u7215\u5911\u9443\u7224\u9341\u{25605}\u722E\u7240\u{24974}\u68BD\u7255\u7257\u3E55\u{23044}\u680D\u6F3D\u7282\u732A\u732B\u{24823}\u{2882B}\u48ED\u{28804}\u7328\u732E\u73CF\u73AA\u{20C3A}\u{26A2E}\u73C9\u7449\u{241E2}\u{216E7}\u{24A24}\u6623\u36C5\u{249B7}\u{2498D}\u{249FB}\u73F7\u7415\u6903\u{24A26}\u7439\u{205C3}\u3ED7\u745C\u{228AD}\u7460\u{28EB2}\u7447\u73E4\u7476\u83B9\u746C\u3730\u7474\u93F1\u6A2C\u7482\u4953\u{24A8C}"],
      ["fea1", "\u{2415F}\u{24A79}\u{28B8F}\u5B46\u{28C03}\u{2189E}\u74C8\u{21988}\u750E\u74E9\u751E\u{28ED9}\u{21A4B}\u5BD7\u{28EAC}\u9385\u754D\u754A\u7567\u756E\u{24F82}\u3F04\u{24D13}\u758E\u745D\u759E\u75B4\u7602\u762C\u7651\u764F\u766F\u7676\u{263F5}\u7690\u81EF\u37F8\u{26911}\u{2690E}\u76A1\u76A5\u76B7\u76CC\u{26F9F}\u8462\u{2509D}\u{2517D}\u{21E1C}\u771E\u7726\u7740\u64AF\u{25220}\u7758\u{232AC}\u77AF\u{28964}\u{28968}\u{216C1}\u77F4\u7809\u{21376}\u{24A12}\u68CA\u78AF\u78C7\u78D3\u96A5\u792E\u{255E0}\u78D7\u7934\u78B1\u{2760C}\u8FB8\u8884\u{28B2B}\u{26083}\u{2261C}\u7986\u8900\u6902\u7980\u{25857}\u799D\u{27B39}\u793C\u79A9\u6E2A\u{27126}\u3EA8\u79C6\u{2910D}\u79D4"]
    ];
  }
});

// ../../../node_modules/encoding/node_modules/iconv-lite/encodings/dbcs-data.js
var require_dbcs_data = __commonJS({
  "../../../node_modules/encoding/node_modules/iconv-lite/encodings/dbcs-data.js"(exports, module2) {
    "use strict";
    module2.exports = {
      // == Japanese/ShiftJIS ====================================================
      // All japanese encodings are based on JIS X set of standards:
      // JIS X 0201 - Single-byte encoding of ASCII + ¥ + Kana chars at 0xA1-0xDF.
      // JIS X 0208 - Main set of 6879 characters, placed in 94x94 plane, to be encoded by 2 bytes. 
      //              Has several variations in 1978, 1983, 1990 and 1997.
      // JIS X 0212 - Supplementary plane of 6067 chars in 94x94 plane. 1990. Effectively dead.
      // JIS X 0213 - Extension and modern replacement of 0208 and 0212. Total chars: 11233.
      //              2 planes, first is superset of 0208, second - revised 0212.
      //              Introduced in 2000, revised 2004. Some characters are in Unicode Plane 2 (0x2xxxx)
      // Byte encodings are:
      //  * Shift_JIS: Compatible with 0201, uses not defined chars in top half as lead bytes for double-byte
      //               encoding of 0208. Lead byte ranges: 0x81-0x9F, 0xE0-0xEF; Trail byte ranges: 0x40-0x7E, 0x80-0x9E, 0x9F-0xFC.
      //               Windows CP932 is a superset of Shift_JIS. Some companies added more chars, notably KDDI.
      //  * EUC-JP:    Up to 3 bytes per character. Used mostly on *nixes.
      //               0x00-0x7F       - lower part of 0201
      //               0x8E, 0xA1-0xDF - upper part of 0201
      //               (0xA1-0xFE)x2   - 0208 plane (94x94).
      //               0x8F, (0xA1-0xFE)x2 - 0212 plane (94x94).
      //  * JIS X 208: 7-bit, direct encoding of 0208. Byte ranges: 0x21-0x7E (94 values). Uncommon.
      //               Used as-is in ISO2022 family.
      //  * ISO2022-JP: Stateful encoding, with escape sequences to switch between ASCII, 
      //                0201-1976 Roman, 0208-1978, 0208-1983.
      //  * ISO2022-JP-1: Adds esc seq for 0212-1990.
      //  * ISO2022-JP-2: Adds esc seq for GB2313-1980, KSX1001-1992, ISO8859-1, ISO8859-7.
      //  * ISO2022-JP-3: Adds esc seq for 0201-1976 Kana set, 0213-2000 Planes 1, 2.
      //  * ISO2022-JP-2004: Adds 0213-2004 Plane 1.
      //
      // After JIS X 0213 appeared, Shift_JIS-2004, EUC-JISX0213 and ISO2022-JP-2004 followed, with just changing the planes.
      //
      // Overall, it seems that it's a mess :( http://www8.plala.or.jp/tkubota1/unicode-symbols-map2.html
      "shiftjis": {
        type: "_dbcs",
        table: function() {
          return require_shiftjis();
        },
        encodeAdd: { "\xA5": 92, "\u203E": 126 },
        encodeSkipVals: [{ from: 60736, to: 63808 }]
      },
      "csshiftjis": "shiftjis",
      "mskanji": "shiftjis",
      "sjis": "shiftjis",
      "windows31j": "shiftjis",
      "ms31j": "shiftjis",
      "xsjis": "shiftjis",
      "windows932": "shiftjis",
      "ms932": "shiftjis",
      "932": "shiftjis",
      "cp932": "shiftjis",
      "eucjp": {
        type: "_dbcs",
        table: function() {
          return require_eucjp();
        },
        encodeAdd: { "\xA5": 92, "\u203E": 126 }
      },
      // TODO: KDDI extension to Shift_JIS
      // TODO: IBM CCSID 942 = CP932, but F0-F9 custom chars and other char changes.
      // TODO: IBM CCSID 943 = Shift_JIS = CP932 with original Shift_JIS lower 128 chars.
      // == Chinese/GBK ==========================================================
      // http://en.wikipedia.org/wiki/GBK
      // We mostly implement W3C recommendation: https://www.w3.org/TR/encoding/#gbk-encoder
      // Oldest GB2312 (1981, ~7600 chars) is a subset of CP936
      "gb2312": "cp936",
      "gb231280": "cp936",
      "gb23121980": "cp936",
      "csgb2312": "cp936",
      "csiso58gb231280": "cp936",
      "euccn": "cp936",
      // Microsoft's CP936 is a subset and approximation of GBK.
      "windows936": "cp936",
      "ms936": "cp936",
      "936": "cp936",
      "cp936": {
        type: "_dbcs",
        table: function() {
          return require_cp936();
        }
      },
      // GBK (~22000 chars) is an extension of CP936 that added user-mapped chars and some other.
      "gbk": {
        type: "_dbcs",
        table: function() {
          return require_cp936().concat(require_gbk_added());
        }
      },
      "xgbk": "gbk",
      "isoir58": "gbk",
      // GB18030 is an algorithmic extension of GBK.
      // Main source: https://www.w3.org/TR/encoding/#gbk-encoder
      // http://icu-project.org/docs/papers/gb18030.html
      // http://source.icu-project.org/repos/icu/data/trunk/charset/data/xml/gb-18030-2000.xml
      // http://www.khngai.com/chinese/charmap/tblgbk.php?page=0
      "gb18030": {
        type: "_dbcs",
        table: function() {
          return require_cp936().concat(require_gbk_added());
        },
        gb18030: function() {
          return require_gb18030_ranges();
        },
        encodeSkipVals: [128],
        encodeAdd: { "\u20AC": 41699 }
      },
      "chinese": "gb18030",
      // == Korean ===============================================================
      // EUC-KR, KS_C_5601 and KS X 1001 are exactly the same.
      "windows949": "cp949",
      "ms949": "cp949",
      "949": "cp949",
      "cp949": {
        type: "_dbcs",
        table: function() {
          return require_cp949();
        }
      },
      "cseuckr": "cp949",
      "csksc56011987": "cp949",
      "euckr": "cp949",
      "isoir149": "cp949",
      "korean": "cp949",
      "ksc56011987": "cp949",
      "ksc56011989": "cp949",
      "ksc5601": "cp949",
      // == Big5/Taiwan/Hong Kong ================================================
      // There are lots of tables for Big5 and cp950. Please see the following links for history:
      // http://moztw.org/docs/big5/  http://www.haible.de/bruno/charsets/conversion-tables/Big5.html
      // Variations, in roughly number of defined chars:
      //  * Windows CP 950: Microsoft variant of Big5. Canonical: http://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/WINDOWS/CP950.TXT
      //  * Windows CP 951: Microsoft variant of Big5-HKSCS-2001. Seems to be never public. http://me.abelcheung.org/articles/research/what-is-cp951/
      //  * Big5-2003 (Taiwan standard) almost superset of cp950.
      //  * Unicode-at-on (UAO) / Mozilla 1.8. Falling out of use on the Web. Not supported by other browsers.
      //  * Big5-HKSCS (-2001, -2004, -2008). Hong Kong standard. 
      //    many unicode code points moved from PUA to Supplementary plane (U+2XXXX) over the years.
      //    Plus, it has 4 combining sequences.
      //    Seems that Mozilla refused to support it for 10 yrs. https://bugzilla.mozilla.org/show_bug.cgi?id=162431 https://bugzilla.mozilla.org/show_bug.cgi?id=310299
      //    because big5-hkscs is the only encoding to include astral characters in non-algorithmic way.
      //    Implementations are not consistent within browsers; sometimes labeled as just big5.
      //    MS Internet Explorer switches from big5 to big5-hkscs when a patch applied.
      //    Great discussion & recap of what's going on https://bugzilla.mozilla.org/show_bug.cgi?id=912470#c31
      //    In the encoder, it might make sense to support encoding old PUA mappings to Big5 bytes seq-s.
      //    Official spec: http://www.ogcio.gov.hk/en/business/tech_promotion/ccli/terms/doc/2003cmp_2008.txt
      //                   http://www.ogcio.gov.hk/tc/business/tech_promotion/ccli/terms/doc/hkscs-2008-big5-iso.txt
      // 
      // Current understanding of how to deal with Big5(-HKSCS) is in the Encoding Standard, http://encoding.spec.whatwg.org/#big5-encoder
      // Unicode mapping (http://www.unicode.org/Public/MAPPINGS/OBSOLETE/EASTASIA/OTHER/BIG5.TXT) is said to be wrong.
      "windows950": "cp950",
      "ms950": "cp950",
      "950": "cp950",
      "cp950": {
        type: "_dbcs",
        table: function() {
          return require_cp950();
        }
      },
      // Big5 has many variations and is an extension of cp950. We use Encoding Standard's as a consensus.
      "big5": "big5hkscs",
      "big5hkscs": {
        type: "_dbcs",
        table: function() {
          return require_cp950().concat(require_big5_added());
        },
        encodeSkipVals: [
          // Although Encoding Standard says we should avoid encoding to HKSCS area (See Step 1 of
          // https://encoding.spec.whatwg.org/#index-big5-pointer), we still do it to increase compatibility with ICU.
          // But if a single unicode point can be encoded both as HKSCS and regular Big5, we prefer the latter.
          36457,
          36463,
          36478,
          36523,
          36532,
          36557,
          36560,
          36695,
          36713,
          36718,
          36811,
          36862,
          36973,
          36986,
          37060,
          37084,
          37105,
          37311,
          37551,
          37552,
          37553,
          37554,
          37585,
          37959,
          38090,
          38361,
          38652,
          39285,
          39798,
          39800,
          39803,
          39878,
          39902,
          39916,
          39926,
          40002,
          40019,
          40034,
          40040,
          40043,
          40055,
          40124,
          40125,
          40144,
          40279,
          40282,
          40388,
          40431,
          40443,
          40617,
          40687,
          40701,
          40800,
          40907,
          41079,
          41180,
          41183,
          36812,
          37576,
          38468,
          38637,
          // Step 2 of https://encoding.spec.whatwg.org/#index-big5-pointer: Use last pointer for U+2550, U+255E, U+2561, U+256A, U+5341, or U+5345
          41636,
          41637,
          41639,
          41638,
          41676,
          41678
        ]
      },
      "cnbig5": "big5hkscs",
      "csbig5": "big5hkscs",
      "xxbig5": "big5hkscs"
    };
  }
});

// ../../../node_modules/encoding/node_modules/iconv-lite/encodings/index.js
var require_encodings = __commonJS({
  "../../../node_modules/encoding/node_modules/iconv-lite/encodings/index.js"(exports, module2) {
    "use strict";
    var modules = [
      require_internal(),
      require_utf32(),
      require_utf16(),
      require_utf7(),
      require_sbcs_codec(),
      require_sbcs_data(),
      require_sbcs_data_generated(),
      require_dbcs_codec(),
      require_dbcs_data()
    ];
    for (i = 0; i < modules.length; i++) {
      module2 = modules[i];
      for (enc in module2)
        if (Object.prototype.hasOwnProperty.call(module2, enc))
          exports[enc] = module2[enc];
    }
    var module2;
    var enc;
    var i;
  }
});

// ../../../node_modules/encoding/node_modules/iconv-lite/lib/streams.js
var require_streams = __commonJS({
  "../../../node_modules/encoding/node_modules/iconv-lite/lib/streams.js"(exports, module2) {
    "use strict";
    var Buffer2 = require_safer().Buffer;
    module2.exports = function(stream_module) {
      var Transform = stream_module.Transform;
      function IconvLiteEncoderStream(conv, options) {
        this.conv = conv;
        options = options || {};
        options.decodeStrings = false;
        Transform.call(this, options);
      }
      IconvLiteEncoderStream.prototype = Object.create(Transform.prototype, {
        constructor: { value: IconvLiteEncoderStream }
      });
      IconvLiteEncoderStream.prototype._transform = function(chunk, encoding, done) {
        if (typeof chunk != "string")
          return done(new Error("Iconv encoding stream needs strings as its input."));
        try {
          var res = this.conv.write(chunk);
          if (res && res.length)
            this.push(res);
          done();
        } catch (e) {
          done(e);
        }
      };
      IconvLiteEncoderStream.prototype._flush = function(done) {
        try {
          var res = this.conv.end();
          if (res && res.length)
            this.push(res);
          done();
        } catch (e) {
          done(e);
        }
      };
      IconvLiteEncoderStream.prototype.collect = function(cb) {
        var chunks = [];
        this.on("error", cb);
        this.on("data", function(chunk) {
          chunks.push(chunk);
        });
        this.on("end", function() {
          cb(null, Buffer2.concat(chunks));
        });
        return this;
      };
      function IconvLiteDecoderStream(conv, options) {
        this.conv = conv;
        options = options || {};
        options.encoding = this.encoding = "utf8";
        Transform.call(this, options);
      }
      IconvLiteDecoderStream.prototype = Object.create(Transform.prototype, {
        constructor: { value: IconvLiteDecoderStream }
      });
      IconvLiteDecoderStream.prototype._transform = function(chunk, encoding, done) {
        if (!Buffer2.isBuffer(chunk) && !(chunk instanceof Uint8Array))
          return done(new Error("Iconv decoding stream needs buffers as its input."));
        try {
          var res = this.conv.write(chunk);
          if (res && res.length)
            this.push(res, this.encoding);
          done();
        } catch (e) {
          done(e);
        }
      };
      IconvLiteDecoderStream.prototype._flush = function(done) {
        try {
          var res = this.conv.end();
          if (res && res.length)
            this.push(res, this.encoding);
          done();
        } catch (e) {
          done(e);
        }
      };
      IconvLiteDecoderStream.prototype.collect = function(cb) {
        var res = "";
        this.on("error", cb);
        this.on("data", function(chunk) {
          res += chunk;
        });
        this.on("end", function() {
          cb(null, res);
        });
        return this;
      };
      return {
        IconvLiteEncoderStream,
        IconvLiteDecoderStream
      };
    };
  }
});

// ../../../node_modules/encoding/node_modules/iconv-lite/lib/index.js
var require_lib2 = __commonJS({
  "../../../node_modules/encoding/node_modules/iconv-lite/lib/index.js"(exports, module2) {
    "use strict";
    var Buffer2 = require_safer().Buffer;
    var bomHandling = require_bom_handling();
    var iconv = module2.exports;
    iconv.encodings = null;
    iconv.defaultCharUnicode = "\uFFFD";
    iconv.defaultCharSingleByte = "?";
    iconv.encode = function encode(str, encoding, options) {
      str = "" + (str || "");
      var encoder = iconv.getEncoder(encoding, options);
      var res = encoder.write(str);
      var trail = encoder.end();
      return trail && trail.length > 0 ? Buffer2.concat([res, trail]) : res;
    };
    iconv.decode = function decode2(buf, encoding, options) {
      if (typeof buf === "string") {
        if (!iconv.skipDecodeWarning) {
          console.error("Iconv-lite warning: decode()-ing strings is deprecated. Refer to https://github.com/ashtuchkin/iconv-lite/wiki/Use-Buffers-when-decoding");
          iconv.skipDecodeWarning = true;
        }
        buf = Buffer2.from("" + (buf || ""), "binary");
      }
      var decoder = iconv.getDecoder(encoding, options);
      var res = decoder.write(buf);
      var trail = decoder.end();
      return trail ? res + trail : res;
    };
    iconv.encodingExists = function encodingExists(enc) {
      try {
        iconv.getCodec(enc);
        return true;
      } catch (e) {
        return false;
      }
    };
    iconv.toEncoding = iconv.encode;
    iconv.fromEncoding = iconv.decode;
    iconv._codecDataCache = {};
    iconv.getCodec = function getCodec(encoding) {
      if (!iconv.encodings)
        iconv.encodings = require_encodings();
      var enc = iconv._canonicalizeEncoding(encoding);
      var codecOptions = {};
      while (true) {
        var codec = iconv._codecDataCache[enc];
        if (codec)
          return codec;
        var codecDef = iconv.encodings[enc];
        switch (typeof codecDef) {
          case "string":
            enc = codecDef;
            break;
          case "object":
            for (var key in codecDef)
              codecOptions[key] = codecDef[key];
            if (!codecOptions.encodingName)
              codecOptions.encodingName = enc;
            enc = codecDef.type;
            break;
          case "function":
            if (!codecOptions.encodingName)
              codecOptions.encodingName = enc;
            codec = new codecDef(codecOptions, iconv);
            iconv._codecDataCache[codecOptions.encodingName] = codec;
            return codec;
          default:
            throw new Error("Encoding not recognized: '" + encoding + "' (searched as: '" + enc + "')");
        }
      }
    };
    iconv._canonicalizeEncoding = function(encoding) {
      return ("" + encoding).toLowerCase().replace(/:\d{4}$|[^0-9a-z]/g, "");
    };
    iconv.getEncoder = function getEncoder(encoding, options) {
      var codec = iconv.getCodec(encoding), encoder = new codec.encoder(options, codec);
      if (codec.bomAware && options && options.addBOM)
        encoder = new bomHandling.PrependBOM(encoder, options);
      return encoder;
    };
    iconv.getDecoder = function getDecoder(encoding, options) {
      var codec = iconv.getCodec(encoding), decoder = new codec.decoder(options, codec);
      if (codec.bomAware && !(options && options.stripBOM === false))
        decoder = new bomHandling.StripBOM(decoder, options);
      return decoder;
    };
    iconv.enableStreamingAPI = function enableStreamingAPI(stream_module2) {
      if (iconv.supportsStreams)
        return;
      var streams = require_streams()(stream_module2);
      iconv.IconvLiteEncoderStream = streams.IconvLiteEncoderStream;
      iconv.IconvLiteDecoderStream = streams.IconvLiteDecoderStream;
      iconv.encodeStream = function encodeStream(encoding, options) {
        return new iconv.IconvLiteEncoderStream(iconv.getEncoder(encoding, options), options);
      };
      iconv.decodeStream = function decodeStream(encoding, options) {
        return new iconv.IconvLiteDecoderStream(iconv.getDecoder(encoding, options), options);
      };
      iconv.supportsStreams = true;
    };
    var stream_module;
    try {
      stream_module = require("stream");
    } catch (e) {
    }
    if (stream_module && stream_module.Transform) {
      iconv.enableStreamingAPI(stream_module);
    } else {
      iconv.encodeStream = iconv.decodeStream = function() {
        throw new Error("iconv-lite Streaming API is not enabled. Use iconv.enableStreamingAPI(require('stream')); to enable it.");
      };
    }
    if (false) {
      console.error("iconv-lite warning: js files use non-utf8 encoding. See https://github.com/ashtuchkin/iconv-lite/wiki/Javascript-source-file-encodings for more info.");
    }
  }
});

// ../../../node_modules/encoding/lib/encoding.js
var require_encoding = __commonJS({
  "../../../node_modules/encoding/lib/encoding.js"(exports, module2) {
    "use strict";
    var iconvLite = require_lib2();
    module2.exports.convert = convert;
    function convert(str, to, from) {
      from = checkEncoding(from || "UTF-8");
      to = checkEncoding(to || "UTF-8");
      str = str || "";
      var result;
      if (from !== "UTF-8" && typeof str === "string") {
        str = Buffer.from(str, "binary");
      }
      if (from === to) {
        if (typeof str === "string") {
          result = Buffer.from(str);
        } else {
          result = str;
        }
      } else {
        try {
          result = convertIconvLite(str, to, from);
        } catch (E) {
          console.error(E);
          result = str;
        }
      }
      if (typeof result === "string") {
        result = Buffer.from(result, "utf-8");
      }
      return result;
    }
    function convertIconvLite(str, to, from) {
      if (to === "UTF-8") {
        return iconvLite.decode(str, from);
      } else if (from === "UTF-8") {
        return iconvLite.encode(str, to);
      } else {
        return iconvLite.encode(iconvLite.decode(str, from), to);
      }
    }
    function checkEncoding(name) {
      return (name || "").toString().trim().replace(/^latin[\-_]?(\d+)$/i, "ISO-8859-$1").replace(/^win(?:dows)?[\-_]?(\d+)$/i, "WINDOWS-$1").replace(/^utf[\-_]?(\d+)$/i, "UTF-$1").replace(/^ks_c_5601\-1987$/i, "CP949").replace(/^us[\-_]?ascii$/i, "ASCII").toUpperCase();
    }
  }
});

// ../../../node_modules/node-fetch/lib/index.js
var require_lib3 = __commonJS({
  "../../../node_modules/node-fetch/lib/index.js"(exports, module2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function _interopDefault(ex) {
      return ex && typeof ex === "object" && "default" in ex ? ex["default"] : ex;
    }
    var Stream = _interopDefault(require("stream"));
    var http = _interopDefault(require("http"));
    var Url = _interopDefault(require("url"));
    var whatwgUrl = _interopDefault(require_public_api());
    var https2 = _interopDefault(require("https"));
    var zlib = _interopDefault(require("zlib"));
    var Readable = Stream.Readable;
    var BUFFER = Symbol("buffer");
    var TYPE = Symbol("type");
    var Blob = class {
      constructor() {
        this[TYPE] = "";
        const blobParts = arguments[0];
        const options = arguments[1];
        const buffers = [];
        let size = 0;
        if (blobParts) {
          const a = blobParts;
          const length = Number(a.length);
          for (let i = 0; i < length; i++) {
            const element = a[i];
            let buffer;
            if (element instanceof Buffer) {
              buffer = element;
            } else if (ArrayBuffer.isView(element)) {
              buffer = Buffer.from(element.buffer, element.byteOffset, element.byteLength);
            } else if (element instanceof ArrayBuffer) {
              buffer = Buffer.from(element);
            } else if (element instanceof Blob) {
              buffer = element[BUFFER];
            } else {
              buffer = Buffer.from(typeof element === "string" ? element : String(element));
            }
            size += buffer.length;
            buffers.push(buffer);
          }
        }
        this[BUFFER] = Buffer.concat(buffers);
        let type = options && options.type !== void 0 && String(options.type).toLowerCase();
        if (type && !/[^\u0020-\u007E]/.test(type)) {
          this[TYPE] = type;
        }
      }
      get size() {
        return this[BUFFER].length;
      }
      get type() {
        return this[TYPE];
      }
      text() {
        return Promise.resolve(this[BUFFER].toString());
      }
      arrayBuffer() {
        const buf = this[BUFFER];
        const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
        return Promise.resolve(ab);
      }
      stream() {
        const readable = new Readable();
        readable._read = function() {
        };
        readable.push(this[BUFFER]);
        readable.push(null);
        return readable;
      }
      toString() {
        return "[object Blob]";
      }
      slice() {
        const size = this.size;
        const start = arguments[0];
        const end = arguments[1];
        let relativeStart, relativeEnd;
        if (start === void 0) {
          relativeStart = 0;
        } else if (start < 0) {
          relativeStart = Math.max(size + start, 0);
        } else {
          relativeStart = Math.min(start, size);
        }
        if (end === void 0) {
          relativeEnd = size;
        } else if (end < 0) {
          relativeEnd = Math.max(size + end, 0);
        } else {
          relativeEnd = Math.min(end, size);
        }
        const span = Math.max(relativeEnd - relativeStart, 0);
        const buffer = this[BUFFER];
        const slicedBuffer = buffer.slice(relativeStart, relativeStart + span);
        const blob = new Blob([], { type: arguments[2] });
        blob[BUFFER] = slicedBuffer;
        return blob;
      }
    };
    Object.defineProperties(Blob.prototype, {
      size: { enumerable: true },
      type: { enumerable: true },
      slice: { enumerable: true }
    });
    Object.defineProperty(Blob.prototype, Symbol.toStringTag, {
      value: "Blob",
      writable: false,
      enumerable: false,
      configurable: true
    });
    function FetchError(message, type, systemError) {
      Error.call(this, message);
      this.message = message;
      this.type = type;
      if (systemError) {
        this.code = this.errno = systemError.code;
      }
      Error.captureStackTrace(this, this.constructor);
    }
    FetchError.prototype = Object.create(Error.prototype);
    FetchError.prototype.constructor = FetchError;
    FetchError.prototype.name = "FetchError";
    var convert;
    try {
      convert = require_encoding().convert;
    } catch (e) {
    }
    var INTERNALS = Symbol("Body internals");
    var PassThrough = Stream.PassThrough;
    function Body(body) {
      var _this = this;
      var _ref = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, _ref$size = _ref.size;
      let size = _ref$size === void 0 ? 0 : _ref$size;
      var _ref$timeout = _ref.timeout;
      let timeout = _ref$timeout === void 0 ? 0 : _ref$timeout;
      if (body == null) {
        body = null;
      } else if (isURLSearchParams(body)) {
        body = Buffer.from(body.toString());
      } else if (isBlob(body))
        ;
      else if (Buffer.isBuffer(body))
        ;
      else if (Object.prototype.toString.call(body) === "[object ArrayBuffer]") {
        body = Buffer.from(body);
      } else if (ArrayBuffer.isView(body)) {
        body = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
      } else if (body instanceof Stream)
        ;
      else {
        body = Buffer.from(String(body));
      }
      this[INTERNALS] = {
        body,
        disturbed: false,
        error: null
      };
      this.size = size;
      this.timeout = timeout;
      if (body instanceof Stream) {
        body.on("error", function(err) {
          const error = err.name === "AbortError" ? err : new FetchError(`Invalid response body while trying to fetch ${_this.url}: ${err.message}`, "system", err);
          _this[INTERNALS].error = error;
        });
      }
    }
    Body.prototype = {
      get body() {
        return this[INTERNALS].body;
      },
      get bodyUsed() {
        return this[INTERNALS].disturbed;
      },
      /**
       * Decode response as ArrayBuffer
       *
       * @return  Promise
       */
      arrayBuffer() {
        return consumeBody.call(this).then(function(buf) {
          return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
        });
      },
      /**
       * Return raw response as Blob
       *
       * @return Promise
       */
      blob() {
        let ct = this.headers && this.headers.get("content-type") || "";
        return consumeBody.call(this).then(function(buf) {
          return Object.assign(
            // Prevent copying
            new Blob([], {
              type: ct.toLowerCase()
            }),
            {
              [BUFFER]: buf
            }
          );
        });
      },
      /**
       * Decode response as json
       *
       * @return  Promise
       */
      json() {
        var _this2 = this;
        return consumeBody.call(this).then(function(buffer) {
          try {
            return JSON.parse(buffer.toString());
          } catch (err) {
            return Body.Promise.reject(new FetchError(`invalid json response body at ${_this2.url} reason: ${err.message}`, "invalid-json"));
          }
        });
      },
      /**
       * Decode response as text
       *
       * @return  Promise
       */
      text() {
        return consumeBody.call(this).then(function(buffer) {
          return buffer.toString();
        });
      },
      /**
       * Decode response as buffer (non-spec api)
       *
       * @return  Promise
       */
      buffer() {
        return consumeBody.call(this);
      },
      /**
       * Decode response as text, while automatically detecting the encoding and
       * trying to decode to UTF-8 (non-spec api)
       *
       * @return  Promise
       */
      textConverted() {
        var _this3 = this;
        return consumeBody.call(this).then(function(buffer) {
          return convertBody(buffer, _this3.headers);
        });
      }
    };
    Object.defineProperties(Body.prototype, {
      body: { enumerable: true },
      bodyUsed: { enumerable: true },
      arrayBuffer: { enumerable: true },
      blob: { enumerable: true },
      json: { enumerable: true },
      text: { enumerable: true }
    });
    Body.mixIn = function(proto) {
      for (const name of Object.getOwnPropertyNames(Body.prototype)) {
        if (!(name in proto)) {
          const desc = Object.getOwnPropertyDescriptor(Body.prototype, name);
          Object.defineProperty(proto, name, desc);
        }
      }
    };
    function consumeBody() {
      var _this4 = this;
      if (this[INTERNALS].disturbed) {
        return Body.Promise.reject(new TypeError(`body used already for: ${this.url}`));
      }
      this[INTERNALS].disturbed = true;
      if (this[INTERNALS].error) {
        return Body.Promise.reject(this[INTERNALS].error);
      }
      let body = this.body;
      if (body === null) {
        return Body.Promise.resolve(Buffer.alloc(0));
      }
      if (isBlob(body)) {
        body = body.stream();
      }
      if (Buffer.isBuffer(body)) {
        return Body.Promise.resolve(body);
      }
      if (!(body instanceof Stream)) {
        return Body.Promise.resolve(Buffer.alloc(0));
      }
      let accum = [];
      let accumBytes = 0;
      let abort = false;
      return new Body.Promise(function(resolve, reject) {
        let resTimeout;
        if (_this4.timeout) {
          resTimeout = setTimeout(function() {
            abort = true;
            reject(new FetchError(`Response timeout while trying to fetch ${_this4.url} (over ${_this4.timeout}ms)`, "body-timeout"));
          }, _this4.timeout);
        }
        body.on("error", function(err) {
          if (err.name === "AbortError") {
            abort = true;
            reject(err);
          } else {
            reject(new FetchError(`Invalid response body while trying to fetch ${_this4.url}: ${err.message}`, "system", err));
          }
        });
        body.on("data", function(chunk) {
          if (abort || chunk === null) {
            return;
          }
          if (_this4.size && accumBytes + chunk.length > _this4.size) {
            abort = true;
            reject(new FetchError(`content size at ${_this4.url} over limit: ${_this4.size}`, "max-size"));
            return;
          }
          accumBytes += chunk.length;
          accum.push(chunk);
        });
        body.on("end", function() {
          if (abort) {
            return;
          }
          clearTimeout(resTimeout);
          try {
            resolve(Buffer.concat(accum, accumBytes));
          } catch (err) {
            reject(new FetchError(`Could not create Buffer from response body for ${_this4.url}: ${err.message}`, "system", err));
          }
        });
      });
    }
    function convertBody(buffer, headers) {
      if (typeof convert !== "function") {
        throw new Error("The package `encoding` must be installed to use the textConverted() function");
      }
      const ct = headers.get("content-type");
      let charset = "utf-8";
      let res, str;
      if (ct) {
        res = /charset=([^;]*)/i.exec(ct);
      }
      str = buffer.slice(0, 1024).toString();
      if (!res && str) {
        res = /<meta.+?charset=(['"])(.+?)\1/i.exec(str);
      }
      if (!res && str) {
        res = /<meta[\s]+?http-equiv=(['"])content-type\1[\s]+?content=(['"])(.+?)\2/i.exec(str);
        if (!res) {
          res = /<meta[\s]+?content=(['"])(.+?)\1[\s]+?http-equiv=(['"])content-type\3/i.exec(str);
          if (res) {
            res.pop();
          }
        }
        if (res) {
          res = /charset=(.*)/i.exec(res.pop());
        }
      }
      if (!res && str) {
        res = /<\?xml.+?encoding=(['"])(.+?)\1/i.exec(str);
      }
      if (res) {
        charset = res.pop();
        if (charset === "gb2312" || charset === "gbk") {
          charset = "gb18030";
        }
      }
      return convert(buffer, "UTF-8", charset).toString();
    }
    function isURLSearchParams(obj) {
      if (typeof obj !== "object" || typeof obj.append !== "function" || typeof obj.delete !== "function" || typeof obj.get !== "function" || typeof obj.getAll !== "function" || typeof obj.has !== "function" || typeof obj.set !== "function") {
        return false;
      }
      return obj.constructor.name === "URLSearchParams" || Object.prototype.toString.call(obj) === "[object URLSearchParams]" || typeof obj.sort === "function";
    }
    function isBlob(obj) {
      return typeof obj === "object" && typeof obj.arrayBuffer === "function" && typeof obj.type === "string" && typeof obj.stream === "function" && typeof obj.constructor === "function" && typeof obj.constructor.name === "string" && /^(Blob|File)$/.test(obj.constructor.name) && /^(Blob|File)$/.test(obj[Symbol.toStringTag]);
    }
    function clone(instance) {
      let p1, p2;
      let body = instance.body;
      if (instance.bodyUsed) {
        throw new Error("cannot clone body after it is used");
      }
      if (body instanceof Stream && typeof body.getBoundary !== "function") {
        p1 = new PassThrough();
        p2 = new PassThrough();
        body.pipe(p1);
        body.pipe(p2);
        instance[INTERNALS].body = p1;
        body = p2;
      }
      return body;
    }
    function extractContentType(body) {
      if (body === null) {
        return null;
      } else if (typeof body === "string") {
        return "text/plain;charset=UTF-8";
      } else if (isURLSearchParams(body)) {
        return "application/x-www-form-urlencoded;charset=UTF-8";
      } else if (isBlob(body)) {
        return body.type || null;
      } else if (Buffer.isBuffer(body)) {
        return null;
      } else if (Object.prototype.toString.call(body) === "[object ArrayBuffer]") {
        return null;
      } else if (ArrayBuffer.isView(body)) {
        return null;
      } else if (typeof body.getBoundary === "function") {
        return `multipart/form-data;boundary=${body.getBoundary()}`;
      } else if (body instanceof Stream) {
        return null;
      } else {
        return "text/plain;charset=UTF-8";
      }
    }
    function getTotalBytes(instance) {
      const body = instance.body;
      if (body === null) {
        return 0;
      } else if (isBlob(body)) {
        return body.size;
      } else if (Buffer.isBuffer(body)) {
        return body.length;
      } else if (body && typeof body.getLengthSync === "function") {
        if (body._lengthRetrievers && body._lengthRetrievers.length == 0 || // 1.x
        body.hasKnownLength && body.hasKnownLength()) {
          return body.getLengthSync();
        }
        return null;
      } else {
        return null;
      }
    }
    function writeToStream(dest, instance) {
      const body = instance.body;
      if (body === null) {
        dest.end();
      } else if (isBlob(body)) {
        body.stream().pipe(dest);
      } else if (Buffer.isBuffer(body)) {
        dest.write(body);
        dest.end();
      } else {
        body.pipe(dest);
      }
    }
    Body.Promise = global.Promise;
    var invalidTokenRegex = /[^\^_`a-zA-Z\-0-9!#$%&'*+.|~]/;
    var invalidHeaderCharRegex = /[^\t\x20-\x7e\x80-\xff]/;
    function validateName(name) {
      name = `${name}`;
      if (invalidTokenRegex.test(name) || name === "") {
        throw new TypeError(`${name} is not a legal HTTP header name`);
      }
    }
    function validateValue(value) {
      value = `${value}`;
      if (invalidHeaderCharRegex.test(value)) {
        throw new TypeError(`${value} is not a legal HTTP header value`);
      }
    }
    function find(map, name) {
      name = name.toLowerCase();
      for (const key in map) {
        if (key.toLowerCase() === name) {
          return key;
        }
      }
      return void 0;
    }
    var MAP = Symbol("map");
    var Headers = class {
      /**
       * Headers class
       *
       * @param   Object  headers  Response headers
       * @return  Void
       */
      constructor() {
        let init = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : void 0;
        this[MAP] = /* @__PURE__ */ Object.create(null);
        if (init instanceof Headers) {
          const rawHeaders = init.raw();
          const headerNames = Object.keys(rawHeaders);
          for (const headerName of headerNames) {
            for (const value of rawHeaders[headerName]) {
              this.append(headerName, value);
            }
          }
          return;
        }
        if (init == null)
          ;
        else if (typeof init === "object") {
          const method = init[Symbol.iterator];
          if (method != null) {
            if (typeof method !== "function") {
              throw new TypeError("Header pairs must be iterable");
            }
            const pairs = [];
            for (const pair of init) {
              if (typeof pair !== "object" || typeof pair[Symbol.iterator] !== "function") {
                throw new TypeError("Each header pair must be iterable");
              }
              pairs.push(Array.from(pair));
            }
            for (const pair of pairs) {
              if (pair.length !== 2) {
                throw new TypeError("Each header pair must be a name/value tuple");
              }
              this.append(pair[0], pair[1]);
            }
          } else {
            for (const key of Object.keys(init)) {
              const value = init[key];
              this.append(key, value);
            }
          }
        } else {
          throw new TypeError("Provided initializer must be an object");
        }
      }
      /**
       * Return combined header value given name
       *
       * @param   String  name  Header name
       * @return  Mixed
       */
      get(name) {
        name = `${name}`;
        validateName(name);
        const key = find(this[MAP], name);
        if (key === void 0) {
          return null;
        }
        return this[MAP][key].join(", ");
      }
      /**
       * Iterate over all headers
       *
       * @param   Function  callback  Executed for each item with parameters (value, name, thisArg)
       * @param   Boolean   thisArg   `this` context for callback function
       * @return  Void
       */
      forEach(callback) {
        let thisArg = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : void 0;
        let pairs = getHeaders(this);
        let i = 0;
        while (i < pairs.length) {
          var _pairs$i = pairs[i];
          const name = _pairs$i[0], value = _pairs$i[1];
          callback.call(thisArg, value, name, this);
          pairs = getHeaders(this);
          i++;
        }
      }
      /**
       * Overwrite header values given name
       *
       * @param   String  name   Header name
       * @param   String  value  Header value
       * @return  Void
       */
      set(name, value) {
        name = `${name}`;
        value = `${value}`;
        validateName(name);
        validateValue(value);
        const key = find(this[MAP], name);
        this[MAP][key !== void 0 ? key : name] = [value];
      }
      /**
       * Append a value onto existing header
       *
       * @param   String  name   Header name
       * @param   String  value  Header value
       * @return  Void
       */
      append(name, value) {
        name = `${name}`;
        value = `${value}`;
        validateName(name);
        validateValue(value);
        const key = find(this[MAP], name);
        if (key !== void 0) {
          this[MAP][key].push(value);
        } else {
          this[MAP][name] = [value];
        }
      }
      /**
       * Check for header name existence
       *
       * @param   String   name  Header name
       * @return  Boolean
       */
      has(name) {
        name = `${name}`;
        validateName(name);
        return find(this[MAP], name) !== void 0;
      }
      /**
       * Delete all header values given name
       *
       * @param   String  name  Header name
       * @return  Void
       */
      delete(name) {
        name = `${name}`;
        validateName(name);
        const key = find(this[MAP], name);
        if (key !== void 0) {
          delete this[MAP][key];
        }
      }
      /**
       * Return raw headers (non-spec api)
       *
       * @return  Object
       */
      raw() {
        return this[MAP];
      }
      /**
       * Get an iterator on keys.
       *
       * @return  Iterator
       */
      keys() {
        return createHeadersIterator(this, "key");
      }
      /**
       * Get an iterator on values.
       *
       * @return  Iterator
       */
      values() {
        return createHeadersIterator(this, "value");
      }
      /**
       * Get an iterator on entries.
       *
       * This is the default iterator of the Headers object.
       *
       * @return  Iterator
       */
      [Symbol.iterator]() {
        return createHeadersIterator(this, "key+value");
      }
    };
    Headers.prototype.entries = Headers.prototype[Symbol.iterator];
    Object.defineProperty(Headers.prototype, Symbol.toStringTag, {
      value: "Headers",
      writable: false,
      enumerable: false,
      configurable: true
    });
    Object.defineProperties(Headers.prototype, {
      get: { enumerable: true },
      forEach: { enumerable: true },
      set: { enumerable: true },
      append: { enumerable: true },
      has: { enumerable: true },
      delete: { enumerable: true },
      keys: { enumerable: true },
      values: { enumerable: true },
      entries: { enumerable: true }
    });
    function getHeaders(headers) {
      let kind = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "key+value";
      const keys = Object.keys(headers[MAP]).sort();
      return keys.map(kind === "key" ? function(k) {
        return k.toLowerCase();
      } : kind === "value" ? function(k) {
        return headers[MAP][k].join(", ");
      } : function(k) {
        return [k.toLowerCase(), headers[MAP][k].join(", ")];
      });
    }
    var INTERNAL = Symbol("internal");
    function createHeadersIterator(target, kind) {
      const iterator = Object.create(HeadersIteratorPrototype);
      iterator[INTERNAL] = {
        target,
        kind,
        index: 0
      };
      return iterator;
    }
    var HeadersIteratorPrototype = Object.setPrototypeOf({
      next() {
        if (!this || Object.getPrototypeOf(this) !== HeadersIteratorPrototype) {
          throw new TypeError("Value of `this` is not a HeadersIterator");
        }
        var _INTERNAL = this[INTERNAL];
        const target = _INTERNAL.target, kind = _INTERNAL.kind, index = _INTERNAL.index;
        const values = getHeaders(target, kind);
        const len = values.length;
        if (index >= len) {
          return {
            value: void 0,
            done: true
          };
        }
        this[INTERNAL].index = index + 1;
        return {
          value: values[index],
          done: false
        };
      }
    }, Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]())));
    Object.defineProperty(HeadersIteratorPrototype, Symbol.toStringTag, {
      value: "HeadersIterator",
      writable: false,
      enumerable: false,
      configurable: true
    });
    function exportNodeCompatibleHeaders(headers) {
      const obj = Object.assign({ __proto__: null }, headers[MAP]);
      const hostHeaderKey = find(headers[MAP], "Host");
      if (hostHeaderKey !== void 0) {
        obj[hostHeaderKey] = obj[hostHeaderKey][0];
      }
      return obj;
    }
    function createHeadersLenient(obj) {
      const headers = new Headers();
      for (const name of Object.keys(obj)) {
        if (invalidTokenRegex.test(name)) {
          continue;
        }
        if (Array.isArray(obj[name])) {
          for (const val of obj[name]) {
            if (invalidHeaderCharRegex.test(val)) {
              continue;
            }
            if (headers[MAP][name] === void 0) {
              headers[MAP][name] = [val];
            } else {
              headers[MAP][name].push(val);
            }
          }
        } else if (!invalidHeaderCharRegex.test(obj[name])) {
          headers[MAP][name] = [obj[name]];
        }
      }
      return headers;
    }
    var INTERNALS$1 = Symbol("Response internals");
    var STATUS_CODES = http.STATUS_CODES;
    var Response2 = class {
      constructor() {
        let body = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : null;
        let opts = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        Body.call(this, body, opts);
        const status = opts.status || 200;
        const headers = new Headers(opts.headers);
        if (body != null && !headers.has("Content-Type")) {
          const contentType = extractContentType(body);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        this[INTERNALS$1] = {
          url: opts.url,
          status,
          statusText: opts.statusText || STATUS_CODES[status],
          headers,
          counter: opts.counter
        };
      }
      get url() {
        return this[INTERNALS$1].url || "";
      }
      get status() {
        return this[INTERNALS$1].status;
      }
      /**
       * Convenience property representing if the request ended normally
       */
      get ok() {
        return this[INTERNALS$1].status >= 200 && this[INTERNALS$1].status < 300;
      }
      get redirected() {
        return this[INTERNALS$1].counter > 0;
      }
      get statusText() {
        return this[INTERNALS$1].statusText;
      }
      get headers() {
        return this[INTERNALS$1].headers;
      }
      /**
       * Clone this response
       *
       * @return  Response
       */
      clone() {
        return new Response2(clone(this), {
          url: this.url,
          status: this.status,
          statusText: this.statusText,
          headers: this.headers,
          ok: this.ok,
          redirected: this.redirected
        });
      }
    };
    Body.mixIn(Response2.prototype);
    Object.defineProperties(Response2.prototype, {
      url: { enumerable: true },
      status: { enumerable: true },
      ok: { enumerable: true },
      redirected: { enumerable: true },
      statusText: { enumerable: true },
      headers: { enumerable: true },
      clone: { enumerable: true }
    });
    Object.defineProperty(Response2.prototype, Symbol.toStringTag, {
      value: "Response",
      writable: false,
      enumerable: false,
      configurable: true
    });
    var INTERNALS$2 = Symbol("Request internals");
    var URL = Url.URL || whatwgUrl.URL;
    var parse_url = Url.parse;
    var format_url = Url.format;
    function parseURL(urlStr) {
      if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.exec(urlStr)) {
        urlStr = new URL(urlStr).toString();
      }
      return parse_url(urlStr);
    }
    var streamDestructionSupported = "destroy" in Stream.Readable.prototype;
    function isRequest(input) {
      return typeof input === "object" && typeof input[INTERNALS$2] === "object";
    }
    function isAbortSignal(signal) {
      const proto = signal && typeof signal === "object" && Object.getPrototypeOf(signal);
      return !!(proto && proto.constructor.name === "AbortSignal");
    }
    var Request = class {
      constructor(input) {
        let init = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        let parsedURL;
        if (!isRequest(input)) {
          if (input && input.href) {
            parsedURL = parseURL(input.href);
          } else {
            parsedURL = parseURL(`${input}`);
          }
          input = {};
        } else {
          parsedURL = parseURL(input.url);
        }
        let method = init.method || input.method || "GET";
        method = method.toUpperCase();
        if ((init.body != null || isRequest(input) && input.body !== null) && (method === "GET" || method === "HEAD")) {
          throw new TypeError("Request with GET/HEAD method cannot have body");
        }
        let inputBody = init.body != null ? init.body : isRequest(input) && input.body !== null ? clone(input) : null;
        Body.call(this, inputBody, {
          timeout: init.timeout || input.timeout || 0,
          size: init.size || input.size || 0
        });
        const headers = new Headers(init.headers || input.headers || {});
        if (inputBody != null && !headers.has("Content-Type")) {
          const contentType = extractContentType(inputBody);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        let signal = isRequest(input) ? input.signal : null;
        if ("signal" in init)
          signal = init.signal;
        if (signal != null && !isAbortSignal(signal)) {
          throw new TypeError("Expected signal to be an instanceof AbortSignal");
        }
        this[INTERNALS$2] = {
          method,
          redirect: init.redirect || input.redirect || "follow",
          headers,
          parsedURL,
          signal
        };
        this.follow = init.follow !== void 0 ? init.follow : input.follow !== void 0 ? input.follow : 20;
        this.compress = init.compress !== void 0 ? init.compress : input.compress !== void 0 ? input.compress : true;
        this.counter = init.counter || input.counter || 0;
        this.agent = init.agent || input.agent;
      }
      get method() {
        return this[INTERNALS$2].method;
      }
      get url() {
        return format_url(this[INTERNALS$2].parsedURL);
      }
      get headers() {
        return this[INTERNALS$2].headers;
      }
      get redirect() {
        return this[INTERNALS$2].redirect;
      }
      get signal() {
        return this[INTERNALS$2].signal;
      }
      /**
       * Clone this request
       *
       * @return  Request
       */
      clone() {
        return new Request(this);
      }
    };
    Body.mixIn(Request.prototype);
    Object.defineProperty(Request.prototype, Symbol.toStringTag, {
      value: "Request",
      writable: false,
      enumerable: false,
      configurable: true
    });
    Object.defineProperties(Request.prototype, {
      method: { enumerable: true },
      url: { enumerable: true },
      headers: { enumerable: true },
      redirect: { enumerable: true },
      clone: { enumerable: true },
      signal: { enumerable: true }
    });
    function getNodeRequestOptions(request2) {
      const parsedURL = request2[INTERNALS$2].parsedURL;
      const headers = new Headers(request2[INTERNALS$2].headers);
      if (!headers.has("Accept")) {
        headers.set("Accept", "*/*");
      }
      if (!parsedURL.protocol || !parsedURL.hostname) {
        throw new TypeError("Only absolute URLs are supported");
      }
      if (!/^https?:$/.test(parsedURL.protocol)) {
        throw new TypeError("Only HTTP(S) protocols are supported");
      }
      if (request2.signal && request2.body instanceof Stream.Readable && !streamDestructionSupported) {
        throw new Error("Cancellation of streamed requests with AbortSignal is not supported in node < 8");
      }
      let contentLengthValue = null;
      if (request2.body == null && /^(POST|PUT)$/i.test(request2.method)) {
        contentLengthValue = "0";
      }
      if (request2.body != null) {
        const totalBytes = getTotalBytes(request2);
        if (typeof totalBytes === "number") {
          contentLengthValue = String(totalBytes);
        }
      }
      if (contentLengthValue) {
        headers.set("Content-Length", contentLengthValue);
      }
      if (!headers.has("User-Agent")) {
        headers.set("User-Agent", "node-fetch/1.0 (+https://github.com/bitinn/node-fetch)");
      }
      if (request2.compress && !headers.has("Accept-Encoding")) {
        headers.set("Accept-Encoding", "gzip,deflate");
      }
      let agent = request2.agent;
      if (typeof agent === "function") {
        agent = agent(parsedURL);
      }
      if (!headers.has("Connection") && !agent) {
        headers.set("Connection", "close");
      }
      return Object.assign({}, parsedURL, {
        method: request2.method,
        headers: exportNodeCompatibleHeaders(headers),
        agent
      });
    }
    function AbortError(message) {
      Error.call(this, message);
      this.type = "aborted";
      this.message = message;
      Error.captureStackTrace(this, this.constructor);
    }
    AbortError.prototype = Object.create(Error.prototype);
    AbortError.prototype.constructor = AbortError;
    AbortError.prototype.name = "AbortError";
    var URL$1 = Url.URL || whatwgUrl.URL;
    var PassThrough$1 = Stream.PassThrough;
    var isDomainOrSubdomain = function isDomainOrSubdomain2(destination, original) {
      const orig = new URL$1(original).hostname;
      const dest = new URL$1(destination).hostname;
      return orig === dest || orig[orig.length - dest.length - 1] === "." && orig.endsWith(dest);
    };
    var isSameProtocol = function isSameProtocol2(destination, original) {
      const orig = new URL$1(original).protocol;
      const dest = new URL$1(destination).protocol;
      return orig === dest;
    };
    function fetch2(url2, opts) {
      if (!fetch2.Promise) {
        throw new Error("native promise missing, set fetch.Promise to your favorite alternative");
      }
      Body.Promise = fetch2.Promise;
      return new fetch2.Promise(function(resolve, reject) {
        const request2 = new Request(url2, opts);
        const options = getNodeRequestOptions(request2);
        const send = (options.protocol === "https:" ? https2 : http).request;
        const signal = request2.signal;
        let response = null;
        const abort = function abort2() {
          let error = new AbortError("The user aborted a request.");
          reject(error);
          if (request2.body && request2.body instanceof Stream.Readable) {
            destroyStream(request2.body, error);
          }
          if (!response || !response.body)
            return;
          response.body.emit("error", error);
        };
        if (signal && signal.aborted) {
          abort();
          return;
        }
        const abortAndFinalize = function abortAndFinalize2() {
          abort();
          finalize();
        };
        const req = send(options);
        let reqTimeout;
        if (signal) {
          signal.addEventListener("abort", abortAndFinalize);
        }
        function finalize() {
          req.abort();
          if (signal)
            signal.removeEventListener("abort", abortAndFinalize);
          clearTimeout(reqTimeout);
        }
        if (request2.timeout) {
          req.once("socket", function(socket) {
            reqTimeout = setTimeout(function() {
              reject(new FetchError(`network timeout at: ${request2.url}`, "request-timeout"));
              finalize();
            }, request2.timeout);
          });
        }
        req.on("error", function(err) {
          reject(new FetchError(`request to ${request2.url} failed, reason: ${err.message}`, "system", err));
          if (response && response.body) {
            destroyStream(response.body, err);
          }
          finalize();
        });
        fixResponseChunkedTransferBadEnding(req, function(err) {
          if (signal && signal.aborted) {
            return;
          }
          if (response && response.body) {
            destroyStream(response.body, err);
          }
        });
        if (parseInt(process.version.substring(1)) < 14) {
          req.on("socket", function(s) {
            s.addListener("close", function(hadError) {
              const hasDataListener = s.listenerCount("data") > 0;
              if (response && hasDataListener && !hadError && !(signal && signal.aborted)) {
                const err = new Error("Premature close");
                err.code = "ERR_STREAM_PREMATURE_CLOSE";
                response.body.emit("error", err);
              }
            });
          });
        }
        req.on("response", function(res) {
          clearTimeout(reqTimeout);
          const headers = createHeadersLenient(res.headers);
          if (fetch2.isRedirect(res.statusCode)) {
            const location = headers.get("Location");
            let locationURL = null;
            try {
              locationURL = location === null ? null : new URL$1(location, request2.url).toString();
            } catch (err) {
              if (request2.redirect !== "manual") {
                reject(new FetchError(`uri requested responds with an invalid redirect URL: ${location}`, "invalid-redirect"));
                finalize();
                return;
              }
            }
            switch (request2.redirect) {
              case "error":
                reject(new FetchError(`uri requested responds with a redirect, redirect mode is set to error: ${request2.url}`, "no-redirect"));
                finalize();
                return;
              case "manual":
                if (locationURL !== null) {
                  try {
                    headers.set("Location", locationURL);
                  } catch (err) {
                    reject(err);
                  }
                }
                break;
              case "follow":
                if (locationURL === null) {
                  break;
                }
                if (request2.counter >= request2.follow) {
                  reject(new FetchError(`maximum redirect reached at: ${request2.url}`, "max-redirect"));
                  finalize();
                  return;
                }
                const requestOpts = {
                  headers: new Headers(request2.headers),
                  follow: request2.follow,
                  counter: request2.counter + 1,
                  agent: request2.agent,
                  compress: request2.compress,
                  method: request2.method,
                  body: request2.body,
                  signal: request2.signal,
                  timeout: request2.timeout,
                  size: request2.size
                };
                if (!isDomainOrSubdomain(request2.url, locationURL) || !isSameProtocol(request2.url, locationURL)) {
                  for (const name of ["authorization", "www-authenticate", "cookie", "cookie2"]) {
                    requestOpts.headers.delete(name);
                  }
                }
                if (res.statusCode !== 303 && request2.body && getTotalBytes(request2) === null) {
                  reject(new FetchError("Cannot follow redirect with body being a readable stream", "unsupported-redirect"));
                  finalize();
                  return;
                }
                if (res.statusCode === 303 || (res.statusCode === 301 || res.statusCode === 302) && request2.method === "POST") {
                  requestOpts.method = "GET";
                  requestOpts.body = void 0;
                  requestOpts.headers.delete("content-length");
                }
                resolve(fetch2(new Request(locationURL, requestOpts)));
                finalize();
                return;
            }
          }
          res.once("end", function() {
            if (signal)
              signal.removeEventListener("abort", abortAndFinalize);
          });
          let body = res.pipe(new PassThrough$1());
          const response_options = {
            url: request2.url,
            status: res.statusCode,
            statusText: res.statusMessage,
            headers,
            size: request2.size,
            timeout: request2.timeout,
            counter: request2.counter
          };
          const codings = headers.get("Content-Encoding");
          if (!request2.compress || request2.method === "HEAD" || codings === null || res.statusCode === 204 || res.statusCode === 304) {
            response = new Response2(body, response_options);
            resolve(response);
            return;
          }
          const zlibOptions = {
            flush: zlib.Z_SYNC_FLUSH,
            finishFlush: zlib.Z_SYNC_FLUSH
          };
          if (codings == "gzip" || codings == "x-gzip") {
            body = body.pipe(zlib.createGunzip(zlibOptions));
            response = new Response2(body, response_options);
            resolve(response);
            return;
          }
          if (codings == "deflate" || codings == "x-deflate") {
            const raw = res.pipe(new PassThrough$1());
            raw.once("data", function(chunk) {
              if ((chunk[0] & 15) === 8) {
                body = body.pipe(zlib.createInflate());
              } else {
                body = body.pipe(zlib.createInflateRaw());
              }
              response = new Response2(body, response_options);
              resolve(response);
            });
            raw.on("end", function() {
              if (!response) {
                response = new Response2(body, response_options);
                resolve(response);
              }
            });
            return;
          }
          if (codings == "br" && typeof zlib.createBrotliDecompress === "function") {
            body = body.pipe(zlib.createBrotliDecompress());
            response = new Response2(body, response_options);
            resolve(response);
            return;
          }
          response = new Response2(body, response_options);
          resolve(response);
        });
        writeToStream(req, request2);
      });
    }
    function fixResponseChunkedTransferBadEnding(request2, errorCallback) {
      let socket;
      request2.on("socket", function(s) {
        socket = s;
      });
      request2.on("response", function(response) {
        const headers = response.headers;
        if (headers["transfer-encoding"] === "chunked" && !headers["content-length"]) {
          response.once("close", function(hadError) {
            const hasDataListener = socket.listenerCount("data") > 0;
            if (hasDataListener && !hadError) {
              const err = new Error("Premature close");
              err.code = "ERR_STREAM_PREMATURE_CLOSE";
              errorCallback(err);
            }
          });
        }
      });
    }
    function destroyStream(stream, err) {
      if (stream.destroy) {
        stream.destroy(err);
      } else {
        stream.emit("error", err);
        stream.end();
      }
    }
    fetch2.isRedirect = function(code) {
      return code === 301 || code === 302 || code === 303 || code === 307 || code === 308;
    };
    fetch2.Promise = global.Promise;
    module2.exports = exports = fetch2;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = exports;
    exports.Headers = Headers;
    exports.Request = Request;
    exports.Response = Response2;
    exports.FetchError = FetchError;
  }
});

// lib/assertions/providers/lambda-handler/index.ts
var lambda_handler_exports = {};
__export(lambda_handler_exports, {
  handler: () => handler,
  isComplete: () => isComplete,
  onTimeout: () => onTimeout
});
module.exports = __toCommonJS(lambda_handler_exports);

// lib/assertions/providers/lambda-handler/assertion.ts
var import_helpers_internal = __toESM(require_helpers_internal());

// lib/assertions/providers/lambda-handler/base.ts
var https = __toESM(require("https"));
var url = __toESM(require("url"));
var AWS = __toESM(require("aws-sdk"));
var CustomResourceHandler = class {
  constructor(event, context) {
    this.event = event;
    this.context = context;
    this.timedOut = false;
    this.timeout = setTimeout(async () => {
      await this.respond({
        status: "FAILED",
        reason: "Lambda Function Timeout",
        data: this.context.logStreamName
      });
      this.timedOut = true;
    }, context.getRemainingTimeInMillis() - 1200);
    this.event = event;
    this.physicalResourceId = extractPhysicalResourceId(event);
  }
  /**
   * Handles executing the custom resource event. If `stateMachineArn` is present
   * in the props then trigger the waiter statemachine
   */
  async handle() {
    try {
      if ("stateMachineArn" in this.event.ResourceProperties) {
        const req = {
          stateMachineArn: this.event.ResourceProperties.stateMachineArn,
          name: this.event.RequestId,
          input: JSON.stringify(this.event)
        };
        await this.startExecution(req);
        return;
      } else {
        const response = await this.processEvent(this.event.ResourceProperties);
        return response;
      }
    } catch (e) {
      console.log(e);
      throw e;
    } finally {
      clearTimeout(this.timeout);
    }
  }
  /**
   * Handle async requests from the waiter state machine
   */
  async handleIsComplete() {
    try {
      const result = await this.processEvent(this.event.ResourceProperties);
      return result;
    } catch (e) {
      console.log(e);
      return;
    } finally {
      clearTimeout(this.timeout);
    }
  }
  /**
   * Start a step function state machine which will wait for the request
   * to be successful.
   */
  async startExecution(req) {
    try {
      const sfn = new AWS.StepFunctions();
      await sfn.startExecution(req).promise();
    } finally {
      clearTimeout(this.timeout);
    }
  }
  respond(response) {
    if (this.timedOut) {
      return;
    }
    const cfResponse = {
      Status: response.status,
      Reason: response.reason,
      PhysicalResourceId: this.physicalResourceId,
      StackId: this.event.StackId,
      RequestId: this.event.RequestId,
      LogicalResourceId: this.event.LogicalResourceId,
      NoEcho: false,
      Data: response.data
    };
    const responseBody = JSON.stringify(cfResponse);
    console.log("Responding to CloudFormation", responseBody);
    const parsedUrl = url.parse(this.event.ResponseURL);
    const requestOptions = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.path,
      method: "PUT",
      headers: {
        "content-type": "",
        "content-length": Buffer.byteLength(responseBody, "utf8")
      }
    };
    return new Promise((resolve, reject) => {
      try {
        const request2 = https.request(requestOptions, resolve);
        request2.on("error", reject);
        request2.write(responseBody);
        request2.end();
      } catch (e) {
        reject(e);
      } finally {
        clearTimeout(this.timeout);
      }
    });
  }
};
function extractPhysicalResourceId(event) {
  switch (event.RequestType) {
    case "Create":
      return event.LogicalResourceId;
    case "Update":
    case "Delete":
      return event.PhysicalResourceId;
  }
}

// lib/assertions/providers/lambda-handler/assertion.ts
var AssertionHandler = class extends CustomResourceHandler {
  async processEvent(request2) {
    let actual = decodeCall(request2.actual);
    const expected = decodeCall(request2.expected);
    let result;
    const matcher = new MatchCreator(expected).getMatcher();
    console.log(`Testing equality between ${JSON.stringify(request2.actual)} and ${JSON.stringify(request2.expected)}`);
    const matchResult = matcher.test(actual);
    matchResult.finished();
    if (matchResult.hasFailed()) {
      result = {
        failed: true,
        assertion: JSON.stringify({
          status: "fail",
          message: matchResult.renderMismatch()
        })
      };
      if (request2.failDeployment) {
        throw new Error(result.assertion);
      }
    } else {
      result = {
        assertion: JSON.stringify({
          status: "success"
        })
      };
    }
    return result;
  }
};
var MatchCreator = class {
  constructor(obj) {
    this.parsedObj = {
      matcher: obj
    };
  }
  /**
   * Return a Matcher that can be tested against the actual results.
   * This will convert the encoded matchers into their corresponding
   * assertions matcher.
   *
   * For example:
   *
   * ExpectedResult.objectLike({
   *   Messages: [{
   *     Body: Match.objectLike({
   *       Elements: Match.arrayWith([{ Asdf: 3 }]),
   *       Payload: Match.serializedJson({ key: 'value' }),
   *     }),
   *   }],
   * });
   *
   * Will be encoded as:
   * {
   *   $ObjectLike: {
   *     Messages: [{
   *       Body: {
   *         $ObjectLike: {
   *           Elements: {
   *             $ArrayWith: [{ Asdf: 3 }],
   *           },
   *           Payload: {
   *             $SerializedJson: { key: 'value' }
   *           }
   *         },
   *       },
   *     }],
   *   },
   * }
   *
   * Which can then be parsed by this function. For each key (recursively)
   * the parser will check if the value has one of the encoded matchers as a key
   * and if so, it will set the value as the Matcher. So,
   *
   * {
   *   Body: {
   *     $ObjectLike: {
   *       Elements: {
   *         $ArrayWith: [{ Asdf: 3 }],
   *       },
   *       Payload: {
   *         $SerializedJson: { key: 'value' }
   *       }
   *     },
   *   },
   * }
   *
   * Will be converted to
   * {
   *   Body: Match.objectLike({
   *     Elements: Match.arrayWith([{ Asdf: 3 }]),
   *     Payload: Match.serializedJson({ key: 'value' }),
   *   }),
   * }
   */
  getMatcher() {
    try {
      const final = JSON.parse(JSON.stringify(this.parsedObj), function(_k, v) {
        const nested = Object.keys(v)[0];
        switch (nested) {
          case "$ArrayWith":
            return import_helpers_internal.Match.arrayWith(v[nested]);
          case "$ObjectLike":
            return import_helpers_internal.Match.objectLike(v[nested]);
          case "$StringLike":
            return import_helpers_internal.Match.stringLikeRegexp(v[nested]);
          case "$SerializedJson":
            return import_helpers_internal.Match.serializedJson(v[nested]);
          default:
            return v;
        }
      });
      if (import_helpers_internal.Matcher.isMatcher(final.matcher)) {
        return final.matcher;
      }
      return import_helpers_internal.Match.exact(final.matcher);
    } catch {
      return import_helpers_internal.Match.exact(this.parsedObj.matcher);
    }
  }
};
function decodeCall(call) {
  if (!call) {
    return void 0;
  }
  try {
    const parsed = JSON.parse(call);
    return parsed;
  } catch {
    return call;
  }
}

// lib/assertions/providers/lambda-handler/http.ts
var import_node_fetch = __toESM(require_lib3());
var HttpHandler = class extends CustomResourceHandler {
  async processEvent(request2) {
    console.log("request", request2);
    const response = await (0, import_node_fetch.default)(request2.parameters.url, request2.parameters.fetchOptions);
    const result = {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers.raw()
    };
    try {
      const jsonResponse = await response.json();
      result.body = jsonResponse;
    } catch (e) {
      result.body = {};
    }
    return {
      apiCallResponse: result
    };
  }
};

// lib/assertions/providers/lambda-handler/utils.ts
function decode(object) {
  return JSON.parse(JSON.stringify(object), (_k, v) => {
    switch (v) {
      case "TRUE:BOOLEAN":
        return true;
      case "FALSE:BOOLEAN":
        return false;
      default:
        return v;
    }
  });
}

// lib/assertions/providers/lambda-handler/sdk.ts
function flatten(object) {
  return Object.assign(
    {},
    ...function _flatten(child, path = []) {
      return [].concat(...Object.keys(child).map((key) => {
        let childKey = Buffer.isBuffer(child[key]) ? child[key].toString("utf8") : child[key];
        if (typeof childKey === "string") {
          childKey = isJsonString(childKey);
        }
        return typeof childKey === "object" && childKey !== null ? _flatten(childKey, path.concat([key])) : { [path.concat([key]).join(".")]: childKey };
      }));
    }(object)
  );
}
var AwsApiCallHandler = class extends CustomResourceHandler {
  async processEvent(request2) {
    const AWS2 = require("aws-sdk");
    console.log(`AWS SDK VERSION: ${AWS2.VERSION}`);
    if (!Object.prototype.hasOwnProperty.call(AWS2, request2.service)) {
      throw Error(`Service ${request2.service} does not exist in AWS SDK version ${AWS2.VERSION}.`);
    }
    const service = new AWS2[request2.service]();
    const response = await service[request2.api](request2.parameters && decode(request2.parameters)).promise();
    console.log(`SDK response received ${JSON.stringify(response)}`);
    delete response.ResponseMetadata;
    const respond = {
      apiCallResponse: response
    };
    const flatData = {
      ...flatten(respond)
    };
    let resp = respond;
    if (request2.outputPaths) {
      resp = filterKeys(flatData, request2.outputPaths);
    } else if (request2.flattenResponse === "true") {
      resp = flatData;
    }
    console.log(`Returning result ${JSON.stringify(resp)}`);
    return resp;
  }
};
function filterKeys(object, searchStrings) {
  return Object.entries(object).reduce((filteredObject, [key, value]) => {
    for (const searchString of searchStrings) {
      if (key.startsWith(`apiCallResponse.${searchString}`)) {
        filteredObject[key] = value;
      }
    }
    return filteredObject;
  }, {});
}
function isJsonString(value) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

// lib/assertions/providers/lambda-handler/types.ts
var ASSERT_RESOURCE_TYPE = "Custom::DeployAssert@AssertEquals";
var SDK_RESOURCE_TYPE_PREFIX = "Custom::DeployAssert@SdkCall";
var HTTP_RESOURCE_TYPE = "Custom::DeployAssert@HttpCall";

// lib/assertions/providers/lambda-handler/index.ts
async function handler(event, context) {
  console.log(`Event: ${JSON.stringify({ ...event, ResponseURL: "..." })}`);
  const provider = createResourceHandler(event, context);
  try {
    if (event.RequestType === "Delete") {
      await provider.respond({
        status: "SUCCESS",
        reason: "OK"
      });
      return;
    }
    const result = await provider.handle();
    if ("stateMachineArn" in event.ResourceProperties) {
      console.info('Found "stateMachineArn", waiter statemachine started');
      return;
    } else if ("expected" in event.ResourceProperties) {
      console.info('Found "expected", testing assertions');
      const actualPath = event.ResourceProperties.actualPath;
      const actual = actualPath ? result[`apiCallResponse.${actualPath}`] : result.apiCallResponse;
      const assertion = new AssertionHandler({
        ...event,
        ResourceProperties: {
          ServiceToken: event.ServiceToken,
          actual,
          expected: event.ResourceProperties.expected
        }
      }, context);
      try {
        const assertionResult = await assertion.handle();
        await provider.respond({
          status: "SUCCESS",
          reason: "OK",
          // return both the result of the API call _and_ the assertion results
          data: {
            ...assertionResult,
            ...result
          }
        });
        return;
      } catch (e) {
        await provider.respond({
          status: "FAILED",
          reason: e.message ?? "Internal Error"
        });
        return;
      }
    }
    await provider.respond({
      status: "SUCCESS",
      reason: "OK",
      data: result
    });
  } catch (e) {
    await provider.respond({
      status: "FAILED",
      reason: e.message ?? "Internal Error"
    });
    return;
  }
  return;
}
async function onTimeout(timeoutEvent) {
  const isCompleteRequest = JSON.parse(JSON.parse(timeoutEvent.Cause).errorMessage);
  const provider = createResourceHandler(isCompleteRequest, standardContext);
  await provider.respond({
    status: "FAILED",
    reason: "Operation timed out: " + JSON.stringify(isCompleteRequest)
  });
}
async function isComplete(event, context) {
  console.log(`Event: ${JSON.stringify({ ...event, ResponseURL: "..." })}`);
  const provider = createResourceHandler(event, context);
  try {
    const result = await provider.handleIsComplete();
    const actualPath = event.ResourceProperties.actualPath;
    if (result) {
      const actual = actualPath ? result[`apiCallResponse.${actualPath}`] : result.apiCallResponse;
      if ("expected" in event.ResourceProperties) {
        const assertion = new AssertionHandler({
          ...event,
          ResourceProperties: {
            ServiceToken: event.ServiceToken,
            actual,
            expected: event.ResourceProperties.expected
          }
        }, context);
        const assertionResult = await assertion.handleIsComplete();
        if (!(assertionResult == null ? void 0 : assertionResult.failed)) {
          await provider.respond({
            status: "SUCCESS",
            reason: "OK",
            data: {
              ...assertionResult,
              ...result
            }
          });
          return;
        } else {
          console.log(`Assertion Failed: ${JSON.stringify(assertionResult)}`);
          throw new Error(JSON.stringify(event));
        }
      }
      await provider.respond({
        status: "SUCCESS",
        reason: "OK",
        data: result
      });
    } else {
      console.log("No result");
      throw new Error(JSON.stringify(event));
    }
    return;
  } catch (e) {
    console.log(e);
    throw new Error(JSON.stringify(event));
  }
}
function createResourceHandler(event, context) {
  if (event.ResourceType.startsWith(SDK_RESOURCE_TYPE_PREFIX)) {
    return new AwsApiCallHandler(event, context);
  } else if (event.ResourceType.startsWith(ASSERT_RESOURCE_TYPE)) {
    return new AssertionHandler(event, context);
  } else if (event.ResourceType.startsWith(HTTP_RESOURCE_TYPE)) {
    return new HttpHandler(event, context);
  } else {
    throw new Error(`Unsupported resource type "${event.ResourceType}`);
  }
}
var standardContext = {
  getRemainingTimeInMillis: () => 9e4
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler,
  isComplete,
  onTimeout
});
