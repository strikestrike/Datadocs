#!/usr/bin/env bash

throw() { echo -e "fatal: $1" >&2; exit 1; }
execute() { echo "$ $*"; "$@" || throw "Failed to execute '$1'"; }
command -v git >/dev/null || throw "git is not installed!";


# change the current directory to the project directory
pushd "$( dirname -- "${BASH_SOURCE[0]}" )/.." >/dev/null || exit 1;

execute git submodule deinit -f packages
execute git submodule update --init

echo "";
git submodule foreach 'git log -n 1 --format=medium HEAD;echo;'
