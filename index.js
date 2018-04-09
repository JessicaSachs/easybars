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
    escape: [],
};

var defaultTags = {
    raw: ['{{','}}'],
    encoded: ['{{{','}}}'],
    section: ['{{#','{{/','}}'],
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

function escapeRegExp(str) {
    return str.replace(/[\/\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
}

function extend() {
    var ret = arguments[0];

    each(arrSlice.call(arguments, 1), function(ext) {
        each(ext, function(val, key) {
            if (typeof val !== 'undefined') {
                ret[key] = val;
            }
        });
    }, this);

    return ret;
}

function getPropertySafe(key, data) {
    return key.split('.').reduce(function index(obj,i) {return obj && obj[i]}, data);
}

function toString(value) {
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return '' + value;
}

function getRecordModel(found, index, encodedTagStart) {
    /** record array looks like this
    [
        0: content
        1: complex section tag contents
        2: complex section tag name
        3: simple section tag contents
        4: simple section tag name
        5: tag opener
        6: variable name
        7: content
        ...
    ]
    **/
    var record = {};
    var val = found[index];

    switch (index % 7) {
        case 0:
            record.toTemplate = true;
            record.isContent = true;
            record.value = val;
            break;
        case 1:
            record.toTemplate = true;
            record.value = val;
            record.sectionType = found[index + 1];
            break;
        case 2:
            break;
        case 3:
            record.toTemplate = true;
            record.value = val;
            record.sectionType = found[index + 1];
            break;
        case 4:
            break;
        case 5:
            break;
        case 6:
            record.toTemplate = true;
            record.isVarName = true;
            record.value = val;
            record.ref = val;
            record.encode = found[index - 1] === encodedTagStart;
    }

    return record;
}

// The high-level tokenizer
var tokenRE  = new RegExp(/^(.*?){{(.*?)}}(.*)$[\s\S]*/);
// Regex for interpreting action tokens
var actionRE = new RegExp(/^([#\/]?)(\S+)\s*(.*)$/);
// Regex for splitting action parameters
var splitter = new RegExp(/\s/);
// Regex for the if-action parameter to check for negation
var negateRE = new RegExp(/^(!?)(.*)$/);


/**
 * Convert a string to a stream of tokens.
 * @param {string} string - The string to lex
 * @returns {Array} tokens - The stream of tokens as an array
 */
function lex(string) {
    // The token stream
    var tokens = [];

    // Map from action names to token generators.
    var actionLexers = {
        for: makeFor,
        if: makeIf,
    };

    /**
     * Add a token to the stream.
     * @param {string} name - The name of the token (its type)
     * @param {string} value - The value of the token
     * @param {Object} [options] - An object containing token specific parameters
     */
    function makeToken(name, value, options) {
        options = options || {};
        tokens.push(extend({}, {
            name: name,
            value: value
        }, options));
    }

    /**
     * Make an if-action token
     * @param predicate - The predicate of the if
     */
    function makeIf(predicate) {
        var negated = predicate.match(negateRE);
        makeToken('if', negated[2], { negated: (negated[1] === '!') });
    }

    /**
     * Make a for-action token
     * @oparam {number} count - The number of times to iterate over the collection.
     * @oparam {Object} collection - The collection to be iterated over
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
        makeToken('for', collection, { count: count });
    }

    /**
     * Apply a regexp to a string then apply a handler to the match results if it matched,
     * and to the original string if it did not.
     * @param {string} text
     * @param {RegExp} matcher
     * @param {Function} handler - The function to apply to the results of the match
     * @returns {*} The result of the handler
     */
    function doMatch(text, matcher, handler) {
        var parameters = text.match(matcher) || [text];
        return handler.apply({}, parameters);
    }

    /**
     * Interpret a single action which was delimited by {{ and }} and add it to the token stream.
     * @param action - The entire contents of the {{}} (unused)
     * @param openOrClose - The leading #, /, or nothing as appropriate
     * @param name - The name of the action
     * @param parameters - Any parameters which are part of the action
     */
    function lexAction(action, openOrClose, name, parameters) {
        parameters = parameters || [];
        if (openOrClose === '#') {
            actionLexer = actionLexers[name];
            if (typeof actionLexer === 'function') {
                actionLexer.apply({}, parameters.split(splitter));
            }
            return;
        }

        if (openOrClose === '/') {
            makeToken('end', name);
            return;
        }

        makeToken('interpolate', name);
    }

    /**
     * Handle the results of a single match attempt of the tokenizer.
     * @param all - The entire string that was submitted to the regexp
     * @param prefix - Any text preceding the first token
     * @param {Object} token - The first token found
     * @param {string} suffix - Any text following the first token found
     * @returns {string} - The suffix
     */
    function handleMatchResult(all, prefix, token, suffix) {
        if (token) {
            if (prefix) {
                makeToken('text', prefix);
            }
            doMatch(token, actionRE, lexAction);
        } else {
            makeToken('text', all);
        }
        return suffix;
    }

    // iterate over the string, pulling off leading text and the first token untl there is
    // nothing left.
    while (string) {
	    string = doMatch(string, tokenRE, handleMatchResult);
    }

    return tokens;
}

/**
 * Parse a stream of tokens relative to a data object. Parsing will continue either until
 * an end token for the specified enclosure is reached, or there are no more tokens.
 *
 * @param {Array} tokens - The stream of tokens
 * @param {Object} [data] - The data object
 * @param {string} [enclosure] - The enclosing action, if there is one
 * @param {boolean} [noResult] - Don't return any text, just consume tokens
 *
 * @returns {string} The parsed stream as a string
 */
function parseTokens(tokens, data, enclosure, noResult) {
    /**
     * Look up a the key from the current token in the data object and
     * parse the result and append it to the the current parse result.
     * @returns {boolean} Whether to stop parsing
     */
    function interpolate() {
        var d = token.data || data;
        if (noResult) {
            return false;
        }

        var interpolated = getPropertySafe(token.value, d);
        if (interpolated && typeof interpolated === 'string') {
            interpolated = parse(interpolated, d);
        } else {
            interpolated = '{{' + token.value + '}}';
        }

        result += interpolated;
        return false;
    }

    /**
     * Evaluate a conditional expression. The consequent will be
     * parsed even if the predicate is false since the tokens need to
     * be consumed, but multiple interpolation can be stopped. If the predicate is true,
     * the parsed consequent will be appended to the current parse result.
     * @returns {boolean} Whether to stop parsing
     */
    function conditionalize() {
        var d = token.data || data;
        var test = getPropertySafe(token.value, d);
        var noOutput = noResult || (token.negated && test) || (!token.negated && !test);
        result += parseTokens(tokens, d, token.name, noOutput);
        return false;
    }

    /**
     * Perform an end by signaling the end of parsing if it matches the enclosure and
     * ignoring it otherwise.
     * @returns {boolean} Whether to stop parsing
     */
    function end() {
        return (token.value === enclosure);
    }

    /**
     * Perform repeated interpolation of the statement inside a for loop.
     *
     * @returns {boolean} Whether to stop parsing
     */
    function iterate() {
	var forTokens = findForLoopBody(tokens);
	if (noResult) {
	    return false;
	}

        var list  = getPropertySafe(token.value, data);
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

    /**
     * Remove the body of a for loop from the token stream and return it as its own token stream.
     *
     * @oparam {boolean} nested - Whether this is a nested loop, in which case, the for and end
     *                            tokens should be included in the returned stream
     *
     * @returns {Array} The body of the for loop
     **/
    function findForLoopBody(nested) {
	var savedTokens = [];
	var token;
	while (token = tokens.splice(0, 1)[0]) {
	    if (token.name === 'end') {
		if (token.value === 'for') {
		    if (nested) {
			savedTokens.push(token);
		    }
		    return savedTokens;
		}
		continue;
	    }

	    if (token.name === 'for') {
		savedTokens.push(token);
		savedTokens.push.apply(savedTokens, findForLoopBody(tokens, true));
		continue;
	    }

	    savedTokens.push(token);
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

/**
 * Parse a template string in reference to a supplied data object.
 * @param string - The string to parse
 * @param data - The data object
 * @returns {string} The interpolated string
 */
function parse(string, data) {
    return parseTokens(lex(string), data);
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
        var tags = extend({}, defaultTags, _options.tags);
        var tagOpen = tags.raw[0];
        var tagClose = tags.raw[1];
        var encodedTagStart = tags.encoded[0];
        var encodedTagEnd = tags.encoded[1];
        var sectionTagOpenStart = tags.section[0];
        var sectionTagOpenStartEscaped = escapeRegExp(sectionTagOpenStart);
        var sectionTagCloseStart = tags.section[1];
        var sectionTagCloseStartEscaped = escapeRegExp(sectionTagCloseStart);
        var sectionTagEnd = tags.section[2];
        var sectionTagEndEscaped = escapeRegExp(sectionTagEnd);
        var matchOpenTag = '(' + escapeRegExp(encodedTagStart) + '|' + escapeRegExp(tagOpen) + ')';
        var matchCloseTag = '(?:' + escapeRegExp(encodedTagEnd) + '|' + escapeRegExp(tagClose) + ')';
        var complexSectionMatcher = '(' + sectionTagOpenStartEscaped + '([\\w]+) .+)' + '(?:' + sectionTagCloseStartEscaped + '\\2' + sectionTagEndEscaped + ')+';
        var simpleSectionMatcher = sectionTagOpenStartEscaped + '(([\\w]+) .+?)' + sectionTagEndEscaped;
        var findTags = new RegExp(complexSectionMatcher + '|' + simpleSectionMatcher + '|' + matchOpenTag + '\\s*(@?[\\w\\.]+)\\s*' + matchCloseTag, 'g');

        this.compile = function (templateString, components) {
            return function (data) {
                return parse(templateString, data);
            };
        };

    } else {
        return new Easybars(args[2]).compile(args[0], args[3])(args[1]);
    }
}

module.exports = Easybars;
