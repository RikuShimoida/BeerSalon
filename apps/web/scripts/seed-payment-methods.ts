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
	const paymentMethods = [
		{ name: "現金", displayOrder: 1 },
		{ name: "クレジットカード", displayOrder: 2 },
		{ name: "電子マネー", displayOrder: 3 },
		{ name: "QRコード決済", displayOrder: 4 },
	];

	console.log("Seeding payment methods...");

	for (const method of paymentMethods) {
		const existing = await prisma.paymentMethod.findUnique({
			where: { name: method.name },
		});

		if (!existing) {
			await prisma.paymentMethod.create({
				data: method,
			});
			console.log(`Created: ${method.name}`);
		} else {
			console.log(`Already exists: ${method.name}`);
		}
	}

	console.log("Seeding completed!");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
