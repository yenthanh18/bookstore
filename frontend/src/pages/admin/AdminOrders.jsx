import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function AdminOrders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const fetchOrders = () => {
    setLoading(true);
    fetch('http://localhost:5000/api/admin/orders?limit=50', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(d => {
      if (d.success) setOrders(d.data);
      setLoading(false);
    })
    .catch(() => setLoading(false));
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading orders...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-headline text-gray-900">Manage Orders</h1>
        <button onClick={fetchOrders} className="bg-white border rounded px-4 py-2 hover:bg-gray-50 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">refresh</span> Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50">
              <tr className="border-b border-gray-100 text-gray-500 text-sm">
                <th className="py-4 px-6 font-medium">Order ID</th>
                <th className="py-4 px-6 font-medium">Date</th>
                <th className="py-4 px-6 font-medium">Customer</th>
                <th className="py-4 px-6 font-medium">Total</th>
                <th className="py-4 px-6 font-medium">Status</th>
                <th className="py-4 px-6 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                  <td className="py-4 px-6 text-sm font-bold text-gray-900">{order.id}</td>
                  <td className="py-4 px-6 text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="py-4 px-6 text-sm text-gray-700">
                    <p className="font-medium">{order.customer_name}</p>
                    <p className="text-xs text-gray-400">{order.email}</p>
                  </td>
                  <td className="py-4 px-6 text-sm font-bold text-primary">${order.total_amount.toFixed(2)}</td>
                  <td className="py-4 px-6 text-sm">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${order.status === 'Pending' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-right">
                    <div className="flex items-center justify-end gap-2">
                        <select 
                          value={order.status}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          className="text-sm bg-white border border-gray-200 rounded px-2 py-1 outline-none focus:border-primary"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                        <button 
                          onClick={() => setSelectedOrder(order)}
                          className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1 rounded text-sm font-semibold transition"
                        >
                          View
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-gray-500">No orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-bold font-headline">Order Details</h2>
                <p className="text-gray-500 text-sm">{selectedOrder.id}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Customer Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium text-gray-500 w-20 inline-block">Name:</span> <span className="font-bold text-gray-900">{selectedOrder.customer_name}</span></p>
                    <p><span className="font-medium text-gray-500 w-20 inline-block">Email:</span> <span className="font-bold text-gray-900">{selectedOrder.email}</span></p>
                    <p><span className="font-medium text-gray-500 w-20 inline-block">Phone:</span> <span className="font-bold text-gray-900">{selectedOrder.phone}</span></p>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Order Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium text-gray-500 w-24 inline-block">Date:</span> <span className="font-bold text-gray-900">{new Date(selectedOrder.created_at).toLocaleString()}</span></p>
                    <p><span className="font-medium text-gray-500 w-24 inline-block">Status:</span> 
                      <span className={`px-2 py-0.5 rounded text-xs ml-1 font-bold ${selectedOrder.status === 'Pending' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>{selectedOrder.status}</span>
                    </p>
                    <p><span className="font-medium text-gray-500 w-24 inline-block">Payment:</span> <span className="font-bold text-gray-900">{selectedOrder.payment_method}</span></p>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Shipping Address</h3>
                <p className="text-sm font-medium text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-100 whitespace-pre-wrap">{selectedOrder.address}</p>
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Ordered Items</h3>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-3 px-4 font-medium text-gray-500">Item</th>
                        <th className="py-3 px-4 font-medium text-gray-500 text-center">Qty</th>
                        <th className="py-3 px-4 font-medium text-gray-500 text-right">Price</th>
                        <th className="py-3 px-4 font-medium text-gray-500 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedOrder.items.map(item => (
                        <tr key={item.id}>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {item.book?.image_url && <img src={item.book.image_url} alt="" className="w-8 h-12 object-cover rounded shadow-sm" />}
                              <span className="font-bold text-gray-800">{item.book?.title || 'Unknown Book'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center font-medium">{item.quantity}</td>
                          <td className="py-3 px-4 text-right">${item.unit_price.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-bold">${item.subtotal.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-bold">${selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tax</span>
                    <span className="font-bold">${selectedOrder.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg pt-2 border-t border-gray-100">
                    <span className="font-bold">Total</span>
                    <span className="font-black text-primary">${selectedOrder.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
