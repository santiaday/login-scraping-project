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
  res.send("success")
});




module.exports = app;
