'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '../../../components/ui/alert-dialog';

/**
 * Confirma descartar la grabación actual (misma copia en RecordingFlow y Recorder).
 */
export function DiscardRecordingDialog({
	trigger,
	onConfirm,
}: {
	trigger: ReactNode;
	onConfirm: () => void;
}) {
	const [open, setOpen] = useState(false);

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>¿Descartar esta grabación?</AlertDialogTitle>
					<AlertDialogDescription className="text-sm text-muted-foreground">
						Si no lo descargaste, no hay forma de recuperarlo.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancelar</AlertDialogCancel>
					<AlertDialogAction
						type="button"
						onClick={() => onConfirm()}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						Sí, descartar
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
