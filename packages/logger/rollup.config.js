import typescript from "rollup-plugin-typescript2";

// picomatch 2.3.2 no longer matches the plugin's default "*.ts+(|x)" glob.
const ts = () => typescript({ include: ["*.ts", "**/*.ts"] });
export default [
  {
    input: "./src/index.ts",
    output: {
      file: "./dist/index.esm.js",
      format: "esm",
    },
    plugins: [ts()],
    external: ["chalk", "gradient-string", "cli-progress"],
  },
  {
    input: "./src/index.ts",
    output: {
      file: "./dist/index.js",
      format: "cjs",
    },
    plugins: [ts()],
    external: ["chalk", "gradient-string", "cli-progress"],
  },
];
