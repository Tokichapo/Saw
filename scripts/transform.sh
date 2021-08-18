#!/bin/bash

set -euo pipefail
scriptdir=$(cd $(dirname $0) && pwd)

# Creates a symlink in each individual package's node_modules folder pointing
# to the root folder's node_modules/.bin. This allows yarn to find the executables
# it needs (e.g., jsii-rosetta) for the build.
createSymlinks() {
  find . ! -path . -type d -maxdepth 1 \
    -exec mkdir -p {}/node_modules \; \
    -exec ln -sf "${scriptdir}"/../node_modules/.bin {}/node_modules \;
}

runtarget="build"
run_tests="true"
extract_snippets="false"
skip_build=""
while [[ "${1:-}" != "" ]]; do
    case $1 in
        -h|--help)
            echo "Usage: transform.sh [--skip-test/build] [--extract]"
            exit 1
            ;;
        --skip-test|--skip-tests)
            run_tests="false"
            ;;
        --skip-build)
            skip_build="true"
            ;;
        --extract)
            extract_snippets="true"
            ;;
        *)
            echo "Unrecognized options: $1"
            exit 1
            ;;
    esac
    shift
done
if [ "$run_tests" == "true" ]; then
  runtarget="$runtarget+test"
fi
if [ "$extract_snippets" == "true" ]; then
  # ToDo: handle the 'extract' option here
  # (right now, it fails because jsii-rosetta can't be found in the copied packages)
  runtarget="$runtarget+extract"
#  echo "Warning: the --extract option is currently ignored by the 'transform' script"
fi

export NODE_OPTIONS="--max-old-space-size=4096 --experimental-worker ${NODE_OPTIONS:-}"

INDIVIDUAL_PACKAGES_FOLDER=${scriptdir}/../packages/individual-packages
# copy & build the packages that are individually released from 'aws-cdk-lib'
cd "$INDIVIDUAL_PACKAGES_FOLDER"
../../tools/individual-pkg-gen/bin/individual-pkg-gen

createSymlinks "$INDIVIDUAL_PACKAGES_FOLDER"

if [ "$skip_build" != "true" ]; then
  PHASE=transform yarn lerna run --stream $runtarget
fi
