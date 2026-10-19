export const text=(label='Your text',id='input',value='')=>`<label for="${id}">${label}</label><textarea id="${id}" spellcheck="false">${value}</textarea>`;
export const input=(id,label,value='',type='text')=>`<label for="${id}">${label}</label><input id="${id}" type="${type}" value="${value}">`;
export const number=(id,label,value,min=0,max=10000)=>`<label for="${id}">${label}</label><input id="${id}" type="number" value="${value}" min="${min}" max="${max}" step="any" required>`;
export const select=(items,label='Action',id='mode')=>`<label for="${id}">${label}</label><select id="${id}">${items.map(item=>{const [v,n]=Array.isArray(item)?item:[item,item];return `<option value="${v}">${n}</option>`;}).join('')}</select>`;
export const file=(accept,multiple=false)=>`<label class="drop-zone" for="files"><span class="upload-icon">↑</span><strong>Choose ${multiple?'files':'a file'}</strong><span>or drop ${multiple?'them':'it'} here. Your files stay on this device.</span><input id="files" type="file" accept="${accept}" ${multiple?'multiple':''} required></label><div id="file-names" aria-live="polite"></div>`;
export const hint=s=>`<p class="hint">${s}</p>`;
export const rect=()=>`<div class="input-grid">${number('x','Left / X',0)}${number('y','Top / Y',0)}${number('width','Width',100,1,12000)}${number('height','Height',100,1,12000)}</div>`;
