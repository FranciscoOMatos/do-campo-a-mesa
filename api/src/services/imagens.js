// Serviço de armazenamento das imagens dos produtos.
// Em desenvolvimento guarda em api/uploads/.
// Com STORAGE_CONN configurada usa Azure Blob Storage.

const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const {
  BlobServiceClient
} = require('@azure/storage-blob');

const TIPOS = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};

let container;

function erro(status, mensagem) {
  return Object.assign(
    new Error(mensagem),
    {
      status
    }
  );
}

function obterContainer() {
  if (!container) {
    container = BlobServiceClient
      .fromConnectionString(
        process.env.STORAGE_CONN
      )
      .getContainerClient(
        process.env.STORAGE_CONTAINER ||
        'produtos'
      );
  }

  return container;
}

async function guardarImagem(
  ficheiro,
  req
) {
  if (!ficheiro) {
    throw erro(
      400,
      'É necessário enviar uma imagem'
    );
  }

  const extensao =
    TIPOS[ficheiro.mimetype];

  if (!extensao) {
    throw erro(
      400,
      'Formato de imagem não suportado (JPEG, PNG ou WebP)'
    );
  }

  const nome =
    `${Date.now()}-${crypto
      .randomBytes(6)
      .toString('hex')}${extensao}`;

  // Produção: Azure Blob Storage
  if (process.env.STORAGE_CONN) {
    const blob = obterContainer()
      .getBlockBlobClient(nome);

    await blob.uploadData(
      ficheiro.buffer,
      {
        blobHTTPHeaders: {
          blobContentType:
            ficheiro.mimetype
        }
      }
    );

    return blob.url;
  }

  // Desenvolvimento: api/uploads/
  const pastaUploads = path.join(
    __dirname,
    '..',
    '..',
    'uploads'
  );

  await fs.mkdir(
    pastaUploads,
    {
      recursive: true
    }
  );

  await fs.writeFile(
    path.join(
      pastaUploads,
      nome
    ),
    ficheiro.buffer
  );

  return `${req.protocol}://${req.get(
    'host'
  )}/uploads/${nome}`;
}

module.exports = {
  guardarImagem
};