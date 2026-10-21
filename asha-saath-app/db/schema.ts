import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// One isolated synthetic sandbox per signed-in Site owner.
// CAS version protects the whole small sandbox in a single atomic statement.
export const sandboxes = sqliteTable("sandboxes", {
  owner: text("owner").primaryKey(),
  state: text("state").notNull(),
  version: integer("version").notNull().default(0),
});
