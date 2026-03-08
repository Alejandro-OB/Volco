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
      {/* --- DESKTOP MODAL --- */}
      <div className="hidden md:flex w-full max-w-4xl h-[90vh] flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/20 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#f58d2f]" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Vista previa</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={openInNewTab} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors" title="Abrir en nueva pestaña">
              <Maximize2 size={16} />
            </button>
            <button onClick={downloadPdf} className="p-2 rounded-lg text-slate-400 hover:text-[#f58d2f] hover:bg-orange-50 transition-colors" title="Descargar PDF">
              <Download size={16} />
            </button>
            <div className="w-px h-5 bg-slate-100 mx-1" />
            <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors" title="Cerrar">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* PDF Viewer Desktop */}
        <div className="flex-1 bg-slate-50 overflow-hidden">
          <iframe
            src={`${pdfUrl}#toolbar=0`}
            title="Vista previa PDF"
            className="w-full h-full border-none"
          />
        </div>

        {/* Footer Desktop */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-white">
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Volco S.A.S</span>
          <button onClick={downloadPdf} className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest text-white bg-[#f58d2f] hover:bg-[#e87a1c] transition-colors">
            <Download size={14} /> Descargar
          </button>
        </div>
      </div>

      {/* --- MOBILE MODAL (Minimalista) --- */}
      <div className="md:hidden w-full max-w-sm mx-4 bg-white rounded-3xl p-6 shadow-2xl shadow-slate-900/20 relative animate-in zoom-in-95 duration-200 text-center flex flex-col items-center gap-5">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors">
          <X size={18} />
        </button>
        
        <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center text-[#f58d2f] mb-2 mt-4">
          <Download size={28} />
        </div>
        
        <div>
          <h3 className="text-xl font-black text-slate-800">Documento Listo</h3>
          <p className="text-sm font-medium text-slate-500 mt-2">¿Qué deseas hacer con el PDF?</p>
        </div>

        <div className="w-full flex justify-center gap-3 mt-2">
          <button
            onClick={openInNewTab}
            className="flex-1 flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-2xl bg-slate-50 border-2 border-slate-100 text-slate-500 font-bold hover:bg-slate-100 hover:border-slate-200 transition-all active:scale-95"
          >
            <Maximize2 size={20} className="text-slate-400" />
            <span className="text-xs">Ver PDF</span>
          </button>
          <button
            onClick={downloadPdf}
            className="flex-1 flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-2xl bg-[#f58d2f]/10 border-2 border-[#f58d2f]/20 text-[#f58d2f] font-bold hover:bg-[#f58d2f]/20 transition-all active:scale-95"
          >
            <Download size={20} />
            <span className="text-xs">Descargar</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default PdfModal;