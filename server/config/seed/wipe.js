import { pool } from '../database.js'
import { ALL_TABLES } from './data/tables'

async function wipeAllTables(){
    // clear tables
    for (const table of ALL_TABLES.toReversed()){
        await pool.query(`DELETE FROM ${table}`)
    } 
    await pool.end(); 
}

wipeAllTables()