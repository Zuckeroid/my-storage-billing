(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __esm = (fn2, res) => function __init() {
    return fn2 && (res = (0, fn2[__getOwnPropNames(fn2)[0]])(fn2 = 0)), res;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // ../../../node_modules/tom-select/dist/esm/contrib/microevent.js
  function forEvents(events, callback) {
    events.split(/\s+/).forEach((event) => {
      callback(event);
    });
  }
  var MicroEvent;
  var init_microevent = __esm({
    "../../../node_modules/tom-select/dist/esm/contrib/microevent.js"() {
      MicroEvent = class {
        constructor() {
          this._events = {};
        }
        on(events, fct) {
          forEvents(events, (event) => {
            const event_array = this._events[event] || [];
            event_array.push(fct);
            this._events[event] = event_array;
          });
        }
        off(events, fct) {
          var n = arguments.length;
          if (n === 0) {
            this._events = {};
            return;
          }
          forEvents(events, (event) => {
            if (n === 1) {
              delete this._events[event];
              return;
            }
            const event_array = this._events[event];
            if (event_array === void 0)
              return;
            event_array.splice(event_array.indexOf(fct), 1);
            this._events[event] = event_array;
          });
        }
        trigger(events, ...args) {
          var self = this;
          forEvents(events, (event) => {
            const event_array = self._events[event];
            if (event_array === void 0)
              return;
            event_array.forEach((fct) => {
              fct.apply(self, args);
            });
          });
        }
      };
    }
  });

  // ../../../node_modules/tom-select/dist/esm/contrib/microplugin.js
  function MicroPlugin(Interface) {
    Interface.plugins = {};
    return class extends Interface {
      constructor() {
        super(...arguments);
        this.plugins = {
          names: [],
          settings: {},
          requested: {},
          loaded: {}
        };
      }
      /**
       * Registers a plugin.
       *
       * @param {function} fn
       */
      static define(name, fn2) {
        Interface.plugins[name] = {
          "name": name,
          "fn": fn2
        };
      }
      /**
       * Initializes the listed plugins (with options).
       * Acceptable formats:
       *
       * List (without options):
       *   ['a', 'b', 'c']
       *
       * List (with options):
       *   [{'name': 'a', options: {}}, {'name': 'b', options: {}}]
       *
       * Hash (with options):
       *   {'a': { ... }, 'b': { ... }, 'c': { ... }}
       *
       * @param {array|object} plugins
       */
      initializePlugins(plugins) {
        var key, name;
        const self = this;
        const queue = [];
        if (Array.isArray(plugins)) {
          plugins.forEach((plugin15) => {
            if (typeof plugin15 === "string") {
              queue.push(plugin15);
            } else {
              self.plugins.settings[plugin15.name] = plugin15.options;
              queue.push(plugin15.name);
            }
          });
        } else if (plugins) {
          for (key in plugins) {
            if (plugins.hasOwnProperty(key)) {
              self.plugins.settings[key] = plugins[key];
              queue.push(key);
            }
          }
        }
        while (name = queue.shift()) {
          self.require(name);
        }
      }
      loadPlugin(name) {
        var self = this;
        var plugins = self.plugins;
        var plugin15 = Interface.plugins[name];
        if (!Interface.plugins.hasOwnProperty(name)) {
          throw new Error('Unable to find "' + name + '" plugin');
        }
        plugins.requested[name] = true;
        plugins.loaded[name] = plugin15.fn.apply(self, [self.plugins.settings[name] || {}]);
        plugins.names.push(name);
      }
      /**
       * Initializes a plugin.
       *
       */
      require(name) {
        var self = this;
        var plugins = self.plugins;
        if (!self.plugins.loaded.hasOwnProperty(name)) {
          if (plugins.requested[name]) {
            throw new Error('Plugin has circular dependency ("' + name + '")');
          }
          self.loadPlugin(name);
        }
        return plugins.loaded[name];
      }
    };
  }
  var init_microplugin = __esm({
    "../../../node_modules/tom-select/dist/esm/contrib/microplugin.js"() {
    }
  });

  // ../../../node_modules/@orchidjs/unicode-variants/dist/esm/regex.js
  var arrayToPattern, sequencePattern, setToPattern, hasDuplicates, escape_regex, maxValueLength, unicodeLength;
  var init_regex = __esm({
    "../../../node_modules/@orchidjs/unicode-variants/dist/esm/regex.js"() {
      arrayToPattern = (chars) => {
        chars = chars.filter(Boolean);
        if (chars.length < 2) {
          return chars[0] || "";
        }
        return maxValueLength(chars) == 1 ? "[" + chars.join("") + "]" : "(?:" + chars.join("|") + ")";
      };
      sequencePattern = (array) => {
        if (!hasDuplicates(array)) {
          return array.join("");
        }
        let pattern = "";
        let prev_char_count = 0;
        const prev_pattern = () => {
          if (prev_char_count > 1) {
            pattern += "{" + prev_char_count + "}";
          }
        };
        array.forEach((char, i) => {
          if (char === array[i - 1]) {
            prev_char_count++;
            return;
          }
          prev_pattern();
          pattern += char;
          prev_char_count = 1;
        });
        prev_pattern();
        return pattern;
      };
      setToPattern = (chars) => {
        let array = Array.from(chars);
        return arrayToPattern(array);
      };
      hasDuplicates = (array) => {
        return new Set(array).size !== array.length;
      };
      escape_regex = (str) => {
        return (str + "").replace(/([\$\(\)\*\+\.\?\[\]\^\{\|\}\\])/gu, "\\$1");
      };
      maxValueLength = (array) => {
        return array.reduce((longest, value) => Math.max(longest, unicodeLength(value)), 0);
      };
      unicodeLength = (str) => {
        return Array.from(str).length;
      };
    }
  });

  // ../../../node_modules/@orchidjs/unicode-variants/dist/esm/strings.js
  var allSubstrings;
  var init_strings = __esm({
    "../../../node_modules/@orchidjs/unicode-variants/dist/esm/strings.js"() {
      allSubstrings = (input) => {
        if (input.length === 1)
          return [[input]];
        let result = [];
        const start2 = input.substring(1);
        const suba = allSubstrings(start2);
        suba.forEach(function(subresult) {
          let tmp = subresult.slice(0);
          tmp[0] = input.charAt(0) + tmp[0];
          result.push(tmp);
          tmp = subresult.slice(0);
          tmp.unshift(input.charAt(0));
          result.push(tmp);
        });
        return result;
      };
    }
  });

  // ../../../node_modules/@orchidjs/unicode-variants/dist/esm/index.js
  function* generator(code_points2) {
    for (const [code_point_min, code_point_max] of code_points2) {
      for (let i = code_point_min; i <= code_point_max; i++) {
        let composed = String.fromCharCode(i);
        let folded = asciifold(composed);
        if (folded == composed.toLowerCase()) {
          continue;
        }
        if (folded.length > max_char_length) {
          continue;
        }
        if (folded.length == 0) {
          continue;
        }
        yield { folded, composed, code_point: i };
      }
    }
  }
  var code_points, accent_pat, unicode_map, multi_char_reg, max_char_length, latin_convert, latin_condensed, convert_pat, initialize, normalize, asciifold, _asciifold, generateSets, generateMap, mapSequence, substringsToPattern, sequencesToPattern, inSequences, Sequence, getPattern;
  var init_esm = __esm({
    "../../../node_modules/@orchidjs/unicode-variants/dist/esm/index.js"() {
      init_regex();
      init_strings();
      code_points = [[0, 65535]];
      accent_pat = "[\u0300-\u036F\xB7\u02BE\u02BC]";
      max_char_length = 3;
      latin_convert = {};
      latin_condensed = {
        "/": "\u2044\u2215",
        "0": "\u07C0",
        "a": "\u2C65\u0250\u0251",
        "aa": "\uA733",
        "ae": "\xE6\u01FD\u01E3",
        "ao": "\uA735",
        "au": "\uA737",
        "av": "\uA739\uA73B",
        "ay": "\uA73D",
        "b": "\u0180\u0253\u0183",
        "c": "\uA73F\u0188\u023C\u2184",
        "d": "\u0111\u0257\u0256\u1D05\u018C\uABB7\u0501\u0266",
        "e": "\u025B\u01DD\u1D07\u0247",
        "f": "\uA77C\u0192",
        "g": "\u01E5\u0260\uA7A1\u1D79\uA77F\u0262",
        "h": "\u0127\u2C68\u2C76\u0265",
        "i": "\u0268\u0131",
        "j": "\u0249\u0237",
        "k": "\u0199\u2C6A\uA741\uA743\uA745\uA7A3",
        "l": "\u0142\u019A\u026B\u2C61\uA749\uA747\uA781\u026D",
        "m": "\u0271\u026F\u03FB",
        "n": "\uA7A5\u019E\u0272\uA791\u1D0E\u043B\u0509",
        "o": "\xF8\u01FF\u0254\u0275\uA74B\uA74D\u1D11",
        "oe": "\u0153",
        "oi": "\u01A3",
        "oo": "\uA74F",
        "ou": "\u0223",
        "p": "\u01A5\u1D7D\uA751\uA753\uA755\u03C1",
        "q": "\uA757\uA759\u024B",
        "r": "\u024D\u027D\uA75B\uA7A7\uA783",
        "s": "\xDF\u023F\uA7A9\uA785\u0282",
        "t": "\u0167\u01AD\u0288\u2C66\uA787",
        "th": "\xFE",
        "tz": "\uA729",
        "u": "\u0289",
        "v": "\u028B\uA75F\u028C",
        "vy": "\uA761",
        "w": "\u2C73",
        "y": "\u01B4\u024F\u1EFF",
        "z": "\u01B6\u0225\u0240\u2C6C\uA763",
        "hv": "\u0195"
      };
      for (let latin in latin_condensed) {
        let unicode = latin_condensed[latin] || "";
        for (let i = 0; i < unicode.length; i++) {
          let char = unicode.substring(i, i + 1);
          latin_convert[char] = latin;
        }
      }
      convert_pat = new RegExp(Object.keys(latin_convert).join("|") + "|" + accent_pat, "gu");
      initialize = (_code_points) => {
        if (unicode_map !== void 0)
          return;
        unicode_map = generateMap(_code_points || code_points);
      };
      normalize = (str, form = "NFKD") => str.normalize(form);
      asciifold = (str) => {
        return Array.from(str).reduce(
          /**
           * @param {string} result
           * @param {string} char
           */
          (result, char) => {
            return result + _asciifold(char);
          },
          ""
        );
      };
      _asciifold = (str) => {
        str = normalize(str).toLowerCase().replace(convert_pat, (char) => {
          return latin_convert[char] || "";
        });
        return normalize(str, "NFC");
      };
      generateSets = (code_points2) => {
        const unicode_sets = {};
        const addMatching = (folded, to_add) => {
          const folded_set = unicode_sets[folded] || /* @__PURE__ */ new Set();
          const patt = new RegExp("^" + setToPattern(folded_set) + "$", "iu");
          if (to_add.match(patt)) {
            return;
          }
          folded_set.add(escape_regex(to_add));
          unicode_sets[folded] = folded_set;
        };
        for (let value of generator(code_points2)) {
          addMatching(value.folded, value.folded);
          addMatching(value.folded, value.composed);
        }
        return unicode_sets;
      };
      generateMap = (code_points2) => {
        const unicode_sets = generateSets(code_points2);
        const unicode_map2 = {};
        let multi_char = [];
        for (let folded in unicode_sets) {
          let set = unicode_sets[folded];
          if (set) {
            unicode_map2[folded] = setToPattern(set);
          }
          if (folded.length > 1) {
            multi_char.push(escape_regex(folded));
          }
        }
        multi_char.sort((a, b) => b.length - a.length);
        const multi_char_patt = arrayToPattern(multi_char);
        multi_char_reg = new RegExp("^" + multi_char_patt, "u");
        return unicode_map2;
      };
      mapSequence = (strings, min_replacement = 1) => {
        let chars_replaced = 0;
        strings = strings.map((str) => {
          if (unicode_map[str]) {
            chars_replaced += str.length;
          }
          return unicode_map[str] || str;
        });
        if (chars_replaced >= min_replacement) {
          return sequencePattern(strings);
        }
        return "";
      };
      substringsToPattern = (str, min_replacement = 1) => {
        min_replacement = Math.max(min_replacement, str.length - 1);
        return arrayToPattern(allSubstrings(str).map((sub_pat) => {
          return mapSequence(sub_pat, min_replacement);
        }));
      };
      sequencesToPattern = (sequences, all = true) => {
        let min_replacement = sequences.length > 1 ? 1 : 0;
        return arrayToPattern(sequences.map((sequence) => {
          let seq = [];
          const len = all ? sequence.length() : sequence.length() - 1;
          for (let j = 0; j < len; j++) {
            seq.push(substringsToPattern(sequence.substrs[j] || "", min_replacement));
          }
          return sequencePattern(seq);
        }));
      };
      inSequences = (needle_seq, sequences) => {
        for (const seq of sequences) {
          if (seq.start != needle_seq.start || seq.end != needle_seq.end) {
            continue;
          }
          if (seq.substrs.join("") !== needle_seq.substrs.join("")) {
            continue;
          }
          let needle_parts = needle_seq.parts;
          const filter = (part) => {
            for (const needle_part of needle_parts) {
              if (needle_part.start === part.start && needle_part.substr === part.substr) {
                return false;
              }
              if (part.length == 1 || needle_part.length == 1) {
                continue;
              }
              if (part.start < needle_part.start && part.end > needle_part.start) {
                return true;
              }
              if (needle_part.start < part.start && needle_part.end > part.start) {
                return true;
              }
            }
            return false;
          };
          let filtered = seq.parts.filter(filter);
          if (filtered.length > 0) {
            continue;
          }
          return true;
        }
        return false;
      };
      Sequence = class _Sequence {
        constructor() {
          __publicField(this, "parts");
          __publicField(this, "substrs");
          __publicField(this, "start");
          __publicField(this, "end");
          this.parts = [];
          this.substrs = [];
          this.start = 0;
          this.end = 0;
        }
        add(part) {
          if (part) {
            this.parts.push(part);
            this.substrs.push(part.substr);
            this.start = Math.min(part.start, this.start);
            this.end = Math.max(part.end, this.end);
          }
        }
        last() {
          return this.parts[this.parts.length - 1];
        }
        length() {
          return this.parts.length;
        }
        clone(position, last_piece) {
          let clone = new _Sequence();
          let parts = JSON.parse(JSON.stringify(this.parts));
          let last_part = parts.pop();
          for (const part of parts) {
            clone.add(part);
          }
          let last_substr = last_piece.substr.substring(0, position - last_part.start);
          let clone_last_len = last_substr.length;
          clone.add({ start: last_part.start, end: last_part.start + clone_last_len, length: clone_last_len, substr: last_substr });
          return clone;
        }
      };
      getPattern = (str) => {
        initialize();
        str = asciifold(str);
        let pattern = "";
        let sequences = [new Sequence()];
        for (let i = 0; i < str.length; i++) {
          let substr = str.substring(i);
          let match = substr.match(multi_char_reg);
          const char = str.substring(i, i + 1);
          const match_str = match ? match[0] : null;
          let overlapping = [];
          let added_types = /* @__PURE__ */ new Set();
          for (const sequence of sequences) {
            const last_piece = sequence.last();
            if (!last_piece || last_piece.length == 1 || last_piece.end <= i) {
              if (match_str) {
                const len = match_str.length;
                sequence.add({ start: i, end: i + len, length: len, substr: match_str });
                added_types.add("1");
              } else {
                sequence.add({ start: i, end: i + 1, length: 1, substr: char });
                added_types.add("2");
              }
            } else if (match_str) {
              let clone = sequence.clone(i, last_piece);
              const len = match_str.length;
              clone.add({ start: i, end: i + len, length: len, substr: match_str });
              overlapping.push(clone);
            } else {
              added_types.add("3");
            }
          }
          if (overlapping.length > 0) {
            overlapping = overlapping.sort((a, b) => {
              return a.length() - b.length();
            });
            for (let clone of overlapping) {
              if (inSequences(clone, sequences)) {
                continue;
              }
              sequences.push(clone);
            }
            continue;
          }
          if (i > 0 && added_types.size == 1 && !added_types.has("3")) {
            pattern += sequencesToPattern(sequences, false);
            let new_seq = new Sequence();
            const old_seq = sequences[0];
            if (old_seq) {
              new_seq.add(old_seq.last());
            }
            sequences = [new_seq];
          }
        }
        pattern += sequencesToPattern(sequences, true);
        return pattern;
      };
    }
  });

  // ../../../node_modules/@orchidjs/sifter/dist/esm/utils.js
  var getAttr, getAttrNesting, scoreValue, propToArray, iterate, cmp;
  var init_utils = __esm({
    "../../../node_modules/@orchidjs/sifter/dist/esm/utils.js"() {
      init_esm();
      getAttr = (obj, name) => {
        if (!obj)
          return;
        return obj[name];
      };
      getAttrNesting = (obj, name) => {
        if (!obj)
          return;
        var part, names = name.split(".");
        while ((part = names.shift()) && (obj = obj[part]))
          ;
        return obj;
      };
      scoreValue = (value, token, weight) => {
        var score, pos;
        if (!value)
          return 0;
        value = value + "";
        if (token.regex == null)
          return 0;
        pos = value.search(token.regex);
        if (pos === -1)
          return 0;
        score = token.string.length / value.length;
        if (pos === 0)
          score += 0.5;
        return score * weight;
      };
      propToArray = (obj, key) => {
        var value = obj[key];
        if (typeof value == "function")
          return value;
        if (value && !Array.isArray(value)) {
          obj[key] = [value];
        }
      };
      iterate = (object, callback) => {
        if (Array.isArray(object)) {
          object.forEach(callback);
        } else {
          for (var key in object) {
            if (object.hasOwnProperty(key)) {
              callback(object[key], key);
            }
          }
        }
      };
      cmp = (a, b) => {
        if (typeof a === "number" && typeof b === "number") {
          return a > b ? 1 : a < b ? -1 : 0;
        }
        a = asciifold(a + "").toLowerCase();
        b = asciifold(b + "").toLowerCase();
        if (a > b)
          return 1;
        if (b > a)
          return -1;
        return 0;
      };
    }
  });

  // ../../../node_modules/@orchidjs/sifter/dist/esm/types.js
  var init_types = __esm({
    "../../../node_modules/@orchidjs/sifter/dist/esm/types.js"() {
    }
  });

  // ../../../node_modules/@orchidjs/sifter/dist/esm/sifter.js
  var Sifter;
  var init_sifter = __esm({
    "../../../node_modules/@orchidjs/sifter/dist/esm/sifter.js"() {
      init_utils();
      init_esm();
      init_types();
      Sifter = class {
        /**
         * Textually searches arrays and hashes of objects
         * by property (or multiple properties). Designed
         * specifically for autocomplete.
         *
         */
        constructor(items, settings) {
          __publicField(this, "items");
          // []|{};
          __publicField(this, "settings");
          this.items = items;
          this.settings = settings || { diacritics: true };
        }
        /**
         * Splits a search string into an array of individual
         * regexps to be used to match results.
         *
         */
        tokenize(query, respect_word_boundaries, weights) {
          if (!query || !query.length)
            return [];
          const tokens = [];
          const words = query.split(/\s+/);
          var field_regex;
          if (weights) {
            field_regex = new RegExp("^(" + Object.keys(weights).map(escape_regex).join("|") + "):(.*)$");
          }
          words.forEach((word) => {
            let field_match;
            let field = null;
            let regex = null;
            if (field_regex && (field_match = word.match(field_regex))) {
              field = field_match[1];
              word = field_match[2];
            }
            if (word.length > 0) {
              if (this.settings.diacritics) {
                regex = getPattern(word) || null;
              } else {
                regex = escape_regex(word);
              }
              if (regex && respect_word_boundaries)
                regex = "\\b" + regex;
            }
            tokens.push({
              string: word,
              regex: regex ? new RegExp(regex, "iu") : null,
              field
            });
          });
          return tokens;
        }
        /**
         * Returns a function to be used to score individual results.
         *
         * Good matches will have a higher score than poor matches.
         * If an item is not a match, 0 will be returned by the function.
         *
         * @returns {T.ScoreFn}
         */
        getScoreFunction(query, options) {
          var search = this.prepareSearch(query, options);
          return this._getScoreFunction(search);
        }
        /**
         * @returns {T.ScoreFn}
         *
         */
        _getScoreFunction(search) {
          const tokens = search.tokens, token_count = tokens.length;
          if (!token_count) {
            return function() {
              return 0;
            };
          }
          const fields = search.options.fields, weights = search.weights, field_count = fields.length, getAttrFn = search.getAttrFn;
          if (!field_count) {
            return function() {
              return 1;
            };
          }
          const scoreObject = (function() {
            if (field_count === 1) {
              return function(token, data) {
                const field = fields[0].field;
                return scoreValue(getAttrFn(data, field), token, weights[field] || 1);
              };
            }
            return function(token, data) {
              var sum = 0;
              if (token.field) {
                const value = getAttrFn(data, token.field);
                if (!token.regex && value) {
                  sum += 1 / field_count;
                } else {
                  sum += scoreValue(value, token, 1);
                }
              } else {
                iterate(weights, (weight, field) => {
                  sum += scoreValue(getAttrFn(data, field), token, weight);
                });
              }
              return sum / field_count;
            };
          })();
          if (token_count === 1) {
            return function(data) {
              return scoreObject(tokens[0], data);
            };
          }
          if (search.options.conjunction === "and") {
            return function(data) {
              var score, sum = 0;
              for (let token of tokens) {
                score = scoreObject(token, data);
                if (score <= 0)
                  return 0;
                sum += score;
              }
              return sum / token_count;
            };
          } else {
            return function(data) {
              var sum = 0;
              iterate(tokens, (token) => {
                sum += scoreObject(token, data);
              });
              return sum / token_count;
            };
          }
        }
        /**
         * Returns a function that can be used to compare two
         * results, for sorting purposes. If no sorting should
         * be performed, `null` will be returned.
         *
         * @return function(a,b)
         */
        getSortFunction(query, options) {
          var search = this.prepareSearch(query, options);
          return this._getSortFunction(search);
        }
        _getSortFunction(search) {
          var implicit_score, sort_flds = [];
          const self = this, options = search.options, sort = !search.query && options.sort_empty ? options.sort_empty : options.sort;
          if (typeof sort == "function") {
            return sort.bind(this);
          }
          const get_field = function(name, result) {
            if (name === "$score")
              return result.score;
            return search.getAttrFn(self.items[result.id], name);
          };
          if (sort) {
            for (let s of sort) {
              if (search.query || s.field !== "$score") {
                sort_flds.push(s);
              }
            }
          }
          if (search.query) {
            implicit_score = true;
            for (let fld of sort_flds) {
              if (fld.field === "$score") {
                implicit_score = false;
                break;
              }
            }
            if (implicit_score) {
              sort_flds.unshift({ field: "$score", direction: "desc" });
            }
          } else {
            sort_flds = sort_flds.filter((fld) => fld.field !== "$score");
          }
          const sort_flds_count = sort_flds.length;
          if (!sort_flds_count) {
            return null;
          }
          return function(a, b) {
            var result, field;
            for (let sort_fld of sort_flds) {
              field = sort_fld.field;
              let multiplier = sort_fld.direction === "desc" ? -1 : 1;
              result = multiplier * cmp(get_field(field, a), get_field(field, b));
              if (result)
                return result;
            }
            return 0;
          };
        }
        /**
         * Parses a search query and returns an object
         * with tokens and fields ready to be populated
         * with results.
         *
         */
        prepareSearch(query, optsUser) {
          const weights = {};
          var options = Object.assign({}, optsUser);
          propToArray(options, "sort");
          propToArray(options, "sort_empty");
          if (options.fields) {
            propToArray(options, "fields");
            const fields = [];
            options.fields.forEach((field) => {
              if (typeof field == "string") {
                field = { field, weight: 1 };
              }
              fields.push(field);
              weights[field.field] = "weight" in field ? field.weight : 1;
            });
            options.fields = fields;
          }
          return {
            options,
            query: query.toLowerCase().trim(),
            tokens: this.tokenize(query, options.respect_word_boundaries, weights),
            total: 0,
            items: [],
            weights,
            getAttrFn: options.nesting ? getAttrNesting : getAttr
          };
        }
        /**
         * Searches through all items and returns a sorted array of matches.
         *
         */
        search(query, options) {
          var self = this, score, search;
          search = this.prepareSearch(query, options);
          options = search.options;
          query = search.query;
          const fn_score = options.score || self._getScoreFunction(search);
          if (query.length) {
            iterate(self.items, (item, id) => {
              score = fn_score(item);
              if (options.filter === false || score > 0) {
                search.items.push({ "score": score, "id": id });
              }
            });
          } else {
            iterate(self.items, (_, id) => {
              search.items.push({ "score": 1, "id": id });
            });
          }
          const fn_sort = self._getSortFunction(search);
          if (fn_sort)
            search.items.sort(fn_sort);
          search.total = search.items.length;
          if (typeof options.limit === "number") {
            search.items = search.items.slice(0, options.limit);
          }
          return search;
        }
      };
    }
  });

  // ../../../node_modules/tom-select/dist/esm/utils.js
  var hash_key, get_hash, escape_html, timeout, loadDebounce, debounce_events, getSelection, preventDefault, addEvent, isKeyDown, getId, addSlashes, append, iterate2;
  var init_utils2 = __esm({
    "../../../node_modules/tom-select/dist/esm/utils.js"() {
      hash_key = (value) => {
        if (typeof value === "undefined" || value === null)
          return null;
        return get_hash(value);
      };
      get_hash = (value) => {
        if (typeof value === "boolean")
          return value ? "1" : "0";
        return value + "";
      };
      escape_html = (str) => {
        return (str + "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
      };
      timeout = (fn2, timeout2) => {
        if (timeout2 > 0) {
          return window.setTimeout(fn2, timeout2);
        }
        fn2.call(null);
        return null;
      };
      loadDebounce = (fn2, delay) => {
        var timeout2;
        return function(value, callback) {
          var self = this;
          if (timeout2) {
            self.loading = Math.max(self.loading - 1, 0);
            clearTimeout(timeout2);
          }
          timeout2 = setTimeout(function() {
            timeout2 = null;
            self.loadedSearches[value] = true;
            fn2.call(self, value, callback);
          }, delay);
        };
      };
      debounce_events = (self, types, fn2) => {
        var type;
        var trigger = self.trigger;
        var event_args = {};
        self.trigger = function() {
          var type2 = arguments[0];
          if (types.indexOf(type2) !== -1) {
            event_args[type2] = arguments;
          } else {
            return trigger.apply(self, arguments);
          }
        };
        fn2.apply(self, []);
        self.trigger = trigger;
        for (type of types) {
          if (type in event_args) {
            trigger.apply(self, event_args[type]);
          }
        }
      };
      getSelection = (input) => {
        return {
          start: input.selectionStart || 0,
          length: (input.selectionEnd || 0) - (input.selectionStart || 0)
        };
      };
      preventDefault = (evt, stop = false) => {
        if (evt) {
          evt.preventDefault();
          if (stop) {
            evt.stopPropagation();
          }
        }
      };
      addEvent = (target, type, callback, options) => {
        target.addEventListener(type, callback, options);
      };
      isKeyDown = (key_name, evt) => {
        if (!evt) {
          return false;
        }
        if (!evt[key_name]) {
          return false;
        }
        var count = (evt.altKey ? 1 : 0) + (evt.ctrlKey ? 1 : 0) + (evt.shiftKey ? 1 : 0) + (evt.metaKey ? 1 : 0);
        if (count === 1) {
          return true;
        }
        return false;
      };
      getId = (el, id) => {
        const existing_id = el.getAttribute("id");
        if (existing_id) {
          return existing_id;
        }
        el.setAttribute("id", id);
        return id;
      };
      addSlashes = (str) => {
        return str.replace(/[\\"']/g, "\\$&");
      };
      append = (parent, node) => {
        if (node)
          parent.append(node);
      };
      iterate2 = (object, callback) => {
        if (Array.isArray(object)) {
          object.forEach(callback);
        } else {
          for (var key in object) {
            if (object.hasOwnProperty(key)) {
              callback(object[key], key);
            }
          }
        }
      };
    }
  });

  // ../../../node_modules/tom-select/dist/esm/vanilla.js
  var getDom, isHtmlString, escapeQuery, triggerEvent, applyCSS, addClasses, removeClasses, classesArray, castAsArray, parentMatch, getTail, isEmptyObject, nodeIndex, setAttr, replaceNode;
  var init_vanilla = __esm({
    "../../../node_modules/tom-select/dist/esm/vanilla.js"() {
      init_utils2();
      getDom = (query) => {
        if (query.jquery) {
          return query[0];
        }
        if (query instanceof HTMLElement) {
          return query;
        }
        if (isHtmlString(query)) {
          var tpl = document.createElement("template");
          tpl.innerHTML = query.trim();
          return tpl.content.firstChild;
        }
        return document.querySelector(query);
      };
      isHtmlString = (arg) => {
        if (typeof arg === "string" && arg.indexOf("<") > -1) {
          return true;
        }
        return false;
      };
      escapeQuery = (query) => {
        return query.replace(/['"\\]/g, "\\$&");
      };
      triggerEvent = (dom_el, event_name) => {
        var event = document.createEvent("HTMLEvents");
        event.initEvent(event_name, true, false);
        dom_el.dispatchEvent(event);
      };
      applyCSS = (dom_el, css) => {
        Object.assign(dom_el.style, css);
      };
      addClasses = (elmts, ...classes) => {
        var norm_classes = classesArray(classes);
        elmts = castAsArray(elmts);
        elmts.map((el) => {
          norm_classes.map((cls) => {
            el.classList.add(cls);
          });
        });
      };
      removeClasses = (elmts, ...classes) => {
        var norm_classes = classesArray(classes);
        elmts = castAsArray(elmts);
        elmts.map((el) => {
          norm_classes.map((cls) => {
            el.classList.remove(cls);
          });
        });
      };
      classesArray = (args) => {
        var classes = [];
        iterate2(args, (_classes) => {
          if (typeof _classes === "string") {
            _classes = _classes.trim().split(/[\t\n\f\r\s]/);
          }
          if (Array.isArray(_classes)) {
            classes = classes.concat(_classes);
          }
        });
        return classes.filter(Boolean);
      };
      castAsArray = (arg) => {
        if (!Array.isArray(arg)) {
          arg = [arg];
        }
        return arg;
      };
      parentMatch = (target, selector, wrapper) => {
        if (wrapper && !wrapper.contains(target)) {
          return;
        }
        while (target && target.matches) {
          if (target.matches(selector)) {
            return target;
          }
          target = target.parentNode;
        }
      };
      getTail = (list, direction = 0) => {
        if (direction > 0) {
          return list[list.length - 1];
        }
        return list[0];
      };
      isEmptyObject = (obj) => {
        return Object.keys(obj).length === 0;
      };
      nodeIndex = (el, amongst) => {
        if (!el)
          return -1;
        amongst = amongst || el.nodeName;
        var i = 0;
        while (el = el.previousElementSibling) {
          if (el.matches(amongst)) {
            i++;
          }
        }
        return i;
      };
      setAttr = (el, attrs) => {
        iterate2(attrs, (val, attr) => {
          if (val == null) {
            el.removeAttribute(attr);
          } else {
            el.setAttribute(attr, "" + val);
          }
        });
      };
      replaceNode = (existing, replacement) => {
        if (existing.parentNode)
          existing.parentNode.replaceChild(replacement, existing);
      };
    }
  });

  // ../../../node_modules/tom-select/dist/esm/contrib/highlight.js
  var highlight, removeHighlight;
  var init_highlight = __esm({
    "../../../node_modules/tom-select/dist/esm/contrib/highlight.js"() {
      init_vanilla();
      highlight = (element, regex) => {
        if (regex === null)
          return;
        if (typeof regex === "string") {
          if (!regex.length)
            return;
          regex = new RegExp(regex, "i");
        }
        const highlightText = (node) => {
          var match = node.data.match(regex);
          if (match && node.data.length > 0) {
            var spannode = document.createElement("span");
            spannode.className = "highlight";
            var middlebit = node.splitText(match.index);
            middlebit.splitText(match[0].length);
            var middleclone = middlebit.cloneNode(true);
            spannode.appendChild(middleclone);
            replaceNode(middlebit, spannode);
            return 1;
          }
          return 0;
        };
        const highlightChildren = (node) => {
          if (node.nodeType === 1 && node.childNodes && !/(script|style)/i.test(node.tagName) && (node.className !== "highlight" || node.tagName !== "SPAN")) {
            Array.from(node.childNodes).forEach((element2) => {
              highlightRecursive(element2);
            });
          }
        };
        const highlightRecursive = (node) => {
          if (node.nodeType === 3) {
            return highlightText(node);
          }
          highlightChildren(node);
          return 0;
        };
        highlightRecursive(element);
      };
      removeHighlight = (el) => {
        var elements = el.querySelectorAll("span.highlight");
        Array.prototype.forEach.call(elements, function(el2) {
          var parent = el2.parentNode;
          parent.replaceChild(el2.firstChild, el2);
          parent.normalize();
        });
      };
    }
  });

  // ../../../node_modules/tom-select/dist/esm/constants.js
  var KEY_A, KEY_RETURN, KEY_ESC, KEY_LEFT, KEY_UP, KEY_RIGHT, KEY_DOWN, KEY_BACKSPACE, KEY_DELETE, KEY_TAB, IS_MAC, KEY_SHORTCUT;
  var init_constants = __esm({
    "../../../node_modules/tom-select/dist/esm/constants.js"() {
      KEY_A = 65;
      KEY_RETURN = 13;
      KEY_ESC = 27;
      KEY_LEFT = 37;
      KEY_UP = 38;
      KEY_RIGHT = 39;
      KEY_DOWN = 40;
      KEY_BACKSPACE = 8;
      KEY_DELETE = 46;
      KEY_TAB = 9;
      IS_MAC = typeof navigator === "undefined" ? false : /Mac/.test(navigator.userAgent);
      KEY_SHORTCUT = IS_MAC ? "metaKey" : "ctrlKey";
    }
  });

  // ../../../node_modules/tom-select/dist/esm/defaults.js
  var defaults_default;
  var init_defaults = __esm({
    "../../../node_modules/tom-select/dist/esm/defaults.js"() {
      defaults_default = {
        options: [],
        optgroups: [],
        plugins: [],
        delimiter: ",",
        splitOn: null,
        // regexp or string for splitting up values from a paste command
        persist: true,
        diacritics: true,
        create: null,
        createOnBlur: false,
        createFilter: null,
        clearAfterSelect: false,
        highlight: true,
        openOnFocus: true,
        shouldOpen: null,
        maxOptions: 50,
        maxItems: null,
        hideSelected: null,
        duplicates: false,
        addPrecedence: false,
        selectOnTab: false,
        preload: null,
        allowEmptyOption: false,
        //closeAfterSelect: false,
        refreshThrottle: 300,
        loadThrottle: 300,
        loadingClass: "loading",
        dataAttr: null,
        //'data-data',
        optgroupField: "optgroup",
        valueField: "value",
        labelField: "text",
        disabledField: "disabled",
        optgroupLabelField: "label",
        optgroupValueField: "value",
        lockOptgroupOrder: false,
        sortField: "$order",
        searchField: ["text"],
        searchConjunction: "and",
        mode: null,
        wrapperClass: "ts-wrapper",
        controlClass: "ts-control",
        dropdownClass: "ts-dropdown",
        dropdownContentClass: "ts-dropdown-content",
        itemClass: "item",
        optionClass: "option",
        dropdownParent: null,
        controlInput: '<input type="text" autocomplete="off" size="1" />',
        copyClassesToDropdown: false,
        placeholder: null,
        hidePlaceholder: null,
        shouldLoad: function(query) {
          return query.length > 0;
        },
        /*
        load                 : null, // function(query, callback) { ... }
        score                : null, // function(search) { ... }
        onInitialize         : null, // function() { ... }
        onChange             : null, // function(value) { ... }
        onItemAdd            : null, // function(value, $item) { ... }
        onItemRemove         : null, // function(value) { ... }
        onClear              : null, // function() { ... }
        onOptionAdd          : null, // function(value, data) { ... }
        onOptionRemove       : null, // function(value) { ... }
        onOptionClear        : null, // function() { ... }
        onOptionGroupAdd     : null, // function(id, data) { ... }
        onOptionGroupRemove  : null, // function(id) { ... }
        onOptionGroupClear   : null, // function() { ... }
        onDropdownOpen       : null, // function(dropdown) { ... }
        onDropdownClose      : null, // function(dropdown) { ... }
        onType               : null, // function(str) { ... }
        onDelete             : null, // function(values) { ... }
        */
        render: {
          /*
          item: null,
          optgroup: null,
          optgroup_header: null,
          option: null,
          option_create: null
          */
        }
      };
    }
  });

  // ../../../node_modules/tom-select/dist/esm/getSettings.js
  function getSettings(input, settings_user) {
    var settings = Object.assign({}, defaults_default, settings_user);
    var attr_data = settings.dataAttr;
    var field_label = settings.labelField;
    var field_value = settings.valueField;
    var field_disabled = settings.disabledField;
    var field_optgroup = settings.optgroupField;
    var field_optgroup_label = settings.optgroupLabelField;
    var field_optgroup_value = settings.optgroupValueField;
    var tag_name = input.tagName.toLowerCase();
    var placeholder = input.getAttribute("placeholder") || input.getAttribute("data-placeholder");
    if (!placeholder && !settings.allowEmptyOption) {
      let option = input.querySelector('option[value=""]');
      if (option) {
        placeholder = option.textContent;
      }
    }
    var settings_element = {
      placeholder,
      options: [],
      optgroups: [],
      items: [],
      maxItems: null
    };
    var init_select = () => {
      var tagName;
      var options = settings_element.options;
      var optionsMap = {};
      var group_count = 1;
      let $order = 0;
      var readData = (el) => {
        var data = Object.assign({}, el.dataset);
        var json = attr_data && data[attr_data];
        if (typeof json === "string" && json.length) {
          data = Object.assign(data, JSON.parse(json));
        }
        return data;
      };
      var addOption = (option, group) => {
        var value = hash_key(option.value);
        if (value == null)
          return;
        if (!value && !settings.allowEmptyOption)
          return;
        if (optionsMap.hasOwnProperty(value)) {
          if (group) {
            var arr = optionsMap[value][field_optgroup];
            if (!arr) {
              optionsMap[value][field_optgroup] = group;
            } else if (!Array.isArray(arr)) {
              optionsMap[value][field_optgroup] = [arr, group];
            } else {
              arr.push(group);
            }
          }
        } else {
          var option_data = readData(option);
          option_data[field_label] = option_data[field_label] || option.textContent;
          option_data[field_value] = option_data[field_value] || value;
          option_data[field_disabled] = option_data[field_disabled] || option.disabled;
          option_data[field_optgroup] = option_data[field_optgroup] || group;
          option_data.$option = option;
          option_data.$order = option_data.$order || ++$order;
          optionsMap[value] = option_data;
          options.push(option_data);
        }
        if (option.selected) {
          settings_element.items.push(value);
        }
      };
      var addGroup = (optgroup) => {
        var id, optgroup_data;
        optgroup_data = readData(optgroup);
        optgroup_data[field_optgroup_label] = optgroup_data[field_optgroup_label] || optgroup.getAttribute("label") || "";
        optgroup_data[field_optgroup_value] = optgroup_data[field_optgroup_value] || group_count++;
        optgroup_data[field_disabled] = optgroup_data[field_disabled] || optgroup.disabled;
        optgroup_data.$order = optgroup_data.$order || ++$order;
        settings_element.optgroups.push(optgroup_data);
        id = optgroup_data[field_optgroup_value];
        iterate2(optgroup.children, (option) => {
          addOption(option, id);
        });
      };
      settings_element.maxItems = input.hasAttribute("multiple") ? null : 1;
      iterate2(input.children, (child) => {
        tagName = child.tagName.toLowerCase();
        if (tagName === "optgroup") {
          addGroup(child);
        } else if (tagName === "option") {
          addOption(child);
        }
      });
    };
    var init_textbox = () => {
      const data_raw = input.getAttribute(attr_data);
      if (!data_raw) {
        var value = input.value.trim() || "";
        if (!settings.allowEmptyOption && !value.length)
          return;
        const values = value.split(settings.delimiter);
        iterate2(values, (value2) => {
          const option = {};
          option[field_label] = value2;
          option[field_value] = value2;
          settings_element.options.push(option);
        });
        settings_element.items = values;
      } else {
        settings_element.options = JSON.parse(data_raw);
        iterate2(settings_element.options, (opt) => {
          settings_element.items.push(opt[field_value]);
        });
      }
    };
    if (tag_name === "select") {
      init_select();
    } else {
      init_textbox();
    }
    return Object.assign({}, defaults_default, settings_element, settings_user);
  }
  var init_getSettings = __esm({
    "../../../node_modules/tom-select/dist/esm/getSettings.js"() {
      init_defaults();
      init_utils2();
    }
  });

  // ../../../node_modules/tom-select/dist/esm/tom-select.js
  var instance_i, TomSelect;
  var init_tom_select = __esm({
    "../../../node_modules/tom-select/dist/esm/tom-select.js"() {
      init_microevent();
      init_microplugin();
      init_sifter();
      init_esm();
      init_highlight();
      init_constants();
      init_getSettings();
      init_utils2();
      init_vanilla();
      instance_i = 0;
      TomSelect = class extends MicroPlugin(MicroEvent) {
        constructor(input_arg, user_settings) {
          super();
          this.order = 0;
          this.isOpen = false;
          this.isDisabled = false;
          this.isReadOnly = false;
          this.isInvalid = false;
          this.isValid = true;
          this.isLocked = false;
          this.isFocused = false;
          this.isInputHidden = false;
          this.isSetup = false;
          this.ignoreFocus = false;
          this.ignoreHover = false;
          this.hasOptions = false;
          this.lastValue = "";
          this.caretPos = 0;
          this.loading = 0;
          this.loadedSearches = {};
          this.activeOption = null;
          this.activeItems = [];
          this.optgroups = {};
          this.options = {};
          this.userOptions = {};
          this.items = [];
          this.refreshTimeout = null;
          instance_i++;
          var dir;
          var input = getDom(input_arg);
          if (input.tomselect) {
            throw new Error("Tom Select already initialized on this element");
          }
          input.tomselect = this;
          var computedStyle = window.getComputedStyle && window.getComputedStyle(input, null);
          dir = computedStyle.getPropertyValue("direction");
          const settings = getSettings(input, user_settings);
          this.settings = settings;
          this.input = input;
          this.tabIndex = input.tabIndex || 0;
          this.is_select_tag = input.tagName.toLowerCase() === "select";
          this.rtl = /rtl/i.test(dir);
          this.inputId = getId(input, "tomselect-" + instance_i);
          this.isRequired = input.required;
          this.sifter = new Sifter(this.options, { diacritics: settings.diacritics });
          settings.mode = settings.mode || (settings.maxItems === 1 ? "single" : "multi");
          if (typeof settings.hideSelected !== "boolean") {
            settings.hideSelected = settings.mode === "multi";
          }
          if (typeof settings.hidePlaceholder !== "boolean") {
            settings.hidePlaceholder = settings.mode !== "multi";
          }
          var filter = settings.createFilter;
          if (typeof filter !== "function") {
            if (typeof filter === "string") {
              filter = new RegExp(filter);
            }
            if (filter instanceof RegExp) {
              settings.createFilter = (input2) => filter.test(input2);
            } else {
              settings.createFilter = (value) => {
                return this.settings.duplicates || !this.options[value];
              };
            }
          }
          this.initializePlugins(settings.plugins);
          this.setupCallbacks();
          this.setupTemplates();
          const wrapper = getDom("<div>");
          const control = getDom("<div>");
          const dropdown = this._render("dropdown");
          const dropdown_content = getDom(`<div role="listbox" tabindex="-1">`);
          const classes = this.input.getAttribute("class") || "";
          const inputMode = settings.mode;
          var control_input;
          addClasses(wrapper, settings.wrapperClass, classes, inputMode);
          addClasses(control, settings.controlClass);
          append(wrapper, control);
          addClasses(dropdown, settings.dropdownClass, inputMode);
          if (settings.copyClassesToDropdown) {
            addClasses(dropdown, classes);
          }
          addClasses(dropdown_content, settings.dropdownContentClass);
          append(dropdown, dropdown_content);
          getDom(settings.dropdownParent || wrapper).appendChild(dropdown);
          if (isHtmlString(settings.controlInput)) {
            control_input = getDom(settings.controlInput);
            var attrs = ["autocorrect", "autocapitalize", "autocomplete", "spellcheck", "aria-label"];
            iterate2(attrs, (attr) => {
              if (input.getAttribute(attr)) {
                setAttr(control_input, { [attr]: input.getAttribute(attr) });
              }
            });
            control_input.tabIndex = -1;
            control.appendChild(control_input);
            this.focus_node = control_input;
          } else if (settings.controlInput) {
            control_input = getDom(settings.controlInput);
            this.focus_node = control_input;
          } else {
            control_input = getDom("<input/>");
            this.focus_node = control;
          }
          this.wrapper = wrapper;
          this.dropdown = dropdown;
          this.dropdown_content = dropdown_content;
          this.control = control;
          this.control_input = control_input;
          this.setup();
        }
        /**
         * set up event bindings.
         *
         */
        setup() {
          const self = this;
          const settings = self.settings;
          const control_input = self.control_input;
          const dropdown = self.dropdown;
          const dropdown_content = self.dropdown_content;
          const wrapper = self.wrapper;
          const control = self.control;
          const input = self.input;
          const focus_node = self.focus_node;
          const passive_event = { passive: true };
          const listboxId = self.inputId + "-ts-dropdown";
          setAttr(dropdown_content, {
            id: listboxId
          });
          setAttr(focus_node, {
            role: "combobox",
            "aria-haspopup": "listbox",
            "aria-expanded": "false",
            "aria-controls": listboxId
          });
          const control_id = getId(focus_node, self.inputId + "-ts-control");
          const query = "label[for='" + escapeQuery(self.inputId) + "']";
          const label = document.querySelector(query);
          const label_click = self.focus.bind(self);
          if (label) {
            addEvent(label, "click", label_click);
            setAttr(label, { for: control_id });
            const label_id = getId(label, self.inputId + "-ts-label");
            setAttr(focus_node, { "aria-labelledby": label_id });
            setAttr(dropdown_content, { "aria-labelledby": label_id });
          }
          wrapper.style.width = input.style.width;
          wrapper.style.minWidth = input.style.minWidth;
          wrapper.style.maxWidth = input.style.maxWidth;
          if (self.plugins.names.length) {
            const classes_plugins = "plugin-" + self.plugins.names.join(" plugin-");
            addClasses([wrapper, dropdown], classes_plugins);
          }
          if ((settings.maxItems === null || settings.maxItems > 1) && self.is_select_tag) {
            setAttr(input, { multiple: "multiple" });
          }
          if (settings.placeholder) {
            setAttr(control_input, { placeholder: settings.placeholder });
          }
          if (!settings.splitOn && settings.delimiter) {
            settings.splitOn = new RegExp("\\s*" + escape_regex(settings.delimiter) + "+\\s*");
          }
          if (settings.load && settings.loadThrottle) {
            settings.load = loadDebounce(settings.load, settings.loadThrottle);
          }
          addEvent(dropdown, "mousemove", () => {
            self.ignoreHover = false;
          });
          addEvent(dropdown, "mouseenter", (e) => {
            var target_match = parentMatch(e.target, "[data-selectable]", dropdown);
            if (target_match)
              self.onOptionHover(e, target_match);
          }, { capture: true });
          addEvent(dropdown, "click", (evt) => {
            const option = parentMatch(evt.target, "[data-selectable]");
            if (option) {
              self.onOptionSelect(evt, option);
              preventDefault(evt, true);
            }
          });
          addEvent(control, "click", (evt) => {
            var target_match = parentMatch(evt.target, "[data-ts-item]", control);
            if (target_match && self.onItemSelect(evt, target_match)) {
              preventDefault(evt, true);
              return;
            }
            if (control_input.value != "") {
              return;
            }
            self.onClick();
            preventDefault(evt, true);
          });
          addEvent(focus_node, "keydown", (e) => self.onKeyDown(e));
          addEvent(control_input, "keypress", (e) => self.onKeyPress(e));
          addEvent(control_input, "input", (e) => self.onInput(e));
          addEvent(focus_node, "blur", (e) => self.onBlur(e));
          addEvent(focus_node, "focus", (e) => self.onFocus(e));
          addEvent(control_input, "paste", (e) => self.onPaste(e));
          const doc_mousedown = (evt) => {
            const target = evt.composedPath()[0];
            if (!wrapper.contains(target) && !dropdown.contains(target)) {
              if (self.isFocused) {
                self.blur();
              }
              self.inputState();
              return;
            }
            if (target == control_input && self.isOpen) {
              evt.stopPropagation();
            } else {
              preventDefault(evt, true);
            }
          };
          const win_scroll = () => {
            if (self.isOpen) {
              self.positionDropdown();
            }
          };
          const input_invalid = () => {
            if (self.isValid) {
              self.isValid = false;
              self.isInvalid = true;
              self.refreshState();
            }
          };
          addEvent(input, "invalid", input_invalid);
          addEvent(document, "mousedown", doc_mousedown);
          addEvent(window, "scroll", win_scroll, passive_event);
          addEvent(window, "resize", win_scroll, passive_event);
          this._destroy = () => {
            input.removeEventListener("invalid", input_invalid);
            document.removeEventListener("mousedown", doc_mousedown);
            window.removeEventListener("scroll", win_scroll);
            window.removeEventListener("resize", win_scroll);
            if (label)
              label.removeEventListener("click", label_click);
          };
          this.revertSettings = {
            innerHTML: input.innerHTML,
            tabIndex: input.tabIndex
          };
          input.tabIndex = -1;
          input.insertAdjacentElement("afterend", self.wrapper);
          self.sync(false);
          settings.items = [];
          delete settings.optgroups;
          delete settings.options;
          self.refreshItems();
          self.close(false);
          self.inputState();
          self.isSetup = true;
          if (input.disabled) {
            self.disable();
          } else if (input.readOnly) {
            self.setReadOnly(true);
          } else {
            self.enable();
          }
          self.on("change", this.onChange);
          addClasses(input, "tomselected", "ts-hidden-accessible");
          self.trigger("initialize");
          if (settings.preload === true) {
            self.preload();
          }
        }
        /**
         * Register options and optgroups
         *
         */
        setupOptions(options = [], optgroups = []) {
          this.addOptions(options);
          iterate2(optgroups, (optgroup) => {
            this.registerOptionGroup(optgroup);
          });
        }
        /**
         * Sets up default rendering functions.
         */
        setupTemplates() {
          var self = this;
          var field_label = self.settings.labelField;
          var field_optgroup = self.settings.optgroupLabelField;
          var templates = {
            "optgroup": (data) => {
              let optgroup = document.createElement("div");
              optgroup.className = "optgroup";
              optgroup.appendChild(data.options);
              return optgroup;
            },
            "optgroup_header": (data, escape) => {
              return '<div class="optgroup-header">' + escape(data[field_optgroup]) + "</div>";
            },
            "option": (data, escape) => {
              return "<div>" + escape(data[field_label]) + "</div>";
            },
            "item": (data, escape) => {
              return "<div>" + escape(data[field_label]) + "</div>";
            },
            "option_create": (data, escape) => {
              return '<div class="create">Add <strong>' + escape(data.input) + "</strong>&hellip;</div>";
            },
            "no_results": () => {
              return '<div class="no-results">No results found</div>';
            },
            "loading": () => {
              return '<div class="spinner"></div>';
            },
            "not_loading": () => {
            },
            "dropdown": () => {
              return "<div></div>";
            }
          };
          self.settings.render = Object.assign({}, templates, self.settings.render);
        }
        /**
         * Maps fired events to callbacks provided
         * in the settings used when creating the control.
         */
        setupCallbacks() {
          var key, fn2;
          var callbacks = {
            "initialize": "onInitialize",
            "change": "onChange",
            "item_add": "onItemAdd",
            "item_remove": "onItemRemove",
            "item_select": "onItemSelect",
            "clear": "onClear",
            "option_add": "onOptionAdd",
            "option_remove": "onOptionRemove",
            "option_clear": "onOptionClear",
            "optgroup_add": "onOptionGroupAdd",
            "optgroup_remove": "onOptionGroupRemove",
            "optgroup_clear": "onOptionGroupClear",
            "dropdown_open": "onDropdownOpen",
            "dropdown_close": "onDropdownClose",
            "type": "onType",
            "load": "onLoad",
            "focus": "onFocus",
            "blur": "onBlur"
          };
          for (key in callbacks) {
            fn2 = this.settings[callbacks[key]];
            if (fn2)
              this.on(key, fn2);
          }
        }
        /**
         * Sync the Tom Select instance with the original input or select
         *
         */
        sync(get_settings = true) {
          const self = this;
          const settings = get_settings ? getSettings(self.input, { delimiter: self.settings.delimiter, allowEmptyOption: self.settings.allowEmptyOption }) : self.settings;
          self.setupOptions(settings.options, settings.optgroups);
          self.setValue(settings.items || [], true);
          self.lastQuery = null;
        }
        /**
         * Triggered when the main control element
         * has a click event.
         *
         */
        onClick() {
          var self = this;
          if (self.activeItems.length > 0) {
            self.clearActiveItems();
            self.focus();
            return;
          }
          if (self.isFocused && self.isOpen) {
            self.blur();
          } else {
            self.focus();
          }
        }
        /**
         * @deprecated v1.7
         *
         */
        onMouseDown() {
        }
        /**
         * Triggered when the value of the control has been changed.
         * This should propagate the event to the original DOM
         * input / select element.
         */
        onChange() {
          triggerEvent(this.input, "input");
          triggerEvent(this.input, "change");
        }
        /**
         * Triggered on <input> paste.
         *
         */
        onPaste(e) {
          var self = this;
          if (self.isInputHidden || self.isLocked) {
            preventDefault(e);
            return;
          }
          if (!self.settings.splitOn) {
            return;
          }
          setTimeout(() => {
            var pastedText = self.inputValue();
            if (!pastedText.match(self.settings.splitOn)) {
              return;
            }
            var splitInput = pastedText.trim().split(self.settings.splitOn);
            iterate2(splitInput, (piece) => {
              const hash3 = hash_key(piece);
              if (hash3) {
                if (this.options[piece]) {
                  self.addItem(piece);
                } else {
                  self.createItem(piece);
                }
              }
            });
          }, 0);
        }
        /**
         * Triggered on <input> keypress.
         *
         */
        onKeyPress(e) {
          var self = this;
          if (self.isLocked) {
            preventDefault(e);
            return;
          }
          var character = String.fromCharCode(e.keyCode || e.which);
          if (self.settings.create && self.settings.mode === "multi" && character === self.settings.delimiter) {
            self.createItem();
            preventDefault(e);
            return;
          }
        }
        /**
         * Triggered on <input> keydown.
         *
         */
        onKeyDown(e) {
          var self = this;
          self.ignoreHover = true;
          if (self.isLocked) {
            if (e.keyCode !== KEY_TAB) {
              preventDefault(e);
            }
            return;
          }
          switch (e.keyCode) {
            // ctrl+A: select all
            case KEY_A:
              if (isKeyDown(KEY_SHORTCUT, e)) {
                if (self.control_input.value == "") {
                  preventDefault(e);
                  self.selectAll();
                  return;
                }
              }
              break;
            // esc: close dropdown
            case KEY_ESC:
              if (self.isOpen) {
                preventDefault(e, true);
                self.close();
              }
              self.clearActiveItems();
              return;
            // down: open dropdown or move selection down
            case KEY_DOWN:
              if (!self.isOpen && self.hasOptions) {
                self.open();
              } else if (self.activeOption) {
                let next = self.getAdjacent(self.activeOption, 1);
                if (next)
                  self.setActiveOption(next);
              }
              preventDefault(e);
              return;
            // up: move selection up
            case KEY_UP:
              if (self.activeOption) {
                let prev = self.getAdjacent(self.activeOption, -1);
                if (prev)
                  self.setActiveOption(prev);
              }
              preventDefault(e);
              return;
            // return: select active option
            case KEY_RETURN:
              if (self.canSelect(self.activeOption)) {
                self.onOptionSelect(e, self.activeOption);
                preventDefault(e);
              } else if (self.settings.create && self.createItem()) {
                preventDefault(e);
              } else if (document.activeElement == self.control_input && self.isOpen) {
                preventDefault(e);
              }
              return;
            // left: modifiy item selection to the left
            case KEY_LEFT:
              self.advanceSelection(-1, e);
              return;
            // right: modifiy item selection to the right
            case KEY_RIGHT:
              self.advanceSelection(1, e);
              return;
            // tab: select active option and/or create item
            case KEY_TAB:
              if (self.settings.selectOnTab) {
                if (self.canSelect(self.activeOption)) {
                  self.onOptionSelect(e, self.activeOption);
                  preventDefault(e);
                } else if (self.settings.create && self.createItem()) {
                  preventDefault(e);
                }
              }
              return;
            // delete|backspace: delete items
            case KEY_BACKSPACE:
            case KEY_DELETE:
              self.deleteSelection(e);
              return;
          }
          if (self.isInputHidden && !isKeyDown(KEY_SHORTCUT, e)) {
            preventDefault(e);
          }
        }
        /**
         * Triggered on <input> keyup.
         *
         */
        onInput(e) {
          if (this.isLocked) {
            return;
          }
          const value = this.inputValue();
          if (this.lastValue === value)
            return;
          this.lastValue = value;
          if (value == "") {
            this._onInput();
            return;
          }
          if (this.refreshTimeout) {
            window.clearTimeout(this.refreshTimeout);
          }
          this.refreshTimeout = timeout(() => {
            this.refreshTimeout = null;
            this._onInput();
          }, this.settings.refreshThrottle);
        }
        _onInput() {
          const value = this.lastValue;
          if (this.settings.shouldLoad.call(this, value)) {
            this.load(value);
          }
          this.refreshOptions();
          this.trigger("type", value);
        }
        /**
         * Triggered when the user rolls over
         * an option in the autocomplete dropdown menu.
         *
         */
        onOptionHover(evt, option) {
          if (this.ignoreHover)
            return;
          this.setActiveOption(option, false);
        }
        /**
         * Triggered on <input> focus.
         *
         */
        onFocus(e) {
          var self = this;
          var wasFocused = self.isFocused;
          if (self.isDisabled || self.isReadOnly) {
            self.blur();
            preventDefault(e);
            return;
          }
          if (self.ignoreFocus)
            return;
          self.isFocused = true;
          if (self.settings.preload === "focus")
            self.preload();
          if (!wasFocused)
            self.trigger("focus");
          if (!self.activeItems.length) {
            self.inputState();
            self.refreshOptions(!!self.settings.openOnFocus);
          }
          self.refreshState();
        }
        /**
         * Triggered on <input> blur.
         *
         */
        onBlur(e) {
          if (document.hasFocus() === false)
            return;
          var self = this;
          if (!self.isFocused)
            return;
          self.isFocused = false;
          self.ignoreFocus = false;
          var deactivate = () => {
            self.close();
            self.setActiveItem();
            self.setCaret(self.items.length);
            self.trigger("blur");
          };
          if (self.settings.create && self.settings.createOnBlur) {
            self.createItem(null, deactivate);
          } else {
            deactivate();
          }
        }
        /**
         * Triggered when the user clicks on an option
         * in the autocomplete dropdown menu.
         *
         */
        onOptionSelect(evt, option) {
          var value, self = this;
          if (option.parentElement && option.parentElement.matches("[data-disabled]")) {
            return;
          }
          if (option.classList.contains("create")) {
            self.createItem(null, () => {
              if (self.settings.closeAfterSelect) {
                self.close();
              } else if (self.settings.clearAfterSelect) {
                self.setTextboxValue();
              }
            });
          } else {
            value = option.dataset.value;
            if (typeof value !== "undefined") {
              self.lastQuery = null;
              self.addItem(value);
              if (self.settings.closeAfterSelect) {
                self.close();
              } else if (self.settings.clearAfterSelect) {
                self.setTextboxValue();
              }
              if (!self.settings.hideSelected && evt.type && /click/.test(evt.type)) {
                self.setActiveOption(option);
              }
            }
          }
        }
        /**
         * Return true if the given option can be selected
         *
         */
        canSelect(option) {
          if (this.isOpen && option && this.dropdown_content.contains(option)) {
            return true;
          }
          return false;
        }
        /**
         * Triggered when the user clicks on an item
         * that has been selected.
         *
         */
        onItemSelect(evt, item) {
          var self = this;
          if (!self.isLocked && self.settings.mode === "multi") {
            preventDefault(evt);
            self.setActiveItem(item, evt);
            return true;
          }
          return false;
        }
        /**
         * Determines whether or not to invoke
         * the user-provided option provider / loader
         *
         * Note, there is a subtle difference between
         * this.canLoad() and this.settings.shouldLoad();
         *
         *	- settings.shouldLoad() is a user-input validator.
         *	When false is returned, the not_loading template
         *	will be added to the dropdown
         *
         *	- canLoad() is lower level validator that checks
         * 	the Tom Select instance. There is no inherent user
         *	feedback when canLoad returns false
         *
         */
        canLoad(value) {
          if (!this.settings.load)
            return false;
          if (this.loadedSearches.hasOwnProperty(value))
            return false;
          return true;
        }
        /**
         * Invokes the user-provided option provider / loader.
         *
         */
        load(value) {
          const self = this;
          if (!self.canLoad(value))
            return;
          addClasses(self.wrapper, self.settings.loadingClass);
          self.loading++;
          const callback = self.loadCallback.bind(self);
          self.settings.load.call(self, value, callback);
        }
        /**
         * Invoked by the user-provided option provider
         *
         */
        loadCallback(options, optgroups) {
          const self = this;
          self.loading = Math.max(self.loading - 1, 0);
          self.lastQuery = null;
          self.clearActiveOption();
          self.setupOptions(options, optgroups);
          self.refreshOptions(self.isFocused && !self.isInputHidden);
          if (!self.loading) {
            removeClasses(self.wrapper, self.settings.loadingClass);
          }
          self.trigger("load", options, optgroups);
        }
        preload() {
          var classList = this.wrapper.classList;
          if (classList.contains("preloaded"))
            return;
          classList.add("preloaded");
          this.load("");
        }
        /**
         * Sets the input field of the control to the specified value.
         *
         */
        setTextboxValue(value = "") {
          var input = this.control_input;
          var changed = input.value !== value;
          if (changed) {
            input.value = value;
            triggerEvent(input, "update");
            this.lastValue = value;
          }
        }
        /**
         * Returns the value of the control. If multiple items
         * can be selected (e.g. <select multiple>), this returns
         * an array. If only one item can be selected, this
         * returns a string.
         *
         */
        getValue() {
          if (this.is_select_tag && this.input.hasAttribute("multiple")) {
            return this.items;
          }
          return this.items.join(this.settings.delimiter);
        }
        /**
         * Resets the selected items to the given value.
         *
         */
        setValue(value, silent) {
          var events = silent ? [] : ["change"];
          debounce_events(this, events, () => {
            this.clear(silent);
            this.addItems(value, silent);
          });
        }
        /**
         * Resets the number of max items to the given value
         *
         */
        setMaxItems(value) {
          if (value === 0)
            value = null;
          this.settings.maxItems = value;
          this.refreshState();
        }
        /**
         * Sets the selected item.
         *
         */
        setActiveItem(item, e) {
          var self = this;
          var eventName;
          var i, begin, end2, swap;
          var last;
          if (self.settings.mode === "single")
            return;
          if (!item) {
            self.clearActiveItems();
            if (self.isFocused) {
              self.inputState();
            }
            return;
          }
          eventName = e && e.type.toLowerCase();
          if (eventName === "click" && isKeyDown("shiftKey", e) && self.activeItems.length) {
            last = self.getLastActive();
            begin = Array.prototype.indexOf.call(self.control.children, last);
            end2 = Array.prototype.indexOf.call(self.control.children, item);
            if (begin > end2) {
              swap = begin;
              begin = end2;
              end2 = swap;
            }
            for (i = begin; i <= end2; i++) {
              item = self.control.children[i];
              if (self.activeItems.indexOf(item) === -1) {
                self.setActiveItemClass(item);
              }
            }
            preventDefault(e);
          } else if (eventName === "click" && isKeyDown(KEY_SHORTCUT, e) || eventName === "keydown" && isKeyDown("shiftKey", e)) {
            if (item.classList.contains("active")) {
              self.removeActiveItem(item);
            } else {
              self.setActiveItemClass(item);
            }
          } else {
            self.clearActiveItems();
            self.setActiveItemClass(item);
          }
          self.inputState();
          if (!self.isFocused) {
            self.focus();
          }
        }
        /**
         * Set the active and last-active classes
         *
         */
        setActiveItemClass(item) {
          const self = this;
          const last_active = self.control.querySelector(".last-active");
          if (last_active)
            removeClasses(last_active, "last-active");
          addClasses(item, "active last-active");
          self.trigger("item_select", item);
          if (self.activeItems.indexOf(item) == -1) {
            self.activeItems.push(item);
          }
        }
        /**
         * Remove active item
         *
         */
        removeActiveItem(item) {
          var idx = this.activeItems.indexOf(item);
          this.activeItems.splice(idx, 1);
          removeClasses(item, "active");
        }
        /**
         * Clears all the active items
         *
         */
        clearActiveItems() {
          removeClasses(this.activeItems, "active");
          this.activeItems = [];
        }
        /**
         * Sets the selected item in the dropdown menu
         * of available options.
         *
         */
        setActiveOption(option, scroll = true) {
          if (option === this.activeOption) {
            return;
          }
          this.clearActiveOption();
          if (!option)
            return;
          this.activeOption = option;
          setAttr(this.focus_node, { "aria-activedescendant": option.getAttribute("id") });
          setAttr(option, { "aria-selected": "true" });
          addClasses(option, "active");
          if (scroll)
            this.scrollToOption(option);
        }
        /**
         * Sets the dropdown_content scrollTop to display the option
         *
         */
        scrollToOption(option, behavior) {
          if (!option)
            return;
          const content = this.dropdown_content;
          const height_menu = content.clientHeight;
          const scrollTop = content.scrollTop || 0;
          const height_item = option.offsetHeight;
          const y = option.getBoundingClientRect().top - content.getBoundingClientRect().top + scrollTop;
          if (y + height_item > height_menu + scrollTop) {
            this.scroll(y - height_menu + height_item, behavior);
          } else if (y < scrollTop) {
            this.scroll(y, behavior);
          }
        }
        /**
         * Scroll the dropdown to the given position
         *
         */
        scroll(scrollTop, behavior) {
          const content = this.dropdown_content;
          if (behavior) {
            content.style.scrollBehavior = behavior;
          }
          content.scrollTop = scrollTop;
          content.style.scrollBehavior = "";
        }
        /**
         * Clears the active option
         *
         */
        clearActiveOption() {
          if (this.activeOption) {
            removeClasses(this.activeOption, "active");
            setAttr(this.activeOption, { "aria-selected": null });
          }
          this.activeOption = null;
          setAttr(this.focus_node, { "aria-activedescendant": null });
        }
        /**
         * Selects all items (CTRL + A).
         */
        selectAll() {
          const self = this;
          if (self.settings.mode === "single")
            return;
          const activeItems = self.controlChildren();
          if (!activeItems.length)
            return;
          self.inputState();
          self.close();
          self.activeItems = activeItems;
          iterate2(activeItems, (item) => {
            self.setActiveItemClass(item);
          });
        }
        /**
         * Determines if the control_input should be in a hidden or visible state
         *
         */
        inputState() {
          var self = this;
          if (!self.control.contains(self.control_input))
            return;
          setAttr(self.control_input, { placeholder: self.settings.placeholder });
          if (self.activeItems.length > 0 || !self.isFocused && self.settings.hidePlaceholder && self.items.length > 0) {
            self.setTextboxValue();
            self.isInputHidden = true;
          } else {
            if (self.settings.hidePlaceholder && self.items.length > 0) {
              setAttr(self.control_input, { placeholder: "" });
            }
            self.isInputHidden = false;
          }
          self.wrapper.classList.toggle("input-hidden", self.isInputHidden);
        }
        /**
         * Get the input value
         */
        inputValue() {
          return this.control_input.value.trim();
        }
        /**
         * Gives the control focus.
         */
        focus() {
          var self = this;
          if (self.isDisabled || self.isReadOnly)
            return;
          self.ignoreFocus = true;
          if (self.control_input.offsetWidth) {
            self.control_input.focus();
          } else {
            self.focus_node.focus();
          }
          setTimeout(() => {
            self.ignoreFocus = false;
            self.onFocus();
          }, 0);
        }
        /**
         * Forces the control out of focus.
         *
         */
        blur() {
          this.focus_node.blur();
          this.onBlur();
        }
        /**
         * Returns a function that scores an object
         * to show how good of a match it is to the
         * provided query.
         *
         * @return {function}
         */
        getScoreFunction(query) {
          return this.sifter.getScoreFunction(query, this.getSearchOptions());
        }
        /**
         * Returns search options for sifter (the system
         * for scoring and sorting results).
         *
         * @see https://github.com/orchidjs/sifter.js
         * @return {object}
         */
        getSearchOptions() {
          var settings = this.settings;
          var sort = settings.sortField;
          if (typeof settings.sortField === "string") {
            sort = [{ field: settings.sortField }];
          }
          return {
            fields: settings.searchField,
            conjunction: settings.searchConjunction,
            sort,
            nesting: settings.nesting
          };
        }
        /**
         * Searches through available options and returns
         * a sorted array of matches.
         *
         */
        search(query) {
          var result, calculateScore;
          var self = this;
          var options = this.getSearchOptions();
          if (self.settings.score) {
            calculateScore = self.settings.score.call(self, query);
            if (typeof calculateScore !== "function") {
              throw new Error('Tom Select "score" setting must be a function that returns a function');
            }
          }
          if (query !== self.lastQuery) {
            self.lastQuery = query;
            if (/(.)\1{15,}/.test(query)) {
              query = "";
            }
            result = self.sifter.search(query, Object.assign(options, { score: calculateScore }));
            self.currentResults = result;
          } else {
            result = Object.assign({}, self.currentResults);
          }
          if (self.settings.hideSelected) {
            result.items = result.items.filter((item) => {
              let hashed = hash_key(item.id);
              return !(hashed !== null && self.items.indexOf(hashed) !== -1);
            });
          }
          return result;
        }
        /**
         * Refreshes the list of available options shown
         * in the autocomplete dropdown menu.
         *
         */
        refreshOptions(triggerDropdown = true) {
          var i, j, k, n, optgroup, optgroups, html, has_create_option, active_group;
          var create3;
          const groups = {};
          const groups_order = [];
          var self = this;
          var query = self.inputValue();
          const same_query = query === self.lastQuery || query == "" && self.lastQuery == null;
          var results = self.search(query);
          var active_option = null;
          var show_dropdown = self.settings.shouldOpen || false;
          var dropdown_content = self.dropdown_content;
          if (same_query) {
            active_option = self.activeOption;
            if (active_option) {
              active_group = active_option.closest("[data-group]");
            }
          }
          n = results.items.length;
          if (typeof self.settings.maxOptions === "number") {
            n = Math.min(n, self.settings.maxOptions);
          }
          if (n > 0) {
            show_dropdown = true;
          }
          const getGroupFragment = (optgroup2, order2) => {
            let group_order_i = groups[optgroup2];
            if (group_order_i !== void 0) {
              let order_group = groups_order[group_order_i];
              if (order_group !== void 0) {
                return [group_order_i, order_group.fragment];
              }
            }
            let group_fragment = document.createDocumentFragment();
            group_order_i = groups_order.length;
            groups_order.push({ fragment: group_fragment, order: order2, optgroup: optgroup2 });
            return [group_order_i, group_fragment];
          };
          for (i = 0; i < n; i++) {
            let item = results.items[i];
            if (!item)
              continue;
            let opt_value = item.id;
            let option = self.options[opt_value];
            if (option === void 0)
              continue;
            let opt_hash = get_hash(opt_value);
            let option_el = self.getOption(opt_hash, true);
            if (!self.settings.hideSelected) {
              option_el.classList.toggle("selected", self.items.includes(opt_hash));
            }
            optgroup = option[self.settings.optgroupField] || "";
            optgroups = Array.isArray(optgroup) ? optgroup : [optgroup];
            for (j = 0, k = optgroups && optgroups.length; j < k; j++) {
              optgroup = optgroups[j];
              let order2 = option.$order;
              let self_optgroup = self.optgroups[optgroup];
              if (self_optgroup === void 0 && typeof self.settings.optionGroupRegister === "function") {
                var regGroup;
                if (regGroup = self.settings.optionGroupRegister.apply(self, [optgroup])) {
                  self.registerOptionGroup(regGroup);
                }
              }
              self_optgroup = self.optgroups[optgroup];
              if (self_optgroup === void 0) {
                optgroup = "";
              } else {
                order2 = self_optgroup.$order;
              }
              const [group_order_i, group_fragment] = getGroupFragment(optgroup, order2);
              if (j > 0) {
                option_el = option_el.cloneNode(true);
                setAttr(option_el, { id: option.$id + "-clone-" + j, "aria-selected": null });
                option_el.classList.add("ts-cloned");
                removeClasses(option_el, "active");
                if (self.activeOption && self.activeOption.dataset.value == opt_value) {
                  if (active_group && active_group.dataset.group === optgroup.toString()) {
                    active_option = option_el;
                  }
                }
              }
              group_fragment.appendChild(option_el);
              if (optgroup != "") {
                groups[optgroup] = group_order_i;
              }
            }
          }
          if (self.settings.lockOptgroupOrder) {
            groups_order.sort((a, b) => {
              return a.order - b.order;
            });
          }
          html = document.createDocumentFragment();
          iterate2(groups_order, (group_order) => {
            let group_fragment = group_order.fragment;
            let optgroup2 = group_order.optgroup;
            if (!group_fragment || !group_fragment.children.length)
              return;
            let group_heading = self.optgroups[optgroup2];
            if (group_heading !== void 0) {
              let group_options = document.createDocumentFragment();
              let header = self.render("optgroup_header", group_heading);
              append(group_options, header);
              append(group_options, group_fragment);
              let group_html = self.render("optgroup", { group: group_heading, options: group_options });
              append(html, group_html);
            } else {
              append(html, group_fragment);
            }
          });
          dropdown_content.innerHTML = "";
          append(dropdown_content, html);
          if (self.settings.highlight) {
            removeHighlight(dropdown_content);
            if (results.query.length && results.tokens.length) {
              iterate2(results.tokens, (tok) => {
                highlight(dropdown_content, tok.regex);
              });
            }
          }
          var add_template = (template) => {
            let content = self.render(template, { input: query });
            if (content) {
              show_dropdown = true;
              dropdown_content.insertBefore(content, dropdown_content.firstChild);
            }
            return content;
          };
          if (self.loading) {
            add_template("loading");
          } else if (!self.settings.shouldLoad.call(self, query)) {
            add_template("not_loading");
          } else if (results.items.length === 0) {
            add_template("no_results");
          }
          has_create_option = self.canCreate(query);
          if (has_create_option) {
            create3 = add_template("option_create");
          }
          self.hasOptions = results.items.length > 0 || has_create_option;
          if (show_dropdown) {
            if (results.items.length > 0) {
              if (!active_option && self.settings.mode === "single" && self.items[0] != void 0) {
                active_option = self.getOption(self.items[0]);
              }
              if (!dropdown_content.contains(active_option)) {
                let active_index = 0;
                if (create3 && !self.settings.addPrecedence) {
                  active_index = 1;
                }
                active_option = self.selectable()[active_index];
              }
            } else if (create3) {
              active_option = create3;
            }
            if (triggerDropdown && !self.isOpen) {
              self.open();
              self.scrollToOption(active_option, "auto");
            }
            self.setActiveOption(active_option);
          } else {
            self.clearActiveOption();
            if (triggerDropdown && self.isOpen) {
              self.close(false);
            }
          }
        }
        /**
         * Return list of selectable options
         *
         */
        selectable() {
          return this.dropdown_content.querySelectorAll("[data-selectable]");
        }
        /**
         * Adds an available option. If it already exists,
         * nothing will happen. Note: this does not refresh
         * the options list dropdown (use `refreshOptions`
         * for that).
         *
         * Usage:
         *
         *   this.addOption(data)
         *
         */
        addOption(data, user_created = false) {
          const self = this;
          if (Array.isArray(data)) {
            self.addOptions(data, user_created);
            return false;
          }
          const key = hash_key(data[self.settings.valueField]);
          if (key === null || self.options.hasOwnProperty(key)) {
            return false;
          }
          data.$order = data.$order || ++self.order;
          data.$id = self.inputId + "-opt-" + data.$order;
          self.options[key] = data;
          self.lastQuery = null;
          if (user_created) {
            self.userOptions[key] = user_created;
            self.trigger("option_add", key, data);
          }
          return key;
        }
        /**
         * Add multiple options
         *
         */
        addOptions(data, user_created = false) {
          iterate2(data, (dat) => {
            this.addOption(dat, user_created);
          });
        }
        /**
         * @deprecated 1.7.7
         */
        registerOption(data) {
          return this.addOption(data);
        }
        /**
         * Registers an option group to the pool of option groups.
         *
         * @return {boolean|string}
         */
        registerOptionGroup(data) {
          var key = hash_key(data[this.settings.optgroupValueField]);
          if (key === null)
            return false;
          data.$order = data.$order || ++this.order;
          this.optgroups[key] = data;
          return key;
        }
        /**
         * Registers a new optgroup for options
         * to be bucketed into.
         *
         */
        addOptionGroup(id, data) {
          var hashed_id;
          data[this.settings.optgroupValueField] = id;
          if (hashed_id = this.registerOptionGroup(data)) {
            this.trigger("optgroup_add", hashed_id, data);
          }
        }
        /**
         * Removes an existing option group.
         *
         */
        removeOptionGroup(id) {
          if (this.optgroups.hasOwnProperty(id)) {
            delete this.optgroups[id];
            this.clearCache();
            this.trigger("optgroup_remove", id);
          }
        }
        /**
         * Clears all existing option groups.
         */
        clearOptionGroups() {
          this.optgroups = {};
          this.clearCache();
          this.trigger("optgroup_clear");
        }
        /**
         * Updates an option available for selection. If
         * it is visible in the selected items or options
         * dropdown, it will be re-rendered automatically.
         *
         */
        updateOption(value, data) {
          const self = this;
          var item_new;
          var index_item;
          const value_old = hash_key(value);
          const value_new = hash_key(data[self.settings.valueField]);
          if (value_old === null)
            return;
          const data_old = self.options[value_old];
          if (data_old == void 0)
            return;
          if (typeof value_new !== "string")
            throw new Error("Value must be set in option data");
          const option = self.getOption(value_old);
          const item = self.getItem(value_old);
          data.$order = data.$order || data_old.$order;
          delete self.options[value_old];
          self.uncacheValue(value_new);
          self.options[value_new] = data;
          if (option) {
            if (self.dropdown_content.contains(option)) {
              const option_new = self._render("option", data);
              replaceNode(option, option_new);
              if (self.activeOption === option) {
                self.setActiveOption(option_new);
              }
            }
            option.remove();
          }
          if (item) {
            index_item = self.items.indexOf(value_old);
            if (index_item !== -1) {
              self.items.splice(index_item, 1, value_new);
            }
            item_new = self._render("item", data);
            if (item.classList.contains("active"))
              addClasses(item_new, "active");
            replaceNode(item, item_new);
          }
          self.lastQuery = null;
        }
        /**
         * Removes a single option.
         *
         */
        removeOption(value, silent) {
          const self = this;
          value = get_hash(value);
          self.uncacheValue(value);
          delete self.userOptions[value];
          delete self.options[value];
          self.lastQuery = null;
          self.trigger("option_remove", value);
          self.removeItem(value, silent);
        }
        /**
         * Clears all options.
         */
        clearOptions(filter) {
          const boundFilter = (filter || this.clearFilter).bind(this);
          this.loadedSearches = {};
          this.userOptions = {};
          this.clearCache();
          const selected = {};
          iterate2(this.options, (option, key) => {
            if (boundFilter(option, key)) {
              selected[key] = option;
            }
          });
          this.options = this.sifter.items = selected;
          this.lastQuery = null;
          this.trigger("option_clear");
        }
        /**
         * Used by clearOptions() to decide whether or not an option should be removed
         * Return true to keep an option, false to remove
         *
         */
        clearFilter(option, value) {
          if (this.items.indexOf(value) >= 0) {
            return true;
          }
          return false;
        }
        /**
         * Returns the dom element of the option
         * matching the given value.
         *
         */
        getOption(value, create3 = false) {
          const hashed = hash_key(value);
          if (hashed === null)
            return null;
          const option = this.options[hashed];
          if (option != void 0) {
            if (option.$div) {
              return option.$div;
            }
            if (create3) {
              return this._render("option", option);
            }
          }
          return null;
        }
        /**
         * Returns the dom element of the next or previous dom element of the same type
         * Note: adjacent options may not be adjacent DOM elements (optgroups)
         *
         */
        getAdjacent(option, direction, type = "option") {
          var self = this, all;
          if (!option) {
            return null;
          }
          if (type == "item") {
            all = self.controlChildren();
          } else {
            all = self.dropdown_content.querySelectorAll("[data-selectable]");
          }
          for (let i = 0; i < all.length; i++) {
            if (all[i] != option) {
              continue;
            }
            if (direction > 0) {
              return all[i + 1];
            }
            return all[i - 1];
          }
          return null;
        }
        /**
         * Returns the dom element of the item
         * matching the given value.
         *
         */
        getItem(item) {
          if (typeof item == "object") {
            return item;
          }
          var value = hash_key(item);
          return value !== null ? this.control.querySelector(`[data-value="${addSlashes(value)}"]`) : null;
        }
        /**
         * "Selects" multiple items at once. Adds them to the list
         * at the current caret position.
         *
         */
        addItems(values, silent) {
          var self = this;
          var items = Array.isArray(values) ? values : [values];
          items = items.filter((x) => self.items.indexOf(x) === -1);
          const last_item = items[items.length - 1];
          items.forEach((item) => {
            self.isPending = item !== last_item;
            self.addItem(item, silent);
          });
        }
        /**
         * "Selects" an item. Adds it to the list
         * at the current caret position.
         *
         */
        addItem(value, silent) {
          var events = silent ? [] : ["change", "dropdown_close"];
          debounce_events(this, events, () => {
            var item, wasFull;
            const self = this;
            const inputMode = self.settings.mode;
            const hashed = hash_key(value);
            if (hashed && self.items.indexOf(hashed) !== -1) {
              if (inputMode === "single") {
                self.close();
              }
              if (inputMode === "single" || !self.settings.duplicates) {
                return;
              }
            }
            if (hashed === null || !self.options.hasOwnProperty(hashed))
              return;
            if (inputMode === "single")
              self.clear(silent);
            if (inputMode === "multi" && self.isFull())
              return;
            item = self._render("item", self.options[hashed]);
            if (self.control.contains(item)) {
              item = item.cloneNode(true);
            }
            wasFull = self.isFull();
            self.items.splice(self.caretPos, 0, hashed);
            self.insertAtCaret(item);
            if (self.isSetup) {
              if (!self.isPending && self.settings.hideSelected) {
                let option = self.getOption(hashed);
                let next = self.getAdjacent(option, 1);
                if (next) {
                  self.setActiveOption(next);
                }
              }
              if (self.settings.clearAfterSelect) {
                self.setTextboxValue();
              }
              if (!self.isPending && !self.settings.closeAfterSelect) {
                self.refreshOptions(self.isFocused && inputMode !== "single");
              }
              if (self.settings.closeAfterSelect != false && self.isFull()) {
                self.close();
              } else if (!self.isPending) {
                self.positionDropdown();
              }
              self.trigger("item_add", hashed, item);
              if (!self.isPending) {
                self.updateOriginalInput({ silent });
              }
            }
            if (!self.isPending || !wasFull && self.isFull()) {
              self.inputState();
              self.refreshState();
            }
          });
        }
        /**
         * Removes the selected item matching
         * the provided value.
         *
         */
        removeItem(item = null, silent) {
          const self = this;
          item = self.getItem(item);
          if (!item)
            return;
          var i, idx;
          const value = item.dataset.value;
          i = nodeIndex(item);
          item.remove();
          if (item.classList.contains("active")) {
            idx = self.activeItems.indexOf(item);
            self.activeItems.splice(idx, 1);
            removeClasses(item, "active");
          }
          self.items.splice(i, 1);
          self.lastQuery = null;
          if (!self.settings.persist && self.userOptions.hasOwnProperty(value)) {
            self.removeOption(value, silent);
          }
          if (i < self.caretPos) {
            self.setCaret(self.caretPos - 1);
          }
          self.updateOriginalInput({ silent });
          self.refreshState();
          self.positionDropdown();
          self.trigger("item_remove", value, item);
        }
        /**
         * Invokes the `create` method provided in the
         * TomSelect options that should provide the data
         * for the new item, given the user input.
         *
         * Once this completes, it will be added
         * to the item list.
         *
         */
        createItem(input = null, callback = () => {
        }) {
          if (arguments.length === 3) {
            callback = arguments[2];
          }
          if (typeof callback != "function") {
            callback = () => {
            };
          }
          var self = this;
          var caret = self.caretPos;
          var output;
          input = input || self.inputValue();
          if (!self.canCreate(input)) {
            const hash3 = hash_key(input);
            if (hash3) {
              if (this.options[input]) {
                self.addItem(input);
              }
            }
            callback();
            return false;
          }
          self.lock();
          var created = false;
          var create3 = (data) => {
            self.unlock();
            if (!data || typeof data !== "object")
              return callback();
            var value = hash_key(data[self.settings.valueField]);
            if (typeof value !== "string") {
              return callback();
            }
            self.setTextboxValue();
            self.addOption(data, true);
            self.setCaret(caret);
            self.addItem(value);
            callback(data);
            created = true;
          };
          if (typeof self.settings.create === "function") {
            output = self.settings.create.call(this, input, create3);
          } else {
            output = {
              [self.settings.labelField]: input,
              [self.settings.valueField]: input
            };
          }
          if (!created) {
            create3(output);
          }
          return true;
        }
        /**
         * Re-renders the selected item lists.
         */
        refreshItems() {
          var self = this;
          self.lastQuery = null;
          if (self.isSetup) {
            self.addItems(self.items);
          }
          self.updateOriginalInput();
          self.refreshState();
        }
        /**
         * Updates all state-dependent attributes
         * and CSS classes.
         */
        refreshState() {
          const self = this;
          self.refreshValidityState();
          const isFull = self.isFull();
          const isLocked = self.isLocked;
          self.wrapper.classList.toggle("rtl", self.rtl);
          const wrap_classList = self.wrapper.classList;
          wrap_classList.toggle("focus", self.isFocused);
          wrap_classList.toggle("disabled", self.isDisabled);
          wrap_classList.toggle("readonly", self.isReadOnly);
          wrap_classList.toggle("required", self.isRequired);
          wrap_classList.toggle("invalid", !self.isValid);
          wrap_classList.toggle("locked", isLocked);
          wrap_classList.toggle("full", isFull);
          wrap_classList.toggle("input-active", self.isFocused && !self.isInputHidden);
          wrap_classList.toggle("dropdown-active", self.isOpen);
          wrap_classList.toggle("has-options", isEmptyObject(self.options));
          wrap_classList.toggle("has-items", self.items.length > 0);
        }
        /**
         * Update the `required` attribute of both input and control input.
         *
         * The `required` property needs to be activated on the control input
         * for the error to be displayed at the right place. `required` also
         * needs to be temporarily deactivated on the input since the input is
         * hidden and can't show errors.
         */
        refreshValidityState() {
          var self = this;
          if (!self.input.validity) {
            return;
          }
          self.isValid = self.input.validity.valid;
          self.isInvalid = !self.isValid;
        }
        /**
         * Determines whether or not more items can be added
         * to the control without exceeding the user-defined maximum.
         *
         * @returns {boolean}
         */
        isFull() {
          return this.settings.maxItems !== null && this.items.length >= this.settings.maxItems;
        }
        /**
         * Refreshes the original <select> or <input>
         * element to reflect the current state.
         *
         */
        updateOriginalInput(opts = {}) {
          const self = this;
          var option, label;
          const empty_option = self.input.querySelector('option[value=""]');
          if (self.is_select_tag) {
            let AddSelected = function(option_el, value, label2) {
              if (!option_el) {
                option_el = getDom('<option value="' + escape_html(value) + '">' + escape_html(label2) + "</option>");
              }
              if (option_el != empty_option) {
                self.input.append(option_el);
              }
              selected.push(option_el);
              if (option_el != empty_option || has_selected > 0) {
                option_el.selected = true;
              }
              return option_el;
            };
            const selected = [];
            const has_selected = self.input.querySelectorAll("option:checked").length;
            self.input.querySelectorAll("option:checked").forEach((option_el) => {
              option_el.selected = false;
            });
            if (self.items.length == 0 && self.settings.mode == "single") {
              AddSelected(empty_option, "", "");
            } else {
              self.items.forEach((value) => {
                option = self.options[value];
                label = option[self.settings.labelField] || "";
                if (selected.includes(option.$option)) {
                  const reuse_opt = self.input.querySelector(`option[value="${addSlashes(value)}"]:not(:checked)`);
                  AddSelected(reuse_opt, value, label);
                } else {
                  option.$option = AddSelected(option.$option, value, label);
                }
              });
            }
          } else {
            self.input.value = self.getValue();
          }
          if (self.isSetup) {
            if (!opts.silent) {
              self.trigger("change", self.getValue());
            }
          }
        }
        /**
         * Shows the autocomplete dropdown containing
         * the available options.
         */
        open() {
          var self = this;
          if (self.isLocked || self.isOpen || self.settings.mode === "multi" && self.isFull())
            return;
          self.isOpen = true;
          setAttr(self.focus_node, { "aria-expanded": "true" });
          self.refreshState();
          applyCSS(self.dropdown, { visibility: "hidden", display: "block" });
          self.positionDropdown();
          applyCSS(self.dropdown, { visibility: "visible", display: "block" });
          self.focus();
          self.trigger("dropdown_open", self.dropdown);
        }
        /**
         * Closes the autocomplete dropdown menu.
         */
        close(setTextboxValue = true) {
          var self = this;
          var trigger = self.isOpen;
          if (setTextboxValue) {
            self.setTextboxValue();
            if (self.settings.mode === "single" && self.items.length) {
              self.inputState();
            }
          }
          self.isOpen = false;
          setAttr(self.focus_node, { "aria-expanded": "false" });
          applyCSS(self.dropdown, { display: "none" });
          if (self.settings.hideSelected) {
            self.clearActiveOption();
          }
          self.refreshState();
          if (trigger)
            self.trigger("dropdown_close", self.dropdown);
        }
        /**
         * Calculates and applies the appropriate
         * position of the dropdown if dropdownParent = 'body'.
         * Otherwise, position is determined by css
         */
        positionDropdown() {
          if (this.settings.dropdownParent !== "body") {
            return;
          }
          var context = this.control;
          var rect = context.getBoundingClientRect();
          var top2 = context.offsetHeight + rect.top + window.scrollY;
          var left2 = rect.left + window.scrollX;
          applyCSS(this.dropdown, {
            width: rect.width + "px",
            top: top2 + "px",
            left: left2 + "px"
          });
        }
        /**
         * Resets / clears all selected items
         * from the control.
         *
         */
        clear(silent) {
          var self = this;
          if (!self.items.length)
            return;
          var items = self.controlChildren();
          iterate2(items, (item) => {
            self.removeItem(item, true);
          });
          self.inputState();
          if (!silent)
            self.updateOriginalInput();
          self.trigger("clear");
        }
        /**
         * A helper method for inserting an element
         * at the current caret position.
         *
         */
        insertAtCaret(el) {
          const self = this;
          const caret = self.caretPos;
          const target = self.control;
          target.insertBefore(el, target.children[caret] || null);
          self.setCaret(caret + 1);
        }
        /**
         * Removes the current selected item(s).
         *
         */
        deleteSelection(e) {
          var direction, selection, caret, tail;
          var self = this;
          direction = e && e.keyCode === KEY_BACKSPACE ? -1 : 1;
          selection = getSelection(self.control_input);
          const rm_items = [];
          if (self.activeItems.length) {
            tail = getTail(self.activeItems, direction);
            caret = nodeIndex(tail);
            if (direction > 0) {
              caret++;
            }
            iterate2(self.activeItems, (item) => rm_items.push(item));
          } else if ((self.isFocused || self.settings.mode === "single") && self.items.length) {
            const items = self.controlChildren();
            let rm_item;
            if (direction < 0 && selection.start === 0 && selection.length === 0) {
              rm_item = items[self.caretPos - 1];
            } else if (direction > 0 && selection.start === self.inputValue().length) {
              rm_item = items[self.caretPos];
            }
            if (rm_item !== void 0) {
              rm_items.push(rm_item);
            }
          }
          if (!self.shouldDelete(rm_items, e)) {
            return false;
          }
          preventDefault(e, true);
          if (typeof caret !== "undefined") {
            self.setCaret(caret);
          }
          while (rm_items.length) {
            self.removeItem(rm_items.pop());
          }
          self.inputState();
          self.positionDropdown();
          self.refreshOptions(false);
          return true;
        }
        /**
         * Return true if the items should be deleted
         */
        shouldDelete(items, evt) {
          const values = items.map((item) => item.dataset.value);
          if (!values.length || typeof this.settings.onDelete === "function" && this.settings.onDelete.call(this, values, evt) === false) {
            return false;
          }
          return true;
        }
        /**
         * Selects the previous / next item (depending on the `direction` argument).
         *
         * > 0 - right
         * < 0 - left
         *
         */
        advanceSelection(direction, e) {
          var last_active, adjacent, self = this;
          if (self.rtl)
            direction *= -1;
          if (self.inputValue().length)
            return;
          if (isKeyDown(KEY_SHORTCUT, e) || isKeyDown("shiftKey", e)) {
            last_active = self.getLastActive(direction);
            if (last_active) {
              if (!last_active.classList.contains("active")) {
                adjacent = last_active;
              } else {
                adjacent = self.getAdjacent(last_active, direction, "item");
              }
            } else if (direction > 0) {
              adjacent = self.control_input.nextElementSibling;
            } else {
              adjacent = self.control_input.previousElementSibling;
            }
            if (adjacent) {
              if (adjacent.classList.contains("active")) {
                self.removeActiveItem(last_active);
              }
              self.setActiveItemClass(adjacent);
            }
          } else {
            self.moveCaret(direction);
          }
        }
        moveCaret(direction) {
        }
        /**
         * Get the last active item
         *
         */
        getLastActive(direction) {
          let last_active = this.control.querySelector(".last-active");
          if (last_active) {
            return last_active;
          }
          var result = this.control.querySelectorAll(".active");
          if (result) {
            return getTail(result, direction);
          }
        }
        /**
         * Moves the caret to the specified index.
         *
         * The input must be moved by leaving it in place and moving the
         * siblings, due to the fact that focus cannot be restored once lost
         * on mobile webkit devices
         *
         */
        setCaret(new_pos) {
          this.caretPos = this.items.length;
        }
        /**
         * Return list of item dom elements
         *
         */
        controlChildren() {
          return Array.from(this.control.querySelectorAll("[data-ts-item]"));
        }
        /**
         * Disables user input on the control. Used while
         * items are being asynchronously created.
         */
        lock() {
          this.setLocked(true);
        }
        /**
         * Re-enables user input on the control.
         */
        unlock() {
          this.setLocked(false);
        }
        /**
         * Disable or enable user input on the control
         */
        setLocked(lock = this.isReadOnly || this.isDisabled) {
          this.isLocked = lock;
          this.refreshState();
        }
        /**
         * Disables user input on the control completely.
         * While disabled, it cannot receive focus.
         */
        disable() {
          this.setDisabled(true);
          this.close();
        }
        /**
         * Enables the control so that it can respond
         * to focus and user input.
         */
        enable() {
          this.setDisabled(false);
        }
        setDisabled(disabled) {
          this.focus_node.tabIndex = disabled ? -1 : this.tabIndex;
          this.isDisabled = disabled;
          this.input.disabled = disabled;
          this.control_input.disabled = disabled;
          this.setLocked();
        }
        setReadOnly(isReadOnly) {
          this.isReadOnly = isReadOnly;
          this.input.readOnly = isReadOnly;
          this.control_input.readOnly = isReadOnly;
          this.setLocked();
        }
        /**
         * Completely destroys the control and
         * unbinds all event listeners so that it can
         * be garbage collected.
         */
        destroy() {
          var self = this;
          var revertSettings = self.revertSettings;
          self.trigger("destroy");
          self.off();
          self.wrapper.remove();
          self.dropdown.remove();
          self.input.innerHTML = revertSettings.innerHTML;
          self.input.tabIndex = revertSettings.tabIndex;
          removeClasses(self.input, "tomselected", "ts-hidden-accessible");
          self._destroy();
          delete self.input.tomselect;
        }
        /**
         * A helper method for rendering "item" and
         * "option" templates, given the data.
         *
         */
        render(templateName, data) {
          var id, html;
          const self = this;
          if (typeof this.settings.render[templateName] !== "function") {
            return null;
          }
          html = self.settings.render[templateName].call(this, data, escape_html);
          if (!html) {
            return null;
          }
          html = getDom(html);
          if (templateName === "option" || templateName === "option_create") {
            if (data[self.settings.disabledField]) {
              setAttr(html, { "aria-disabled": "true" });
            } else {
              setAttr(html, { "data-selectable": "" });
            }
          } else if (templateName === "optgroup") {
            id = data.group[self.settings.optgroupValueField];
            setAttr(html, { "data-group": id });
            if (data.group[self.settings.disabledField]) {
              setAttr(html, { "data-disabled": "" });
            }
          }
          if (templateName === "option" || templateName === "item") {
            const value = get_hash(data[self.settings.valueField]);
            setAttr(html, { "data-value": value });
            if (templateName === "item") {
              addClasses(html, self.settings.itemClass);
              setAttr(html, { "data-ts-item": "" });
            } else {
              addClasses(html, self.settings.optionClass);
              setAttr(html, {
                role: "option",
                id: data.$id
              });
              data.$div = html;
              self.options[value] = data;
            }
          }
          return html;
        }
        /**
         * Type guarded rendering
         *
         */
        _render(templateName, data) {
          const html = this.render(templateName, data);
          if (html == null) {
            throw "HTMLElement expected";
          }
          return html;
        }
        /**
         * Clears the render cache for a template. If
         * no template is given, clears all render
         * caches.
         *
         */
        clearCache() {
          iterate2(this.options, (option) => {
            if (option.$div) {
              option.$div.remove();
              delete option.$div;
            }
          });
        }
        /**
         * Removes a value from item and option caches
         *
         */
        uncacheValue(value) {
          const option_el = this.getOption(value);
          if (option_el)
            option_el.remove();
        }
        /**
         * Determines whether or not to display the
         * create item prompt, given a user input.
         *
         */
        canCreate(input) {
          return this.settings.create && input.length > 0 && this.settings.createFilter.call(this, input);
        }
        /**
         * Wraps this.`method` so that `new_fn` can be invoked 'before', 'after', or 'instead' of the original method
         *
         * this.hook('instead','onKeyDown',function( arg1, arg2 ...){
         *
         * });
         */
        hook(when, method, new_fn) {
          var self = this;
          var orig_method = self[method];
          self[method] = function() {
            var result, result_new;
            if (when === "after") {
              result = orig_method.apply(self, arguments);
            }
            result_new = new_fn.apply(self, arguments);
            if (when === "instead") {
              return result_new;
            }
            if (when === "before") {
              result = orig_method.apply(self, arguments);
            }
            return result;
          };
        }
      };
    }
  });

  // ../../../node_modules/tom-select/dist/esm/plugins/change_listener/plugin.js
  function plugin() {
    addEvent2(this.input, "change", () => {
      this.sync();
    });
  }
  var addEvent2;
  var init_plugin = __esm({
    "../../../node_modules/tom-select/dist/esm/plugins/change_listener/plugin.js"() {
      addEvent2 = (target, type, callback, options) => {
        target.addEventListener(type, callback, options);
      };
    }
  });

  // ../../../node_modules/tom-select/dist/esm/plugins/checkbox_options/plugin.js
  function plugin2(userOptions) {
    var self = this;
    var orig_onOptionSelect = self.onOptionSelect;
    self.settings.hideSelected = false;
    const cbOptions = Object.assign({
      // so that the user may add different ones as well
      className: "tomselect-checkbox",
      // the following default to the historic plugin's values
      checkedClassNames: void 0,
      uncheckedClassNames: void 0
    }, userOptions);
    var UpdateChecked = function UpdateChecked2(checkbox, toCheck) {
      if (toCheck) {
        checkbox.checked = true;
        if (cbOptions.uncheckedClassNames) {
          checkbox.classList.remove(...cbOptions.uncheckedClassNames);
        }
        if (cbOptions.checkedClassNames) {
          checkbox.classList.add(...cbOptions.checkedClassNames);
        }
      } else {
        checkbox.checked = false;
        if (cbOptions.checkedClassNames) {
          checkbox.classList.remove(...cbOptions.checkedClassNames);
        }
        if (cbOptions.uncheckedClassNames) {
          checkbox.classList.add(...cbOptions.uncheckedClassNames);
        }
      }
    };
    var UpdateCheckbox = function UpdateCheckbox2(option) {
      setTimeout(() => {
        var checkbox = option.querySelector("input." + cbOptions.className);
        if (checkbox instanceof HTMLInputElement) {
          UpdateChecked(checkbox, option.classList.contains("selected"));
        }
      }, 1);
    };
    self.hook("after", "setupTemplates", () => {
      var orig_render_option = self.settings.render.option;
      self.settings.render.option = (data, escape_html3) => {
        var rendered = getDom2(orig_render_option.call(self, data, escape_html3));
        var checkbox = document.createElement("input");
        if (cbOptions.className) {
          checkbox.classList.add(cbOptions.className);
        }
        checkbox.addEventListener("click", function(evt) {
          preventDefault2(evt);
        });
        checkbox.type = "checkbox";
        const hashed = hash_key2(data[self.settings.valueField]);
        UpdateChecked(checkbox, !!(hashed && self.items.indexOf(hashed) > -1));
        rendered.prepend(checkbox);
        return rendered;
      };
    });
    self.on("item_remove", (value) => {
      var option = self.getOption(value);
      if (option) {
        option.classList.remove("selected");
        UpdateCheckbox(option);
      }
    });
    self.on("item_add", (value) => {
      var option = self.getOption(value);
      if (option) {
        UpdateCheckbox(option);
      }
    });
    self.hook("instead", "onOptionSelect", (evt, option) => {
      if (option.classList.contains("selected")) {
        option.classList.remove("selected");
        self.removeItem(option.dataset.value);
        self.refreshOptions();
        preventDefault2(evt, true);
        return;
      }
      orig_onOptionSelect.call(self, evt, option);
      UpdateCheckbox(option);
    });
  }
  var hash_key2, get_hash2, preventDefault2, getDom2, isHtmlString2;
  var init_plugin2 = __esm({
    "../../../node_modules/tom-select/dist/esm/plugins/checkbox_options/plugin.js"() {
      hash_key2 = (value) => {
        if (typeof value === "undefined" || value === null) return null;
        return get_hash2(value);
      };
      get_hash2 = (value) => {
        if (typeof value === "boolean") return value ? "1" : "0";
        return value + "";
      };
      preventDefault2 = (evt, stop = false) => {
        if (evt) {
          evt.preventDefault();
          if (stop) {
            evt.stopPropagation();
          }
        }
      };
      getDom2 = (query) => {
        if (query.jquery) {
          return query[0];
        }
        if (query instanceof HTMLElement) {
          return query;
        }
        if (isHtmlString2(query)) {
          var tpl = document.createElement("template");
          tpl.innerHTML = query.trim();
          return tpl.content.firstChild;
        }
        return document.querySelector(query);
      };
      isHtmlString2 = (arg) => {
        if (typeof arg === "string" && arg.indexOf("<") > -1) {
          return true;
        }
        return false;
      };
    }
  });

  // ../../../node_modules/tom-select/dist/esm/plugins/clear_button/plugin.js
  function plugin3(userOptions) {
    const self = this;
    const options = Object.assign({
      className: "clear-button",
      title: "Clear All",
      role: "button",
      tabindex: 0,
      html: (data) => {
        return `<div class="${data.className}" title="${data.title}" role="${data.role}" tabindex="${data.tabindex}">&times;</div>`;
      }
    }, userOptions);
    self.on("initialize", () => {
      var button = getDom3(options.html(options));
      button.addEventListener("click", (evt) => {
        if (self.isLocked) return;
        self.clear();
        if (self.settings.mode === "single" && self.settings.allowEmptyOption) {
          self.addItem("");
        }
        self.refreshOptions(false);
        evt.preventDefault();
        evt.stopPropagation();
      });
      self.control.appendChild(button);
    });
  }
  var getDom3, isHtmlString3;
  var init_plugin3 = __esm({
    "../../../node_modules/tom-select/dist/esm/plugins/clear_button/plugin.js"() {
      getDom3 = (query) => {
        if (query.jquery) {
          return query[0];
        }
        if (query instanceof HTMLElement) {
          return query;
        }
        if (isHtmlString3(query)) {
          var tpl = document.createElement("template");
          tpl.innerHTML = query.trim();
          return tpl.content.firstChild;
        }
        return document.querySelector(query);
      };
      isHtmlString3 = (arg) => {
        if (typeof arg === "string" && arg.indexOf("<") > -1) {
          return true;
        }
        return false;
      };
    }
  });

  // ../../../node_modules/tom-select/dist/esm/plugins/drag_drop/plugin.js
  function plugin4() {
    var self = this;
    if (self.settings.mode !== "multi") return;
    var orig_lock = self.lock;
    var orig_unlock = self.unlock;
    let sortable = true;
    let drag_item;
    self.hook("after", "setupTemplates", () => {
      var orig_render_item = self.settings.render.item;
      self.settings.render.item = (data, escape) => {
        const item = getDom4(orig_render_item.call(self, data, escape));
        setAttr2(item, {
          "draggable": "true"
        });
        const mousedown = (evt) => {
          if (!sortable) preventDefault3(evt);
          evt.stopPropagation();
        };
        const dragStart = (evt) => {
          drag_item = item;
          setTimeout(() => {
            item.classList.add("ts-dragging");
          }, 0);
        };
        const dragOver = (evt) => {
          evt.preventDefault();
          item.classList.add("ts-drag-over");
          moveitem(item, drag_item);
        };
        const dragLeave = () => {
          item.classList.remove("ts-drag-over");
        };
        const moveitem = (targetitem, dragitem) => {
          if (dragitem === void 0) return;
          if (isBefore(dragitem, item)) {
            insertAfter(targetitem, dragitem);
          } else {
            insertBefore(targetitem, dragitem);
          }
        };
        const dragend = () => {
          var _drag_item;
          document.querySelectorAll(".ts-drag-over").forEach((el) => el.classList.remove("ts-drag-over"));
          (_drag_item = drag_item) == null || _drag_item.classList.remove("ts-dragging");
          drag_item = void 0;
          var values = [];
          self.control.querySelectorAll(`[data-value]`).forEach((el) => {
            if (el.dataset.value) {
              let value = el.dataset.value;
              if (value) {
                values.push(value);
              }
            }
          });
          self.setValue(values);
        };
        addEvent3(item, "mousedown", mousedown);
        addEvent3(item, "dragstart", dragStart);
        addEvent3(item, "dragenter", dragOver);
        addEvent3(item, "dragover", dragOver);
        addEvent3(item, "dragleave", dragLeave);
        addEvent3(item, "dragend", dragend);
        return item;
      };
    });
    self.hook("instead", "lock", () => {
      sortable = false;
      return orig_lock.call(self);
    });
    self.hook("instead", "unlock", () => {
      sortable = true;
      return orig_unlock.call(self);
    });
  }
  var preventDefault3, addEvent3, iterate3, getDom4, isHtmlString4, setAttr2, insertAfter, insertBefore, isBefore;
  var init_plugin4 = __esm({
    "../../../node_modules/tom-select/dist/esm/plugins/drag_drop/plugin.js"() {
      preventDefault3 = (evt, stop = false) => {
        if (evt) {
          evt.preventDefault();
          if (stop) {
            evt.stopPropagation();
          }
        }
      };
      addEvent3 = (target, type, callback, options) => {
        target.addEventListener(type, callback, options);
      };
      iterate3 = (object, callback) => {
        if (Array.isArray(object)) {
          object.forEach(callback);
        } else {
          for (var key in object) {
            if (object.hasOwnProperty(key)) {
              callback(object[key], key);
            }
          }
        }
      };
      getDom4 = (query) => {
        if (query.jquery) {
          return query[0];
        }
        if (query instanceof HTMLElement) {
          return query;
        }
        if (isHtmlString4(query)) {
          var tpl = document.createElement("template");
          tpl.innerHTML = query.trim();
          return tpl.content.firstChild;
        }
        return document.querySelector(query);
      };
      isHtmlString4 = (arg) => {
        if (typeof arg === "string" && arg.indexOf("<") > -1) {
          return true;
        }
        return false;
      };
      setAttr2 = (el, attrs) => {
        iterate3(attrs, (val, attr) => {
          if (val == null) {
            el.removeAttribute(attr);
          } else {
            el.setAttribute(attr, "" + val);
          }
        });
      };
      insertAfter = (referenceNode, newNode) => {
        var _referenceNode$parent;
        (_referenceNode$parent = referenceNode.parentNode) == null || _referenceNode$parent.insertBefore(newNode, referenceNode.nextSibling);
      };
      insertBefore = (referenceNode, newNode) => {
        var _referenceNode$parent2;
        (_referenceNode$parent2 = referenceNode.parentNode) == null || _referenceNode$parent2.insertBefore(newNode, referenceNode);
      };
      isBefore = (referenceNode, newNode) => {
        do {
          var _newNode;
          newNode = (_newNode = newNode) == null ? void 0 : _newNode.previousElementSibling;
          if (referenceNode == newNode) {
            return true;
          }
        } while (newNode && newNode.previousElementSibling);
        return false;
      };
    }
  });

  // ../../../node_modules/tom-select/dist/esm/plugins/dropdown_header/plugin.js
  function plugin5(userOptions) {
    const self = this;
    const options = Object.assign({
      title: "Untitled",
      headerClass: "dropdown-header",
      titleRowClass: "dropdown-header-title",
      labelClass: "dropdown-header-label",
      closeClass: "dropdown-header-close",
      html: (data) => {
        return '<div class="' + data.headerClass + '"><div class="' + data.titleRowClass + '"><span class="' + data.labelClass + '">' + data.title + '</span><a class="' + data.closeClass + '">&times;</a></div></div>';
      }
    }, userOptions);
    self.on("initialize", () => {
      var header = getDom5(options.html(options));
      var close_link = header.querySelector("." + options.closeClass);
      if (close_link) {
        close_link.addEventListener("click", (evt) => {
          preventDefault4(evt, true);
          self.close();
        });
      }
      self.dropdown.insertBefore(header, self.dropdown.firstChild);
    });
  }
  var preventDefault4, getDom5, isHtmlString5;
  var init_plugin5 = __esm({
    "../../../node_modules/tom-select/dist/esm/plugins/dropdown_header/plugin.js"() {
      preventDefault4 = (evt, stop = false) => {
        if (evt) {
          evt.preventDefault();
          if (stop) {
            evt.stopPropagation();
          }
        }
      };
      getDom5 = (query) => {
        if (query.jquery) {
          return query[0];
        }
        if (query instanceof HTMLElement) {
          return query;
        }
        if (isHtmlString5(query)) {
          var tpl = document.createElement("template");
          tpl.innerHTML = query.trim();
          return tpl.content.firstChild;
        }
        return document.querySelector(query);
      };
      isHtmlString5 = (arg) => {
        if (typeof arg === "string" && arg.indexOf("<") > -1) {
          return true;
        }
        return false;
      };
    }
  });

  // ../../../node_modules/tom-select/dist/esm/plugins/caret_position/plugin.js
  function plugin6() {
    var self = this;
    self.hook("instead", "setCaret", (new_pos) => {
      if (self.settings.mode === "single" || !self.control.contains(self.control_input)) {
        new_pos = self.items.length;
      } else {
        new_pos = Math.max(0, Math.min(self.items.length, new_pos));
        if (new_pos != self.caretPos && !self.isPending) {
          self.controlChildren().forEach((child, j) => {
            if (j < new_pos) {
              self.control_input.insertAdjacentElement("beforebegin", child);
            } else {
              self.control.appendChild(child);
            }
          });
        }
      }
      self.caretPos = new_pos;
    });
    self.hook("instead", "moveCaret", (direction) => {
      if (!self.isFocused) return;
      const last_active = self.getLastActive(direction);
      if (last_active) {
        const idx = nodeIndex2(last_active);
        self.setCaret(direction > 0 ? idx + 1 : idx);
        self.setActiveItem();
        removeClasses2(last_active, "last-active");
      } else {
        self.setCaret(self.caretPos + direction);
      }
    });
  }
  var iterate4, removeClasses2, classesArray2, castAsArray2, nodeIndex2;
  var init_plugin6 = __esm({
    "../../../node_modules/tom-select/dist/esm/plugins/caret_position/plugin.js"() {
      iterate4 = (object, callback) => {
        if (Array.isArray(object)) {
          object.forEach(callback);
        } else {
          for (var key in object) {
            if (object.hasOwnProperty(key)) {
              callback(object[key], key);
            }
          }
        }
      };
      removeClasses2 = (elmts, ...classes) => {
        var norm_classes = classesArray2(classes);
        elmts = castAsArray2(elmts);
        elmts.map((el) => {
          norm_classes.map((cls) => {
            el.classList.remove(cls);
          });
        });
      };
      classesArray2 = (args) => {
        var classes = [];
        iterate4(args, (_classes) => {
          if (typeof _classes === "string") {
            _classes = _classes.trim().split(/[\t\n\f\r\s]/);
          }
          if (Array.isArray(_classes)) {
            classes = classes.concat(_classes);
          }
        });
        return classes.filter(Boolean);
      };
      castAsArray2 = (arg) => {
        if (!Array.isArray(arg)) {
          arg = [arg];
        }
        return arg;
      };
      nodeIndex2 = (el, amongst) => {
        if (!el) return -1;
        amongst = amongst || el.nodeName;
        var i = 0;
        while (el = el.previousElementSibling) {
          if (el.matches(amongst)) {
            i++;
          }
        }
        return i;
      };
    }
  });

  // ../../../node_modules/tom-select/dist/esm/plugins/dropdown_input/plugin.js
  function plugin7() {
    const self = this;
    self.settings.shouldOpen = true;
    self.hook("before", "setup", () => {
      var _self$input;
      self.focus_node = self.control;
      addClasses2(self.control_input, "dropdown-input");
      const div = getDom6('<div class="dropdown-input-wrap">');
      div.append(self.control_input);
      self.dropdown.insertBefore(div, self.dropdown.firstChild);
      const placeholder = getDom6('<input class="items-placeholder" tabindex="-1" />');
      placeholder.placeholder = self.settings.placeholder || "";
      self.control.append(placeholder);
      const label = (_self$input = self.input) == null ? void 0 : _self$input.getAttribute("aria-label");
      if (!label) return;
      placeholder.setAttribute("aria-label", label);
    });
    self.on("initialize", () => {
      self.control_input.addEventListener("keydown", (evt) => {
        switch (evt.keyCode) {
          case KEY_ESC2:
            if (self.isOpen) {
              preventDefault5(evt, true);
              self.close();
            }
            self.clearActiveItems();
            return;
          case KEY_TAB2:
            self.focus_node.tabIndex = -1;
            break;
        }
        return self.onKeyDown.call(self, evt);
      });
      self.on("blur", () => {
        self.focus_node.tabIndex = self.isDisabled ? -1 : self.tabIndex;
      });
      self.on("dropdown_open", () => {
        self.control_input.focus();
      });
      const orig_onBlur = self.onBlur;
      self.hook("instead", "onBlur", (evt) => {
        if (evt && evt.relatedTarget == self.control_input) return;
        return orig_onBlur.call(self);
      });
      addEvent4(self.control_input, "blur", () => self.onBlur());
      self.hook("before", "close", () => {
        if (!self.isOpen) return;
        self.focus_node.focus({
          preventScroll: true
        });
      });
    });
  }
  var KEY_ESC2, KEY_TAB2, preventDefault5, addEvent4, iterate5, getDom6, isHtmlString6, addClasses2, classesArray3, castAsArray3;
  var init_plugin7 = __esm({
    "../../../node_modules/tom-select/dist/esm/plugins/dropdown_input/plugin.js"() {
      KEY_ESC2 = 27;
      KEY_TAB2 = 9;
      preventDefault5 = (evt, stop = false) => {
        if (evt) {
          evt.preventDefault();
          if (stop) {
            evt.stopPropagation();
          }
        }
      };
      addEvent4 = (target, type, callback, options) => {
        target.addEventListener(type, callback, options);
      };
      iterate5 = (object, callback) => {
        if (Array.isArray(object)) {
          object.forEach(callback);
        } else {
          for (var key in object) {
            if (object.hasOwnProperty(key)) {
              callback(object[key], key);
            }
          }
        }
      };
      getDom6 = (query) => {
        if (query.jquery) {
          return query[0];
        }
        if (query instanceof HTMLElement) {
          return query;
        }
        if (isHtmlString6(query)) {
          var tpl = document.createElement("template");
          tpl.innerHTML = query.trim();
          return tpl.content.firstChild;
        }
        return document.querySelector(query);
      };
      isHtmlString6 = (arg) => {
        if (typeof arg === "string" && arg.indexOf("<") > -1) {
          return true;
        }
        return false;
      };
      addClasses2 = (elmts, ...classes) => {
        var norm_classes = classesArray3(classes);
        elmts = castAsArray3(elmts);
        elmts.map((el) => {
          norm_classes.map((cls) => {
            el.classList.add(cls);
          });
        });
      };
      classesArray3 = (args) => {
        var classes = [];
        iterate5(args, (_classes) => {
          if (typeof _classes === "string") {
            _classes = _classes.trim().split(/[\t\n\f\r\s]/);
          }
          if (Array.isArray(_classes)) {
            classes = classes.concat(_classes);
          }
        });
        return classes.filter(Boolean);
      };
      castAsArray3 = (arg) => {
        if (!Array.isArray(arg)) {
          arg = [arg];
        }
        return arg;
      };
    }
  });

  // ../../../node_modules/tom-select/dist/esm/plugins/input_autogrow/plugin.js
  function plugin8() {
    var self = this;
    self.on("initialize", () => {
      var test_input = document.createElement("span");
      var control = self.control_input;
      test_input.style.cssText = "position:absolute; top:-99999px; left:-99999px; width:auto; padding:0; white-space:pre; ";
      self.wrapper.appendChild(test_input);
      var transfer_styles = ["letterSpacing", "fontSize", "fontFamily", "fontWeight", "textTransform"];
      for (const style_name of transfer_styles) {
        test_input.style[style_name] = control.style[style_name];
      }
      var resize = () => {
        test_input.textContent = control.value;
        control.style.width = test_input.clientWidth + "px";
      };
      resize();
      self.on("update item_add item_remove", resize);
      addEvent5(control, "input", resize);
      addEvent5(control, "keyup", resize);
      addEvent5(control, "blur", resize);
      addEvent5(control, "update", resize);
    });
  }
  var addEvent5;
  var init_plugin8 = __esm({
    "../../../node_modules/tom-select/dist/esm/plugins/input_autogrow/plugin.js"() {
      addEvent5 = (target, type, callback, options) => {
        target.addEventListener(type, callback, options);
      };
    }
  });

  // ../../../node_modules/tom-select/dist/esm/plugins/no_backspace_delete/plugin.js
  function plugin9() {
    var self = this;
    var orig_deleteSelection = self.deleteSelection;
    this.hook("instead", "deleteSelection", (evt) => {
      if (self.activeItems.length) {
        return orig_deleteSelection.call(self, evt);
      }
      return false;
    });
  }
  var init_plugin9 = __esm({
    "../../../node_modules/tom-select/dist/esm/plugins/no_backspace_delete/plugin.js"() {
    }
  });

  // ../../../node_modules/tom-select/dist/esm/plugins/no_active_items/plugin.js
  function plugin10() {
    this.hook("instead", "setActiveItem", () => {
    });
    this.hook("instead", "selectAll", () => {
    });
  }
  var init_plugin10 = __esm({
    "../../../node_modules/tom-select/dist/esm/plugins/no_active_items/plugin.js"() {
    }
  });

  // ../../../node_modules/tom-select/dist/esm/plugins/optgroup_columns/plugin.js
  function plugin11() {
    var self = this;
    var orig_keydown = self.onKeyDown;
    self.hook("instead", "onKeyDown", (evt) => {
      var index, option, options, optgroup;
      if (!self.isOpen || !(evt.keyCode === KEY_LEFT2 || evt.keyCode === KEY_RIGHT2)) {
        return orig_keydown.call(self, evt);
      }
      self.ignoreHover = true;
      optgroup = parentMatch2(self.activeOption, "[data-group]");
      index = nodeIndex3(self.activeOption, "[data-selectable]");
      if (!optgroup) {
        return;
      }
      if (evt.keyCode === KEY_LEFT2) {
        optgroup = optgroup.previousSibling;
      } else {
        optgroup = optgroup.nextSibling;
      }
      if (!optgroup) {
        return;
      }
      options = optgroup.querySelectorAll("[data-selectable]");
      option = options[Math.min(options.length - 1, index)];
      if (option) {
        self.setActiveOption(option);
      }
    });
  }
  var KEY_LEFT2, KEY_RIGHT2, parentMatch2, nodeIndex3;
  var init_plugin11 = __esm({
    "../../../node_modules/tom-select/dist/esm/plugins/optgroup_columns/plugin.js"() {
      KEY_LEFT2 = 37;
      KEY_RIGHT2 = 39;
      parentMatch2 = (target, selector, wrapper) => {
        while (target && target.matches) {
          if (target.matches(selector)) {
            return target;
          }
          target = target.parentNode;
        }
      };
      nodeIndex3 = (el, amongst) => {
        if (!el) return -1;
        amongst = amongst || el.nodeName;
        var i = 0;
        while (el = el.previousElementSibling) {
          if (el.matches(amongst)) {
            i++;
          }
        }
        return i;
      };
    }
  });

  // ../../../node_modules/tom-select/dist/esm/plugins/remove_button/plugin.js
  function plugin12(userOptions) {
    const options = Object.assign({
      label: "&times;",
      title: "Remove",
      className: "remove",
      append: true
    }, userOptions);
    var self = this;
    if (!options.append) {
      return;
    }
    var html = '<a href="javascript:void(0)" class="' + options.className + '" tabindex="-1" title="' + escape_html2(options.title) + '">' + options.label + "</a>";
    self.hook("after", "setupTemplates", () => {
      var orig_render_item = self.settings.render.item;
      self.settings.render.item = (data, escape) => {
        var item = getDom7(orig_render_item.call(self, data, escape));
        var close_button = getDom7(html);
        item.appendChild(close_button);
        addEvent6(close_button, "mousedown", (evt) => {
          preventDefault6(evt, true);
        });
        addEvent6(close_button, "click", (evt) => {
          if (self.isLocked) return;
          preventDefault6(evt, true);
          if (self.isLocked) return;
          if (!self.shouldDelete([item], evt)) return;
          self.removeItem(item);
          self.refreshOptions(false);
          self.inputState();
        });
        return item;
      };
    });
  }
  var escape_html2, preventDefault6, addEvent6, getDom7, isHtmlString7;
  var init_plugin12 = __esm({
    "../../../node_modules/tom-select/dist/esm/plugins/remove_button/plugin.js"() {
      escape_html2 = (str) => {
        return (str + "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
      };
      preventDefault6 = (evt, stop = false) => {
        if (evt) {
          evt.preventDefault();
          if (stop) {
            evt.stopPropagation();
          }
        }
      };
      addEvent6 = (target, type, callback, options) => {
        target.addEventListener(type, callback, options);
      };
      getDom7 = (query) => {
        if (query.jquery) {
          return query[0];
        }
        if (query instanceof HTMLElement) {
          return query;
        }
        if (isHtmlString7(query)) {
          var tpl = document.createElement("template");
          tpl.innerHTML = query.trim();
          return tpl.content.firstChild;
        }
        return document.querySelector(query);
      };
      isHtmlString7 = (arg) => {
        if (typeof arg === "string" && arg.indexOf("<") > -1) {
          return true;
        }
        return false;
      };
    }
  });

  // ../../../node_modules/tom-select/dist/esm/plugins/restore_on_backspace/plugin.js
  function plugin13(userOptions) {
    const self = this;
    const options = Object.assign({
      text: (option) => {
        return option[self.settings.labelField];
      }
    }, userOptions);
    self.on("item_remove", function(value) {
      if (!self.isFocused) {
        return;
      }
      if (self.control_input.value.trim() === "") {
        var option = self.options[value];
        if (option) {
          self.setTextboxValue(options.text.call(self, option));
        }
      }
    });
  }
  var init_plugin13 = __esm({
    "../../../node_modules/tom-select/dist/esm/plugins/restore_on_backspace/plugin.js"() {
    }
  });

  // ../../../node_modules/tom-select/dist/esm/plugins/virtual_scroll/plugin.js
  function plugin14() {
    const self = this;
    const orig_canLoad = self.canLoad;
    const orig_clearActiveOption = self.clearActiveOption;
    const orig_loadCallback = self.loadCallback;
    var pagination = {};
    var dropdown_content;
    var loading_more = false;
    var load_more_opt;
    var default_values = [];
    if (!self.settings.shouldLoadMore) {
      self.settings.shouldLoadMore = () => {
        const scroll_percent = dropdown_content.clientHeight / (dropdown_content.scrollHeight - dropdown_content.scrollTop);
        if (scroll_percent > 0.9) {
          return true;
        }
        if (self.activeOption) {
          var selectable = self.selectable();
          var index = Array.from(selectable).indexOf(self.activeOption);
          if (index >= selectable.length - 2) {
            return true;
          }
        }
        return false;
      };
    }
    if (!self.settings.firstUrl) {
      throw "virtual_scroll plugin requires a firstUrl() method";
    }
    self.settings.sortField = [{
      field: "$order"
    }, {
      field: "$score"
    }];
    const canLoadMore = (query) => {
      if (typeof self.settings.maxOptions === "number" && dropdown_content.children.length >= self.settings.maxOptions) {
        return false;
      }
      if (query in pagination && pagination[query]) {
        return true;
      }
      return false;
    };
    const clearFilter = (option, value) => {
      if (self.items.indexOf(value) >= 0 || default_values.indexOf(value) >= 0) {
        return true;
      }
      return false;
    };
    self.setNextUrl = (value, next_url) => {
      pagination[value] = next_url;
    };
    self.getUrl = (query) => {
      if (query in pagination) {
        const next_url = pagination[query];
        pagination[query] = false;
        return next_url;
      }
      self.clearPagination();
      return self.settings.firstUrl.call(self, query);
    };
    self.clearPagination = () => {
      pagination = {};
    };
    self.hook("instead", "clearActiveOption", () => {
      if (loading_more) {
        return;
      }
      return orig_clearActiveOption.call(self);
    });
    self.hook("instead", "canLoad", (query) => {
      if (!(query in pagination)) {
        return orig_canLoad.call(self, query);
      }
      return canLoadMore(query);
    });
    self.hook("instead", "loadCallback", (options, optgroups) => {
      if (!loading_more) {
        self.clearOptions(clearFilter);
      } else if (load_more_opt) {
        const first_option = options[0];
        if (first_option !== void 0) {
          load_more_opt.dataset.value = first_option[self.settings.valueField];
        }
      }
      orig_loadCallback.call(self, options, optgroups);
      loading_more = false;
    });
    self.hook("after", "refreshOptions", () => {
      const query = self.lastValue;
      var option;
      if (canLoadMore(query)) {
        option = self.render("loading_more", {
          query
        });
        if (option) {
          option.setAttribute("data-selectable", "");
          load_more_opt = option;
        }
      } else if (query in pagination && !dropdown_content.querySelector(".no-results")) {
        option = self.render("no_more_results", {
          query
        });
      }
      if (option) {
        addClasses3(option, self.settings.optionClass);
        dropdown_content.append(option);
      }
    });
    self.on("initialize", () => {
      default_values = Object.keys(self.options);
      dropdown_content = self.dropdown_content;
      self.settings.render = Object.assign({}, {
        loading_more: () => {
          return `<div class="loading-more-results">Loading more results ... </div>`;
        },
        no_more_results: () => {
          return `<div class="no-more-results">No more results</div>`;
        }
      }, self.settings.render);
      dropdown_content.addEventListener("scroll", () => {
        if (!self.settings.shouldLoadMore.call(self)) {
          return;
        }
        if (!canLoadMore(self.lastValue)) {
          return;
        }
        if (loading_more) return;
        loading_more = true;
        self.load.call(self, self.lastValue);
      });
    });
  }
  var iterate6, addClasses3, classesArray4, castAsArray4;
  var init_plugin14 = __esm({
    "../../../node_modules/tom-select/dist/esm/plugins/virtual_scroll/plugin.js"() {
      iterate6 = (object, callback) => {
        if (Array.isArray(object)) {
          object.forEach(callback);
        } else {
          for (var key in object) {
            if (object.hasOwnProperty(key)) {
              callback(object[key], key);
            }
          }
        }
      };
      addClasses3 = (elmts, ...classes) => {
        var norm_classes = classesArray4(classes);
        elmts = castAsArray4(elmts);
        elmts.map((el) => {
          norm_classes.map((cls) => {
            el.classList.add(cls);
          });
        });
      };
      classesArray4 = (args) => {
        var classes = [];
        iterate6(args, (_classes) => {
          if (typeof _classes === "string") {
            _classes = _classes.trim().split(/[\t\n\f\r\s]/);
          }
          if (Array.isArray(_classes)) {
            classes = classes.concat(_classes);
          }
        });
        return classes.filter(Boolean);
      };
      castAsArray4 = (arg) => {
        if (!Array.isArray(arg)) {
          arg = [arg];
        }
        return arg;
      };
    }
  });

  // ../../../node_modules/tom-select/dist/esm/tom-select.complete.js
  var tom_select_complete_default;
  var init_tom_select_complete = __esm({
    "../../../node_modules/tom-select/dist/esm/tom-select.complete.js"() {
      init_tom_select();
      init_plugin();
      init_plugin2();
      init_plugin3();
      init_plugin4();
      init_plugin5();
      init_plugin6();
      init_plugin7();
      init_plugin8();
      init_plugin9();
      init_plugin10();
      init_plugin11();
      init_plugin12();
      init_plugin13();
      init_plugin14();
      TomSelect.define("change_listener", plugin);
      TomSelect.define("checkbox_options", plugin2);
      TomSelect.define("clear_button", plugin3);
      TomSelect.define("drag_drop", plugin4);
      TomSelect.define("dropdown_header", plugin5);
      TomSelect.define("caret_position", plugin6);
      TomSelect.define("dropdown_input", plugin7);
      TomSelect.define("input_autogrow", plugin8);
      TomSelect.define("no_backspace_delete", plugin9);
      TomSelect.define("no_active_items", plugin10);
      TomSelect.define("optgroup_columns", plugin11);
      TomSelect.define("remove_button", plugin12);
      TomSelect.define("restore_on_backspace", plugin13);
      TomSelect.define("virtual_scroll", plugin14);
      tom_select_complete_default = TomSelect;
    }
  });

  // ../../../node_modules/tom-select/dist/css/tom-select.bootstrap5.css
  var init_tom_select_bootstrap5 = __esm({
    "../../../node_modules/tom-select/dist/css/tom-select.bootstrap5.css"() {
    }
  });

  // assets/js/tomselect.js
  var tomselect_exports = {};
  __export(tomselect_exports, {
    default: () => initLanguageSelector
  });
  function extractFlagClass(customProperties) {
    if (!customProperties) return "";
    const match = customProperties.match(/class="([^"]*fi[^"]*)"/);
    return match ? match[1] : "";
  }
  function localeSelectorTemplate(data, escape) {
    const flagClass = extractFlagClass(data.customProperties);
    const flagHtml = flagClass ? `<span class="${flagClass} me-2" style="display: inline-block; vertical-align: middle;"></span>` : "";
    return `<div class="d-flex align-items-center">${flagHtml}${escape(data.text)}</div>`;
  }
  function initLanguageSelector() {
    const localeSelectorEl = document.querySelector(".js-language-selector");
    if (localeSelectorEl === null) {
      return;
    }
    const savedLang = getCookie("fb_locale") || "";
    new tom_select_complete_default(".js-language-selector", {
      copyClassesToDropdown: false,
      controlClass: "ts-control locale",
      dropdownClass: "dropdown-menu ts-dropdown locale-selector-dropdown",
      optionClass: "dropdown-item",
      controlInput: false,
      items: savedLang ? [savedLang] : [],
      render: {
        item: (data, escape) => localeSelectorTemplate(data, escape),
        option: (data, escape) => localeSelectorTemplate(data, escape)
      },
      onItemAdd: (value) => {
        setCookie("fb_locale", value, 365);
        window.location.reload();
      }
    });
  }
  function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(";");
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }
  function setCookie(name, value, days) {
    if (days) {
      var date = /* @__PURE__ */ new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1e3);
      var expires = "; expires=" + date.toGMTString();
    } else var expires = "";
    document.cookie = name + "=" + value + expires + "; path=/ ";
  }
  var init_tomselect = __esm({
    "assets/js/tomselect.js"() {
      init_tom_select_complete();
      init_tom_select_bootstrap5();
      globalThis.TomSelect = tom_select_complete_default;
    }
  });

  // ../../../node_modules/@popperjs/core/lib/index.js
  var lib_exports = {};
  __export(lib_exports, {
    afterMain: () => afterMain,
    afterRead: () => afterRead,
    afterWrite: () => afterWrite,
    applyStyles: () => applyStyles_default,
    arrow: () => arrow_default,
    auto: () => auto,
    basePlacements: () => basePlacements,
    beforeMain: () => beforeMain,
    beforeRead: () => beforeRead,
    beforeWrite: () => beforeWrite,
    bottom: () => bottom,
    clippingParents: () => clippingParents,
    computeStyles: () => computeStyles_default,
    createPopper: () => createPopper3,
    createPopperBase: () => createPopper,
    createPopperLite: () => createPopper2,
    detectOverflow: () => detectOverflow,
    end: () => end,
    eventListeners: () => eventListeners_default,
    flip: () => flip_default,
    hide: () => hide_default,
    left: () => left,
    main: () => main,
    modifierPhases: () => modifierPhases,
    offset: () => offset_default,
    placements: () => placements,
    popper: () => popper,
    popperGenerator: () => popperGenerator,
    popperOffsets: () => popperOffsets_default,
    preventOverflow: () => preventOverflow_default,
    read: () => read,
    reference: () => reference,
    right: () => right,
    start: () => start,
    top: () => top,
    variationPlacements: () => variationPlacements,
    viewport: () => viewport,
    write: () => write
  });

  // ../../../node_modules/@popperjs/core/lib/enums.js
  var top = "top";
  var bottom = "bottom";
  var right = "right";
  var left = "left";
  var auto = "auto";
  var basePlacements = [top, bottom, right, left];
  var start = "start";
  var end = "end";
  var clippingParents = "clippingParents";
  var viewport = "viewport";
  var popper = "popper";
  var reference = "reference";
  var variationPlacements = /* @__PURE__ */ basePlacements.reduce(function(acc, placement) {
    return acc.concat([placement + "-" + start, placement + "-" + end]);
  }, []);
  var placements = /* @__PURE__ */ [].concat(basePlacements, [auto]).reduce(function(acc, placement) {
    return acc.concat([placement, placement + "-" + start, placement + "-" + end]);
  }, []);
  var beforeRead = "beforeRead";
  var read = "read";
  var afterRead = "afterRead";
  var beforeMain = "beforeMain";
  var main = "main";
  var afterMain = "afterMain";
  var beforeWrite = "beforeWrite";
  var write = "write";
  var afterWrite = "afterWrite";
  var modifierPhases = [beforeRead, read, afterRead, beforeMain, main, afterMain, beforeWrite, write, afterWrite];

  // ../../../node_modules/@popperjs/core/lib/dom-utils/getNodeName.js
  function getNodeName(element) {
    return element ? (element.nodeName || "").toLowerCase() : null;
  }

  // ../../../node_modules/@popperjs/core/lib/dom-utils/getWindow.js
  function getWindow(node) {
    if (node == null) {
      return window;
    }
    if (node.toString() !== "[object Window]") {
      var ownerDocument = node.ownerDocument;
      return ownerDocument ? ownerDocument.defaultView || window : window;
    }
    return node;
  }

  // ../../../node_modules/@popperjs/core/lib/dom-utils/instanceOf.js
  function isElement(node) {
    var OwnElement = getWindow(node).Element;
    return node instanceof OwnElement || node instanceof Element;
  }
  function isHTMLElement(node) {
    var OwnElement = getWindow(node).HTMLElement;
    return node instanceof OwnElement || node instanceof HTMLElement;
  }
  function isShadowRoot(node) {
    if (typeof ShadowRoot === "undefined") {
      return false;
    }
    var OwnElement = getWindow(node).ShadowRoot;
    return node instanceof OwnElement || node instanceof ShadowRoot;
  }

  // ../../../node_modules/@popperjs/core/lib/modifiers/applyStyles.js
  function applyStyles(_ref) {
    var state = _ref.state;
    Object.keys(state.elements).forEach(function(name) {
      var style = state.styles[name] || {};
      var attributes = state.attributes[name] || {};
      var element = state.elements[name];
      if (!isHTMLElement(element) || !getNodeName(element)) {
        return;
      }
      Object.assign(element.style, style);
      Object.keys(attributes).forEach(function(name2) {
        var value = attributes[name2];
        if (value === false) {
          element.removeAttribute(name2);
        } else {
          element.setAttribute(name2, value === true ? "" : value);
        }
      });
    });
  }
  function effect(_ref2) {
    var state = _ref2.state;
    var initialStyles = {
      popper: {
        position: state.options.strategy,
        left: "0",
        top: "0",
        margin: "0"
      },
      arrow: {
        position: "absolute"
      },
      reference: {}
    };
    Object.assign(state.elements.popper.style, initialStyles.popper);
    state.styles = initialStyles;
    if (state.elements.arrow) {
      Object.assign(state.elements.arrow.style, initialStyles.arrow);
    }
    return function() {
      Object.keys(state.elements).forEach(function(name) {
        var element = state.elements[name];
        var attributes = state.attributes[name] || {};
        var styleProperties = Object.keys(state.styles.hasOwnProperty(name) ? state.styles[name] : initialStyles[name]);
        var style = styleProperties.reduce(function(style2, property) {
          style2[property] = "";
          return style2;
        }, {});
        if (!isHTMLElement(element) || !getNodeName(element)) {
          return;
        }
        Object.assign(element.style, style);
        Object.keys(attributes).forEach(function(attribute) {
          element.removeAttribute(attribute);
        });
      });
    };
  }
  var applyStyles_default = {
    name: "applyStyles",
    enabled: true,
    phase: "write",
    fn: applyStyles,
    effect,
    requires: ["computeStyles"]
  };

  // ../../../node_modules/@popperjs/core/lib/utils/getBasePlacement.js
  function getBasePlacement(placement) {
    return placement.split("-")[0];
  }

  // ../../../node_modules/@popperjs/core/lib/utils/math.js
  var max = Math.max;
  var min = Math.min;
  var round = Math.round;

  // ../../../node_modules/@popperjs/core/lib/utils/userAgent.js
  function getUAString() {
    var uaData = navigator.userAgentData;
    if (uaData != null && uaData.brands && Array.isArray(uaData.brands)) {
      return uaData.brands.map(function(item) {
        return item.brand + "/" + item.version;
      }).join(" ");
    }
    return navigator.userAgent;
  }

  // ../../../node_modules/@popperjs/core/lib/dom-utils/isLayoutViewport.js
  function isLayoutViewport() {
    return !/^((?!chrome|android).)*safari/i.test(getUAString());
  }

  // ../../../node_modules/@popperjs/core/lib/dom-utils/getBoundingClientRect.js
  function getBoundingClientRect(element, includeScale, isFixedStrategy) {
    if (includeScale === void 0) {
      includeScale = false;
    }
    if (isFixedStrategy === void 0) {
      isFixedStrategy = false;
    }
    var clientRect = element.getBoundingClientRect();
    var scaleX = 1;
    var scaleY = 1;
    if (includeScale && isHTMLElement(element)) {
      scaleX = element.offsetWidth > 0 ? round(clientRect.width) / element.offsetWidth || 1 : 1;
      scaleY = element.offsetHeight > 0 ? round(clientRect.height) / element.offsetHeight || 1 : 1;
    }
    var _ref = isElement(element) ? getWindow(element) : window, visualViewport = _ref.visualViewport;
    var addVisualOffsets = !isLayoutViewport() && isFixedStrategy;
    var x = (clientRect.left + (addVisualOffsets && visualViewport ? visualViewport.offsetLeft : 0)) / scaleX;
    var y = (clientRect.top + (addVisualOffsets && visualViewport ? visualViewport.offsetTop : 0)) / scaleY;
    var width = clientRect.width / scaleX;
    var height = clientRect.height / scaleY;
    return {
      width,
      height,
      top: y,
      right: x + width,
      bottom: y + height,
      left: x,
      x,
      y
    };
  }

  // ../../../node_modules/@popperjs/core/lib/dom-utils/getLayoutRect.js
  function getLayoutRect(element) {
    var clientRect = getBoundingClientRect(element);
    var width = element.offsetWidth;
    var height = element.offsetHeight;
    if (Math.abs(clientRect.width - width) <= 1) {
      width = clientRect.width;
    }
    if (Math.abs(clientRect.height - height) <= 1) {
      height = clientRect.height;
    }
    return {
      x: element.offsetLeft,
      y: element.offsetTop,
      width,
      height
    };
  }

  // ../../../node_modules/@popperjs/core/lib/dom-utils/contains.js
  function contains(parent, child) {
    var rootNode = child.getRootNode && child.getRootNode();
    if (parent.contains(child)) {
      return true;
    } else if (rootNode && isShadowRoot(rootNode)) {
      var next = child;
      do {
        if (next && parent.isSameNode(next)) {
          return true;
        }
        next = next.parentNode || next.host;
      } while (next);
    }
    return false;
  }

  // ../../../node_modules/@popperjs/core/lib/dom-utils/getComputedStyle.js
  function getComputedStyle2(element) {
    return getWindow(element).getComputedStyle(element);
  }

  // ../../../node_modules/@popperjs/core/lib/dom-utils/isTableElement.js
  function isTableElement(element) {
    return ["table", "td", "th"].indexOf(getNodeName(element)) >= 0;
  }

  // ../../../node_modules/@popperjs/core/lib/dom-utils/getDocumentElement.js
  function getDocumentElement(element) {
    return ((isElement(element) ? element.ownerDocument : (
      // $FlowFixMe[prop-missing]
      element.document
    )) || window.document).documentElement;
  }

  // ../../../node_modules/@popperjs/core/lib/dom-utils/getParentNode.js
  function getParentNode(element) {
    if (getNodeName(element) === "html") {
      return element;
    }
    return (
      // this is a quicker (but less type safe) way to save quite some bytes from the bundle
      // $FlowFixMe[incompatible-return]
      // $FlowFixMe[prop-missing]
      element.assignedSlot || // step into the shadow DOM of the parent of a slotted node
      element.parentNode || // DOM Element detected
      (isShadowRoot(element) ? element.host : null) || // ShadowRoot detected
      // $FlowFixMe[incompatible-call]: HTMLElement is a Node
      getDocumentElement(element)
    );
  }

  // ../../../node_modules/@popperjs/core/lib/dom-utils/getOffsetParent.js
  function getTrueOffsetParent(element) {
    if (!isHTMLElement(element) || // https://github.com/popperjs/popper-core/issues/837
    getComputedStyle2(element).position === "fixed") {
      return null;
    }
    return element.offsetParent;
  }
  function getContainingBlock(element) {
    var isFirefox = /firefox/i.test(getUAString());
    var isIE = /Trident/i.test(getUAString());
    if (isIE && isHTMLElement(element)) {
      var elementCss = getComputedStyle2(element);
      if (elementCss.position === "fixed") {
        return null;
      }
    }
    var currentNode = getParentNode(element);
    if (isShadowRoot(currentNode)) {
      currentNode = currentNode.host;
    }
    while (isHTMLElement(currentNode) && ["html", "body"].indexOf(getNodeName(currentNode)) < 0) {
      var css = getComputedStyle2(currentNode);
      if (css.transform !== "none" || css.perspective !== "none" || css.contain === "paint" || ["transform", "perspective"].indexOf(css.willChange) !== -1 || isFirefox && css.willChange === "filter" || isFirefox && css.filter && css.filter !== "none") {
        return currentNode;
      } else {
        currentNode = currentNode.parentNode;
      }
    }
    return null;
  }
  function getOffsetParent(element) {
    var window2 = getWindow(element);
    var offsetParent = getTrueOffsetParent(element);
    while (offsetParent && isTableElement(offsetParent) && getComputedStyle2(offsetParent).position === "static") {
      offsetParent = getTrueOffsetParent(offsetParent);
    }
    if (offsetParent && (getNodeName(offsetParent) === "html" || getNodeName(offsetParent) === "body" && getComputedStyle2(offsetParent).position === "static")) {
      return window2;
    }
    return offsetParent || getContainingBlock(element) || window2;
  }

  // ../../../node_modules/@popperjs/core/lib/utils/getMainAxisFromPlacement.js
  function getMainAxisFromPlacement(placement) {
    return ["top", "bottom"].indexOf(placement) >= 0 ? "x" : "y";
  }

  // ../../../node_modules/@popperjs/core/lib/utils/within.js
  function within(min2, value, max2) {
    return max(min2, min(value, max2));
  }
  function withinMaxClamp(min2, value, max2) {
    var v = within(min2, value, max2);
    return v > max2 ? max2 : v;
  }

  // ../../../node_modules/@popperjs/core/lib/utils/getFreshSideObject.js
  function getFreshSideObject() {
    return {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    };
  }

  // ../../../node_modules/@popperjs/core/lib/utils/mergePaddingObject.js
  function mergePaddingObject(paddingObject) {
    return Object.assign({}, getFreshSideObject(), paddingObject);
  }

  // ../../../node_modules/@popperjs/core/lib/utils/expandToHashMap.js
  function expandToHashMap(value, keys) {
    return keys.reduce(function(hashMap, key) {
      hashMap[key] = value;
      return hashMap;
    }, {});
  }

  // ../../../node_modules/@popperjs/core/lib/modifiers/arrow.js
  var toPaddingObject = function toPaddingObject2(padding, state) {
    padding = typeof padding === "function" ? padding(Object.assign({}, state.rects, {
      placement: state.placement
    })) : padding;
    return mergePaddingObject(typeof padding !== "number" ? padding : expandToHashMap(padding, basePlacements));
  };
  function arrow(_ref) {
    var _state$modifiersData$;
    var state = _ref.state, name = _ref.name, options = _ref.options;
    var arrowElement = state.elements.arrow;
    var popperOffsets2 = state.modifiersData.popperOffsets;
    var basePlacement = getBasePlacement(state.placement);
    var axis = getMainAxisFromPlacement(basePlacement);
    var isVertical = [left, right].indexOf(basePlacement) >= 0;
    var len = isVertical ? "height" : "width";
    if (!arrowElement || !popperOffsets2) {
      return;
    }
    var paddingObject = toPaddingObject(options.padding, state);
    var arrowRect = getLayoutRect(arrowElement);
    var minProp = axis === "y" ? top : left;
    var maxProp = axis === "y" ? bottom : right;
    var endDiff = state.rects.reference[len] + state.rects.reference[axis] - popperOffsets2[axis] - state.rects.popper[len];
    var startDiff = popperOffsets2[axis] - state.rects.reference[axis];
    var arrowOffsetParent = getOffsetParent(arrowElement);
    var clientSize = arrowOffsetParent ? axis === "y" ? arrowOffsetParent.clientHeight || 0 : arrowOffsetParent.clientWidth || 0 : 0;
    var centerToReference = endDiff / 2 - startDiff / 2;
    var min2 = paddingObject[minProp];
    var max2 = clientSize - arrowRect[len] - paddingObject[maxProp];
    var center = clientSize / 2 - arrowRect[len] / 2 + centerToReference;
    var offset2 = within(min2, center, max2);
    var axisProp = axis;
    state.modifiersData[name] = (_state$modifiersData$ = {}, _state$modifiersData$[axisProp] = offset2, _state$modifiersData$.centerOffset = offset2 - center, _state$modifiersData$);
  }
  function effect2(_ref2) {
    var state = _ref2.state, options = _ref2.options;
    var _options$element = options.element, arrowElement = _options$element === void 0 ? "[data-popper-arrow]" : _options$element;
    if (arrowElement == null) {
      return;
    }
    if (typeof arrowElement === "string") {
      arrowElement = state.elements.popper.querySelector(arrowElement);
      if (!arrowElement) {
        return;
      }
    }
    if (!contains(state.elements.popper, arrowElement)) {
      return;
    }
    state.elements.arrow = arrowElement;
  }
  var arrow_default = {
    name: "arrow",
    enabled: true,
    phase: "main",
    fn: arrow,
    effect: effect2,
    requires: ["popperOffsets"],
    requiresIfExists: ["preventOverflow"]
  };

  // ../../../node_modules/@popperjs/core/lib/utils/getVariation.js
  function getVariation(placement) {
    return placement.split("-")[1];
  }

  // ../../../node_modules/@popperjs/core/lib/modifiers/computeStyles.js
  var unsetSides = {
    top: "auto",
    right: "auto",
    bottom: "auto",
    left: "auto"
  };
  function roundOffsetsByDPR(_ref, win) {
    var x = _ref.x, y = _ref.y;
    var dpr = win.devicePixelRatio || 1;
    return {
      x: round(x * dpr) / dpr || 0,
      y: round(y * dpr) / dpr || 0
    };
  }
  function mapToStyles(_ref2) {
    var _Object$assign2;
    var popper2 = _ref2.popper, popperRect = _ref2.popperRect, placement = _ref2.placement, variation = _ref2.variation, offsets = _ref2.offsets, position = _ref2.position, gpuAcceleration = _ref2.gpuAcceleration, adaptive = _ref2.adaptive, roundOffsets = _ref2.roundOffsets, isFixed = _ref2.isFixed;
    var _offsets$x = offsets.x, x = _offsets$x === void 0 ? 0 : _offsets$x, _offsets$y = offsets.y, y = _offsets$y === void 0 ? 0 : _offsets$y;
    var _ref3 = typeof roundOffsets === "function" ? roundOffsets({
      x,
      y
    }) : {
      x,
      y
    };
    x = _ref3.x;
    y = _ref3.y;
    var hasX = offsets.hasOwnProperty("x");
    var hasY = offsets.hasOwnProperty("y");
    var sideX = left;
    var sideY = top;
    var win = window;
    if (adaptive) {
      var offsetParent = getOffsetParent(popper2);
      var heightProp = "clientHeight";
      var widthProp = "clientWidth";
      if (offsetParent === getWindow(popper2)) {
        offsetParent = getDocumentElement(popper2);
        if (getComputedStyle2(offsetParent).position !== "static" && position === "absolute") {
          heightProp = "scrollHeight";
          widthProp = "scrollWidth";
        }
      }
      offsetParent = offsetParent;
      if (placement === top || (placement === left || placement === right) && variation === end) {
        sideY = bottom;
        var offsetY = isFixed && offsetParent === win && win.visualViewport ? win.visualViewport.height : (
          // $FlowFixMe[prop-missing]
          offsetParent[heightProp]
        );
        y -= offsetY - popperRect.height;
        y *= gpuAcceleration ? 1 : -1;
      }
      if (placement === left || (placement === top || placement === bottom) && variation === end) {
        sideX = right;
        var offsetX = isFixed && offsetParent === win && win.visualViewport ? win.visualViewport.width : (
          // $FlowFixMe[prop-missing]
          offsetParent[widthProp]
        );
        x -= offsetX - popperRect.width;
        x *= gpuAcceleration ? 1 : -1;
      }
    }
    var commonStyles = Object.assign({
      position
    }, adaptive && unsetSides);
    var _ref4 = roundOffsets === true ? roundOffsetsByDPR({
      x,
      y
    }, getWindow(popper2)) : {
      x,
      y
    };
    x = _ref4.x;
    y = _ref4.y;
    if (gpuAcceleration) {
      var _Object$assign;
      return Object.assign({}, commonStyles, (_Object$assign = {}, _Object$assign[sideY] = hasY ? "0" : "", _Object$assign[sideX] = hasX ? "0" : "", _Object$assign.transform = (win.devicePixelRatio || 1) <= 1 ? "translate(" + x + "px, " + y + "px)" : "translate3d(" + x + "px, " + y + "px, 0)", _Object$assign));
    }
    return Object.assign({}, commonStyles, (_Object$assign2 = {}, _Object$assign2[sideY] = hasY ? y + "px" : "", _Object$assign2[sideX] = hasX ? x + "px" : "", _Object$assign2.transform = "", _Object$assign2));
  }
  function computeStyles(_ref5) {
    var state = _ref5.state, options = _ref5.options;
    var _options$gpuAccelerat = options.gpuAcceleration, gpuAcceleration = _options$gpuAccelerat === void 0 ? true : _options$gpuAccelerat, _options$adaptive = options.adaptive, adaptive = _options$adaptive === void 0 ? true : _options$adaptive, _options$roundOffsets = options.roundOffsets, roundOffsets = _options$roundOffsets === void 0 ? true : _options$roundOffsets;
    var commonStyles = {
      placement: getBasePlacement(state.placement),
      variation: getVariation(state.placement),
      popper: state.elements.popper,
      popperRect: state.rects.popper,
      gpuAcceleration,
      isFixed: state.options.strategy === "fixed"
    };
    if (state.modifiersData.popperOffsets != null) {
      state.styles.popper = Object.assign({}, state.styles.popper, mapToStyles(Object.assign({}, commonStyles, {
        offsets: state.modifiersData.popperOffsets,
        position: state.options.strategy,
        adaptive,
        roundOffsets
      })));
    }
    if (state.modifiersData.arrow != null) {
      state.styles.arrow = Object.assign({}, state.styles.arrow, mapToStyles(Object.assign({}, commonStyles, {
        offsets: state.modifiersData.arrow,
        position: "absolute",
        adaptive: false,
        roundOffsets
      })));
    }
    state.attributes.popper = Object.assign({}, state.attributes.popper, {
      "data-popper-placement": state.placement
    });
  }
  var computeStyles_default = {
    name: "computeStyles",
    enabled: true,
    phase: "beforeWrite",
    fn: computeStyles,
    data: {}
  };

  // ../../../node_modules/@popperjs/core/lib/modifiers/eventListeners.js
  var passive = {
    passive: true
  };
  function effect3(_ref) {
    var state = _ref.state, instance = _ref.instance, options = _ref.options;
    var _options$scroll = options.scroll, scroll = _options$scroll === void 0 ? true : _options$scroll, _options$resize = options.resize, resize = _options$resize === void 0 ? true : _options$resize;
    var window2 = getWindow(state.elements.popper);
    var scrollParents = [].concat(state.scrollParents.reference, state.scrollParents.popper);
    if (scroll) {
      scrollParents.forEach(function(scrollParent) {
        scrollParent.addEventListener("scroll", instance.update, passive);
      });
    }
    if (resize) {
      window2.addEventListener("resize", instance.update, passive);
    }
    return function() {
      if (scroll) {
        scrollParents.forEach(function(scrollParent) {
          scrollParent.removeEventListener("scroll", instance.update, passive);
        });
      }
      if (resize) {
        window2.removeEventListener("resize", instance.update, passive);
      }
    };
  }
  var eventListeners_default = {
    name: "eventListeners",
    enabled: true,
    phase: "write",
    fn: function fn() {
    },
    effect: effect3,
    data: {}
  };

  // ../../../node_modules/@popperjs/core/lib/utils/getOppositePlacement.js
  var hash = {
    left: "right",
    right: "left",
    bottom: "top",
    top: "bottom"
  };
  function getOppositePlacement(placement) {
    return placement.replace(/left|right|bottom|top/g, function(matched) {
      return hash[matched];
    });
  }

  // ../../../node_modules/@popperjs/core/lib/utils/getOppositeVariationPlacement.js
  var hash2 = {
    start: "end",
    end: "start"
  };
  function getOppositeVariationPlacement(placement) {
    return placement.replace(/start|end/g, function(matched) {
      return hash2[matched];
    });
  }

  // ../../../node_modules/@popperjs/core/lib/dom-utils/getWindowScroll.js
  function getWindowScroll(node) {
    var win = getWindow(node);
    var scrollLeft = win.pageXOffset;
    var scrollTop = win.pageYOffset;
    return {
      scrollLeft,
      scrollTop
    };
  }

  // ../../../node_modules/@popperjs/core/lib/dom-utils/getWindowScrollBarX.js
  function getWindowScrollBarX(element) {
    return getBoundingClientRect(getDocumentElement(element)).left + getWindowScroll(element).scrollLeft;
  }

  // ../../../node_modules/@popperjs/core/lib/dom-utils/getViewportRect.js
  function getViewportRect(element, strategy) {
    var win = getWindow(element);
    var html = getDocumentElement(element);
    var visualViewport = win.visualViewport;
    var width = html.clientWidth;
    var height = html.clientHeight;
    var x = 0;
    var y = 0;
    if (visualViewport) {
      width = visualViewport.width;
      height = visualViewport.height;
      var layoutViewport = isLayoutViewport();
      if (layoutViewport || !layoutViewport && strategy === "fixed") {
        x = visualViewport.offsetLeft;
        y = visualViewport.offsetTop;
      }
    }
    return {
      width,
      height,
      x: x + getWindowScrollBarX(element),
      y
    };
  }

  // ../../../node_modules/@popperjs/core/lib/dom-utils/getDocumentRect.js
  function getDocumentRect(element) {
    var _element$ownerDocumen;
    var html = getDocumentElement(element);
    var winScroll = getWindowScroll(element);
    var body = (_element$ownerDocumen = element.ownerDocument) == null ? void 0 : _element$ownerDocumen.body;
    var width = max(html.scrollWidth, html.clientWidth, body ? body.scrollWidth : 0, body ? body.clientWidth : 0);
    var height = max(html.scrollHeight, html.clientHeight, body ? body.scrollHeight : 0, body ? body.clientHeight : 0);
    var x = -winScroll.scrollLeft + getWindowScrollBarX(element);
    var y = -winScroll.scrollTop;
    if (getComputedStyle2(body || html).direction === "rtl") {
      x += max(html.clientWidth, body ? body.clientWidth : 0) - width;
    }
    return {
      width,
      height,
      x,
      y
    };
  }

  // ../../../node_modules/@popperjs/core/lib/dom-utils/isScrollParent.js
  function isScrollParent(element) {
    var _getComputedStyle = getComputedStyle2(element), overflow = _getComputedStyle.overflow, overflowX = _getComputedStyle.overflowX, overflowY = _getComputedStyle.overflowY;
    return /auto|scroll|overlay|hidden/.test(overflow + overflowY + overflowX);
  }

  // ../../../node_modules/@popperjs/core/lib/dom-utils/getScrollParent.js
  function getScrollParent(node) {
    if (["html", "body", "#document"].indexOf(getNodeName(node)) >= 0) {
      return node.ownerDocument.body;
    }
    if (isHTMLElement(node) && isScrollParent(node)) {
      return node;
    }
    return getScrollParent(getParentNode(node));
  }

  // ../../../node_modules/@popperjs/core/lib/dom-utils/listScrollParents.js
  function listScrollParents(element, list) {
    var _element$ownerDocumen;
    if (list === void 0) {
      list = [];
    }
    var scrollParent = getScrollParent(element);
    var isBody = scrollParent === ((_element$ownerDocumen = element.ownerDocument) == null ? void 0 : _element$ownerDocumen.body);
    var win = getWindow(scrollParent);
    var target = isBody ? [win].concat(win.visualViewport || [], isScrollParent(scrollParent) ? scrollParent : []) : scrollParent;
    var updatedList = list.concat(target);
    return isBody ? updatedList : (
      // $FlowFixMe[incompatible-call]: isBody tells us target will be an HTMLElement here
      updatedList.concat(listScrollParents(getParentNode(target)))
    );
  }

  // ../../../node_modules/@popperjs/core/lib/utils/rectToClientRect.js
  function rectToClientRect(rect) {
    return Object.assign({}, rect, {
      left: rect.x,
      top: rect.y,
      right: rect.x + rect.width,
      bottom: rect.y + rect.height
    });
  }

  // ../../../node_modules/@popperjs/core/lib/dom-utils/getClippingRect.js
  function getInnerBoundingClientRect(element, strategy) {
    var rect = getBoundingClientRect(element, false, strategy === "fixed");
    rect.top = rect.top + element.clientTop;
    rect.left = rect.left + element.clientLeft;
    rect.bottom = rect.top + element.clientHeight;
    rect.right = rect.left + element.clientWidth;
    rect.width = element.clientWidth;
    rect.height = element.clientHeight;
    rect.x = rect.left;
    rect.y = rect.top;
    return rect;
  }
  function getClientRectFromMixedType(element, clippingParent, strategy) {
    return clippingParent === viewport ? rectToClientRect(getViewportRect(element, strategy)) : isElement(clippingParent) ? getInnerBoundingClientRect(clippingParent, strategy) : rectToClientRect(getDocumentRect(getDocumentElement(element)));
  }
  function getClippingParents(element) {
    var clippingParents2 = listScrollParents(getParentNode(element));
    var canEscapeClipping = ["absolute", "fixed"].indexOf(getComputedStyle2(element).position) >= 0;
    var clipperElement = canEscapeClipping && isHTMLElement(element) ? getOffsetParent(element) : element;
    if (!isElement(clipperElement)) {
      return [];
    }
    return clippingParents2.filter(function(clippingParent) {
      return isElement(clippingParent) && contains(clippingParent, clipperElement) && getNodeName(clippingParent) !== "body";
    });
  }
  function getClippingRect(element, boundary, rootBoundary, strategy) {
    var mainClippingParents = boundary === "clippingParents" ? getClippingParents(element) : [].concat(boundary);
    var clippingParents2 = [].concat(mainClippingParents, [rootBoundary]);
    var firstClippingParent = clippingParents2[0];
    var clippingRect = clippingParents2.reduce(function(accRect, clippingParent) {
      var rect = getClientRectFromMixedType(element, clippingParent, strategy);
      accRect.top = max(rect.top, accRect.top);
      accRect.right = min(rect.right, accRect.right);
      accRect.bottom = min(rect.bottom, accRect.bottom);
      accRect.left = max(rect.left, accRect.left);
      return accRect;
    }, getClientRectFromMixedType(element, firstClippingParent, strategy));
    clippingRect.width = clippingRect.right - clippingRect.left;
    clippingRect.height = clippingRect.bottom - clippingRect.top;
    clippingRect.x = clippingRect.left;
    clippingRect.y = clippingRect.top;
    return clippingRect;
  }

  // ../../../node_modules/@popperjs/core/lib/utils/computeOffsets.js
  function computeOffsets(_ref) {
    var reference2 = _ref.reference, element = _ref.element, placement = _ref.placement;
    var basePlacement = placement ? getBasePlacement(placement) : null;
    var variation = placement ? getVariation(placement) : null;
    var commonX = reference2.x + reference2.width / 2 - element.width / 2;
    var commonY = reference2.y + reference2.height / 2 - element.height / 2;
    var offsets;
    switch (basePlacement) {
      case top:
        offsets = {
          x: commonX,
          y: reference2.y - element.height
        };
        break;
      case bottom:
        offsets = {
          x: commonX,
          y: reference2.y + reference2.height
        };
        break;
      case right:
        offsets = {
          x: reference2.x + reference2.width,
          y: commonY
        };
        break;
      case left:
        offsets = {
          x: reference2.x - element.width,
          y: commonY
        };
        break;
      default:
        offsets = {
          x: reference2.x,
          y: reference2.y
        };
    }
    var mainAxis = basePlacement ? getMainAxisFromPlacement(basePlacement) : null;
    if (mainAxis != null) {
      var len = mainAxis === "y" ? "height" : "width";
      switch (variation) {
        case start:
          offsets[mainAxis] = offsets[mainAxis] - (reference2[len] / 2 - element[len] / 2);
          break;
        case end:
          offsets[mainAxis] = offsets[mainAxis] + (reference2[len] / 2 - element[len] / 2);
          break;
        default:
      }
    }
    return offsets;
  }

  // ../../../node_modules/@popperjs/core/lib/utils/detectOverflow.js
  function detectOverflow(state, options) {
    if (options === void 0) {
      options = {};
    }
    var _options = options, _options$placement = _options.placement, placement = _options$placement === void 0 ? state.placement : _options$placement, _options$strategy = _options.strategy, strategy = _options$strategy === void 0 ? state.strategy : _options$strategy, _options$boundary = _options.boundary, boundary = _options$boundary === void 0 ? clippingParents : _options$boundary, _options$rootBoundary = _options.rootBoundary, rootBoundary = _options$rootBoundary === void 0 ? viewport : _options$rootBoundary, _options$elementConte = _options.elementContext, elementContext = _options$elementConte === void 0 ? popper : _options$elementConte, _options$altBoundary = _options.altBoundary, altBoundary = _options$altBoundary === void 0 ? false : _options$altBoundary, _options$padding = _options.padding, padding = _options$padding === void 0 ? 0 : _options$padding;
    var paddingObject = mergePaddingObject(typeof padding !== "number" ? padding : expandToHashMap(padding, basePlacements));
    var altContext = elementContext === popper ? reference : popper;
    var popperRect = state.rects.popper;
    var element = state.elements[altBoundary ? altContext : elementContext];
    var clippingClientRect = getClippingRect(isElement(element) ? element : element.contextElement || getDocumentElement(state.elements.popper), boundary, rootBoundary, strategy);
    var referenceClientRect = getBoundingClientRect(state.elements.reference);
    var popperOffsets2 = computeOffsets({
      reference: referenceClientRect,
      element: popperRect,
      strategy: "absolute",
      placement
    });
    var popperClientRect = rectToClientRect(Object.assign({}, popperRect, popperOffsets2));
    var elementClientRect = elementContext === popper ? popperClientRect : referenceClientRect;
    var overflowOffsets = {
      top: clippingClientRect.top - elementClientRect.top + paddingObject.top,
      bottom: elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom,
      left: clippingClientRect.left - elementClientRect.left + paddingObject.left,
      right: elementClientRect.right - clippingClientRect.right + paddingObject.right
    };
    var offsetData = state.modifiersData.offset;
    if (elementContext === popper && offsetData) {
      var offset2 = offsetData[placement];
      Object.keys(overflowOffsets).forEach(function(key) {
        var multiply = [right, bottom].indexOf(key) >= 0 ? 1 : -1;
        var axis = [top, bottom].indexOf(key) >= 0 ? "y" : "x";
        overflowOffsets[key] += offset2[axis] * multiply;
      });
    }
    return overflowOffsets;
  }

  // ../../../node_modules/@popperjs/core/lib/utils/computeAutoPlacement.js
  function computeAutoPlacement(state, options) {
    if (options === void 0) {
      options = {};
    }
    var _options = options, placement = _options.placement, boundary = _options.boundary, rootBoundary = _options.rootBoundary, padding = _options.padding, flipVariations = _options.flipVariations, _options$allowedAutoP = _options.allowedAutoPlacements, allowedAutoPlacements = _options$allowedAutoP === void 0 ? placements : _options$allowedAutoP;
    var variation = getVariation(placement);
    var placements2 = variation ? flipVariations ? variationPlacements : variationPlacements.filter(function(placement2) {
      return getVariation(placement2) === variation;
    }) : basePlacements;
    var allowedPlacements = placements2.filter(function(placement2) {
      return allowedAutoPlacements.indexOf(placement2) >= 0;
    });
    if (allowedPlacements.length === 0) {
      allowedPlacements = placements2;
    }
    var overflows = allowedPlacements.reduce(function(acc, placement2) {
      acc[placement2] = detectOverflow(state, {
        placement: placement2,
        boundary,
        rootBoundary,
        padding
      })[getBasePlacement(placement2)];
      return acc;
    }, {});
    return Object.keys(overflows).sort(function(a, b) {
      return overflows[a] - overflows[b];
    });
  }

  // ../../../node_modules/@popperjs/core/lib/modifiers/flip.js
  function getExpandedFallbackPlacements(placement) {
    if (getBasePlacement(placement) === auto) {
      return [];
    }
    var oppositePlacement = getOppositePlacement(placement);
    return [getOppositeVariationPlacement(placement), oppositePlacement, getOppositeVariationPlacement(oppositePlacement)];
  }
  function flip(_ref) {
    var state = _ref.state, options = _ref.options, name = _ref.name;
    if (state.modifiersData[name]._skip) {
      return;
    }
    var _options$mainAxis = options.mainAxis, checkMainAxis = _options$mainAxis === void 0 ? true : _options$mainAxis, _options$altAxis = options.altAxis, checkAltAxis = _options$altAxis === void 0 ? true : _options$altAxis, specifiedFallbackPlacements = options.fallbackPlacements, padding = options.padding, boundary = options.boundary, rootBoundary = options.rootBoundary, altBoundary = options.altBoundary, _options$flipVariatio = options.flipVariations, flipVariations = _options$flipVariatio === void 0 ? true : _options$flipVariatio, allowedAutoPlacements = options.allowedAutoPlacements;
    var preferredPlacement = state.options.placement;
    var basePlacement = getBasePlacement(preferredPlacement);
    var isBasePlacement = basePlacement === preferredPlacement;
    var fallbackPlacements = specifiedFallbackPlacements || (isBasePlacement || !flipVariations ? [getOppositePlacement(preferredPlacement)] : getExpandedFallbackPlacements(preferredPlacement));
    var placements2 = [preferredPlacement].concat(fallbackPlacements).reduce(function(acc, placement2) {
      return acc.concat(getBasePlacement(placement2) === auto ? computeAutoPlacement(state, {
        placement: placement2,
        boundary,
        rootBoundary,
        padding,
        flipVariations,
        allowedAutoPlacements
      }) : placement2);
    }, []);
    var referenceRect = state.rects.reference;
    var popperRect = state.rects.popper;
    var checksMap = /* @__PURE__ */ new Map();
    var makeFallbackChecks = true;
    var firstFittingPlacement = placements2[0];
    for (var i = 0; i < placements2.length; i++) {
      var placement = placements2[i];
      var _basePlacement = getBasePlacement(placement);
      var isStartVariation = getVariation(placement) === start;
      var isVertical = [top, bottom].indexOf(_basePlacement) >= 0;
      var len = isVertical ? "width" : "height";
      var overflow = detectOverflow(state, {
        placement,
        boundary,
        rootBoundary,
        altBoundary,
        padding
      });
      var mainVariationSide = isVertical ? isStartVariation ? right : left : isStartVariation ? bottom : top;
      if (referenceRect[len] > popperRect[len]) {
        mainVariationSide = getOppositePlacement(mainVariationSide);
      }
      var altVariationSide = getOppositePlacement(mainVariationSide);
      var checks = [];
      if (checkMainAxis) {
        checks.push(overflow[_basePlacement] <= 0);
      }
      if (checkAltAxis) {
        checks.push(overflow[mainVariationSide] <= 0, overflow[altVariationSide] <= 0);
      }
      if (checks.every(function(check) {
        return check;
      })) {
        firstFittingPlacement = placement;
        makeFallbackChecks = false;
        break;
      }
      checksMap.set(placement, checks);
    }
    if (makeFallbackChecks) {
      var numberOfChecks = flipVariations ? 3 : 1;
      var _loop = function _loop2(_i2) {
        var fittingPlacement = placements2.find(function(placement2) {
          var checks2 = checksMap.get(placement2);
          if (checks2) {
            return checks2.slice(0, _i2).every(function(check) {
              return check;
            });
          }
        });
        if (fittingPlacement) {
          firstFittingPlacement = fittingPlacement;
          return "break";
        }
      };
      for (var _i = numberOfChecks; _i > 0; _i--) {
        var _ret = _loop(_i);
        if (_ret === "break") break;
      }
    }
    if (state.placement !== firstFittingPlacement) {
      state.modifiersData[name]._skip = true;
      state.placement = firstFittingPlacement;
      state.reset = true;
    }
  }
  var flip_default = {
    name: "flip",
    enabled: true,
    phase: "main",
    fn: flip,
    requiresIfExists: ["offset"],
    data: {
      _skip: false
    }
  };

  // ../../../node_modules/@popperjs/core/lib/modifiers/hide.js
  function getSideOffsets(overflow, rect, preventedOffsets) {
    if (preventedOffsets === void 0) {
      preventedOffsets = {
        x: 0,
        y: 0
      };
    }
    return {
      top: overflow.top - rect.height - preventedOffsets.y,
      right: overflow.right - rect.width + preventedOffsets.x,
      bottom: overflow.bottom - rect.height + preventedOffsets.y,
      left: overflow.left - rect.width - preventedOffsets.x
    };
  }
  function isAnySideFullyClipped(overflow) {
    return [top, right, bottom, left].some(function(side) {
      return overflow[side] >= 0;
    });
  }
  function hide(_ref) {
    var state = _ref.state, name = _ref.name;
    var referenceRect = state.rects.reference;
    var popperRect = state.rects.popper;
    var preventedOffsets = state.modifiersData.preventOverflow;
    var referenceOverflow = detectOverflow(state, {
      elementContext: "reference"
    });
    var popperAltOverflow = detectOverflow(state, {
      altBoundary: true
    });
    var referenceClippingOffsets = getSideOffsets(referenceOverflow, referenceRect);
    var popperEscapeOffsets = getSideOffsets(popperAltOverflow, popperRect, preventedOffsets);
    var isReferenceHidden = isAnySideFullyClipped(referenceClippingOffsets);
    var hasPopperEscaped = isAnySideFullyClipped(popperEscapeOffsets);
    state.modifiersData[name] = {
      referenceClippingOffsets,
      popperEscapeOffsets,
      isReferenceHidden,
      hasPopperEscaped
    };
    state.attributes.popper = Object.assign({}, state.attributes.popper, {
      "data-popper-reference-hidden": isReferenceHidden,
      "data-popper-escaped": hasPopperEscaped
    });
  }
  var hide_default = {
    name: "hide",
    enabled: true,
    phase: "main",
    requiresIfExists: ["preventOverflow"],
    fn: hide
  };

  // ../../../node_modules/@popperjs/core/lib/modifiers/offset.js
  function distanceAndSkiddingToXY(placement, rects, offset2) {
    var basePlacement = getBasePlacement(placement);
    var invertDistance = [left, top].indexOf(basePlacement) >= 0 ? -1 : 1;
    var _ref = typeof offset2 === "function" ? offset2(Object.assign({}, rects, {
      placement
    })) : offset2, skidding = _ref[0], distance = _ref[1];
    skidding = skidding || 0;
    distance = (distance || 0) * invertDistance;
    return [left, right].indexOf(basePlacement) >= 0 ? {
      x: distance,
      y: skidding
    } : {
      x: skidding,
      y: distance
    };
  }
  function offset(_ref2) {
    var state = _ref2.state, options = _ref2.options, name = _ref2.name;
    var _options$offset = options.offset, offset2 = _options$offset === void 0 ? [0, 0] : _options$offset;
    var data = placements.reduce(function(acc, placement) {
      acc[placement] = distanceAndSkiddingToXY(placement, state.rects, offset2);
      return acc;
    }, {});
    var _data$state$placement = data[state.placement], x = _data$state$placement.x, y = _data$state$placement.y;
    if (state.modifiersData.popperOffsets != null) {
      state.modifiersData.popperOffsets.x += x;
      state.modifiersData.popperOffsets.y += y;
    }
    state.modifiersData[name] = data;
  }
  var offset_default = {
    name: "offset",
    enabled: true,
    phase: "main",
    requires: ["popperOffsets"],
    fn: offset
  };

  // ../../../node_modules/@popperjs/core/lib/modifiers/popperOffsets.js
  function popperOffsets(_ref) {
    var state = _ref.state, name = _ref.name;
    state.modifiersData[name] = computeOffsets({
      reference: state.rects.reference,
      element: state.rects.popper,
      strategy: "absolute",
      placement: state.placement
    });
  }
  var popperOffsets_default = {
    name: "popperOffsets",
    enabled: true,
    phase: "read",
    fn: popperOffsets,
    data: {}
  };

  // ../../../node_modules/@popperjs/core/lib/utils/getAltAxis.js
  function getAltAxis(axis) {
    return axis === "x" ? "y" : "x";
  }

  // ../../../node_modules/@popperjs/core/lib/modifiers/preventOverflow.js
  function preventOverflow(_ref) {
    var state = _ref.state, options = _ref.options, name = _ref.name;
    var _options$mainAxis = options.mainAxis, checkMainAxis = _options$mainAxis === void 0 ? true : _options$mainAxis, _options$altAxis = options.altAxis, checkAltAxis = _options$altAxis === void 0 ? false : _options$altAxis, boundary = options.boundary, rootBoundary = options.rootBoundary, altBoundary = options.altBoundary, padding = options.padding, _options$tether = options.tether, tether = _options$tether === void 0 ? true : _options$tether, _options$tetherOffset = options.tetherOffset, tetherOffset = _options$tetherOffset === void 0 ? 0 : _options$tetherOffset;
    var overflow = detectOverflow(state, {
      boundary,
      rootBoundary,
      padding,
      altBoundary
    });
    var basePlacement = getBasePlacement(state.placement);
    var variation = getVariation(state.placement);
    var isBasePlacement = !variation;
    var mainAxis = getMainAxisFromPlacement(basePlacement);
    var altAxis = getAltAxis(mainAxis);
    var popperOffsets2 = state.modifiersData.popperOffsets;
    var referenceRect = state.rects.reference;
    var popperRect = state.rects.popper;
    var tetherOffsetValue = typeof tetherOffset === "function" ? tetherOffset(Object.assign({}, state.rects, {
      placement: state.placement
    })) : tetherOffset;
    var normalizedTetherOffsetValue = typeof tetherOffsetValue === "number" ? {
      mainAxis: tetherOffsetValue,
      altAxis: tetherOffsetValue
    } : Object.assign({
      mainAxis: 0,
      altAxis: 0
    }, tetherOffsetValue);
    var offsetModifierState = state.modifiersData.offset ? state.modifiersData.offset[state.placement] : null;
    var data = {
      x: 0,
      y: 0
    };
    if (!popperOffsets2) {
      return;
    }
    if (checkMainAxis) {
      var _offsetModifierState$;
      var mainSide = mainAxis === "y" ? top : left;
      var altSide = mainAxis === "y" ? bottom : right;
      var len = mainAxis === "y" ? "height" : "width";
      var offset2 = popperOffsets2[mainAxis];
      var min2 = offset2 + overflow[mainSide];
      var max2 = offset2 - overflow[altSide];
      var additive = tether ? -popperRect[len] / 2 : 0;
      var minLen = variation === start ? referenceRect[len] : popperRect[len];
      var maxLen = variation === start ? -popperRect[len] : -referenceRect[len];
      var arrowElement = state.elements.arrow;
      var arrowRect = tether && arrowElement ? getLayoutRect(arrowElement) : {
        width: 0,
        height: 0
      };
      var arrowPaddingObject = state.modifiersData["arrow#persistent"] ? state.modifiersData["arrow#persistent"].padding : getFreshSideObject();
      var arrowPaddingMin = arrowPaddingObject[mainSide];
      var arrowPaddingMax = arrowPaddingObject[altSide];
      var arrowLen = within(0, referenceRect[len], arrowRect[len]);
      var minOffset = isBasePlacement ? referenceRect[len] / 2 - additive - arrowLen - arrowPaddingMin - normalizedTetherOffsetValue.mainAxis : minLen - arrowLen - arrowPaddingMin - normalizedTetherOffsetValue.mainAxis;
      var maxOffset = isBasePlacement ? -referenceRect[len] / 2 + additive + arrowLen + arrowPaddingMax + normalizedTetherOffsetValue.mainAxis : maxLen + arrowLen + arrowPaddingMax + normalizedTetherOffsetValue.mainAxis;
      var arrowOffsetParent = state.elements.arrow && getOffsetParent(state.elements.arrow);
      var clientOffset = arrowOffsetParent ? mainAxis === "y" ? arrowOffsetParent.clientTop || 0 : arrowOffsetParent.clientLeft || 0 : 0;
      var offsetModifierValue = (_offsetModifierState$ = offsetModifierState == null ? void 0 : offsetModifierState[mainAxis]) != null ? _offsetModifierState$ : 0;
      var tetherMin = offset2 + minOffset - offsetModifierValue - clientOffset;
      var tetherMax = offset2 + maxOffset - offsetModifierValue;
      var preventedOffset = within(tether ? min(min2, tetherMin) : min2, offset2, tether ? max(max2, tetherMax) : max2);
      popperOffsets2[mainAxis] = preventedOffset;
      data[mainAxis] = preventedOffset - offset2;
    }
    if (checkAltAxis) {
      var _offsetModifierState$2;
      var _mainSide = mainAxis === "x" ? top : left;
      var _altSide = mainAxis === "x" ? bottom : right;
      var _offset = popperOffsets2[altAxis];
      var _len = altAxis === "y" ? "height" : "width";
      var _min = _offset + overflow[_mainSide];
      var _max = _offset - overflow[_altSide];
      var isOriginSide = [top, left].indexOf(basePlacement) !== -1;
      var _offsetModifierValue = (_offsetModifierState$2 = offsetModifierState == null ? void 0 : offsetModifierState[altAxis]) != null ? _offsetModifierState$2 : 0;
      var _tetherMin = isOriginSide ? _min : _offset - referenceRect[_len] - popperRect[_len] - _offsetModifierValue + normalizedTetherOffsetValue.altAxis;
      var _tetherMax = isOriginSide ? _offset + referenceRect[_len] + popperRect[_len] - _offsetModifierValue - normalizedTetherOffsetValue.altAxis : _max;
      var _preventedOffset = tether && isOriginSide ? withinMaxClamp(_tetherMin, _offset, _tetherMax) : within(tether ? _tetherMin : _min, _offset, tether ? _tetherMax : _max);
      popperOffsets2[altAxis] = _preventedOffset;
      data[altAxis] = _preventedOffset - _offset;
    }
    state.modifiersData[name] = data;
  }
  var preventOverflow_default = {
    name: "preventOverflow",
    enabled: true,
    phase: "main",
    fn: preventOverflow,
    requiresIfExists: ["offset"]
  };

  // ../../../node_modules/@popperjs/core/lib/dom-utils/getHTMLElementScroll.js
  function getHTMLElementScroll(element) {
    return {
      scrollLeft: element.scrollLeft,
      scrollTop: element.scrollTop
    };
  }

  // ../../../node_modules/@popperjs/core/lib/dom-utils/getNodeScroll.js
  function getNodeScroll(node) {
    if (node === getWindow(node) || !isHTMLElement(node)) {
      return getWindowScroll(node);
    } else {
      return getHTMLElementScroll(node);
    }
  }

  // ../../../node_modules/@popperjs/core/lib/dom-utils/getCompositeRect.js
  function isElementScaled(element) {
    var rect = element.getBoundingClientRect();
    var scaleX = round(rect.width) / element.offsetWidth || 1;
    var scaleY = round(rect.height) / element.offsetHeight || 1;
    return scaleX !== 1 || scaleY !== 1;
  }
  function getCompositeRect(elementOrVirtualElement, offsetParent, isFixed) {
    if (isFixed === void 0) {
      isFixed = false;
    }
    var isOffsetParentAnElement = isHTMLElement(offsetParent);
    var offsetParentIsScaled = isHTMLElement(offsetParent) && isElementScaled(offsetParent);
    var documentElement = getDocumentElement(offsetParent);
    var rect = getBoundingClientRect(elementOrVirtualElement, offsetParentIsScaled, isFixed);
    var scroll = {
      scrollLeft: 0,
      scrollTop: 0
    };
    var offsets = {
      x: 0,
      y: 0
    };
    if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
      if (getNodeName(offsetParent) !== "body" || // https://github.com/popperjs/popper-core/issues/1078
      isScrollParent(documentElement)) {
        scroll = getNodeScroll(offsetParent);
      }
      if (isHTMLElement(offsetParent)) {
        offsets = getBoundingClientRect(offsetParent, true);
        offsets.x += offsetParent.clientLeft;
        offsets.y += offsetParent.clientTop;
      } else if (documentElement) {
        offsets.x = getWindowScrollBarX(documentElement);
      }
    }
    return {
      x: rect.left + scroll.scrollLeft - offsets.x,
      y: rect.top + scroll.scrollTop - offsets.y,
      width: rect.width,
      height: rect.height
    };
  }

  // ../../../node_modules/@popperjs/core/lib/utils/orderModifiers.js
  function order(modifiers) {
    var map = /* @__PURE__ */ new Map();
    var visited = /* @__PURE__ */ new Set();
    var result = [];
    modifiers.forEach(function(modifier) {
      map.set(modifier.name, modifier);
    });
    function sort(modifier) {
      visited.add(modifier.name);
      var requires = [].concat(modifier.requires || [], modifier.requiresIfExists || []);
      requires.forEach(function(dep) {
        if (!visited.has(dep)) {
          var depModifier = map.get(dep);
          if (depModifier) {
            sort(depModifier);
          }
        }
      });
      result.push(modifier);
    }
    modifiers.forEach(function(modifier) {
      if (!visited.has(modifier.name)) {
        sort(modifier);
      }
    });
    return result;
  }
  function orderModifiers(modifiers) {
    var orderedModifiers = order(modifiers);
    return modifierPhases.reduce(function(acc, phase) {
      return acc.concat(orderedModifiers.filter(function(modifier) {
        return modifier.phase === phase;
      }));
    }, []);
  }

  // ../../../node_modules/@popperjs/core/lib/utils/debounce.js
  function debounce(fn2) {
    var pending;
    return function() {
      if (!pending) {
        pending = new Promise(function(resolve) {
          Promise.resolve().then(function() {
            pending = void 0;
            resolve(fn2());
          });
        });
      }
      return pending;
    };
  }

  // ../../../node_modules/@popperjs/core/lib/utils/mergeByName.js
  function mergeByName(modifiers) {
    var merged = modifiers.reduce(function(merged2, current) {
      var existing = merged2[current.name];
      merged2[current.name] = existing ? Object.assign({}, existing, current, {
        options: Object.assign({}, existing.options, current.options),
        data: Object.assign({}, existing.data, current.data)
      }) : current;
      return merged2;
    }, {});
    return Object.keys(merged).map(function(key) {
      return merged[key];
    });
  }

  // ../../../node_modules/@popperjs/core/lib/createPopper.js
  var DEFAULT_OPTIONS = {
    placement: "bottom",
    modifiers: [],
    strategy: "absolute"
  };
  function areValidElements() {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    return !args.some(function(element) {
      return !(element && typeof element.getBoundingClientRect === "function");
    });
  }
  function popperGenerator(generatorOptions) {
    if (generatorOptions === void 0) {
      generatorOptions = {};
    }
    var _generatorOptions = generatorOptions, _generatorOptions$def = _generatorOptions.defaultModifiers, defaultModifiers3 = _generatorOptions$def === void 0 ? [] : _generatorOptions$def, _generatorOptions$def2 = _generatorOptions.defaultOptions, defaultOptions = _generatorOptions$def2 === void 0 ? DEFAULT_OPTIONS : _generatorOptions$def2;
    return function createPopper4(reference2, popper2, options) {
      if (options === void 0) {
        options = defaultOptions;
      }
      var state = {
        placement: "bottom",
        orderedModifiers: [],
        options: Object.assign({}, DEFAULT_OPTIONS, defaultOptions),
        modifiersData: {},
        elements: {
          reference: reference2,
          popper: popper2
        },
        attributes: {},
        styles: {}
      };
      var effectCleanupFns = [];
      var isDestroyed = false;
      var instance = {
        state,
        setOptions: function setOptions(setOptionsAction) {
          var options2 = typeof setOptionsAction === "function" ? setOptionsAction(state.options) : setOptionsAction;
          cleanupModifierEffects();
          state.options = Object.assign({}, defaultOptions, state.options, options2);
          state.scrollParents = {
            reference: isElement(reference2) ? listScrollParents(reference2) : reference2.contextElement ? listScrollParents(reference2.contextElement) : [],
            popper: listScrollParents(popper2)
          };
          var orderedModifiers = orderModifiers(mergeByName([].concat(defaultModifiers3, state.options.modifiers)));
          state.orderedModifiers = orderedModifiers.filter(function(m) {
            return m.enabled;
          });
          runModifierEffects();
          return instance.update();
        },
        // Sync update – it will always be executed, even if not necessary. This
        // is useful for low frequency updates where sync behavior simplifies the
        // logic.
        // For high frequency updates (e.g. `resize` and `scroll` events), always
        // prefer the async Popper#update method
        forceUpdate: function forceUpdate() {
          if (isDestroyed) {
            return;
          }
          var _state$elements = state.elements, reference3 = _state$elements.reference, popper3 = _state$elements.popper;
          if (!areValidElements(reference3, popper3)) {
            return;
          }
          state.rects = {
            reference: getCompositeRect(reference3, getOffsetParent(popper3), state.options.strategy === "fixed"),
            popper: getLayoutRect(popper3)
          };
          state.reset = false;
          state.placement = state.options.placement;
          state.orderedModifiers.forEach(function(modifier) {
            return state.modifiersData[modifier.name] = Object.assign({}, modifier.data);
          });
          for (var index = 0; index < state.orderedModifiers.length; index++) {
            if (state.reset === true) {
              state.reset = false;
              index = -1;
              continue;
            }
            var _state$orderedModifie = state.orderedModifiers[index], fn2 = _state$orderedModifie.fn, _state$orderedModifie2 = _state$orderedModifie.options, _options = _state$orderedModifie2 === void 0 ? {} : _state$orderedModifie2, name = _state$orderedModifie.name;
            if (typeof fn2 === "function") {
              state = fn2({
                state,
                options: _options,
                name,
                instance
              }) || state;
            }
          }
        },
        // Async and optimistically optimized update – it will not be executed if
        // not necessary (debounced to run at most once-per-tick)
        update: debounce(function() {
          return new Promise(function(resolve) {
            instance.forceUpdate();
            resolve(state);
          });
        }),
        destroy: function destroy() {
          cleanupModifierEffects();
          isDestroyed = true;
        }
      };
      if (!areValidElements(reference2, popper2)) {
        return instance;
      }
      instance.setOptions(options).then(function(state2) {
        if (!isDestroyed && options.onFirstUpdate) {
          options.onFirstUpdate(state2);
        }
      });
      function runModifierEffects() {
        state.orderedModifiers.forEach(function(_ref) {
          var name = _ref.name, _ref$options = _ref.options, options2 = _ref$options === void 0 ? {} : _ref$options, effect4 = _ref.effect;
          if (typeof effect4 === "function") {
            var cleanupFn = effect4({
              state,
              name,
              instance,
              options: options2
            });
            var noopFn = function noopFn2() {
            };
            effectCleanupFns.push(cleanupFn || noopFn);
          }
        });
      }
      function cleanupModifierEffects() {
        effectCleanupFns.forEach(function(fn2) {
          return fn2();
        });
        effectCleanupFns = [];
      }
      return instance;
    };
  }
  var createPopper = /* @__PURE__ */ popperGenerator();

  // ../../../node_modules/@popperjs/core/lib/popper-lite.js
  var defaultModifiers = [eventListeners_default, popperOffsets_default, computeStyles_default, applyStyles_default];
  var createPopper2 = /* @__PURE__ */ popperGenerator({
    defaultModifiers
  });

  // ../../../node_modules/@popperjs/core/lib/popper.js
  var defaultModifiers2 = [eventListeners_default, popperOffsets_default, computeStyles_default, applyStyles_default, offset_default, flip_default, preventOverflow_default, arrow_default, hide_default];
  var createPopper3 = /* @__PURE__ */ popperGenerator({
    defaultModifiers: defaultModifiers2
  });

  // ../../../node_modules/bootstrap/dist/js/bootstrap.esm.js
  var elementMap = /* @__PURE__ */ new Map();
  var Data = {
    set(element, key, instance) {
      if (!elementMap.has(element)) {
        elementMap.set(element, /* @__PURE__ */ new Map());
      }
      const instanceMap = elementMap.get(element);
      if (!instanceMap.has(key) && instanceMap.size !== 0) {
        console.error(`Bootstrap doesn't allow more than one instance per element. Bound instance: ${Array.from(instanceMap.keys())[0]}.`);
        return;
      }
      instanceMap.set(key, instance);
    },
    get(element, key) {
      if (elementMap.has(element)) {
        return elementMap.get(element).get(key) || null;
      }
      return null;
    },
    remove(element, key) {
      if (!elementMap.has(element)) {
        return;
      }
      const instanceMap = elementMap.get(element);
      instanceMap.delete(key);
      if (instanceMap.size === 0) {
        elementMap.delete(element);
      }
    }
  };
  var MAX_UID = 1e6;
  var MILLISECONDS_MULTIPLIER = 1e3;
  var TRANSITION_END = "transitionend";
  var parseSelector = (selector) => {
    if (selector && window.CSS && window.CSS.escape) {
      selector = selector.replace(/#([^\s"#']+)/g, (match, id) => `#${CSS.escape(id)}`);
    }
    return selector;
  };
  var toType = (object) => {
    if (object === null || object === void 0) {
      return `${object}`;
    }
    return Object.prototype.toString.call(object).match(/\s([a-z]+)/i)[1].toLowerCase();
  };
  var getUID = (prefix) => {
    do {
      prefix += Math.floor(Math.random() * MAX_UID);
    } while (document.getElementById(prefix));
    return prefix;
  };
  var getTransitionDurationFromElement = (element) => {
    if (!element) {
      return 0;
    }
    let {
      transitionDuration,
      transitionDelay
    } = window.getComputedStyle(element);
    const floatTransitionDuration = Number.parseFloat(transitionDuration);
    const floatTransitionDelay = Number.parseFloat(transitionDelay);
    if (!floatTransitionDuration && !floatTransitionDelay) {
      return 0;
    }
    transitionDuration = transitionDuration.split(",")[0];
    transitionDelay = transitionDelay.split(",")[0];
    return (Number.parseFloat(transitionDuration) + Number.parseFloat(transitionDelay)) * MILLISECONDS_MULTIPLIER;
  };
  var triggerTransitionEnd = (element) => {
    element.dispatchEvent(new Event(TRANSITION_END));
  };
  var isElement2 = (object) => {
    if (!object || typeof object !== "object") {
      return false;
    }
    if (typeof object.jquery !== "undefined") {
      object = object[0];
    }
    return typeof object.nodeType !== "undefined";
  };
  var getElement = (object) => {
    if (isElement2(object)) {
      return object.jquery ? object[0] : object;
    }
    if (typeof object === "string" && object.length > 0) {
      return document.querySelector(parseSelector(object));
    }
    return null;
  };
  var isVisible = (element) => {
    if (!isElement2(element) || element.getClientRects().length === 0) {
      return false;
    }
    const elementIsVisible = getComputedStyle(element).getPropertyValue("visibility") === "visible";
    const closedDetails = element.closest("details:not([open])");
    if (!closedDetails) {
      return elementIsVisible;
    }
    if (closedDetails !== element) {
      const summary = element.closest("summary");
      if (summary && summary.parentNode !== closedDetails) {
        return false;
      }
      if (summary === null) {
        return false;
      }
    }
    return elementIsVisible;
  };
  var isDisabled = (element) => {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return true;
    }
    if (element.classList.contains("disabled")) {
      return true;
    }
    if (typeof element.disabled !== "undefined") {
      return element.disabled;
    }
    return element.hasAttribute("disabled") && element.getAttribute("disabled") !== "false";
  };
  var findShadowRoot = (element) => {
    if (!document.documentElement.attachShadow) {
      return null;
    }
    if (typeof element.getRootNode === "function") {
      const root = element.getRootNode();
      return root instanceof ShadowRoot ? root : null;
    }
    if (element instanceof ShadowRoot) {
      return element;
    }
    if (!element.parentNode) {
      return null;
    }
    return findShadowRoot(element.parentNode);
  };
  var noop = () => {
  };
  var reflow = (element) => {
    element.offsetHeight;
  };
  var getjQuery = () => {
    if (window.jQuery && !document.body.hasAttribute("data-bs-no-jquery")) {
      return window.jQuery;
    }
    return null;
  };
  var DOMContentLoadedCallbacks = [];
  var onDOMContentLoaded = (callback) => {
    if (document.readyState === "loading") {
      if (!DOMContentLoadedCallbacks.length) {
        document.addEventListener("DOMContentLoaded", () => {
          for (const callback2 of DOMContentLoadedCallbacks) {
            callback2();
          }
        });
      }
      DOMContentLoadedCallbacks.push(callback);
    } else {
      callback();
    }
  };
  var isRTL = () => document.documentElement.dir === "rtl";
  var defineJQueryPlugin = (plugin15) => {
    onDOMContentLoaded(() => {
      const $ = getjQuery();
      if ($) {
        const name = plugin15.NAME;
        const JQUERY_NO_CONFLICT = $.fn[name];
        $.fn[name] = plugin15.jQueryInterface;
        $.fn[name].Constructor = plugin15;
        $.fn[name].noConflict = () => {
          $.fn[name] = JQUERY_NO_CONFLICT;
          return plugin15.jQueryInterface;
        };
      }
    });
  };
  var execute = (possibleCallback, args = [], defaultValue = possibleCallback) => {
    return typeof possibleCallback === "function" ? possibleCallback.call(...args) : defaultValue;
  };
  var executeAfterTransition = (callback, transitionElement, waitForTransition = true) => {
    if (!waitForTransition) {
      execute(callback);
      return;
    }
    const durationPadding = 5;
    const emulatedDuration = getTransitionDurationFromElement(transitionElement) + durationPadding;
    let called = false;
    const handler = ({
      target
    }) => {
      if (target !== transitionElement) {
        return;
      }
      called = true;
      transitionElement.removeEventListener(TRANSITION_END, handler);
      execute(callback);
    };
    transitionElement.addEventListener(TRANSITION_END, handler);
    setTimeout(() => {
      if (!called) {
        triggerTransitionEnd(transitionElement);
      }
    }, emulatedDuration);
  };
  var getNextActiveElement = (list, activeElement, shouldGetNext, isCycleAllowed) => {
    const listLength = list.length;
    let index = list.indexOf(activeElement);
    if (index === -1) {
      return !shouldGetNext && isCycleAllowed ? list[listLength - 1] : list[0];
    }
    index += shouldGetNext ? 1 : -1;
    if (isCycleAllowed) {
      index = (index + listLength) % listLength;
    }
    return list[Math.max(0, Math.min(index, listLength - 1))];
  };
  var namespaceRegex = /[^.]*(?=\..*)\.|.*/;
  var stripNameRegex = /\..*/;
  var stripUidRegex = /::\d+$/;
  var eventRegistry = {};
  var uidEvent = 1;
  var customEvents = {
    mouseenter: "mouseover",
    mouseleave: "mouseout"
  };
  var nativeEvents = /* @__PURE__ */ new Set(["click", "dblclick", "mouseup", "mousedown", "contextmenu", "mousewheel", "DOMMouseScroll", "mouseover", "mouseout", "mousemove", "selectstart", "selectend", "keydown", "keypress", "keyup", "orientationchange", "touchstart", "touchmove", "touchend", "touchcancel", "pointerdown", "pointermove", "pointerup", "pointerleave", "pointercancel", "gesturestart", "gesturechange", "gestureend", "focus", "blur", "change", "reset", "select", "submit", "focusin", "focusout", "load", "unload", "beforeunload", "resize", "move", "DOMContentLoaded", "readystatechange", "error", "abort", "scroll"]);
  function makeEventUid(element, uid) {
    return uid && `${uid}::${uidEvent++}` || element.uidEvent || uidEvent++;
  }
  function getElementEvents(element) {
    const uid = makeEventUid(element);
    element.uidEvent = uid;
    eventRegistry[uid] = eventRegistry[uid] || {};
    return eventRegistry[uid];
  }
  function bootstrapHandler(element, fn2) {
    return function handler(event) {
      hydrateObj(event, {
        delegateTarget: element
      });
      if (handler.oneOff) {
        EventHandler.off(element, event.type, fn2);
      }
      return fn2.apply(element, [event]);
    };
  }
  function bootstrapDelegationHandler(element, selector, fn2) {
    return function handler(event) {
      const domElements = element.querySelectorAll(selector);
      for (let {
        target
      } = event; target && target !== this; target = target.parentNode) {
        for (const domElement of domElements) {
          if (domElement !== target) {
            continue;
          }
          hydrateObj(event, {
            delegateTarget: target
          });
          if (handler.oneOff) {
            EventHandler.off(element, event.type, selector, fn2);
          }
          return fn2.apply(target, [event]);
        }
      }
    };
  }
  function findHandler(events, callable, delegationSelector = null) {
    return Object.values(events).find((event) => event.callable === callable && event.delegationSelector === delegationSelector);
  }
  function normalizeParameters(originalTypeEvent, handler, delegationFunction) {
    const isDelegated = typeof handler === "string";
    const callable = isDelegated ? delegationFunction : handler || delegationFunction;
    let typeEvent = getTypeEvent(originalTypeEvent);
    if (!nativeEvents.has(typeEvent)) {
      typeEvent = originalTypeEvent;
    }
    return [isDelegated, callable, typeEvent];
  }
  function addHandler(element, originalTypeEvent, handler, delegationFunction, oneOff) {
    if (typeof originalTypeEvent !== "string" || !element) {
      return;
    }
    let [isDelegated, callable, typeEvent] = normalizeParameters(originalTypeEvent, handler, delegationFunction);
    if (originalTypeEvent in customEvents) {
      const wrapFunction = (fn3) => {
        return function(event) {
          if (!event.relatedTarget || event.relatedTarget !== event.delegateTarget && !event.delegateTarget.contains(event.relatedTarget)) {
            return fn3.call(this, event);
          }
        };
      };
      callable = wrapFunction(callable);
    }
    const events = getElementEvents(element);
    const handlers = events[typeEvent] || (events[typeEvent] = {});
    const previousFunction = findHandler(handlers, callable, isDelegated ? handler : null);
    if (previousFunction) {
      previousFunction.oneOff = previousFunction.oneOff && oneOff;
      return;
    }
    const uid = makeEventUid(callable, originalTypeEvent.replace(namespaceRegex, ""));
    const fn2 = isDelegated ? bootstrapDelegationHandler(element, handler, callable) : bootstrapHandler(element, callable);
    fn2.delegationSelector = isDelegated ? handler : null;
    fn2.callable = callable;
    fn2.oneOff = oneOff;
    fn2.uidEvent = uid;
    handlers[uid] = fn2;
    element.addEventListener(typeEvent, fn2, isDelegated);
  }
  function removeHandler(element, events, typeEvent, handler, delegationSelector) {
    const fn2 = findHandler(events[typeEvent], handler, delegationSelector);
    if (!fn2) {
      return;
    }
    element.removeEventListener(typeEvent, fn2, Boolean(delegationSelector));
    delete events[typeEvent][fn2.uidEvent];
  }
  function removeNamespacedHandlers(element, events, typeEvent, namespace) {
    const storeElementEvent = events[typeEvent] || {};
    for (const [handlerKey, event] of Object.entries(storeElementEvent)) {
      if (handlerKey.includes(namespace)) {
        removeHandler(element, events, typeEvent, event.callable, event.delegationSelector);
      }
    }
  }
  function getTypeEvent(event) {
    event = event.replace(stripNameRegex, "");
    return customEvents[event] || event;
  }
  var EventHandler = {
    on(element, event, handler, delegationFunction) {
      addHandler(element, event, handler, delegationFunction, false);
    },
    one(element, event, handler, delegationFunction) {
      addHandler(element, event, handler, delegationFunction, true);
    },
    off(element, originalTypeEvent, handler, delegationFunction) {
      if (typeof originalTypeEvent !== "string" || !element) {
        return;
      }
      const [isDelegated, callable, typeEvent] = normalizeParameters(originalTypeEvent, handler, delegationFunction);
      const inNamespace = typeEvent !== originalTypeEvent;
      const events = getElementEvents(element);
      const storeElementEvent = events[typeEvent] || {};
      const isNamespace = originalTypeEvent.startsWith(".");
      if (typeof callable !== "undefined") {
        if (!Object.keys(storeElementEvent).length) {
          return;
        }
        removeHandler(element, events, typeEvent, callable, isDelegated ? handler : null);
        return;
      }
      if (isNamespace) {
        for (const elementEvent of Object.keys(events)) {
          removeNamespacedHandlers(element, events, elementEvent, originalTypeEvent.slice(1));
        }
      }
      for (const [keyHandlers, event] of Object.entries(storeElementEvent)) {
        const handlerKey = keyHandlers.replace(stripUidRegex, "");
        if (!inNamespace || originalTypeEvent.includes(handlerKey)) {
          removeHandler(element, events, typeEvent, event.callable, event.delegationSelector);
        }
      }
    },
    trigger(element, event, args) {
      if (typeof event !== "string" || !element) {
        return null;
      }
      const $ = getjQuery();
      const typeEvent = getTypeEvent(event);
      const inNamespace = event !== typeEvent;
      let jQueryEvent = null;
      let bubbles = true;
      let nativeDispatch = true;
      let defaultPrevented = false;
      if (inNamespace && $) {
        jQueryEvent = $.Event(event, args);
        $(element).trigger(jQueryEvent);
        bubbles = !jQueryEvent.isPropagationStopped();
        nativeDispatch = !jQueryEvent.isImmediatePropagationStopped();
        defaultPrevented = jQueryEvent.isDefaultPrevented();
      }
      const evt = hydrateObj(new Event(event, {
        bubbles,
        cancelable: true
      }), args);
      if (defaultPrevented) {
        evt.preventDefault();
      }
      if (nativeDispatch) {
        element.dispatchEvent(evt);
      }
      if (evt.defaultPrevented && jQueryEvent) {
        jQueryEvent.preventDefault();
      }
      return evt;
    }
  };
  function hydrateObj(obj, meta2 = {}) {
    for (const [key, value] of Object.entries(meta2)) {
      try {
        obj[key] = value;
      } catch (_unused) {
        Object.defineProperty(obj, key, {
          configurable: true,
          get() {
            return value;
          }
        });
      }
    }
    return obj;
  }
  function normalizeData(value) {
    if (value === "true") {
      return true;
    }
    if (value === "false") {
      return false;
    }
    if (value === Number(value).toString()) {
      return Number(value);
    }
    if (value === "" || value === "null") {
      return null;
    }
    if (typeof value !== "string") {
      return value;
    }
    try {
      return JSON.parse(decodeURIComponent(value));
    } catch (_unused) {
      return value;
    }
  }
  function normalizeDataKey(key) {
    return key.replace(/[A-Z]/g, (chr) => `-${chr.toLowerCase()}`);
  }
  var Manipulator = {
    setDataAttribute(element, key, value) {
      element.setAttribute(`data-bs-${normalizeDataKey(key)}`, value);
    },
    removeDataAttribute(element, key) {
      element.removeAttribute(`data-bs-${normalizeDataKey(key)}`);
    },
    getDataAttributes(element) {
      if (!element) {
        return {};
      }
      const attributes = {};
      const bsKeys = Object.keys(element.dataset).filter((key) => key.startsWith("bs") && !key.startsWith("bsConfig"));
      for (const key of bsKeys) {
        let pureKey = key.replace(/^bs/, "");
        pureKey = pureKey.charAt(0).toLowerCase() + pureKey.slice(1);
        attributes[pureKey] = normalizeData(element.dataset[key]);
      }
      return attributes;
    },
    getDataAttribute(element, key) {
      return normalizeData(element.getAttribute(`data-bs-${normalizeDataKey(key)}`));
    }
  };
  var Config = class {
    // Getters
    static get Default() {
      return {};
    }
    static get DefaultType() {
      return {};
    }
    static get NAME() {
      throw new Error('You have to implement the static method "NAME", for each component!');
    }
    _getConfig(config) {
      config = this._mergeConfigObj(config);
      config = this._configAfterMerge(config);
      this._typeCheckConfig(config);
      return config;
    }
    _configAfterMerge(config) {
      return config;
    }
    _mergeConfigObj(config, element) {
      const jsonConfig = isElement2(element) ? Manipulator.getDataAttribute(element, "config") : {};
      return {
        ...this.constructor.Default,
        ...typeof jsonConfig === "object" ? jsonConfig : {},
        ...isElement2(element) ? Manipulator.getDataAttributes(element) : {},
        ...typeof config === "object" ? config : {}
      };
    }
    _typeCheckConfig(config, configTypes = this.constructor.DefaultType) {
      for (const [property, expectedTypes] of Object.entries(configTypes)) {
        const value = config[property];
        const valueType = isElement2(value) ? "element" : toType(value);
        if (!new RegExp(expectedTypes).test(valueType)) {
          throw new TypeError(`${this.constructor.NAME.toUpperCase()}: Option "${property}" provided type "${valueType}" but expected type "${expectedTypes}".`);
        }
      }
    }
  };
  var VERSION = "5.3.7";
  var BaseComponent = class extends Config {
    constructor(element, config) {
      super();
      element = getElement(element);
      if (!element) {
        return;
      }
      this._element = element;
      this._config = this._getConfig(config);
      Data.set(this._element, this.constructor.DATA_KEY, this);
    }
    // Public
    dispose() {
      Data.remove(this._element, this.constructor.DATA_KEY);
      EventHandler.off(this._element, this.constructor.EVENT_KEY);
      for (const propertyName of Object.getOwnPropertyNames(this)) {
        this[propertyName] = null;
      }
    }
    // Private
    _queueCallback(callback, element, isAnimated = true) {
      executeAfterTransition(callback, element, isAnimated);
    }
    _getConfig(config) {
      config = this._mergeConfigObj(config, this._element);
      config = this._configAfterMerge(config);
      this._typeCheckConfig(config);
      return config;
    }
    // Static
    static getInstance(element) {
      return Data.get(getElement(element), this.DATA_KEY);
    }
    static getOrCreateInstance(element, config = {}) {
      return this.getInstance(element) || new this(element, typeof config === "object" ? config : null);
    }
    static get VERSION() {
      return VERSION;
    }
    static get DATA_KEY() {
      return `bs.${this.NAME}`;
    }
    static get EVENT_KEY() {
      return `.${this.DATA_KEY}`;
    }
    static eventName(name) {
      return `${name}${this.EVENT_KEY}`;
    }
  };
  var getSelector = (element) => {
    let selector = element.getAttribute("data-bs-target");
    if (!selector || selector === "#") {
      let hrefAttribute = element.getAttribute("href");
      if (!hrefAttribute || !hrefAttribute.includes("#") && !hrefAttribute.startsWith(".")) {
        return null;
      }
      if (hrefAttribute.includes("#") && !hrefAttribute.startsWith("#")) {
        hrefAttribute = `#${hrefAttribute.split("#")[1]}`;
      }
      selector = hrefAttribute && hrefAttribute !== "#" ? hrefAttribute.trim() : null;
    }
    return selector ? selector.split(",").map((sel) => parseSelector(sel)).join(",") : null;
  };
  var SelectorEngine = {
    find(selector, element = document.documentElement) {
      return [].concat(...Element.prototype.querySelectorAll.call(element, selector));
    },
    findOne(selector, element = document.documentElement) {
      return Element.prototype.querySelector.call(element, selector);
    },
    children(element, selector) {
      return [].concat(...element.children).filter((child) => child.matches(selector));
    },
    parents(element, selector) {
      const parents = [];
      let ancestor = element.parentNode.closest(selector);
      while (ancestor) {
        parents.push(ancestor);
        ancestor = ancestor.parentNode.closest(selector);
      }
      return parents;
    },
    prev(element, selector) {
      let previous = element.previousElementSibling;
      while (previous) {
        if (previous.matches(selector)) {
          return [previous];
        }
        previous = previous.previousElementSibling;
      }
      return [];
    },
    // TODO: this is now unused; remove later along with prev()
    next(element, selector) {
      let next = element.nextElementSibling;
      while (next) {
        if (next.matches(selector)) {
          return [next];
        }
        next = next.nextElementSibling;
      }
      return [];
    },
    focusableChildren(element) {
      const focusables = ["a", "button", "input", "textarea", "select", "details", "[tabindex]", '[contenteditable="true"]'].map((selector) => `${selector}:not([tabindex^="-"])`).join(",");
      return this.find(focusables, element).filter((el) => !isDisabled(el) && isVisible(el));
    },
    getSelectorFromElement(element) {
      const selector = getSelector(element);
      if (selector) {
        return SelectorEngine.findOne(selector) ? selector : null;
      }
      return null;
    },
    getElementFromSelector(element) {
      const selector = getSelector(element);
      return selector ? SelectorEngine.findOne(selector) : null;
    },
    getMultipleElementsFromSelector(element) {
      const selector = getSelector(element);
      return selector ? SelectorEngine.find(selector) : [];
    }
  };
  var enableDismissTrigger = (component, method = "hide") => {
    const clickEvent = `click.dismiss${component.EVENT_KEY}`;
    const name = component.NAME;
    EventHandler.on(document, clickEvent, `[data-bs-dismiss="${name}"]`, function(event) {
      if (["A", "AREA"].includes(this.tagName)) {
        event.preventDefault();
      }
      if (isDisabled(this)) {
        return;
      }
      const target = SelectorEngine.getElementFromSelector(this) || this.closest(`.${name}`);
      const instance = component.getOrCreateInstance(target);
      instance[method]();
    });
  };
  var NAME$f = "alert";
  var DATA_KEY$a = "bs.alert";
  var EVENT_KEY$b = `.${DATA_KEY$a}`;
  var EVENT_CLOSE = `close${EVENT_KEY$b}`;
  var EVENT_CLOSED = `closed${EVENT_KEY$b}`;
  var CLASS_NAME_FADE$5 = "fade";
  var CLASS_NAME_SHOW$8 = "show";
  var Alert = class _Alert extends BaseComponent {
    // Getters
    static get NAME() {
      return NAME$f;
    }
    // Public
    close() {
      const closeEvent = EventHandler.trigger(this._element, EVENT_CLOSE);
      if (closeEvent.defaultPrevented) {
        return;
      }
      this._element.classList.remove(CLASS_NAME_SHOW$8);
      const isAnimated = this._element.classList.contains(CLASS_NAME_FADE$5);
      this._queueCallback(() => this._destroyElement(), this._element, isAnimated);
    }
    // Private
    _destroyElement() {
      this._element.remove();
      EventHandler.trigger(this._element, EVENT_CLOSED);
      this.dispose();
    }
    // Static
    static jQueryInterface(config) {
      return this.each(function() {
        const data = _Alert.getOrCreateInstance(this);
        if (typeof config !== "string") {
          return;
        }
        if (data[config] === void 0 || config.startsWith("_") || config === "constructor") {
          throw new TypeError(`No method named "${config}"`);
        }
        data[config](this);
      });
    }
  };
  enableDismissTrigger(Alert, "close");
  defineJQueryPlugin(Alert);
  var NAME$e = "button";
  var DATA_KEY$9 = "bs.button";
  var EVENT_KEY$a = `.${DATA_KEY$9}`;
  var DATA_API_KEY$6 = ".data-api";
  var CLASS_NAME_ACTIVE$3 = "active";
  var SELECTOR_DATA_TOGGLE$5 = '[data-bs-toggle="button"]';
  var EVENT_CLICK_DATA_API$6 = `click${EVENT_KEY$a}${DATA_API_KEY$6}`;
  var Button = class _Button extends BaseComponent {
    // Getters
    static get NAME() {
      return NAME$e;
    }
    // Public
    toggle() {
      this._element.setAttribute("aria-pressed", this._element.classList.toggle(CLASS_NAME_ACTIVE$3));
    }
    // Static
    static jQueryInterface(config) {
      return this.each(function() {
        const data = _Button.getOrCreateInstance(this);
        if (config === "toggle") {
          data[config]();
        }
      });
    }
  };
  EventHandler.on(document, EVENT_CLICK_DATA_API$6, SELECTOR_DATA_TOGGLE$5, (event) => {
    event.preventDefault();
    const button = event.target.closest(SELECTOR_DATA_TOGGLE$5);
    const data = Button.getOrCreateInstance(button);
    data.toggle();
  });
  defineJQueryPlugin(Button);
  var NAME$d = "swipe";
  var EVENT_KEY$9 = ".bs.swipe";
  var EVENT_TOUCHSTART = `touchstart${EVENT_KEY$9}`;
  var EVENT_TOUCHMOVE = `touchmove${EVENT_KEY$9}`;
  var EVENT_TOUCHEND = `touchend${EVENT_KEY$9}`;
  var EVENT_POINTERDOWN = `pointerdown${EVENT_KEY$9}`;
  var EVENT_POINTERUP = `pointerup${EVENT_KEY$9}`;
  var POINTER_TYPE_TOUCH = "touch";
  var POINTER_TYPE_PEN = "pen";
  var CLASS_NAME_POINTER_EVENT = "pointer-event";
  var SWIPE_THRESHOLD = 40;
  var Default$c = {
    endCallback: null,
    leftCallback: null,
    rightCallback: null
  };
  var DefaultType$c = {
    endCallback: "(function|null)",
    leftCallback: "(function|null)",
    rightCallback: "(function|null)"
  };
  var Swipe = class _Swipe extends Config {
    constructor(element, config) {
      super();
      this._element = element;
      if (!element || !_Swipe.isSupported()) {
        return;
      }
      this._config = this._getConfig(config);
      this._deltaX = 0;
      this._supportPointerEvents = Boolean(window.PointerEvent);
      this._initEvents();
    }
    // Getters
    static get Default() {
      return Default$c;
    }
    static get DefaultType() {
      return DefaultType$c;
    }
    static get NAME() {
      return NAME$d;
    }
    // Public
    dispose() {
      EventHandler.off(this._element, EVENT_KEY$9);
    }
    // Private
    _start(event) {
      if (!this._supportPointerEvents) {
        this._deltaX = event.touches[0].clientX;
        return;
      }
      if (this._eventIsPointerPenTouch(event)) {
        this._deltaX = event.clientX;
      }
    }
    _end(event) {
      if (this._eventIsPointerPenTouch(event)) {
        this._deltaX = event.clientX - this._deltaX;
      }
      this._handleSwipe();
      execute(this._config.endCallback);
    }
    _move(event) {
      this._deltaX = event.touches && event.touches.length > 1 ? 0 : event.touches[0].clientX - this._deltaX;
    }
    _handleSwipe() {
      const absDeltaX = Math.abs(this._deltaX);
      if (absDeltaX <= SWIPE_THRESHOLD) {
        return;
      }
      const direction = absDeltaX / this._deltaX;
      this._deltaX = 0;
      if (!direction) {
        return;
      }
      execute(direction > 0 ? this._config.rightCallback : this._config.leftCallback);
    }
    _initEvents() {
      if (this._supportPointerEvents) {
        EventHandler.on(this._element, EVENT_POINTERDOWN, (event) => this._start(event));
        EventHandler.on(this._element, EVENT_POINTERUP, (event) => this._end(event));
        this._element.classList.add(CLASS_NAME_POINTER_EVENT);
      } else {
        EventHandler.on(this._element, EVENT_TOUCHSTART, (event) => this._start(event));
        EventHandler.on(this._element, EVENT_TOUCHMOVE, (event) => this._move(event));
        EventHandler.on(this._element, EVENT_TOUCHEND, (event) => this._end(event));
      }
    }
    _eventIsPointerPenTouch(event) {
      return this._supportPointerEvents && (event.pointerType === POINTER_TYPE_PEN || event.pointerType === POINTER_TYPE_TOUCH);
    }
    // Static
    static isSupported() {
      return "ontouchstart" in document.documentElement || navigator.maxTouchPoints > 0;
    }
  };
  var NAME$c = "carousel";
  var DATA_KEY$8 = "bs.carousel";
  var EVENT_KEY$8 = `.${DATA_KEY$8}`;
  var DATA_API_KEY$5 = ".data-api";
  var ARROW_LEFT_KEY$1 = "ArrowLeft";
  var ARROW_RIGHT_KEY$1 = "ArrowRight";
  var TOUCHEVENT_COMPAT_WAIT = 500;
  var ORDER_NEXT = "next";
  var ORDER_PREV = "prev";
  var DIRECTION_LEFT = "left";
  var DIRECTION_RIGHT = "right";
  var EVENT_SLIDE = `slide${EVENT_KEY$8}`;
  var EVENT_SLID = `slid${EVENT_KEY$8}`;
  var EVENT_KEYDOWN$1 = `keydown${EVENT_KEY$8}`;
  var EVENT_MOUSEENTER$1 = `mouseenter${EVENT_KEY$8}`;
  var EVENT_MOUSELEAVE$1 = `mouseleave${EVENT_KEY$8}`;
  var EVENT_DRAG_START = `dragstart${EVENT_KEY$8}`;
  var EVENT_LOAD_DATA_API$3 = `load${EVENT_KEY$8}${DATA_API_KEY$5}`;
  var EVENT_CLICK_DATA_API$5 = `click${EVENT_KEY$8}${DATA_API_KEY$5}`;
  var CLASS_NAME_CAROUSEL = "carousel";
  var CLASS_NAME_ACTIVE$2 = "active";
  var CLASS_NAME_SLIDE = "slide";
  var CLASS_NAME_END = "carousel-item-end";
  var CLASS_NAME_START = "carousel-item-start";
  var CLASS_NAME_NEXT = "carousel-item-next";
  var CLASS_NAME_PREV = "carousel-item-prev";
  var SELECTOR_ACTIVE = ".active";
  var SELECTOR_ITEM = ".carousel-item";
  var SELECTOR_ACTIVE_ITEM = SELECTOR_ACTIVE + SELECTOR_ITEM;
  var SELECTOR_ITEM_IMG = ".carousel-item img";
  var SELECTOR_INDICATORS = ".carousel-indicators";
  var SELECTOR_DATA_SLIDE = "[data-bs-slide], [data-bs-slide-to]";
  var SELECTOR_DATA_RIDE = '[data-bs-ride="carousel"]';
  var KEY_TO_DIRECTION = {
    [ARROW_LEFT_KEY$1]: DIRECTION_RIGHT,
    [ARROW_RIGHT_KEY$1]: DIRECTION_LEFT
  };
  var Default$b = {
    interval: 5e3,
    keyboard: true,
    pause: "hover",
    ride: false,
    touch: true,
    wrap: true
  };
  var DefaultType$b = {
    interval: "(number|boolean)",
    // TODO:v6 remove boolean support
    keyboard: "boolean",
    pause: "(string|boolean)",
    ride: "(boolean|string)",
    touch: "boolean",
    wrap: "boolean"
  };
  var Carousel = class _Carousel extends BaseComponent {
    constructor(element, config) {
      super(element, config);
      this._interval = null;
      this._activeElement = null;
      this._isSliding = false;
      this.touchTimeout = null;
      this._swipeHelper = null;
      this._indicatorsElement = SelectorEngine.findOne(SELECTOR_INDICATORS, this._element);
      this._addEventListeners();
      if (this._config.ride === CLASS_NAME_CAROUSEL) {
        this.cycle();
      }
    }
    // Getters
    static get Default() {
      return Default$b;
    }
    static get DefaultType() {
      return DefaultType$b;
    }
    static get NAME() {
      return NAME$c;
    }
    // Public
    next() {
      this._slide(ORDER_NEXT);
    }
    nextWhenVisible() {
      if (!document.hidden && isVisible(this._element)) {
        this.next();
      }
    }
    prev() {
      this._slide(ORDER_PREV);
    }
    pause() {
      if (this._isSliding) {
        triggerTransitionEnd(this._element);
      }
      this._clearInterval();
    }
    cycle() {
      this._clearInterval();
      this._updateInterval();
      this._interval = setInterval(() => this.nextWhenVisible(), this._config.interval);
    }
    _maybeEnableCycle() {
      if (!this._config.ride) {
        return;
      }
      if (this._isSliding) {
        EventHandler.one(this._element, EVENT_SLID, () => this.cycle());
        return;
      }
      this.cycle();
    }
    to(index) {
      const items = this._getItems();
      if (index > items.length - 1 || index < 0) {
        return;
      }
      if (this._isSliding) {
        EventHandler.one(this._element, EVENT_SLID, () => this.to(index));
        return;
      }
      const activeIndex = this._getItemIndex(this._getActive());
      if (activeIndex === index) {
        return;
      }
      const order2 = index > activeIndex ? ORDER_NEXT : ORDER_PREV;
      this._slide(order2, items[index]);
    }
    dispose() {
      if (this._swipeHelper) {
        this._swipeHelper.dispose();
      }
      super.dispose();
    }
    // Private
    _configAfterMerge(config) {
      config.defaultInterval = config.interval;
      return config;
    }
    _addEventListeners() {
      if (this._config.keyboard) {
        EventHandler.on(this._element, EVENT_KEYDOWN$1, (event) => this._keydown(event));
      }
      if (this._config.pause === "hover") {
        EventHandler.on(this._element, EVENT_MOUSEENTER$1, () => this.pause());
        EventHandler.on(this._element, EVENT_MOUSELEAVE$1, () => this._maybeEnableCycle());
      }
      if (this._config.touch && Swipe.isSupported()) {
        this._addTouchEventListeners();
      }
    }
    _addTouchEventListeners() {
      for (const img of SelectorEngine.find(SELECTOR_ITEM_IMG, this._element)) {
        EventHandler.on(img, EVENT_DRAG_START, (event) => event.preventDefault());
      }
      const endCallBack = () => {
        if (this._config.pause !== "hover") {
          return;
        }
        this.pause();
        if (this.touchTimeout) {
          clearTimeout(this.touchTimeout);
        }
        this.touchTimeout = setTimeout(() => this._maybeEnableCycle(), TOUCHEVENT_COMPAT_WAIT + this._config.interval);
      };
      const swipeConfig = {
        leftCallback: () => this._slide(this._directionToOrder(DIRECTION_LEFT)),
        rightCallback: () => this._slide(this._directionToOrder(DIRECTION_RIGHT)),
        endCallback: endCallBack
      };
      this._swipeHelper = new Swipe(this._element, swipeConfig);
    }
    _keydown(event) {
      if (/input|textarea/i.test(event.target.tagName)) {
        return;
      }
      const direction = KEY_TO_DIRECTION[event.key];
      if (direction) {
        event.preventDefault();
        this._slide(this._directionToOrder(direction));
      }
    }
    _getItemIndex(element) {
      return this._getItems().indexOf(element);
    }
    _setActiveIndicatorElement(index) {
      if (!this._indicatorsElement) {
        return;
      }
      const activeIndicator = SelectorEngine.findOne(SELECTOR_ACTIVE, this._indicatorsElement);
      activeIndicator.classList.remove(CLASS_NAME_ACTIVE$2);
      activeIndicator.removeAttribute("aria-current");
      const newActiveIndicator = SelectorEngine.findOne(`[data-bs-slide-to="${index}"]`, this._indicatorsElement);
      if (newActiveIndicator) {
        newActiveIndicator.classList.add(CLASS_NAME_ACTIVE$2);
        newActiveIndicator.setAttribute("aria-current", "true");
      }
    }
    _updateInterval() {
      const element = this._activeElement || this._getActive();
      if (!element) {
        return;
      }
      const elementInterval = Number.parseInt(element.getAttribute("data-bs-interval"), 10);
      this._config.interval = elementInterval || this._config.defaultInterval;
    }
    _slide(order2, element = null) {
      if (this._isSliding) {
        return;
      }
      const activeElement = this._getActive();
      const isNext = order2 === ORDER_NEXT;
      const nextElement = element || getNextActiveElement(this._getItems(), activeElement, isNext, this._config.wrap);
      if (nextElement === activeElement) {
        return;
      }
      const nextElementIndex = this._getItemIndex(nextElement);
      const triggerEvent2 = (eventName) => {
        return EventHandler.trigger(this._element, eventName, {
          relatedTarget: nextElement,
          direction: this._orderToDirection(order2),
          from: this._getItemIndex(activeElement),
          to: nextElementIndex
        });
      };
      const slideEvent = triggerEvent2(EVENT_SLIDE);
      if (slideEvent.defaultPrevented) {
        return;
      }
      if (!activeElement || !nextElement) {
        return;
      }
      const isCycling = Boolean(this._interval);
      this.pause();
      this._isSliding = true;
      this._setActiveIndicatorElement(nextElementIndex);
      this._activeElement = nextElement;
      const directionalClassName = isNext ? CLASS_NAME_START : CLASS_NAME_END;
      const orderClassName = isNext ? CLASS_NAME_NEXT : CLASS_NAME_PREV;
      nextElement.classList.add(orderClassName);
      reflow(nextElement);
      activeElement.classList.add(directionalClassName);
      nextElement.classList.add(directionalClassName);
      const completeCallBack = () => {
        nextElement.classList.remove(directionalClassName, orderClassName);
        nextElement.classList.add(CLASS_NAME_ACTIVE$2);
        activeElement.classList.remove(CLASS_NAME_ACTIVE$2, orderClassName, directionalClassName);
        this._isSliding = false;
        triggerEvent2(EVENT_SLID);
      };
      this._queueCallback(completeCallBack, activeElement, this._isAnimated());
      if (isCycling) {
        this.cycle();
      }
    }
    _isAnimated() {
      return this._element.classList.contains(CLASS_NAME_SLIDE);
    }
    _getActive() {
      return SelectorEngine.findOne(SELECTOR_ACTIVE_ITEM, this._element);
    }
    _getItems() {
      return SelectorEngine.find(SELECTOR_ITEM, this._element);
    }
    _clearInterval() {
      if (this._interval) {
        clearInterval(this._interval);
        this._interval = null;
      }
    }
    _directionToOrder(direction) {
      if (isRTL()) {
        return direction === DIRECTION_LEFT ? ORDER_PREV : ORDER_NEXT;
      }
      return direction === DIRECTION_LEFT ? ORDER_NEXT : ORDER_PREV;
    }
    _orderToDirection(order2) {
      if (isRTL()) {
        return order2 === ORDER_PREV ? DIRECTION_LEFT : DIRECTION_RIGHT;
      }
      return order2 === ORDER_PREV ? DIRECTION_RIGHT : DIRECTION_LEFT;
    }
    // Static
    static jQueryInterface(config) {
      return this.each(function() {
        const data = _Carousel.getOrCreateInstance(this, config);
        if (typeof config === "number") {
          data.to(config);
          return;
        }
        if (typeof config === "string") {
          if (data[config] === void 0 || config.startsWith("_") || config === "constructor") {
            throw new TypeError(`No method named "${config}"`);
          }
          data[config]();
        }
      });
    }
  };
  EventHandler.on(document, EVENT_CLICK_DATA_API$5, SELECTOR_DATA_SLIDE, function(event) {
    const target = SelectorEngine.getElementFromSelector(this);
    if (!target || !target.classList.contains(CLASS_NAME_CAROUSEL)) {
      return;
    }
    event.preventDefault();
    const carousel = Carousel.getOrCreateInstance(target);
    const slideIndex = this.getAttribute("data-bs-slide-to");
    if (slideIndex) {
      carousel.to(slideIndex);
      carousel._maybeEnableCycle();
      return;
    }
    if (Manipulator.getDataAttribute(this, "slide") === "next") {
      carousel.next();
      carousel._maybeEnableCycle();
      return;
    }
    carousel.prev();
    carousel._maybeEnableCycle();
  });
  EventHandler.on(window, EVENT_LOAD_DATA_API$3, () => {
    const carousels = SelectorEngine.find(SELECTOR_DATA_RIDE);
    for (const carousel of carousels) {
      Carousel.getOrCreateInstance(carousel);
    }
  });
  defineJQueryPlugin(Carousel);
  var NAME$b = "collapse";
  var DATA_KEY$7 = "bs.collapse";
  var EVENT_KEY$7 = `.${DATA_KEY$7}`;
  var DATA_API_KEY$4 = ".data-api";
  var EVENT_SHOW$6 = `show${EVENT_KEY$7}`;
  var EVENT_SHOWN$6 = `shown${EVENT_KEY$7}`;
  var EVENT_HIDE$6 = `hide${EVENT_KEY$7}`;
  var EVENT_HIDDEN$6 = `hidden${EVENT_KEY$7}`;
  var EVENT_CLICK_DATA_API$4 = `click${EVENT_KEY$7}${DATA_API_KEY$4}`;
  var CLASS_NAME_SHOW$7 = "show";
  var CLASS_NAME_COLLAPSE = "collapse";
  var CLASS_NAME_COLLAPSING = "collapsing";
  var CLASS_NAME_COLLAPSED = "collapsed";
  var CLASS_NAME_DEEPER_CHILDREN = `:scope .${CLASS_NAME_COLLAPSE} .${CLASS_NAME_COLLAPSE}`;
  var CLASS_NAME_HORIZONTAL = "collapse-horizontal";
  var WIDTH = "width";
  var HEIGHT = "height";
  var SELECTOR_ACTIVES = ".collapse.show, .collapse.collapsing";
  var SELECTOR_DATA_TOGGLE$4 = '[data-bs-toggle="collapse"]';
  var Default$a = {
    parent: null,
    toggle: true
  };
  var DefaultType$a = {
    parent: "(null|element)",
    toggle: "boolean"
  };
  var Collapse = class _Collapse extends BaseComponent {
    constructor(element, config) {
      super(element, config);
      this._isTransitioning = false;
      this._triggerArray = [];
      const toggleList = SelectorEngine.find(SELECTOR_DATA_TOGGLE$4);
      for (const elem of toggleList) {
        const selector = SelectorEngine.getSelectorFromElement(elem);
        const filterElement = SelectorEngine.find(selector).filter((foundElement) => foundElement === this._element);
        if (selector !== null && filterElement.length) {
          this._triggerArray.push(elem);
        }
      }
      this._initializeChildren();
      if (!this._config.parent) {
        this._addAriaAndCollapsedClass(this._triggerArray, this._isShown());
      }
      if (this._config.toggle) {
        this.toggle();
      }
    }
    // Getters
    static get Default() {
      return Default$a;
    }
    static get DefaultType() {
      return DefaultType$a;
    }
    static get NAME() {
      return NAME$b;
    }
    // Public
    toggle() {
      if (this._isShown()) {
        this.hide();
      } else {
        this.show();
      }
    }
    show() {
      if (this._isTransitioning || this._isShown()) {
        return;
      }
      let activeChildren = [];
      if (this._config.parent) {
        activeChildren = this._getFirstLevelChildren(SELECTOR_ACTIVES).filter((element) => element !== this._element).map((element) => _Collapse.getOrCreateInstance(element, {
          toggle: false
        }));
      }
      if (activeChildren.length && activeChildren[0]._isTransitioning) {
        return;
      }
      const startEvent = EventHandler.trigger(this._element, EVENT_SHOW$6);
      if (startEvent.defaultPrevented) {
        return;
      }
      for (const activeInstance of activeChildren) {
        activeInstance.hide();
      }
      const dimension = this._getDimension();
      this._element.classList.remove(CLASS_NAME_COLLAPSE);
      this._element.classList.add(CLASS_NAME_COLLAPSING);
      this._element.style[dimension] = 0;
      this._addAriaAndCollapsedClass(this._triggerArray, true);
      this._isTransitioning = true;
      const complete = () => {
        this._isTransitioning = false;
        this._element.classList.remove(CLASS_NAME_COLLAPSING);
        this._element.classList.add(CLASS_NAME_COLLAPSE, CLASS_NAME_SHOW$7);
        this._element.style[dimension] = "";
        EventHandler.trigger(this._element, EVENT_SHOWN$6);
      };
      const capitalizedDimension = dimension[0].toUpperCase() + dimension.slice(1);
      const scrollSize = `scroll${capitalizedDimension}`;
      this._queueCallback(complete, this._element, true);
      this._element.style[dimension] = `${this._element[scrollSize]}px`;
    }
    hide() {
      if (this._isTransitioning || !this._isShown()) {
        return;
      }
      const startEvent = EventHandler.trigger(this._element, EVENT_HIDE$6);
      if (startEvent.defaultPrevented) {
        return;
      }
      const dimension = this._getDimension();
      this._element.style[dimension] = `${this._element.getBoundingClientRect()[dimension]}px`;
      reflow(this._element);
      this._element.classList.add(CLASS_NAME_COLLAPSING);
      this._element.classList.remove(CLASS_NAME_COLLAPSE, CLASS_NAME_SHOW$7);
      for (const trigger of this._triggerArray) {
        const element = SelectorEngine.getElementFromSelector(trigger);
        if (element && !this._isShown(element)) {
          this._addAriaAndCollapsedClass([trigger], false);
        }
      }
      this._isTransitioning = true;
      const complete = () => {
        this._isTransitioning = false;
        this._element.classList.remove(CLASS_NAME_COLLAPSING);
        this._element.classList.add(CLASS_NAME_COLLAPSE);
        EventHandler.trigger(this._element, EVENT_HIDDEN$6);
      };
      this._element.style[dimension] = "";
      this._queueCallback(complete, this._element, true);
    }
    // Private
    _isShown(element = this._element) {
      return element.classList.contains(CLASS_NAME_SHOW$7);
    }
    _configAfterMerge(config) {
      config.toggle = Boolean(config.toggle);
      config.parent = getElement(config.parent);
      return config;
    }
    _getDimension() {
      return this._element.classList.contains(CLASS_NAME_HORIZONTAL) ? WIDTH : HEIGHT;
    }
    _initializeChildren() {
      if (!this._config.parent) {
        return;
      }
      const children = this._getFirstLevelChildren(SELECTOR_DATA_TOGGLE$4);
      for (const element of children) {
        const selected = SelectorEngine.getElementFromSelector(element);
        if (selected) {
          this._addAriaAndCollapsedClass([element], this._isShown(selected));
        }
      }
    }
    _getFirstLevelChildren(selector) {
      const children = SelectorEngine.find(CLASS_NAME_DEEPER_CHILDREN, this._config.parent);
      return SelectorEngine.find(selector, this._config.parent).filter((element) => !children.includes(element));
    }
    _addAriaAndCollapsedClass(triggerArray, isOpen) {
      if (!triggerArray.length) {
        return;
      }
      for (const element of triggerArray) {
        element.classList.toggle(CLASS_NAME_COLLAPSED, !isOpen);
        element.setAttribute("aria-expanded", isOpen);
      }
    }
    // Static
    static jQueryInterface(config) {
      const _config = {};
      if (typeof config === "string" && /show|hide/.test(config)) {
        _config.toggle = false;
      }
      return this.each(function() {
        const data = _Collapse.getOrCreateInstance(this, _config);
        if (typeof config === "string") {
          if (typeof data[config] === "undefined") {
            throw new TypeError(`No method named "${config}"`);
          }
          data[config]();
        }
      });
    }
  };
  EventHandler.on(document, EVENT_CLICK_DATA_API$4, SELECTOR_DATA_TOGGLE$4, function(event) {
    if (event.target.tagName === "A" || event.delegateTarget && event.delegateTarget.tagName === "A") {
      event.preventDefault();
    }
    for (const element of SelectorEngine.getMultipleElementsFromSelector(this)) {
      Collapse.getOrCreateInstance(element, {
        toggle: false
      }).toggle();
    }
  });
  defineJQueryPlugin(Collapse);
  var NAME$a = "dropdown";
  var DATA_KEY$6 = "bs.dropdown";
  var EVENT_KEY$6 = `.${DATA_KEY$6}`;
  var DATA_API_KEY$3 = ".data-api";
  var ESCAPE_KEY$2 = "Escape";
  var TAB_KEY$1 = "Tab";
  var ARROW_UP_KEY$1 = "ArrowUp";
  var ARROW_DOWN_KEY$1 = "ArrowDown";
  var RIGHT_MOUSE_BUTTON = 2;
  var EVENT_HIDE$5 = `hide${EVENT_KEY$6}`;
  var EVENT_HIDDEN$5 = `hidden${EVENT_KEY$6}`;
  var EVENT_SHOW$5 = `show${EVENT_KEY$6}`;
  var EVENT_SHOWN$5 = `shown${EVENT_KEY$6}`;
  var EVENT_CLICK_DATA_API$3 = `click${EVENT_KEY$6}${DATA_API_KEY$3}`;
  var EVENT_KEYDOWN_DATA_API = `keydown${EVENT_KEY$6}${DATA_API_KEY$3}`;
  var EVENT_KEYUP_DATA_API = `keyup${EVENT_KEY$6}${DATA_API_KEY$3}`;
  var CLASS_NAME_SHOW$6 = "show";
  var CLASS_NAME_DROPUP = "dropup";
  var CLASS_NAME_DROPEND = "dropend";
  var CLASS_NAME_DROPSTART = "dropstart";
  var CLASS_NAME_DROPUP_CENTER = "dropup-center";
  var CLASS_NAME_DROPDOWN_CENTER = "dropdown-center";
  var SELECTOR_DATA_TOGGLE$3 = '[data-bs-toggle="dropdown"]:not(.disabled):not(:disabled)';
  var SELECTOR_DATA_TOGGLE_SHOWN = `${SELECTOR_DATA_TOGGLE$3}.${CLASS_NAME_SHOW$6}`;
  var SELECTOR_MENU = ".dropdown-menu";
  var SELECTOR_NAVBAR = ".navbar";
  var SELECTOR_NAVBAR_NAV = ".navbar-nav";
  var SELECTOR_VISIBLE_ITEMS = ".dropdown-menu .dropdown-item:not(.disabled):not(:disabled)";
  var PLACEMENT_TOP = isRTL() ? "top-end" : "top-start";
  var PLACEMENT_TOPEND = isRTL() ? "top-start" : "top-end";
  var PLACEMENT_BOTTOM = isRTL() ? "bottom-end" : "bottom-start";
  var PLACEMENT_BOTTOMEND = isRTL() ? "bottom-start" : "bottom-end";
  var PLACEMENT_RIGHT = isRTL() ? "left-start" : "right-start";
  var PLACEMENT_LEFT = isRTL() ? "right-start" : "left-start";
  var PLACEMENT_TOPCENTER = "top";
  var PLACEMENT_BOTTOMCENTER = "bottom";
  var Default$9 = {
    autoClose: true,
    boundary: "clippingParents",
    display: "dynamic",
    offset: [0, 2],
    popperConfig: null,
    reference: "toggle"
  };
  var DefaultType$9 = {
    autoClose: "(boolean|string)",
    boundary: "(string|element)",
    display: "string",
    offset: "(array|string|function)",
    popperConfig: "(null|object|function)",
    reference: "(string|element|object)"
  };
  var Dropdown = class _Dropdown extends BaseComponent {
    constructor(element, config) {
      super(element, config);
      this._popper = null;
      this._parent = this._element.parentNode;
      this._menu = SelectorEngine.next(this._element, SELECTOR_MENU)[0] || SelectorEngine.prev(this._element, SELECTOR_MENU)[0] || SelectorEngine.findOne(SELECTOR_MENU, this._parent);
      this._inNavbar = this._detectNavbar();
    }
    // Getters
    static get Default() {
      return Default$9;
    }
    static get DefaultType() {
      return DefaultType$9;
    }
    static get NAME() {
      return NAME$a;
    }
    // Public
    toggle() {
      return this._isShown() ? this.hide() : this.show();
    }
    show() {
      if (isDisabled(this._element) || this._isShown()) {
        return;
      }
      const relatedTarget = {
        relatedTarget: this._element
      };
      const showEvent = EventHandler.trigger(this._element, EVENT_SHOW$5, relatedTarget);
      if (showEvent.defaultPrevented) {
        return;
      }
      this._createPopper();
      if ("ontouchstart" in document.documentElement && !this._parent.closest(SELECTOR_NAVBAR_NAV)) {
        for (const element of [].concat(...document.body.children)) {
          EventHandler.on(element, "mouseover", noop);
        }
      }
      this._element.focus();
      this._element.setAttribute("aria-expanded", true);
      this._menu.classList.add(CLASS_NAME_SHOW$6);
      this._element.classList.add(CLASS_NAME_SHOW$6);
      EventHandler.trigger(this._element, EVENT_SHOWN$5, relatedTarget);
    }
    hide() {
      if (isDisabled(this._element) || !this._isShown()) {
        return;
      }
      const relatedTarget = {
        relatedTarget: this._element
      };
      this._completeHide(relatedTarget);
    }
    dispose() {
      if (this._popper) {
        this._popper.destroy();
      }
      super.dispose();
    }
    update() {
      this._inNavbar = this._detectNavbar();
      if (this._popper) {
        this._popper.update();
      }
    }
    // Private
    _completeHide(relatedTarget) {
      const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE$5, relatedTarget);
      if (hideEvent.defaultPrevented) {
        return;
      }
      if ("ontouchstart" in document.documentElement) {
        for (const element of [].concat(...document.body.children)) {
          EventHandler.off(element, "mouseover", noop);
        }
      }
      if (this._popper) {
        this._popper.destroy();
      }
      this._menu.classList.remove(CLASS_NAME_SHOW$6);
      this._element.classList.remove(CLASS_NAME_SHOW$6);
      this._element.setAttribute("aria-expanded", "false");
      Manipulator.removeDataAttribute(this._menu, "popper");
      EventHandler.trigger(this._element, EVENT_HIDDEN$5, relatedTarget);
      this._element.focus();
    }
    _getConfig(config) {
      config = super._getConfig(config);
      if (typeof config.reference === "object" && !isElement2(config.reference) && typeof config.reference.getBoundingClientRect !== "function") {
        throw new TypeError(`${NAME$a.toUpperCase()}: Option "reference" provided type "object" without a required "getBoundingClientRect" method.`);
      }
      return config;
    }
    _createPopper() {
      if (typeof lib_exports === "undefined") {
        throw new TypeError("Bootstrap's dropdowns require Popper (https://popper.js.org/docs/v2/)");
      }
      let referenceElement = this._element;
      if (this._config.reference === "parent") {
        referenceElement = this._parent;
      } else if (isElement2(this._config.reference)) {
        referenceElement = getElement(this._config.reference);
      } else if (typeof this._config.reference === "object") {
        referenceElement = this._config.reference;
      }
      const popperConfig = this._getPopperConfig();
      this._popper = createPopper3(referenceElement, this._menu, popperConfig);
    }
    _isShown() {
      return this._menu.classList.contains(CLASS_NAME_SHOW$6);
    }
    _getPlacement() {
      const parentDropdown = this._parent;
      if (parentDropdown.classList.contains(CLASS_NAME_DROPEND)) {
        return PLACEMENT_RIGHT;
      }
      if (parentDropdown.classList.contains(CLASS_NAME_DROPSTART)) {
        return PLACEMENT_LEFT;
      }
      if (parentDropdown.classList.contains(CLASS_NAME_DROPUP_CENTER)) {
        return PLACEMENT_TOPCENTER;
      }
      if (parentDropdown.classList.contains(CLASS_NAME_DROPDOWN_CENTER)) {
        return PLACEMENT_BOTTOMCENTER;
      }
      const isEnd = getComputedStyle(this._menu).getPropertyValue("--bs-position").trim() === "end";
      if (parentDropdown.classList.contains(CLASS_NAME_DROPUP)) {
        return isEnd ? PLACEMENT_TOPEND : PLACEMENT_TOP;
      }
      return isEnd ? PLACEMENT_BOTTOMEND : PLACEMENT_BOTTOM;
    }
    _detectNavbar() {
      return this._element.closest(SELECTOR_NAVBAR) !== null;
    }
    _getOffset() {
      const {
        offset: offset2
      } = this._config;
      if (typeof offset2 === "string") {
        return offset2.split(",").map((value) => Number.parseInt(value, 10));
      }
      if (typeof offset2 === "function") {
        return (popperData) => offset2(popperData, this._element);
      }
      return offset2;
    }
    _getPopperConfig() {
      const defaultBsPopperConfig = {
        placement: this._getPlacement(),
        modifiers: [{
          name: "preventOverflow",
          options: {
            boundary: this._config.boundary
          }
        }, {
          name: "offset",
          options: {
            offset: this._getOffset()
          }
        }]
      };
      if (this._inNavbar || this._config.display === "static") {
        Manipulator.setDataAttribute(this._menu, "popper", "static");
        defaultBsPopperConfig.modifiers = [{
          name: "applyStyles",
          enabled: false
        }];
      }
      return {
        ...defaultBsPopperConfig,
        ...execute(this._config.popperConfig, [void 0, defaultBsPopperConfig])
      };
    }
    _selectMenuItem({
      key,
      target
    }) {
      const items = SelectorEngine.find(SELECTOR_VISIBLE_ITEMS, this._menu).filter((element) => isVisible(element));
      if (!items.length) {
        return;
      }
      getNextActiveElement(items, target, key === ARROW_DOWN_KEY$1, !items.includes(target)).focus();
    }
    // Static
    static jQueryInterface(config) {
      return this.each(function() {
        const data = _Dropdown.getOrCreateInstance(this, config);
        if (typeof config !== "string") {
          return;
        }
        if (typeof data[config] === "undefined") {
          throw new TypeError(`No method named "${config}"`);
        }
        data[config]();
      });
    }
    static clearMenus(event) {
      if (event.button === RIGHT_MOUSE_BUTTON || event.type === "keyup" && event.key !== TAB_KEY$1) {
        return;
      }
      const openToggles = SelectorEngine.find(SELECTOR_DATA_TOGGLE_SHOWN);
      for (const toggle of openToggles) {
        const context = _Dropdown.getInstance(toggle);
        if (!context || context._config.autoClose === false) {
          continue;
        }
        const composedPath = event.composedPath();
        const isMenuTarget = composedPath.includes(context._menu);
        if (composedPath.includes(context._element) || context._config.autoClose === "inside" && !isMenuTarget || context._config.autoClose === "outside" && isMenuTarget) {
          continue;
        }
        if (context._menu.contains(event.target) && (event.type === "keyup" && event.key === TAB_KEY$1 || /input|select|option|textarea|form/i.test(event.target.tagName))) {
          continue;
        }
        const relatedTarget = {
          relatedTarget: context._element
        };
        if (event.type === "click") {
          relatedTarget.clickEvent = event;
        }
        context._completeHide(relatedTarget);
      }
    }
    static dataApiKeydownHandler(event) {
      const isInput = /input|textarea/i.test(event.target.tagName);
      const isEscapeEvent = event.key === ESCAPE_KEY$2;
      const isUpOrDownEvent = [ARROW_UP_KEY$1, ARROW_DOWN_KEY$1].includes(event.key);
      if (!isUpOrDownEvent && !isEscapeEvent) {
        return;
      }
      if (isInput && !isEscapeEvent) {
        return;
      }
      event.preventDefault();
      const getToggleButton = this.matches(SELECTOR_DATA_TOGGLE$3) ? this : SelectorEngine.prev(this, SELECTOR_DATA_TOGGLE$3)[0] || SelectorEngine.next(this, SELECTOR_DATA_TOGGLE$3)[0] || SelectorEngine.findOne(SELECTOR_DATA_TOGGLE$3, event.delegateTarget.parentNode);
      const instance = _Dropdown.getOrCreateInstance(getToggleButton);
      if (isUpOrDownEvent) {
        event.stopPropagation();
        instance.show();
        instance._selectMenuItem(event);
        return;
      }
      if (instance._isShown()) {
        event.stopPropagation();
        instance.hide();
        getToggleButton.focus();
      }
    }
  };
  EventHandler.on(document, EVENT_KEYDOWN_DATA_API, SELECTOR_DATA_TOGGLE$3, Dropdown.dataApiKeydownHandler);
  EventHandler.on(document, EVENT_KEYDOWN_DATA_API, SELECTOR_MENU, Dropdown.dataApiKeydownHandler);
  EventHandler.on(document, EVENT_CLICK_DATA_API$3, Dropdown.clearMenus);
  EventHandler.on(document, EVENT_KEYUP_DATA_API, Dropdown.clearMenus);
  EventHandler.on(document, EVENT_CLICK_DATA_API$3, SELECTOR_DATA_TOGGLE$3, function(event) {
    event.preventDefault();
    Dropdown.getOrCreateInstance(this).toggle();
  });
  defineJQueryPlugin(Dropdown);
  var NAME$9 = "backdrop";
  var CLASS_NAME_FADE$4 = "fade";
  var CLASS_NAME_SHOW$5 = "show";
  var EVENT_MOUSEDOWN = `mousedown.bs.${NAME$9}`;
  var Default$8 = {
    className: "modal-backdrop",
    clickCallback: null,
    isAnimated: false,
    isVisible: true,
    // if false, we use the backdrop helper without adding any element to the dom
    rootElement: "body"
    // give the choice to place backdrop under different elements
  };
  var DefaultType$8 = {
    className: "string",
    clickCallback: "(function|null)",
    isAnimated: "boolean",
    isVisible: "boolean",
    rootElement: "(element|string)"
  };
  var Backdrop = class extends Config {
    constructor(config) {
      super();
      this._config = this._getConfig(config);
      this._isAppended = false;
      this._element = null;
    }
    // Getters
    static get Default() {
      return Default$8;
    }
    static get DefaultType() {
      return DefaultType$8;
    }
    static get NAME() {
      return NAME$9;
    }
    // Public
    show(callback) {
      if (!this._config.isVisible) {
        execute(callback);
        return;
      }
      this._append();
      const element = this._getElement();
      if (this._config.isAnimated) {
        reflow(element);
      }
      element.classList.add(CLASS_NAME_SHOW$5);
      this._emulateAnimation(() => {
        execute(callback);
      });
    }
    hide(callback) {
      if (!this._config.isVisible) {
        execute(callback);
        return;
      }
      this._getElement().classList.remove(CLASS_NAME_SHOW$5);
      this._emulateAnimation(() => {
        this.dispose();
        execute(callback);
      });
    }
    dispose() {
      if (!this._isAppended) {
        return;
      }
      EventHandler.off(this._element, EVENT_MOUSEDOWN);
      this._element.remove();
      this._isAppended = false;
    }
    // Private
    _getElement() {
      if (!this._element) {
        const backdrop = document.createElement("div");
        backdrop.className = this._config.className;
        if (this._config.isAnimated) {
          backdrop.classList.add(CLASS_NAME_FADE$4);
        }
        this._element = backdrop;
      }
      return this._element;
    }
    _configAfterMerge(config) {
      config.rootElement = getElement(config.rootElement);
      return config;
    }
    _append() {
      if (this._isAppended) {
        return;
      }
      const element = this._getElement();
      this._config.rootElement.append(element);
      EventHandler.on(element, EVENT_MOUSEDOWN, () => {
        execute(this._config.clickCallback);
      });
      this._isAppended = true;
    }
    _emulateAnimation(callback) {
      executeAfterTransition(callback, this._getElement(), this._config.isAnimated);
    }
  };
  var NAME$8 = "focustrap";
  var DATA_KEY$5 = "bs.focustrap";
  var EVENT_KEY$5 = `.${DATA_KEY$5}`;
  var EVENT_FOCUSIN$2 = `focusin${EVENT_KEY$5}`;
  var EVENT_KEYDOWN_TAB = `keydown.tab${EVENT_KEY$5}`;
  var TAB_KEY = "Tab";
  var TAB_NAV_FORWARD = "forward";
  var TAB_NAV_BACKWARD = "backward";
  var Default$7 = {
    autofocus: true,
    trapElement: null
    // The element to trap focus inside of
  };
  var DefaultType$7 = {
    autofocus: "boolean",
    trapElement: "element"
  };
  var FocusTrap = class extends Config {
    constructor(config) {
      super();
      this._config = this._getConfig(config);
      this._isActive = false;
      this._lastTabNavDirection = null;
    }
    // Getters
    static get Default() {
      return Default$7;
    }
    static get DefaultType() {
      return DefaultType$7;
    }
    static get NAME() {
      return NAME$8;
    }
    // Public
    activate() {
      if (this._isActive) {
        return;
      }
      if (this._config.autofocus) {
        this._config.trapElement.focus();
      }
      EventHandler.off(document, EVENT_KEY$5);
      EventHandler.on(document, EVENT_FOCUSIN$2, (event) => this._handleFocusin(event));
      EventHandler.on(document, EVENT_KEYDOWN_TAB, (event) => this._handleKeydown(event));
      this._isActive = true;
    }
    deactivate() {
      if (!this._isActive) {
        return;
      }
      this._isActive = false;
      EventHandler.off(document, EVENT_KEY$5);
    }
    // Private
    _handleFocusin(event) {
      const {
        trapElement
      } = this._config;
      if (event.target === document || event.target === trapElement || trapElement.contains(event.target)) {
        return;
      }
      const elements = SelectorEngine.focusableChildren(trapElement);
      if (elements.length === 0) {
        trapElement.focus();
      } else if (this._lastTabNavDirection === TAB_NAV_BACKWARD) {
        elements[elements.length - 1].focus();
      } else {
        elements[0].focus();
      }
    }
    _handleKeydown(event) {
      if (event.key !== TAB_KEY) {
        return;
      }
      this._lastTabNavDirection = event.shiftKey ? TAB_NAV_BACKWARD : TAB_NAV_FORWARD;
    }
  };
  var SELECTOR_FIXED_CONTENT = ".fixed-top, .fixed-bottom, .is-fixed, .sticky-top";
  var SELECTOR_STICKY_CONTENT = ".sticky-top";
  var PROPERTY_PADDING = "padding-right";
  var PROPERTY_MARGIN = "margin-right";
  var ScrollBarHelper = class {
    constructor() {
      this._element = document.body;
    }
    // Public
    getWidth() {
      const documentWidth = document.documentElement.clientWidth;
      return Math.abs(window.innerWidth - documentWidth);
    }
    hide() {
      const width = this.getWidth();
      this._disableOverFlow();
      this._setElementAttributes(this._element, PROPERTY_PADDING, (calculatedValue) => calculatedValue + width);
      this._setElementAttributes(SELECTOR_FIXED_CONTENT, PROPERTY_PADDING, (calculatedValue) => calculatedValue + width);
      this._setElementAttributes(SELECTOR_STICKY_CONTENT, PROPERTY_MARGIN, (calculatedValue) => calculatedValue - width);
    }
    reset() {
      this._resetElementAttributes(this._element, "overflow");
      this._resetElementAttributes(this._element, PROPERTY_PADDING);
      this._resetElementAttributes(SELECTOR_FIXED_CONTENT, PROPERTY_PADDING);
      this._resetElementAttributes(SELECTOR_STICKY_CONTENT, PROPERTY_MARGIN);
    }
    isOverflowing() {
      return this.getWidth() > 0;
    }
    // Private
    _disableOverFlow() {
      this._saveInitialAttribute(this._element, "overflow");
      this._element.style.overflow = "hidden";
    }
    _setElementAttributes(selector, styleProperty, callback) {
      const scrollbarWidth = this.getWidth();
      const manipulationCallBack = (element) => {
        if (element !== this._element && window.innerWidth > element.clientWidth + scrollbarWidth) {
          return;
        }
        this._saveInitialAttribute(element, styleProperty);
        const calculatedValue = window.getComputedStyle(element).getPropertyValue(styleProperty);
        element.style.setProperty(styleProperty, `${callback(Number.parseFloat(calculatedValue))}px`);
      };
      this._applyManipulationCallback(selector, manipulationCallBack);
    }
    _saveInitialAttribute(element, styleProperty) {
      const actualValue = element.style.getPropertyValue(styleProperty);
      if (actualValue) {
        Manipulator.setDataAttribute(element, styleProperty, actualValue);
      }
    }
    _resetElementAttributes(selector, styleProperty) {
      const manipulationCallBack = (element) => {
        const value = Manipulator.getDataAttribute(element, styleProperty);
        if (value === null) {
          element.style.removeProperty(styleProperty);
          return;
        }
        Manipulator.removeDataAttribute(element, styleProperty);
        element.style.setProperty(styleProperty, value);
      };
      this._applyManipulationCallback(selector, manipulationCallBack);
    }
    _applyManipulationCallback(selector, callBack) {
      if (isElement2(selector)) {
        callBack(selector);
        return;
      }
      for (const sel of SelectorEngine.find(selector, this._element)) {
        callBack(sel);
      }
    }
  };
  var NAME$7 = "modal";
  var DATA_KEY$4 = "bs.modal";
  var EVENT_KEY$4 = `.${DATA_KEY$4}`;
  var DATA_API_KEY$2 = ".data-api";
  var ESCAPE_KEY$1 = "Escape";
  var EVENT_HIDE$4 = `hide${EVENT_KEY$4}`;
  var EVENT_HIDE_PREVENTED$1 = `hidePrevented${EVENT_KEY$4}`;
  var EVENT_HIDDEN$4 = `hidden${EVENT_KEY$4}`;
  var EVENT_SHOW$4 = `show${EVENT_KEY$4}`;
  var EVENT_SHOWN$4 = `shown${EVENT_KEY$4}`;
  var EVENT_RESIZE$1 = `resize${EVENT_KEY$4}`;
  var EVENT_CLICK_DISMISS = `click.dismiss${EVENT_KEY$4}`;
  var EVENT_MOUSEDOWN_DISMISS = `mousedown.dismiss${EVENT_KEY$4}`;
  var EVENT_KEYDOWN_DISMISS$1 = `keydown.dismiss${EVENT_KEY$4}`;
  var EVENT_CLICK_DATA_API$2 = `click${EVENT_KEY$4}${DATA_API_KEY$2}`;
  var CLASS_NAME_OPEN = "modal-open";
  var CLASS_NAME_FADE$3 = "fade";
  var CLASS_NAME_SHOW$4 = "show";
  var CLASS_NAME_STATIC = "modal-static";
  var OPEN_SELECTOR$1 = ".modal.show";
  var SELECTOR_DIALOG = ".modal-dialog";
  var SELECTOR_MODAL_BODY = ".modal-body";
  var SELECTOR_DATA_TOGGLE$2 = '[data-bs-toggle="modal"]';
  var Default$6 = {
    backdrop: true,
    focus: true,
    keyboard: true
  };
  var DefaultType$6 = {
    backdrop: "(boolean|string)",
    focus: "boolean",
    keyboard: "boolean"
  };
  var Modal = class _Modal extends BaseComponent {
    constructor(element, config) {
      super(element, config);
      this._dialog = SelectorEngine.findOne(SELECTOR_DIALOG, this._element);
      this._backdrop = this._initializeBackDrop();
      this._focustrap = this._initializeFocusTrap();
      this._isShown = false;
      this._isTransitioning = false;
      this._scrollBar = new ScrollBarHelper();
      this._addEventListeners();
    }
    // Getters
    static get Default() {
      return Default$6;
    }
    static get DefaultType() {
      return DefaultType$6;
    }
    static get NAME() {
      return NAME$7;
    }
    // Public
    toggle(relatedTarget) {
      return this._isShown ? this.hide() : this.show(relatedTarget);
    }
    show(relatedTarget) {
      if (this._isShown || this._isTransitioning) {
        return;
      }
      const showEvent = EventHandler.trigger(this._element, EVENT_SHOW$4, {
        relatedTarget
      });
      if (showEvent.defaultPrevented) {
        return;
      }
      this._isShown = true;
      this._isTransitioning = true;
      this._scrollBar.hide();
      document.body.classList.add(CLASS_NAME_OPEN);
      this._adjustDialog();
      this._backdrop.show(() => this._showElement(relatedTarget));
    }
    hide() {
      if (!this._isShown || this._isTransitioning) {
        return;
      }
      const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE$4);
      if (hideEvent.defaultPrevented) {
        return;
      }
      this._isShown = false;
      this._isTransitioning = true;
      this._focustrap.deactivate();
      this._element.classList.remove(CLASS_NAME_SHOW$4);
      this._queueCallback(() => this._hideModal(), this._element, this._isAnimated());
    }
    dispose() {
      EventHandler.off(window, EVENT_KEY$4);
      EventHandler.off(this._dialog, EVENT_KEY$4);
      this._backdrop.dispose();
      this._focustrap.deactivate();
      super.dispose();
    }
    handleUpdate() {
      this._adjustDialog();
    }
    // Private
    _initializeBackDrop() {
      return new Backdrop({
        isVisible: Boolean(this._config.backdrop),
        // 'static' option will be translated to true, and booleans will keep their value,
        isAnimated: this._isAnimated()
      });
    }
    _initializeFocusTrap() {
      return new FocusTrap({
        trapElement: this._element
      });
    }
    _showElement(relatedTarget) {
      if (!document.body.contains(this._element)) {
        document.body.append(this._element);
      }
      this._element.style.display = "block";
      this._element.removeAttribute("aria-hidden");
      this._element.setAttribute("aria-modal", true);
      this._element.setAttribute("role", "dialog");
      this._element.scrollTop = 0;
      const modalBody = SelectorEngine.findOne(SELECTOR_MODAL_BODY, this._dialog);
      if (modalBody) {
        modalBody.scrollTop = 0;
      }
      reflow(this._element);
      this._element.classList.add(CLASS_NAME_SHOW$4);
      const transitionComplete = () => {
        if (this._config.focus) {
          this._focustrap.activate();
        }
        this._isTransitioning = false;
        EventHandler.trigger(this._element, EVENT_SHOWN$4, {
          relatedTarget
        });
      };
      this._queueCallback(transitionComplete, this._dialog, this._isAnimated());
    }
    _addEventListeners() {
      EventHandler.on(this._element, EVENT_KEYDOWN_DISMISS$1, (event) => {
        if (event.key !== ESCAPE_KEY$1) {
          return;
        }
        if (this._config.keyboard) {
          this.hide();
          return;
        }
        this._triggerBackdropTransition();
      });
      EventHandler.on(window, EVENT_RESIZE$1, () => {
        if (this._isShown && !this._isTransitioning) {
          this._adjustDialog();
        }
      });
      EventHandler.on(this._element, EVENT_MOUSEDOWN_DISMISS, (event) => {
        EventHandler.one(this._element, EVENT_CLICK_DISMISS, (event2) => {
          if (this._element !== event.target || this._element !== event2.target) {
            return;
          }
          if (this._config.backdrop === "static") {
            this._triggerBackdropTransition();
            return;
          }
          if (this._config.backdrop) {
            this.hide();
          }
        });
      });
    }
    _hideModal() {
      this._element.style.display = "none";
      this._element.setAttribute("aria-hidden", true);
      this._element.removeAttribute("aria-modal");
      this._element.removeAttribute("role");
      this._isTransitioning = false;
      this._backdrop.hide(() => {
        document.body.classList.remove(CLASS_NAME_OPEN);
        this._resetAdjustments();
        this._scrollBar.reset();
        EventHandler.trigger(this._element, EVENT_HIDDEN$4);
      });
    }
    _isAnimated() {
      return this._element.classList.contains(CLASS_NAME_FADE$3);
    }
    _triggerBackdropTransition() {
      const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE_PREVENTED$1);
      if (hideEvent.defaultPrevented) {
        return;
      }
      const isModalOverflowing = this._element.scrollHeight > document.documentElement.clientHeight;
      const initialOverflowY = this._element.style.overflowY;
      if (initialOverflowY === "hidden" || this._element.classList.contains(CLASS_NAME_STATIC)) {
        return;
      }
      if (!isModalOverflowing) {
        this._element.style.overflowY = "hidden";
      }
      this._element.classList.add(CLASS_NAME_STATIC);
      this._queueCallback(() => {
        this._element.classList.remove(CLASS_NAME_STATIC);
        this._queueCallback(() => {
          this._element.style.overflowY = initialOverflowY;
        }, this._dialog);
      }, this._dialog);
      this._element.focus();
    }
    /**
     * The following methods are used to handle overflowing modals
     */
    _adjustDialog() {
      const isModalOverflowing = this._element.scrollHeight > document.documentElement.clientHeight;
      const scrollbarWidth = this._scrollBar.getWidth();
      const isBodyOverflowing = scrollbarWidth > 0;
      if (isBodyOverflowing && !isModalOverflowing) {
        const property = isRTL() ? "paddingLeft" : "paddingRight";
        this._element.style[property] = `${scrollbarWidth}px`;
      }
      if (!isBodyOverflowing && isModalOverflowing) {
        const property = isRTL() ? "paddingRight" : "paddingLeft";
        this._element.style[property] = `${scrollbarWidth}px`;
      }
    }
    _resetAdjustments() {
      this._element.style.paddingLeft = "";
      this._element.style.paddingRight = "";
    }
    // Static
    static jQueryInterface(config, relatedTarget) {
      return this.each(function() {
        const data = _Modal.getOrCreateInstance(this, config);
        if (typeof config !== "string") {
          return;
        }
        if (typeof data[config] === "undefined") {
          throw new TypeError(`No method named "${config}"`);
        }
        data[config](relatedTarget);
      });
    }
  };
  EventHandler.on(document, EVENT_CLICK_DATA_API$2, SELECTOR_DATA_TOGGLE$2, function(event) {
    const target = SelectorEngine.getElementFromSelector(this);
    if (["A", "AREA"].includes(this.tagName)) {
      event.preventDefault();
    }
    EventHandler.one(target, EVENT_SHOW$4, (showEvent) => {
      if (showEvent.defaultPrevented) {
        return;
      }
      EventHandler.one(target, EVENT_HIDDEN$4, () => {
        if (isVisible(this)) {
          this.focus();
        }
      });
    });
    const alreadyOpen = SelectorEngine.findOne(OPEN_SELECTOR$1);
    if (alreadyOpen) {
      Modal.getInstance(alreadyOpen).hide();
    }
    const data = Modal.getOrCreateInstance(target);
    data.toggle(this);
  });
  enableDismissTrigger(Modal);
  defineJQueryPlugin(Modal);
  var NAME$6 = "offcanvas";
  var DATA_KEY$3 = "bs.offcanvas";
  var EVENT_KEY$3 = `.${DATA_KEY$3}`;
  var DATA_API_KEY$1 = ".data-api";
  var EVENT_LOAD_DATA_API$2 = `load${EVENT_KEY$3}${DATA_API_KEY$1}`;
  var ESCAPE_KEY = "Escape";
  var CLASS_NAME_SHOW$3 = "show";
  var CLASS_NAME_SHOWING$1 = "showing";
  var CLASS_NAME_HIDING = "hiding";
  var CLASS_NAME_BACKDROP = "offcanvas-backdrop";
  var OPEN_SELECTOR = ".offcanvas.show";
  var EVENT_SHOW$3 = `show${EVENT_KEY$3}`;
  var EVENT_SHOWN$3 = `shown${EVENT_KEY$3}`;
  var EVENT_HIDE$3 = `hide${EVENT_KEY$3}`;
  var EVENT_HIDE_PREVENTED = `hidePrevented${EVENT_KEY$3}`;
  var EVENT_HIDDEN$3 = `hidden${EVENT_KEY$3}`;
  var EVENT_RESIZE = `resize${EVENT_KEY$3}`;
  var EVENT_CLICK_DATA_API$1 = `click${EVENT_KEY$3}${DATA_API_KEY$1}`;
  var EVENT_KEYDOWN_DISMISS = `keydown.dismiss${EVENT_KEY$3}`;
  var SELECTOR_DATA_TOGGLE$1 = '[data-bs-toggle="offcanvas"]';
  var Default$5 = {
    backdrop: true,
    keyboard: true,
    scroll: false
  };
  var DefaultType$5 = {
    backdrop: "(boolean|string)",
    keyboard: "boolean",
    scroll: "boolean"
  };
  var Offcanvas = class _Offcanvas extends BaseComponent {
    constructor(element, config) {
      super(element, config);
      this._isShown = false;
      this._backdrop = this._initializeBackDrop();
      this._focustrap = this._initializeFocusTrap();
      this._addEventListeners();
    }
    // Getters
    static get Default() {
      return Default$5;
    }
    static get DefaultType() {
      return DefaultType$5;
    }
    static get NAME() {
      return NAME$6;
    }
    // Public
    toggle(relatedTarget) {
      return this._isShown ? this.hide() : this.show(relatedTarget);
    }
    show(relatedTarget) {
      if (this._isShown) {
        return;
      }
      const showEvent = EventHandler.trigger(this._element, EVENT_SHOW$3, {
        relatedTarget
      });
      if (showEvent.defaultPrevented) {
        return;
      }
      this._isShown = true;
      this._backdrop.show();
      if (!this._config.scroll) {
        new ScrollBarHelper().hide();
      }
      this._element.setAttribute("aria-modal", true);
      this._element.setAttribute("role", "dialog");
      this._element.classList.add(CLASS_NAME_SHOWING$1);
      const completeCallBack = () => {
        if (!this._config.scroll || this._config.backdrop) {
          this._focustrap.activate();
        }
        this._element.classList.add(CLASS_NAME_SHOW$3);
        this._element.classList.remove(CLASS_NAME_SHOWING$1);
        EventHandler.trigger(this._element, EVENT_SHOWN$3, {
          relatedTarget
        });
      };
      this._queueCallback(completeCallBack, this._element, true);
    }
    hide() {
      if (!this._isShown) {
        return;
      }
      const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE$3);
      if (hideEvent.defaultPrevented) {
        return;
      }
      this._focustrap.deactivate();
      this._element.blur();
      this._isShown = false;
      this._element.classList.add(CLASS_NAME_HIDING);
      this._backdrop.hide();
      const completeCallback = () => {
        this._element.classList.remove(CLASS_NAME_SHOW$3, CLASS_NAME_HIDING);
        this._element.removeAttribute("aria-modal");
        this._element.removeAttribute("role");
        if (!this._config.scroll) {
          new ScrollBarHelper().reset();
        }
        EventHandler.trigger(this._element, EVENT_HIDDEN$3);
      };
      this._queueCallback(completeCallback, this._element, true);
    }
    dispose() {
      this._backdrop.dispose();
      this._focustrap.deactivate();
      super.dispose();
    }
    // Private
    _initializeBackDrop() {
      const clickCallback = () => {
        if (this._config.backdrop === "static") {
          EventHandler.trigger(this._element, EVENT_HIDE_PREVENTED);
          return;
        }
        this.hide();
      };
      const isVisible2 = Boolean(this._config.backdrop);
      return new Backdrop({
        className: CLASS_NAME_BACKDROP,
        isVisible: isVisible2,
        isAnimated: true,
        rootElement: this._element.parentNode,
        clickCallback: isVisible2 ? clickCallback : null
      });
    }
    _initializeFocusTrap() {
      return new FocusTrap({
        trapElement: this._element
      });
    }
    _addEventListeners() {
      EventHandler.on(this._element, EVENT_KEYDOWN_DISMISS, (event) => {
        if (event.key !== ESCAPE_KEY) {
          return;
        }
        if (this._config.keyboard) {
          this.hide();
          return;
        }
        EventHandler.trigger(this._element, EVENT_HIDE_PREVENTED);
      });
    }
    // Static
    static jQueryInterface(config) {
      return this.each(function() {
        const data = _Offcanvas.getOrCreateInstance(this, config);
        if (typeof config !== "string") {
          return;
        }
        if (data[config] === void 0 || config.startsWith("_") || config === "constructor") {
          throw new TypeError(`No method named "${config}"`);
        }
        data[config](this);
      });
    }
  };
  EventHandler.on(document, EVENT_CLICK_DATA_API$1, SELECTOR_DATA_TOGGLE$1, function(event) {
    const target = SelectorEngine.getElementFromSelector(this);
    if (["A", "AREA"].includes(this.tagName)) {
      event.preventDefault();
    }
    if (isDisabled(this)) {
      return;
    }
    EventHandler.one(target, EVENT_HIDDEN$3, () => {
      if (isVisible(this)) {
        this.focus();
      }
    });
    const alreadyOpen = SelectorEngine.findOne(OPEN_SELECTOR);
    if (alreadyOpen && alreadyOpen !== target) {
      Offcanvas.getInstance(alreadyOpen).hide();
    }
    const data = Offcanvas.getOrCreateInstance(target);
    data.toggle(this);
  });
  EventHandler.on(window, EVENT_LOAD_DATA_API$2, () => {
    for (const selector of SelectorEngine.find(OPEN_SELECTOR)) {
      Offcanvas.getOrCreateInstance(selector).show();
    }
  });
  EventHandler.on(window, EVENT_RESIZE, () => {
    for (const element of SelectorEngine.find("[aria-modal][class*=show][class*=offcanvas-]")) {
      if (getComputedStyle(element).position !== "fixed") {
        Offcanvas.getOrCreateInstance(element).hide();
      }
    }
  });
  enableDismissTrigger(Offcanvas);
  defineJQueryPlugin(Offcanvas);
  var ARIA_ATTRIBUTE_PATTERN = /^aria-[\w-]*$/i;
  var DefaultAllowlist = {
    // Global attributes allowed on any supplied element below.
    "*": ["class", "dir", "id", "lang", "role", ARIA_ATTRIBUTE_PATTERN],
    a: ["target", "href", "title", "rel"],
    area: [],
    b: [],
    br: [],
    col: [],
    code: [],
    dd: [],
    div: [],
    dl: [],
    dt: [],
    em: [],
    hr: [],
    h1: [],
    h2: [],
    h3: [],
    h4: [],
    h5: [],
    h6: [],
    i: [],
    img: ["src", "srcset", "alt", "title", "width", "height"],
    li: [],
    ol: [],
    p: [],
    pre: [],
    s: [],
    small: [],
    span: [],
    sub: [],
    sup: [],
    strong: [],
    u: [],
    ul: []
  };
  var uriAttributes = /* @__PURE__ */ new Set(["background", "cite", "href", "itemtype", "longdesc", "poster", "src", "xlink:href"]);
  var SAFE_URL_PATTERN = /^(?!javascript:)(?:[a-z0-9+.-]+:|[^&:/?#]*(?:[/?#]|$))/i;
  var allowedAttribute = (attribute, allowedAttributeList) => {
    const attributeName = attribute.nodeName.toLowerCase();
    if (allowedAttributeList.includes(attributeName)) {
      if (uriAttributes.has(attributeName)) {
        return Boolean(SAFE_URL_PATTERN.test(attribute.nodeValue));
      }
      return true;
    }
    return allowedAttributeList.filter((attributeRegex) => attributeRegex instanceof RegExp).some((regex) => regex.test(attributeName));
  };
  function sanitizeHtml(unsafeHtml, allowList, sanitizeFunction) {
    if (!unsafeHtml.length) {
      return unsafeHtml;
    }
    if (sanitizeFunction && typeof sanitizeFunction === "function") {
      return sanitizeFunction(unsafeHtml);
    }
    const domParser = new window.DOMParser();
    const createdDocument = domParser.parseFromString(unsafeHtml, "text/html");
    const elements = [].concat(...createdDocument.body.querySelectorAll("*"));
    for (const element of elements) {
      const elementName = element.nodeName.toLowerCase();
      if (!Object.keys(allowList).includes(elementName)) {
        element.remove();
        continue;
      }
      const attributeList = [].concat(...element.attributes);
      const allowedAttributes = [].concat(allowList["*"] || [], allowList[elementName] || []);
      for (const attribute of attributeList) {
        if (!allowedAttribute(attribute, allowedAttributes)) {
          element.removeAttribute(attribute.nodeName);
        }
      }
    }
    return createdDocument.body.innerHTML;
  }
  var NAME$5 = "TemplateFactory";
  var Default$4 = {
    allowList: DefaultAllowlist,
    content: {},
    // { selector : text ,  selector2 : text2 , }
    extraClass: "",
    html: false,
    sanitize: true,
    sanitizeFn: null,
    template: "<div></div>"
  };
  var DefaultType$4 = {
    allowList: "object",
    content: "object",
    extraClass: "(string|function)",
    html: "boolean",
    sanitize: "boolean",
    sanitizeFn: "(null|function)",
    template: "string"
  };
  var DefaultContentType = {
    entry: "(string|element|function|null)",
    selector: "(string|element)"
  };
  var TemplateFactory = class extends Config {
    constructor(config) {
      super();
      this._config = this._getConfig(config);
    }
    // Getters
    static get Default() {
      return Default$4;
    }
    static get DefaultType() {
      return DefaultType$4;
    }
    static get NAME() {
      return NAME$5;
    }
    // Public
    getContent() {
      return Object.values(this._config.content).map((config) => this._resolvePossibleFunction(config)).filter(Boolean);
    }
    hasContent() {
      return this.getContent().length > 0;
    }
    changeContent(content) {
      this._checkContent(content);
      this._config.content = {
        ...this._config.content,
        ...content
      };
      return this;
    }
    toHtml() {
      const templateWrapper = document.createElement("div");
      templateWrapper.innerHTML = this._maybeSanitize(this._config.template);
      for (const [selector, text2] of Object.entries(this._config.content)) {
        this._setContent(templateWrapper, text2, selector);
      }
      const template = templateWrapper.children[0];
      const extraClass = this._resolvePossibleFunction(this._config.extraClass);
      if (extraClass) {
        template.classList.add(...extraClass.split(" "));
      }
      return template;
    }
    // Private
    _typeCheckConfig(config) {
      super._typeCheckConfig(config);
      this._checkContent(config.content);
    }
    _checkContent(arg) {
      for (const [selector, content] of Object.entries(arg)) {
        super._typeCheckConfig({
          selector,
          entry: content
        }, DefaultContentType);
      }
    }
    _setContent(template, content, selector) {
      const templateElement = SelectorEngine.findOne(selector, template);
      if (!templateElement) {
        return;
      }
      content = this._resolvePossibleFunction(content);
      if (!content) {
        templateElement.remove();
        return;
      }
      if (isElement2(content)) {
        this._putElementInTemplate(getElement(content), templateElement);
        return;
      }
      if (this._config.html) {
        templateElement.innerHTML = this._maybeSanitize(content);
        return;
      }
      templateElement.textContent = content;
    }
    _maybeSanitize(arg) {
      return this._config.sanitize ? sanitizeHtml(arg, this._config.allowList, this._config.sanitizeFn) : arg;
    }
    _resolvePossibleFunction(arg) {
      return execute(arg, [void 0, this]);
    }
    _putElementInTemplate(element, templateElement) {
      if (this._config.html) {
        templateElement.innerHTML = "";
        templateElement.append(element);
        return;
      }
      templateElement.textContent = element.textContent;
    }
  };
  var NAME$4 = "tooltip";
  var DISALLOWED_ATTRIBUTES = /* @__PURE__ */ new Set(["sanitize", "allowList", "sanitizeFn"]);
  var CLASS_NAME_FADE$2 = "fade";
  var CLASS_NAME_MODAL = "modal";
  var CLASS_NAME_SHOW$2 = "show";
  var SELECTOR_TOOLTIP_INNER = ".tooltip-inner";
  var SELECTOR_MODAL = `.${CLASS_NAME_MODAL}`;
  var EVENT_MODAL_HIDE = "hide.bs.modal";
  var TRIGGER_HOVER = "hover";
  var TRIGGER_FOCUS = "focus";
  var TRIGGER_CLICK = "click";
  var TRIGGER_MANUAL = "manual";
  var EVENT_HIDE$2 = "hide";
  var EVENT_HIDDEN$2 = "hidden";
  var EVENT_SHOW$2 = "show";
  var EVENT_SHOWN$2 = "shown";
  var EVENT_INSERTED = "inserted";
  var EVENT_CLICK$1 = "click";
  var EVENT_FOCUSIN$1 = "focusin";
  var EVENT_FOCUSOUT$1 = "focusout";
  var EVENT_MOUSEENTER = "mouseenter";
  var EVENT_MOUSELEAVE = "mouseleave";
  var AttachmentMap = {
    AUTO: "auto",
    TOP: "top",
    RIGHT: isRTL() ? "left" : "right",
    BOTTOM: "bottom",
    LEFT: isRTL() ? "right" : "left"
  };
  var Default$3 = {
    allowList: DefaultAllowlist,
    animation: true,
    boundary: "clippingParents",
    container: false,
    customClass: "",
    delay: 0,
    fallbackPlacements: ["top", "right", "bottom", "left"],
    html: false,
    offset: [0, 6],
    placement: "top",
    popperConfig: null,
    sanitize: true,
    sanitizeFn: null,
    selector: false,
    template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
    title: "",
    trigger: "hover focus"
  };
  var DefaultType$3 = {
    allowList: "object",
    animation: "boolean",
    boundary: "(string|element)",
    container: "(string|element|boolean)",
    customClass: "(string|function)",
    delay: "(number|object)",
    fallbackPlacements: "array",
    html: "boolean",
    offset: "(array|string|function)",
    placement: "(string|function)",
    popperConfig: "(null|object|function)",
    sanitize: "boolean",
    sanitizeFn: "(null|function)",
    selector: "(string|boolean)",
    template: "string",
    title: "(string|element|function)",
    trigger: "string"
  };
  var Tooltip = class _Tooltip extends BaseComponent {
    constructor(element, config) {
      if (typeof lib_exports === "undefined") {
        throw new TypeError("Bootstrap's tooltips require Popper (https://popper.js.org/docs/v2/)");
      }
      super(element, config);
      this._isEnabled = true;
      this._timeout = 0;
      this._isHovered = null;
      this._activeTrigger = {};
      this._popper = null;
      this._templateFactory = null;
      this._newContent = null;
      this.tip = null;
      this._setListeners();
      if (!this._config.selector) {
        this._fixTitle();
      }
    }
    // Getters
    static get Default() {
      return Default$3;
    }
    static get DefaultType() {
      return DefaultType$3;
    }
    static get NAME() {
      return NAME$4;
    }
    // Public
    enable() {
      this._isEnabled = true;
    }
    disable() {
      this._isEnabled = false;
    }
    toggleEnabled() {
      this._isEnabled = !this._isEnabled;
    }
    toggle() {
      if (!this._isEnabled) {
        return;
      }
      if (this._isShown()) {
        this._leave();
        return;
      }
      this._enter();
    }
    dispose() {
      clearTimeout(this._timeout);
      EventHandler.off(this._element.closest(SELECTOR_MODAL), EVENT_MODAL_HIDE, this._hideModalHandler);
      if (this._element.getAttribute("data-bs-original-title")) {
        this._element.setAttribute("title", this._element.getAttribute("data-bs-original-title"));
      }
      this._disposePopper();
      super.dispose();
    }
    show() {
      if (this._element.style.display === "none") {
        throw new Error("Please use show on visible elements");
      }
      if (!(this._isWithContent() && this._isEnabled)) {
        return;
      }
      const showEvent = EventHandler.trigger(this._element, this.constructor.eventName(EVENT_SHOW$2));
      const shadowRoot = findShadowRoot(this._element);
      const isInTheDom = (shadowRoot || this._element.ownerDocument.documentElement).contains(this._element);
      if (showEvent.defaultPrevented || !isInTheDom) {
        return;
      }
      this._disposePopper();
      const tip = this._getTipElement();
      this._element.setAttribute("aria-describedby", tip.getAttribute("id"));
      const {
        container
      } = this._config;
      if (!this._element.ownerDocument.documentElement.contains(this.tip)) {
        container.append(tip);
        EventHandler.trigger(this._element, this.constructor.eventName(EVENT_INSERTED));
      }
      this._popper = this._createPopper(tip);
      tip.classList.add(CLASS_NAME_SHOW$2);
      if ("ontouchstart" in document.documentElement) {
        for (const element of [].concat(...document.body.children)) {
          EventHandler.on(element, "mouseover", noop);
        }
      }
      const complete = () => {
        EventHandler.trigger(this._element, this.constructor.eventName(EVENT_SHOWN$2));
        if (this._isHovered === false) {
          this._leave();
        }
        this._isHovered = false;
      };
      this._queueCallback(complete, this.tip, this._isAnimated());
    }
    hide() {
      if (!this._isShown()) {
        return;
      }
      const hideEvent = EventHandler.trigger(this._element, this.constructor.eventName(EVENT_HIDE$2));
      if (hideEvent.defaultPrevented) {
        return;
      }
      const tip = this._getTipElement();
      tip.classList.remove(CLASS_NAME_SHOW$2);
      if ("ontouchstart" in document.documentElement) {
        for (const element of [].concat(...document.body.children)) {
          EventHandler.off(element, "mouseover", noop);
        }
      }
      this._activeTrigger[TRIGGER_CLICK] = false;
      this._activeTrigger[TRIGGER_FOCUS] = false;
      this._activeTrigger[TRIGGER_HOVER] = false;
      this._isHovered = null;
      const complete = () => {
        if (this._isWithActiveTrigger()) {
          return;
        }
        if (!this._isHovered) {
          this._disposePopper();
        }
        this._element.removeAttribute("aria-describedby");
        EventHandler.trigger(this._element, this.constructor.eventName(EVENT_HIDDEN$2));
      };
      this._queueCallback(complete, this.tip, this._isAnimated());
    }
    update() {
      if (this._popper) {
        this._popper.update();
      }
    }
    // Protected
    _isWithContent() {
      return Boolean(this._getTitle());
    }
    _getTipElement() {
      if (!this.tip) {
        this.tip = this._createTipElement(this._newContent || this._getContentForTemplate());
      }
      return this.tip;
    }
    _createTipElement(content) {
      const tip = this._getTemplateFactory(content).toHtml();
      if (!tip) {
        return null;
      }
      tip.classList.remove(CLASS_NAME_FADE$2, CLASS_NAME_SHOW$2);
      tip.classList.add(`bs-${this.constructor.NAME}-auto`);
      const tipId = getUID(this.constructor.NAME).toString();
      tip.setAttribute("id", tipId);
      if (this._isAnimated()) {
        tip.classList.add(CLASS_NAME_FADE$2);
      }
      return tip;
    }
    setContent(content) {
      this._newContent = content;
      if (this._isShown()) {
        this._disposePopper();
        this.show();
      }
    }
    _getTemplateFactory(content) {
      if (this._templateFactory) {
        this._templateFactory.changeContent(content);
      } else {
        this._templateFactory = new TemplateFactory({
          ...this._config,
          // the `content` var has to be after `this._config`
          // to override config.content in case of popover
          content,
          extraClass: this._resolvePossibleFunction(this._config.customClass)
        });
      }
      return this._templateFactory;
    }
    _getContentForTemplate() {
      return {
        [SELECTOR_TOOLTIP_INNER]: this._getTitle()
      };
    }
    _getTitle() {
      return this._resolvePossibleFunction(this._config.title) || this._element.getAttribute("data-bs-original-title");
    }
    // Private
    _initializeOnDelegatedTarget(event) {
      return this.constructor.getOrCreateInstance(event.delegateTarget, this._getDelegateConfig());
    }
    _isAnimated() {
      return this._config.animation || this.tip && this.tip.classList.contains(CLASS_NAME_FADE$2);
    }
    _isShown() {
      return this.tip && this.tip.classList.contains(CLASS_NAME_SHOW$2);
    }
    _createPopper(tip) {
      const placement = execute(this._config.placement, [this, tip, this._element]);
      const attachment = AttachmentMap[placement.toUpperCase()];
      return createPopper3(this._element, tip, this._getPopperConfig(attachment));
    }
    _getOffset() {
      const {
        offset: offset2
      } = this._config;
      if (typeof offset2 === "string") {
        return offset2.split(",").map((value) => Number.parseInt(value, 10));
      }
      if (typeof offset2 === "function") {
        return (popperData) => offset2(popperData, this._element);
      }
      return offset2;
    }
    _resolvePossibleFunction(arg) {
      return execute(arg, [this._element, this._element]);
    }
    _getPopperConfig(attachment) {
      const defaultBsPopperConfig = {
        placement: attachment,
        modifiers: [{
          name: "flip",
          options: {
            fallbackPlacements: this._config.fallbackPlacements
          }
        }, {
          name: "offset",
          options: {
            offset: this._getOffset()
          }
        }, {
          name: "preventOverflow",
          options: {
            boundary: this._config.boundary
          }
        }, {
          name: "arrow",
          options: {
            element: `.${this.constructor.NAME}-arrow`
          }
        }, {
          name: "preSetPlacement",
          enabled: true,
          phase: "beforeMain",
          fn: (data) => {
            this._getTipElement().setAttribute("data-popper-placement", data.state.placement);
          }
        }]
      };
      return {
        ...defaultBsPopperConfig,
        ...execute(this._config.popperConfig, [void 0, defaultBsPopperConfig])
      };
    }
    _setListeners() {
      const triggers = this._config.trigger.split(" ");
      for (const trigger of triggers) {
        if (trigger === "click") {
          EventHandler.on(this._element, this.constructor.eventName(EVENT_CLICK$1), this._config.selector, (event) => {
            const context = this._initializeOnDelegatedTarget(event);
            context._activeTrigger[TRIGGER_CLICK] = !(context._isShown() && context._activeTrigger[TRIGGER_CLICK]);
            context.toggle();
          });
        } else if (trigger !== TRIGGER_MANUAL) {
          const eventIn = trigger === TRIGGER_HOVER ? this.constructor.eventName(EVENT_MOUSEENTER) : this.constructor.eventName(EVENT_FOCUSIN$1);
          const eventOut = trigger === TRIGGER_HOVER ? this.constructor.eventName(EVENT_MOUSELEAVE) : this.constructor.eventName(EVENT_FOCUSOUT$1);
          EventHandler.on(this._element, eventIn, this._config.selector, (event) => {
            const context = this._initializeOnDelegatedTarget(event);
            context._activeTrigger[event.type === "focusin" ? TRIGGER_FOCUS : TRIGGER_HOVER] = true;
            context._enter();
          });
          EventHandler.on(this._element, eventOut, this._config.selector, (event) => {
            const context = this._initializeOnDelegatedTarget(event);
            context._activeTrigger[event.type === "focusout" ? TRIGGER_FOCUS : TRIGGER_HOVER] = context._element.contains(event.relatedTarget);
            context._leave();
          });
        }
      }
      this._hideModalHandler = () => {
        if (this._element) {
          this.hide();
        }
      };
      EventHandler.on(this._element.closest(SELECTOR_MODAL), EVENT_MODAL_HIDE, this._hideModalHandler);
    }
    _fixTitle() {
      const title = this._element.getAttribute("title");
      if (!title) {
        return;
      }
      if (!this._element.getAttribute("aria-label") && !this._element.textContent.trim()) {
        this._element.setAttribute("aria-label", title);
      }
      this._element.setAttribute("data-bs-original-title", title);
      this._element.removeAttribute("title");
    }
    _enter() {
      if (this._isShown() || this._isHovered) {
        this._isHovered = true;
        return;
      }
      this._isHovered = true;
      this._setTimeout(() => {
        if (this._isHovered) {
          this.show();
        }
      }, this._config.delay.show);
    }
    _leave() {
      if (this._isWithActiveTrigger()) {
        return;
      }
      this._isHovered = false;
      this._setTimeout(() => {
        if (!this._isHovered) {
          this.hide();
        }
      }, this._config.delay.hide);
    }
    _setTimeout(handler, timeout2) {
      clearTimeout(this._timeout);
      this._timeout = setTimeout(handler, timeout2);
    }
    _isWithActiveTrigger() {
      return Object.values(this._activeTrigger).includes(true);
    }
    _getConfig(config) {
      const dataAttributes = Manipulator.getDataAttributes(this._element);
      for (const dataAttribute of Object.keys(dataAttributes)) {
        if (DISALLOWED_ATTRIBUTES.has(dataAttribute)) {
          delete dataAttributes[dataAttribute];
        }
      }
      config = {
        ...dataAttributes,
        ...typeof config === "object" && config ? config : {}
      };
      config = this._mergeConfigObj(config);
      config = this._configAfterMerge(config);
      this._typeCheckConfig(config);
      return config;
    }
    _configAfterMerge(config) {
      config.container = config.container === false ? document.body : getElement(config.container);
      if (typeof config.delay === "number") {
        config.delay = {
          show: config.delay,
          hide: config.delay
        };
      }
      if (typeof config.title === "number") {
        config.title = config.title.toString();
      }
      if (typeof config.content === "number") {
        config.content = config.content.toString();
      }
      return config;
    }
    _getDelegateConfig() {
      const config = {};
      for (const [key, value] of Object.entries(this._config)) {
        if (this.constructor.Default[key] !== value) {
          config[key] = value;
        }
      }
      config.selector = false;
      config.trigger = "manual";
      return config;
    }
    _disposePopper() {
      if (this._popper) {
        this._popper.destroy();
        this._popper = null;
      }
      if (this.tip) {
        this.tip.remove();
        this.tip = null;
      }
    }
    // Static
    static jQueryInterface(config) {
      return this.each(function() {
        const data = _Tooltip.getOrCreateInstance(this, config);
        if (typeof config !== "string") {
          return;
        }
        if (typeof data[config] === "undefined") {
          throw new TypeError(`No method named "${config}"`);
        }
        data[config]();
      });
    }
  };
  defineJQueryPlugin(Tooltip);
  var NAME$3 = "popover";
  var SELECTOR_TITLE = ".popover-header";
  var SELECTOR_CONTENT = ".popover-body";
  var Default$2 = {
    ...Tooltip.Default,
    content: "",
    offset: [0, 8],
    placement: "right",
    template: '<div class="popover" role="tooltip"><div class="popover-arrow"></div><h3 class="popover-header"></h3><div class="popover-body"></div></div>',
    trigger: "click"
  };
  var DefaultType$2 = {
    ...Tooltip.DefaultType,
    content: "(null|string|element|function)"
  };
  var Popover = class _Popover extends Tooltip {
    // Getters
    static get Default() {
      return Default$2;
    }
    static get DefaultType() {
      return DefaultType$2;
    }
    static get NAME() {
      return NAME$3;
    }
    // Overrides
    _isWithContent() {
      return this._getTitle() || this._getContent();
    }
    // Private
    _getContentForTemplate() {
      return {
        [SELECTOR_TITLE]: this._getTitle(),
        [SELECTOR_CONTENT]: this._getContent()
      };
    }
    _getContent() {
      return this._resolvePossibleFunction(this._config.content);
    }
    // Static
    static jQueryInterface(config) {
      return this.each(function() {
        const data = _Popover.getOrCreateInstance(this, config);
        if (typeof config !== "string") {
          return;
        }
        if (typeof data[config] === "undefined") {
          throw new TypeError(`No method named "${config}"`);
        }
        data[config]();
      });
    }
  };
  defineJQueryPlugin(Popover);
  var NAME$2 = "scrollspy";
  var DATA_KEY$2 = "bs.scrollspy";
  var EVENT_KEY$2 = `.${DATA_KEY$2}`;
  var DATA_API_KEY = ".data-api";
  var EVENT_ACTIVATE = `activate${EVENT_KEY$2}`;
  var EVENT_CLICK = `click${EVENT_KEY$2}`;
  var EVENT_LOAD_DATA_API$1 = `load${EVENT_KEY$2}${DATA_API_KEY}`;
  var CLASS_NAME_DROPDOWN_ITEM = "dropdown-item";
  var CLASS_NAME_ACTIVE$1 = "active";
  var SELECTOR_DATA_SPY = '[data-bs-spy="scroll"]';
  var SELECTOR_TARGET_LINKS = "[href]";
  var SELECTOR_NAV_LIST_GROUP = ".nav, .list-group";
  var SELECTOR_NAV_LINKS = ".nav-link";
  var SELECTOR_NAV_ITEMS = ".nav-item";
  var SELECTOR_LIST_ITEMS = ".list-group-item";
  var SELECTOR_LINK_ITEMS = `${SELECTOR_NAV_LINKS}, ${SELECTOR_NAV_ITEMS} > ${SELECTOR_NAV_LINKS}, ${SELECTOR_LIST_ITEMS}`;
  var SELECTOR_DROPDOWN = ".dropdown";
  var SELECTOR_DROPDOWN_TOGGLE$1 = ".dropdown-toggle";
  var Default$1 = {
    offset: null,
    // TODO: v6 @deprecated, keep it for backwards compatibility reasons
    rootMargin: "0px 0px -25%",
    smoothScroll: false,
    target: null,
    threshold: [0.1, 0.5, 1]
  };
  var DefaultType$1 = {
    offset: "(number|null)",
    // TODO v6 @deprecated, keep it for backwards compatibility reasons
    rootMargin: "string",
    smoothScroll: "boolean",
    target: "element",
    threshold: "array"
  };
  var ScrollSpy = class _ScrollSpy extends BaseComponent {
    constructor(element, config) {
      super(element, config);
      this._targetLinks = /* @__PURE__ */ new Map();
      this._observableSections = /* @__PURE__ */ new Map();
      this._rootElement = getComputedStyle(this._element).overflowY === "visible" ? null : this._element;
      this._activeTarget = null;
      this._observer = null;
      this._previousScrollData = {
        visibleEntryTop: 0,
        parentScrollTop: 0
      };
      this.refresh();
    }
    // Getters
    static get Default() {
      return Default$1;
    }
    static get DefaultType() {
      return DefaultType$1;
    }
    static get NAME() {
      return NAME$2;
    }
    // Public
    refresh() {
      this._initializeTargetsAndObservables();
      this._maybeEnableSmoothScroll();
      if (this._observer) {
        this._observer.disconnect();
      } else {
        this._observer = this._getNewObserver();
      }
      for (const section of this._observableSections.values()) {
        this._observer.observe(section);
      }
    }
    dispose() {
      this._observer.disconnect();
      super.dispose();
    }
    // Private
    _configAfterMerge(config) {
      config.target = getElement(config.target) || document.body;
      config.rootMargin = config.offset ? `${config.offset}px 0px -30%` : config.rootMargin;
      if (typeof config.threshold === "string") {
        config.threshold = config.threshold.split(",").map((value) => Number.parseFloat(value));
      }
      return config;
    }
    _maybeEnableSmoothScroll() {
      if (!this._config.smoothScroll) {
        return;
      }
      EventHandler.off(this._config.target, EVENT_CLICK);
      EventHandler.on(this._config.target, EVENT_CLICK, SELECTOR_TARGET_LINKS, (event) => {
        const observableSection = this._observableSections.get(event.target.hash);
        if (observableSection) {
          event.preventDefault();
          const root = this._rootElement || window;
          const height = observableSection.offsetTop - this._element.offsetTop;
          if (root.scrollTo) {
            root.scrollTo({
              top: height,
              behavior: "smooth"
            });
            return;
          }
          root.scrollTop = height;
        }
      });
    }
    _getNewObserver() {
      const options = {
        root: this._rootElement,
        threshold: this._config.threshold,
        rootMargin: this._config.rootMargin
      };
      return new IntersectionObserver((entries) => this._observerCallback(entries), options);
    }
    // The logic of selection
    _observerCallback(entries) {
      const targetElement = (entry) => this._targetLinks.get(`#${entry.target.id}`);
      const activate = (entry) => {
        this._previousScrollData.visibleEntryTop = entry.target.offsetTop;
        this._process(targetElement(entry));
      };
      const parentScrollTop = (this._rootElement || document.documentElement).scrollTop;
      const userScrollsDown = parentScrollTop >= this._previousScrollData.parentScrollTop;
      this._previousScrollData.parentScrollTop = parentScrollTop;
      for (const entry of entries) {
        if (!entry.isIntersecting) {
          this._activeTarget = null;
          this._clearActiveClass(targetElement(entry));
          continue;
        }
        const entryIsLowerThanPrevious = entry.target.offsetTop >= this._previousScrollData.visibleEntryTop;
        if (userScrollsDown && entryIsLowerThanPrevious) {
          activate(entry);
          if (!parentScrollTop) {
            return;
          }
          continue;
        }
        if (!userScrollsDown && !entryIsLowerThanPrevious) {
          activate(entry);
        }
      }
    }
    _initializeTargetsAndObservables() {
      this._targetLinks = /* @__PURE__ */ new Map();
      this._observableSections = /* @__PURE__ */ new Map();
      const targetLinks = SelectorEngine.find(SELECTOR_TARGET_LINKS, this._config.target);
      for (const anchor of targetLinks) {
        if (!anchor.hash || isDisabled(anchor)) {
          continue;
        }
        const observableSection = SelectorEngine.findOne(decodeURI(anchor.hash), this._element);
        if (isVisible(observableSection)) {
          this._targetLinks.set(decodeURI(anchor.hash), anchor);
          this._observableSections.set(anchor.hash, observableSection);
        }
      }
    }
    _process(target) {
      if (this._activeTarget === target) {
        return;
      }
      this._clearActiveClass(this._config.target);
      this._activeTarget = target;
      target.classList.add(CLASS_NAME_ACTIVE$1);
      this._activateParents(target);
      EventHandler.trigger(this._element, EVENT_ACTIVATE, {
        relatedTarget: target
      });
    }
    _activateParents(target) {
      if (target.classList.contains(CLASS_NAME_DROPDOWN_ITEM)) {
        SelectorEngine.findOne(SELECTOR_DROPDOWN_TOGGLE$1, target.closest(SELECTOR_DROPDOWN)).classList.add(CLASS_NAME_ACTIVE$1);
        return;
      }
      for (const listGroup of SelectorEngine.parents(target, SELECTOR_NAV_LIST_GROUP)) {
        for (const item of SelectorEngine.prev(listGroup, SELECTOR_LINK_ITEMS)) {
          item.classList.add(CLASS_NAME_ACTIVE$1);
        }
      }
    }
    _clearActiveClass(parent) {
      parent.classList.remove(CLASS_NAME_ACTIVE$1);
      const activeNodes = SelectorEngine.find(`${SELECTOR_TARGET_LINKS}.${CLASS_NAME_ACTIVE$1}`, parent);
      for (const node of activeNodes) {
        node.classList.remove(CLASS_NAME_ACTIVE$1);
      }
    }
    // Static
    static jQueryInterface(config) {
      return this.each(function() {
        const data = _ScrollSpy.getOrCreateInstance(this, config);
        if (typeof config !== "string") {
          return;
        }
        if (data[config] === void 0 || config.startsWith("_") || config === "constructor") {
          throw new TypeError(`No method named "${config}"`);
        }
        data[config]();
      });
    }
  };
  EventHandler.on(window, EVENT_LOAD_DATA_API$1, () => {
    for (const spy of SelectorEngine.find(SELECTOR_DATA_SPY)) {
      ScrollSpy.getOrCreateInstance(spy);
    }
  });
  defineJQueryPlugin(ScrollSpy);
  var NAME$1 = "tab";
  var DATA_KEY$1 = "bs.tab";
  var EVENT_KEY$1 = `.${DATA_KEY$1}`;
  var EVENT_HIDE$1 = `hide${EVENT_KEY$1}`;
  var EVENT_HIDDEN$1 = `hidden${EVENT_KEY$1}`;
  var EVENT_SHOW$1 = `show${EVENT_KEY$1}`;
  var EVENT_SHOWN$1 = `shown${EVENT_KEY$1}`;
  var EVENT_CLICK_DATA_API = `click${EVENT_KEY$1}`;
  var EVENT_KEYDOWN = `keydown${EVENT_KEY$1}`;
  var EVENT_LOAD_DATA_API = `load${EVENT_KEY$1}`;
  var ARROW_LEFT_KEY = "ArrowLeft";
  var ARROW_RIGHT_KEY = "ArrowRight";
  var ARROW_UP_KEY = "ArrowUp";
  var ARROW_DOWN_KEY = "ArrowDown";
  var HOME_KEY = "Home";
  var END_KEY = "End";
  var CLASS_NAME_ACTIVE = "active";
  var CLASS_NAME_FADE$1 = "fade";
  var CLASS_NAME_SHOW$1 = "show";
  var CLASS_DROPDOWN = "dropdown";
  var SELECTOR_DROPDOWN_TOGGLE = ".dropdown-toggle";
  var SELECTOR_DROPDOWN_MENU = ".dropdown-menu";
  var NOT_SELECTOR_DROPDOWN_TOGGLE = `:not(${SELECTOR_DROPDOWN_TOGGLE})`;
  var SELECTOR_TAB_PANEL = '.list-group, .nav, [role="tablist"]';
  var SELECTOR_OUTER = ".nav-item, .list-group-item";
  var SELECTOR_INNER = `.nav-link${NOT_SELECTOR_DROPDOWN_TOGGLE}, .list-group-item${NOT_SELECTOR_DROPDOWN_TOGGLE}, [role="tab"]${NOT_SELECTOR_DROPDOWN_TOGGLE}`;
  var SELECTOR_DATA_TOGGLE = '[data-bs-toggle="tab"], [data-bs-toggle="pill"], [data-bs-toggle="list"]';
  var SELECTOR_INNER_ELEM = `${SELECTOR_INNER}, ${SELECTOR_DATA_TOGGLE}`;
  var SELECTOR_DATA_TOGGLE_ACTIVE = `.${CLASS_NAME_ACTIVE}[data-bs-toggle="tab"], .${CLASS_NAME_ACTIVE}[data-bs-toggle="pill"], .${CLASS_NAME_ACTIVE}[data-bs-toggle="list"]`;
  var Tab = class _Tab extends BaseComponent {
    constructor(element) {
      super(element);
      this._parent = this._element.closest(SELECTOR_TAB_PANEL);
      if (!this._parent) {
        return;
      }
      this._setInitialAttributes(this._parent, this._getChildren());
      EventHandler.on(this._element, EVENT_KEYDOWN, (event) => this._keydown(event));
    }
    // Getters
    static get NAME() {
      return NAME$1;
    }
    // Public
    show() {
      const innerElem = this._element;
      if (this._elemIsActive(innerElem)) {
        return;
      }
      const active = this._getActiveElem();
      const hideEvent = active ? EventHandler.trigger(active, EVENT_HIDE$1, {
        relatedTarget: innerElem
      }) : null;
      const showEvent = EventHandler.trigger(innerElem, EVENT_SHOW$1, {
        relatedTarget: active
      });
      if (showEvent.defaultPrevented || hideEvent && hideEvent.defaultPrevented) {
        return;
      }
      this._deactivate(active, innerElem);
      this._activate(innerElem, active);
    }
    // Private
    _activate(element, relatedElem) {
      if (!element) {
        return;
      }
      element.classList.add(CLASS_NAME_ACTIVE);
      this._activate(SelectorEngine.getElementFromSelector(element));
      const complete = () => {
        if (element.getAttribute("role") !== "tab") {
          element.classList.add(CLASS_NAME_SHOW$1);
          return;
        }
        element.removeAttribute("tabindex");
        element.setAttribute("aria-selected", true);
        this._toggleDropDown(element, true);
        EventHandler.trigger(element, EVENT_SHOWN$1, {
          relatedTarget: relatedElem
        });
      };
      this._queueCallback(complete, element, element.classList.contains(CLASS_NAME_FADE$1));
    }
    _deactivate(element, relatedElem) {
      if (!element) {
        return;
      }
      element.classList.remove(CLASS_NAME_ACTIVE);
      element.blur();
      this._deactivate(SelectorEngine.getElementFromSelector(element));
      const complete = () => {
        if (element.getAttribute("role") !== "tab") {
          element.classList.remove(CLASS_NAME_SHOW$1);
          return;
        }
        element.setAttribute("aria-selected", false);
        element.setAttribute("tabindex", "-1");
        this._toggleDropDown(element, false);
        EventHandler.trigger(element, EVENT_HIDDEN$1, {
          relatedTarget: relatedElem
        });
      };
      this._queueCallback(complete, element, element.classList.contains(CLASS_NAME_FADE$1));
    }
    _keydown(event) {
      if (![ARROW_LEFT_KEY, ARROW_RIGHT_KEY, ARROW_UP_KEY, ARROW_DOWN_KEY, HOME_KEY, END_KEY].includes(event.key)) {
        return;
      }
      event.stopPropagation();
      event.preventDefault();
      const children = this._getChildren().filter((element) => !isDisabled(element));
      let nextActiveElement;
      if ([HOME_KEY, END_KEY].includes(event.key)) {
        nextActiveElement = children[event.key === HOME_KEY ? 0 : children.length - 1];
      } else {
        const isNext = [ARROW_RIGHT_KEY, ARROW_DOWN_KEY].includes(event.key);
        nextActiveElement = getNextActiveElement(children, event.target, isNext, true);
      }
      if (nextActiveElement) {
        nextActiveElement.focus({
          preventScroll: true
        });
        _Tab.getOrCreateInstance(nextActiveElement).show();
      }
    }
    _getChildren() {
      return SelectorEngine.find(SELECTOR_INNER_ELEM, this._parent);
    }
    _getActiveElem() {
      return this._getChildren().find((child) => this._elemIsActive(child)) || null;
    }
    _setInitialAttributes(parent, children) {
      this._setAttributeIfNotExists(parent, "role", "tablist");
      for (const child of children) {
        this._setInitialAttributesOnChild(child);
      }
    }
    _setInitialAttributesOnChild(child) {
      child = this._getInnerElement(child);
      const isActive = this._elemIsActive(child);
      const outerElem = this._getOuterElement(child);
      child.setAttribute("aria-selected", isActive);
      if (outerElem !== child) {
        this._setAttributeIfNotExists(outerElem, "role", "presentation");
      }
      if (!isActive) {
        child.setAttribute("tabindex", "-1");
      }
      this._setAttributeIfNotExists(child, "role", "tab");
      this._setInitialAttributesOnTargetPanel(child);
    }
    _setInitialAttributesOnTargetPanel(child) {
      const target = SelectorEngine.getElementFromSelector(child);
      if (!target) {
        return;
      }
      this._setAttributeIfNotExists(target, "role", "tabpanel");
      if (child.id) {
        this._setAttributeIfNotExists(target, "aria-labelledby", `${child.id}`);
      }
    }
    _toggleDropDown(element, open) {
      const outerElem = this._getOuterElement(element);
      if (!outerElem.classList.contains(CLASS_DROPDOWN)) {
        return;
      }
      const toggle = (selector, className) => {
        const element2 = SelectorEngine.findOne(selector, outerElem);
        if (element2) {
          element2.classList.toggle(className, open);
        }
      };
      toggle(SELECTOR_DROPDOWN_TOGGLE, CLASS_NAME_ACTIVE);
      toggle(SELECTOR_DROPDOWN_MENU, CLASS_NAME_SHOW$1);
      outerElem.setAttribute("aria-expanded", open);
    }
    _setAttributeIfNotExists(element, attribute, value) {
      if (!element.hasAttribute(attribute)) {
        element.setAttribute(attribute, value);
      }
    }
    _elemIsActive(elem) {
      return elem.classList.contains(CLASS_NAME_ACTIVE);
    }
    // Try to get the inner element (usually the .nav-link)
    _getInnerElement(elem) {
      return elem.matches(SELECTOR_INNER_ELEM) ? elem : SelectorEngine.findOne(SELECTOR_INNER_ELEM, elem);
    }
    // Try to get the outer element (usually the .nav-item)
    _getOuterElement(elem) {
      return elem.closest(SELECTOR_OUTER) || elem;
    }
    // Static
    static jQueryInterface(config) {
      return this.each(function() {
        const data = _Tab.getOrCreateInstance(this);
        if (typeof config !== "string") {
          return;
        }
        if (data[config] === void 0 || config.startsWith("_") || config === "constructor") {
          throw new TypeError(`No method named "${config}"`);
        }
        data[config]();
      });
    }
  };
  EventHandler.on(document, EVENT_CLICK_DATA_API, SELECTOR_DATA_TOGGLE, function(event) {
    if (["A", "AREA"].includes(this.tagName)) {
      event.preventDefault();
    }
    if (isDisabled(this)) {
      return;
    }
    Tab.getOrCreateInstance(this).show();
  });
  EventHandler.on(window, EVENT_LOAD_DATA_API, () => {
    for (const element of SelectorEngine.find(SELECTOR_DATA_TOGGLE_ACTIVE)) {
      Tab.getOrCreateInstance(element);
    }
  });
  defineJQueryPlugin(Tab);
  var NAME = "toast";
  var DATA_KEY = "bs.toast";
  var EVENT_KEY = `.${DATA_KEY}`;
  var EVENT_MOUSEOVER = `mouseover${EVENT_KEY}`;
  var EVENT_MOUSEOUT = `mouseout${EVENT_KEY}`;
  var EVENT_FOCUSIN = `focusin${EVENT_KEY}`;
  var EVENT_FOCUSOUT = `focusout${EVENT_KEY}`;
  var EVENT_HIDE = `hide${EVENT_KEY}`;
  var EVENT_HIDDEN = `hidden${EVENT_KEY}`;
  var EVENT_SHOW = `show${EVENT_KEY}`;
  var EVENT_SHOWN = `shown${EVENT_KEY}`;
  var CLASS_NAME_FADE = "fade";
  var CLASS_NAME_HIDE = "hide";
  var CLASS_NAME_SHOW = "show";
  var CLASS_NAME_SHOWING = "showing";
  var DefaultType = {
    animation: "boolean",
    autohide: "boolean",
    delay: "number"
  };
  var Default = {
    animation: true,
    autohide: true,
    delay: 5e3
  };
  var Toast = class _Toast extends BaseComponent {
    constructor(element, config) {
      super(element, config);
      this._timeout = null;
      this._hasMouseInteraction = false;
      this._hasKeyboardInteraction = false;
      this._setListeners();
    }
    // Getters
    static get Default() {
      return Default;
    }
    static get DefaultType() {
      return DefaultType;
    }
    static get NAME() {
      return NAME;
    }
    // Public
    show() {
      const showEvent = EventHandler.trigger(this._element, EVENT_SHOW);
      if (showEvent.defaultPrevented) {
        return;
      }
      this._clearTimeout();
      if (this._config.animation) {
        this._element.classList.add(CLASS_NAME_FADE);
      }
      const complete = () => {
        this._element.classList.remove(CLASS_NAME_SHOWING);
        EventHandler.trigger(this._element, EVENT_SHOWN);
        this._maybeScheduleHide();
      };
      this._element.classList.remove(CLASS_NAME_HIDE);
      reflow(this._element);
      this._element.classList.add(CLASS_NAME_SHOW, CLASS_NAME_SHOWING);
      this._queueCallback(complete, this._element, this._config.animation);
    }
    hide() {
      if (!this.isShown()) {
        return;
      }
      const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE);
      if (hideEvent.defaultPrevented) {
        return;
      }
      const complete = () => {
        this._element.classList.add(CLASS_NAME_HIDE);
        this._element.classList.remove(CLASS_NAME_SHOWING, CLASS_NAME_SHOW);
        EventHandler.trigger(this._element, EVENT_HIDDEN);
      };
      this._element.classList.add(CLASS_NAME_SHOWING);
      this._queueCallback(complete, this._element, this._config.animation);
    }
    dispose() {
      this._clearTimeout();
      if (this.isShown()) {
        this._element.classList.remove(CLASS_NAME_SHOW);
      }
      super.dispose();
    }
    isShown() {
      return this._element.classList.contains(CLASS_NAME_SHOW);
    }
    // Private
    _maybeScheduleHide() {
      if (!this._config.autohide) {
        return;
      }
      if (this._hasMouseInteraction || this._hasKeyboardInteraction) {
        return;
      }
      this._timeout = setTimeout(() => {
        this.hide();
      }, this._config.delay);
    }
    _onInteraction(event, isInteracting) {
      switch (event.type) {
        case "mouseover":
        case "mouseout": {
          this._hasMouseInteraction = isInteracting;
          break;
        }
        case "focusin":
        case "focusout": {
          this._hasKeyboardInteraction = isInteracting;
          break;
        }
      }
      if (isInteracting) {
        this._clearTimeout();
        return;
      }
      const nextElement = event.relatedTarget;
      if (this._element === nextElement || this._element.contains(nextElement)) {
        return;
      }
      this._maybeScheduleHide();
    }
    _setListeners() {
      EventHandler.on(this._element, EVENT_MOUSEOVER, (event) => this._onInteraction(event, true));
      EventHandler.on(this._element, EVENT_MOUSEOUT, (event) => this._onInteraction(event, false));
      EventHandler.on(this._element, EVENT_FOCUSIN, (event) => this._onInteraction(event, true));
      EventHandler.on(this._element, EVENT_FOCUSOUT, (event) => this._onInteraction(event, false));
    }
    _clearTimeout() {
      clearTimeout(this._timeout);
      this._timeout = null;
    }
    // Static
    static jQueryInterface(config) {
      return this.each(function() {
        const data = _Toast.getOrCreateInstance(this, config);
        if (typeof config === "string") {
          if (typeof data[config] === "undefined") {
            throw new TypeError(`No method named "${config}"`);
          }
          data[config](this);
        }
      });
    }
  };
  enableDismissTrigger(Toast);
  defineJQueryPlugin(Toast);

  // assets/js/utils.js
  globalThis.MyStorage = {
    message: (message, type = "info") => {
      let color;
      switch (type) {
        case "error":
          color = "danger";
          break;
        case "warning":
          color = "warning";
          break;
        default:
          color = "primary";
      }
      const container = document.querySelector(".toast-container");
      if (!container) {
        console.warn("Toast container not found for MyStorage.message()");
        return;
      }
      const element = document.createElement("div");
      container.appendChild(element);
      element.classList.add("toast", "show");
      element.setAttribute("role", "alert");
      element.setAttribute("aria-live", "assertive");
      element.setAttribute("aria-atomic", "true");
      const headerDiv = document.createElement("div");
      headerDiv.className = "toast-header";
      const spanEl = document.createElement("span");
      spanEl.className = `p-2 border border-light bg-${color} rounded-circle me-2`;
      headerDiv.appendChild(spanEl);
      const strongEl = document.createElement("strong");
      strongEl.className = "me-auto";
      strongEl.textContent = "System message";
      headerDiv.appendChild(strongEl);
      const closeButton = document.createElement("button");
      closeButton.type = "button";
      closeButton.className = "btn-close";
      closeButton.setAttribute("data-bs-dismiss", "toast");
      closeButton.setAttribute("aria-label", "Close");
      headerDiv.appendChild(closeButton);
      element.appendChild(headerDiv);
      const bodyDiv = document.createElement("div");
      bodyDiv.className = "toast-body";
      bodyDiv.textContent = message;
      element.appendChild(bodyDiv);
      element.addEventListener("hidden.bs.toast", () => {
        container.removeChild(element);
      });
      const toast = new bootstrap.Toast(element);
      toast.show();
    }
  };
  globalThis.FOSSBilling = globalThis.MyStorage;

  // ../../../node_modules/@dicebear/core/lib/utils/escape.js
  var escape_exports = {};
  __export(escape_exports, {
    xml: () => xml
  });
  function xml(content) {
    return content.replace(/&/g, "&amp;").replace(/'/g, "&apos;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // ../../../node_modules/@dicebear/core/lib/utils/license.js
  function xml2(style) {
    var _a, _b, _c, _d, _e, _f, _g;
    const title = (_a = style.meta) === null || _a === void 0 ? void 0 : _a.title;
    const creator = (_b = style.meta) === null || _b === void 0 ? void 0 : _b.creator;
    const source = (_c = style.meta) === null || _c === void 0 ? void 0 : _c.source;
    const license = (_e = (_d = style.meta) === null || _d === void 0 ? void 0 : _d.license) === null || _e === void 0 ? void 0 : _e.url;
    const rights = text(style);
    if (!title && !creator && !source && !license && !rights) {
      return "";
    }
    return '<metadata xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/"><rdf:RDF><rdf:Description>' + (title ? `<dc:title>${xml(title)}</dc:title>` : "") + (creator ? `<dc:creator>${xml(creator)}</dc:creator>` : "") + (source ? `<dc:source xsi:type="dcterms:URI">${xml((_g = (_f = style.meta) === null || _f === void 0 ? void 0 : _f.source) !== null && _g !== void 0 ? _g : "")}</dc:source>` : "") + (license ? `<dcterms:license xsi:type="dcterms:URI">${xml(license)}</dcterms:license>` : "") + (rights ? `<dc:rights>${xml(rights)}</dc:rights>` : "") + "</rdf:Description></rdf:RDF></metadata>";
  }
  function text(style) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    let title = ((_a = style.meta) === null || _a === void 0 ? void 0 : _a.title) ? `\u201E${(_b = style.meta) === null || _b === void 0 ? void 0 : _b.title}\u201D` : "Design";
    let creator = `\u201E${(_d = (_c = style.meta) === null || _c === void 0 ? void 0 : _c.creator) !== null && _d !== void 0 ? _d : "Unknown"}\u201D`;
    if ((_e = style.meta) === null || _e === void 0 ? void 0 : _e.source) {
      title += ` (${style.meta.source})`;
    }
    let result = "";
    if (((_g = (_f = style.meta) === null || _f === void 0 ? void 0 : _f.license) === null || _g === void 0 ? void 0 : _g.name) !== "MIT" && ((_h = style.meta) === null || _h === void 0 ? void 0 : _h.creator) !== "DiceBear" && ((_j = style.meta) === null || _j === void 0 ? void 0 : _j.title)) {
      result += "Remix of ";
    }
    result += `${title} by ${creator}`;
    if ((_l = (_k = style.meta) === null || _k === void 0 ? void 0 : _k.license) === null || _l === void 0 ? void 0 : _l.name) {
      result += `, licensed under \u201E${(_o = (_m = style.meta) === null || _m === void 0 ? void 0 : _m.license) === null || _o === void 0 ? void 0 : _o.name}\u201D`;
      if ((_q = (_p = style.meta) === null || _p === void 0 ? void 0 : _p.license) === null || _q === void 0 ? void 0 : _q.url) {
        result += ` (${style.meta.license.url})`;
      }
    }
    return result;
  }

  // ../../../node_modules/@dicebear/core/lib/utils/prng.js
  var MIN = -2147483648;
  var MAX = 2147483647;
  var MAX_SEED_LENGTH = 1024;
  function xorshift(value) {
    value ^= value << 13;
    value ^= value >> 17;
    value ^= value << 5;
    return value;
  }
  function hashSeed(seed) {
    let hash3 = 0;
    for (let i = 0; i < seed.length; i++) {
      hash3 = (hash3 << 5) - hash3 + seed.charCodeAt(i) | 0;
      hash3 = xorshift(hash3);
    }
    return hash3;
  }
  function create(seed = "") {
    seed = seed.toString().slice(0, MAX_SEED_LENGTH);
    let value = hashSeed(seed) || 1;
    const next = () => value = xorshift(value);
    const integer = (min2, max2) => {
      return Math.floor((next() - MIN) / (MAX - MIN) * (max2 + 1 - min2) + min2);
    };
    return {
      seed,
      next,
      bool(likelihood = 50) {
        return integer(1, 100) <= likelihood;
      },
      integer(min2, max2) {
        return integer(min2, max2);
      },
      pick(arr, fallback) {
        var _a;
        if (arr.length === 0) {
          next();
          return fallback;
        }
        return (_a = arr[integer(0, arr.length - 1)]) !== null && _a !== void 0 ? _a : fallback;
      },
      shuffle(arr) {
        const internalPrng = create(next().toString());
        const workingArray = [...arr];
        for (let i = workingArray.length - 1; i > 0; i--) {
          const j = internalPrng.integer(0, i);
          [workingArray[i], workingArray[j]] = [workingArray[j], workingArray[i]];
        }
        return workingArray;
      },
      string(length, characters = "abcdefghijklmnopqrstuvwxyz1234567890") {
        const internalPrng = create(next().toString());
        let str = "";
        for (let i = 0; i < length; i++) {
          str += characters[internalPrng.integer(0, characters.length - 1)];
        }
        return str;
      }
    };
  }

  // ../../../node_modules/@dicebear/core/lib/utils/svg.js
  function getViewBox(result) {
    let viewBox = result.attributes["viewBox"].split(" ");
    let x = parseInt(viewBox[0]);
    let y = parseInt(viewBox[1]);
    let width = parseInt(viewBox[2]);
    let height = parseInt(viewBox[3]);
    return {
      x,
      y,
      width,
      height
    };
  }
  function addBackground(result, primaryColor, secondaryColor, type, rotation) {
    let { width, height, x, y } = getViewBox(result);
    const solidBackground = `<rect fill="${xml(primaryColor)}" width="${width}" height="${height}" x="${x}" y="${y}" />`;
    switch (type) {
      case "solid":
        return solidBackground + result.body;
      case "gradientLinear":
        return `<rect fill="url(#backgroundLinear)" width="${width}" height="${height}" x="${x}" y="${y}" /><defs><linearGradient id="backgroundLinear" gradientTransform="rotate(${rotation} 0.5 0.5)"><stop stop-color="${xml(primaryColor)}"/><stop offset="1" stop-color="${xml(secondaryColor)}"/></linearGradient></defs>` + result.body;
    }
  }
  function addScale(result, scale) {
    let { width, height, x, y } = getViewBox(result);
    let percent = scale ? (scale - 100) / 100 : 0;
    let translateX = (width / 2 + x) * percent * -1;
    let translateY = (height / 2 + y) * percent * -1;
    return `<g transform="translate(${translateX} ${translateY}) scale(${scale / 100})">${result.body}</g>`;
  }
  function addTranslate(result, x, y) {
    let viewBox = getViewBox(result);
    let translateX = (viewBox.width + viewBox.x * 2) * ((x !== null && x !== void 0 ? x : 0) / 100);
    let translateY = (viewBox.height + viewBox.y * 2) * ((y !== null && y !== void 0 ? y : 0) / 100);
    return `<g transform="translate(${translateX} ${translateY})">${result.body}</g>`;
  }
  function addRotate(result, rotate) {
    let { width, height, x, y } = getViewBox(result);
    return `<g transform="rotate(${rotate}, ${width / 2 + x}, ${height / 2 + y})">${result.body}</g>`;
  }
  function addFlip(result) {
    let { width, x } = getViewBox(result);
    return `<g transform="scale(-1 1) translate(${width * -1 - x * 2} 0)">${result.body}</g>`;
  }
  function addViewboxMask(result, radius) {
    let { width, height, x, y } = getViewBox(result);
    let rx = radius ? width * radius / 100 : 0;
    let ry = radius ? height * radius / 100 : 0;
    return `<mask id="viewboxMask"><rect width="${width}" height="${height}" rx="${rx}" ry="${ry}" x="${x}" y="${y}" fill="#fff" /></mask><g mask="url(#viewboxMask)">${result.body}</g>`;
  }
  function createAttrString(result) {
    const attributes = {
      xmlns: "http://www.w3.org/2000/svg",
      ...result.attributes
    };
    return Object.keys(attributes).map((attr) => `${xml(attr)}="${xml(attributes[attr])}"`).join(" ");
  }
  function randomizeIds(result) {
    const prng = create(Math.random().toString());
    const ids = {};
    return result.body.replace(/(id="|url\(#)([a-z0-9-_]+)([")])/gi, (match, m1, m2, m3) => {
      ids[m2] = ids[m2] || prng.string(8);
      return `${m1}${ids[m2]}${m3}`;
    });
  }

  // ../../../node_modules/@dicebear/core/lib/schema.js
  var schema = {
    type: "object",
    $schema: "http://json-schema.org/draft-07/schema#",
    properties: {
      seed: {
        type: "string"
      },
      flip: {
        type: "boolean",
        default: false
      },
      rotate: {
        type: "integer",
        minimum: 0,
        maximum: 360,
        default: 0
      },
      scale: {
        type: "integer",
        minimum: 0,
        maximum: 200,
        default: 100
      },
      radius: {
        type: "integer",
        minimum: 0,
        maximum: 50,
        default: 0
      },
      size: {
        type: "integer",
        minimum: 1
      },
      backgroundColor: {
        type: "array",
        items: {
          type: "string",
          pattern: "^(transparent|[a-fA-F0-9]{6})$"
        }
      },
      backgroundType: {
        type: "array",
        items: {
          type: "string",
          enum: ["solid", "gradientLinear"]
        },
        default: ["solid"]
      },
      backgroundRotation: {
        type: "array",
        items: {
          type: "integer",
          minimum: -360,
          maximum: 360
        },
        default: [0, 360]
      },
      translateX: {
        type: "integer",
        minimum: -100,
        maximum: 100,
        default: 0
      },
      translateY: {
        type: "integer",
        minimum: -100,
        maximum: 100,
        default: 0
      },
      clip: {
        type: "boolean",
        default: true
      },
      randomizeIds: {
        type: "boolean",
        default: false
      }
    }
  };

  // ../../../node_modules/@dicebear/core/lib/utils/options.js
  function defaults(schema3) {
    var _a;
    let result = {};
    let props = (_a = schema3.properties) !== null && _a !== void 0 ? _a : {};
    Object.keys(props).forEach((key) => {
      let val = props[key];
      if (typeof val === "object" && void 0 !== val.default) {
        if (Array.isArray(val.default)) {
          result[key] = [...val.default];
        } else if (typeof val.default === "object") {
          result[key] = { ...val.default };
        } else {
          result[key] = val.default;
        }
      }
    });
    return result;
  }
  function merge(style, options) {
    var _a;
    let result = {
      ...defaults(schema),
      ...defaults((_a = style.schema) !== null && _a !== void 0 ? _a : {}),
      ...options
    };
    return JSON.parse(JSON.stringify(result));
  }

  // ../../../node_modules/@dicebear/core/lib/utils/color.js
  function convertColor(color) {
    return "transparent" === color ? color : `#${color}`;
  }
  function getBackgroundColors(prng, backgroundColor, backgroundType) {
    var _a;
    let shuffledBackgroundColors = prng.shuffle(backgroundColor);
    if (shuffledBackgroundColors.length <= 1) {
      shuffledBackgroundColors = backgroundColor;
      prng.next();
    } else if (backgroundColor.length == 2 && backgroundType == "gradientLinear") {
      shuffledBackgroundColors = backgroundColor;
      prng.next();
    } else {
      shuffledBackgroundColors = prng.shuffle(backgroundColor);
    }
    if (shuffledBackgroundColors.length === 0) {
      shuffledBackgroundColors = ["transparent"];
    }
    const primary = shuffledBackgroundColors[0];
    const secondary = (_a = shuffledBackgroundColors[1]) !== null && _a !== void 0 ? _a : shuffledBackgroundColors[0];
    return {
      primary: convertColor(primary),
      secondary: convertColor(secondary)
    };
  }

  // ../../../node_modules/@dicebear/core/lib/core.js
  function createAvatar(style, options = {}) {
    var _a, _b, _c, _d, _e;
    options = merge(style, options);
    const prng = create(options.seed);
    const result = style.create({ prng, options });
    const backgroundType = prng.pick((_a = options.backgroundType) !== null && _a !== void 0 ? _a : [], "solid");
    const { primary: primaryBackgroundColor, secondary: secondaryBackgroundColor } = getBackgroundColors(prng, (_b = options.backgroundColor) !== null && _b !== void 0 ? _b : [], backgroundType);
    const backgroundRotation = prng.integer(((_c = options.backgroundRotation) === null || _c === void 0 ? void 0 : _c.length) ? Math.min(...options.backgroundRotation) : 0, ((_d = options.backgroundRotation) === null || _d === void 0 ? void 0 : _d.length) ? Math.max(...options.backgroundRotation) : 0);
    if (options.size) {
      result.attributes.width = options.size.toString();
      result.attributes.height = options.size.toString();
    }
    if (options.scale !== void 0 && options.scale !== 100) {
      result.body = addScale(result, options.scale);
    }
    if (options.flip) {
      result.body = addFlip(result);
    }
    if (options.rotate) {
      result.body = addRotate(result, options.rotate);
    }
    if (options.translateX || options.translateY) {
      result.body = addTranslate(result, options.translateX, options.translateY);
    }
    if (primaryBackgroundColor !== "transparent" && secondaryBackgroundColor !== "transparent") {
      result.body = addBackground(result, primaryBackgroundColor, secondaryBackgroundColor, backgroundType, backgroundRotation);
    }
    if (options.radius || options.clip) {
      result.body = addViewboxMask(result, (_e = options.radius) !== null && _e !== void 0 ? _e : 0);
    }
    if (options.randomizeIds) {
      result.body = randomizeIds(result);
    }
    const attributes = createAttrString(result);
    const metadata = xml2(style);
    const svg = `<svg ${attributes}>${metadata}${result.body}</svg>`;
    return {
      toString: () => svg,
      toJson: () => {
        var _a2;
        return {
          svg,
          extra: {
            primaryBackgroundColor,
            secondaryBackgroundColor,
            backgroundType,
            backgroundRotation,
            ...(_a2 = result.extra) === null || _a2 === void 0 ? void 0 : _a2.call(result)
          }
        };
      },
      toDataUri: () => {
        return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
      }
    };
  }

  // ../../../node_modules/@dicebear/identicon/lib/index.js
  var lib_exports2 = {};
  __export(lib_exports2, {
    create: () => create2,
    meta: () => meta,
    schema: () => schema2
  });

  // ../../../node_modules/@dicebear/identicon/lib/components/index.js
  var components_exports = {};
  __export(components_exports, {
    row1: () => row1,
    row2: () => row2,
    row3: () => row3,
    row4: () => row4,
    row5: () => row5
  });

  // ../../../node_modules/@dicebear/identicon/lib/components/row1.js
  var row1 = {
    xooox: (components, colors) => `<path d="M1 0H0v1h1V0ZM5 0H4v1h1V0Z" fill="${escape_exports.xml(`${colors.row}`)}"/>`,
    xxoxx: (components, colors) => `<path d="M2 0H0v1h2V0ZM5 0H3v1h2V0Z" fill="${escape_exports.xml(`${colors.row}`)}"/>`,
    xoxox: (components, colors) => `<path d="M0 0h1v1H0V0ZM4 0h1v1H4V0ZM3 0H2v1h1V0Z" fill="${escape_exports.xml(`${colors.row}`)}"/>`,
    oxxxo: (components, colors) => `<path fill="${escape_exports.xml(`${colors.row}`)}" d="M1 0h3v1H1z"/>`,
    xxxxx: (components, colors) => `<path fill="${escape_exports.xml(`${colors.row}`)}" d="M0 0h5v1H0z"/>`,
    oxoxo: (components, colors) => `<path d="M2 0H1v1h1V0ZM4 0H3v1h1V0Z" fill="${escape_exports.xml(`${colors.row}`)}"/>`,
    ooxoo: (components, colors) => `<path fill="${escape_exports.xml(`${colors.row}`)}" d="M2 0h1v1H2z"/>`
  };

  // ../../../node_modules/@dicebear/identicon/lib/components/row2.js
  var row2 = {
    xooox: (components, colors) => `<path d="M1 1H0v1h1V1ZM5 1H4v1h1V1Z" fill="${escape_exports.xml(`${colors.row}`)}"/>`,
    xxoxx: (components, colors) => `<path d="M2 1H0v1h2V1ZM5 1H3v1h2V1Z" fill="${escape_exports.xml(`${colors.row}`)}"/>`,
    xoxox: (components, colors) => `<path d="M0 1h1v1H0V1ZM4 1h1v1H4V1ZM3 1H2v1h1V1Z" fill="${escape_exports.xml(`${colors.row}`)}"/>`,
    oxxxo: (components, colors) => `<path fill="${escape_exports.xml(`${colors.row}`)}" d="M1 1h3v1H1z"/>`,
    xxxxx: (components, colors) => `<path fill="${escape_exports.xml(`${colors.row}`)}" d="M0 1h5v1H0z"/>`,
    oxoxo: (components, colors) => `<path d="M2 1H1v1h1V1ZM4 1H3v1h1V1Z" fill="${escape_exports.xml(`${colors.row}`)}"/>`,
    ooxoo: (components, colors) => `<path fill="${escape_exports.xml(`${colors.row}`)}" d="M2 1h1v1H2z"/>`
  };

  // ../../../node_modules/@dicebear/identicon/lib/components/row3.js
  var row3 = {
    xooox: (components, colors) => `<path d="M1 2H0v1h1V2ZM5 2H4v1h1V2Z" fill="${escape_exports.xml(`${colors.row}`)}"/>`,
    xxoxx: (components, colors) => `<path d="M2 2H0v1h2V2ZM5 2H3v1h2V2Z" fill="${escape_exports.xml(`${colors.row}`)}"/>`,
    xoxox: (components, colors) => `<path d="M0 2h1v1H0V2ZM4 2h1v1H4V2ZM3 2H2v1h1V2Z" fill="${escape_exports.xml(`${colors.row}`)}"/>`,
    oxxxo: (components, colors) => `<path fill="${escape_exports.xml(`${colors.row}`)}" d="M1 2h3v1H1z"/>`,
    xxxxx: (components, colors) => `<path fill="${escape_exports.xml(`${colors.row}`)}" d="M0 2h5v1H0z"/>`,
    oxoxo: (components, colors) => `<path d="M2 2H1v1h1V2ZM4 2H3v1h1V2Z" fill="${escape_exports.xml(`${colors.row}`)}"/>`,
    ooxoo: (components, colors) => `<path fill="${escape_exports.xml(`${colors.row}`)}" d="M2 2h1v1H2z"/>`
  };

  // ../../../node_modules/@dicebear/identicon/lib/components/row4.js
  var row4 = {
    xooox: (components, colors) => `<path d="M1 3H0v1h1V3ZM5 3H4v1h1V3Z" fill="${escape_exports.xml(`${colors.row}`)}"/>`,
    xxoxx: (components, colors) => `<path d="M2 3H0v1h2V3ZM5 3H3v1h2V3Z" fill="${escape_exports.xml(`${colors.row}`)}"/>`,
    xoxox: (components, colors) => `<path d="M0 3h1v1H0V3ZM4 3h1v1H4V3ZM3 3H2v1h1V3Z" fill="${escape_exports.xml(`${colors.row}`)}"/>`,
    oxxxo: (components, colors) => `<path fill="${escape_exports.xml(`${colors.row}`)}" d="M1 3h3v1H1z"/>`,
    xxxxx: (components, colors) => `<path fill="${escape_exports.xml(`${colors.row}`)}" d="M0 3h5v1H0z"/>`,
    oxoxo: (components, colors) => `<path d="M2 3H1v1h1V3ZM4 3H3v1h1V3Z" fill="${escape_exports.xml(`${colors.row}`)}"/>`,
    ooxoo: (components, colors) => `<path fill="${escape_exports.xml(`${colors.row}`)}" d="M2 3h1v1H2z"/>`
  };

  // ../../../node_modules/@dicebear/identicon/lib/components/row5.js
  var row5 = {
    xooox: (components, colors) => `<path d="M1 4H0v1h1V4ZM5 4H4v1h1V4Z" fill="${escape_exports.xml(`${colors.row}`)}"/>`,
    xxoxx: (components, colors) => `<path d="M2 4H0v1h2V4ZM5 4H3v1h2V4Z" fill="${escape_exports.xml(`${colors.row}`)}"/>`,
    xoxox: (components, colors) => `<path d="M0 4h1v1H0V4ZM4 4h1v1H4V4ZM3 4H2v1h1V4Z" fill="${escape_exports.xml(`${colors.row}`)}"/>`,
    oxxxo: (components, colors) => `<path fill="${escape_exports.xml(`${colors.row}`)}" d="M1 4h3v1H1z"/>`,
    xxxxx: (components, colors) => `<path fill="${escape_exports.xml(`${colors.row}`)}" d="M0 4h5v1H0z"/>`,
    oxoxo: (components, colors) => `<path d="M2 4H1v1h1V4ZM4 4H3v1h1V4Z" fill="${escape_exports.xml(`${colors.row}`)}"/>`,
    ooxoo: (components, colors) => `<path fill="${escape_exports.xml(`${colors.row}`)}" d="M2 4h1v1H2z"/>`
  };

  // ../../../node_modules/@dicebear/identicon/lib/utils/pickComponent.js
  function pickComponent({ prng, group, values = [] }) {
    const componentCollection = components_exports;
    const key = prng.pick(values);
    if (key && componentCollection[group][key]) {
      return {
        name: key,
        value: componentCollection[group][key]
      };
    } else {
      return void 0;
    }
  }

  // ../../../node_modules/@dicebear/identicon/lib/utils/getComponents.js
  function getComponents({ prng, options }) {
    const row1Component = pickComponent({
      prng,
      group: "row1",
      values: options.row1
    });
    const row2Component = pickComponent({
      prng,
      group: "row2",
      values: options.row2
    });
    const row3Component = pickComponent({
      prng,
      group: "row3",
      values: options.row3
    });
    const row4Component = pickComponent({
      prng,
      group: "row4",
      values: options.row4
    });
    const row5Component = pickComponent({
      prng,
      group: "row5",
      values: options.row5
    });
    return {
      row1: row1Component,
      row2: row2Component,
      row3: row3Component,
      row4: row4Component,
      row5: row5Component
    };
  }

  // ../../../node_modules/@dicebear/identicon/lib/utils/convertColor.js
  function convertColor2(color) {
    return "transparent" === color ? color : `#${color}`;
  }

  // ../../../node_modules/@dicebear/identicon/lib/utils/getColors.js
  function getColors({ prng, options }) {
    var _a;
    return {
      row: convertColor2(prng.pick((_a = options.rowColor) !== null && _a !== void 0 ? _a : [], "transparent"))
    };
  }

  // ../../../node_modules/@dicebear/identicon/lib/schema.js
  var schema2 = {
    $schema: "http://json-schema.org/draft-07/schema#",
    properties: {
      row1: {
        type: "array",
        items: {
          type: "string",
          enum: ["xooox", "xxoxx", "xoxox", "oxxxo", "xxxxx", "oxoxo", "ooxoo"]
        },
        default: ["xooox", "xxoxx", "xoxox", "oxxxo", "xxxxx", "oxoxo", "ooxoo"]
      },
      row2: {
        type: "array",
        items: {
          type: "string",
          enum: ["xooox", "xxoxx", "xoxox", "oxxxo", "xxxxx", "oxoxo", "ooxoo"]
        },
        default: ["xooox", "xxoxx", "xoxox", "oxxxo", "xxxxx", "oxoxo", "ooxoo"]
      },
      row3: {
        type: "array",
        items: {
          type: "string",
          enum: ["xooox", "xxoxx", "xoxox", "oxxxo", "xxxxx", "oxoxo", "ooxoo"]
        },
        default: ["xooox", "xxoxx", "xoxox", "oxxxo", "xxxxx", "oxoxo", "ooxoo"]
      },
      row4: {
        type: "array",
        items: {
          type: "string",
          enum: ["xooox", "xxoxx", "xoxox", "oxxxo", "xxxxx", "oxoxo", "ooxoo"]
        },
        default: ["xooox", "xxoxx", "xoxox", "oxxxo", "xxxxx", "oxoxo", "ooxoo"]
      },
      row5: {
        type: "array",
        items: {
          type: "string",
          enum: ["xooox", "xxoxx", "xoxox", "oxxxo", "xxxxx", "oxoxo", "ooxoo"]
        },
        default: ["xooox", "xxoxx", "xoxox", "oxxxo", "xxxxx", "oxoxo", "ooxoo"]
      },
      rowColor: {
        type: "array",
        items: {
          type: "string",
          pattern: "^(transparent|[a-fA-F0-9]{6})$"
        },
        default: [
          "e53935",
          "ffb300",
          "1e88e5",
          "546e7a",
          "6d4c41",
          "00acc1",
          "f4511e",
          "5e35b1",
          "43a047",
          "757575",
          "3949ab",
          "039be5",
          "7cb342",
          "c0ca33",
          "fb8c00",
          "d81b60",
          "8e24aa",
          "00897b",
          "fdd835"
        ]
      }
    }
  };

  // ../../../node_modules/@dicebear/identicon/lib/index.js
  var meta = {
    title: "Identicon",
    creator: "DiceBear",
    source: "https://www.dicebear.com",
    homepage: "https://www.dicebear.com",
    license: {
      name: "CC0 1.0",
      url: "https://creativecommons.org/publicdomain/zero/1.0/"
    }
  };
  var create2 = ({ prng, options }) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const components = getComponents({ prng, options });
    const colors = getColors({ prng, options });
    return {
      attributes: {
        viewBox: "0 0 5 5",
        fill: "none",
        "shape-rendering": "crispEdges"
      },
      body: `${(_b = (_a = components.row1) === null || _a === void 0 ? void 0 : _a.value(components, colors)) !== null && _b !== void 0 ? _b : ""}${(_d = (_c = components.row2) === null || _c === void 0 ? void 0 : _c.value(components, colors)) !== null && _d !== void 0 ? _d : ""}${(_f = (_e = components.row3) === null || _e === void 0 ? void 0 : _e.value(components, colors)) !== null && _f !== void 0 ? _f : ""}${(_h = (_g = components.row4) === null || _g === void 0 ? void 0 : _g.value(components, colors)) !== null && _h !== void 0 ? _h : ""}${(_k = (_j = components.row5) === null || _j === void 0 ? void 0 : _j.value(components, colors)) !== null && _k !== void 0 ? _k : ""}`,
      extra: () => ({
        ...Object.entries(components).reduce((acc, [key, value]) => {
          acc[key] = value === null || value === void 0 ? void 0 : value.name;
          return acc;
        }, {}),
        ...Object.entries(colors).reduce((acc, [key, value]) => {
          acc[`${key}Color`] = value;
          return acc;
        }, {})
      })
    };
  };

  // assets/js/avatar.js
  var avatarCache = /* @__PURE__ */ new Map();
  function generateAvatar(seed, size = 40) {
    const cacheKey = `${seed}:${size}`;
    if (avatarCache.has(cacheKey)) {
      return avatarCache.get(cacheKey);
    }
    const avatar = createAvatar(lib_exports2, {
      seed,
      size,
      backgroundColor: ["transparent"]
    });
    const result = avatar.toDataUri();
    avatarCache.set(cacheKey, result);
    return result;
  }
  function initAvatars() {
    document.querySelectorAll(".db-avatar").forEach((container) => {
      const seed = container.dataset.avatarSeed;
      const size = parseInt(container.dataset.avatarSize, 10) || 40;
      if (seed) {
        const svg = generateAvatar(seed, size);
        if (svg) {
          container.style.backgroundImage = `url("${svg}")`;
          container.style.backgroundSize = "100% 100%";
          container.style.backgroundPosition = "center";
          container.style.backgroundRepeat = "no-repeat";
        }
      }
    });
  }

  // assets/huraga.js
  globalThis.bootstrap = { Tooltip, Toast, Modal, Collapse };
  document.addEventListener("DOMContentLoaded", () => {
    initAvatars();
    window.addEventListener("unhandledrejection", function(event) {
      const error = event.reason;
      let message = "An unexpected error occurred";
      if (error && typeof error === "object") {
        message = error.message || error.code || message;
      } else if (typeof error === "string") {
        message = error;
      }
      MyStorage.message(message, "error");
    });
    window.onerror = function(message, source, lineno, colno, error) {
      let displayMessage = message;
      if (error && error.message) {
        displayMessage = error.message;
      }
      MyStorage.message(displayMessage, "error");
    };
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    [...tooltipTriggerList].map((tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl));
    globalThis.flashMessage = ({ message = "", reload = false, type = "info" }) => {
      let key = "flash-message";
      let sessionMessage = sessionStorage.getItem(key);
      if (message === "" && sessionMessage) {
        MyStorage.message(sessionMessage, type);
        sessionStorage.removeItem(key);
        return;
      }
      if (message) {
        sessionStorage.setItem(key, message);
        if (typeof reload === "boolean" && reload) {
          window.location.reload();
        } else if (typeof reload === "string") {
          window.location.assign(reload);
        }
      }
    };
    flashMessage({});
    const requiredInputs = document.querySelectorAll("input[required], textarea[required]");
    requiredInputs.forEach((input) => {
      const label = input.previousElementSibling;
      const isAuth = input.parentElement.parentElement.classList.contains("auth");
      if (!isAuth && label && label.tagName.toLowerCase() === "label") {
        const asterisk = document.createElement("span");
        asterisk.textContent = " *";
        asterisk.classList.add("text-danger");
        label.appendChild(asterisk);
      }
    });
    const currencySelector = document.querySelectorAll("select.currency_selector");
    currencySelector.forEach(function(select) {
      select.addEventListener("change", function() {
        API.guest.post("cart/set_currency", { currency: select.value }, function(response) {
          location.reload();
        }, function(error) {
          MyStorage.message(error);
        });
      });
    });
    const languageSelector = document.querySelector(".js-language-selector");
    if (languageSelector) {
      Promise.resolve().then(() => (init_tomselect(), tomselect_exports)).then((module) => {
        if (typeof module.default === "function") {
          module.default();
        } else {
          console.error("TomSelect module does not export a default function");
        }
      }).catch((err) => {
        console.error("Failed to load language selector:", err);
      });
    }
    if (document.querySelector("form[data-fb-api]")) {
      API._apiForm();
    }
    ;
    if (document.querySelector("a[data-fb-api]")) {
      API._apiLink();
    }
  });
})();
//# sourceMappingURL=huraga.js.map
