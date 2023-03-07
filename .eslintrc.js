module.exports = {
  env: {
    browser: true,
    es2021: true,
    nodejs: true,
  },
  extends: ["eslint:recommended"],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: "module",
  },
  rules: {},
};
