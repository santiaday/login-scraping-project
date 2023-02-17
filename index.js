const express = require("express");
const app = express();
const path = require("path");
const puppeteer = require("puppeteer");

app.listen(process.env.PORT || 3000);

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: path.join(__dirname, "public") });
});

app.get("/get-lead-information", (req, res) => {
  console.log(req.query.token);
  if (req.query.token !== "wn^$$5SU6a972YvG") {
    res.send("Not authorized");
  }

  let leadNumber = req.query.leadNumber;
  const url = "https://partners.softwareconnect.com/#/lead/" + leadNumber;

  const username = req.query.username;
  const password = req.query.password;

  console.log(username);
  console.log(password);
  let pageData = "";

  (async () => {
    // Launch a headless web browser
    const browser = await puppeteer.launch();

    // Open a new page and navigate to the login page
    const page = await browser.newPage();
    await page.goto(url);

    // Find the username and password input fields and fill them in
    await page.waitForSelector('input[name="EmailAddress"]');
    await page.type('input[name="EmailAddress"]', username);
    await page.waitForSelector('input[name="Password"]');
    await page.type('input[name="Password"]', password);

    // Find the login button and click it
    await page.waitForSelector('input[type="submit"]');
    await page.click('input[type="submit"]');

    // Wait for the page to load and then print the page content
    await page.waitForNavigation();
    pageData = await page.content();

    // Close the browser window
    await browser.close();
    res.json(pageData);
  })();
});

module.exports = app;
