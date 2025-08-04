import express from "express";
import { pool } from "../db.js";
import fs from "fs";
import path from "path";
import { ensureNGOAuthenticated } from "../middleware/auth.js";

const router = express.Router();

// Admin: List and verify NGOs with filters/search

router.get("admin/all-donations", ensureNGOAuthenticated, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;
  const { status, city, search } = req.query;
  let whereClauses = [];
  let values = [];
  let idx = 1;
  if (status && status !== "") {
    whereClauses.push(`status = $${idx++}`);
    values.push(status);
  }
  if (city && city !== "") {
    whereClauses.push(`LOWER(city) = LOWER($${idx++})`);
    values.push(city);
  }
  if (search && search !== "") {
    whereClauses.push(`(
      LOWER(fname) LIKE LOWER($${idx}) OR
      LOWER(lname) LIKE LOWER($${idx}) OR
      LOWER(city) LIKE LOWER($${idx}) OR
      LOWER(addline) LIKE LOWER($${idx})
    )`);
    values.push(`%${search}%`);
    idx++;
  }
  let whereSQL =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  try {
    const result = await pool.query(
      `SELECT id, books, clothes, grains, footwear, toys, schoolsupplies, fname, lname, email, phone, phone2, flat, addline, land, city, state, pincode, optnote, pickup_date, pickup_time, status FROM donations ${whereSQL} ORDER BY id DESC LIMIT $${idx} OFFSET $${
        idx + 1
      }`,
      [...values, limit, offset]
    );
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM donations ${whereSQL}`,
      values
    );
    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);
    const totalRequestsResult = await pool.query(
      "SELECT COUNT(*) FROM donations"
    );
    const completedResult = await pool.query(
      "SELECT COUNT(*) FROM donations WHERE status = 'completed'"
    );
    const activeResult = await pool.query(
      "SELECT COUNT(*) FROM donations WHERE status = 'pending'"
    );
    res.render("admin/AllDonations", {
      donations: result.rows,
      currentPage: page,
      totalPages,
      user: req.session.user,
      ngo: req.session.ngo,
      totalRequests: parseInt(totalRequestsResult.rows[0].count),
      completedCount: parseInt(completedResult.rows[0].count),
      activeCount: parseInt(activeResult.rows[0].count),
      filterStatus: status || "",
      filterCity: city || "",
      filterSearch: search || "",
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

router.get("/admin/ngos", ensureNGOAuthenticated, async (req, res) => {
  const { status, city, search } = req.query;
  let whereClauses = [];
  let values = [];
  let idx = 1;
  if (status && status !== "") {
    whereClauses.push(`status = $${idx++}`);
    values.push(status);
  }
  if (city && city !== "") {
    whereClauses.push(`LOWER(city) = LOWER($${idx++})`);
    values.push(city);
  }
  if (search && search !== "") {
    whereClauses.push(`(
      LOWER(ngo_name) LIKE LOWER($${idx}) OR
      LOWER(city) LIKE LOWER($${idx}) OR
      LOWER(registration_number) LIKE LOWER($${idx})
    )`);
    values.push(`%${search}%`);
    idx++;
  }
  let whereSQL =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  try {
    const result = await pool.query(
      `SELECT * FROM ngo_register ${whereSQL} ORDER BY id DESC`,
      values
    );
    const processedNGOs = result.rows.map((ngo) => ({
      ...ngo,
      certificate_url: ngo.registration_certificate || null,
    }));
    const total = result.rows.length;
    const applied = result.rows.filter(
      (ngo) => ngo.status === "applied"
    ).length;
    const verified = result.rows.filter(
      (ngo) => ngo.status === "verified"
    ).length;
    const suspended = result.rows.filter(
      (ngo) => ngo.status === "suspended"
    ).length;
    const citySet = new Set();
    result.rows.forEach((ngo) => {
      if (ngo.city) citySet.add(ngo.city);
    });
    const cityList = Array.from(citySet);
    res.render("admin/VerifyNGOs", {
      ngos: processedNGOs,
      total,
      applied,
      verified,
      suspended,
      filterStatus: status || "",
      filterCity: city || "",
      filterSearch: search || "",
      cityList,
    });
  } catch (err) {
    console.error("Error in /admin/ngos route:", err);
    res.status(500).send("Server error");
  }
});

// Admin: Update NGO status
router.post(
  "/admin/ngos/:id/status",
  ensureNGOAuthenticated,
  async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
      await pool.query("UPDATE ngo_register SET status = $1 WHERE id = $2", [
        status,
        id,
      ]);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: "Server error" });
    }
  }
);

// Serve NGO registration certificate as PDF or image
router.get(
  "/admin/ngos/:id/certificate",
  ensureNGOAuthenticated,
  async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query(
        "SELECT registration_certificate FROM ngo_register WHERE id = $1",
        [id]
      );
      if (
        result.rows.length === 0 ||
        !result.rows[0].registration_certificate
      ) {
        return res.status(404).send("Certificate not found");
      }
      const filePath = result.rows[0].registration_certificate;
      if (!fs.existsSync(filePath)) {
        return res.status(404).send("Certificate file not found on server");
      }
      const ext = path.extname(filePath).toLowerCase();
      let contentType = "application/octet-stream";
      if (ext === ".pdf") contentType = "application/pdf";
      else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
      else if (ext === ".png") contentType = "image/png";
      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Content-Disposition",
        `inline; filename=certificate${ext}`
      );
      fs.createReadStream(filePath).pipe(res);
    } catch (err) {
      console.error("Error fetching certificate:", err);
      res.status(500).send("Server error");
    }
  }
);

export default router;
