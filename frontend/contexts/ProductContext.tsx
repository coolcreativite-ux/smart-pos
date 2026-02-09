
import React, { createContext, useState, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { Product, ProductVariant, StockChangeReason, User, StockHistoryEntry, UserRole } from '../types';
import { MOCK_PRODUCTS } from '../constants';
import { useStores } from './StoreContext';
import { useAuth } from './AuthContext';
import { db } from '../lib/database';
import { API_URL } from '../config';

interface ProductContextType {
  products: Product[];
  categories: string[];
  isLoading: boolean;
  addProduct: (product: Omit<Product, 'id' | 'tenantId'>, user: User) => Promise<void>;
  updateProduct: (product: Product) => void;
  updateVariantStock: (productId: number, variantId: number, change: number, reason: StockChangeReason, user: User, notes?: string, targetStoreId?: number) => void;
  setVariantStock: (productId: number, variantId: number, newTotal: number, reason: StockChangeReason, user: User, notes?: string, targetStoreId?: number) => void;
  transferStock: (productId: number, variantId: number, quantity: number, sourceStoreId: number, destStoreId: number, user: User, notes?: string) => boolean;
  deleteProduct: (productId: number) => void;
  resetProducts: (user: User) => void;
  addCategory: (categoryName: string) => Promise<boolean>;
  initializeStoreStock: (storeId: number) => void;
  loadProducts: () => Promise<void>;
}

export const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const { currentStore } = useStores();
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);

  // Charger les produits depuis la base de données
  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Charger les produits
      const { data: productsData, error: productsError } = await db.from('products');
      
      if (productsError) {
        console.warn('Erreur lors du chargement des produits:', productsError);
        // Fallback vers les données mockées
        const saved = localStorage.getItem('globalProducts');
        if (saved) {
          setAllProducts(JSON.parse(saved));
        } else {
          const initial = MOCK_PRODUCTS.map(p => ({...p, tenantId: 1}));
          setAllProducts(initial);
          localStorage.setItem('globalProducts', JSON.stringify(initial));
        }
        setIsLoading(false);
        return;
      }

      if (productsData && productsData.length > 0) {
        // Charger les variantes pour chaque produit
        const { data: variantsData, error: variantsError } = await db.from('product_variants');
        const { data: inventoryData, error: inventoryError } = await db.from('inventory');
        const { data: categoriesData, error: categoriesError } = await db.from('categories');

        if (variantsError || inventoryError || categoriesError) {
          console.warn('Erreur lors du chargement des données produits');
          setIsLoading(false);
          return;
        }

        // Construire les produits avec leurs variantes et inventaire
        const dbProducts: Product[] = productsData.map((dbProduct: any) => {
          const productVariants = variantsData?.filter((v: any) => v.product_id === dbProduct.id) || [];
          
          const variants: ProductVariant[] = productVariants.map((dbVariant: any) => {
            // Construire quantityByStore depuis l'inventaire
            const variantInventory = inventoryData?.filter((inv: any) => inv.variant_id === dbVariant.id) || [];
            const quantityByStore: { [storeId: number]: number } = {};
            let totalStock = 0;
            
            variantInventory.forEach((inv: any) => {
              quantityByStore[inv.store_id] = inv.quantity;
              totalStock += inv.quantity;
            });

            return {
              id: dbVariant.id,
              selectedOptions: dbVariant.selected_options || {},
              price: parseFloat(dbVariant.price),
              costPrice: parseFloat(dbVariant.cost_price || 0),
              stock_quantity: totalStock,
              quantityByStore,
              sku: dbVariant.sku,
              barcode: dbVariant.barcode,
              stock_history: [] // TODO: Charger l'historique si nécessaire
            };
          });

          return {
            id: dbProduct.id,
            tenantId: dbProduct.tenant_id,
            name: dbProduct.name,
            category: categoriesData?.find((c: any) => c.id === dbProduct.category_id)?.name || 'Autre',
            description: dbProduct.description,
            imageUrl: dbProduct.image_url,
            attributes: dbProduct.attributes || [],
            variants,
            low_stock_threshold: dbProduct.low_stock_threshold,
            enable_email_alert: dbProduct.enable_email_alert,
            outOfStockSince: dbProduct.out_of_stock_since,
            lowStockSince: dbProduct.low_stock_since,
            expectedRestockDate: dbProduct.expected_restock_date
          };
        });

        setAllProducts(dbProducts);
        
        // Extraire les catégories
        const categoryNames = categoriesData?.map((c: any) => c.name) || [];
        setCategories(categoryNames);
        
        console.log('✅ Produits chargés depuis la base de données:', dbProducts.length);
      }
    } catch (error) {
      console.warn('Erreur lors du chargement des produits:', error);
      // Fallback vers localStorage
      const saved = localStorage.getItem('globalProducts');
      if (saved) {
        setAllProducts(JSON.parse(saved));
      } else {
        const initial = MOCK_PRODUCTS.map(p => ({...p, tenantId: 1}));
        setAllProducts(initial);
        localStorage.setItem('globalProducts', JSON.stringify(initial));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Charger les produits au démarrage
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // FILTRAGE MULTI-TENANT
  const products = useMemo(() => {
    if (!user) return [];
    if (user.role === UserRole.SuperAdmin) return allProducts;
    return allProducts.filter(p => p.tenantId === user.tenantId);
  }, [allProducts, user]);

  const saveToGlobal = (newList: Product[]) => {
      setAllProducts(newList);
      localStorage.setItem('globalProducts', JSON.stringify(newList));
  };

  const addProduct = async (productData: Omit<Product, 'id' | 'tenantId'>, creator: User) => {
    try {
      // TODO: Implémenter l'ajout en base de données
      const newProduct: Product = { 
          ...productData, 
          id: Date.now(), 
          tenantId: creator.tenantId 
      };
      saveToGlobal([...allProducts, newProduct]);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du produit:', error);
    }
  };
  
  const updateVariantStock = useCallback(async (productId: number, variantId: number, change: number, reason: StockChangeReason, user: User, notes?: string, targetStoreId?: number) => {
    const activeStoreId = targetStoreId || currentStore?.id || 1;
    
    // Mettre à jour localement d'abord pour une réponse immédiate
    const newList = allProducts.map(p => {
        if (p.id === productId && p.tenantId === user.tenantId) {
            const newVariants = p.variants.map(v => {
                if (v.id === variantId) {
                    const currentStoreStock = v.quantityByStore?.[activeStoreId] ?? 0;
                    const newStock = Math.max(0, currentStoreStock + change); // Éviter les stocks négatifs
                    const historyEntry: StockHistoryEntry = {
                        timestamp: new Date().toISOString(), change, newStock, reason, notes,
                        userId: user.id, username: user.username, storeId: activeStoreId
                    };
                    return { 
                        ...v, 
                        stock_quantity: activeStoreId === (currentStore?.id || 1) ? newStock : v.stock_quantity,
                        quantityByStore: { ...(v.quantityByStore || {}), [activeStoreId]: newStock },
                        stock_history: [historyEntry, ...(v.stock_history || [])]
                    };
                }
                return v;
            });
            return { ...p, variants: newVariants };
        }
        return p;
    });
    
    setAllProducts(newList);
    localStorage.setItem('globalProducts', JSON.stringify(newList));
    
    // Mettre à jour la base de données de manière asynchrone
    try {
      await updateInventoryInDB(variantId, activeStoreId, change, reason, user, notes);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'inventaire en DB:', error);
      // En cas d'erreur, on pourrait recharger depuis la DB
      loadProducts();
    }
  }, [allProducts, currentStore, loadProducts]);

  const updateInventoryInDB = async (variantId: number, storeId: number, change: number, reason: StockChangeReason, user: User, notes?: string) => {
    try {
      // Mettre à jour l'inventaire via l'API
      await fetch(`${API_URL}/api/inventory/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId,
          storeId,
          change,
          reason,
          userId: user.id,
          notes
        })
      });
    } catch (error) {
      console.warn('Erreur lors de la mise à jour de l\'inventaire:', error);
    }
  };

  const setVariantStock = useCallback((productId: number, variantId: number, newTotal: number, reason: StockChangeReason, user: User, notes?: string, targetStoreId?: number) => {
    const activeStoreId = targetStoreId || currentStore?.id || 1;
    const newList = allProducts.map(p => {
        if (p.id === productId && p.tenantId === user.tenantId) {
            const newVariants = p.variants.map(v => {
                if (v.id === variantId) {
                    const currentStoreStock = v.quantityByStore?.[activeStoreId] ?? 0;
                    const change = newTotal - currentStoreStock;
                    const historyEntry: StockHistoryEntry = {
                        timestamp: new Date().toISOString(), change, newStock: newTotal, reason, notes,
                        userId: user.id, username: user.username, storeId: activeStoreId
                    };
                    return { 
                        ...v, 
                        stock_quantity: activeStoreId === (currentStore?.id || 1) ? newTotal : v.stock_quantity,
                        quantityByStore: { ...(v.quantityByStore || {}), [activeStoreId]: newTotal },
                        stock_history: [historyEntry, ...(v.stock_history || [])]
                    };
                }
                return v;
            });
            return { ...p, variants: newVariants };
        }
        return p;
    });
    saveToGlobal(newList);
  }, [allProducts, currentStore]);

  const transferStock = useCallback((productId: number, variantId: number, quantity: number, sourceStoreId: number, destStoreId: number, user: User, notes?: string) => {
    const product = allProducts.find(p => p.id === productId && p.tenantId === user.tenantId);
    const variant = product?.variants.find(v => v.id === variantId);
    if (!variant || (variant.quantityByStore?.[sourceStoreId] || 0) < quantity) return false;

    const newList = allProducts.map(p => {
        if (p.id === productId) {
            const newVariants = p.variants.map(v => {
                if (v.id === variantId) {
                    const newQtyByStore = { ...(v.quantityByStore || {}) };
                    newQtyByStore[sourceStoreId] = (newQtyByStore[sourceStoreId] || 0) - quantity;
                    newQtyByStore[destStoreId] = (newQtyByStore[destStoreId] || 0) + quantity;
                    return { ...v, quantityByStore: newQtyByStore };
                }
                return v;
            });
            return { ...p, variants: newVariants };
        }
        return p;
    });
    saveToGlobal(newList);
    return true;
  }, [allProducts]);

  const updateProduct = useCallback(async (updatedProductData: Product) => {
    // Mettre à jour dans la base de données via l'API
    try {
      const response = await fetch(`${API_URL}/api/products/${updatedProductData.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: updatedProductData.name,
          category: updatedProductData.category,
          description: updatedProductData.description,
          imageUrl: updatedProductData.imageUrl,
          attributes: updatedProductData.attributes,
          low_stock_threshold: updatedProductData.low_stock_threshold,
          enable_email_alert: updatedProductData.enable_email_alert,
          tenantId: updatedProductData.tenantId
        }),
      });

      if (!response.ok) {
        console.error('❌ Erreur lors de la mise à jour du produit dans la DB');
        throw new Error('Erreur lors de la mise à jour');
      }

      console.log('✅ Produit mis à jour dans la base de données');
    } catch (error) {
      console.error('❌ Erreur API lors de la mise à jour du produit:', error);
      // Continuer avec la mise à jour locale même en cas d'erreur
    }

    // Mettre à jour le state local
    saveToGlobal(allProducts.map(p => p.id === updatedProductData.id ? updatedProductData : p));
  }, [allProducts]);

  const deleteProduct = useCallback(async (productId: number) => {
    // Supprimer dans la base de données via l'API
    try {
      const response = await fetch(`${API_URL}/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        console.error('❌ Erreur lors de la suppression du produit dans la DB');
        throw new Error('Erreur lors de la suppression');
      }

      console.log('✅ Produit supprimé de la base de données');
    } catch (error) {
      console.error('❌ Erreur API lors de la suppression du produit:', error);
      throw error; // Propager l'erreur pour que l'UI puisse la gérer
    }

    // Supprimer du state local
    saveToGlobal(allProducts.filter(p => p.id !== productId));
  }, [allProducts]);
  
  const addCategory = useCallback(async (categoryName: string): Promise<boolean> => {
    if (!user) return false;
    const trimmedName = categoryName.trim();
    if (!trimmedName) return false;

    // Vérifier si elle existe déjà (insensible à la casse)
    if (categories.some(c => c.toLowerCase() === trimmedName.toLowerCase())) {
        return false;
    }

    try {
      // Sauvegarder en base de données
      const response = await fetch(`${API_URL}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: trimmedName,
          tenantId: user.tenantId
        })
      });

      if (!response.ok) {
        if (response.status === 409) {
          console.warn('Catégorie existe déjà');
          return false;
        }
        throw new Error('Erreur lors de la création de la catégorie');
      }

      const newCategory = await response.json();
      console.log('✅ Catégorie créée:', newCategory);

      // Ajouter à l'état local
      setCategories(prev => [...prev, trimmedName]);
      return true;
    } catch (error) {
      console.error('❌ Erreur création catégorie:', error);
      return false;
    }
  }, [categories, user]);

  const resetProducts = useCallback((user: User) => {
    const otherTenantsProducts = allProducts.filter(p => p.tenantId !== user.tenantId);
    const mockForThisTenant = MOCK_PRODUCTS.map(p => ({...p, id: Date.now() + Math.random(), tenantId: user.tenantId}));
    saveToGlobal([...otherTenantsProducts, ...mockForThisTenant]);
  }, [allProducts]);

  const initializeStoreStock = useCallback((storeId: number) => {
      // Logic handled via quantityByStore being undefined/0
  }, []);

  return (
    <ProductContext.Provider value={{ 
      products, 
      categories, 
      isLoading, 
      addProduct, 
      updateProduct, 
      deleteProduct, 
      resetProducts, 
      addCategory, 
      updateVariantStock, 
      setVariantStock, 
      initializeStoreStock, 
      transferStock,
      loadProducts 
    }}>
      {children}
    </ProductContext.Provider>
  );
};
