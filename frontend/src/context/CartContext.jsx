import { createContext, useState, useEffect, useContext } from 'react';

export const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('cartItems');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [summary, setSummary] = useState({ subtotal: 0, tax: 0, total: 0, count: 0 });

  // Compute precisely in real time
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    
    let subtotal = 0;
    let count = 0;
    cartItems.forEach(item => {
      subtotal += item.final_price * item.quantity;
      count += item.quantity;
    });
    
    const tax = subtotal * 0.08;
    const total = subtotal + tax;
    
    setSummary({
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      total: Number(total.toFixed(2)),
      count
    });
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.product_id === product.product_id);
      if (existing) {
        return prev.map(i => i.product_id === product.product_id 
          ? { ...i, quantity: i.quantity + quantity } 
          : i);
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const updateQuantity = (product_id, quantity) => {
    if (quantity <= 0) {
      removeFromCart(product_id);
      return;
    }
    setCartItems(prev => prev.map(i => i.product_id === product_id ? { ...i, quantity } : i));
  };

  const removeFromCart = (product_id) => {
    setCartItems(prev => prev.filter(i => i.product_id !== product_id));
  };

  const clearCart = () => setCartItems([]);

  return (
    <CartContext.Provider value={{ cartItems, summary, addToCart, updateQuantity, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
