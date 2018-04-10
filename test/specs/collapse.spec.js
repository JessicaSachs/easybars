var Easybars = require('../../index.js');

describe('collapse', function() {
    describe('when true', function() {
        var templateData = {
            foo: {
                bar: 'BLAM',
            },
        };

        it('collapses the string when there are new lines', function(expect) {
            var str = 'foo\n\r\t      bar';
            var actual = new Easybars({ collapse: true }).compile(str)(templateData);
            expect(actual).toBe('foo bar');
        });

        it('trims spaces off of the end of strings', function(expect) {
            var str = 'x-{{foo.bar}}-x    ';
            var actual = new Easybars({ collapse: true }).compile(str)(templateData);
            expect(actual).toBe('x-BLAM-x ');
        });
    });
});