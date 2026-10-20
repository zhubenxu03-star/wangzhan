// Small local D1-compatible adapter. This file is never deployed to Cloudflare.
import { DatabaseSync } from 'node:sqlite';

export function createLocalDatabase(filename = ':memory:', schema = '') {
  const database = new DatabaseSync(filename);
  database.exec('PRAGMA foreign_keys = ON;');
  if (schema) database.exec(schema);
  function prepare(sql, values = []) {
    const statement = database.prepare(sql);
    const run = () => {
      const result = statement.run(...values);
      return { success: true, results: [], meta: { changes: Number(result.changes), last_row_id: Number(result.lastInsertRowid) } };
    };
    return {
      bind: (...parameters) => prepare(sql, parameters),
      first: async () => statement.get(...values) || null,
      all: async () => ({ success: true, results: statement.all(...values) }),
      run: async () => run(),
      execute: run,
    };
  }
  return {
    prepare,
    async batch(statements) {
      database.exec('BEGIN IMMEDIATE;');
      try {
        const result = statements.map(statement => statement.execute());
        database.exec('COMMIT;');
        return result;
      } catch (error) {
        database.exec('ROLLBACK;');
        throw error;
      }
    },
    close: () => database.close(),
  };
}
