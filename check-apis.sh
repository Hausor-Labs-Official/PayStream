#!/bin/bash

echo "=== API KEY STATUS ==="
echo ""

# Check each API key
check_key() {
    local key_name=$1
    local value=$(grep "^${key_name}=" .env.local 2>/dev/null | cut -d'=' -f2)
    
    if [ -z "$value" ]; then
        echo "❌ $key_name - NOT SET"
        return 1
    elif [ "$value" = "" ]; then
        echo "⚠️  $key_name - EMPTY"
        return 1
    else
        # Check if it's a placeholder
        if [[ "$value" == *"your_"* ]] || [[ "$value" == *"here"* ]]; then
            echo "⚠️  $key_name - PLACEHOLDER (needs real key)"
            return 1
        else
            echo "✅ $key_name - CONFIGURED"
            return 0
        fi
    fi
}

echo "Required APIs for integration:"
echo ""
check_key "GEMINI_API_KEY"
check_key "AIMLAPI_KEY"
echo ""
echo "Optional APIs:"
echo ""
check_key "QDRANT_URL"
check_key "QDRANT_API_KEY"
check_key "OPUS_API_KEY"

echo ""
echo "=== WHAT YOU NEED ==="
