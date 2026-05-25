const BASE_URL = "https://receptbok-backend.onrender.com/api/recipes";

export async function getRecipes(searchTerm = "") {
  const url = searchTerm.trim()
    ? `${BASE_URL}?q=${encodeURIComponent(searchTerm.trim())}`
    : BASE_URL;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("Failed to load recipes");
  }

  return res.json();
}

export async function createRecipe(data) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to create recipe");
  }

  return res.json();
}

export async function deleteRecipe(id) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Failed to delete recipe");
  }

  return res.json();
}

export async function updateRecipe(id, data) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to update recipe");
  }

  return res.json();
}
