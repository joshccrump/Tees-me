---
layout: page
title: Gallery
subtitle: A curated look at recent drops, collaborations, and community events.
permalink: /gallery/
---
<div class="gallery-grid">
  {% assign gallery_images = site.data.gallery %}
  {% if gallery_images %}
    {% for item in gallery_images %}
    <figure data-sr>
      <img src="{{ item.image | relative_url }}" alt="{{ item.alt }}">
      <figcaption>
        <h3>{{ item.title }}</h3>
        <p>{{ item.caption }}</p>
      </figcaption>
    </figure>
    {% endfor %}
  {% else %}
    <p>Add gallery items to <code>_data/gallery.yml</code> to see them here.</p>
  {% endif %}
</div>
