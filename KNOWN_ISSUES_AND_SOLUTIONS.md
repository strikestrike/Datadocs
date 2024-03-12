---
updated_at: 2023-10-26
---

# Known Issues and Solutions


### If your internet is restricted (GFW, Единый реестр запрещённых сайтов, ...)

Because this project uses Google Firestore services and BigQuery for storage and authorization,
and also needs to download some packages/repositories from Github and Azure Blob Storage.
Please make sure you have a VPN/http proxy server that can access above services without blocking.
Here is the command for using http proxy server for this project:

``` bash
http_proxy=http://<YOUR_PROXY_SERVER>
# For example: http_proxy=http://127.0.0.1:1080
```


### `Object.defineProperty called on non-object` errors in production mode

This issue can be caused by original `antlr4ts` package (circular references in it).
You can install ESM version of `antlr4ts` package to fix this issue.
here is the installation command:

``` bash
./scripts/install-antlr4ts-esm.sh
# this script download the package from:
#   https://t67t.z23.web.core.windows.net/packages/antlr4ts-v0.5.0-alpha.4.tgz
# source code in here:
#   https://github.com/datadocs/antlr4ts
```