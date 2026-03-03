import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'success') => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <ToastList toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
}

function ToastList({ toasts, onRemove }) {
    if (toasts.length === 0) return null;
    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
            {toasts.map(t => (
                <Toast key={t.id} toast={t} onRemove={onRemove} />
            ))}
        </div>
    );
}

function Toast({ toast, onRemove }) {
    const styles = {
        success: 'bg-white border-emerald-200 text-emerald-700',
        error: 'bg-white border-red-200 text-red-600',
        info: 'bg-white border-orange-200 text-[#f58d2f]',
        warning: 'bg-white border-amber-200 text-amber-600',
    };

    const dots = {
        success: 'bg-emerald-400',
        error: 'bg-red-400',
        info: 'bg-[#f58d2f]',
        warning: 'bg-amber-400',
    };

    return (
        <div
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg text-sm font-bold animate-in slide-in-from-right-4 fade-in duration-300 max-w-xs ${styles[toast.type] || styles.info}`}
        >
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dots[toast.type] || dots.info}`} />
            <span className="flex-1 leading-snug">{toast.message}</span>
            <button
                onClick={() => onRemove(toast.id)}
                className="ml-1 opacity-50 hover:opacity-100 transition-opacity text-lg leading-none"
            >
                ×
            </button>
        </div>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx.addToast;
}
