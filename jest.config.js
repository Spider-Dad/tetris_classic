module.exports = {
    testEnvironment: 'jsdom',
    setupFiles: ['./jest.setup.js'],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
    collectCoverageFrom: [
        'tetris.js',
        'sound.js'
    ],
    moduleNameMapper: {
        '\\.(wav|mp3)$': '<rootDir>/__mocks__/fileMock.js'
    }
}; 