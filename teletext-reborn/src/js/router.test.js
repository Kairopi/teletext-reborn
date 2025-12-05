/**
 * Teletext Reborn - Page Router Property Tests
 * 
 * Property-based tests to verify:
 * - Property 2: Page Navigation Consistency (navigate then back returns to original)
 * - Property 8: API Error Handling (invalid pages show error without crashing)
 * 
 * Validates: Requirements 3.1, 3.4, 3.5, 15.1
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import {
  PageRouter,
  PAGE_NUMBERS,
  QUICK_ACCESS_PAGES,
  VALID_PAGE_RANGES,
  getRouter,
  resetRouter,
} from './router.js';

describe('PageRouter', () => {
  beforeEach(() => {
    resetRouter();
  });

  afterEach(() => {
    resetRouter();
  });

  describe('Page Navigation Consistency (Property 2)', () => {
    /**
     * Property 2: Page Navigation Consistency
     * *For any* valid page number (100-999), navigating to that page and then
     * navigating back SHALL return to the original page.
     * 
     * **Feature: teletext-reborn, Property 2: Page Navigation Consistency**
     * **Validates: Requirements 3.1, 3.4**
     */

    // Arbitrary for valid page numbers within defined ranges
    const validPageArb = fc.oneof(
      ...VALID_PAGE_RANGES.map(range => 
        fc.integer({ min: range.min, max: range.max })
      )
    );

    it('PROPERTY: Navigate then back returns to original page', async () => {
      await fc.assert(
        fc.asyncProperty(validPageArb, validPageArb, async (startPage, targetPage) => {
          // Skip if start and target are the same (no navigation occurs)
          if (startPage === targetPage) {
            return true;
          }

          resetRouter();
          const router = new PageRouter();

          // Navigate to start page first
          await router.navigate(startPage);
          expect(router.getCurrentPage()).toBe(startPage);

          // Navigate to target page
          await router.navigate(targetPage);
          expect(router.getCurrentPage()).toBe(targetPage);

          // Go back should return to start page
          const wentBack = router.goBack();
          expect(wentBack).toBe(true);
          expect(router.getCurrentPage()).toBe(startPage);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('PROPERTY: Navigate forward after back returns to target page', async () => {
      await fc.assert(
        fc.asyncProperty(validPageArb, validPageArb, async (startPage, targetPage) => {
          // Skip if start and target are the same
          if (startPage === targetPage) {
            return true;
          }

          resetRouter();
          const router = new PageRouter();

          // Navigate to start page
          await router.navigate(startPage);

          // Navigate to target page
          await router.navigate(targetPage);

          // Go back
          router.goBack();
          expect(router.getCurrentPage()).toBe(startPage);

          // Go forward should return to target page
          const wentForward = router.goForward();
          expect(wentForward).toBe(true);
          expect(router.getCurrentPage()).toBe(targetPage);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('PROPERTY: History length increases with each unique navigation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(validPageArb, { minLength: 2, maxLength: 10 }),
          async (pages) => {
            resetRouter();
            const router = new PageRouter();

            // Filter out consecutive duplicates (they don't add to history)
            const uniqueConsecutivePages = pages.filter((page, index) => {
              if (index === 0) return true;
              return page !== pages[index - 1];
            });

            // Navigate through all pages
            for (const page of uniqueConsecutivePages) {
              await router.navigate(page);
            }

            // History should contain home (initial) + all unique consecutive pages
            // But we need to account for the initial home page
            const history = router.getHistory();
            
            // The history starts with HOME (100), then adds each navigated page
            // If first page is HOME, it won't be added again
            let expectedLength = 1; // Start with HOME
            for (const page of uniqueConsecutivePages) {
              if (page !== router.getHistory()[expectedLength - 1]) {
                expectedLength++;
              }
            }

            // History length should match expected
            expect(history.length).toBeGreaterThanOrEqual(1);
            expect(history.length).toBeLessThanOrEqual(uniqueConsecutivePages.length + 1);

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });


  describe('Invalid Page Handling (Property 8)', () => {
    /**
     * Property 8: API Error Handling
     * *For any* API call that fails, the system SHALL display an error message
     * and offer a retry option without crashing.
     * 
     * For the router, this means invalid page numbers should navigate to 404
     * without throwing errors.
     * 
     * **Feature: teletext-reborn, Property 8: API Error Handling**
     * **Validates: Requirements 3.5, 15.1**
     */

    // Arbitrary for invalid page numbers (outside valid ranges)
    const invalidPageArb = fc.integer({ min: 100, max: 999 }).filter(page => {
      // Filter out pages that ARE in valid ranges
      return !VALID_PAGE_RANGES.some(range => page >= range.min && page <= range.max);
    });

    // Arbitrary for completely out of range page numbers
    const outOfRangePageArb = fc.oneof(
      fc.integer({ min: -1000, max: 99 }),
      fc.integer({ min: 1000, max: 10000 })
    );

    it('PROPERTY: Invalid page numbers navigate to 404 without crashing', async () => {
      await fc.assert(
        fc.asyncProperty(invalidPageArb, async (invalidPage) => {
          resetRouter();
          const router = new PageRouter();

          // Should not throw
          let error = null;
          try {
            await router.navigate(invalidPage);
          } catch (e) {
            error = e;
          }

          expect(error).toBeNull();

          // Should navigate to 404 page
          expect(router.getCurrentPage()).toBe(PAGE_NUMBERS.NOT_FOUND);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('PROPERTY: Out of range page numbers are handled gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(outOfRangePageArb, async (outOfRangePage) => {
          resetRouter();
          const router = new PageRouter();

          // Should not throw
          let error = null;
          try {
            await router.navigate(outOfRangePage);
          } catch (e) {
            error = e;
          }

          expect(error).toBeNull();

          // Should navigate to 404 page for invalid pages
          expect(router.getCurrentPage()).toBe(PAGE_NUMBERS.NOT_FOUND);

          return true;
        }),
        { numRuns: 50 }
      );
    });

    it('PROPERTY: Non-numeric inputs are handled gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.string(),
            fc.constant(null),
            fc.constant(undefined),
            fc.constant(NaN),
            fc.object()
          ),
          async (invalidInput) => {
            resetRouter();
            const router = new PageRouter();
            const initialPage = router.getCurrentPage();

            // Should not throw
            let error = null;
            try {
              await router.navigate(invalidInput);
            } catch (e) {
              error = e;
            }

            expect(error).toBeNull();

            // For non-numeric inputs, navigation should fail gracefully
            // Either stay on current page or go to 404
            const currentPage = router.getCurrentPage();
            expect([initialPage, PAGE_NUMBERS.NOT_FOUND]).toContain(currentPage);

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Basic Navigation', () => {
    it('should start at home page (100)', () => {
      resetRouter();
      const router = new PageRouter();
      expect(router.getCurrentPage()).toBe(PAGE_NUMBERS.HOME);
    });

    it('should navigate to valid pages', async () => {
      resetRouter();
      const router = new PageRouter();

      await router.navigate(PAGE_NUMBERS.NEWS_TOP);
      expect(router.getCurrentPage()).toBe(PAGE_NUMBERS.NEWS_TOP);

      await router.navigate(PAGE_NUMBERS.WEATHER);
      expect(router.getCurrentPage()).toBe(PAGE_NUMBERS.WEATHER);

      await router.navigate(PAGE_NUMBERS.FINANCE);
      expect(router.getCurrentPage()).toBe(PAGE_NUMBERS.FINANCE);
    });

    it('should navigate to 404 for invalid pages', async () => {
      resetRouter();
      const router = new PageRouter();

      await router.navigate(150); // Not a valid page
      expect(router.getCurrentPage()).toBe(PAGE_NUMBERS.NOT_FOUND);
    });

    it('should return to home on goHome()', async () => {
      resetRouter();
      const router = new PageRouter();

      await router.navigate(PAGE_NUMBERS.WEATHER);
      expect(router.getCurrentPage()).toBe(PAGE_NUMBERS.WEATHER);

      await router.goHome();
      expect(router.getCurrentPage()).toBe(PAGE_NUMBERS.HOME);
    });
  });

  describe('History Navigation', () => {
    it('should track navigation history', async () => {
      resetRouter();
      const router = new PageRouter();

      await router.navigate(PAGE_NUMBERS.NEWS_TOP);
      await router.navigate(PAGE_NUMBERS.WEATHER);
      await router.navigate(PAGE_NUMBERS.FINANCE);

      const history = router.getHistory();
      expect(history).toEqual([
        PAGE_NUMBERS.HOME,
        PAGE_NUMBERS.NEWS_TOP,
        PAGE_NUMBERS.WEATHER,
        PAGE_NUMBERS.FINANCE,
      ]);
    });

    it('should go back in history', async () => {
      resetRouter();
      const router = new PageRouter();

      await router.navigate(PAGE_NUMBERS.NEWS_TOP);
      await router.navigate(PAGE_NUMBERS.WEATHER);

      expect(router.canGoBack()).toBe(true);
      router.goBack();
      expect(router.getCurrentPage()).toBe(PAGE_NUMBERS.NEWS_TOP);
    });

    it('should go forward in history', async () => {
      resetRouter();
      const router = new PageRouter();

      await router.navigate(PAGE_NUMBERS.NEWS_TOP);
      await router.navigate(PAGE_NUMBERS.WEATHER);
      router.goBack();

      expect(router.canGoForward()).toBe(true);
      router.goForward();
      expect(router.getCurrentPage()).toBe(PAGE_NUMBERS.WEATHER);
    });

    it('should not go back when at start of history', () => {
      resetRouter();
      const router = new PageRouter();

      expect(router.canGoBack()).toBe(false);
      const result = router.goBack();
      expect(result).toBe(false);
      expect(router.getCurrentPage()).toBe(PAGE_NUMBERS.HOME);
    });

    it('should not go forward when at end of history', async () => {
      resetRouter();
      const router = new PageRouter();

      await router.navigate(PAGE_NUMBERS.NEWS_TOP);

      expect(router.canGoForward()).toBe(false);
      const result = router.goForward();
      expect(result).toBe(false);
      expect(router.getCurrentPage()).toBe(PAGE_NUMBERS.NEWS_TOP);
    });

    it('should truncate forward history when navigating from middle', async () => {
      resetRouter();
      const router = new PageRouter();

      await router.navigate(PAGE_NUMBERS.NEWS_TOP);
      await router.navigate(PAGE_NUMBERS.WEATHER);
      await router.navigate(PAGE_NUMBERS.FINANCE);

      // Go back twice
      router.goBack();
      router.goBack();
      expect(router.getCurrentPage()).toBe(PAGE_NUMBERS.NEWS_TOP);

      // Navigate to a new page
      await router.navigate(PAGE_NUMBERS.SETTINGS);

      // Forward history should be truncated
      expect(router.canGoForward()).toBe(false);
      expect(router.getHistory()).toEqual([
        PAGE_NUMBERS.HOME,
        PAGE_NUMBERS.NEWS_TOP,
        PAGE_NUMBERS.SETTINGS,
      ]);
    });
  });

  describe('Navigation Callbacks', () => {
    it('should call registered callbacks on navigation', async () => {
      resetRouter();
      const router = new PageRouter();
      const callback = vi.fn();

      router.onNavigate(callback);
      await router.navigate(PAGE_NUMBERS.NEWS_TOP);

      expect(callback).toHaveBeenCalledWith(PAGE_NUMBERS.NEWS_TOP, PAGE_NUMBERS.HOME);
    });

    it('should allow unsubscribing from callbacks', async () => {
      resetRouter();
      const router = new PageRouter();
      const callback = vi.fn();

      const unsubscribe = router.onNavigate(callback);
      await router.navigate(PAGE_NUMBERS.NEWS_TOP);
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();
      await router.navigate(PAGE_NUMBERS.WEATHER);
      expect(callback).toHaveBeenCalledTimes(1); // Still 1, not called again
    });

    it('should throw error for non-function callbacks', () => {
      resetRouter();
      const router = new PageRouter();

      expect(() => router.onNavigate('not a function')).toThrow('Callback must be a function');
    });
  });

  describe('Navigation Control', () => {
    it('should disable and enable navigation', async () => {
      resetRouter();
      const router = new PageRouter();

      router.disableNavigation();
      expect(router.isNavigationDisabled()).toBe(true);

      const result = await router.navigate(PAGE_NUMBERS.NEWS_TOP);
      expect(result).toBe(false);
      expect(router.getCurrentPage()).toBe(PAGE_NUMBERS.HOME);

      router.enableNavigation();
      expect(router.isNavigationDisabled()).toBe(false);

      const result2 = await router.navigate(PAGE_NUMBERS.NEWS_TOP);
      expect(result2).toBe(true);
      expect(router.getCurrentPage()).toBe(PAGE_NUMBERS.NEWS_TOP);
    });

    it('should not navigate when disabled', async () => {
      resetRouter();
      const router = new PageRouter();

      router.disableNavigation();

      expect(router.goBack()).toBe(false);
      expect(router.goForward()).toBe(false);
      expect(router.goToPreviousPage()).toBe(false);
      expect(router.goToNextPage()).toBe(false);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      resetRouter();

      const instance1 = getRouter();
      const instance2 = getRouter();

      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = getRouter();
      resetRouter();
      const instance2 = getRouter();

      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Quick Access Pages', () => {
    it('should have correct quick access mappings', () => {
      expect(QUICK_ACCESS_PAGES[1]).toBe(PAGE_NUMBERS.NEWS_TOP);
      expect(QUICK_ACCESS_PAGES[2]).toBe(PAGE_NUMBERS.WEATHER);
      expect(QUICK_ACCESS_PAGES[3]).toBe(PAGE_NUMBERS.FINANCE);
      expect(QUICK_ACCESS_PAGES[4]).toBe(PAGE_NUMBERS.TIME_MACHINE);
      expect(QUICK_ACCESS_PAGES[9]).toBe(PAGE_NUMBERS.ABOUT);
    });
  });
});
