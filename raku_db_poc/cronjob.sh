#!/bin/bash

x=0

while true; do
  raku sync_db.raku $x
  x=$(wc --lines <"queue.json")
  sleep 5
done
