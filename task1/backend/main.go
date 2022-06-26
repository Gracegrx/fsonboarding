package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"strconv"

	"cloud.google.com/go/datastore"
	"github.com/gorilla/mux"
)

func main() {
	dsRouters()
}

func dsRouters() {
	log.Println("Starting the HTTP server on port 8080")
	router := mux.NewRouter()
	router.HandleFunc("/",
		DSGetUsers).Methods("GET")
	router.HandleFunc("/users",
		DSGetUsers).Methods("GET")
	router.HandleFunc("/users",
		DSCreateUser).Methods("POST")
	router.HandleFunc("/users/{id}",
		DSGetUser).Methods("GET")
	router.HandleFunc("/users/{id}",
		DSUpdateUser).Methods("PUT")
	router.HandleFunc("/users/{id}",
		DSDeleteUser).Methods("DELETE")
	http.ListenAndServe(":8080",
		&CORSRouterDecorator{router})
}

// Get all users
func DSGetUsers(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	projID := "rx-dsmode"
	// [START datastore_build_service]
	ctx := context.Background()
	client, err := datastore.NewClient(ctx, projID)
	// [END datastore_build_service]
	if err != nil {
		log.Fatalf("Could not create datastore client: %v", err)
	}
	defer client.Close()
	var tasks []User

	// Create a query to fetch all Task entities, ordered by "created".
	query := datastore.NewQuery("Task")

	keys, err := client.GetAll(ctx, query, &tasks)
	if err != nil {
		fmt.Println(err)
	}

	// Set the id field on each Task from the corresponding key.
	for i, key := range keys {
		tasks[i].ID = strconv.FormatInt(key.ID, 10)
	}

	if err != nil {
		fmt.Println(err)
	}
	json.NewEncoder(w).Encode(tasks)
}

// Create user
func DSCreateUser(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	projID := "rx-dsmode"
	ctx := context.Background()
	client, err := datastore.NewClient(ctx, projID)
	if err != nil {
		log.Fatalf("Could not create datastore client: %v", err)
	}
	defer client.Close()

	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		panic(err.Error())
	}
	keyVal := make(map[string]string)
	json.Unmarshal(body, &keyVal)
	first_name := keyVal["firstName"]
	last_name := keyVal["lastName"]
	email := keyVal["email"]

	user := &User{
		FirstName: first_name,
		LastName:  last_name,
		Email:     email,
	}
	key := datastore.IncompleteKey("Task", nil)
	_, err = client.Put(ctx, key, user)
	if err != nil {
		panic(err.Error())
	}
}

// Get user by ID
func DSGetUser(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	projID := "rx-dsmode"
	ctx := context.Background()
	client, err := datastore.NewClient(ctx, projID)
	if err != nil {
		log.Fatalf("Could not create datastore client: %v", err)
	}
	defer client.Close()

	params := mux.Vars(r)
	var user []User

	// Create a query to fetch all Task entities, ordered by "created".
	intId, _ := strconv.ParseInt(params["id"], 10, 64)

	key := datastore.IDKey("Task", intId, nil)
	query := datastore.NewQuery("Task").Filter("__key__ =", key)

	_, err = client.GetAll(ctx, query, &user)
	if err != nil {
		fmt.Println(err)
	}
	json.NewEncoder(w).Encode(user[0])
}

// Update user
func DSUpdateUser(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	projID := "rx-dsmode"
	ctx := context.Background()
	client, err := datastore.NewClient(ctx, projID)
	if err != nil {
		log.Fatalf("Could not create datastore client: %v", err)
	}
	defer client.Close()
	params := mux.Vars(r)

	intId, _ := strconv.ParseInt(params["id"], 10, 64)
	key := datastore.IDKey("Task", intId, nil)

	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		panic(err.Error())
	}
	keyVal := make(map[string]string)
	json.Unmarshal(body, &keyVal)
	first_name := keyVal["firstName"]
	last_name := keyVal["lastName"]
	email := keyVal["email"]

	_, err = client.RunInTransaction(ctx, func(tx *datastore.Transaction) error {
		var user User
		if err := tx.Get(key, &user); err != nil {
			return err
		}
		user.FirstName = first_name
		user.LastName = last_name
		user.Email = email

		_, err := tx.Put(key, &user)
		return err
	})

	fmt.Fprintf(w, "User with ID = %s was updated",
		params["id"])
}

// Delete User
func DSDeleteUser(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	params := mux.Vars(r)
	projID := "rx-dsmode"
	ctx := context.Background()
	client, err := datastore.NewClient(ctx, projID)
	if err != nil {
		log.Fatalf("Could not create datastore client: %v", err)
	}
	defer client.Close()
	intId, _ := strconv.ParseInt(params["id"], 10, 64)
	err = client.Delete(ctx, datastore.IDKey("Task", intId, nil))
	if err != nil {
		panic(err.Error())
	}
	fmt.Fprintf(w, "User with ID = %s was deleted", params["id"])
}

/***************************************************/

type User struct {
	ID        string `json:"id"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Email     string `json:"email"`
}

/***************************************************/

// CORSRouterDecorator applies CORS headers to a mux.Router
type CORSRouterDecorator struct {
	R *mux.Router
}

func (c *CORSRouterDecorator) ServeHTTP(rw http.ResponseWriter,
	req *http.Request) {
	if origin := req.Header.Get("Origin"); origin != "" {
		rw.Header().Set("Access-Control-Allow-Origin", origin)
		rw.Header().Set("Access-Control-Allow-Methods",
			"POST, GET, OPTIONS, PUT, DELETE")
		rw.Header().Set("Access-Control-Allow-Headers",
			"Accept, Accept-Language,"+
				" Content-Type, YourOwnHeader")
	}
	// Stop here if its Preflighted OPTIONS request
	if req.Method == "OPTIONS" {
		return
	}

	c.R.ServeHTTP(rw, req)
}
