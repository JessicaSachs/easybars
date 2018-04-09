module.exports = {
    extends: 'eslint:recommended',
    env: {
        node: true,
    },
    globals: {
        describe: true,
        xdescribe: true,
    },
    rules: {
        'no-cond-assign': 0,
    }
};