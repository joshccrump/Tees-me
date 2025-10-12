---
layout: page
title: Cart
subtitle: Review your selections and checkout securely with Square.
permalink: /cart/
---
<div class="cart" data-cart>
  <div class="cart-items" data-cart-items>
    <p class="empty-cart">Your cart is empty. Head to the <a href="{{ '/shop/' | relative_url }}">shop</a> to add products.</p>
  </div>
  <aside class="cart-summary">
    <h2>Order Summary</h2>
    <dl>
      <div class="summary-line">
        <dt>Subtotal</dt>
        <dd>$<span data-cart-subtotal>0.00</span></dd>
      </div>
      <div class="summary-line">
        <dt>Estimated tax</dt>
        <dd>$<span data-cart-tax>0.00</span></dd>
      </div>
      <div class="summary-line total">
        <dt>Total</dt>
        <dd>$<span data-cart-total>0.00</span></dd>
      </div>
    </dl>
    <button class="btn btn-primary btn-checkout" data-checkout>Checkout with Square</button>
    <p class="checkout-note">Checkout is securely powered by Square. You will confirm payment on the next screen.</p>
    <div class="alert" data-cart-alert hidden role="status"></div>
  </aside>
</div>

<section class="integration-guide">
  <h2>Square Integration Setup</h2>
  <ol>
    <li>Deploy a Vercel project with a serverless function at <code>/api/create-square-order</code> using your Square credentials.</li>
    <li>Update <code>_config.yml</code> with your Vercel endpoint, Square location ID, and application ID.</li>
    <li>Ensure your domain is authorized within the Square developer dashboard for Web Payments SDK.</li>
  </ol>
</section>
