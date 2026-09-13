// Jest config for the ported backend only (src/backend + tests/backend). Kept separate
// from any future frontend Jest/RTL config so the two suites never collide.
module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/backend'],
  testMatch: ['**/*.test.js'],
};
