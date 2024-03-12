import * as fs from "fs";
import * as path from "path";
import * as cors from "cors";
import * as https from "https";
import * as morgan from "morgan";
import * as express from "express";
import * as cookieParser from "cookie-parser";
import * as bodyParser from "body-parser";
import { port, upstreamEndpoint } from "./config";
import { getLoginRequestHandler } from "./login";
import { createProxyMiddleware } from "http-proxy-middleware";
import { getLogoutRequestHandler } from "./logout";
import type { MockApiFnContext } from "./api/types";
import { handleSystemProxy } from "./network-proxy";

const mockApiDir = path.resolve(__dirname, "api");
handleSystemProxy();
main();

function main() {
  const http = express();
  http.use(cors());
  http.use(morgan("tiny"));
  http.use(cookieParser());
  http.get("/", (req, res) =>
    res.send({
      upstreamEndpoint,
      cookies: req.cookies,
    })
  );
  http.get("/login", getLoginRequestHandler());
  http.get("/logout", getLogoutRequestHandler());

  const mockApiFiles = fs
    .readdirSync(mockApiDir, { withFileTypes: true })
    .filter((it) => it.isFile())
    .filter((it) => !it.name.startsWith(".") && it.name.match(/\.m?(js|ts)$/));
  const mockApiContext: MockApiFnContext = {
    app: http,
    json: bodyParser.json({ limit: "5mb" }),
  };
  for (let i = 0; i < mockApiFiles.length; i++) {
    const { name } = mockApiFiles[i];
    try {
      const filePath = path.resolve(mockApiDir, name);
      const module = require(filePath);
      if (typeof module.default === "function") module.default(mockApiContext);
      console.log(`[mock] loaded '${name}'`);
    } catch (error) {
      console.error(`[mock] load '${name}' failed:`, error);
    }
  }

  http.use(getApiFallbackHandler());
  http.listen(port, () => {
    console.log(`[mock] api server is listening at: http://127.0.0.1:${port}`);
  });
}

export function getApiFallbackHandler(): express.Handler {
  const targetURL = new URL(upstreamEndpoint);
  const protocol = targetURL.protocol;

  const proxy = createProxyMiddleware({
    target: upstreamEndpoint,
    changeOrigin: true,
    ws: true,
    agent: protocol === "https:" ? https.globalAgent : undefined,
  });
  return proxy;
}
