import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma";

process.env.DATABASE_URL =
	process.env.DATABASE_URL ||
	"postgresql://postgres:postgres@127.0.0.1:54422/postgres";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
	const bars = await prisma.bar.findMany({
		where: { isActive: true },
		take: 2,
		orderBy: { id: "asc" },
	});

	if (bars.length === 0) {
		console.log("No bars found.");
		return;
	}

	const paymentMethods = await prisma.paymentMethod.findMany({
		orderBy: { displayOrder: "asc" },
	});

	console.log(
		`Found ${bars.length} bars and ${paymentMethods.length} payment methods.`,
	);

	for (const bar of bars) {
		console.log(`\nAdding payment methods to bar: ${bar.name} (ID: ${bar.id})`);

		const methodsToAdd = paymentMethods.slice(
			0,
			2 + Math.floor(Math.random() * 3),
		);

		for (const pm of methodsToAdd) {
			const existing = await prisma.barPaymentMethod.findUnique({
				where: {
					barId_paymentMethodId: {
						barId: bar.id,
						paymentMethodId: pm.id,
					},
				},
			});

			if (!existing) {
				await prisma.barPaymentMethod.create({
					data: {
						barId: bar.id,
						paymentMethodId: pm.id,
					},
				});
				console.log(`  Added: ${pm.name}`);
			} else {
				console.log(`  Already exists: ${pm.name}`);
			}
		}
	}

	console.log("\nCompleted!");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
