const fs = require("fs");
const request = require("request");
const cheerio = require("cheerio");
const rp = require("request-promise");

const base_url = "https://www.bankmega.com";
const promoUrl = "https://www.bankmega.com/promo_detail.php?id=";
const categoryUrl =
  "https://www.bankmega.com/promolainnya.php?product=1&subcat=";
let listCategory = [];
let jsonData = {};

function initProgram(listCategory) {
  console.log(listCategory);
  for (let i = 1; i < listCategory.length + 1; i++) {
    getPagesCategory(i);
  }
}

function getPagesCategory(category) {
  request(
    {
      method: "GET",
      url: categoryUrl + category
    },
    function(err, res, body) {
      let $ = cheerio.load(body);
      try {
        pages = parseInt($("a.page_promo_lain")[1].attribs.title.split(" ")[3]);
        for (let i = 1; i < pages + 1; i++) {
          generateData(i, category);
        }
      } catch (err) {
        console.log("No Promo on " + listCategory[category - 1] + " Category");
      }
    }
  );
}

function generateData(page, category) {
  request(
    {
      method: "GET",
      url: `${categoryUrl}${category}&page=${page}`
    },
    function(err, res, body) {
      let $ = cheerio.load(body);
      $("#promolain li").each((i, value) => {
        $(value)
          .find("a")
          .each((j, data) => {
            promoId = data.attribs.href.split("=")[1];
            parseToJson(promoUrl + promoId, category);
          });
      });
    }
  );
}

async function parseToJson(url, category) {
  try {
    const html = await rp(url);
    let img_url;
    if (!cheerio(".keteranganinside > img", html).attr("src")) {
      img_url = encodeURI(cheerio(".keteranganinside > a > img", html).attr("src"));
    } else {
      img_url = encodeURI(cheerio(".keteranganinside > img", html).attr("src"));
    }
    period = cheerio(".periode > b", html)
      .text()
      .split(" - ");
    jsonData[listCategory[category - 1]].push({
      title: cheerio(".titleinside h3", html).text(),
      area: cheerio(".area > b", html).text(),
      initial_period: period[0],
      final_periode: period[1],
      image_src: base_url + img_url,
      url_link: url
    });
    writeDataToJson(jsonData);
  } catch {
    console.log("Connection interrupted, some data may lost");
  }
}

function writeDataToJson(data) {
  fs.writeFile("solution.json", JSON.stringify(data, null, 4), function(err) {
    if (err) {
      throw err;
    }
  });
}

function main() {
  request(
    {
      method: "GET",
      url: "https://www.bankmega.com/promolainnya.php"
    },
    function(err, res, body) {
      let $ = cheerio.load(body);
      $("div#subcatpromo div").each((i, value) => {
        category = $(value)
          .find("div > img")
          .attr("title");
        listCategory.push(category);
        jsonData[category] = [];
      });
      initProgram(listCategory);
    }
  );
}

main();
