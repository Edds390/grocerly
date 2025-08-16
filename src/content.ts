// Inline store configurations to avoid import issues in content script
const STORES: Record<string, any> = {
  coles: {
    name: 'Coles',
    baseUrl: 'https://www.coles.com.au',
    searchUrl: (term: string) => `https://www.coles.com.au/search/products?q=${encodeURIComponent(term)}&filter_Special=all`,
    selectors: {
      productContainer: '[data-testid="product-tile"]',
      title: '[data-testid="product-title"], .product-title, h3, h2',
      price: '[data-testid="product_price"], [data-testid="price-current"], .price, .product-price',
      originalPrice: '[data-testid="price-was"], .was-price, .original-price',
      discount: '[data-testid="price-discount"], .discount, .save-amount',
      link: 'a[href*="/product/"], a',
      image: 'img[data-testid="product-image"], img'
    }
  },
  woolworths: {
    name: 'Woolworths',
    baseUrl: 'https://www.woolworths.com.au',
    searchUrl: (term: string) => `https://www.woolworths.com.au/shop/search/products?searchTerm=${encodeURIComponent(term)}&isSpecial=true`,
    selectors: {
      productContainer: 'wc-product-tile, shared-product-tile',
      title: '.product-title-container a, .product-title-container, .title a, .title, [class*="title"], a',
      price: '.primary, .current-price, [class*="current"], .price',
      originalPrice: '.was-price, .secondary, [class*="was"]',
      discount: '.save-price, [class*="save"]',
      link: '.title a, .product-tile-image a, a[href*="/productdetails/"], a',
      image: '.product-tile-image img[src*="assets.woolworths.com.au"], .product-tile-image img[title], .product-tile-image img:not([src*="promotiontags"]), img[src*="assets.woolworths.com.au"]'
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

// Inline Deal interface to avoid import issues
interface Deal {
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

// Content script that runs on store pages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ping') {
    sendResponse({ success: true, message: 'Content script is active' });
    return true;
  }
  
  if (request.action === 'scrapeDeals') {
    try {
      const deals = scrapeCurrentPage(request.store, request.searchTerm);
      sendResponse(deals);
    } catch (error) {
      console.error('Error in content script scraping:', error);
      sendResponse([]);
    }
  }
  return true;
});

function scrapeCurrentPage(storeKey: string, searchTerm: string): Deal[] {
  const store = STORES[storeKey];
  if (!store) {
    console.error(`Store config not found for: ${storeKey}`);
    return [];
  }

  const deals: Deal[] = [];
  const productElements = document.querySelectorAll(store.selectors.productContainer);
  
  if (productElements.length === 0) {
    console.log('No products found on page');
    return [];
  }

  productElements.forEach((element, index) => {
    try {
      // Try regular DOM first
      let titleElement = element.querySelector(store.selectors.title);
      let priceElement = element.querySelector(store.selectors.price);
      let linkElement = element.querySelector(store.selectors.link);

      // If not found and Shadow DOM exists, try Shadow DOM
      if ((!titleElement || !priceElement) && element.shadowRoot) {
        titleElement = titleElement || element.shadowRoot.querySelector(store.selectors.title);
        priceElement = priceElement || element.shadowRoot.querySelector(store.selectors.price);
        linkElement = linkElement || element.shadowRoot.querySelector(store.selectors.link);
      }

      if (!titleElement || !priceElement) {
        return;
      }

      let title = titleElement.textContent?.trim() || '';
      let price = priceElement.textContent?.trim() || '';
      
      // If title is empty, try to extract from aria-label of link
      if (!title && linkElement) {
        const ariaLabel = linkElement.getAttribute('aria-label');
        if (ariaLabel) {
          console.log(`🔍 Aria-label:`, ariaLabel);
          // Extract product name from aria-label - look for pattern like "Product Name, $price"
          const match = ariaLabel.match(/([^.]+),\s*\$[\d.]+/);
          if (match) {
            title = match[1].replace(/^(Special\.|On special\.|Save \$[\d.]+\.?\s*)/i, '').trim();
          } else {
            // Fallback: take the longest part that's not just price info
            const parts = ariaLabel.split('.');
            title = parts.find((part: string) => part.length > 10 && !part.includes('$')) || parts[0];
          }
        }
      }
      
      // Clean up price text (remove extra whitespace and newlines)
      price = price.replace(/\s+/g, ' ').trim();
      
      // For Coles: Parse complex price strings to extract components
      let colesOriginalPrice = null;
      let colesDiscount = null;
      let colesUnitPrice = null;
      
      if (storeKey === 'coles' && price.includes('Save')) {
        // Parse "$16.00Save $11.00$1.60 per 100mL | Was $27.00"
        const priceMatch = price.match(/^\$[\d.]+/);
        const saveMatch = price.match(/Save \$[\d.]+/);
        const wasMatch = price.match(/Was \$[\d.]+/);
        const unitMatch = price.match(/\$[\d.]+ per \d+\w+/);
        
        if (priceMatch) {
          price = priceMatch[0]; // Current price: "$16.00"
        }
        if (saveMatch) {
          colesDiscount = saveMatch[0]; // "Save $11.00"
        }
        if (wasMatch) {
          colesOriginalPrice = wasMatch[0].replace('Was ', ''); // "$27.00"
        }
        if (unitMatch) {
          colesUnitPrice = unitMatch[0]; // "$1.60 per 100mL"
        }
      }
      
      console.log(`📝 Product data: "${title}" - ${price}`);
      
      // Debug: For Aldi, show extraction details
      if (storeKey === 'aldi') {
        console.log(`🔍 Aldi extraction details:`, {
          titleElement: titleElement?.tagName + '.' + titleElement?.className,
          titleText: titleElement?.textContent?.substring(0, 50),
          priceElement: priceElement?.tagName + '.' + priceElement?.className,
          priceText: priceElement?.textContent?.substring(0, 30),
          elementIndex: index
        });
      }
      
      // Get link - might be relative
      let url = '';
      if (linkElement) {
        const href = linkElement.getAttribute('href') || '';
        url = href.startsWith('http') ? href : store.baseUrl + href;
      } else {
        // For Aldi, try to find any link in the product container as fallback
        if (storeKey === 'aldi') {
          const anyLink = element.querySelector('a');
          if (anyLink) {
            const href = anyLink.getAttribute('href') || '';
            url = href.startsWith('http') ? href : store.baseUrl + href;
            linkElement = anyLink;
          }
        }
      }

      // Get optional fields (check Shadow DOM too)
      let originalPriceElement = store.selectors.originalPrice ? 
        element.querySelector(store.selectors.originalPrice) : null;
      let discountElement = store.selectors.discount ? 
        element.querySelector(store.selectors.discount) : null;
      let imageElement = store.selectors.image ? 
        element.querySelector(store.selectors.image) : null;

      // Try Shadow DOM for optional fields if not found
      if (element.shadowRoot) {
        originalPriceElement = originalPriceElement || (store.selectors.originalPrice ? 
          element.shadowRoot.querySelector(store.selectors.originalPrice) : null);
        discountElement = discountElement || (store.selectors.discount ? 
          element.shadowRoot.querySelector(store.selectors.discount) : null);
        imageElement = imageElement || (store.selectors.image ? 
          element.shadowRoot.querySelector(store.selectors.image) : null);
      }

      let originalPrice = originalPriceElement?.textContent?.trim();
      let discount = discountElement?.textContent?.trim();
      
      // Use Coles parsed values if available
      if (storeKey === 'coles') {
        originalPrice = colesOriginalPrice || originalPrice;
        discount = colesDiscount || discount;
      }
      const imageUrl = imageElement?.getAttribute('src') || imageElement?.getAttribute('data-src') || undefined;

      // Extract unit pricing for Woolworths and clean up original price
      let woolworthsUnitPrice = null;
      if (storeKey === 'woolworths' && originalPrice) {
        // Extract unit price from "$11.00\n\n          $3.60 / 100ML"
        const unitMatch = originalPrice.match(/\$[\d.]+ \/ \d+\w+/);
        if (unitMatch) {
          woolworthsUnitPrice = unitMatch[0]; // "$3.60 / 100ML"
        }
        
        // Extract just the dollar amount for original price
        const priceMatch = originalPrice.match(/^\$[\d.]+/);
        if (priceMatch) {
          originalPrice = priceMatch[0];
        }
      }

      if (originalPrice) console.log(`💰 Original price: ${originalPrice}`);
      if (discount) console.log(`🏷️ Discount: ${discount}`);
      
      console.log(`🖼️ Image element:`, imageElement);
      console.log(`🖼️ Image URL:`, imageUrl);

      // Extract unit pricing for Aldi
      let aldiUnitPrice = null;
      if (storeKey === 'aldi') {
        // Look for unit pricing in Aldi's base-price__comparison-price
        const unitPriceElement = element.shadowRoot ? 
          element.shadowRoot.querySelector('.base-price__comparison-price') :
          element.querySelector('.base-price__comparison-price');
        
        if (unitPriceElement) {
          aldiUnitPrice = unitPriceElement.textContent?.trim();
        }
      }

      // Determine unit price based on store
      const unitPrice = storeKey === 'coles' ? colesUnitPrice : 
                       storeKey === 'woolworths' ? woolworthsUnitPrice : 
                       aldiUnitPrice;

      const deal: Deal = {
        id: `${storeKey}-${searchTerm}-${index}-${Date.now()}`,
        title,
        price,
        originalPrice,
        discount,
        store: storeKey as 'coles' | 'woolworths' | 'aldi',
        url,
        imageUrl,
        unitPrice,
        searchTerm,
        dateFound: new Date().toISOString()
      };

      deals.push(deal);
      
    } catch (error) {
      console.error(`Error scraping product element ${index + 1}:`, error);
    }
  });

  // Deduplicate deals based on title and price
  const uniqueDeals = deals.filter((deal, index, self) => 
    index === self.findIndex(d => 
      d.title.toLowerCase().trim() === deal.title.toLowerCase().trim() && 
      d.price === deal.price
    )
  );
  
  return uniqueDeals;
}

// Helper function to wait for elements to load
function waitForElements(selector: string, timeout = 10000): Promise<NodeListOf<Element>> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    function check() {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        resolve(elements);
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Timeout waiting for elements: ${selector}`));
      } else {
        setTimeout(check, 500);
      }
    }
    
    check();
  });
}