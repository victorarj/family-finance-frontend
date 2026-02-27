import { useState } from "react";
import RecipeForm from "../components/RecipeForm.tsx";
import RecipeList from "../components/RecipeList.tsx";
import type { Recipe } from "../types";

export default function RecipesPage() {
  const [editing, setEditing] = useState<Recipe | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleEdit = (recipe: Recipe) => {
    setEditing(recipe);
  };

  const handleSaved = () => {
    setEditing(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleCancel = () => {
    setEditing(null);
  };

  return (
    <div>
      <h1>Recipes</h1>

      <section>
        <h2>{editing ? "Edit recipe" : "Add recipe"}</h2>
        <RecipeForm
          recipe={editing}
          onSaved={handleSaved}
          onCancel={handleCancel}
        />
      </section>

      <section>
        <h2>Existing recipes</h2>
        <RecipeList onEdit={handleEdit} refreshTrigger={refreshTrigger} />
      </section>
    </div>
  );
}
