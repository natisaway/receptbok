import { getIngredients } from "../api/ingredients.js";
import { addShoppingItem } from "../api/shoppingList.js";

const USE_RECIPE_URL = "http://127.0.0.1:5001/api/use-recipe";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

export default function RecipesPage(props) {
  const { useState, useEffect } = React;

  const [userIngredients, setUserIngredients] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  const [showPlannerModal, setShowPlannerModal] = useState(false);
  const [recipeToPlan, setRecipeToPlan] = useState(null);
  const [selectedDay, setSelectedDay] = useState("Monday");

  useEffect(() => {
    loadIngredients();
  }, []);

  useEffect(() => {
    if (props.recipeToOpen) {
      setSelectedRecipe(props.recipeToOpen);
      props.setRecipeToOpen(null);
    }
  }, [props.recipeToOpen]);

  function loadIngredients() {
    return getIngredients().then(setUserIngredients).catch(console.error);
  }

  const UNITS = [
    "cup", "cups", "tablespoon", "tablespoons", "tbsp", "tbsp.",
    "teaspoon", "teaspoons", "tsp", "tsp.",
    "pound", "pounds", "lb", "lbs", "lb.",
    "ounce", "ounces", "oz", "oz.",
    "gram", "grams", "g",
    "kilogram", "kilograms", "kg",
    "ml", "l",
    "can", "cans", "box", "boxes", "bag", "bags",
    "bottle", "bottles", "jar", "jars",
    "unit", "units", "head", "heads",
    "clove", "cloves", "bunch", "bunches",
    "slice", "slices", "stick", "sticks",
    "packet", "packets", "container", "containers",
    "gal", "gallon", "gallons",
    "qt", "quart", "quarts",
    "pt", "pint", "pints",
    "small", "medium", "large"
  ];

  const PREP_WORDS = [
    "peeled", "sliced", "chopped", "minced", "diced",
    "deveined", "fresh", "frozen", "optional",
    "cooked", "ground", "beaten", "crushed",
    "shredded", "grated", "packed", "divided",
    "softened", "melted", "thinly", "finely",
    "coarsely", "toasted", "cooled", "drained",
    "rinsed", "seeded", "cored", "cut",
    "room temperature", "freshly ground", "plus more"
  ];

  function cleanIngredientForShopping(item) {
    let cleaned = String(item || "")
      .replace(/['"\[\]]/g, "")
      .replace(/\([^)]*\)/g, "")
      .split(",")[0]
      .replace(/\s+/g, " ")
      .trim();

    PREP_WORDS.forEach((word) => {
      cleaned = cleaned.replace(new RegExp(`\\b${word}\\b`, "gi"), "");
    });

    return cleaned.replace(/\s+/g, " ").trim();
  }

  function normalizeIngredientName(item) {
    let cleaned = cleanIngredientForShopping(item).toLowerCase();

    cleaned = cleaned
      .replace(/[¼½¾⅓⅔⅛⅜⅝⅞]/g, "")
      .replace(/\d+\s+\d+\/\d+/g, "")
      .replace(/\d+\/\d+/g, "")
      .replace(/\d+(\.\d+)?/g, "");

    UNITS.forEach((unit) => {
      cleaned = cleaned.replace(new RegExp(`\\b${unit}\\b`, "gi"), "");
    });

    return cleaned
      .replace(/[^a-z\s-]/g, " ")
      .replace(/\bof\b/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/s$/, "");
  }

  function getRecipeIngredients(recipe) {
    if (!recipe) return [];

    if (Array.isArray(recipe.ingredients)) {
      return recipe.ingredients.map((item) => String(item).trim()).filter(Boolean);
    }

    const text = String(recipe.ingredients || "").trim();
    if (!text) return [];

    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {}

    if (text.startsWith("[") && text.endsWith("]")) {
      const matches = [...text.matchAll(/'([^']*)'|"([^"]*)"/g)];
      if (matches.length > 0) {
        return matches
          .map((match) => (match[1] || match[2] || "").trim())
          .filter(Boolean);
      }
    }

    return text
      .split(/\r?\n|;/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function compareIngredients(recipe) {
    const recipeIngredients = getRecipeIngredients(recipe);
    const have = [];
    const need = [];

    recipeIngredients.forEach((recipeIngredient) => {
      const normRecipeIngredient = normalizeIngredientName(recipeIngredient);

      const found = userIngredients.some((userIngredient) => {
        const normUserIngredient = normalizeIngredientName(userIngredient.name);

        if (!normRecipeIngredient || !normUserIngredient) return false;

        return (
          normRecipeIngredient === normUserIngredient ||
          normRecipeIngredient.includes(normUserIngredient) ||
          normUserIngredient.includes(normRecipeIngredient)
        );
      });

      found ? have.push(recipeIngredient) : need.push(recipeIngredient);
    });

    return { have, need };
  }

  function addToShopping(item) {
    const cleanedItem = cleanIngredientForShopping(item);

    addShoppingItem(cleanedItem).then(() => {
      alert(`Added "${cleanedItem}" to shopping list`);
    });
  }

  function saveRecipeForLater(recipe) {
    const saved = localStorage.getItem("savedRecipes");
    const savedRecipes = saved ? JSON.parse(saved) : [];

    const alreadySaved = savedRecipes.some(
      (item) => item.id === recipe.id && item.source === recipe.source
    );

    if (alreadySaved) {
      alert("This recipe is already saved.");
      return;
    }

    savedRecipes.push({
      id: recipe.id,
      name: recipe.name,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      source: recipe.source
    });

    localStorage.setItem("savedRecipes", JSON.stringify(savedRecipes));

    alert(`${recipe.name} saved for later.`);
  }

  function getEmptyMealPlan() {
    const empty = {};

    DAYS.forEach((day) => {
      empty[day] = [];
    });

    return empty;
  }

  function getMealPlan() {
    const saved = localStorage.getItem("mealPlan");

    if (!saved) return getEmptyMealPlan();

    const parsed = JSON.parse(saved);
    const merged = getEmptyMealPlan();

    DAYS.forEach((day) => {
      merged[day] = parsed[day] || [];
    });

    return merged;
  }

  function openPlannerModal(recipe) {
    setRecipeToPlan(recipe);
    setSelectedDay("Monday");
    setShowPlannerModal(true);
  }

  function confirmAddToPlanner() {
    if (!recipeToPlan) return;

    const plan = getMealPlan();

    plan[selectedDay].push({
      id: recipeToPlan.id,
      name: recipeToPlan.name,
      ingredients: recipeToPlan.ingredients,
      instructions: recipeToPlan.instructions,
      source: recipeToPlan.source
    });

    localStorage.setItem("mealPlan", JSON.stringify(plan));

    alert(`${recipeToPlan.name} added to ${selectedDay}.`);

    setShowPlannerModal(false);
    setRecipeToPlan(null);
  }

  async function handleRecipeUsed(recipe) {
    const comparison = compareIngredients(recipe);

    if (comparison.need.length > 0) {
      alert("You do not have all ingredients for this recipe.");
      return;
    }

    if (!confirm("Use this recipe and subtract ingredients from your kitchen?")) {
      return;
    }

    const res = await fetch(USE_RECIPE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ingredients: comparison.have }),
    });

    if (!res.ok) {
      alert("Could not update ingredients.");
      return;
    }

    await loadIngredients();
    alert("Recipe used. Kitchen inventory updated.");
  }

  function renderIngredientsPanel(recipe) {
    const { have, need } = compareIngredients(recipe);

    return React.createElement(
      "div",
      {
        key: "ingredientsPanel",
        style: {
          border: "2px solid black",
          padding: "25px",
          minHeight: "600px",
          background: "white",
          color: "black",
        },
      },
      [
        React.createElement("h2", { key: "title", style: { fontSize: "28px" } }, "ingredients"),

        React.createElement("h3", { key: "haveTitle", style: { marginTop: "20px" } }, "you have"),

        have.length === 0
          ? React.createElement("p", { key: "noHave" }, "None")
          : React.createElement(
              "ul",
              { key: "haveList" },
              have.map((item, index) =>
                React.createElement("li", { key: `have-${index}` }, `${item} ✓`)
              )
            ),

        React.createElement("h3", { key: "needTitle", style: { marginTop: "40px" } }, "ingredients needed"),

        need.length === 0
          ? React.createElement("p", { key: "noNeed" }, "You have everything")
          : React.createElement(
              "ul",
              { key: "needList" },
              need.map((item, index) =>
                React.createElement(
                  "li",
                  {
                    key: `need-${index}`,
                    style: {
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                      marginBottom: "6px",
                    },
                  },
                  [
                    React.createElement("span", { key: "text" }, cleanIngredientForShopping(item)),

                    React.createElement(
                      "button",
                      {
                        key: "btn",
                        className: "btn",
                        onClick: () => addToShopping(item),
                      },
                      "+"
                    ),
                  ]
                )
              )
            ),
      ]
    );
  }

  function renderRecipePanel(recipe) {
    const ingredients = getRecipeIngredients(recipe);

    const steps = Array.isArray(recipe.instructions)
      ? recipe.instructions
      : String(recipe.instructions || "")
          .split(/\r?\n/)
          .map((step) => step.trim())
          .filter(Boolean);

    const comparison = compareIngredients(recipe);
    const canUseRecipe = comparison.need.length === 0;

    return React.createElement(
      "div",
      {
        key: "recipePanel",
        style: {
          border: "2px solid black",
          padding: "25px",
          minHeight: "600px",
        },
      },
      [
        React.createElement("h1", { key: "name" }, recipe.name),

        React.createElement(
          "div",
          {
            key: "recipeActionButtons",
            style: {
              display: "flex",
              gap: "10px",
              marginBottom: "20px",
              flexWrap: "wrap"
            }
          },
          [
            React.createElement(
              "button",
              {
                key: "saveLater",
                className: "btn",
                onClick: () => saveRecipeForLater(recipe)
              },
              "save for later"
            ),

            React.createElement(
              "button",
              {
                key: "addPlanner",
                className: "btn",
                onClick: () => openPlannerModal(recipe)
              },
              "add to meal planner"
            )
          ]
        ),

        React.createElement("h2", { key: "ingTitle" }, "Ingredients:"),

        React.createElement(
          "ul",
          { key: "ingList" },
          ingredients.map((item, index) =>
            React.createElement("li", { key: `recipe-ing-${index}` }, item)
          )
        ),

        React.createElement("h2", { key: "instTitle" }, "Instructions:"),

        React.createElement(
          "ol",
          { key: "steps" },
          steps.map((step, index) =>
            React.createElement("li", { key: `step-${index}` }, step)
          )
        ),

        React.createElement(
          "button",
          {
            key: "usedBtn",
            className: "btn btn-large",
            disabled: !canUseRecipe,
            onClick: () => handleRecipeUsed(recipe),
            style: { marginTop: "20px" },
          },
          canUseRecipe ? "Recipe Was Used" : "Missing Ingredients"
        ),
      ]
    );
  }

  function renderContent() {
    if (!selectedRecipe) {
      return React.createElement(
        "div",
        {
          key: "empty",
          style: { padding: "40px" },
        },
        "Select a recipe from Home or Search."
      );
    }

    return React.createElement(
      "div",
      {
        key: "selectedRecipeLayout",
        style: {
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "30px",
        },
      },
      [
        renderIngredientsPanel(selectedRecipe),
        renderRecipePanel(selectedRecipe),
      ]
    );
  }

  return React.createElement(
    "div",
    {
      style: {
        width: "100%",
      },
    },
    [
      renderContent(),

      showPlannerModal &&
        React.createElement(
          "div",
          {
            key: "plannerModalOverlay",
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
              key: "plannerModal",
              className: "window",
              style: {
                width: "720px",
                background: "white",
                border: "2px solid black",
                padding: "30px"
              }
            },
            [
              React.createElement(
                "h1",
                {
                  key: "modalTitle",
                  style: {
                    marginTop: 0,
                    marginBottom: "30px"
                  }
                },
                "add to meal planner"
              ),

              React.createElement(
                "div",
                {
                  key: "modalBody",
                  style: {
                    border: "1px solid black",
                    padding: "20px",
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr",
                    gap: "20px",
                    alignItems: "center"
                  }
                },
                [
                  React.createElement(
                    "strong",
                    {
                      key: "recipeName",
                      style: {
                        fontSize: "22px",
                        lineHeight: "1.2"
                      }
                    },
                    recipeToPlan?.name || ""
                  ),

                  React.createElement(
                    "select",
                    {
                      key: "daySelect",
                      value: selectedDay,
                      onChange: (e) => setSelectedDay(e.target.value),
                      style: {
                        width: "100%"
                      }
                    },
                    DAYS.map((day) =>
                      React.createElement(
                        "option",
                        {
                          key: day,
                          value: day
                        },
                        day
                      )
                    )
                  )
                ]
              ),

              React.createElement(
                "div",
                {
                  key: "modalButtons",
                  style: {
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "12px",
                    marginTop: "25px"
                  }
                },
                [
                  React.createElement(
                    "button",
                    {
                      key: "cancel",
                      className: "btn",
                      onClick: () => {
                        setShowPlannerModal(false);
                        setRecipeToPlan(null);
                      }
                    },
                    "cancel"
                  ),

                  React.createElement(
                    "button",
                    {
                      key: "confirm",
                      className: "btn btn-large",
                      onClick: confirmAddToPlanner
                    },
                    "confirm meal plan"
                  )
                ]
              )
            ]
          )
        )
    ]
  );
}