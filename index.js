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

function lex(str, tokens) {
    function makeToken(name, value, negated) {
        tokens.push({
            name: name,
            value: value,
            negated: negated
        });
    }

    var tokenParser = new RegExp(/^(.*?){{(.*?)}}(.*)$/s);
    while (str.match(tokenParser)) {
        var matches = str.match(tokenParser);
        var prefix = matches[1];
        var token = matches[2];
        var rest = matches[3];
        var str = rest;

        if (prefix) {
            makeToken('text', prefix);
        }

        if (!token) {
            continue;
        }

        var beginningParser = new RegExp(/^#(\S+)\s+(.*)$/);
        var beginningMatches = token.match(beginningParser);
        if (beginningMatches) {
            var action = beginningMatches[1];
            var value = beginningMatches[2];
            var negated = value.indexOf('!') !== -1; // if there is a !, then it is negated.

            if (negated) {
                value = value.replace(/!/g, '');
            }

            makeToken(action, value, negated);
            continue;
        }

        var endParser = new RegExp(/^\/(\S+)$/);
        var endMatches = token.match(endParser);
        if (endMatches) {
            var action = endMatches[1];
            makeToken('end', action);
            continue;

        }
        makeToken('interpolate', token);
    }
    if (str) {
        makeToken('text', str);
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
        var negated = token.negated;

        if (action === 'interpolate') {
            var interpolatedVal = getPropertySafe(value, data);
            result += interpolatedVal || '{{' + value + '}}';
            continue;
        } 
        
       if (action === 'if' && !negated) { // if
            var consequent = parseTokens(tokens, data, action);
            if (getPropertySafe(value, data)) {
                result += consequent;
            }
            continue;
        }
        
        if (action === 'if' && negated) { // not if
            var consequent = parseTokens(tokens, data, action);
            if (!getPropertySafe(value, data)) {
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
            var tokens = lex(templateString, []);
            return function (data) {
                return parseTokens(tokens, data);
            };
        };

    } else {
        return new Easybars(args[2]).compile(args[0], args[3])(args[1]);
    }
}

module.exports = Easybars;
