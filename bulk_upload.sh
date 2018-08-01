#!/bin/bash

## Recursively scans

folder=${1:-sample_images/}
total=0

find "${folder}" -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) | while read f; do

  # Create comma-separated tags from the absolute path. A file at
  # /foo/bar/baz/image.jpg will have tags "foo", "bar", and "baz"
  tags=$(echo "$(dirname "$(realpath "$f")")" | sed -e 's/\//,/g' -e 's/^,//')
  imgSource=$(basename "$(dirname "$f")")

  # Upload the image, print newline because the response doesn't contain a
  # final one
  curl http://localhost:3000/api/v1/media -s \
      -F file=@"${f}" \
      -F tags="${tags}" \
      -F source="${imgSource}"
  echo ""

  ((total++))

done

