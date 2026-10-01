(function () {
  const sb = getSupabaseClient();

  const PAGE_SIZE = 20; // prodotti per pagina

  const state = {
    category: null,
    priceRange: null,
    products: [],
    page: 1,
    lastFilterKey: null,
  };

  const storiesEl = document.getElementById("stories");
  const feedEl = document.getElementById("feed");
  const pagerEl = document.getElementById("pager");
  const priceFilterEl = document.getElementById("priceFilter");
  const resetBtn = document.getElementById("resetFilters");

  // ---------- Categorie ("storie") ----------
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

  // ---------- Filtro prezzo (tre parole cliccabili) ----------
  function renderPriceOptions() {
    priceFilterEl.innerHTML = PRICE_RANGES.map((p) => `
      <button type="button" class="price-word" data-price="${p.key}">${escapeHtml(p.label)}</button>
    `).join("");

    priceFilterEl.querySelectorAll(".price-word").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.price;
        state.priceRange = state.priceRange === key ? null : key; // secondo tocco = disattiva
        updateActiveStates();
        renderFeed();
      });
    });
  }

  function updateActiveStates() {
    storiesEl.querySelectorAll(".story").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.cat === state.category);
    });
    priceFilterEl.querySelectorAll(".price-word").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.price === state.priceRange);
    });
    // "Azzera filtri" compare solo se c'è almeno un filtro attivo
    resetBtn.style.visibility = (state.category || state.priceRange) ? "visible" : "hidden";
  }

  // ---------- Card prodotto ----------
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
            <a class="buy-link" href="${p.affiliate_url}" target="_blank" rel="noopener sponsored">Vedi su Amazon →</a>
          </div>
        </div>
      </article>
    `;
  }

  // ---------- Feed con pagine ----------
  function renderFeed() {
    let list = state.products;
    if (state.category) list = list.filter((p) => p.category === state.category);
    if (state.priceRange) list = list.filter((p) => p.price_range === state.priceRange);

    // se cambiano i filtri si riparte dalla pagina 1
    const filterKey = `${state.category}|${state.priceRange}`;
    if (filterKey !== state.lastFilterKey) {
      state.page = 1;
      state.lastFilterKey = filterKey;
    }

    if (list.length === 0) {
      feedEl.innerHTML = `<div class="empty-state">Nessuna cosa strana trovata con questi filtri 🤷</div>`;
      pagerEl.innerHTML = "";
      return;
    }

    const totalPages = Math.ceil(list.length / PAGE_SIZE);
    if (state.page > totalPages) state.page = totalPages;
    const start = (state.page - 1) * PAGE_SIZE;

    feedEl.innerHTML = list.slice(start, start + PAGE_SIZE).map(cardHtml).join("");
    renderPager(totalPages);
  }

  function renderPager(totalPages) {
    if (totalPages <= 1) {
      pagerEl.innerHTML = "";
      return;
    }
    pagerEl.innerHTML = `
      <button type="button" class="pager-btn pager-prev" data-go="prev" ${state.page === 1 ? "disabled" : ""}>← Precedente</button>
      <span class="pager-info">${state.page} / ${totalPages}</span>
      <button type="button" class="pager-btn pager-next" data-go="next" ${state.page === totalPages ? "disabled" : ""}>Successiva →</button>
    `;
  }

  pagerEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-go]");
    if (!btn || btn.disabled) return;
    state.page += btn.dataset.go === "next" ? 1 : -1;
    renderFeed();
    feedEl.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // ---------- Caricamento prodotti ----------
  async function loadProducts() {
    const { data, error } = await sb
      .from("products")
      .select("*")
      .eq("is_published", true)
      .lte("publish_date", todayISO())
      .order("publish_date", { ascending: false })
      .order("created_at", { ascending: false }); // a parità di data, ordine stabile tra le pagine

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

  // ---------- Newsletter ----------
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

  // ---------- Avvio ----------
  renderStories();
  renderPriceOptions();
  updateActiveStates();
  loadProducts();
})();
