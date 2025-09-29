"use client";

import { useEffect } from "react";
import { CART_AUTO_CLOSE_DELAY } from "../utils/constants";
import type { CartItem, BookingSuccess } from "../types";

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  removeFromCart: (tier: string) => void;
  updateCartItemQuantity: (tier: string, newQuantity: number) => void;
  calculateTotal: () => number;
  formatPrice: (price: string) => string;
  formatTierName: (tier: string) => string;
  handleBooking: () => Promise<void>;
  bookingInProgress: boolean;
  bookingError: string | null;
  bookingSuccess: BookingSuccess | null;
  resetBooking: () => void;
}

const Cart = ({
  isOpen,
  onClose,
  cart,
  removeFromCart,
  updateCartItemQuantity,
  calculateTotal,
  formatPrice,
  formatTierName,
  handleBooking,
  bookingInProgress,
  bookingError,
  bookingSuccess,
  resetBooking
}: CartProps) => {
  // Auto close modal after successful booking
  useEffect(() => {
    if (bookingSuccess) {
      const timer = setTimeout(() => {
        resetBooking();
        onClose();
      }, CART_AUTO_CLOSE_DELAY);
      
      return () => clearTimeout(timer);
    }
  }, [bookingSuccess, resetBooking, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Your Cart</h2>
          <button
            className="text-gray-500 hover:text-gray-700 text-2xl"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">Your cart is empty. Add tickets to get started!</p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ticket</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Subtotal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {cart.map((item) => (
                    <tr key={item.tier} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {formatTierName(item.tier)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2">
                          <button 
                            className="w-6 h-6 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
                            onClick={() => item.quantity > 1 && updateCartItemQuantity(item.tier, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            -
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button 
                            className="w-6 h-6 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
                            onClick={() => updateCartItemQuantity(item.tier, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {formatPrice(item.priceUsd)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {formatPrice((parseFloat(item.priceUsd) * item.quantity).toString())}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          className="text-red-600 hover:text-red-800 font-medium"
                          onClick={() => removeFromCart(item.tier)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 dark:bg-gray-700">
                    <td colSpan={3} className="px-6 py-4 text-right font-medium">
                      Total:
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-lg font-bold">
                      {formatPrice(calculateTotal().toString())}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-end mt-4">
              <button
                className={`px-6 py-2 rounded-lg text-white font-medium ${
                  bookingInProgress ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                }`}
                disabled={bookingInProgress || cart.length === 0}
                onClick={handleBooking}
              >
                {bookingInProgress ? 'Processing...' : 'Complete Booking'}
              </button>
            </div>
          </div>
        )}
        
        {/* Booking Error Display */}
        {bookingError && (
          <div className="mt-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Booking Error: </strong>
            <span className="block sm:inline">{bookingError}</span>
          </div>
        )}
        
        {/* Booking Success Display */}
        {bookingSuccess && (
          <div className="mt-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold mb-2 block">Booking Successful!</strong>
            <div className="mb-2">
              <p><strong>Order ID:</strong> {bookingSuccess.orderId}</p>
              <p><strong>Total Amount:</strong> {formatPrice(bookingSuccess.totalAmount)}</p>
              <p><strong>Status:</strong> {bookingSuccess.status}</p>
            </div>
            
            <h4 className="font-semibold mb-1">Items:</h4>
            <ul className="list-disc pl-5 mb-2">
              {bookingSuccess.items.map((item, index) => (
                <li key={index}>
                  {formatTierName(item.tier)} - {item.quantity} ticket(s) at {formatPrice(item.priceAtPurchase)} each
                </li>
              ))}
            </ul>
            
            <p className="text-sm mt-4">This window will automatically close in a few seconds...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
