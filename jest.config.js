export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  transform: {
    '^.+\\.[tj]sx?$': ['babel-jest', { configFile: './babel.config.cjs' }]
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  transformIgnorePatterns: ['node_modules/(?!lucide-react)'],
  testRegex: ['\\.test\\.[tj]sx?$'],
  extensionsToTreatAsEsm: ['.jsx', '.ts', '.tsx'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/main.jsx',
    '!src/vite-env.d.ts',
    '!src/**/*.d.ts'
  ]
};
