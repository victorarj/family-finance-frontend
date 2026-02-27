import { useEffect, useState } from "react";
import { list, remove } from "../apis/recipes";
import type { Recipe } from "../types";

interface RecipeListProps {
  onEdit: (recipe: Recipe) => void;
  refreshTrigger?: number;
}

export default function RecipeList({
  onEdit,
  refreshTrigger,
}: RecipeListProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecipes();
  }, [refreshTrigger]);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const data = await list();
      setRecipes(Array.isArray(data.data) ? data.data : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load recipes");
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number | undefined) => {
    if (id === undefined || !window.confirm("Delete this recipe?")) return;

    try {
      await remove(id);
      setRecipes(recipes.filter((r) => r.id !== id));
    } catch (err) {
      alert(
        `Error: ${err instanceof Error ? err.message : "Failed to delete"}`,
      );
    }
  };

  if (loading) return <p>Loading recipes...</p>;
  if (error)
    return (
      <div style={{ color: "red" }}>
        <p>Error: {error}</p>
        <button onClick={fetchRecipes}>Retry</button>
      </div>
    );

  return (
    <div>
      {recipes.length === 0 ? (
        <p>No recipes yet. Add one!</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "10px",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f5f5f5" }}>
              <th
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  textAlign: "left",
                }}
              >
                Name
              </th>
              <th
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  textAlign: "left",
                }}
              >
                Description
              </th>
              <th
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  textAlign: "center",
                  width: "150px",
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {recipes.map((recipe) => (
              <tr key={recipe.id}>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {recipe.name}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {recipe.description
                    ? recipe.description.substring(0, 50) + "..."
                    : "—"}
                </td>
                <td
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "center",
                  }}
                >
                  <button
                    onClick={() => onEdit(recipe)}
                    style={{ padding: "4px 8px", marginRight: "4px" }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(recipe.id)}
                    style={{
                      padding: "4px 8px",
                      backgroundColor: "#ff6b6b",
                      color: "white",
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
