import {mkdir,writeFile,readFile,readdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const app=fileURLToPath(new URL('../',import.meta.url)),dest=path.join(app,'native');
await mkdir(dest,{recursive:true});
const name='qpdf-12.4.2-msvc64.zip',expected='db87077e683630c1217e0e8f9a20a9749d952ab676e881c3689187763a5de25d',archive=path.join(dest,name);
let bytes;try{bytes=await readFile(archive);}catch{}
if(!bytes||createHash('sha256').update(bytes).digest('hex')!==expected){console.log('Downloading official QPDF 12.4.2 Windows runtime…');const response=await fetch(`https://github.com/qpdf/qpdf/releases/download/v12.4.2/${name}`);if(!response.ok)throw Error(`QPDF download failed: ${response.status}`);bytes=Buffer.from(await response.arrayBuffer());if(createHash('sha256').update(bytes).digest('hex')!==expected)throw Error('QPDF checksum mismatch');await writeFile(archive,bytes);}
const unpack=path.join(dest,'qpdf');const quote=s=>"'"+s.replaceAll("'","''")+"'";
const result=spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',`Expand-Archive -LiteralPath ${quote(archive)} -DestinationPath ${quote(unpack)} -Force`],{windowsHide:true,encoding:'utf8'});if(result.status)throw Error(result.stderr);
async function find(dir){for(const e of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory()){const found=await find(p);if(found)return found;}else if(e.name==='qpdf.exe')return p;}}
const executable=await find(unpack);if(!executable)throw Error('QPDF executable missing');
const bin=path.dirname(executable);await mkdir(path.join(dest,'qpdf-bin'),{recursive:true});for(const e of await readdir(bin,{withFileTypes:true}))if(e.isFile())await copyFile(path.join(bin,e.name),path.join(dest,'qpdf-bin',e.name));
console.log('QPDF verified and prepared for packaging.');
