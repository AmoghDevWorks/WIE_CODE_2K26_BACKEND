import { Router } from "express";
import { uploadAbstract } from "../middlewares/uploadMiddleware.js";
import { registerTeamHandler } from "../controllers/registrationController.js";

const router = Router();

// POST /api/register - Main team registration endpoint
// Handles multipart/form-data with file field 'abstract'
router.post("/", (req, res, next) => {
    uploadAbstract.single("abstract")(req, res, (err) => {
        if (err) {
            // Handle multer upload errors (e.g. file size > 2MB, wrong file type)
            return res.status(400).json({
                success: false,
                error: err.message
            });
        }
        next();
    });
}, registerTeamHandler);

export default router;
