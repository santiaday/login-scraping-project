const express = require("express");
const cors = require("cors");
const app = express();
const fetch = require("node-fetch");
const { Octokit } = require("@octokit/core");
const { Cluster } = require("puppeteer-cluster");
require("dotenv").config();

//let chrome = {};
//let puppeteer;

var allowedOrigins = ['https://doorloopcrm.webflow.io', 'https://doorloop.com', 'https://doorloopcrm-44e0371123ae2f5097e5ed3fefd.webflow.io'];

app.use(cors());
app.set('trust proxy', 1);

// Add headers after the cors middleware
app.use((req, res, next) => {
  const origin = req.get('origin');

  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  
  //res.header("Access-Control-Allow-Origin", "https://www.doorloop.com");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  next();
});

// your other middleware and route handlers

app.listen(process.env.PORT || 3000, () => {
  console.log("Server started");
});

app.use(express.static("public"));

let chrome = {};
let puppeteer;

if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
  chrome = require("chrome-aws-lambda");
  puppeteer = require("puppeteer-core");
} else {
  puppeteer = require("puppeteer");
}

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

    let leadDescription = await page.evaluate(() =>
      document.getElementsByClassName("specsheet-intro ng-binding")[0]
        .innerHTML === undefined
        ? ""
        : document.getElementsByClassName("specsheet-intro ng-binding")[0]
            .innerHTML
    );
    let companyName = await page.evaluate(() =>
      document
        .querySelectorAll("ul.specsheet-answers-content li.ng-binding")[0]
        .innerHTML.split("</strong>")[1] === undefined
        ? ""
        : document
            .querySelectorAll("ul.specsheet-answers-content li.ng-binding")[0]
            .innerHTML.split("</strong>")[1]
            .trim()
    );
    let location = await page.evaluate(() =>
      document.querySelectorAll(
        "span[ng-bind-html='Lead.Referral.Match.Company.Location.Address | inlineAddress'] a"
      )[0].innerHTML === undefined
        ? ""
        : document
            .querySelectorAll(
              "span[ng-bind-html='Lead.Referral.Match.Company.Location.Address | inlineAddress'] a"
            )[0]
            .innerHTML.trim()
    );
    let businessHours = await page.evaluate(() =>
      document
        .querySelectorAll("ul.specsheet-answers-content li.ng-binding")[1]
        .innerHTML.split("</strong>")[1] === undefined
        ? ""
        : document
            .querySelectorAll("ul.specsheet-answers-content li.ng-binding")[1]
            .innerHTML.split("</strong>")[1]
            .trim()
    );
    let interviewRecording = await page.evaluate(
      () => document.querySelectorAll(".specsheet-phone-recording")[0].href
    );
    let contactName = await page.evaluate(
      () => document.querySelectorAll(".name.ng-binding")[0].innerHTML
    );
    let contactFirstName = await page.evaluate(
      () =>
        document.querySelectorAll(".name.ng-binding")[0].innerHTML.split(" ")[0]
    );
    let contactLastName = await page.evaluate(
      () =>
        document.querySelectorAll(".name.ng-binding")[0].innerHTML.split(" ")[1]
    );
    let contactPosition = await page.evaluate(
      () =>
        document
          .querySelectorAll(".job-title.ng-binding.ng-scope")[0]
          .innerHTML.split("\x3C")[0]
    );
    let contactEmail = await page.evaluate(
      () =>
        document.querySelectorAll(".email.ng-binding.ng-scope a")[0].innerHTML
    );
    let contactPhone = await page.evaluate(
      () =>
        document.querySelectorAll(".phone.ng-binding.ng-scope a")[0].innerHTML
    );
    let interviewedBy = await page.evaluate(() =>
      document
        .querySelectorAll("ul.specsheet-answers-content li.ng-binding")[2]
        .innerHTML.split("</strong>")[1] === undefined
        ? ""
        : document
            .querySelectorAll("ul.specsheet-answers-content li.ng-binding")[2]
            .innerHTML.split("</strong>")[1]
            .trim()
            .split(" \x3c")[0] === undefined
        ? ""
        : document
            .querySelectorAll("ul.specsheet-answers-content li.ng-binding")[2]
            .innerHTML.split("</strong>")[1]
            .trim()
            .split(" \x3c")[0]
            .trim()
    );
    let generalLocation = await page.evaluate(() =>
      document
        .querySelectorAll("ul.specsheet-answers-content li.ng-binding")[3]
        .innerHTML.split("</strong>")[1] === undefined
        ? ""
        : document
            .querySelectorAll("ul.specsheet-answers-content li.ng-binding")[3]
            .innerHTML.split("</strong>")[1]
            .trim()
    );
    let industry = await page.evaluate(() =>
      document
        .querySelectorAll("ul.specsheet-answers-content li.ng-binding")[4]
        .innerHTML.split("</strong>")[1] === undefined
        ? ""
        : document
            .querySelectorAll("ul.specsheet-answers-content li.ng-binding")[4]
            .innerHTML.split("</strong>")[1]
            .trim()
    );
    let annualSales = await page.evaluate(() =>
      document
        .querySelector('li[ng-show="Lead.Specs.Company.AnnualSales"]')
        .innerHTML.split("</strong>")[1] === undefined
        ? ""
        : document
            .querySelector('li[ng-show="Lead.Specs.Company.AnnualSales"]')
            .innerHTML.split("</strong>")[1]
            .trim()
    );
    let numberOfEmployees = await page.evaluate(() =>
      document
        .querySelector('li[ng-show="Lead.Specs.Company.Employees"]')
        .innerHTML.split("</strong>")[1] === undefined
        ? ""
        : document
            .querySelector('li[ng-show="Lead.Specs.Company.Employees"]')
            .innerHTML.split("</strong>")[1]
            .trim()
    );
    let numberOfUsers = await page.evaluate(
      () =>
        document.querySelector(
          'li[ng-show="Lead.Specs.ConcurrentUsers || Lead.Specs.NamedUsers"] span'
        ).innerHTML
    );
    let timeframe = await page.evaluate(() =>
      document
        .querySelector('li[ng-show="Lead.Specs.Timeframe"]')
        .innerHTML.split("</strong>")[1] === undefined
        ? ""
        : document
            .querySelector('li[ng-show="Lead.Specs.Timeframe"]')
            .innerHTML.split("</strong>")[1]
            .trim()
    );
    let functionalityRequirements = await page.evaluate(
      () =>
        document.querySelectorAll(
          ".specsheet-answers-applist-app-name.ng-binding"
        )[0].innerHTML
    );

    let spendingExpectations = await page.evaluate(() =>
      document
        .querySelectorAll("ul.specsheet-answers-content li.ng-binding")[9]
        .innerHTML.split("</strong>")[1] === undefined
        ? ""
        : document
            .querySelectorAll("ul.specsheet-answers-content li.ng-binding")[9]
            .innerHTML.split("</strong>")[1]
            .trim()
    );
    let spending3YearTCO = await page.evaluate(() =>
      document
        .querySelector('li[ng-if="Lead.Specs.Budget.Calculation"]')
        .innerHTML.split("</strong>")[1] === undefined
        ? ""
        : document
            .querySelector('li[ng-if="Lead.Specs.Budget.Calculation"]')
            .innerHTML.split("</strong>")[1]
            .trim()
    );
    let currentSoftware = await page.evaluate(() =>
      document
        .querySelector(
          'li[ng-if="Lead.Specs.Infrastructure.CurrentSystem.Product.Name"]'
        )
        .innerHTML.split("</strong>")[1] === undefined
        ? ""
        : document
            .querySelector(
              'li[ng-if="Lead.Specs.Infrastructure.CurrentSystem.Product.Name"]'
            )
            .innerHTML.split("</strong>")[1]
            .trim()
    );
    let deployment = await page.evaluate(() =>
      document
        .querySelector('li[ng-if="Lead.Specs.Deployment"]')
        .innerHTML.split("</strong>")[1] === undefined
        ? ""
        : document
            .querySelector('li[ng-if="Lead.Specs.Deployment"]')
            .innerHTML.split("</strong>")[1]
            .trim()
    );
    let interviewNotes = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll('div[ng-bind-html="Lead.Notes.Interview"] p')
      )
        .map((paragraph) => {
          return paragraph.innerText;
        })
        .join("")
    );
    let optionsRequested = await page.evaluate(
      () =>
        document.querySelector('ng-pluralize[count="Lead.Info.Slots.Max"]')
          .innerHTML
    );
    let industryExpertiseImportance = await page.evaluate(() =>
      document
        .querySelectorAll("ul.specsheet-answers-content li.ng-binding")[14]
        .innerText.split("\n")[1] === undefined
        ? ""
        : document
            .querySelectorAll("ul.specsheet-answers-content li.ng-binding")[14]
            .innerText.split("\n")[1]
            .trim()
    );
    let localSupportImportance = await page.evaluate(() =>
      document
        .querySelectorAll("ul.specsheet-answers-content li.ng-binding")[15]
        .innerText.split("\n")[1] === undefined
        ? ""
        : document
            .querySelectorAll("ul.specsheet-answers-content li.ng-binding")[15]
            .innerText.split("\n")[1]
            .trim()
    );
    let competition = await page.evaluate(() =>
      Array.from(document.querySelectorAll("em.ng-binding"))
        .map((paragraph) => {
          return paragraph.innerText;
        })
        .join()
    );

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

