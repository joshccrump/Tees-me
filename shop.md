---
layout: page
title: Shop
subtitle: Curated apparel with seamless Square checkout.
permalink: /shop/
section_id: shop
---
<div class="row g-4">
  {% for product in site.data.products %}
  <div class="col-lg-4 col-md-6">
    <div class="card h-100 shadow-sm">
      <img src="{{ product.image }}" class="card-img-top" alt="{{ product.name }}" />
      <div class="card-body d-flex flex-column">
        <h5 class="card-title">{{ product.name }}</h5>
        <p class="card-text text-muted">{{ product.description }}</p>
        <div class="mb-3">
          {% if product.badges %}
            {% for badge in product.badges %}
            <span class="badge rounded-pill bg-dark text-uppercase">{{ badge }}</span>
            {% endfor %}
          {% endif %}
        </div>
        <div class="mb-3">
          <strong class="fs-4">${{ '%.2f' | format: product.price }}</strong>
        </div>
        <label class="form-label" for="product-{{ product.id }}-option">Size</label>
        <select class="form-select mb-3" id="product-{{ product.id }}-option" data-product-option="{{ product.id }}">
          {% for option in product.options %}
          <option value="{{ option.variant }}" data-sku="{{ option.sku }}">{{ option.variant }}</option>
          {% endfor %}
        </select>
        <button class="btn btn-primary mt-auto" data-add-to-cart data-product-id="{{ product.id }}" data-product-name="{{ product.name }}" data-product-price="{{ product.price }}" data-product-quantity="1" data-product-variant="">
          Add to Cart
        </button>
      </div>
    </div>
  </div>
  {% endfor %}
</div>
<script>
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-product-option]').forEach(function (select) {
      const productId = select.dataset.productOption;
      const button = document.querySelector('[data-add-to-cart][data-product-id="' + productId + '"]');
      if (!button) return;

      const updateVariant = () => {
        const variant = select.value;
        button.dataset.productVariant = variant;
      };

      select.addEventListener('change', updateVariant);
      updateVariant();
    });
  });
</script>
