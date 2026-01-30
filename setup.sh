#!/usr/bin/env bash
set -euo pipefail

# Setup script for pi dev package
#
# Creates a .pi-dev/ directory used as PI_CODING_AGENT_DIR when running
# `npm run dev`. It symlinks:
#
#   - Extensions, skills, prompts, agents, and config from this repo
#   - Auth, sessions, and keybindings from ~/.pi/agent/ so logins and
#     history carry over
#
# This avoids conflicts with the published version of this package
# installed globally in ~/.pi/agent/.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PI_DEV="$SCRIPT_DIR/.pi-dev"
PI_GLOBAL="$HOME/.pi/agent"

echo "=== Pi Dev Package — Local Setup ==="
echo ""
echo "Package directory: $SCRIPT_DIR"
echo ""

# Create directory
mkdir -p "$PI_DEV"

# Helper: create a symlink, replacing if it already exists
link() {
  local target="$1"
  local link_path="$2"

  if [[ -L "$link_path" ]]; then
    rm "$link_path"
  elif [[ -e "$link_path" ]]; then
    echo "  ⚠ $link_path exists and is not a symlink, skipping"
    return
  fi

  ln -s "$target" "$link_path"
  echo "  ✓ $(basename "$link_path") → $target"
}

echo "→ Creating symlinks in .pi-dev/"

# Project resources
link "$SCRIPT_DIR/extensions" "$PI_DEV/extensions"
link "$SCRIPT_DIR/skills" "$PI_DEV/skills"
link "$SCRIPT_DIR/prompts" "$PI_DEV/prompts"
link "$SCRIPT_DIR/agents" "$PI_DEV/agents"

# Config files
for item in settings.json models.json AGENTS.md APPEND_SYSTEM.md; do
  if [[ -f "$SCRIPT_DIR/config/$item" ]]; then
    link "$SCRIPT_DIR/config/$item" "$PI_DEV/$item"
  fi
done

# Carry over auth, sessions, keybindings from global install
for item in auth sessions keybindings.json; do
  if [[ -e "$PI_GLOBAL/$item" ]]; then
    link "$PI_GLOBAL/$item" "$PI_DEV/$item"
  fi
done

echo ""
echo "=== Setup complete ==="
echo ""
echo "  .pi-dev/"
for item in "$PI_DEV"/*; do
  if [[ -L "$item" ]]; then
    echo "    $(basename "$item") → $(readlink "$item")"
  fi
done
echo ""
echo "Run 'npm run dev' to launch pi with isolated config."
echo ""
echo "Required environment variables:"
echo "  BRAVE_API_KEY  — for web_search (free: https://brave.com/search/api/)"
echo "  JINA_API_KEY   — optional, for higher web_fetch rate limits"
