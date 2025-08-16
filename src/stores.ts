import { StoreConfig } from './types.js';

export const STORES: Record<string, StoreConfig> = {
  coles: {
    name: 'Coles',
    baseUrl: 'https://www.coles.com.au',
    searchUrl: (term: string) => `https://www.coles.com.au/search/products?q=${encodeURIComponent(term)}&filter_Special=all`,
    selectors: {
      productContainer: '[data-testid="product-tile"]',
      title: '[data-testid="product-title"]',
      price: '[data-testid="price-current"]',
      originalPrice: '[data-testid="price-was"]',
      discount: '[data-testid="price-discount"]',
      link: 'a[href*="/product/"]',
      image: 'img[data-testid="product-image"]'
    }
  },
  woolworths: {
    name: 'Woolworths',
    baseUrl: 'https://www.woolworths.com.au',
    searchUrl: (term: string) => `https://www.woolworths.com.au/shop/search/products?searchTerm=${encodeURIComponent(term)}&isSpecial=true`,
    selectors: {
      productContainer: '[data-testid="shelfProduct"]',
      title: '[data-testid="product-title"]',
      price: '[data-testid="price-dollars"]',
      originalPrice: '[data-testid="was-price"]',
      discount: '[data-testid="price-save"]',
      link: 'a[href*="/product/"]',
      image: 'img[data-testid="product-image"]'
    }
  },
  aldi: {
    name: 'Aldi',
    baseUrl: 'https://www.aldi.com.au',
    searchUrl: (term: string) => `https://www.aldi.com.au/results?q=${encodeURIComponent(term)}`,
    selectors: {
      productContainer: '.product-tile:has(.product-tile__name):has(.base-price__regular), .product-tile',
      title: '.product-tile__name, [class*="product-tile__name"]',
      price: '.base-price__regular, [class*="base-price__regular"]',
      originalPrice: '.base-price__was, [class*="was"]',
      discount: '.base-price__save, [class*="save"]',
      link: 'a[href*="/product/"], a',
      image: 'img[srcset], img'
    }
  }
};

export function getStoreConfig(store: string): StoreConfig | null {
  return STORES[store] || null;
}