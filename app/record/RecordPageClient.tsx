'use client';

import { RecorderPage } from '@voom/RecorderPage';
import { AppSidebar } from '../components/app-sidebar';
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from '../components/ui/sidebar';

type RecordPageClientProps = { showMp4Option: boolean };

/**
 * Página /record: Sidebar (dentro de la página para que se vea con el blur)
 * y flujo de grabación.
 */
export function RecordPageClient({ showMp4Option }: RecordPageClientProps) {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
					<SidebarTrigger />
					<span className="text-sm font-medium text-muted-foreground">
						Grabar video
					</span>
				</header>
				<main className="flex flex-1 flex-col items-center justify-center overflow-auto p-6">
					<RecorderPage showMp4Option={showMp4Option} />
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}
