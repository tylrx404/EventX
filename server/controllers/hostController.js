const db = require("../db");
const { pushNotification, notifyAllAdmins, notifyEventRegistrants } = require("./notificationController");

exports.getStats = async (req, res) => {
  try {
    const hostId = req.user.id;

    const [[{ my_events }]] = await db.execute(
      "SELECT COUNT(*) AS my_events FROM Events WHERE host_id=?", [hostId]
    );
    const [[{ approved }]] = await db.execute(
      "SELECT COUNT(*) AS approved FROM Events WHERE host_id=? AND approval_status='approved'", [hostId]
    );
    const [[{ pending }]] = await db.execute(
      "SELECT COUNT(*) AS pending FROM EventApprovals WHERE host_id=? AND status='pending'", [hostId]
    );
    const [[{ total_registrations }]] = await db.execute(
      `SELECT COUNT(*) AS total_registrations
       FROM Registrations r
       JOIN Events e ON r.event_id = e.id
       WHERE e.host_id=?`, [hostId]
    );

    const [events] = await db.execute(`
      SELECT e.id, e.title, e.date, e.category, e.status, e.approval_status,
             COUNT(r.id) AS registered_count, e.max_participants
      FROM Events e
      LEFT JOIN Registrations r ON r.event_id = e.id
      WHERE e.host_id = ?
      GROUP BY e.id
      ORDER BY e.date DESC
      LIMIT 10
    `, [hostId]);

    res.status(200).json({ my_events, approved, pending, total_registrations, events });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.getEvents = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT e.*,
COUNT(r.id) AS registered_count,
MAX(ea.status) AS approval_req_status,
MAX(ea.admin_note) AS admin_note,
MAX(ea.host_message) AS host_message
FROM Events e
LEFT JOIN Registrations r ON r.event_id = e.id
LEFT JOIN EventApprovals ea ON ea.event_id = e.id
WHERE e.host_id = ?
GROUP BY e.id
ORDER BY e.date DESC

    `, [req.user.id]);

    rows.forEach(e => {
      if (e.timeline && typeof e.timeline === "string") {
        try { e.timeline = JSON.parse(e.timeline); } catch { e.timeline = null; }
      }
      if (e.cert_fields && typeof e.cert_fields === "string") {
        try { e.cert_fields = JSON.parse(e.cert_fields); } catch { e.cert_fields = null; }
      }
    });

    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const {
      title, description, date, registration_deadline, venue,
      category, max_participants, poster, timeline, prize_pool,
      cert_template, cert_fields,
      host_message   // message for admin when requesting approval
    } = req.body;

    if (!title || !date || !venue)
      return res.status(400).json({ message: "Title, date and venue are required." });

    const hostId = req.user.id; // This comes from your authMiddleware

    // 1. Insert into the main Events table
    const [result] = await db.execute(
      `INSERT INTO Events 
          (title, description, date, registration_deadline, venue, category, 
           max_participants, prize_pool, poster, timeline, status, approval_status, 
           cert_template, cert_fields, host_id) 
        VALUES (?,?,?,?,?,?,?,?,?,?,'pending_approval','pending',?,?,?)`,
      [
        title, description || null, date, registration_deadline || null,
        venue, category || "Other", max_participants || 0,
        prize_pool || null, poster ?? null,
        timeline ? JSON.stringify(timeline) : JSON.stringify([]),
        cert_template || null,
        cert_fields ? JSON.stringify(cert_fields) : null,
        hostId
      ]
    );

    const eventId = result.insertId;

    // 2. IMPORTANT: Create the approval record so it shows up in the Admin Panel
    // We explicitly pass hostId here to prevent the 'Field host_id doesn't have a default value' error
    await db.execute(
      "INSERT INTO EventApprovals (event_id, host_id, status, host_message) VALUES (?, ?, 'pending', ?)",
      [eventId, hostId, host_message || "New event created for approval."]
    );

    // 3. Notify Admins
    const [hostRow] = await db.execute("SELECT name FROM Users WHERE id=?", [hostId]);
    const hostName  = hostRow.length ? hostRow[0].name : "A host";
    
    await notifyAllAdmins(
      "info", "", 
      "New Event Pending Approval", 
      `${hostName} submitted "${title}" for approval.`
    );

    res.status(201).json({ message: "Event submitted for approval.", id: eventId });
  } catch (err) {
    console.error("EVENT CREATION ERROR:", err);
    res.status(500).json({ message: "Internal server error: " + err.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const hostId  = req.user.id;

    const [chk] = await db.execute("SELECT id, title FROM Events WHERE id=? AND host_id=?", [eventId, hostId]);
    if (!chk.length) return res.status(403).json({ message: "Event not found or access denied." });

    const {
      title, description, date, registration_deadline, venue,
      category, max_participants, poster, timeline, prize_pool,
      cert_template, cert_fields
    } = req.body;

    if (!title || !date || !venue)
      return res.status(400).json({ message: "Title, date and venue are required." });

    await db.execute(
      `UPDATE Events SET
         title=?, description=?, date=?, registration_deadline=?,
         venue=?, category=?, max_participants=?, prize_pool=?,
         poster=?, timeline=?, cert_template=?, cert_fields=?
       WHERE id=? AND host_id=?`,
      [
        title, description || null, date, registration_deadline || null,
        venue, category || "Other", max_participants || 0,
        prize_pool || null, poster ?? null,
        timeline ? JSON.stringify(timeline) : null,
        cert_template || null,
        cert_fields ? JSON.stringify(cert_fields) : null,
        eventId, hostId
      ]
    );

    await notifyEventRegistrants(eventId, "info", "",
      "Event Updated",
      `"${title}" has been updated — check the latest details.`
    );

    await notifyAllAdmins("info", "️", "Host Updated an Event", `"${title}" was updated by its host.`);

    res.status(200).json({ message: "Event updated." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.getParticipants = async (req, res) => {
  try {
    const eventId = req.params.id;
    const hostId  = req.user.id;

    // 1. Verify this host actually owns this event
    const [chk] = await db.execute("SELECT id FROM Events WHERE id=? AND host_id=?", [eventId, hostId]);
    if (!chk.length) return res.status(403).json({ message: "Event not found or access denied." });

    // 2. Fetch participants using the correct column 'created_at'
    const [rows] = await db.execute(`
      SELECT 
        r.id AS registration_id, 
        r.ticket_id, 
        r.status, 
        r.score, 
        r.position, 
        r.created_at AS registered_at, -- Changed from registration_date to created_at
        u.name, 
        u.email, 
        u.department, 
        u.year
      FROM Registrations r
      JOIN Users u ON r.user_id = u.id
      WHERE r.event_id = ?
      ORDER BY r.created_at ASC
    `, [eventId]);

    res.status(200).json(rows);
  } catch (err) {
    // Adding logging so you can see errors in the terminal
    console.error("GET PARTICIPANTS ERROR:", err);
    res.status(500).json({ message: "Internal server error: " + err.message });
  }
};

exports.updateScore = async (req, res) => {
  try {
    const regId  = req.params.id;
    const hostId = req.user.id;
    const { score, position } = req.body;

    const [chk] = await db.execute(
      `SELECT r.id, r.user_id, e.title
       FROM Registrations r
       JOIN Events e ON r.event_id = e.id
       WHERE r.id=? AND e.host_id=?`,
      [regId, hostId]
    );
    if (!chk.length) return res.status(403).json({ message: "Registration not found or access denied." });

    await db.execute(
      "UPDATE Registrations SET score=?, position=? WHERE id=?",
      [score ?? null, position || null, regId]
    );

    await pushNotification(
      chk[0].user_id, "success", "",
      "Score Updated",
      `Your score for "${chk[0].title}" has been updated!`
    );

    res.status(200).json({ message: "Score updated." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const hostId = req.user.id;

    // 1. MAIN GRAPH: Registrations vs Attendance (Keep original keys)
    const [events] = await db.execute(`
      SELECT 
        e.title, 
        e.category,
        COUNT(r.id) AS registered_count,
        SUM(CASE WHEN r.status = 'attended' THEN 1 ELSE 0 END) AS attended_count
      FROM Events e
      LEFT JOIN Registrations r ON e.id = r.event_id
      WHERE e.host_id = ?
      GROUP BY e.id
      ORDER BY registered_count DESC
      LIMIT 10
    `, [hostId]);

    // 2. CATEGORY PIE: (Keep original keys)
    const [categories] = await db.execute(`
      SELECT COALESCE(e.category,'Other') AS name, COUNT(r.id) AS count
      FROM Events e
      LEFT JOIN Registrations r ON r.event_id = e.id
      WHERE e.host_id = ?
      GROUP BY e.category
    `, [hostId]);

    // 3. MONTHLY TREND: (Keep original keys)
    const [monthly] = await db.execute(`
      SELECT DATE_FORMAT(r.created_at,'%Y-%m') AS month, COUNT(*) AS registrations
      FROM Registrations r
      JOIN Events e ON r.event_id = e.id
      WHERE e.host_id = ?
      GROUP BY month
      ORDER BY month ASC
    `, [hostId]);

    // 4. NEW SQUARE: Department Split
    const [deptSplit] = await db.execute(`
      SELECT u.department as name, COUNT(r.id) as count
      FROM Registrations r 
      JOIN Users u ON r.user_id = u.id
      JOIN Events e ON r.event_id = e.id
      WHERE e.host_id = ? 
      GROUP BY u.department
    `, [hostId]);

    // 5. NEW SQUARE: Year-wise Split
    const [yearSplit] = await db.execute(`
      SELECT u.year as name, COUNT(r.id) as count
      FROM Registrations r 
      JOIN Users u ON r.user_id = u.id
      JOIN Events e ON r.event_id = e.id
      WHERE e.host_id = ? 
      GROUP BY u.year
      ORDER BY FIELD(u.year, 'FE', 'SE', 'TE', 'BE')
    `, [hostId]);

    res.status(200).json({ events, categories, monthly, deptSplit, yearSplit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
};
exports.exportHostReport = async (req, res) => {
  try {
    const hostId = req.user.id;
    const { period, start, end } = req.query;

    let dateCondition = "";
    const params = [hostId];

    // 1. Dynamic Date Logic
    if (period === "month") {
      dateCondition = "AND e.date >= DATE_SUB(NOW(), INTERVAL 1 MONTH)";
    } else if (period === "6months") {
      dateCondition = "AND e.date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)";
    } else if (period === "year") {
      dateCondition = "AND e.date >= DATE_SUB(NOW(), INTERVAL 1 YEAR)";
    } else if (period === "custom" && start && end) {
      dateCondition = "AND e.date BETWEEN ? AND ?";
      params.push(start, end);
    }

    // 2. The "Master Report" Query
    // Joins Events with Registrations to calculate attendance and participation per event
    const [rows] = await db.execute(`
      SELECT 
        e.title AS 'Event Name',
        e.category AS 'Category',
        DATE_FORMAT(e.date, '%Y-%m-%d') AS 'Event Date',
        e.venue AS 'Venue',
        COUNT(r.id) AS 'Total Registrations',
        SUM(CASE WHEN r.status = 'attended' THEN 1 ELSE 0 END) AS 'Actual Attendance',
        e.prize_pool AS 'Prize Pool',
        e.approval_status AS 'Status'
      FROM Events e
      LEFT JOIN Registrations r ON e.id = r.event_id
      WHERE e.host_id = ? ${dateCondition}
      GROUP BY e.id
      ORDER BY e.date DESC
    `, params);

    if (rows.length === 0) {
      return res.status(404).send("No events found for the selected period.");
    }

    // 3. Convert to CSV
    const headers = Object.keys(rows[0]).join(",");
    const csvRows = rows.map(row => 
      Object.values(row).map(value => `"${value || 0}"`).join(",")
    );
    const csvContent = [headers, ...csvRows].join("\n");

    // 4. Send File
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="Host_Report_${period}.csv"`);
    res.send(csvContent);

  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error during report generation.");
  }
};