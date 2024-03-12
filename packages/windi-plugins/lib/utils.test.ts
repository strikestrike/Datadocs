import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Processor } from "windicss/lib";
import type { Options } from "./utils.js";
import { utilsPlugin } from "./utils.js";

const basePath = resolve(dirname(fileURLToPath(import.meta.url)))
  // '/path/to/dist/esm' => '/path/to'
  .replace(/\/(lib|dist\/\w+)$/, "");
const stylesPath = resolve(basePath, "../datadocs/src/styles");
console.log(stylesPath);

const processor = new Processor();
const testRule = () => {
  const result = processor.interpret("z-999999");
  console.log(JSON.stringify(result, null, 2));
};
const options: Options = {
  watch: "persistent",
  onChange: testRule,
  include: [
    resolve(stylesPath, "base.css"),
    resolve(stylesPath, "components.css"),
    resolve(stylesPath, "utilities.css"),
  ],
};
processor.loadPluginWithOptions(utilsPlugin, options as any);
testRule();

const delay = 10 * 1000;
console.log(`sleeping ${delay / 1000}s ...`);
setTimeout(() => process.exit(0), delay);
