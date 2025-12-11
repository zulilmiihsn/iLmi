'use client';

interface ActionSheetProps {
    isOpen: boolean;
    onClose: () => void;
    itemName: string;
    onRename: () => void;
    onDelete: () => void;
    darkMode: boolean;
}

export default function ActionSheet({
    isOpen,
    onClose,
    itemName,
    onRename,
    onDelete,
    darkMode,
}: ActionSheetProps) {
    if (!isOpen) return null;

    const theme = {
        text: darkMode ? 'text-white' : 'text-black',
    };

    return (
        <div
            className="absolute inset-0 backdrop-blur-sm bg-black/30 flex items-end justify-center z-50 animate-fade-in"
            onClick={onClose}
        >
            <div
                className={`${darkMode ? 'bg-[#1C1C1E]/95 border-gray-700' : 'bg-white/95 border-gray-200/50'} backdrop-blur-md rounded-t-2xl w-full max-w-md pb-safe animate-slide-up shadow-2xl transition-colors`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={`p-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200/50'}`}>
                    <h3 className={`text-center font-semibold ${theme.text}`}>{itemName}</h3>
                </div>
                <div className={`divide-y ${darkMode ? 'divide-gray-800' : 'divide-gray-200/50'}`}>
                    <button
                        onClick={onRename}
                        className="w-full py-4 text-center text-blue-500 font-medium active:bg-gray-100/10 transition-colors"
                    >
                        Rename
                    </button>
                    <button
                        onClick={onDelete}
                        className="w-full py-4 text-center text-red-500 font-medium active:bg-gray-100/10 transition-colors"
                    >
                        Delete
                    </button>
                </div>
                <div className={`h-2 ${darkMode ? 'bg-gray-800' : 'bg-gray-100/50'}`} />
                <button
                    onClick={onClose}
                    className="w-full py-4 text-center text-blue-500 font-semibold active:bg-gray-100/10 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
