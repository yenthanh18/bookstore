import { useState, useEffect } from 'react';
import { catalogService } from '../services/catalogService';
import { trackViewItemList } from '../services/analyticsService';
import ProductCard from '../components/shared/ProductCard';
import { useNavigate } from 'react-router-dom';
import { unwrapList } from '../services/apiClient';

export default function Home() {
  const navigate = useNavigate();
  const [data, setData] = useState({
    featured: [],
    bestsellers: [],
    deals: [],
    trending: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [featuredRes, bestsellersRes, dealsRes, trendingRes] = await Promise.all([
          catalogService.getBooks({ featured: true, limit: 8 }),
          catalogService.getBestsellers(8),
          catalogService.getDeals(8),
          catalogService.getTrending(8)
        ]);

        const newState = {
          featured: unwrapList(featuredRes),
          bestsellers: unwrapList(bestsellersRes),
          deals: unwrapList(dealsRes),
          trending: unwrapList(trendingRes)
        };

        setData(newState);

        if (newState.featured.length) trackViewItemList(newState.featured, 'Featured Books');
        if (newState.trending.length) trackViewItemList(newState.trending, 'Trending Now');
        if (newState.bestsellers.length) trackViewItemList(newState.bestsellers, 'Bestsellers');
        if (newState.deals.length) trackViewItemList(newState.deals, 'Deals');
      } catch (err) {
        console.error(err);
        setError('Failed to load store data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);



  const collectionCards = [
    {
      key: 'ai-picks',
      title: 'AI Picks',
      subtitle: 'Smartly curated titles based on quality, relevance, and momentum.',
      cta: 'Explore AI Picks',
      onClick: () => navigate('/shop?filter=ai-picks'),
      badge: 'AI Curated',
      icon: 'auto_awesome',
      items: data.trending.slice(0, 3),
    },
    {
      key: 'bestsellers',
      title: 'Bestsellers',
      subtitle: 'The books readers are loving most right now.',
      cta: 'Browse Bestsellers',
      onClick: () => navigate('/shop?filter=bestsellers'),
      badge: 'Popular',
      icon: 'workspace_premium',
      items: data.bestsellers.slice(0, 3),
    },
    {
      key: 'deals',
      title: 'Deals',
      subtitle: 'Discover discounted books without sacrificing quality.',
      cta: 'See Deals',
      onClick: () => navigate('/shop?filter=deals'),
      badge: 'Save More',
      icon: 'sell',
      items: data.deals.slice(0, 3),
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen pt-32 px-8 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-on-surface-variant font-medium">Curating intelligence...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-32 px-8 flex flex-col items-center justify-center text-center">
        <span className="material-symbols-outlined text-error text-6xl mb-4">error</span>
        <h2 className="text-2xl font-bold font-headline mb-2">Something went wrong</h2>
        <p className="text-on-surface-variant">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-8 px-6 py-3 bg-primary text-white rounded-full font-bold">Retry</button>
      </div>
    );
  }

  return (
    <div className="overflow-x-hidden">
      <section className="relative px-8 pt-16 pb-24 md:pt-32 md:pb-40 bg-surface">
        <div className="max-w-screen-2xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="z-10">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-tertiary-container/30 text-tertiary-dim font-semibold text-sm mb-8">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
              Powered by GPT-4 Digital Curation
            </span>
            <h1 className="font-headline text-6xl md:text-8xl font-extrabold tracking-tighter text-on-surface mb-8 leading-[0.9]">
              Discover Your Next <span className="bg-gradient-to-r from-primary to-tertiary bg-clip-text text-transparent">Favorite Book</span> with AI.
            </h1>
            <p className="text-xl md:text-2xl text-on-surface-variant max-w-xl mb-12 leading-relaxed">
              We don't just sell books. We curate intelligence. Our AI understands your taste to find stories that will change your perspective.
            </p>
            <div className="flex flex-wrap gap-4">
              <button onClick={() => navigate('/shop')} className="px-8 py-4 bg-gradient-to-br from-primary to-primary-container text-white font-bold rounded-full shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                Explore Books <span className="material-symbols-outlined">arrow_forward</span>
              </button>
              <button onClick={() => navigate('/shop?filter=ai-picks')} className="px-8 py-4 bg-surface-container-lowest text-on-surface font-bold rounded-full border border-outline-variant/20 hover:border-primary/30 hover:text-primary transition-all flex items-center gap-2">
                View AI Picks <span className="material-symbols-outlined">auto_awesome</span>
              </button>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end hidden lg:flex">
            <div className="relative w-full max-w-lg aspect-[1/1] pr-4 flex items-center justify-center">
              <div className="absolute top-10 right-10 w-64 h-80 rounded-lg overflow-hidden shadow-2xl rotate-6 z-30 transition-transform hover:rotate-0 duration-500 bg-surface-container">
                {data.featured[0] && <img src={data.featured[0].image_url} alt="Cover 1" className="w-full h-full object-cover" />}
              </div>
              <div className="absolute top-24 left-0 w-56 h-72 rounded-lg overflow-hidden shadow-xl -rotate-12 z-20 transition-transform hover:rotate-0 duration-500 bg-surface-container cursor-pointer">
                {data.featured[1] && <img src={data.featured[1].image_url} alt="Cover 2" className="w-full h-full object-cover" />}
              </div>
              <div className="absolute bottom-4 right-24 w-60 h-72 rounded-lg overflow-hidden shadow-2xl rotate-3 z-10 transition-transform hover:rotate-0 duration-500 bg-surface-container cursor-pointer">
                {data.featured[2] && <img src={data.featured[2].image_url} alt="Cover 3" className="w-full h-full object-cover" />}
              </div>
              <div className="absolute -top-10 -left-10 w-full h-full bg-primary/10 rounded-full blur-[120px] -z-10"></div>
              <div className="absolute -bottom-10 -right-10 w-full h-full bg-tertiary/10 rounded-full blur-[120px] -z-10"></div>
            </div>
          </div>
        </div>
      </section>



      <section className="px-8 mb-28">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex items-end justify-between mb-10 gap-4 flex-wrap">
            <div>
              <h2 className="font-headline text-4xl font-extrabold text-on-surface mb-2 tracking-tight">Curated Collections</h2>
              <p className="text-on-surface-variant text-lg">Jump straight into the shelves that matter most.</p>
            </div>
            <button
              onClick={() => navigate('/shop')}
              className="px-6 py-3 rounded-full border border-outline-variant/20 bg-surface-container-lowest text-on-surface font-bold hover:text-primary hover:border-primary/30 transition-colors"
            >
              View Full Catalog
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {collectionCards.map((collection) => (
              <div
                key={collection.key}
                className="rounded-3xl border border-outline-variant/10 bg-surface-container-lowest p-8 shadow-sm hover:shadow-[0px_24px_48px_-12px_rgba(74,64,224,0.10)] transition-all"
              >
                <div className="flex items-center justify-between mb-5">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                    <span className="material-symbols-outlined text-sm">{collection.icon}</span>
                    {collection.badge}
                  </span>
                </div>

                <h3 className="font-headline text-2xl font-extrabold text-on-surface mb-3">{collection.title}</h3>
                <p className="text-on-surface-variant leading-relaxed mb-6">{collection.subtitle}</p>

                <div className="space-y-3 mb-8">
                  {collection.items.length > 0 ? (
                    collection.items.map((book) => (
                      <button
                        key={book.product_id}
                        onClick={() => navigate(`/product/${book.product_id}`)}
                        className="w-full text-left flex items-center gap-4 p-3 rounded-2xl bg-surface-container-low hover:bg-surface transition-colors"
                      >
                        <div className="w-12 h-16 rounded-lg overflow-hidden bg-surface-container flex-shrink-0">
                          <img
                            src={book.image_url || 'https://via.placeholder.com/100x150'}
                            alt={book.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-on-surface line-clamp-1">{book.title}</p>
                          <p className="text-sm text-on-surface-variant line-clamp-1">{book.authors}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 rounded-2xl bg-surface-container-low text-on-surface-variant text-sm">
                      Collection is loading. Try opening the Shop page.
                    </div>
                  )}
                </div>

                <button
                  onClick={collection.onClick}
                  className="w-full px-6 py-4 rounded-2xl bg-gradient-to-r from-primary to-primary-container text-white font-bold hover:scale-[1.01] active:scale-[0.99] transition-transform flex items-center justify-center gap-2"
                >
                  {collection.cta}
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {data.featured.length > 0 && (
        <section className="px-8 mb-32">
          <div className="max-w-screen-2xl mx-auto">
            <div className="flex items-end justify-between mb-12 gap-4 flex-wrap">
              <div>
                <h2 className="font-headline text-4xl font-extrabold text-on-surface mb-2 tracking-tight">Featured Selections</h2>
                <p className="text-on-surface-variant text-lg">Curated intelligence based on recent trends.</p>
              </div>
              <button
                onClick={() => navigate('/shop?filter=ai-picks')}
                className="text-primary font-bold flex items-center gap-2 hover:gap-3 transition-all"
              >
                Explore AI Picks <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>

            <div className="flex gap-8 overflow-x-auto no-scrollbar pb-12 snap-x">
              {data.featured.map((product) => (
                <div key={product.product_id} className="min-w-[320px] max-w-[320px] snap-start shrink-0">
                  <ProductCard product={product} listName="Featured Books" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {data.trending.length > 0 && (
        <section className="px-8 py-24 bg-surface-container-low">
          <div className="max-w-screen-2xl mx-auto">
            <div className="mb-16 flex items-end justify-between gap-4 flex-wrap">
              <div>
                <h2 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight mb-4">Trending Now</h2>
                <div className="h-1 w-24 bg-primary rounded-full"></div>
              </div>
              <button
                onClick={() => navigate('/shop?filter=ai-picks')}
                className="px-6 py-3 rounded-full bg-surface-container-lowest text-on-surface font-bold border border-outline-variant/10 hover:text-primary hover:border-primary/20 transition-colors"
              >
                Open AI Picks
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {data.trending.slice(0, 4).map((book) => (
                <div key={book.product_id} onClick={() => navigate(`/product/${book.product_id}`)} className="bg-surface-container-lowest rounded-lg p-4 flex gap-4 hover:shadow-lg transition-all cursor-pointer">
                  <div className="w-24 h-32 rounded bg-surface shadow-md overflow-hidden flex-shrink-0">
                    <img src={book.image_url || 'https://via.placeholder.com/100x150'} alt={book.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <h4 className="font-headline font-bold text-on-surface leading-tight mb-1">{book.title}</h4>
                    <p className="text-sm text-on-surface-variant mb-2">{book.authors}</p>
                    <span className="text-lg font-black text-primary">${Number(book.final_price || 0).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {data.bestsellers.length > 0 && (
        <section className="px-8 py-24">
          <div className="max-w-screen-2xl mx-auto">
            <div className="flex items-end justify-between mb-12 gap-4 flex-wrap">
              <div>
                <h2 className="font-headline text-4xl font-extrabold text-on-surface mb-2 tracking-tight">Bestsellers</h2>
                <p className="text-on-surface-variant text-lg">Reader favorites with proven momentum.</p>
              </div>
              <button
                onClick={() => navigate('/shop?filter=bestsellers')}
                className="text-primary font-bold flex items-center gap-2 hover:gap-3 transition-all"
              >
                View all bestsellers <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8">
              {data.bestsellers.slice(0, 4).map((product) => (
                <ProductCard key={product.product_id} product={product} listName="Bestsellers" />
              ))}
            </div>
          </div>
        </section>
      )}

      {data.deals.length > 0 && (
        <section className="px-8 pb-28">
          <div className="max-w-screen-2xl mx-auto">
            <div className="flex items-end justify-between mb-12 gap-4 flex-wrap">
              <div>
                <h2 className="font-headline text-4xl font-extrabold text-on-surface mb-2 tracking-tight">Deals</h2>
                <p className="text-on-surface-variant text-lg">High-value books at lower prices.</p>
              </div>
              <button
                onClick={() => navigate('/shop?filter=deals')}
                className="text-primary font-bold flex items-center gap-2 hover:gap-3 transition-all"
              >
                Browse all deals <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8">
              {data.deals.slice(0, 4).map((product) => (
                <ProductCard key={product.product_id} product={product} listName="Deals" />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="px-8 py-32">
        <div className="max-w-screen-xl mx-auto bg-gradient-to-r from-primary-dim to-primary rounded-3xl p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="relative z-10">
            <h2 className="font-headline text-4xl md:text-5xl font-black text-white mb-6">Get Weekly Book Recommendations</h2>
            <p className="text-indigo-100 text-lg mb-10 max-w-2xl mx-auto">Join 50,000+ readers who receive our AI-powered curation of the world's most intelligent books every Friday.</p>
            <form className="flex flex-col md:flex-row gap-4 max-w-xl mx-auto" onSubmit={(e) => { e.preventDefault(); alert('Subscribed!'); }}>
              <input type="email" placeholder="Enter your email address" className="flex-grow px-8 py-5 rounded-full bg-white border-none text-on-surface font-body outline-none focus:ring-4 focus:ring-white/20" />
              <button className="px-10 py-5 bg-on-surface text-white font-black rounded-full hover:scale-105 active:scale-95 transition-all outline-none">
                Subscribe Now
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
