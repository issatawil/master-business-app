import "dotenv/config";
import { PrismaClient } from "@prisma/client";

// Read-only verification of the demo installation. No user data, hashes,
// credentials, names, or database connection strings are printed to build logs.
const prisma = new PrismaClient();
async function main() {
  const counts = await prisma.$transaction([
    prisma.user.count(),
    prisma.customer.count(),
    prisma.supplier.count(),
    prisma.project.count(),
  ]);
  const [users, customers, suppliers, projects] = counts;
  if (users < 3 || customers < 1 || suppliers < 1 || projects < 1) {
    throw new Error("Demo verification failed: required user or business records are missing");
  }
  console.log("Read-only business data verification passed: users, customers, suppliers and projects are present.");
}
main().catch(err => {
  console.error(err instanceof Error ? err.message : "Demo verification failed");
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
