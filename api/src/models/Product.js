const {
  Schema,
  model,
  Types
} = require('mongoose');

const productSchema = new Schema(
  {
    produtor: {
      type: Types.ObjectId,
      ref: 'User',
      required: true
    },

    nome: {
      type: String,
      required: true,
      trim: true
    },

    descricao: {
      type: String,
      trim: true,
      default: ''
    },

    categoria: {
      type: String,
      enum: [
        'Hortícolas',
        'Fruta',
        'Mel',
        'Vinho',
        'Queijo',
        'Padaria',
        'Outros'
      ],
      required: true
    },

    preco: {
      type: Number,
      required: true,
      min: 0
    },

    unidade: {
      type: String,
      default: 'kg'
    },

    stock: {
      type: Number,
      default: 0,
      min: 0
    },

    biologico: {
      type: Boolean,
      default: false
    },

    epocas: [
      {
        type: String,
        enum: [
          'Primavera',
          'Verão',
          'Outono',
          'Inverno'
        ]
      }
    ],

    imagemUrl: String
  },
  {
    timestamps: true
  }
);

module.exports = model(
  'Product',
  productSchema
);