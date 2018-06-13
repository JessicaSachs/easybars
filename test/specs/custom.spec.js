var Easybars = require('../../index');

describe('with custom settings', function () {

    var easyDefault = new Easybars({
        collapse: true,
        encode: {
            '!': '0',
            '@': '0',
            '#': '0',
            '$': '0',
            '%': '0',
            '^': '0',
            '*': '0',
            '(': '0',
            ')': '0',
            '=': '0',
        },
        escape: ['"','8'],
        removeUnmatched: true
    });

    describe('use a custom token regex matcher', function(expect) {
        var easybars = new Easybars({
            tokenRE: new RegExp(/^([\s\S]*?)(\\"{{2,})([\s\S]*?)(}{2,}\\")([\s\S]*)$/),
        });
        var str = 'background-color: \"{{colorName}}\";';
        var data = { colorName: 'green' };
        var render = easybars.compile(str);
        var output = render(data);
        expect(output).toBe('background-color: green;');
    });

    describe('custom encodings and escaping work', function(expect) {
        var render = easyDefault.compile('<div class="{{{foo}}}">{{bar}} foo\n</div>');
        var output = render({ foo: 'hello!', bar: 'world' });
        expect(output).toBe('<div class="hello0">world foo </div>');
    });

    xdescribe('custom tags are respected, line breaks are compressed', function (expect) {
        var render = easyDefault.compile('<div class="<%=foo%>"><%=  \n bar  %>   foo\n</div>');
        var output = render({ foo: 'hello', bar: 'world' });
        expect(output).toBe('<div class="hello">world foo </div>');
    });

    describe('custom chars are encoded when special tag is used', function (expect) {
        var render = easyDefault.compile('<div class="{{{foo}}}">{{{bar}}} foo</div>');
        var output = render({ foo: '<>&', bar: '!@#$%^*()=' });
        expect(output).toBe('<div class="<>&">0000000000 foo</div>');
    });

    describe('custom chars are escaped', function (expect) {
        var render = easyDefault.compile('<div class="{{{foo}}}">{{bar}} foo</div>');
        var output = render({ foo: '"quoted"', bar: '8,\\8,\\8,8,8,\\8' });
        expect(output).toBe('<div class="\\"quoted\\"">\\8,\\8,\\8,\\8,\\8,\\8 foo</div>');
    });

    describe('unmatched vars can be removed/hidden from the template', function (expect) {
        var render = easyDefault.compile('<div class="{{foo}}">{{{bar}}} foo</div>');
        var output = render({ foo: 'matched' });
        expect(output).toBe('<div class="matched"> foo</div>');
    });

});
