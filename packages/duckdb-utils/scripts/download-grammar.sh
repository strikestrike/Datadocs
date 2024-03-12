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
DOWNLOAD_URL_BASE="https://t67t.z23.web.core.windows.net/duckdb-sql-grammar"

throw() { echo -e "fatal: $1" >&2; exit 1; }
pushd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null || exit 1;

SHA1_LIST="$(sha1sum "${FILE_LIST[@]}")";
SHA1="$(echo "$SHA1_LIST" | sha1sum - | awk '{print $1}')";
DOWNLOAD_URL="${DOWNLOAD_URL_BASE}/${SHA1}.tgz";

TMP_DIR="scripts/.tmp";
DOWNLOAD_TO="${TMP_DIR}/${SHA1}.tgz";
mkdir -p "$TMP_DIR" || throw "failed to create temporary dir";

echo "";
echo "sha1: ${SHA1}";
echo "downloading from '${DOWNLOAD_URL}' ...";
echo "";

# -s: exists and not empty
if ! test -s "$DOWNLOAD_TO"; then
  curl -f -L -o "$DOWNLOAD_TO" "$DOWNLOAD_URL" || throw "failed to download";
fi

tar xzf "$DOWNLOAD_TO" || throw "failed to extract '${DOWNLOAD_TO}'";
ls -al "$DEST_DIR";

echo "done: downlaoded and installed";
