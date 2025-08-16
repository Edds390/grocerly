import { GroceryItem, Deal, SearchResult, StorageData } from './types.js';

export class StorageManager {
  private static readonly STORAGE_KEY = 'groceryDealsData';

  static async getData(): Promise<StorageData> {
    const result = await chrome.storage.local.get(this.STORAGE_KEY);
    return result[this.STORAGE_KEY] || {
      groceryItems: [],
      lastResults: [],
      lastFullScan: ''
    };
  }

  static async saveData(data: StorageData): Promise<void> {
    await chrome.storage.local.set({ [this.STORAGE_KEY]: data });
  }

  static async addGroceryItem(item: Omit<GroceryItem, 'id' | 'dateAdded'>): Promise<GroceryItem> {
    const data = await this.getData();
    const newItem: GroceryItem = {
      ...item,
      id: Date.now().toString(),
      dateAdded: new Date().toISOString()
    };
    
    data.groceryItems.push(newItem);
    await this.saveData(data);
    return newItem;
  }

  static async removeGroceryItem(id: string): Promise<void> {
    const data = await this.getData();
    data.groceryItems = data.groceryItems.filter(item => item.id !== id);
    await this.saveData(data);
  }

  static async updateGroceryItem(id: string, updates: Partial<GroceryItem>): Promise<void> {
    const data = await this.getData();
    const index = data.groceryItems.findIndex(item => item.id === id);
    if (index !== -1) {
      data.groceryItems[index] = { ...data.groceryItems[index], ...updates };
      await this.saveData(data);
    }
  }

  static async saveSearchResults(results: SearchResult[]): Promise<void> {
    const data = await this.getData();
    data.lastResults = results;
    data.lastFullScan = new Date().toISOString();
    await this.saveData(data);
  }

  static async getGroceryItems(): Promise<GroceryItem[]> {
    const data = await this.getData();
    return data.groceryItems;
  }

  static async getLastResults(): Promise<SearchResult[]> {
    const data = await this.getData();
    return data.lastResults;
  }
}