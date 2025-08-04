import express from "express";
import { ensureUserAuthenticated } from "../middleware/auth.js";
import { ensureNGOAuthenticated } from "../middleware/auth.js";

const router = express.Router();

router.get("/", (req, res) =>
  res.render("index", { user: req.session.user, ngo: req.session.ngo })
);
router.get("/rewards", ensureUserAuthenticated, (req, res) =>
  res.render("rewards", { user: req.session.user, ngo: req.session.ngo })
);
router.get("/ngo-login", (req, res) =>
  res.render("login_register/ngo_login", {
    user: req.session.user,
    ngo: req.session.ngo,
  })
);
router.get("/user-login", (req, res) =>
  res.render("login_register/user_login", {
    user: req.session.user,
    ngo: req.session.ngo,
  })
);
router.get("/register-user", (req, res) =>
  res.render("login_register/user-register", {
    user: req.session.user,
    ngo: req.session.ngo,
  })
);
router.get("/ngo-user", (req, res) =>
  res.render("login_register/user-register", {
    user: req.session.user,
    ngo: req.session.ngo,
  })
);
router.get("/complete-registration", (req, res) =>
  res.render("index", { user: req.session.user, ngo: req.session.ngo })
);
router.get("/ngo-register", (req, res) =>
  res.render("login_register/ngo-register", {
    user: req.session.user,
    ngo: req.session.ngo,
  })
);
router.get("/donate2", ensureUserAuthenticated, (req, res) =>
  res.render("donate/donate2", { user: req.session.user, ngo: req.session.ngo })
);
router.get("/contact", (req, res) =>
  res.render("contact", { user: req.session.user, ngo: req.session.ngo })
);
router.get("/about", (req, res) =>
  res.render("about", { user: req.session.user, ngo: req.session.ngo })
);
router.get("/user", ensureUserAuthenticated, (req, res) =>
  res.render("acount", { user: req.session.user, ngo: req.session.ngo })
);
router.get("/donate", ensureUserAuthenticated, (req, res) =>
  res.render("donate/donate1", { user: req.session.user, ngo: req.session.ngo })
);
router.get("/login", (req, res) =>
  res.render("login_register/user_login", {
    user: req.session.user,
    ngo: req.session.ngo,
  })
);
router.get("/submit-info", ensureUserAuthenticated, (req, res) => {
  const { donationId } = req.query;
  res.render("donate/donate2", { donationId });
});
router.get("/donated", ensureUserAuthenticated, (req, res) => {
  const { donationId } = req.query;
  res.render("donate/donate3", { donationId });
});
router.post("/query", async (req, res) => {
  const { name, email, message } = req.body;
  try {
    await pool.query(
      "INSERT INTO queries (name, email, query) VALUES ($1, $2, $3)",
      [name, email, message]
    );
    res.redirect("/");
  } catch (err) {
    console.error("Error saving contact query:", err);
    res.status(500).send("Internal Server Error");
  }
});
router.get("/ngo-dashboard", ensureNGOAuthenticated, (req, res) =>
  res.render("admin/VerifyNGOs", {
    user: req.session.user,
    ngo: req.session.ngo,
  })
);

export default router;
