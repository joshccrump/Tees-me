---
layout: default
title: Elevate Your Everyday Style
permalink: /
---
<section class="hero">
  <div class="container hero-content">
    <div>
      <h1>Bold streetwear made to move with you.</h1>
      <p>Drop-tested apparel, accessories, and art prints made in collaboration with Detroit makers.</p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="{{ '/shop/' | relative_url }}">Shop the drop</a>
        <a class="btn btn-outline" href="{{ '/gallery/' | relative_url }}">View lookbook</a>
      </div>
    </div>
    <div class="hero-media" role="presentation">
      <img src="{{ '/assets/images/hero-model.jpg' | relative_url }}" alt="Model wearing Tees-me apparel">
    </div>
  </div>
</section>

<section class="features">
  <div class="container grid">
    <article class="card" data-sr>
      <h2>Limited Runs</h2>
      <p>Every capsule collection is produced in small batches to keep your fit as original as you.</p>
    </article>
    <article class="card" data-sr>
      <h2>Custom Requests</h2>
      <p>Need a special size, colorway, or team order? Our in-house design squad is ready.</p>
    </article>
    <article class="card" data-sr>
      <h2>Square Powered Checkout</h2>
      <p>Secure, seamless payments and order sync through our Square Online store.</p>
    </article>
  </div>
</section>

<section class="highlight">
  <div class="container highlight-grid">
    <div>
      <h2>Upcoming Pop-Up: Eastern Market</h2>
      <p>Catch us live this Saturday for exclusive designs, custom embroidery, and on-the-spot styling sessions.</p>
      <a class="btn btn-light" href="{{ '/gallery/' | relative_url }}">Get a sneak peek</a>
    </div>
    <div class="highlight-card" role="presentation">
      <img src="{{ '/assets/images/pop-up.jpg' | relative_url }}" alt="Tees-me pop-up shop">
    </div>
  </div>
</section>

<section class="cta">
  <div class="container narrow">
    <h2>Join the crew</h2>
    <p>Subscribe for drop alerts, styling workshops, and exclusive perks.</p>
    <form class="cta-form" action="https://formspree.io/f/example" method="post">
      <label for="email" class="sr-only">Email address</label>
      <input type="email" name="email" id="email" placeholder="you@example.com" required>
      <button type="submit" class="btn btn-primary">Sign up</button>
    </form>
  </div>
</section>
