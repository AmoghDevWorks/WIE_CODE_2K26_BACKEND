import multer from "multer";

// Use in-memory buffer so NO files are written to the local disk
const storage = multer.memoryStorage();

// File filter (Only PDF files)
const fileFilter = (req, file, cb) => {
    const isPdfMime = file.mimetype === "application/pdf";
    const isPdfExt = /\.pdf$/i.test(file.originalname);

    if (isPdfMime || isPdfExt) {
        cb(null, true);
    } else {
        cb(new Error("Only PDF files are allowed for abstract upload."), false);
    }
};

// Multer upload instance with 2 MB limit
export const uploadAbstract = multer({
    storage,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2 MB
    },
    fileFilter
});
