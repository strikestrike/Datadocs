---
date: 2022-07-31
tags:
  - lint
  - guide
---

# Coding Style Guide

**TODO: adding the required editor extension/plugins for the new talnet**

## Style Guides for the Grid

This grid project contains many lines of code and many complex logic. 
We should maintain this project with unified code style for avoiding human errors and ambiguities.

For example, there are many types about the *index* in this project. 
If we just name them as `index` but without detailed comments or detailed variable names,
it can make developers confused.

### How about the existing code

We should replace them to the new style while we are developing the new features.

### 0x01. Please respect ESLint's warnings and errors

### 0x02. Don't use `var` in the new code

See the explaintation from ESLint: [no-var](https://eslint.org/docs/rules/no-var)

Because there are many existing variable declarations by the keyword `var`,
we can't add the `no-var` rule for the ESLint now. 
But we can add this rule in the future.

### 0x03. Variable names and function names

Common variables such as loop indices and pointers can be a single letter (Eg: `i`, `j`)

Please give the variable a jsDoc comment with detailed description,
if you want to assigning a very short name to the variable. For example:

``` javascript
/** Current selection area's start column index */
const col0 = area.startColumnIndex;
```

Please give the variable or the parameter a more descriptive name if it is any kind of grid index.

~~Examples of incorrect code for this rule:~~

``` javascript
function selectCell(row, column) {
  // ...
}
```

👍 Examples of **correct** code for this rule:

``` javascript
function selectCell(viewRowIndex, viewColumnIndex) {
  // ...
}
```

WIP...
