var arrSlice = Array.prototype.slice;
var hasProp = Object.prototype.hasOwnProperty;

var defaultOptions = {
    collapse: false,
    encode: {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;',
    },
    encodeDelimiters: ['{{{', '}}}'],
    escape: [],
    tokenRE: '({{2,3})([^{][\\s\\S]*?[^}])(}{2,3})',
};

var defaultTags = {
    raw: ['{{', '}}'],
    encoded: ['{{{', '}}}']
};

function each(collection, iteratee, thisArg) {
    if (collection) {
        if (typeof collection.length !== 'undefined') {
            for (var i = 0, len = collection.length; i < len; i++) {
                if (iteratee.call(thisArg, collection[i], i, collection) === false) {
                    return;
                }
            }
        } else {
            for (var prop in collection) {
                if (hasProp.call(collection, prop)) {
                    if (iteratee.call(thisArg, collection[prop], prop, collection) === false) {
                        return;
                    }
                }
            }
        }
    }
}

function encodeChars(str, encode) {
    for (var x in encode) {
        if (encode.hasOwnProperty(x)) {
            str = str.replace(new RegExp('\\' + x, 'g'), encode[x]);
        }
    }
    return str;
}

function escapeChars(str, escape) {
    for (var i = 0, len = escape.length; i < len; i++) {
        str = str.replace(new RegExp('(^|[^\\\\])(' + escape[i] + ')', 'g'), "$1\\$2");
    }
    return str;
}

function extend() {
    var ret = arguments[0];

    each(arrSlice.call(arguments, 1), function (ext) {
        each(ext, function (val, key) {
            if (typeof val !== 'undefined') {
                ret[key] = val;
            }
        });
    }, this);

    return ret;
}

function getPropertySafe(key, data) {
    return key.split('.').reduce(function index(obj, i) {
        return obj && obj[i]
    }, data);
}


