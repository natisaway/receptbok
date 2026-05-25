const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const Recipe = require("../db/models/Recipe");

// helper
function mapRecipe(recipe) {
  return {
    id: recipe.id,
    name: recipe.name,
    ingredients: Array.isArray(recipe.ingredients)
      ? recipe.ingredients.join(", ")
      : (() => {
          try {
            const parsed = JSON.parse(recipe.ingredients);
            return Array.isArray(parsed) ? parsed.join(", ") : recipe.ingredients || "";
          } catch {
            return recipe.ingredients || "";
          }
        })(),
    instructions: (() => {
      try {
        return Array.isArray(recipe.instructions)
          ? recipe.instructions
          : JSON.parse(recipe.instructions);
      } catch {
        return [];
      }
    })(),
    source: recipe.source || "user"
  };
}

// GET all recipes OR search recipes
router.get("/", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();

    const where = q
      ? {
          [Op.or]: [
            { name: { [Op.like]: `%${q}%` } },
            { ingredients: { [Op.like]: `%${q}%` } }
          ]
        }
      : {};

    const list = await Recipe.findAll({
      where,
      order: [["id", "ASC"]]
    });

    res.json(list.map(mapRecipe));
  } catch (err) {
    res.status(500).json({ error: "Failed to load recipes" });
  }
});

// CREATE recipe
router.post("/", async (req, res) => {
  try {
    const { name, ingredients, instructions, source } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: "Recipe name required" });
    }

    if (!Array.isArray(instructions) || instructions.length === 0) {
      return res.status(400).json({ error: "At least one instruction required" });
    }

    const recipe = await Recipe.create({
      name: name.trim(),
      ingredients: JSON.stringify(
        Array.isArray(ingredients)
          ? ingredients
          : String(ingredients || "")
              .split(",")
              .map(i => i.trim())
              .filter(Boolean)
      ),
      instructions: JSON.stringify(instructions),
      source: source || "user"
    });

    res.status(201).json(mapRecipe(recipe));
  } catch (err) {
    res.status(400).json({ error: "Could not create recipe" });
  }
});

// DELETE recipe
router.delete("/:id", async (req, res) => {
  try {
    const item = await Recipe.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: "Recipe not found" });

    await item.destroy();
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete recipe" });
  }
});

module.exports = router;