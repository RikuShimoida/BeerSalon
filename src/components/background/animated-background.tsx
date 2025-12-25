"use client";

export function AnimatedBackground() {
	return (
		<div
			className="fixed inset-0 -z-10 overflow-hidden bg-black"
			data-testid="animated-background"
			aria-hidden="true"
		>
			<svg
				className="absolute inset-0 h-full w-full"
				xmlns="http://www.w3.org/2000/svg"
				role="img"
				aria-label="Animated background with Mt. Fuji, tea fields, oranges, wasabi, and beer bubbles"
			>
				<defs>
					<linearGradient
						id="mt-fuji-gradient"
						x1="0%"
						y1="0%"
						x2="0%"
						y2="100%"
					>
						<stop
							offset="0%"
							style={{ stopColor: "#1a1a1a", stopOpacity: 1 }}
						/>
						<stop
							offset="100%"
							style={{ stopColor: "#0a0a0a", stopOpacity: 1 }}
						/>
					</linearGradient>
				</defs>

				<g className="motion-safe:animate-[float_20s_ease-in-out_infinite]">
					<polygon
						points="20,80 50,20 80,80"
						fill="url(#mt-fuji-gradient)"
						opacity="0.15"
					/>
				</g>

				<g className="motion-safe:animate-[float_25s_ease-in-out_infinite_2s]">
					<polygon
						points="70,90 85,50 100,90"
						fill="url(#mt-fuji-gradient)"
						opacity="0.1"
					/>
				</g>

				<g className="motion-safe:animate-[wave_15s_ease-in-out_infinite]">
					<path
						d="M0,30 Q25,25 50,30 T100,30"
						stroke="#1a3a1a"
						strokeWidth="0.5"
						fill="none"
						opacity="0.3"
					/>
					<path
						d="M0,35 Q25,30 50,35 T100,35"
						stroke="#1a3a1a"
						strokeWidth="0.5"
						fill="none"
						opacity="0.25"
					/>
					<path
						d="M0,40 Q25,35 50,40 T100,40"
						stroke="#1a3a1a"
						strokeWidth="0.5"
						fill="none"
						opacity="0.2"
					/>
				</g>

				<g className="motion-safe:animate-[pulse_8s_ease-in-out_infinite]">
					<circle cx="85" cy="15" r="2" fill="#ff8c00" opacity="0.2" />
					<circle cx="90" cy="12" r="1.5" fill="#ff8c00" opacity="0.15" />
					<circle cx="82" cy="18" r="1.8" fill="#ff8c00" opacity="0.18" />
				</g>

				<g className="motion-safe:animate-[pulse_10s_ease-in-out_infinite_1s]">
					<circle cx="10" cy="70" r="1.2" fill="#228b22" opacity="0.25" />
					<circle cx="13" cy="68" r="1" fill="#228b22" opacity="0.2" />
				</g>

				<g className="motion-safe:animate-[rise_6s_ease-in-out_infinite]">
					<circle cx="25" cy="95" r="0.8" fill="#f5f5f5" opacity="0.4" />
					<circle cx="30" cy="92" r="1" fill="#f5f5f5" opacity="0.35" />
					<circle cx="35" cy="88" r="0.9" fill="#f5f5f5" opacity="0.3" />
					<circle cx="40" cy="93" r="0.7" fill="#f5f5f5" opacity="0.25" />
				</g>

				<g className="motion-safe:animate-[rise_7s_ease-in-out_infinite_2s]">
					<circle cx="60" cy="96" r="0.6" fill="#f5f5f5" opacity="0.35" />
					<circle cx="65" cy="94" r="0.8" fill="#f5f5f5" opacity="0.3" />
					<circle cx="70" cy="90" r="0.7" fill="#f5f5f5" opacity="0.28" />
				</g>

				<g className="motion-safe:animate-[rise_8s_ease-in-out_infinite_4s]">
					<circle cx="45" cy="97" r="0.9" fill="#f5f5f5" opacity="0.32" />
					<circle cx="50" cy="95" r="0.75" fill="#f5f5f5" opacity="0.27" />
					<circle cx="55" cy="91" r="0.85" fill="#f5f5f5" opacity="0.24" />
				</g>
			</svg>
		</div>
	);
}
