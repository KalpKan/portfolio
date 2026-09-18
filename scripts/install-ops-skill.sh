#!/usr/bin/env bash
# Install (or refresh) the portfolio-ops living skill into Claude Code's personal skills directory.
#
# Why this exists: the skill is versioned in the hub repo at skills/portfolio-ops/ so it changes
# with the code, but Claude Code only loads skills from ~/.claude/skills/. This script copies the
# repo version there so every session, in any directory, can invoke `portfolio-ops`.
#
# Usage (from anywhere):
#   bash ~/projects/portfolio/scripts/install-ops-skill.sh
# Run it after every change to skills/portfolio-ops/ (the "Update rule" in SKILL.md).
#
# --delete makes the destination an exact mirror of the repo directory, so a file removed from the
# repo is also removed from ~/.claude/skills/. The repo is the source of truth; never edit the
# installed copy directly.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$REPO_ROOT/skills/portfolio-ops/"
DEST="${HOME}/.claude/skills/portfolio-ops/"

if [ ! -f "${SRC}SKILL.md" ]; then
  echo "error: ${SRC}SKILL.md not found; run this from a checkout of KalpKan/portfolio" >&2
  exit 1
fi

mkdir -p "$DEST"
rsync -a --delete "$SRC" "$DEST"

echo "Installed portfolio-ops skill to $DEST"
ls -1 "$DEST"
