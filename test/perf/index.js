require('console.table');

var Easybars = require('../../index');
var Handlebars = require('handlebars');
var Mustache = require('mustache');
var resig = require('resig');

var expected = '<div class="moo"><a href="#">Cow</a> says moo</div>';
var templateEasy = '<div class="{{foo}}">{{bar}} says {{foo}}</div>';
var templateCurly = '<div class="{{foo}}">{{{bar}}} says {{foo}}</div>';
var conditional = '<div class="{{{foo}}}">{{#if bar}}{{bar}} says moo{{/if}}</div>'
var templateBrackets = '<div class="<%=foo%>"><%=bar%> says <%=foo%></div>';

var data = {
    foo: 'moo',
    bar: '<a href="#">Cow</a>',
};

var methods = {
    easybarsClass: function () {
        return new Easybars().compile(templateEasy)(data);
    },
    easybarsFn: function () {
        return Easybars(templateEasy, data);
    },
    handlebars: function () {
        return Handlebars.compile(templateCurly)(data);
    },
    mustache: function () {
        return Mustache.render(templateCurly, data);
    },
    resig: function () {
        return resig(templateBrackets, data);
    },
    easybarsClassConditional: function () {
        return new Easybars().compile(conditional)(data);
    },
    easybarsFnConditional: function () {
        return new Easybars().compile(conditional)(data);
    },
};


/* Benchmark */

var toTable = [];
var iterations = 10000;
var runs = 3;

function runOne(fn) {
    var startTime = Date.now();
    for (var i = 0; i < iterations; i++) {
        fn();
    }
    return Date.now() - startTime;
}

function runAvg(fn) {
    var results = [];
    for (var i = 0; i < runs; i++) {
        results.push(runOne(fn));
    }
    var sum = results.reduce(function(a, b) { return a + b; });
    var avg = sum / results.length;
    return avg;
}

for (var methodName in methods) {
    var fn = methods[methodName];
    var result = fn();
    if (result !== expected) {
        var msg = 'With "' + methodName + '" expected \n   ' + result + '\nto be\n   ' + expected + '\n';
        throw new Error(msg);
    }

    var avgTime = runAvg(fn);
    toTable.push({
        name: methodName,
        time: Math.round(avgTime),
    });
}

toTable.sort(function (a, b) {
    if (a.time > b.time) {
        return 1
    } else {
        return -1;
    }
});

console.table(toTable); //eslint-disable-line
