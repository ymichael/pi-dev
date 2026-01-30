#!/usr/bin/env bash
set -euo pipefail

# Setup script for pi dev package
#
# Creates a .pi/ directory in this folder with symlinks pointing to the
# package resources (extensions, skills, prompts, agents). This makes it
# easy to develop and test locally — just run `pi` from this directory
# and everything is wired up via the .pi/ folder.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PI_LOCAL="$SCRIPT_DIR/.pi"

echo "=== Pi Dev Package — Local Setup ==="
echo ""
echo "Package directory: $SCRIPT_DIR"
echo ""

# Create .pi directory
mkdir -p "$PI_LOCAL"

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
  echo "  ✓ $(basename "$link_path") → $(basename "$target")/"
}

echo "→ Creating symlinks in .pi/"

# Extensions
link "$SCRIPT_DIR/extensions" "$PI_LOCAL/extensions"

# Skills
link "$SCRIPT_DIR/skills" "$PI_LOCAL/skills"

# Prompts
link "$SCRIPT_DIR/prompts" "$PI_LOCAL/prompts"

# Agents (for subagent discovery — project-level .pi/agents/)
link "$SCRIPT_DIR/agents" "$PI_LOCAL/agents"

# Settings
if [[ -f "$SCRIPT_DIR/config/settings.json" ]]; then
  link "$SCRIPT_DIR/config/settings.json" "$PI_LOCAL/settings.json"
fi

# Models
if [[ -f "$SCRIPT_DIR/config/models.json" ]]; then
  link "$SCRIPT_DIR/config/models.json" "$PI_LOCAL/models.json"
fi

# AGENTS.md (if it exists)
if [[ -f "$SCRIPT_DIR/config/AGENTS.md" ]]; then
  link "$SCRIPT_DIR/config/AGENTS.md" "$PI_LOCAL/AGENTS.md"
fi

# APPEND_SYSTEM.md (if it exists)
if [[ -f "$SCRIPT_DIR/config/APPEND_SYSTEM.md" ]]; then
  link "$SCRIPT_DIR/config/APPEND_SYSTEM.md" "$PI_LOCAL/APPEND_SYSTEM.md"
fi

echo ""
echo "=== Setup complete ==="
echo ""
echo "  .pi/"
for item in "$PI_LOCAL"/*; do
  if [[ -L "$item" ]]; then
    echo "    $(basename "$item") → $(readlink "$item")"
  fi
done
echo ""
echo "Now run 'pi' from this directory to test."
echo ""
echo "Required environment variables:"
echo "  BRAVE_API_KEY  — for web_search (free: https://brave.com/search/api/)"
echo "  JINA_API_KEY   — optional, for higher web_fetch rate limits"
