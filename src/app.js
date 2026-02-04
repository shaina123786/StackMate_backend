const express = require('express');

const app = express();

app.use((req, res) => {            //req handler
    res.send("hello");
});

app.listen(3000, () => {
    console.log("running on port 3000")
});