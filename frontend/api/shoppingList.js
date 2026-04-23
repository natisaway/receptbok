// api/shoppingList.js

export async function getShoppingList() {
  const res = await fetch("/api/shopping-list");
  return res.json();
}

export async function addShoppingItem(name) {
  const res = await fetch("/api/shopping-list", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });
  return res.json();
}

export async function deleteShoppingItem(id) {
  const res = await fetch(`/api/shopping-list/${id}`, {
    method: "DELETE"
  });
  return res.json();
}
