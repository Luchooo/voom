"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "../components/ui/avatar";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "../components/ui/sidebar";
import { Button } from "../components/ui/button";

/**
 * Sidebar del layout /record: datos del usuario y cerrar sesión.
 * Ver https://ui.shadcn.com/docs/components/radix/sidebar
 */
export function RecordSidebar() {
	const { user, logout } = useAuth();
	const router = useRouter();

	const displayName =
		user?.displayName ?? user?.email?.split("@")[0] ?? "Usuario";
	const email = user?.email ?? null;
	const photoURL = user?.photoURL ?? null;

	const handleLogout = () => {
		logout().then(() => router.push("/"));
	};

	return (
		<Sidebar collapsible="icon" className="border-r border-border">
			<SidebarHeader>
				<span className="font-semibold tracking-tight">Voom</span>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Cuenta</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton className="pointer-events-none cursor-default">
									<Avatar className="size-8 shrink-0">
										<AvatarImage src={photoURL ?? undefined} alt={displayName} />
										<AvatarFallback>
											{displayName.charAt(0).toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<span className="truncate">{displayName}</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
							{email && (
								<SidebarMenuItem>
									<SidebarMenuButton className="pointer-events-none cursor-default text-muted-foreground">
										<span className="truncate text-xs">{email}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							)}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<Button
							variant="outline"
							size="sm"
							className="w-full justify-start"
							onClick={handleLogout}
						>
							Cerrar sesión
						</Button>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
