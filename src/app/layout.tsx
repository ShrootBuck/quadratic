import "~/styles/globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
	title: "Quadratic - Linear-style Project Management",
	description: "A Linear-inspired project management tool for teams",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
});

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html className={`${geist.variable}`} lang="en">
			<body>
				<TRPCReactProvider>
					{children}
					<Toaster
						closeButton
						duration={4000}
						position="bottom-right"
						richColors
					/>
				</TRPCReactProvider>
			</body>
		</html>
	);
}
