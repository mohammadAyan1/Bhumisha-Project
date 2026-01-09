const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/employeesController");
const multer = require("multer");
const path = require("path");
// Storage configuration for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "src/uploads/");
  },
  filename: (req, file, cb) => {
    

    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext); // unique filename
  },
});

// File filter optional
const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

router.post("/create", upload.single("photo"), ctrl.createEmployee);
router.put("/edit:id", upload.single("photo"), ctrl.editEmployee);
router.delete("/delete/:id", ctrl.deleteEmployee);
router.get("/all", ctrl.getAllEmployees);
router.get("/:id", ctrl.getEmployee);

module.exports = router;
