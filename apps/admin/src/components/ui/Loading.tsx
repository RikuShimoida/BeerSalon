export interface LoadingProps {
	size?: "sm" | "md" | "lg";
	text?: string;
	fullScreen?: boolean;
}

export default function Loading({
	size = "md",
	text,
	fullScreen = false,
}: LoadingProps) {
	const sizeStyles = {
		sm: "h-6 w-6",
		md: "h-12 w-12",
		lg: "h-16 w-16",
	};

	const spinner = (
		<div className="flex flex-col items-center justify-center gap-3">
			<svg
				className={`animate-spin ${sizeStyles[size]} text-blue-600`}
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				aria-hidden="true"
			>
				<circle
					className="opacity-25"
					cx="12"
					cy="12"
					r="10"
					stroke="currentColor"
					strokeWidth="4"
				/>
				<path
					className="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				/>
			</svg>
			{text && <p className="text-sm text-gray-600">{text}</p>}
		</div>
	);

	if (fullScreen) {
		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-75">
				{spinner}
			</div>
		);
	}

	return spinner;
}
