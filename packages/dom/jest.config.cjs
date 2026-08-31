/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  // Default testMatch treats every file under __tests__ as a suite,
  // which breaks on shared helpers.
  testMatch: ['**/*.test.[jt]s?(x)'],
}
