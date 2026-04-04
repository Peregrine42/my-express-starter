import { createMigrator } from "./runner";

async function main() {
  const command = process.argv[2] || "up";

  const migrator = createMigrator();

  switch (command) {
    case "up": {
      const pending = await migrator.pending();
      if (pending.length === 0) {
        console.log("No pending migrations.");
      } else {
        await migrator.up();
      }
      break;
    }
    case "down": {
      await migrator.down();
      break;
    }
    case "status": {
      const executed = await migrator.executed();
      const pending = await migrator.pending();
      console.log(
        "Executed:",
        executed
          .map((m) => {
            return m.name;
          })
          .join(", ") || "(none)",
      );
      console.log(
        "Pending:",
        pending
          .map((m) => {
            return m.name;
          })
          .join(", ") || "(none)",
      );
      break;
    }
    default: {
      console.error(`Unknown command: ${command}`);
      console.error("Usage: tsx src/migrations/run.ts [up|down|status]");
      process.exit(1);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
