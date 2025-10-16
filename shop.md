---
layout: page
title: Shop
subtitle: Discover the latest capsule pieces available for pre-order and immediate ship.
permalink: /shop/
---
{% assign square_payload = site.data.square_products %}
{% assign items = square_payload.items | default: square_payload %}

{% if items == empty %}
<p class="empty-state">Your Square catalog is empty or failed to sync. Trigger the Square workflow to refresh products.</p>
{% else %}
<div class="product-grid" data-products>
  {% for product in items %}
  {% assign first_sku = product.skus | first %}
  {% if product.minPrice %}
    {% assign price_cents = product.minPrice.amount | times: 100 | round %}
    {% assign price_display = price_cents | divided_by: 100.0 %}
  {% endif %}
  <article class="product-card" data-sr data-product-id="{{ product.id }}">
    <div class="product-image">
      {% if product.imageUrl %}
      <img src="{{ product.imageUrl }}" alt="{{ product.name }}">
      {% endif %}
    </div>
    <div class="product-body">
      <h3>{{ product.name }}</h3>
      {% if product.description %}
      <p class="product-description">{{ product.description }}</p>
      {% endif %}
      {% if product.minPrice %}
      <p class="product-price">${{ price_display | default: product.minPrice.amount | round: 2 }} {{ product.minPrice.currency }}</p>
      {% endif %}
      {% if first_sku %}
      {% capture cart_name %}{{ product.name }}{% if first_sku.name %} — {{ first_sku.name }}{% endif %}{% endcapture %}
      {% assign cart_payload = {
        "id": first_sku.id,
        "name": cart_name | strip,
        "price": first_sku.price.amount,
        "image": product.imageUrl
      } %}
      <button class="btn btn-primary" data-add-to-cart data-product='{{ cart_payload | jsonify | escape }}'>Add to cart</button>
      {% else %}
      <button class="btn" disabled>Unavailable</button>
      {% endif %}
    </div>
  </article>
  {% endfor %}
</div>
{% endif %}
