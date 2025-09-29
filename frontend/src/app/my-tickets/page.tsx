"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MockUser, getOrCreateUser } from "../../utils/userUtils";
import { formatPrice, formatTierName, formatDate } from "../../utils/formatters";
import { API_ENDPOINTS } from "../../utils/constants";
import type { Order, OrdersResponse } from "../../types";

export default function MyTicketsPage() {
  const router = useRouter();
  const [user, setUser] = useState<MockUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user orders (memoized)
  const fetchOrders = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(API_ENDPOINTS.ORDERS(user.id));

      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }

      const data: OrdersResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch orders');
      }

      setOrders(data.data);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initialize user
  useEffect(() => {
    if (!user) {
      setUser(getOrCreateUser());
    }
  }, [user]);

  // Fetch orders when user is available
  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, fetchOrders]);

  // Get status badge color (memoized)
  const getStatusColor = useCallback((status: string) => {
    switch (status.toUpperCase()) {
      case 'PAID':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'FAILED':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }, []);

  // Memoized orders count
  const ordersCount = useMemo(() => orders.length, [orders]);

  return (
    <div className="min-h-screen p-8 max-w-5xl mx-auto">
      {/* Header with Back Button */}
      <header className="mb-12">
        <div className="flex items-center mb-4">
          <button
            onClick={() => router.push('/')}
            className="mr-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors flex items-center"
          >
            <span className="mr-2">←</span> Back
          </button>
          <h1 className="text-4xl font-bold">My previous orders</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          View your booking history and tickets
        </p>
      </header>

      {/* User Info Section */}
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
            <h2 className="text-xl font-medium mb-1">{user.name}'s Orders</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {ordersCount} {ordersCount === 1 ? 'order' : 'orders'} found
            </p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && orders.length === 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
            You haven't booked any tickets yet.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Browse Tickets
          </button>
        </div>
      )}

      {/* Orders List */}
      {!loading && !error && orders.length > 0 && (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-6 shadow-sm">
              {/* Order Header */}
              <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-200 dark:border-gray-600">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Order #{order.id.slice(0, 8)}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  <p className="text-lg font-bold mt-2">
                    {formatPrice(order.totalAmount)}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Tickets:</h4>
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2 px-4 bg-gray-50 dark:bg-gray-700 rounded">
                    <div className="flex items-center space-x-4">
                      <span className="font-medium">{formatTierName(item.ticketTier)}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        × {item.quantity}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {formatPrice(item.priceAtPurchase)} each
                      </div>
                      <div className="font-semibold">
                        {formatPrice((parseFloat(item.priceAtPurchase) * item.quantity).toString())}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <footer className="mt-20 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Ticket Booking System - Concert Tickets</p>
      </footer>
    </div>
  );
}
