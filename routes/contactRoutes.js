const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contactController");

router.post("/addtolist", contactController.addToList);
router.post("/contactus", contactController.contactUs);

module.exports = router;
