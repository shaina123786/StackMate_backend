const express = require('express');

const app = express();

app.use("/test", (req, res) => {
    res.send("hello test")
});
//get->it can only handle get call
app.get("/user", (req, res) => {
    res.send({name:"shaina"});
});


app.post("/user", (req, res) => {
    res.send("save data");
});
app.delete("/user", (req, res) => {
    res.send("delete successfully")
});

//use->it can handle all http method api call (get,post give same result) /hello/j
app.use("/hello/j", (req, res) => {
    res.send("helloascas")
});
app.use("/test", (req, res) => {
    res.send("hello test")
});

app.use("/",(req, res) => {            //route handler( fisrt route ->this route overwrite every route and we give other route no work) code seq matter if we put / on the lst then it run on the lst
    res.send("hello");
});
app.listen(3000, () => {
    console.log("running on port 3000")
});