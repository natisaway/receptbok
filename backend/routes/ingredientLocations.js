// backend/routes/ingredientLocations.js
const express = require("express");
const router = express.Router();
const Location = require("../db/models/Location");

// GET all locations
router.get("/", async (req, res) => {
  try {
    const locations = await Location.findAll({
      order: [["name", "ASC"]]   
    });
    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: "Failed to load locations" });
  }
});

// CREATE location
router.post("/", async (req, res) => {
  try {
    let { name } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Invalid or missing location name" });
    }

    name = name.trim().toLowerCase();

    if (name.length < 2 || name.length > 50) {
      return res
        .status(400)
        .json({ error: "Location name must be between 2 and 50 characters" });
    }

    // prevent duplicates
    const existing = await Location.findOne({ where: { name } });
    if (existing) {
      return res.status(400).json({ error: "Location already exists" });
    }

    const loc = await Location.create({ name });
    res.json(loc);

  } catch (err) {
    res.status(500).json({ error: "Failed to create location" });
  }
});

// DELETE location
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Location.destroy({ where: { id } });

    if (!deleted) {
      return res.status(404).json({ error: "Location not found" });
    }

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: "Failed to delete location" });
  }
});

module.exports = router;
