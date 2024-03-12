#!/usr/bin/env bash

# git branch -a --sort=-committerdate | awk '{print $1}' | awk '/^remotes\// && !/^remotes\/github\/archived\// {gsub("remotes/github/", "");print $0;}'
# exit 1;

# gh=gh

remote="datadocs/datadocs";
branch_names=(
  # update_sort4
  # update_sort5
  # update_sort6
  # update_sort7
  # update_sort8
  # update_sort9
  # update_sort10
  # ...
);

for branch_name in "${branch_names[@]}"; do
  echo "[.] ${branch_name}";
  # set -x;
  # git push -d github "archived/${branch_name}"
  # "$gh" api "repos/${remote}/branches/${branch_name}/rename" -f "new_name=archived/${branch_name}" || exit 1;
  # set +x;
done

set -x;
git fetch github --prune
