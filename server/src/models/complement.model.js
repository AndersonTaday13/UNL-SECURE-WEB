import { pool } from "../database/db.js";

/**
 *
 * @param {String} Un identificador único(token)
 * @returns retorna un objeto complement creado
 */
const create = async ({ token }) => {
  const query = {
    text: `
        INSERT INTO complement (token) VALUES ($1) RETURNING *;
    `,
    values: [token],
  };
  try {
    const { rows } = await pool.query(query);
    return rows[0];
  } catch (error) {
    if (error.code === "23505") {
      throw new Error("Token already exists.");
    }
    throw error;
  }
};

/**
 *
 * @param {String} Un identificador único(token)
 * @returns retorna el objeto complement que tenga el token igual al token pasado como parámetro
 */
const findByToken = async (token) => {
  const query = {
    text: `SELECT * FROM complement WHERE token = $1;`,
    values: [token],
  };
  const { rows } = await pool.query(query);
  return rows[0];
};

/**
 * 
 * @param {*} param0 
 * @returns 
 */
const updateStatus = async ({ token, protection_status }) => {
  const query = {
    text: `
        UPDATE complement SET protection_status = $1 WHERE token = $2 RETURNING *;
    `,
    values: [protection_status, token],
  };
  const { rows } = await pool.query(query);
  return rows[0];
};

/**
 *
 * @param {String} Un identificador único(token)
 * @param {String} Un intervalo de tiempo(0.2, 1, 2, 3, 4, 5)
 * @returns retorna el objeto complement actualizado el intervalo de tiempo
 */
const updateInterval = async ({ token, interval_time }) => {
  const validIntervals = ["0.2", "1", "2", "3", "4", "5"];
  if (!validIntervals.includes(interval_time)) {
    throw new Error(`Invalid interval_time: ${interval_time}`);
  }

  const query = {
    text: `
        UPDATE complement SET interval_time = $1 WHERE token = $2 RETURNING *;
    `,
    values: [interval_time, token],
  };
  const { rows } = await pool.query(query);
  return rows[0];
};

export const ComplementModel = {
  create,
  findByToken,
  updateStatus,
  updateInterval,
};
