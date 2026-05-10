const db = require("../db");
const { pushNotification } = require("./notificationController");

exports.getStats = async (req, res) => {
  try {

    const [[{ total_events }]] =
      await db.execute("SELECT COUNT(*) AS total_events FROM Events");

    const [[{ total_registrations }]] =
      await db.execute("SELECT COUNT(*) AS total_registrations FROM Registrations");

    const [[{ total_students }]] =
      await db.execute("SELECT COUNT(*) AS total_students FROM Users WHERE role='student'");

    const [[{ upcoming_events }]] =
      await db.execute("SELECT COUNT(*) AS upcoming_events FROM Events WHERE date >= NOW()");

    const [[{ active_events }]] =
      await db.execute("SELECT COUNT(*) AS active_events FROM Events WHERE status IN ('registration_open','ongoing')");

    const [[{ pending_approvals }]] =
      await db.execute("SELECT COUNT(*) AS pending_approvals FROM EventApprovals WHERE status='pending'");

    const [events] = await db.execute(`
      SELECT
        e.id,
        e.title,
        e.category,
        e.date,
        e.venue,
        e.poster,
        e.status,
        e.approval_status,
        COUNT(r.id) AS registered_count,
        e.max_participants
      FROM Events e
      LEFT JOIN Registrations r ON r.event_id = e.id
      GROUP BY e.id
      ORDER BY e.date DESC
      LIMIT 20
    `);

    res.json({
      total_events,
      total_registrations,
      total_students,
      upcoming_events,
      active_events,
      pending_approvals,
      events
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.getEvents = async (req, res) => {
  try {

    const [rows] = await db.execute(`
      SELECT
        e.id,
        e.title,
        e.description,
        e.date,
        e.venue,
        e.category,
        e.poster,
        e.timeline,
        e.status,
        e.approval_status,
        COUNT(r.id) AS registered_count
      FROM Events e
      LEFT JOIN Registrations r ON r.event_id = e.id
      GROUP BY e.id
      ORDER BY e.date DESC
    `);

    rows.forEach(e => {
      if (e.timeline && typeof e.timeline === "string") {
        try { e.timeline = JSON.parse(e.timeline); }
        catch { e.timeline = null; }
      }
    });

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.getParticipants = async (req, res) => {
  try {

    const eventId = req.query.event_id || null;
    const search = req.query.search ? `%${req.query.search}%` : null;

    let sql = `
      SELECT
        r.id AS registration_id,
        r.ticket_id,
        r.status,
        r.score,
        r.position,
        r.created_at AS registered_at,
        u.name,
        u.email,
        u.department,
        u.year,
        e.id AS event_id,
        e.title AS event_title
      FROM Registrations r
      JOIN Users u ON r.user_id = u.id
      JOIN Events e ON r.event_id = e.id
    `;

    const params = [];
    const conditions = [];

    if (eventId) {
      conditions.push("r.event_id = ?");
      params.push(eventId);
    }

    if (search) {
      conditions.push("(u.name LIKE ? OR u.email LIKE ? OR e.title LIKE ?)");
      params.push(search, search, search);
    }

    if (conditions.length)
      sql += " WHERE " + conditions.join(" AND ");

    sql += " ORDER BY r.created_at DESC";

    const [rows] = await db.execute(sql, params);

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.updateScore = async (req, res) => {
  try {

    const { score, position } = req.body;
    const regId = req.params.id;

    await db.execute(
      "UPDATE Registrations SET score=?, position=? WHERE id=?",
      [score ?? null, position || null, regId]
    );

    const [rows] = await db.execute(`
      SELECT r.user_id, e.title
      FROM Registrations r
      JOIN Events e ON r.event_id = e.id
      WHERE r.id = ?
    `, [regId]);

    if (rows.length) {
      await pushNotification(
        rows[0].user_id,
        "success",
        "",
        "Score Updated",
        `Your score for "${rows[0].title}" has been updated.`
      );
    }

    res.json({ message: "Score updated." });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    // 1. Basic Stats
    const [[{ totalEvents }]] = await db.execute("SELECT COUNT(*) AS totalEvents FROM Events");
    const [[{ totalRegistrations }]] = await db.execute("SELECT COUNT(*) AS totalRegistrations FROM Registrations");
    const [[{ activeEvents }]] = await db.execute("SELECT COUNT(*) AS activeEvents FROM Events WHERE status IN ('registration_open', 'ongoing')");
    
    const avgRegistrations = totalEvents > 0 ? (totalRegistrations / totalEvents).toFixed(1) : 0;

    // 2. Daily Registration Trend (registrationsOverTime)
    const [registrationsOverTime] = await db.execute(`
      SELECT DATE(created_at) as day, COUNT(*) as count 
      FROM Registrations 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY day ORDER BY day ASC
    `);

    // 3. Category Distribution (eventsByCategory)
    const [eventsByCategory] = await db.execute(`
      SELECT category, COUNT(*) as count FROM Events GROUP BY category
    `);

    // 4. Monthly Growth (monthlyRegistrations)
    const [monthlyRegistrations] = await db.execute(`
      SELECT DATE_FORMAT(created_at, '%b %Y') as month, COUNT(*) as count 
      FROM Registrations 
      GROUP BY month ORDER BY MIN(created_at) ASC
    `);

    // 5. Top Events (topEvents)
    const [topEvents] = await db.execute(`
      SELECT e.title, COUNT(r.id) as registrations 
      FROM Events e 
      LEFT JOIN Registrations r ON e.id = r.event_id 
      GROUP BY e.id ORDER BY registrations DESC LIMIT 5
    `);

    // Send the response with keys that match analytics.js exactly
    res.json({
      totalEvents,
      totalRegistrations,
      activeEvents,
      avgRegistrations,
      registrationsOverTime,
      eventsByCategory,
      monthlyRegistrations,
      topEvents
    });

  } catch (err) {
    console.error("ADMIN ANALYTICS ERROR:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.exportAll = async (req, res) => {
  try {
    // We join Users, Events, and Registrations to get a complete picture
    const [rows] = await db.execute(`
      SELECT
        u.name AS 'Student_Name',
        u.email AS 'Email',
        u.department AS 'Department',
        u.year AS 'Year',
        e.title AS 'Event_Title',
        e.category AS 'Event_Category',
        DATE_FORMAT(e.date, '%Y-%m-%d') AS 'Event_Date',
        r.ticket_id AS 'Ticket_ID',
        r.status AS 'Participation_Status',
        r.score AS 'Score',
        r.position AS 'Rank',
        DATE_FORMAT(r.created_at, '%Y-%m-%d %H:%i') AS 'Registration_Time'
      FROM Registrations r
      JOIN Users u ON r.user_id = u.id
      JOIN Events e ON r.event_id = e.id
      ORDER BY e.date DESC, u.department ASC, u.year ASC
    `);

    if (rows.length === 0) {
      return res.status(404).send("No registration data found to export.");
    }

    // 1. Create CSV Headers
    const headers = Object.keys(rows[0]).join(",");

    // 2. Map data rows and handle potential commas in text fields
    const csvRows = rows.map(row => {
      return Object.values(row)
        .map(value => {
          const str = value === null ? "" : String(value);
          // Escape quotes and wrap in quotes to prevent CSV breakage
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(",");
    });

    // 3. Combine headers and rows
    const csvContent = [headers, ...csvRows].join("\n");

    // 4. Set headers for file download
    const fileName = `MMCOE_Master_Report_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    
    res.send(csvContent);

  } catch (err) {
    console.error("EXPORT ERROR:", err);
    res.status(500).json({ message: "Internal server error during export." });
  }
};

exports.exportEvent = async (req, res) => {
  try {

    const eventId = req.params.event_id;

    const [rows] = await db.execute(`
      SELECT
        u.name,
        u.email,
        u.department,
        u.year,
        e.title AS event_title,
        r.ticket_id,
        r.status,
        r.created_at
      FROM Registrations r
      JOIN Users u ON r.user_id = u.id
      JOIN Events e ON r.event_id = e.id
      WHERE r.event_id = ?
    `,[eventId]);

    const header =
      "Name,Email,Department,Year,Event,Ticket ID,Status,Registered At";

    const csv =
      rows.map(r =>
        `"${r.name}","${r.email}","${r.department||""}","${r.year||""}","${r.event_title}","${r.ticket_id||""}","${r.status}","${r.created_at}"`
      ).join("\n");

    res.setHeader("Content-Type","text/csv");
    res.setHeader("Content-Disposition",`attachment; filename="event_${eventId}.csv"`);

    res.send(header + "\n" + csv);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message:"Internal server error." });
  }
};

exports.getApprovals = async (req,res)=>{
  try{

    const [rows] = await db.execute(`
      SELECT
  ea.id,
  ea.status,
  ea.requested_at,
  e.id AS event_id,
  e.title,
  e.date,
  e.venue
FROM EventApprovals ea
JOIN Events e ON ea.event_id = e.id
ORDER BY ea.requested_at DESC
    `);

    res.json(rows);

  }catch(err){
    console.error(err);
    res.status(500).json({message:"Internal server error"});
  }
};

exports.reviewApproval = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const { action, note } = req.body; 

    console.log(`Final Sync: Processing ${action} for Event ID: ${eventId}`);

    // 1. Map UI action ('approve'/'reject') to Database values
    const finalApprovalStatus = (action === 'approve') ? 'approved' : 'rejected';
    
    const finalEventStatus = (action === 'approve') ? 'registration_open' : 'draft';

    // 3. Direct Update to the Events table
    const [result] = await db.execute(
      `UPDATE Events 
       SET approval_status = ?, 
           status = ?, 
           remarks = ? 
       WHERE id = ?`,
      [finalApprovalStatus, finalEventStatus, note || null, eventId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Event not found in Database." });
    }

    res.json({ 
      message: (action === 'approve') 
        ? "Event Approved and Published!" 
        : "Event Rejected." 
    });

  } catch (err) {
    console.error("ADMIN APPROVAL ERROR:", err);
    res.status(500).json({ message: "Internal server error: " + err.message });
  }
};
exports.verifyQR = async (req, res) => {
  try {

    const { qr_data, mark_attendance } = req.body;

    if (!qr_data)
      return res.status(400).json({ valid:false, message:"No QR data provided." });

    const parsed = JSON.parse(qr_data);
    const { ticket_id, user_id, event_id } = parsed;

    const [rows] = await db.execute(`
      SELECT
        r.id,
        r.ticket_id,
        r.status,
        r.created_at AS registered_at,
        u.name,
        e.title AS event_title
      FROM Registrations r
      JOIN Users u ON r.user_id = u.id
      JOIN Events e ON r.event_id = e.id
      WHERE r.ticket_id=? AND r.user_id=? AND r.event_id=?
    `,[ticket_id,user_id,event_id]);

    if (!rows.length)
      return res.status(404).json({ valid:false, message:"Registration not found." });

    const reg = rows[0];

    if (mark_attendance && reg.status !== "attended") {
      await db.execute(
        "UPDATE Registrations SET status='attended' WHERE id=?",
        [reg.id]
      );
      reg.status = "attended";
    }

    res.json({ valid:true, registration:reg });

  } catch (err) {
    console.error(err);
    res.status(500).json({ valid:false, message:"Internal server error." });
  }
};

exports.exportMasterReport = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        u.name AS 'Student Name',
        u.email AS 'Email',
        u.department AS 'Department',
        u.year AS 'Year',
        e.title AS 'Event Name',
        r.status AS 'Attendance Status',
        DATE_FORMAT(r.created_at, '%Y-%m-%d') AS 'Registration Date'
      FROM Registrations r
      JOIN Users u ON r.user_id = u.id
      JOIN Events e ON r.event_id = e.id
      ORDER BY e.date DESC, u.department ASC
    `);

    const headers = Object.keys(rows[0]).join(",");
    const csvContent = [headers, ...rows.map(r => Object.values(r).map(v => `"${v}"`).join(","))].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="MMCOE_Master_Participant_Report.csv"');
    res.send(csvContent);
  } catch (err) {
     res.status(500).send("Export failed");
  }
};