import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
	children: ReactNode;
	className?: string;
};

export function FormError({ children, className }: Props) {
	if (!children) {
		return null;
	}

	return (
		<div
			role="alert"
			className={cn(
				"p-3 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20",
				className,
			)}
		>
			{children}
		</div>
	);
}
