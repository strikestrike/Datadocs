#!/usr/bin/env bash
# shellcheck disable=SC2016

# Please export a GitHub token with `workflow` permission before running this script:
# export GITHUB_TOKEN=ghp_***********
# You can create it in here: https://github.com/settings/tokens/new
#
# Usage: ./install-modules-from-github.sh [commit-sha1]
# 

#region config
ddc_repo="datadocs/ddc";
ddc_artifact_name="pkg";
ddc_install_to="../packages/ddc";
max_file_age=$(( 4 * 3600 )) # 4 hours
#endregion config

#
#region basic utility functions
#
CYAN="\x1b[36m"; RED="\x1b[31m"; RESET="\x1b[0m";
throw() { echo -e "${RED}fatal: ${1}${RESET}" >&2; exit 1; }
command -v curl >/dev/null  || throw "curl is not installed!";
command -v node >/dev/null  || throw "node is not installed!";
command -v unzip >/dev/null || throw "unzip is not installed!";
command -v tar >/dev/null   || throw "tar is not installed!";

execute() { echo -e "${CYAN}$ ${*}${RESET}"; "$@" || throw "failed to execute '$1'"; }
resolve_file() { find . -maxdepth 1 -type f -iname "$1" | head -n 1; }
create_dir() { [ -d "$1" ] || execute mkdir -p "$1"; }
clean_dir() { [ -d "$1" ] && execute rm -r -- "$1"; execute mkdir -p "$1"; }

if stat --version 2>/dev/null >/dev/null; 
then get_file_mtime() { stat -c %Y "$1"; }
else get_file_mtime() { stat -f %m "$1"; } # BSD/Darwin
fi

# check_file $file $max_age
check_file() {
	[ -s "$1" ] || return 1; # is a non-empty file?
	[ -n "$2" ] && return 0;
	[ "$(( $(date +%s) - $(get_file_mtime "$1") ))" -lt "$2" ] && return 0;
	execute rm -- "$1";
	return 1; # the file is expired
}
# resolve_path $path
resolve_path() {
	local path;
	path="$(cd -- "$(dirname -- "$1")" &> /dev/null && pwd)";
	[ -n "$path" ] && echo "${path}/$(basename -- "$1")";
}
#endregion basic utility functions

#
#region functions
#
# load_env_file $dotenv_file
load_env_file() {
	test -f "$1" || return 1;
	while read -r line; do
		[[ "$line" != 'GITHUB_TOKEN='* ]] && continue;
		line="${line#GITHUB_TOKEN=}";
		line="${line#\"}"; line="${line%\"}";
		line="${line#\'}"; line="${line%\'}";
		GITHUB_TOKEN="$line";
		echo "[~] loaded GITHUB_TOKEN from '$1'";
		return 0;
	done <<< "$(cat "$1")";
	return 1;
}
# request_github $url $file
request_github() {
	echo "[.] request '$1' to '$2'";
	test -n "$GITHUB_TOKEN" || throw 'environment varible $GITHUB_TOKEN is missing!';
	execute curl -Lfo "$2" \
		-H "Authorization: Bearer $GITHUB_TOKEN"\
		-H "X-GitHub-Api-Version: 2022-11-28" -- "$1";
}
# get_artifact_download_url <$json_file> [$commit_sha1]
get_artifact_download_url() {
	env json_file="$1" commit_sha1="$2" git_repo="$ddc_repo" node -e '
	const { json_file, commit_sha1, git_repo } = process.env;

	const res = JSON.parse(require("fs").readFileSync(json_file,"utf-8"));
	let artifact = res.artifacts[0];
	if(commit_sha1) artifact = res.artifacts.find(it=>it.workflow_run.head_sha===commit_sha1);
	if(!artifact) process.exit(1);

	const { expired, created_at, workflow_run, archive_download_url } = artifact;
	const { id, head_sha, head_branch } = workflow_run;
	console.error(`[ ] matched workflow run: "https://github.com/${git_repo}/actions/runs/${id}"`);
	console.error(`[ ] created at: ${new Date(artifact.created_at).toJSON()}`);

	if(expired) { console.error("fatal: artifact is expired"); process.exit(1); }
	console.log(artifact.archive_download_url);';
}
# download_artifact_file $repo $artifact_name $download_to [$commit_sha1]
download_artifact_file() {
	local repo artifact_name download_to commit_sha1 url
	repo="$1";
	artifact_name="$2";
	download_to="$3";
	commit_sha1="$4";
	log="[.] downloading artifact $artifact_name into '$download_to' from the repo '$repo'"
	[ -n "$commit_sha1" ] && log="${log} (commit=$commit_sha1)";
	echo "${log} ...";
	
	per_page=1;
	[ -n "$commit_sha1" ] && per_page=99;
	url="https://api.github.com/repos/$1/actions/artifacts?name=$2&per_page=$per_page";
	response_file="temp/response.json";
	
	request_github "$url" "$response_file";
	artifact_download_url="$(get_artifact_download_url "$response_file" "$commit_sha1")";
	[ -n "$artifact_download_url" ] || throw "failed to extract artifact URL from '$response_file' ...";

	request_github "$artifact_download_url" "$download_to";
}
# normalize_package_version $package_json
normalize_package_version() {
	env package_json_file="$1" node -e '
	const fs = require("fs");
	const file = process.env.package_json_file;
	const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
	pkg.version = pkg.version.match(/^([\d\.]+)/)[1];
	fs.writeFileSync(file, JSON.stringify(pkg, null, 2));';
}
postinstall() {
	test -f "${1}/package.json" && normalize_package_version "${1}/package.json";
	echo -e "[+] installed to '$1' ...";
	exit 0;
}
#endregion functions

