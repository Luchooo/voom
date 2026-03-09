"use client";

import * as React from "react";
import useEmblaCarousel, {
	type UseEmblaCarouselType,
} from "embla-carousel-react";
import { Button } from "./button";

type CarouselApi = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];

type CarouselProps = {
	opts?: CarouselOptions;
	plugins?: CarouselPlugin;
	orientation?: "horizontal" | "vertical";
	setApi?: (api: CarouselApi) => void;
};

const CarouselContext = React.createContext<{
	carouselRef: ReturnType<typeof useEmblaCarousel>[0];
	api: ReturnType<typeof useEmblaCarousel>[1];
	scrollPrev: () => void;
	scrollNext: () => void;
	canScrollPrev: boolean;
	canScrollNext: boolean;
	orientation: "horizontal" | "vertical";
} | null>(null);

function useCarousel() {
	const context = React.useContext(CarouselContext);
	if (!context) {
		throw new Error("useCarousel must be used within a <Carousel />");
	}
	return context;
}

const Carousel = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & CarouselProps
>(
	(
		{
			orientation = "horizontal",
			opts,
			setApi,
			plugins,
			className,
			children,
			...props
		},
		ref
	) => {
		const [carouselRef, api] = useEmblaCarousel(
			{
				...opts,
				axis: orientation === "horizontal" ? "x" : "y",
			},
			plugins
		);
		const [canScrollPrev, setCanScrollPrev] = React.useState(false);
		const [canScrollNext, setCanScrollNext] = React.useState(false);

		const scrollPrev = React.useCallback(() => {
			api?.scrollPrev();
		}, [api]);
		const scrollNext = React.useCallback(() => {
			api?.scrollNext();
		}, [api]);

		const onSelect = React.useCallback((api: CarouselApi) => {
			if (!api) return;
			setCanScrollPrev(api.canScrollPrev());
			setCanScrollNext(api.canScrollNext());
		}, []);

		React.useEffect(() => {
			if (!api || !setApi) return;
			setApi(api);
		}, [api, setApi]);

		React.useEffect(() => {
			if (!api) return;
			onSelect(api);
			api.on("reInit", onSelect);
			api.on("select", onSelect);
			return () => {
				api?.off("select", onSelect);
			};
		}, [api, onSelect]);

		return (
			<CarouselContext.Provider
				value={{
					carouselRef,
					api: api ?? undefined,
					scrollPrev,
					scrollNext,
					canScrollPrev,
					canScrollNext,
					orientation,
				}}
			>
				<div
					ref={ref}
					className={`relative ${className ?? ""}`}
					{...props}
				>
					{children}
				</div>
			</CarouselContext.Provider>
		);
	}
);
Carousel.displayName = "Carousel";

const CarouselContent = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
	const { carouselRef, orientation } = useCarousel();
	return (
		<div ref={carouselRef} className="overflow-hidden">
			<div
				ref={ref}
				className={`flex ${orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col"} ${className ?? ""}`}
				{...props}
			/>
		</div>
	);
});
CarouselContent.displayName = "CarouselContent";

const CarouselItem = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
	const { orientation } = useCarousel();
	return (
		<div
			ref={ref}
			role="group"
			aria-roledescription="slide"
			className={`min-w-0 shrink-0 grow-0 ${orientation === "horizontal" ? "pl-4" : "pt-4"} ${className ?? ""}`}
			{...props}
		/>
	);
});
CarouselItem.displayName = "CarouselItem";

const CarouselPrevious = React.forwardRef<
	HTMLButtonElement,
	React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
	const { scrollPrev, canScrollPrev } = useCarousel();
	return (
		<Button
			ref={ref}
			type="button"
			variant="outline"
			size="icon"
			onClick={scrollPrev}
			disabled={!canScrollPrev}
			className={`absolute left-2 top-1/2 z-10 h-8 w-8 -translate-y-1/2 rounded-full shadow-md ${className ?? ""}`}
			aria-label="Anterior"
			{...props}
		>
			<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
			</svg>
		</Button>
	);
});
CarouselPrevious.displayName = "CarouselPrevious";

const CarouselNext = React.forwardRef<
	HTMLButtonElement,
	React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
	const { scrollNext, canScrollNext } = useCarousel();
	return (
		<Button
			ref={ref}
			type="button"
			variant="outline"
			size="icon"
			onClick={scrollNext}
			disabled={!canScrollNext}
			className={`absolute right-2 top-1/2 z-10 h-8 w-8 -translate-y-1/2 rounded-full shadow-md ${className ?? ""}`}
			aria-label="Siguiente"
			{...props}
		>
			<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
			</svg>
		</Button>
	);
});
CarouselNext.displayName = "CarouselNext";

export {
	type CarouselApi,
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselPrevious,
	CarouselNext,
};
