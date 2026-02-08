import esbuild from "esbuild";

const isProd = process.argv.includes("--prod");
const isWatch = process.argv.includes("--watch");

const buildStatus = `Building for ${isProd ? "production" : "development"}${isWatch ? " with watch mode" : ""}.`; 

esbuild.context({
    entryPoints: ["src/contentController.ts"],
    bundle: true,
    format: "iife",
    target: ["chrome110"],
    outfile: "dist/content.js",

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
}).then((ctx) => {
    new Promise((resolve, reject) => {
        if (isWatch) {
            ctx.watch().then(resolve).catch(reject);
        } else {
            ctx.rebuild().then(resolve).catch(reject);
        }
    }).then(() => {
        console.log(buildStatus);
        console.log("-----------------------------------------");
        console.log("\n")
    }).catch((err) => {
        console.error("Build failed:", err);
        process.exit(1);
    });
}).catch((err) => {
    console.error("Build failed:", err);
    process.exit(1);
});