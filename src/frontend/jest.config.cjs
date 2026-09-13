const path = require('path');

// tests/frontend/ lives at the repo root (sibling of src/frontend/), so rootDir points
// there and testMatch scopes down to tests/frontend/**. Everything else (moduleDirectories,
// setup, babel config) is pinned to absolute paths under this package so Jest resolves
// this package's own node_modules (react, RTL, etc.) even though rootDir is elsewhere.
const frontendRoot = __dirname;
const repoRoot = path.resolve(frontendRoot, '..', '..');

module.exports = {
  rootDir: repoRoot,
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/tests/frontend/**/*.test.jsx'],
  moduleDirectories: [path.join(frontendRoot, 'node_modules'), 'node_modules'],
  moduleNameMapper: {
    '\\.(css|less)$': path.join(frontendRoot, 'test-config', 'styleMock.cjs'),
    '^@/(.*)$': path.join(frontendRoot, 'src') + '/$1',
  },
  setupFilesAfterEnv: [path.join(frontendRoot, 'test-config', 'setupTests.cjs')],
  transform: {
    '^.+\\.[jt]sx?$': [
      path.join(frontendRoot, 'node_modules', 'babel-jest'),
      { configFile: path.join(frontendRoot, 'babel.config.cjs') },
    ],
  },
};
