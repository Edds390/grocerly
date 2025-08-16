export interface GroceryItem {
  id: string;
  name: string;
  searchTerm: string;
  dateAdded: string;
}

export interface Deal {
  id: string;
  title: string;
  price: string;
  originalPrice?: string;
  discount?: string;
  store: 'coles' | 'woolworths' | 'aldi';
  url: string;
  imageUrl?: string;
  unitPrice?: string;
  searchTerm: string;
  dateFound: string;
}

export interface SearchResult {
  searchTerm: string;
  deals: Deal[];
  lastChecked: string;
  error?: string;
}

export interface StorageData {
  groceryItems: GroceryItem[];
  lastResults: SearchResult[];
  lastFullScan: string;
}

export type Store = 'coles' | 'woolworths' | 'aldi';

export interface StoreConfig {
  name: string;
  baseUrl: string;
  searchUrl: (term: string) => string;
  selectors: {
    productContainer: string;
    title: string;
    price: string;
    originalPrice?: string;
    discount?: string;
    link: string;
    image?: string;
  };
}