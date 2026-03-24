import { Link } from 'react-router-dom';
import { trackSelectItem, trackAddToCart } from '../../services/analyticsService';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

export default function ProductCard({ product, listName = 'General List' }) {
  const { addToCart } = useCart();
  const { wishlistItems, toggleWishlist } = useWishlist();

  const handleClick = () => {
    trackSelectItem(product, listName);
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (product.stock_quantity === 0) return;
    trackAddToCart(product, 1);
    addToCart(product, 1);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    toggleWishlist(product.product_id);
  };

  const id = product.product_id;
  const imgUrl = product.image_url || 'https://via.placeholder.com/300x400?text=No+Cover';
  const price = Number(product.final_price || 0);
  const rating = Number(product.average_rating || 0);
  const outOfStock = product.stock_quantity === 0 || product.availability_status === 'out_of_stock';
  const isWishlisted = wishlistItems.includes(id);

  return (
    <div className={`group bg-surface-container-lowest rounded-lg p-5 transition-all duration-300 hover:shadow-[0px_24px_48px_-12px_rgba(74,64,224,0.08)] flex flex-col h-full ${outOfStock ? 'opacity-75' : ''}`}>
      <div className="aspect-[3/4] rounded-md overflow-hidden bg-surface-container-low mb-6 relative">
        <Link to={`/product/${id}`} onClick={handleClick}>
          <img
            src={imgUrl}
            alt={product.title}
            className={`w-full h-full object-cover transition-transform duration-500 ${!outOfStock && 'group-hover:scale-105'}`}
          />
        </Link>
        <div className="absolute top-0 left-0 w-full p-3 flex justify-between items-start">
          <div className="flex flex-col gap-1">
            {outOfStock && (
              <div className="bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest shadow-lg">
                Out of Stock
              </div>
            )}
            {!outOfStock && product.is_featured === 1 && (
              <div className="bg-tertiary text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest shadow-lg inline-block w-max">
                Featured
              </div>
            )}
            {!outOfStock && product.is_bestseller === 1 && (
              <div className="bg-error-container text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest shadow-lg inline-block w-max">
                Bestseller
              </div>
            )}
          </div>
          <button onClick={handleWishlist} className={`p-2 rounded-full focus:outline-none transition-colors ${isWishlisted ? 'bg-red-50 text-red-500' : 'bg-white/70 text-gray-400 hover:text-red-500 hover:bg-red-50'} shadow-md`}>
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: isWishlisted ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
          </button>
        </div>
      </div>

      <div className="space-y-1 flex flex-col flex-grow relative">
        <p className="text-xs font-bold text-primary uppercase tracking-widest truncate">{product.category || 'Book'}</p>

        <Link to={`/product/${id}`} onClick={handleClick}>
          <h4 className="text-lg font-bold text-on-surface leading-tight group-hover:text-primary transition-colors cursor-pointer line-clamp-2" title={product.title}>
            {product.title}
          </h4>
        </Link>

        <p className="text-sm text-on-surface-variant mb-3 flex-grow truncate">{product.authors || 'Unknown author'}</p>

        <div className="flex items-center gap-1 text-amber-400 mb-4 pt-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <span key={star} className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {star <= Math.floor(rating) ? 'star' : 'star_outline'}
            </span>
          ))}
          <span className="text-xs text-on-surface-variant font-medium ml-1">({rating.toFixed(1)})</span>
        </div>

        <div className="flex items-center justify-between pt-2 mt-auto">
          <div className="flex flex-col">
            <span className="text-xl font-black text-on-surface">${price.toFixed(2)}</span>
          </div>

          <button 
            onClick={handleAddToCart} 
            disabled={outOfStock}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${outOfStock ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-surface-container-high text-on-surface hover:bg-primary hover:text-white'}`}
          >
             <span className="material-symbols-outlined text-[20px]">{outOfStock ? 'block' : 'add_shopping_cart'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
