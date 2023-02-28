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
  const url = "https://" + req.query.link + leadNumber;
  console.log(url);

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
    pageData = await page.evaluate(() => document.querySelector("*").outerHTML);
    let leadDescription = (await page.evaluate(
      () =>
        document.getElementsByClassName("specsheet-intro ng-binding")[0]
          .innerHTML
    )) || "";
    let companyName = (await page.evaluate(() =>
      document
        .querySelectorAll("ul.specsheet-answers-content li.ng-binding")[0]
        .innerHTML.split("</strong>")[1]
        .trim()
    )) || "";
    let location = (await page.evaluate(() =>
      document
        .querySelectorAll(
          "span[ng-bind-html='Lead.Referral.Match.Company.Location.Address | inlineAddress'] a"
        )[0]
        .innerHTML.trim()
    )) || "";
    let businessHours = (await page.evaluate(() =>
      document
        .querySelectorAll("ul.specsheet-answers-content li.ng-binding")[1]
        .innerHTML.split("</strong>")[1]
        .trim()
    )) || "";
    let interviewRecording = (await page.evaluate(
      () => document.querySelectorAll(".specsheet-phone-recording")[0].href
    )) || "";
    let contactName = (await page.evaluate(
      () => document.querySelectorAll(".name.ng-binding")[0].innerHTML
    )) || "";
    let contactFirstName = (await page.evaluate(
      () =>
        document.querySelectorAll(".name.ng-binding")[0].innerHTML.split(" ")[0]
    )) || "";
    let contactLastName = (await page.evaluate(
      () =>
        document.querySelectorAll(".name.ng-binding")[0].innerHTML.split(" ")[1]
    )) || "";
    let contactPosition = (await page.evaluate(
      () =>
        document
          .querySelectorAll(".job-title.ng-binding.ng-scope")[0]
          .innerHTML.split("\x3C")[0]
    )) || "";
    let contactEmail = (await page.evaluate(
      () =>
        document.querySelectorAll(".email.ng-binding.ng-scope a")[0].innerHTML
    )) || "";
    let contactPhone = (await page.evaluate(
      () =>
        document.querySelectorAll(".phone.ng-binding.ng-scope a")[0].innerHTML
    )) || "";
    let interviewedBy = (await page.evaluate(() =>
      document
        .querySelectorAll("ul.specsheet-answers-content li.ng-binding")[2]
        .innerHTML.split("</strong>")[1]
        .trim()
        .split(" \x3c")[0]
        .trim()
    )) || "";
    let generalLocation = (await page.evaluate(() =>
      document
        .querySelectorAll("ul.specsheet-answers-content li.ng-binding")[3]
        .innerHTML.split("</strong>")[1]
        .trim()
    )) || "";
    let industry = (await page.evaluate(() =>
      document
        .querySelectorAll("ul.specsheet-answers-content li.ng-binding")[4]
        .innerHTML.split("</strong>")[1]
        .trim()
    )) || "";
    let annualSales = (await page.evaluate(() =>
      document
        .querySelector('li[ng-show="Lead.Specs.Company.AnnualSales"]')
        .innerHTML.split("</strong>")[1]
        .trim()
    )) || "";
    let numberOfEmployees = (await page.evaluate(() =>
      document
        .querySelector('li[ng-show="Lead.Specs.Company.Employees"]')
        .innerHTML.split("</strong>")[1]
        .trim()
    )) || "";
    let numberOfUsers = (await page.evaluate(
      () =>
        document.querySelector(
          'li[ng-show="Lead.Specs.ConcurrentUsers || Lead.Specs.NamedUsers"] span'
        ).innerHTML
    )) || "";
    let timeframe = (await page.evaluate(() =>
      document
        .querySelector('li[ng-show="Lead.Specs.Timeframe"]')
        .innerHTML.split("</strong>")[1]
        .trim()
    )) || "";
    let functionalityRequirements = (await page.evaluate(
      () =>
        document.querySelectorAll(
          ".specsheet-answers-applist-app-name.ng-binding"
        )[0].innerHTML
    )) || "";

    let spendingExpectations = (await page.evaluate(() =>
      document
        .querySelectorAll("ul.specsheet-answers-content li.ng-binding")[9]
        .innerHTML.split("</strong>")[1]
        .trim()
    )) || "";
    let spending3YearTCO = (await page.evaluate(() =>
      document
        .querySelector('li[ng-if="Lead.Specs.Budget.Calculation"]')
        .innerHTML.split("</strong>")[1]
        .trim()
    )) || "";
    let currentSoftware = (await page.evaluate(() =>
      document
        .querySelector(
          'li[ng-if="Lead.Specs.Infrastructure.CurrentSystem.Product.Name"]'
        )
        .innerHTML.split("</strong>")[1]
        .trim()
    )) || "";
    let deployment = (await page.evaluate(() =>
      document
        .querySelector('li[ng-if="Lead.Specs.Deployment"]')
        .innerHTML.split("</strong>")[1]
        .trim()
    )) || "";
    let interviewNotes = (await page.evaluate(() =>
      Array.from(
        document.querySelectorAll('div[ng-bind-html="Lead.Notes.Interview"] p')
      )
        .map((paragraph) => {
          return paragraph.innerText;
        })
        .join("")
    )) || "";
    let optionsRequested = (await page.evaluate(
      () =>
        document.querySelector('ng-pluralize[count="Lead.Info.Slots.Max"]')
          .innerHTML
    )) || "";
    let industryExpertiseImportance = (await page.evaluate(() =>
      document
        .querySelectorAll("ul.specsheet-answers-content li.ng-binding")[14]
        .innerText.split("\n")[1]
        .trim()
    )) || "";
    let localSupportImportance = (await page.evaluate(() =>
      document
        .querySelectorAll("ul.specsheet-answers-content li.ng-binding")[15]
        .innerText.split("\n")[1]
        .trim()
    )) || "";
    let competition = (await page.evaluate(() =>
      Array.from(document.querySelectorAll("em.ng-binding"))
        .map((paragraph) => {
          return paragraph.innerText;
        })
        .join()
    )) || "";

    // Close the browser window
    await browser.close();

    let response = {
      leadDescription: leadDescription,
      companyName: companyName,
      location: location,
      businessHours: businessHours,
      interviewRecording: interviewRecording,
      contactName: contactName,
      contactFirstName: contactFirstName,
      contactLastName: contactLastName,
      contactPosition: contactPosition,
      contactEmail: contactEmail,
      contactPhone: contactPhone,
      interviewedBy: interviewedBy,
      generalLocation: generalLocation,
      industry: industry,
      annualSales: annualSales,
      numberOfEmployees: numberOfEmployees,
      numberOfUsers: numberOfUsers,
      timeframe: timeframe,
      functionalityRequirements: functionalityRequirements,
      spendingExpectations: spendingExpectations,
      spending3YearTCO: spending3YearTCO,
      currentSoftware: currentSoftware,
      deployment: deployment,
      interviewNotes: interviewNotes,
      optionsRequested: optionsRequested,
      industryExpertiseImportance: industryExpertiseImportance,
      localSupportImportance: localSupportImportance,
      competition: competition,
    };

    res.json(response);
  })();
});

module.exports = app;
