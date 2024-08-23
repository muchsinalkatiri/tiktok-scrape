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
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto("https://www.tiktok.com/"); //change this to user url page

  await page.waitForTimeout(60000); //delay 2 detik
  const cookiesObject = await page.cookies();
  const cookiesPath = `login/tiktok.json`;
  fs.writeFileSync(cookiesPath, JSON.stringify(cookiesObject));
  console.log("Cookies have been saved to " + cookiesPath);
}
