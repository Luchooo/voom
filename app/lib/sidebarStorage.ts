const STORAGE_KEY = "voom-sidebar-options";

export type SidebarStorageOptions = {
	/** true = barra expandida, false = modo icono */
	open: boolean;
};

export function loadSidebarOptions(): SidebarStorageOptions | null {
	if (typeof window === "undefined") return null;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as unknown;
		if (
			parsed &&
			typeof parsed === "object" &&
			"open" in parsed &&
			typeof (parsed as SidebarStorageOptions).open === "boolean"
		) {
			return { open: (parsed as SidebarStorageOptions).open };
		}
	} catch {
		// ignore
	}
	return null;
}

export function saveSidebarOptions(options: SidebarStorageOptions): void {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
	} catch {
		// ignore
	}
}
