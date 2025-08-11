#!/bin/bash

# Setup Supabase environment variables for CI
# This script extracts keys from supabase status and sets them as environment variables

echo "🚀 Setting up Supabase environment for CI..."

# Wait for Supabase to be ready
echo "⏳ Waiting for Supabase to be ready..."
timeout=60
counter=0
while ! supabase status > /dev/null 2>&1; do
  if [ $counter -ge $timeout ]; then
echo "❌ Timeout waiting for Supabase to start"
exit 1
  fi
  sleep 1
  counter=$((counter + 1))
done

# Extract environment variables
echo "📋 Extracting Supabase configuration..."
SUPABASE_STATUS=$(supabase status)

# Parse the status output more robustly
SUPABASE_URL=$(echo "$SUPABASE_STATUS" | grep -E "API URL|API server" | awk '{print $NF}')
SUPABASE_ANON_KEY=$(echo "$SUPABASE_STATUS" | grep "anon key" | awk '{print $NF}')
SUPABASE_SERVICE_ROLE_KEY=$(echo "$SUPABASE_STATUS" | grep "service_role key" | awk '{print $NF}')

# Validate extracted values
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Failed to extract Supabase configuration"
  echo "Status output:"
  echo "$SUPABASE_STATUS"
  exit 1
fi

# Set environment variables for GitHub Actions
echo "SUPABASE_URL=$SUPABASE_URL" >> $GITHUB_ENV
echo "NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL" >> $GITHUB_ENV
echo "SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY" >> $GITHUB_ENV
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY" >> $GITHUB_ENV
echo "SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY" >> $GITHUB_ENV

echo "✅ Supabase environment configured successfully"
echo "URL: $SUPABASE_URL"
echo "Keys extracted and set as environment variables"