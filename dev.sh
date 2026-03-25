#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="${1:-$SCRIPT_DIR/test-workspace}"
WORKSPACE_DIR="$(cd "$WORKSPACE_DIR" && pwd)"
DEV_STATE_DIR="$SCRIPT_DIR/.dev-host"
USER_DATA_DIR="$DEV_STATE_DIR/user-data"
EXTENSIONS_DIR="$DEV_STATE_DIR/extensions"

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is not installed or not on PATH." >&2
  exit 1
fi

if ! command -v code >/dev/null 2>&1; then
  echo "Error: VS Code CLI 'code' was not found on PATH." >&2
  echo "Install it from VS Code: Command Palette -> Shell Command: Install 'code' command in PATH" >&2
  exit 1
fi

if [ ! -d "$WORKSPACE_DIR" ]; then
  echo "Error: workspace path does not exist: $WORKSPACE_DIR" >&2
  echo "Usage: $0 [workspace-path]" >&2
  exit 1
fi

cd "$SCRIPT_DIR"

echo "Installing dependencies..."
npm install

echo "Compiling extension..."
npm run compile

mkdir -p "$USER_DATA_DIR" "$EXTENSIONS_DIR"

echo "Workspace: $WORKSPACE_DIR"
echo "User data dir: $USER_DATA_DIR"
echo "Extensions dir: $EXTENSIONS_DIR"
echo "Launching Extension Development Host..."
code \
  --new-window \
  --disable-extensions \
  --user-data-dir="$USER_DATA_DIR" \
  --extensions-dir="$EXTENSIONS_DIR" \
  --extensionDevelopmentPath="$SCRIPT_DIR" \
  "$WORKSPACE_DIR"
