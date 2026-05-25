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
  updateShoppingItem,
  deleteShoppingItem
} from "../api/shoppingList.js";

export default function IngredientsManagerPage() {
  const { useState, useEffect } = React;

  const [ingredients, setIngredients] = useState([]);
  const [locations, setLocations] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);

  const [openLocation, setOpenLocation] = useState(null);
  const [editingIngredient, setEditingIngredient] = useState(null);

  const [showBoughtModal, setShowBoughtModal] = useState(false);
  const [boughtItems, setBoughtItems] = useState([]);

  const [form, setForm] = useState({
    name: "",
    quantity: "",
    unit: "",
    customUnit: "",
    location: ""
  });

  const [newLocation, setNewLocation] = useState("");

  const [convertAmount, setConvertAmount] = useState("");
  const [convertFrom, setConvertFrom] = useState("ml");
  const [convertTo, setConvertTo] = useState("l");
  const [convertResult, setConvertResult] = useState("");

  const ALL_UNITS = [
    { value: "unit", label: "unit(s)" },
    { value: "piece", label: "piece(s)" },
    { value: "slice", label: "slice(s)" },
    { value: "stick", label: "stick(s)" },
    { value: "head", label: "head(s)" },
    { value: "bulb", label: "bulb(s)" },
    { value: "clove", label: "clove(s)" },
    { value: "bunch", label: "bunch(es)" },
    { value: "bag", label: "bag(s)" },
    { value: "box", label: "box(es)" },
    { value: "can", label: "can(s)" },
    { value: "jar", label: "jar(s)" },
    { value: "bottle", label: "bottle(s)" },
    { value: "carton", label: "carton(s)" },
    { value: "container", label: "container(s)" },
    { value: "packet", label: "packet(s)" },
    { value: "loaf", label: "loaf/loaves" },
    { value: "lb", label: "lb(s)" },
    { value: "oz", label: "oz" },
    { value: "g", label: "g" },
    { value: "kg", label: "kg" },
    { value: "tsp", label: "tsp" },
    { value: "tbsp", label: "tbsp" },
    { value: "fl oz", label: "fl oz" },
    { value: "cup", label: "cup(s)" },
    { value: "pt", label: "pint(s)" },
    { value: "qt", label: "quart(s)" },
    { value: "gal", label: "gallon(s)" },
    { value: "ml", label: "ml" },
    { value: "l", label: "liter(s)" },
    { value: "other", label: "other / custom" }
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

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setIngredients(await getIngredients());
    setLocations(await getIngredientLocations());
    setShoppingList(await getShoppingList());
  }

  const handleChange = (field) => (e) =>
    setForm({ ...form, [field]: e.target.value });

  function getFinalUnit() {
    if (form.unit === "other") {
      return form.customUnit.trim();
    }

    return form.unit.trim();
  }

  function resetForm() {
    setForm({
      name: "",
      quantity: "",
      unit: "",
      customUnit: "",
      location: ""
    });

    setEditingIngredient(null);
  }

  function isValidFraction(value) {
    const text = String(value || "").trim();

    if (!text) return false;
    if (!isNaN(Number(text))) return true;
    if (/^\d+\s*\/\s*\d+$/.test(text)) return true;
    if (/^\d+\s+\d+\s*\/\s*\d+$/.test(text)) return true;

    return false;
  }

  function parseQuantity(value) {
    const text = String(value || "").trim();

    if (!text) return 0;

    if (/^\d+\s+\d+\/\d+$/.test(text)) {
      const [whole, fraction] = text.split(" ");
      const [top, bottom] = fraction.split("/");
      return Number(whole) + Number(top) / Number(bottom);
    }

    if (/^\d+\/\d+$/.test(text)) {
      const [top, bottom] = text.split("/");
      return Number(top) / Number(bottom);
    }

    return Number(text) || 0;
  }

  async function handleSaveIngredient() {
    const finalUnit = getFinalUnit();

    const cleaned = {
      name: (form.name || "").trim(),
      quantity: (form.quantity || "").trim(),
      unit: finalUnit,
      location: (form.location || "").trim()
    };

    if (!cleaned.name) return alert("Ingredient name required");
    if (!cleaned.quantity) return alert("Quantity is required");
    if (!isValidFraction(cleaned.quantity)) {
      return alert("Quantity must be decimal or fraction");
    }
    if (!cleaned.unit) return alert("Select or type a unit");
    if (!cleaned.location) return alert("Select a location");

    if (editingIngredient) {
      await updateIngredient(editingIngredient.id, cleaned);
    } else {
      await createIngredient(cleaned);
    }

    resetForm();
    loadAll();
  }

  async function addToIngredient(ing) {
    const amount = prompt(
      `How much should be added to ${ing.name}?\nCurrent amount: ${ing.quantity || 0} ${ing.unit || ""}`
    );

    if (!amount) return;

    if (!isValidFraction(amount)) {
      alert("Add amount must be decimal or fraction.");
      return;
    }

    const updatedQuantity =
      parseQuantity(ing.quantity) + parseQuantity(amount);

    await updateIngredient(ing.id, {
      name: ing.name,
      quantity: String(updatedQuantity),
      unit: ing.unit,
      location: ing.location
    });

    loadAll();
  }

  async function subtractFromIngredient(ing) {
    const amount = prompt(
      `How much should be subtracted from ${ing.name}?\nCurrent amount: ${ing.quantity || 0} ${ing.unit || ""}`
    );

    if (!amount) return;

    if (!isValidFraction(amount)) {
      alert("Subtract amount must be decimal or fraction.");
      return;
    }

    const current = parseQuantity(ing.quantity);
    const subtract = parseQuantity(amount);
    const updatedQuantity = Math.max(current - subtract, 0);

    await updateIngredient(ing.id, {
      name: ing.name,
      quantity: String(updatedQuantity),
      unit: ing.unit,
      location: ing.location
    });

    loadAll();
  }

  async function handleDeleteIngredient(id, e) {
    e.stopPropagation();

    if (!confirm("Delete this ingredient?")) return;

    await deleteIngredient(id);

    if (editingIngredient?.id === id) {
      resetForm();
    }

    loadAll();
  }

  function startEditIngredient(ing) {
    const knownUnit = ALL_UNITS.some((unit) => unit.value === ing.unit);

    setEditingIngredient(ing);

    setForm({
      name: ing.name || "",
      quantity: ing.quantity || "",
      unit: knownUnit ? ing.unit : "other",
      customUnit: knownUnit ? "" : ing.unit || "",
      location: ing.location || ""
    });
  }

  async function handleAddLocation() {
    if (!newLocation.trim()) {
      return alert("Location name required");
    }

    await createIngredientLocation({ name: newLocation.trim() });

    setNewLocation("");
    loadAll();
  }

  async function handleDeleteLocation(id, e) {
    e.stopPropagation();

    if (!confirm("Delete this location?")) return;

    await deleteIngredientLocation(id);
    loadAll();
  }

  async function editShoppingItem(item) {
    const updatedName = prompt("Edit shopping list item:", item.name);

    if (!updatedName || !updatedName.trim()) return;

    await updateShoppingItem(item.id, updatedName.trim());
    loadAll();
  }

  function openItemsBoughtModal() {
    if (shoppingList.length === 0) {
      alert("Shopping list is empty.");
      return;
    }

    if (locations.length === 0) {
      alert("Please create a location first.");
      return;
    }

    setBoughtItems(
      shoppingList.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: "",
        unit: "",
        location: locations[0]?.name || ""
      }))
    );

    setShowBoughtModal(true);
  }

  function updateBoughtItem(id, field, value) {
    setBoughtItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  }

  async function confirmItemsBought() {
    for (const item of boughtItems) {
      if (!item.quantity || !isValidFraction(item.quantity)) {
        alert(`Enter a valid quantity for ${item.name}`);
        return;
      }

      if (!item.unit.trim()) {
        alert(`Enter a unit for ${item.name}`);
        return;
      }

      if (!item.location.trim()) {
        alert(`Choose a location for ${item.name}`);
        return;
      }
    }

    for (const item of boughtItems) {
      await createIngredient({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        location: item.location
      });

      await deleteShoppingItem(item.id);
    }

    setShowBoughtModal(false);
    setBoughtItems([]);
    loadAll();
  }

  async function handleCompleteShoppingItem(item) {
    if (locations.length === 0) {
      alert("Please create a location first.");
      return;
    }

    setBoughtItems([
      {
        id: item.id,
        name: item.name,
        quantity: "",
        unit: "",
        location: locations[0]?.name || ""
      }
    ]);

    setShowBoughtModal(true);
  }

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

  return React.createElement(
    "div",
    {
      style: {
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "30px"
      }
    },
    [
      React.createElement(
        "div",
        {
          key: "top",
          style: {
            display: "flex",
            gap: "40px",
            alignItems: "flex-start"
          }
        },
        [
          React.createElement(
            "div",
            {
              key: "leftPanel",
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
              React.createElement(
                "h2",
                { key: "addLocationTitle" },
                "add location"
              ),

              React.createElement("input", {
                key: "locationInput",
                placeholder: "location name",
                value: newLocation,
                onChange: (e) => setNewLocation(e.target.value)
              }),

              React.createElement(
                "button",
                {
                  key: "addLocationButton",
                  className: "btn",
                  onClick: handleAddLocation
                },
                "add location"
              ),

              React.createElement("hr", { key: "divider1" }),

              React.createElement(
                "h2",
                { key: "ingredientsTitle" },
                "ingredients"
              ),

              React.createElement("input", {
                key: "ingredientName",
                placeholder: "ingredient name",
                value: form.name,
                onChange: handleChange("name")
              }),

              React.createElement("input", {
                key: "ingredientQuantity",
                placeholder: "quantity (required)",
                value: form.quantity,
                onChange: handleChange("quantity")
              }),

              React.createElement(
                "select",
                {
                  key: "unitSelect",
                  value: form.unit,
                  onChange: (e) =>
                    setForm({
                      ...form,
                      unit: e.target.value,
                      customUnit:
                        e.target.value === "other" ? form.customUnit : ""
                    })
                },
                [
                  React.createElement(
                    "option",
                    { key: "unit-empty", value: "" },
                    "unit?"
                  ),

                  ...ALL_UNITS.map((unit) =>
                    React.createElement(
                      "option",
                      {
                        key: `unit-${unit.value}`,
                        value: unit.value
                      },
                      unit.label
                    )
                  )
                ]
              ),

              form.unit === "other" &&
                React.createElement("input", {
                  key: "customUnitInput",
                  placeholder: "type custom unit, ex: sleeve, bunches, pack",
                  value: form.customUnit,
                  onChange: handleChange("customUnit")
                }),

              React.createElement(
                "select",
                {
                  key: "locationSelect",
                  value: form.location,
                  onChange: handleChange("location")
                },
                [
                  React.createElement(
                    "option",
                    { key: "location-empty", value: "" },
                    "location?"
                  ),

                  ...locations.map((loc) =>
                    React.createElement(
                      "option",
                      {
                        key: `location-${loc.id}`,
                        value: loc.name
                      },
                      loc.name
                    )
                  )
                ]
              ),

              React.createElement(
                "button",
                {
                  key: "saveIngredientButton",
                  className: "btn",
                  onClick: handleSaveIngredient
                },
                editingIngredient ? "save changes" : "add ingredient"
              ),

              editingIngredient &&
                React.createElement(
                  "button",
                  {
                    key: "cancelEditButton",
                    className: "btn",
                    onClick: resetForm
                  },
                  "cancel edit"
                ),

              React.createElement("hr", { key: "divider2" }),

              React.createElement(
                "h2",
                { key: "convertTitle" },
                "convert units"
              ),

              React.createElement("input", {
                key: "convertAmount",
                placeholder: "amount",
                value: convertAmount,
                onChange: (e) => setConvertAmount(e.target.value)
              }),

              React.createElement(
                "select",
                {
                  key: "convertFrom",
                  value: convertFrom,
                  onChange: (e) => setConvertFrom(e.target.value)
                },
                Object.keys(CONVERSION_RATES).map((unit) =>
                  React.createElement(
                    "option",
                    {
                      key: `from-${unit}`,
                      value: unit
                    },
                    unit
                  )
                )
              ),

              React.createElement(
                "select",
                {
                  key: "convertTo",
                  value: convertTo,
                  onChange: (e) => setConvertTo(e.target.value)
                },
                Object.keys(CONVERSION_RATES).map((unit) =>
                  React.createElement(
                    "option",
                    {
                      key: `to-${unit}`,
                      value: unit
                    },
                    unit
                  )
                )
              ),

              React.createElement(
                "button",
                {
                  key: "convertButton",
                  className: "btn",
                  onClick: handleConvert
                },
                "convert"
              ),

              convertResult &&
                React.createElement(
                  "button",
                  {
                    key: "useConvertResult",
                    className: "btn",
                    onClick: () =>
                      setForm({
                        ...form,
                        quantity: convertResult,
                        unit: convertTo,
                        customUnit: ""
                      })
                  },
                  `use ${convertResult} ${convertTo}`
                )
            ]
          ),

          React.createElement(
            "div",
            {
              key: "rightPanel",
              style: {
                flexGrow: 1,
                border: "2px solid black",
                padding: "20px",
                overflow: "visible"
              }
            },
            [
              React.createElement(
                "h2",
                {
                  key: "locationsHeading",
                  style: {
                    textAlign: "center",
                    padding: "8px 0"
                  }
                },
                "locations"
              ),

              ...locations.map((loc) => {
                const isOpen = openLocation === loc.id;
                const items = ingredients.filter(
                  (ingredient) => ingredient.location === loc.name
                );

                return React.createElement(
                  "div",
                  {
                    key: `location-box-${loc.id}`,
                    onClick: () =>
                      setOpenLocation(isOpen ? null : loc.id),
                    style: {
                      border: "2px solid black",
                      padding: "12px",
                      marginBottom: "20px",
                      cursor: "pointer",
                      position: "relative",
                      overflow: "visible"
                    }
                  },
                  [
                    React.createElement(
                      "button",
                      {
                        key: "deleteLocation",
                        className: "btn",
                        style: {
                          position: "absolute",
                          top: "6px",
                          left: "6px"
                        },
                        onClick: (e) => handleDeleteLocation(loc.id, e)
                      },
                      "x"
                    ),

                    React.createElement(
                      "div",
                      {
                        key: "locationName",
                        style: {
                          fontWeight: "bold",
                          textAlign: "center"
                        }
                      },
                      loc.name
                    ),

                    isOpen &&
                      React.createElement(
                        "div",
                        {
                          key: "locationItems",
                          style: {
                            marginTop: "10px"
                          }
                        },
                        items.length === 0
                          ? React.createElement(
                              "div",
                              { key: "none" },
                              "no ingredients"
                            )
                          : items.map((ing) =>
                              React.createElement(
                                "div",
                                {
                                  key: `ingredient-${ing.id}`,
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
                                  React.createElement(
                                    "span",
                                    { key: "name" },
                                    ing.name
                                  ),

                                  React.createElement(
                                    "div",
                                    {
                                      key: "right",
                                      style: {
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px"
                                      }
                                    },
                                    [
                                      React.createElement(
                                        "span",
                                        { key: "amount" },
                                        `${ing.quantity || ""} ${
                                          ing.unit || ""
                                        }`.trim()
                                      ),

                                      React.createElement(
                                        "button",
                                        {
                                          key: "addIngredientAmount",
                                          className: "btn",
                                          onClick: (e) => {
                                            e.stopPropagation();
                                            addToIngredient(ing);
                                          }
                                        },
                                        "+"
                                      ),

                                      React.createElement(
                                        "button",
                                        {
                                          key: "subtractIngredient",
                                          className: "btn",
                                          onClick: (e) => {
                                            e.stopPropagation();
                                            subtractFromIngredient(ing);
                                          }
                                        },
                                        "-"
                                      ),

                                      React.createElement(
                                        "button",
                                        {
                                          key: "deleteIngredient",
                                          className: "btn",
                                          onClick: (e) =>
                                            handleDeleteIngredient(ing.id, e)
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
        ]
      ),

      React.createElement(
        "div",
        {
          key: "shoppingList",
          style: {
            border: "2px solid black",
            padding: "20px"
          }
        },
        [
          React.createElement(
            "h2",
            { key: "shoppingTitle" },
            "shopping list"
          ),

          React.createElement(
            "button",
            {
              key: "itemsBoughtButton",
              className: "btn btn-large",
              onClick: openItemsBoughtModal,
              style: {
                marginBottom: "15px"
              }
            },
            "items bought"
          ),

          shoppingList.length === 0
            ? React.createElement(
                "div",
                { key: "shoppingEmpty" },
                "shopping list empty"
              )
            : shoppingList.map((item) =>
                React.createElement(
                  "div",
                  {
                    key: `shopping-${item.id}`,
                    style: {
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "1px solid #ccc",
                      padding: "6px 0"
                    }
                  },
                  [
                    React.createElement(
                      "span",
                      {
                        key: "name",
                        onClick: () => editShoppingItem(item),
                        style: {
                          cursor: "pointer",
                          textDecoration: "underline"
                        }
                      },
                      item.name
                    ),

                    React.createElement(
                      "div",
                      {
                        key: "buttons",
                        style: {
                          display: "flex",
                          gap: "10px"
                        }
                      },
                      [
                        React.createElement(
                          "button",
                          {
                            key: "complete",
                            className: "btn",
                            onClick: () => handleCompleteShoppingItem(item)
                          },
                          "✓"
                        ),

                        React.createElement(
                          "button",
                          {
                            key: "edit",
                            className: "btn",
                            onClick: () => editShoppingItem(item)
                          },
                          "edit"
                        ),

                        React.createElement(
                          "button",
                          {
                            key: "delete",
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
      ),

      showBoughtModal &&
        React.createElement(
          "div",
          {
            key: "boughtModalOverlay",
            style: {
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.35)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 999
            }
          },
          React.createElement(
            "div",
            {
              key: "boughtModal",
              className: "window",
              style: {
                width: "750px",
                maxHeight: "80vh",
                overflowY: "auto",
                background: "white",
                border: "2px solid black",
                padding: "25px"
              }
            },
            [
              React.createElement(
                "h2",
                { key: "modalTitle" },
                "confirm bought items"
              ),

              ...boughtItems.map((item) =>
                React.createElement(
                  "div",
                  {
                    key: `bought-${item.id}`,
                    style: {
                      border: "1px solid black",
                      padding: "12px",
                      marginBottom: "12px",
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr 1fr 1fr",
                      gap: "10px",
                      alignItems: "center"
                    }
                  },
                  [
                    React.createElement(
                      "strong",
                      { key: "name" },
                      item.name
                    ),

                    React.createElement("input", {
                      key: "quantity",
                      placeholder: "quantity",
                      value: item.quantity,
                      onChange: (e) =>
                        updateBoughtItem(
                          item.id,
                          "quantity",
                          e.target.value
                        )
                    }),

                    React.createElement("input", {
                      key: "unit",
                      placeholder: "unit",
                      value: item.unit,
                      onChange: (e) =>
                        updateBoughtItem(item.id, "unit", e.target.value)
                    }),

                    React.createElement(
                      "select",
                      {
                        key: "location",
                        value: item.location,
                        onChange: (e) =>
                          updateBoughtItem(
                            item.id,
                            "location",
                            e.target.value
                          )
                      },
                      locations.map((loc) =>
                        React.createElement(
                          "option",
                          {
                            key: loc.id,
                            value: loc.name
                          },
                          loc.name
                        )
                      )
                    )
                  ]
                )
              ),

              React.createElement(
                "div",
                {
                  key: "modalButtons",
                  style: {
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "10px",
                    marginTop: "20px"
                  }
                },
                [
                  React.createElement(
                    "button",
                    {
                      key: "cancel",
                      className: "btn",
                      onClick: () => {
                        setShowBoughtModal(false);
                        setBoughtItems([]);
                      }
                    },
                    "cancel"
                  ),

                  React.createElement(
                    "button",
                    {
                      key: "confirm",
                      className: "btn btn-large",
                      onClick: confirmItemsBought
                    },
                    "confirm items bought"
                  )
                ]
              )
            ]
          )
        )
    ]
  );
}