import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config();

let isConnected = false;

const initDB = async () => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
};

export default async function handler(req, res) {
  await initDB();

  // let express handle request properly
  return app.handle(req, res);
}

// Local server only
if (process.env.NODE_ENV !== "production") {
  connectDB()
    .then(() => {
      app.get("/", (req, res) => {
        res.send("Prisma + Supabase + Express Connected!");
      });

      app.listen(process.env.PORT || 8000, () => {
        console.log("Server running");
      });
    })
    .catch(console.error);
}