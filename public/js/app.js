const CR_LIMITS = {
  "1-9": 500,
  "10-14": 100,
  "15-19": 50,
  "20-59": 20,
  "60+": 1,
};

let ombres = [];
let nextId = 1;
const CR_CATEGORIES = ["1-9", "10-14", "15-19", "20-59", "60+"];
let editId = null;

// === FONCTIONS API ===

async function loadOmbres() {
  try {
    const response = await fetch("/api/ombres");
    const data = await response.json();
    ombres = data.ombres;
    nextId = data.nextId;
    renderList();
  } catch (error) {
    console.error("Erreur chargement:", error);
    alert("Erreur lors du chargement des ombres");
  }
}

async function saveOmbre(ombre) {
  try {
    const response = await fetch("/api/ombres", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ombre),
    });
    return await response.json();
  } catch (error) {
    console.error("Erreur sauvegarde:", error);
    alert("Erreur lors de la sauvegarde");
  }
}

async function updateOmbre(id, ombre) {
  try {
    const response = await fetch(`/api/ombres/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ombre),
    });
    return await response.json();
  } catch (error) {
    console.error("Erreur modification:", error);
    alert("Erreur lors de la modification");
  }
}

async function deleteOmbre(id) {
  try {
    await fetch(`/api/ombres/${id}`, {
      method: "DELETE",
    });
  } catch (error) {
    console.error("Erreur suppression:", error);
    alert("Erreur lors de la suppression");
  }
}

// === FONCTIONS UTILITAIRES ===

function getCRRange(cr) {
  if (cr >= 1 && cr <= 9) return "1-9";
  if (cr >= 10 && cr <= 14) return "10-14";
  if (cr >= 15 && cr <= 19) return "15-19";
  if (cr >= 20 && cr <= 59) return "20-59";
  if (cr >= 60) return "60+";
  return "";
}

function getAllTags() {
  const set = new Set();
  ombres.forEach((o) => o.tags.forEach((tag) => tag && set.add(tag)));
  return Array.from(set).sort();
}

function renderCount(filteredOmbres) {
  const crF = (document.getElementById("cr-filter").value || "").trim();
  const countDiv = document.getElementById("ombre-count");
  const totalCount = filteredOmbres.reduce(
    (sum, o) => sum + (parseInt(o.nombre) || 1),
    0
  );
  if (crF && CR_LIMITS[crF] !== undefined) {
    countDiv.textContent = `${totalCount} / ${CR_LIMITS[crF]} ombres dans CR ${crF}`;
  } else {
    const fullTotal = ombres.reduce(
      (sum, o) => sum + (parseInt(o.nombre) || 1),
      0
    );
    countDiv.textContent = `Total : ${fullTotal} ombres`;
  }
}

function renderList() {
  editId = null;
  const main = document.getElementById("main-view");
  const searchQ = (document.getElementById("search").value || "")
    .trim()
    .toLowerCase();
  const crF = (document.getElementById("cr-filter").value || "").trim();
  const tagF = (document.getElementById("tag-filter").value || "")
    .trim()
    .toLowerCase();

  let filtered = ombres.filter((o) => {
    let ok = true;
    if (
      searchQ &&
      !(
        o.name.toLowerCase().includes(searchQ) ||
        o.tags.join(" ").toLowerCase().includes(searchQ) ||
        o.description.toLowerCase().includes(searchQ)
      )
    )
      ok = false;
    if (tagF && !o.tags.map((t) => t.toLowerCase()).includes(tagF)) ok = false;
    if (crF && getCRRange(o.cr) !== crF) ok = false;
    return ok;
  });

  renderCount(filtered);

  let html = "";
  if (filtered.length === 0) {
    html = `<p style="color:var(--text-muted)">Aucune ombre trouvée.</p>`;
  } else {
    filtered.forEach((o) => {
      const crCat = getCRRange(o.cr);
      html += `<div class="creature-card">
        <h3>${o.name} <span style="font-size:0.90em;font-weight:400;">(CR ${
        o.cr
      })</span>
            <span style="margin-left:16px;color:var(--primary-accent);font-weight:600;">x${
              o.nombre || 1
            }</span>
        </h3>
        <div class="creature-info">
          ${o.tags.length ? `<span>Tags: ${o.tags.join(", ")}</span>` : ""}
          <span>Catégorie CR: ${crCat}</span>
        </div>
        <div class="creature-desc">${o.description || ""}</div>
        ${
          o.statLink
            ? `<div class="creature-link"><a href="${o.statLink}" target="_blank">Stat Sheet</a></div>`
            : ""
        }
        <div style="margin-top:1em;display:flex;gap:0.6em;justify-content:center;">
          <button class="mini-btn edit-btn" data-id="${o.id}">Modifier</button>
          <button class="mini-btn delete-btn" data-id="${
            o.id
          }" style="background:#611;color:white;">Supprimer</button>
          <button class="mini-btn plus-btn" data-id="${
            o.id
          }" style="background:var(--primary-accent);color:white;">+1</button>
          <button class="mini-btn minus-btn" data-id="${
            o.id
          }" style="background:#257;color:white;">-1</button>
        </div>
      </div>`;
    });
  }
  main.innerHTML = html;
  updateFilters();

  main
    .querySelectorAll(".edit-btn")
    .forEach(
      (btn) =>
        (btn.onclick = () => editOmbre(parseInt(btn.getAttribute("data-id"))))
    );
  main
    .querySelectorAll(".delete-btn")
    .forEach(
      (btn) =>
        (btn.onclick = () =>
          handleDelete(parseInt(btn.getAttribute("data-id"))))
    );
  main
    .querySelectorAll(".plus-btn")
    .forEach(
      (btn) =>
        (btn.onclick = () =>
          handleIncrement(parseInt(btn.getAttribute("data-id"))))
    );
  main
    .querySelectorAll(".minus-btn")
    .forEach(
      (btn) =>
        (btn.onclick = () =>
          handleDecrement(parseInt(btn.getAttribute("data-id"))))
    );
}

function updateFilters() {
  const tagSel = document.getElementById("tag-filter");
  const tags = getAllTags();
  const prevTagVal = tagSel.value;
  tagSel.innerHTML =
    '<option value="">Tous les tags</option>' +
    tags.map((t) => `<option value="${t}">${t}</option>`).join("");
  tagSel.value = prevTagVal;
}

function renderAddForm(isEdit = false, values = {}) {
  const main = document.getElementById("main-view");
  main.innerHTML = `
    <form id="add-form">
      <h2>${isEdit ? "Modifier" : "Ajouter"} une ombre</h2>
      <label>Nom
        <input type="text" name="name" required value="${values.name || ""}">
      </label>
      <label>CR
        <input type="number" name="cr" min="0" required value="${
          values.cr || ""
        }">
      </label>
      <label>Tags (séparés par des virgules)
        <input type="text" name="tags" placeholder="tank, volant…" value="${
          values.tags ? values.tags.join(", ") : ""
        }">
      </label>
      <label>Description
        <textarea name="description" rows="2" style="font-size:0.97em;">${
          values.description || ""
        }</textarea>
      </label>
      <label>Lien stat sheet
        <input type="url" name="statLink" placeholder="https://..." value="${
          values.statLink || ""
        }">
      </label>
      <label>Nombre d'ombres identiques
        <input type="number" name="nombre" min="1" required value="${
          values.nombre || 1
        }">
      </label>
      <div style="margin-top:12px;display:flex;gap:1em;">
        <button type="submit">${isEdit ? "Modifier" : "Ajouter"}</button>
        <button type="button" id="cancel-btn" style="background:var(--background-main);color:var(--primary-accent);border:1px solid var(--primary-accent);">Annuler</button>
      </div>
    </form>
  `;

  document.getElementById("cancel-btn").onclick = () => {
    editId = null;
    loadOmbres();
  };

  document.getElementById("add-form").onsubmit = async function (e) {
    e.preventDefault();
    const data = new FormData(this);
    const name = data.get("name").trim();
    const cr = parseInt(data.get("cr"), 10);
    const tags = data
      .get("tags")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const description = data.get("description").trim();
    const statLink = data.get("statLink").trim();
    const nombre = Math.max(1, parseInt(data.get("nombre"), 10) || 1);
    const crCat = getCRRange(cr);

    if (CR_LIMITS[crCat] !== undefined) {
      const countSansCelleCi = ombres
        .filter(
          (o) => getCRRange(o.cr) === crCat && (!isEdit || o.id !== editId)
        )
        .reduce((sum, o) => sum + (parseInt(o.nombre) || 1), 0);
      if (countSansCelleCi + nombre > CR_LIMITS[crCat]) {
        alert(
          `Limite atteinte pour la catégorie CR "${crCat}" (${CR_LIMITS[crCat]} max).`
        );
        return;
      }
    }
    if (!name || isNaN(cr)) return;

    if (isEdit) {
      await updateOmbre(editId, {
        name,
        cr,
        tags,
        description,
        statLink,
        nombre,
      });
    } else {
      await saveOmbre({ name, cr, tags, description, statLink, nombre });
    }
    await loadOmbres();
  };
}

// === HANDLERS ===

function editOmbre(id) {
  const ombre = ombres.find((o) => o.id === id);
  if (!ombre) return;
  editId = id;
  renderAddForm(true, ombre);
}

async function handleDelete(id) {
  if (window.confirm("Supprimer définitivement cette ombre ?")) {
    await deleteOmbre(id);
    await loadOmbres();
  }
}

async function handleIncrement(id) {
  const ombre = ombres.find((o) => o.id === id);
  if (!ombre) return;
  const crCat = getCRRange(ombre.cr);
  const countSansCelleCi = ombres
    .filter((o) => getCRRange(o.cr) === crCat && o.id !== id)
    .reduce((sum, o) => sum + (parseInt(o.nombre) || 1), 0);
  if (countSansCelleCi + ombre.nombre + 1 > CR_LIMITS[crCat]) {
    alert(
      `Limite atteinte pour la catégorie CR "${crCat}" (${CR_LIMITS[crCat]} max).`
    );
    return;
  }
  await updateOmbre(id, { nombre: ombre.nombre + 1 });
  await loadOmbres();
}

async function handleDecrement(id) {
  const ombre = ombres.find((o) => o.id === id);
  if (!ombre) return;
  const newNombre = ombre.nombre - 1;
  if (newNombre < 1) {
    if (window.confirm("Supprimer cette ombre ?")) {
      await deleteOmbre(id);
    }
  } else {
    await updateOmbre(id, { nombre: newNombre });
  }
  await loadOmbres();
}

// === NAVIGATION ===

document.getElementById("add-btn").onclick = () => renderAddForm(false, {});
document.getElementById("search").addEventListener("input", renderList);
document.getElementById("tag-filter").addEventListener("change", renderList);
document.getElementById("cr-filter").addEventListener("change", renderList);

// Chargement initial
loadOmbres();
