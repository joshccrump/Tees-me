---
layout: page
title: Shop
subtitle: Discover the latest capsule pieces available for pre-order and immediate ship.
permalink: /shop/
---
<div class="product-grid" data-products>
  {% for product in site.data.products %}
  <article class="product-card" data-sr data-product-id="{{ product.id }}">
    <div class="product-image">
      <img src="{{ product.image | relative_url }}" alt="{{ product.name }}">
    </div>
    <div class="product-body">
      <h3>{{ product.name }}</h3>
      <p class="product-description">{{ product.description }}</p>
      <p class="product-price">${{ '%.2f' | format: product.price }}</p>
      <button class="btn btn-primary" data-add-to-cart data-product='{{ product | jsonify }}'>Add to cart</button>
    </div>
  </article>
  {% endfor %}
</div>
