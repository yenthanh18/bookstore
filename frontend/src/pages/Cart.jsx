import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { trackViewCart } from '../services/analyticsService';
import { useEffect } from 'react';

export default function Cart() {
  const navigate = useNavigate();
  const { cartItems, summary, updateQuantity, removeFromCart } = useCart();

  useEffect(() => {
    if (cartItems.length > 0) {
      trackViewCart(cartItems, summary.total);
    }
  }, [cartItems.length]); // Only track on mount or major change

  const handleUpdate = (productId, currentQty, delta) => {
    const newQty = currentQty + delta;
    updateQuantity(productId, newQty);
  };

  const handleRemove = (productId) => {
    removeFromCart(productId);
  };

  return (
    <div className="pt-24 pb-20 px-4 md:px-8 max-w-screen-2xl mx-auto min-h-screen">
      <section className="mb-20">
        <div className="flex flex-col md:flex-row gap-12">
          {/* Left: Cart Items */}
          <div className="flex-grow space-y-8">
            <div className="flex items-end justify-between">
              <h1 className="text-4xl md:text-5xl font-black font-headline tracking-tighter text-on-surface">Your Library Cart</h1>
              <p className="text-on-surface-variant font-medium">{summary.count} Items Selected</p>
            </div>
            
            <div className="space-y-4 transition-opacity duration-300">
              {cartItems.length === 0 ? (
                <div className="bg-surface-container-lowest p-12 rounded-xl text-center border border-outline-variant/10 shadow-sm flex flex-col items-center">
                  <span className="material-symbols-outlined text-6xl text-outline mb-4">shopping_cart</span>
                  <h2 className="text-2xl font-bold font-headline mb-2">Your cart is empty</h2>
                  <p className="text-on-surface-variant mb-6">Explore our curated selection to start building your library.</p>
                  <Link to="/shop" className="bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-primary-dim transition-colors">Start Browsing</Link>
                </div>
              ) : (
                cartItems.map((item) => {
                  const id = item.product_id;
                  const imgUrl = item.image_url || 'https://via.placeholder.com/150x200';
                  
                  return (
                    <div key={id} className="bg-surface-container-lowest p-6 rounded-lg flex flex-col sm:flex-row items-center gap-6 transition-all hover:shadow-[0px_24px_48px_-12px_rgba(74,64,224,0.08)] border border-outline-variant/5">
                      <div className="w-24 h-36 rounded-md overflow-hidden flex-shrink-0 bg-surface-container">
                        <Link to={`/product/${id}`}>
                           <img src={imgUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </Link>
                      </div>
                      <div className="flex-grow w-full">
                        <div className="flex justify-between items-start">
                          <div>
                            <Link to={`/product/${id}`}>
                              <h3 className="text-xl font-bold font-headline text-on-surface hover:text-primary transition-colors">{item.title}</h3>
                            </Link>
                            <p className="text-on-surface-variant text-sm">by {item.authors || 'Author'}</p>
                          </div>
                          <button onClick={() => handleRemove(id)} className="text-outline-variant hover:text-error transition-colors p-2">
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-4 bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant/10">
                            <button onClick={() => handleUpdate(id, item.quantity, -1)} className="text-primary hover:bg-white rounded-full p-1 transition-all"><span className="material-symbols-outlined text-sm">remove</span></button>
                            <span className="font-bold text-sm min-w-[1.5rem] text-center">{item.quantity}</span>
                            <button onClick={() => handleUpdate(id, item.quantity, 1)} className="text-primary hover:bg-white rounded-full p-1 transition-all"><span className="material-symbols-outlined text-sm">add</span></button>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-on-surface-variant uppercase tracking-widest font-bold">Subtotal</p>
                            <p className="text-xl font-black text-primary">${(item.final_price * item.quantity).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Summary Card */}
          {cartItems.length > 0 && (
            <div className="w-full md:w-[400px] flex-shrink-0">
              <div className="bg-surface-container-low p-8 rounded-lg sticky top-32 border border-outline-variant/10">
                <h2 className="text-2xl font-black font-headline mb-8">Order Summary</h2>
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Subtotal</span>
                    <span className="font-bold text-on-surface">${summary.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Estimated Shipping</span>
                    <span className="font-bold text-green-600">Free</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Taxes (8%)</span>
                    <span className="font-bold text-on-surface">${summary.tax.toFixed(2)}</span>
                  </div>
                  <div className="pt-4 border-t border-outline-variant/20 flex justify-between items-end">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-3xl font-black text-primary">${summary.total.toFixed(2)}</span>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/checkout')}
                  className="w-full py-4 px-8 rounded-full bg-gradient-to-r from-primary to-primary-container text-white font-bold text-lg shadow-[0px_16px_32px_-8px_rgba(74,64,224,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  Proceed to Checkout
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
                <p className="mt-6 text-center text-xs text-on-surface-variant">Secure SSL Encrypted Checkout</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
