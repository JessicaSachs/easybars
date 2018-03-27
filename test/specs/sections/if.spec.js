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

});
