#!/bin/bash

# Quick Extension Reload Script
# Use this during development to rebuild and remind you to reload in Chrome

echo "🔄 Reloading Extension..."
echo "======================="

# Rebuild the extension
echo "📦 Building extension..."
./build.sh

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "🔄 Now reload in Chrome:"
    echo "   1. Go to chrome://extensions/ (opening now...)"
    echo "   2. Press Ctrl+R (Cmd+R on Mac) to reload all extensions"
    echo "   3. Or click the reload icon (🔄) on 'Grocery Deals Finder'"
    echo ""
    echo "💡 Pro tip: Keep chrome://extensions/ pinned for instant reloading!"
    
    # Auto-open Chrome extensions page
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        open "chrome://extensions/" 2>/dev/null || echo "   (Couldn't auto-open Chrome)"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        google-chrome "chrome://extensions/" 2>/dev/null || 
        chromium-browser "chrome://extensions/" 2>/dev/null || 
        echo "   (Couldn't auto-open Chrome)"
    fi
    
    # Try to bring Chrome to front (macOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        osascript -e 'tell application "Google Chrome" to activate' 2>/dev/null || \
        osascript -e 'tell application "Chrome" to activate' 2>/dev/null
    fi
else
    echo ""
    echo "❌ Build failed! Fix the errors above and try again."
    exit 1
fi