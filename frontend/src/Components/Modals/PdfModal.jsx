import React, { useEffect } from 'react';
import { 
  X, Download, Maximize2, FileText, 
  Eye, ShieldCheck 
} from 'lucide-react';

function PdfModal({ show, onClose, pdfUrl }) {
  // Manejo de eventos globales para el modal
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e) => e.key === 'Escape' && onClose();
      window.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleEsc);
      };
    }
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
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      
      <div className="w-full max-w-5xl h-full max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-300">
        
        {/* Barra de Estado Superior (Sin botón regresar) */}
        <div className="flex items-center justify-end mb-4 px-2">
          <div className="flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full border border-white/10 backdrop-blur-md shadow-sm">
            <div className="w-2 h-2 rounded-full bg-[#f58d2f] animate-pulse" />
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Vista Previa Digital</span>
          </div>
        </div>

        {/* Contenedor Principal Estilo Volco */}
        <div className="flex-1 bg-white rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col border border-slate-100">
          
          {/* Header del Modal */}
          <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 bg-orange-50 rounded-2xl text-[#f58d2f] flex items-center justify-center border border-orange-100 shadow-sm">
                <FileText size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-[#1a202c] tracking-tight leading-none">Visor de Documento</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2 flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-emerald-500" />
                  Archivo verificado por Volco v2.0
                </p>
              </div>
            </div>
            
            {/* El botón X ahora es el principal método de salida */}
            <button 
              onClick={onClose}
              className="p-3 rounded-2xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all group"
              title="Cerrar visor"
            >
              <X size={28} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>

          {/* Visor de PDF (Cuerpo) */}
          <div className="flex-1 bg-slate-100 relative overflow-hidden">
            {/* Desktop View */}
            <div className="hidden md:block w-full h-full p-4">
              <iframe
                src={`${pdfUrl}#toolbar=0`}
                title="Soporte PDF"
                className="w-full h-full border-none rounded-xl bg-white shadow-inner"
              />
            </div>

            {/* Mobile Empty State */}
            <div className="md:hidden flex flex-col items-center justify-center h-full p-10 text-center">
              <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center mb-6 border border-slate-200 shadow-sm">
                <Eye size={36} className="text-slate-300" />
              </div>
              <h4 className="text-[#1a202c] font-black text-sm uppercase tracking-widest mb-3">Previsualización Limitada</h4>
              <p className="text-slate-500 text-xs font-medium leading-relaxed max-w-[240px] mb-8">
                Para una mejor experiencia en dispositivos móviles, descargue el soporte oficial o expándalo.
              </p>
            </div>
          </div>

          {/* Footer de Acciones */}
          <div className="p-8 bg-white border-t border-slate-50 flex flex-col sm:flex-row gap-4 items-center justify-between">
            
            <div className="hidden lg:block">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Propiedad de Volco S.A.S</span>
            </div>

            <div className="flex gap-4 w-full sm:w-auto">
              <button
                onClick={openInNewTab}
                className="flex-1 px-8 py-4 rounded-2xl font-black text-slate-400 hover:text-[#f58d2f] hover:bg-orange-50 transition-all text-[11px] uppercase tracking-widest border-2 border-slate-50 hover:border-orange-100 flex items-center justify-center gap-2"
              >
                <Maximize2 size={18} />
                Expandir
              </button>

              <button 
                onClick={downloadPdf} 
                className="flex-[1.5] flex items-center justify-center gap-3 px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all duration-300 bg-gradient-to-br from-[#f58d2f] to-[#e87a1c] text-white shadow-xl shadow-orange-100 hover:-translate-y-1 active:scale-[0.98]"
              >
                <Download size={20} />
                Descargar Soporte
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default PdfModal;