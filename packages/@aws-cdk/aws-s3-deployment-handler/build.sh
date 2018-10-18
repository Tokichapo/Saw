#!/bin/bash
set -euo pipefail
dist=$PWD/dist
staging=$PWD/staging

rm -fr ${dist} ${staging}
mkdir -p ${dist} ${staging}

echo "staging: ${staging}"
pip install -r requirements.txt -t "${staging}"
rsync -av src/ "${staging}"

# move bin/aws one level up so it can "import" awscli
cp ${staging}/bin/aws ${staging}

echo "creating lambda.zip bundle..."
cd ${staging}
zip -r ${dist}/lambda.zip .
