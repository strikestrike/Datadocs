#!/usr/bin/env bash

REPO="datadocs/datadocs";
LOCAL_BRANCH="main";
REMOTE_BRANCH="main";

URL_BASE="https://github.com/$REPO/compare/";

LOCAL_HASH="$(git rev-parse "$LOCAL_BRANCH")";
echo "local: ${LOCAL_BRANCH} => ${LOCAL_HASH}";

SHORT_LOCAL_HASH="${LOCAL_HASH:0:7}";

echo "url:";
echo "";
echo "  ${URL_BASE}${SHORT_LOCAL_HASH}...${REMOTE_BRANCH}";
echo "";