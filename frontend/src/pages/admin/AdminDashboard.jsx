import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(d => { if (d.success) setStats(d.data); });
  }, [token]);

  if (!stats) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center">
          <p className="text-gray-500 font-medium">Total Revenue</p>
          <p className="text-4xl font-bold text-indigo-600 mt-2">${stats.total_revenue}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center">
          <p className="text-gray-500 font-medium">Total Orders</p>
          <p className="text-4xl font-bold text-emerald-600 mt-2">{stats.total_orders}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center">
          <p className="text-gray-500 font-medium">Total Users</p>
          <p className="text-4xl font-bold text-amber-500 mt-2">{stats.total_users}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-gray-500 text-sm">
                <th className="pb-3 px-4 font-medium">Order ID</th>
                <th className="pb-3 px-4 font-medium">Customer</th>
                <th className="pb-3 px-4 font-medium">Status</th>
                <th className="pb-3 px-4 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_orders.map(order => (
                <tr key={order.id} className="border-b hover:bg-gray-50 transition">
                  <td className="py-4 px-4 text-sm font-medium text-gray-900">{order.id}</td>
                  <td className="py-4 px-4 text-sm text-gray-600">{order.customer_name}</td>
                  <td className="py-4 px-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm font-bold text-gray-900">${order.total_amount.toFixed(2)}</td>
                </tr>
              ))}
              {stats.recent_orders.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-gray-500">No orders yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
