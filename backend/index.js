const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Conexão com o banco PostgreSQL no Neon para a Tribo de Judá
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Teste de conexão
pool.connect()
  .then(() => console.log('Conectado ao banco PostgreSQL da Tribo de Judá com sucesso!'))
  .catch(err => console.error('Erro de conexão com o banco:', err));

// ==========================================
// ROTAS DE JOVENS (TRIBO DE JUDÁ)
// ==========================================

// 1. Listar todos os jovens
app.get('/jovens', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM jovens ORDER BY nome ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Cadastrar um novo jovem
app.post('/jovens', async (req, res) => {
  const { nome, telefone, categoria, notas } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO jovens (nome, telefone, categoria, notas) VALUES ($1, $2, $3, $4) RETURNING *',
      [nome, telefone || '', categoria, notas || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ROTAS DE RELATÓRIOS E PRESENÇAS
// ==========================================

// 3. Salvar o check-list do dia e gerar o relatório
app.post('/relatorios', async (req, res) => {
  const { data, tipo_dia, presencas } = req.body;
  // presencas é um array de objetos: [ { jovem_id: 1, status: 'Firme' }, ... ]
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Cria o registro do relatório
    const relatorioRes = await client.query(
      'INSERT INTO relatorios (data, tipo_dia) VALUES ($1, $2) RETURNING id',
      [data, tipo_dia]
    );
    const relatorioId = relatorioRes.rows[0].id;

    // Salva as presenças/status de cada jovem no dia
    for (let p of presencas) {
      await client.query(
        'INSERT INTO presencas (relatorio_id, jovem_id, status_no_dia) VALUES ($1, $2, $3)',
        [relatorioId, p.jovem_id, p.status]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Relatório salvo com sucesso!', relatorioId });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ==========================================
// PORTA DO SERVIDOR
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor da Tribo de Judá rodando na porta ${PORT}`);
});
// 4. Excluir um jovem
app.delete('/jovens/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM jovens WHERE id = $1', [id]);
    res.json({ message: 'Jovem excluído com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});