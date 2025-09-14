#!/bin/bash

# Setup script for Supabase Keep-Alive System
# This script helps configure GitHub secrets and test the keep-alive system

set -e

echo "🔧 TrueNamePath - Supabase Keep-Alive Setup"
echo "============================================"

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
echo "❌ GitHub CLI (gh) is not installed."
echo "   Install from: https://cli.github.com/"
exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d ".github/workflows" ]; then
echo "❌ Please run this script from the project root directory"
exit 1
fi

# Check if user is authenticated with GitHub CLI
if ! gh auth status &> /dev/null; then
echo "❌ Please authenticate with GitHub CLI first:"
echo "   gh auth login"
exit 1
fi

echo ""
echo "📋 Setting up GitHub repository secrets..."
echo ""

# Function to set secret with confirmation
set_secret() {
local secret_name=$1
local secret_description=$2
local default_value=$3

echo "Setting up: $secret_name"
echo "Description: $secret_description"

if [ -n "$default_value" ]; then
echo "Default: $default_value"
fi

read -p "Enter value (or press Enter for default): " secret_value

if [ -z "$secret_value" ] && [ -n "$default_value" ]; then
secret_value=$default_value
fi

if [ -n "$secret_value" ]; then
echo "$secret_value" | gh secret set "$secret_name"
echo "✅ Secret $secret_name configured"
else
echo "⚠️  Skipping $secret_name (no value provided)"
fi
echo ""
}

# Required secrets
echo "🔑 Configuring required secrets:"
echo ""

set_secret "PRODUCTION_BASE_URL" \
"Base URL of your production application" \
"https://www.truenamepath.com"

set_secret "KEEP_ALIVE_TEST_EMAIL" \
"Email address of the persistent test user account" \
""

set_secret "KEEP_ALIVE_TEST_PASSWORD" \
"Password for the persistent test user account" \
""

echo "✅ GitHub secrets configuration complete!"
echo ""

# Test the workflow
echo "🧪 Testing the keep-alive workflow..."
echo ""

read -p "Would you like to run a test of the keep-alive workflow now? (y/N): " run_test

if [[ $run_test =~ ^[Yy]$ ]]; then
echo "🚀 Triggering keep-alive workflow..."

if gh workflow run keep-alive.yml; then
echo "✅ Workflow triggered successfully!"
echo ""
echo "📊 Monitor the workflow execution:"
echo "   gh run list --workflow=keep-alive.yml"
echo "   gh run watch"
echo ""
echo "🌐 Or view in browser:"
echo "   gh workflow view keep-alive.yml --web"
else
echo "❌ Failed to trigger workflow"
echo "   Check that the workflow file exists and you have the necessary permissions"
fi
else
echo "⏭️  Skipping test run"
fi

echo ""
echo "🎉 Keep-alive system setup complete!"
echo ""
echo "📅 The system will now run automatically every Monday at 9:00 AM UTC"
echo "🔧 Manual triggers are available anytime with: gh workflow run keep-alive.yml"
echo "📖 Full documentation: docs/KEEP_ALIVE_SYSTEM.md"
echo ""
echo "🔍 Monitor workflow runs:"
echo "   • GitHub Actions tab in your repository"
echo "   • Command: gh run list --workflow=keep-alive.yml"
echo ""
echo "✅ Your Supabase project will now stay active during the review period!"