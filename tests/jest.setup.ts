import { connectDB, disconnectDB } from "../src/config/db";

beforeAll(async () => {
  await connectDB();
}, 30000);

afterAll(async () => {
  await disconnectDB();

  console.log(
    "\nJest test environment cleanup complete."
  );
}, 30000);
