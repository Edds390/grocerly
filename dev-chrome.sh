#!/bin/bash

# Chrome Extension Development Helper Script

EXTENSION_DIR="$(pwd)/dist"
CHROME_EXTENSIONS_URL="chrome://extensions/"

echo "🚀 Chrome Extension Development Helper"
echo "======================================"

# Check if dist directory exists
if [ ! -d "$EXTENSION_DIR" ]; then
    echo "❌ Extension not built yet. Building now..."
    ./build.sh
    if [ $? -ne 0 ]; then
        echo "❌ Build failed. Please fix errors and try again."
        exit 1
    fi
fi

echo "📁 Extension directory: $EXTENSION_DIR"
echo ""

# Function to open Chrome extensions page
open_extensions_page() {
    echo "🌐 Opening Chrome extensions page..."
    
    # Try different methods to open Chrome based on OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        open -a "Google Chrome" "$CHROME_EXTENSIONS_URL" 2>/dev/null || \
        open -a "Chrome" "$CHROME_EXTENSIONS_URL" 2>/dev/null || \
        echo "❌ Could not find Chrome. Please open chrome://extensions/ manually"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        google-chrome "$CHROME_EXTENSIONS_URL" 2>/dev/null || \
        chromium-browser "$CHROME_EXTENSIONS_URL" 2>/dev/null || \
        chrome "$CHROME_EXTENSIONS_URL" 2>/dev/null || \
        echo "❌ Could not find Chrome. Please open chrome://extensions/ manually"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        # Windows
        start chrome "$CHROME_EXTENSIONS_URL" 2>/dev/null || \
        echo "❌ Could not find Chrome. Please open chrome://extensions/ manually"
    else
        echo "❌ Unknown OS. Please open chrome://extensions/ manually"
    fi
}

# Function to open extension popup
open_extension() {
    echo "🔧 Opening extension results page..."
    
    # Create a temporary HTML file that opens the extension
    cat > /tmp/open_extension.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Open Extension</title>
</head>
<body>
    <script>
        // Try to open the extension results page
        chrome.runtime.sendMessage('YOUR_EXTENSION_ID', {action: 'openResultsPage'});
        
        // Fallback: show instructions
        document.body.innerHTML = \`
            <h2>🛒 Grocery Deals Finder</h2>
            <p>Extension loaded! Click the extension icon in your toolbar to start.</p>
            <p>Or click "View All Deals" to open the results page.</p>
        \`;
    </script>
</body>
</html>
EOF

    if [[ "$OSTYPE" == "darwin"* ]]; then
        open /tmp/open_extension.html
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open /tmp/open_extension.html
    else
        echo "📄 Created helper file at /tmp/open_extension.html"
    fi
}

# Main menu
echo "Choose an option:"
echo "1) 🌐 Open Chrome extensions page (chrome://extensions/)"
echo "2) 🔄 Rebuild extension and open Chrome"
echo "3) 👀 Start development watch mode"
echo "4) 📊 Show extension info"
echo "5) 🧹 Clean and rebuild"
echo ""
read -p "Enter choice (1-5): " choice

case $choice in
    1)
        open_extensions_page
        echo ""
        echo "📋 Manual steps:"
        echo "1. Enable 'Developer mode' (top-right toggle)"
        echo "2. Click 'Load unpacked'"
        echo "3. Select: $EXTENSION_DIR"
        echo "4. Pin the extension to your toolbar"
        ;;
    2)
        echo "🔄 Rebuilding extension..."
        ./build.sh
        if [ $? -eq 0 ]; then
            open_extensions_page
            echo ""
            echo "✅ Extension rebuilt! Follow the manual steps above."
        fi
        ;;
    3)
        echo "👀 Starting development watch mode..."
        echo "💡 In another terminal, reload the extension in Chrome after making changes"
        yarn dev
        ;;
    4)
        echo "📊 Extension Information:"
        echo "   Name: Grocery Deals Finder"
        echo "   Version: 1.0.0"
        echo "   Location: $EXTENSION_DIR"
        echo "   Files: $(ls -1 $EXTENSION_DIR | wc -l) files"
        echo ""
        echo "📁 Extension contents:"
        ls -la "$EXTENSION_DIR"
        ;;
    5)
        echo "🧹 Cleaning and rebuilding..."
        rm -rf dist/
        ./build.sh
        if [ $? -eq 0 ]; then
            echo "✅ Clean rebuild complete!"
            open_extensions_page
        fi
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎯 Quick Tips:"
echo "   • After loading: Click the 🛒 icon in your toolbar"
echo "   • Add items like 'milk', 'bread', 'apples'"
echo "   • Click 'Refresh Deals' to test scraping"
echo "   • Check browser console for any errors"