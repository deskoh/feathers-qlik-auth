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
    "@typescript-eslint/no-explicit-any": "off",
    "import/extensions": "off",
    "no-console": "off",
  }
};
