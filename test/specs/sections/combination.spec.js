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

    // This functionality is not yet supported. It will error if you try.
    //     The problem is that providing the correct scope for variables within the inner block is really hard.
    //
    // xdescribe('nested each', function (expect) {
    //     var output = Easybars('{{#each fruits}}{{name}}:{{#each colors}}{{@value}},{{/each}}{{/each}}', data);
    //     expect(output).toBe('apple:red,green,banana:yellow,brown,kiwi:green,');
    // });
    //
    // xdescribe('nested for', function (expect) {
    //     var output = Easybars('{{#for 2 fruits}}{{name}}:{{#for 1 colors}}{{@value}},{{/for}}{{/for}}', data);
    //     expect(output).toBe('apple:red,banana:yellow,');
    // });

    describe('nested if', function (expect) {
        var output = Easybars('{{#if go}}{{#if fruits}}hello{{/if}}{{/if}}', data);
        expect(output).toBe('hello');
    });

    xdescribe('it\'s complicated', function (expect) {
        var output = Easybars('{{#if go}}{{#component foo}}{{#for 2 fruits}} {{#component foo}} {{name}}:{{#each descriptors}}{{type}} {{#component foo}},{{/each}}{{/for}}{{/if}}', data, null, components);
        expect(output).toBe('00 01 apple:sweet 04,juicy 05, 02 banana:sweet 06,mushy 07,');
    });

});
