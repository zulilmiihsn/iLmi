import { create } from 'zustand';
import type { WindowState } from '../types';
import { WINDOW } from '../constants';

let nextZIndex = WINDOW.Z_INDEX_START;

interface WindowsStore {
	windows: WindowState[];
	openWindow: (
		window: Omit<WindowState, 'id' | 'zIndex' | 'isFocused'> & {
			originRect?: { x: number; y: number; width: number; height: number };
		}
	) => string;
	closeWindow: (id: string) => void;
	focusWindow: (id: string) => void;
	minimizeWindow: (id: string) => void;
	maximizeWindow: (id: string) => void;
	updateWindowPosition: (id: string, x: number, y: number) => void;
	updateWindowSize: (id: string, width: number, height: number) => void;
	updateWindow: (id: string, updates: Partial<WindowState>) => void;
}

export const useWindowsStore = create<WindowsStore>()((set, _get) => ({
	windows: [],
	openWindow: window => {
		const id = `window-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		const newWindow: WindowState = {
			...window,
			id,
			zIndex: nextZIndex++,
			isFocused: true,
		};

		set(state => ({
			windows: state.windows.map(w => ({ ...w, isFocused: false })).concat(newWindow),
		}));

		return id;
	},
	closeWindow: (id: string) => {
		set(state => ({
			windows: state.windows.filter(w => w.id !== id),
		}));
	},
	focusWindow: (id: string) => {
		set(state => ({
			windows: state.windows.map(w => ({
				...w,
				isFocused: w.id === id,
				zIndex: w.id === id ? nextZIndex++ : w.zIndex,
			})),
		}));
	},
	minimizeWindow: (id: string) => {
		set(state => ({
			windows: state.windows.map(w => (w.id === id ? { ...w, isMinimized: true } : w)),
		}));
	},
	maximizeWindow: (id: string) => {
		set(state => ({
			windows: state.windows.map(w => (w.id === id ? { ...w, isMaximized: !w.isMaximized } : w)),
		}));
	},
	updateWindowPosition: (id: string, x: number, y: number) => {
		set(state => ({
			windows: state.windows.map(w => (w.id === id ? { ...w, x, y } : w)),
		}));
	},
	updateWindowSize: (id: string, width: number, height: number) => {
		set(state => ({
			windows: state.windows.map(w => (w.id === id ? { ...w, width, height } : w)),
		}));
	},
	updateWindow: (id: string, updates: Partial<WindowState>) => {
		set(state => ({
			windows: state.windows.map(w => (w.id === id ? { ...w, ...updates } : w)),
		}));
	},
}));
