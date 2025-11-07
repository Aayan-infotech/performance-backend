// import lighthouse from "lighthouse";
// import { launch } from "chrome-launcher";

// /**
//  * Runs Lighthouse audit for a given URL
//  * @param {string} url - URL to audit
//  * @returns JSON object with scores and categories
//  */
// export async function runLighthouseAudit(url) {
//   const chrome = await launch({ chromeFlags: ["--headless"] });
//   const options = { logLevel: "info", output: "json", port: chrome.port };

//   const runnerResult = await lighthouse(url, options);
//   const report = JSON.parse(runnerResult.report);

//   await chrome.kill();

//   const categories = report.categories || {};
//   const audits = report.audits || {};

//   return {
//     url,
//     categories: {
//       performance: categories.performance?.score ?? 0,
//       accessibility: categories.accessibility?.score ?? 0,
//       seo: categories.seo?.score ?? 0,
//       bestPractices: categories["best-practices"]?.score ?? 0,
//       pwa: categories.pwa?.score ?? 0,
//     },
//     audits: {
//       firstContentfulPaint: audits["first-contentful-paint"]?.displayValue ?? "N/A",
//       largestContentfulPaint: audits["largest-contentful-paint"]?.displayValue ?? "N/A",
//       cumulativeLayoutShift: audits["cumulative-layout-shift"]?.displayValue ?? "N/A",
//       metaDescription: audits["meta-description"]?.score ?? null,
//       viewport: audits["viewport"]?.score ?? null,
//       canonical: audits["canonical"]?.score ?? null,
//       structuredData: audits["structured-data"]?.score ?? null,
//       headings: audits["heading-levels"]?.score ?? null,
//       mobileFriendly: audits["uses-responsive-images"]?.score ?? null,
//     },
//   };
// }


// import lighthouse from "lighthouse";
// import { launch } from "chrome-launcher";

// export async function runLighthouseAudit(url) {
//   const chrome = await launch({
//     chromeFlags: [
//       "--headless=new",
//       "--disable-gpu",
//       "--no-sandbox",
//       "--disable-setuid-sandbox",
//       "--disable-dev-shm-usage",
//     ],
//     logLevel: "info",
//   });

//   const options = {
//     logLevel: "info",
//     output: "json",
//     port: chrome.port,
//     maxWaitForFcp: 45000,
//     maxWaitForLoad: 60000,
//   };

//   try {
//     const runnerResult = await lighthouse(url, options);
//     const report = JSON.parse(runnerResult.report);

//     const categories = report.categories || {};
//     const audits = report.audits || {};

//     return {
//       url,
//       categories: {
//         performance: categories.performance?.score ?? 0,
//         accessibility: categories.accessibility?.score ?? 0,
//         seo: categories.seo?.score ?? 0,
//         bestPractices: categories["best-practices"]?.score ?? 0,
//         pwa: categories.pwa?.score ?? 0,
//       },
//       audits: {
//         firstContentfulPaint: audits["first-contentful-paint"]?.displayValue ?? "N/A",
//         largestContentfulPaint: audits["largest-contentful-paint"]?.displayValue ?? "N/A",
//         cumulativeLayoutShift: audits["cumulative-layout-shift"]?.displayValue ?? "N/A",
//         metaDescription: audits["meta-description"]?.score ?? null,
//         viewport: audits["viewport"]?.score ?? null,
//         canonical: audits["canonical"]?.score ?? null,
//         structuredData: audits["structured-data"]?.score ?? null,
//         headings: audits["heading-levels"]?.score ?? null,
//         mobileFriendly: audits["uses-responsive-images"]?.score ?? null,
//       },
//     };
//   } finally {
//     await chrome.kill();
//   }
// }

import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";

/**
 * Run a full Lighthouse audit with device type option
 * @param {string} url - URL to audit
 * @param {"mobile"|"desktop"} [device="mobile"] - Device type
 * @returns {Promise<object>} Lighthouse results
 */
export async function runLighthouseAudit(url, device = "mobile") {
  const chrome = await launch({
    chromeFlags: [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

  // Define device-specific configuration
  const isMobile = device === "mobile";

  const config = {
    extends: "lighthouse:default",
    settings: {
      formFactor: device,
      screenEmulation: isMobile
        ? {
            mobile: true,
            width: 360,
            height: 640,
            deviceScaleFactor: 2.625,
            disabled: false,
          }
        : {
            mobile: false,
            width: 1350,
            height: 940,
            deviceScaleFactor: 1,
            disabled: false,
          },
      throttling: isMobile
        ? {
            rttMs: 150,
            throughputKbps: 1638.4,
            cpuSlowdownMultiplier: 4,
            requestLatencyMs: 562.5,
            downloadThroughputKbps: 1474.560,
            uploadThroughputKbps: 675,
          }
        : {
            rttMs: 40,
            throughputKbps: 10240,
            cpuSlowdownMultiplier: 1,
            requestLatencyMs: 0,
            downloadThroughputKbps: 0,
            uploadThroughputKbps: 0,
          },
      onlyCategories: ["performance", "accessibility", "best-practices", "seo", "pwa"],
    },
  };

  const options = {
    logLevel: "error",
    output: "json",
    port: chrome.port,
  };

  try {
    const runnerResult = await lighthouse(url, options, config);
    const report = JSON.parse(runnerResult.report);

    const { categories, audits } = report;
    const val = (key, field = "displayValue") => audits[key]?.[field] ?? null;

    return {
      url,
      device,
      fetchTime: report.fetchTime,
      userAgent: report.userAgent,
      finalUrl: report.finalUrl,
      categories: {
        performance: categories.performance?.score ?? 0,
        accessibility: categories.accessibility?.score ?? 0,
        seo: categories.seo?.score ?? 0,
        bestPractices: categories["best-practices"]?.score ?? 0,
        pwa: categories.pwa?.score ?? 0,
      },
      performance: {
        firstContentfulPaint: val("first-contentful-paint"),
        speedIndex: val("speed-index"),
        largestContentfulPaint: val("largest-contentful-paint"),
        timeToInteractive: val("interactive"),
        totalBlockingTime: val("total-blocking-time"),
        cumulativeLayoutShift: val("cumulative-layout-shift"),
      },
    };
  } catch (err) {
    console.error("Lighthouse error:", err);
    throw new Error(err.message || "Lighthouse audit failed");
  } finally {
    await chrome.kill();
  }
}
