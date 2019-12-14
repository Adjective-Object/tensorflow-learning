#!/usr/bin/env bash

for x in $(cat log | grep test_data | sort | sed 's/"//g' | cut -d ' ' -f 1 | uniq ); do if ! grep -q "$x\" loaded successfully" log; then echo $x; fi; done
