import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const outDir = '../reports/screenshots';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function copyPlot(src, destFilename) {
  const destPath = path.join(outDir, destFilename);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, destPath);
    console.log(`Copied plot: ${src} -> ${destFilename}`);
  }
}

// Copy EDA & Model plots
copyPlot('../plots/02_delay_by_airline.png', '11_delay_rate_visualization.png');
copyPlot('../plots/03_delay_by_month.png', '12_monthly_delay_trend.png');
copyPlot('../plots/04_delay_by_dayofweek.png', '13_day_of_week_delay_visualization.png');
copyPlot('../plots/06_top15_origin_airports.png', '14_top_delayed_airports.png');
copyPlot('../plots/08_top15_routes.png', '15_top_delayed_routes.png');
copyPlot('../plots/01_class_distribution.png', '17_target_class_distribution.png');
copyPlot('../plots/14_threshold_tradeoff.png', '18_model_evaluation_result.png');
copyPlot('../plots/11_roc_curves.png', '19_roc_curve.png');
copyPlot('../plots/12_pr_curves.png', '20_precision_recall_curve.png');
copyPlot('../plots/13_feature_importance.png', '22_feature_importance.png');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 2 });

  const capture = async (url, filename, scrollPos = 0, waitMs = 2500, customFn = null) => {
    console.log(`Navigating to ${url} for ${filename}...`);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, waitMs));

    if (customFn) {
      await customFn(page);
      await new Promise(r => setTimeout(r, 600));
    }

    if (scrollPos > 0) {
      await page.evaluate((y) => window.scrollTo(0, y), scrollPos);
      await new Promise(r => setTimeout(r, 600));
    }

    const targetPath = path.join(outDir, filename);
    await page.screenshot({ path: targetPath, fullPage: false });
    const stats = fs.statSync(targetPath);
    console.log(`Captured: ${filename} (${stats.size} bytes)`);
  };

  try {
    // 01. SKYHOUR home/dashboard page
    await capture('http://localhost:5173/', '01_skyhour_home_dashboard.png', 0, 2000);

    // 02. Flight search page
    await capture('http://localhost:5173/flights', '02_flight_search_page.png', 0, 2500);

    // 03. Flight search with actual returned results
    await capture('http://localhost:5173/flights?origin=MAA&destination=DEL&date=2026-10-01', '03_flight_search_results.png', 280, 2500);

    // 04. Flight details page
    await capture('http://localhost:5173/flight/6E204', '04_flight_details_page.png', 0, 2500);

    // 05. Flight prediction result
    await capture('http://localhost:5173/flight/6E204', '05_flight_prediction_result.png', 400, 2500);

    // 06. Prediction probability/risk display
    await capture('http://localhost:5173/flight/AI302', '06_prediction_probability_risk_display.png', 420, 2500);

    // 07. Airport intelligence page
    await capture('http://localhost:5173/airport/MAA', '07_airport_intelligence_page.png', 0, 2500);

    // 08. Route intelligence page
    await capture('http://localhost:5173/route/MAA/DEL', '08_route_intelligence_page.png', 0, 2500);

    // 09. Airline intelligence page
    await capture('http://localhost:5173/airline/6E', '09_airline_intelligence_page.png', 0, 2500);

    // 10. Historical analytics/dashboard
    await capture('http://localhost:5173/airport/DEL', '10_historical_analytics_dashboard.png', 320, 2500);

    // 16. Carrier comparison
    await capture('http://localhost:5173/route/MAA/DEL', '16_carrier_comparison.png', 500, 2500);

    // 23. Interactive aviation map
    await capture('http://localhost:5173/map', '23_interactive_aviation_map.png', 0, 3000);

    // 24. Map with valid airport/flight data
    await capture('http://localhost:5173/map', '24_map_with_flight_data.png', 0, 3000);

    // 25. Weather/METAR information
    await capture('http://localhost:5173/airport/MAA', '25_weather_metar_information.png', 600, 2500);

    // 26. Flight finder with date/time filtering
    await capture('http://localhost:5173/flights?origin=MAA&destination=DEL&date=2026-10-01&dep_time_window=06%3A00-12%3A00', '26_flight_finder_date_time_filtering.png', 0, 2500);

    // 27. Flight comparison screen
    await capture('http://localhost:5173/flights?origin=MAA&destination=DEL', '27_flight_comparison_screen.png', 0, 2500, async (p) => {
      const btns = await p.$$('button');
      for (const btn of btns) {
        const txt = await p.evaluate(el => el.textContent, btn);
        if (txt && (txt.includes('Compare') || txt.includes('Select'))) {
          await btn.click();
          await new Promise(r => setTimeout(r, 600));
          break;
        }
      }
    });

    // 28. Calendar/date-wise risk view
    await capture('http://localhost:5173/flights?origin=MAA&destination=DEL', '28_calendar_date_wise_risk_view.png', 220, 2500);

    // 29. Time-of-day risk view
    await capture('http://localhost:5173/route/MAA/DEL', '29_time_of_day_risk_view.png', 650, 2500);

    // 30. India aviation intelligence dashboard
    await capture('http://localhost:5173/airport/MAA', '30_india_aviation_intelligence_dashboard.png', 0, 2500);

    // 31. India airport intelligence
    await capture('http://localhost:5173/airport/MAA', '31_india_airport_intelligence.png', 120, 2500);

    // 32. India bottleneck analysis
    await capture('http://localhost:5173/airport/DEL', '32_india_bottleneck_analysis.png', 450, 2500);

    // 33. India route intelligence
    await capture('http://localhost:5173/route/MAA/DEL', '33_india_route_intelligence.png', 180, 2500);

    // 34. India airline intelligence
    await capture('http://localhost:5173/airline/6E', '34_india_airline_intelligence.png', 220, 2500);

    // 35. India state intelligence
    await capture('http://localhost:5173/airport/MAA', '35_india_state_intelligence.png', 780, 2500);

    // 36. Tamil Nadu comparison/analysis
    await capture('http://localhost:5173/airport/MAA', '36_tamil_nadu_comparison_analysis.png', 900, 2500);

    // 37. India aviation map
    await capture('http://localhost:5173/map', '37_india_aviation_map.png', 0, 3000);

    // 38. API/backend health or system-status screen
    await capture('http://127.0.0.1:8100/docs', '38_api_backend_health_status.png', 0, 2500);

    console.log('Finished capturing Web UI pages!');
  } catch (err) {
    console.error('Capture error:', err);
  } finally {
    await browser.close();
  }
})();
