import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

export default {
  input: "./src/mystops/static/app/index.ts",
  output: {
    file: "./src/mystops/static/build/app.js",
    format: "iife",
  },
  plugins: [
    nodeResolve(),
    typescript({
      include: ["./src/mystops/static/app/**"],
    }),
  ],
};
