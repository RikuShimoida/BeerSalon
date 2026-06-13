"use client";

import { type ReactNode, useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
	children: ReactNode;
	userName: string;
	userRole: "bar_owner" | "admin";
	barId: number | null;
}

export default function DashboardLayout({
	children,
	userName,
	userRole,
	barId,
}: DashboardLayoutProps) {
	const [sidebarOpen, setSidebarOpen] = useState(false);

	return (
		<div className="flex h-screen bg-gray-50">
			<Sidebar
				userRole={userRole}
				barId={barId}
				isOpen={sidebarOpen}
				onClose={() => setSidebarOpen(false)}
			/>
			<div className="flex-1 flex flex-col min-w-0">
				<Header
					userName={userName}
					onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
				/>
				<main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
			</div>
		</div>
	);
}
