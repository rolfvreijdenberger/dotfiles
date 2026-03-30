#!/bin/bash
# license: https://github.com/rolfvreijdenberger/dotfiles/LICENSE
# updates /etc/motd with host info, purpose and notes
# safe to re-run: rewrites the full motd each time based on stored config

CONFIG_FILE="/etc/motd-config"

# load existing config if present (so re-runs don't prompt again)
if [[ -f "$CONFIG_FILE" ]]; then
  source "$CONFIG_FILE"
  echo "existing motd config found for $(hostname) — updating motd"
  echo "  purpose : ${PURPOSE:-not set}"
  echo "  notes   : ${SPECIFICS:-none}"
  echo ""
  echo "Press Enter to keep existing values, or type a new one."
  echo ""
fi

echo "What is this machine for? (e.g. 'development server', 'home lab')"
read -r INPUT_PURPOSE
[[ -n "$INPUT_PURPOSE" ]] && PURPOSE="$INPUT_PURPOSE"

echo ""
echo "Anything specific to know on login? (press Enter to skip/keep)"
read -r INPUT_SPECIFICS
[[ -n "$INPUT_SPECIFICS" ]] && SPECIFICS="$INPUT_SPECIFICS"

# save config so re-runs don't start from scratch
printf 'PURPOSE=%q\nSPECIFICS=%q\n' "${PURPOSE:-}" "${SPECIFICS:-}" | sudo tee "$CONFIG_FILE" > /dev/null

# gather dynamic system info
HOSTNAME=$(hostname -f 2>/dev/null || hostname)
OS=$(. /etc/os-release 2>/dev/null && echo "$PRETTY_NAME" || uname -sr)
KERNEL=$(uname -r)
UPTIME=$(uptime -p 2>/dev/null || uptime)
IP_ADDRS=$(ip -brief addr show 2>/dev/null | awk '$2 == "UP" { print $3 }' | grep -v '^127\.' | tr '\n' '  ' || echo "n/a")
CPU=$(nproc 2>/dev/null)
MEM=$(free -h 2>/dev/null | awk '/^Mem:/ { print $2 }')
DISK=$(df -h / 2>/dev/null | awk 'NR==2 { print $3 "/" $2 " (" $5 " used)" }')

cat <<EOF | sudo tee /etc/motd > /dev/null

  ${HOSTNAME}
  ──────────────────────────────────────────
  purpose : ${PURPOSE:-not set}
$([ -n "${SPECIFICS:-}" ] && echo "  notes   : ${SPECIFICS}")
  ──────────────────────────────────────────
  os      : ${OS}
  kernel  : ${KERNEL}
  cpu     : ${CPU} cores
  memory  : ${MEM}
  disk /  : ${DISK}
  ip      : ${IP_ADDRS}
  ──────────────────────────────────────────
  vhelp   : tmux/vim/bash reference
  vstatus : live system overview
  ──────────────────────────────────────────

EOF

echo "done — /etc/motd updated"
