var Easybars = require('../../../index');

describe('using multiple sections at the same time', function () {

    var data = {
        go: true,
        fruits: [
            {
                name: 'apple',
                colors: ['red','green'],
                descriptors: [
                    { type: 'sweet', foo: { text: '04' } },
                    { type: 'juicy', foo: { text: '05' } },
                ],
                foo: { text: '01' },
            },
            {
                name: 'banana',
                colors: ['yellow', 'brown'],
                descriptors: [
                    { type: 'sweet', foo: { text: '06' } },
                    { type: 'mushy', foo: { text: '07' } },
                ],
                foo: { text: '02' },
            },
            {
                name: 'kiwi',
                colors: ['green'],
                descriptors: [
                    { type: 'tart', foo: { text: '08' } },
                ],
                foo: { text: '03' },
            },
        ],
        foo: {
            text: '00',
        },
        bar: {
            text: '11',
        },
	quux: 'quux: {{#if go}}{{foo.text}}{{/if}}'
    };

    var components = {
        foo: '{{text}}',
        bar: '{{text}}',
    };

    describe('multiple interpolation', function (expect) {
        var output = Easybars('{{quux}}', data);
        expect(output).toBe('quux: 00');
    });

    xdescribe('multiple component', function (expect) {
        var output = Easybars('{{#component foo}}-{{#component bar}}', data, null, components);
        expect(output).toBe('00-11');
    });

    describe('nested each', function (expect) {
        var output = Easybars('{{#each fruits}}{{name}}:{{#each colors}}{{@value}},{{/each}}{{/each}}', data);
        expect(output).toBe('apple:red,green,banana:yellow,brown,kiwi:green,');
    });

    describe('nested for', function (expect) {
        var output = Easybars('{{#for 2 fruits}}{{name}}:{{#for 1 colors}}{{@value}},{{/for}}{{/for}}', data);
        expect(output).toBe('apple:red,banana:yellow,');
    });

    describe('nested if', function (expect) {
        var output = Easybars('{{#if go}}{{#if fruits}}hello{{/if}}{{/if}}', data);
        expect(output).toBe('hello');
    });

    xdescribe('it\'s complicated', function (expect) {
        var output = Easybars('{{#if go}}{{#component foo}}{{#for 2 fruits}} {{#component foo}} {{name}}:{{#each descriptors}}{{type}} {{#component foo}},{{/each}}{{/for}}{{/if}}', data, null, components);
        expect(output).toBe('00 01 apple:sweet 04,juicy 05, 02 banana:sweet 06,mushy 07,');
    });

    describe('nested eaches and ifs with falsey conditionals', function (expect) {
        var nestedFruitData = {
            fruits: [
                {
                    color: 'red',
                    name: 'apple',
                },
                {
                    color: 'orange',
                    name: 'tangerine',
                },
                {
                    name: 'pear',
                },
                {
                    color: 'purple',
                    name: 'eggplant',
                }
            ],
        };

        var output = Easybars('{{#each fruits}}Fruit: {{#if color}}{{color}} {{/if}}{{name}}, {{/each}}', nestedFruitData);
        var expected = 'Fruit: red apple, Fruit: orange tangerine, Fruit: pear, Fruit: purple eggplant, ';
        expect(output).toBe(expected);
    });
});
