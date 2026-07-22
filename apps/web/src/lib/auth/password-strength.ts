// パスワード強度メーターの塗り段数を算出する純関数。
// 判定基準は signUpSchema（8文字以上・小文字・大文字・数字）と揃える。
// 満たした条件数（0〜4）をそのまま塗り段数として返す。
export function calcPasswordStrength(password: string): number {
	if (password.length === 0) {
		return 0;
	}

	let score = 0;
	if (password.length >= 8) {
		score += 1;
	}
	if (/[a-z]/.test(password)) {
		score += 1;
	}
	if (/[A-Z]/.test(password)) {
		score += 1;
	}
	if (/[0-9]/.test(password)) {
		score += 1;
	}
	return score;
}
