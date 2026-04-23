import {
  getRecipes,
  createRecipe,
  deleteRecipe,
  updateRecipe,
} from "../api/recipes.js";

import { getIngredients } from "../api/ingredients.js";
import { addShoppingItem } from "../api/shoppingList.js";

export default function RecipesPage() {
  const { useState, useEffect } = React;

  const [searchResults, setSearchResults] = useState([]);
  const [userIngredients, setUserIngredients] = useState([]);

  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [editingRecipe, setEditingRecipe] = useState(null);

  const [title, setTitle] = useState("");
  const [ingredientInput, setIngredientInput] = useState("");
  const [ingredientList, setIngredientList] = useState([]);
  const [instructions, setInstructions] = useState(["", "", ""]);
  const [errorMessage, setErrorMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [searchMessage, setSearchMessage] = useState("");

  useEffect(() => {
    loadUserIngredients();
  }, []);

  function loadUserIngredients() {
    getIngredients().then((data) => setUserIngredients(data));
  }

  async function runSearch(term = "") {
    try {
      const data = await getRecipes(term);
      setSearchResults(data);

      if (term.trim()) {
        setSearchMessage(`Results for "${term}"`);
      } else {
        setSearchMessage("");
      }
    } catch (err) {
      console.error(err);
      setSearchResults([]);
      setSearchMessage("Search failed");
    }
  }

  function handleSearch() {
    runSearch(searchTerm);
  }

  function clearSearch() {
    setSearchTerm("");
    setSearchResults([]);
    setSearchMessage("");
  }

  function resetForm() {
    setTitle("");
    setIngredientInput("");
    setIngredientList([]);
    setInstructions(["", "", ""]);
    setErrorMessage("");
  }

  function addIngredientToList() {
    const value = ingredientInput.trim();
    if (!value) return;
    setIngredientList((prev) => [...prev, value]);
    setIngredientInput("");
  }

  function removeIngredient(index) {
    setIngredientList(ingredientList.filter((_, i) => i !== index));
  }

  function updateInstruction(index, value) {
    const updated = [...instructions];
    updated[index] = value;
    setInstructions(updated);
  }

  function addInstruction() {
    setInstructions([...instructions, ""]);
  }

  function removeInstruction(index) {
    setInstructions(instructions.filter((_, i) => i !== index));
  }

  function saveNewRecipe() {
    if (!title.trim()) return setErrorMessage("Recipe name is required.");
    if (ingredientList.length === 0) {
      return setErrorMessage("Please add at least one ingredient.");
    }

    const cleaned = instructions.filter((s) => s.trim());
    if (cleaned.length === 0) {
      return setErrorMessage("Please add at least one instruction step.");
    }

    setErrorMessage("");

    createRecipe({
      name: title.trim(),
      ingredients: ingredientList.join(", "),
      instructions: cleaned,
    }).then(() => {
      resetForm();
      if (searchTerm.trim()) runSearch(searchTerm);
    });
  }

  function startEditRecipe(recipe) {
    setEditingRecipe(recipe);
    setSelectedRecipe(null);

    setTitle(recipe.name || "");
    setIngredientList(
      (recipe.ingredients || "")
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean)
    );
    setInstructions(Array.isArray(recipe.instructions) ? recipe.instructions : []);
  }

  function cancelEditRecipe() {
    setEditingRecipe(null);
    resetForm();
  }

  function saveEditedRecipe() {
    if (!editingRecipe) return;

    if (!title.trim()) return setErrorMessage("Recipe name required.");
    if (ingredientList.length === 0) {
      return setErrorMessage("You need at least one ingredient.");
    }

    const cleaned = instructions.filter((s) => s.trim());
    if (cleaned.length === 0) {
      return setErrorMessage("You need at least one instruction.");
    }

    updateRecipe(editingRecipe.id, {
      name: title.trim(),
      ingredients: ingredientList.join(", "),
      instructions: cleaned,
    }).then(() => {
      setEditingRecipe(null);
      resetForm();
      if (searchTerm.trim()) runSearch(searchTerm);
    });
  }

  function deleteRecipeItem(id) {
    deleteRecipe(id).then(() => {
      if (editingRecipe?.id === id) cancelEditRecipe();
      if (selectedRecipe?.id === id) setSelectedRecipe(null);
      if (searchTerm.trim()) runSearch(searchTerm);
    });
  }

  const normalize = (str) =>
    str.toLowerCase().trim().replace(/s\b/, "");

  function compareIngredientsFor(recipe) {
    if (!recipe) return { have: [], need: [] };

    const recipeList = (recipe.ingredients || "")
      .split(",")
      .map((i) => i.trim())
      .filter(Boolean);

    const have = [];
    const need = [];

    recipeList.forEach((ri) => {
      const normRi = normalize(ri);

      const found = userIngredients.some((u) => {
        const normU = normalize(u.name);
        return normRi.includes(normU) || normU.includes(normRi);
      });

      found ? have.push(ri) : need.push(ri);
    });

    return { have, need };
  }

  function addNeededToShopping(item) {
    addShoppingItem(item).then(() =>
      alert(`Added "${item}" to your shopping list.`)
    );
  }

  function renderLeftPanel() {
    if (editingRecipe) {
      return React.createElement(
        "div",
        {
          style: {
            flex: 1,
            border: "2px solid black",
            padding: "20px",
            minHeight: "600px",
          },
        },
        [
          React.createElement("h1", { key: "h" }, "Edit Recipe"),

          React.createElement("input", {
            key: "title",
            placeholder: "Recipe Title",
            value: title,
            onChange: (e) => setTitle(e.target.value),
            style: {
              width: "100%",
              padding: "8px",
              border: "1px solid black",
              marginBottom: "10px",
            },
          }),

          React.createElement("input", {
            key: "ingAdd",
            placeholder: "Add ingredient",
            value: ingredientInput,
            onChange: (e) => setIngredientInput(e.target.value),
            onKeyDown: (e) => e.key === "Enter" && addIngredientToList(),
            style: {
              width: "100%",
              padding: "8px",
              border: "1px solid black",
              marginBottom: "5px",
            },
          }),

          React.createElement(
            "button",
            {
              key: "addIngBtn",
              className: "btn",
              onClick: addIngredientToList,
              style: { marginBottom: "10px" },
            },
            "Add"
          ),

          ingredientList.length > 0 &&
            React.createElement(
              "ul",
              { key: "ingList" },
              ingredientList.map((ing, idx) =>
                React.createElement(
                  "li",
                  {
                    key: idx,
                    style: {
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                      width: "70%",
                    },
                  },
                  [
                    React.createElement("span", { key: "t" }, ing),
                    React.createElement(
                      "button",
                      {
                        key: "x",
                        className: "btn",
                        onClick: () => removeIngredient(idx),
                      },
                      "x"
                    ),
                  ]
                )
              )
            ),

          React.createElement(
            "h3",
            { key: "instT", style: { marginTop: "10px" } },
            "Instructions"
          ),

          instructions.map((step, idx) =>
            React.createElement(
              "div",
              {
                key: idx,
                style: {
                  display: "flex",
                  marginBottom: "10px",
                  alignItems: "center",
                },
              },
              [
                React.createElement("input", {
                  key: "input",
                  placeholder: `Step ${idx + 1}`,
                  value: step,
                  onChange: (e) => updateInstruction(idx, e.target.value),
                  style: {
                    flex: 1,
                    padding: "8px",
                    border: "1px solid black",
                  },
                }),
                React.createElement(
                  "button",
                  {
                    key: "minus",
                    className: "btn",
                    onClick: () => removeInstruction(idx),
                    style: { marginLeft: "8px" },
                  },
                  "-"
                ),
              ]
            )
          ),

          React.createElement(
            "div",
            {
              key: "addStep",
              style: { cursor: "pointer", marginBottom: "20px" },
              onClick: addInstruction,
            },
            "+ add another step"
          ),

          React.createElement(
            "button",
            {
              key: "saveBtn",
              className: "btn",
              onClick: saveEditedRecipe,
              style: { marginRight: "10px" },
            },
            "Save Changes"
          ),

          React.createElement(
            "button",
            {
              key: "cancelBtn",
              className: "btn",
              onClick: cancelEditRecipe,
            },
            "Cancel"
          ),

          errorMessage &&
            React.createElement(
              "div",
              { key: "err", style: { color: "red", marginTop: "10px" } },
              errorMessage
            ),
        ]
      );
    }

    if (selectedRecipe) {
      const cmp = compareIngredientsFor(selectedRecipe);

      return React.createElement(
        "div",
        {
          style: {
            flex: 1,
            border: "2px solid black",
            padding: "20px",
          },
        },
        [
          React.createElement("h1", { key: "t" }, selectedRecipe.name),

          React.createElement("h3", { key: "hHave" }, "you have:"),
          React.createElement(
            "ul",
            { key: "have" },
            cmp.have.map((i) => React.createElement("li", { key: i }, `${i} ✔`))
          ),

          React.createElement(
            "h3",
            { key: "hNeed", style: { marginTop: "20px" } },
            "what you need:"
          ),
          React.createElement(
            "ul",
            { key: "need" },
            cmp.need.map((item) =>
              React.createElement(
                "li",
                { key: item, style: { marginBottom: "6px" } },
                [
                  React.createElement("span", { key: "txt" }, item),
                  React.createElement(
                    "button",
                    {
                      key: "addShop",
                      className: "btn",
                      onClick: () => addNeededToShopping(item),
                      style: { marginLeft: "10px" },
                    },
                    "+"
                  ),
                ]
              )
            )
          ),

          React.createElement(
            "button",
            {
              key: "closeBtn",
              className: "btn",
              style: { marginTop: "20px" },
              onClick: () => setSelectedRecipe(null),
            },
            "Close"
          ),
        ]
      );
    }

    return React.createElement(
      "div",
      {
        style: {
          flex: 1,
          border: "2px solid black",
          padding: "20px",
        },
      },
      [
        React.createElement("h1", { key: "top" }, "Add Recipe"),

        React.createElement("input", {
          key: "title",
          placeholder: "Recipe Title",
          value: title,
          onChange: (e) => setTitle(e.target.value),
          style: {
            width: "100%",
            padding: "8px",
            border: "1px solid black",
            marginBottom: "10px",
          },
        }),

        React.createElement("input", {
          key: "ingInput",
          placeholder: "Add ingredient",
          value: ingredientInput,
          onChange: (e) => setIngredientInput(e.target.value),
          onKeyDown: (e) => e.key === "Enter" && addIngredientToList(),
          style: {
            width: "100%",
            padding: "8px",
            border: "1px solid black",
            marginBottom: "5px",
          },
        }),

        React.createElement(
          "button",
          {
            key: "addIngBtn",
            className: "btn",
            style: { marginBottom: "10px" },
            onClick: addIngredientToList,
          },
          "Add"
        ),

        ingredientList.length > 0 &&
          React.createElement(
            "ul",
            { key: "ingUL" },
            ingredientList.map((ing, idx) =>
              React.createElement(
                "li",
                {
                  key: idx,
                  style: {
                    display: "flex",
                    justifyContent: "space-between",
                    width: "70%",
                    marginBottom: "6px",
                  },
                },
                [
                  React.createElement("span", { key: "t" }, ing),
                  React.createElement(
                    "button",
                    {
                      key: "x",
                      className: "btn",
                      onClick: () => removeIngredient(idx),
                    },
                    "x"
                  ),
                ]
              )
            )
          ),

        React.createElement(
          "h3",
          { key: "instHdr", style: { marginTop: "10px" } },
          "Instructions"
        ),

        instructions.map((step, idx) =>
          React.createElement(
            "div",
            {
              key: idx,
              style: { display: "flex", marginBottom: "10px" },
            },
            [
              React.createElement("input", {
                key: "i",
                placeholder: `Step ${idx + 1}`,
                value: step,
                onChange: (e) => updateInstruction(idx, e.target.value),
                style: {
                  flex: 1,
                  padding: "8px",
                  border: "1px solid black",
                },
              }),
              React.createElement(
                "button",
                {
                  key: "minus",
                  className: "btn",
                  onClick: () => removeInstruction(idx),
                  style: { marginLeft: "8px" },
                },
                "-"
              ),
            ]
          )
        ),

        React.createElement(
          "div",
          {
            key: "addStep",
            onClick: addInstruction,
            style: { cursor: "pointer", marginBottom: "20px" },
          },
          "+ add another step"
        ),

        React.createElement(
          "button",
          {
            key: "save",
            className: "btn",
            onClick: saveNewRecipe,
          },
          "Add Recipe"
        ),

        errorMessage &&
          React.createElement(
            "div",
            { key: "err", style: { color: "red", marginTop: "8px" } },
            errorMessage
          ),
      ]
    );
  }

  function renderRightPanel() {
    return React.createElement(
      "div",
      {
        style: {
          flex: 1,
          border: "2px solid black",
          padding: "20px",
        },
      },
      [
        React.createElement("h2", { key: "title" }, "Search Database Recipes"),

        React.createElement(
          "div",
          {
            key: "searchRow",
            style: {
              display: "flex",
              gap: "10px",
              marginBottom: "16px",
              alignItems: "center",
            },
          },
          [
            React.createElement("input", {
              key: "searchInput",
              value: searchTerm,
              placeholder: "Search by recipe title or ingredient",
              onChange: (e) => setSearchTerm(e.target.value),
              onKeyDown: (e) => {
                if (e.key === "Enter") handleSearch();
              },
              style: {
                flex: 1,
                padding: "8px",
                border: "1px solid black",
              },
            }),

            React.createElement(
              "button",
              {
                key: "searchBtn",
                className: "btn",
                onClick: handleSearch,
              },
              "Search"
            ),

            React.createElement(
              "button",
              {
                key: "clearBtn",
                className: "btn",
                onClick: clearSearch,
              },
              "Clear"
            ),
          ]
        ),

        searchMessage &&
          React.createElement(
            "div",
            {
              key: "searchLabel",
              style: { marginBottom: "12px", fontStyle: "italic" },
            },
            searchMessage
          ),

        searchResults.length === 0 &&
          React.createElement(
            "p",
            { key: "none" },
            "Search for a recipe from the database."
          ),

        ...searchResults.map((r) => {
          const isOpen = selectedRecipe?.id === r.id;

          return React.createElement(
            "div",
            {
              key: r.id,
              onClick: () => setSelectedRecipe(isOpen ? null : r),
              style: {
                borderBottom: "1px solid black",
                paddingBottom: "10px",
                marginBottom: "10px",
                cursor: "pointer",
                padding: "10px",
              },
            },
            [
              React.createElement(
                "div",
                {
                  key: "header",
                  style: {
                    display: "flex",
                    alignItems: "center",
                    fontWeight: "bold",
                    fontSize: "18px",
                  },
                },
                [
                  React.createElement("span", { key: "name" }, r.name),
                  React.createElement(
                    "span",
                    { key: "arrow", style: { marginLeft: "auto" } },
                    isOpen ? "▾" : "▸"
                  ),
                ]
              ),

              isOpen &&
                React.createElement(
                  "div",
                  {
                    key: "details",
                    style: { marginTop: "10px", paddingLeft: "10px" },
                    onClick: (e) => e.stopPropagation(),
                  },
                  [
                    React.createElement(
                      "div",
                      { key: "ing" },
                      [
                        React.createElement("strong", { key: "t" }, "Ingredients:"),
                        React.createElement(
                          "ul",
                          { key: "ul" },
                          (r.ingredients || "")
                            .split(",")
                            .map((x) => x.trim())
                            .filter(Boolean)
                            .map((ing, idx) =>
                              React.createElement("li", { key: idx }, ing)
                            )
                        ),
                      ]
                    ),

                    React.createElement(
                      "div",
                      { key: "steps" },
                      [
                        React.createElement("strong", { key: "t" }, "Instructions:"),
                        React.createElement(
                          "ol",
                          { key: "ol", style: { paddingLeft: "20px" } },
                          (r.instructions || []).map((step, idx) =>
                            React.createElement(
                              "li",
                              { key: idx, style: { marginBottom: "6px" } },
                              step
                            )
                          )
                        ),
                      ]
                    ),

                    React.createElement(
                      "div",
                      {
                        key: "btns",
                        style: { marginTop: "10px", display: "flex", gap: "10px" },
                      },
                      [
                        React.createElement(
                          "button",
                          {
                            key: "editBtn",
                            className: "btn",
                            onClick: () => startEditRecipe(r),
                          },
                          "Edit Recipe"
                        ),

                        React.createElement(
                          "button",
                          {
                            key: "delBtn",
                            className: "btn",
                            onClick: () => deleteRecipeItem(r.id),
                          },
                          "Delete"
                        ),
                      ]
                    ),
                  ]
                ),
            ]
          );
        }),
      ]
    );
  }

  return React.createElement(
    "div",
    { style: { padding: "20px", display: "flex", gap: "20px" } },
    [renderLeftPanel(), renderRightPanel()]
  );
}