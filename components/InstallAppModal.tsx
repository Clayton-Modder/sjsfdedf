import React from 'react';
import { Download, Cast, X } from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void; // Trigger native cast
  onDismiss: () => void; // Just close modal
  onConfirm: () => void; // Download app
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose, onDismiss, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden relative animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
            onClick={onDismiss}
            className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
            aria-label="Fechar"
        >
            <X className="w-5 h-5" />
        </button>

        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-5 border border-blue-100 dark:border-blue-500/30">
             <Cast className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
            Melhorar Transmissão
          </h3>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm leading-relaxed">
            Para maior estabilidade e compatibilidade com sua TV, recomendamos usar nosso app parceiro <strong>Cast to TV</strong>.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={onConfirm}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-blue-500/25"
            >
              <Download className="w-5 h-5" />
              Baixar App (Recomendado)
            </button>
            
            <button
              onClick={onClose}
              className="w-full py-3 px-4 bg-transparent border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-colors text-sm"
            >
              Continuar com Navegador
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
