import { create } from 'zustand';

interface ControlCenterStore {
	isOpen: boolean;
	open: () => void;
	close: () => void;
	toggle: () => void;
}

export const useControlCenterStore = create<ControlCenterStore>((set) => ({
	isOpen: false,
	open: () => set({ isOpen: true }),
	close: () => set({ isOpen: false }),
	toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));

