export default [
  {
    files: ["js/**/*.js", "tests/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        fetch: "readonly",
        URL: "readonly",
        location: "readonly",
        history: "readonly",
        crypto: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        URLSearchParams: "readonly",
        IntersectionObserver: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["warn", { ignoreRestSiblings: true }],
      "no-undef": "error",
    },
  },
];
