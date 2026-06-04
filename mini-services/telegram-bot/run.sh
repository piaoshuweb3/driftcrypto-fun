#!/bin/bash
cd /home/z/my-project/mini-services/telegram-bot
while true; do
  echo "[$(date)] Starting bot..." >> /tmp/telegram-bot.log
  bun index.ts >> /tmp/telegram-bot.log 2>&1
  EXIT_CODE=$?
  echo "[$(date)] Bot exited with code $EXIT_CODE, restarting in 5s..." >> /tmp/telegram-bot.log
  sleep 5
done