app.get("/getCapterraInfo", (req, res) => {
  // if (req.query.token !== "wn^$$5SU6a972YvG") {
  //   res.send("Not authorized");
  // }

  const url = "https://" + req.query.link + "/clicks";
  console.log(url);

  const username = req.query.username;
  const password = req.query.password;

  let pageData = "";

  (async () => {
    // Launch a headless web browser
    let options = {};

    if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
      options = {
        args: [
          ...chrome.args,
          "--hide-scrollbars",
          "--disable-web-security",
          "--enable-features=ExperimentalJavaScript",
        ],
        defaultViewport: chrome.defaultViewport,
        executablePath: await chrome.executablePath,
        headless: false,
        ignoreHTTPSErrors: true,
      };
    }

    try {
      const browser = await puppeteer.launch(options);

      // Open a new page and navigate to the login page
      const page = await browser.newPage();
      await page.goto("https://digitalmarkets.gartner.com/clicks");
      await page.screenshot({
        path: "screenshot.jpg",
      });

      // Find the username and password input fields and fill them in
      await page.waitForSelector('input[name="email"]');
      await page.type('input[name="email"]', "david@doorloop.com");
      await page.waitForSelector('input[name="password"]');
      await page.type('input[name="password"]', "HXU0gjk_bdq0wet.ecz");

      // Find the login button and click it
      await page.waitForSelector('button[type="submit"]');

      await Promise.all([
        await page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: "networkidle0" }),
        console.log(await page.content()),
      ]);

      await page.screenshot({
        path: "screenshot2.jpg",
      });

      // Close the browser window
      await browser.close();
    } catch (e) {
      console.log(e);
    }
  })();
});

