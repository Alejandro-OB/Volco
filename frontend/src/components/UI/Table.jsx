import React, { createContext, useContext } from 'react';

const SizeContext = createContext('md');
const ALIGN = { left: 'text-left', center: 'text-center', right: 'text-right' };

export function TableContainer({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-100 overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function Table({ children, size = 'md', className = '', ...props }) {
  return (
    <SizeContext.Provider value={size}>
      <table className={`w-full ${className}`} {...props}>
        {children}
      </table>
    </SizeContext.Provider>
  );
}

export function TableHead({ children, className = '', ...props }) {
  return (
    <thead className={`bg-slate-50 border-b border-slate-100 ${className}`} {...props}>
      {children}
    </thead>
  );
}

export function Th({ children, className = '', align = 'left', ...props }) {
  const size = useContext(SizeContext);
  return (
    <th
      className={`${size === 'sm' ? 'px-4 py-2' : 'px-5 py-3'} text-sm font-medium text-slate-500 ${ALIGN[align] ?? 'text-left'} ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableBody({ children, className = '', ...props }) {
  return (
    <tbody className={`divide-y divide-slate-100 ${className}`} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '', ...props }) {
  return (
    <tr
      className={`hover:bg-slate-50/60 transition-colors group ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function Td({ children, className = '', align = 'left', ...props }) {
  const size = useContext(SizeContext);
  return (
    <td
      className={`${size === 'sm' ? 'px-4 py-2' : 'px-5 py-3.5'} ${ALIGN[align] ?? 'text-left'} ${className}`}
      {...props}
    >
      {children}
    </td>
  );
}
