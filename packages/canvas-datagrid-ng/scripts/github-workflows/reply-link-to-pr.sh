#!/usr/bin/env bash

MESSAGE='Hi, I deployed the demo from your latest commit to here:
%s

%s
'

usage() {
  echo -e "";
  echo -e "  Usage: reply-link-to-pr.sh <pr-id> <link> [commit-info]";
  echo -e "";
  echo -e "  Environment variable: \$REPO, \$BOT, \$BOT_PAT";
  echo -e "";
  echo -e "  Example variable:";
  echo -e "";
  echo -e "    REPO=org/repo";
  echo -e "    BOT=test-bot";
  echo -e "    BOT_PAT=ghp_xxxxxxxxxxx";
  echo -e "";
  exit 0;
}
throw() { echo -e "fatal: $1" >&2; exit 1; }

PR_ID="$1";
LINK="$2";
COMMIT_INFO="$3";

test -n "$PR_ID" || usage;
test -n "$LINK" || usage;

test -n "$REPO" || throw "\$REPO is empty!";
test -n "$BOT" || throw "\$BOT is empty!";
test -n "$BOT_PAT" || throw "\$BOT_PAT is empty!";

function get_post_body() {
  local _COMMIT_INFO _NL;
  _COMMIT_INFO="$COMMIT_INFO";
  _NL=$'\n';
  # Wrap commit info with code block if the commit info is provided
  test -n "$_COMMIT_INFO" &&
    _COMMIT_INFO="${_NL}\`\`\`${_NL}${_COMMIT_INFO}${_NL}\`\`\`";

  export _COMMIT_INFO="$_COMMIT_INFO";
  export _LINK="$LINK";
  export _MESSAGE="$MESSAGE";
  node -e '
    const { _LINK, _MESSAGE, _COMMIT_INFO } = process.env;
    const body = _MESSAGE.replace("%s",_LINK).replace("%s",_COMMIT_INFO);
    console.log(JSON.stringify({body}));
  ';
}

curl \
  --request POST \
  --user "${BOT}:${BOT_PAT}" \
  --header "Accept: application/vnd.github.v3+json" \
  --data "$(get_post_body)" \
  --fail \
  "https://api.github.com/repos/${REPO}/issues/${PR_ID}/comments" \
  || throw "POST comments failed!";
