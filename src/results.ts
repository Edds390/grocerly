import { StorageManager } from './storage.js';
import { GroceryItem, Deal, SearchResult } from './types.js';

let currentDeals: SearchResult[] = [];
let currentItems: GroceryItem[] = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  setupEventListeners();
});

async function loadData() {
  try {
    currentItems = await StorageManager.getGroceryItems();
    currentDeals = await StorageManager.getLastResults();
    const data = await StorageManager.getData();

    updateStats();
    renderGroceryItems();
    renderDeals();
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

function updateStats() {
  const totalDeals = currentDeals.reduce((sum, result) => sum + result.deals.length, 0);
  
  document.getElementById('totalDeals')!.textContent = totalDeals.toString();
  document.getElementById('trackedItems')!.textContent = currentItems.length.toString();
  
  // Update last update time
  const lastUpdateElement = document.getElementById('lastUpdate')!;
  if (currentDeals.length > 0) {
    const latestCheck = currentDeals.reduce((latest, result) => {
      const resultTime = new Date(result.lastChecked).getTime();
      return resultTime > latest ? resultTime : latest;
    }, 0);
    
    if (latestCheck > 0) {
      const lastCheck = new Date(latestCheck);
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60));
      
      if (diffHours < 1) {
        lastUpdateElement.textContent = 'Just now';
      } else if (diffHours < 24) {
        lastUpdateElement.textContent = `${diffHours}h ago`;
      } else {
        const diffDays = Math.floor(diffHours / 24);
        lastUpdateElement.textContent = `${diffDays}d ago`;
      }
    }
  } else {
    lastUpdateElement.textContent = 'Never';
  }
}

function renderGroceryItems() {
  const container = document.getElementById('groceryItemsList')!;
  
  if (currentItems.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-center py-4">No items added yet. Add your first grocery item above!</p>';
    return;
  }

  container.innerHTML = currentItems.map(item => `
    <div class="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
      <div>
        <span class="font-medium text-gray-800">${escapeHtml(item.name)}</span>
        <span class="text-sm text-gray-500 ml-2">(${escapeHtml(item.searchTerm)})</span>
      </div>
      <button 
        class="btn-danger text-sm py-1 px-2 remove-item-btn" 
        data-item-id="${item.id}"
      >
        Remove
      </button>
    </div>
  `).join('');
  
  // Add event listeners for remove buttons
  container.querySelectorAll('.remove-item-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const itemId = (e.target as HTMLElement).getAttribute('data-item-id');
      if (itemId) {
        await removeItem(itemId);
      }
    });
  });
}

