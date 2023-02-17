const express = require("express");
const app = express();

let chrome = {};
let puppeteer;

if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
  chrome = require("chrome-aws-lambda");
  puppeteer = require("puppeteer-core");
} else {
  puppeteer = require("puppeteer");
}

app.listen(process.env.PORT || 3000, () => {
  console.log("Server started");
});

app.use(express.static("public"));

app.get("/get-lead-information", (req, res) => {
  if (req.query.token !== "wn^$$5SU6a972YvG") {
    res.send("Not authorized");
  }

  let leadNumber = req.query.leadNumber;
  const url = "https://partners.softwareconnect.com/#/lead/" + leadNumber;

  const username = req.query.username;
  const password = req.query.password;

  let pageData = "";

  (async () => {
    // Launch a headless web browser
    let options = {};

    if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
      options = {
        args: [...chrome.args, "--hide-scrollbars", "--disable-web-security"],
        defaultViewport: chrome.defaultViewport,
        executablePath: await chrome.executablePath,
        headless: true,
        ignoreHTTPSErrors: true,
      };
    }

    const browser = await puppeteer.launch(options);

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
