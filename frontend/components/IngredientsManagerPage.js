// -----------------------------------------------------------------------------
// IngredientsManagerPage.js
// -----------------------------------------------------------------------------

import {
  getIngredients,
  createIngredient,
  deleteIngredient,
  updateIngredient
} from "../api/ingredients.js";

import {
  getIngredientLocations,
  createIngredientLocation,
  deleteIngredientLocation
} from "../api/ingredientLocations.js";

import {
  getShoppingList,
  deleteShoppingItem
} from "../api/shoppingList.js";

export default function IngredientsManagerPage() {
  const { useState, useEffect } = React;

  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------

  const [ingredients, setIngredients] = useState([]);
  const [locations, setLocations] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);

  const [openLocation, setOpenLocation] = useState(null);
  const [editingIngredient, setEditingIngredient] = useState(null);

  const [form, setForm] = useState({
    name: "",
    quantity: "",
    unit: "",
    location: ""
  });

  const [newLocation, setNewLocation] = useState("");

  // converter
  const [convertAmount, setConvertAmount] = useState("");
  const [convertFrom, setConvertFrom] = useState("ml");
  const [convertTo, setConvertTo] = useState("l");
  const [convertResult, setConvertResult] = useState("");

  // ---------------------------------------------------------------------------
  // CONSTANTS
  // ---------------------------------------------------------------------------

  const ALL_UNITS = [
    "tsp", "tbsp", "fl oz", "cup", "pt", "qt", "gal",
    "ml", "l",
    "oz", "lb",
    "g", "kg",
    "unit"
  ];

  const CONVERSION_RATES = {
    tsp: 4.92892,
    tbsp: 14.7868,
    "fl oz": 29.5735,
    cup: 240,
    pt: 473.176,
    qt: 946.353,
    gal: 3785.41,
    ml: 1,
    l: 1000
  };

  // ---------------------------------------------------------------------------
  // LOAD DATA
  // ---------------------------------------------------------------------------

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setIngredients(await getIngredients());
    setLocations(await getIngredientLocations());
    setShoppingList(await getShoppingList());
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  const handleChange = (field) => (e) =>
    setForm({ ...form, [field]: e.target.value });

  function resetForm() {
    setForm({ name: "", quantity: "", unit: "", location: "" });
    setEditingIngredient(null);
  }

  function isValidFraction(value) {
    if (!value.trim()) return false;
    if (!isNaN(Number(value))) return true;
    if (/^\d+\s*\/\s*\d+$/.test(value)) return true;
    if (/^\d+\s+\d+\s*\/\s*\d+$/.test(value)) return true;
    return false;
  }

  // ---------------------------------------------------------------------------
  // INGREDIENT CRUD
  // ---------------------------------------------------------------------------

  async function handleSaveIngredient() {
    const cleaned = {
      name: (form.name || "").trim(),
      quantity: (form.quantity || "").trim(),
      unit: (form.unit || "").trim(),
      location: (form.location || "").trim()
    };

    if (!cleaned.name) return alert("Ingredient name required");
    if (!cleaned.quantity) return alert("Quantity is required");
    if (!isValidFraction(cleaned.quantity))
      return alert("Quantity must be decimal or fraction");
    if (!cleaned.location) return alert("Select a location");

    if (editingIngredient) {
      await updateIngredient(editingIngredient.id, cleaned);
    } else {
      await createIngredient(cleaned);
    }

    resetForm();
    loadAll();
  }

  async function handleDeleteIngredient(id, e) {
    e.stopPropagation();
    if (!confirm("Delete this ingredient?")) return;
    await deleteIngredient(id);

    if (editingIngredient?.id === id) resetForm();

    loadAll();
  }

  function startEditIngredient(ing) {
    setEditingIngredient(ing);
    setForm({
      name: ing.name || "",
      quantity: ing.quantity || "",
      unit: ing.unit || "",
      location: ing.location || ""
    });
  }

  // ---------------------------------------------------------------------------
  // LOCATION CRUD 
  // ---------------------------------------------------------------------------

  async function handleAddLocation() {
    if (!newLocation.trim()) return alert("Location name required");
    await createIngredientLocation({ name: newLocation.trim() });
    setNewLocation("");
    loadAll();
  }

  async function handleDeleteLocation(id, e) {
    e.stopPropagation();
    if (!confirm("Delete this location?")) return;
    await deleteIngredientLocation(id);

    // If current ingredient form was pointing at this location name, clear selection
    // (we only have the id here, so just reload and leave form as-is)
    loadAll();
  }

  // ---------------------------------------------------------------------------
  // SHOPPING LIST TO INGREDIENT
  // ---------------------------------------------------------------------------

  async function handleCompleteShoppingItem(item) {
    if (locations.length === 0) {
      alert("Please create a location first.");
      return;
    }

    const location = prompt(
      "Where should this ingredient be stored?\n\n" +
        locations.map((l) => `• ${l.name}`).join("\n")
    );

    if (!location) return;

    await createIngredient({
      name: item.name,
      quantity: "",  
      unit: "",
      location
    });

    await deleteShoppingItem(item.id);
    loadAll();
  }

  // ---------------------------------------------------------------------------
  // CONVERSION
  // ---------------------------------------------------------------------------

  function handleConvert() {
    if (!convertAmount) return;
    if (!CONVERSION_RATES[convertFrom] || !CONVERSION_RATES[convertTo]) {
      alert("Conversion only works for volume units.");
      return;
    }

    const result =
      (Number(convertAmount) * CONVERSION_RATES[convertFrom]) /
      CONVERSION_RATES[convertTo];

    setConvertResult(result.toFixed(2));
  }

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return React.createElement(
    "div",
    { style: { padding: "20px", display: "flex", flexDirection: "column", gap: "30px" } },

    // ================= TOP =================
    React.createElement(
      "div",
      { style: { display: "flex", gap: "40px" } },

      // ================= LEFT PANEL =================
      React.createElement(
        "div",
        {
          style: {
            width: "280px",
            border: "2px solid black",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }
        },
        [
          React.createElement("h2", {}, "add location"),

          React.createElement("input", {
            placeholder: "location name",
            value: newLocation,
            onChange: (e) => setNewLocation(e.target.value)
          }),

          React.createElement(
            "button",
            { className: "btn", onClick: handleAddLocation },
            "add location"
          ),

          React.createElement("hr"),

          React.createElement("h2", {}, "ingredients"),

          React.createElement("input", {
            placeholder: "ingredient name",
            value: form.name,
            onChange: handleChange("name")
          }),

          React.createElement("input", {
            placeholder: "quantity (required)",
            value: form.quantity,
            onChange: handleChange("quantity")
          }),

          React.createElement(
            "select",
            { value: form.unit, onChange: handleChange("unit") },
            [
              React.createElement("option", { value: "" }, "unit?"),
              ...ALL_UNITS.map((u) =>
              React.createElement("option", { key: "loc-empty", value: "" }, "location?")
            )
            ]
          ),

          React.createElement(
            "select",
            { value: form.location, onChange: handleChange("location") },
            [
              React.createElement("option", { value: "" }, "location?"),
              ...locations.map((loc) =>
                React.createElement("option", { key: loc.id, value: loc.name }, loc.name)
              )
            ]
          ),

          React.createElement(
            "button",
            { className: "btn", onClick: handleSaveIngredient },
            editingIngredient ? "save changes" : "add ingredient"
          ),

          editingIngredient &&
            React.createElement(
              "button",
              {
                className: "btn",
                onClick: resetForm
              },
              "cancel edit"
            ),

          React.createElement("hr"),

          React.createElement("h2", {}, "convert units"),

          React.createElement("input", {
            placeholder: "amount",
            value: convertAmount,
            onChange: (e) => setConvertAmount(e.target.value)
          }),

          React.createElement(
            "select",
            { value: convertFrom, onChange: (e) => setConvertFrom(e.target.value) },
            Object.keys(CONVERSION_RATES).map((u) =>
              React.createElement("option", { key: u, value: u }, u)
            )
          ),

          React.createElement(
            "select",
            { value: convertTo, onChange: (e) => setConvertTo(e.target.value) },
            Object.keys(CONVERSION_RATES).map((u) =>
              React.createElement("option", { key: u, value: u }, u)
            )
          ),

          React.createElement(
            "button",
            { className: "btn", onClick: handleConvert },
            "convert"
          ),

          convertResult &&
            React.createElement(
              "button",
              {
                className: "btn",
                onClick: () =>
                  setForm({ ...form, quantity: convertResult, unit: convertTo })
              },
              `use ${convertResult} ${convertTo}`
            )
        ]
      ),

      // ================= RIGHT PANEL =================
      React.createElement(
        "div",
        { style: { flexGrow: 1, border: "2px solid black", padding: "20px" } },
        [
          React.createElement("h2", { style: { textAlign: "center" } }, "locations"),

          locations.map((loc) => {
            const isOpen = openLocation === loc.id;

            const items = ingredients.filter((i) => i.location === loc.name);

            return React.createElement(
              "div",
              {
                key: loc.id,
                onClick: () => setOpenLocation(isOpen ? null : loc.id),
                style: {
                  border: "2px solid black",
                  padding: "12px",
                  marginBottom: "20px",
                  cursor: "pointer",
                  position: "relative"
                }
              },
              [
                React.createElement(
                  "button",
                  {
                    className: "btn",
                    style: { position: "absolute", top: "6px", left: "6px" },
                    onClick: (e) => handleDeleteLocation(loc.id, e)
                  },
                  "x"
                ),

                React.createElement(
                  "div",
                  { style: { fontWeight: "bold", textAlign: "center" } },
                  loc.name
                ),

                isOpen &&
                  React.createElement(
                    "div",
                    { style: { marginTop: "10px" } },
                    items.length === 0
                      ? React.createElement("div", { key: "none" }, "no ingredients")
                      : items.map((ing) =>
                          React.createElement(
                            "div",
                            {
                              key: ing.id,
                              onClick: (e) => {
                                e.stopPropagation();
                                startEditIngredient(ing);
                              },
                              style: {
                                display: "flex",
                                justifyContent: "space-between",
                                borderBottom: "1px solid #ccc",
                                padding: "6px 0",
                                alignItems: "center"
                              }
                            },
                            [
                             
                              React.createElement("span", { key: "n" }, ing.name),

                              
                              React.createElement(
                                "div",
                                {
                                  key: "right",
                                  style: { display: "flex", alignItems: "center", gap: "10px" }
                                },
                                [
                                  React.createElement(
                                    "span",
                                    { key: "m" },
                                    `${ing.quantity || ""} ${ing.unit || ""}`.trim()
                                  ),
                                  React.createElement(
                                    "button",
                                    {
                                      key: "del",
                                      className: "btn",
                                      onClick: (e) => handleDeleteIngredient(ing.id, e)
                                    },
                                    "x"
                                  )
                                ]
                              )
                            ]
                          )
                        )
                  )
              ]
            );
          })
        ]
      )
    ),

    // ================= SHOPPING LIST =================
    React.createElement(
      "div",
      { style: { border: "2px solid black", padding: "20px" } },
      [
        React.createElement("h2", {}, "shopping list"),

        shoppingList.length === 0
          ? "shopping list empty"
          : shoppingList.map((item) =>
              React.createElement(
                "div",
                {
                  key: item.id,
                  style: {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid #ccc",
                    padding: "6px 0"
                  }
                },
                [
                  item.name,

                  React.createElement(
                    "div",
                    { style: { display: "flex", gap: "10px" } },
                    [
                      React.createElement(
                        "button",
                        {
                          className: "btn",
                          onClick: () => handleCompleteShoppingItem(item)
                        },
                        "✓"
                      ),

                      React.createElement(
                        "button",
                        {
                          className: "btn",
                          onClick: () => {
                            if (confirm("Delete this item?")) {
                              deleteShoppingItem(item.id).then(loadAll);
                            }
                          }
                        },
                        "x"
                      )
                    ]
                  )
                ]
              )
            )
      ]
    )
  );
}
