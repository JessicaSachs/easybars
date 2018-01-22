var Easybars = require('../../index');

describe('with default settings', function () {

    var easyDefault = new Easybars();

    describe('spaces within tags are ignored, line breaks are preserved', function (expect) {
        var render = easyDefault.compile('<div class="{{foo}}">{{  \n bar  }}   foo\n</div>');
        var output = render({ foo: 'hello', bar: 'world' });
        expect(output).toBe('<div class="hello">world   foo\n</div>');
    });

    describe('only valid tags are replaced, can use dot notation', function (expect) {
        var render = easyDefault.compile('<div class="{{{{foo}}}}">{{zoo.animal.zebra}} {foo} {{foo}}</div>');
        var output = render({ foo: 'hello', zoo: { animal: { zebra: 2, lion: 1 } } });
        expect(output).toBe('<div class="{hello}">2 {foo} hello</div>');
    });

    describe('html chars are encoded when special tag is used', function (expect) {
        var render = easyDefault.compile('<div class="{{{foo}}}">{{bar}} {{elem}}</div>');
        var output = render({ foo: '<>&<>', bar: '"!@#$%^*()-+=', elem: '<a href="#">link</a>' });
        expect(output).toBe('<div class="&lt;&gt;&amp;&lt;&gt;">"!@#$%^*()-+= <a href="#">link</a></div>');
    });

    describe('works as just a one-off method', (expect) => {
        expect(Easybars('{{name}} says hello\n{{name}}!', { name: 'Bob' }, { collapse: true })).toBe('Bob says hello Bob!');
    });

});
