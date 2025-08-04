import express from "express";
import { pool } from "../db.js";
import bcrypt from "bcrypt";
import multer from "multer";
import fs from "fs";
import path from "path";

const router = express.Router();

// Multer setup for NGO registration (file upload)
const uploadDir = path.resolve("upload");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
function fileFilter(req, file, cb) {
  const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, JPG, and PNG files are allowed!"), false);
  }
}
const upload = multer({ storage, fileFilter });
const saltRounds = 10;

// User login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const valid = await bcrypt.compare(password, user.password);
      if (valid) {
        req.session.user = user;
        return res.json({ status: "success", redirect: "/" });
      } else {
        return res
          .status(401)
          .json({ status: "error", message: "Incorrect password" });
      }
    } else {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }
  } catch (err) {
    console.error("Error logging in:", err);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});

// NGO login
router.post("/ngo-login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const query = "SELECT * FROM ngo_register WHERE email = $1";
    const result = await pool.query(query, [email]);
    if (result.rows.length > 0) {
      const ngo = result.rows[0];
      if (ngo.registration_number === password) {
        req.session.ngo = ngo;
        res.render("index");
      } else {
        res.status(401).json({ message: "Incorrect password" });
      }
    } else {
      res.status(404).json({ message: "NGO not found" });
    }
  } catch (err) {
    console.error("Error logging in:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// User registration
router.post("/register-user", async (req, res) => {
  const { Fullname, phone, email, password } = req.body;
  try {
    const currentTime = new Date().toISOString();
    const checkResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (checkResult.rows.length > 0) {
      return res.redirect("/user-login");
    } else {
      const hash = await bcrypt.hash(password, saltRounds);
      await pool.query(
        "INSERT INTO users (fullname, phone, email, password, date) VALUES ($1, $2, $3, $4, $5)",
        [Fullname, phone, email, hash, currentTime]
      );
      return res.redirect("/user-login");
    }
  } catch (err) {
    console.error("Error saving user to database:", err);
    res.status(500).send("Internal Server Error");
  }
});

// NGO registration
router.post("/ngo-register", upload.single("file"), async (req, res) => {
  const {
    name,
    registration_number,
    email,
    phone,
    phone2,
    addline,
    land,
    city,
    state,
    pincode,
    optnote,
    url,
    socialsurl,
    terms,
  } = req.body;
  const registration_certificate = req.file;
  if (!registration_certificate) {
    return res.status(400).send("File upload failed or invalid file type");
  }
  try {
    const checkResult = await pool.query(
      "SELECT id FROM ngo_register WHERE registration_number = $1",
      [registration_number]
    );
    if (checkResult.rows.length > 0) {
      return res.render("login_register/ngo-register", {
        user: req.session.user,
        ngo: req.session.ngo,
        error:
          "Registration number already exists. Please use a unique registration number.",
      });
    }
    const query = `
      INSERT INTO ngo_register (
        ngo_name,
        registration_number,
        email,
        primary_phone,
        alternate_phone,
        address,
        landmark,
        city,
        state,
        pincode,
        description,
        website_url,
        social_handle_url,
        registration_certificate
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `;
    await pool.query(query, [
      name,
      registration_number,
      email,
      phone,
      phone2,
      addline,
      land,
      city,
      state,
      pincode,
      optnote,
      url,
      socialsurl,
      registration_certificate.path,
    ]);
    res.render("index");
  } catch (err) {
    console.error("Error saving NGO to database:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

export default router;
