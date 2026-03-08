import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Maximize2, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import api from '../../api/axiosConfig';

function PdfModal({ show, onClose, pdfUrl, invoiceId }) {
  const [downloading, setDownloading] = useState(null); // 'pdf', 'excel', 'word'
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

  const downloadFile = async (format) => {
    if (downloading) return;
    setDownloading(format);
    try {
      const endpoint = format === 'pdf' ? `invoices/${invoiceId}/pdf/` : format === 'excel' ? `invoices/${invoiceId}/excel/` : `invoices/${invoiceId}/word/`;
      const extension = format === 'pdf' ? 'pdf' : format === 'excel' ? 'xlsx' : 'docx';
      
      const res = await api.get(endpoint, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `cuenta_${invoiceId}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file", error);
    } finally {
      setDownloading(null);
    }
  };

  const modalContent = (
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
            <button onClick={() => downloadFile('excel')} disabled={!!downloading} className={`p-2 rounded-lg transition-colors ${downloading === 'excel' ? 'animate-pulse text-green-600 bg-green-50' : 'text-slate-400 hover:text-green-600 hover:bg-green-50'}`} title="Descargar Excel">
              {downloading === 'excel' ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
            </button>
            <button onClick={() => downloadFile('word')} disabled={!!downloading} className={`p-2 rounded-lg transition-colors ${downloading === 'word' ? 'animate-pulse text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`} title="Descargar Word">
              {downloading === 'word' ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
            </button>
            <button onClick={() => downloadFile('pdf')} disabled={!!downloading} className={`p-2 rounded-lg transition-colors ${downloading === 'pdf' ? 'animate-pulse text-[#f58d2f] bg-orange-50' : 'text-slate-400 hover:text-[#f58d2f] hover:bg-orange-50'}`} title="Descargar PDF">
              {downloading === 'pdf' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
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
          <button 
            onClick={() => downloadFile('pdf')} 
            disabled={!!downloading} 
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest text-white transition-colors ${downloading === 'pdf' ? 'bg-orange-400 cursor-wait' : 'bg-[#f58d2f] hover:bg-[#e87a1c]'}`}
          >
            {downloading === 'pdf' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} 
            {downloading === 'pdf' ? 'Procesando...' : 'Descargar'}
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

        <div className="w-full grid grid-cols-3 gap-2 mt-2">
          <button
            onClick={() => downloadFile('pdf')}
            disabled={!!downloading}
            className={`flex flex-col items-center justify-center gap-2 py-4 px-1 rounded-2xl border-2 transition-all active:scale-95 ${downloading === 'pdf' ? 'bg-orange-100 border-orange-200 text-orange-400 animate-pulse' : 'bg-orange-50 border-orange-100 text-[#f58d2f] hover:bg-orange-100'}`}
          >
            {downloading === 'pdf' ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
            <span className="text-[10px]">{downloading === 'pdf' ? 'Wait...' : 'PDF'}</span>
          </button>
          <button
            onClick={() => downloadFile('excel')}
            disabled={!!downloading}
            className={`flex flex-col items-center justify-center gap-2 py-4 px-1 rounded-2xl border-2 transition-all active:scale-95 ${downloading === 'excel' ? 'bg-green-100 border-green-200 text-green-400 animate-pulse' : 'bg-green-50 border-green-100 text-green-600 hover:bg-green-100'}`}
          >
            {downloading === 'excel' ? <Loader2 size={20} className="animate-spin" /> : <FileSpreadsheet size={20} />}
            <span className="text-[10px]">{downloading === 'excel' ? 'Wait...' : 'Excel'}</span>
          </button>
          <button
            onClick={() => downloadFile('word')}
            disabled={!!downloading}
            className={`flex flex-col items-center justify-center gap-2 py-4 px-1 rounded-2xl border-2 transition-all active:scale-95 ${downloading === 'word' ? 'bg-blue-100 border-blue-200 text-blue-400 animate-pulse' : 'bg-blue-50 border-blue-100 text-blue-600 hover:bg-blue-100'}`}
          >
            {downloading === 'word' ? <Loader2 size={20} className="animate-spin" /> : <FileText size={20} />}
            <span className="text-[10px]">{downloading === 'word' ? 'Wait...' : 'Word'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default PdfModal;