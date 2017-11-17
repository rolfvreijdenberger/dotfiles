#!/bin/bash

# sets up all dotfiles 

# https://www.gnu.org/software/bash/manual/html_node/The-Set-Builtin.html
# u/nounset: unset variables are treated as an error when performing variable expansion 
# e/errexit: exit immediately if a command exits with a non-zero status
set -u -e


# the program name eg: foo.sh
PROGRAM_NAME=$(basename $0)
# absolute path to this script, e.g. /home/user/bin/foo.sh
PROGRAM_FULL=$(readlink -f "$0")
# absolute path this script is in, thus /home/user/bin
PROGRAM_PATH=$(dirname "$PROGRAM_FULL")
# the working directory, directory this script is called from initially eg: /home/user
WORKING_DIRECTORY=$(pwd)
# current time
TIME=$(date '+%Y-%m-%d-%H:%M:%S')


# install function. 
# $1 is source parameter in dotfiles repo
# $2 is destination file
function install() {
  source="$1"
  destination="$2"
  echo "setting up $source to $destination"
  # creates directory path if need for full destination path for a file
  mkdir -p $(dirname "$destination")
  # creates symlink to source file 
  ln -sfn "$PWD/$source" "$destination"
}


# change directory to dotfiles root
cd "$PROGRAM_PATH"
# make sure to source via ~/.bashrc
install bash/bash_custom "$HOME/.bash_custom"
install ctags/ctags "$HOME/.ctags"
install git/gitconfig "$HOME/.gitconfig"
install gnupg/gpg.conf "$HOME/.gnupg/gpg.conf"
install ssh/config "$HOME/.ssh/config"
install tmux/tmux.conf "$HOME/.tmux.conf"
install vim/vimrc "$HOME/.vimrc"
# all scripts in the bin folder
for i in $(ls bin); do
  install bin/$i "$HOME/bin/"$(basename $i)
done


# os type dependent install
case "$OSTYPE" in
  darwin*) #mac
    echo "mac specific setup"
    install gnupg/gpg-agent-mac.conf "$HOME/.gnupg/gpg-agent.conf"
    mkdir -p /var/log/
    touch /var/log/gpg-agent.log
    ;;
  linux*)
    echo "linux specific setup"
    install gnupg/gpg-agent-linux.conf "$HOME/.gnupg/gpg-agent.conf"
    mkdir -p /var/log/
    touch /var/log/gpg-agent.log
    ;;
  bsd*)
    echo "bsd specific setup"
    ;;
  *)
    echo "unhandled os: $OSTYPE"
    ;;
esac


echo "done installing"
cd $WORKING_DIRECTORY