'use client';

import type { ReactNode } from 'react';
import type { IconType } from 'react-icons';
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from './ui/sidebar';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from './ui/tooltip';

export type NavMainItem =
	| { title: string; url: string; icon?: IconType }
	| { title: string; onClick: () => void; icon?: IconType }
	| {
			title: string;
			icon?: IconType;
			disabled: true;
			tooltip?: string;
		};

const navBtnCollapsed =
	'min-w-0 group-data-[state=collapsed]/sidebar:justify-center group-data-[state=collapsed]/sidebar:gap-0';

function NavTitle({ children }: { children: ReactNode }) {
	return (
		<span className="truncate group-data-[state=collapsed]/sidebar:hidden">
			{children}
		</span>
	);
}

function wrapWithLabelTooltip(node: ReactNode, label: string) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<span className="flex min-w-0 max-w-full">{node}</span>
			</TooltipTrigger>
			<TooltipContent side="right" align="center">
				{label}
			</TooltipContent>
		</Tooltip>
	);
}

function NavItemContent({ item }: { item: NavMainItem }) {
	const icon =
		'icon' in item && item.icon ? (
			<item.icon className="size-4 shrink-0" aria-hidden />
		) : null;

	if ('disabled' in item && item.disabled) {
		const button = (
			<SidebarMenuButton
				type="button"
				title={item.title}
				disabled
				className={`flex items-center gap-2 text-neutral-400 hover:bg-transparent hover:text-neutral-400 dark:text-neutral-500 dark:hover:bg-transparent dark:hover:text-neutral-500 ${navBtnCollapsed}`}
			>
				{icon}
				<NavTitle>{item.title}</NavTitle>
			</SidebarMenuButton>
		);
		if (item.tooltip) {
			return (
				<Tooltip>
					<TooltipTrigger asChild>
						<span className="flex w-full min-w-0 cursor-not-allowed">
							{button}
						</span>
					</TooltipTrigger>
					<TooltipContent side="right" align="center" className="max-w-xs">
						<p className="font-medium leading-tight">{item.title}</p>
						<p className="mt-1 text-xs text-muted-foreground">{item.tooltip}</p>
					</TooltipContent>
				</Tooltip>
			);
		}
		return button;
	}

	if ('onClick' in item && item.onClick) {
		const button = (
			<SidebarMenuButton
				type="button"
				title={item.title}
				onClick={item.onClick}
				className={`flex items-center gap-2 ${navBtnCollapsed}`}
			>
				{icon}
				<NavTitle>{item.title}</NavTitle>
			</SidebarMenuButton>
		);
		return wrapWithLabelTooltip(button, item.title);
	}

	const button = (
		<SidebarMenuButton
			asChild
			title={item.title}
			className={navBtnCollapsed}
		>
			<a
				href={'url' in item ? item.url : '#'}
				className="flex min-w-0 items-center gap-2"
			>
				{icon}
				<NavTitle>{item.title}</NavTitle>
			</a>
		</SidebarMenuButton>
	);
	return wrapWithLabelTooltip(button, item.title);
}

export function NavMain({ items }: { items: NavMainItem[] }) {
	return (
		<SidebarGroup className="min-w-0">
			<SidebarGroupContent className="flex min-w-0 flex-col gap-2">
				<SidebarMenu className="min-w-0">
					{items.map((item) => (
						<SidebarMenuItem key={item.title} className="min-w-0">
							<NavItemContent item={item} />
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
