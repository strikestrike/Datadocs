import type { Application, Handler } from "express";

export type MockApiFnContext = {
  app: Application;
  json: Handler;
};
