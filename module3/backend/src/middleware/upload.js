import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const dir=path.resolve(here,'../../uploads');fs.mkdirSync(dir,{recursive:true});
const allowed=new Set(['.pdf','.doc','.docx','.zip','.png','.jpg','.jpeg','.txt']);
export default multer({storage:multer.diskStorage({destination:(_req,_file,cb)=>cb(null,dir),filename:(_req,file,cb)=>cb(null,`${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`)}),limits:{fileSize:10*1024*1024,files:1},fileFilter:(_req,file,cb)=>allowed.has(path.extname(file.originalname).toLowerCase())?cb(null,true):cb(new Error('Allowed files: PDF, DOC, DOCX, ZIP, PNG, JPG or TXT.'))});
