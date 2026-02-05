const express = require('express');

const app = express();


//req.query can give u info abt query param
app.get("/user", (req, res) => {
    res.send(req.query);
});

//dynamic route using /:
app.get("/user/:userid/:name", (req, res) => {
    res.send(req.params);
});

app.listen(3000, () => {
    console.log("running on port 3000")
});