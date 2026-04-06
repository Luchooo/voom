"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { Sheet, SheetContent } from "./sheet";
import { Button } from "./button";

const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

type SidebarContext = {
	state: "expanded" | "collapsed";
	open: boolean;
	setOpen: (open: boolean) => void;
	openMobile: boolean;
	setOpenMobile: (open: boolean) => void;
	isMobile: boolean;
	toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContext | null>(null);

function useSidebar() {
	const context = React.useContext(SidebarContext);
	if (!context) {
		throw new Error("useSidebar must be used within a SidebarProvider");
	}
	return context;
}

const SidebarProvider = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & {
		defaultOpen?: boolean;
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
	}
>(
	(
		{
			defaultOpen = true,
			open: controlledOpen,
			onOpenChange,
			className = "",
			style,
			children,
			...props
		},
		ref,
	) => {
		const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
		const [openMobile, setOpenMobile] = React.useState(false);
		const open = controlledOpen ?? uncontrolledOpen;
		const setOpen = React.useCallback(
			(value: boolean) => {
				if (onOpenChange) onOpenChange(value);
				else setUncontrolledOpen(value);
			},
			[onOpenChange],
		);
		const [isMobile, setIsMobile] = React.useState(false);
		React.useEffect(() => {
			const mql = window.matchMedia("(max-width: 768px)");
			const onChange = () => setIsMobile(mql.matches);
			setIsMobile(mql.matches);
			mql.addEventListener("change", onChange);
			return () => mql.removeEventListener("change", onChange);
		}, []);
		const state = open ? "expanded" : "collapsed";
		const toggleSidebar = React.useCallback(() => {
			if (isMobile) setOpenMobile((o) => !o);
			else setOpen(!open);
		}, [isMobile, open, setOpen]);
		React.useEffect(() => {
			const handleKeyDown = (e: KeyboardEvent) => {
				if ((e.metaKey || e.ctrlKey) && e.key === SIDEBAR_KEYBOARD_SHORTCUT) {
					e.preventDefault();
					toggleSidebar();
				}
			};
			window.addEventListener("keydown", handleKeyDown);
			return () => window.removeEventListener("keydown", handleKeyDown);
		}, [toggleSidebar]);
		const value: SidebarContext = {
			state,
			open,
			setOpen,
			openMobile,
			setOpenMobile,
			isMobile,
			toggleSidebar,
		};
		return (
			<SidebarContext.Provider value={value}>
				<div
					ref={ref}
					data-sidebar="provider"
					data-state={state}
					className={`group/sidebar flex min-h-svh w-full ${className}`}
					style={
						{
							"--sidebar-width": SIDEBAR_WIDTH,
							"--sidebar-width-mobile": SIDEBAR_WIDTH_MOBILE,
							...style,
						} as React.CSSProperties
					}
					{...props}
				>
					{children}
				</div>
			</SidebarContext.Provider>
		);
	},
);
SidebarProvider.displayName = "SidebarProvider";

const sidebarVariants = cva(
	"flex h-svh flex-col border-r border-border bg-card text-card-foreground transition-[width] duration-200 ease-linear",
	{
		variants: {
			side: {
				left: "left-0",
				right: "right-0",
			},
			variant: {
				sidebar: "bg-card",
				floating: "bg-transparent",
				inset: "bg-transparent",
			},
			collapsible: {
				offcanvas: "",
				icon: "w-[--sidebar-width] group-data-[state=collapsed]/sidebar:!w-[3.5rem]",
				none: "",
			},
		},
		defaultVariants: {
			side: "left",
			variant: "sidebar",
			collapsible: "icon",
		},
	},
);

const Sidebar = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & {
		side?: "left" | "right";
		variant?: "sidebar" | "floating" | "inset";
		collapsible?: "offcanvas" | "icon" | "none";
	}
>(
	(
		{
			side = "left",
			variant = "sidebar",
			collapsible = "icon",
			className = "",
			children,
			...props
		},
		ref,
	) => {
		const { isMobile, openMobile, setOpenMobile } = useSidebar();
		const content = (
			<div
				ref={ref}
				data-sidebar="sidebar"
				data-side={side}
				data-slot="sidebar"
				className={`fixed inset-y-0 z-10 hidden w-(--sidebar-width) md:flex ${side === "left" ? "left-0" : "right-0"} ${sidebarVariants({ side, variant, collapsible })} ${className}`}
				{...props}
			>
				{children}
			</div>
		);
		if (isMobile) {
			return (
				<Sheet open={openMobile} onOpenChange={setOpenMobile}>
					<SheetContent
						side={side}
						className="w-(--sidebar-width-mobile) p-0"
						aria-describedby={undefined}
					>
						<div
							data-sidebar="sidebar"
							className="flex h-full w-full flex-col border-0 bg-card"
						>
							{children}
						</div>
					</SheetContent>
				</Sheet>
			);
		}
		return content;
	},
);
Sidebar.displayName = "Sidebar";

const SidebarHeader = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className = "", ...props }, ref) => (
	<div
		ref={ref}
		data-sidebar="header"
		className={`flex h-14 shrink-0 items-center gap-2 border-b border-border px-4 ${className}`}
		{...props}
	/>
));
SidebarHeader.displayName = "SidebarHeader";