const chrome2 = require("chrome-aws-lambda");

app.get("/webflowGithub", async (req, res) => {
  console.log("sent response");
  res.status(200).send({ success: true });
  
  const siteUrl = "https://www.doorloop.com/sitemap.xml";
  async function extractLinks(page, url) {
    await page.goto(url, { waitUntil: "networkidle2" });

    let content = await page.content();
    const regex =
      /https:\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:/~+#-]*[\w@?^=%&amp;/~+#-])?/g;
    const links = Array.from(new Set(content.match(regex)));

    return links;
  }

  async function getAllPageUrls() {
    const browser = await puppeteer.launch({
      args: chrome2.args,
      executablePath: await chrome2.executablePath,
      headless: chrome2.headless,
    });
    const page = await browser.newPage();

    return extractLinks(page, siteUrl);
  }

  const githubToken = [
    process.env.webflowToken1,
    process.env.webflowToken2,
    process.env.webflowToken3,
  ];
  const githubRepoOwner = "santiaday";
  const githubRepoName = "dlWebflow";

  const pages = await getAllPageUrls(siteUrl);
  const browser = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_PAGE,
    maxConcurrency: 100,
    puppeteerOptions: {
      args: chrome2.args,
      defaultViewport: chrome2.defaultViewport,
      executablePath: await chrome2.executablePath,
      headless: chrome2.headless,
      ignoreHTTPSErrors: true,
    },
  });

  await browser.task(async ({ page, data: pageUrl }) => {
    try {
      console.log("heyyyy")
      await page.goto(pageUrl, { waitUntil: "networkidle0" });
      page.setJavaScriptEnabled(false);
      const fullPath = pageUrl.split("https://www.doorloop.com/")[1] + ".html";

      await page.evaluate(() => {
        const elements = document.querySelectorAll("figure, svg, meta, img");
        for (let i = 0; i < elements.length; i++) {
          elements[i].parentNode.removeChild(elements[i]);
        }
      });

      await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll("script[src]"));
        scripts.forEach((script) => {
          if (
            script.src.includes("gstatic") ||
            script.src.includes("recaptcha") ||
            script.src.includes("http")
          ) {
            script.parentNode.removeChild(script);
          }
        });
      });

      await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll("input"));
        inputs.forEach((input) => {
          input.removeAttribute("id");
        });
      });

      const content = await page.evaluate(
        () => document.querySelector("*").outerHTML
      );

      const octokit = new Octokit({
        auth: githubToken[Math.floor(Math.random() * 3) + 1],
      });
      let existingContent = "";

      try {
        const response = await octokit.request(
          "GET /repos/{owner}/{repo}/contents/{path}",
          {
            owner: "ownerUsername",
            repo: "repositoryName",
            path: "path/to/file",
          }
        );

        existingContent = Buffer.from(
          response.data.content,
          "base64"
        ).toString();
      } catch (error) {
        console.error("Error occurred:", error);
      }

      const { data: getFileData } = await octokit.request(
        "GET /repos/{owner}/{repo}/contents/{path}",
        {
          owner: githubRepoOwner,
          repo: githubRepoName,
          path: fullPath,
        }
      );

      // Get the SHA of the file.
      const sha = getFileData.sha;

      if (existingContent == content) {
        console.log(`Skipping ${fullPath}, content is the same, PART 2`);
        return;
      } else {
        console.log("Not matched");
      }

      await octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
        owner: githubRepoOwner,
        repo: githubRepoName,
        path: fullPath,
        message: `Update ${fullPath}`,
        content: Buffer.from(content).toString("base64"),
        sha,
      });
      if (error.status === 404) {
        await octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
          owner: githubRepoOwner,
          repo: githubRepoName,
          path: fullPath,
          message: `Create ${fullPath}`,
          content: Buffer.from(content).toString("base64"),
        });
      } else {
        console.error(`Error committing file ${fullPath} to GitHub:`, error);
      }
    } catch (error) {
      console.error("Error processing the Webflow site pages:", error);
    }
  });

  for (const pageUrl of pages) {
    await browser.queue(pageUrl);
  }

  await browser.idle();
  await browser.close();
  return;
});

