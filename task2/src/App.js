import './App.css';
import { db } from "./firebase.config";
import { useState, useEffect } from "react";
import {
  collection,
  connectFirestoreEmulator,
  onSnapshot,
  snapshotEqual,
  doc,
  addDoc,
  deleteDoc,
} from "firebase/firestore";

function App() {
  const [recipes, setRecipes] = useState([]);
  const [form, setForm] = useState({
    title: "",
    desc: "",
    ingredients: [],
    instructions: []

  });
  const [popupActive, setPopupActive] = useState(false);

  const recipeCollectionRef = collection(db, "recipes");

  useEffect(() => {
    onSnapshot(recipeCollectionRef, snapshot => {
      setRecipes(snapshot.docs.map(doc => {
        return {
          id: doc.id,
          viewing: false,
          ...doc.data()
        }
      }))
    })
  }, [])

  const handleView = id => {
    const recipesClone = [...recipes];

    recipesClone.forEach(recipe => {
      if (recipe.id === id) {
        recipe.viewing = !recipe.viewing;
      }
      else {
        recipe.viewing = false;
      }
    })

    setRecipes(recipesClone);
  }

  const handleSubmit = e => {
    // Stops the page from refreshing
    e.preventDefault();
    if (
      !form.title ||
      !form.desc ||
      !form.ingredients ||
      !form.instructions
    ) {
      alert("please fill in all fields")
      return
    }

    addDoc(recipeCollectionRef, form)

    // After the user submits the form, reset the form to empty
    setForm({
      title: "",
      desc: "",
      ingredients: [],
      instructions: []
    })

    setPopupActive(false);
  }

  const handleIngredient = (e,i) => {
    const ingredientsClone = [...form.ingredients];
    ingredientsClone[i] = e.target.value;

    setForm({
      ...form,
      ingredients:ingredientsClone
    })
  }

  const handleInstruction = (e,i) => {
    const instructionsClone = [...form.instructions];
    instructionsClone[i] = e.target.value;

    setForm({
      ...form,
      instructions:instructionsClone
    })
  }

  const handleIngredientCount = () => {
    setForm({
      ...form,
      ingredients: [...form.ingredients, ""]
    })
  }

  const handleInstructionCount = () => {
    setForm({
      ...form,
      instructions: [...form.instructions, ""]
    })
  }

  const removeRecipe = id => {
    deleteDoc(doc(db, "recipes", id));
  }

  // For retrieve data from firestore
  const [search, setSearch] = useState("");
  const [filteredContacts, setFilteredContacts] = useState([]);

  useEffect(() => {
    setFilteredContacts(
        recipes.filter(
        (recipe) => {
          if (recipe.title.toLowerCase().includes(search.toLowerCase())) {
            recipe.selected = false;
            return true;
          }
          recipe.selected = false;
          return false;
        })
    );
  }, [search, recipes]);

  return (
    <div className="App">
      <h1>My Recipe Collection</h1>

      <div>
        <input
          type="text"
          placeholder="Search"
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <button onClick={() => setPopupActive(!popupActive)}>Add Recipe</button>

      <div className="recipes">
        { filteredContacts.map((recipe, i) => (
            <div className="recipe" key={recipe.id}>
              <h3>{ recipe.title }</h3>
              <p dangerouslySetInnerHTML={{ __html:recipe.desc }}></p>

              { recipe.viewing && <div>
                <h4>Ingredients</h4>
                <ul>
                  { recipe.ingredients.map((ingredient, i) => (
                    <li key={i}>{ ingredient }</li>
                  ))}
                </ul>

                <h4>Instructions</h4>
                <ol>
                  { recipe.instructions.map((instruction, i) => (
                    <li key={i}>{ instruction }</li>
                  ))}
                </ol>
              </div>}

              <div className="buttons">
                <button onClick={() => handleView(recipe.id)}>View { recipe.viewing ? "less" : "more" }</button>
                <button className="remove" onClick={() => removeRecipe(recipe.id)}>Remove</button>
              </div>


            </div>
          ))}
      </div>

      { popupActive && <div className="popup">
        <div className="popup-inner">
          <h2>Add a new recipe</h2>
          <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Title</label>
            <input 
              type="text" 
              value={form.title} 
              onChange={e => setForm({...form, title:e.target.value})} />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea 
              type="text" 
              value={form.desc} 
              onChange={e => setForm({...form, desc:e.target.value})} />
          </div>

          <div className="form-group">
            <label>Ingredients</label>
            {
              form.ingredients.map((ingredient, i) => (
                <input 
                  type="text"
                  key={i} 
                  value={ingredient} 
                  onChange={e => handleIngredient(e,i)} />
              ))
            }
            <button type="button" onClick={handleIngredientCount}>Add Ingredient</button>
          </div>

          <div className="form-group">
            <label>Instructions</label>
            {
              form.instructions.map((instruction, i) => (
                <textarea 
                  type="text"
                  key={i} 
                  value={instruction} 
                  onChange={e => handleInstruction(e,i)} />
              ))
            }
            <button type="button" onClick={handleInstructionCount}>Add Instruction</button>
          </div>

          <div className="buttons">
            <button type="submit">Submit</button>
            <button type="button" className="remove" onClick={() => setPopupActive(false)}>Close</button>
          </div>

          </form>
          </div>
        </div>}
    </div>
  );
}

export default App;