function renderDeals() {
  const container = document.getElementById('dealsContainer')!;
  const noDealsMessage = document.getElementById('noDealsMessage')!;
  
  const storeFilter = (document.getElementById('storeFilter') as HTMLSelectElement).value;
  const sortBy = (document.getElementById('sortBy') as HTMLSelectElement).value;
  
  // Filter deals
  let filteredResults = currentDeals;
  if (storeFilter !== 'all') {
    filteredResults = currentDeals.map(result => ({
      ...result,
      deals: result.deals.filter(deal => deal.store === storeFilter)
    })).filter(result => result.deals.length > 0);
  }
  
  // Sort deals
  filteredResults.forEach(result => {
    result.deals.sort((a, b) => {
      switch (sortBy) {
        case 'store':
          return a.store.localeCompare(b.store);
        case 'item':
          return a.title.localeCompare(b.title);
        case 'price':
          // Extract numeric price for comparison
          const priceA = parseFloat(a.price.replace(/[^0-9.]/g, '')) || 0;
          const priceB = parseFloat(b.price.replace(/[^0-9.]/g, '')) || 0;
          return priceA - priceB; // Low to high
        case 'date':
        default:
          return new Date(b.dateFound).getTime() - new Date(a.dateFound).getTime();
      }
    });
  });

  const totalDeals = filteredResults.reduce((sum, result) => sum + result.deals.length, 0);
  
  if (totalDeals === 0) {
    container.innerHTML = '';
    noDealsMessage.classList.remove('hidden');
    return;
  }

  noDealsMessage.classList.add('hidden');
  
  container.innerHTML = filteredResults.map(result => {
    if (result.deals.length === 0) return '';
    
    return `
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">
          Deals for "${escapeHtml(result.searchTerm)}"
          <span class="text-sm font-normal text-gray-500">(${result.deals.length} deals)</span>
        </h3>
        
        ${result.error ? `
          <div class="bg-red-50 border border-red-200 rounded p-3 mb-4">
            <p class="text-red-700 text-sm">Error: ${escapeHtml(result.error)}</p>
          </div>
        ` : ''}
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${result.deals.map(deal => renderDealCard(deal)).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function renderDealCard(deal: Deal): string {
  const storeColor = deal.store === 'coles' ? 'bg-red-100 text-red-800' : 
                     deal.store === 'woolworths' ? 'bg-green-100 text-green-800' : 
                     'bg-blue-100 text-blue-800';
  const storeName = deal.store === 'coles' ? 'Coles' : 
                    deal.store === 'woolworths' ? 'Woolworths' : 
                    'Aldi';
  
  return `
    <div class="deal-card">
      ${deal.imageUrl ? `
        <img src="${escapeHtml(deal.imageUrl)}" alt="${escapeHtml(deal.title)}" 
             class="w-full h-32 object-cover rounded-lg mb-3">
      ` : ''}
      
      <div class="mb-2">
        <span class="inline-block px-2 py-1 text-xs font-semibold rounded ${storeColor}">
          ${storeName}
        </span>
      </div>
      
      <h4 class="font-medium text-gray-800 mb-2 line-clamp-2">${escapeHtml(deal.title)}</h4>
      
      <div class="flex items-center justify-between mb-3">
        <div>
          <span class="text-lg font-bold text-green-600">${escapeHtml(deal.price)}</span>
          ${deal.originalPrice ? `
            <span class="text-sm text-gray-500 line-through ml-2">${escapeHtml(deal.originalPrice)}</span>
          ` : ''}
          ${deal.unitPrice ? `
            <div class="text-xs text-gray-400 mt-1">${escapeHtml(deal.unitPrice)}</div>
          ` : ''}
        </div>
        ${deal.discount ? `
          <span class="text-sm font-semibold text-red-600">${escapeHtml(deal.discount)}</span>
        ` : ''}
      </div>
      
      ${deal.url ? `
        <a href="${escapeHtml(deal.url)}" target="_blank" 
           class="btn-primary text-sm w-full text-center block">
          View Deal
        </a>
      ` : `
        <div class="text-xs text-gray-500 text-center py-2">
          No direct link available
        </div>
      `}
    </div>
  `;
}

function setupEventListeners() {
  // Add item functionality
  const addItemBtn = document.getElementById('addItemBtn')!;
  const newItemInput = document.getElementById('newItemInput') as HTMLInputElement;
  
  addItemBtn.addEventListener('click', addNewItem);
  newItemInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addNewItem();
  });

  // Refresh deals
  document.getElementById('refreshDeals')!.addEventListener('click', refreshDeals);
  
  // Filter and sort
  document.getElementById('storeFilter')!.addEventListener('change', renderDeals);
  document.getElementById('sortBy')!.addEventListener('change', renderDeals);
}

async function addNewItem() {
  const input = document.getElementById('newItemInput') as HTMLInputElement;
  const itemName = input.value.trim();
  
  if (!itemName) return;
  
  try {
    await StorageManager.addGroceryItem({
      name: itemName,
      searchTerm: itemName.toLowerCase()
    });
    
    input.value = '';
    await loadData();
  } catch (error) {
    console.error('Error adding item:', error);
    alert('Error adding item. Please try again.');
  }
}

async function removeItem(id: string) {
  try {
    await StorageManager.removeGroceryItem(id);
    await loadData();
  } catch (error) {
    console.error('Error removing item:', error);
    alert('Error removing item. Please try again.');
  }
}

async function refreshDeals() {
  const loadingSection = document.getElementById('loadingSection')!;
  const dealsSection = document.getElementById('dealsSection')!;
  const refreshBtn = document.getElementById('refreshDeals')!;
  
  try {
    // Show loading state
    loadingSection.classList.remove('hidden');
    dealsSection.style.opacity = '0.5';
    refreshBtn.textContent = 'Searching...';
    refreshBtn.setAttribute('disabled', 'true');
    
    // Check if we have items to search for
    const items = await StorageManager.getGroceryItems();
    if (items.length === 0) {
      alert('Please add some grocery items first!');
      return;
    }
    
    // Direct scraping approach - no service worker needed
    await performDirectScraping(items);
    await loadData();
  } catch (error) {
    console.error('Error refreshing deals:', error);
    
    // Show user-friendly error message
    const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
    alert(`Error refreshing deals: ${errorMsg}\n\nThis might be due to:\n- Network issues\n- Store websites blocking requests\n- Extension permissions\n\nCheck the browser console for more details.`);
    
    // Create some mock data for testing
    console.log('Creating mock deals for testing...');
    await createMockDeals();
    await loadData();
  } finally {
    // Hide loading state
    loadingSection.classList.add('hidden');
    dealsSection.style.opacity = '1';
    refreshBtn.textContent = 'Refresh Deals';
    refreshBtn.removeAttribute('disabled');
  }
}

// Direct scraping with parallel stores, sequential items
async function performDirectScraping(items: GroceryItem[]) {
  // Run all three stores in parallel, but items sequentially within each store
  const [colesResults, woolworthsResults, aldiResults] = await Promise.all([
    scrapeStoreSequentially('coles', items),
    scrapeStoreSequentially('woolworths', items),
    scrapeStoreSequentially('aldi', items)
  ]);
  
  // Combine results by search term and filter for exact matches
  const results: SearchResult[] = [];
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const colesDeals = colesResults[i] || [];
    const woolworthsDeals = woolworthsResults[i] || [];
    const aldiDeals = aldiResults[i] || [];
    
    // Filter deals to only include exact matches
    const allDeals = [...colesDeals, ...woolworthsDeals, ...aldiDeals];
    const filteredDeals = filterExactMatches(allDeals, item);
    
    const searchResult: SearchResult = {
      searchTerm: item.searchTerm,
      deals: filteredDeals,
      lastChecked: new Date().toISOString()
    };
    
    results.push(searchResult);
  }
  
  await StorageManager.saveSearchResults(results);
}

// Sequential scraping for a single store across all items
async function scrapeStoreSequentially(storeKey: string, items: GroceryItem[]): Promise<Deal[][]> {
  const results: Deal[][] = [];
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    try {
      const deals = await scrapeStoreDirect(storeKey, item.searchTerm);
      results.push(deals);
      
      // Add delay between requests to the same store to avoid rate limiting
      if (i < items.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1300));
      }
    } catch (error) {
      console.error(`Error scraping ${storeKey} for "${item.name}":`, error);
      results.push([]); // Empty array for failed scrapes
    }
  }
  
  return results;
}

// Direct store scraping function
async function scrapeStoreDirect(storeKey: string, searchTerm: string): Promise<Deal[]> {
  console.log(`🏪 Direct scraping ${storeKey} for "${searchTerm}"`);
  
  // Import stores config
  const { STORES } = await import('./stores.js');
  const store = STORES[storeKey];
  
  if (!store) {
    console.error(`❌ Store config not found for: ${storeKey}`);
    return [];
  }

  try {
    const searchUrl = store.searchUrl(searchTerm);
    console.log(`🌐 Opening ${store.name} URL: ${searchUrl}`);
    
    // Create tab for scraping
    const tab = await chrome.tabs.create({
      url: searchUrl,
      active: false  // Background tabs for faster scraping
    });

    if (!tab.id) throw new Error('Failed to create tab');
    console.log(`✅ Tab created: ${tab.id}`);

    // Wait for page to load
    await waitForTabLoadDirect(tab.id);
    
    // Check if content script is already loaded by testing communication
    let contentScriptLoaded = false;
    try {
      console.log(`🔍 Testing if content script is already loaded in tab ${tab.id}...`);
      await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
      contentScriptLoaded = true;
      console.log(`✅ Content script already loaded in tab ${tab.id}`);
    } catch (testError) {
      console.log(`⚠️ Content script not loaded, will inject manually`);
    }
    
    // Try to inject content script manually if needed
    if (!contentScriptLoaded) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        console.log(`✅ Content script injected into tab ${tab.id}`);
        
        // Wait a bit for the script to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (injectError) {
        console.error(`❌ Content script injection failed:`, injectError);
        throw new Error(`Failed to inject content script: ${injectError}`);
      }
    }
    
    // Try to send message to content script with retries
    console.log(`📨 Sending scrape message to tab ${tab.id}...`);
    const message = {
      action: 'scrapeDeals',
      store: storeKey,
      searchTerm: searchTerm
    };
    console.log(`📨 Message being sent:`, message);
    
    const results = await sendMessageWithRetry(tab.id, message);

    console.log(`📥 Received results:`, results);
    console.log(`📥 Results type:`, typeof results);
    console.log(`📥 Results length:`, results ? results.length : 'null/undefined');
    
    // Wait 1 second before closing tab
    console.log(`⏳ Waiting 1 second before closing tab...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Close tab
    await chrome.tabs.remove(tab.id);
    console.log(`🗑️ Tab ${tab.id} closed`);

    return results || [];
    
  } catch (error) {
    console.error(`❌ Direct scraping failed for ${store.name}:`, error);
    return [];
  }
}

// Filter deals to only include exact matches with the subscribed item
function filterExactMatches(deals: Deal[], item: GroceryItem): Deal[] {
  const searchTerms = [
    item.name.toLowerCase().trim(),
    item.searchTerm.toLowerCase().trim()
  ];
  
  // Remove duplicates and empty terms
  const uniqueSearchTerms = [...new Set(searchTerms)].filter(term => term.length > 0);
  
  const filteredDeals = deals.filter(deal => {
    const dealTitle = deal.title.toLowerCase().trim();
    
    // Check if any of the search terms are contained in the deal title
    const isMatch = uniqueSearchTerms.some(searchTerm => {
      // Split search term into individual words
      const searchWords = searchTerm.split(/\s+/);
      
      // All words from search term must be present in the deal title
      const allWordsMatch = searchWords.every(word => 
        dealTitle.includes(word.toLowerCase())
      );
      
      return allWordsMatch;
    });
    
    return isMatch;
  });
  
  return filteredDeals;
}

// Simplified tab loading wait
async function waitForTabLoadDirect(tabId: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Direct tab load timeout'));
    }, 15000); // Shorter timeout for direct scraping

    const checkStatus = (updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        clearTimeout(timeout);
        chrome.tabs.onUpdated.removeListener(checkStatus);
        setTimeout(resolve, 2000); // Shorter wait
      }
    };

    chrome.tabs.onUpdated.addListener(checkStatus);
  });
}

