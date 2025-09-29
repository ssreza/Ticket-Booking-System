"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { MockUser, getOrCreateUser } from "../utils/userUtils";
import { formatPrice, formatTierName } from "../utils/formatters";
import { API_ENDPOINTS } from "../utils/constants";
import type { TicketTier, CatalogResponse, CartItem, BookingRequest, BookingSuccess, BookingResponse } from "../types";
import Cart from "../components/Cart";
import CartIcon from "../components/CartIcon";

export default function Home() {
  const [tickets, setTickets] = useState<TicketTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<MockUser | null>(null);
  
  // Cart and booking states
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<BookingSuccess | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  
  // Cart modal state
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Memoized: Get total items in cart
  const totalCartItems = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  // Get color class based on availability (memoized)
  const getAvailabilityColorClass = useCallback((available: number) => {
    if (available === 0) return 'text-red-500';
    if (available < 10) return 'text-amber-500';
    return 'text-green-600';
  }, []);
  
  // Handle quantity change (memoized)
  const handleQuantityChange = useCallback((tier: string, value: number) => {
    setQuantities(prev => ({ ...prev, [tier]: value }));
  }, []);
  
  // Add item to cart (memoized)
  const addToCart = useCallback((tier: string) => {
    const quantity = quantities[tier] || 0;
    if (quantity <= 0) return;
    
    // Find the ticket in the current tickets array
    const ticket = tickets.find(t => t.tier === tier);
    if (!ticket) return;
    
    // Check if quantity is available
    if (quantity > ticket.quantityAvailable) {
      setBookingError(`Only ${ticket.quantityAvailable} tickets available for ${formatTierName(tier)}`);
      // Still show the cart for errors so user knows what happened
      setIsCartOpen(true);
      return;
    }
    
    // Calculate new cart items based on whether the item is already in cart
    let updatedCart: CartItem[];
    const existingItem = cart.find(item => item.tier === tier);
    
    if (existingItem) {
      updatedCart = cart.map(item => 
        item.tier === tier 
          ? { ...item, quantity } 
          : item
      );
    } else {
      updatedCart = [...cart, { 
        tier, 
        quantity, 
        priceUsd: ticket.priceUsd 
      }];
    }
    
    // Update the cart
    setCart(updatedCart);
    
    // Reset quantity input
    setQuantities(prev => ({ ...prev, [tier]: 0 }));
    setBookingError(null);
    
    // Update the displayed available tickets immediately in the frontend
    // This is just a UI update for better UX, the actual inventory is managed by the backend
    setTickets(currentTickets => 
      currentTickets.map(t => {
        if (t.tier === tier) {
          // If updating an existing cart item, we need to account for the previous quantity
          const previousQuantity = existingItem ? existingItem.quantity : 0;
          const quantityDifference = quantity - previousQuantity;
          
          return {
            ...t,
            quantityAvailable: Math.max(0, t.quantityAvailable - quantityDifference)
          };
        }
        return t;
      })
    );
    
    // Don't automatically open cart when items are added successfully
    // Only show cart when user clicks the cart icon
  }, [quantities, tickets, cart, formatTierName]);
  
  // Remove item from cart (memoized)
  const removeFromCart = useCallback((tier: string) => {
    // Find the item to be removed to get its quantity
    const itemToRemove = cart.find(item => item.tier === tier);
    
    if (!itemToRemove) return;
    
    // Update cart by removing the item
    setCart(cart.filter(item => item.tier !== tier));
    setBookingError(null);
    
    // Restore the available quantity in the frontend display
    setTickets(currentTickets => 
      currentTickets.map(t => {
        if (t.tier === tier) {
          return {
            ...t,
            quantityAvailable: t.quantityAvailable + itemToRemove.quantity
          };
        }
        return t;
      })
    );
  }, [cart]);
  
  // Update cart item quantity (memoized)
  const updateCartItemQuantity = useCallback((tier: string, newQuantity: number) => {
    // Find the item to update
    const itemToUpdate = cart.find(item => item.tier === tier);
    
    if (!itemToUpdate) return;
    
    // Check if new quantity is available
    const currentDisplayedAvailable = tickets.find(t => t.tier === tier)?.quantityAvailable || 0;
    const quantityDifference = newQuantity - itemToUpdate.quantity;
    
    if (quantityDifference > currentDisplayedAvailable) {
      setBookingError(`Only ${currentDisplayedAvailable} additional tickets available for ${formatTierName(tier)}`);
      return;
    }
    
    // Update the cart with new quantity
    setCart(cart.map(item => 
      item.tier === tier 
        ? { ...item, quantity: newQuantity } 
        : item
    ));
    
    setBookingError(null);
    
    // Update the displayed available tickets
    setTickets(currentTickets => 
      currentTickets.map(t => {
        if (t.tier === tier) {
          return {
            ...t,
            quantityAvailable: t.quantityAvailable - quantityDifference
          };
        }
        return t;
      })
    );
  }, [cart, tickets, formatTierName]);
  
  // Calculate total price (memoized)
  const calculateTotal = useCallback(() => {
    return cart.reduce((total, item) => {
      return total + (parseFloat(item.priceUsd) * item.quantity);
    }, 0);
  }, [cart]);
  
  // Fetch tickets function (memoized)
  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.CATALOG);
      
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        // Try to get error message from response if possible
        let errorMessage = `API error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // If we can't parse the error as JSON, use the status text
        }
        throw new Error(errorMessage);
      }
      
      const data: CatalogResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Unknown error');
      }
      
      setTickets(data.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Handle booking submission (memoized)
  const handleBooking = useCallback(async () => {
    if (!user) return;
    if (cart.length === 0) {
      setBookingError('Your cart is empty');
      return;
    }
    
    setBookingInProgress(true);
    setBookingError(null);
    setBookingSuccess(null);
    
    try {
      const bookingData: BookingRequest = {
        userId: user.id,
        cartItems: cart.map(item => ({
          tier: item.tier,
          quantity: item.quantity
        }))
      };
      
      const response = await fetch(API_ENDPOINTS.BOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      });
      
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        // Try to get error message from response if possible
        let errorMessage = `Error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // If we can't parse the error as JSON, use the status text
        }
        throw new Error(errorMessage);
      }
      
      const result: BookingResponse = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to process booking');
      }
      
      // Booking successful
      setBookingSuccess(result.data);
      setCart([]);
      
      // Refresh tickets to update availability
      fetchTickets();
      
    } catch (err) {
      console.error('Booking error:', err);
      setBookingError(err instanceof Error ? err.message : 'Failed to process booking');
    } finally {
      setBookingInProgress(false);
    }
  }, [user, cart, fetchTickets]);

  // Reset booking states (memoized)
  const resetBooking = useCallback(() => {
    setBookingSuccess(null);
    setBookingError(null);
  }, []);

  // Initialize user and fetch ticket catalog on mount
  useEffect(() => {
    // Initialize user on the first render
    if (!user) {
      setUser(getOrCreateUser());
    }
    
    fetchTickets();
  }, [user, fetchTickets]);

  return (
    <div className="min-h-screen p-8 max-w-5xl mx-auto">
      <header className="mb-12 relative">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-4xl font-bold">Concert Ticket Booking</h1>
          <div className="flex items-center space-x-4">
            <Link
              href="/my-tickets"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Previous Orders
            </Link>
            <div className="relative">
              <CartIcon itemCount={totalCartItems} onClick={() => setIsCartOpen(true)} />
            </div>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          Browse available tickets for the upcoming concert
        </p>
      </header>

      {/* User Welcome Section */}
      {user && (
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-6 mb-8 flex items-center">
          <div className="w-16 h-16 rounded-full overflow-hidden mr-4 border-2 border-blue-300 dark:border-blue-700">
            <img 
              src={user.avatar} 
              alt={`${user.name}'s avatar`} 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-xl font-medium mb-1">Welcome, {user.name}!</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Enjoy browsing our available tickets
            </p>
          </div>
        </div>
      )}

      <main>
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Available Tickets</h2>
          
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {!loading && !error && tickets.length === 0 && (
            <p className="text-center py-8 text-gray-500">No tickets available at the moment.</p>
          )}

          {!loading && !error && tickets.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Availability</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {tickets.map((ticket) => (
                    <tr key={ticket.tier} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {formatTierName(ticket.tier)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {formatPrice(ticket.priceUsd)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={getAvailabilityColorClass(ticket.quantityAvailable)}>
                          {ticket.quantityAvailable} tickets left
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <input 
                          type="number" 
                          min="0" 
                          max={ticket.quantityAvailable} 
                          className="w-16 px-2 py-1 border rounded text-center" 
                          value={quantities[ticket.tier] || 0}
                          disabled={ticket.quantityAvailable === 0}
                          onChange={(e) => handleQuantityChange(
                            ticket.tier, 
                            Math.min(ticket.quantityAvailable, Math.max(0, parseInt(e.target.value) || 0))
                          )}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          className={`px-4 py-1 rounded text-white ${ticket.quantityAvailable > 0 ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-400 cursor-not-allowed'}`}
                          disabled={ticket.quantityAvailable === 0 || !(quantities[ticket.tier] > 0)}
                          onClick={() => addToCart(ticket.tier)}
                        >
                          Add to Cart
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Cart Modal Component */}
        <Cart
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cart={cart}
          removeFromCart={removeFromCart}
          updateCartItemQuantity={updateCartItemQuantity}
          calculateTotal={calculateTotal}
          formatPrice={formatPrice}
          formatTierName={formatTierName}
          handleBooking={handleBooking}
          bookingInProgress={bookingInProgress}
          bookingError={bookingError}
          bookingSuccess={bookingSuccess}
          resetBooking={resetBooking}
        />
      </main>
      
      <footer className="mt-20 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Ticket Booking System - Concert Tickets</p>
      </footer>
    </div>
  );
}
