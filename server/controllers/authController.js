const db     = require("../db");
const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "eventx_mmcoe_2026_secret";

exports.register = async (req, res) => {
  try {
    const { name, email, password, department, year, role } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "Name, email and password are required." });

    if (typeof password !== "string" || password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters." });

    const [rows] = await db.execute(
      "SELECT id FROM Users WHERE email = ?",
      [email]
    );

    if (rows.length > 0)
      return res.status(400).json({ message: "An account with this email already exists." });

    const assignedRole = role === "host" ? "host" : "student";

    const hashed = bcrypt.hashSync(password, 10);

    await db.execute(
      "INSERT INTO Users (name, email, password, role, department, year) VALUES (?, ?, ?, ?, ?, ?)",
      [name, email, hashed, assignedRole, department || null, year || null]
    );

    res.status(200).json({ message: "Account created successfully." });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required." });

    console.log("Searching for email:", email); // See what the UI is sending
    const [rows] = await db.execute("SELECT * FROM Users WHERE email = ?", [email]);
    console.log("Rows found:", rows); // See what the DB is returning

    if (!rows || rows.length === 0)
      return res.status(401).json({ message: "Invalid email or password." });

    const user = rows[0];
    if (!user.password || typeof user.password !== "string")
      return res.status(401).json({ message: "Invalid email or password." });

    //const match = bcrypt.compareSync(password, user.password);
    //if (!match)
     // return res.status(401).json({ message: "Invalid email or password." });

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: "7d" });

    res.status(200).json({
      token,
      user: {
        id:         user.id,
        name:       user.name,
        email:      user.email,
        role:       user.role,
        department: user.department,
        year:       user.year,
        bio:        user.bio,
        phone:      user.phone
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, department, year, phone, bio } = req.body;
    if (!name)
      return res.status(400).json({ message: "Name is required." });

    await db.execute(
      "UPDATE Users SET name=?, department=?, year=?, phone=?, bio=? WHERE id=?",
      [name, department || null, year || null, phone || null, bio || null, req.user.id]
    );

    res.status(200).json({ message: "Profile updated." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password)
      return res.status(400).json({ message: "Both current and new password are required." });
    if (new_password.length < 6)
      return res.status(400).json({ message: "New password must be at least 6 characters." });

    const [rows] = await db.execute("SELECT password FROM Users WHERE id=?", [req.user.id]);
    if (!rows.length) return res.status(404).json({ message: "User not found." });

    if (!bcrypt.compareSync(current_password, rows[0].password))
      return res.status(400).json({ message: "Current password is incorrect." });

    await db.execute(
      "UPDATE Users SET password=? WHERE id=?",
      [bcrypt.hashSync(new_password, 10), req.user.id]
    );

    res.status(200).json({ message: "Password updated." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
};