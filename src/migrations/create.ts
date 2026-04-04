import { createMigrator } from "./runner";

async function main() {
  const name = process.argv[2];
  if (!name) {
    console.error("Usage: npm run db:create <migration-name>");
    process.exit(1);
  }

  const content = `import type { MigratorContext } from "./runner";

export async function up({ pool }: MigratorContext) {
  await pool.query(\`
    -- Add your UP migration SQL here
  \`);
}

export async function down({ pool }: MigratorContext) {
  await pool.query(\`
    -- Add your DOWN migration SQL here
  \`);
}
`;

  const migrator = createMigrator();
  await migrator.create({
    name,
    folder: "src/migrations",
    allowExtension: ".ts",
    content,
  });

  console.log(`✅ Created migration: ${name}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
