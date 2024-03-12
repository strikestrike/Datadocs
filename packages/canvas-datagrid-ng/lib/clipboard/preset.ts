import { DefaultSystemClipboard } from './default-system-clipboard';
import { DemoVirtualClipboard } from './demo-virtual-clipboard';

export function getPresetClipboard() {
  return {
    Default: DefaultSystemClipboard,
    Demo: DemoVirtualClipboard,
  };
}
