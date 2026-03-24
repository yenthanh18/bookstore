import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, token, logout, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (token) {
      fetch('http://localhost:5000/api/user/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if(data.success) setOrders(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    }
  }, [token]);

  if (authLoading || (!user && loading)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface pt-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-on-surface-variant">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-20 px-4 md:px-8 max-w-4xl mx-auto min-h-screen bg-surface">
      <div className="flex justify-between items-center mb-10 border-b border-outline-variant/10 pb-6">
        <div>
          <h1 className="text-4xl font-black text-on-surface font-headline">My Profile</h1>
          <p className="text-on-surface-variant mt-2 font-medium">{user?.email}</p>
        </div>
        <button onClick={() => { logout(); navigate('/'); }} className="bg-error-container text-error px-6 py-2.5 rounded-full font-bold hover:opacity-90 transition-opacity shadow-sm">
          Logout
        </button>
      </div>

      <h2 className="text-2xl font-bold font-headline mb-6 text-on-surface">Order History</h2>
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-surface-container-low rounded-2xl w-full"></div>
          <div className="h-32 bg-surface-container-low rounded-2xl w-full"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-surface-container-lowest p-12 rounded-2xl border border-outline-variant/10 text-center shadow-sm">
          <span className="material-symbols-outlined text-4xl text-outline mb-4">inventory_2</span>
          <p className="text-on-surface-variant text-lg">You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl shadow-sm overflow-hidden p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-1">Order ID: {order.id}</p>
                  <p className="text-sm text-outline">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full ${order.status === 'Pending' ? 'bg-[#FFF3E0] text-[#E65100]' : 'bg-[#E8F5E9] text-[#2E7D32]'}`}>
                  {order.status}
                </span>
              </div>
              <div className="border-t border-b border-outline-variant/10 py-5 my-5 space-y-3">
                {order.items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm items-center">
                    <span className="text-on-surface font-medium flex items-center gap-2"><span className="w-6 h-6 bg-surface-container-low rounded-md flex items-center justify-center font-bold text-primary">{item.quantity}</span> x {item.book?.title}</span>
                    <span className="font-bold text-on-surface">${item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center text-xl font-black font-headline text-on-surface">
                <span>Total</span>
                <span className="text-primary">${order.total_amount.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
