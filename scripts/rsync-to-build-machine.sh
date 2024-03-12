#!/usr/bin/env bash

#
# Example commands for remote building:
#
# # add `--ddc` for the first time sync
# ./scripts/rsync-to-build-machine.sh mbp:/tmp/ramdisk/datadocs
#
# ssh -C -N -L 127.0.0.1:8080:localhost:8080 mbp
# ssh -C -N -L 127.0.0.1:5001:127.0.0.1:5001 mbp
#

usage() {
  local bin;
  bin="$(basename "${BASH_SOURCE[0]}")";
  echo "";
  echo "  Usage: $bin [--ddc] <\$build_machine_host_and_path>";
  echo "";
  echo "  Options:";
  echo "";
  echo "  Example: $bin hostname:/path/to/datadocs";
  echo "";
  exit 0;
}

init() {
BASE_DIR=..
RSYNC_FILES=(
	deploy
  packages
  scripts
	package.json
  lerna.json
	yarn.lock
)
RSYNC_OPTIONS=(
	-a
	--xattrs
	--progress
	--iconv=utf-8
	--delete
	# --dry-run

	--exclude='._*'
	--exclude='.DS_Store'
	--exclude='.github'
	--exclude='.stats'
	--exclude='node_modules'
	--exclude='archived'
	--exclude='_dprctd*'

  --exclude='packages/canvas-datagrid-ng/typedoc'
	--exclude='packages/datadocs/src-inspect'

	--exclude='packages/canvas-datagrid-ng/dist'
	--exclude='packages/datadocs/dist'
	--exclude='packages/datasource-duckdb/dist'
	--exclude='packages/duckdb-utils/dist'
	--exclude='packages/local-storage/dist'
	--exclude='packages/windi-plugins/dist'
	--exclude='packages/mock-api-server/dist'

	--exclude='packages/submodule-template'
);
[ -n "$include_ddc" ] || RSYNC_OPTIONS+=( --exclude='packages/ddc' );
# the end of init()
}


throw() { echo -e "${RED}fatal: ${1}${RESET}" >&2; exit 1; }
execute() {
  printf "${BLUE}\$ %s${RESET}\n" "$*";
  "$@" || throw "Failed to execute '$1'";
}
SECONDS=0;
RED="\x1b[31m";
RESET="\x1b[0m";
BLUE="\x1b[34m\e[38;5;87m";

#
# parse args
rsync_target=;
include_ddc=;
parse_args() {
  local arg after_double_dash
  while [ "${#@}" -gt 0 ]; do
    arg="$1"; shift;
    if [ -n "$after_double_dash" ]; then rsync_target="$arg"; continue; fi
    case "$arg" in
      --) after_double_dash=1;;
      -h|--help|help) usage;;
      --ddc) include_ddc=1;;
      -*) throw  "Unknown option '$arg'";;
      *) rsync_target="$arg";
    esac
  done
}
parse_args "$@";
test -z "$rsync_target" && usage;
init;

#
# change the current directory to the script directory
pushd "$( dirname -- "${BASH_SOURCE[0]}" )" >/dev/null || exit 1;
execute cd -P "$BASE_DIR";

#
# checking required files
missing_files=();
for file in "${RSYNC_FILES[@]}"; do
  if [ -f "$file" ] || [ -d "$file" ]; then
    continue;
  fi
  missing_files+=("$file");
done
[ "${#missing_files[@]}" -eq 0 ] ||
  throw "There are some files are missing at local: ${missing_files[*]}";

# add dot files
[ -f .env ] && RSYNC_FILES+=( .env );

#
# rsync
# force to add a tailing '/'
rsync_target="${rsync_target%/}/";
execute rsync "${RSYNC_OPTIONS[@]}" -- "${RSYNC_FILES[@]}" "$rsync_target";

echo "done: +${SECONDS}s"
#endregion main
