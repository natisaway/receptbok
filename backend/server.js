const express = require("express");
const cors = require("cors");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

const appDbPath = path.join(__dirname, "receptbok.db");
const recipesDbPath = path.join(__dirname, "13k-recipes.db");

const db = new sqlite3.Database(appDbPath);
const recipesDb = new sqlite3.Database(recipesDbPath);

function parseInstructions(raw) {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {}

  return String(raw)
    .split(/\r?\n|\.\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseIngredients(raw) {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw.map((i) => String(i).trim()).filter(Boolean);
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((i) => String(i).trim()).filter(Boolean);
    }
  } catch {}

  const text = String(raw).trim();

  if (text.startsWith("[") && text.endsWith("]")) {
    const matches = [...text.matchAll(/'([^']*)'|"([^"]*)"/g)];

    if (matches.length > 0) {
      return matches
        .map((m) => (m[1] || m[2] || "").trim())
        .filter(Boolean);
    }
  }

  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizeName(name) {
  let cleaned = String(name || "")
    .toLowerCase()
    .replace(/['"\[\]]/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\b\d+([\/.]\d+)?\b/g, "")
    .replace(/\b(cup|cups|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|lb|lbs|pound|pounds|oz|ounce|ounces|g|kg|ml|l|can|cans|clove|cloves|head|heads|bag|bags|box|boxes|bottle|bottles|container|containers|unit|units)\b/g, "")
    .replace(/\b(chopped|minced|diced|sliced|peeled|seeded|fresh|ground|large|small|medium|finely|coarsely|optional|plus|more|for|garnish|beaten)\b/g, "")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.endsWith("s")) cleaned = cleaned.slice(0, -1);

  return cleaned;
}

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      ingredients TEXT,
      instructions TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ingredientLocations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      quantity TEXT,
      unit TEXT,
      location TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS shoppingList (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    )
  `);
});

/* RECIPES */

app.get("/api/recipes", (req, res) => {
  const q = (req.query.q || "").trim().toLowerCase();

  const userSql = `
    SELECT id, name, ingredients, instructions, 'user' AS source
    FROM recipes
  `;

  const databaseSql = `
    SELECT
      id,
      Title AS name,
      Ingredients AS ingredients,
      Instructions AS instructions,
      'database' AS source
    FROM recipes
  `;

  db.all(userSql, [], (userErr, userRows) => {
    if (userErr) {
      return res.status(500).json({ error: "Failed to load user recipes" });
    }

    recipesDb.all(databaseSql, [], (dbErr, databaseRows) => {
      if (dbErr) {
        return res.status(500).json({ error: "Failed to load database recipes" });
      }

      const allRecipes = [...userRows, ...databaseRows].map((recipe) => ({
        id: recipe.id,
        name: recipe.name,
        ingredients: parseIngredients(recipe.ingredients),
        instructions: parseInstructions(recipe.instructions),
        source: recipe.source,
      }));

      const terms = q
        .split(",")
        .map((term) => term.trim())
        .filter(Boolean);

      const filtered =
        terms.length > 0
          ? allRecipes.filter((recipe) => {
              const text = `${recipe.name} ${recipe.ingredients.join(" ")}`.toLowerCase();
              return terms.every((term) => text.includes(term));
            })
          : allRecipes;

      res.json(filtered);
    });
  });
});

app.post("/api/recipes", (req, res) => {
  const { name, ingredients, instructions } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Recipe name required" });
  }

  const cleanedIngredients = Array.isArray(ingredients)
    ? ingredients
    : String(ingredients || "")
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean);

  db.run(
    "INSERT INTO recipes (name, ingredients, instructions) VALUES (?, ?, ?)",
    [name.trim(), JSON.stringify(cleanedIngredients), JSON.stringify(instructions || [])],
    function (err) {
      if (err) return res.status(500).json({ message: "DB error" });

      res.json({
        id: this.lastID,
        name: name.trim(),
        ingredients: cleanedIngredients,
        instructions: instructions || [],
        source: "user",
      });
    }
  );
});

app.put("/api/recipes/:id", (req, res) => {
  const { name, ingredients, instructions } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Recipe name required" });
  }

  const cleanedIngredients = Array.isArray(ingredients)
    ? ingredients
    : String(ingredients || "")
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean);

  db.run(
    "UPDATE recipes SET name = ?, ingredients = ?, instructions = ? WHERE id = ?",
    [
      name.trim(),
      JSON.stringify(cleanedIngredients),
      JSON.stringify(instructions || []),
      req.params.id,
    ],
    function (err) {
      if (err) return res.status(500).json({ message: "DB error" });
      res.json({ success: true });
    }
  );
});

app.delete("/api/recipes/:id", (req, res) => {
  db.run("DELETE FROM recipes WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: "DB error" });
    res.json({ success: true });
  });
});

/* INGREDIENTS */

app.get("/api/ingredients", (req, res) => {
  db.all("SELECT * FROM ingredients ORDER BY id ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });
    res.json(rows);
  });
});

app.post("/api/ingredients", (req, res) => {
  let { name, quantity, unit, location } = req.body;

  const nm = normalizeName(name);
  quantity ||= "";
  unit ||= "";
  location ||= "";

  db.run(
    "INSERT INTO ingredients (name, quantity, unit, location) VALUES (?, ?, ?, ?)",
    [nm, quantity, unit, location],
    function (err) {
      if (err) return res.status(500).json({ message: "DB error" });
      res.json({ id: this.lastID, name: nm, quantity, unit, location });
    }
  );
});

app.put("/api/ingredients/:id", (req, res) => {
  const { name, quantity, unit, location } = req.body;

  db.run(
    "UPDATE ingredients SET name = ?, quantity = ?, unit = ?, location = ? WHERE id = ?",
    [normalizeName(name), quantity || "", unit || "", location || "", req.params.id],
    function (err) {
      if (err) return res.status(500).json({ message: "DB error" });
      res.json({ success: true });
    }
  );
});

app.delete("/api/ingredients/:id", (req, res) => {
  db.run("DELETE FROM ingredients WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: "DB error" });
    res.json({ success: true });
  });
});

/* USE RECIPE */

app.post("/api/use-recipe", (req, res) => {
  const { ingredients } = req.body;

  if (!Array.isArray(ingredients)) {
    return res.status(400).json({ error: "Ingredients must be an array" });
  }

  db.all("SELECT * FROM ingredients", [], (err, pantryItems) => {
    if (err) return res.status(500).json({ message: "DB error" });

    const updates = ingredients.map((recipeIngredient) => {
      return new Promise((resolve) => {
        const normalizedRecipeIngredient = normalizeName(recipeIngredient);

        const matchedItem = pantryItems.find((item) => {
          const normalizedPantryItem = normalizeName(item.name);

          return (
            normalizedRecipeIngredient.includes(normalizedPantryItem) ||
            normalizedPantryItem.includes(normalizedRecipeIngredient)
          );
        });

        if (!matchedItem) return resolve();

        const currentQty = Number(matchedItem.quantity) || 0;
        const newQty = Math.max(currentQty - 1, 0);

        if (newQty === 0) {
          db.run("DELETE FROM ingredients WHERE id = ?", [matchedItem.id], () => resolve());
        } else {
          db.run(
            "UPDATE ingredients SET quantity = ? WHERE id = ?",
            [String(newQty), matchedItem.id],
            () => resolve()
          );
        }
      });
    });

    Promise.all(updates).then(() => {
      res.json({ success: true });
    });
  });
});

/* LOCATIONS */

app.get("/api/ingredient-locations", (req, res) => {
  db.all("SELECT * FROM ingredientLocations ORDER BY id ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });
    res.json(rows);
  });
});

app.post("/api/ingredient-locations", (req, res) => {
  db.run(
    "INSERT INTO ingredientLocations (name) VALUES (?)",
    [req.body.name.trim()],
    function (err) {
      if (err) return res.status(500).json({ message: "DB error" });
      res.json({ id: this.lastID, name: req.body.name.trim() });
    }
  );
});

app.delete("/api/ingredient-locations/:id", (req, res) => {
  db.run("DELETE FROM ingredientLocations WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: "DB error" });
    res.json({ success: true });
  });
});

/* SHOPPING LIST */

app.get("/api/shopping-list", (req, res) => {
  db.all("SELECT * FROM shoppingList ORDER BY id ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });
    res.json(rows);
  });
});

app.post("/api/shopping-list", (req, res) => {
  db.run(
    "INSERT INTO shoppingList (name) VALUES (?)",
    [req.body.name.trim()],
    function (err) {
      if (err) return res.status(500).json({ message: "DB error" });
      res.json({ id: this.lastID, name: req.body.name.trim() });
    }
  );
});

app.put("/api/shopping-list/:id", (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Shopping item name required" });
  }

  db.run(
    "UPDATE shoppingList SET name = ? WHERE id = ?",
    [name.trim(), req.params.id],
    function (err) {
      if (err) return res.status(500).json({ message: "DB error" });
      res.json({ success: true });
    }
  );
});

app.delete("/api/shopping-list/:id", (req, res) => {
  db.run("DELETE FROM shoppingList WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: "DB error" });
    res.json({ success: true });
  });
});

/* FRONTEND */

app.use(express.static(path.join(__dirname, "../frontend")));

app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "API route not found" });
  }

  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});