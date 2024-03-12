import type { Response } from "express";
import { resolve } from "path";
import { readFileSync } from "fs";
import { upstreamEndpoint, defaultUser, defaultPass } from "./config";
import escapeHTML = require("escape-html");

const htmlFile = resolve(__dirname, "../html/login.html");
const vars = {
  UPSTREAM_ENDPOINT: upstreamEndpoint,
  DEFAULT_USER: defaultUser,
  DEFAULT_PASS: defaultPass,
};
const varNames = Object.keys(vars);

export function renderLoginPage(res: Response) {
  let html = readFileSync(htmlFile, "utf-8");
  for (let i = 0; i < varNames.length; i++) {
    const varName = varNames[i];
    html = html.replace("${" + varName + "}", escapeHTML(vars[varName]));
  }
  res
    .status(200)
    .header("Content-Type", "text/html; charset=utf-8")
    .send(html)
    .end();
}
