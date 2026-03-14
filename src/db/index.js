import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client/index.js";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

// Use POOLER_URL for runtime queries (pgbouncer on port 6543)
const connectionString = `${process.env.POOLER_URL}`;

const adapter = new PrismaPg({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const prisma = new PrismaClient({ adapter });

const connectDB = async () => {
    try {
        await prisma.$connect();
        console.log("Database connected successfully");
        return prisma;
    } catch (error) {
        console.error("DB connection failed:", error);
        process.exit(1);
    }
};

export default connectDB;
export { prisma };