import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { summary } = useCart();
  const { wishlistItems } = useWishlist();
  const { user } = useAuth();
  
  const cartCount = summary.count || 0;
  const wishlistCount = wishlistItems.length || 0;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
    setCollectionsOpen(false);
  }, [location.pathname, location.search]);

  const isExactRouteActive = (path) => {
    const [pathname, query = ''] = path.split('?');
    return location.pathname === pathname && (query ? location.search === `?${query}` : location.search === '');
  };

  const isPathActive = (path) => location.pathname === path;

  const isCollectionsActive = useMemo(() => {
    return (
      location.pathname === '/shop' &&
      ['?filter=ai-picks', '?filter=bestsellers', '?filter=deals'].includes(location.search)
    );
  }, [location.pathname, location.search]);

  const primaryLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: 'Blog', path: '/blog' },
    { name: 'Contact', path: '/contact' },
  ];

  const collectionLinks = [
    {
      name: 'AI Picks',
      path: '/shop?filter=ai-picks',
      description: 'Smartly curated titles with strong momentum.',
      icon: 'auto_awesome',
    },
    {
      name: 'Bestsellers',
      path: '/shop?filter=bestsellers',
      description: 'The books readers are loving most right now.',
      icon: 'workspace_premium',
    },
    {
      name: 'Deals',
      path: '/shop?filter=deals',
      description: 'Discounted books with high value.',
      icon: 'sell',
    },
  ];

  const mobileLinks = [
    ...primaryLinks,
    ...collectionLinks,
    { name: 'Cart', path: '/cart' },
  ];

  const navLinkClass = (active) =>
    `relative font-headline font-semibold tracking-tight transition-all duration-200 ${
      active ? 'text-primary' : 'text-slate-600 hover:text-primary'
    }`;

  const underlineClass = (active) =>
    `absolute -bottom-2 left-0 h-0.5 rounded-full bg-primary transition-all duration-200 ${
      active ? 'w-full' : 'w-0 group-hover:w-full'
    }`;

  return (
    <>
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/20 bg-white/75 backdrop-blur-xl shadow-[0px_10px_30px_-18px_rgba(74,64,224,0.35)]">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
          <div className="h-20 flex items-center justify-between gap-6">
            <Link to="/" className="flex items-center gap-3 shrink-0">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-white flex items-center justify-center shadow-lg shadow-primary/20">
                <span
                  className="material-symbols-outlined text-[24px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  auto_stories
                </span>
              </div>
              <div className="leading-tight">
                <p className="text-lg md:text-xl font-black tracking-tight text-slate-900 font-headline">
                  SmartBook
                </p>
                <p className="text-[11px] md:text-xs uppercase tracking-[0.22em] text-slate-500 font-bold">
                  AI Store
                </p>
              </div>
            </Link>

            <div className="hidden lg:flex items-center gap-8">
              {primaryLinks.map((link) => {
                const active = link.path === '/' ? isPathActive('/') : isPathActive(link.path);
                return (
                  <Link key={link.name} to={link.path} className={`group ${navLinkClass(active)}`}>
                    {link.name}
                    <span className={underlineClass(active)} />
                  </Link>
                );
              })}

              <div
                className="relative"
                onMouseEnter={() => setCollectionsOpen(true)}
                onMouseLeave={() => setCollectionsOpen(false)}
              >
                <button
                  type="button"
                  className={`group flex items-center gap-1.5 ${navLinkClass(isCollectionsActive)}`}
                  onClick={() => setCollectionsOpen((v) => !v)}
                >
                  Collections
                  <span
                    className={`material-symbols-outlined text-[18px] transition-transform ${
                      collectionsOpen ? 'rotate-180' : ''
                    }`}
                  >
                    expand_more
                  </span>
                  <span className={underlineClass(isCollectionsActive)} />
                </button>

                <div
                  className={`absolute top-full left-1/2 -translate-x-1/2 pt-4 transition-all duration-200 ${
                    collectionsOpen
                      ? 'opacity-100 translate-y-0 pointer-events-auto'
                      : 'opacity-0 -translate-y-1 pointer-events-none'
                  }`}
                >
                  <div className="w-[380px] rounded-3xl border border-outline-variant/10 bg-white/95 backdrop-blur-xl shadow-[0px_24px_60px_-16px_rgba(15,23,42,0.18)] p-4">
                    <div className="px-3 py-2 mb-2">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400 font-bold">
                        Curated Collections
                      </p>
                      <h3 className="font-headline text-xl font-extrabold text-slate-900 mt-1">
                        Explore faster
                      </h3>
                    </div>

                    <div className="space-y-2">
                      {collectionLinks.map((link) => {
                        const active = isExactRouteActive(link.path);
                        return (
                          <Link
                            key={link.name}
                            to={link.path}
                            className={`flex items-start gap-4 rounded-2xl px-4 py-4 transition-all ${
                              active
                                ? 'bg-primary/8 ring-1 ring-primary/15'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <div
                              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                                active
                                  ? 'bg-primary text-white'
                                  : 'bg-surface-container-low text-primary'
                              }`}
                            >
                              <span className="material-symbols-outlined">{link.icon}</span>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-slate-900">{link.name}</p>
                                {active && (
                                  <span className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary font-bold uppercase tracking-wide">
                                    Active
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-slate-500 leading-relaxed">
                                {link.description}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate('/shop')}
                      className="mt-3 w-full rounded-2xl bg-slate-900 text-white py-3.5 font-bold hover:bg-black transition-colors"
                    >
                      View Full Catalog
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3 shrink-0">
              <Link to="/wishlist" className="relative hidden md:flex w-11 h-11 items-center justify-center rounded-full bg-surface-container-low text-on-surface hover:text-red-500 hover:bg-red-50 transition-colors">
                <span className="material-symbols-outlined">favorite</span>
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-0.5 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center shadow-md">
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                )}
              </Link>

              <Link
                to="/cart"
                className="relative w-11 h-11 flex items-center justify-center rounded-full bg-surface-container-low text-on-surface hover:text-primary hover:bg-surface transition-colors"
              >
                <span className="material-symbols-outlined">shopping_cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-0.5 min-w-[20px] h-5 px-1 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center shadow-md">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>

              <Link to={user ? (user.role === 'admin' ? '/admin' : '/profile') : '/login'} className="hidden md:flex w-11 h-11 items-center justify-center rounded-full bg-surface-container-low text-on-surface hover:text-primary hover:bg-surface transition-colors">
                <span className="material-symbols-outlined">account_circle</span>
              </Link>

              <button
                type="button"
                onClick={() => setMobileOpen((v) => !v)}
                className="lg:hidden w-11 h-11 flex items-center justify-center rounded-full bg-surface-container-low text-on-surface hover:text-primary hover:bg-surface transition-colors"
              >
                <span className="material-symbols-outlined">
                  {mobileOpen ? 'close' : 'menu'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div
        className={`lg:hidden fixed top-20 inset-x-0 z-40 transition-all duration-200 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="mx-4 mt-3 rounded-3xl border border-outline-variant/10 bg-white/95 backdrop-blur-xl shadow-[0px_24px_60px_-16px_rgba(15,23,42,0.18)] p-4">
          <div className="grid grid-cols-1 gap-2">
             <Link
                to={user ? (user.role === 'admin' ? '/admin' : '/profile') : '/login'}
                className="flex items-center gap-4 rounded-2xl px-4 py-4 transition-all bg-surface-container-low text-slate-700 hover:bg-surface"
              >
                <span className="material-symbols-outlined">account_circle</span>
                <span className="font-bold">{user ? 'My Profile' : 'Sign In'}</span>
             </Link>
             <Link
                to="/wishlist"
                className="flex items-center gap-4 rounded-2xl px-4 py-4 transition-all bg-surface-container-low text-slate-700 hover:bg-surface"
              >
                <span className="material-symbols-outlined text-red-500">favorite</span>
                <span className="font-bold">Wishlist ({wishlistCount})</span>
             </Link>
             
            {mobileLinks.map((link) => {
              const active =
                link.path.includes('?') ? isExactRouteActive(link.path) : isPathActive(link.path);

              const icon =
                link.name === 'Home'
                  ? 'home'
                  : link.name === 'Shop'
                  ? 'storefront'
                  : link.name === 'Blog'
                  ? 'article'
                  : link.name === 'Contact'
                  ? 'mail'
                  : link.name === 'Bestsellers'
                  ? 'workspace_premium'
                  : link.name === 'Deals'
                  ? 'sell'
                  : link.name === 'AI Picks'
                  ? 'auto_awesome'
                  : 'shopping_cart';

              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center gap-4 rounded-2xl px-4 py-4 transition-all ${
                    active
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'bg-surface-container-low text-slate-700 hover:bg-surface'
                  }`}
                >
                  <span className="material-symbols-outlined">{icon}</span>
                  <span className="font-bold">{link.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
