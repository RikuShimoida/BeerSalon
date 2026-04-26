import { ReactNode } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
	children: ReactNode;
	userName: string;
	userRole: "bar_owner" | "admin";
}

export default function DashboardLayout({
	children,
	userName,
	userRole,
}: DashboardLayoutProps) {
	return (
		<div className="flex h-screen bg-gray-100">
			<Sidebar userRole={userRole} />
			<div className="flex-1 flex flex-col overflow-hidden">
				<Header userName={userName} userRole={userRole} />
				<main className="flex-1 overflow-x-hidden overflow-y-auto">
					{children}
				</main>
			</div>
		</div>
	);
}
