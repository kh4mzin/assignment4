const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const app = express();
const path = require('path');
const { UserModel, LogsModel, UserIpModel, SuperheroModel } = require('./database');
const { getNewsByCity, fetchMarvelCharacter, getComics} = require('./api');
const { TimeString, GetUSER } = require('./utils');
const {router} = require("express/lib/application");
const PORT = process.env.PORT
app.set('views', path.join(__dirname, 'views'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('trust proxy', true)

async function getUserInstance(ip) {
    let username = await UserIpModel.findOne({ ip: ip }).exec();
    username = username ? username.user : null;

    let userInstance = null;
    if (username) {
        userInstance = await UserModel.findOne({ _id: username }).exec();
    }

    return userInstance;
}
// Index page
app.get('/', async (req, res) => {
    const user = await getUserInstance(req.ip);

    res.render('pages/index.ejs', { activePage: "home", user: user ? user : null, error: null });
});

// History page
app.get("/history", async (req, res) => {
    const user = await getUserInstance(req.ip);
    if (!user) {
        return res.status(303).redirect("/login");
    }

    const logs = await LogsModel.find({ user: user._id }).sort({ _id: -1 }).exec();
    res.render('pages/history.ejs', { activePage: "history", user: user, logs: logs, error: logs ? null : "No logs found"});
});

app.get("/history/:objectId", async (req, res) => {
    const user = await getUserInstance(req.ip);
    if (!user) {
        return res.status(303).redirect("/login");
    }
    const objectId = req.params.objectId;
    const log = await LogsModel.findById(objectId).exec();
    try {
        if (!log) {
            return res.status(404).send("Log not found");
        }

        res.json(JSON.parse(log.response_data));
    } catch (error) {
        res.status(200).json({ data: log.response_data })
    }
});

app.get("/history/:objectId/delete", async (req, res) => {
    const user = await getUserInstance(req.ip);
    if (!user) {
        return res.status(303).redirect("/search");
    }

    const objectId = req.params.objectId;

    await LogsModel.findByIdAndDelete(objectId).exec();
    res.status(303).redirect("/history");
});

// Admin page
app.get("/admin", async (req, res) => {
    const user = await getUserInstance(req.ip);

    if (!user || !user.is_admin) {
        return res.status(303).redirect("/");
    }

    const allUsers = await UserModel.find().exec();

    res.render('pages/admin.ejs', { activePage: "admin", user: user, users: allUsers });
});

app.get("/admin/:userid/delete", async (req, res) => {
    const user = await getUserInstance(req.ip);

    if (!user || !user.is_admin) {
        return res.status(403).redirect("/login");
    }

    const userId = req.params.userid;

    await UserModel.findByIdAndDelete(userId).exec();
    res.status(202).redirect("/admin");
});

app.get("/admin/:userid/makeAdmin", async (req, res) => {
    const user = await getUserInstance(req.ip);

    if (!user || !user.is_admin) {
        return res.status(403).redirect("/login");
    }

    const userId = req.params.userid;

    await UserModel.findByIdAndUpdate(userId, { is_admin: true }).exec();
    res.status(202).redirect("/admin");
});

app.post("/admin/addUser", async (req, res) => {
    const { username, email, password, is_admin } = req.body;
    const user = await getUserInstance(req.ip);

    if (!user || !user.is_admin) {
        return res.status(403).redirect("/login");
    }

    const userInstance = new UserModel({ username: username, email: email, password: password, is_admin: is_admin === "on" });
    await userInstance.save();

    res.status(202).redirect("/admin");
});

app.get("/admin/:username", async (req, res) => {
    const username = req.params.username;
    const user = await UserModel.findOne({ username: username }).exec();
    const history = await LogsModel.find({ user: user._id }).sort({ _id: -1 }).exec();

    res.render('pages/admin_user.ejs', { activePage: "admin", user: user, logs: history, error: history ? null : "No logs found"});
});

app.post('/admin/updateUser', async (req, res) => {
    const { userId, username, email, password } = req.body;
    await UserModel.findByIdAndUpdate(userId, { username, email, password });

    res.redirect('/admin');
});

// News page


app.use(bodyParser.urlencoded({ extended: true }));

app.get('/superheroes', async (req, res) => {
    const user = await getUserInstance(req.ip);
    if (!user) {
        return res.status(303).redirect("/login");
    }
    try {
        const query = req.query.character || 'Iron Man'; // Default to Iron Man if no query provided
        const characterData = await fetchMarvelCharacter(query);
        res.render('pages/superheroes.ejs', {activePage: "superheroes", user: user, data: characterData, error: null});
    } catch (error) {
        res.status(500).render('error', { message: 'Error fetching data' });
    }
});
app.get('/comics', async (req, res) => {
    const user = await getUserInstance(req.ip);
    if (!user) {
        return res.status(303).redirect("/login");
    }
    try {

        const comicsData = await getComics();
        // Shuffle comicsData array to get random comics
        comicsData.sort(() => Math.random() - 0.5);
        res.render('pages/comics.ejs', { activePage: "comics", user: user, data: comicsData, error: null });
    } catch (error) {
        console.error("Error fetching comics data:", error);
        res.status(500).render('error', { message: 'Error fetching comics data' });
    }
});

// Login page
app.get("/login", async (req, res) => {
    const user = await getUserInstance(req.ip);
    if (user) {
        return res.status(303).redirect("/");
    }

    res.render('pages/login.ejs', { activePage: "login", error: null, user: null });
});

app.post("/login", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
        res.render('pages/login.ejs', { activePage: "login", error: "All fields are required", user: null });
        return;
    }

    let userInstance = await UserModel.findOne({ username: username }).exec();

    if (!userInstance) {
        res.render('pages/login.ejs', { activePage: "login", error: "User does not exist", user: null });
        return;
    }

    if (!(await userInstance.comparePassword(password))) {
        LogsModel.create({ user: userInstance._id, request_type: "login", request_data: username, status_code: "401", timestamp: new Date(), response_data: "wrong candidate password"});
        res.render('pages/login.ejs', { activePage: "login", error: "Password is incorrect", user: null });
        return;
    }


    await UserIpModel.create({ ip: req.ip, user: userInstance._id });
    res.status(303).redirect("/");
    LogsModel.create({ user: userInstance._id, request_type: "login", request_data: username, status_code: "200", timestamp: new Date(), response_data: "success"});
});

