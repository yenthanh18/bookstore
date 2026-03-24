import { useAuth } from '../../context/AuthContext';
import { Navigate, Outlet, Link } from 'react-router-dom';

export default function AdminLayout() {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;
  
  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl">
        <div className="p-6 text-xl font-bold tracking-wider border-b border-slate-700">
          SmartBook Admin
        </div>
        <nav className="flex-1 py-6 px-4 space-y-2">
          <Link to="/admin" className="block px-4 py-3 rounded-lg hover:bg-slate-800 transition">Dashboard</Link>
          <Link to="/admin/orders" className="block px-4 py-3 rounded-lg hover:bg-slate-800 transition">Orders</Link>
          <Link to="/admin/books" className="block px-4 py-3 rounded-lg hover:bg-slate-800 transition">Inventory</Link>
          <Link to="/" className="block px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-400 mt-10 transition">← Back to Store</Link>
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto p-10">
        <Outlet />
      </main>
    </div>
  );
}
