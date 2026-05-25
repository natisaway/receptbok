// -----------------------------------------------------------------------------
// SearchPage.js
// -----------------------------------------------------------------------------

const RECIPES_URL = "http://127.0.0.1:5001/api/recipes";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

export default function SearchPage(props) {
  const { useState } = React;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);

  const [showPlannerModal, setShowPlannerModal] = useState(false);
  const [recipeToPlan, setRecipeToPlan] = useState(null);
  const [selectedDay, setSelectedDay] = useState("Monday");

  function getEmptyMealPlan() {
    const empty = {};
    DAYS.forEach((day) => {
      empty[day] = [];
    });
    return empty;
  }

  function getMealPlan() {
    const saved = localStorage.getItem("mealPlan");

    if (!saved) {
      return getEmptyMealPlan();
    }

    const parsed = JSON.parse(saved);
    const merged = getEmptyMealPlan();

    DAYS.forEach((day) => {
      merged[day] = parsed[day] || [];
    });

    return merged;
  }

  function saveMealPlan(plan) {
    localStorage.setItem("mealPlan", JSON.stringify(plan));
  }

  async function searchRecipes() {
    const url =
      query.trim().length > 0
        ? `${RECIPES_URL}?q=${encodeURIComponent(query.trim())}`
        : RECIPES_URL;

    const res = await fetch(url);

    if (!res.ok) {
      alert("Failed to search recipes.");
      return;
    }

    const data = await res.json();
    setResults(data);
    setSearched(true);
  }

  function openRecipe(recipe) {
    if (props.openRecipePage) {
      props.openRecipePage(recipe);
      return;
    }

    props.setPage("recipes");
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

    saveMealPlan(plan);

    setShowPlannerModal(false);
    setRecipeToPlan(null);

    alert(`${recipeToPlan.name} added to ${selectedDay}.`);
  }

  return React.createElement(
    "div",
    { style: { padding: "20px" } },
    [
      React.createElement("h1", { key: "title" }, "Search Recipes"),

      React.createElement(
        "div",
        {
          key: "searchRow",
          style: {
            display: "flex",
            gap: "10px",
            marginBottom: "20px"
          }
        },
        [
          React.createElement("input", {
            key: "searchInput",
            placeholder: "Search recipes, ex: chicken, pasta, broccoli",
            value: query,
            onChange: (e) => setQuery(e.target.value),
            onKeyDown: (e) => {
              if (e.key === "Enter") searchRecipes();
            },
            style: {
              flex: 1,
              padding: "8px"
            }
          }),

          React.createElement(
            "button",
            {
              key: "searchButton",
              className: "btn btn-large",
              onClick: searchRecipes
            },
            "Search"
          )
        ]
      ),

      !searched &&
        React.createElement(
          "p",
          {
            key: "helperText",
            style: { fontFamily: "monospace" }
          },
          "Search for recipes, then add them to your meal planner."
        ),

      searched &&
        results.length === 0 &&
        React.createElement(
          "p",
          { key: "noResults" },
          "No recipes found."
        ),

      React.createElement(
        "div",
        {
          key: "results",
          style: {
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "20px"
          }
        },
        results.map((recipe) =>
          React.createElement(
            "div",
            {
              key: `${recipe.source || "recipe"}-${recipe.id}`,
              className: "window",
              style: {
                border: "2px solid black",
                padding: "15px"
              }
            },
            [
              React.createElement(
                "h3",
                {
                  key: "name",
                  style: { marginTop: 0 }
                },
                recipe.name
              ),

              React.createElement(
                "div",
                {
                  key: "source",
                  style: {
                    fontSize: "13px",
                    marginBottom: "10px",
                    fontFamily: "monospace"
                  }
                },
                recipe.source ? `source: ${recipe.source}` : ""
              ),

              React.createElement(
                "div",
                {
                  key: "buttons",
                  style: {
                    display: "flex",
                    gap: "10px",
                    marginTop: "10px"
                  }
                },
                [
                  React.createElement(
                    "button",
                    {
                      key: "open",
                      className: "btn",
                      onClick: () => openRecipe(recipe)
                    },
                    "open"
                  ),

                  React.createElement(
                    "button",
                    {
                      key: "planner",
                      className: "btn",
                      onClick: () => openPlannerModal(recipe)
                    },
                    "add to planner"
                  )
                ]
              )
            ]
          )
        )
      ),

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