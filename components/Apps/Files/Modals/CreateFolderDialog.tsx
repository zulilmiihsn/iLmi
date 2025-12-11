'use client';

interface CreateFolderDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: () => void;
    folderName: string;
    onFolderNameChange: (name: string) => void;
    darkMode: boolean;
}

export default function CreateFolderDialog({
    isOpen,
    onClose,
    onCreate,
    folderName,
    onFolderNameChange,
    darkMode,
}: CreateFolderDialogProps) {
    if (!isOpen) return null;

    const theme = {
        modalBg: darkMode ? 'bg-[#1C1C1E]/80' : 'bg-[#F9F9F9]/80',
        text: darkMode ? 'text-white' : 'text-black',
        textSecondary: darkMode ? 'text-[#8E8E93]' : 'text-[#8E8E93]',
        modalInputBg: darkMode ? 'bg-[#2C2C2E]' : 'bg-white',
    };

    return (
        <div className="absolute inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 animate-fade-in">
            <div
                className={`${theme.modalBg} backdrop-blur-md rounded-2xl w-72 p-0 shadow-2xl animate-scale-in transition-colors`}
            >
                <div className="p-4 text-center">
                    <h3 className={`text-lg font-semibold mb-1 ${theme.text}`}>New Folder</h3>
                    <p className={`text-sm mb-4 ${theme.textSecondary}`}>Enter a name for this folder.</p>
                    <input
                        type="text"
                        value={folderName}
                        onChange={(e) => onFolderNameChange(e.target.value)}
                        placeholder="Name"
                        className={`w-full px-3 py-2 rounded-lg border-none outline-none text-center ${theme.modalInputBg}`}
                        autoFocus
                    />
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
                        onClick={onCreate}
                        disabled={!folderName.trim()}
                        className="flex-1 py-3 text-blue-500 font-semibold active:bg-blue-500/10 disabled:text-gray-400 transition-colors"
                    >
                        Create
                    </button>
                </div>
            </div>
        </div>
    );
}
