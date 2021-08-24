#!/bin/bash

# To run this script in development, first build the following packages:
#     packages/@aws-cdk/assert
#     packages/aws-cdk-lib
#     tools/individual-pkg-gen

set -euo pipefail
scriptdir=$(cd $(dirname $0) && pwd)

# Creates a symlink in each individual package's node_modules folder pointing
# to the root folder's node_modules/.bin. This allows yarn to find the executables
# it needs (e.g., jsii-rosetta) for the build.
#
# The reason yarn doesn't find the executables in the first place is that they are
# not dependencies of each individual package -- nor should they be. They can't be
# found in the lerna workspace, either, since it only includes the individual
# packages. A possible solution that doesn't involve using this workaround function
# is to add more packages to the workspace, which includes at least awslint and all
# the tools/* packages, but potentially more, such as cloudformation-diff,
# cloud-assembly-schema and others, which are dependencies of one or more of the
# tools packages.
#
# In addition, we need to copy aws-cdk-lib inside individual-packages/ and remove
# all @aws-cdk/* packages from its devDependencies section. Otherwise, the build
# process for the experimental packages will include 250+ packages altogether,
# making the build time unworkable.
#
# Finally, we will need to restrict the build command only to the packages inside
# individual-packages/, which may be achieved with yarn 2 commands such as
# yarn workspaces foreach <commandName>, available with the workspace-tools plugin.
createSymlinks() {
  find "$1" ! -path "$1" -type d -maxdepth 1 \
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
  runtarget="$runtarget+extract"
fi

export NODE_OPTIONS="--max-old-space-size=4096 --experimental-worker ${NODE_OPTIONS:-}"

individual_packages_folder=${scriptdir}/../packages/individual-packages
# copy & build the packages that are individually released from 'aws-cdk-lib'
cd "$individual_packages_folder"
../../tools/individual-pkg-gen/bin/individual-pkg-gen

createSymlinks "$individual_packages_folder"

if [ "$skip_build" != "true" ]; then
  PHASE=transform yarn lerna run --stream $runtarget
fi
