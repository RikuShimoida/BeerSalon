import BarRegisterForm from "./BarRegisterForm";

// 未ログインの店舗オーナーが申し込む公開ページのため、DashboardLayout（ログイン後レイアウト）は使わない。
export default function BarRegisterPage() {
	return <BarRegisterForm />;
}
