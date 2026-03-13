import { JSONFilePreset } from "lowdb/node";
import type { DatabaseSchema } from "@/types";
import { defaultData } from "./seed";

let dbInstance: Awaited<ReturnType<typeof JSONFilePreset<DatabaseSchema>>> | null = null;

export async function getDb() {
  if (!dbInstance) {
    dbInstance = await JSONFilePreset<DatabaseSchema>("db.json", defaultData);
  }
  return dbInstance;
}
