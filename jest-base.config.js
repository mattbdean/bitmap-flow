
// See https://jestjs.io/docs/en/configuration for all options
module.exports = {
    transform: {
        '^.+\\.tsx?$': 'ts-jest'
    },
    moduleFileExtensions: ['js', 'jsx', 'json', 'ts', 'tsx'],
    testRegex: '/test/.*\\.test\.(ts|tsx)',
    testURL: 'http://localhost',
};
