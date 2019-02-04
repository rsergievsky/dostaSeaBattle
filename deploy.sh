#!/bin/bash
git add .
git commit -a -m "deploy at `date +%s`"
git push origin master
ssh dosta 'cd /home/hopacha/dostaSeaBattle/ && git pull origin master && npm install && pm2 restart dosta'
