import './App.css';
import { db } from "./firebase.config";
import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";

function App() {
  const [recipes, setRecipes] = useState([]);
  const [form, setForm] = useState({
    title: "",
    desc: "",
    avgRating: 0.0,
    numRatings: 0,
    ingredients: [],
    instructions: []
  });
  const [popupActive, setPopupActive] = useState(false);

  const recipeCollectionRef = collection(db, "recipes");

  useEffect(() => {
    const q = query(recipeCollectionRef, orderBy("avgRating", "desc"));
    onSnapshot(q, snapshot => {
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

    form.numRatings = 0;
    form.avgRating = 0.0;

    addDoc(recipeCollectionRef, form)

    // After the user submits the form, reset the form to empty
    setForm({
      title: "",
      desc: "",
      numRatings: 0,
      avgRating: 0.0,
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

  // For rating system
  const handleRating = (e, id, ratingForm) => {
    e.preventDefault();
    if (!ratingForm.rate) {
      alert("please provide a valid rating (0-10)")
      return
    }

    // Stops the page from refreshing
    recipes.forEach(recipe => {
      if (recipe.id === id) {
        const curDocRef = doc(db, "recipes", id);
        const newNumRatings = recipe.numRatings + 1;
        const newAvgRating = ((recipe.avgRating * recipe.numRatings + parseFloat(ratingForm.rate)) / newNumRatings); // this calculation is not right, need to figure out

        updateDoc(curDocRef, {
          "numRatings": newNumRatings,
          "avgRating": newAvgRating
        });
        return;
      }
    })
  }

  // For retrieve data from firestore
  const [search, setSearch] = useState("");
  const [filteredRecipes, setFilteredRecipes] = useState([]);

  useEffect(() => {
    setFilteredRecipes(
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

  const Recipe = ({recipe, i}) => {
    const [popupRatingActive, setPopupRatingActive] = useState(false);
    return(
      <div className="recipe" key={recipe.id}>
        <h3>{ recipe.title }</h3>
        <p dangerouslySetInnerHTML={{ __html:recipe.desc }}></p>
        <h4>Rating</h4>
        <p>{ recipe.avgRating }</p>

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
          <button className="rate" onClick={() => {
            setPopupRatingActive(!popupRatingActive)}
            }>Rate this recipe</button>
        </div>

        { popupRatingActive && <Popup recipeId={recipe.id} recipeTitle={recipe.title} setPopupRatingActive={setPopupRatingActive}/> }
      </div>
    )
  }

  const Popup = ({recipeId, recipeTitle, setPopupRatingActive}) => {
    const [ratingForm, setRatingForm] = useState({
      rate: 0
    });
    return(
      <div className="popup">
          <div className="popup-inner">
            <h2>Add a new rating to { recipeTitle }</h2>
            <form onSubmit={(e) => {
              handleRating(e, recipeId, ratingForm);
            }}>
              <div className="form-group">
                <label>Rate</label>
                <input 
                  type="text" 
                  value={ratingForm.rate} 
                  onChange={e => setRatingForm({...ratingForm, rate:e.target.value})} />
              </div>
              <div className="buttons">
                <button type="submit">Submit</button>
                {<button type="button" className="remove" onClick={() => setPopupRatingActive(false)}>Cancel</button>}
              </div>
            </form>
          </div>
      </div>
    )
  }

  const addRecipePopup = () => {
    return ( popupActive && 
    <div className="popup">
    <div className="popup-inner">
      <h2>Add a new recipe</h2>
      <form onSubmit={(e) => {
        handleSubmit(e)
        }}>

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
        <button type="button" className="remove" onClick={() => setPopupActive(false)}>Cancel</button>
      </div>

      </form>
      </div>
    </div>)
  }

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
        { filteredRecipes.map((recipe, i) => <Recipe recipe={recipe} i={i}/>)}
      </div>

      <div className="recipes">
        { addRecipePopup() }
      </div>
    </div>
  );
}

export default App;