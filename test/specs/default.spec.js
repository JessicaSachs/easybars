var Easybars = require('../../index');

describe('with default settings', function () {

    var easyDefault = new Easybars();

    describe('spaces within tags are ignored, line breaks are preserved', function (expect) {
        var render = easyDefault.compile('<div class="{{foo}}">{{  \n bar  }}   foo\n{{{num}}}</div>');
        var output = render({ foo: 'hello', bar: 'world', num: 0 });
        expect(output).toBe('<div class="hello">world   foo\n0</div>');
    });

    describe('only valid tags are replaced, can use dot notation', function (expect) {
        var render = easyDefault.compile('<div class="{{{{foo}}}}">{{zoo.animal.zebra}} {foo} {{foo}}</div>');
        var output = render({ foo: 'hello', zoo: { animal: { zebra: 2, lion: 1 } } });
        expect(output).toBe('<div class="{hello}">2 {foo} hello</div>');
    });

    describe('token parsing inserted strings', function() {
        var tokens = [
            '{{}}',
            '{{ }}',
            '{{    }}',
            '{{  +0  }}',
            '{{  😂  }}',
            '{{  😂  1  2  }}'
        ];

        tokens.forEach(function (token) {
            describe('when an inserted string contains ' + token, function (expect) {
                var str = 'foo {{key}} baz';
                var d = { key: 'hello ' + token + ' world' };
                var output = Easybars(str, d);
                var expected = 'foo hello ' + token + ' world baz';
                expect(output).toBe(expected);
            });
        });
    });

    describe('html chars are encoded when special tag is used', function (expect) {
        var render = easyDefault.compile('<div class="{{{foo}}}">{{bar}} {{elem}}</div>');
        var output = render({ foo: '<>&<>', bar: '"!@#$%^*()-+=', elem: '<a href="#">link</a>' });
        expect(output).toBe('<div class="&lt;&gt;&amp;&lt;&gt;">"!@#$%^*()-+= <a href="#">link</a></div>');
    });

    describe('leaves unmatched variables unchanged in the template', function (expect) {
        var render = easyDefault.compile('This {{{qualifier}} {{{var1}}} {{var2}} should still be {{where}}');
        var output = render({ qualifier: 'amazing', where: 'here' });
        expect(output).toBe('This amazing {{{var1}}} {{var2}} should still be here');
    });

    describe('works as just a one-off method', function (expect) {
        expect(Easybars('{{name}} says hello \n{{name}}!', { name: 'Bob' }, { collapse: true })).toBe('Bob says hello Bob!');
    });

    describe('handles circular objects', function (expect) {
        var render = easyDefault.compile('<div>{{farmAnimal}} {{undefinedProperty}}</div>');
        var dataObject = { farmAnimal: 'cat' };
        dataObject.circularReference = dataObject;
        var output = render(dataObject);
        expect(output).toBe('<div>cat {{undefinedProperty}}</div>');
    });
});
