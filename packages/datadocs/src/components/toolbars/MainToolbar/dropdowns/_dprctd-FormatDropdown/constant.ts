import type { FormatValue } from "../../../../../app/store/store-toolbar";

export type FormatItem = {
  type: "item" | "separator";
  label?: string;
  value?: FormatValue;
  icon?: string;
  activeIcon?: string;
  hint?: string;
};

export const formatMenuItems: FormatItem[] = [
  {
    type: "item",
    label: "Automatic",
    value: "automatic",
    icon: "fmt-automatic",
  },
  {
    type: "separator",
  },
  {
    type: "item",
    label: "Number",
    value: "number",
    icon: "fmt-number",
    hint: "1,000.12",
  },
  {
    type: "item",
    label: "Percentage",
    value: "percentage",
    icon: "fmt-percentage",
    hint: "10.12%",
  },
  {
    type: "item",
    label: "Scientific",
    value: "scientific",
    icon: "fmt-scientific",
    hint: "1.01E+03",
  },
  {
    type: "separator",
  },
  {
    type: "item",
    label: "Accounting",
    value: "accounting",
    icon: "fmt-accounting",
    activeIcon: "fmt-accounting-active",
    hint: "$ (1,000.12)",
  },
  {
    type: "item",
    label: "Financial",
    value: "financial",
    icon: "fmt-financial",
    activeIcon: "fmt-financial-active",
    hint: "(1,000.12)",
  },
  {
    type: "item",
    label: "Currency",
    value: "currency",
    icon: "fmt-currency",
    hint: "$1,000.12",
  },
  {
    type: "item",
    label: "Currency rounded",
    value: "currency_rounded",
    icon: "fmt-currency-rounded",
    hint: "$1,000",
  },
  {
    type: "separator",
  },
  {
    type: "item",
    label: "Date",
    value: "date",
    icon: "fmt-date",
    hint: "9/26/2008",
  },
  {
    type: "item",
    label: "Time",
    value: "time",
    icon: "fmt-time",
    hint: "3:59:00 PM",
  },
  {
    type: "item",
    label: "Date time",
    value: "date_time",
    icon: "fmt-date-time",
    hint: "9/26/2008 15:59:00",
  },
  {
    type: "item",
    label: "Duration",
    value: "duration",
    icon: "fmt-duration",
    hint: "24:01:00",
  },
];
