#!/bin/bash
set -euo pipefail

bail="--bail"
scope=""
up=""
down=""
skipapi=false
skipclean=false
runtarget="build+test"
while [[ "${1:-}" != "" ]]; do
    case $1 in
        -h|--help)
            echo "Usage: build.sh [--no-bail] [--force|-f] [--skip-test] [--scope [<package-name>] [--up|-u] [--down|-d]] [--skip-api-check] [--skip-clean]"
            exit 1
            ;;
        --no-bail)
            bail="--no-bail"
            ;;
        -f|--force)
            export CDK_BUILD="--force"
            ;;
        --skip-test|--skip-tests)
            runtarget="build"
            ;;
        --scope)
            target="${2:-}"
            if [ -z "$target" ] || [[ $target =~ ^--* ]]; then 
                scriptdir=$(cd $(dirname $0) && pwd)
                target=$(${scriptdir}/scripts/current-scope)
            else
                shift
            fi
            scope="--scope $target"
            ;;
        -u|--up)
            up="--include-filtered-dependencies"
            ;;
        -d|--down)
            down="--include-filtered-dependents"
            ;;
        --skip-api-check|--skip-api-checks)
            skipapi=true
            ;;
        --skip-clean)
            skipclean=true
            ;;
        *)
            echo "Unrecognized parameter: $1"
            exit 1
            ;;
    esac
    shift
done

if [ -z "$scope" ]; then
    up=""
    down=""
fi

if [ ! -d node_modules ]; then
    /bin/bash ./install.sh
fi

fail() {
  echo "❌  Last command failed. Scroll up to see errors in log (search for '!!!!!!!!')."
  exit 1
}

/bin/bash ./git-secrets-scan.sh

# Prepare for build with references
/bin/bash scripts/generate-aggregate-tsconfig.sh > tsconfig.json

BUILD_INDICATOR=".BUILD_COMPLETED"
rm -rf $BUILD_INDICATOR

export PATH=$(npm bin):$PATH
export NODE_OPTIONS="--max-old-space-size=4096 ${NODE_OPTIONS:-}"

# Speed up build by reusing calculated tree hashes
# On dev machine, this speeds up the TypeScript part of the build by ~30%.
export MERKLE_BUILD_CACHE=$(mktemp -d)
trap "rm -rf $MERKLE_BUILD_CACHE" EXIT

if [ "$skipclean" = false ]; then
    echo "============================================================================================="
    echo "removing stale files..."
    /bin/bash scripts/clean-stale-files.sh
fi

echo "============================================================================================="
echo "building..."
time lerna run $bail --stream $runtarget $scope $up $down || fail

if [ "$skipapi" = false ]; then
    echo "============================================================================================="
    echo "running api checks..."
    /bin/bash scripts/check-api-compatibility.sh $scope $up $down
fi

touch $BUILD_INDICATOR
