const express = require("express");
const bodyParser = require("body-parser");
const app = express();

const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://stickman:shreyansh@stickman.jtwgqqr.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true });


let token = 10000;
app.use(bodyParser.urlencoded({ extended: false }));




app.get('/', (req, res)=>{
    res.sendFile(__dirname + "/login.html")
})

client.connect(err => {
    const collection = client.db("test").collection("devices");
    // perform actions on the collection object
    client.close();
  });


app.post('/', function(req, res) {

    // Get the name and number from the request body
    
    const name = req.body.name;
    const number = req.body.number;
    const data = number.split(',');
    console.log(name);
    data.forEach(number => {
        console.log(number + " - " + token++);
        
    });
  });
  

app.listen(3000, function(res, req){
    console.log("Server connected");
})