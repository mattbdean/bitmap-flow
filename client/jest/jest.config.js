const path = require('path');
const base = require('../../jest-base.config');

module.exports = Object.assign(base, {
    moduleNameMapper: {
        '\\.css$': '<rootDir>/jest/style-mock.js'
    },
    globalSetup: __dirname + '/global-setup.js',
    setupTestFrameworkScriptFile: 'jest-enzyme',
    testEnvironment: 'enzyme',
    // Root dir is client package
    rootDir: path.resolve(__dirname, '..')
});
