const FeatherTest = require('feather-test');

const myTest = new FeatherTest({
    specs: './specs',
});

myTest.run();