// Send message with retries
async function sendMessageWithRetry(tabId: number, message: any, maxRetries: number = 3): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, message);
      return response;
    } catch (error) {
      if (attempt === maxRetries) {
        throw new Error(`Failed to send message after ${maxRetries} attempts: ${error}`);
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

// Helper function to create mock deals for testing
async function createMockDeals() {
  const items = await StorageManager.getGroceryItems();
  if (items.length === 0) return;
  
  const mockResults = items.map(item => ({
    searchTerm: item.searchTerm,
    deals: [
      {
        id: `mock-coles-${item.id}`,
        title: `${item.name} - Coles Special`,
        price: '$3.50',
        originalPrice: '$4.99',
        discount: 'Save $1.49',
        store: 'coles' as const,
        url: 'https://www.coles.com.au',
        searchTerm: item.searchTerm,
        dateFound: new Date().toISOString()
      },
      {
        id: `mock-woolworths-${item.id}`,
        title: `${item.name} - Woolworths Deal`,
        price: '$3.25',
        originalPrice: '$4.50',
        discount: '28% off',
        store: 'woolworths' as const,
        url: 'https://www.woolworths.com.au',
        searchTerm: item.searchTerm,
        dateFound: new Date().toISOString()
      }
    ],
    lastChecked: new Date().toISOString()
  }));
  
  await StorageManager.saveSearchResults(mockResults);
  console.log('Mock deals created for testing');
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}