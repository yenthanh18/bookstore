import { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';

export const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const { user, token } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  // Sync wishlist based on auth status
  useEffect(() => {
    if (user && token) {
      setLoading(true);
      fetch(`${API_BASE}/wishlist`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setWishlistItems(data.data.map(w => w.product_id));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    } else {
      // User logged out, fallback to guest wishlist
      const saved = localStorage.getItem('wishlistItems');
      setWishlistItems(saved ? JSON.parse(saved) : []);
    }
  }, [user, token]);

  const toggleWishlist = async (product_id) => {
    if (user && token) {
      try {
        const res = await fetch(`${API_BASE}/wishlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ product_id })
        });
        const data = await res.json();
        if (data.success) {
          setWishlistItems(prev => 
            data.data.status === 'added' ? [...prev, product_id] : prev.filter(id => id !== product_id)
          );
        }
      } catch (err) {
        console.error("Wishlist error", err);
      }
    } else {
      // Guest local storage logic
      setWishlistItems(prev => {
        const newArr = prev.includes(product_id) ? prev.filter(id => id !== product_id) : [...prev, product_id];
        localStorage.setItem('wishlistItems', JSON.stringify(newArr));
        return newArr;
      });
    }
  };

  return (
    <WishlistContext.Provider value={{ wishlistItems, toggleWishlist, loading }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
