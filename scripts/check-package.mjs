import { readFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const requiredScripts = ["dev", "build", "start", "lint", "typecheck"];
const missingScripts = requiredScripts.filter((script) => !packageJson.scripts?.[script]);

if (missingScripts.length) {
  throw new Error(`Missing package scripts: ${missingScripts.join(", ")}`);
}

console.log("package.json smoke check passed");
