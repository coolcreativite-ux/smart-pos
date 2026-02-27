
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Product, ProductVariant, StockChangeReason, ProductAttribute, getVariantName, StockHistoryEntry } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { useProducts } from '../hooks/useProducts';
import BarcodeScannerModal from './BarcodeScannerModal';
import StockHistoryModal from './StockHistoryModal';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { useStores } from '../contexts/StoreContext';

interface ProductFormProps {
  productToEdit?: Product | null;
  // Change signature to Omit tenantId for new products
  onSave: (product: Omit<Product, 'id' | 'tenantId'> | Product, notes?: string) => void;
  onCancel: () => void;
}

const normalizeForSku = (str: string): string => {
    if (!str) return '';
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") 
        .toUpperCase();
};

const generateSku = (
  productInfo: { name: string; category: string },
  options: { [key: string]: string },
  variantIndex: number
): string => {
  const categoryCode = normalizeForSku(productInfo.category?.substring(0, 3) || "GEN");
  const productCode = normalizeForSku(
    productInfo.name
      ?.split(" ")
      .map((w) => w[0])
      .join("") || "PROD"
  );

  const optionKeys = Object.keys(options).sort(); 
  const optionsCode =
    optionKeys.length > 0
      ? optionKeys
          .map((key) =>
            normalizeForSku(options[key]).substring(0, 3).replace(/[^A-Z0-9]/g, '')
          )
          .join("-")
      : String(variantIndex + 1).padStart(3, "0");

  return `${categoryCode}-${productCode}-${optionsCode}`;
};

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<string | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL('image/jpeg');
}


