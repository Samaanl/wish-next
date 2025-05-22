module.exports = {
  extends: "next/core-web-vitals",
  rules: {
    "@typescript-eslint/no-unused-vars": "off", // Disable unused variable warnings
    "react-hooks/exhaustive-deps": "warn", // Downgrade exhaustive-deps to warning
  },
};
