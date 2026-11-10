// Dados de demonstração: npm run seed
// ATENÇÃO: apaga os dados existentes antes de inserir o conjunto de demonstração.

require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Product = require('../models/Product');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const Order = require('../models/Order');
const Review = require('../models/Review');

const PASTA_ASSETS = path.join(
  __dirname,
  'assets'
);

const PASTA_UPLOADS = path.join(
  __dirname,
  '..',
  '..',
  'uploads'
);

const API_PUBLIC_URL = (
  process.env.API_PUBLIC_URL ||
  'http://localhost:3000'
).replace(/\/$/, '');

const imagens = {
  abobora: 'abobora-menina.jpg',
  batata: 'batata-nova.jpg',
  broa: 'broa-de-milho.jpg',
  compota: 'compota-mirtilo.jpg',
  couve: 'couve-galega.jpg',
  kiwi: 'kiwi-hayward.jpg',
  laranja: 'laranja.jpg',
  maca: 'maca-reineta.jpg',
  melCastanheiro: 'mel-castanheiro.jpg',
  melUrze: 'mel-urze.jpg',
  pera: 'pera-rocha.jpg',
  queijo: 'queijo-curado-artesanal.jpg',
  tomate: 'tomate-coracao-de-boi.jpg',
  vinho: 'vinho-verde-branco.jpg'
};

function urlImagem(nomeFicheiro) {
  return `${API_PUBLIC_URL}/uploads/${nomeFicheiro}`;
}

async function prepararImagens() {
  await fs.mkdir(
    PASTA_UPLOADS,
    {
      recursive: true
    }
  );

  for (const nomeFicheiro of Object.values(imagens)) {
    await fs.copyFile(
      path.join(
        PASTA_ASSETS,
        nomeFicheiro
      ),
      path.join(
        PASTA_UPLOADS,
        nomeFicheiro
      )
    );
  }
}

async function limparBaseDados() {
  await Promise.all([
    Bid.deleteMany({}),
    Review.deleteMany({}),
    Order.deleteMany({}),
    Auction.deleteMany({}),
    Product.deleteMany({}),
    User.deleteMany({})
  ]);
}

