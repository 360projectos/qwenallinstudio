#!/usr/bin/env bash
set -euo pipefail
MASTER="$(cd "$(dirname "$0")/.." && pwd)"
PROD="${1:-/app/lab-studio-production}"
TAG="${2:-v4.0.2-prod}"
bash "$MASTER/scripts/gates.sh"
rm -rf "$PROD"; mkdir -p "$PROD"
rsync -a --exclude node_modules --exclude .git --exclude dist --exclude .data "$MASTER/" "$PROD/"
cd "$PROD"
git init -q; git add -A
git -c user.email=owner@labstudio -c user.name=owner commit -qm "Lab Studio $TAG produccion autonoma"
git tag "$TAG"
echo "OK Produccion: $PROD tag $TAG"
echo "gcloud builds submit --tag gcr.io/PROJECT/lab-studio:$TAG"
echo "gcloud run deploy lab-studio --image gcr.io/PROJECT/lab-studio:$TAG --region us-central1 --allow-unauthenticated --port 8080"