const rateLimit = require("express-rate-limit");

const whitelistedIps = ["23.124.120.11", "191.135.81.59"];

// create rate limit middleware
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour in milliseconds
  max: 5, // limit each IP to 5 requests per windowMs
  handler: function(req, res, /*next*/) {
    res.status(429).json({message: "Too many requests, please try again later."});
  },
  skip: function(req, res) {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    return whitelistedIps.includes(ip);
  }
});


const { Configuration, OpenAIApi } = require("openai");

app.post("/generate-text", limiter, async (req, res) => {
  const prompt = decodeURIComponent(req.query.prompt);

  const configuration = new Configuration({
    apiKey: process.env.openai,
  });

  const openai = new OpenAIApi(configuration);
  let responseText = "";
  try {
    const response = await openai
      .createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: JSON.parse(prompt),
        temperature: 0.5,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      })
      .then((res) => {
        responseText = res.data.choices[0].message.content;
      })
      .catch((e) => {
        console.log(e);
      });
  } catch (error) {
    console.error(error);
  }

  res.send(responseText);
});

const axios = require('axios');
const cheerio = require('cheerio');

app.get("/check-biggerpockets-forum", async (req, res) => {
  try {
    const variations = ["florida", "fl.", "f.l.", "f.l"];
    const url = "https://www.biggerpockets.com/forums/521-real-estate-events-meetups";
    const response = await axios.get(url);

    const $ = cheerio.load(response.data);

    let floridaEvents = new Set(); 
    $("a.simplified-forums__topic-content__link").each((index, element) => {
      const title = $(element).text().toLowerCase();
      const link = $(element).attr('href');
      if (variations.some(variation => title.includes(variation))) {
        floridaEvents.add("https://www.biggerpockets.com/" + link);
      }
    });
    
    $('.simplified-forums__card-wrapper-compact').each((i, section) => {
  // within each section, find the link with the class "simplified-forums__topic-content__link"
  const link = $(section).find('.simplified-forums__topic-content__link');

  // within each section, find the span under the div with the specified class
  const location = $(section).find('.simplified-forums__tag-location span:nth-child(2)');

  // if the span contains the word "Nashville", add the href of the link to the array
  if (location && location.text().includes('Florida')) {
    floridaEvents.add("https://www.biggerpockets.com/" + link.attr('href'));
  }
});


    console.log(floridaEvents);
    res.send(Array.from(floridaEvents));
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while scraping the site.' });
  }
});



app.post("/record-searches", async (req, res) => {
    // Extract email from request query parameters
    const keyword = req.query.keyword;
    if (!keyword) {
        return res.status(400).json({
            status: 'error',
            message: 'Keyword is required'
        });
    }
fetch("https://hooks.zapier.com/hooks/catch/8900275/32nxv42/", {
      method: 'POST',
      body: JSON.stringify({ keyword: keyword }),
    });
});




module.exports = app;
