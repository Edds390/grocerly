import { Deal, SearchResult, GroceryItem } from './types.js';
import { STORES } from './stores.js';

export class DealScraper {
  static async searchDeals(groceryItems: GroceryItem[]): Promise<SearchResult[]> {
    console.log('🔍 DealScraper.searchDeals() started');
    console.log(`📝 Searching for ${groceryItems.length} items:`, groceryItems.map(i => i.name));
    
    const results: SearchResult[] = [];
    
    for (let i = 0; i < groceryItems.length; i++) {
      const item = groceryItems[i];
      console.log(`\n🛒 [${i + 1}/${groceryItems.length}] Processing item: "${item.name}" (search: "${item.searchTerm}")`);
      
      const searchResult: SearchResult = {
        searchTerm: item.searchTerm,
        deals: [],
        lastChecked: new Date().toISOString()
      };

      try {
        console.log(`🏪 Searching stores for "${item.searchTerm}"...`);
        
        // Search both stores
        console.log('🔴 Starting Coles search...');
        const colesDeals = await this.searchStore('coles', item.searchTerm);
        console.log(`✅ Coles search complete: ${colesDeals.length} deals found`);
        
        console.log('🟢 Starting Woolworths search...');
        const woolworthsDeals = await this.searchStore('woolworths', item.searchTerm);
        console.log(`✅ Woolworths search complete: ${woolworthsDeals.length} deals found`);
        
        searchResult.deals = [...colesDeals, ...woolworthsDeals];
        console.log(`📊 Total deals for "${item.searchTerm}": ${searchResult.deals.length}`);
        
      } catch (error) {
        console.error(`❌ Error searching for ${item.searchTerm}:`, error);
        searchResult.error = error instanceof Error ? error.message : 'Unknown error';
      }

      results.push(searchResult);
    }

    console.log('\n🎉 DealScraper.searchDeals() completed');
    console.log(`📈 Final results: ${results.length} search terms, ${results.reduce((sum, r) => sum + r.deals.length, 0)} total deals`);
    return results;
  }

  private static async searchStore(storeKey: string, searchTerm: string): Promise<Deal[]> {
    console.log(`\n🏪 searchStore() started for ${storeKey}`);
    
    const store = STORES[storeKey];
    if (!store) {
      console.error(`❌ Store config not found for: ${storeKey}`);
      return [];
    }

    const searchUrl = store.searchUrl(searchTerm);
    console.log(`🌐 Search URL: ${searchUrl}`);

    try {
      console.log(`📂 Creating background tab for ${store.name}...`);
      
      // Create a new tab to perform the search
      const tab = await chrome.tabs.create({
        url: searchUrl,
        active: false
      });

      console.log(`✅ Tab created with ID: ${tab.id}`);
      if (!tab.id) throw new Error('Failed to create tab');

      console.log(`⏳ Waiting for page to load...`);
      // Wait for the page to load and inject content script
      await this.waitForTabLoad(tab.id);
      console.log(`✅ Page loaded successfully`);
      
      console.log(`📨 Sending scrape message to content script...`);
      // Execute scraping script
      const results = await chrome.tabs.sendMessage(tab.id, {
        action: 'scrapeDeals',
        store: storeKey,
        searchTerm: searchTerm
      });

      console.log(`📥 Received results from content script:`, results ? `${results.length} deals` : 'null/undefined');

      console.log(`🗑️ Closing tab ${tab.id}...`);
      // Close the tab
      await chrome.tabs.remove(tab.id);
      console.log(`✅ Tab closed successfully`);

      const finalResults = results || [];
      console.log(`🎯 ${store.name} search complete: ${finalResults.length} deals`);
      return finalResults;
      
    } catch (error) {
      console.error(`❌ Error scraping ${store.name}:`, error);
      console.error(`🔍 Error details:`, {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        storeKey,
        searchTerm,
        searchUrl
      });
      return [];
    }
  }

  private static async waitForTabLoad(tabId: number): Promise<void> {
    console.log(`⏱️ waitForTabLoad() started for tab ${tabId}`);
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error(`⏰ Tab ${tabId} load timeout after 30 seconds`);
        reject(new Error('Tab load timeout'));
      }, 30000); // 30 second timeout

      const checkStatus = (updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
        if (updatedTabId === tabId) {
          console.log(`📊 Tab ${tabId} status update:`, changeInfo);
          
          if (changeInfo.status === 'complete') {
            console.log(`✅ Tab ${tabId} finished loading, waiting 3s for dynamic content...`);
            clearTimeout(timeout);
            chrome.tabs.onUpdated.removeListener(checkStatus);
            // Wait a bit more for dynamic content to load
            setTimeout(() => {
              console.log(`🎯 Tab ${tabId} ready for scraping`);
              resolve();
            }, 3000);
          }
        }
      };

      console.log(`👂 Adding tab update listener for tab ${tabId}`);
      chrome.tabs.onUpdated.addListener(checkStatus);
    });
  }

  static async testScraping(searchTerm: string): Promise<{ coles: Deal[], woolworths: Deal[] }> {
    const colesDeals = await this.searchStore('coles', searchTerm);
    const woolworthsDeals = await this.searchStore('woolworths', searchTerm);
    
    return {
      coles: colesDeals,
      woolworths: woolworthsDeals
    };
  }
}