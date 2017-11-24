#! /bin/bash
# license: https://github.com/rolfvreijdenberger/dotfiles/LICENSE
bytes=${1:-10}
echo $bytes
cat /dev/urandom | strings --bytes 1 | head -n$bytes | tr -d '\n\t' && echo ""
