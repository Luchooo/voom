'use client';

import type { RecordingResult } from '@voom/types/recorder';
import { Button } from '../../../components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';

function formatDuration(s: number): string {
	const m = Math.floor(s / 60);
	const sec = Math.floor(s % 60);
	return `${m}:${sec.toString().padStart(2, '0')}`;
}

export interface VersionDropdownProps {
	versions: RecordingResult[];
	currentVersionIndex: number;
	onSelectVersion: (index: number) => void;
	onEditVideo: () => void;
}

/** Mismo patrón que Descargar: botón "Editar video" + chevron que abre menú con Original / Edición 1, 2… */
export function VersionDropdown({
	versions,
	currentVersionIndex,
	onSelectVersion,
	onEditVideo,
}: VersionDropdownProps) {
	return (
		<div className="relative flex">
			<Button
				type="button"
				variant="secondary"
				size="lg"
				onClick={onEditVideo}
				className="min-w-40 rounded-r-none border-2 border-border"
			>
				Editar video
			</Button>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						type="button"
						variant="secondary"
						size="icon"
						className="h-10 w-10 rounded-l-none border-2 border-l-0 border-border [&_svg]:h-5 [&_svg]:w-5"
						aria-expanded="false"
						aria-haspopup="true"
						aria-label="Elegir versión del video"
					>
						<svg
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M19 9l-7 7-7-7"
							/>
						</svg>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="min-w-[200px]">
					{versions.map((v, i) => (
						<DropdownMenuItem
							key={i}
							onClick={() => onSelectVersion(i)}
							className={
								i === currentVersionIndex ? 'bg-muted font-medium' : ''
							}
						>
							{i === 0 ? 'Original' : `Edición ${i}`}
							<span className="ml-2 text-muted-foreground">
								({formatDuration(v.durationSeconds)})
							</span>
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
