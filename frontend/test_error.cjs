const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  try {
    const page = await browser.newPage();
    
    // Catch all console logs and errors directly from the browser context
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
    page.on('error', err => console.log('CRASH ERROR:', err.toString()));

    await page.goto('http://localhost:5173');
    await new Promise(r => setTimeout(r, 2000));
    
    // Login
    await page.type('input[type="email"]', 'juan.perez@inmotika.com');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await new Promise(r => setTimeout(r, 3000));
    
    // Go to Clientes
    await page.evaluate(() => {
        const spans = Array.from(document.querySelectorAll('span'));
        const clientes = spans.find(s => s.textContent.includes('Clientes'));
        if (clientes) clientes.click();
    });
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Click Ver Sucursales (if it exists directly, or whatever triggers the branches view)
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const verSuc = btns.find(b => b.textContent && b.textContent.includes('Ver Sucursales'));
        if (verSuc) {
          verSuc.click();
        } else {
          console.log('BOTÓN "Ver Sucursales" NO ENCONTRADO');
        }
    });
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Click first branch name to trigger branch-details view
    await page.evaluate(() => {
        const h3s = Array.from(document.querySelectorAll('h3'));
        let branchTrigger = null;
        for (let el of document.querySelectorAll('button, h3, a')) {
           if (el.textContent && el.textContent.includes('Sucursal 1')) {
               branchTrigger = el;
               break;
           }
        }

        if (branchTrigger) {
            console.log('Triggering click on branch:', branchTrigger.textContent);
            branchTrigger.click();
        } else {
            console.log('Could not find branch name to click');
        }
    });
    
    await new Promise(r => setTimeout(r, 2000)); // Wait for error to print to console
    
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('--- Final Page Content ---');
    console.log(bodyText.substring(0, 500));
    
  } catch (err) {
    console.error('SCRIPT EXECUTION ERROR:', err);
  } finally {
    await browser.close();
  }
})();
