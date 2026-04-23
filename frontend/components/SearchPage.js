import { getRecipes } from "../api/recipes.js";

export default function SearchPage() {
  const { useState } = React;

  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    const term = searchTerm.trim();
    if (!term) return;

    setLoading(true);

    try {
      const data = await getRecipes(term);
      setResults(data);
      setHasSearched(true);
    } catch (err) {
      console.error(err);
      setResults([]);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  }

  function clearSearch() {
    setSearchTerm("");
    setResults([]);
    setHasSearched(false);
  }

  return React.createElement(
    "div",
    { style: { padding: "20px" } },
    [
      React.createElement("h1", { key: "title" }, "Search Recipes"),

      React.createElement("div", {
        key: "sep",
        className: "separator",
        style: { marginBottom: "20px" }
      }),

      React.createElement(
        "div",
        {
          key: "searchBox",
          style: {
            border: "2px solid black",
            padding: "20px",
            marginBottom: "20px"
          }
        },
        [
          React.createElement("h3", { key: "label" }, "Search by title or ingredient"),

          React.createElement("input", {
            key: "input",
            value: searchTerm,
            placeholder: "Search recipes...",
            onChange: (e) => setSearchTerm(e.target.value),
            onKeyDown: (e) => {
              if (e.key === "Enter") handleSearch();
            },
            style: {
              width: "100%",
              padding: "8px",
              border: "1px solid black",
              marginBottom: "12px"
            }
          }),

          React.createElement(
            "div",
            {
              key: "buttons",
              style: { display: "flex", gap: "10px" }
            },
            [
              React.createElement(
                "button",
                {
                  key: "searchBtn",
                  className: "btn",
                  onClick: handleSearch
                },
                "Search"
              ),

              React.createElement(
                "button",
                {
                  key: "clearBtn",
                  className: "btn",
                  onClick: clearSearch
                },
                "Clear"
              )
            ]
          )
        ]
      ),

      loading &&
        React.createElement("p", { key: "loading" }, "Searching..."),

      hasSearched &&
        !loading &&
        React.createElement(
          "div",
          {
            key: "results",
            style: {
              border: "2px solid black",
              padding: "20px"
            }
          },
          [
            React.createElement(
              "h2",
              { key: "resultsTitle" },
              `Results (${results.length})`
            ),

            results.length === 0
              ? React.createElement("p", { key: "none" }, "No matching recipes found.")
              : React.createElement(
                  "div",
                  { key: "list" },
                  results.map((recipe) =>
                    React.createElement(
                      "div",
                      {
                        key: recipe.id,
                        style: {
                          borderBottom: "1px solid black",
                          padding: "12px 0"
                        }
                      },
                      [
                        React.createElement(
                          "div",
                          {
                            key: "name",
                            style: {
                              fontWeight: "bold",
                              fontSize: "18px",
                              marginBottom: "8px"
                            }
                          },
                          recipe.name
                        ),

                        React.createElement(
                          "div",
                          { key: "ingredients" },
                          `Ingredients: ${recipe.ingredients || ""}`
                        )
                      ]
                    )
                  )
                )
          ]
        )
    ]
  );
}