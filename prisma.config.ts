import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Prisma v7 Datasource type only supports `url` and `shadowDatabaseUrl`.
    // For Supabase: use the session-pooler URL (port 5432) as the main URL.
    // The directUrl (for migrations) must be set via DIRECT_URL in schema.prisma
    // OR handled by using the direct connection as DATABASE_URL when migrating.
    url: process.env.DATABASE_URL!,
  },
});
