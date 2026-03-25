import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { trackBeginCheckout, trackPurchaseDemo } from '../services/analyticsService';

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, summary, clearCart, updateQuantity } = useCart();
  const { token, user } = useAuth();
  const API_BASE = import.meta.env.VITE_API_BASE_URL;
  
  const [formData, setFormData] = useState({
    email: user?.email || '', customer_name: user?.name || '', phone: '', address: '', payment_method: 'Cash on Delivery'
  });
  
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    if (cartItems.length > 0) {
      trackBeginCheckout(cartItems, summary.total);
    } else if (!success) {
      navigate('/cart');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        items: cartItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.final_price
        }))
      };

      const res = await fetch(`${API_BASE}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Checkout failed');
      }

      const tid = data.data.order_id;
      setTransactionId(tid);
      setSuccess(true);
      trackPurchaseDemo(cartItems, summary.total, tid);
      clearCart();
    } catch (err) {
      setError(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (success) {
      return (
        <div className="min-h-screen pt-32 p-8 md:p-16 flex justify-center">
            <div className="bg-surface-container-lowest max-w-lg w-full p-12 rounded-3xl text-center shadow-[0px_24px_48px_-12px_rgba(74,64,224,0.15)] border border-outline-variant/10 flex flex-col items-center">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-4xl">check_circle</span>
                </div>
                <h1 className="text-3xl font-black font-headline text-on-surface mb-2">Order Confirmed</h1>
                <p className="text-on-surface-variant mb-8 text-lg">Thank you for your purchase. Your books are on the way.</p>
                <div className="bg-surface-container-low w-full p-4 rounded-xl mb-8 flex justify-between items-center text-sm font-medium">
                   <span className="text-on-surface-variant">Order ID</span>
                   <span className="font-mono">{transactionId}</span>
                </div>
                <Link to="/shop" className="w-full bg-gradient-to-r from-primary to-primary-container text-white py-4 rounded-full font-bold shadow-lg hover:scale-105 active:scale-95 transition-all outline-none">
                    Continue Shopping
                </Link>
            </div>
        </div>
      );
  }

  return (
    <div className="pt-24 pb-20 px-4 md:px-8 max-w-screen-xl mx-auto min-h-screen">
      {error && <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg text-center font-bold">{error}</div>}
      <div className="flex flex-col lg:flex-row gap-16">
        {/* Left: Checkout Form */}
        <div className="flex-grow">
          <h1 className="text-3xl font-black font-headline mb-8 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-full">lock</span>
            Secure Checkout
          </h1>
          
          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-12">
            <section className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-outline-variant/10">
              <h2 className="text-xl font-bold font-headline mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-sm">1</span>
                Contact & Shipping
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-on-surface mb-2">Full Name</label>
                  <input disabled={processing} required type="text" className="w-full bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary" 
                    value={formData.customer_name} onChange={e => setFormData({...formData, customer_name: e.target.value})} />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-semibold text-on-surface mb-2">Email</label>
                  <input disabled={processing} required type="email" className="w-full bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary" 
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-semibold text-on-surface mb-2">Phone</label>
                  <input disabled={processing} required type="tel" className="w-full bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary" 
                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-on-surface mb-2">Full Delivery Address</label>
                  <input disabled={processing} required type="text" placeholder="Street, City, Country, ZIP" className="w-full bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary" 
                    value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
              </div>
            </section>

            <section className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-outline-variant/10">
              <h2 className="text-xl font-bold font-headline mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-sm">2</span>
                Payment Method
              </h2>
              <div className="bg-green-50 text-green-800 p-4 rounded-xl border border-green-200 flex items-center gap-3">
                 <span className="material-symbols-outlined">local_shipping</span>
                 <p className="font-semibold">Cash on Delivery (COD) is the currently selected payment method.</p>
              </div>
            </section>
          </form>
        </div>

        {/* Right: Order Summary */}
        <div className="w-full lg:w-[400px] flex-shrink-0">
          <div className="bg-surface-container-high p-8 rounded-2xl sticky top-32 border border-outline-variant/10">
             <h3 className="text-xl font-bold font-headline mb-6">Order Summary ({summary.count})</h3>
             
             {/* Mini items list with live quantity update capability in checkout */}
             <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {cartItems.map(item => (
                   <div key={item.product_id} className="flex flex-col gap-1 text-sm border-b pb-2">
                      <div className="flex justify-between items-start font-medium">
                        <span className="truncate pr-2">{item.title}</span>
                        <span>${((item.final_price) * item.quantity).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <div className="flex items-center gap-2 bg-surface-container rounded-lg px-2 py-1">
                            <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)} className="text-primary hover:text-primary-dim"><span className="material-symbols-outlined text-[16px]">remove</span></button>
                            <span className="font-bold w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)} className="text-primary hover:text-primary-dim"><span className="material-symbols-outlined text-[16px]">add</span></button>
                        </div>
                      </div>
                   </div>
                ))}
             </div>

             <div className="flex justify-between items-center mb-4 text-sm">
                <span className="text-on-surface-variant font-medium">Subtotal</span>
                <span className="font-bold">${summary.subtotal.toFixed(2)}</span>
             </div>
             <div className="flex justify-between items-center mb-4 text-sm">
                <span className="text-on-surface-variant font-medium">Taxes (8%)</span>
                <span className="font-bold">${summary.tax.toFixed(2)}</span>
             </div>
             <div className="flex justify-between items-center mb-6 pb-6 border-b border-outline-variant/20 text-sm">
                <span className="text-on-surface-variant font-medium">Shipping</span>
                <span className="font-bold text-green-600">Free</span>
             </div>
             <div className="flex justify-between items-center mb-8">
                <span className="text-lg font-bold">Total</span>
                <span className="text-3xl font-black text-on-surface">${summary.total.toFixed(2)}</span>
             </div>
             <button disabled={processing || cartItems.length === 0} type="submit" form="checkout-form" className="w-full py-4 px-8 rounded-xl bg-on-surface text-surface-container-lowest font-bold shadow-lg hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2">
               {processing ? <span className="material-symbols-outlined animate-spin">sync</span> : 'Place Order'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
