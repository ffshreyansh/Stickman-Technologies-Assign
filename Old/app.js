const express = require("express");
const bodyParser = require("body-parser");
const { default: puppeteer } = require("puppeteer");
const app = express();
const MongoClient = require('mongodb').MongoClient;
let token = 10000;
app.use(bodyParser.urlencoded({ extended: false }));
const uri = "mongodb+srv://stickman:shreyansh@stickman.jtwgqqr.mongodb.net/?retryWrites=true&w=majority";



//Pushing the Data into Mongo DB ====================================================================

MongoClient.connect(uri, { useNewUrlParser: true }, function (err, client) {
    if (err) {
        console.log('Error occurred while connecting to MongoDB Atlas...\n', err);
    }
    console.log('Connected...');
    const db = client.db('stickman');

    app.post('/', function (req, res) {

        const name = req.body.name;
        const number = req.body.number;
        const data = number.split(',');

        let num = [];
        data.forEach(number => {
            num.push(number + " - " + token++);
        });

        db.collection('users').findOne({ name: name }, function (err, result) {
            if (err) {
                console.log(err);
            }
            // If a document with the same name already exists, return an error
            if (result) {
                res.send("Data Already Exists with the Same Name!");
            } else {

                // Insert the data into the database
                db.collection('users').insertOne({ name: name, number: num }, function (err, result) {
                    if (err) {
                        console.log(err);
                    }
                    console.log('Data added to the collection');
                    res.redirect('/success');
                });
            }
        });

    });
        //Using Puppeteer to Generate Name Filtered PDF=====================================

        app.post('/pdf/filtered', async (req, res) => {
            // Get the filter criteria from the query parameter
            const filter = {name: req.body.name};
          
            // Find the documents that match the filter criteria
            const collection = db.collection('users');
            const data = await collection.find(filter).toArray();
          
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

            const collection = db.collection('users');
            // const filter = { name: 'c' };
            // const data = await collection.find(filter).toArray();
            const data = await collection.find().toArray();

            //HTML for the PDF
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

            //Generating PDF
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.setContent(html);
            const buffer = await page.pdf({ format: 'A4' });
            await browser.close();

            //Send the PDF to the Client
            res.setHeader('Content-Type', 'stickmanAdmin/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="stickmanAdmin.pdf"');
            res.send(buffer);

        });


    

})







    app.get('/success', (req, res) => {
        res.sendFile(__dirname + '/success.html');
    });


    app.get('/', (req, res) => {
        res.sendFile(__dirname + "/login.html")
    })











    app.listen(3000, function (res, req) {
        console.log("Server connected");
    })

    process.on('SIGINT', () => {
        client.close();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    });

