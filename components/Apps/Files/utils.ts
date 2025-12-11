import { FileItem } from './types';

// Helper to loading file system from localStorage
export const loadFileSystem = (): { items: FileItem[] } => {
    if (typeof window === 'undefined') return { items: [] };
    const saved = localStorage.getItem('fileSystem');
    if (saved) {
        return JSON.parse(saved);
    }
    // Default initial state
    return {
        items: [
            { id: '1', name: 'Downloads', type: 'folder', modified: new Date().toISOString() },
            { id: '2', name: 'Documents', type: 'folder', modified: new Date().toISOString() },
            { id: '3', name: 'Images', type: 'folder', modified: new Date().toISOString() },
            {
                id: '4',
                name: 'Project Proposal.pdf',
                type: 'file',
                size: '2.4 MB',
                modified: new Date().toISOString(),
            },
            {
                id: '5',
                name: 'Budget.xlsx',
                type: 'file',
                size: '1.1 MB',
                modified: new Date().toISOString(),
            },
        ],
    };
};

// Helper to save file system
export const saveFileSystem = (items: FileItem[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('fileSystem', JSON.stringify({ items }));
};

// Helper to get items in a folder
export const getItemsInFolder = (folderId: string | null) => {
    const fs = loadFileSystem();
    // For this simple implementation, we'll just return all items for root
    // In a real app, you'd filter by parentId
    if (folderId === null) return fs.items;
    return []; // Subfolders not fully implemented in this demo structure
};

// Helper to get item count for a folder
export const getItemCount = (_folderId: string) => {
    // Mock implementation
    return Math.floor(Math.random() * 10) + ' items';
};
