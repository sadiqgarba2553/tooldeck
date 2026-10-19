const path=require('node:path');
const formats=new Set(['mp3','wav','flac','aac','ogg','mp4','webm','mkv']);
function number(value,min,max,name){const n=Number(value);if(!Number.isFinite(n)||n<min||n>max)throw Error(`${name} must be between ${min} and ${max}.`);return n;}
function mediaCommand(tool,inputs,options,dir){
  if(!new Set(['video-convert','video-compress','video-trim','video-resize','video-rotate','video-mute','video-audio','video-gif','video-frame','video-merge','audio-convert','audio-trim','audio-merge','audio-volume','audio-normalize','audio-speed','audio-reverse','audio-fade']).has(tool))throw Error('Unknown media tool.');
  if(!Array.isArray(inputs)||!inputs.length||inputs.length>20)throw Error('Choose 1–20 media files.');
  const audio=tool.startsWith('audio-'),format=options.format||(audio||tool==='video-audio'?'mp3':'mp4');if(!formats.has(format))throw Error('Unsupported output format.');
  const videoFormats=['mp4','webm','mkv'];if((audio||tool==='video-audio')&&videoFormats.includes(format))throw Error('Choose an audio output format.');if(!audio&&tool!=='video-audio'&&!videoFormats.includes(format))throw Error('Choose a video output format.');
  const args=['-hide_banner','-nostdin','-y','-protocol_whitelist','file,pipe','-format_whitelist','mov,matroska,avi,flv,mpeg,mpegts,ogg,wav,mp3,flac,aac,asf,concat','-threads','2'];let extension=format,concat;
  const input=p=>args.push('-i',p);
  if(tool==='video-merge'){if(inputs.length<2)throw Error('Choose at least two clips.');concat=inputs.map(p=>`file '${p.replaceAll('\\','/').replaceAll("'","'\\''")}'`).join('\n');args.push('-f','concat','-safe','0','-i',path.join(dir,'clips.txt'));}
  else if(tool==='audio-merge'){if(inputs.length<2)throw Error('Choose at least two audio clips.');inputs.forEach(input);}
  else {if(inputs.length!==1)throw Error('Choose a single file.');input(inputs[0]);}
  const start=()=>number(options.start??0,0,86400,'Start time'),duration=()=>number(options.duration??10,.1,86400,'Duration');
  if(tool==='video-trim'||tool==='audio-trim')args.push('-ss',String(start()),'-t',String(duration()));
  if(tool==='video-frame'){extension='png';args.push('-ss',String(start()),'-frames:v','1');}
  else if(tool==='video-gif'){extension='gif';args.push('-ss',String(start()),'-t',String(number(options.duration??5,.1,60,'GIF duration')),'-vf','fps=12,scale=480:-2:flags=lanczos');}
  else if(tool==='video-merge')args.push('-c','copy');
  else if(audio||tool==='video-audio'){
    args.push('-vn');let filter;
    if(tool==='audio-merge'){const streams=inputs.map((_,i)=>`[${i}:a:0]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[a${i}]`).join(';');args.push('-filter_complex',streams+';'+inputs.map((_,i)=>`[a${i}]`).join('')+`concat=n=${inputs.length}:v=0:a=1[out]`,'-map','[out]');}
    if(tool==='audio-volume')filter=`volume=${number(options.volume??1,0,5,'Volume')}`;
    if(tool==='audio-normalize')filter='loudnorm=I=-16:TP=-1.5:LRA=11';
    if(tool==='audio-speed')filter=`atempo=${number(options.speed??1,.5,2,'Speed')}`;
    if(tool==='audio-reverse')filter='areverse';
    if(tool==='audio-fade'){const fade=number(options.fade??2,.1,30,'Fade duration');filter=`afade=t=in:d=${fade},areverse,afade=t=in:d=${fade},areverse`;}
    if(filter)args.push('-af',filter);
    args.push('-c:a',{mp3:'libmp3lame',wav:'pcm_s16le',flac:'flac',aac:'aac',ogg:'libvorbis'}[format]);if(format==='mp3')args.push('-b:a','192k');
  }else{
    if(!new Set(['video-convert','video-compress','video-trim','video-resize','video-rotate','video-mute']).has(tool))throw Error('Unknown media tool.');
    let vf='scale=trunc(iw/2)*2:trunc(ih/2)*2';
    if(tool==='video-resize'||tool==='video-compress'){const width=number(options.width??1280,128,3840,'Width');if(width%2)throw Error('Video width must be an even number.');vf=`scale='min(${width},iw)':-2`;}
    if(tool==='video-rotate'){if(!['90','180','270'].includes(String(options.rotation)))throw Error('Choose a supported rotation.');vf=String(options.rotation)==='180'?'hflip,vflip':String(options.rotation)==='270'?'transpose=2':'transpose=1';}
    args.push('-vf',vf,'-c:v',format==='webm'?'libvpx-vp9':'libx264','-crf',String(tool==='video-compress'?30:23));if(format!=='webm')args.push('-preset','fast');args.push('-c:a',format==='webm'?'libopus':'aac');if(tool==='video-mute')args.push('-an');if(format==='mp4')args.push('-movflags','+faststart');
  }
  const output=path.join(dir,`tooldeck-${tool}.${extension}`);args.push('-fs','2147483648','-progress','pipe:1',output);return{args,output,concat,extension};
}
module.exports={mediaCommand};
