import { create } from "zustand";

interface CommandPaletteState {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	toggle: () => void;
}

export const useCommandPaletteStore = create<CommandPaletteState>((set) => ({
	isOpen: false,
	setIsOpen: (open) => set({ isOpen: open }),
	toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));
