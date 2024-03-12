import { firebaseAuth } from "./config";
import {
  signInWithCustomToken,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { setAxiosAuthToken, clearAxiosAuthToken } from "./axios";
import { setFirebaseUser, setUserInformation } from "./store";
import { isLocalhost } from "./config";
import { getUser } from "./user";
import { getCookieByName } from "./common";
import { initWorkbookData } from "./workbook";
import { initWorkspace } from "./workspace";
import { mockAPIEndpoint } from "./config/mockApiEndpoint";

export async function signIn(customToken: string) {
  try {
    await signInWithCustomToken(firebaseAuth, customToken);
    setUiPageLogInStatus(true);
    return true;
  } catch (error) {
    console.log(error);
    setUiPageLogInStatus(false);
    return false;
  }
}

export function getAuthUrlBase() {
  if (mockAPIEndpoint) return mockAPIEndpoint.replace(/\/$/, "");
  if (isLocalhost) return `http://${location.hostname}:5000`;
  return "https://www.datadocs.com";
}

export function getSignInUrl() {
  const redirectUrl = location.toString();
  const authUrl = `${getAuthUrlBase()}/login`;
  const url = new URL(authUrl);
  url.searchParams.append("token", "ZerRgzEesBWBBjxvkYtaiFIP");
  url.searchParams.append("action", "auth");
  url.searchParams.append("redirectUrl", redirectUrl);
  return url.toString();
}

export function getSignOutUrl() {
  const redirectUrl = location.toString();
  const authUrl = `${getAuthUrlBase()}/logout`;
  const url = new URL(authUrl);
  url.searchParams.append("token", "ZerRgzEesBWBBjxvkYtaiFIP");
  url.searchParams.append("action", "auth");
  url.searchParams.append("redirectUrl", redirectUrl);
  return url.toString();
}

/**
 * Sign user out of firebase
 * @returns true if success, otherwise false
 */
export async function signOut(): Promise<boolean> {
  try {
    await firebaseSignOut(firebaseAuth);
    setUiPageLogInStatus(false);
    return true;
  } catch (error) {
    return false;
  }
}

export function setUiPageLogInStatus(loggedIn: boolean) {
  const hostname = isLocalhost ? location.hostname : "datadocs.com";
  const status = loggedIn ? "true" : "false";
  document.cookie = `ddui-login-status=${status};path=/;domain=${hostname};secure;samesite=strict`;
}

/**
 * Try to get the unexpired firebase token if it is expired
 */
export async function refreshIdToken() {
  setAxiosAuthToken(await firebaseAuth.currentUser.getIdToken());
}

/**
 * Listen to Auth state changed, include firebase init loading
 * logged in user that's stored on IndexedDB
 */
export function listenToAuthStateChanged() {
  onAuthStateChanged(firebaseAuth, async (user) => {
    if (user && !user.isAnonymous) {
      // dduid cookie is set from auth subdomain, it is a hint to know
      // the identity of current logged in user. If two uid is not match,
      // it means the user has been logged out or using another account.
      const dduid = getCookieByName("dduid");
      if (dduid !== user.uid) {
        // log the user out if uid is not matched and redirect user to
        // sign in page
        clearAxiosAuthToken();
        const success = await signOut();
        if (success) location.replace(getSignInUrl());
      } else {
        setUiPageLogInStatus(true);
        const token = await user.getIdToken();
        setAxiosAuthToken(token);
        setFirebaseUser(user);
        const userInformation = await getUser({});
        setUserInformation(userInformation);
        initWorkspace();
        await initWorkbookData();
      }
    } else {
      // User hasn't logged in or there is anonymous account
      clearAxiosAuthToken();
      setFirebaseUser(null);
      setUiPageLogInStatus(false);
    }
  });
}
