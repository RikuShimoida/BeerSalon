import { cn } from "@/lib/utils";

type Props = {
	id: string;
	name: string;
	label: string;
	type?: "text" | "email" | "password";
	required?: boolean;
	hint?: string;
	placeholder?: string;
	defaultValue?: string;
	className?: string;
};

export function TextField({
	id,
	name,
	label,
	type = "text",
	required = false,
	hint,
	placeholder,
	defaultValue,
	className,
}: Props) {
	return (
		<div className="flex flex-col gap-2">
			<label
				htmlFor={id}
				className="text-sm font-medium text-card-foreground tracking-wide"
			>
				{label}
			</label>
			<input
				type={type}
				id={id}
				name={name}
				required={required}
				placeholder={placeholder}
				defaultValue={defaultValue}
				className={cn(
					"glass-input px-4 py-3 rounded-xl text-card-foreground placeholder:text-muted-foreground focus:outline-none transition-all duration-300",
					className,
				)}
			/>
			{hint && (
				<p className="text-xs text-muted-foreground tracking-wide">{hint}</p>
			)}
		</div>
	);
}
