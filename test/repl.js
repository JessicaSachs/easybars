const Easybars = require('../index.js');
const repl = require('repl');

const r = repl.start('> ');

r.context.Easybars = Easybars;
r.context.easybars = Easybars;
