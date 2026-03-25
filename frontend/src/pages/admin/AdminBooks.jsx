import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function AdminBooks() {
  const { token } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null); // null means new book
  const [formData, setFormData] = useState({
    title: '', authors: '', category: '', price: 0, stock_quantity: 10, discount_percent: 0, image_url: ''
  });

  useEffect(() => {
    fetchBooks();
  }, [token]);

  const fetchBooks = () => {
    setLoading(true);
    fetch(`${API_BASE}/books?limit=50&sort_by=popular`)
    .then(r => r.json())
    .then(d => {
      if (d.success) setBooks(d.data);
      setLoading(false);
    })
    .catch(() => setLoading(false));
  };

  const openModal = (book = null) => {
    if (book) {
      setEditingBook(book);
      setFormData({
        title: book.title, authors: book.authors, category: book.category,
        price: book.price || 0, stock_quantity: book.stock_quantity || 0,
        discount_percent: book.discount_percent || 0, image_url: book.image_url || ''
      });
    } else {
      setEditingBook(null);
      setFormData({
        title: '', authors: '', category: '', price: 0, stock_quantity: 10, discount_percent: 0, image_url: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const isNew = !editingBook;
    const url = isNew
      ? `${API_BASE}/admin/books`
      : `${API_BASE}/admin/books/${editingBook.product_id}`;
    
    try {
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          stock_quantity: Number(formData.stock_quantity),
          discount_percent: Number(formData.discount_percent)
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchBooks(); // Refresh list to get new IDs/updates
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && books.length === 0) return <div>Loading inventory...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-headline text-gray-900">Inventory Management</h1>
        <button onClick={() => openModal()} className="bg-primary text-white rounded-lg px-4 py-2 hover:bg-primary-dim shadow-sm flex items-center gap-2 font-medium">
          <span className="material-symbols-outlined text-sm">add</span> Add New Book
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50">
              <tr className="border-b border-gray-100 text-gray-500 text-sm">
                <th className="py-4 px-6 font-medium">Book</th>
                <th className="py-4 px-6 font-medium">Price</th>
                <th className="py-4 px-6 font-medium">Stock</th>
                <th className="py-4 px-6 font-medium">Status</th>
                <th className="py-4 px-6 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {books.map(book => (
                <tr key={book.product_id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                  <td className="py-3 px-6 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-14 bg-gray-100 rounded overflow-hidden">
                        <img src={book.image_url} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 line-clamp-1 truncate max-w-[250px]">{book.title}</p>
                        <p className="text-xs text-gray-500">{book.category || 'Uncategorized'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-6 text-sm font-bold text-gray-900">${book.final_price?.toFixed(2)}</td>
                  <td className="py-3 px-6 text-sm">
                    <span className={`font-bold ${book.stock_quantity === 0 ? 'text-red-500' : 'text-gray-900'}`}>{book.stock_quantity}</span>
                  </td>
                  <td className="py-3 px-6 text-sm">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${book.stock_quantity === 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                      {book.stock_quantity === 0 ? 'Out of Stock' : 'In Stock'}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-sm text-right">
                    <button onClick={() => openModal(book)} className="text-primary hover:text-indigo-800 font-medium px-3 py-1 bg-primary/5 rounded-md">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">{editingBook ? 'Edit Book' : 'Add New Book'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="material-symbols-outlined text-gray-400">close</button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="book-form" onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border rounded px-3 py-2 outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Authors</label>
                  <input value={formData.authors} onChange={e => setFormData({...formData, authors: e.target.value})} className="w-full border rounded px-3 py-2 outline-none focus:border-primary" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Base Price ($) *</label>
                    <input type="number" step="0.01" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full border rounded px-3 py-2 outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                    <input type="number" min="0" max="100" value={formData.discount_percent} onChange={e => setFormData({...formData, discount_percent: e.target.value})} className="w-full border rounded px-3 py-2 outline-none focus:border-primary" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                    <input type="number" required value={formData.stock_quantity} onChange={e => setFormData({...formData, stock_quantity: e.target.value})} className="w-full border rounded px-3 py-2 outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <input value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border rounded px-3 py-2 outline-none focus:border-primary" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} className="w-full border rounded px-3 py-2 outline-none focus:border-primary" placeholder="https://..." />
                </div>
              </form>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
              <button form="book-form" type="submit" className="px-4 py-2 font-medium text-white bg-primary hover:bg-primary-dim rounded-lg transition-colors shadow-sm text-center">Save Book</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
