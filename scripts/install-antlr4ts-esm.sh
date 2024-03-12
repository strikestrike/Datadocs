#!/usr/bin/env bash
# shellcheck disable=SC2016
#
# Usage: ./install-antlr4ts-esm.sh [-f|--force]
# 

URL='https://t67t.z23.web.core.windows.net/packages/antlr4ts-v0.5.0-alpha.4.tgz';
TARGET_DIRS=(
	"../packages/duckdb-utils/node_modules/antlr4ts"
	"../node_modules/antlr4ts"
);

# colors
GREEN="\x1b[32m";
RESET="\x1b[0m";

# throw $error
throw() { echo -e "fatal: $1" >&2; exit 1; }
execute() { echo "$ $*"; "$@" || throw "Failed to execute '$1'"; }
main() {
	command -v curl >/dev/null  || throw "curl is not installed!";
	command -v node >/dev/null  || throw "node is not installed!";
	command -v tar >/dev/null   || throw "tar is not installed!";

	# change the current directory to the script directory
	pushd "$( dirname -- "${BASH_SOURCE[0]}" )" >/dev/null || exit 1;

	temp_file="${URL%\?*}";
	temp_file="temp/${temp_file##*/}";

	execute mkdir -p "$(dirname -- "$temp_file")";

	if test -n "$FORCE_MODE" || ! test -f "$temp_file"; then
		execute curl -L -f -o "$temp_file" -- "$URL";
	fi

	for target_dir in "${TARGET_DIRS[@]}"; do
		test -d "$target_dir" || execute mkdir -p "$target_dir";
		execute find "$target_dir" -type f -delete;
		execute tar xzf "$temp_file" -C "${target_dir}"  --strip-components 1;

		target_dir="$(pushd "${target_dir}" >/dev/null && pwd)"
		echo -e "[+] installed to '${GREEN}${target_dir}${RESET}' ...";
	done
}

while [ "${#@}" -gt 0 ]; do
	if [[ "$1" == '-f' ]] || [[ "$1" == '--force' ]]; then FORCE_MODE=1; fi
	shift;
done
main;