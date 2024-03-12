#!/usr/bin/env bash

throw() { echo -e "fatal: $1" >&2; exit 1; }

pushd "$( dirname "${BASH_SOURCE[0]}" )" || exit 1;
yarn run build || exit 1;

# test -z CLOUDFLARE_ACCOUNT_ID && throw "env variable CLOUDFLARE_ACCOUNT_ID is missing";

#region remove osx files
pushd out || throw "directory 'out' is not existed";
find . -type f \( -iname '.DS_Store' -o -iname '._*' \) | while read -r file; do
  rm -v "${file}" || return 1;
done
popd;
#endregion remove osx files

set -x;
./node_modules/.bin/wrangler pages publish out \
  --project-name 'canvas-datagrid-api' \
  --branch 'main';
