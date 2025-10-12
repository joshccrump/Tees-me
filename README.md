# Tees-me

A custom ecommerce website powered by the [Agency Jekyll Theme](https://jekyllthemes.io/theme/agency-jekyll-theme) design language and built for deployment on GitHub Pages. The storefront showcases capsule collections, a gallery lookbook, and a Square-connected checkout flow orchestrated through Vercel.

## Getting started

1. Install Ruby (3.1+) and Bundler if you plan to build locally.
2. Install dependencies:

   ```bash
   bundle install
   ```

3. Run the development server:

   ```bash
   bundle exec jekyll serve --livereload
   ```

4. Visit `http://localhost:4000` to preview the site.

The site is configured for GitHub Pages. Commit your changes to the `work` branch and publish via GitHub Pages to go live.

## Content management

- **Home page**: Update `index.md` to modify hero messaging, features, and call-to-action content.
- **Gallery**: Edit `_data/gallery.yml` to manage gallery entries. Upload supporting imagery to `assets/images/gallery/`.
- **Shop**: Edit `_data/products.yml` to manage products. Assets live in `assets/images/products/`.
- **Cart**: `cart.md` contains copy for the checkout page and an integration checklist.

## Square + Vercel integration

1. Create a Vercel project that exposes a serverless function at `/api/create-square-order`. The function should:
   - Accept the cart payload: `[{ id, name, quantity, price, image }]`.
   - Call the Square Orders API and Web Payments SDK to generate a checkout link.
   - Return `{ checkoutUrl: "https://squareup.com/..." }` in the JSON response.
2. Store your Square access token and location ID in Vercel environment variables. Example Node.js handler:

   ```js
   // /api/create-square-order.js
   import { Client } from 'square';
   import { randomUUID } from 'crypto';

   export default async function handler(req, res) {
     const client = new Client({ accessToken: process.env.SQUARE_ACCESS_TOKEN, environment: 'production' });
     const { items, locationId } = req.body;
     const lineItems = items.map((item) => ({
       name: item.name,
       quantity: String(item.quantity),
       basePriceMoney: { amount: Math.round(item.price * 100), currency: 'USD' }
     }));

     const { result } = await client.checkoutApi.createPaymentLink({
       idempotencyKey: randomUUID(),
       order: { locationId, lineItems }
     });

     res.status(200).json({ checkoutUrl: result.paymentLink.url });
   }
   ```

3. Update `_config.yml` with:
   - `square.vercel_endpoint`: Your deployed Vercel function URL.
   - `square.location_id`: Your Square location ID.
   - `square.application_id`: Used if you later embed the Web Payments SDK.
4. Redeploy the site to propagate configuration changes.

## Accessibility & performance

- Responsive navigation with a consistent header across every page.
- Cart state stored client-side; nav badge reflects current quantity.
- Scroll-based animations (optional) via ScrollReveal.

## Deployment checklist

- [ ] Replace placeholder imagery in `assets/images`.
- [ ] Confirm Vercel serverless function responds with a valid Square checkout URL.
- [ ] Update social metadata and SEO defaults in `_config.yml`.
- [ ] Configure `url` in `_config.yml` with your GitHub Pages domain.

