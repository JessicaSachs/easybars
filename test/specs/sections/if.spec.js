var Easybars = require('../../../index');

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

    describe('matches with prefix', function(expect) {
        var output = Easybars('foo {{#if go}}<h3>Go!</h3>{{/if}}', { go: true });
        expect(output).toBe('foo <h3>Go!</h3>');
    });

    describe('doesn\'t match with prefix', function(expect) {
        var output = Easybars('foo\nbar\n{{#if !go}}<h3>Go!</h3>{{/if}}', { go: true });
        expect(output).toBe('foo\nbar\n');
    });

    describe('matches with suffix', function(expect) {
        var output = Easybars('{{#if go}}<h3>Go!</h3>{{/if}}foo\nbar', { go: true });
        expect(output).toBe('<h3>Go!</h3>foo\nbar');
    });

    describe('doesn\'t match with suffix', function(expect) {
        var output = Easybars('{{#if !go}}<h3>Go!</h3>{{/if}}foo\nbar', { go: true });
        expect(output).toBe('foo\nbar');
    });

    describe('matches with prefix and suffix', function(expect) {
        var output = Easybars('foo{{#if go}}<h3>Go!</h3>{{/if}}foo\nbar', { go: true });
        expect(output).toBe('foo<h3>Go!</h3>foo\nbar');
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

    describe('values are still encoded', function(expect) {
        var output = Easybars('{{#if go}}<h3>{{{enc}}}:{{not}}</h3>{{/if}}', { go: true, enc: '<', not: '<' });
        expect(output).toBe('<h3>&lt;:<</h3>');
    });

    describe('handles inverse', function(expect) {
        var tmp = '{{#if !go.home}}{{thing}}{{/if}}';
        var output = Easybars(tmp, { go: { home: false }, thing: 'backwards' });
        expect(output).toBe('backwards');
    });

    describe('handles sibling sections', function(expect) {
        var output, data = { go: true, food: 'bun' };

        output = Easybars('{{#if go}}-{{food}}-{{/if}}-{{#if go}}dog{{/if}}-{{#if go}}-{{food}}-{{/if}}', data);
        expect(output).toBe('-bun--dog--bun-', 1);

        output = Easybars('{{#if go}}-{{food}}-{{/if}}-{{#if go}}dog{{/if}}-{{#if !go}}-{{food}}-{{/if}}', data);
        expect(output).toBe('-bun--dog-', 2);

        output = Easybars('{{#if !go}}-{{food}}-{{/if}}-{{#if go}}dog{{/if}}-{{#if go}}-{{food}}-{{/if}}', data);
        expect(output).toBe('-dog--bun-', 3);

        output = Easybars('{{#if go}}-{{food}}-{{/if}}-{{#if !go}}dog{{/if}}-{{#if go}}-{{food}}-{{/if}}', data);
        expect(output).toBe('-bun----bun-', 4);

        output = Easybars('{{#if !go}}0{{food}}1{{/if}}2{{#if !go}}dog{{/if}}3{{#if !go}}4{{food}}5{{/if}}', data);
        expect(output).toBe('23', 5);

        output = Easybars('0{{#if go}}1{{#if go}}{{food}}{{/if}}2{{/if}}3{{#if go}}{{food}}{{/if}}4', data);
        expect(output).toBe('01bun23bun4', 6);

        output = Easybars('0{{#if go}}1{{/if}}3{{/if}}4', data);
        expect(output).toBe('0134', 7); // bogus closing tags are dropped
    });

});
