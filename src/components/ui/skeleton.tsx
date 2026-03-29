import { cn } from "@/lib/utils";

function Skeleton({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn("animate-pulse rounded-md bg-muted", className)}
			{...props}
		/>
	);
}

function SkeletonCard({ className }: { className?: string }) {
	return (
		<div
			className={cn(
				"rounded-lg border border-[#2A2F35] bg-[#1A1D21] p-4",
				className,
			)}
		>
			<div className="space-y-3">
				<Skeleton className="h-5 w-2/3" />
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-4/5" />
			</div>
		</div>
	);
}

function SkeletonTable({
	rows = 5,
	columns = 4,
}: {
	rows?: number;
	columns?: number;
}) {
	return (
		<div className="space-y-2">
			{/* Header */}
			<div className="flex gap-4 pb-2">
				{Array.from({ length: columns }).map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders don't need stable keys
					<Skeleton className="h-8 flex-1" key={`header-${i}`} />
				))}
			</div>
			{/* Rows */}
			{Array.from({ length: rows }).map((_, rowIndex) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders don't need stable keys
				<div className="flex gap-4 py-3" key={`row-${rowIndex}`}>
					{Array.from({ length: columns }).map((_, colIndex) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders don't need stable keys
						<Skeleton
							className="h-6 flex-1"
							key={`cell-${rowIndex}-${colIndex}`}
						/>
					))}
				</div>
			))}
		</div>
	);
}

function SkeletonList({ items = 5 }: { items?: number }) {
	return (
		<div className="space-y-3">
			{Array.from({ length: items }).map((_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders don't need stable keys
				<div className="flex items-center gap-3" key={i}>
					<Skeleton className="h-10 w-10 rounded-full" />
					<div className="flex-1 space-y-2">
						<Skeleton className="h-4 w-1/3" />
						<Skeleton className="h-3 w-1/2" />
					</div>
				</div>
			))}
		</div>
	);
}

function SkeletonKanban({ columns = 4 }: { columns?: number }) {
	return (
		<div className="flex gap-4 overflow-x-auto">
			{Array.from({ length: columns }).map((_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders don't need stable keys
				<div
					className="w-80 shrink-0 rounded-lg border border-[#2A2F35] bg-[#1A1D21] p-3"
					key={i}
				>
					<div className="mb-3 flex items-center justify-between">
						<Skeleton className="h-5 w-24" />
						<Skeleton className="h-5 w-8 rounded-full" />
					</div>
					<div className="space-y-2">
						<Skeleton className="h-20 w-full" />
						<Skeleton className="h-20 w-full" />
						<Skeleton className="h-20 w-full" />
					</div>
				</div>
			))}
		</div>
	);
}

function SkeletonIssueDetail() {
	return (
		<div className="space-y-6">
			<div className="flex items-start justify-between">
				<div className="flex-1 space-y-2">
					<Skeleton className="h-8 w-32" />
					<Skeleton className="h-10 w-3/4" />
				</div>
				<Skeleton className="h-10 w-10" />
			</div>
			<div className="grid grid-cols-3 gap-6">
				<div className="col-span-2 space-y-4">
					<Skeleton className="h-40 w-full" />
					<Skeleton className="h-32 w-full" />
				</div>
				<div className="space-y-4">
					<Skeleton className="h-8 w-20" />
					<Skeleton className="h-8 w-32" />
					<Skeleton className="h-8 w-28" />
					<Skeleton className="h-8 w-24" />
				</div>
			</div>
		</div>
	);
}

function SkeletonPageHeader() {
	return (
		<div className="mb-6 flex items-center justify-between">
			<div className="space-y-2">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-4 w-72" />
			</div>
			<Skeleton className="h-10 w-32" />
		</div>
	);
}

export {
	Skeleton,
	SkeletonCard,
	SkeletonIssueDetail,
	SkeletonKanban,
	SkeletonList,
	SkeletonPageHeader,
	SkeletonTable,
};