async function seed() {
  if (!process.env.MONGODB_URI) {
    throw new Error(
      'MONGODB_URI não está configurada.'
    );
  }

  await mongoose.connect(
    process.env.MONGODB_URI
  );

  console.log(
    'Ligação à MongoDB estabelecida.'
  );

  await limparBaseDados();
  await prepararImagens();

  const passwordHash = await bcrypt.hash(
    'password123',
    12
  );

  const [
    admin,
    horta,
    mel,
    padaria,
    queijaria,
    quinta,
    comprador
  ] = await User.create([
    {
      nome: 'Administração',
      email: 'admin@exemplo.pt',
      passwordHash,
      papel: 'admin'
    },

    {
      nome: 'Horta da Ribeira',
      email: 'horta@exemplo.pt',
      passwordHash,
      papel: 'produtor',

      produtor: {
        nomeExploracao:
          'Horta da Ribeira',

        descricao:
          'A Horta da Ribeira é uma exploração local de Ponte de Lima dedicada à produção de produtos frescos e sazonais.',

        localidade:
          'Ponte de Lima',

        localizacao: {
          lat: 41.767,
          lng: -8.583
        },

        validado: true,
        estadoValidacao: 'aprovado'
      }
    },

    {
      nome: 'Mel do Soajo',
      email: 'mel@exemplo.pt',
      passwordHash,
      papel: 'produtor',

      produtor: {
        nomeExploracao:
          'Mel do Soajo',

        descricao:
          'Produtor artesanal de mel da região do Soajo, dedicado à apicultura de pequena escala e à produção de méis com características ligadas à flora e às paisagens do Alto Minho.',

        localidade:
          'Arcos de Valdevez',

        localizacao: {
          lat: 41.875,
          lng: -8.263
        },

        validado: true,
        estadoValidacao: 'aprovado'
      }
    },

    {
      nome: 'Padaria do Minho',
      email: 'padaria.minho@exemplo.pt',
      passwordHash,
      papel: 'produtor',

      produtor: {
        nomeExploracao:
          'Padaria do Minho',

        descricao:
          'Padaria artesanal de Braga dedicada à produção de pão e broa segundo receitas tradicionais minhotas, privilegiando fabrico diário, ingredientes simples e métodos artesanais.',

        localidade:
          'Braga',

        localizacao: {
          lat: 41.5505,
          lng: -8.4265
        },

        validado: true,
        estadoValidacao: 'aprovado'
      }
    },

    {
      nome: 'Queijaria Vale do Lima',
      email:
        'queijaria.valedolima@exemplo.pt',
      passwordHash,
      papel: 'produtor',

      produtor: {
        nomeExploracao:
          'Queijaria Vale do Lima',

        descricao:
          'Queijaria artesanal de Ponte de Lima dedicada à produção de queijos curados, valorizando métodos tradicionais, produção em pequena escala e sabores característicos da região.',

        localidade:
          'Ponte de Lima',

        localizacao: {
          lat: 41.772,
          lng: -8.579
        },

        validado: true,
        estadoValidacao: 'aprovado'
      }
    },

    {
      nome: 'Quinta do Vale do Lima',
      email:
        'quinta.valedolima@exemplo.pt',
      passwordHash,
      papel: 'produtor',

      produtor: {
        nomeExploracao:
          'Quinta do Vale do Lima',

        descricao:
          'Quinta familiar de Ponte de Lima dedicada à produção de Vinho Verde, combinando métodos tradicionais da região com uma produção cuidada e de pequena escala.',

        localidade:
          'Ponte de Lima',

        localizacao: {
          lat: 41.769,
          lng: -8.586
        },

        validado: true,
        estadoValidacao: 'aprovado'
      }
    },

    {
      nome: 'Tasca do Lima',
      email: 'tasca@exemplo.pt',
      passwordHash,
      papel: 'comprador'
    }
  ]);

  const produtos = await Product.create([
    {
      produtor: horta._id,
      nome: 'Kiwi Hayward',
      categoria: 'Fruta',
      preco: 2.4,
      unidade: 'kg',
      stock: 200,
      biologico: true,
      epocas: [
        'Outono',
        'Inverno'
      ],
      imagemUrl:
        urlImagem(imagens.kiwi)
    },

    {
      produtor: horta._id,
      nome: 'Abóbora-menina',
      categoria: 'Hortícolas',
      preco: 1.2,
      unidade: 'kg',
      stock: 80,
      biologico: false,
      epocas: [
        'Outono'
      ],
      imagemUrl:
        urlImagem(imagens.abobora)
    },

    {
      produtor: horta._id,
      nome: 'Couve-galega',
      categoria: 'Hortícolas',
      preco: 1.5,
      unidade: 'molho',
      stock: 40,
      biologico: true,
      epocas: [
        'Outono',
        'Inverno'
      ],
      imagemUrl:
        urlImagem(imagens.couve)
    },

    {
      produtor: horta._id,
      nome: 'Tomate coração-de-boi',

      descricao:
        'Tomate tradicional, carnudo e aromático, produzido localmente e ideal para saladas e pratos frescos.',

      categoria: 'Hortícolas',
      preco: 2.8,
      unidade: 'kg',
      stock: 60,
      biologico: true,
      epocas: [
        'Verão'
      ],
      imagemUrl:
        urlImagem(imagens.tomate)
    },

    {
      produtor: horta._id,
      nome: 'Batata nova',

      descricao:
        'Batata nova de produção local, de pele fina e textura suave, ideal para assar, cozer ou acompanhar pratos tradicionais.',

      categoria: 'Hortícolas',
      preco: 1.6,
      unidade: 'kg',
      stock: 100,
      biologico: false,
      epocas: [
        'Primavera',
        'Verão'
      ],
      imagemUrl:
        urlImagem(imagens.batata)
    },

    {
      produtor: horta._id,
      nome: 'Maçã reineta',

      descricao:
        'Maçã reineta de produção local, aromática e ligeiramente ácida, excelente para consumir ao natural ou usar em sobremesas tradicionais.',

      categoria: 'Fruta',
      preco: 2.2,
      unidade: 'kg',
      stock: 90,
      biologico: true,
      epocas: [
        'Outono',
        'Inverno'
      ],
      imagemUrl:
        urlImagem(imagens.maca)
    },

    {
      produtor: horta._id,
      nome: 'Pera Rocha',

      descricao:
        'Pera Rocha de produção nacional, doce, firme e suculenta, ideal para consumir ao natural.',

      categoria: 'Fruta',
      preco: 2.3,
      unidade: 'kg',
      stock: 85,
      biologico: false,
      epocas: [
        'Outono',
        'Inverno'
      ],
      imagemUrl:
        urlImagem(imagens.pera)
    },

    {
      produtor: horta._id,
      nome: 'Laranja',

      descricao:
        'Laranja de produção nacional, sumarenta e rica em sabor, ideal para consumir ao natural ou em sumo.',

      categoria: 'Fruta',
      preco: 1.9,
      unidade: 'kg',
      stock: 120,
      biologico: false,
      epocas: [
        'Inverno',
        'Primavera'
      ],
      imagemUrl:
        urlImagem(imagens.laranja)
    },

    {
      produtor: horta._id,
      nome:
        'Compota artesanal de mirtilo',

      descricao:
        'Compota artesanal de mirtilo, preparada em pequenos lotes com fruta selecionada, ideal para acompanhar pão, torradas, iogurte ou queijo.',

      categoria: 'Outros',
      preco: 4.5,
      unidade: 'frasco',
      stock: 35,
      biologico: true,
      epocas: [
        'Verão',
        'Outono'
      ],
      imagemUrl:
        urlImagem(imagens.compota)
    },

    {
      produtor: mel._id,
      nome: 'Mel de urze',
      categoria: 'Mel',
      preco: 7.5,
      unidade: '500 g',
      stock: 36,
      imagemUrl:
        urlImagem(imagens.melUrze)
    },

    {
      produtor: mel._id,
      nome: 'Mel de castanheiro',
      categoria: 'Mel',
      preco: 7,
      unidade: '500 g',
      stock: 21,
      imagemUrl:
        urlImagem(
          imagens.melCastanheiro
        )
    },

    {
      produtor: queijaria._id,
      nome: 'Queijo curado artesanal',

      descricao:
        'Queijo curado de produção artesanal, de sabor intenso e textura firme, produzido segundo métodos tradicionais da região do Minho.',

      categoria: 'Queijo',
      preco: 9.5,
      unidade: 'unidade',
      stock: 30,
      biologico: false,
      epocas: [
        'Primavera',
        'Verão',
        'Outono',
        'Inverno'
      ],
      imagemUrl:
        urlImagem(imagens.queijo)
    },

    {
      produtor: padaria._id,
      nome: 'Broa de milho',

      descricao:
        'Broa de milho de fabrico artesanal, com sabor tradicional e textura rústica, preparada segundo a tradição minhota.',

      categoria: 'Padaria',
      preco: 3.2,
      unidade: 'unidade',
      stock: 40,
      biologico: false,
      epocas: [
        'Primavera',
        'Verão',
        'Outono',
        'Inverno'
      ],
      imagemUrl:
        urlImagem(imagens.broa)
    },

    {
      produtor: quinta._id,
      nome: 'Vinho Verde branco',

      descricao:
        'Vinho Verde branco leve e fresco, produzido na região do Minho, com perfil frutado e ideal para acompanhar peixe, marisco e refeições leves.',

      categoria: 'Vinho',
      preco: 6.9,
      unidade: 'garrafa',
      stock: 50,
      biologico: false,
      epocas: [
        'Primavera',
        'Verão',
        'Outono',
        'Inverno'
      ],
      imagemUrl:
        urlImagem(imagens.vinho)
    }
  ]);

  const kiwi = produtos.find(
    (produto) =>
      produto.nome === 'Kiwi Hayward'
  );

  const couve = produtos.find(
    (produto) =>
      produto.nome === 'Couve-galega'
  );

  const tomate = produtos.find(
    (produto) =>
      produto.nome === 'Tomate coração-de-boi'
  );

  const melUrze = produtos.find(
    (produto) =>
      produto.nome === 'Mel de urze'
  );

  const broa = produtos.find(
    (produto) =>
      produto.nome === 'Broa de milho'
  );

  const encomendaHorta =
    await Order.create({
      comprador: comprador._id,
      produtor: horta._id,

      linhas: [
        {
          produto: kiwi._id,
          nome: kiwi.nome,
          precoUnit: kiwi.preco,
          unidade: kiwi.unidade,
          quantidade: 2
        },
        {
          produto: couve._id,
          nome: couve.nome,
          precoUnit: couve.preco,
          unidade: couve.unidade,
          quantidade: 1
        },
        {
          produto: tomate._id,
          nome: tomate.nome,
          precoUnit: tomate.preco,
          unidade: tomate.unidade,
          quantidade: 2
        }
      ],

      estado: 'entregue',

      entrega: {
        tipo: 'levantamento'
      },

      origem: 'loja'
    });

  await Order.create({
    comprador: comprador._id,
    produtor: mel._id,

    linhas: [
      {
        produto: melUrze._id,
        nome: melUrze.nome,
        precoUnit: melUrze.preco,
        unidade: melUrze.unidade,
        quantidade: 2
      }
    ],

    estado: 'confirmada',

    entrega: {
      tipo: 'entrega',
      morada:
        'Rua de Exemplo, 10, Ponte de Lima'
    },

    origem: 'loja'
  });

  await Order.create({
    comprador: comprador._id,
    produtor: padaria._id,

    linhas: [
      {
        produto: broa._id,
        nome: broa.nome,
        precoUnit: broa.preco,
        unidade: broa.unidade,
        quantidade: 2
      }
    ],

    estado: 'pronta',

    entrega: {
      tipo: 'levantamento'
    },

    origem: 'loja'
  });

  await Review.create([
    {
      autor: comprador._id,
      produtor: horta._id,
      produto: kiwi._id,
      encomenda: encomendaHorta._id,
      classificacao: 5,

      comentario:
        'Produto muito fresco e de excelente qualidade.',

      visivel: true
    },

    {
      autor: comprador._id,
      produtor: horta._id,
      produto: couve._id,
      encomenda: encomendaHorta._id,
      classificacao: 4,

      comentario:
        'Boa qualidade e produto bem apresentado.',

      visivel: true
    },

    {
      autor: comprador._id,
      produtor: horta._id,
      produto: tomate._id,
      encomenda: encomendaHorta._id,
      classificacao: 4,

      comentario:
        'Tomate saboroso e fresco. Recomendo.',

      visivel: true
    }
  ]);

  const agora = Date.now();

  const leilao = await Auction.create({
    produtor: horta._id,
    produto: kiwi._id,

    lote:
      '200 kg de kiwi Hayward, calibre A',

    descricao:
      'Lote de kiwi Hayward produzido na Horta da Ribeira.',

    quantidade: '200 kg',
    precoBase: 200,
    incremento: 5,

    licitacaoAtual: {
      valor: 205,
      comprador: comprador._id,
      nome: comprador.nome,
      em: new Date(agora)
    },

    numLicitacoes: 1,

    iniciaEm:
      new Date(agora),

    terminaEm:
      new Date(
        agora +
        7 * 24 * 60 * 60 * 1000
      ),

    estado: 'ativo'
  });

  await Bid.create({
    leilao: leilao._id,
    comprador: comprador._id,
    nome: comprador.nome,
    valor: 205
  });
  console.log('');
  console.log('Seed concluído com sucesso.');
  console.log('');
  console.log(
    `Utilizadores criados (password: password123):`
  );

  console.log(
    [
      admin,
      horta,
      mel,
      padaria,
      queijaria,
      quinta,
      comprador
    ]
      .map(
        (utilizador) =>
          `  ${utilizador.papel.padEnd(10)} ${utilizador.email}`
      )
      .join('\n')
  );

  console.log('');
  console.log(
    `${produtos.length} produtos criados.`
  );

  console.log(
    `${Object.keys(imagens).length} imagens preparadas.`
  );

  console.log(
    '1 leilão ativo criado.'
  );

  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error(
    'Erro ao executar o seed:',
    err
  );

  try {
    await mongoose.disconnect();
  } catch {
    // Ignorar erro ao terminar ligação.
  }

  process.exit(1);
});
