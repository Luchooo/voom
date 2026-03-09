'use client';

import type { IconType } from 'react-icons';
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '../components/ui/sidebar';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '../components/ui/tooltip';

export type NavMainItem =
	| { title: string; url: string; icon?: IconType }
	| { title: string; onClick: () => void; icon?: IconType }
	| {
			title: string;
			icon?: IconType;
			disabled: true;
			tooltip?: string;
		};

function NavItemContent({
	item,
}: {
	item: NavMainItem;
}) {
	const content = (
		<>
			{'icon' in item && item.icon && (
				<item.icon className="size-4 shrink-0" />
			)}
			<span>{item.title}</span>
		</>
	);

	if ('disabled' in item && item.disabled) {
		return (
			<SidebarMenuButton
				type="button"
				title={item.title}
				disabled
				className="flex items-center gap-2 text-neutral-400 hover:bg-transparent hover:text-neutral-400 dark:text-neutral-500 dark:hover:bg-transparent dark:hover:text-neutral-500"
			>
				{content}
			</SidebarMenuButton>
		);
	}
	if ('onClick' in item && item.onClick) {
		return (
			<SidebarMenuButton
				type="button"
				title={item.title}
				onClick={item.onClick}
				className="flex items-center gap-2"
			>
				{content}
			</SidebarMenuButton>
		);
	}
	return (
		<SidebarMenuButton asChild title={item.title}>
			<a href={'url' in item ? item.url : '#'} className="flex items-center gap-2">
				{content}
			</a>
		</SidebarMenuButton>
	);
}

export function NavMain({ items }: { items: NavMainItem[] }) {
	return (
		<SidebarGroup>
			<SidebarGroupContent className="flex flex-col gap-2">
				<SidebarMenu>
					{items.map((item) => (
						<SidebarMenuItem key={item.title}>
							{'disabled' in item && item.disabled && item.tooltip ? (
								<Tooltip>
									<TooltipTrigger asChild>
										<span className="flex w-full cursor-not-allowed">
											<NavItemContent item={item} />
										</span>
									</TooltipTrigger>
									<TooltipContent>{item.tooltip}</TooltipContent>
								</Tooltip>
							) : (
								<NavItemContent item={item} />
							)}
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
