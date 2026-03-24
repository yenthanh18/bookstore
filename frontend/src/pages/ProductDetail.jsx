import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { catalogService } from '../services/catalogService';
/*import { cartService } from '../services/cartService';*/

import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { trackViewItem, trackAddToCart, trackClickRecommendation } from '../services/analyticsService';
import ProductCard from '../components/shared/ProductCard';
import { unwrapObject, unwrapList } from '../services/apiClient';
import { useSEO } from '../hooks/useSEO';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [sameAuthorBooks, setSameAuthorBooks] = useState([]);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const { addToCart } = useCart();

  const { wishlistItems, toggleWishlist } = useWishlist();

  useSEO({
    title: product ? product.title : 'Loading Book...',
    description: product ? product.description || 'Explore this brilliant book on SmartBook.' : '',
    image: product ? product.image_url : ''
  });

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      setRecommendations([]);
      setSameAuthorBooks([]);
      window.scrollTo(0, 0);
      setQty(1);

      try {
        const res = await catalogService.getProductById(id);
        const resolvedProduct = unwrapObject(res);
        setProduct(resolvedProduct);
        trackViewItem(resolvedProduct);

        if (resolvedProduct?.title) {
          catalogService
            .getRecommendations(resolvedProduct.title)
            .then((recRes) => {
              const recs = unwrapList(recRes).filter(
                (item) => String(item.product_id) !== String(resolvedProduct.product_id)
              );
              setRecommendations(recs);
            })
            .catch((err) => console.error('Recs failed', err));

          catalogService
            .getAuthorBooks(resolvedProduct.title)
            .then((authorRes) => {
              const books = unwrapList(authorRes).filter(
                (item) => String(item.product_id) !== String(resolvedProduct.product_id)
              );
              setSameAuthorBooks(books);
            })
            .catch((err) => console.error('Author recs failed', err));
        }
      } catch (_err) {
        setError('Could not find this intelligent piece of literature.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  /*const handleAddToCart = async () => {
    if (!product || product.stock_quantity <= 0) return;
    setAddingToCart(true);
    trackAddToCart(product, qty);
    try {
      await cartService.addToCart(product.product_id, qty);
      alert(`Added ${qty} of ${product.title} to your cart.`);
    } catch (_err) {
      alert('Failed to add to cart. Please check your connection.');
    } finally {
      setAddingToCart(false);
    }
  };*/

  const handleAddToCart = async () => {
  if (!product || product.stock_quantity <= 0) return;
  setAddingToCart(true);
  trackAddToCart(product, qty);

  try {
    addToCart(product, qty);
    alert(`Added ${qty} of ${product.title} to your cart.`);
      } catch (_err) {
    alert('Failed to add to cart.');
      } finally {
    setAddingToCart(false);
    }
  };

  const handleWishlist = () => {
    if (product) toggleWishlist(product.product_id);
  };

  const handleRecClick = (recProduct, listName) => {
    trackClickRecommendation(recProduct, listName);
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen pt-32 px-4 text-center flex flex-col gap-4 items-center">
        <span className="material-symbols-outlined text-6xl text-outline">menu_book</span>
        <h1 className="text-3xl font-bold font-headline">Book Not Found</h1>
        <p className="text-on-surface-variant max-w-sm">{error}</p>
        <Link to="/shop" className="bg-primary text-white px-6 py-3 rounded-full font-bold mt-4">
          Browse Shop
        </Link>
      </div>
    );
  }

  const price = Number(product.final_price || 0);
  const imgUrl = product.image_url || 'https://via.placeholder.com/400x600?text=No+Cover';
  const reviewCount = Number(product.ratings_count || product.reviews || 0);
  const originalPrice = Number(product.price || 0);
  const hasDiscount = originalPrice > price;
  const isOutOfStock = product.stock_quantity <= 0;
  const isWishlisted = wishlistItems.includes(product.product_id);

  return (
    <div className="pt-24 px-4 md:px-8 max-w-screen-xl mx-auto min-h-screen pb-20">
      <nav className="flex gap-2 text-sm text-on-surface-variant mb-8 font-medium">
        <Link to="/shop" className="hover:text-primary transition-colors">Shop</Link>
        <span className="material-symbols-outlined text-xs leading-none self-center">chevron_right</span>
        <span className="hover:text-primary transition-colors cursor-pointer">{product.category || 'Books'}</span>
        <span className="material-symbols-outlined text-xs leading-none self-center">chevron_right</span>
        <span className="text-on-surface line-clamp-1">{product.title}</span>
      </nav>

      {/* Two-Column Top Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        {/* LEFT: Large Cover */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-surface-container-lowest rounded-2xl p-0 overflow-hidden shadow-[0px_24px_48px_-12px_rgba(74,64,224,0.08)] flex items-center justify-center aspect-[3/4] sticky top-32 border border-outline-variant/10">
            <img src={imgUrl} alt={product.title} className="w-full h-full object-cover drop-shadow-2xl hover:scale-105 transition-transform duration-500" />
          </div>
        </div>

        {/* RIGHT: Product Details & Actions */}
        <div className="lg:col-span-7 flex flex-col pt-4">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {product.is_bestseller ? (
              <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[11px] font-black tracking-widest uppercase shadow-sm">
                Bestseller
              </span>
            ) : null}
            {product.is_featured ? (
              <span className="bg-primary text-white px-3 py-1 rounded-full text-[11px] font-black tracking-widest uppercase shadow-sm">
                AI Pick
              </span>
            ) : null}
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-on-surface leading-[1.15] tracking-tight mb-3 font-headline">
            {product.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <p className="text-xl text-on-surface-variant font-medium">
              by <span className="text-primary font-bold">{product.authors || 'Unknown'}</span>
            </p>
            <div className="w-1.5 h-1.5 rounded-full bg-outline-variant"></div>
            <div className="flex items-center gap-1.5">
              <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map((i) => {
                  const rating = Number(product.average_rating || 0);
                  return (
                    <span key={i} className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {i <= Math.floor(rating) ? 'star' : i - rating <= 0.5 && i - rating > 0 ? 'star_half' : 'star'}
                    </span>
                  );
                })}
              </div>
              <span className="text-sm font-bold text-on-surface hover:text-primary transition-colors cursor-pointer mr-1">
                {product.average_rating ? Number(product.average_rating).toFixed(1) : "0.0"}
              </span>
              <span className="text-sm font-bold text-on-surface-variant hover:text-primary transition-colors cursor-pointer underline-offset-4 hover:underline">({reviewCount} Reviews)</span>
            </div>
          </div>

          <div className="bg-surface-container-low rounded-2xl p-6 mb-8 border border-outline-variant/20 shadow-sm">
            <div className="flex items-end flex-wrap gap-4 mb-6 pb-6 border-b border-outline-variant/20">
              <span className="text-5xl font-black text-on-surface tracking-tight">${price.toFixed(2)}</span>
              {hasDiscount && (
                <div className="flex items-center gap-3 pb-1">
                   <span className="text-xl text-on-surface-variant line-through font-medium">${originalPrice.toFixed(2)}</span>
                   {product.discount_percent && (
                      <span className="text-sm font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                        -{Math.round(Number(product.discount_percent))}%
                      </span>
                   )}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full shadow-inner ${isOutOfStock ? 'bg-red-500' : 'bg-green-500'}`}></span>
                  <span className="font-bold text-on-surface text-lg">
                    {isOutOfStock ? 'Out of Stock' : 'In Stock'}
                  </span>
                </div>
                {!isOutOfStock && product.stock_quantity < 10 && (
                  <span className="text-orange-600 font-bold text-sm bg-orange-50 px-3 py-1 rounded-full">Only {product.stock_quantity} left</span>
                )}
              </div>

              <div className="flex flex-wrap md:flex-nowrap items-center gap-4">
                <div className="flex items-center bg-white rounded-xl border border-outline-variant/30 px-2 py-1.5 h-[56px]">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-full flex items-center justify-center text-on-surface hover:text-primary hover:bg-surface-container transition-colors rounded-lg">
                    <span className="material-symbols-outlined text-xl">remove</span>
                  </button>
                  <span className="w-12 text-center font-bold text-xl select-none">{qty}</span>
                  <button onClick={() => setQty(Math.min(isOutOfStock ? 0 : 10, qty + 1))} className="w-10 h-full flex items-center justify-center text-on-surface hover:text-primary hover:bg-surface-container transition-colors rounded-lg">
                    <span className="material-symbols-outlined text-xl">add</span>
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart || isOutOfStock}
                  className="flex-grow h-[56px] rounded-xl bg-primary text-white font-bold text-lg shadow-lg hover:bg-primary-dim transition-all active:scale-95 disabled:opacity-50 disabled:hover:bg-primary disabled:active:scale-100 flex justify-center items-center gap-2"
                >
                  {addingToCart ? <span className="material-symbols-outlined animate-spin">sync</span> : 'Add to Cart'}
                </button>

                <button
                  onClick={handleWishlist}
                  className={`flex-shrink-0 h-[56px] w-[56px] rounded-xl flex items-center justify-center border-2 transition-all ${
                    isWishlisted 
                      ? 'border-red-500 bg-red-50 text-red-500' 
                      : 'border-outline-variant/30 bg-white text-gray-500 hover:border-red-500 hover:text-red-500'
                  }`}
                  aria-label="Toggle Wishlist"
                >
                  <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: isWishlisted ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                </button>
              </div>
            </div>
          </div>
          


        </div>
      </div>

      {/* Description Meta Section */}
      <div className="mt-24 bg-white rounded-3xl overflow-hidden shadow-sm border border-outline-variant/20">
        <div className="flex border-b border-outline-variant/10">
          <div className="px-8 py-6 text-primary font-bold border-b-2 border-primary text-lg">Book Overview</div>
        </div>
        <div className="p-8 md:p-12">
          <p className="text-slate-600 leading-relaxed text-lg max-w-4xl whitespace-pre-wrap">
            {product.description ||
              'No summary provided for this title. This intelligent work explores boundaries that challenge our conventional wisdom.'}
          </p>
        </div>
      </div>

      {/* Recommendation Sections */}
      <div className="mt-24 space-y-24">
        {recommendations.length > 0 && (
          <section>
            <div className="flex justify-between items-end mb-8 border-b border-outline-variant/10 pb-4">
              <h2 className="font-headline text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight">
                You Might Also Like
              </h2>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-8 snap-x no-scrollbar">
              {recommendations.map((rec) => (
                <div key={rec.product_id} className="min-w-[280px] snap-start" onClick={() => handleRecClick(rec, 'product_page_similar')}>
                  <ProductCard product={rec} listName="Similar Recommendations" />
                </div>
              ))}
            </div>
          </section>
        )}

        {sameAuthorBooks.length > 0 && (
          <section>
             <div className="flex justify-between items-end mb-8 border-b border-outline-variant/10 pb-4">
              <h2 className="font-headline text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight">
                More from {product.authors?.split(',')[0]}
              </h2>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-8 snap-x no-scrollbar">
              {sameAuthorBooks.map((book) => (
                <div key={book.product_id} className="min-w-[280px] snap-start" onClick={() => handleRecClick(book, 'product_page_same_author')}>
                  <ProductCard product={book} listName="Same Author Recommendations" />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
