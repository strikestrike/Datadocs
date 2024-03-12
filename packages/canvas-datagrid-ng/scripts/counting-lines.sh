#!/usr/bin/env bash

cd lib &&
  find . -type f -name '*.ts' -exec wc -l {} \; |
    sort -n |
    awk '{print $0;l+=$1;} END{print "   " l " total"}'
