import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import { connect, disconnect } from "./db.js";
import session from "express-session";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import donationRoutes from "./routes/donations.js";
import ngoRoutes from "./routes/ngo.js";
import generalRoutes from "./routes/general.js";
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

// Set view engine to EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Session middleware
app.use(
  session({
    secret: process.env.SECRET_KEY, // Use environment variable for secret
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // Set to true if using HTTPS
      maxAge: 5 * 24 * 60 * 60 * 1000, // 5 days in milliseconds
    },
    rolling: true, // Refresh session expiry on each request
  })
);

// Use routes
app.use(authRoutes);
app.use(donationRoutes);
app.use(ngoRoutes);
app.use(generalRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!"); // Generic error message
});

app.listen(port, async () => {
  try {
    await connect();
    console.log(`Listening on port ${port}`);
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
});

const gracefulShutdown = async () => {
  console.log("Gracefully shutting down...");
  await disconnect();
  process.exit(0);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
