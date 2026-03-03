import React, { useEffect } from 'react';
import { X, Download, Maximize2 } from 'lucide-react';

function PdfModal({ show, onClose, pdfUrl }) {
  useEffect(() => {
    if (!show) return;
    document.body.style.overflow = 'hidden';
    const handleEsc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [show, onClose]);

  if (!show) return null;

  const openInNewTab = () => window.open(pdfUrl, '_blank');

  const downloadPdf = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = 'cuenta.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-[3000] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-4xl h-[90vh] flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/20 animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#f58d2f]" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Vista previa</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={openInNewTab}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Abrir en nueva pestaña"
            >
              <Maximize2 size={16} />
            </button>
            <button
              onClick={downloadPdf}
              className="p-2 rounded-lg text-slate-400 hover:text-[#f58d2f] hover:bg-orange-50 transition-colors"
              title="Descargar PDF"
            >
              <Download size={16} />
            </button>
            <div className="w-px h-5 bg-slate-100 mx-1" />
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Cerrar"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 bg-slate-50 overflow-hidden">
          {/* Desktop */}
          <iframe
            src={`${pdfUrl}#toolbar=0`}
            title="Vista previa PDF"
            className="hidden md:block w-full h-full border-none"
          />

          {/* Mobile fallback */}
          <div className="md:hidden flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
            <p className="text-slate-400 text-sm">La previsualización no está disponible en móvil.</p>
            <button
              onClick={downloadPdf}
              className="px-6 py-3 rounded-xl bg-[#f58d2f] text-white text-sm font-bold flex items-center gap-2"
            >
              <Download size={16} /> Descargar PDF
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-white">
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Volco S.A.S</span>
          <button
            onClick={downloadPdf}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest text-white bg-[#f58d2f] hover:bg-[#e87a1c] transition-colors"
          >
            <Download size={14} /> Descargar
          </button>
        </div>

      </div>
    </div>
  );
}

export default PdfModal;