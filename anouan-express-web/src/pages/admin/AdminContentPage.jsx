// src/pages/admin/AdminContentPage.jsx — Dark Premium Orange
import React, { useEffect, useState } from 'react';
import { Image, Plus, Trash2, Edit, Eye, ToggleLeft, ToggleRight, Package } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import { adminAPI } from '../../services/api';

const formatPrice = (p) => new Intl.NumberFormat('fr-CI').format(Number(p || 0)) + ' FCFA';

export default function AdminContentPage() {
  const [contents, setContents] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('contenu');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const bannersRes = await adminAPI.getBanners();
        const banners = bannersRes.data?.data || bannersRes.data || [];
        setContents(Array.isArray(banners)
          ? banners.map((b) => ({
              id: b.id,
              type: 'Bannière Hero',
              title: b.title,
              visible: b.is_active !== false,
              updatedAt: b.updated_at ? new Date(b.updated_at).toLocaleDateString('fr-CI') : 'Aujourd’hui',
            }))
          : []);
      } catch {
        setContents([]);
      }

      try {
        const flashRes = await adminAPI.getFlashSales();
        const flashList = flashRes.data?.data || flashRes.data || [];
        setProducts(Array.isArray(flashList)
          ? flashList.map((f) => ({
              id: f.id,
              name: f.product_title || 'Produit flash',
              category: 'Promotions',
              price: Number(f.flash_price || 0),
              featured: true,
              stock: 10,
            }))
          : []);
      } catch {
        setProducts([]);
      }

      setLoading(false);
    };

    loadData();
  }, []);

  const toggleVisible = async (id) => {
    setActionError('');
    try {
      const response = await adminAPI.toggleBanner(id);
      const banner = response.data?.data || response.data;
      setContents((previous) => previous.map((content) => content.id === id
        ? { ...content, visible: banner?.is_active !== false, updatedAt: banner?.updated_at ? new Date(banner.updated_at).toLocaleDateString('fr-CI') : content.updatedAt }
        : content));
    } catch (error) {
      setActionError(error.response?.data?.message || 'Impossible de modifier la visibilité de cette bannière.');
    }
  };
  const removeFeatured = async (id) => {
    setActionError('');
    try {
      await adminAPI.deleteFlashSale(id);
      setProducts((previous) => previous.filter((product) => product.id !== id));
    } catch (error) {
      setActionError(error.response?.data?.message || 'Impossible de retirer cette promotion.');
    }
  };
  const deleteContent = async (id) => {
    setActionError('');
    try {
      await adminAPI.deleteBanner(id);
      setContents((previous) => previous.filter((content) => content.id !== id));
    } catch (error) {
      setActionError(error.response?.data?.message || 'Impossible de supprimer cette bannière.');
    }
  };

  const tabs = [
    { key: 'contenu',  label: 'Contenu & Pages' },
    { key: 'produits', label: 'Produits Mis en Avant' },
  ];

  return (
    <div className="space-y-6 text-slate-100">
      <PageHeader
        eyebrow="Gestion de la Boutique"
        eyebrowIcon={Image}
        title="Contenu & Magasin"
        subtitle="Gérez les sections de contenu et les produits mis en avant."
        actions={(
          <button className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white text-xs font-bold rounded-2xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20">
            <Plus size={14}/> Nouveau contenu
          </button>
        )}
      />

      {actionError && (
        <div className="px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-bold">
          {actionError}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1.5 bg-slate-900/60 border border-slate-800 p-1.5 rounded-2xl w-fit">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === t.key ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-400 hover:text-white'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenu & Pages */}
      {activeTab === 'contenu' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-2">
            <Image size={14} className="text-orange-400"/>
            <h2 className="text-sm font-black text-white">Sections de Contenu</h2>
          </div>
          {loading ? (
            <div className="p-6 text-xs text-slate-400">Chargement des contenus…</div>
          ) : (
          <div className="divide-y divide-slate-800/60">
            {contents.length === 0 ? (
              <div className="px-6 py-10 text-center text-xs text-slate-500">
                Aucun contenu réel n’est disponible pour le moment.
              </div>
            ) : contents.map((c) => (
              <div key={c.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-800/20 transition-colors">
                <div className={`p-2 rounded-xl border ${c.visible ? 'bg-orange-500/15 border-orange-500/25 text-orange-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                  <Image size={14}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{c.title}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{c.type} · Modifié le {c.updatedAt}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 ${
                  c.visible ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' : 'bg-slate-800 text-slate-500 border-slate-700'
                }`}>
                  {c.visible ? 'Visible' : 'Masqué'}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => toggleVisible(c.id)} title="Basculer visibilité"
                    className="p-1.5 text-slate-500 hover:text-orange-400 hover:bg-orange-500/10 rounded-xl transition-colors">
                    {c.visible ? <ToggleRight size={16} className="text-orange-400"/> : <ToggleLeft size={16}/>}
                  </button>
                  <button className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-colors">
                    <Edit size={14}/>
                  </button>
                  <button onClick={() => deleteContent(c.id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
                    <Trash2 size={14}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      )}

      {/* Produits mis en avant */}
      {activeTab === 'produits' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-2">
            <Package size={14} className="text-orange-400"/>
            <h2 className="text-sm font-black text-white">Produits Mis en Avant (HomePage)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900/80 text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-4 font-bold">Produit</th>
                  <th className="px-5 py-4 font-bold">Catégorie</th>
                  <th className="px-5 py-4 font-bold">Prix</th>
                  <th className="px-5 py-4 font-bold">Stock</th>
                  <th className="px-5 py-4 font-bold">Mis en avant</th>
                  <th className="px-5 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center text-xs text-slate-500">
                      Aucun produit mis en avant n’est disponible pour le moment.
                    </td>
                  </tr>
                ) : products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4 font-bold text-white">{p.name}</td>
                    <td className="px-5 py-4 text-slate-400">{p.category}</td>
                    <td className="px-5 py-4 font-black text-orange-400">{formatPrice(p.price)}</td>
                    <td className="px-5 py-4 text-slate-300">{p.stock} unités</td>
                    <td className="px-5 py-4">
                      <button onClick={() => removeFeatured(p.id)}
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold border bg-orange-500/15 text-orange-400 border-orange-500/25 hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/25 transition-all">
                        Retirer de la une
                      </button>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-colors"><Eye size={14}/></button>
                        <button className="p-1.5 text-slate-500 hover:text-orange-400 hover:bg-orange-500/10 rounded-xl transition-colors"><Edit size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
