"use client";

import { Check, LayoutGrid, Moon, Rows3, Sun, SunMoon } from "lucide-react";
import { api } from "~/trpc/react";

const themes = [
	{
		id: "light",
		name: "Light",
		description: "Clean and crisp",
		icon: Sun,
	},
	{
		id: "dark",
		name: "Dark",
		description: "Easy on the eyes",
		icon: Moon,
	},
	{
		id: "system",
		name: "System",
		description: "Follows your OS preference",
		icon: SunMoon,
	},
] as const;

const densities = [
	{
		id: "compact",
		name: "Compact",
		description: "More content, less whitespace",
		icon: Rows3,
	},
	{
		id: "default",
		name: "Default",
		description: "Balanced spacing",
		icon: LayoutGrid,
	},
	{
		id: "comfortable",
		name: "Comfortable",
		description: "More breathing room",
		icon: LayoutGrid,
	},
] as const;

export default function AppearanceSettingsPage() {
	const { data: preferences, isLoading } = api.user.getPreferences.useQuery();
	const utils = api.useUtils();

	const updatePreferences = api.user.updatePreferences.useMutation({
		onSuccess: () => {
			utils.user.getPreferences.invalidate();
		},
	});

	const handleThemeChange = (theme: "light" | "dark" | "system") => {
		updatePreferences.mutate({ theme });
	};

	const handleDensityChange = (
		density: "compact" | "default" | "comfortable",
	) => {
		updatePreferences.mutate({ density });
	};

	if (isLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-[#5E6AD2] border-t-transparent" />
			</div>
		);
	}

	const currentTheme = preferences?.theme ?? "system";
	const currentDensity = preferences?.density ?? "default";

	return (
		<div className="mx-auto max-w-2xl p-8">
			<div className="mb-8">
				<h1 className="mb-2 font-semibold text-2xl text-[#F7F8F8]">
					Appearance
				</h1>
				<p className="text-[#8A8F98]">Customize how Quadratic looks for you</p>
			</div>

			{/* Theme Section */}
			<div className="mb-8">
				<h2 className="mb-4 font-medium text-[#F7F8F8]">Theme</h2>
				<div className="grid gap-3">
					{themes.map((theme) => {
						const Icon = theme.icon;
						const isSelected = currentTheme === theme.id;

						return (
							<button
								className={`flex items-center gap-4 rounded-lg border p-4 transition-all ${
									isSelected
										? "border-[#5E6AD2] bg-[#5E6AD2]/10"
										: "border-[#2A2F35] bg-[#16181D] hover:border-[#5E6AD2]/50"
								}`}
								key={theme.id}
								onClick={() =>
									handleThemeChange(theme.id as "light" | "dark" | "system")
								}
								type="button"
							>
								<div
									className={`flex h-10 w-10 items-center justify-center rounded-lg ${
										isSelected ? "bg-[#5E6AD2]" : "bg-[#2A2F35]"
									}`}
								>
									<Icon
										className={`h-5 w-5 ${
											isSelected ? "text-white" : "text-[#8A8F98]"
										}`}
									/>
								</div>
								<div className="flex-1 text-left">
									<p
										className={`font-medium ${
											isSelected ? "text-[#F7F8F8]" : "text-[#F7F8F8]"
										}`}
									>
										{theme.name}
									</p>
									<p className="text-[#8A8F98] text-sm">{theme.description}</p>
								</div>
								{isSelected && <Check className="h-5 w-5 text-[#5E6AD2]" />}
							</button>
						);
					})}
				</div>
			</div>

			{/* Density Section */}
			<div>
				<h2 className="mb-4 font-medium text-[#F7F8F8]">Interface Density</h2>
				<div className="grid gap-3">
					{densities.map((density) => {
						const Icon = density.icon;
						const isSelected = currentDensity === density.id;

						return (
							<button
								className={`flex items-center gap-4 rounded-lg border p-4 transition-all ${
									isSelected
										? "border-[#5E6AD2] bg-[#5E6AD2]/10"
										: "border-[#2A2F35] bg-[#16181D] hover:border-[#5E6AD2]/50"
								}`}
								key={density.id}
								onClick={() =>
									handleDensityChange(
										density.id as "compact" | "default" | "comfortable",
									)
								}
								type="button"
							>
								<div
									className={`flex h-10 w-10 items-center justify-center rounded-lg ${
										isSelected ? "bg-[#5E6AD2]" : "bg-[#2A2F35]"
									}`}
								>
									<Icon
										className={`h-5 w-5 ${
											isSelected ? "text-white" : "text-[#8A8F98]"
										}`}
									/>
								</div>
								<div className="flex-1 text-left">
									<p
										className={`font-medium ${
											isSelected ? "text-[#F7F8F8]" : "text-[#F7F8F8]"
										}`}
									>
										{density.name}
									</p>
									<p className="text-[#8A8F98] text-sm">
										{density.description}
									</p>
								</div>
								{isSelected && <Check className="h-5 w-5 text-[#5E6AD2]" />}
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}
