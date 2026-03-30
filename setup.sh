#!/bin/bash
# license: https://github.com/rolfvreijdenberger/dotfiles/LICENSE

# sets up all dotfiles 

# https://www.gnu.org/software/bash/manual/html_node/The-Set-Builtin.html
# u/nounset: unset variables are treated as an error when performing variable expansion 
# e/errexit: exit immediately if a command exits with a non-zero status
set -u -e


# absolute path this script is in
PROGRAM_PATH=$(dirname "$0")
# the working directory this script is called from
WORKING_DIRECTORY=$(pwd)


# install function. 
# $1 is source parameter in dotfiles repo
# $2 is destination file
function install() {
  source="$1"
  destination="$2"
  echo "setting up $source to $destination"
  # creates directory path if need for full destination path for a file
  mkdir -p "$(dirname "$destination")"
  # creates symlink to source file 
  ln -sfn "$PWD/$source" "$destination"
}


# change directory to dotfiles root
cd "$PROGRAM_PATH"

# install bash_custom and ensure ~/.bashrc sources it
install bash/bash_custom "$HOME/.bash_custom"
if ! grep -q 'source.*\.bash_custom' "$HOME/.bashrc" 2>/dev/null; then
  echo '[ -f ~/.bash_custom ] && source ~/.bash_custom' >> "$HOME/.bashrc"
  echo "added bash_custom source line to ~/.bashrc"
fi
install git/gitconfig "$HOME/.gitconfig"
install gnupg/gpg.conf "$HOME/.gnupg/gpg.conf"
install ssh/config "$HOME/.ssh/config"
# ssh/config includes everything from this directory
mkdir -p "$HOME/.ssh/config.d"

# authorized_keys: install hardcoded keys, then optionally prompt for one more
AUTHORIZED_KEYS="$HOME/.ssh/authorized_keys"
touch "$AUTHORIZED_KEYS"
chmod 600 "$AUTHORIZED_KEYS"
while IFS= read -r key; do
  # skip comments and empty lines
  [[ "$key" =~ ^#.*$ || -z "$key" ]] && continue
  if ! grep -qF "$key" "$AUTHORIZED_KEYS"; then
    echo "$key" >> "$AUTHORIZED_KEYS"
    echo "added public key: ${key##* }"
  fi
done < ssh/authorized_keys

echo "Paste an additional public key to authorize (or press Enter to skip):"
read -r EXTRA_KEY
if [[ -n "$EXTRA_KEY" ]]; then
  if ! grep -qF "$EXTRA_KEY" "$AUTHORIZED_KEYS"; then
    echo "$EXTRA_KEY" >> "$AUTHORIZED_KEYS"
    echo "added extra public key"
  else
    echo "key already present, skipping"
  fi
fi
install tmux/tmux.conf "$HOME/.tmux.conf"
# install TPM (Tmux Plugin Manager) if not already present
if [[ ! -d "$HOME/.tmux/plugins/tpm" ]]; then
  git clone https://github.com/tmux-plugins/tpm "$HOME/.tmux/plugins/tpm"
  echo "TPM installed — open tmux and press PREFIX I to install plugins"
fi
install vim/vimrc "$HOME/.vimrc"
mkdir -p "$HOME/.vim/undodir"
# all scripts in the bin folder
for i in bin/*; do
  install "$i" "$HOME/bin/$(basename "$i")"
done


# linux specific setup
install gnupg/gpg-agent-linux.conf "$HOME/.gnupg/gpg-agent.conf"
install gnupg/scd-event "$HOME/.gnupg/scd-event"
install gnupg/scdaemon.conf "$HOME/.gnupg/scdaemon.conf"
touch "$HOME/.gnupg/gpg-agent.log"
touch "$HOME/.gnupg/scdaemon.log"
chmod +x "$HOME/.gnupg/scd-event"


echo "done installing"
