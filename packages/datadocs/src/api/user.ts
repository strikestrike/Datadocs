import type { AxiosRequestConfig } from "axios";
import type { APIConfig } from "./type";
import { axiosCall } from "./common";
import type { UserInformation } from "./store";

export async function getUser(
  config: APIConfig = {}
): Promise<UserInformation> {
  const requestConfig: AxiosRequestConfig = {
    url: "/users/current",
    method: "get",
  };
  const userInfo = await axiosCall(requestConfig, config);
  return userInfo || null;
}
