/**
 * Portal Genesis – API Visual completa (Flux + GPT Image 2 + fallback)
 * Suporta variações A/B/C, múltiplas chaves e fallback.
 */

const fetch = require('node-fetch');

const POLLINATIONS_IMAGE_BASE = 'https://gen.pollinations.ai/image';

const MODEL_DEFAULT = process.env.POLLINATIONS_IMAGE_MODEL || 'flux';
const API_KEY_FLUX = process.env.POLLINATIONS_API_KEY_FLUX;
const API_KEY_GPTIMAGE2 = process.env.POLLINATIONS_API_KEY_GPTIMAGE2;
const API_KEY_GENERAL = process.env.POLLINATIONS_API_KEY;

function sendJson(res, status, data) {
  res.status(status);
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

function parseBody(req){
  if(!req.body) return {};
  if(typeof req.body==='string'){
    try{return JSON.parse(req.body);}catch{return {};}
  }
  return req.body;
}

function getApiKey(model){
  switch(model){
    case 'flux': return API_KEY_FLUX || API_KEY_GENERAL;
    case 'gpt-image-2': return API_KEY_GPTIMAGE2 || API_KEY_GENERAL;
    default: return API_KEY_GENERAL;
  }
}

function normalizeSize(size='1024x1024'){
  const m=size.match(/^(\d{2,5})x(\d{2,5})$/);
  if(m) return `${m[1]}x${m[2]}`;
  return '1024x1024';
}

async function fetchImage(payload){
  const model=payload.model || MODEL_DEFAULT;
  const apiKey=getApiKey(model);
  if(!apiKey) throw new Error(`API key não configurada para modelo ${model}`);

  const response=await fetch(POLLINATIONS_IMAGE_BASE,{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`},
    body:JSON.stringify(payload)
  });

  if(!response.ok){
    const t=await response.text();
    throw new Error(`Erro ${response.status}: ${t}`);
  }

  return await response.json();
}

module.exports = async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
  if(req.method==='OPTIONS') return res.status(204).end();

  if(req.method==='GET'){
    return sendJson(res,200,{
      ok:true,
      route:'/api/visual-image',
      version:'Visual Image Full Final',
      models:{flux:!!API_KEY_FLUX,'gpt-image-2':!!API_KEY_GPTIMAGE2},
      hasGeneralKey:!!API_KEY_GENERAL
    });
  }

  if(req.method!=='POST') return sendJson(res,405,{error:'Método não permitido'});

  const payload=parseBody(req);
  if(!payload.prompt) return sendJson(res,400,{error:'Prompt ausente'});

  try{
    const action=payload.action || 'generate';
    if(action==='variations'){
      const variants=['A','B','C'];
      const images=[];
      for(let i=0;i<variants.length;i++){
        const p=Object.assign({},payload,{variant:variants[i]});
        const result=await fetchImage(p);
        images.push(result);
      }
      return sendJson(res,200,{
        ok:true,
        images,
        message:'Variações A/B/C geradas com sucesso'
      });
    }

    const result=await fetchImage(payload);
    return sendJson(res,200,{
      ok:true,
      image:result.image,
      images:result.images,
      message:`Imagem gerada com sucesso usando ${result.model}`
    });
  }catch(err){
    return sendJson(res,500,{ok:false,error:err.message});
  }
};
