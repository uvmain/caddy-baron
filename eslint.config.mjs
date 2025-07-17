import antfu from '@antfu/eslint-config'

export default antfu({
  rules: {
    'no-console': 'off',
    'brace-style': ['error', 'stroustrup'],
    'curly': ['off'],
    'test/no-identical-title': 'off',
    'no-new': 'off',
    'test/prefer-lowercase-title': 'off',
    'no-undef': 'off',
  },
}, {})
