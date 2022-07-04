import './App.css';
import { db } from "./firebase.config";
import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  doc,
  addDoc,
  getDoc,
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
    cuisine: "",
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
      !form.cuisine ||
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
      cuisine: "",
      numRatings: 0,
      avgRating: 0.0,
      ingredients: [],
      instructions: []
    })

    setPopupActive(false);
  }

  const handleIngredient = (e,i,form) => {
    const ingredientsClone = [...form.ingredients];
    ingredientsClone[i] = e.target.value;

    setForm({
      ...form,
      ingredients:ingredientsClone
    })
  }

  const handleInstruction = (e,i,form) => {
    const instructionsClone = [...form.instructions];
    instructionsClone[i] = e.target.value;

    setForm({
      ...form,
      instructions:instructionsClone
    })
  }

  const handleIngredientCount = (form) => {
    setForm({
      ...form,
      ingredients: [...form.ingredients, ""]
    })
  }

  const handleInstructionCount = (form) => {
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

  const handleUpdate = (e, id, updateForm) => {
    // Stops the page from refreshing
    e.preventDefault();
    if (
      !updateForm.title ||
      !updateForm.desc ||
      !updateForm.cuisine
    ) {
      alert("please fill in all fields")
      return
    }

    recipes.forEach(recipe => {
      if (recipe.id === id) {
        const curDocRef = doc(db, "recipes", id);

        updateDoc(curDocRef, {
          "title": updateForm.title,
          "desc": updateForm.desc,
          "cuisine": updateForm.cuisine
        });
        return;
      }
    })
  }

  // For retrieve data from firestore
  const [search, setSearch] = useState("");
  const [cuisineFilter, setCuisineFilter] = useState("");
  const [filteredRecipes, setFilteredRecipes] = useState([]);

  useEffect(() => {
    setFilteredRecipes(
        recipes.filter(
        (recipe) => {
          if (recipe.title.toLowerCase().includes(search.toLowerCase()) &&
              recipe.cuisine.toLowerCase().includes(cuisineFilter.toLowerCase())) {
            return true;
          }
          return false;
        })
    );
  }, [search, cuisineFilter, recipes]);

  const Recipe = ({recipe, i}) => {
    const [popupRatingActive, setPopupRatingActive] = useState(false);
    const [popupUpdateActive, setPopupUpdateActive] = useState(false);
    return(
      <div className="recipe" key={recipe.id}>
        <h3>{ recipe.title }</h3>
        <p dangerouslySetInnerHTML={{ __html:recipe.desc }}></p>
        <h4>Cuisine: { recipe.cuisine }</h4>
        <h4>Rating: { recipe.avgRating }</h4>

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
          <button className="update" onClick={() => setPopupUpdateActive(!popupUpdateActive)}>Update</button>
          <button className="rate" onClick={() => {
            setPopupRatingActive(!popupRatingActive)}
            }>Rate this recipe</button>
        </div>

        { popupUpdateActive && <UpdatePopup id={recipe.id} setPopupUpdateActive={setPopupUpdateActive}/> }
        { popupRatingActive && <RatingPopup recipeId={recipe.id} recipeTitle={recipe.title} setPopupRatingActive={setPopupRatingActive}/> }
      </div>
    )
  }

  const RatingPopup = ({recipeId, recipeTitle, setPopupRatingActive}) => {
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

  const UpdatePopup = ({id, setPopupUpdateActive}) => {
    var prevTitle = "";
    var prevDesc = "";
    var prevCuisine = "";
    recipes.forEach(recipe => {
      if (recipe.id === id) {
        prevTitle = recipe.title;
        prevDesc = recipe.desc;
        prevCuisine = recipe.cuisine;
      }
    })

    const [updateForm, setUpdateForm] = useState({
      title: prevTitle,
      desc: prevDesc,
      cuisine: prevCuisine,
    });

    return (
    <div className="popup">
    <div className="popup-inner">
      <h2>Update recipe</h2>
      <form onSubmit={(e) => {
        handleUpdate(e, id, updateForm);
        setPopupUpdateActive(false);
        }}>

      <div className="form-group">
        <label>Title</label>
        <input 
          type="text" 
          value={updateForm.title} 
          onChange={e => setUpdateForm({...updateForm, title:e.target.value})} />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea 
          type="text" 
          value={updateForm.desc} 
          onChange={e => setUpdateForm({...updateForm, desc:e.target.value})} />
      </div>

      <div className="form-group">
        <label>Cuisine</label>
        <textarea 
          type="text" 
          value={updateForm.cuisine} 
          onChange={e => setUpdateForm({...updateForm, cuisine:e.target.value})} />
      </div>
      <div className="buttons">
        <button type="submit">Submit</button>
        <button type="button" className="remove" onClick={() => setPopupUpdateActive(false)}>Cancel</button>
      </div>

      </form>
      </div>
    </div>)
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
        <label>Cuisine</label>
        <input 
          type="text" 
          value={form.cuisine} 
          onChange={e => setForm({...form, cuisine:e.target.value})} />
      </div>

      <div className="form-group">
        <label>Ingredients</label>
        {
          form.ingredients.map((ingredient, i) => (
            <input 
              type="text"
              key={i} 
              value={ingredient} 
              onChange={e => handleIngredient(e,i,form)} />
          ))
        }
        <button type="button" onClick={e => handleIngredientCount(form)}>Add Ingredient</button>
      </div>

      <div className="form-group">
        <label>Instructions</label>
        {
          form.instructions.map((instruction, i) => (
            <textarea 
              type="text"
              key={i} 
              value={instruction} 
              onChange={e => handleInstruction(e,i,form)} />
          ))
        }
        <button type="button" onClick={e => handleInstructionCount(form)}>Add Instruction</button>
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

      <div className="cuisine">
        <input
          type="text"
          placeholder="All cuisine"
          onChange={(e) => setCuisineFilter(e.target.value)}
        />
      </div>

      <div>
        <input
          type="text"
          placeholder="Ingredient in mind"
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