#!/usr/bin/env bash

# project root
pushd "$( dirname "${BASH_SOURCE[0]}" )/.." || exit 1;

if test -d dist; then
  echo "[.] cleaning dist";
  rm -r dist || exit 1;
fi

echo "[.] yarn run build";
yarn run build || exit 1;

echo "[.] yarn run build:types";
yarn run build:types || exit 1;

echo "[.] cleaning hidden files";
find lib -type f -iname '.*' -delete || exit 1;
find dist -type f -iname '.*' -delete || exit 1;

echo "[.] yarn publish";
yarn publish || exit 1;

echo "[+] done!"
