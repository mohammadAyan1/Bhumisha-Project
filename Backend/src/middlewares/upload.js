// server/middleware/upload.js (create this file)
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, "..", "public", "uploads")),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const base = path
      .basename(file.originalname || "file", ext)
      .replace(/\s+/g, "_");
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  cb(null, true); // accept every file
};

module.exports = require("multer")({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 },
});
