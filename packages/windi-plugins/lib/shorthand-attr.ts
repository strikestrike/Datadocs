import plugin from "windicss/plugin";
import { generateFontSize } from "windicss/utils";

function isNumber(value: any): value is number {
  const n = parseFloat(value);
  return typeof n === "number" && isFinite(n);
}

export const makeShorthandAttributePlugin = (
  attribute: string,
  target: string,
  unit = "rem"
) =>
  plugin(function ({ addDynamic, theme }) {
    const globalValues = ["inherit", "initial", "unset"];
    const stringValues = [
      "smaller",
      "xx-small",
      "x-small",
      "small",
      "medium",
      "large",
      "x-large",
      "xx-large",
      "larger",
    ];

    addDynamic(`dynamic-${target}`, ({ Utility, Style, Property }) => {
      if (Utility.body.indexOf(`${attribute}-`) === -1) return;

      const amount = Utility.amount;

      if (target === "font-size") {
        const fontSizes = theme("fontSize") as any;
        if (Object.keys(fontSizes).includes(amount)) {
          return Style(Utility.class, generateFontSize(fontSizes[amount])[0]);
        }
      }

      let value = Utility.handler
        .handleSquareBrackets()
        .handleNxl((number) => `${number}${unit}`)
        .handleSize().value;

      if (amount.endsWith("%") && isNumber(amount.slice(0, -1))) value = amount;

      if (
        amount === "0" ||
        globalValues.includes(amount) ||
        (target === "font-size" && stringValues.includes(amount))
      )
        value = amount;

      if (Utility.raw.startsWith(`${attribute}-$`))
        value = Utility.handler.handleVariable().value;

      if (value) return Style(Utility.class, [Property(target, value)]);
    });
  });
