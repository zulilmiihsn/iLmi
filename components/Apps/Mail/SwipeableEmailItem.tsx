'use client';

import { useState, useRef, memo } from 'react';
import { Email } from './types';

interface SwipeableEmailItemProps {
    email: Email;
    isSelected: boolean;
    isEditing: boolean;
    isChecked: boolean;
    onClick: () => void;
    onDelete: () => void;
    onArchive: () => void;
    darkMode: boolean;
}

function SwipeableEmailItem({
    email,
    isSelected,
    isEditing,
    isChecked,
    onClick,
    onDelete,
    onArchive,
    darkMode,
}: SwipeableEmailItemProps) {
    const [offset, setOffset] = useState(0);
    const startX = useRef<number | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (isEditing) return;
        startX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (startX.current === null || isEditing) return;
        const currentX = e.touches[0].clientX;
        const diff = currentX - startX.current;
        // Only allow swiping left
        if (diff < 0) {
            setOffset(Math.max(diff, -140)); // Max swipe distance
        }
    };

    const handleTouchEnd = () => {
        if (startX.current === null || isEditing) return;
        if (offset < -100) {
            // Swiped far enough - show actions or auto-delete if very far
            // keeping it simple: just snap open
            setOffset(-140);
        } else {
            // Snap back
            setOffset(0);
        }
        startX.current = null;
    };

    // Reset swipe when editing or selection changes
    if ((isEditing || isSelected) && offset !== 0) {
        setOffset(0);
    }

    return (
        <div className="relative overflow-hidden">
            {/* Swipe Actions Background */}
            <div className="absolute inset-0 flex flex-row-reverse">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="h-full w-[70px] bg-red-500 text-white flex flex-col items-center justify-center"
                >
                    <i className="fas fa-trash-alt mb-1"></i>
                    <span className="text-xs">Trash</span>
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onArchive();
                        setOffset(0);
                    }}
                    className="h-full w-[70px] bg-blue-500 text-white flex flex-col items-center justify-center"
                >
                    <i className="fas fa-archive mb-1"></i>
                    <span className="text-xs">Archive</span>
                </button>
            </div>

            {/* Foreground Content */}
            <div
                className={`relative transition-transform duration-200 ease-out border-b ${darkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'
                    } ${isSelected && !isEditing ? (darkMode ? 'bg-gray-800' : 'bg-blue-50') : ''}`}
                style={{ transform: `translateX(${offset}px)` }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={() => {
                    if (offset === 0) onClick();
                    else setOffset(0); // Close swipe on click
                }}
            >
                <div className="flex p-4">
                    {isEditing && (
                        <div className="mr-3 flex items-center justify-center">
                            <div
                                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isChecked
                                        ? 'bg-blue-500 border-blue-500 text-white'
                                        : darkMode
                                            ? 'border-gray-600'
                                            : 'border-gray-300'
                                    }`}
                            >
                                {isChecked && <i className="fas fa-check text-xs"></i>}
                            </div>
                        </div>
                    )}

                    <div className={`flex-1 min-w-0 ${email.read ? 'opacity-80' : 'opacity-100'}`}>
                        <div className="flex justify-between items-baseline mb-1">
                            <h3 className={`font-bold truncate pr-2 ${darkMode ? 'text-white' : 'text-black'}`}>
                                {email.from}
                            </h3>
                            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {email.date}
                            </span>
                        </div>
                        <div className={`text-sm mb-1 truncate ${darkMode ? 'text-white' : 'text-black'}`}>
                            {email.subject}
                        </div>
                        <div
                            className={`text-sm truncate line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}
                        >
                            {email.preview}
                        </div>
                    </div>

                    {/* Indicators */}
                    <div className="ml-2 flex flex-col items-center gap-2">
                        {!email.read && <div className="w-3 h-3 rounded-full bg-blue-500"></div>}
                        {email.isFlagged && <i className="fas fa-flag text-orange-500 text-xs"></i>}
                        {email.isVip && <i className="fas fa-star text-yellow-500 text-xs"></i>}
                        <i className="fas fa-chevron-right text-gray-300 text-xs mt-auto"></i>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default memo(SwipeableEmailItem);
