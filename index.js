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
const tokenRE  = new RegExp(/^(.*?){{(.*?)}}(.*)$/s);
// Regex for interpreting action tokens
const actionRE = new RegExp(/^([#\/]?)(\S+)\s*(.*)$/);
// Regex for splitting action parameters
const splitter = new RegExp(/\s/);
// Regex for the if-action parameter to check for negation
const negateRE = new RegExp(/^(!?)(.*)$/);

//////////////////////////////////////////////////////////////////////
// Convert a string to a stream of tokens.
//
// param: string  The string to lex
//
// return: The stream of tokens as an array
////
function lex(string) {
    // The token stream
    var tokens = [];

    //////////////////////////////////////////////////////////////////
    // Add a token to the stream.
    //
    // param:  name     The name of the token (its type)
    // param:  value    The value of the token
    // oparam: options  A map of token specific parameters
    ////
    function makeToken(name, value, options) {
        options = options || {};
        tokens.push(extend({}, {
            name: name,
            value: value
        }, options));
    }

    //////////////////////////////////////////////////////////////////
    // Make an if-action token
    //
    // param: predicate  The predicate of the if
    ////
    function makeIf(predicate) {
	var negated = predicate.match(negateRE);
	makeToken('if', negated[2], { negated: (negated[1] === '!') });
    }

    //////////////////////////////////////////////////////////////////
    // Make a for-action token
    //
    // oparam: count       The iteration count
    // param:  collection  The collection over which to iterate
    ////
    function makeFor(count, collection) {
	if (isNan(count)) {
	    makeToken('for', count);
	    return;
	}

        makeToken('for', name, { count: parseInt(count) });
    }

    ////
    // Map from action names to token generators.
    ////
    var actionLexers = {
	if: makeIf,
        for: makeFor,
    };

    //////////////////////////////////////////////////////////////////
    // Apply a regexp to a string then apply a handler to the match results if it matched,
    // and to the original string if it did not.
    //
    // param: text     The string
    // param: matcher  The regexp
    // param: handler  The function to apply to the results of the match
    //
    // returns: The result of the handler
    ////
    function doMatch(text, matcher, handler) {
	return handler.apply(null, text.match(matcher) || [text]);
    }

    //////////////////////////////////////////////////////////////////
    // Interpret a single action which was delimited by {{ and }} and add it to the token stream.
    //
    // param: action       The entire contents of the {{}} (unused)
    // param: openOrClose  The leading #, /, or nothing as appropriate
    // param: name         The name of the action
    // param: parameters   Any parameters which are part of the action
    ////
    function lexAction(action, openOrClose, name, parameters) {
	if (openOrClose === '#') {
	    actionLexer = actionLexers[name];
	    if (typeof actionLexer === 'function') {
		actionLexer.apply(null, (parameters ? parameters.split(splitter) : []));
	    }
	    return;
	}

	if (openOrClose === '/') {
	    makeToken('end', name);
	    return;
	}

	makeToken('interpolate', name);
    }

    //////////////////////////////////////////////////////////////////
    // Handle the results of a single match attempt of the tokenizer.
    //
    // param: all     The entire string that was submitted to the regexp
    // param: prefix  Any text preceding the first token
    // param: token   The first token found
    // param: suffix  Any text following the first token found
    //
    // returns: The suffix
    ////
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

function parseTokens(tokens, data) {
    // we use op to ensure the end tag matches the open tag we're operating on.
    var op = arguments[2];
    var result = '';
    var token;
    while ((token = tokens.splice(0, 1)[0]) && Object.keys(token).length) {
        var action = token.name;
        var value = token.value;

        if (action === 'interpolate') {
            var interpolatedVal = getPropertySafe(value, data);
            result += interpolatedVal || '{{' + value + '}}';
            continue;
        } 

        if (action === 'if') {
            var consequent = parseTokens(tokens, data, action);
            var test = getPropertySafe(value, data);
            var negated = token.negated;

            var truthyNotIf = negated && !test;
            var truthyIf = !negated && test;

            if (truthyNotIf || truthyIf) {
                result += consequent;
            }
            continue;
        }

        if (action === 'end') {
            if (value === op) {
                return result;
            }
            continue;
        }
        
        result += value;
    }
    return result;
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
            var tokens = lex(templateString);
            return function (data) {
                return parseTokens(tokens, data);
            };
        };

    } else {
        return new Easybars(args[2]).compile(args[0], args[3])(args[1]);
    }
}

module.exports = Easybars;
