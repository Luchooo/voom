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
		<SidebarProvider className="h-svh max-h-svh min-h-0 overflow-hidden">
			<AppSidebar />
			<SidebarInset className="flex min-h-0 flex-1 flex-col overflow-hidden">
				<header className="relative z-60 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
					<SidebarTrigger />
					<span className="text-sm font-medium text-muted-foreground">
						Grabar video
					</span>
				</header>
				<main className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden p-6">
					<RecorderPage showMp4Option={showMp4Option} />
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}
