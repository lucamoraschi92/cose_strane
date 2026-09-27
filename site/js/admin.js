(function () {
  const sb = getSupabaseClient();

  const loginBox = document.getElementById("loginBox");
  const dashboard = document.getElementById("dashboard");
  const loginForm = document.getElementById("loginForm");
  const loginError = document.getElementById("loginError");
  const logoutBtn = document.getElementById("logoutBtn");

  const productForm = document.getElementById("productForm");
  const productIdEl = document.getElementById("productId");
  const pName = document.getElementById("pName");
  const pCategory = document.getElementById("pCategory");
  const pPrice = document.getElementById("pPrice");
  const pUrl = document.getElementById("pUrl");
  const pImageFile = document.getElementById("pImageFile");
  const pImageUrl = document.getElementById("pImageUrl");
  const imagePreviewWrap = document.getElementById("imagePreviewWrap");
  const pCaption = document.getElementById("pCaption");
  const pDescription = document.getElementById("pDescription");
  const pDate = document.getElementById("pDate");
  const formTitle = document.getElementById("formTitle");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
  const aiSuggestBtn = document.getElementById("aiSuggestBtn");
  const aiError = document.getElementById("aiError");
  const productList = document.getElementById("productList");

  // ---------- Toast ----------
  function toast(msg) {
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    document.getElementById("toastHolder").appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }

  // ---------- Select options ----------
  function fillSelects() {
    pCategory.innerHTML = CATEGORIES.map((c) => `<option value="${c.key}">${escapeHtml(c.label)}</option>`).join("");
    pPrice.innerHTML = PRICE_RANGES.map((p) => `<option value="${p.key}">${escapeHtml(p.label)}</option>`).join("");
  }

  // ---------- Auth ----------
  async function checkAuth() {
    const { data } = await sb.auth.getSession();
    if (data.session) {
      showDashboard();
    } else {
      showLogin();
    }
  }

  function showLogin() {
    loginBox.style.display = "block";
    dashboard.style.display = "none";
  }

  function showDashboard() {
    loginBox.style.display = "none";
    dashboard.style.display = "block";
    resetForm();
    loadProducts();
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.textContent = "";
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      loginError.textContent = "Errore: " + error.message;
      console.error(error);
      return;
    }
    showDashboard();
  });

  logoutBtn.addEventListener("click", async () => {
    await sb.auth.signOut();
    showLogin();
  });

  // ---------- Image upload ----------
  let pendingFile = null;
  pImageFile.addEventListener("change", () => {
    pendingFile = pImageFile.files[0] || null;
    imagePreviewWrap.innerHTML = "";
    if (pendingFile) {
      const url = URL.createObjectURL(pendingFile);
      imagePreviewWrap.innerHTML = `<img src="${url}" style="width:100px;height:100px;object-fit:cover;border-radius:10px;border:2px solid var(--line);" />`;
    } else if (pImageUrl.value) {
      imagePreviewWrap.innerHTML = `<img src="${pImageUrl.value}" style="width:100px;height:100px;object-fit:cover;border-radius:10px;border:2px solid var(--line);" />`;
    }
  });

  async function uploadImageIfNeeded() {
    if (!pendingFile) return pImageUrl.value || null;
    const ext = pendingFile.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await sb.storage.from("product-images").upload(path, pendingFile, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      throw new Error("Upload immagine fallito: " + error.message);
    }
    const { data } = sb.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  }

  // ---------- AI suggestion ----------
  aiSuggestBtn.addEventListener("click", async () => {
    aiError.textContent = "";
    const name = pName.value.trim();
    if (!name) {
      aiError.textContent = "Scrivi prima il nome del prodotto.";
      return;
    }
    aiSuggestBtn.disabled = true;
    aiSuggestBtn.textContent = "Sto pensando... 🤔";
    try {
      const res = await fetch("/api/suggest-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category: pCategory.value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore AI");
      if (data.caption) pCaption.value = data.caption;
      if (data.description) pDescription.value = data.description;
    } catch (err) {
      aiError.textContent = "Non sono riuscito a generare il testo: " + err.message;
      console.error(err);
    } finally {
      aiSuggestBtn.disabled = false;
      aiSuggestBtn.textContent = "✨ Suggerisci testo con l'AI";
    }
  });

  // ---------- Form reset / edit ----------
  function resetForm() {
    productForm.reset();
    productIdEl.value = "";
    pImageUrl.value = "";
    pendingFile = null;
    imagePreviewWrap.innerHTML = "";
    formTitle.textContent = "Nuovo prodotto";
    cancelEditBtn.style.display = "none";
    pDate.value = todayISO();
  }

  cancelEditBtn.addEventListener("click", resetForm);

  function fillFormForEdit(p) {
    productIdEl.value = p.id;
    pName.value = p.name;
    pCategory.value = p.category;
    pPrice.value = p.price_range;
    pUrl.value = p.affiliate_url;
    pImageUrl.value = p.image_url || "";
    pCaption.value = p.short_caption || "";
    pDescription.value = p.description || "";
    pDate.value = p.publish_date || todayISO();
    imagePreviewWrap.innerHTML = p.image_url
      ? `<img src="${p.image_url}" style="width:100px;height:100px;object-fit:cover;border-radius:10px;border:2px solid var(--line);" />`
      : "";
    formTitle.textContent = "Modifica prodotto";
    cancelEditBtn.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ---------- Save (create or update) ----------
  productForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitter = e.submitter;
    const isPublished = submitter ? submitter.dataset.published === "true" : false;

    const saveButtons = productForm.querySelectorAll('button[type=submit]');
    saveButtons.forEach((b) => (b.disabled = true));

    try {
      const imageUrl = await uploadImageIfNeeded();

      const payload = {
        name: pName.value.trim(),
        category: pCategory.value,
        price_range: pPrice.value,
        affiliate_url: pUrl.value.trim(),
        image_url: imageUrl,
        short_caption: pCaption.value.trim(),
        description: pDescription.value.trim(),
        publish_date: pDate.value,
        is_published: isPublished,
      };

      const id = productIdEl.value;
      let error;
      if (id) {
        ({ error } = await sb.from("products").update(payload).eq("id", id));
      } else {
        ({ error } = await sb.from("products").insert(payload));
      }
      if (error) throw error;

      toast(id ? "Prodotto aggiornato ✅" : "Prodotto salvato ✅");
      resetForm();
      loadProducts();
    } catch (err) {
      toast("Errore: " + err.message);
      console.error(err);
    } finally {
      saveButtons.forEach((b) => (b.disabled = false));
    }
  });

  // ---------- List ----------
  function statusOf(p) {
    if (!p.is_published) return { key: "bozza", label: "Bozza" };
    if (p.publish_date && p.publish_date > todayISO()) return { key: "programmato", label: "Programmato" };
    return { key: "pubblicato", label: "Pubblicato" };
  }

  async function loadProducts() {
    const { data, error } = await sb
      .from("products")
      .select("*")
      .order("publish_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      productList.innerHTML = `<p class="hint">Errore nel caricamento: ${escapeHtml(error.message)}</p>`;
      return;
    }
    if (!data || data.length === 0) {
      productList.innerHTML = `<p class="hint">Nessun prodotto ancora. Aggiungine uno dal form sopra.</p>`;
      return;
    }

    productList.innerHTML = data.map((p) => {
      const st = statusOf(p);
      const cat = categoryByKey(p.category);
      return `
        <div class="product-row">
          <img src="${p.image_url || (cat ? cat.icon : '')}" alt="" />
          <div class="info">
            <div class="name">${escapeHtml(p.name)}</div>
            <div class="meta">${cat ? escapeHtml(cat.label) : ''} · ${p.publish_date || '—'}</div>
          </div>
          <span class="status-pill status-${st.key}">${st.label}</span>
          <div class="row-actions">
            <button type="button" class="btn-secondary" data-edit="${p.id}">Modifica</button>
            <button type="button" class="btn-secondary" data-del="${p.id}">Elimina</button>
          </div>
        </div>
      `;
    }).join("");

    productList.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const p = data.find((x) => x.id === btn.dataset.edit);
        if (p) fillFormForEdit(p);
      });
    });
    productList.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Eliminare questo prodotto?")) return;
        const { error } = await sb.from("products").delete().eq("id", btn.dataset.del);
        if (error) {
          toast("Errore eliminazione: " + error.message);
        } else {
          toast("Prodotto eliminato");
          loadProducts();
        }
      });
    });
  }

  // ---------- Init ----------
  fillSelects();
  resetForm();
  checkAuth();
})();
