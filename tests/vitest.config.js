import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    include: ['./tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'validations/**/*.js',
        'utils/**/*.js',
        'services/**/*.js',
        'repositories/**/*.js',
        'controllers/**/*.js',
        'middlewares/**/*.js'
      ]
    }
  }
})
