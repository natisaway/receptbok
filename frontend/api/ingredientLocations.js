const API_URL = "https://receptbok-backend.onrender.com/api/ingredient-locations";

export async function getIngredientLocations() {
  const res = await fetch(API_URL);

  if (!res.ok) {
    throw new Error("Failed to load locations");
  }

  return res.json();
}

export async function createIngredientLocation(location) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(location),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create location");
  }

  return res.json();
}

export async function deleteIngredientLocation(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Failed to delete location");
  }

  return res.json();
}