const ProductForm: React.FC<ProductFormProps> = ({ productToEdit, onSave, onCancel }) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { categories } = useProducts();
  const { addToast } = useToast();
  const { user } = useAuth();
  const { currentStore } = useStores();
  
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerVariantIndex, setScannerVariantIndex] = useState<number | null>(null);
  const [historyVariant, setHistoryVariant] = useState<ProductVariant | null>(null);
  const [errors, setErrors] = useState<{imageUrl?: string}>({});
  const [variantErrors, setVariantErrors] = useState<Array<Record<string, string>>>([]);

  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(1);
  const [naturalAspect, setNaturalAspect] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  
  const createEmptyVariant = (options: { [key: string]: string } = {}): Omit<ProductVariant, 'id'> => ({
    selectedOptions: options,
    price: undefined as any, // Pas de valeur par défaut pour faciliter la saisie
    costPrice: undefined as any, // Pas de valeur par défaut pour faciliter la saisie
    stock_quantity: 0,
    sku: '',
    barcode: '',
    stock_history: []
  });

  const [product, setProduct] = useState({
    name: '',
    category: '',
    imageUrl: '',
    attributes: [] as ProductAttribute[],
    variants: [createEmptyVariant()] as Array<ProductVariant | Omit<ProductVariant, 'id'>>,
    low_stock_threshold: 0,
    enable_email_alert: false,
    expectedRestockDate: '',
  });

  useEffect(() => {
    if (productToEdit) {
      setProduct({
        ...productToEdit,
        attributes: productToEdit.attributes || [],
        variants: productToEdit.variants.length > 0 ? productToEdit.variants : [createEmptyVariant()],
        low_stock_threshold: productToEdit.low_stock_threshold ?? 0,
        enable_email_alert: productToEdit.enable_email_alert ?? false,
        expectedRestockDate: productToEdit.expectedRestockDate ?? '',
      });
      setVariantErrors(productToEdit.variants.map(() => ({})));
    } else {
      setVariantErrors([{}]);
    }
  }, [productToEdit]);

  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setProduct(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || 0 : value),
    }));
  };

  const handleAttributeNameChange = (index: number, name: string) => {
    setProduct(prev => ({
        ...prev,
        attributes: prev.attributes.map((attr, i) =>
            i === index ? { ...attr, name } : attr
        ),
    }));
  };

  const handleAddAttributeValue = (attrIndex: number, value: string) => {
      const trimmedValue = value.trim();
      if (trimmedValue) {
          setProduct(prev => {
              const attr = prev.attributes[attrIndex];
              if (attr.values.includes(trimmedValue)) return prev;
              return {
                  ...prev,
                  attributes: prev.attributes.map((a, i) =>
                      i === attrIndex ? { ...a, values: [...a.values, trimmedValue] } : a
                  ),
              };
          });
      }
  };

  const handleRemoveAttributeValue = (attrIndex: number, valueToRemove: string) => {
      setProduct(prev => ({
          ...prev,
          attributes: prev.attributes.map((attr, i) =>
              i === attrIndex ? { ...attr, values: attr.values.filter(v => v !== valueToRemove) } : attr
          ),
      }));
  };
  
  const handleAttributeValueKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, attrIndex: number) => {
      if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault();
          const input = e.currentTarget;
          handleAddAttributeValue(attrIndex, input.value);
          input.value = '';
      }
  };
  
  const handleAttributeValuePaste = (e: React.ClipboardEvent<HTMLInputElement>, attrIndex: number) => {
      e.preventDefault();
      const pastedText = e.clipboardData.getData('text');
      const valuesToAdd = pastedText.split(',').map(v => v.trim()).filter(Boolean);

      if (valuesToAdd.length > 0) {
          setProduct(prev => {
              const attr = prev.attributes[attrIndex];
              const uniqueNewValues = valuesToAdd.filter(v => !attr.values.includes(v));
              if (uniqueNewValues.length === 0) return prev;
              return {
                  ...prev,
                  attributes: prev.attributes.map((a, i) =>
                      i === attrIndex ? { ...a, values: [...a.values, ...uniqueNewValues] } : a
                  ),
              };
          });
          e.currentTarget.value = '';
      }
  };

  const handleAddAttribute = () => {
      setProduct(prev => ({ ...prev, attributes: [...prev.attributes, { name: '', values: [] }] }));
  };

  const handleRemoveAttribute = (index: number) => {
      setProduct(prev => ({ ...prev, attributes: prev.attributes.filter((_, i) => i !== index) }));
  };

  const generateVariants = () => {
    const { attributes, variants: oldVariants, name, category } = product;
    if (attributes.length === 0 || attributes.some(a => a.values.length === 0)) {
        const firstOldVariant = oldVariants.length > 0 ? oldVariants[0] : null;
        const newStandardVariant = firstOldVariant ? { ...firstOldVariant, selectedOptions: {} } : createEmptyVariant();
        if(firstOldVariant && 'id' in firstOldVariant){
          (newStandardVariant as any).id = firstOldVariant.id;
        }
        setProduct(prev => ({ ...prev, variants: [newStandardVariant] }));
        setVariantErrors([{}]);
        return;
    }

    const valueArrays = attributes.map(a => a.values);
    const combinations = valueArrays.reduce((acc, values) => 
        acc.flatMap(a => values.map(v => [...a, v])), 
        [[]] as string[][]
    );
    
    const isFromSingleStandard = oldVariants.length === 1 && 
                                 Object.keys(oldVariants[0].selectedOptions).length === 0;
    
    const templateVariantData = isFromSingleStandard ? oldVariants[0] : null;

    const newVariants = combinations.map((combo, comboIndex) => {
        const selectedOptions = attributes.reduce((obj, attr, i) => {
            obj[attr.name] = combo[i];
            return obj;
        }, {} as { [key: string]: string });

        const sku = generateSku({ name, category }, selectedOptions, comboIndex);

        const oldVariant = oldVariants.find(v => 
            JSON.stringify(v.selectedOptions) === JSON.stringify(selectedOptions)
        );
        
        if (oldVariant) return oldVariant;

        if (templateVariantData) {
            if (comboIndex === 0) {
                return { ...templateVariantData, selectedOptions, sku };
            }
            const { id, stock_history, stock_quantity, selectedOptions: _, ...rest } = templateVariantData as any;
            return { ...rest, selectedOptions, stock_quantity: 0, stock_history: [], barcode: generateEAN13Barcode(), sku };
        }
        
        const newEmptyVariant = createEmptyVariant(selectedOptions);
        newEmptyVariant.barcode = generateEAN13Barcode();
        newEmptyVariant.sku = sku;
        return newEmptyVariant;
    });

    setProduct(prev => ({ ...prev, variants: newVariants }));
    setVariantErrors(newVariants.map(() => ({})));
    addToast(t('variantsGenerated'), 'info');
  };

  const handleVariantChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const numValue = parseFloat(value);
    
    setProduct(prev => {
        const newVariants = [...prev.variants];
        const variant = { ...newVariants[index] };
        
        if (name === 'price' || name === 'stock_quantity' || name === 'costPrice') {
             (variant as any)[name] = isNaN(numValue) ? 0 : numValue;
        } else {
             (variant as any)[name] = value;
        }
        
        newVariants[index] = variant;
        return { ...prev, variants: newVariants };
    });

    if (name === 'price' || name === 'stock_quantity' || name === 'costPrice') {
      setVariantErrors(prevErrors => {
        const newErrors = [...prevErrors];
        if (!newErrors[index]) newErrors[index] = {};
        
        if (!isNaN(numValue) && numValue < 0) {
          newErrors[index][name] = t(name === 'price' || name === 'costPrice' ? 'priceNegativeError' : 'stockNegativeError');
        } else {
          delete newErrors[index][name];
        }
        return newErrors;
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => setImageToCrop(reader.result as string);
        reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSaveCrop = async () => {
    if (imageToCrop && croppedAreaPixels) {
      const croppedImageUrl = await getCroppedImg(imageToCrop, croppedAreaPixels);
      if (croppedImageUrl) {
        setProduct(prev => ({ ...prev, imageUrl: croppedImageUrl }));
        setErrors(prev => ({ ...prev, imageUrl: undefined }));
      }
      setImageToCrop(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product.imageUrl) {
        setErrors({ imageUrl: t('imageRequiredError') });
        return;
    }

    // Prepare payload without tenantId if it's a new product
    const finalProduct = {
      ...product,
      low_stock_threshold: product.low_stock_threshold > 0 ? product.low_stock_threshold : undefined,
      expectedRestockDate: product.expectedRestockDate || undefined,
      variants: product.variants.map((v, i) => {
        const variantId = 'id' in v ? (v as ProductVariant).id : Date.now() + i;
        const stockQty = Number(v.stock_quantity) || 0;
        
        // Initialiser l'historique si c'est un nouveau produit avec du stock
        const history: StockHistoryEntry[] = (v.stock_history && v.stock_history.length > 0) 
            ? v.stock_history 
            : (stockQty > 0 ? [{
                timestamp: new Date().toISOString(),
                change: stockQty,
                newStock: stockQty,
                reason: StockChangeReason.Initial,
                notes: 'Stock initial à la création',
                userId: user?.id,
                username: user?.username,
                storeId: currentStore?.id || 1
              }] : []);

        return {
            ...v,
            id: variantId,
            barcode: v.barcode || undefined,
            sku: v.sku || undefined,
            price: Number(v.price) || 0,
            costPrice: Number((v as any).costPrice) || 0,
            stock_quantity: stockQty,
            stock_history: history,
            quantityByStore: v.quantityByStore || { [currentStore?.id || 1]: stockQty }
        } as ProductVariant;
      })
    };
    onSave(finalProduct as Omit<Product, 'id' | 'tenantId'> | Product);
  };
  
  const handleScan = (barcode: string) => {
    if (scannerVariantIndex !== null) {
        const newVariants = [...product.variants];
        newVariants[scannerVariantIndex].barcode = barcode;
        setProduct(prev => ({...prev, variants: newVariants}));
    }
    setIsScannerOpen(false);
  };
  
  const generateEAN13Barcode = () => {
    const digits = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
    let sum = 0;
    for (let i = 0; i < 12; i++) { sum += parseInt(digits[i]) * (i % 2 === 0 ? 1 : 3); }
    const checksum = (10 - (sum % 10)) % 10;
    return digits + checksum;
  };

  const handleGenerateBarcode = (index: number) => {
    const newVariants = [...product.variants];
    newVariants[index].barcode = generateEAN13Barcode();
    setProduct(prev => ({...prev, variants: newVariants}));
  };

  const handleGenerateSku = (index: number) => {
    setProduct(prev => {
        const newVariants = [...prev.variants];
        const variant = newVariants[index];
        const newSku = generateSku(
            { name: prev.name, category: prev.category },
            variant.selectedOptions,
            index
        );
        newVariants[index] = { ...variant, sku: newSku };
        return { ...prev, variants: newVariants };
    });
  };
  
  const handleAddVariant = () => {
    const newVariant = createEmptyVariant();
    newVariant.barcode = generateEAN13Barcode();
    newVariant.sku = generateSku(
      { name: product.name, category: product.category },
      {},
      product.variants.length
    );
    setProduct(prev => ({
        ...prev,
        variants: [...prev.variants, newVariant],
    }));
    setVariantErrors(prev => [...prev, {}]);
  };

  const handleRemoveVariant = (index: number) => {
      if (product.variants.length > 1) {
          setProduct(prev => ({
              ...prev,
              variants: prev.variants.filter((_, i) => i !== index),
          }));
          setVariantErrors(prev => prev.filter((_, i) => i !== index));
      }
  };

  const hasVariantErrors = variantErrors.some(err => err && Object.keys(err).length > 0);
  const hasFormErrors = !!errors.imageUrl || hasVariantErrors;

  return (
    <>
      {imageToCrop && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-[60] p-4">
            <div className="relative w-full max-w-lg h-96">
                <Cropper
                    image={imageToCrop}
                    crop={crop}
                    zoom={zoom}
                    aspect={aspect}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                    onMediaLoaded={(mediaSize) => {
                         const newAspect = mediaSize.naturalWidth / mediaSize.naturalHeight;
                         setAspect(newAspect);
                         setNaturalAspect(newAspect);
                    }}
                />
            </div>
            
            <div className="mt-4 flex flex-col gap-4 w-full max-w-lg">
                <div className="flex justify-center gap-4">
                    <button type="button" onClick={() => setAspect(naturalAspect)} className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${aspect === naturalAspect ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white'}`}>{t('original')}</button>
                    <button type="button" onClick={() => setAspect(1)} className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${aspect === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white'}`}>{t('square')}</button>
                </div>
                <div className="w-full">
                    <input type="range" value={zoom} min={1} max={3} step={0.1} aria-labelledby="Zoom" onChange={(e) => setZoom(Number(e.target.value))} className="w-full" />
                </div>
                <div className="flex gap-4 justify-center">
                    <button type="button" onClick={() => setImageToCrop(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 font-semibold rounded-lg">{t('cancel')}</button>
                    <button type="button" onClick={handleSaveCrop} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg">{t('save')}</button>
                </div>
            </div>
        </div>
      )}

      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-3xl p-6 relative flex flex-col h-full max-h-[95vh]">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex-shrink-0">
            {productToEdit ? t('editProduct') : t('addProduct')}
          </h2>
          <div className="flex-grow overflow-y-auto pr-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('imagePreview')}</label>
              <div className={`mt-1 flex justify-center items-center w-full h-96 bg-slate-50 dark:bg-slate-700 rounded-md border-2 border-dashed ${errors.imageUrl ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}>
                {product.imageUrl ? <img src={product.imageUrl} alt="Preview" className="h-full w-full object-contain" /> : <p className="text-slate-500">{t('uploadImage')}</p>}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-2 w-full text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md py-2">{product.imageUrl ? t('changeImage') : t('uploadImage')}</button>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('imageSizeHint')}</p>
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('productName')}</label>
              <input type="text" name="name" id="name" value={product.name} onChange={handleProductChange} required className="mt-1 w-full px-3 py-2 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('category')}</label>
              <input type="text" name="category" id="category" value={product.category} onChange={handleProductChange} required list="category-list" className="mt-1 w-full px-3 py-2 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <datalist id="category-list">{categories.map(cat => <option key={cat} value={cat} />)}</datalist>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">{t('attributes')}</h3>
                {product.attributes.map((attr, index) => (
                    <div key={index} className="flex items-start gap-2 mb-2 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <input type="text" placeholder={t('attributeNamePlaceholder')} value={attr.name} onChange={e => handleAttributeNameChange(index, e.target.value)} className="flex-1 px-2 py-1.5 text-sm rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600" />
                        <div className="flex-[2] flex flex-wrap items-center gap-1 px-2 py-1 text-sm rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 min-h-[38px]">
                            {attr.values.map(value => (
                                <span key={value} className="flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 text-xs font-medium pl-2 pr-1 py-0.5 rounded-full">
                                    {value}
                                    <button type="button" onClick={() => handleRemoveAttributeValue(index, value)} className="text-indigo-500 hover:text-indigo-700 focus:outline-none rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800 w-4 h-4 flex items-center justify-center" aria-label={`Remove ${value}`}>&times;</button>
                                </span>
                            ))}
                            <input type="text" onKeyDown={e => handleAttributeValueKeyDown(e, index)} onPaste={e => handleAttributeValuePaste(e, index)} className="flex-grow bg-transparent outline-none p-0.5 min-w-[100px]" placeholder={attr.values.length === 0 ? t('attributeValuesPlaceholder') : ''} />
                        </div>
                        <button type="button" onClick={() => handleRemoveAttribute(index)} className="p-2 text-red-500 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50 mt-0.5"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                ))}
                <div className="flex gap-2 mt-2">
                    <button type="button" onClick={handleAddAttribute} className="w-full text-sm font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 py-2 rounded-lg hover:bg-indigo-100">+ {t('addAttribute')}</button>
                    <button type="button" onClick={generateVariants} className="w-full text-sm font-semibold text-white bg-indigo-500 py-2 rounded-lg hover:bg-indigo-600">{t('generateVariants')}</button>
                </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">{t('variants')}</h3>
                {product.attributes.length === 0 && (
                    <button type="button" onClick={handleAddVariant} className="w-full mb-4 text-sm font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 py-2 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50" > + {t('addVariant')} </button>
                )}
                <div className="space-y-4">
                  {product.variants.map((variant, index) => {
                    const priceError = variantErrors[index]?.price;
                    const stockError = variantErrors[index]?.stock_quantity;
                    const variantId = 'id' in variant ? (variant as any).id : index;
                    return (
                      <div key={String(variantId)} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                           <div className="flex justify-between items-center mb-2">
                            <p className="font-semibold text-sm text-indigo-600 dark:text-indigo-400">
                                {product.attributes.length > 0 ? getVariantName(variant as ProductVariant) : (product.variants.length > 1 ? `${t('variantName')} ${index + 1}` : t('defaultVariantName'))}
                            </p>
                            {product.attributes.length === 0 && product.variants.length > 1 && (
                                <button type="button" onClick={() => handleRemoveVariant(index)} className="p-1 text-red-500 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50" title={t('removeVariant')} >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <label htmlFor={`variant-costPrice-${variantId}`} className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">{t('costPrice')}</label>
                                <input 
                                  type="number" 
                                  id={`variant-costPrice-${variantId}`} 
                                  name="costPrice" 
                                  value={(variant as any).costPrice ?? ''} 
                                  onChange={e => handleVariantChange(index, e)} 
                                  step="0.01" 
                                  placeholder="0.00" 
                                  className="w-full px-3 py-2 text-sm rounded-md border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                                />
                              </div>
                              <div>
                                <label htmlFor={`variant-price-${variantId}`} className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">{t('price')}</label>
                                <input 
                                  type="number" 
                                  id={`variant-price-${variantId}`} 
                                  name="price" 
                                  value={variant.price ?? ''} 
                                  onChange={e => handleVariantChange(index, e)} 
                                  step="0.01" 
                                  placeholder="0.00" 
                                  className={`w-full px-3 py-2 text-sm rounded-md border bg-white dark:bg-slate-700 ${priceError ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} focus:outline-none focus:ring-2 focus:ring-indigo-500`} 
                                />
                                {priceError && <p className="text-xs text-red-500 mt-1">{priceError}</p>}
                              </div>
                              <div>
                                <label htmlFor={`variant-stock-${variantId}`} className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">{t('stockQuantity')}</label>
                                <div className="flex gap-2 items-center">
                                    <input 
                                      type="number" 
                                      id={`variant-stock-${variantId}`} 
                                      name="stock_quantity" 
                                      value={variant.stock_quantity} 
                                      disabled={'id' in variant}
                                      onChange={e => handleVariantChange(index, e)} 
                                      required 
                                      step="1" 
                                      className={`w-full px-3 py-2 text-sm rounded-md border ${
                                        'id' in variant 
                                          ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed' 
                                          : 'bg-white dark:bg-slate-700'
                                      } ${stockError ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} focus:outline-none focus:ring-2 focus:ring-indigo-500`} 
                                    />
                                     {'id' in variant && (
                                        <button type="button" onClick={() => setHistoryVariant(variant as ProductVariant)} className="p-2 text-slate-500 bg-slate-100 dark:bg-slate-600 rounded-md hover:bg-slate-200 dark:hover:bg-slate-500 border border-slate-300 dark:border-slate-600" title={t('stockHistory')} >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> </svg>
                                        </button>
                                    )}
                                </div>
                                {'id' in variant && (
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Utilisez "Réapprovisionner" pour modifier le stock</p>
                                )}
                                {stockError && <p className="text-xs text-red-500 mt-1">{stockError}</p>}
                              </div>
                          </div>
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label htmlFor={`variant-sku-${variantId}`} className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">{t('sku')}</label>
                                <div className="flex gap-2 items-center">
                                    <input type="text" id={`variant-sku-${variantId}`} name="sku" value={variant.sku || ''} onChange={e => handleVariantChange(index, e)} className="flex-grow px-3 py-2 text-sm rounded-md" />
                                    <button type="button" onClick={() => handleGenerateSku(index)} className="px-3 py-2 text-xs font-semibold rounded-md border bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500" title={t('generateSku')}>{t('generateBarcode')}</button>
                                </div>
                              </div>
                              <div>
                                <label htmlFor={`variant-barcode-${variantId}`} className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">{t('barcode')}</label>
                                <div className="flex gap-2 items-center">
                                    <input type="text" id={`variant-barcode-${variantId}`} name="barcode" value={variant.barcode || ''} onChange={e => handleVariantChange(index, e)} className="flex-grow px-3 py-2 text-sm rounded-md" />
                                    <button type="button" onClick={() => handleGenerateBarcode(index)} className="px-3 py-2 text-xs font-semibold rounded-md border bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500" title={t('generateBarcode')}>{t('generateBarcode')}</button>
                                    <button type="button" onClick={() => {setIsScannerOpen(true); setScannerVariantIndex(index);}} className="p-2 text-white bg-indigo-600 rounded-md"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M0 4a2 2 0 0 1 2-2h4v2H2v4H0V4zm0 16v-4h2v4h4v2H2a2 2 0 0 1-2-2zM20 2h-4V0h4a2 2 0 0 1 2 2v4h-2V2zM22 20a2 2 0 0 1-2 2h-4v-2h4v-4h2v4zM3 11h18v2H3z"/></svg></button>
                                </div>
                              </div>
                          </div>
                      </div>
                    )
                  })}
                </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-4">
              <div>
                <label htmlFor="low_stock_threshold" className="text-sm font-medium">{t('lowStockThreshold')}</label>
                <input type="number" name="low_stock_threshold" value={product.low_stock_threshold} onChange={handleProductChange} min="0" className="mt-1 w-full px-3 py-2 rounded-md" />
              </div>
              <div>
                <label htmlFor="expectedRestockDate" className="text-sm font-medium">{t('expectedRestockDate')}</label>
                <input type="date" name="expectedRestockDate" value={product.expectedRestockDate || ''} onChange={handleProductChange} className="mt-1 w-full px-3 py-2 rounded-md" />
              </div>
              <div className="flex items-center">
                <input type="checkbox" name="enable_email_alert" id="enable_email_alert" checked={product.enable_email_alert} onChange={handleProductChange} className="h-4 w-4 rounded" />
                <label htmlFor="enable_email_alert" className="ml-2 text-sm">{t('enableEmailAlerts')}</label>
              </div>
            </div>
          </div>
          <div className="pt-4 flex justify-end space-x-3 flex-shrink-0">
            <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 font-semibold rounded-lg">{t('cancel')}</button>
            <button type="submit" disabled={hasFormErrors} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-slate-400 dark:disabled:bg-slate-500">{t('save')}</button>
          </div>
        </form>
      </div>
      {isScannerOpen && <BarcodeScannerModal onClose={() => setIsScannerOpen(false)} onScan={handleScan} />}
      {historyVariant && <StockHistoryModal productName={product.name} variant={historyVariant} onClose={() => setHistoryVariant(null)} />}
    </>
  );
};

export default ProductForm;
