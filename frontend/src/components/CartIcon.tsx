"use client";

interface CartIconProps {
  itemCount: number;
  onClick: () => void;
}

const CartIcon = ({ itemCount, onClick }: CartIconProps) => {
  return (
    <button 
      onClick={onClick}
      className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors"
      aria-label="Shopping cart"
    >
      {/* Cart Icon SVG */}
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <circle cx="8" cy="21" r="1"></circle>
        <circle cx="19" cy="21" r="1"></circle>
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
      </svg>
      
      {/* Item count badge */}
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
};

export default CartIcon;
