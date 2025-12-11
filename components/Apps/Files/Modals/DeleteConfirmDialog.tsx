'use client';

interface DeleteConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    darkMode: boolean;
}

export default function DeleteConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    darkMode,
}: DeleteConfirmDialogProps) {
    if (!isOpen) return null;

    const theme = {
        modalBg: darkMode ? 'bg-[#1C1C1E]/80' : 'bg-[#F9F9F9]/80',
        text: darkMode ? 'text-white' : 'text-black',
        textSecondary: darkMode ? 'text-[#8E8E93]' : 'text-[#8E8E93]',
    };

    return (
        <div className="absolute inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 animate-fade-in">
            <div
                className={`${theme.modalBg} backdrop-blur-md rounded-2xl w-72 p-0 shadow-2xl animate-scale-in transition-colors`}
            >
                <div className="p-4 text-center">
                    <h3 className={`text-lg font-semibold mb-1 ${theme.text}`}>Delete Item?</h3>
                    <p className={`text-sm mb-4 ${theme.textSecondary}`}>This action cannot be undone.</p>
                </div>
                <div className={`flex border-t ${darkMode ? 'border-gray-700' : 'border-gray-300/50'}`}>
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 text-blue-500 font-medium active:bg-gray-100/10 transition-colors"
                    >
                        Cancel
                    </button>
                    <div className={`w-px ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-3 text-red-500 font-semibold active:bg-red-500/10 transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}
