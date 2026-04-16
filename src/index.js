import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app.get("/", (req, res) =>
      res.send("Prisma + Supabase + Express Connected!"),
    );

    app.listen(process.env.PORT || 8000, "0.0.0.0", () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => console.log("DB connection failed!", err));
