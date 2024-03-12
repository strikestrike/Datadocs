import axios from "axios";
import { getServerAPIBaseURL } from "./config";

// Set base url for axios request
axios.defaults.baseURL = getServerAPIBaseURL();

export function setAxiosAuthToken(token: string) {
  axios.defaults.headers.common.Authorization = `Bearer ${token}`;
}

export function clearAxiosAuthToken() {
  delete axios.defaults.headers.common.Authorization;
}

export default axios;
