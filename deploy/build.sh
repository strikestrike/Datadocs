#!/usr/bin/env bash

throw() { echo -e "fatal: $1" >&2; exit 1; }

# make sure current directory is the project root
pushd "$( dirname "${BASH_SOURCE[0]}" )/.." || exit 1;

rm -rf deploy/build || throw "clean the directory 'deploy/build' failed!"
mkdir -p deploy/build/grid || throw "create the directory 'deploy/build/grid' failed!"

grid_dist="packages/canvas-datagrid-ng/dist";
grid_demo="packages/canvas-datagrid-ng/demo"
cp -r ${grid_dist}/*.mjs \
	${grid_demo}/data-source \
	deploy/build/grid/ || throw "copy grid files failed!";

if test -d packages/datadocs/dist/assets; then
	# from new building tools (Vite)
	cp -r packages/datadocs/dist/* deploy/build/ || throw "copy files to 'deploy/build' failed!";
else
	cp -r packages/datadocs/public/* deploy/build/ || throw "copy files to 'deploy/build' failed!";
fi

timestamp=$(date +%s)
sed -i -e "s/#TIMESTAMP#/${timestamp}/g" deploy/build/index.html ||
	throw "replace timestamp in index.html failed!"

rm_file() { test -f "$1" && rm -v "$1"; }
rm_file deploy/build/_dprctd-index.html;
rm_file deploy/build/index.html-e;

true;
# rm deploy/build/build/*.map

# cp -r deploy/.htaccess deploy/build/.htaccess
