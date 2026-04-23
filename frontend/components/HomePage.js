// -----------------------------------------------------------------------------
// HomePage.js 
// -----------------------------------------------------------------------------

import { getIngredients } from "../api/ingredients.js";
import { getRecipes } from "../api/recipes.js";
import { getShoppingList } from "../api/shoppingList.js";

export default function HomePage(props) {
  const { useState, useEffect } = React;

  // ---------------------------------------------------------
  // STATE
  // ---------------------------------------------------------
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);

  const [ingredientPreview, setIngredientPreview] = useState([]);
  const [recipePreviewLimit, setRecipePreviewLimit] = useState(6);

  // ---------------------------------------------------------
  // LOAD DATA ON MOUNT
  // ---------------------------------------------------------
  useEffect(() => {
    // INGREDIENTS
    getIngredients().then((data) => {
      setIngredients(data);

      // select 4 random ingredients
      const randomized = [...data].sort(() => 0.5 - Math.random());
      setIngredientPreview(randomized.slice(0, 4));
    });

    // RECIPES
// RECIPES
getRecipes().then((data) => {
  const randomized = [...data].sort(() => 0.5 - Math.random());
  setRecipes(randomized);
});
    // SHOPPING LIST
    getShoppingList().then((data) => setShoppingList(data));
  }, []);

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------
  return React.createElement(
    "div",
    { style: { padding: "20px" } },
    [
      // PAGE HEADER
      React.createElement("h1", { key: "title" }, "Receptbok"),

      React.createElement("div", { key: "sep1", className: "separator" }),

      // -------------------------------------------------------
      // MAIN GRID
      // -------------------------------------------------------
      React.createElement(
        "div",
        {
          key: "mainGrid",
          style: {
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "40px",
            marginTop: "20px",
          },
        },
        [
          // -----------------------------------------------------
          // INGREDIENT PREVIEW
          // -----------------------------------------------------
          React.createElement(
            "div",
            { key: "left" },
            [
              React.createElement("h2", { key: "ingTitle" }, "Ingredients at a Glance"),

              React.createElement(
                "div",
                {
                  key: "ingBox",
                  style: {
                    border: "1px solid black",
                    padding: "10px",
                    minHeight: "120px",
                    marginBottom: "10px",
                  },
                },
                ingredientPreview.length === 0
                  ? "loading..."
                  : ingredientPreview.map((i) =>
                      React.createElement(
                        "div",
                        { key: i.id },
                        `${i.name} (${i.quantity} ${i.unit})`
                      )
                    )
              ),

              React.createElement(
                "button",
                {
                  key: "moreIng",
                  className: "btn btn-large",
                  onClick: () => props.setPage("ingredients"),
                },
                "Show More"
              ),
            ]
          ),

          // -----------------------------------------------------
          // RECIPE PREVIEW GRID
          // -----------------------------------------------------
          React.createElement(
            "div",
            { key: "right" },
            [
              React.createElement("h2", { key: "recTitle" }, "Available Recipes to Make"),

              React.createElement(
                "div",
                {
                  key: "recipeGrid",
                  style: {
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "20px",
                    marginTop: "10px",
                  },
                },
                recipes.slice(0, recipePreviewLimit).map((r) =>
                  React.createElement(
                    "div",
                    {
                      key: r.id,
                      className: "window",
                      style: {
                        padding: "10px",
                        border: "1px solid black",
                        cursor: "pointer",
                      },
                      onClick: () => props.setPage("recipes"),
                    },
                    [
                      React.createElement(
                        "div",
                        { key: "name", style: { fontWeight: "bold" } },
                        r.name
                      ),
                      React.createElement(
                        "div",
                        {
                          key: "desc",
                          style: { fontSize: "14px", marginTop: "4px" },
                        },
                        "" // blank description placeholder
                      ),
                    ]
                  )
                )
              ),

              recipes.length > recipePreviewLimit &&
                React.createElement(
                  "button",
                  {
                    key: "moreRec",
                    className: "btn btn-large",
                    onClick: () => setRecipePreviewLimit(recipePreviewLimit + 6),
                    style: { marginTop: "10px" },
                  },
                  "Show More"
                ),
            ]
          ),
        ]
      ),

      // -------------------------------------------------------
      // SHOPPING LIST SECTION
      // -------------------------------------------------------
      React.createElement("div", { key: "sep2", className: "separator" }),

      React.createElement(
        "div",
        { key: "shoppingBox" },
        [
          React.createElement("h2", { key: "shopTitle" }, "Shopping List"),

          // SHOPPING PREVIEW BOX
          React.createElement(
            "div",
            {
              key: "shopPreview",
              style: {
                border: "1px solid black",
                padding: "10px",
                minHeight: "120px",
                marginBottom: "10px",
                fontFamily: "monospace",
              },
            },
            shoppingList.length === 0
              ? "Shopping list is empty."
              : shoppingList.map((item) =>
                  React.createElement(
                    "div",
                    { key: item.id, style: { marginBottom: "4px" } },
                    `• ${item.name}`
                  )
                )
          ),

          // BUTTON 
          React.createElement(
            "button",
            {
              key: "shopBtn",
              className: "btn btn-large",
              onClick: () => props.setPage("ingredients"),
            },
            "Show More"
          ),
        ]
      ),
    ]
  );
}
