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

/** Marca “V” vectorial (se ve nítida en sidebar colapsado ~3.5rem). */
function VoomLogoMark({ className = '' }: { className?: string }) {
	return (
		<span
			className={`box-border flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground ${className}`}
			aria-hidden
		>
			<svg
				viewBox="0 0 24 24"
				className="size-[15px]"
				fill="none"
				stroke="currentColor"
				strokeWidth={2.5}
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<path d="M6 5l6 14 6-14" />
			</svg>
		</span>
	);
}

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar
			collapsible="icon"
			className="overflow-x-hidden border-r border-border bg-background"
			{...props}
		>
			<SidebarHeader className="min-w-0 gap-0 px-2 group-data-[state=collapsed]/sidebar:p-2">
				<SidebarMenu className="min-w-0 w-full">
					<SidebarMenuItem className="w-full">
						<SidebarMenuButton
							asChild
							className="min-w-0 p-1.5 group-data-[state=collapsed]/sidebar:h-9 group-data-[state=collapsed]/sidebar:w-full group-data-[state=collapsed]/sidebar:p-0! group-data-[state=collapsed]/sidebar:justify-center"
						>
							<Link
								href="/"
								className="flex w-full max-w-full items-center gap-2 overflow-visible group-data-[state=collapsed]/sidebar:h-9 group-data-[state=collapsed]/sidebar:justify-center group-data-[state=collapsed]/sidebar:gap-0 group-data-[state=expanded]/sidebar:min-w-0"
							>
								<VoomLogoMark />
								<span className="min-w-0 truncate text-lg font-semibold tracking-tight group-data-[state=collapsed]/sidebar:hidden">
									Voom
								</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent className="min-w-0 overflow-x-hidden">
				<NavMain items={navMainItems} />
			</SidebarContent>
			<SidebarFooter className="min-w-0 overflow-x-hidden">
				<NavUser />
			</SidebarFooter>
		</Sidebar>
	);
}
