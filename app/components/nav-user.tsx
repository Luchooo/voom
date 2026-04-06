'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { IoEllipsisVertical, IoLogOutOutline } from 'react-icons/io5';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from '../components/ui/sidebar';

/**
 * Usuario en el footer del sidebar: avatar, nombre, email y menú
 * (Cuenta, Facturación, Notificaciones, Cerrar sesión).
 */
export function NavUser() {
	const { user, logout } = useAuth();
	const router = useRouter();
	const { isMobile, state } = useSidebar();

	const displayName =
		user?.displayName ?? user?.email?.split('@')[0] ?? 'Usuario';
	const email = user?.email ?? '';
	const photoURL = user?.photoURL ?? '';
	const initial = displayName.charAt(0).toUpperCase();

	const handleLogout = () => {
		logout().then(() => router.push('/'));
	};

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							className="h-auto min-w-0 py-2 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground group-data-[state=collapsed]/sidebar:size-9 group-data-[state=collapsed]/sidebar:justify-center group-data-[state=collapsed]/sidebar:p-0 group-data-[state=collapsed]/sidebar:py-0"
							title={state === 'collapsed' ? displayName : undefined}
						>
							<Avatar className="h-8 w-8 shrink-0 rounded-lg">
								<AvatarImage src={photoURL || undefined} alt={displayName} />
								<AvatarFallback className="rounded-lg">
									{initial}
								</AvatarFallback>
							</Avatar>
							<div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[state=collapsed]/sidebar:hidden">
								<span className="truncate font-medium">{displayName}</span>
								{email && (
									<span className="truncate text-xs text-muted-foreground">
										{email}
									</span>
								)}
							</div>
							<IoEllipsisVertical className="ml-auto size-4 shrink-0 group-data-[state=collapsed]/sidebar:hidden" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="min-w-56 rounded-lg"
						side={isMobile ? 'bottom' : 'right'}
						align="end"
						sideOffset={4}
					>
						<DropdownMenuLabel className="p-0 font-normal">
							<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
								<Avatar className="h-8 w-8 rounded-lg">
									<AvatarImage src={photoURL || undefined} alt={displayName} />
									<AvatarFallback className="rounded-lg">
										{initial}
									</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">{displayName}</span>
									{email && (
										<span className="truncate text-xs text-muted-foreground">
											{email}
										</span>
									)}
								</div>
							</div>
						</DropdownMenuLabel>
						{/* <DropdownMenuSeparator /> */}
						{/* <DropdownMenuGroup>
							<DropdownMenuItem>
								<IoPersonCircleOutline className="mr-2 size-4" />
								Cuenta
							</DropdownMenuItem>
							<DropdownMenuItem>
								<IoCardOutline className="mr-2 size-4" />
								Facturación
							</DropdownMenuItem>
							<DropdownMenuItem>
								<IoNotificationsOutline className="mr-2 size-4" />
								Notificaciones
							</DropdownMenuItem>
						</DropdownMenuGroup> */}
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={handleLogout}>
							<IoLogOutOutline className="mr-2 size-4" />
							Cerrar sesión
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
