import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TextField } from "./text-field";

describe("TextField", () => {
	it("label と input が htmlFor/id で関連付けられる", () => {
		render(<TextField id="email" name="email" label="メールアドレス" />);

		const input = screen.getByLabelText("メールアドレス");
		expect(input).toHaveAttribute("id", "email");
		expect(input).toHaveAttribute("name", "email");
	});

	it("type 未指定時は text になる", () => {
		render(<TextField id="nickname" name="nickname" label="ニックネーム" />);

		expect(screen.getByLabelText("ニックネーム")).toHaveAttribute(
			"type",
			"text",
		);
	});

	it("type='email' が反映される", () => {
		render(
			<TextField id="email" name="email" label="メールアドレス" type="email" />,
		);

		expect(screen.getByLabelText("メールアドレス")).toHaveAttribute(
			"type",
			"email",
		);
	});

	it("type='password' が反映される", () => {
		render(
			<TextField
				id="password"
				name="password"
				label="パスワード"
				type="password"
			/>,
		);

		expect(screen.getByLabelText("パスワード")).toHaveAttribute(
			"type",
			"password",
		);
	});

	it("required 指定時に required 属性が付く", () => {
		render(
			<TextField id="email" name="email" label="メールアドレス" required />,
		);

		expect(screen.getByLabelText("メールアドレス")).toBeRequired();
	});

	it("required 未指定時は required 属性が付かない", () => {
		render(<TextField id="email" name="email" label="メールアドレス" />);

		expect(screen.getByLabelText("メールアドレス")).not.toBeRequired();
	});

	it("placeholder 未指定時は placeholder 属性が出ない", () => {
		render(<TextField id="email" name="email" label="メールアドレス" />);

		expect(screen.getByLabelText("メールアドレス")).not.toHaveAttribute(
			"placeholder",
		);
	});

	it("placeholder 指定時は placeholder 属性が出る", () => {
		render(
			<TextField
				id="email"
				name="email"
				label="メールアドレス"
				placeholder="example@mail.com"
			/>,
		);

		expect(screen.getByLabelText("メールアドレス")).toHaveAttribute(
			"placeholder",
			"example@mail.com",
		);
	});

	it("hint 指定時のみヒント文が表示される", () => {
		const { rerender } = render(
			<TextField id="password" name="password" label="パスワード" />,
		);
		expect(screen.queryByText("8文字以上")).not.toBeInTheDocument();

		rerender(
			<TextField
				id="password"
				name="password"
				label="パスワード"
				hint="8文字以上"
			/>,
		);
		expect(screen.getByText("8文字以上")).toBeInTheDocument();
	});
});