// The high-level tokenizer is made as prefixLexer + options.tokenRE + suffixLexer
var prefixLexer = '^([\\s\\S]*?)';
var suffixLexer = '([\\s\\S]*)$';
var actionRE = new RegExp(/^\s*([#/]?)([^}\s]+)\s*([\s\S]*?)$/);
// Regex for splitting action parameters
var splitter = new RegExp(/\s/);
// Regex for the if-action parameter to check for negation
var negateRE = new RegExp(/^(!?)(.*)$/);

/**
 * Convert a string to a stream of tokens.
 *
 * @param {RegExp} tokenizer - The high level tokenizer
 * @param {string} string - The string to lex
 * @param {Object} options - Configuration options
 *
 * @returns {Array} tokens - The stream of tokens as an array
 **/
function lex(tokenizer, string, options) {
    // The token stream
    var tokens = [];

    // Map from action names to token generators.
    var actionLexers = {
        each: makeEach,
        for: makeFor,
        if: makeIf,
    };

    /**
     * Add a token to the stream.
     *
     * @param {string} name      - The name of the token (its type)
     * @param {string} value     - The value of the token
     * @param {Object} [options] - An object containing token specific parameters
     **/
    function makeToken(name, value, options) {
        options = options || {};
        tokens.push(extend({}, {
            name: name,
            value: value
        }, options));
    }

    /**
     * Make an if-action token
     *
     * @param predicate - The predicate of the if
     */
    function makeIf(predicate) {
        var negated = predicate.match(negateRE);
        makeToken('if', negated[2], {negated: (negated[1] === '!')});
    }

    /**
     * Make a for-action token
     *
     * @param {number} count        - The number of times to iterate over the collection.
     * @param {Object} [collection] - The collection to be iterated over
     */
    function makeFor() {
        var args = arguments;
        var collection;
        var count;

        // if the first variable is not a number,
        // then assume it is a collection and default to the whole length
        if (isNaN(args[0])) {
            collection = args[0];
            count = collection.length;
        } else {
            collection = args[1];
            count = parseInt(args[0]);
        }
        makeToken('for', collection, {count: count});
    }

    /**
     * Make an each-action token
     *
     * @param {string} collection - The name of the collection to be iterated over
     */
    function makeEach(collection) {
        makeToken('each', collection);
    }

    /**
     * Apply a regexp to a string then apply a handler to the match results if it matched,
     * and to the original string if it did not.
     *
     * @param {string} text
     * @param {RegExp} matcher
     * @param {Function} handler - The function to apply to the results of the match
     *
     * @returns {*} The result of the handler
     */
    function doMatch(text, matcher, handler) {
        var parameters = text.match(matcher) || [text];
        return handler.apply({}, parameters);
    }

    /**
     * Handle the results of a single match attempt of the tokenizer.
     *
     * @param {string} all    - The entire string that was submitted to the regexp
     * @param {string} prefix - Any text preceding the first token
     * @param {string} openDelimiter - The opening delimiter of the first token
     * @param {string} token  - The first token found
     * @param {string} closeDelimiter - The closing delimiter of the first token
     * @param {string} suffix - Any text following the first token found
     *
     * @returns {string} - The suffix (if exists), or undefined if no match.
     */
    function handleMatchResult(all, prefix, openDelimiter, token, closeDelimiter, suffix) {
        if (!token) {
            // If there is no token, grab everything and make a text token with it.
            // Return out so you don't continue lexing.
            makeToken('text', all);
            return;
        }

        if (prefix) {
            makeToken('text', prefix);
        }
	
        /**
         * Interpret a single action and add it to the token stream.
         *
         * @param {string} original    - The entire contents of the {{}} (unused)
         * @param {string} openOrClose - The leading #, /, or nothing as appropriate
         * @param {string} name        - The name of the action
         * @param {string} parameters  - Any parameters which are part of the action
         */
        function lexAction(original, openOrClose, name, parameters) {
            parameters = parameters || [];

            if (openOrClose === '#') {
		var actionLexer = actionLexers[name];
		if (typeof actionLexer === 'function') {
                    actionLexer.apply({}, parameters.split(splitter));
		}
		return;
            }

            if (openOrClose === '/') {
		makeToken('end', name);
		return;
            }
	    
            // Default the token name to empty string if the interpolate key format is invalid
            if (typeof name === 'undefined') {
		name = '';
            }
	    
            // Whitespace is to be ignored in interpolation names.
            name.replace(/[\s]/g, '');
            makeToken('interpolate', name, {
		encode: ((openDelimiter == options.encodeDelimiters[0])
			 && (closeDelimiter == options.encodeDelimiters[1])),
		original: openDelimiter + original + closeDelimiter,
            });
	}

        doMatch(token, actionRE, lexAction);
        return suffix;
    }

    // iterate over the string, pulling off leading text and the first token until there is
    // nothing left.
    while (string) {
        string = doMatch(string, tokenizer, handleMatchResult);
    }

    return tokens;
}

/**
 * Parse a template string in reference to a supplied data object.
 *
 * @param {string} string  - The string to parse
 * @param {Object} data    - The data object
 * @param {Object} options - Configuration options
 *
 * @returns {string} The interpolated string
 **/
function parse(string, data, options) {
    lexRE = new RegExp(prefixLexer + options.tokenRE + suffixLexer);
    return collapse(parseString(string, data));

    /**
     * Optionally removes the newlines from the parsed string
     *
     * @param str {string} - The string to remove the new lines from.
     *
     * @returns {string}   - The string after the new lines have been removed.
     */
    function collapse(str) {
        var newlineRegExp = new RegExp(/[\t\r\n ]+/g);
        return options.collapse ? str.replace(newlineRegExp, ' ') : str;
    }

    /**
     * Parse a string relative to a data object.
     *
     * @param {string} string - The string to parse
     * @param (Object} data   - The data object
     *
     * @returns {string} The parsed string
     **/
    function parseString(string, data) {
        return parseTokens(lex(lexRE, string, options), data);
    }

    /**
     * Parse a stream of tokens relative to a data object. Parsing will continue either until
     * an end token for the specified enclosure is reached, or there are no more tokens.
     *
     * @param {Array} tokens       - The stream of tokens
     * @param {Object} [data]      - The data object
     * @param {string} [enclosure] - The enclosing action, if there is one
     * @param {boolean} [noResult] - Don't return any text, just consume tokens
     *
     * @returns {string} The parsed stream as a string
     */
    function parseTokens(tokens, data, enclosure, noResult) {
        /**
         * Look up a the key from the current token in the data object and
         * parse the result and append it to the the current parse result.
         *
         * @returns {boolean} Whether to stop parsing
         */
        function interpolate() {
            if (noResult) {
                return false;
            }

            var interpolated = getPropertySafe(token.value, data);
            var type = typeof interpolated;
            if (type === 'undefined') {
                if (options.removeUnmatched) {
                    interpolated = '';
                } else {
                    interpolated = token.original;
                }
                result += interpolated;
                return false;
            } else if (type === 'string') {
                interpolated = parseString(interpolated, data);
            } else {
                interpolated = '' + interpolated;
            }

            if (token.encode) {
                interpolated = encodeChars(interpolated, options.encode);
            }

            interpolated = escapeChars(interpolated, options.escape);

            result += interpolated;
            return false;
        }

        /**
         * Evaluate a conditional expression. The consequent will be
         * parsed even if the predicate is false since the tokens need to
         * be consumed, but multiple interpolation can be stopped. If the predicate is true,
         * the parsed consequent will be appended to the current parse result.
         *
         * @returns {boolean} Whether to stop parsing
         */
        function conditionalize() {
            var test = getPropertySafe(token.value, data);
            var noOutput = noResult || (token.negated && test) || (!token.negated && !test);
            result += parseTokens(tokens, data, token.name, noOutput);
            return false;
        }

        /**
         * Perform an end by signaling the end of parsing if it matches the enclosure and
         * ignoring it otherwise.
         *
         * @returns {boolean} Whether to stop parsing
         */
        function end() {
            return token.value === enclosure;
        }

        /**
         * Perform repeated interpolation of the statement inside a for loop.
         *
         * @returns {boolean} Whether to stop parsing
         */
        function iterate() {
            var forTokens = findLoopBody(token.name);
            if (noResult) {
                return false;
            }

            var list = getPropertySafe(token.value, data);
            if (list) {
                var bound = list.length;
                if (token.count) {
                    bound = Math.min(bound, token.count);
                }

                for (var i = 0; i < bound; i++) {
                    var loopData = extend({}, data);
                    loopData['@index'] = '' + i;
                    loopData['@value'] = list[i];
                    if (typeof list[i] === 'object') {
                        extend(loopData, list[i]);
                    }
                    result += parseTokens(extend([], forTokens), loopData);
                }
            }

            return false;
        }

        /**
         * Perform repeated interpolation of the statement inside an each loop.
         *
         * @returns {boolean} Whether to stop parsing
         */
        function map() {
            var eachTokens = findLoopBody(token.name);
            if (noResult) {
                return false;
            }

            var list = getPropertySafe(token.value, data);
            for (var key in list) {
                if (list.hasOwnProperty(key)) {
                    var loopData = extend({}, data);
                    loopData['@key'] = key;
                    var value = loopData['@value'] = list[key];
                    if (typeof value === 'object') {
                        extend(loopData, value);
                    }
                    result += parseTokens(extend([], eachTokens), loopData);
                }
            }

            return false;
        }

        /**
         * Remove the body of a loop from the token stream and return it as its own token stream.
         *
         * @param {string} loop      - What type of loop this is (used to match the end token)
         * @param {boolean} [nested] - Whether this is a nested loop, in which case, the start
         *                             and end tokens should be included in the returned stream
         *
         * @returns {Array} The body of the for loop
         **/
        function findLoopBody(loop, nested) {
            var savedTokens = [];
            var token;
            while (token = tokens.splice(0, 1)[0]) {
                if (token.name === 'end') {
                    if (token.value === loop) {
                        if (nested) {
                            savedTokens.push(token);
                        }
                        return savedTokens;
                    }
                }

                savedTokens.push(token);

                if ((token.name === 'for') || (token.name === 'each')) {
                    savedTokens.push.apply(savedTokens, findLoopBody(token.name, true));
                    continue;
                }
            }

            return [];
        }

        /**
         * Append the value of the current token to the parse result.
         * @returns {boolean} Whether to stop parsing
         */
        function append() {
            if (!noResult) {
                result += token.value;
            }
            return false;
        }

        var result = '';
        var token;
        var actions = {
            each: map,
            end: end,
            for: iterate,
            interpolate: interpolate,
            if: conditionalize,
            text: append,
        };


        while ((token = tokens.splice(0, 1)[0]) && Object.keys(token).length) {
            if (actions[token.name]()) {
                return result;
            }
        }

        return result;
    }
}


/**
 * Can be used in two ways:
 *   (1) new Easybars(options).compile(template, components)(data)
 *   (2) Easybars(template, data, options)
 */
function Easybars() {
    var args = arguments;
    if (this instanceof Easybars) {
        var _options = args[0] || {};
        var options = extend({}, defaultOptions, _options);
        options.tags = extend({}, defaultTags, _options.tags);

        this.compile = function (templateString) {
            return function (data) {
                return parse(templateString, data, options);
            };
        };

    } else {
        return new Easybars(args[2]).compile(args[0], args[3])(args[1]);
    }
}

module.exports = Easybars;
