#!/usr/bin/env bash

#
# Download built grammar files (parser/lexer) from the upstream instead of building locally
# This script is useful for developers who don't have java development environment
#

FILE_LIST=(
  grammar/DuckDBSQLLexer.g4
  grammar/DuckDBSQLParser.g4
)
DEST_DIR=lib/antlr

throw() { echo -e "fatal: $1" >&2; exit 1; }
pushd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null || exit 1;

SHA1_LIST="$(sha1sum "${FILE_LIST[@]}")";
SHA1="$(echo "$SHA1_LIST" | sha1sum - | awk '{print $1}')";

TMP_DIR="scripts/.tmp";
PACK_TO="${TMP_DIR}/${SHA1}.tgz";
mkdir -p "$TMP_DIR" || throw "failed to create temporary dir";

if test -f "$PACK_TO"; then
  rm "$PACK_TO" || throw "failed to clean file '$PACK_TO'";
fi

echo "sha1:    ${SHA1}";
echo "pack to: ${PACK_TO}";
tar czf "${PACK_TO}" "${DEST_DIR}" || throw "failed to create '${PACK_TO}'";

AZ_UPLOAD="scripts/az-upload.sh"
ENV_FILE=".env";
UPLOAD_ARGS=(
  "$PACK_TO"
  "duckdb-sql-grammar/${SHA1}.tgz"
  --env "$ENV_FILE"
  --verbose
)
if test -x "$AZ_UPLOAD"; then
  test -f "$ENV_FILE" || throw "env file '$ENV_FILE' doesn't exist";

  echo "$ $AZ_UPLOAD ${UPLOAD_ARGS[*]} ...";
  "$AZ_UPLOAD" "${UPLOAD_ARGS[@]}" || throw "failed to upload";
fi

echo "done";
