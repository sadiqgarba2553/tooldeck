import QRCode from 'qrcode';
import {encode64,decode64,generatePassword,colorValues} from './core.js';
import {text,input,number,select,file,hint} from './forms.js';
export function utilityForm(id){
  const layouts={
    json:()=>text('JSON')+select([['format','Format JSON'],['minify','Minify JSON']]),
    base64:()=>text()+select(['encode','decode']),url:()=>text()+select(['encode','decode']),
    text:()=>text()+select([['count','Count words and characters'],['upper','UPPERCASE'],['lower','lowercase'],['title','Title Case'],['trim','Trim lines'],['dedupe','Remove duplicate lines']]),
    'case-converter':()=>text()+select([['upper','UPPERCASE'],['lower','lowercase'],['title','Title Case'],['trim','Trim lines'],['dedupe','Remove duplicate lines']]),
    password:()=>number('length','Password length',20,8,256),uuid:()=>number('count','Number of identifiers',1,1,100),
    hash:()=>select(['SHA-256','SHA-512'],'Algorithm')+text('Text to hash')+file('*')+hint('Hash the chosen file, or leave the file empty to hash your text.'),
    qr:()=>text('Text or URL')+number('size','Image width (pixels)',512,128,2048),
    color:()=>input('input','HEX color','#000000')+input('swatch','Pick a color','#000000','color'),
    epoch:()=>input('input','Unix timestamp','0')+select(['seconds','milliseconds'],'Unit'),
    'text-diff':()=>text('Original text')+text('Changed text','second'),
    'lorem-ipsum':()=>number('count','Paragraphs',3,1,100),
    'md-to-html':()=>text('Markdown'),
    'regex-tester':()=>input('pattern','Regular expression','\\b\\w+\\b')+input('flags','Flags','g')+text('Test text')+hint('Expressions run in an isolated worker with a two-second limit.'),
    'code-minify':()=>text('JavaScript')+hint('JavaScript syntax is parsed. Comments are removed; strings are preserved.'),
    'unit-converter':()=>number('amount','Value',1,-1e12,1e12)+select(['m','cm','mm','km','in','ft','yd','mi','kg','g','lb','oz','C','F','K'],'From','from')+select(['m','cm','mm','km','in','ft','yd','mi','kg','g','lb','oz','C','F','K'],'To','to'),
  };return layouts[id]?.();
}
export async function runUtility(id,c){const {$,output,download,ensure}=c,value=$('input')?.value||'',mode=$('mode')?.value;
  if(id==='json')output(JSON.stringify(JSON.parse(value),null,mode==='format'?2:0));
  else if(id==='base64')output(mode==='encode'?encode64(value):decode64(value));
  else if(id==='url')output(mode==='encode'?encodeURIComponent(value):decodeURIComponent(value));
  else if(id==='text'||id==='case-converter'){const changes={count:()=>`Words: ${(value.trim().match(/\S+/gu)||[]).length}\nCharacters: ${[...value].length}\nLines: ${value?value.split(/\r?\n/).length:0}`,upper:()=>value.toUpperCase(),lower:()=>value.toLowerCase(),title:()=>value.toLowerCase().replace(/(^|\s)\p{L}/gu,s=>s.toUpperCase()),trim:()=>value.split(/\r?\n/).map(l=>l.trim()).join('\n'),dedupe:()=>[...new Set(value.split(/\r?\n/))].join('\n')};output(changes[mode]());}
  else if(id==='password')output(generatePassword(c.numeric('length',8,256)));
  else if(id==='uuid')output(Array.from({length:c.numeric('count',1,100)},()=>crypto.randomUUID()).join('\n'));
  else if(id==='color')output(colorValues(value));
  else if(id==='epoch'){if(!/^-?\d+$/.test(value.trim()))throw Error('Enter an integer timestamp.');const n=Number(value)*(mode==='seconds'?1000:1),date=new Date(n);if(!Number.isSafeInteger(n)||!Number.isFinite(date.getTime()))throw Error('Timestamp is outside the supported range.');output(`UTC: ${date.toISOString()}\nLocal: ${date.toString()}`);}
  else if(id==='hash'){const f=$('files')?.files[0],bytes=f?(await c.files())[0]:null;const data=bytes?await bytes.arrayBuffer():new TextEncoder().encode(value);const hash=await crypto.subtle.digest(mode,data);ensure();output(`${f?f.name+'\n':''}${mode}\n${Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('')}`);}
  else if(id==='qr'){if(!value.trim())throw Error('Enter some text or a URL.');const url=await QRCode.toDataURL(value,{width:c.numeric('size',128,2048),margin:3});ensure();const blob=new Blob([Uint8Array.from(atob(url.split(',')[1]),v=>v.charCodeAt(0))],{type:'image/png'});const img=new Image();img.alt='Generated QR code';img.src=download(blob,'tooldeck-qr.png');c.preview(img);}
  else if(id==='lorem-ipsum'){const paragraph='Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';output(Array.from({length:c.numeric('count',1,100)},()=>paragraph).join('\n\n'));}
  else if(id==='md-to-html'){const {marked}=await import('marked');output(await marked.parse(value));}
  else if(id==='text-diff'){const {diffLines}=await import('diff');output(diffLines(value,$('second').value).map(p=>(p.added?'+ ':p.removed?'- ':'  ')+p.value.replace(/\n(?=.)/g,p.added?'\n+ ':p.removed?'\n- ':'\n  ')).join(''));}
  else if(id==='code-minify'){if(value.length>2000000)throw Error('Use JavaScript below 2 MB.');const {minify}=await import('terser');const result=await minify(value);ensure();output(result.code);download(result.code,'minified.js','text/javascript');}
  else if(id==='regex-tester'){if(value.length>1000000)throw Error('Use text below 1 MB.');const worker=new Worker(new URL('./regex-worker.js',import.meta.url),{type:'module'});try{output(await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Expression exceeded the two-second limit. Try a simpler pattern.')),2000);worker.onmessage=e=>{clearTimeout(timer);e.data.error?reject(Error(e.data.error)):resolve(e.data.result);};worker.onerror=e=>{clearTimeout(timer);reject(Error(e.message));};worker.postMessage({pattern:$('pattern').value,flags:$('flags').value,value});}));}finally{worker.terminate();}}
  else if(id==='unit-converter'){const n=c.numeric('amount',-1e12,1e12,false),a=$('from').value,b=$('to').value;const length={m:1,cm:.01,mm:.001,km:1000,in:.0254,ft:.3048,yd:.9144,mi:1609.344},mass={kg:1,g:.001,lb:.45359237,oz:.028349523125};let result;if(a in length&&b in length)result=n*length[a]/length[b];else if(a in mass&&b in mass)result=n*mass[a]/mass[b];else if(['C','F','K'].includes(a)&&['C','F','K'].includes(b)){const cel=a==='C'?n:a==='F'?(n-32)*5/9:n-273.15;if(cel < -273.15)throw Error('Temperature is below absolute zero.');result=b==='C'?cel:b==='F'?cel*9/5+32:cel+273.15;}else throw Error('Choose units of the same type.');output(`${n} ${a} = ${Number(result.toPrecision(12))} ${b}`);}
  else throw Error('Unknown utility.');
}
