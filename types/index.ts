export type Platform = 'ios' | 'macos';

export interface DeviceInfo {
	platform: Platform;
	isMobile: boolean;
	isTablet: boolean;
	isDesktop: boolean;
	screenWidth: number;
	screenHeight: number;
	hasTouch: boolean;
}

export interface WindowState {
	id: string;
	title: string;
	appId: string;
	x: number;
	y: number;
	width: number;
	height: number;
	isMaximized: boolean;
	isMinimized: boolean;
	zIndex: number;
	isFocused: boolean;
	originRect?: {
		x: number;
		y: number;
		width: number;
		height: number;
	};
}

export interface FileSystemItem {
	id: string;
	name: string;
	type: 'file' | 'folder';
	path: string;
	parentId: string | null;
	children?: FileSystemItem[];
	content?: string;
	size?: number;
	createdAt: number;
	modifiedAt: number;
}

export interface AppMetadata {
	id: string;
	name: string;
	icon: string;
	component: string;
	platform: Platform | 'both';
	showInDock?: boolean;
	showOnDesktop?: boolean;
}
