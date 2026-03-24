import { useWishlist } from '../context/WishlistContext';
import { useState, useEffect } from 'react';
import { catalogService } from '../services/catalogService';
import { unwrapObject } from '../services/apiClient';
import ProductCard from '../components/shared/ProductCard';

export default function Wishlist() {
  const { wishlistItems, loading } = useWishlist();
  const [products, setProducts] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (wishlistItems.length === 0) {
      setProducts([]);
      setFetching(false);
      return;
    }
    
    let isMounted = true;
    const fetchBooks = async () => {
      setFetching(true);
      try {
        const promises = wishlistItems.map(id => catalogService.getProductById(id));
        const results = await Promise.all(promises);
        if (isMounted) {
          setProducts(results.map(r => unwrapObject(r)).filter(Boolean));
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setFetching(false);
      }
    };
    
    fetchBooks();
    return () => { isMounted = false; };
  }, [wishlistItems]);

  if (loading || fetching) {
    return (
      <div className="min-h-screen pt-32 flex flex-col items-center justify-center bg-surface">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-on-surface-variant font-medium">Loading your wishlist...</p>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 px-4 md:px-8 max-w-screen-2xl mx-auto min-h-screen bg-surface">
      <h1 className="text-4xl md:text-5xl font-black font-headline tracking-tighter text-on-surface mb-10">My Wishlist <span className="text-xl text-primary align-top">({wishlistItems.length})</span></h1>
      
      {products.length === 0 ? (
        <div className="text-center py-24 bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm flex flex-col items-center">
          <span className="material-symbols-outlined text-6xl text-outline mb-4">favorite_border</span>
          <p className="text-on-surface-variant text-xl font-medium">Your wishlist is empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {products.map((product) => (
            <ProductCard key={product.product_id} product={product} listName="Wishlist" />
          ))}
        </div>
      )}
    </div>
  );
}
