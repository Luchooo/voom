"use client";

import * as React from "react";

type AvatarContextValue = {
	showFallback: boolean;
	setShowFallback: (v: boolean) => void;
};
const AvatarContext = React.createContext<AvatarContextValue | null>(null);

function useAvatarContext() {
	const ctx = React.useContext(AvatarContext);
	if (!ctx) throw new Error("Avatar subcomponents must be used within Avatar");
	return ctx;
}

const Avatar = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className = "", ...props }, ref) => {
	const [showFallback, setShowFallback] = React.useState(true);
	return (
		<AvatarContext.Provider value={{ showFallback, setShowFallback }}>
			<div
				ref={ref}
				className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}
				{...props}
			/>
		</AvatarContext.Provider>
	);
});
Avatar.displayName = "Avatar";

const AvatarImage = React.forwardRef<
	HTMLImageElement,
	React.ImgHTMLAttributes<HTMLImageElement>
>(({ className = "", src, alt, onLoad, onError, ...props }, ref) => {
	const { setShowFallback } = useAvatarContext();
	const [broken, setBroken] = React.useState(false);

	React.useEffect(() => {
		setBroken(false);
		if (!src) setShowFallback(true);
	}, [src, setShowFallback]);

	if (!src || broken) {
		return null;
	}

	return (
		// eslint-disable-next-line @next/next/no-img-element -- Avatar uses dynamic external URLs (e.g. Firebase) and needs onLoad/onError for fallback
		<img
			ref={ref}
			{...props}
			src={src}
			alt={alt}
			className={`aspect-square h-full w-full object-cover ${className}`}
			referrerPolicy="no-referrer"
			onLoad={(e) => {
				setShowFallback(false);
				onLoad?.(e);
			}}
			onError={(e) => {
				setBroken(true);
				setShowFallback(true);
				onError?.(e);
			}}
		/>
	);
});
AvatarImage.displayName = "AvatarImage";

const AvatarFallback = React.forwardRef<
	HTMLSpanElement,
	React.HTMLAttributes<HTMLSpanElement>
>(({ className = "", ...props }, ref) => {
	const { showFallback } = useAvatarContext();
	if (!showFallback) return null;
	return (
		<span
			ref={ref}
			className={`flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground ${className}`}
			{...props}
		/>
	);
});
AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarImage, AvatarFallback };
