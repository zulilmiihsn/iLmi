'use client';

import { memo } from 'react';
import { Email } from './types';

interface EmailDetailProps {
    email: Email;
    onBack: () => void;
    onReply: () => void;
    onDelete: (id: string) => void;
    onArchive: (id: string) => void;
}

function EmailDetail({ email, onBack, onReply, onDelete, onArchive }: EmailDetailProps) {
    return (
        <div className="flex flex-col h-full bg-white dark:bg-black">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-800">
                <button onClick={onBack} className="flex items-center text-blue-500">
                    <i className="fas fa-chevron-left mr-1"></i>
                    Mailboxes
                </button>
                <div className="flex items-center gap-6 text-blue-500">
                    <button onClick={() => { }}>
                        <i className="fas fa-chevron-up"></i>
                    </button>
                    <button onClick={() => { }}>
                        <i className="fas fa-chevron-down"></i>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-lg font-bold text-gray-600 dark:text-gray-300">
                                {email.from.charAt(0)}
                            </div>
                            <div>
                                <div className="font-bold text-lg dark:text-white">{email.from}</div>
                                <div className="text-sm text-gray-500">To: Me</div>
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold mb-2 dark:text-white">{email.subject}</h1>
                        <div className="text-sm text-gray-500 mb-6">
                            {new Date(email.date).toLocaleDateString(undefined, {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: 'numeric',
                            })}
                        </div>
                    </div>
                    {email.isVip && <i className="fas fa-star text-yellow-500 text-xl"></i>}
                </div>

                <div className="prose dark:prose-invert max-w-none">
                    <p className="whitespace-pre-wrap text-lg leading-relaxed dark:text-gray-200">
                        {email.preview}
                        {'\n\n'}
                        Here is some more placeholder content to simulate a full email body.
                        {'\n\n'}
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                        incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                        exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                        {'\n\n'}
                        Best regards,
                        {'\n'}
                        {email.from}
                    </p>
                </div>
            </div>

            {/* Bottom Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                <button onClick={() => onDelete(email.id)} className="text-blue-500 p-2">
                    <i className="fas fa-trash-alt text-xl"></i>
                </button>
                <button onClick={() => onArchive(email.id)} className="text-blue-500 p-2">
                    <i className="fas fa-folder-open text-xl"></i>
                </button>
                <button onClick={onReply} className="text-blue-500 p-2">
                    <i className="fas fa-reply text-xl"></i>
                </button>
                <button className="text-blue-500 p-2">
                    <i className="fas fa-pen text-xl"></i>
                </button>
            </div>
        </div>
    );
}

export default memo(EmailDetail);
