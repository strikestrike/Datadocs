#!/usr/bin/env bash

TARGET_DIR="../../../firestore-sync-poc/node_modules/@datadocs/canvas-datagrid-ng";

# project root
pushd "$( dirname "${BASH_SOURCE[0]}" )/../.." || exit 1;

echo "[.] yarn run build";
yarn run build || exit 1;

echo "[.] yarn run build:types";
yarn run build:types || exit 1;

echo "[.] cleaning hidden files";
find lib -type f -iname '.*' -delete || exit 1;
find dist -type f -iname '.*' -delete || exit 1;

if test -d "$TARGET_DIR"; then
  rm -r "${TARGET_DIR}/dist";
  rm -r "${TARGET_DIR}/lib";
  rm -r "${TARGET_DIR}/package.json";

  cp -r dist "${TARGET_DIR}" || exit 1;
  cp -r lib "${TARGET_DIR}" || exit 1;
  cp -r package.json "${TARGET_DIR}" || exit 1;
else
  echo "$TARGET_DIR is not a directory";
fi
