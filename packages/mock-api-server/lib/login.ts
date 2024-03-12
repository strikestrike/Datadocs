import axios from "axios";
import type { Handler, Response } from "express";
import { uidCookieName, upstreamEndpoint } from "./config";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getFirebaseAuth } from "./firebase";
import { renderLoginPage } from "./login-page";
import escapeHTML = require("escape-html");

export function getLoginRequestHandler(): Handler {
  const auth = getFirebaseAuth();

  return (req, res, next) => {
    const { redirectUrl, email, password } = req.query;
    const resp400 = (msg: string) => res.status(400).send(msg);

    if (!email || typeof email !== "string") {
      console.log("email is empty!");
      return renderLoginPage(res);
    }
    if (!password || typeof password !== "string") {
      console.log("password is empty!");
      return renderLoginPage(res);
    }

    if (!redirectUrl || typeof redirectUrl !== "string")
      return resp400("redirectUrl is missing!");

    login({ redirectUrl, email, password }, res).catch((e) => next(e));
  };

  async function login(
    payload: { email: string; password: string; redirectUrl: string },
    res: Response
  ) {
    const { email, password, redirectUrl } = payload;
    console.log(`[login] email=${email}`);
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const { user } = userCredential;
    console.log(`[login] uid=${user.uid}`);
    if (uidCookieName) res.cookie(uidCookieName, user.uid);

    const token = await user.getIdToken();
    console.log(`[login] token=******`);

    const upstreamResp = await axios({
      // process.env.HTTP_PROXY can make the request fail
      proxy: false,
      baseURL: upstreamEndpoint,
      url: "auth/getCustomToken",
      method: "post",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const customToken = upstreamResp.data?.token;
    if (!customToken)
      throw new Error(
        `upstream doesn't response custom token! status=${upstreamResp.status}`
      );

    console.log(`[login] status=${upstreamResp.status} customToken=*****`);

    const url = new URL(redirectUrl);
    url.searchParams.append("customToken", customToken);
    url.searchParams.append("dduid", userCredential.user.uid);
    url.searchParams.append("action", "auth");

    const escapedURL = escapeHTML(url.toString());
    res
      .status(200)
      .header("Content-Type", "text/html; charset=utf-8")
      .send(
        [
          `<meta http-equiv="refresh" content="2; url=${escapedURL}">`,
          `<p><b>Redirecting to </b>${escapeHTML(redirectUrl)}</p>`,
          `<p>custom token is ${escapeHTML(customToken)}</p>`,
        ].join("")
      )
      .end();
  }
}
