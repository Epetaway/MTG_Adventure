module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
    browser: true
  },
  parserOptions: {
    sourceType: 'module'
  },
  extends: ["eslint:recommended"],
  ignorePatterns: ["node_modules", "dist", ".next"]
};
