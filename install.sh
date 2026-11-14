#!/usr/bin/env bash
# Cinnamon desklet install script
set -euo pipefail

UUID="desklet-template@egemngyk"
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$UUID"
DEST="${XDG_DATA_HOME:-$HOME/.local/share}/cinnamon/desklets/$UUID"

if [[ "${1:-}" == "--uninstall" ]]; then
    rm -rf "$DEST"
    echo "Removed: $DEST"
    exit 0
fi

[[ -f "$SRC/metadata.json" ]] || { echo "Error: $SRC/metadata.json not found" >&2; exit 1; }
mkdir -p "$(dirname "$DEST")"
rm -rf "$DEST"
cp -r "$SRC" "$DEST"
echo "Installed: $DEST"

if command -v gdbus > /dev/null 2>&1; then
    gdbus call --session --dest org.Cinnamon --object-path /org/Cinnamon \
        --method org.Cinnamon.ReloadXlet "$UUID" "DESKLET" > /dev/null 2>&1 || true
    echo "Reloaded in Cinnamon."
fi
