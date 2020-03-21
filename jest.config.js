module.exports = {
  coverageDirectory: 'coverage',
  transform: {
    "^.+\\.ts$": 'ts-jest'
  },
  testRegex: '(/test/.*|(\\.|/)(spec))\\.tsx?$',
  moduleDirectories: ['node_modules', 'src'],
  moduleFileExtensions: [
     'ts',
     'tsx',
     'js',
     'jsx'
  ],
}