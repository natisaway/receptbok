const express = require("express");
const cors = require("cors");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

/* -------------------------------------------------------------------------- */
/* STATIC                                                                     */
/* -------------------------------------------------------------------------- */

app.use(
  "/system.css",
  express.static(path.join(__dirname, "../system.css-main/style.css"))
);
app.use(
  "/docs.css",
  express.static(path.join(__dirname, "../system.css-main/docs/docs.css"))
);
app.use(
  "/fonts",
  express.static(path.join(__dirname, "../system.css-main/fonts"))
);
app.use(
  "/icon",
  express.static(path.join(__dirname, "../system.css-main/icon"))
);

/* -------------------------------------------------------------------------- */
/* INGREDIENT HELPERS                                                         */
/* -------------------------------------------------------------------------- */

const volumeUnits = {
  tsp: 4.92892,
  tbsp: 14.7868,
  "fl oz": 29.5735,
  cup: 240,
  pt: 473.176,
  qt: 946.353,
  gal: 3785.41,
  ml: 1,
  l: 1000,
};

const massUnits = {
  g: 1,
  kg: 1000,
  oz: 28.3495,
  lb: 453.592,
};

const densities = {
  milk: 1.03,
  water: 1.0,
  sugar: 0.85,
  flour: 0.53,
};

function parseQuantity(q) {
  if (!q) return 0;
  q = q.toString().trim();
  if (/^\d+ \d+\/\d+$/.test(q)) {
    const [w, f] = q.split(" ");
    const [n, d] = f.split("/");
    return Number(w) + Number(n) / Number(d);
  }
  if (/^\d+\/\d+$/.test(q)) {
    const [n, d] = q.split("/");
    return Number(n) / Number(d);
  }
  return Number(q) || 0;
}

function normalizeName(name) {
  name = name.trim().toLowerCase();
  if (name.endsWith("s")) name = name.slice(0, -1);
  return name;
}

function mergeQuantities(q1, u1, q2, u2, name) {
  const v1 = parseQuantity(q1);
  const v2 = parseQuantity(q2);
  const nm = normalizeName(name);

  if (massUnits[u1] && massUnits[u2]) {
    const total = v1 * massUnits[u1] + v2 * massUnits[u2];
    return total >= 1000
      ? { qty: (total / 1000).toString(), unit: "kg" }
      : { qty: total.toString(), unit: "g" };
  }

  if (volumeUnits[u1] && volumeUnits[u2]) {
    const total = v1 * volumeUnits[u1] + v2 * volumeUnits[u2];
    return total >= 240
      ? { qty: (total / 240).toString(), unit: "cup" }
      : { qty: total.toString(), unit: "ml" };
  }

  if (
    (massUnits[u1] && volumeUnits[u2]) ||
    (massUnits[u2] && volumeUnits[u1])
  ) {
    const density = densities[nm];
    if (!density) return null;

    let grams = 0;
    grams += massUnits[u1]
      ? v1 * massUnits[u1]
      : v1 * volumeUnits[u1] * density;
    grams += massUnits[u2]
      ? v2 * massUnits[u2]
      : v2 * volumeUnits[u2] * density;

    return { qty: (grams / density / 240).toString(), unit: "cup" };
  }

  return null;
}

function parseInstructions(raw) {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {}

  return String(raw)
    .split(/\r?\n|\.\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/* -------------------------------------------------------------------------- */
/* DATABASE                                                                   */
/* -------------------------------------------------------------------------- */

const dbPath = path.join(__dirname, "13k-recipes.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      Title TEXT NOT NULL,
      Ingredients TEXT,
      Instructions TEXT
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

/* -------------------------------------------------------------------------- */
/* RECIPES                                                                    */
/* -------------------------------------------------------------------------- */

app.get("/api/recipes", (req, res) => {
  const q = (req.query.q || "").trim();

  let sql = `
    SELECT
      id,
      Title AS name,
      Ingredients AS ingredients,
      Instructions AS instructions
    FROM recipes
  `;
  let params = [];

  if (q) {
    sql += `
      WHERE LOWER(Title) LIKE LOWER(?)
         OR LOWER(Ingredients) LIKE LOWER(?)
    `;
    const like = `%${q}%`;
    params = [like, like];
  }

  sql += " ORDER BY id ASC";

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });

    const mapped = rows.map((r) => ({
      id: r.id,
      name: r.name,
      ingredients: r.ingredients || "",
      instructions: parseInstructions(r.instructions),
    }));

    res.json(mapped);
  });
});

