// Why not next/image で外部SVGを読む: 外部参照SVG(<img src>)は隔離コンテキストで描画され、
// layout.tsx が next/font/google で読んだ Zen Old Mincho / Archivo にアクセスできず、
// ワードマークが各OSの汎用フォントにフォールバックする。インラインSVGにして
// font-family を CSS 変数(--font-mincho / --font-archivo)参照にすることで確実に適用する。
export function BeerSalonLogo({ className }: { className?: string }) {
	return (
		<svg
			width={240}
			height={52}
			viewBox="0 0 240 52"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			role="img"
			aria-label="Beer Salon"
			className={className}
		>
			<defs>
				<linearGradient
					id="logo-a-tile"
					x1="0"
					y1="0"
					x2="52"
					y2="52"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#e0a341" />
					<stop offset="1" stopColor="#c47f28" />
				</linearGradient>
			</defs>
			<rect
				x="0.75"
				y="0.75"
				width="50.5"
				height="50.5"
				rx="14"
				fill="url(#logo-a-tile)"
			/>
			<rect
				x="0.75"
				y="0.75"
				width="50.5"
				height="50.5"
				rx="14"
				stroke="#f0c06a"
				strokeOpacity="0.5"
				strokeWidth="1"
			/>
			<path
				d="M18 20 H34 L32 40 A2 2 0 0 1 30 42 H22 A2 2 0 0 1 20 40 Z"
				fill="#20160a"
				fillOpacity="0.92"
			/>
			<path
				d="M18.9 27 H33.1 L32 40 A2 2 0 0 1 30 42 H22 A2 2 0 0 1 20 40 Z"
				fill="#20160a"
				fillOpacity="0.35"
			/>
			<circle cx="22" cy="20" r="3.4" fill="#20160a" />
			<circle cx="26" cy="18.4" r="4" fill="#20160a" />
			<circle cx="30" cy="20" r="3.4" fill="#20160a" />
			<path
				d="M34 24 H38 A3 3 0 0 1 41 27 V33 A3 3 0 0 1 38 36 H34"
				stroke="#20160a"
				strokeWidth="2.4"
				fill="none"
				strokeLinecap="round"
			/>
			<text
				x="64"
				y="34"
				fontFamily="var(--font-mincho), serif"
				fontWeight="900"
				fontSize="27"
				fill="#f5e9d4"
			>
				Beer
				<tspan
					fontFamily="var(--font-archivo), sans-serif"
					fontWeight="800"
					fill="#e0a341"
				>
					{" "}
					Salon
				</tspan>
			</text>
			<text
				x="64"
				y="46"
				fontFamily="var(--font-archivo), sans-serif"
				fontWeight="600"
				fontSize="8"
				letterSpacing="2.6"
				fill="#9c8763"
			>
				SHIZUOKA CRAFT BEER
			</text>
		</svg>
	);
}
