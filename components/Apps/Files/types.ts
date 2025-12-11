export interface FileItem {
    id: string;
    name: string;
    type: 'file' | 'folder';
    size?: string;
    date?: string;
    modified: string;
    itemCount?: string;
}

export interface FolderPath {
    id: string | null;
    name: string;
}
