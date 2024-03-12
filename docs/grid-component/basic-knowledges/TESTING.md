---
date: 2022-07-31
tags:
  - build
  - guide
  - qa
---
# Testing

For the [QA](https://www.freecodecamp.org/news/software-quality-assurance-guide/), 
we have three different types for the testing

1. **Unit tests** in `*.spec.ts` files in the directory `lib`
2. **Integration tests** that run in the browser environment by karma
3. Unit tests in the browser context

## Unit Tests in *.spec.ts files

The first time they appear in this commit:   
<https://github.com/datadocs/canvas-datagrid/commit/856f67637eb067a46b0cbcf3cb678440bfef396c#diff-a326b7ff91c7956fb4b988c784ed38524065ad887b16efb6b4b5dfcd03c3f27e> 


### Why they are not located in the directory `test` and not executed by `karma`

They don't require browser environment to execute

### Why they are compiled to CommonJS files but not ES modules

Because the compiler(both swc and tsc) can't emit valid `import` statement in ES modules.
Get more information from this issue: <https://github.com/microsoft/TypeScript/issues/42151>
