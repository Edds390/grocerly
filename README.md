# Grocery Deals Finder Chrome Extension

A Chrome extension that helps you save money on groceries.

## Installation

### For Users (Easy Install)

1. **Download the latest release:**
   - Go to the [Releases page](https://github.com/YOUR_USERNAME/grocery-deals-finder/releases)
   - Download the `grocery-deals-finder.zip` file from the latest release

2. **Extract the zip file:**
   - Unzip the downloaded file to a folder on your computer
   - Remember the location of this folder

3. **Install in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in the top-right corner)
   - Click "Load unpacked"
   - Select the folder where you extracted the zip file
   - The extension should now appear in your extensions list

4. **Start using:**
   - Click the extension icon in your Chrome toolbar
   - Click "View All Deals" to start adding grocery items and finding deals

### For Developers

See the [Development](#development) section below for building from source.

## Features

- Track your favorite grocery items
- Automatically search for deals on Coles, Woolworths, and Aldi
- Parallel store processing with optimized performance
- Full-page results view with filtering and sorting
- Local storage of your items and deal history
- Modern UI with Tailwind CSS

## Installation

### Development Setup

1. **Install dependencies:**
   ```bash
   yarn install
   ```

2. **Build the extension:**
   ```bash
   ./build.sh
   ```
   Or manually:
   ```bash
   yarn tsc
   yarn tailwindcss -i ./src/styles/input.css -o ./dist/styles.css --minify
   cp popup.html results.html manifest.json dist/
   ```

3. **Load in Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` directory

## Usage

### Adding Grocery Items
1. Click the extension icon in your browser toolbar
2. Click "View All Deals" to open the full results page
3. In the "Manage Grocery Items" section, enter items you want to track
4. Click "Add Item" to add them to your list

### Finding Deals
- Manual Check: Click "Refresh Deals" in the results page or "Check for New Deals" in the popup
- View Results: All deals are displayed in the results page with store information, prices, and direct links

### Managing Your Items
- View all your tracked items in the results page
- Remove items you no longer want to track
- Items are stored locally in your browser

## How It Works

1. **Search Terms:** You add grocery items as search terms
2. **Web Scraping:** The extension opens Coles and Woolworths special pages in background tabs
3. **Deal Detection:** It scrapes the search results for items matching your terms
4. **Results Display:** Found deals are displayed with prices, discounts, and store information

### Supported Stores

- Coles: Searches specials pages for items matching your terms
- Woolworths: Searches specifically in the specials section
- Aldi: Searches all products for matching items

## Technical Details

### Architecture
- **Manifest V3:** Uses the latest Chrome extension format
- **TypeScript:** Fully typed for better development experience
- **Tailwind CSS:** Modern, responsive UI styling
- **Content Scripts:** Handle web scraping on store pages
- **Background Service Worker:** Manages periodic checks and notifications

### File Structure
```
src/
├── types.ts          # TypeScript interfaces
├── storage.ts        # Chrome storage management
├── stores.ts         # Store configurations and selectors
├── scraper.ts        # Deal scraping logic
├── content.ts        # Content script for web scraping
├── background.ts     # Background service worker
├── popup.ts          # Popup window logic
├── results.ts        # Results page logic
└── styles/
    └── input.css     # Tailwind CSS input file

popup.html            # Extension popup
results.html          # Full results page
manifest.json         # Extension manifest
```

### Permissions
- `storage`: Store your grocery items and deal history locally
- `activeTab`: Access the current tab when needed
- `alarms`: Schedule weekly automatic deal checks
- Host permissions for Coles and Woolworths domains

## Development

### Building for Development
```bash
yarn dev             # Start both TypeScript and CSS watch mode
yarn watch           # TypeScript watch mode only
yarn css:watch       # CSS watch mode only
```

### Building for Production
```bash
yarn build-prod      # Minified production build
```

### Testing
The extension includes a test scraping function accessible through the browser console:
```javascript
chrome.runtime.sendMessage({
  action: 'testScraping',
  searchTerm: 'milk'
});
```

## Limitations

- **Rate Limiting:** Be mindful of making too many requests to store websites
- **Selector Changes:** Store websites may change their HTML structure, requiring selector updates
- **Regional Availability:** Currently targets Australian Coles and Woolworths stores

## Future Enhancements

- [ ] Popup view for quick deal checking
- [ ] Price history tracking
- [ ] More grocery stores (IGA, ALDI, etc.)
- [ ] Deal notifications
- [ ] Export deals to shopping lists
- [ ] Price comparison features

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use and modify as needed.

## Disclaimer

This extension is for personal use only. Please respect the terms of service of the grocery store websites and use responsibly.