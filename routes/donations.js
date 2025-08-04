import express from "express";
import { pool } from "../db.js";
import { ensureUserAuthenticated } from "../middleware/auth.js";

const router = express.Router();

router.post("/submit-donation", ensureUserAuthenticated, async (req, res) => {
  const {
    books = 0,
    clothes = 0,
    grains = 0,
    footwear = 0,
    toys = 0,
    schoolSupplies = 0,
  } = req.body;
  const userId = req.session.user.id;
  try {
    const result = await pool.query(
      `INSERT INTO donations (books, clothes, grains, footwear, toys, schoolSupplies, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [books, clothes, grains, footwear, toys, schoolSupplies, userId]
    );
    const donationId = result.rows[0].id;
    res.redirect(`/submit-info?donationId=${donationId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

router.post("/submit-info", ensureUserAuthenticated, async (req, res) => {
  const {
    donationId,
    fname,
    lname,
    email,
    phone,
    phone2,
    flat,
    addline,
    land,
    city,
    state,
    pincode,
    optnote,
  } = req.body;
  try {
    await pool.query(
      `UPDATE donations SET fname = $1, lname = $2, email = $3, phone = $4, phone2 = $5, flat = $6, addline = $7, land = $8, city = $9, state = $10, pincode = $11, optnote = $12 WHERE id = $13`,
      [
        fname,
        lname,
        email,
        phone,
        phone2,
        flat,
        addline,
        land,
        city,
        state,
        pincode,
        optnote,
        donationId,
      ]
    );
    res.redirect(`/donated?donationId=${donationId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

router.post("/donated", ensureUserAuthenticated, async (req, res) => {
  const { date, time, donationId } = req.body;
  try {
    await pool.query(
      `UPDATE donations SET pickup_date = $1, pickup_time = $2 WHERE id = $3`,
      [date, time, donationId]
    );
    res.render("index");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

router.post("/donations/:id/complete", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      "UPDATE donations SET status = 'completed' WHERE id = $1",
      [id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

router.post("/donations/:id/cancel", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      "UPDATE donations SET status = 'cancelled' WHERE id = $1",
      [id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

export default router;
