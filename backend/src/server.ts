import dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app";
import { connectDatabase } from "./config/database";

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDatabase();

    const app = createApp();

    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
