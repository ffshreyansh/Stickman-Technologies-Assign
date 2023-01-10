const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');
const bodyParser = require("body-parser");
const { default: puppeteer } = require("puppeteer");
const app = express();
const MongoClient = require('mongodb').MongoClient;
let token = 10000;
app.use(bodyParser.urlencoded({ extended: false }));
const uri = process.env.MONGO_URL ||"mongodb+srv://stickman:shreyansh@stickman.jtwgqqr.mongodb.net/?retryWrites=true&w=majority"




//Passport Config
require("./config/passport")(passport);


const PORT = process.env.PORT || 5000;
app.use(express.static("public"));

mongoose.set("strictQuery", false);


//DB config
const db = require('./config/keys').mongoURI

//Connect to mongo
mongoose.connect(db, {useNewUrlParser: true})
    .then(() => console.log("MongoDB mogoose connected.."))
    .catch(err => console.log(err));
    
//EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');

//BodyParse
app.use(express.urlencoded({extended: true}))

//Express Session
app.use(session({
    secret: "secret",
    resave: true,
    saveUninitialized: true
}))

//Passport middleware
app.use(passport.initialize());
app.use(passport.session()); 

//flash
app.use(flash());

//Global Variables
app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg");
    res.locals.error_msg = req.flash("error_msg");
    res.locals.error = req.flash("error");
    next();
});


//Routes
app.use('/', require("./routes/index.js"));
app.use('/users', require("./routes/users.js"));

//Changing var name
const mongooseConnection = mongoose.connection;
//Pushing the Data into Mongo DB ====================================================================

mongooseConnection.on('error', console.error.bind(console, 'connection error:'));
mongooseConnection.once('open', function() {
  console.log('Connected to MongoDB Atlas...');
});
const userSchema = new mongoose.Schema({
  name: String,
  number: [String]
});

const User1 = mongoose.model('User1', userSchema);

app.post('/', function (req, res) {

  const name = req.body.name;
  const number = req.body.number;
  const data = number.split(',');

  let num = [];
  data.forEach(number => {
    num.push(number + " - " + token++);
  });

  User1.findOne({ name: name }, function (err, result) {
    if (err) {
      console.log(err);
    }

    if (result) {
      res.send("Data Already Exists with the Same Name!");
    } else {

      // Insert the data into the database
      const user = new User1({ name: name, number: num });
      user.save((err, result) => {
        if (err) {
          console.log(err);
        }
        console.log('Data added to the collection');
        res.redirect('/success');
      });
    }
  });

  app.post('/pdf/filtered', async (req, res) => {
    // Get the filter criteria from the query parameter
    const filter = {name: req.body.name};
  
    // Find the documents that match the filter criteria
    const data = await User1.find(filter);
  
    // Generate the PDF as before
    const html = `
      <html>
        <body>
          <h1>Data from the database</h1>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Number</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(row => `
                <tr>
                   <td>${row.name}</td>
                   <td>${row.number}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html);
    const buffer = await page.pdf({ format: 'A4' });
    await browser.close();
  
    // Send the PDF to the client
    res.setHeader('Content-Type', 'stickman/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="stickman.pdf"');    
    res.send(buffer);
  });



        // Using Puppeteer for Admin's PDF generation==================================================================

        app.post('/pdf/admin', async (req, res) => {
          // Find all documents in the collection
          const data = await User1.find();
          // Generating HTML for the PDF
          const html = `
<html>
  <body>
    <h1>Data from the database</h1>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Number</th>
        </tr>
      </thead>
      <tbody>
        ${data.map(row => `
          <tr>
            <td>${row.name}</td>
            <td>${row.number}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </body>
</html>
`;
          // Generating PDF
          const browser = await puppeteer.launch();
          const page = await browser.newPage();
          await page.setContent(html);
          const buffer = await page.pdf({ format: 'A4' });
          await browser.close();
          // Send the PDF to the client
          res.setHeader('Content-Type', 'stickmanAdmin/pdf');
          res.setHeader('Content-Disposition', 'attachment; filename="stickmanAdmin.pdf"');
          res.send(buffer);
      });

    

})







    // app.get('/success', (req, res) => {
    //     res.sendFile(__dirname + '/success.html');
    // });


    // app.get('/', (req, res) => {
    //     res.sendFile(__dirname + "/dashboard.ejs")
    // })





app.listen(PORT, console.log(`Server started on port ${PORT}`));


process.on('SIGINT', () => {
    client.close();
    console.log('Disconnected from MongoDB');
    process.exit(0);
});