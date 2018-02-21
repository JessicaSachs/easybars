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
    return str.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
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
        var sectionTagEnd = tags.section[2];
        var sectionTagEndEscaped = escapeRegExp(sectionTagEnd);
        var matchOpenTag = '(' + escapeRegExp(encodedTagStart) + '|' + escapeRegExp(tagOpen) + ')';
        var matchCloseTag = '(?:' + escapeRegExp(encodedTagEnd) + '|' + escapeRegExp(tagClose) + ')';
        var complexSectionMatcher = sectionTagOpenStartEscaped + '(([\\w]+) .+)' + '(?:' + escapeRegExp(sectionTagCloseStart) + '\\2' + sectionTagEndEscaped + ')+';
        var simpleSectionMatcher = sectionTagOpenStartEscaped + '(([\\w]+) .+?)' + sectionTagEndEscaped;
        var findTags = new RegExp(complexSectionMatcher + '|' + simpleSectionMatcher + '|' + matchOpenTag + '\\s*(@?[\\w\\.]+)\\s*' + matchCloseTag, 'g');

        this.compile = function (templateString, components) {
            components = components || {};

            var template = [];
            var sections = [];
            var varRefs = {};

            var found = templateString.split(findTags);

            for (var i = 0, len = found.length; i < len; i++) {
                var record = getRecordModel(found, i, encodedTagStart);
                var n;

                if (record.toTemplate && record.value) {
                    if (record.isContent) {
                        n = template.push(record.value);
                    } else {
                        if (options.removeUnmatched) {
                            n = template.push('');
                        } else {
                            if (record.isVarName) {
                                if (record.encode) {
                                    n = template.push(encodedTagStart + record.value + encodedTagEnd);
                                } else {
                                    n = template.push(tagOpen + record.value + tagClose);
                                }
                            } else {
                                n = template.push(sectionTagOpenStart + record.value + sectionTagCloseStart + record.sectionType + sectionTagEnd);
                            }
                        }
                    }

                    if (record.ref) {
                        if (!Array.isArray(varRefs[record.ref])) {
                            varRefs[record.ref] = [];
                        }
                        varRefs[record.ref].push({
                            index: n - 1,
                            encode: !!record.encode,
                        });
                    }

                    if (record.sectionType) {
                        sections.push({
                            index: n - 1,
                            type: record.sectionType,
                            value: record.value,
                        });
                    }
                }
            }

            function replaceVars(data) {
                Object.keys(varRefs).forEach(function (key) {
                    var refs = varRefs[key];
                    var value = getPropertySafe(key, data);
                    if (typeof value !== 'undefined') {
                        each(refs, function (ref) {
                            if (ref.encode) {
                                template[ref.index] = escapeChars(encodeChars(toString(value), options.encode), options.escape);
                            } else {
                                template[ref.index] = escapeChars(toString(value), options.escape);
                            }
                        });
                    }
                });
            }

            function addSectionsToTemplate(section, terms, body, data) {
                var sectionType = section.type;
                var sectionTemplate = [];

                if (sectionType === 'each') {
                    var value = getPropertySafe(terms.pop(), data);
                    if (typeof value === 'object') {
                        for (var x in value) {
                            if (value.hasOwnProperty(x)) {
                                var sectionData = value[x];
                                if (typeof sectionData === 'object') {
                                    sectionData['@key'] = x;
                                } else {
                                    sectionData = {
                                        '@key': x,
                                        '@value': sectionData,
                                    };
                                }
                                var sectionResult = new Easybars(options).compile(body, components)(sectionData);
                                sectionTemplate.push(sectionResult);
                            }
                        }
                    }

                } else if (sectionType === 'if') {
                    var value = getPropertySafe(terms.pop(), data);
                    if (value) {
                        var sectionResult = new Easybars(options).compile(body, components)(data);
                        sectionTemplate.push(sectionResult);
                    }

                } else if (sectionType === 'for') {
                    terms.shift();
                    var sectionData = data[terms[1]] || [];
                    var num = parseInt(terms[0], 10) || sectionData.length || 0;
                    for (var t = 0; t < num; t++) {
                        var sectionDataThis = sectionData[t];
                        var sectionDataThisType = typeof sectionDataThis;
                        if (sectionDataThisType !== 'undefined') {
                            if (sectionDataThisType === 'object') {
                                sectionDataThis['@index'] = t;
                            } else {
                                sectionDataThis = {
                                    '@index': t,
                                    '@value': sectionDataThis,
                                };
                            }
                            var sectionResult = new Easybars(options).compile(body, components)(sectionDataThis);
                            sectionTemplate.push(sectionResult);
                        }
                    }

                } else if (sectionType === 'component') {
                    var component = (terms[1] || '').split(':');
                    var body = getPropertySafe(component[0], components);
                    var sectionData = getPropertySafe(component[1] || component[0], data);
                    if (body && sectionData) {
                        var sectionResult = new Easybars(options).compile(body, components)(sectionData);
                        sectionTemplate.push(sectionResult);
                    }
                }

                template[section.index] = sectionTemplate.join('');
            }

            return function (data) {
                replaceVars(data);
                for (var s = 0, sLen = sections.length; s < sLen; s++) {
                    var section = sections[s];
                    var command = section.value.split(sectionTagEnd);
                    var commandTerms = command.shift().split(' ');
                    var commandBody = command.join(sectionTagEnd);
                    addSectionsToTemplate(section, commandTerms, commandBody, data);
                }
                var output = template.join('');
                return options.collapse ? output.replace(/[\s\t\r\n\f]+/g, ' ') : output;
            };
        };

    } else {
        return new Easybars(args[2]).compile(args[0], args[3])(args[1]);
    }
}

module.exports = Easybars;
