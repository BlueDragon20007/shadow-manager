const express = require('express');
const { Pool } = require('pg');
const path = require('path');

// Remplace ici par ton vrai mot de passe Leapcell PostgreSQL
const pool = new Pool({
  host: '9qasp5v56q8ckkf5dc.leapcellpool.com',
  port: 6438,
  user: 'xknjtjfihbxtflzvbnsj',
  password: 'edtzmmeoouheinaowuytzrcdevoziu',
  database: 'lyujpuaammmtsccwnxvw',
  ssl: { rejectUnauthorized: false }
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

const createTableQuery = `
CREATE TABLE IF NOT EXISTS ombres (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  cr INTEGER,
  tags TEXT,    -- Liste CSV pour simplicité, ou JSON si tu veux plus d'analyse
  description TEXT,
  statlink TEXT,
  nombre INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
`;

pool.query(createTableQuery)
  .then(() => console.log('Table ombres prête'))
  .catch(e => console.error('Erreur init table:', e));

// --- API ---

// GET toutes les ombres
app.get('/api/ombres', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ombres ORDER BY id');
    // On parse tags pour le front (liste JS)
    const ombres = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      cr: row.cr,
      tags: row.tags ? JSON.parse(row.tags) : [],
      description: row.description || '',
      statLink: row.statlink || '',
      nombre: row.nombre || 1
    }));
    res.json({ ombres, nextId: (ombres.length ? Math.max(...ombres.map(o=>o.id))+1 : 1) });
  } catch (e) {
    res.status(500).json({ error: 'Erreur lecture DB' });
  }
});

// POST ajouter une ombre
app.post('/api/ombres', async (req, res) => {
  const { name, cr, tags, description, statLink, nombre } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO ombres 
        (name, cr, tags, description, statlink, nombre)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        name, cr, JSON.stringify(tags || []), description, statLink, nombre || 1
      ]
    );
    const ombre = result.rows[0];
    ombre.tags = ombre.tags ? JSON.parse(ombre.tags) : [];
    ombre.statLink = ombre.statlink || '';
    res.json(ombre);
  } catch (e) {
    res.status(500).json({ error: 'Erreur insertion DB' });
  }
});

// PUT modifier une ombre
app.put('/api/ombres/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, cr, tags, description, statLink, nombre } = req.body;
  try {
    const result = await pool.query(
      `UPDATE ombres SET 
         name=$1, cr=$2, tags=$3, description=$4, statlink=$5, nombre=$6
       WHERE id=$7 RETURNING *`,
      [
        name, cr, JSON.stringify(tags || []), description, statLink, nombre || 1, id
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ombre non trouvée' });
    }
    const ombre = result.rows[0];
    ombre.tags = ombre.tags ? JSON.parse(ombre.tags) : [];
    ombre.statLink = ombre.statlink || '';
    res.json(ombre);
  } catch (e) {
    res.status(500).json({ error: 'Erreur modification DB' });
  }
});

// DELETE supprimer une ombre
app.delete('/api/ombres/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await pool.query('DELETE FROM ombres WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erreur suppression DB' });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
