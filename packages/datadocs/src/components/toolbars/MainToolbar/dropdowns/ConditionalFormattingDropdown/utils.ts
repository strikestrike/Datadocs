export function getConditionalFormattingIcon(icon: string) {
  switch (icon) {
    case "arrow-up": {
      return "3-arrows-colored-up";
    }
    case "arrow-right": {
      return "3-arrows-colored-right";
    }
    case "arrow-down": {
      return "3-arrows-colored-down";
    }
    case "green-light": {
      return "3-traffic-lights-green";
    }
    case "yellow-light": {
      return "3-traffic-lights-yellow";
    }
    case "red-light": {
      return "3-traffic-lights-red";
    }
    default: {
      return icon;
    }
  }
}
