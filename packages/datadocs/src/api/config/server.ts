import { isLocalhost } from "./isLocalhost";
import { mockAPIEndpoint } from "./mockApiEndpoint";

const baseURL = {
  PRODUCTION_API_BASE_URL: "https://internal-api.datadocs.com/v1",
  LOCAL_API_URL_TEMPLATE: "http://HOST:7000/v1",
};

export function getServerAPIBaseURL() {
  if (mockAPIEndpoint) return mockAPIEndpoint;
  return !isLocalhost
    ? baseURL.PRODUCTION_API_BASE_URL
    : baseURL.LOCAL_API_URL_TEMPLATE.replace("HOST", window.location.hostname);
}
