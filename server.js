const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'ombres.json');

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Initialise le fichier JSON s'il n'existe pas
if (!fs.existsSync(path.dirname(DATA_FILE))) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ ombres: [], nextId: 1 }));
}

// Lire les données
function readData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

// Sauvegarder les données
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Routes API

// GET toutes les ombres
app.get('/api/ombres', (req, res) => {
  const data = readData();
  res.json(data);
});

// POST ajouter une ombre
app.post('/api/ombres', (req, res) => {
  const data = readData();
  const newOmbre = {
    id: data.nextId++,
    ...req.body
  };
  data.ombres.push(newOmbre);
  writeData(data);
  res.json(newOmbre);
});

// PUT modifier une ombre
app.put('/api/ombres/:id', (req, res) => {
  const data = readData();
  const id = parseInt(req.params.id);
  const index = data.ombres.findIndex(o => o.id === id);
  if (index !== -1) {
    data.ombres[index] = { ...data.ombres[index], ...req.body };
    writeData(data);
    res.json(data.ombres[index]);
  } else {
    res.status(404).json({ error: 'Ombre non trouvée' });
  }
});

// DELETE supprimer une ombre
app.delete('/api/ombres/:id', (req, res) => {
  const data = readData();
  const id = parseInt(req.params.id);
  data.ombres = data.ombres.filter(o => o.id !== id);
  writeData(data);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
