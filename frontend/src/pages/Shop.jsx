import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { catalogService } from '../services/catalogService';
import { trackViewItemList } from '../services/analyticsService';
import ProductCard from '../components/shared/ProductCard';
import SkeletonCard from '../components/shared/SkeletonCard';
import { unwrapList } from '../services/apiClient';
import { useSEO } from '../hooks/useSEO';

const DEFAULT_SORT = 'trending';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const filter = searchParams.get('filter') || '';
  const currentSort = searchParams.get('sort_by') || DEFAULT_SORT;
  const initialCategory = searchParams.get('category') || 'All Categories';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All Categories']);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paginationInfo, setPaginationInfo] = useState(null);

  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    catalogService
      .getCategories()
      .then((res) => {
        const cats = unwrapList(res)
          .map((item) => (typeof item === 'string' ? item : item?.category))
          .filter(Boolean);
        if (cats.length) {
          setCategories(['All Categories', ...cats]);
        }
      })
      .catch(() => console.error('Failed to load categories'));
  }, []);

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      setError(null);

      try {
        let res;
        const params = Object.fromEntries(searchParams.entries());
        if (selectedCategory && selectedCategory !== 'All Categories') {
          params.category = selectedCategory;
        } else {
          delete params.category;
        }

        if (q) {
          res = await catalogService.searchBooks(q);
        } else if (filter === 'bestseller' || filter === 'bestsellers' || params.bestseller === 'true') {
          res = await catalogService.getBestsellers(20);
        } else if (filter === 'deal' || filter === 'deals' || params.on_sale === 'true') {
          res = await catalogService.getDeals(20);
        } else if (filter === 'ai-picks' || filter === 'featured') {
          res = await catalogService.getBooks({ ...params, featured: true, limit: 20 });
        } else {
          res = await catalogService.getBooks(params);
        }

        const loadedProducts = unwrapList(res);
        const pagination = res?.pagination || null;

        setProducts(loadedProducts);
        setPaginationInfo(pagination);

        if (loadedProducts.length > 0) {
          const listName = q
            ? `Search Results: ${q}`
            : filter === 'bestseller' || filter === 'bestsellers'
              ? 'Bestsellers'
              : filter === 'deal' || filter === 'deals'
                ? 'Deals'
                : filter === 'ai-picks' || filter === 'featured'
                  ? 'AI Picks'
                  : 'Shop Listing';
          trackViewItemList(loadedProducts, listName);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load products. Our digital librarians are looking into it.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [searchParams, selectedCategory, q, filter]);

  const heading = useMemo(() => {

    if (filter === 'bestseller' || filter === 'bestsellers') return 'Bestselling Books';
    if (filter === 'deal' || filter === 'deals') return 'Books on Deal';
    if (filter === 'ai-picks' || filter === 'featured') return 'AI Picks';
    if (selectedCategory && selectedCategory !== 'All Categories') return selectedCategory;
    return 'Explore the collection';
  }, [q, filter, selectedCategory]);

  useSEO({
    title: `Shop ${heading !== 'Explore the collection' ? '- ' + heading : ''}`,
    description: 'Browse the SmartBook catalog of intelligently curated books.'
  });

  const handleCategoryChange = (cat) => {
    const next = new URLSearchParams(searchParams);
    setSelectedCategory(cat);
    next.delete('page');
    if (cat === 'All Categories') next.delete('category');
    else next.set('category', cat);
    setSearchParams(next);
  };

  const handleQuickFilter = (nextFilter) => {
    const next = new URLSearchParams(searchParams);
    next.delete('page');
    next.set('filter', nextFilter);
    next.delete('q');
    setSearchParams(next);
  };

  const handleSortChange = (value) => {
    const map = {
      recommended: 'trending',
      newest: 'newest',
      price_asc: 'price_asc',
      price_desc: 'price_desc',
    };
    const next = new URLSearchParams(searchParams);
    next.delete('page');
    next.set('sort_by', map[value] || DEFAULT_SORT);
    setSearchParams(next);
  };

  return (
    <div className="pt-28 pb-20 px-8 max-w-screen-2xl mx-auto flex flex-col lg:flex-row gap-12 min-h-screen">
      <aside className="w-full lg:w-72 flex-shrink-0 space-y-10">
        <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10 shadow-sm">
          <h3 className="text-lg font-bold mb-5 text-on-surface">Quick collections</h3>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => handleQuickFilter('ai-picks')} className="px-4 py-2 rounded-full border border-outline-variant/20 hover:border-primary hover:text-primary transition-colors">
              AI Picks
            </button>
            <button onClick={() => handleQuickFilter('bestsellers')} className="px-4 py-2 rounded-full border border-outline-variant/20 hover:border-primary hover:text-primary transition-colors">
              Bestsellers
            </button>
            <button onClick={() => handleQuickFilter('deals')} className="px-4 py-2 rounded-full border border-outline-variant/20 hover:border-primary hover:text-primary transition-colors">
              Deals
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-6 text-on-surface">Category</h3>
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {categories.map((cat) => (
              <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="category"
                  checked={selectedCategory === cat}
                  onChange={() => handleCategoryChange(cat)}
                  className="w-5 h-5 rounded-full border-outline-variant text-primary focus:ring-primary/20 accent-primary"
                />
                <span className="text-on-surface-variant group-hover:text-primary transition-colors">{cat}</span>
              </label>
            ))}
          </div>
        </div>
      </aside>

      <div className="flex-1">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4 border-b border-outline-variant/10 pb-6">
          <div>
            <h2 className="text-2xl font-bold font-headline text-on-surface mb-1">{heading}</h2>
            <p className="text-on-surface-variant font-medium">
              Showing <span className="text-on-surface font-bold">{products.length}</span> results
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold uppercase tracking-wider text-outline">Sort By</span>
            <select
              value={currentSort === 'newest' ? 'newest' : currentSort === 'price_asc' ? 'price_asc' : currentSort === 'price_desc' ? 'price_desc' : 'recommended'}
              onChange={(e) => handleSortChange(e.target.value)}
              className="bg-surface-container-lowest border-none rounded-lg px-6 py-2.5 shadow-sm focus:ring-2 focus:ring-primary/20 font-semibold text-on-surface min-w-[180px] outline-none"
            >
              <option value="recommended">Recommended</option>
              <option value="newest">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10">
            <span className="material-symbols-outlined text-4xl text-error mb-2">library_books</span>
            <h3 className="text-xl font-bold mb-2">Unavailable</h3>
            <p className="text-on-surface-variant">{error}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 flex flex-col items-center">
            <span className="material-symbols-outlined text-5xl text-outline mb-4">search_off</span>
            <h3 className="text-xl font-bold mb-2">No books found</h3>
            <p className="text-on-surface-variant max-w-sm mb-6">
              We couldn't find anything matching your criteria. Try adjusting your filters or search terms.
            </p>
            <button
              onClick={() => {
                setSearchParams({});
                setSelectedCategory('All Categories');
              }}
              className="px-6 py-2 border border-primary text-primary rounded-full hover:bg-primary/5 transition-colors font-bold"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
            {products.map((product) => (
              <ProductCard key={product.product_id} product={product} />
            ))}
          </div>
        )}

        {paginationInfo && paginationInfo.total_pages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-12 bg-surface-container-low py-4 px-8 rounded-full shadow-sm w-fit mx-auto border border-outline-variant/10">
            <button
              disabled={!paginationInfo.has_prev}
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                next.set('page', Math.max(1, paginationInfo.page - 1));
                setSearchParams(next);
              }}
              className={`flex items-center gap-2 font-bold ${paginationInfo.has_prev ? 'text-primary hover:text-primary-dim' : 'text-outline-variant cursor-not-allowed'}`}
            >
              <span className="material-symbols-outlined">chevron_left</span> Previous
            </button>
            <div className="text-on-surface-variant font-medium text-sm">
              Page <span className="font-bold text-on-surface">{paginationInfo.page}</span> of {paginationInfo.total_pages}
            </div>
            <button
              disabled={!paginationInfo.has_next}
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                next.set('page', paginationInfo.page + 1);
                setSearchParams(next);
              }}
              className={`flex items-center gap-2 font-bold ${paginationInfo.has_next ? 'text-primary hover:text-primary-dim' : 'text-outline-variant cursor-not-allowed'}`}
            >
              Next <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
