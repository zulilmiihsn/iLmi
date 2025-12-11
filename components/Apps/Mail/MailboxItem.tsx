'use client';

import { memo } from 'react';
import { Mailbox } from './types';

interface MailboxItemProps {
    item: Mailbox;
    isActive: boolean;
    onClick: () => void;
    darkMode: boolean;
}

function MailboxItem({ item, isActive, onClick, darkMode }: MailboxItemProps) {
    return (
        <div
            onClick={onClick}
            className={`flex items-center justify-between px-4 py-3 cursor-pointer select-none transition-colors border-b ${darkMode ? 'border-gray-800 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-100'
                } ${isActive ? (darkMode ? 'bg-gray-800' : 'bg-blue-50') : ''}`}
        >
            <div className="flex items-center gap-3">
                <div className={`w-6 text-center ${item.type === 'smart' ? 'text-blue-500' : 'text-gray-400'}`}>
                    <i className={`fas ${item.icon}`}></i>
                </div>
                <span className={`font-medium ${darkMode ? 'text-white' : 'text-black'}`}>{item.name}</span>
            </div>
            <div className="flex items-center gap-2">
                {item.count !== undefined && item.count > 0 && (
                    <span className="text-gray-400 text-sm">{item.count}</span>
                )}
                <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
            </div>
        </div>
    );
}

export default memo(MailboxItem);
