'use client';

import { useState, useEffect, useRef, memo } from 'react';

interface ComposeModalProps {
    onClose: () => void;
    onSend: (to: string, subject: string, body: string) => void;
}

function ComposeModal({ onClose, onSend }: ComposeModalProps) {
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [isClosing, setIsClosing] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    // Animate in
    useEffect(() => {
        requestAnimationFrame(() => setIsVisible(true));
    }, []);

    const handleClose = () => {
        setIsClosing(true);
        // Wait for animation to finish before calling onClose
        // The onTransitionEnd handler will trigger the actual close
    };

    const handleSend = () => {
        if (!to) return;
        onSend(to, subject, body);
        handleClose();
    };

    const handleTransitionEnd = (e: React.TransitionEvent) => {
        if (e.target === modalRef.current && isClosing) {
            onClose();
        }
    };

    return (
        <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black transition-opacity duration-300 pointer-events-auto ${isVisible && !isClosing ? 'opacity-30' : 'opacity-0'
                    }`}
                onClick={handleClose}
            />

            {/* Modal */}
            <div
                ref={modalRef}
                className={`w-full h-[92%] sm:h-[80%] sm:w-[90%] sm:max-w-2xl bg-white dark:bg-gray-900 rounded-t-xl sm:rounded-xl shadow-2xl flex flex-col pointer-events-auto transition-transform duration-300 ease-out transform ${isVisible && !isClosing ? 'translate-y-0' : 'translate-y-full sm:translate-y-20 sm:opacity-0'
                    }`}
                onTransitionEnd={handleTransitionEnd}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-800">
                    <button onClick={handleClose} className="text-blue-500 font-medium">
                        Cancel
                    </button>
                    <span className="font-bold dark:text-white">New Message</span>
                    <button
                        onClick={handleSend}
                        disabled={!to}
                        className={`font-bold transition-colors ${to ? 'text-blue-500' : 'text-gray-300 dark:text-gray-700'
                            }`}
                    >
                        Send
                    </button>
                </div>

                {/* Fields */}
                <div className="flex flex-col">
                    <div className="flex items-center px-4 py-3 border-b dark:border-gray-800">
                        <span className="text-gray-500 w-16">To:</span>
                        <input
                            type="text"
                            value={to}
                            onChange={e => setTo(e.target.value)}
                            className="flex-1 bg-transparent outline-none dark:text-white"
                            autoFocus
                        />
                        <button className="text-blue-500 ml-2">
                            <i className="fas fa-plus-circle"></i>
                        </button>
                    </div>
                    <div className="flex items-center px-4 py-3 border-b dark:border-gray-800">
                        <span className="text-gray-500 w-16">Cc/Bcc, From:</span>
                        <span className="dark:text-white">user@ilmi.os</span>
                    </div>
                    <div className="flex items-center px-4 py-3 border-b dark:border-gray-800">
                        <span className="text-gray-500 w-16">Subject:</span>
                        <input
                            type="text"
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            className="flex-1 bg-transparent outline-none dark:text-white"
                        />
                    </div>
                </div>

                {/* Body */}
                <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    className="flex-1 p-4 bg-transparent outline-none resize-none dark:text-white font-sans text-lg"
                    placeholder="Message body..."
                />
            </div>
        </div>
    );
}

export default memo(ComposeModal);
