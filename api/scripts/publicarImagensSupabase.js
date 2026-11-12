
/**
 * Publica as imagens de demonstração no Supabase Storage.
 *
 * Não altera a base de dados MongoDB.
 * Pode ser executado novamente sem duplicar ficheiros.
 */

require('dotenv').config({
  path: require('path').join(__dirname, '..', '.env')
});

const fs = require('fs/promises');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const {
  SUPABASE_URL,
  SUPABASE_SECRET_KEY,
  SUPABASE_STORAGE_BUCKET = 'produtos'
} = process.env;

const PASTA_ASSETS = path.join(
  __dirname,
  '..',
  'src',
  'seed',
  'assets'
);

async function publicarImagens() {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    throw new Error(
      'Variáveis do Supabase não configuradas.'
    );
  }

  const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_SECRET_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );

  const storage = supabase.storage.from(
    SUPABASE_STORAGE_BUCKET
  );

  const ficheiros = (await fs.readdir(PASTA_ASSETS))
    .filter((nome) => nome.toLowerCase().endsWith('.jpg'))
    .sort();

  console.log(
    `Encontradas ${ficheiros.length} imagens.`
  );

  if (ficheiros.length !== 14) {
    throw new Error(
      'Esperadas 14 imagens de demonstração.'
    );
  }

  let publicadas = 0;

  for (const nome of ficheiros) {
    const caminho = `seed/${nome}`;

    const buffer = await fs.readFile(
      path.join(PASTA_ASSETS, nome)
    );

    const { error } = await storage.upload(
      caminho,
      buffer,
      {
        contentType: 'image/jpeg',
        upsert: true
      }
    );

    if (error) {
      throw new Error(
        `Erro ao publicar ${nome}: ${error.message}`
      );
    }

    publicadas++;

    console.log(
      `[${publicadas}/${ficheiros.length}] ${nome} - OK`
    );
  }

  const { data } = storage.getPublicUrl(
    'seed/kiwi-hayward.jpg'
  );

  console.log('\nPublicação concluída!');
  console.log(
    `Imagens publicadas: ${publicadas}/${ficheiros.length}`
  );

  console.log(
    'URL de teste (Kiwi Hayward):',
    data.publicUrl
  );
}

publicarImagens().catch((err) => {
  console.error('Falha:', err.message);
  process.exitCode = 1;
});
