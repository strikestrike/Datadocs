import type { User } from "firebase/auth";
import { type Writable, writable, get } from "svelte/store";
import type { UserInformation } from "./types";

/**
 * The user that currently log in
 */
export const firebaseAuthUserStore: Writable<User> = writable(null);

/**
 * Indicate firebase auth has been loaded and the current log in
 * user has been loaded
 */
export const firebaseAuthLoadedStore: Writable<boolean> = writable(false);

/**
 * Indicate that if user has been logged in or not
 */
export const loginStatusStore: Writable<boolean> = writable(false);

/**
 * Current log in user information
 */
export const userInformationStore: Writable<UserInformation> = writable(null);

export function setFirebaseUser(firebaseUser: User) {
  firebaseAuthUserStore.set(firebaseUser);

  if (!get(firebaseAuthLoadedStore)) {
    firebaseAuthLoadedStore.set(true);
  }

  loginStatusStore.set(firebaseUser && !firebaseUser.isAnonymous);
}

export function setUserInformation(user: UserInformation) {
  userInformationStore.set(user);
}

export function getUserAvatarChar(): string {
  const userInfo = get(userInformationStore);
  if (!userInfo) return "";
  const firstChar = userInfo.firstName[0];
  return firstChar ? firstChar.toUpperCase() : "";
}
