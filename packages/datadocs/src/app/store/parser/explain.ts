import { typeSignature } from "@datadocs/common/TypeOf";
import type { AbstractError } from "@datadocs/ast/Ast/Errors";
import {
  defaultErrorFormatter,
  explainError,
  type ErrorFormatter,
} from "@datadocs/ddc/Helpers/Explain";
import escapeHTML from "escape-html";

const quoteWestern = (single: boolean) => (f: string) =>
  single ? `‘${f}’` : `“${f}”`;
const sQuote = quoteWestern(true);
const dQuote = quoteWestern(false);
const withColor = (f: string, c: string) =>
  `<span style="color: ${c}">${escapeHTML(f)}</span>`;
const formatAlts = function formatAlts(alts: string[]) {
  return (
    (alts.length > 1
      ? alts.slice(0, alts.length - 1).join(", ") + ", or "
      : "") + alts[alts.length - 1]
  );
};

const richErrorFormatter: ErrorFormatter<string, string> = {
  ...defaultErrorFormatter,
  quoted: (f) => dQuote(f),
  expr: (f) => withColor(dQuote(f), "blue"),
  keyword: (f) => withColor(f, "brown"),
  func: (f) => withColor(sQuote(f), "maroon"),
  type: (f) =>
    sQuote(escapeHTML(typeof f !== "string" ? typeSignature(f)! : f)),
  ident: (f) => withColor(sQuote(f), "green"),
  alts: (f) => formatAlts(f.map((ff) => withColor(ff, "green"))),
  text: escapeHTML,
  constant: (f) => withColor(f, "blue"),
  loc: (f) => withColor(f, "red"),
};

export function errorToHtml(e: AbstractError): string {
  return explainError<string, string>(
    e,
    richErrorFormatter,
    (a: string[]) => `<span>${a.join("")}</span>`
  );
}
