
import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import jsPDF from 'jspdf';
import { Product } from '../types';
import { useLanguage } from '../hooks/useLanguage';

interface BarcodeDisplayModalProps {
  product: Product;
  onClose: () => void;
}

const BarcodeDisplayModal: React.FC<BarcodeDisplayModalProps> = ({ product, onClose }) => {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Use the first available barcode from variants
  const barcodeToDisplay = product.variants.find(v => v.barcode)?.barcode;

  useEffect(() => {
    if (canvasRef.current && barcodeToDisplay) {
      try {
        JsBarcode(canvasRef.current, barcodeToDisplay, {
          format: 'CODE128',
          displayValue: true,
          fontSize: 18,
          textMargin: 0,
          width: 2,
          height: 100,
        });
      } catch (e) {
        console.error("Error generating barcode:", e);
      }
    }
  }, [barcodeToDisplay]);

  const handleDownloadPdf = () => {
    if (!barcodeToDisplay) return;
    
    // A standard label size, e.g., 2.625" x 1" -> ~66.7mm x 25.4mm
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [66.7, 25.4]
    });

    // Create a temporary canvas for PDF generation without text
    const pdfCanvas = document.createElement('canvas');
    JsBarcode(pdfCanvas, barcodeToDisplay, {
        format: 'CODE128',
        displayValue: false, // Don't display text in the image
        width: 2.5,
        height: 80,
        margin: 0,
    });
    
    const canvasImg = pdfCanvas.toDataURL("image/png", 1.0);
    
    const labelWidth = 62; // with margin
    const imgAspectRatio = pdfCanvas.width / pdfCanvas.height;
    const imgHeight = labelWidth / imgAspectRatio;
    const x_center = doc.internal.pageSize.getWidth() / 2;
    const y_start = 7;

    doc.setFontSize(8);
    doc.text(product.name, x_center, 5, { align: 'center', maxWidth: labelWidth });
    
    doc.addImage(canvasImg, 'PNG', x_center - (labelWidth / 2), y_start, labelWidth, imgHeight);

    // Render text separately for clarity
    doc.setFontSize(10);
    doc.text(barcodeToDisplay, x_center, y_start + imgHeight + 4, { align: 'center' });
    
    doc.save(`${product.name}-barcode.pdf`);
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6 relative"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 text-center">
          {product.name}
        </h2>
        <div className="flex justify-center p-4 bg-white rounded-md">
           {barcodeToDisplay ? <canvas ref={canvasRef} /> : <p className="text-red-500">No barcode available</p>}
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4">
          <button onClick={onClose} className="w-full px-4 py-3 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
            {t('close')}
          </button>
          <button onClick={handleDownloadPdf} disabled={!barcodeToDisplay} className="w-full px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed">
            {t('downloadPDF')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeDisplayModal;
