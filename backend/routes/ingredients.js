// routes/ingredients.js
const express = require("express");
const router = express.Router();
const Ingredient = require("../db/models/Ingredient");

// GET all ingredients
router.get("/", async (req, res) => {
  try {
    const list = await Ingredient.findAll({
      order: [["id", "ASC"]]
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Failed to load ingredients" });
  }
});

// GET one ingredient
router.get("/:id", async (req, res) => {
  try {
    const item = await Ingredient.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: "Ingredient not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch ingredient" });
  }
});

// CREATE ingredient
router.post("/", async (req, res) => {
  try {
    const { name, quantity, unit, location, expiresOn } = req.body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return res
        .status(400)
        .json({ error: "Name must be at least 2 characters" });
    }

    const sanitized = {
      name: name.trim(),
      quantity: quantity ?? null,
      unit: unit?.trim() || null,
      location: location?.trim() || null,
      expiresOn: expiresOn || null
    };

    if (sanitized.quantity !== null && sanitized.quantity < 0) {
      return res.status(400).json({ error: "Quantity must be positive" });
    }

    const item = await Ingredient.create(sanitized);
    res.status(201).json(item);

  } catch (err) {
    res.status(400).json({ error: "Invalid ingredient data" });
  }
});

// UPDATE ingredient
router.put("/:id", async (req, res) => {
  try {
    const item = await Ingredient.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ error: "Ingredient not found" });
    }

    const { name, quantity, unit, location, expiresOn } = req.body;

    if (name && (typeof name !== "string" || name.trim().length < 2)) {
      return res
        .status(400)
        .json({ error: "Name must be at least 2 characters" });
    }

    if (quantity !== undefined && quantity < 0) {
      return res.status(400).json({ error: "Quantity must be positive" });
    }

    const sanitized = {
      name: name?.trim(),
      quantity,
      unit: unit?.trim(),
      location: location?.trim(),
      expiresOn
    };

    await item.update(sanitized);
    res.json(item);

  } catch (err) {
    res.status(400).json({ error: "Failed to update ingredient" });
  }
});

// DELETE ingredient
router.delete("/:id", async (req, res) => {
  try {
    const item = await Ingredient.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: "Ingredient not found" });

    await item.destroy();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete ingredient" });
  }
});

module.exports = router;
