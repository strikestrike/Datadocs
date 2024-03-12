import type { AxiosRequestConfig, AxiosError } from "axios";
import axios from "./axios";
import type { APIConfig, ErrorHandlerConfig } from "./type";
import { refreshIdToken } from "./auth";
import { QueryManager, type QueryKey } from "./utils/QueryManager";

const queryManager = new QueryManager();

export function isFunction(value: any) {
  return typeof value === "function";
}

/**
 * Handle error from calling axios request
 * @param error
 * @param config
 */
export function handleError(error: AxiosError, config: ErrorHandlerConfig) {
  console.log("Error: ", error);
  // console.log("Error status: ", error.status);
  if (error.response) {
    // Handle for too many request error
    if (error.response.status === 429 && isFunction(config.onTooManyRequest)) {
      return config.onTooManyRequest(error);
    }

    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    // in case no onTooManyRequest handler, fallback to use onRequestError
    if (isFunction(config.onRequestError)) return config.onRequestError(error);
  } else if (error.request) {
    // The request was made but no response was received
    if (isFunction(config.onNoResponseError))
      return config.onNoResponseError(error);
  } else {
    // Something happened in setting up the request that triggered an Error
    // console.log('Error', error.message);
    if (isFunction(config.otherError)) return config.otherError(error);
  }
}

export function setCookie(name: string, value: string, days?: number) {
  let expires = "";
  if (typeof days === "number" && days > 0) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

export function getCookieByName(name: string): string {
  const cookie = {};
  document.cookie.split(";").forEach(function (el) {
    console.log(el);
    const [key, value] = el.split("=");
    cookie[key.trim()] = value ? value.trim() : "";
  });
  return cookie[name] || "";
}

export async function axiosCall(
  requestConfig: AxiosRequestConfig,
  callbackConfig: APIConfig,
  key?: QueryKey
) {
  const action = async () => {
    // Make sure the token is not expired before calling the api
    await refreshIdToken();
    return await axios(requestConfig);
  };

  if (key) {
    const { data: res, error } = await queryManager.execute(key, action);
    if (error) {
      if (callbackConfig && isFunction(callbackConfig.onError)) {
        await callbackConfig.onError(error);
      }
    } else {
      if (callbackConfig && isFunction(callbackConfig.onSuccess)) {
        await callbackConfig.onSuccess(res.data);
      }
      return res.data;
    }
  } else {
    try {
      const res = await action();
      if (callbackConfig && isFunction(callbackConfig.onSuccess)) {
        await callbackConfig.onSuccess(res.data);
      }
      return res.data;
    } catch (error) {
      if (callbackConfig && isFunction(callbackConfig.onError)) {
        await callbackConfig.onError(error);
      }
    }
  }
}
