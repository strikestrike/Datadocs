---
updated_at: 2024-01-05 07:51:44
---

# Datadocs

[TOC]

## Overview

Datadocs is a Web Application allowing to efficiently load, view and manipulate large column-oriented data sets coming from various input data sources (CSV, XML, etc.).

## Links

- [Home Page](https://datadocs.com)
- [App Page](https://ui.datadocs.com/app)
- [First time development](./CONTRIBUTING.md)
- [Deployment Portal](https://ui.datadocs.com/__guest/runs)
- [Known Issues & Solutions](./KNOWN_ISSUES_AND_SOLUTIONS.md)
- [More Documents](./docs)
- API references:
  - [Panels Layout](https://datadocs.github.io/datadocs/)
  - [Grid Component](./docs/grid-component)

## Project Structure

Firstly, this project is a [monorepo], and all sub-projects are located in the directory
called [packages](./packages).

Secondly, this repository does not contain server-side or backend code. 
Instead, there is only a mock API server present in the directory called [mock-api-server](./packages/mock-api-server) for local development purposes.
Please contact the project manager if you need permission to access the backend code.   

Here is the description for each sub-project:

```
<repo-root>
  + packages
    + datadocs                 web app source code
    + canvas-datagrid-ng       grid component
    - datasouce-duckdb         a grid data source for the DuckDB
    + ddc                      
      + packages
        + ...                  sub-modules about editor and transpiler
    + duckdb-utils             some utility functions for DuckDB, including a DuckDB SQL parser
    + duckdb-wasm              a compiled DuckDB WASM module 
    + local-storage            local persistent storage related code
    + mock-api-server          a simple local server for mocking api
    + submodule-template       a template for new sub-project
    + windi-plugins            some windicss plugins
```

Moreover, there is a related frontend project named [splash] located in another repository. 
This frontend project includes a [splash screen](https://en.wikipedia.org/wiki/Splash_screen), 
user authentication pages (such as login/logout), 
and some other pages that can be found on datadocs website <https://datadocs.com>.

## Development

Read the document [CONTRIBUTING](./CONTRIBUTING.md) to learn about 
the workflows for development and deployment for this project.

[monorepo]: https://en.wikipedia.org/wiki/Monorepo
[ddc]: ./packages/ddc
[mock-api-server]: ./packages/mock-api-server
[splash]: https://github.com/datadocs/splash