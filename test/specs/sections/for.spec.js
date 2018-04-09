var Easybars = require('../../../index');

describe('#for', function () {

    describe('iterates over an array with 1 element', function(expect) {
        var output = Easybars('<ul>{{#for 1 fruits}}<li>{{@value}} is {{@index}}</li>{{/for}}</ul>', { fruits: ['apple', 'banana', 'kiwi'] });
        expect(output).toBe('<ul><li>apple is 0</li></ul>');
    });

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
    
    describe('values are still encoded', function (expect) {
        var output = Easybars('<ul>{{#for 1 fruits}}<li>{{{enc}}}:{{not}}</li>{{/for}}</ul>', { fruits: [{ enc: '<', not: '<' }] });
        expect(output).toBe('<ul><li>&lt;:<</li></ul>');
    });
    
    describe('when no number is specified', function (expect) {
        var output = Easybars('{{#for fruits}}{{name}}, {{/for}}', { fruits: [{ name: 'apple', }, { name: 'orange' }]});
        expect(output).toBe('apple, orange, ');
    });
});
