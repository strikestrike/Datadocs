import type { MockApiFnContext } from "./types";

export default function mockApi(args: MockApiFnContext) {
  const { app, json } = args;
  app.get("/example.json", (req, res) => {
    res.send({
      example: "helloworld",
    });
  });
}
