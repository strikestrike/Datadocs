#!/usr/bin/env bash

#
# A temporary solution for using "moduleResolution": "Bundler" in tsconfig
#
# Force upgrade all typescript dependencies in sub-modules to 5.x
#


BASE_DIR="../packages/ddc/packages";
# BASE_DIR="../../ddc/packages";

throw() { echo -e "fatal: $1" >&2; exit 1; }
execute() { echo "$ $*"; "$@" || throw "Failed to execute '$1'"; }
sed-inplace() {
  if [[ "$OSTYPE" == "darwin"* ]]; then execute sed -i '' "${@}";
  else execute sed -i "${@}";
  fi
}

pushd "$( dirname -- "${BASH_SOURCE[0]}" )" >/dev/null || exit 1;
pushd "$BASE_DIR" >/dev/null || exit 1;

execute pwd;

find . -name 'node_modules' -prune -o -type f -name 'package.json' -print |
  while read -r file; do
    sed-inplace -E 's/"typescript":.+"/"typescript": "^5"/' "$file" </dev/null;
  done

# sed-inplace -E 's/"moduleResolution":.+"/"moduleResolution": "Bundler"/' "../tsconfig.base.json";
echo "+ done";