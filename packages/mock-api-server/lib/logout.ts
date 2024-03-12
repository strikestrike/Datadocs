import escapeHTML = require("escape-html");
import type { Handler, Response, Request } from "express";
import { uidCookieName } from "./config";
import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "./firebase";

export function getLogoutRequestHandler(): Handler {
  const auth = getFirebaseAuth();
  return (req, res, next) => logout(req, res).catch((e) => next(e));

  async function logout(req: Request, res: Response) {
    await signOut(auth);
    console.log("[logout] ok");
    res.clearCookie(uidCookieName);

    let redirectUrl = req.query.redirectUrl;
    if (redirectUrl && typeof redirectUrl === "string")
      redirectUrl = escapeHTML(redirectUrl);

    res
      .status(200)
      .header("Content-Type", "text/html; charset=utf-8")
      .send(
        [
          `<p><b>Signed out</b></p>`,
          redirectUrl
            ? `<p><a href="${redirectUrl}">${redirectUrl}</a></p>`
            : "",
        ].join("")
      )
      .end();
    res.end();
  }
}
