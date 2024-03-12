#!/usr/bin/env bash

echo "> print latest 5 commits info";
set -x;
git log -n 5 --oneline --decorate;
set +x;

echo "> print latest 5 commits full hash";
set -x;
git log -n 5 --format='%H %s';
set +x;

echo "> get full hash of the latest commit";
set -x;
git log -n 5 --decorate --format='%H' | awk 'NR==2' |
  tee curr-commit-hash.pr.log;
set +x;

echo "> get full hash of previous commit";
set -x;
git log -n 5 --decorate --format='%H' | awk 'NR==3' |
  tee prev-commit-hash.pr.log;
set +x;

echo "> get diff info";
set -x;
git diff --stat \
  "$(cat prev-commit-hash.pr.log)" \
  "$(cat curr-commit-hash.pr.log)" |
  tee diff.pr.log;
set +x;

echo "> generate summary";
message="$(git log -n 1 --oneline --decorate "$(cat curr-commit-hash.pr.log)")";
full_message="${message}"$'\n'$'\n'"$(cat diff.pr.log)";
set -x;
echo "${full_message}" > summary.pr.log;
set +x;
