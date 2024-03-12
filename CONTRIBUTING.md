---
updated_at: 2023-10-14
---

# Development and Contributing

As the project grows, this chapter may need to be updated. 
So please re-check the validity and accuracy of this section regularly.

[TOC]

## Prerequisites

You'll need the following tools:

- [Git](https://git-scm.com/)
- [Node.JS](https://nodejs.org/en/), version `>= 14.18.x`
- [Yarn 1](https://classic.yarnpkg.com/en/)
- Optional tools:
    - [Java Development Kit 1.6+](https://www.oracle.com/java/technologies/downloads/) if you want to re-build/modify the sub-project [ddc] and Antlr4 grammar files

And if you want to set up a full stack production environment for local development,
you also need to read the document [LOCAL_API_INSTRUCTION](./LOCAL_API_INSTRUCTION.md)

## Initialize the project

``` bash
# 1. Clone this project to local for the first time
git clone https://github.com/datadocs/datadocs.git
cd datadocs;

# 2. Init git sub-modules
git submodule update --init --recursive

# 3. Update local source code to the latest
git pull

# 4. See the following section to simplify the development experience if you need

# 5. Install dependencies for all sub-projects
yarn install
```

### An optional step before installing dependencies

Some modules (e.g., [ddc]) use dependencies that require JDK or need to be compiled locally. 
If you encounter any issues related to them or do not wish to install certain optional dependencies,
you can use one of these alternative solutions before executing `yarn install`:

#### Solution 1: Install built modules through the script

Export a [GitHub Personal Token](https://github.com/settings/tokens/new) 
as an environment variable `GITHUB_TOKEN`. 
Alternatively, you can set it using the following syntax in the `.env` file 
at the root of this project: `GITHUB_TOKEN=ghp_xxxxxxxx`.

Then execute `./deploy/install-modules-from-github.sh` to download all built modules from GitHub.

#### Solution 2: Download and extract built modules manually

Download artifact files from the page for the latest run of GitHub workflows:

- <https://github.com/datadocs/ddc/actions>

Extract them into each sub-project directory in the directory `packages`.

After that, you can check if the hierarchy of the project file system looks like this:

```
<repo-root>
  + packages
    ...
    + ddc
      + packages
        + ast
        + ddc
          + package.json
        ...
    ...
```

### An optional step for developers who don't have a java environment

Because there is a step for building the DuckDB SQL lexer/parser from grammar files using 
a Java tool named Antlr4. If you don't have a Java environment, you can use the following command
to download the built lexer/parser from the upstream instead of building it locally.

``` bash
./packages/duckdb-utils/scripts/download-grammar.sh
```


## Enable mock API server for frontend development

This app requires a server-side to enable user authentication and necessary APIs to function properly. 
Additionally, within this repository, there is a [mock API server][mock-api-server] available that 
can provide both user authentication and forward API requests to the upstream server.

By using this mock API server, frontend developers don't need to spend as much time setting up a real backend, 
nor worry about the server-side matters during development.

When you run the `dev` script of this project, the mock server will be started and
it will listen at `localhost:5001` by default.

However, the app instance launched by the `dev` script would not use the mock API server 
but the real server. 
You can export the mock server endpoint URL as an environment variable `MOCK_API_ENDPOINT` 
to tell the app to use the mock API server.

More conveniently, you can create a `.env` file with the following content to achieve it:

``` bash
MOCK_API_ENDPOINT=http://127.0.0.1:5001
```

(GFW) In additional, you can add an environment variable config in `.env` file
or exporting following environment variables manually
if your network needs a proxy to access Google services:

``` bash
http_proxy=http://<YOUR_PROXY_SERVER>
# For example: http_proxy=http://127.0.0.1:1080
```


## Setup real API server for frontend development

Please read the document [LOCAL_API_INSTRUCTION](./LOCAL_API_INSTRUCTION.md) to learn
about debugging the frontend and API at the same time.

## Build the project

Change the working directory to the root of this repo firstly.

``` bash
yarn run build
# Building the app and each component
# This command will create distributed files in the `dist` directory under each sub-project directory.

yarn run dev
# Building the app and each component live and serving the app and mock API.
# This is the most common command for daily development.
# After this command is started, you can visit http://localhost:8080 to access the app locally.

./deploy/build.sh
# Creating files for static hosting
# Please execute `yarn run build` before executing this command.
# This script will generate files under the directory `deploy/build.`
```

## Deploy the project

There is a [CD] server that can deploy the app automatically, 
which means you don't need to deploy the app manually to the upstream in most cases.

You can access and share your work/modification on the app using the URL with the following syntax:   
> https://ui.datadocs.com/app-_${GIT_COMMIT_HASH}_

You need to replace `${GIT_COMMIT_HASH}` in this URL with the full SHA1 hash of your git commit. 
You can obtain this hash value using the command `git rev-parse HEAD`.

This URL will not be available or updated immediately after you push your Git commit to GitHub.
It may take about 5 to 10 minutes for the GitHub workflow to run successfully 
and the CD server to download the distributed files from GitHub.

The CD server will also deploy the app to <https://ui.datadocs.com/app> if 
your Git commit was pushed to the main branch.

### Troubleshooting

1. Make sure that the GitHub workflow runs successfully for Git commits. The CD server will not deploy
commits with failed workflow runs.
2. You can deploy your work manually on the deployment portal page: <https://ui.datadocs.com/__guest/runs>.
    - You can ask the manager for its login credential if you don't know it.

### Deploy to other server

1. Copy all distribution files located in the directory [packages/datadocs/dist](./packages/datadocs/dist) 
to the web root directory of the HTTP server (e.g., Nginx, Caddy).
2. Configure the URL rewrite rules for frontend routing in the HTTP server configuration file. 
You can refer to the rules in the code of the 
[frontend routing component](./packages/datadocs/src/AppRoutes.svelte).
3. Setup PWA and a service worker if you want this app can be installed as a PC/mobile app and work offline.
You can get references for this part from the repo [datadocs-server].

[CD]: https://en.wikipedia.org/wiki/Continuous_delivery
[monorepo]: https://en.wikipedia.org/wiki/Monorepo
[ddc]: ./packages/ddc
[mock-api-server]: ./packages/mock-api-server
[datadocs-server]: https://github.com/datadocs/datadocs-server