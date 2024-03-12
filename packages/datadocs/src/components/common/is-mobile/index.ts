import UAParser from "ua-parser-js";

const device = new UAParser().getDevice();
const isMobile = device.type === "mobile";

export default function checkMobileDevice(): boolean {
  return isMobile;
}
