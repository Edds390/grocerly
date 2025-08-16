#!/bin/bash

echo "Building Grocery Deals Finder Chrome Extension..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    yarn install
fi

# Create dist directory
mkdir -p dist

# Compile TypeScript
echo "Compiling TypeScript..."
yarn tsc

# Build CSS with Tailwind
echo "Building CSS..."
yarn tailwindcss -i ./src/styles/input.css -o ./dist/styles.css --minify

# Copy HTML files to dist (they reference dist/styles.css)
echo "Copying HTML files..."
cp popup.html dist/
cp results.html dist/

# Copy manifest
cp manifest.json dist/

# Create simple icons (you can replace these with actual icons later)
echo "Creating placeholder icons..."
mkdir -p dist/icons

# Create a simple SVG icon and convert to different sizes
cat > dist/icons/icon.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="45" fill="#4F46E5"/>
  <text x="50" y="60" font-family="Arial" font-size="40" fill="white" text-anchor="middle">🛒</text>
</svg>
EOF

# For now, just copy the SVG as different sizes (in a real project, you'd convert to PNG)
cp dist/icons/icon.svg dist/icons/icon16.png
cp dist/icons/icon.svg dist/icons/icon48.png
cp dist/icons/icon.svg dist/icons/icon128.png

echo "Build complete! Extension files are in the 'dist' directory."
echo "To install:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable 'Developer mode'"
echo "3. Click 'Load unpacked' and select the 'dist' directory"