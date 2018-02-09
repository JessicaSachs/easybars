var Easybars = require('../../index');

describe('protect against edge cases', function () {

    describe('when the template string contains a "length" key', function (expect) {
        var str = '{{length}}';
        var data = { length: 'hello!' };
        var render = new Easybars().compile(str);
        var output = render(data);
        expect(output).toBe('hello!');
    });

});
