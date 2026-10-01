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

module.exports = function (source, inputSourceMap) {
  const file = this.resourcePath;

  if (
    !file ||
    file.includes("node_modules") ||
    file.includes(".next") ||
    file.includes("cypress") ||
    file.endsWith(".d.ts")
  ) {
    return this.callback(null, source, inputSourceMap);
  }

  const relative = path.relative(this.rootContext || process.cwd(), file);
  if (!/^(app|components|lib|hooks)[\/\\]/.test(relative)) {
    return this.callback(null, source, inputSourceMap);
  }

  try {
    const instrumented = instrumenter.instrumentSync(source, file, inputSourceMap);
    return this.callback(null, instrumented, instrumenter.lastSourceMap() || inputSourceMap);
  } catch (e) {
    return this.callback(null, source, inputSourceMap);
  }
};
