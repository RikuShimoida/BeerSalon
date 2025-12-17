import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
	console.log("Updating test user password...");

	const {
		data: { users },
		error: listError,
	} = await supabase.auth.admin.listUsers();

	if (listError) {
		console.error("Error listing users:", listError);
		throw listError;
	}

	const testUser = users?.find((u) => u.email === "test@example.com");

	if (!testUser) {
		console.error("Test user not found");
		return;
	}

	const { error: updateError } = await supabase.auth.admin.updateUserById(
		testUser.id,
		{
			password: "password123",
		},
	);

	if (updateError) {
		console.error("Error updating password:", updateError);
		throw updateError;
	}

	console.log("Password updated successfully!");
	console.log("Email: test@example.com");
	console.log("Password: password123");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	});
