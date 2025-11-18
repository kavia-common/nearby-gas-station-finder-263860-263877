#!/bin/bash
cd /home/kavia/workspace/code-generation/nearby-gas-station-finder-263860-263877/frontend_web_app
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

