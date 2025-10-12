---
layout: page
title: Gallery
subtitle: Explore the latest looks from the Tees-me studio.
permalink: /gallery/
section_id: gallery
---
<div class="row g-4">
  {% for item in site.data.gallery %}
  <div class="col-lg-4 col-sm-6">
    <div class="card h-100 shadow-sm">
      <img src="{{ item.image }}" class="card-img-top" alt="{{ item.title }}" />
      <div class="card-body">
        <h5 class="card-title">{{ item.title }}</h5>
        <p class="card-text text-muted">{{ item.category }}</p>
      </div>
    </div>
  </div>
  {% endfor %}
</div>
