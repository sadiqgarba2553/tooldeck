import {file,select,number,input,rect,hint} from './forms.js';
export function imageForm(id){let form=file(id==='svg-to-png'?'.svg':'.png,.jpg,.jpeg,.webp,.bmp,.gif',true);
  if(id==='crop-image')form+=rect();
  else if(id==='resize-image'||id==='image')form+=number('width','Maximum width (pixels)',1920,1,12000);
  else if(id==='rotate-flip')form+=select([['90','90° clockwise'],['180','180°'],['270','90° counterclockwise'],['horizontal','Flip horizontally'],['vertical','Flip vertically']]);
  else if(id==='watermark-image')form+=input('watermark','Watermark text','Tooldeck')+number('size','Text size (pixels)',32,8,300);
  else if(id==='remove-bg')form+=input('background','Background color','#ffffff','color')+number('tolerance','Color tolerance',35,0,255)+hint('Best for logos and images with a solid background. Similar colors throughout the image become transparent.');
  else if(id==='image-to-ico')form+=select(['16','32','48','64','128','256'],'Icon size');
  if(id==='image')form+=select([['image/webp','WebP'],['image/jpeg','JPEG'],['image/png','PNG']],'Output format');
  if(id.startsWith('compress')||id==='image'||id.endsWith('webp')||id==='png-to-jpg')form+=number('quality','JPEG / WebP quality (%)',80,1,100);
  return form+hint('Up to 100 MB per file and 50 megapixels per image. Animated images export their first frame. PNG compression is lossless; savings depend on the source.');
}
export const canvasBlob=(canvas,type='image/png',quality=.85)=>new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Image encoding failed.')),type,quality));
export function icoBytes(png,size){const out=new Uint8Array(22+png.length),v=new DataView(out.buffer);v.setUint16(2,1,true);v.setUint16(4,1,true);out[6]=size===256?0:size;out[7]=out[6];v.setUint16(10,1,true);v.setUint16(12,32,true);v.setUint32(14,png.length,true);v.setUint32(18,22,true);out.set(png,22);return out;}
export async function runImage(id,c){const files=await c.files();for(let i=0;i<files.length;i++){c.ensure();c.progress(`Processing image ${i+1} of ${files.length}…`);const f=files[i];let bitmap,localURL;
    if(id==='svg-to-png'){const raw=await f.text();const doc=new DOMParser().parseFromString(raw,'image/svg+xml');if(doc.querySelector('parsererror')||doc.documentElement.localName!=='svg')throw Error('Choose a valid SVG.');for(const n of doc.querySelectorAll('script,foreignObject,iframe,style,image,use'))n.remove();for(const n of doc.querySelectorAll('*'))for(const a of [...n.attributes])if(/^on/i.test(a.name)||/href/i.test(a.name)||/url\s*\(/i.test(a.value))n.removeAttribute(a.name);localURL=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(doc)],{type:'image/svg+xml'}));const img=new Image();try{img.src=localURL;await img.decode();bitmap=img;}catch{URL.revokeObjectURL(localURL);throw Error('SVG could not be rendered. Include explicit width and height.');}}
    else bitmap=await createImageBitmap(f);
    try{c.ensure();const w=bitmap.width,h=bitmap.height;if(!w||!h||w*h>50000000)throw Error('Use an image below 50 megapixels.');let width=w,height=h,sx=0,sy=0,sw=w,sh=h,angle=0,flipX=false,flipY=false;
      if(id==='resize-image'||id==='image'){const scale=Math.min(1,c.numeric('width',1,12000)/w);width=Math.max(1,Math.round(w*scale));height=Math.max(1,Math.round(h*scale));}
      if(id==='crop-image'){sx=c.numeric('x',0,w-1);sy=c.numeric('y',0,h-1);sw=c.numeric('width',1,w-sx);sh=c.numeric('height',1,h-sy);width=sw;height=sh;}
      if(id==='rotate-flip'){const mode=c.$('mode').value;flipX=mode==='horizontal';flipY=mode==='vertical';angle=Number(mode)||0;if(angle===90||angle===270){width=h;height=w;}}
      if(id==='image-to-ico')width=height=Number(c.$('mode').value);
      const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');let type=id==='image'?c.$('mode').value:id.includes('webp')&&id!=='webp-to-png'?'image/webp':id==='png-to-jpg'||id==='compress-jpg'?'image/jpeg':'image/png';
      if(type==='image/jpeg'){ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);}
      ctx.save();ctx.translate(width/2,height/2);ctx.rotate(angle*Math.PI/180);ctx.scale(flipX?-1:1,flipY?-1:1);const dw=angle===90||angle===270?height:width,dh=angle===90||angle===270?width:height;ctx.drawImage(bitmap,sx,sy,sw,sh,-dw/2,-dh/2,dw,dh);ctx.restore();
      if(id==='watermark-image'){ctx.font=`${c.numeric('size',8,300)}px sans-serif`;ctx.textAlign='right';ctx.fillStyle='#ffffff';ctx.shadowColor='#000';ctx.shadowBlur=4;ctx.fillText(c.$('watermark').value,width-20,height-25);}
      if(id==='remove-bg'){const hex=c.$('background').value,r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16),t=c.numeric('tolerance',0,255);const image=ctx.getImageData(0,0,width,height),p=image.data;for(let j=0;j<p.length;j+=4)if(Math.max(Math.abs(p[j]-r),Math.abs(p[j+1]-g),Math.abs(p[j+2]-b))<=t)p[j+3]=0;ctx.putImageData(image,0,0);}
      let blob=await canvasBlob(canvas,type,(Number(c.$('quality')?.value)||85)/100);c.ensure();const base=f.name.replace(/\.[^.]+$/,'');let name=`${base}-${id}.${type.split('/')[1].replace('jpeg','jpg')}`;
      if(id==='compress-png'){const {default:UPNG}=await import('upng-js');const pixels=ctx.getImageData(0,0,width,height).data;const optimized=UPNG.encode([pixels.buffer],width,height,0);if(optimized.byteLength<blob.size)blob=new Blob([optimized],{type:'image/png'});}
      if(id.startsWith('compress')&&blob.size>=f.size&&f.type===type)blob=f;
      if(id==='image-to-ico'){blob=new Blob([icoBytes(new Uint8Array(await blob.arrayBuffer()),width)],{type:'image/x-icon'});name=`${base}.ico`;}
      const url=c.download(blob,name);if(i===0){const img=new Image();img.alt='Processed image';img.src=url;c.preview(img);}c.output(`${i+1} / ${files.length} · ${w} × ${h} → ${width} × ${height}\n${(f.size/1024).toFixed(1)} KB → ${(blob.size/1024).toFixed(1)} KB${id.startsWith('compress')&&blob.size>=f.size?'\nAlready optimized: original file retained.':''}`);
    }finally{bitmap.close?.();if(localURL)URL.revokeObjectURL(localURL);}await c.tick();
  }
}
