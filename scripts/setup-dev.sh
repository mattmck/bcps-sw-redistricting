#!/bin/bash
# Developer Environment Setup Script
# Automatically installs and configures CodeQL for new developers

set -e  # Exit on error

echo "🚀 Setting up BCPS Redistricting development environment..."
echo ""

# Check for Homebrew (macOS only)
if [[ "$OSTYPE" == "darwin"* ]]; then
    if ! command -v brew &> /dev/null; then
        echo "❌ Homebrew not found. Install from https://brew.sh/"
        exit 1
    fi
fi

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ required. Current version: $(node -v)"
    exit 1
fi
echo "✅ Node.js $(node -v) detected"

# Check for CodeQL
if ! command -v codeql &> /dev/null; then
    echo "⚠️  CodeQL not found"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "📦 Installing CodeQL via Homebrew..."
        brew install codeql
        echo "✅ CodeQL installed successfully"
    else
        echo "⚠️  Please install CodeQL manually:"
        echo "   Visit: https://github.com/github/codeql-cli-binaries/releases"
        echo "   Or add to PATH if already downloaded"
    fi
else
    CODEQL_VERSION=$(codeql --version | head -n1)
    echo "✅ CodeQL detected: $CODEQL_VERSION"
fi

# Download CodeQL query packs (if CodeQL is available)
if command -v codeql &> /dev/null; then
    echo "📦 Downloading CodeQL JavaScript query packs..."
    if codeql pack download codeql/javascript-queries 2>&1 | grep -q "already downloaded"; then
        echo "✅ Query packs already up to date"
    else
        echo "✅ Query packs downloaded"
    fi
fi

# Install npm dependencies
echo "📦 Installing npm dependencies..."
npm install

echo ""
echo "✅ Development environment setup complete!"
echo ""
echo "Next steps:"
echo "  • Run development server:     npm run dev"
echo "  • Run CodeQL security scan:   npm run codeql:scan"
echo "  • Start backend (optional):   cd backend && docker-compose up -d"
echo ""
echo "Documentation:"
echo "  • README.md      - Project overview and quick start"
echo "  • CODEQL.md      - CodeQL usage and configuration"
echo "  • DEPLOYMENT.md  - Deployment instructions"
echo ""
