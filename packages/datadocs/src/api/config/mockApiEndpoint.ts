declare global {
  interface Window {
    MOCK_API_ENDPOINT: string;
  }
}

/**
 * All API request included auth redirect will be sent to this URL endpoint
 * if this value is not empty
 *
 * This value is assigned at Vite config file (Eg: `vite.config.mjs`)
 */
const MOCK_API_ENDPOINT = window.MOCK_API_ENDPOINT;
export const mockAPIEndpoint: string =
  typeof MOCK_API_ENDPOINT === "string" &&
  MOCK_API_ENDPOINT.match(/^https?:\/\//)
    ? MOCK_API_ENDPOINT
    : "";
