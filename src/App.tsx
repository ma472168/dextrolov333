/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, type FormEvent, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Instagram, Volume2, VolumeX, X } from 'lucide-react';
import { FaGithub, FaSoundcloud } from 'react-icons/fa';
import { FaTiktok } from 'react-icons/fa6';
import Track from './music/veneno mix.wav';
import { supabase } from './lib/supabase';

const countdownFontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface StoreProduct {
  id: number;
  name: string;
  price: number;
  image: string;
  description: string;
}

function CountdownStoreApp({ canEditStore }: { canEditStore: boolean }) {
  const [showSecondTitle, setShowSecondTitle] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const [isCountdownOver, setIsCountdownOver] = useState(false);
  const [viewMode, setViewMode] = useState<'countdown' | 'shop' | 'checkout'>('countdown');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  });

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoadingProducts(true);
      setProductsError('');

      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, image, description')
        .order('id', { ascending: true });

      if (error) {
        setProducts([]);
        setProductsError('No se pudieron cargar los productos desde Supabase.');
        setIsLoadingProducts(false);
        return;
      }

      const parsedProducts: StoreProduct[] = (data ?? []).map((item) => ({
        id: Number(item.id),
        name: String(item.name ?? ''),
        price: Number(item.price ?? 0),
        image: String(item.image ?? ''),
        description: String(item.description ?? ''),
      }));

      setProducts(parsedProducts);
      setIsLoadingProducts(false);
    };

    void loadProducts();
  }, []);

  useEffect(() => {
    const targetDate = new Date('May 14, 2026 00:00:00').getTime();
    // TEST DATE. 
    // const targetDate = new Date('2026-04-04T15:26:00').getTime();
    let animationFrameId = 0;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
        setIsCountdownOver(true);
        return;
      } else {
        setIsCountdownOver(false);
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
          milliseconds: Math.floor(distance % 1000),
        });
      }

      animationFrameId = requestAnimationFrame(updateCountdown);
    };

    animationFrameId = requestAnimationFrame(updateCountdown);

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  useEffect(() => {
    const switchTimer = setTimeout(() => {
      setShowSecondTitle(true);
    }, 30000);

    return () => clearTimeout(switchTimer);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleThemeChange = (event: MediaQueryListEvent) => {
      setIsDarkMode(event.matches);
    };

    setIsDarkMode(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleThemeChange);

    return () => mediaQuery.removeEventListener('change', handleThemeChange);
  }, []);

  useEffect(() => {
    let themeMeta = document.querySelector('meta[name="theme-color"]:not([media])');

    if (!themeMeta) {
      themeMeta = document.createElement('meta');
      themeMeta.setAttribute('name', 'theme-color');
      document.head.appendChild(themeMeta);
    }

    themeMeta.setAttribute('content', isDarkMode ? '#000000' : '#ffffff');
  }, [isDarkMode]);

  useEffect(() => {
    const audio = new Audio(Track);
    audio.loop = true;
    audio.volume = 0.8;
    audioRef.current = audio;

    const onPlay = () => setIsAudioPlaying(true);
    const onPause = () => setIsAudioPlaying(false);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    const tryPlay = () => {
      return audio.play()
        .then(() => {
          setIsAudioPlaying(true);
        })
        .catch(() => {
          setIsAudioPlaying(false);
        });
    };

    void tryPlay();

    const unlockAndPlay = () => {
      void tryPlay();
      window.removeEventListener('click', unlockAndPlay);
      window.removeEventListener('touchstart', unlockAndPlay);
      window.removeEventListener('keydown', unlockAndPlay);
    };

    window.addEventListener('click', unlockAndPlay, { once: true });
    window.addEventListener('touchstart', unlockAndPlay, { once: true });
    window.addEventListener('keydown', unlockAndPlay, { once: true });

    return () => {
      window.removeEventListener('click', unlockAndPlay);
      window.removeEventListener('touchstart', unlockAndPlay);
      window.removeEventListener('keydown', unlockAndPlay);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.pause();
      audio.currentTime = 0;
      audioRef.current = null;
    };
  }, []);

  const handleAudioToggle = () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (audio.paused) {
      void audio.play().catch(() => {
        setIsAudioPlaying(false);
      });
      return;
    }

    audio.pause();
  };

  const handleAddToCart = (product: Omit<CartItem, 'quantity'>) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateCartQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(id);
    } else {
      setCart((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, quantity } : item
        )
      );
    }
  };

  const formatNumber = (num: number) => {
    return num.toString().padStart(2, '0');
  };

  const formatMilliseconds = (num: number) => {
    return num.toString().padStart(3, '0');
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const isStoreUnlocked = canEditStore || isCountdownOver;
  const isStoreView = viewMode === 'shop' || viewMode === 'checkout' || isStoreUnlocked;
  const visibleProducts = products;

  useEffect(() => {
    if (canEditStore && viewMode === 'countdown') {
      setViewMode('shop');
    }

    if (!canEditStore && !isCountdownOver && viewMode !== 'countdown') {
      setViewMode('countdown');
    }
  }, [canEditStore, isCountdownOver, viewMode]);

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-between p-6 md:p-12 font-sans overflow-hidden ${
        isDarkMode
          ? 'bg-black text-white selection:bg-white selection:text-black'
          : 'bg-white text-black selection:bg-black selection:text-white'
      }`}
    >
      {/* Header with Title */}
      <header className={`w-full flex justify-center px-2 ${isStoreView ? 'pt-4 md:pt-8' : 'pt-6 md:pt-16'}`}>
        <AnimatePresence mode="wait">
          <motion.h1
            key={showSecondTitle ? 'second-title' : 'first-title'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            className={isStoreView
              ? 'text-lg sm:text-xl md:text-3xl font-light tracking-[0.18em] uppercase text-center leading-tight'
              : showSecondTitle
                ? 'text-xl sm:text-2xl md:text-4xl lg:text-5xl font-light tracking-[0.2em] uppercase text-center leading-tight'
                : 'text-4xl sm:text-5xl md:text-8xl lg:text-[9rem] font-light tracking-[0.12em] sm:tracking-[0.16em] uppercase text-center leading-none break-words'
            }
            style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
          >
            {isStoreView ? 'dextrolov333 store' : showSecondTitle ? 'lets go givenchy 2013' : 'dextrolov333'}
          </motion.h1>
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className={`w-full flex-1 flex flex-col items-center px-2 ${isStoreView ? 'justify-start pt-8 md:pt-12 pb-24 md:pb-8' : 'justify-center py-8 md:py-0'}`}>
        {viewMode === 'checkout' ? (
          <Checkout
            isDarkMode={isDarkMode}
            cart={cart}
            onBack={() => setViewMode('shop')}
            onRemoveItem={handleRemoveFromCart}
            onUpdateQuantity={handleUpdateCartQuantity}
          />
        ) : viewMode === 'shop' || isStoreUnlocked ? (
          <Shop
            isDarkMode={isDarkMode}
            products={visibleProducts}
            canEditStore={canEditStore}
            onProductsChange={setProducts}
            isLoadingProducts={isLoadingProducts}
            productsError={productsError}
            cart={cart}
            onAddToCart={handleAddToCart}
            onCheckout={() => setViewMode('checkout')}
            cartCount={cartCount}
            onRemoveItem={handleRemoveFromCart}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:justify-center sm:items-center sm:gap-8 md:gap-16 w-full max-w-5xl">
              <TimeUnit value={formatNumber(timeLeft.days)} label="DAYS" />
              <TimeUnit value={formatNumber(timeLeft.hours)} label="HOURS" />
              <TimeUnit value={formatNumber(timeLeft.minutes)} label="MINUTES" />
              <TimeUnit value={formatNumber(timeLeft.seconds)} label="SECONDS" />
              <div className="col-span-2 justify-self-center sm:col-span-1 sm:justify-self-auto">
                <MillisecondsUnit value={formatMilliseconds(timeLeft.milliseconds)} label="MILLISECONDS" />
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer & Socials */}
      {!isStoreView && (
      <footer className="w-full flex flex-col items-center gap-8 pb-24 md:pb-10 px-2">
        <div className="flex flex-wrap justify-center gap-6 sm:gap-12">
          <SocialLink href="https://www.instagram.com/dextrolov333/" icon={<Instagram size={24} />} label="Instagram" />
          <SocialLink href="https://www.soundcloud.com/breckislove/" icon={<FaSoundcloud size={24} />} label="SoundCloud" />
          <SocialLink href='https://github.com/ma472168/dextrolov333' icon={<FaGithub size={24} />} label="GitHub" />
          <SocialLink href='https://www.tiktok.com/@dextrolov333' icon={<FaTiktok size={24} />} label="TikTok" />
        </div>

        <div className="text-[10px] md:text-xs tracking-[0.4em] uppercase opacity-30 text-center font-medium">
          <span className="block">hosted by xenredda & breck</span>
          <span className="block">coded by xenredda</span>
        </div>
      </footer>
      )}

      <motion.button
        type="button"
        onClick={handleAudioToggle}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        className={`fixed left-1/2 -translate-x-1/2 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] md:left-auto md:translate-x-0 md:bottom-auto md:top-6 md:right-6 z-[9999] inline-flex items-center gap-1.5 md:gap-2 rounded-full px-3 py-2 md:px-4 md:py-2.5 text-[10px] md:text-sm font-bold tracking-[0.08em] md:tracking-[0.12em] uppercase shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-sm transition-colors duration-300 ${
          isDarkMode
            ? 'bg-black/85 text-white ring-1 ring-white/20 hover:bg-white hover:text-black hover:ring-white/40'
            : 'bg-white/90 text-black ring-1 ring-black/15 hover:bg-black hover:text-white hover:ring-black/30'
        }`}
        aria-label={isAudioPlaying ? 'Pausar musica' : 'Reproducir musica'}
      >
        {isAudioPlaying ? <Volume2 size={14} /> : <VolumeX size={14} />}
        {isAudioPlaying ? 'Audio On' : 'Audio Off'}
      </motion.button>
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const bootstrapSession = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(Boolean(data.session?.user));
    };

    void bootstrapSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session?.user));
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      <CountdownStoreApp canEditStore={isAuthenticated} />
      <CornerLoginTab />
    </>
  );
}

function CornerLoginTab() {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentIdentity, setCurrentIdentity] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const resolveUsername = async (email?: string, metadataUsername?: string | null) => {
    const normalizedMetadata = (metadataUsername ?? '').trim().toLowerCase();
    if (normalizedMetadata) {
      return normalizedMetadata;
    }

    if (!email) {
      return '';
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('email', email)
      .maybeSingle();

    return String(profile?.username ?? '').trim().toLowerCase();
  };

  useEffect(() => {
    const bootstrapSession = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user ?? null;
      setIsAuthenticated(Boolean(user));
      if (!user) {
        setCurrentIdentity('');
        return;
      }

      const username = await resolveUsername(user.email, String(user.user_metadata?.username ?? ''));
      setCurrentIdentity(username);
    };

    void bootstrapSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setIsAuthenticated(Boolean(user));

      if (!user) {
        setCurrentIdentity('');
        return;
      }

      void (async () => {
        const username = await resolveUsername(user.email, String(user.user_metadata?.username ?? ''));
        setCurrentIdentity(username);
      })();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    const normalizedUsername = username.trim().toLowerCase();

    if (!normalizedUsername || !password) {
      setErrorMessage('Completa usuario y contrasena.');
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', normalizedUsername)
      .maybeSingle();

    if (profileError || !profile?.email) {
      setErrorMessage('Usuario no encontrado.');
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password,
    });

    if (signInError) {
      setErrorMessage(`Error de acceso: ${signInError.message}`);
      return;
    }

    setIsAuthenticated(true);
    setCurrentIdentity(normalizedUsername);
    setUsername('');
    setPassword('');
    setIsOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setCurrentIdentity('');
    setUsername('');
    setPassword('');
    setErrorMessage('');
    setIsOpen(false);
  };

  return (
    <div className="fixed top-3 left-3 md:top-6 md:left-6 z-[10001]"
    >
      <motion.button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`px-0 py-0 text-xs md:text-sm tracking-[0.06em] underline underline-offset-4 transition-colors duration-300 ${
          isAuthenticated
            ? 'text-emerald-300 hover:text-emerald-200'
            : 'text-white hover:text-white/80'
        }`}
      >
        {isAuthenticated ? `@${currentIdentity || 'usuario'}` : 'login'}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="mt-2 w-[280px] border border-white/20 bg-black/85 text-white p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-sm"
          >
            {isAuthenticated ? (
              <div className="space-y-3">
                <p className="text-xs tracking-[0.08em] uppercase opacity-80">Conectado como {currentIdentity || 'usuario'}</p>
                <motion.button
                  type="button"
                  onClick={() => void handleLogout()}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full text-[10px] md:text-xs font-bold tracking-[0.1em] uppercase py-2.5 border border-white/30 hover:border-white hover:bg-white hover:text-black transition-all duration-300"
                >
                  Cerrar sesion
                </motion.button>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-3">
                <p className="text-xs tracking-[0.08em] uppercase opacity-70">Acceso privado</p>
                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                  placeholder="Usuario"
                  className="w-full text-xs py-2.5 px-3 border border-white/25 tracking-[0.08em] placeholder:opacity-50 bg-black/70 text-white focus:outline-none"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  placeholder="Password"
                  className="w-full text-xs py-2.5 px-3 border border-white/25 tracking-[0.08em] placeholder:opacity-50 bg-black/70 text-white focus:outline-none"
                />

                {errorMessage && <p className="text-xs text-red-400">{errorMessage}</p>}

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full text-[10px] md:text-xs font-bold tracking-[0.1em] uppercase py-2.5 border border-white hover:bg-white hover:text-black transition-all duration-300"
                >
                  Iniciar sesion
                </motion.button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TimeUnit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-w-0">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="text-6xl sm:text-7xl md:text-9xl font-black font-mono tracking-tight leading-none"
          style={{ fontFamily: countdownFontFamily }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
      <span className="mt-2 md:mt-4 text-[9px] sm:text-[10px] md:text-xs tracking-[0.25em] md:tracking-[0.3em] opacity-40 font-bold uppercase text-center">
        {label}
      </span>
    </div>
  );
}

function MillisecondsUnit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-w-0">
      <motion.span
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
        className="text-5xl sm:text-6xl md:text-7xl font-black font-mono tracking-tight leading-none"
        style={{ fontFamily: countdownFontFamily }}
      >
        {value}
      </motion.span>
      <span
        className="mt-2 md:mt-4 text-[9px] sm:text-[10px] md:text-xs tracking-[0.25em] md:tracking-[0.3em] opacity-40 font-bold uppercase text-center"
        style={{ fontFamily: countdownFontFamily }}
      >
        {label}
      </span>
    </div>
  );
}

function SocialLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ scale: 1.1, opacity: 1 }}
      className="opacity-40 transition-opacity duration-300"
      aria-label={label}
    >
      {icon}
    </motion.a>
  );
}

interface ShopProps {
  isDarkMode: boolean;
  products: StoreProduct[];
  canEditStore: boolean;
  onProductsChange: (products: StoreProduct[]) => void;
  isLoadingProducts: boolean;
  productsError: string;
  cart: CartItem[];
  onAddToCart: (product: StoreProduct) => void;
  onCheckout: () => void;
  cartCount: number;
  onRemoveItem: (id: number) => void;
}

function Shop({ isDarkMode, products, canEditStore, onProductsChange, isLoadingProducts, productsError, cart, onAddToCart, onCheckout, cartCount, onRemoveItem }: ShopProps) {
  const [activeProductId, setActiveProductId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draftProducts, setDraftProducts] = useState<StoreProduct[]>([]);
  const [isSavingProducts, setIsSavingProducts] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    setDraftProducts(products);
  }, [products]);

  const handleProductClick = (product: StoreProduct) => {
    setActiveProductId(product.id);
    onAddToCart(product);
    window.setTimeout(() => setActiveProductId(null), 260);
  };

  const handleDraftChange = (id: number, field: 'name' | 'price' | 'image' | 'description', value: string) => {
    setDraftProducts((prev) =>
      prev.map((item) => {
        if (item.id !== id) {
          return item;
        }

        if (field === 'price') {
          return { ...item, price: Number(value || 0) };
        }

        return { ...item, [field]: value };
      })
    );
  };

  const handleSaveProducts = async () => {
    setIsSavingProducts(true);
    setSaveMessage('');

    for (const product of draftProducts) {
      const { error } = await supabase
        .from('products')
        .update({
          name: product.name,
          price: product.price,
          image: product.image,
          description: product.description,
        })
        .eq('id', product.id);

      if (error) {
        setSaveMessage(`Error al guardar: ${error.message}`);
        setIsSavingProducts(false);
        return;
      }
    }

    onProductsChange(draftProducts);
    setSaveMessage('Cambios guardados.');
    setIsSavingProducts(false);
    setIsEditing(false);
  };

  const handleAddProduct = async () => {
    setIsSavingProducts(true);
    setSaveMessage('');

    const { data, error } = await supabase
      .from('products')
      .insert({
        name: 'Nuevo producto',
        price: 0,
        image: '',
        description: '',
      })
      .select('id, name, price, image, description')
      .single();

    if (error || !data) {
      setSaveMessage(`Error al crear: ${error?.message ?? 'desconocido'}`);
      setIsSavingProducts(false);
      return;
    }

    const createdProduct: StoreProduct = {
      id: Number(data.id),
      name: String(data.name ?? ''),
      price: Number(data.price ?? 0),
      image: String(data.image ?? ''),
      description: String(data.description ?? ''),
    };

    const nextProducts = [...draftProducts, createdProduct];
    setDraftProducts(nextProducts);
    onProductsChange(nextProducts);
    setSaveMessage('Producto creado.');
    setIsSavingProducts(false);
  };

  const handleDeleteProduct = async (id: number) => {
    const shouldDelete = window.confirm('Seguro que quieres eliminar este producto? Esta accion no se puede deshacer.');

    if (!shouldDelete) {
      return;
    }

    setIsSavingProducts(true);
    setSaveMessage('');

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      setSaveMessage(`Error al eliminar: ${error.message}`);
      setIsSavingProducts(false);
      return;
    }

    const nextProducts = draftProducts.filter((item) => item.id !== id);
    setDraftProducts(nextProducts);
    onProductsChange(nextProducts);
    onRemoveItem(id);
    setSaveMessage('Producto eliminado.');
    setIsSavingProducts(false);
  };

  return (
    <div className="w-full max-w-7xl px-2 md:px-0">
      <div className="flex items-center justify-between mb-10 md:mb-14">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-6xl font-light tracking-[0.15em] uppercase"
          style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
        >
          Shop
        </motion.h2>
        <p className={`text-[10px] md:text-xs tracking-[0.2em] uppercase ${isDarkMode ? 'opacity-60' : 'opacity-70'}`}>
          {cartCount} item{cartCount === 1 ? '' : 's'}
        </p>
      </div>

      {canEditStore && (
        <div className="mb-8 border border-white/20 p-4 md:p-5 bg-black/20">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] md:text-xs tracking-[0.12em] uppercase opacity-80">Modo editor de tienda</p>
              <p className="text-[11px] md:text-xs opacity-60 mt-1">Edita nombre, precio, imagen y descripcion corta de cada producto.</p>
            </div>
            <motion.button
              type="button"
              onClick={() => setIsEditing((prev) => !prev)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="text-[10px] md:text-xs font-bold tracking-[0.1em] uppercase py-2 px-3 border border-white/30 hover:border-white hover:bg-white hover:text-black transition-all duration-300"
            >
              {isEditing ? 'Cancelar' : 'Editar productos'}
            </motion.button>
          </div>

          {isEditing && (
            <div className="mt-4 space-y-3">
              <motion.button
                type="button"
                onClick={() => void handleAddProduct()}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                disabled={isSavingProducts}
                className="text-[10px] md:text-xs font-bold tracking-[0.1em] uppercase py-2.5 px-4 border border-white/30 hover:border-white hover:bg-white hover:text-black transition-all duration-300 disabled:opacity-50"
              >
                Agregar producto
              </motion.button>

              {draftProducts.map((product) => (
                <div key={product.id} className="border border-white/15 p-3 md:p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] md:text-xs tracking-[0.12em] uppercase opacity-70">Producto #{product.id}</p>
                    <motion.button
                      type="button"
                      onClick={() => void handleDeleteProduct(product.id)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isSavingProducts}
                      className="text-[10px] md:text-xs font-bold tracking-[0.1em] uppercase py-2 px-3 border border-red-300/50 text-red-300 hover:bg-red-400 hover:text-black transition-all duration-300 disabled:opacity-50"
                    >
                      Eliminar
                    </motion.button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="text-[10px] tracking-[0.1em] uppercase opacity-70">
                      Nombre
                      <input
                        type="text"
                        value={product.name}
                        onChange={(event) => handleDraftChange(product.id, 'name', event.target.value)}
                        placeholder="Nombre"
                        className="mt-1 w-full text-xs py-2 px-3 border border-white/25 bg-black/60 text-white placeholder:opacity-50 focus:outline-none"
                      />
                    </label>

                    <label className="text-[10px] tracking-[0.1em] uppercase opacity-70">
                      Precio
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={product.price}
                        onChange={(event) => handleDraftChange(product.id, 'price', event.target.value)}
                        placeholder="Precio"
                        className="mt-1 w-full text-xs py-2 px-3 border border-white/25 bg-black/60 text-white placeholder:opacity-50 focus:outline-none"
                      />
                    </label>
                  </div>

                  <label className="block text-[10px] tracking-[0.1em] uppercase opacity-70">
                    URL imagen
                    <input
                      type="text"
                      value={product.image}
                      onChange={(event) => handleDraftChange(product.id, 'image', event.target.value)}
                      placeholder="https://..."
                      className="mt-1 w-full text-xs py-2 px-3 border border-white/25 bg-black/60 text-white placeholder:opacity-50 focus:outline-none"
                    />
                  </label>

                  <label className="block text-[10px] tracking-[0.1em] uppercase opacity-70">
                    Descripcion corta
                    <textarea
                      value={product.description}
                      onChange={(event) => handleDraftChange(product.id, 'description', event.target.value)}
                      placeholder="Descripcion breve para la tarjeta del producto"
                      rows={2}
                      className="mt-1 w-full text-xs py-2 px-3 border border-white/25 bg-black/60 text-white placeholder:opacity-50 focus:outline-none resize-y"
                    />
                  </label>
                </div>
              ))}

              <motion.button
                type="button"
                onClick={() => void handleSaveProducts()}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                disabled={isSavingProducts}
                className="text-[10px] md:text-xs font-bold tracking-[0.1em] uppercase py-2.5 px-4 border border-white hover:bg-white hover:text-black transition-all duration-300 disabled:opacity-50"
              >
                {isSavingProducts ? 'Guardando...' : 'Guardar cambios'}
              </motion.button>

              {saveMessage && <p className="text-xs opacity-80">{saveMessage}</p>}
            </div>
          )}
        </div>
      )}

      {cartCount > 0 && (
        <motion.button
          onClick={onCheckout}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`fixed left-1/2 -translate-x-1/2 bottom-[calc(env(safe-area-inset-bottom)+3.75rem)] md:left-auto md:translate-x-0 md:bottom-auto md:top-6 md:left-6 z-[9998] text-[10px] md:text-xs font-bold tracking-[0.1em] uppercase py-2 px-3 md:py-2.5 md:px-4 border transition-all duration-300 ${
            isDarkMode
              ? 'border-white/30 bg-black/85 hover:border-white hover:bg-white hover:text-black'
              : 'border-black/30 bg-white/90 hover:border-black hover:bg-black hover:text-white'
          }`}
        >
          Checkout ({cartCount})
        </motion.button>
      )}

      {isLoadingProducts && (
        <p className="text-xs tracking-[0.12em] uppercase opacity-70 mb-6">Cargando productos...</p>
      )}

      {productsError && (
        <p className="text-xs text-red-400 mb-6">{productsError}</p>
      )}

      {!isLoadingProducts && !productsError && products.length === 0 && (
        <p className="text-xs tracking-[0.12em] uppercase opacity-70 mb-6">No hay productos en la base de datos.</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 w-full">
        {products.map((product, index) => {
          const inCart = cart.find((item) => item.id === product.id)?.quantity || 0;
          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col"
            >
              <motion.button
                type="button"
                onClick={() =>
                  handleProductClick({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    description: product.description,
                  })
                }
                whileTap={{ scale: 0.96 }}
                animate={activeProductId === product.id ? { scale: [1, 1.04, 0.98, 1] } : undefined}
                transition={{ duration: 0.24, ease: 'easeOut' }}
                className="w-full text-left"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full aspect-square mb-4 rounded-sm object-cover transition-opacity duration-300 hover:opacity-85"
                  loading="lazy"
                />
              </motion.button>
              <div className="flex flex-col gap-2">
                <h3 className="text-xs md:text-sm font-light tracking-[0.08em] uppercase">
                  {product.name}
                </h3>
                {product.description && (
                  <p className={`text-[11px] md:text-xs leading-relaxed ${isDarkMode ? 'opacity-65' : 'opacity-70'}`}>
                    {product.description}
                  </p>
                )}
                <p className={`text-xs md:text-sm font-light ${isDarkMode ? 'opacity-60' : 'opacity-70'}`}>
                  ${product.price.toFixed(2)}
                </p>
                {inCart > 0 && (
                  <p className="text-[10px] font-bold text-blue-500">In Cart: {inCart}</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

interface CheckoutProps {
  isDarkMode: boolean;
  cart: CartItem[];
  onBack: () => void;
  onRemoveItem: (id: number) => void;
  onUpdateQuantity: (id: number, quantity: number) => void;
}

function Checkout({ isDarkMode, cart, onBack, onRemoveItem, onUpdateQuantity }: CheckoutProps) {
  const [step, setStep] = useState<'cart' | 'payment' | 'confirmation'>('cart');
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    zipCode: '',
    cardNumber: '',
    expiry: '',
    cvc: '',
  });

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 100 ? 0 : 10;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = () => {
    if (
      !formData.email ||
      !formData.firstName ||
      !formData.address ||
      !formData.city ||
      !formData.zipCode ||
      !formData.cardNumber ||
      !formData.expiry ||
      !formData.cvc
    ) {
      alert('Please fill all fields');
      return;
    }
    setStep('confirmation');
  };

  if (cart.length === 0 && step !== 'confirmation') {
    return (
      <div className="text-center">
        <p className="text-lg font-light mb-6">Your cart is empty</p>
        <motion.button
          onClick={onBack}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`text-[10px] md:text-xs font-bold tracking-[0.1em] uppercase py-3 px-6 border transition-all duration-300 ${
            isDarkMode
              ? 'border-white/30 hover:border-white hover:bg-white hover:text-black'
              : 'border-black/30 hover:border-black hover:bg-black hover:text-white'
          }`}
        >
          Continue Shopping
        </motion.button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      {step === 'cart' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <h2 className="text-4xl md:text-5xl font-light tracking-[0.15em] uppercase text-center mb-12" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
            Order Summary
          </h2>

          <div className="space-y-4 mb-8">
            {cart.map((item) => (
              <div key={item.id} className={`flex justify-between items-center pb-4 border-b ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
                <div className="flex-1">
                  <p className="text-sm font-light tracking-[0.08em] uppercase">{item.name}</p>
                  <p className={`text-xs font-light ${isDarkMode ? 'opacity-60' : 'opacity-70'}`}>
                    ${item.price.toFixed(2)} each
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      className={`w-6 h-6 flex items-center justify-center border text-xs ${
                        isDarkMode ? 'border-white/20' : 'border-black/20'
                      }`}
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      className={`w-6 h-6 flex items-center justify-center border text-xs ${
                        isDarkMode ? 'border-white/20' : 'border-black/20'
                      }`}
                    >
                      +
                    </button>
                  </div>
                  <p className="text-sm font-light w-20 text-right">${(item.price * item.quantity).toFixed(2)}</p>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="text-red-500 hover:opacity-70transition"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className={`space-y-2 pb-8 border-b ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
            <div className="flex justify-between text-sm font-light">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-light">
              <span>Shipping</span>
              <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between text-sm font-light">
              <span>Tax</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-light mt-4">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <motion.button
              onClick={onBack}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 text-[10px] md:text-xs font-bold tracking-[0.1em] uppercase py-3 border transition-all duration-300 ${
                isDarkMode
                  ? 'border-white/30 hover:border-white hover:bg-white hover:text-black'
                  : 'border-black/30 hover:border-black hover:bg-black hover:text-white'
              }`}
            >
              Continue Shopping
            </motion.button>
            <motion.button
              onClick={() => setStep('payment')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 text-[10px] md:text-xs font-bold tracking-[0.1em] uppercase py-3 border transition-all duration-300 ${
                isDarkMode
                  ? 'border-white hover:border-white bg-white text-black hover:bg-white/90'
                  : 'border-black hover:border-black bg-black text-white hover:bg-black/90'
              }`}
            >
              Proceed to Payment
            </motion.button>
          </div>
        </motion.div>
      )}

      {step === 'payment' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <h2 className="text-4xl md:text-5xl font-light tracking-[0.15em] uppercase text-center mb-12" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
            Billing Info
          </h2>

          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleInputChange}
                className={`text-xs py-2 px-3 border tracking-[0.08em] uppercase placeholder:opacity-50 focus:outline-none ${
                  isDarkMode
                    ? 'bg-black border-white/20 text-white'
                    : 'bg-white border-black/20 text-black'
                }`}
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleInputChange}
                className={`text-xs py-2 px-3 border tracking-[0.08em] uppercase placeholder:opacity-50 focus:outline-none ${
                  isDarkMode
                    ? 'bg-black border-white/20 text-white'
                    : 'bg-white border-black/20 text-black'
                }`}
              />
            </div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full text-xs py-2 px-3 border tracking-[0.08em] uppercase placeholder:opacity-50 focus:outline-none ${
                isDarkMode
                  ? 'bg-black border-white/20 text-white'
                  : 'bg-white border-black/20 text-black'
              }`}
            />
            <input
              type="text"
              name="address"
              placeholder="Address"
              value={formData.address}
              onChange={handleInputChange}
              className={`w-full text-xs py-2 px-3 border tracking-[0.08em] uppercase placeholder:opacity-50 focus:outline-none ${
                isDarkMode
                  ? 'bg-black border-white/20 text-white'
                  : 'bg-white border-black/20 text-black'
              }`}
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                name="city"
                placeholder="City"
                value={formData.city}
                onChange={handleInputChange}
                className={`text-xs py-2 px-3 border tracking-[0.08em] uppercase placeholder:opacity-50 focus:outline-none ${
                  isDarkMode
                    ? 'bg-black border-white/20 text-white'
                    : 'bg-white border-black/20 text-black'
                }`}
              />
              <input
                type="text"
                name="zipCode"
                placeholder="ZIP Code"
                value={formData.zipCode}
                onChange={handleInputChange}
                className={`text-xs py-2 px-3 border tracking-[0.08em] uppercase placeholder:opacity-50 focus:outline-none ${
                  isDarkMode
                    ? 'bg-black border-white/20 text-white'
                    : 'bg-white border-black/20 text-black'
                }`}
              />
            </div>
          </div>

          <div className={`mb-8 pb-8 border-t border-b pt-8 ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
            <p className="text-xs font-light tracking-[0.08em] uppercase mb-4 opacity-70">Card Details (Test: 4532111111111111)</p>
            <div className="space-y-4">
              <input
                type="text"
                name="cardNumber"
                placeholder="Card Number"
                value={formData.cardNumber}
                onChange={handleInputChange}
                maxLength={19}
                className={`w-full text-xs py-2 px-3 border tracking-[0.08em] uppercase placeholder:opacity-50 focus:outline-none ${
                  isDarkMode
                    ? 'bg-black border-white/20 text-white'
                    : 'bg-white border-black/20 text-black'
                }`}
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="expiry"
                  placeholder="MM/YY"
                  value={formData.expiry}
                  onChange={handleInputChange}
                  maxLength={5}
                  className={`text-xs py-2 px-3 border tracking-[0.08em] uppercase placeholder:opacity-50 focus:outline-none ${
                    isDarkMode
                      ? 'bg-black border-white/20 text-white'
                      : 'bg-white border-black/20 text-black'
                  }`}
                />
                <input
                  type="text"
                  name="cvc"
                  placeholder="CVC"
                  value={formData.cvc}
                  onChange={handleInputChange}
                  maxLength={4}
                  className={`text-xs py-2 px-3 border tracking-[0.08em] uppercase placeholder:opacity-50 focus:outline-none ${
                    isDarkMode
                      ? 'bg-black border-white/20 text-white'
                      : 'bg-white border-black/20 text-black'
                  }`}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <motion.button
              onClick={() => setStep('cart')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 text-[10px] md:text-xs font-bold tracking-[0.1em] uppercase py-3 border transition-all duration-300 ${
                isDarkMode
                  ? 'border-white/30 hover:border-white hover:bg-white hover:text-black'
                  : 'border-black/30 hover:border-black hover:bg-black hover:text-white'
              }`}
            >
              Back
            </motion.button>
            <motion.button
              onClick={handlePlaceOrder}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 text-[10px] md:text-xs font-bold tracking-[0.1em] uppercase py-3 border transition-all duration-300 ${
                isDarkMode
                  ? 'border-white hover:border-white bg-white text-black hover:bg-white/90'
                  : 'border-black hover:border-black bg-black text-white hover:bg-black/90'
              }`}
            >
              Place Order (${total.toFixed(2)})
            </motion.button>
          </div>
        </motion.div>
      )}

      {step === 'confirmation' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center py-12"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="text-6xl mb-8"
          >
            ✓
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-light tracking-[0.15em] uppercase mb-4" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
            Order Confirmed
          </h2>
          <p className={`text-sm font-light mb-8 ${isDarkMode ? 'opacity-70' : 'opacity-70'}`}>
            A confirmation email has been sent to {formData.email}
          </p>
          <p className="text-2xl font-light tracking-[0.1em] uppercase mb-12">Order Total: ${total.toFixed(2)}</p>
          <motion.button
            onClick={() => onBack()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`text-[10px] md:text-xs font-bold tracking-[0.1em] uppercase py-3 px-8 border transition-all duration-300 ${
              isDarkMode
                ? 'border-white/30 hover:border-white hover:bg-white hover:text-black'
                : 'border-black/30 hover:border-black hover:bg-black hover:text-white'
            }`}
          >
            Continue Shopping
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
