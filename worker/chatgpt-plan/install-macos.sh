#!/bin/zsh
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
runtime_dir="$HOME/Library/Application Support/TomEng/runtime"
agent_file="$HOME/Library/LaunchAgents/vn.tomeng.speaking-worker.plist"
node_bin="$(command -v node)"

if [[ ! -f "$HOME/.tomeng-chatgpt/worker.env" ]]; then
  print -u2 'Missing ~/.tomeng-chatgpt/worker.env'
  exit 1
fi
if [[ ! -d "$repo_root/sync-api/node_modules/@neondatabase/serverless" ]]; then
  print -u2 'Run npm ci --prefix sync-api first'
  exit 1
fi

mkdir -p "$runtime_dir/worker/chatgpt-plan" "$runtime_dir/sync-api" "${agent_file:h}"
cp "$repo_root"/worker/chatgpt-plan/*.mjs "$runtime_dir/worker/chatgpt-plan/"
cp "$repo_root/data.js" "$runtime_dir/data.js"
cp "$repo_root/sync-api/package.json" "$runtime_dir/sync-api/package.json"
rsync -a "$repo_root/sync-api/node_modules/" "$runtime_dir/sync-api/node_modules/"

python3 - "$repo_root" "$runtime_dir" "$agent_file" "$node_bin" <<'PY'
from pathlib import Path
import sys
repo, runtime, target, node = map(Path, sys.argv[1:])
template = (repo / 'worker/chatgpt-plan/vn.tomeng.speaking-worker.plist').read_text()
target.write_text(template.replace('__NODE__', str(node)).replace('__RUNTIME__', str(runtime)).replace('__HOME__', str(Path.home())))
PY
plutil -lint "$agent_file"
launchctl bootout "gui/$(id -u)/vn.tomeng.speaking-worker" >/dev/null 2>&1 || true
sleep 1
launchctl bootstrap "gui/$(id -u)" "$agent_file"
launchctl print "gui/$(id -u)/vn.tomeng.speaking-worker" >/dev/null
print 'TomEng speaking worker is running.'
