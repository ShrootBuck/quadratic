"use client";

import type { ReactNode } from "react";

interface FadeInProps {
	children: ReactNode;
	delay?: number;
	className?: string;
}

export function FadeIn({ children, delay = 0, className }: FadeInProps) {
	return (
		<div
			className={`animate-fade-in ${className || ""}`}
			style={{
				animationDelay: `${delay}ms`,
				animationFillMode: "both",
			}}
		>
			{children}
		</div>
	);
}

export function SlideIn({
	children,
	direction = "right",
	delay = 0,
	className,
}: {
	children: ReactNode;
	direction?: "left" | "right" | "up" | "down";
	delay?: number;
	className?: string;
}) {
	const directionClasses = {
		left: "animate-slide-in-left",
		right: "animate-slide-in-right",
		up: "animate-slide-in-up",
		down: "animate-slide-in-down",
	};

	return (
		<div
			className={`${directionClasses[direction]} ${className || ""}`}
			style={{
				animationDelay: `${delay}ms`,
				animationFillMode: "both",
			}}
		>
			{children}
		</div>
	);
}

export function ScaleIn({
	children,
	delay = 0,
	className,
}: {
	children: ReactNode;
	delay?: number;
	className?: string;
}) {
	return (
		<div
			className={`animate-scale-in ${className || ""}`}
			style={{
				animationDelay: `${delay}ms`,
				animationFillMode: "both",
			}}
		>
			{children}
		</div>
	);
}
