const { url } = require("inspector");
const puppeteer = require("puppeteer-extra");
const stealthPlugin = require("puppeteer-extra-plugin-stealth")();
const fs = require("fs");

["chrome.runtime", "navigator.languages"].forEach((a) =>
  stealthPlugin.enabledEvasions.delete(a)
);

puppeteer.use(stealthPlugin);

main();
async function main() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const cookiesPath = `login/tiktok.json`;
  const previousSession = fs.existsSync(cookiesPath);

  if (previousSession) {
    const cookie = JSON.parse(fs.readFileSync(cookiesPath));
    await page.setCookie(...cookie);
  }

  await page.evaluateOnNewDocument(() => {
    delete navigator.__proto__.webdriver;
  });
  //We stop images and stylesheet to save data
  await page.setRequestInterception(true);

  page.on("request", (request) => {
    if (["image", "stylesheet", "font"].includes(request.resourceType())) {
      request.abort();
    } else {
      request.continue();
    }
  });
  const args = process.argv.slice(2);
  const userLink = args[0];

  await page.goto(userLink); //change this to user url page
  let username = page
    .url()
    .slice(23)
    .replace(/[-:.\/*<>|?]/g, "");

  //scroll down until no more videos
  let path = "./video/" + username + "/"; // location to save videos

  await autoScroll(page);

  const urls = await page.evaluate(() =>
    Array.from(
      document.querySelectorAll(
        "div.tiktok-1qb12g8-DivThreeColumnContainer > div > div > div > div > div > a"
      ),
      (element) => element.href
    )
  );

  console.log("now it downloading " + urls.length + " video");
  //loop on snaptik for no watermark tiktok videos
  //becareful that can be alot of gigas if profile has a lot of videos
  const new_url = urls.filter((url) => url !== "https://www.tiktok.com/");

  for (
    var i = 0;
    i < new_url.length;
    i++ //you can limit number of videos by replace url.length by number
  ) {
    function getRandomNumber() {
      var random = Math.floor(Math.random() * (500 - 300 + 1)) + 300;
      return random;
    }
    function getHighNumber() {
      var random = Math.floor(Math.random() * (500 - 300 + 1)) + 1150;
      return random;
    }
    await page.waitForTimeout(getHighNumber());
    let featureArticle;
    let urlParts;
    let videoId;
    do {
      try {
        await page.goto("https://snaptik.app/");
        await page.waitForTimeout(getRandomNumber());

        await page.waitForSelector('input[name="url"]');
        await page.type('input[name="url"]', new_url[i], { delay: 50 }); //type result of links
        urlParts = new_url[i].split("/");
        videoId = urlParts[urlParts.length - 1];
        // const idss = await page.$x("#download");
        // console.log(urls[i]);
        // return;
        await page.waitForTimeout(getRandomNumber());
        // await page.keyboard.press('Enter');
        //v2
        // await page.click('.btn-go')
        // v3 click download bttn
        await page.click(".button-go");
        await page.waitForTimeout(getHighNumber());
        //v2
        // await page.waitForXPath('//*[@id="download"]/div/div/div[2]/div/a[2]');
        //v3
        await page.waitForXPath('//*[@id="download"]/div/div[2]/a[1]');
        featureArticle = (
          await page.$x('//*[@id="download"]/div/div[2]/a[1]')
        )[0];
        break;
      } catch (e) {
        // continue;
        break;
      }
    } while (true);
    if (checkFileExistence(path + videoId + ".mp4")) {
      console.log(videoId + " skip");
      continue;
    }
    // await page.waitForTimeout(5000);

    // the same as:
    // const featureArticle = await page.$('#mp-tfa');
    try {
      text = await page.evaluate((el) => {
        // do what you want with featureArticle in page.evaluate
        return el.href;
      }, featureArticle);
    } catch (e) {
      continue;
    }

    var noWaterMark = text;
    const content = decodeURIComponent(noWaterMark);
    const https = require("https");
    const ds = require("fs");

    // link to file you want to download
    try {
      if (!ds.existsSync(path)) {
        ds.mkdirSync(path);
      }
    } catch (err) {
      console.error(err);
    }
    const options = {
      timeout: 20000, // Set timeout to 5 seconds
    };
    const request = https.get(content, options, function (response) {
      if (response.statusCode === 200) {
        var file = ds.createWriteStream(path + videoId + ".mp4");
        response.pipe(file);
        console.log(file.path + " Saved!");

        const fs = require("fs");

        fs.appendFile("names.txt", file.path + "\r\n", function (err) {
          if (err) throw err;
          console.log("Done");
        });
      }
      // request.setTimeout(60000, function () {
      //   // if after 60s file not downlaoded, we abort a request
      //   request.destroy();
      // });
      // Handle error event
    });
    request.on("error", function (error) {
      console.error("An error occurred:", error.message);
    });

    // Handle close event (optional, for cleanup)
    request.on("close", function () {
      console.log("Request closed");
    });
  }

  browser.close();
  fs.readdir(path, (err, files) => {
    if (err) {
      console.error("Error reading directory:", err);
      return;
    }

    // Loop melalui setiap file
    files.forEach((file) => {
      // Mendapatkan informasi stat tentang file
      fs.stat(path + file, (err, stats) => {
        if (err) {
          console.error("Error getting file stats:", err);
          return;
        }

        // Mengecek apakah itu file (bukan direktori) dan ukuran lebih dari maxSizeMB
        if (stats.isFile() && stats.size / (1024 * 1024) > 5) {
          //jika diatas 7 mb
          console.log(
            `Menghapus file: ${file}, Ukuran: ${(
              stats.size /
              (1024 * 1024)
            ).toFixed(2)} MB`
          );

          // Menghapus file
          fs.unlink(path + file, (err) => {
            if (err) {
              console.error("Error deleting file:", err);
            } else {
              console.log(`File ${file} telah dihapus.`);
            }
          });
        }
      });
    });
  });
}

function checkFileExistence(fullpath) {
  try {
    fs.accessSync(fullpath, fs.constants.F_OK);
    return true; // File exists
  } catch (err) {
    return false; // File doesn't exist
  }
}
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      var totalHeight = 0;
      var distance = 100;
      var timer = setInterval(() => {
        var scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}
