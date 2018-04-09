var Easybars = require('../index.js');
var repl = require('repl');

var r = repl.start('> ');

r.context.Easybars = Easybars;
r.context.easybars = Easybars;
