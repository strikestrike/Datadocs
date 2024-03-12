#!/usr/bin/env bash

#
# This script will do these things:
# 1. Download azure-utils script for uploading files to azure blob storage
# 2. Upload files to azure blob storage
# 3. Save the deploy infomarion to the file "deploy-demo-result.log"
#

# base directory is the project root
files=(
  'demo/base/index.html -> base/index.html'
  'demo/base/index.js -> base/index.js'
  'demo/data-source/index.html -> data-source/index.html'
  'demo/data-source/index.js -> data-source/index.js'
  'dist/canvas-datagrid.debug.js -> canvas-datagrid.debug.js'
);
azure_container='$web'
result_host='t67t.z23.web.core.windows.net'
to_project='../..'

goto_dir() {
  pushd "$1" >/dev/null || exit 1;
  echo "pwd: $(pwd)";
}
throw() { echo -e "fatal: $1" >&2; exit 1; }

goto_dir "$( dirname "${BASH_SOURCE[0]}" )";
PROJECT_ROOT="$(cd "${to_project}" && pwd)";

tools_base_url="https://raw.githubusercontent.com/hangxingliu/azure-utils/v1.2.0"
az_upload_tools_url="${tools_base_url}/dist/az-upload.js";

resolve_tools() {
  local local_file
  local_file="$1";
  local_file="${local_file%%\?*}";
  local_file="${local_file%%\#*}";
  local_file="${local_file##*/}";
  if ! test -f "${local_file}"; then
    set -x;
    curl --fail --output "${local_file}" "$1" || exit 1;
    chmod +x "${local_file}" || exit 1;
    set +x;
  fi
}
resolve_tools "$az_upload_tools_url";

az_upload_tools="$(pwd)/az-upload.js";
az_upload() {
  local next_args;
  next_args=( --container "$azure_container" );
  test -f .env && next_args+=( --env '.env' );
  next_args+=( "${@}" );
  echo "+ az upload ${next_args[@]}"
  node "${az_upload_tools}" "${next_args[@]}" || throw "upload file failed!";
}

goto_dir "${PROJECT_ROOT}";

echo "+ git rev-parse HEAD";
git_hash="$(git rev-parse HEAD)"
echo "> ${git_hash}"
test -z "${git_hash}" && throw "get git latest commit's hash failed!";

echo "+ check if all files are existing";
for file_mapping in "${files[@]}"; do
  local_file="${file_mapping%% -> *}";
  test -f "$local_file" || throw "'$local_file' is not existing!"
done

remote_base_uri="${git_hash}/"
result_uri_array=();
add_result_uri() { [[ "$1" == *'.html' ]] && result_uri_array+=( "$1" ); }

for file_mapping in "${files[@]}"; do
  local_file="${file_mapping%% -> *}";
  remote_file="${remote_base_uri}${file_mapping##* -> }";

  add_result_uri "$remote_file";
  az_upload "${local_file}" "${remote_file}";
done

if [ -f "extra-demo.dir.log" ]; then
  list="$(cat extra-demo.dir.log)";
  while read -r dir; do
    test -z "$dir" && continue;
    if [ ! -d "$dir" ]; then
      echo "skip: extra demo dir '$dir'";
      continue;
    fi

    files="$(find "$dir" -type f \! -name '.*')";
    while read -r file; do
      test -z "$file" && continue;

      remote_file="${file#./}";        # Remove leading './'
      remote_file="${remote_file#*/}"; # Remove first level directory
      remote_file="${remote_base_uri}${remote_file}";

      add_result_uri "$remote_file";
      az_upload "${file}" "${remote_file}" </dev/null;
    done <<< "$files";

  done <<< "$list";
fi

rm deploy-demo-result.log;
echo "";
for result_uri in "${result_uri_array[@]}"; do
  result_url="https://${result_host}/${result_uri}";
  echo "- <${result_url}>" >> deploy-demo-result.log;
  echo "  ${result_url}";
done
echo "";
echo "done!";
