import { useState, useEffect } from "react";
import { create, update } from "../apis/recipes";
import type { Recipe } from "../types";

interface RecipeFormProps {
  recipe?: Recipe | null;
  onSaved: (recipe: Recipe) => void;
  onCancel: () => void;
}

export default function RecipeForm({
  recipe,
  onSaved,
  onCancel,
}: RecipeFormProps) {
  const [form, setForm] = useState<Recipe>({
    name: "",
    description: "",
    ingredients: "",
    instructions: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (recipe) {
      setForm(recipe);
    } else {
      setForm({
        name: "",
        description: "",
        ingredients: "",
        instructions: "",
      });
    }
  }, [recipe]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const action = recipe ? update(recipe.id ?? 0, form) : create(form);
      const res = await action;
      onSaved(res.data);
      setForm({
        name: "",
        description: "",
        ingredients: "",
        instructions: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save recipe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ maxWidth: "500px", margin: "10px 0" }}
    >
      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      <div style={{ marginBottom: "10px" }}>
        <label>Name:</label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Recipe name"
          required
          disabled={loading}
          style={{ width: "100%", padding: "5px" }}
        />
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label>Description:</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description"
          disabled={loading}
          style={{ width: "100%", padding: "5px", height: "60px" }}
        />
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label>Ingredients:</label>
        <textarea
          name="ingredients"
          value={form.ingredients}
          onChange={handleChange}
          placeholder="Ingredients (comma-separated or one per line)"
          disabled={loading}
          style={{ width: "100%", padding: "5px", height: "80px" }}
        />
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label>Instructions:</label>
        <textarea
          name="instructions"
          value={form.instructions}
          onChange={handleChange}
          placeholder="Cooking instructions"
          disabled={loading}
          style={{ width: "100%", padding: "5px", height: "100px" }}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{ padding: "8px 16px", marginRight: "8px" }}
      >
        {loading ? "Saving..." : recipe ? "Update" : "Add"} Recipe
      </button>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          style={{ padding: "8px 16px" }}
        >
          Cancel
        </button>
      )}
    </form>
  );
}
