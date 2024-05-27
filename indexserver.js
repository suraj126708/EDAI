import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import { connect, disconnect } from "./db.js"; // Importing the connect and disconnect functions

import routes from "./routes.js"; // Importing the routes

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

// Set view engine to EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// Use routes
app.use("/", routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// Start the server and connect to the database
app.listen(port, async () => {
  console.log(`Listening on port ${port}`);
  await connect();
});

// Handle graceful shutdown
const gracefulShutdown = async () => {
  console.log("Gracefully shutting down...");
  await disconnect();
  process.exit(0);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
