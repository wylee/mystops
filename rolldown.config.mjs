export default {
  platform: "browser",
  input: "./src/mystops/static/app/app.ts",
  output: {
    file: "./src/mystops/static/build/app.js",
  },
  transform: {
    define: {
      "process.env.NODE_ENV": `"${process.env.NODE_ENV}"`,
    },
  },
};
