'use client';

interface ActionMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onNewFolder: () => void;
    darkMode: boolean;
}

export default function ActionMenu({ isOpen, onClose, onNewFolder, darkMode }: ActionMenuProps) {
    if (!isOpen) return null;

    const theme = {
        actionMenuBg: darkMode ? 'bg-[#1C1C1E]/80' : 'bg-[#F9F9F9]/80',
    };

    return (
        <>
            {/* Backdrop */}
            <div className="absolute inset-0 z-40" onClick={onClose} />
            {/* Dropdown Menu */}
            <div className="absolute top-14 right-4 z-50 animate-scale-in">
                <div
                    className={`${theme.actionMenuBg} backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden min-w-[240px] border`}
                    style={{ willChange: 'backdrop-filter' }}
                >
                    <button
                        onClick={onNewFolder}
                        className={`w-full py-3 px-4 flex items-center gap-3 text-left font-medium active:bg-white/20 transition-colors border-b ${darkMode ? 'text-white border-gray-700' : 'text-black border-gray-200'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                            />
                        </svg>
                        <span>New Folder</span>
                    </button>
                    <button
                        onClick={() => onClose()} // Placeholder for shared
                        className={`w-full py-3 px-4 flex items-center gap-3 text-left font-medium active:bg-white/20 transition-colors border-b ${darkMode ? 'text-white border-gray-700' : 'text-black border-gray-200'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                        </svg>
                        <span>Shared Folder</span>
                    </button>
                    <button
                        onClick={() => onClose()} // Placeholder for upload
                        className={`w-full py-3 px-4 flex items-center gap-3 text-left font-medium active:bg-white/20 transition-colors border-b ${darkMode ? 'text-white border-gray-700' : 'text-black border-gray-200'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                        </svg>
                        <span>Upload File</span>
                    </button>
                    <button
                        onClick={() => onClose()} // Placeholder for sorting
                        className={`w-full py-3 px-4 flex items-center gap-3 text-left font-medium active:bg-white/20 transition-colors ${darkMode ? 'text-white' : 'text-black'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                            />
                        </svg>
                        <span>Sorting</span>
                    </button>
                </div>
            </div>
        </>
    );
}
