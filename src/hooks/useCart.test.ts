import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCart } from './useCart';

// Mock useAuth
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
  }),
}));

// Mock Supabase
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    })),
  },
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
  toast: vi.fn(),
}));

describe('useCart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock chain
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockResolvedValue({ data: [], error: null });
    mockInsert.mockResolvedValue({ data: null, error: null });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockDelete.mockReturnValue({ eq: mockEq });
  });

  it('should initialize with empty cart', async () => {
    const { result } = renderHook(() => useCart());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.itemCount).toBe(0);
    expect(result.current.total).toBe(0);
  });

  it('should add item to cart', async () => {
    const { result } = renderHook(() => useCart());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let addResult: boolean | undefined;
    await act(async () => {
      addResult = await result.current.addToCart('product-1', 2);
    });

    expect(addResult).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: 'test-user-id',
      product_id: 'product-1',
      quantity: 2,
    });
  });

  it('should update item quantity', async () => {
    // Mock cart with existing item
    mockEq.mockResolvedValueOnce({
      data: [{
        id: 'cart-item-1',
        product_id: 'product-1',
        quantity: 1,
        products: {
          id: 'product-1',
          name: 'Test Product',
          price: 100,
          image_url: 'test.jpg',
        },
      }],
      error: null,
    });

    const { result } = renderHook(() => useCart());
    
    await waitFor(() => {
      expect(result.current.items).toHaveLength(1);
    });

    await act(async () => {
      await result.current.updateQuantity('cart-item-1', 3);
    });

    expect(mockUpdate).toHaveBeenCalledWith({ quantity: 3 });
  });

  it('should remove item from cart', async () => {
    // Mock cart with existing item
    mockEq.mockResolvedValueOnce({
      data: [{
        id: 'cart-item-1',
        product_id: 'product-1',
        quantity: 1,
        products: {
          id: 'product-1',
          name: 'Test Product',
          price: 100,
          image_url: 'test.jpg',
        },
      }],
      error: null,
    });

    const { result } = renderHook(() => useCart());
    
    await waitFor(() => {
      expect(result.current.items).toHaveLength(1);
    });

    await act(async () => {
      await result.current.removeFromCart('cart-item-1');
    });

    expect(mockDelete).toHaveBeenCalled();
  });

  it('should clear cart', async () => {
    const { result } = renderHook(() => useCart());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.clearCart();
    });

    expect(mockDelete).toHaveBeenCalled();
  });

  it('should calculate total correctly', async () => {
    // Mock cart with multiple items
    mockEq.mockResolvedValueOnce({
      data: [
        {
          id: 'cart-item-1',
          product_id: 'product-1',
          quantity: 2,
          products: {
            id: 'product-1',
            name: 'Product 1',
            price: 100,
            image_url: 'test1.jpg',
          },
        },
        {
          id: 'cart-item-2',
          product_id: 'product-2',
          quantity: 3,
          products: {
            id: 'product-2',
            name: 'Product 2',
            price: 50,
            image_url: 'test2.jpg',
          },
        },
      ],
      error: null,
    });

    const { result } = renderHook(() => useCart());
    
    await waitFor(() => {
      expect(result.current.items).toHaveLength(2);
    });

    expect(result.current.itemCount).toBe(5); // 2 + 3
    expect(result.current.total).toBe(350); // (100 * 2) + (50 * 3)
  });
});
