// -----------------------------------------------------------------------------
// MealPlannerPage.js
// -----------------------------------------------------------------------------

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

export default function MealPlannerPage({ openRecipePage }) {
  const { useState, useEffect } = React;

  const [mealPlan, setMealPlan] = useState({});
  const [savedRecipes, setSavedRecipes] = useState([]);

  useEffect(() => {
    loadMealPlan();
    loadSavedRecipes();
  }, []);

  function getEmptyPlan() {
    const empty = {};
    DAYS.forEach((day) => {
      empty[day] = [];
    });
    return empty;
  }

  function loadMealPlan() {
    const saved = localStorage.getItem("mealPlan");

    if (!saved) {
      setMealPlan(getEmptyPlan());
      return;
    }

    const parsed = JSON.parse(saved);
    const merged = getEmptyPlan();

    DAYS.forEach((day) => {
      merged[day] = parsed[day] || [];
    });

    setMealPlan(merged);
  }

  function loadSavedRecipes() {
    const saved = localStorage.getItem("savedRecipes");
    setSavedRecipes(saved ? JSON.parse(saved) : []);
  }

  function saveMealPlan(updatedPlan) {
    setMealPlan(updatedPlan);
    localStorage.setItem("mealPlan", JSON.stringify(updatedPlan));
  }

  function saveSavedRecipes(updatedSaved) {
    setSavedRecipes(updatedSaved);
    localStorage.setItem("savedRecipes", JSON.stringify(updatedSaved));
  }

  function removeRecipeFromDay(day, index) {
    const updatedPlan = {
      ...mealPlan,
      [day]: mealPlan[day].filter((_, i) => i !== index)
    };

    saveMealPlan(updatedPlan);
  }

  function removeSavedRecipe(index) {
    const updatedSaved = savedRecipes.filter((_, i) => i !== index);
    saveSavedRecipes(updatedSaved);
  }

  function clearDay(day) {
    if (!confirm(`Remove all recipes from ${day}?`)) return;

    const updatedPlan = {
      ...mealPlan,
      [day]: []
    };

    saveMealPlan(updatedPlan);
  }

  return React.createElement(
    "div",
    { style: { padding: "20px" } },
    [
      React.createElement("h1", { key: "title" }, "Meal Planner"),

      React.createElement(
        "p",
        {
          key: "note",
          style: {
            marginBottom: "20px",
            fontFamily: "monospace"
          }
        },
        "Add recipes to your planner or saved list from the recipe page."
      ),

      React.createElement(
        "div",
        {
          key: "grid",
          style: {
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "20px"
          }
        },
        DAYS.map((day) =>
          React.createElement(
            "div",
            {
              key: day,
              style: {
                border: "2px solid black",
                padding: "12px",
                minHeight: "170px"
              }
            },
            [
              React.createElement(
                "div",
                {
                  key: "header",
                  style: {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px"
                  }
                },
                [
                  React.createElement(
                    "h3",
                    {
                      key: "dayTitle",
                      style: { margin: 0 }
                    },
                    day
                  ),

                  (mealPlan[day] || []).length > 0 &&
                    React.createElement(
                      "button",
                      {
                        key: "clear",
                        className: "btn",
                        onClick: () => clearDay(day)
                      },
                      "clear"
                    )
                ]
              ),

              (mealPlan[day] || []).length === 0
                ? React.createElement(
                    "div",
                    {
                      key: "empty",
                      style: {
                        fontStyle: "italic",
                        color: "#555"
                      }
                    },
                    "No recipes planned."
                  )
                : (mealPlan[day] || []).map((recipe, index) =>
                    React.createElement(
                      "div",
                      {
                        key: `${day}-${recipe.id}-${index}`,
                        style: {
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          borderBottom: "1px solid #ccc",
                          padding: "6px 0",
                          gap: "10px"
                        }
                      },
                      [
                        React.createElement(
                          "span",
                          {
                            key: "name",
                            onClick: () => openRecipePage(recipe),
                            style: {
                              cursor: "pointer",
                              textDecoration: "underline"
                            }
                          },
                          recipe.name
                        ),

                        React.createElement(
                          "button",
                          {
                            key: "remove",
                            className: "btn",
                            onClick: () => removeRecipeFromDay(day, index)
                          },
                          "x"
                        )
                      ]
                    )
                  )
            ]
          )
        )
      ),

      React.createElement(
        "div",
        {
          key: "savedRecipes",
          style: {
            border: "2px solid black",
            padding: "20px",
            marginTop: "30px"
          }
        },
        [
          React.createElement("h2", { key: "savedTitle" }, "Saved Recipes"),

          savedRecipes.length === 0
            ? React.createElement(
                "div",
                {
                  key: "savedEmpty",
                  style: {
                    fontStyle: "italic",
                    color: "#555"
                  }
                },
                "No saved recipes yet."
              )
            : savedRecipes.map((recipe, index) =>
                React.createElement(
                  "div",
                  {
                    key: `saved-${recipe.id}-${index}`,
                    style: {
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "1px solid #ccc",
                      padding: "8px 0",
                      gap: "10px"
                    }
                  },
                  [
                    React.createElement(
                      "span",
                      {
                        key: "name",
                        onClick: () => openRecipePage(recipe),
                        style: {
                          cursor: "pointer",
                          textDecoration: "underline"
                        }
                      },
                      recipe.name
                    ),

                    React.createElement(
                      "button",
                      {
                        key: "remove",
                        className: "btn",
                        onClick: () => removeSavedRecipe(index)
                      },
                      "x"
                    )
                  ]
                )
              )
        ]
      )
    ]
  );
}