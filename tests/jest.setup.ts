import { disconnectDB } from "../src/config/db";

afterAll(async () => {
  try {
    await disconnectDB();

    console.log(
      "\nJest test environment cleanup complete."
    );
  } catch (error) {
    console.error(
      "Jest cleanup failed:",
      error
    );
  }
}, 30000);