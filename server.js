import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import helmet from "helmet";
import cors from "cors";
import { runLighthouseAudit } from "./services/lighthouseService.js";
import AuditReport from "./models/AuditReport.js";
import path from "path";
import { fileURLToPath } from "url";



dotenv.config();
const PORT = process.env.PORT || 4000;
await mongoose.connect(process.env.MONGO_URI, {});

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// after app.use(express.json());
app.use(express.static(path.join(__dirname, "dashboard")));


/**
 * POST /audit
 * Body: { url: string, keyword?: string, userId?: string }
 */
app.post("/audit", async (req, res) => {
  // console.log("start",req.body)
  const { url, keyword, userId,device } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });
  try {
    const auditResult = await runLighthouseAudit(url,device);

    // Save audit report to DB if userId provided
    let savedReport = null;
    if (userId) {
      savedReport = await AuditReport.create({ userId, url, keyword, auditResult });
    }

    return res.json({ ok: true, auditResult, reportId: savedReport?._id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Audit failed", detail: err.toString() });
  }
});

/**
 * GET /audit/:id
 * Retrieve saved report
 */
app.get("/audit/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const report = await AuditReport.find({ userId }).sort({ createdAt: -1 });
    if (!report) return res.status(404).json({ error: "Report not found" });
    return res.json({ ok: true, report });
  } catch (err) {
    return res.status(500).json({ error: "Failed", detail: err.toString() });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
