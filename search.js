const { url } = require("inspector");
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-extra");
// const puppeteer = require("puppeteer");

const stealthPlugin = require("puppeteer-extra-plugin-stealth")();

["chrome.runtime", "navigator.languages"].forEach((a) =>
  stealthPlugin.enabledEvasions.delete(a)
);

puppeteer.use(stealthPlugin);

main();
async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    // slowMo: 100,
    defaultViewport: null,
    args: ["--start-maximized"],
    devtools: true,
  });
  const page = await browser.newPage();

  const cookiesPath = `login/tiktok.json`;
  const previousSession = fs.existsSync(cookiesPath);

  if (previousSession) {
    const cookie = JSON.parse(fs.readFileSync(cookiesPath));
    await page.setCookie(...cookie);
    console.log(`Cookies have been loaded in the browser`);
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
  const kk = args[0];
  const kata_kunci = kk.replace(/_/g, " ");
  const items = args[1];
  let berhasil = 0;
  let gagal = 0;
  let path = "./video/" + kata_kunci + "/"; // location to save videos

  do {
    try {
      await page.goto("https://www.tiktok.com/"); //change this to user url page
      break;
    } catch (e) {
      continue; //continue
    }
  } while (true);

  await page.type('input[data-e2e="search-user-input"]', kata_kunci, {
    // delay: 100,
  });
  await page.click('button[data-e2e="search-box-button"]');

  await page.waitForTimeout(5000);

  await autoScroll(page, items);

  const urls = await page.evaluate(() =>
    Array.from(
      document.querySelectorAll(
        'div[mode="search-video-list"] div[data-e2e="search_top-item"] a'
      ),
      (element) => element.href
    )
  );
  const new_url = urls.filter((url) => url !== "https://www.tiktok.com/");

  const cookiesObject = await page.cookies();
  fs.writeFileSync(cookiesPath, JSON.stringify(cookiesObject));
  console.log("Cookies have been saved to " + cookiesPath);

  console.log("now it downloading " + new_url.length + " video");
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
    do {
      try {
        await page.goto("https://snaptik.app/");
        break;
      } catch (e) {
        continue; //continue
      }
    } while (true);
    await page.waitForTimeout(getRandomNumber());

    await page.waitForSelector('input[name="url"]');
    await page.type('input[name="url"]', new_url[i], { delay: 50 }); //type result of links
    const urlParts = new_url[i].split("/");
    const videoId = urlParts[urlParts.length - 1];

    await page.waitForTimeout(getRandomNumber());
    await page.click(".button-go");
    await page.waitForTimeout(getHighNumber());

    await page.waitForXPath('//*[@id="download"]/div/div[2]/a[1]');
    const featureArticle = (
      await page.$x('//*[@id="download"]/div/div[2]/a[1]')
    )[0];

    const text = await page.evaluate((el) => {
      return el.href;
    }, featureArticle);

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
      }
      page.waitForTimeout(1000);
    });

    // Handle error event

    request.on("error", function (error) {
      // console.error("An error occurred:", error.message);
      gagal++;
    });

    // Handle close event (optional, for cleanup)
    request.on("close", function () {
      berhasil++;
      // console.log("Request closed");
    });
  }
  console.log("berhasil download: ", berhasil);
  console.log("gagal: ", gagal);

  browser.close();

  // Membaca isi direktori
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

async function autoScroll(page, urlLimit = 50) {
  const urls = await page.evaluate(() =>
    Array.from(
      document.querySelectorAll(
        'div[mode="search-video-list"] div[data-e2e="search_top-item"] a'
      ),
      (element) => element.href
    )
  );

  if (urls.length >= urlLimit) {
    console.log("limit");
    return; // Stop scrolling if URL limit is reached
  }

  await page.evaluate(async (limit) => {
    await new Promise((resolve, reject) => {
      var totalHeight = 0;
      var distance = 100;
      var scrolls = 0;

      var timer = setInterval(() => {
        var scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        scrolls++;

        const urls = Array.from(
          document.querySelectorAll(
            'div[mode="search-video-list"] div[data-e2e="search_top-item"] a'
          ),
          (element) => element.href
        );

        if (
          // totalHeight >= scrollHeight ||
          urls.length >= limit
        ) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  }, urlLimit);
}
