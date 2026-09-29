const fs = require("fs");
const path = require("path");
const { createInstrumenter } = require("istanbul-lib-instrument");

const instrumenter = createInstrumenter({
  esModules: true,
  produceSourceMap: true,
  parserPlugins: [
    "asyncGenerators",
    "dynamicImport",
    "objectRestSpread",
    "classProperties",
    "classPrivateProperties",
    "classPrivateMethods",
    "exportDefaultFrom",
    "exportNamespaceFrom",
    "numericSeparator",
    "optionalCatchBinding",
    "optionalChaining",
    "nullishCoalescingOperator",
    "topLevelAwait",
    "jsx",
    ["typescript", { dts: false }]
  ]
});

function walk(dir) {
  let files = [];
  if (!fs.existsSync(dir)) return files;
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      if (item !== "node_modules" && item !== ".next" && item !== "cypress" && item !== "coverage" && item !== ".nyc_output") {
        files = files.concat(walk(full));
      }
    } else if (/\.(tsx?|jsx?)$/.test(item) && !item.endsWith(".d.ts")) {
      files.push(full);
    }
  }
  return files;
}

const rootDir = path.resolve(__dirname, "..");
const files = [
  ...walk(path.join(rootDir, "app")),
  ...walk(path.join(rootDir, "components")),
  ...walk(path.join(rootDir, "lib")),
  ...walk(path.join(rootDir, "hooks")),
];

const nycDir = path.join(rootDir, ".nyc_output");
const nycOut = path.join(nycDir, "out.json");

let existing = {};
if (fs.existsSync(nycOut)) {
  try {
    existing = JSON.parse(fs.readFileSync(nycOut, "utf8"));
  } catch {
    existing = {};
  }
}

const baseline = {};
for (const abs of files) {
  try {
    const code = fs.readFileSync(abs, "utf8");
    instrumenter.instrumentSync(code, abs);
    const cov = instrumenter.fileCoverage;
    if (existing[abs] && existing[abs].s && Object.keys(existing[abs].s).length > 0) {
      baseline[abs] = existing[abs];
    } else {
      baseline[abs] = cov;
    }
  } catch (e) {
    console.warn("Baseline skipped:", abs, e.message);
  }
}

fs.mkdirSync(nycDir, { recursive: true });
fs.writeFileSync(nycOut, JSON.stringify(baseline, null, 2));

const NYC = require("nyc");
const nyc = new NYC({
  tempDir: ".nyc_output",
  reportDir: "coverage",
  reporter: ["text", "html", "lcov", "json-summary"]
});

nyc.report().then(() => {
  console.log("Baseline coverage report generated in front/coverage/index.html");
});
