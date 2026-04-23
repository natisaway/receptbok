const BASE_URL = "http://127.0.0.1:5001/api/ingredients";

export async function getIngredients() {
  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error("Failed to load ingredients");
  return res.json();
}

export async function createIngredient(data) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to create ingredient");
  return res.json();
}

export async function deleteIngredient(id) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) throw new Error("Failed to delete ingredient");
  return res.json();
}

export async function updateIngredient(id, data) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to update ingredient");
  return res.json();
}