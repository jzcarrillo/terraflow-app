#!/bin/bash

echo -e "\033[0;33mClearing Redis cache...\033[0m"

kubectl exec -it deployment/redis -n terraflow-app -- redis-cli FLUSHALL && \
    echo -e "\033[0;32mSUCCESS: Redis cache cleared\033[0m" || \
    echo -e "\033[0;31mFAILED: Could not clear Redis cache\033[0m"

echo -e "\033[0;36mCache cleared. Next API call will fetch fresh data from database.\033[0m"
