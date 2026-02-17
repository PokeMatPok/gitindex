import esbuild from "esbuild";
import { copy } from 'esbuild-plugin-copy';

const isProd = process.argv.includes("--prod");
const isWatch = process.argv.includes("--watch");

const buildStatus = `Building for ${isProd ? "production" : "development"}${isWatch ? " with watch mode" : ""}.`;

const options = {
  entryPoints: ["src/contentController.ts"],
  bundle: true,
  format: "iife",
  target: ["chrome110"],
  outfile: "dist/scripts/content.js",

  minify: isProd,
  sourcemap: isProd ? false : "inline",
  legalComments: "none",

  define: {
    "process.env.NODE_ENV": JSON.stringify(
      isProd ? "production" : "development"
    )
  },

  treeShaking: true,
  drop: isProd ? ["console"] : [],

  logLevel: "info",
  plugins: [
    copy({
      resolveFrom: 'cwd',
      assets: {
        from: ['public/**/*'],
        to: ['dist']
      },
      watch: isWatch
    })
  ]
};

if (isWatch) {
  esbuild.context(options).then(ctx => {
    ctx.watch();
    console.log(buildStatus);
  }).catch(err => {
    console.error("Build failed:", err);
    process.exit(1);
  });
} else {
  esbuild.build(options).then(() => {
    console.log(buildStatus);
  }).catch(err => {
    console.error("Build failed:", err);
    process.exit(1);
  });
}
