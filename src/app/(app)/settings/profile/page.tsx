"use client";

import { Camera, User } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "~/trpc/react";

export default function ProfileSettingsPage() {
	const { data: user, isLoading } = api.user.getCurrent.useQuery();
	const utils = api.useUtils();

	const [formData, setFormData] = useState({
		name: "",
		image: "",
	});

	// Initialize form when data loads
	if (user && formData.name === "" && !isLoading) {
		setFormData({
			name: user.name,
			image: user.image ?? "",
		});
	}

	const updateProfile = api.user.updateProfile.useMutation({
		onSuccess: () => {
			utils.user.getCurrent.invalidate();
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		updateProfile.mutate({
			name: formData.name,
			image: formData.image || null,
		});
	};

	if (isLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-[#5E6AD2] border-t-transparent" />
			</div>
		);
	}

	if (!user) {
		return (
			<div className="flex h-full flex-col items-center justify-center">
				<User className="mb-4 h-12 w-12 text-[#8A8F98]" />
				<h3 className="mb-2 font-medium text-[#F7F8F8]">User not found</h3>
			</div>
		);
	}

	const initials = user.name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase();

	return (
		<div className="mx-auto max-w-2xl p-8">
			<div className="mb-8">
				<h1 className="mb-2 font-semibold text-2xl text-[#F7F8F8]">
					Profile Settings
				</h1>
				<p className="text-[#8A8F98]">Manage your personal information</p>
			</div>

			<form className="space-y-8" onSubmit={handleSubmit}>
				{/* Avatar Section */}
				<div className="space-y-4">
					<Label className="text-[#F7F8F8]">Profile Photo</Label>
					<div className="flex items-center gap-4">
						<Avatar className="h-20 w-20">
							<AvatarImage
								alt={user.name}
								src={formData.image || user.image || undefined}
							/>
							<AvatarFallback className="bg-[#5E6AD2] text-2xl text-white">
								{initials}
							</AvatarFallback>
						</Avatar>
						<div className="flex-1">
							<Input
								className="border-[#2A2F35] bg-[#16181D] text-[#F7F8F8]"
								onChange={(e) =>
									setFormData({ ...formData, image: e.target.value })
								}
								placeholder="https://example.com/avatar.jpg"
								value={formData.image}
							/>
							<p className="mt-1 text-[#8A8F98] text-sm">
								Enter a URL for your profile photo
							</p>
						</div>
					</div>
				</div>

				{/* Name Section */}
				<div className="space-y-2">
					<Label className="text-[#F7F8F8]" htmlFor="name">
						Full Name
					</Label>
					<Input
						className="border-[#2A2F35] bg-[#16181D] text-[#F7F8F8]"
						id="name"
						onChange={(e) => setFormData({ ...formData, name: e.target.value })}
						value={formData.name}
					/>
				</div>

				{/* Email Section */}
				<div className="space-y-2">
					<Label className="text-[#F7F8F8]" htmlFor="email">
						Email Address
					</Label>
					<Input
						className="border-[#2A2F35] bg-[#16181D] text-[#8A8F98]"
						id="email"
						readOnly
						type="email"
						value={user.email}
					/>
					<p className="text-[#8A8F98] text-sm">
						Email cannot be changed. Contact support if needed.
					</p>
				</div>

				<div className="flex items-center gap-4 pt-4">
					<Button
						className="bg-[#5E6AD2] text-white hover:bg-[#4F57B3]"
						disabled={
							updateProfile.isPending ||
							(formData.name === user.name &&
								formData.image === (user.image ?? ""))
						}
						type="submit"
					>
						{updateProfile.isPending ? "Saving..." : "Save Changes"}
					</Button>
				</div>
			</form>
		</div>
	);
}