#                      _         
#  _ __ ___     __ _  (_)  _ __  
# | '_ ` _ \   / _` | | | | '_ \ 
# | | | | | | | (_| | | | | | | |
# |_| |_| |_|  \__,_| |_| |_| |_|
#                         
#region main
# change the current directory to the script directory
LAST_PWD="${PWD}";
pushd "$( dirname -- "${BASH_SOURCE[0]}" )" >/dev/null || exit 1;

load_env_file "${LAST_PWD}/.env" || 
	load_env_file .env ||
	load_env_file ../.env;

create_dir temp;
create_dir downloaded;

commit_sha1="$1";
if [ -n "$commit_sha1" ]; then artifact_download_to="downloaded/${commit_sha1}.zip";
else artifact_download_to="temp/ddc.zip";
fi

_ddc_install_to="$(resolve_path "${PWD}/${ddc_install_to}")";
[ -n "$_ddc_install_to" ] || throw "failed to resolve '${ddc_install_to}'"
ddc_install_to="$_ddc_install_to";

echo "[ ] ddc_repo=${ddc_repo}";
echo "[ ] ddc_artifact_name=${ddc_artifact_name}";
echo "[ ] download_to=${artifact_download_to}";
echo "[ ] install_to=${ddc_install_to}";

# skip downloading if file exists
if [ -n "$commit_sha1" ] && [ -s "$artifact_download_to" ]; then true;
elif check_file "$artifact_download_to" "$max_file_age"; then true;
else
	download_artifact_file "$ddc_repo" "$ddc_artifact_name" "$artifact_download_to" "$commit_sha1";
fi

execute unzip -o -d temp -- "$artifact_download_to";
pushd temp >/dev/null && execute pwd || exit 1;

# processing the old version of the artifact
tgz_artifacts="$(resolve_file 'datadocs-ddc-*.tgz')";
if test -n "$tgz_artifacts"; then
	execute tar xf "$tgz_artifacts";
	clean_dir "$ddc_install_to";

	execute mv package "$ddc_install_to";
	postinstall "$ddc_install_to";
fi

# processing the new version of the artifact (monorepo)
targz_artifacts="$(resolve_file 'dist.tar.gz')"
if test -n "$targz_artifacts"; then
	execute tar xzf "$targz_artifacts";
	clean_dir "$ddc_install_to";

	execute mv packages "${ddc_install_to}/packages";
	postinstall "$ddc_install_to";
fi

throw "failed to resolve the artifact file";
#endregion main
