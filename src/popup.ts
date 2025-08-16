import { StorageManager } from './storage.js';

document.addEventListener('DOMContentLoaded', async () => {
  await loadStats();
  setupEventListeners();
});

async function loadStats() {
  try {
    const groceryItems = await StorageManager.getGroceryItems();
    const lastResults = await StorageManager.getLastResults();
    const data = await StorageManager.getData();

    // Update item count
    document.getElementById('itemCount')!.textContent = groceryItems.length.toString();

    // Update deal count
    const totalDeals = lastResults.reduce((sum, result) => sum + result.deals.length, 0);
    document.getElementById('dealCount')!.textContent = totalDeals.toString();

    // Update last check time
    const lastCheckElement = document.getElementById('lastCheck')!;
    if (data.lastFullScan) {
      const lastCheck = new Date(data.lastFullScan);
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60));
      
      if (diffHours < 1) {
        lastCheckElement.textContent = 'Just now';
      } else if (diffHours < 24) {
        lastCheckElement.textContent = `${diffHours}h ago`;
      } else {
        const diffDays = Math.floor(diffHours / 24);
        lastCheckElement.textContent = `${diffDays}d ago`;
      }
    } else {
      lastCheckElement.textContent = 'Never';
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

function setupEventListeners() {
  const openResultsBtn = document.getElementById('openResults');
  const checkDealsBtn = document.getElementById('checkDeals');

  openResultsBtn?.addEventListener('click', () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('results.html')
    }).then(() => {
      window.close();
    }).catch((error) => {
      console.error('Error opening results page:', error);
      window.close();
    });
  });

  checkDealsBtn?.addEventListener('click', async () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('results.html')
    }).then(() => {
      window.close();
    }).catch((error) => {
      console.error('Error opening results page:', error);
      window.close();
    });
  });
}