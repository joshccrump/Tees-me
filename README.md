# Tees-me Agency Jekyll Theme

This repository contains the Agency-inspired Jekyll storefront requested for Tees-me. It includes a hero-driven landing page, gallery, shop, and cart experience with Square checkout hand-off hooks and GitHub Pages deployment automation.

## Local development

1. Install Ruby 3.x and Bundler.
2. Install dependencies:

   ```bash
   bundle install
   ```

3. Run the site locally:

   ```bash
   bundle exec jekyll serve
   ```

   Visit <http://localhost:4000/Tees-me/> (or the base URL printed in the console).

## Square checkout integration

The cart page serializes items into `localStorage` and posts them to a Vercel serverless function defined at `/api/square/checkout`. Implement that endpoint in your Vercel project to call the Square Checkout API and return `{ checkoutUrl: "https://..." }`. The client script redirects shoppers to the URL for payment.

Set the following environment variables in Vercel:

- `SQUARE_APPLICATION_ID`
- `SQUARE_ACCESS_TOKEN`
- `SQUARE_LOCATION_ID`

## Deployment to GitHub Pages

This project ships with a GitHub Actions workflow that builds the site with Jekyll and publishes it to the `gh-pages` branch using GitHub Pages.

1. Push the repository to GitHub.
2. In the repository settings, enable GitHub Pages using the `GitHub Actions` source.
3. The included workflow (`.github/workflows/deploy.yml`) will:
   - Install Ruby and Bundler
   - Cache gems
   - Build the Jekyll site with `JEKYLL_ENV=production`
   - Upload the static site to GitHub Pages

Once the workflow completes, the site will be live at `https://<username>.github.io/Tees-me/`.

## Customization

- Update `_config.yml` with your site metadata and Square IDs.
- Edit `_data/gallery.yml` and `_data/products.yml` to manage content without touching markup.
- Replace the Unsplash image URLs with your own assets under `assets/img/` for production.
