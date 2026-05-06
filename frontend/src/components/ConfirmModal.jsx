import React from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm modal-overlay">
      <div className="bg-[#1A1A1D] border border-red-900/50 p-6 rounded-lg w-[400px] shadow-2xl modal-content" style={{ padding: '24px', width: '400px' }}>
        <div className="flex items-center gap-3 mb-4" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <AlertTriangle size={24} color="#EF4444" />
          <h2 className="text-xl font-semibold text-white m-0" style={{ margin: 0, color: '#ffffff', fontSize: '1.25rem', fontWeight: '600' }}>{title}</h2>
        </div>
        <p className="text-gray-400 text-sm mb-6" style={{ color: '#9CA3AF', fontSize: '0.875rem', marginBottom: '24px', lineHeight: '1.5' }}>
          {message}
        </p>
        <div className="flex justify-end gap-3 modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button 
            className="px-4 py-2 text-sm font-medium text-gray-400 bg-transparent border border-white/10 rounded hover:bg-white/5 hover:text-white transition-colors btn-cancel"
            onClick={onCancel}
            style={{ background: 'transparent', color: '#8B8B9B', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button 
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
            onClick={onConfirm}
            style={{ background: '#DC2626', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
