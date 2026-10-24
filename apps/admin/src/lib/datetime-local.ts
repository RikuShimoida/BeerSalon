/**
 * UTC の日時を `<input type="datetime-local">` に渡せる文字列（`YYYY-MM-DDTHH:mm`）へ変換する。
 *
 * Why not `toISOString().slice(0, 16)`:
 * `toISOString()` は常に UTC を返すが、`datetime-local` は値をブラウザのローカル時刻として
 * 解釈するため、そのまま渡すとUTCとローカルの時差だけずれた時刻が表示される。
 * 保存時にローカル時刻としてUTCへ再変換されるため、編集のたびに時差分ずつ日時が巻き戻る。
 */
export function toDateTimeLocalValue(
	value: Date | string | null | undefined,
): string {
	if (!value) {
		return "";
	}

	const date = value instanceof Date ? value : new Date(value);

	if (Number.isNaN(date.getTime())) {
		return "";
	}

	const pad = (n: number) => String(n).padStart(2, "0");

	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
		date.getDate(),
	)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
