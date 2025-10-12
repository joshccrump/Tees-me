---
layout: page
title: Cart
subtitle: Review your selections and checkout with Square.
permalink: /cart/
section_id: cart
---
<div class="row g-4">
  <div class="col-lg-8">
    <div class="table-responsive">
      <table class="table cart-table align-middle">
        <thead>
          <tr>
            <th scope="col">Product</th>
            <th scope="col">Price</th>
            <th scope="col">Quantity</th>
            <th scope="col" class="text-end">Subtotal</th>
            <th scope="col" class="text-end">Actions</th>
          </tr>
        </thead>
        <tbody data-cart-table-body>
          <tr>
            <td colspan="5" class="text-center py-5 text-muted">Your cart is empty. Visit the <a href="{{ '/shop/' | relative_url }}">shop</a> to add items.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  <div class="col-lg-4">
    <div class="cart-summary shadow-sm">
      <h4 class="text-uppercase">Order Summary</h4>
      <p class="text-muted">Items in cart: <span class="badge rounded-pill bg-dark" data-cart-count>0</span></p>
      <p class="fs-4">Total: <strong data-cart-total>$0.00</strong></p>
      <p class="small text-muted">Taxes and shipping calculated during Square checkout.</p>
      <button class="btn btn-primary w-100" data-square-checkout="/api/square/checkout">Checkout with Square</button>
      <p class="small text-muted mt-3">The checkout button calls your Vercel serverless function, which creates a Square checkout link and redirects the shopper for secure payment processing.</p>
    </div>
  </div>
</div>
