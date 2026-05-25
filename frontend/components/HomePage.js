import { getIngredients } from "../api/ingredients.js";
import { getRecipes } from "../api/recipes.js";
import { getShoppingList } from "../api/shoppingList.js";

export default function HomePage(props) {
  const { useState, useEffect } = React;

  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);

  const [ingredientPreview, setIngredientPreview] = useState([]);
  const [recipePreview, setRecipePreview] = useState([]);
  const [recipePreviewLimit, setRecipePreviewLimit] = useState(6);

  useEffect(() => {
    getIngredients().then((data) => {
      setIngredients(data);

      const randomizedIngredients = [...data].sort(() => 0.5 - Math.random());
      setIngredientPreview(randomizedIngredients.slice(0, 4));
    });

    getRecipes().then((data) => {
      setRecipes(data);

      const randomizedRecipes = [...data].sort(() => 0.5 - Math.random());
      setRecipePreview(randomizedRecipes);
    });

    getShoppingList().then((data) => setShoppingList(data));
  }, []);

  function openRecipe(recipe) {
    if (props.openRecipePage) {
      props.openRecipePage(recipe);
      return;
    }

    props.setRecipeToOpen(recipe);
    props.setPage("recipes");
  }

  return React.createElement("div", { style: { padding: "20px" } }, [
    React.createElement("h1", { key: "title" }, "Receptbok"),

    React.createElement("div", { key: "sep1", className: "separator" }),

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
        React.createElement("div", { key: "left" }, [
          React.createElement(
            "h2",
            { key: "ingTitle" },
            "Ingredients at a Glance"
          ),

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
                    `${i.name} (${i.quantity || ""} ${i.unit || ""})`
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
        ]),

        React.createElement("div", { key: "right" }, [
          React.createElement("h2", { key: "recTitle" }, "Recipes to Make"),

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
            recipePreview.slice(0, recipePreviewLimit).map((r) =>
              React.createElement(
                "div",
                {
                  key: r.id,
                  className: "window",
                  style: {
                    padding: "10px",
                    border: "1px solid black",
                  },
                },
                [
                  React.createElement(
                    "div",
                    {
                      key: "name",
                      style: {
                        fontWeight: "bold",
                        marginBottom: "10px",
                      },
                    },
                    r.name
                  ),

                  React.createElement(
                    "div",
                    {
                      key: "buttons",
                      style: {
                        display: "flex",
                        gap: "8px",
                      },
                    },
                    [
                      React.createElement(
                        "button",
                        {
                          key: "showMore",
                          className: "btn",
                          onClick: () => openRecipe(r),
                        },
                        "show more"
                      ),

                      React.createElement(
                        "button",
                        {
                          key: "edit",
                          className: "btn",
                          onClick: () => openRecipe(r),
                        },
                        "edit"
                      ),
                    ]
                  ),
                ]
              )
            )
          ),

          recipePreview.length > recipePreviewLimit &&
            React.createElement(
              "button",
              {
                key: "moreRec",
                className: "btn btn-large",
                onClick: () =>
                  setRecipePreviewLimit(recipePreviewLimit + 6),
                style: { marginTop: "10px" },
              },
              "Show More"
            ),
        ]),
      ]
    ),

    React.createElement("div", { key: "sep2", className: "separator" }),

    React.createElement("div", { key: "shoppingBox" }, [
      React.createElement("h2", { key: "shopTitle" }, "Shopping List"),

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

      React.createElement(
        "div",
        {
          key: "shoppingButtons",
          style: {
            display: "flex",
            gap: "10px",
          },
        },
        [
          React.createElement(
            "button",
            {
              key: "shopBtn",
              className: "btn btn-large",
              onClick: () => props.setPage("ingredients"),
            },
            "Show More"
          ),

          React.createElement(
            "button",
            {
              key: "editShopBtn",
              className: "btn btn-large",
              onClick: () => props.setPage("ingredients"),
            },
            "Edit"
          ),
        ]
      ),
    ]),
  ]);
}