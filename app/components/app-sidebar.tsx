'use client';

import Link from 'next/link';
import * as React from 'react';
import { IoMailOutline } from 'react-icons/io5';
import { NavMain, type NavMainItem } from './nav-main';
import { NavUser } from './nav-user';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from './ui/sidebar';

const navMainItems: NavMainItem[] = [
	{
		title: 'Feedback',
		icon: IoMailOutline,
		disabled: true,
		tooltip: 'Próximamente',
	},
];

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar
			collapsible="icon"
			className="border-r border-border bg-[#fafafa] dark:bg-[#171717]"
			{...props}
		>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton asChild className="p-1.5">
							<Link href="/" className="flex items-center gap-2">
								<span className="text-2xl font-semibold">Voom</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={navMainItems} />
			</SidebarContent>
			<SidebarFooter>
				<NavUser />
			</SidebarFooter>
		</Sidebar>
	);
}
