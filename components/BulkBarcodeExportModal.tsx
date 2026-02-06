
import React, { useState, useMemo } from 'react';
import JsBarcode from 'jsbarcode';
import jsPDF from 'jspdf';
import { useProducts } from '../hooks/useProducts';
import { useLanguage } from '../hooks/useLanguage';
import { Product, ProductVariant, getVariantName } from '../types';

const BulkBarcodeExportModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { products } = useProducts();
  const { t } = useLanguage();

  const productsWithBarcodeVariants = useMemo(() => 
    products.map(p => ({
      ...p,
      variants: p.variants.filter(v => v.barcode)
    })).filter(p => p.variants.length > 0),
  [products]);

  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set(
    productsWithBarcodeVariants.flatMap(p => p.variants.map(v => `${p.id}-${v.id}`))
  ));
  
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return productsWithBarcodeVariants;
    const lowercasedFilter = searchTerm.toLowerCase();
    return productsWithBarcodeVariants
      .map(p => ({
        ...p,
        variants: p.variants.filter(v => 
          p.name.toLowerCase().includes(lowercasedFilter) ||
          getVariantName(v).toLowerCase().includes(lowercasedFilter)
        )
      }))
      .filter(p => p.variants.length > 0);
  }, [productsWithBarcodeVariants, searchTerm]);

  const handleToggleVariant = (productId: number, variantId: number) => {
    const key = `${productId}-${variantId}`;
    setSelectedVariants(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) newSet.delete(key);
      else newSet.add(key);
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedVariants(new Set(
      filteredProducts.flatMap(p => p.variants.map(v => `${p.id}-${v.id}`))
    ));
  };

  const handleDeselectAll = () => setSelectedVariants(new Set());

  const handleGeneratePdf = () => {
    if (selectedVariants.size === 0) return;
    
    const doc = new jsPDF('p', 'mm', 'a4');
    const variantsToExport: { product: Product, variant: ProductVariant }[] = [];
    selectedVariants.forEach(key => {
        const [productId, variantId] = key.split('-').map(Number);
        const product = products.find(p => p.id === productId);
        const variant = product?.variants.find(v => v.id === variantId);
        if (product && variant) {
            variantsToExport.push({ product, variant });
        }
    });

    // Configuration for 4 columns on A4
    const pageMargin = 10;
    const horizontalGap = 3; 
    const verticalGap = 4; 
    const columns = 4;
    
    // A4 width is 210mm. 
    // Available width = 210 - (2 * pageMargin) - ((columns - 1) * horizontalGap)
    // 210 - 20 - 9 = 181mm available for labels
    // 181 / 4 = 45.25mm per label. Rounding to 45mm.
    const labelWidth = 45; 
    const labelHeight = 25;

    let x = pageMargin, y = pageMargin, columnCount = 0;

    for (const { product, variant } of variantsToExport) {
        if (!variant.barcode) continue;

        if (y + labelHeight > doc.internal.pageSize.getHeight() - pageMargin) {
            doc.addPage();
            x = pageMargin; y = pageMargin; columnCount = 0;
        }
        
        const canvas = document.createElement('canvas');
        // Reduced width from 1.8 to 1.3 to fit within 45mm
        JsBarcode(canvas, variant.barcode, { 
            format: 'CODE128', 
            displayValue: false, 
            width: 1.3, 
            height: 40, 
            margin: 0 
        });
        
        const canvasImg = canvas.toDataURL("image/png", 1.0);
        const labelCenterX = x + (labelWidth / 2);

        // Product Name + Variant
        doc.setFontSize(6); // Reduced font size to fit narrower label
        const displayName = `${product.name} - ${getVariantName(variant)}`;
        doc.text(displayName, labelCenterX, y + 6, { align: 'center', maxWidth: labelWidth - 2 });

        // Barcode Image
        const imgHeight = 10; // Slightly shorter
        const imgAspectRatio = canvas.width / canvas.height;
        const imgWidth = imgHeight * imgAspectRatio;
        
        // Ensure image doesn't overflow width
        const finalImgWidth = Math.min(imgWidth, labelWidth - 2);
        
        doc.addImage(canvasImg, 'PNG', labelCenterX - (finalImgWidth / 2), y + 8, finalImgWidth, imgHeight);

        // Barcode Number
        doc.setFontSize(7);
        doc.text(variant.barcode, labelCenterX, y + 8 + imgHeight + 3, { align: 'center'});
        
        // Move cursor
        columnCount++;
        x += labelWidth + horizontalGap;

        if (columnCount === columns) {
            x = pageMargin; y += labelHeight + verticalGap; columnCount = 0;
        }
    }

    doc.save('barcode-labels.pdf');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl p-6 flex flex-col h-[90vh]" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex-shrink-0">{t('exportBarcodeLabels')}</h2>
        <div className="flex flex-wrap gap-4 items-center mb-4 flex-shrink-0">
          <input type="text" placeholder={t('searchProducts')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-grow px-3 py-2 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <button onClick={handleSelectAll} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">{t('selectAll')}</button>
          <button onClick={handleDeselectAll} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">{t('deselectAll')}</button>
        </div>
        <div className="flex-grow overflow-y-auto border-t border-b border-slate-200 dark:border-slate-700 py-2 pr-2">
          <ul className="space-y-2">
            {filteredProducts.map(product => (
              <li key={product.id}>
                <p className="font-semibold text-slate-800 dark:text-slate-200 px-2 py-1">{product.name}</p>
                <ul className="pl-4 space-y-1">
                  {product.variants.map(variant => {
                    const key = `${product.id}-${variant.id}`;
                    return (
                      <li key={key}>
                        <label className="flex items-center p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer">
                          <input type="checkbox" checked={selectedVariants.has(key)} onChange={() => handleToggleVariant(product.id, variant.id)} className="h-4 w-4 text-indigo-600 border-slate-300 dark:border-slate-600 rounded focus:ring-indigo-500 bg-slate-50 dark:bg-slate-700" />
                          <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">{getVariantName(variant)}</span>
                          <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">{variant.barcode}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-6 flex justify-between items-center flex-shrink-0">
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('productsSelected').replace('{count}', String(selectedVariants.size))}</p>
          <div className="space-x-3">
            <button onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">{t('cancel')}</button>
            <button onClick={handleGeneratePdf} disabled={selectedVariants.size === 0} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-slate-400 dark:disabled:bg-slate-500">{t('generatePDF')}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkBarcodeExportModal;
