import { Router } from "express";
import { getRegistrationsHandler } from "../controllers/sheetsController.js";

const router = Router();

// GET /api/sheets - List all rows from Google Sheet
router.get("/", getRegistrationsHandler);

export default router;
