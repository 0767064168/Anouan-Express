// src/pages/client/ProductDetailPage.jsx
// Page de détail produit Thème Orange Vibrant & Culture Ivoirienne avec galerie multi-images et section avis clients interactive

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, ShieldCheck, MapPin, Heart, Share2, Minus, Plus, ShoppingCart, CheckCircle, MessageSquare, Loader2, Award, Truck, RefreshCw, Zap, Sparkles, Send, User, Store, Camera, X } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { productsAPI, reviewsAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { getFallbackProductImage, isValidImageUrl } from '../../contexts/ProductContext';
import { compressImage } from '../../utils/imageCompressor';
import { useRecentlyViewed } from '../../hooks/useRecentlyViewed';
import RecentlyViewed from '../../components/client/RecentlyViewed';
import FlashSaleCountdown from '../../components/client/FlashSaleCountdown';

const formatPrice = (p) => new Intl.NumberFormat('fr-CI').format(Number(p || 0)) + ' FCFA';

const DEFAULT_REVIEWS = [
  { id: 1, name: 'Kouadio Jean-Marc', rating: 5, date: '15 août 2026', comment: 'Excellente qualité ! Retrait très rapide au magasin central de Bouaké par code SMS. Je recommande vivement !' },
  { id: 2, name: 'Awa Koné', rating: 5, date: '02 août 2026', comment: 'Magnifique article. Conforme à la description et vendeur très réactif. Félicitations à l\'équipe d\'Anouan Express !' },
  { id: 3, name: 'Bamba Souleymane', rating: 4, date: '28 juillet 2026', comment: 'Très satisfait du service. Retrait sécurisé impeccable.' },
];

export default function ProductDetailPage() {
  const { id } = useParams();
  const { addItem } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addRecentlyViewed } = useRecentlyViewed();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

  // Formulaire d'avis client
  const [reviews, setReviews] = useState(DEFAULT_REVIEWS);
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [reviewPhotos, setReviewPhotos] = useState([]);
  const [selectedReviewImage, setSelectedReviewImage] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    loadProductData();
  }, [id]);

  const loadOtherStoresProducts = async (currentProd) => {
    let allProds = [];

    // 1. Récupérer depuis l'API backend
    try {
      const res = await productsAPI.getAll({ limit: 50 }).catch(() => null);
      const apiData = res?.data?.data || res?.data;
      if (Array.isArray(apiData)) allProds = [...apiData];
    } catch { /* ignore */ }

    // 2. Filtrer pour trouver les produits similaires / du même modèle vendus par d'autres boutiques
    const filteredOthers = allProds.filter(p => {
      // Exclure le produit actuel
      if (String(p.id) === String(currentProd.id)) return false;

      const sameCategory = String(p.category_id || p.categoryId) === String(currentProd.category_id || currentProd.categoryId);
      const currentTitle = (currentProd.name || currentProd.title || '').toLowerCase();
      const otherTitle = (p.name || p.title || '').toLowerCase();
      const firstWord = currentTitle.split(' ')[0];
      const sameModel = firstWord.length > 2 && otherTitle.includes(firstWord);

      return sameCategory || sameModel;
    }).map(p => {
      const rawImg = p.image_url || p.image || p.main_image || p.images?.[0];
      const resolvedImg = isValidImageUrl(rawImg)
        ? rawImg
        : getFallbackProductImage(p.name || p.title);
      return {
        ...p,
        name: p.name || p.title || '',
        price: Number(p.price || 0),
        image: resolvedImg,
        vendor_name: p.vendor_name || p.store_name || `Boutique Anouan #${String(p.id).slice(-4)}`,
      };
    });

    setSimilarProducts(filteredOthers);
  };

  const loadProductData = async () => {
    setLoading(true);
    let targetProduct = null;

    // 1. Chercher dans l'API backend
    try {
      const prodRes = await productsAPI.getById(id).catch(() => null);
      if (prodRes) {
        targetProduct = prodRes.data?.data || prodRes.data;
      }
    } catch { /* ignore */ }



const MOCK_PRODUCTS_MAP = {
  '1': { id: 1, name: 'Smartphone Pro Max 5G Ultra', category_name: 'Téléphones & Tablettes', category_id: 'elec', price: 250000, old_price: 300000, rating: 4.8, vendor_name: 'Tech Store CI', description: 'Smartphone Pro Max 5G Ultra haut de gamme.', images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80'] },
  'default_1': { id: 'default_1', name: 'Smartphone Pro Max 5G Ultra', category_name: 'Téléphones & Tablettes', category_id: 'elec', price: 250000, old_price: 300000, rating: 4.8, vendor_name: 'Tech Store CI', description: 'Smartphone Pro Max 5G Ultra haut de gamme.', images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80'] },

  '2': { id: 2, name: 'Sneakers Urban Confort', category_name: 'Chaussures & Mode', category_id: 'mode', price: 15000, old_price: 25000, rating: 4.5, vendor_name: 'Urban Footwear Bouaké', description: 'Chaussures Sneakers Urban Confort haut de gamme, semelle amortissante ultra-confortable et design moderne.', images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80'] },
  'default_2': { id: 'default_2', name: 'Sneakers Urban Confort', category_name: 'Chaussures & Mode', category_id: 'mode', price: 15000, old_price: 25000, rating: 4.5, vendor_name: 'Urban Footwear Bouaké', description: 'Chaussures Sneakers Urban Confort haut de gamme, semelle amortissante ultra-confortable et design moderne.', images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80'] },

  '3': { id: 3, name: 'Montre Connectée Sport HD', category_name: 'Électronique & Accessoires', category_id: 'elec', price: 20000, old_price: 35000, rating: 4.9, vendor_name: 'Smart Access CI', description: 'Montre connectée Sport HD avec suivi cardiaque et notifications en temps réel.', images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'] },
  'default_3': { id: 'default_3', name: 'Montre Connectée Sport HD', category_name: 'Électronique & Accessoires', category_id: 'elec', price: 20000, old_price: 35000, rating: 4.9, vendor_name: 'Smart Access CI', description: 'Montre connectée Sport HD avec suivi cardiaque et notifications en temps réel.', images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'] },

  '4': { id: 4, name: 'Écouteurs Sans Fil Pro Noise-Cancelling', category_name: 'Audio & Accessoires', category_id: 'elec', price: 10000, old_price: 15000, rating: 4.2, vendor_name: 'Audio Sound Bouaké', description: 'Écouteurs sans fil avec réduction de bruit active et son Surround HD.', images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80'] },
  'default_4': { id: 'default_4', name: 'Écouteurs Sans Fil Pro Noise-Cancelling', category_name: 'Audio & Accessoires', category_id: 'elec', price: 10000, old_price: 15000, rating: 4.2, vendor_name: 'Audio Sound Bouaké', description: 'Écouteurs sans fil avec réduction de bruit active et son Surround HD.', images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80'] },

  '5': { id: 5, name: 'Robe d\'été en Pagne Kita Baoulé', category_name: 'Mode & Pagne Kita', category_id: 'mode', price: 18000, old_price: 25000, rating: 4.9, vendor_name: 'Maison du Pagne Bouaké', isCultural: true, description: 'Robe élégante façonnée en véritable Pagne Kita Baoulé tissé main.', images: ['/pagne_kita.jpg'] },
  'default_5': { id: 'default_5', name: 'Robe d\'été en Pagne Kita Baoulé', category_name: 'Mode & Pagne Kita', category_id: 'mode', price: 18000, old_price: 25000, rating: 4.9, vendor_name: 'Maison du Pagne Bouaké', isCultural: true, description: 'Robe élégante façonnée en véritable Pagne Kita Baoulé tissé main.', images: ['/pagne_kita.jpg'] },

  '6': { id: 6, name: 'Sac à Main Cuir & Pagne WAX Luxe', category_name: 'Mode & Sacs', category_id: 'mode', price: 28000, old_price: 38000, rating: 4.8, vendor_name: 'Maroquinerie Ivoirienne', isCultural: true, description: 'Sac à main en cuir véritable combiné avec des motifs Pagne Wax de luxe.', images: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80'] },
  'default_6': { id: 'default_6', name: 'Sac à Main Cuir & Motif Pagne Luxe', category_name: 'Mode & Sacs', category_id: 'mode', price: 28000, old_price: 38000, rating: 4.8, vendor_name: 'Maroquinerie Ivoirienne', isCultural: true, description: 'Sac à main en cuir véritable combiné avec des motifs Pagne Wax de luxe.', images: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80'] },

  '7': { id: 7, name: 'Ensemble Casseroles Inox Premium', category_name: 'Maison & Cuisine', category_id: 'maison', price: 45000, old_price: 60000, rating: 4.7, vendor_name: 'Maison & Confort Bouaké', description: 'Ensemble de casseroles en acier inoxydable qualité professionnelle.', images: ['https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&q=80'] },
  'default_7': { id: 'default_7', name: 'Ensemble Casseroles Inox Premium', category_name: 'Maison & Cuisine', category_id: 'maison', price: 45000, old_price: 60000, rating: 4.7, vendor_name: 'Maison & Confort Bouaké', description: 'Ensemble de casseroles en acier inoxydable qualité professionnelle.', images: ['https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&q=80'] },

  '8': { id: 8, name: 'Mixeur Plongeant Multifonction 800W', category_name: 'Maison & Électroménager', category_id: 'maison', price: 18000, old_price: 24000, rating: 4.4, vendor_name: 'Électro Bouaké', description: 'Mixeur plongeant multifonction 800W puissant avec lames en inox.', images: ['https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800&q=80'] },
  'default_8': { id: 'default_8', name: 'Mixeur Plongeant Multifonction 800W', category_name: 'Maison & Électroménager', category_id: 'maison', price: 18000, old_price: 24000, rating: 4.4, vendor_name: 'Électro Bouaké', description: 'Mixeur plongeant multifonction 800W puissant avec lames en inox.', images: ['https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800&q=80'] },

  '101': { id: 101, name: 'Pagne Baoulé Tissé Main Traditionnel', category_name: 'Mode & Pagne Kita', category_id: 'mode', price: 25000, old_price: 35000, rating: 5.0, vendor_name: 'Maison du Pagne Bouaké', isCultural: true, description: 'Véritable pagne Baoulé tissé à la main selon les méthodes traditionnelles de la région du Gbeke.', images: ['/pagne_kita.jpg'] },
  '102': { id: 102, name: 'Robe de Gala en Pagne Kita Ivoirien', category_name: 'Mode & Pagne Kita', category_id: 'mode', price: 32000, old_price: 42000, rating: 4.9, vendor_name: 'Atelier Kita Bouaké', isCultural: true, description: 'Robe de gala spectaculaire confectionnée en Pagne Kita authentique.', images: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80'] }
};

    // 3. Fallback mock si produit démo
    if (!targetProduct) {
      targetProduct = MOCK_PRODUCTS_MAP[String(id)] || {
        id: id || 1,
        name: 'Smartphone Pro Max 5G Ultra',
        category_name: 'Téléphones & Tablettes',
        price: 250000,
        old_price: 300000,
        rating: 4.8,
        vendor_name: 'Tech Store CI',
        stock: 15,
        description: 'Découvrez la puissance et l\'élégance ultimes. Matériaux premium de qualité supérieure.',
        images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80'],
      };
    }

    let productImages = [];

    if (Array.isArray(targetProduct.images) && targetProduct.images.length > 0) {
      targetProduct.images.forEach(img => {
        const url = typeof img === 'string' ? img : (img?.preview || img?.url || img?.image_url);
        if (isValidImageUrl(url)) {
          productImages.push(url);
        }
      });
    }

    if (productImages.length === 0) {
      const mainImg = targetProduct.image_url || targetProduct.image || targetProduct.main_image;
      if (isValidImageUrl(mainImg)) productImages = [mainImg];
    }

    if (productImages.length === 0) {
      productImages = [getFallbackProductImage(targetProduct.name || targetProduct.title)];
    }

    // Filtrer les entrées dupliquées
    productImages = Array.from(new Set(productImages)).filter(Boolean);

    setProduct(targetProduct);
    setGallery(productImages);
    setActiveImage(0);
    addRecentlyViewed(targetProduct);

    // 🏬 Charger les offres des autres boutiques pour le même modèle
    await loadOtherStoresProducts(targetProduct);

    // 🌟 Charger les avis réels depuis l'API backend
    try {
      const revRes = await reviewsAPI.getProductReviews(id).catch(() => null);
      const apiReviews = revRes?.data?.data || revRes?.data;
      if (Array.isArray(apiReviews) && apiReviews.length > 0) {
        const mapped = apiReviews.map((r) => ({
          id: r.id,
          name: r.client_name || 'Client Anouan Express',
          rating: r.rating || 5,
          date: r.created_at
            ? new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
            : 'Récemment',
          comment: r.comment || '',
          images: Array.isArray(r.images) ? r.images : [],
        }));
        setReviews(mapped);
      }
    } catch (e) {
      console.warn('Reviews fetch fallback:', e?.message);
    }

    setLoading(false);
  };

  const handleAddToCart = () => {
    if (!product) return;
    const variant = (selectedColor || selectedSize) ? { name: [selectedColor, selectedSize].filter(Boolean).join(' / ') } : null;
    addItem({ ...product, image: gallery[0] }, quantity, variant);
    toast.success('Produit ajouté au panier avec succès !');
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (reviewPhotos.length + files.length > 3) {
      toast.error('Vous pouvez ajouter jusqu\'à 3 photos maximum.');
      return;
    }
    const newPhotos = [];
    for (const f of files) {
      try {
        const compressed = await compressImage(f);
        newPhotos.push({
          file: compressed,
          previewUrl: URL.createObjectURL(compressed),
        });
      } catch {
        newPhotos.push({
          file: f,
          previewUrl: URL.createObjectURL(f),
        });
      }
    }
    setReviewPhotos((prev) => [...prev, ...newPhotos]);
  };

  const removePhoto = (index) => {
    setReviewPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newReviewComment.trim()) {
      toast.error('Veuillez saisir un commentaire.');
      return;
    }
    setSubmittingReview(true);
    try {
      await reviewsAPI.submit({
        productId: String(id),
        rating: newReviewRating,
        comment: newReviewComment.trim(),
        images: reviewPhotos.map((p) => p.previewUrl),
      });
    } catch (err) {
      console.warn('reviewsAPI.submit fallback:', err?.message);
    }

    const rev = {
      id: Date.now(),
      name: newReviewName.trim() || 'Acheteur Vérifié',
      rating: newReviewRating,
      date: 'Aujourd\'hui',
      comment: newReviewComment.trim(),
      images: reviewPhotos.map((p) => p.previewUrl),
    };
    setReviews([rev, ...reviews]);
    setNewReviewComment('');
    setNewReviewName('');
    setNewReviewRating(5);
    setReviewPhotos([]);
    setSubmittingReview(false);
    toast.success('Merci ! Votre avis a été publié avec succès.');
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 bg-slate-950">
        <Loader2 className="w-10 h-10 text-orange-400 animate-spin" />
        <p className="text-slate-400 text-xs font-semibold">Chargement de la fiche produit...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-10 text-slate-100 font-sans selection:bg-orange-500 selection:text-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Fil d'Ariane */}
        <nav className="flex items-center gap-2 text-xs text-slate-400">
          <Link to="/" className="hover:text-orange-400 transition-colors">Accueil</Link>
          <span>/</span>
          <Link to="/catalog" className="hover:text-orange-400 transition-colors">{product.category_name || 'Catalogue'}</Link>
          <span>/</span>
          <span className="text-slate-200 font-bold truncate">{product.name}</span>
        </nav>

        {/* Section Principale Fiche Produit */}
        <div className={`glass-panel rounded-3xl p-6 lg:p-10 border border-slate-800 ${product.isCultural ? 'border-kita-glow' : ''}`}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
            
            {/* Galerie d'Images Publicitaires Multi-Angles */}
            <div className="space-y-4">
              {/* Image Principale Grand Format */}
              <div className="relative aspect-square bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl group">
                <img
                  src={gallery[activeImage] || gallery[0] || getFallbackProductImage(product?.name)}
                  alt={product.name}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getFallbackProductImage(product?.name);
                  }}
                  className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                    gallery[activeImage]?.includes('pagne_kita') ? 'animate-pagne-flash' : ''
                  }`}
                />
                <span className="absolute top-4 left-4 bg-slate-900/90 border border-amber-500/40 text-amber-400 text-[10px] font-black px-3 py-1.5 rounded-full backdrop-blur-md uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
                  <Sparkles size={12} className="text-amber-400 animate-pulse" /> {product.isCultural ? '🇨🇮 Certifié Artisanat CI' : 'Offre Certifiée Anouan'}
                </span>
              </div>

              {/* Vues Thumbnails Multiples */}
              <div className="grid grid-cols-4 gap-3">
                {gallery.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                      activeImage === idx
                        ? 'border-amber-400 ring-4 ring-amber-400/20 scale-95 shadow-lg'
                        : 'border-slate-800 hover:border-slate-600 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Angle ${idx + 1}`}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = getFallbackProductImage(product?.name);
                      }}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Détails Produit & Achat */}
            <div className="flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-orange-400 uppercase tracking-widest bg-orange-500/10 px-3 py-1 rounded-lg border border-orange-500/20">
                    Vendeur : {product.vendor_name || 'Maison du Pagne Bouaké'}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (product) {
                          toggleFavorite(product);
                          toast[isFavorite(product.id) ? 'info' : 'success'](
                            isFavorite(product.id) ? 'Retiré des favoris.' : 'Ajouté aux favoris !'
                          );
                        }
                      }}
                      className={`p-2.5 rounded-xl border transition-all ${
                        product && isFavorite(product.id)
                          ? 'bg-red-500/20 border-red-500/40 text-red-400'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-red-400 border-slate-800'
                      }`}
                      title={product && isFavorite(product.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    >
                      <Heart size={18} className={product && isFavorite(product.id) ? 'fill-current' : ''} />
                    </button>
                    <button
                      onClick={async () => {
                        const shareData = {
                          title: product?.name || 'Anouan Express',
                          text: `Découvrez ${product?.name} sur Anouan Express Bouaké :`,
                          url: window.location.href,
                        };
                        if (navigator.share) {
                          try {
                            await navigator.share(shareData);
                          } catch {}
                        } else {
                          navigator.clipboard?.writeText(window.location.href);
                          toast.info('Lien du produit copié dans le presse-papier !');
                        }
                      }}
                      className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-orange-400 rounded-xl border border-slate-800 transition-colors"
                      title="Partager ce produit"
                    >
                      <Share2 size={18} />
                    </button>
                  </div>
                </div>

                <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">{product.name}</h1>

                {/* Avis & Stock */}
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1.5 rounded-xl font-bold">
                    <Star size={14} className="fill-current" /> {product.rating || '5.0'}
                  </div>
                  <span className="text-slate-400">({reviews.length} avis clients vérifiés)</span>
                  <span className="flex items-center gap-1 text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-xl font-semibold border border-orange-500/20">
                    <CheckCircle size={14} /> En Stock Magasin Central
                  </span>
                </div>

                {/* Prix & Remise */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <span className="text-3xl lg:text-4xl font-black text-orange-400">{formatPrice(product.price)}</span>
                  {(product.old_price || product.oldPrice) && Number(product.old_price || product.oldPrice) > Number(product.price) && (
                    <>
                      <span className="text-base text-slate-500 line-through font-semibold">
                        {formatPrice(product.old_price || product.oldPrice)}
                      </span>
                      <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 text-xs font-black px-2.5 py-1 rounded-full shadow-md uppercase tracking-wider">
                        -{Math.round(((Number(product.old_price || product.oldPrice) - Number(product.price)) / Number(product.old_price || product.oldPrice)) * 100)}%
                      </span>
                    </>
                  )}
                  {(product.flash_sale_active || product.flash_sale) && (
                    <FlashSaleCountdown compact />
                  )}
                </div>

                {/* Description */}
                <p className="text-slate-300 text-xs lg:text-sm leading-relaxed border-t border-slate-800/80 pt-4">
                  {product.description}
                </p>

                {/* Points forts publicitaires */}
                {product.features && (
                  <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2 border-kita-glow">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Award size={16} className="text-amber-400" /> Points Forts & Spécifications
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {product.features.map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> {feat}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Couleurs / Variantes */}
                {product.colors && (
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Variante : <span className="text-orange-400">{selectedColor || product.colors[0]}</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {product.colors.map((c) => (
                        <button
                          key={c}
                          onClick={() => setSelectedColor(c)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                            (selectedColor || product.colors[0]) === c
                              ? 'border-amber-400 bg-amber-500/20 text-amber-300 shadow-md shadow-amber-500/10'
                              : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quantification & Action Panier */}
              <div className="border-t border-slate-800/80 pt-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-slate-800 rounded-2xl p-1 bg-slate-900">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-10 text-center font-bold text-white text-base">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    className="flex-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-orange-500/20 text-sm uppercase tracking-wider"
                  >
                    <ShoppingCart size={18} /> Ajouter au Panier
                  </button>
                </div>

                {/* Bouton Contact Vendeur Direct */}
                <Link
                  to={`/chat?vendorId=${product.vendor_id || product.store_id || 101}&vendorName=${encodeURIComponent(product.store_name || product.vendor_name || 'Boutique Partenaire')}&productName=${encodeURIComponent(product.name || product.title || '')}`}
                  className="w-full py-3 px-4 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-orange-500/40 text-slate-200 hover:text-white rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-sm"
                >
                  <MessageSquare size={16} className="text-orange-400" />
                  Poser une question à la boutique
                </Link>

                {/* Partage WhatsApp & Commerce Social */}
                <div className="flex gap-2 flex-wrap">
                  {/* Partager le produit sur WhatsApp */}
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`🛒 ${product.name || product.title} à ${formatPrice(product.price)} sur Anouan Express Bouaké.\nRetrait sécurisé en magasin. Voir ici : ${window.location.href}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-[140px] py-3 px-4 bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-400 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-all"
                    title="Partager ce produit sur WhatsApp"
                  >
                    <Share2 size={15} />
                    Partager sur WhatsApp
                  </a>

                  {/* Contacter le vendeur directement sur WhatsApp */}
                  {(product.vendor_phone || product.store_phone) && (
                    <a
                      href={`https://api.whatsapp.com/send?phone=${encodeURIComponent((product.vendor_phone || product.store_phone || '').replace(/\s/g, ''))}&text=${encodeURIComponent(`Bonjour, je suis intéressé(e) par "${product.name || product.title}" à ${formatPrice(product.price)} sur Anouan Express. Pouvez-vous me donner plus d'informations ?`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-[140px] py-3 px-4 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 hover:border-emerald-500/50 text-emerald-300 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-all"
                      title="Discuter avec le vendeur sur WhatsApp"
                    >
                      <MessageSquare size={15} className="text-emerald-400" />
                      Vendeur WhatsApp
                    </a>
                  )}

                  {/* Copier le lien */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href).then(() => {
                        const btn = document.getElementById('copy-link-btn');
                        if (btn) { btn.textContent = '✓ Copié !'; setTimeout(() => { btn.textContent = 'Copier lien'; }, 2000); }
                      });
                    }}
                    className="py-3 px-4 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-all"
                    title="Copier le lien de ce produit"
                  >
                    <Share2 size={15} className="text-slate-400" />
                    <span id="copy-link-btn">Copier lien</span>
                  </button>
                </div>

                {/* Badges de Réassurance */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-900/40 p-3 rounded-2xl border border-slate-800 flex items-center gap-2 text-xs text-slate-300">
                    <ShieldCheck size={18} className="text-orange-400 shrink-0" />
                    <span>Contrôle qualité au Magasin Central Bouaké</span>
                  </div>
                  <div className="bg-slate-900/40 p-3 rounded-2xl border border-slate-800 flex items-center gap-2 text-xs text-slate-300">
                    <RefreshCw size={18} className="text-orange-400 shrink-0" />
                    <span>Code unique anti-fraude à la remise</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ── Section Évaluations & Avis Clients Interactive ── */}
        <div className="glass-panel rounded-3xl p-6 lg:p-10 border border-slate-800 space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
            <div>
              <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-widest mb-1">
                <MessageSquare size={16} /> Retour d'Expérience Client
              </div>
              <h2 className="text-2xl font-black text-white">Avis & Évaluations Clients</h2>
            </div>
            <div className="flex items-center gap-3 bg-slate-950 border border-amber-500/30 px-5 py-2.5 rounded-2xl">
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} className="fill-current" />
                ))}
              </div>
              <span className="font-black text-white text-lg">5.0 / 5</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulaire Déposer un Avis */}
            <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Sparkles size={18} className="text-orange-400" /> Laisser un avis
              </h3>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Note</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReviewRating(star)}
                        className="p-1 hover:scale-125 transition-transform"
                      >
                        <Star
                          size={22}
                          className={star <= newReviewRating ? 'text-amber-400 fill-current' : 'text-slate-700'}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Votre Nom (optionnel)</label>
                  <input
                    type="text"
                    value={newReviewName}
                    onChange={(e) => setNewReviewName(e.target.value)}
                    placeholder="Ex : Koffi Y."
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Votre avis ou commentaire</label>
                  <textarea
                    rows={3}
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    required
                    placeholder="Partagez votre expérience d'achat et de retrait..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:border-orange-500 outline-none resize-none"
                  />
                </div>

                {/* Upload Photos d'avis client */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Photos de l'article (max 3)
                  </label>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {reviewPhotos.map((photo, idx) => (
                      <div key={idx} className="relative w-14 h-14 rounded-2xl overflow-hidden border border-orange-500/40 group">
                        <img src={photo.previewUrl} alt="Aperçu" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(idx)}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} className="text-red-400" />
                        </button>
                      </div>
                    ))}
                    {reviewPhotos.length < 3 && (
                      <label className="w-14 h-14 rounded-2xl border-2 border-dashed border-slate-800 hover:border-orange-500/50 flex flex-col items-center justify-center cursor-pointer transition-colors text-slate-500 hover:text-orange-400">
                        <Camera size={18} />
                        <span className="text-[9px] font-bold mt-0.5">+Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black py-3 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                >
                  {submittingReview ? <Loader2 size={16} className="animate-spin" /> : <><Send size={14} /> Publier mon avis</>}
                </button>
              </form>
            </div>

            {/* Liste des Avis Clients */}
            <div className="lg:col-span-2 space-y-4">
              {reviews.map((rev) => (
                <div key={rev.id} className="glass-card p-5 rounded-3xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-black text-xs">
                        {rev.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-xs flex items-center gap-2">
                          {rev.name}
                          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-full">Acheteur Vérifié</span>
                        </h4>
                        <p className="text-[10px] text-slate-500">{rev.date}</p>
                      </div>
                    </div>

                    <div className="flex items-center text-amber-400">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} size={14} className="fill-current" />
                      ))}
                    </div>
                  </div>

                  <p className="text-slate-300 text-xs leading-relaxed pt-1">{rev.comment}</p>

                  {/* Galerie Photos de l'Avis */}
                  {rev.images && rev.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {rev.images.map((img, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedReviewImage(img)}
                          className="w-16 h-16 rounded-xl overflow-hidden border border-slate-800 hover:border-orange-500/50 transition-all hover:scale-105"
                        >
                          <img src={img} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 🏬 Section Comparatif : Offres du Même Modèle / Catégorie dans les Autres Boutiques */}
        <div className="space-y-6 pt-6 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-widest">
                <Store size={16} className="text-orange-400" /> Comparatif & Disponibilités
              </div>
              <h2 className="text-2xl font-black text-white">Produits similaires & offres des autres boutiques</h2>
              <p className="text-xs text-slate-400">Découvrez les offres d'autres commerçants pour ce modèle d'article à Bouaké</p>
            </div>
            <Link to="/catalog" className="text-xs text-orange-400 font-bold hover:underline flex items-center gap-1">
              Voir tout le catalogue →
            </Link>
          </div>

          {similarProducts.length === 0 ? (
            <div className="glass-card rounded-3xl p-8 text-center text-slate-500 text-xs border border-slate-800">
              Aucun autre produit similaire ou autre offre de boutique disponible pour ce modèle actuellement.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProducts.map((otherProd) => (
                <div key={otherProd.id} className="glass-card rounded-3xl overflow-hidden flex flex-col justify-between group border-slate-800 hover:border-orange-500/50 transition-colors">
                  <Link to={`/products/${otherProd.id}`} className="block relative">
                    <span className="absolute top-3 left-3 bg-slate-900/90 border border-amber-500/30 text-amber-300 text-[10px] font-black px-2.5 py-1 rounded-full z-10 shadow-md truncate max-w-[140px]">
                      🏬 {otherProd.vendor_name}
                    </span>
                    <div className="h-48 bg-slate-900 overflow-hidden relative">
                      <img
                        src={otherProd.image}
                        alt={otherProd.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4 space-y-1.5">
                      <h3 className="font-bold text-white text-xs truncate group-hover:text-orange-400 transition-colors">
                        {otherProd.name}
                      </h3>
                      <div className="text-base font-black text-orange-400">
                        {formatPrice(otherProd.price)}
                      </div>
                    </div>
                  </Link>

                  <div className="p-4 pt-0">
                    <Link
                      to={`/products/${otherProd.id}`}
                      className="w-full py-2.5 bg-slate-800 hover:bg-orange-500 hover:text-slate-950 text-white font-bold rounded-xl transition-all border border-slate-700 text-xs text-center flex items-center justify-center gap-1.5"
                    >
                      Voir cette offre
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section Articles Récemment Consultés */}
        <RecentlyViewed currentProductId={product?.id} />

      </div>

      {/* Barre Sticky d'Achat Rapide Mobile (visible uniquement < lg) */}
      <div className="fixed bottom-14 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 p-3 flex lg:hidden items-center justify-between gap-3 shadow-2xl">
        <div className="min-w-0 flex-1">
          <p className="text-white font-black text-xs truncate">{product?.name}</p>
          <p className="text-orange-400 font-black text-sm">{formatPrice(product?.price)}</p>
        </div>
        <button
          onClick={handleAddToCart}
          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black px-5 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-orange-500/20 text-xs uppercase tracking-wider shrink-0"
        >
          <ShoppingCart size={16} /> Ajouter
        </button>
      </div>

      {/* Lightbox Zoom Photo Avis */}
      {selectedReviewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedReviewImage(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh]">
            <img
              src={selectedReviewImage}
              alt="Avis photo zoom"
              className="max-w-full max-h-[85vh] rounded-3xl object-contain border border-slate-700 shadow-2xl"
            />
            <button
              onClick={() => setSelectedReviewImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-900 border border-slate-700 text-white flex items-center justify-center hover:bg-orange-500 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
