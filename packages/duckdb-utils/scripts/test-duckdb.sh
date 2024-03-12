#!/usr/bin/env bash

throw() { echo -e "fatal: $1" >&2; exit 1; }

command -v duckdb >/dev/null || throw "duckdb is not installed!";

pushd "$( dirname "${BASH_SOURCE[0]}" )" || exit 1;
cat ./test1.sql | duckdb ':memory:';
