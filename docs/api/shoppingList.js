const BASE_URL = "https://receptbok-backend.onrender.com/api/shopping-list";

export async function getShoppingList() {
  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error("Failed to load shopping list");
  return res.json();
}

export async function addShoppingItem(name) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) throw new Error("Failed to add shopping item");
  return res.json();
}

export async function updateShoppingItem(id, name) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) throw new Error("Failed to update shopping item");
  return res.json();
}

export async function deleteShoppingItem(id) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) throw new Error("Failed to delete shopping item");
  return res.json();
}
