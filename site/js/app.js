(function () {
  const sb = getSupabaseClient();

  const state = {
    category: null,
    priceRange: null,
    products: [],
  };

  const storiesEl = document.getElementById("stories");
  const feedEl = document.getElementById("feed");
  const priceFilterEl = document.getElementById("priceFilter");
  const resetBtn = document.getElementById("resetFilters");

  function renderStories() {
    storiesEl.innerHTML = CATEGORIES.map((c) => `
      <button class="story" data-cat="${c.key}">
        <span class="ring"><img src="${c.icon}" alt="${escapeHtml(c.label)}" /></span>
        <span>${escapeHtml(c.label)}</span>
      </button>
    `).join("");

    storiesEl.querySelectorAll(".story").forEach((btn) => {
      btn.addEventListener("click", () => {
        const cat = btn.dataset.cat;
        state.category = state.category === cat ? null : cat;
        updateActiveStates();
        renderFeed();
      });
    });
  }

function renderPriceOptions() {
    priceFilterEl.innerHTML = PRICE_RANGES.map((p) => `
      <button type="button" class="pill" data-price="${p.key}">${escapeHtml(p.label)}</button>
    `).join("");

    priceFilterEl.querySelectorAll(".pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.price;
        state.priceRange = state.priceRange === key ? null : key;  // secondo tocco = disattiva
        updateActiveStates();
        renderFeed();
      });
    });
  }

  function updateActiveStates() {
    storiesEl.querySelectorAll(".story").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.cat === state.category);
    });
    priceFilterEl.querySelectorAll(".pill").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.price === state.priceRange);
    });
    // la X compare solo se c'è almeno un filtro attivo
    resetBtn.style.visibility = (state.category || state.priceRange) ? "visible" : "hidden";
  }

  function cardHtml(p) {
    const cat = categoryByKey(p.category);
    const img = p.image_url || (cat ? cat.icon : "assets/logo/logo-mark.png");
    return `
      <article class="card">
        <div class="img-wrap"><img src="${img}" alt="${escapeHtml(p.name)}" loading="lazy" /></div>
        <div class="body">
          <h3>${escapeHtml(p.name)}</h3>
          ${p.short_caption ? `<p class="caption">${escapeHtml(p.short_caption)}</p>` : ''}
          <div class="row">
            <span class="cat-tag">
              <img src="${cat ? cat.icon : ''}" alt="" />
              ${cat ? escapeHtml(cat.label) : ''}
            </span>
            <a class="btn" href="${p.affiliate_url}" target="_blank" rel="noopener sponsored">Vedi su Amazon</a>
          </div>
        </div>
      </article>
    `;
  }

  function renderFeed() {
    let list = state.products;
    if (state.category) list = list.filter((p) => p.category === state.category);
    if (state.priceRange) list = list.filter((p) => p.price_range === state.priceRange);

    if (list.length === 0) {
      feedEl.innerHTML = `<div class="empty-state">Nessuna cosa strana trovata con questi filtri 🤷</div>`;
      return;
    }
    feedEl.innerHTML = list.map(cardHtml).join("");
  }

  async function loadProducts() {
    const { data, error } = await sb
      .from("products")
      .select("*")
      .eq("is_published", true)
      .lte("publish_date", todayISO())
      .order("publish_date", { ascending: false });

    if (error) {
      feedEl.innerHTML = `<div class="empty-state">Errore nel caricamento dei prodotti.<br>${escapeHtml(error.message)}</div>`;
      console.error(error);
      return;
    }
    state.products = data || [];
    renderFeed();
  }

  resetBtn.addEventListener("click", () => {
    state.category = null;
    state.priceRange = null;
    updateActiveStates();
    renderFeed();
  });

  document.getElementById("newsletterForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const emailEl = document.getElementById("newsletterEmail");
    const msgEl = document.getElementById("newsletterMsg");
    const email = emailEl.value.trim();
    msgEl.textContent = "Un attimo…";
    const { error } = await sb.from("newsletter_subscribers").insert({ email });
    if (error) {
      if (error.code === "23505") {
        msgEl.textContent = "Sei già iscritto, grazie! 🎉";
      } else {
        msgEl.textContent = "Qualcosa è andato storto, riprova.";
        console.error(error);
      }
    } else {
      msgEl.textContent = "Iscrizione avvenuta! Benvenuto tra gli amanti dello strano. 🎉";
      emailEl.value = "";
    }
  });

  renderStories();
  renderPriceOptions();
  updateActiveStates();
  loadProducts();
})();
