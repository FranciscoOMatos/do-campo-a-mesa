// Encomenda:
// - as linhas são embebidas;
// - comprador e produtor são referenciados.
const {
  Schema,
  model,
  Types
} = require('mongoose');

const ESTADOS = [
  'pendente',
  'confirmada',
  'pronta',
  'entregue'
];

const orderSchema = new Schema({
  comprador: {
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  produtor: {
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  linhas: {
    type: [{
      produto: {
        type: Types.ObjectId,
        ref: 'Product'
      },

      // Cópia do nome no momento da compra.
      nome: {
        type: String,
        required: true
      },

      // Cópia do preço no momento da compra.
      precoUnit: {
        type: Number,
        required: true,
        min: 0
      },

      unidade: String,

      quantidade: {
        type: Number,
        required: true,
        min: 1
      }
    }],

    validate: [
      (linhas) => linhas.length > 0,
      'A encomenda tem de ter pelo menos uma linha'
    ]
  },

  estado: {
    type: String,
    enum: ESTADOS,
    default: 'pendente'
  },

  entrega: {
    tipo: {
      type: String,
      enum: [
        'levantamento',
        'entrega'
      ],
      default: 'levantamento'
    },

    morada: String
  },

  origem: {
    type: String,
    enum: [
      'loja',
      'leilao'
    ],
    default: 'loja'
  },

  leilao: {
    type: Types.ObjectId,
    ref: 'Auction'
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true
  }
});

// O total é calculado a partir das linhas.
// Não é necessário guardá-lo no MongoDB.
orderSchema.virtual('total').get(
  function total() {
    const valor = this.linhas.reduce(
      (soma, linha) =>
        soma +
        linha.precoUnit *
        linha.quantidade,
      0
    );

    return Math.round(valor * 100) / 100;
  }
);

orderSchema.statics.ESTADOS = ESTADOS;

module.exports = model(
  'Order',
  orderSchema
);