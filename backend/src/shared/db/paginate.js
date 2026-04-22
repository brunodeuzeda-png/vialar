function paginate(page = 1, limit = 20) {
  const safePage = Math.max(1, parseInt(page));
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (safePage - 1) * safeLimit;
  return { limit: safeLimit, offset, page: safePage };
}

function paginatedResponse(rows, total, page, limit) {
  return {
    data: rows,
    pagination: {
      total: parseInt(total),
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
  };
}

module.exports = { paginate, paginatedResponse };
