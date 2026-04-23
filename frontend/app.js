import HomePage from "./components/HomePage.js";
import IngredientsManagerPage from "./components/IngredientsManagerPage.js";
import RecipesPage from "./components/RecipesPage.js";
import SearchPage from "./components/SearchPage.js";

const root = ReactDOM.createRoot(document.getElementById("root"));

function App() {
  const { useState } = React;

  const [page, setPage] = useState("home");

  const renderPage = () => {
    if (page === "home") {
      return React.createElement(HomePage, { setPage });
    }

    if (page === "ingredients") {
      return React.createElement(IngredientsManagerPage, { setPage });
    }

    if (page === "recipes") {
      return React.createElement(RecipesPage, { setPage });
    }

    if (page === "search") {
      return React.createElement(SearchPage, { setPage });
    }

    return React.createElement(HomePage, { setPage });
  };

  return React.createElement(
    "div",
    { className: "window", style: { width: "95%", margin: "20px auto" } },
    [
      React.createElement(
        "div",
        { key: "titleBar", className: "title-bar" },
        [
          React.createElement("button", {
            key: "close",
            className: "close",
            "aria-label": "Close"
          }),

          React.createElement(
            "h1",
            { key: "title", className: "title" },
            "Receptbok"
          ),

          React.createElement("button", {
            key: "resize",
            className: "resize",
            "aria-label": "Resize"
          })
        ]
      ),

      React.createElement("div", {
        key: "separatorTop",
        className: "separator"
      }),

      React.createElement(
        "div",
        { key: "pane", className: "window-pane", style: { padding: "20px" } },
        [
          React.createElement(
            "div",
            {
              key: "navRow",
              className: "field-row",
              style: {
                marginBottom: "20px",
                gap: "12px",
                display: "flex",
                flexWrap: "wrap"
              }
            },
            [
              React.createElement(
                "button",
                {
                  key: "homeBtn",
                  className: "btn btn-large",
                  onClick: () => setPage("home")
                },
                "Home"
              ),

              React.createElement(
                "button",
                {
                  key: "ingredientsBtn",
                  className: "btn btn-large",
                  onClick: () => setPage("ingredients")
                },
                "Ingredients"
              ),

              React.createElement(
                "button",
                {
                  key: "recipesBtn",
                  className: "btn btn-large",
                  onClick: () => setPage("recipes")
                },
                "Recipes"
              ),

              React.createElement(
                "button",
                {
                  key: "searchBtn",
                  className: "btn btn-large",
                  onClick: () => setPage("search")
                },
                "Search"
              )
            ]
          ),

          React.createElement("div", {
            key: "separatorBottom",
            className: "separator"
          }),

          React.createElement(
            "div",
            { key: "pageContainer", style: { marginTop: "20px" } },
            renderPage()
          )
        ]
      )
    ]
  );
}

root.render(React.createElement(App));