"use client";

import { useEffect, useState } from "react";
import { MockUser, getOrCreateUser } from "../utils/userUtils";

// Define types for the catalog data
type TicketTier = {
  tier: string;
  priceUsd: string;
  quantityAvailable: number;
};

type CatalogResponse = {
  success: boolean;
  data: TicketTier[];
  error?: string;
};

export default function Home() {
  const [tickets, setTickets] = useState<TicketTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<MockUser | null>(null);

  // Format price as USD currency
  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(price));
  };

  // Format tier name for display (e.g., "FRONT_ROW" -> "Front Row")
  const formatTierName = (tier: string) => {
    return tier
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Get color class based on availability
  const getAvailabilityColorClass = (available: number) => {
    if (available === 0) return 'text-red-500';
    if (available < 10) return 'text-amber-500';
    return 'text-green-600';
  };

  // Initialize user and fetch ticket catalog on mount
  useEffect(() => {
    // Initialize user on the first render
    if (!user) {
      setUser(getOrCreateUser());
    }
    
    const fetchTickets = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3000/api/catalog');
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
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
    };

    fetchTickets();
  }, [user]);

  return (
    <div className="min-h-screen p-8 max-w-5xl mx-auto">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">Concert Ticket Booking</h1>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
      
      <footer className="mt-20 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Ticket Booking System - Concert Tickets</p>
      </footer>
    </div>
  );
}
