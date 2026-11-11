
/**
 * Serviço de armazenamento das imagens dos produtos.
 *
 * Produção: Supabase Storage.
 * Desenvolvimento sem Supabase: api/uploads/.
 */

const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const TIPOS = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};

let supabase;

function erro(status, mensagem) {
  return Object.assign(new Error(mensagem), { status });
}

function obterSupabase() {
  const url = process.env.SUPABASE_URL;
  const chave = process.env.SUPABASE_SECRET_KEY;

  if (!url || !chave) {
    throw erro(
      500,
      'Configuração do Supabase Storage incompleta'
    );
  }

  if (!supabase) {
    supabase = createClient(url, chave, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
  }

  return supabase;
}

async function guardarImagem(ficheiro, req) {
  if (!ficheiro) {
    throw erro(400, 'É necessário enviar uma imagem');
  }

  const extensao = TIPOS[ficheiro.mimetype];

  if (!extensao) {
    throw erro(
      400,
      'Formato de imagem não suportado (JPEG, PNG ou WebP)'
    );
  }

  const nome = `${Date.now()}-${crypto
    .randomBytes(6)
    .toString('hex')}${extensao}`;

  const usarSupabase = Boolean(
    process.env.SUPABASE_URL ||
    process.env.SUPABASE_SECRET_KEY
  );

  if (usarSupabase) {
    const cliente = obterSupabase();
    const bucket =
      process.env.SUPABASE_STORAGE_BUCKET || 'produtos';

    const caminho = `uploads/${nome}`;
    const storage = cliente.storage.from(bucket);

    const { error } = await storage.upload(
      caminho,
      ficheiro.buffer,
      {
        contentType: ficheiro.mimetype,
        upsert: false
      }
    );

    if (error) {
      console.error(
        'Erro no Supabase Storage:',
        error.message
      );

      throw erro(502, 'Não foi possível guardar a imagem');
    }

    const { data } = storage.getPublicUrl(caminho);

    return data.publicUrl;
  }

  // Nunca depender do disco temporário em produção.
  if (process.env.NODE_ENV === 'production') {
    throw erro(
      500,
      'Armazenamento externo não configurado'
    );
  }

  // Desenvolvimento local sem Supabase.
  const pastaUploads = path.join(
    __dirname,
    '..',
    '..',
    'uploads'
  );

  await fs.mkdir(pastaUploads, { recursive: true });

  await fs.writeFile(
    path.join(pastaUploads, nome),
    ficheiro.buffer
  );

  return `${req.protocol}://${req.get('host')}/uploads/${nome}`;
}

module.exports = { guardarImagem };
