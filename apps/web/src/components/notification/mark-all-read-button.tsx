"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { markAllNotificationsAsRead } from "@/actions/notification";

export function MarkAllReadButton() {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	const handleClick = () => {
		startTransition(async () => {
			await markAllNotificationsAsRead();
			router.refresh();
		});
	};

	return (
		<button
			type="button"
			onClick={handleClick}
			disabled={isPending}
			className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-surface-raised px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
		>
			<Check className="h-4 w-4" aria-hidden="true" />
			すべて既読にする
		</button>
	);
}
