import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config();

let isConnected = false;

// Connect DB once (lazy init for serverless)
const initDB = async () => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
};

// 🚀 Vercel handler export
export default async function handler(req, res) {
  try {
    await initDB();

    // optional route (you can also define in app.js)
    app.get("/", (req, res) =>
      res.send("Prisma + Supabase + Express Connected!")
    );

    return app(req, res);
  } catch (err) {
    return res.status(500).json({ error: "Server error", details: err.message });
  }
}

// 🖥️ Local development only
if (process.env.NODE_ENV !== "production") {
  connectDB()
    .then(() => {
      app.get("/", (req, res) =>
        res.send("Prisma + Supabase + Express Connected!")
      );

      app.listen(process.env.PORT || 8000, "0.0.0.0", () => {
        console.log(`Server running on port ${process.env.PORT || 8000}`);
      });
    })
    .catch((err) => console.log("DB connection failed!", err));
}