app.post("/api/recipes", (req, res) => {
  const { name, ingredients, instructions } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Recipe name required" });
  }

  db.run(
    "INSERT INTO recipes (Title, Ingredients, Instructions) VALUES (?, ?, ?)",
    [
      name.trim(),
      ingredients || "",
      JSON.stringify(instructions || []),
    ],
    function (err) {
      if (err) return res.status(500).json({ message: "DB error" });
      res.json({
        id: this.lastID,
        name: name.trim(),
        ingredients: ingredients || "",
        instructions: instructions || [],
      });
    }
  );
});

app.put("/api/recipes/:id", (req, res) => {
  const { name, ingredients, instructions } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Recipe name required" });
  }

  db.run(
    "UPDATE recipes SET Title = ?, Ingredients = ?, Instructions = ? WHERE id = ?",
    [
      name.trim(),
      ingredients || "",
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

/* -------------------------------------------------------------------------- */
/* INGREDIENTS                                                                */
/* -------------------------------------------------------------------------- */

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

  db.get(
    "SELECT * FROM ingredients WHERE LOWER(name) = ? AND location = ?",
    [nm, location],
    (err, existing) => {
      if (err) return res.status(500).json({ message: "DB error" });

      if (!existing) {
        return db.run(
          "INSERT INTO ingredients (name, quantity, unit, location) VALUES (?, ?, ?, ?)",
          [nm, quantity, unit, location],
          function (err2) {
            if (err2) return res.status(500).json({ message: "DB error" });
            res.json({ id: this.lastID, name: nm, quantity, unit, location });
          }
        );
      }

      const merged = mergeQuantities(
        existing.quantity,
        existing.unit,
        quantity,
        unit,
        nm
      );

      if (!merged) {
        return res.json(existing);
      }

      db.run(
        "UPDATE ingredients SET quantity = ?, unit = ? WHERE id = ?",
        [merged.qty, merged.unit, existing.id],
        function () {
          res.json({
            id: existing.id,
            name: nm,
            quantity: merged.qty,
            unit: merged.unit,
            location,
          });
        }
      );
    }
  );
});

app.put("/api/ingredients/:id", (req, res) => {
  const { name, quantity, unit, location } = req.body;

  db.run(
    "UPDATE ingredients SET name = ?, quantity = ?, unit = ?, location = ? WHERE id = ?",
    [
      normalizeName(name),
      quantity || "",
      unit || "",
      location || "",
      req.params.id,
    ],
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

/* -------------------------------------------------------------------------- */
/* LOCATIONS + SHOPPING LIST                                                  */
/* -------------------------------------------------------------------------- */

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
    function () {
      res.json({ id: this.lastID, name: req.body.name.trim() });
    }
  );
});

app.delete("/api/ingredient-locations/:id", (req, res) => {
  db.run("DELETE FROM ingredientLocations WHERE id = ?", [req.params.id], () =>
    res.json({ success: true })
  );
});

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
    function () {
      res.json({ id: this.lastID, name: req.body.name.trim() });
    }
  );
});

app.delete("/api/shopping-list/:id", (req, res) => {
  db.run("DELETE FROM shoppingList WHERE id = ?", [req.params.id], () =>
    res.json({ success: true })
  );
});

/* -------------------------------------------------------------------------- */
/* FRONTEND                                                                   */
/* -------------------------------------------------------------------------- */

app.use(express.static(path.join(__dirname, "../frontend")));

app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "API route not found" });
  }
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

/* -------------------------------------------------------------------------- */
/* START                                                                      */
/* -------------------------------------------------------------------------- */

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});