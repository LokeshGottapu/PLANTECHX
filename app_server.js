const api_model = require("./model.js");

const express = require("express");
const cors = require("cors");

const app = express();

const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({ extended: false });
app.use(urlencodedParser);
app.use(express.json());

app.use(
    cors({
        origin: "*"
    })
);


app.get("/users", async (req, res) => {

    try {

        const users = await api_model.getUsers();
        console.log(users);

        res.status(200).json({
            users: users
        });

    }
    catch (err) {
        console.error(`Error in fetching users:`, err);
        res.status(500).json({ message: `An error occured while fetching for users.` });
    }

});

app.get("/users", async (req, res) => {

    let { page, limit } = req.query;

    // Convert page & limit to numbers and set defaults
    page = parseInt(page) || 1;  // Default page = 1
    limit = parseInt(limit) || 5; // Default limit = 5

    // Calculate start and end index
    const OFFEST = (page - 1) * limit;
    const LIMT = OFFEST + limit;

    try {

        const users = await api_model.getUsers(OFFEST, LIMT);
        console.log(users);

        // Response with pagination details
        res.status(200).json({
            totalUsers: users.length,
            totalPages: Math.ceil(users.length / limit),
            currentPage: page,
            pageSize: limit,
            users: users
        });

    }
    catch (err) {
        console.error(`Error in fetching users:`, err);
        res.status(500).json({ message: `An error occured while fetching for users.` });
    }

});

app.post("/user", async (req, res) => {

    let userData = req.body;

    try {

        Object.keys(userData).forEach(key => {
            if (typeof userData[key] === "string") {
                userData[key] = userData[key].trim();
            }
        });

        var fields = Object.entries(userData).map(([key, value]) => ({ key, value }));

        var values = [];
        fields.forEach(function valuesFunction(value) {
            values.push(value.value);
        });

        const user = await api_model.postUser(fields, values);
        console.log("user:", user);

        if (user.affectedRows !== 0) {
            let insertId = user.insertId;
            res.status(201).json({
                message: `A new user was added`,
                userId: insertId
            });
        }

    } catch (err) {
        console.error(`Failed to add user:`, err);
        res.status(500).json({ message: "An error occured while adding a new user" });
    }

});

app.get("/users/:userId", async (req, res) => {

    let userId = Number(req.params.userId);

    if (!Number.isInteger(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
    }

    try {

        const user = await api_model.getUser(userId);
        console.log("User Data:", user);

        if (user.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);

    } catch (err) {
        console.error("Database query error:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }

});

app.put("/users/:userId", async (req, res) => {

    let userId = Number(req.params.userId);

    if (!Number.isInteger(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
    }

    try {

        let userData = req.body;
        
        Object.keys(userData).forEach(key => {
            if (typeof userData[key] === "string") {
                userData[key] = userData[key].trim();
            }
        });

        var fields = Object.entries(userData).map(([key, value]) => ({ key, value }));

        var values = [];
        // var VALUES = [];

        fields.forEach(function valuesFunction(value) {
            values.push(value.value);
        });
        // values.push(VALUES);

        const putUser = await api_model.putUser(userId, fields, values);

        if (putUser.affectedRows !== 0) {
            console.log(`User wth ID: ${userId} updated successfully`);
            return res.status(200).json({ message: `User wth ID: ${userId} updated successfully` });
        } else {
            return res.status(404).json({ message: "User not found" });
        }

    } catch (err) {
        console.error(`Error updating user with ID ${userId}:`, err);
        return res.status(500).json({ message: "An error occurred while updating the user." });
    }

});

app.delete("/users/:userId", async (req, res) => {

    let userId = Number(req.params.userId);

    if (!Number.isInteger(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
    }

    try {

        const deleteUser = await api_model.deleteUser(userId);

        if (deleteUser.affectedRows !== 0) {
            res.status(200).json({ message: `User with ID: ${userId} deleted successfully` });
        }
        else {
            res.status(404).json({ message: "User not found" });
        }

    } catch (err) {
        console.error(`Error deleting blog with ID ${userId}:`, err);
        res.status(500).json({ message: "An error occurred while deleting the blog" });
    }

});




app.listen(5000, () => {
    console.log(`server is listening at port number 5000.`);
});