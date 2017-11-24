#!/bin/bash
# license: https://github.com/rolfvreijdenberger/dotfiles/LICENSE
# creates a private key from a 'brain wallet'
if [ -z "$1"  ]; then
 echo "provide the bitcoin brain wallet seed to get the private key:";
 read SEED;
else
 SEED=$1;
fi
echo "seed (brain wallet): $SEED";
echo -n "bitcoin private key: ";
echo -n "$SEED" | openssl dgst -sha256
