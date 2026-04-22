const { query } = require('../../shared/db/pool');
const { paginate, paginatedResponse } = require('../../shared/db/paginate');
const { withTransaction } = require('../../shared/db/transaction');

async function getAccounts(condominiumId) {
  const { rows } = await query(
    'SELECT * FROM financial_accounts WHERE condominium_id = $1 AND is_active = TRUE ORDER BY name',
    [condominiumId]
  );
  return rows;
}

async function createAccount(condominiumId, data) {
  const { rows: [account] } = await query(
    `INSERT INTO financial_accounts (condominium_id, name, type, bank_name, agency, account_number)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [condominiumId, data.name, data.type || 'CORRENTE', data.bank_name, data.agency, data.account_number]
  );
  return account;
}

async function listEntries(condominiumId, filters = {}) {
  const { limit, offset, page } = paginate(filters.page, filters.limit);
  const params = [condominiumId];
  let sql = `
    SELECT fe.*, fa.name AS account_name, u.name AS created_by_name
    FROM financial_entries fe
    JOIN financial_accounts fa ON fe.account_id = fa.id
    LEFT JOIN users u ON fe.created_by_id = u.id
    WHERE fe.condominium_id = $1
  `;

  if (filters.type) {
    params.push(filters.type);
    sql += ` AND fe.type = $${params.length}`;
  }
  if (filters.start) {
    params.push(filters.start);
    sql += ` AND fe.competence_date >= $${params.length}`;
  }
  if (filters.end) {
    params.push(filters.end);
    sql += ` AND fe.competence_date <= $${params.length}`;
  }
  if (filters.account_id) {
    params.push(filters.account_id);
    sql += ` AND fe.account_id = $${params.length}`;
  }

  const { rows: [{ count }] } = await query(
    sql.replace('SELECT fe.*, fa.name AS account_name, u.name AS created_by_name', 'SELECT COUNT(*)'),
    params
  );

  sql += ` ORDER BY fe.competence_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const { rows } = await query(sql, params);
  return paginatedResponse(rows, count, page, limit);
}

async function createEntry(condominiumId, data, userId) {
  return withTransaction(async (client) => {
    const { rows: [entry] } = await client.query(
      `INSERT INTO financial_entries
       (condominium_id, account_id, demand_id, quote_id, type, category, description, amount, competence_date, is_paid, created_by_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [condominiumId, data.account_id, data.demand_id, data.quote_id, data.type,
       data.category, data.description, data.amount, data.competence_date,
       data.is_paid || false, userId]
    );

    if (data.is_paid) {
      const delta = data.type === 'RECEITA' ? data.amount : -data.amount;
      await client.query(
        'UPDATE financial_accounts SET balance = balance + $1 WHERE id = $2',
        [delta, data.account_id]
      );
    }

    return entry;
  });
}

async function markAsPaid(id, condominiumId) {
  return withTransaction(async (client) => {
    const { rows: [entry] } = await client.query(
      `UPDATE financial_entries SET is_paid = TRUE, payment_date = CURRENT_DATE, updated_at = NOW()
       WHERE id = $1 AND condominium_id = $2 AND is_paid = FALSE RETURNING *`,
      [id, condominiumId]
    );
    if (!entry) {
      const err = new Error('Lançamento não encontrado ou já pago');
      err.statusCode = 404;
      throw err;
    }
    const delta = entry.type === 'RECEITA' ? entry.amount : -entry.amount;
    await client.query(
      'UPDATE financial_accounts SET balance = balance + $1 WHERE id = $2',
      [delta, entry.account_id]
    );
    return entry;
  });
}

async function getMonthlyReport(condominiumId, year, month) {
  const start = `${year}-${String(month).padStart(2,'0')}-01`;
  const end = new Date(year, month, 0).toISOString().split('T')[0];

  const { rows } = await query(
    `SELECT type, category,
       SUM(amount) AS total,
       COUNT(*) AS count
     FROM financial_entries
     WHERE condominium_id = $1 AND competence_date BETWEEN $2 AND $3
     GROUP BY type, category
     ORDER BY type, total DESC`,
    [condominiumId, start, end]
  );

  const receitas = rows.filter((r) => r.type === 'RECEITA');
  const despesas = rows.filter((r) => r.type === 'DESPESA');
  const totalReceita = receitas.reduce((s, r) => s + parseFloat(r.total), 0);
  const totalDespesa = despesas.reduce((s, r) => s + parseFloat(r.total), 0);

  return { receitas, despesas, totalReceita, totalDespesa, saldo: totalReceita - totalDespesa };
}

module.exports = { getAccounts, createAccount, listEntries, createEntry, markAsPaid, getMonthlyReport };
