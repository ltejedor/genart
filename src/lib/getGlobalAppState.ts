import { db } from "~/server/db";

export default async function getGlobalAppState() {
  const state = await db.globalAppState.findFirst();
  if (!state) {
    await db.globalAppState.create({
      data: {
        id: 1,
      },
    });
  }
  return state;
}
