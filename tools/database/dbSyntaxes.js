import ini from 'ini';
import fs from 'fs';

let dbAccess = ini.parse(fs.readFileSync('./tools/database/db.ini', 'utf-8'));
export default dbAccess;
