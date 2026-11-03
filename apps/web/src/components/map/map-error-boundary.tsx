"use client";

import { Component, type ReactNode } from "react";

interface MapErrorBoundaryProps {
	fallback: ReactNode;
	children: ReactNode;
}

interface MapErrorBoundaryState {
	hasError: boolean;
}

// Why not 関数コンポーネント: React のエラーバウンダリはクラスでしか書けない。
// Why not react-error-boundary: 差し替え表示を出すだけなので、依存を増やすほどの機能は要らない。
// Why not app の error.tsx に任せる: 地図だけの失敗で検索フォームと店舗一覧まで消えてしまうため、地図の枠で止める。
export class MapErrorBoundary extends Component<
	MapErrorBoundaryProps,
	MapErrorBoundaryState
> {
	state: MapErrorBoundaryState = { hasError: false };

	static getDerivedStateFromError(): MapErrorBoundaryState {
		return { hasError: true };
	}

	render() {
		if (this.state.hasError) {
			return this.props.fallback;
		}
		return this.props.children;
	}
}
