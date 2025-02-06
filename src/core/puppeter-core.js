import puppeteer from "puppeteer";
import logger from "../utils/logger.js";
import { Helper } from "../utils/helper.js";
import qrcode from "qrcode-terminal";
import clipboardy from "clipboardy";

export class PuppeterCore {
  constructor() {
    this.selector = "div[role=textbox]";
  }

  async initializePuppeterBrowser() {
    logger.info(`Initializing Puppeter Browser`);
    const url = "https://discord.com/login";
    this.browser = await puppeteer.launch({
      channel: "chrome", //'chrome' | 'chrome-beta' | 'chrome-canary' | 'chrome-dev'
      executablePath: process.env.BROWSEREXECUTABLEPATH ?? null,
      headless: process.env.HEADLESS == 1,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    logger.info(`Launching Puppeter Browser to ${url}`);

    this.page = await this.browser.newPage();
    this.page.setJavaScriptEnabled(true);
    this.page.setDefaultNavigationTimeout(60000);
    let pages = await this.browser.pages();

    await pages[0].close();
    await this.page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36"
    );
    await this.page.setViewport({
      width: 1280,
      height: 720,
    });
    await this.page.goto(url, { waitUntil: ["load", "networkidle2"] });

    if (process.env.USE_QR == 1) {
      logger.info(`Waiting For Discord QR Code`);
      const qrCodeSelector =
        "div[class^='qrCodeContainer_'] > div[class^='qrCodeContainer_']";
      await this.page.waitForSelector(qrCodeSelector);
      const qrCodeData = await this.page.evaluate((selector) => {
        const qrCodeElement = document.querySelector(selector);
        if (qrCodeElement) {
          const svg = qrCodeElement.innerHTML;
          const base64 = btoa(svg);
          const qrcode = "data:image/svg+xml;base64," + base64;
          return qrcode;
        }
        return null;
      }, "div[class^='qrCodeContainer_'] > div[class^='qrCodeContainer_']");

      logger.info("QR Code found!");

      const pageQRParser = await this.browser.newPage();
      await pageQRParser.goto("https://qrcode-parser.netlify.app/", {
        waitUntil: ["load", "networkidle0"],
      });
      await pageQRParser.evaluate((externalVar) => {
        document.querySelector("#image-base64").value = externalVar;
        return null;
      }, qrCodeData);

      await pageQRParser.click("#parse-image-base64");
      await this.page.waitForNetworkIdle();
      const qrValue = await pageQRParser.evaluate(async () => {
        return await new Promise((resolve) => {
          resolve(document.querySelector("#content2").innerHTML);
        });
      });

      if (qrValue) {
        logger.info("QR Code and Parsed! Displaying in terminal:");
        logger.info(`Login URL : ${qrValue}`);
        await pageQRParser.close();
        qrcode.generate(qrValue, {
          small: false,
        });
      } else {
        logger.error("QR Code found but parse Error");
        clipboardy.writeSync(qrCodeData);
        logger.error(
          "QR Code Coppied to clippboard, go to your browser and Paste Copied QR Code"
        );
      }

      logger.info(
        "Waiting Qr Code Scanned, If After Scan the bot not give a response, posible bot Facing Captcha Security"
      );
      await this.page.waitForNavigation();
      logger.info("QR Code Scanned");
    } else {
      const email = process.env.DISCORD_EMAIL;
      const password = process.env.DISCORD_PASSWORD;

      if (!email || !password) {
        logger.error("Email or password not found in environment variables");
        throw new Error("Missing email or password in environment variables");
      }

      await this.page.type('input[name="email"]', email);
      await this.page.type('input[name="password"]', password);
      logger.info("Try to login using Provided Email & Password");
      await this.page.click('button[type="submit"]');
      await this.page.waitForNavigation();
      logger.info("Login successful");
    }
  }

  async initializingChat() {
    logger.info(`Initializing Chat Session`);
    const url = process.env.TARGET_CHAT_CHANNEL;
    if (!url) {
      logger.error(
        "Target chat channel URL is not set in environment variables"
      );
      throw new Error(
        "Missing target chat channel URL in environment variables"
      );
    }
    logger.info("Chat session initialized. Navigated to the channel.");

    await this.page.goto(url, { waitUntil: "load" });
    logger.info("Waiting for chat selector");
    await this.page.waitForSelector(this.selector);
    logger.info("Chat selector found");
  }

  async sendingMessage() {
    const message = await Helper.getRandomMessage();
    await this.page.type(this.selector, message);
    await this.page.keyboard.press("Enter");
    logger.info(`Sending Message: "${message}"`);
  }

  async closeBrowser() {
    try {
      if (this.browser) {
        logger.info("Closing Puppeteer Browser");
        await this.browser.close();
      }
    } catch (error) {
      logger.error(`Error while closing browser: ${error.message}`);
    }
  }
}
