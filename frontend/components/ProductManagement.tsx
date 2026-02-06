
import React, { useState, useMemo } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useLanguage } from '../hooks/useLanguage';
import ProductForm from './ProductForm';
import { Product } from '../types';
import AddCategoryModal from './AddCategoryModal';
import { useToast } from '../contexts/ToastContext';
import BulkBarcodeExportModal from './BulkBarcodeExportModal';
import RestockModal from './RestockModal';
import { useAuth } from '../contexts/AuthContext';
import { useStores } from '../contexts/StoreContext';

const ProductManagement: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, addCategory } = useProducts();
  const { t } = useLanguage();
  const { addToast } = useToast();
  const { user } = useAuth();
  const { currentStore } = useStores();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
  const [isBulkExportModalOpen, setIsBulkExportModalOpen] = useState(false);
  const [productToRestock, setProductToRestock] = useState<Product | null>(null);
  
  // Nouvel état pour le filtrage des alertes
  const [filterLowStock, setFilterLowStock] = useState(false);

  const productsWithTotals = useMemo(() => {
    return products.map(p => {
      // Calculer le stock total en fonction du magasin actuel (même logique que ProductCard)
      const total_stock = currentStore 
        ? p.variants.reduce((sum, v) => {
            const storeStock = v.quantityByStore?.[currentStore.id] || 0;
            return sum + storeStock;
          }, 0)
        : p.variants.reduce((sum, v) => {
            // Si pas de magasin sélectionné, additionner tous les stocks des magasins
            const allStoreStocks = Object.values(v.quantityByStore || {}) as number[];
            const totalStoreStock = allStoreStocks.reduce((a, b) => a + b, 0);
            return sum + (totalStoreStock || v.stock_quantity); // Fallback sur stock_quantity si pas de quantityByStore
          }, 0);
      
      return {
        ...p,
        total_stock
      };
    });
  }, [products, currentStore]);

  const getProductStatus = (product: Product, totalStock: number): 'in-stock' | 'low-stock' | 'out-of-stock' => {
    if (totalStock <= 0) return 'out-of-stock';
    const threshold = product.low_stock_threshold ?? 5;
    if (totalStock <= threshold) return 'low-stock';
    return 'in-stock';
  };

  const alertCount = useMemo(() => {
    return productsWithTotals.filter(p => getProductStatus(p, p.total_stock) !== 'in-stock').length;
  }, [productsWithTotals]);

  const sortedProducts = useMemo(() => {
    let items = [...productsWithTotals];
    
    // Appliquer le filtre d'alerte si actif
    if (filterLowStock) {
        items = items.filter(p => getProductStatus(p, p.total_stock) !== 'in-stock');
    }

    if (sortConfig !== null) {
        items.sort((a, b) => {
            const aValue = a[sortConfig.key as keyof typeof a];
            const bValue = b[sortConfig.key as keyof typeof b];

            if (aValue === undefined || aValue === null) return 1;
            if (bValue === undefined || bValue === null) return -1;
            
            // @ts-ignore
            if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
            // @ts-ignore
            if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
    }
    return items;
  }, [productsWithTotals, sortConfig, filterLowStock]);

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return <span className="text-slate-400 dark:text-slate-500">↕</span>;
    return sortConfig.direction === 'ascending' ? '▲' : '▼';
  };

  const handleAdd = () => {
    setProductToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (product: Product) => {
    setProductToEdit(product);
    setIsFormOpen(true);
  };

  const handleDelete = (productId: number) => {
    if (window.confirm(t('confirmDelete'))) {
      deleteProduct(productId);
    }
  };

  const handleSave = (product: Omit<Product, 'id' | 'tenantId'> | Product) => {
    if ('id' in product) {
      updateProduct(product as Product);
    } else if (user) {
      addProduct(product as Omit<Product, 'id' | 'tenantId'>, user);
    }
    setIsFormOpen(false);
    setProductToEdit(null);
  };
  
  const handleSaveCategory = (categoryName: string) => {
    const success = addCategory(categoryName);
    if (success) {
        addToast(t('categoryAddedSuccess'), 'success');
        setIsCategoryModalOpen(false);
    } else {
        addToast(t('categoryExistsError'), 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">{t('products')}</h2>
          {currentStore && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Stock affiché pour : <span className="font-bold text-indigo-600 dark:text-indigo-400">{currentStore.name}</span>
            </p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {/* Bouton Alerte Transformé en Filtre */}
          <button 
            onClick={() => setFilterLowStock(!filterLowStock)} 
            className={`flex items-center space-x-2 px-4 py-2 font-black uppercase text-[10px] tracking-widest rounded-xl transition-all border-2 ${
                filterLowStock 
                ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20' 
                : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-amber-500'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${filterLowStock ? 'animate-pulse' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
            <span className="hidden sm:inline">{filterLowStock ? 'Voir tout' : t('subscribeToAlerts')}</span>
            {alertCount > 0 && !filterLowStock && (
                <span className="ml-1 bg-rose-500 text-white px-1.5 py-0.5 rounded-full text-[8px]">{alertCount}</span>
            )}
          </button>

          <button onClick={() => setIsCategoryModalOpen(true)} className="flex items-center space-x-2 px-4 py-2 bg-slate-500 text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-slate-600 shadow-sm" >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"> <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /> <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /> </svg>
             <span className="hidden sm:inline">{t('addCategory')}</span>
          </button>
          
          <button onClick={() => setIsBulkExportModalOpen(true)} className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-teal-700 shadow-sm" >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M2 6h2v12H2V6zm3 0h1v12H5V6zm2 0h3v12H7V6zm5 0h1v12h-1V6zm2 0h1v12h-1V6zm2 0h3v12h-3V6zm5 0h2v12h-2V6z"/></svg>
            <span className="hidden sm:inline">{t('exportBarcodes')}</span>
          </button>

          <button onClick={handleAdd} className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/20" >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
             <span>{t('addProduct')}</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] uppercase font-black tracking-widest bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
              <tr>
                <th scope="col" className="px-6 py-4">{t('productName')}</th>
                <th scope="col" className="px-6 py-4">{t('category')}</th>
                <th scope="col" className="px-6 py-4">{t('sku')}</th>
                <th scope="col" className="px-6 py-4 text-center">{t('variants')}</th>
                <th scope="col" className="px-6 py-4 text-center"><button onClick={() => requestSort('total_stock')} className="flex items-center gap-2 mx-auto">{t('totalStock')} {getSortIndicator('total_stock')}</button></th>
                <th scope="col" className="px-6 py-4 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {sortedProducts.map(product => {
                const status = getProductStatus(product, product.total_stock);
                const rowClass = {
                    'in-stock': 'bg-white dark:bg-slate-800',
                    'low-stock': 'bg-amber-50 dark:bg-amber-900/10',
                    'out-of-stock': 'bg-red-50 dark:bg-red-900/10',
                }[status];
                
                return (
                  <tr key={product.id} className={`${rowClass} hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors`}>
                    <th scope="row" className="px-6 py-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        <div className="flex items-center gap-4">
                            <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-cover rounded-xl shadow-sm" />
                            <span className="uppercase tracking-tight">{product.name}</span>
                        </div>
                    </th>
                    <td className="px-6 py-4 font-medium text-slate-500">{product.category}</td>
                    <td className="px-6 py-4 text-[10px] font-mono text-slate-400">{product.variants.map(v => v.sku).filter(Boolean).slice(0, 2).join(', ')}{product.variants.length > 2 ? '...' : ''}</td>
                    <td className="px-6 py-4 text-center font-bold text-indigo-600">{product.variants.length}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-black text-slate-900 dark:text-white">{product.total_stock}</span>
                        {status === 'low-stock' && <span className="px-2 py-0.5 text-[8px] font-black uppercase rounded-full bg-amber-100 text-amber-600 border border-amber-200">{t('lowStock')}</span>}
                        {status === 'out-of-stock' && <span className="px-2 py-0.5 text-[8px] font-black uppercase rounded-full bg-red-100 text-red-600 border border-red-200">{t('outOfStock')}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setProductToRestock(product)} className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-[9px] font-black uppercase border border-emerald-100 dark:border-emerald-800 hover:bg-emerald-600 hover:text-white transition-all">{t('restock')}</button>
                        <button onClick={() => handleEdit(product)} className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700/50">
            {sortedProducts.map(product => {
                const status = getProductStatus(product, product.total_stock);
                const statusInfo = {
                    'in-stock': { text: `${product.total_stock} ${t('inStock')}`, color: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30' },
                    'low-stock': { text: t('lowStock'), color: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 border border-amber-200' },
                    'out-of-stock': { text: t('outOfStock'), color: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 border border-red-200' },
                }[status];
                return (
                    <div key={product.id} className="p-4">
                        <div className="flex items-start gap-4">
                            <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-cover rounded-2xl shadow-sm flex-shrink-0" />
                            <div className="flex-grow min-w-0">
                                <p className="font-black text-slate-900 dark:text-white uppercase truncate">{product.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{product.category}</p>
                                <div className="mt-2 flex items-center gap-2">
                                    <p className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${statusInfo.color}`}>{statusInfo.text}</p>
                                    <p className="text-[9px] font-black text-indigo-600 uppercase bg-indigo-50 px-2 py-1 rounded-lg">{product.variants.length} Var.</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end items-center gap-3">
                            <button onClick={() => setProductToRestock(product)} className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">{t('restock')}</button>
                            <button onClick={() => handleEdit(product)} className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">{t('edit')}</button>
                            <button onClick={() => handleDelete(product.id)} className="text-[10px] font-black uppercase text-rose-500 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">{t('delete')}</button>
                        </div>
                    </div>
                );
            })}
        </div>

      </div>

      {isFormOpen && <ProductForm productToEdit={productToEdit} onSave={handleSave} onCancel={() => setIsFormOpen(false)} />}
      {isCategoryModalOpen && <AddCategoryModal onClose={() => setIsCategoryModalOpen(false)} onSave={handleSaveCategory} />}
      {isBulkExportModalOpen && <BulkBarcodeExportModal onClose={() => setIsBulkExportModalOpen(false)} />}
      {productToRestock && <RestockModal product={productToRestock} onClose={() => setProductToRestock(null)} />}
    </div>
  );
};

export default ProductManagement;
