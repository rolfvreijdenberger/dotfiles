#! /bin/bash
# create an ssh socks tunnen to proxy your internet traffic
# point the broswer to port 8080 on localhost
# see https://en.wikipedia.org/wiki/Tunneling_protocol
ssh -D 8080 -f -C -q -N -p 2222 rolf@sentinel.ddns.me
