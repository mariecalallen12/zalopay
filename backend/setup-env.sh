#!/bin/bash
# Script to setup environment variables for Google OAuth and encryption keys

ENV_FILE="/root/zalo-pay/zalopay/backend/.env"

echo "🔧 Setting up environment variables..."

# Check if .env exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ .env file not found at $ENV_FILE"
    exit 1
fi

# Generate encryption keys if not present
if ! grep -q "CARD_ENCRYPTION_KEY=" "$ENV_FILE" || [ -z "$(grep "CARD_ENCRYPTION_KEY=" "$ENV_FILE" | cut -d'=' -f2)" ]; then
    echo "📝 Generating CARD_ENCRYPTION_KEY..."
    CARD_KEY=$(openssl rand -hex 32)
    if grep -q "CARD_ENCRYPTION_KEY=" "$ENV_FILE"; then
        sed -i "s|^CARD_ENCRYPTION_KEY=.*|CARD_ENCRYPTION_KEY=$CARD_KEY|" "$ENV_FILE"
    else
        echo "CARD_ENCRYPTION_KEY=$CARD_KEY" >> "$ENV_FILE"
    fi
    echo "✅ CARD_ENCRYPTION_KEY generated"
else
    echo "✅ CARD_ENCRYPTION_KEY already exists"
fi

if ! grep -q "OAUTH_ENCRYPTION_KEY=" "$ENV_FILE" || [ -z "$(grep "OAUTH_ENCRYPTION_KEY=" "$ENV_FILE" | cut -d'=' -f2)" ]; then
    echo "📝 Generating OAUTH_ENCRYPTION_KEY..."
    OAUTH_KEY=$(openssl rand -hex 32)
    if grep -q "OAUTH_ENCRYPTION_KEY=" "$ENV_FILE"; then
        sed -i "s|^OAUTH_ENCRYPTION_KEY=.*|OAUTH_ENCRYPTION_KEY=$OAUTH_KEY|" "$ENV_FILE"
    else
        echo "OAUTH_ENCRYPTION_KEY=$OAUTH_KEY" >> "$ENV_FILE"
    fi
    echo "✅ OAUTH_ENCRYPTION_KEY generated"
else
    echo "✅ OAUTH_ENCRYPTION_KEY already exists"
fi

# Add Google OAuth credentials
echo "📝 Adding Google OAuth credentials..."

if ! grep -q "GOOGLE_CLIENT_ID=" "$ENV_FILE"; then
    echo "" >> "$ENV_FILE"
    echo "# Google OAuth Configuration" >> "$ENV_FILE"
    echo "GOOGLE_CLIENT_ID=1053685289764-chbves5rsjcirqslikq0rnvndab3d31d.apps.googleusercontent.com" >> "$ENV_FILE"
    echo "✅ GOOGLE_CLIENT_ID added"
else
    echo "✅ GOOGLE_CLIENT_ID already exists"
fi

if ! grep -q "GOOGLE_CLIENT_SECRET=" "$ENV_FILE"; then
    echo "GOOGLE_CLIENT_SECRET=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" >> "$ENV_FILE"
    echo "✅ GOOGLE_CLIENT_SECRET added"
else
    echo "✅ GOOGLE_CLIENT_SECRET already exists"
fi

if ! grep -q "GOOGLE_REDIRECT_URI=" "$ENV_FILE"; then
    echo "GOOGLE_REDIRECT_URI=https://zalopaymerchan.com/auth/callback" >> "$ENV_FILE"
    echo "✅ GOOGLE_REDIRECT_URI added"
else
    echo "✅ GOOGLE_REDIRECT_URI already exists"
fi

echo ""
echo "✨ Environment setup completed!"
echo ""
echo "📋 Summary:"
echo "  - Google OAuth credentials: ✅"
echo "  - Encryption keys: ✅"
echo ""
echo "⚠️  IMPORTANT: Verify the .env file contains all required variables"

