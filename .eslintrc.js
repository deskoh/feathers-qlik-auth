module.exports = {
  extends: [
    'airbnb-typescript/base',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  parserOptions: {
    project: './tsconfig.json',
  },
  "rules": {
    "import/extensions": "off",
    "no-console": "off",
  }
};
