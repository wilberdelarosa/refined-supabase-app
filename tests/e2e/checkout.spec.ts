import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should complete full checkout flow', async ({ page }) => {
    // Navigate to shop
    await page.click('a[href="/shop"]');
    await expect(page).toHaveURL('/shop');

    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });

    // Add first product to cart
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.locator('button:has-text("Agregar al carrito")').click();

    // Verify toast notification
    await expect(page.locator('text=Producto agregado al carrito')).toBeVisible();

    // Open cart
    await page.click('[data-testid="cart-button"]');

    // Verify product in cart
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);

    // Proceed to checkout
    await page.click('button:has-text("Proceder al pago")');

    // Should redirect to auth if not logged in
    // Or to checkout if logged in
    const url = page.url();
    expect(url).toMatch(/\/(auth|checkout)/);
  });

  test('should update cart quantity', async ({ page }) => {
    // Add product to cart first
    await page.goto('/shop');
    await page.waitForSelector('[data-testid="product-card"]');
    
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.locator('button:has-text("Agregar al carrito")').click();

    // Open cart
    await page.click('[data-testid="cart-button"]');

    // Increase quantity
    await page.click('[data-testid="increase-quantity"]');

    // Verify quantity updated
    await expect(page.locator('[data-testid="item-quantity"]')).toHaveText('2');
  });

  test('should remove item from cart', async ({ page }) => {
    // Add product to cart
    await page.goto('/shop');
    await page.waitForSelector('[data-testid="product-card"]');
    
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.locator('button:has-text("Agregar al carrito")').click();

    // Open cart
    await page.click('[data-testid="cart-button"]');

    // Remove item
    await page.click('[data-testid="remove-item"]');

    // Verify cart is empty
    await expect(page.locator('text=Tu carrito está vacío')).toBeVisible();
  });

  test('should calculate total correctly', async ({ page }) => {
    await page.goto('/shop');
    await page.waitForSelector('[data-testid="product-card"]');

    // Add multiple products
    const products = page.locator('[data-testid="product-card"]');
    await products.nth(0).locator('button:has-text("Agregar al carrito")').click();
    await page.waitForTimeout(500);
    await products.nth(1).locator('button:has-text("Agregar al carrito")').click();

    // Open cart
    await page.click('[data-testid="cart-button"]');

    // Verify total is calculated
    const total = await page.locator('[data-testid="cart-total"]').textContent();
    expect(total).toBeTruthy();
    expect(parseFloat(total!.replace(/[^0-9.]/g, ''))).toBeGreaterThan(0);
  });
});