const SidebarContent = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className = "", ...props }, ref) => (
	<div
		ref={ref}
		data-sidebar="content"
		className={`flex min-h-0 flex-1 flex-col gap-2 overflow-auto py-2 ${className}`}
		{...props}
	/>
));
SidebarContent.displayName = "SidebarContent";

const SidebarFooter = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className = "", ...props }, ref) => (
	<div
		ref={ref}
		data-sidebar="footer"
		className={`flex shrink-0 flex-col gap-2 border-t border-border p-2 ${className}`}
		{...props}
	/>
));
SidebarFooter.displayName = "SidebarFooter";

const SidebarTrigger = React.forwardRef<
	HTMLButtonElement,
	React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className = "", ...props }, ref) => {
	const { toggleSidebar } = useSidebar();
	return (
		<Button
			ref={ref}
			variant="ghost"
			size="icon"
			className={className}
			onClick={toggleSidebar}
			aria-label="Alternar barra lateral"
			{...props}
		>
			<svg className="h-5 w-5 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
			</svg>
		</Button>
	);
});
SidebarTrigger.displayName = "SidebarTrigger";

const SidebarInset = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className = "", ...props }, ref) => (
	<main
		ref={ref}
		className={`flex-1 overflow-auto pt-0 transition-[padding] duration-200 ease-linear md:pl-(--sidebar-width) group-data-[state=collapsed]/sidebar:md:pl-14 ${className}`}
		{...props}
	/>
));
SidebarInset.displayName = "SidebarInset";

const SidebarMenu = React.forwardRef<
	HTMLUListElement,
	React.HTMLAttributes<HTMLUListElement>
>(({ className = "", ...props }, ref) => (
	<ul
		ref={ref}
		data-sidebar="menu"
		className={`flex w-full min-w-0 flex-col gap-1 ${className}`}
		{...props}
	/>
));
SidebarMenu.displayName = "SidebarMenu";

const SidebarMenuItem = React.forwardRef<
	HTMLLIElement,
	React.HTMLAttributes<HTMLLIElement>
>(({ className = "", ...props }, ref) => (
	<li
		ref={ref}
		data-sidebar="menu-item"
		className={`group/menu-item relative ${className}`}
		{...props}
	/>
));
SidebarMenuItem.displayName = "SidebarMenuItem";

const SidebarMenuButton = React.forwardRef<
	HTMLButtonElement,
	React.ButtonHTMLAttributes<HTMLButtonElement> & {
		asChild?: boolean;
		isActive?: boolean;
	}
>(({ asChild, isActive, className = "", children, disabled, ...props }, ref) => {
	const Comp = asChild ? "span" : "button";
	return (
		<Comp
			ref={ref as React.Ref<HTMLButtonElement>}
			data-sidebar="menu-button"
			data-active={isActive}
			data-disabled={disabled === true ? "true" : undefined}
			disabled={disabled}
			className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring data-[active=true]:bg-accent data-[active=true]:font-medium disabled:pointer-events-none ${className}`}
			{...(props as React.HTMLAttributes<HTMLButtonElement>)}
		>
			{children}
		</Comp>
	);
});
SidebarMenuButton.displayName = "SidebarMenuButton";

const SidebarGroup = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className = "", ...props }, ref) => (
	<div
		ref={ref}
		data-sidebar="group"
		className={`flex w-full min-w-0 flex-col p-2 ${className}`}
		{...props}
	/>
));
SidebarGroup.displayName = "SidebarGroup";

const SidebarGroupLabel = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className = "", ...props }, ref) => (
	<div
		ref={ref}
		data-sidebar="group-label"
		className={`cursor-default px-2 py-1.5 text-xs font-semibold text-muted-foreground ${className}`}
		{...props}
	/>
));
SidebarGroupLabel.displayName = "SidebarGroupLabel";

const SidebarGroupContent = React.forwardRef<
	HTMLUListElement,
	React.HTMLAttributes<HTMLUListElement>
>(({ className = "", ...props }, ref) => (
	<ul
		ref={ref}
		data-sidebar="group-content"
		className={`flex w-full min-w-0 flex-col gap-1 ${className}`}
		{...props}
	/>
));
SidebarGroupContent.displayName = "SidebarGroupContent";

export {
	SidebarProvider,
	Sidebar,
	SidebarHeader,
	SidebarContent,
	SidebarFooter,
	SidebarTrigger,
	SidebarInset,
	SidebarMenu,
	SidebarMenuItem,
	SidebarMenuButton,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarGroupContent,
	useSidebar,
};
