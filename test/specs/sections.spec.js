var Easybars = require('../../index');

describe('with sections', function () {

    var easyDefault = new Easybars();

    describe('#each', function () {

        describe('loops simple objects', function (expect) {
            var output = Easybars('<ul>{{#each fruits}}<li>{{@key}} is {{@value}}</li>{{/each}}</ul>', { fruits: { apple: 'red', banana: 'yellow' } });
            expect(output).toBe('<ul><li>apple is red</li><li>banana is yellow</li></ul>');
        });

        describe('loops nested objects', function (expect) {
            var render = easyDefault.compile('<div>{{first}}<ul>{{#each farm.animals}}<li>{{@key}} {{sound}}</li>{{/each}}</ul>{{last}}</div>');
            var output = render({
                first: '!',
                farm: {
                    animals: {
                        cow: {
                            sound: 'moo',
                        },
                        cat: {
                            sound: 'meow',
                        },
                        fox: {},
                    },
                    plants: {
                        corn: {
                            sound: 'ears?',
                        },
                    },
                },
                last: '!',
            });
            expect(output).toBe('<div>!<ul><li>cow moo</li><li>cat meow</li><li>fox {{sound}}</li></ul>!</div>');
        });

        describe('loops simple arrays', function (expect) {
            var render = easyDefault.compile('<div>{{first}}<ul>{{#each farm.animals}}<li>{{@value}} {{@key}}</li>{{/each}}</ul>{{last}}</div>');
            var output = render({
                first: '!',
                farm: {
                    animals: ['chicken','duck'],
                    plants: ['corn'],
                },
                last: '!',
            });
            expect(output).toBe('<div>!<ul><li>chicken 0</li><li>duck 1</li></ul>!</div>');
        });

        describe('loops arrays of objects', (expect) => {
            var output = Easybars('<ul>{{#each fruits}}<li>{{name}} is {{@key}}</li>{{/each}}</ul>', { fruits: [{ name: 'apple' }, { name: 'banana' }] });
            expect(output).toBe('<ul><li>apple is 0</li><li>banana is 1</li></ul>');
        });

    });

    describe('#for', function () {

        describe('iterates n times over simple array', function (expect) {
            var output = Easybars('<ul>{{#for 2 fruits}}<li>{{@value}} is {{@index}}</li>{{/for}}</ul>', { fruits: ['apple', 'banana', 'kiwi'] });
            expect(output).toBe('<ul><li>apple is 0</li><li>banana is 1</li></ul>');
        });

        describe('iterates n times over array of objects', function (expect) {
            var output = Easybars('<ul>{{#for 2 fruits}}<li>{{name}} is {{@index}}</li>{{/for}}</ul>', { fruits: [{ name: 'apple' }, { name: 'banana' }, { name: 'kiwi' }] });
            expect(output).toBe('<ul><li>apple is 0</li><li>banana is 1</li></ul>');
        });

        describe('iterates less than n times when data is unavailable', function (expect) {
            var output = Easybars('<ul>{{#for 5 fruits}}<li>{{name}} is {{@index}}</li>{{/for}}</ul>', { fruits: [{ name: 'apple' }, { name: 'banana' }] });
            expect(output).toBe('<ul><li>apple is 0</li><li>banana is 1</li></ul>');
        });

    });

    describe('#if', function () {

        describe('matches true', function (expect) {
            var output = Easybars('{{#if fruits}}<h3>Fruits</h3>{{/if}}', { fruits: true });
            expect(output).toBe('<h3>Fruits</h3>');
        });
        describe('matches 1', function (expect) {
            var output = Easybars('{{#if fruits}}<h3>Fruits</h3>{{/if}}', { fruits: 1 });
            expect(output).toBe('<h3>Fruits</h3>');
        });
        describe('matches 0.1', function (expect) {
            var output = Easybars('{{#if fruits}}<h3>Fruits</h3>{{/if}}', { fruits: 0.1 });
            expect(output).toBe('<h3>Fruits</h3>');
        });
        describe('matches empty array', function (expect) {
            var output = Easybars('{{#if fruits}}<h3>Fruits</h3>{{/if}}', { fruits: [] });
            expect(output).toBe('<h3>Fruits</h3>');
        });
        describe('matches empty object', function (expect) {
            var output = Easybars('{{#if fruits}}<h3>Fruits</h3>{{/if}}', { fruits: {} });
            expect(output).toBe('<h3>Fruits</h3>');
        });
        describe('matches string', function (expect) {
            var output = Easybars('{{#if fruits}}<h3>Fruits</h3>{{/if}}', { fruits: 'fruit' });
            expect(output).toBe('<h3>Fruits</h3>');
        });
        describe('matches deep key', function(expect) {
            var output = Easybars('{{#if tree.fruits}}<h3>Tree Fruits</h3>{{/if}}', { tree: {fruits: 'fruit'} });
            expect(output).toBe('<h3>Tree Fruits</h3>');
        });

        describe('doesn\'t match false', function (expect) {
            var output = Easybars('{{#if fruits}}<h3>Fruits</h3>{{/if}}', { fruits: false });
            expect(output).toBe('');
        });
        describe('doesn\'t match 0', function (expect) {
            var output = Easybars('{{#if fruits}}<h3>Fruits</h3>{{/if}}', { fruits: 0 });
            expect(output).toBe('');
        });
        describe('doesn\'t match 0.0', function (expect) {
            var output = Easybars('{{#if fruits}}<h3>Fruits</h3>{{/if}}', { fruits: 0.0 });
            expect(output).toBe('');
        });
        describe('doesn\'t match empty', function (expect) {
            var output = Easybars('{{#if fruits}}<h3>Fruits</h3>{{/if}}', { fruits: '' });
            expect(output).toBe('');
        });
        describe('doesn\'t match null', function (expect) {
            var output = Easybars('{{#if fruits}}<h3>Fruits</h3>{{/if}}', { fruits: null });
            expect(output).toBe('');
        });
        describe('doesn\'t match undefined', function (expect) {
            var output = Easybars('{{#if fruits}}<h3>Fruits</h3>{{/if}}', { });
            expect(output).toBe('');
        });
        describe('doesn\'t match missing deep key', function(expect) {
            var output = Easybars('{{#if tree.fruits}}<h3>Tree Fruits</h3>{{/if}}', { tree: {sap: 'sap'} });
            expect(output).toBe('');
        });
        describe('doesn\'t match missing root key', function(expect) {
            var output = Easybars('{{#if tree.fruits}}<h3>Tree Fruits</h3>{{/if}}', { basket: {fruits: 'fruit'} });
            expect(output).toBe('');
        });

        describe('provides entire context to subcontent', function(expect) {
            var output = Easybars('{{#if tree.fruits}}<h3>{{message}}, {{tree.fruits}}</h3>{{/if}}', { tree: {fruits: 'fruit'}, message: 'Hello' });
            expect(output).toBe('<h3>Hello, fruit</h3>');
        });
    });

});
