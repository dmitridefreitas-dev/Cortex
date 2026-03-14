import { getSchedules } from "./src/lib/db/schedules";

async function run() {
  const prov1 = await getSchedules("prov-1");
  console.log("prov-1 schedules:", prov1);
}
run();
