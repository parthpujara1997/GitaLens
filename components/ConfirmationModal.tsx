
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    isDestructive = false
}) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
                >
                    <div className="p-6 text-center space-y-3">
                        <h3 className="text-lg font-serif font-semibold text-charcoal">{title}</h3>
                        <p className="text-sm text-stone-600 leading-relaxed">{message}</p>
                    </div>
                    <div className="flex border-t border-stone-100">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-3 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
                        >
                            {cancelLabel}
                        </button>
                        <div className="w-px bg-stone-100"></div>
                        <button
                            onClick={onConfirm}
                            className={`flex-1 px-4 py-3 text-sm font-bold hover:bg-stone-50 transition-colors ${isDestructive ? 'text-red-500' : 'text-indigo'}`}
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ConfirmationModal;
