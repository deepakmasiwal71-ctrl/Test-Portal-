from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:8080"

def run_smoke():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        page.goto(URL, timeout=15000)

        # Basic page checks
        title = page.locator('h1').inner_text()
        assert 'Mock Test Portal' in title

        # Auth section visible initially
        assert page.locator('#auth-section').is_visible()

        # Theme toggle toggles dark-theme class
        page.click('#btn-theme')
        assert page.evaluate("document.documentElement.classList.contains('dark-theme')")

        # Resize to mobile viewport and check compact class
        page.set_viewport_size({'width':360,'height':800})
        page.wait_for_timeout(400)
        assert page.evaluate("document.documentElement.classList.contains('compact-mobile')")

        print('SMOKE OK')
        browser.close()

if __name__ == '__main__':
    run_smoke()
