export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { prompt = '', duration = '8s', format = '9:16 vertical', style = '' } = body;

  // Esta rota esta pronta para receber integracao real com Runway, Kling, Luma, Replicate etc.
  // Enquanto isso, ela devolve o pacote de video pronto para enviar ao seu provedor.
  return res.status(200).json({
    type: 'text',
    output:
`PROMPT DE VIDEO PRONTO\n\nTema: ${prompt}\nDuracao: ${duration}\nFormato: ${format}\nEstilo: ${style}\n\nMovimento de camera: push-in suave, pequenas oscilacoes, foco no assunto principal.\nAcao: abertura forte, desenvolvimento curto, fechamento com gancho.\nSom: atmosfera discreta, impacto leve na virada.\n\nPara video final, conecte aqui seu provedor de video IA (Runway, Kling, Luma, Replicate etc.).`
  });
}
