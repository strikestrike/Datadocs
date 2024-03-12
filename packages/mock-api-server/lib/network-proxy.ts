type GlobalAgent = {
  HTTP_PROXY: string;
  HTTPS_PROXY: string;
  NO_PROXY: string;
};

/**
 * This function uses the package `global-agent` to setup a correct network proxy for
 * the mock api server. It is useful for developers located in places with internet
 * restrictions to use this mock api server effectively with their system proxy config.
 *
 * Notes: this function can only recognize HTTP/HTTPS proxy URLs from
 * the conventional environment variables:
 * http_proxy, https_proxy, no_proxy
 *
 * @see https://unix.stackexchange.com/questions/212894/whats-the-right-format-for-the-http-proxy-environment-variable-caps-or-no-ca
 * @see https://askubuntu.com/questions/583797/how-to-set-a-proxy-for-terminal
 *
 * > Across the GFW we can reach every corner in the world
 */
export function handleSystemProxy() {
  const sysHttpProxy = process.env.HTTP_PROXY || process.env.http_proxy;
  const sysHttpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  const sysNoProxy = process.env.NO_PROXY || process.env.no_proxy;
  if (!sysHttpProxy && !sysHttpsProxy) return false;

  let globalAgent: { bootstrap: () => any };
  try {
    globalAgent = require("global-agent");
  } catch (error) {
    onError(
      `The system proxy variables can not be used, because the dependency 'global-agent' is not installed`
    );
    return false;
  }
  if (typeof globalAgent?.bootstrap !== "function") {
    onError(
      `The system proxy variables can not be used, because the dependency 'global-agent' is invalid`
    );
    return false;
  }
  globalAgent.bootstrap();

  const GLOBAL_AGENT = global.GLOBAL_AGENT as GlobalAgent;
  if (!GLOBAL_AGENT) {
    onError(
      `The system proxy variables can not be used, because the GLOBAL_AGENT is not found`
    );
    return false;
  }

  if (sysHttpProxy) {
    GLOBAL_AGENT.HTTP_PROXY = sysHttpProxy;
    GLOBAL_AGENT.HTTPS_PROXY = sysHttpProxy;
  }
  if (sysHttpsProxy) GLOBAL_AGENT.HTTPS_PROXY = sysHttpsProxy;
  if (sysNoProxy) GLOBAL_AGENT.NO_PROXY = sysNoProxy;

  if (sysHttpProxy) console.log(`[mock] loaded HTTP_PROXY=${sysHttpProxy}`);
  if (sysHttpsProxy) console.log(`[mock] loaded HTTPS_PROXY=${sysHttpProxy}`);
  if (sysNoProxy) console.log(`[mock] loaded NO_PROXY=${sysNoProxy}`);
  return true;
}

function onError(msg: string) {
  console.error(`[mock] NETWORK ERROR: ${msg}`);
}