// Signup page
app.get("/signup", async (req, res) => {
    const user = await getUserInstance(req.ip);
    if (user) {
        return res.status(303).redirect("/");
    }

    res.render('pages/signup.ejs', { activePage: "signup", error: null, user: null });
});

app.post("/signup", async (req, res) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;

    if (!username || !email || !password) {
        res.render('pages/signup.ejs', { activePage: "signup", error: "All fields are required", user: null });
        return;
    }

    let userInstance = await UserModel.findOne({ username: username }).exec();

    if (userInstance) {
        res.render('pages/signup.ejs', { activePage: "signup", error: "User already exists", user: null });
        return;
    }

    userInstance = new UserModel({ username: username, email: email, password: password });
    await userInstance.save();

    await UserIpModel.create({ ip: req.ip, user: userInstance._id });
    res.status(303).redirect("/");
    LogsModel.create({ user: userInstance._id, request_type: "signup", request_data: username, status_code: "200", timestamp: new Date(), response_data: "success"});
});



//NEW
app.get("/addSuperheroe", async (req, res) => {
    const user = await getUserInstance(req.ip);

    if (!user || !user.is_admin) {
        return res.status(303).redirect("/");
    }
    ;

    const allSuperheroes = await SuperheroModel.find().exec();

    res.render('pages/createSupw.ejs', { activePage: "admin_superheroes", user: user, superheroes: allSuperheroes,  error: null});
});

app.post("/addSuperhero", async (req, res) => {
    const user = await getUserInstance(req.ip);

    if (!user || !user.is_admin) {
        return res.status(303).redirect("/");
    }

    try {
        const superheroData = req.body;
        const newSuperhero = await SuperheroModel.create(superheroData);
        res.redirect("/showSup");
    } catch (error) {
        console.error("Error adding superhero:", error);
        res.status(500).send("Error adding superhero");
    }
});

app.get("/showSup", async (req, res) => {
    try {
        const user = await getUserInstance(req.ip);

        // Fetch all superheroes from the database
        const superheroes = await SuperheroModel.find().exec();
        // Render the show.ejs template with the fetched superheroes data
        res.render("pages/showSup.ejs", { superheroes: superheroes, activePage: "showSup", error: null, user: user });
    } catch (error) {
        console.error("Error fetching superheroes:", error);
        res.status(500).send("Error fetching superheroes");
    }
});

app.get("/superheroes_admin", async (req, res) => {
    try {
        const user = await getUserInstance(req.ip);
        if (user && user.is_admin) {
            // Fetch all superheroes from the database without their photos
            const superheroes = await SuperheroModel.find({}, { images: 0 }).exec();
            // Render the admin_superheroes.ejs template with the fetched superheroes data
            return res.render("pages/admin_superheroes.ejs", { superheroes: superheroes, activePage: "adminSup", error: null, user: user });
        } else {
            return res.status(303).redirect("/");
        }
    } catch (error) {
        console.error("Error fetching superheroes:", error);
        res.status(500).send("Error fetching superheroes");
    }

});


// Route to handle the submission of the superhero edit form
app.post("/updateSuperhero/:id", async (req, res) => {
    try {
        const superheroId = req.params.id;
        const updatedData = req.body;
        await SuperheroModel.findByIdAndUpdate(superheroId, updatedData).exec();
        res.redirect("/showSup");
    } catch (error) {
        console.error("Error updating superhero:", error);
        res.status(500).send("Error updating superhero");
    }
});

// Route to handle the deletion of a superhero
app.post("/deleteSuperhero/:id", async (req, res) => {
    try {
        const superheroId = req.params.id;
        await SuperheroModel.findByIdAndDelete(superheroId).exec();
        res.redirect("/showSup");
    } catch (error) {
        console.error("Error deleting superhero:", error);
        res.status(500).send("Error deleting superhero");
    }
});


// Logout logic
app.get("/logout", async (req, res) => {
    await UserIpModel.findOneAndDelete({ ip: req.ip }).exec();
    res.status(303).redirect("/");
    LogsModel.create({ user: null, request_type: "logout", request_data: null, status_code: "200", timestamp: new Date(), response_data: "success"});
});

app.listen(PORT, () => {
    console.log('Server is running on' + PORT);
});
