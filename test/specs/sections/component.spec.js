var Easybars = require('../../../index');

xdescribe('#component', function () {

    describe('components can be easily inserted', function (expect) {
        var template = '<div>{{message}} {{#component headline}}</div>';
        var components = {
            headline: '<h1>{{title}}:{{subtitle}}</h1>',
        };
        var templateData = {
            message: 'Say hello to',
            headline: {
                title: 'my',
                subtitle: 'little friend',
            },
        };
        var render = new Easybars().compile(template, components);
        var output = render(templateData);
        expect(output).toBe('<div>Say hello to <h1>my:little friend</h1></div>');
    });

    describe('components handle custom data addresses with dot notation', function (expect) {
        var template = '<div>{{message}} {{#component headline.gentle:headlineData.data.gentle}} {{#component headline.aggro:headlineData.data.aggro}}</div>';
        var components = {
            headline: {
                gentle: '<h3>{{title}}-{{subtitle}}</h3>',
                aggro: '<h1>{{title}}:{{subtitle}}</h1>',
            },
        };
        var templateData = {
            message: 'Say hello to',
            headlineData: {
                data: {
                    aggro: {
                        title: 'yo',
                        subtitle: 'momma',
                    },
                    gentle: {
                        title: 'yo',
                        subtitle: 'yo',
                    },
                },
            },
        };
        var render = new Easybars().compile(template, components);
        var output = render(templateData);
        expect(output).toBe('<div>Say hello to <h3>yo-yo</h3> <h1>yo:momma</h1></div>');
    });

    describe('values are still encoded', function (expect) {
        var template = '<div>{{message}} {{#component stuff}}</div>';
        var components = {
            stuff: '{{one}}:{{{two}}}',
        };
        var templateData = {
            message: 'Encode me plz',
            stuff: {
                one: '<',
                two: '<',
            },
        };
        var render = new Easybars().compile(template, components);
        var output = render(templateData);
        expect(output).toBe('<div>Encode me plz <:&lt;</div>');
    });

});
