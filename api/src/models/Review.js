const {
  Schema,
  model,
  Types
} = require('mongoose');

const reviewSchema = new Schema(
  {
    autor: {
      type: Types.ObjectId,
      ref: 'User',
      required: true
    },

    produtor: {
      type: Types.ObjectId,
      ref: 'User',
      required: true
    },

    produto: {
      type: Types.ObjectId,
      ref: 'Product',
      default: null
    },

    encomenda: {
      type: Types.ObjectId,
      ref: 'Order',
      required: true
    },

    classificacao: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message:
          'A classificação tem de ser um número inteiro'
      }
    },

    comentario: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: ''
    },

    denuncias: {
      type: Number,
      default: 0,
      min: 0
    },

    visivel: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Impede avaliações repetidas da mesma
// encomenda/produto pelo mesmo comprador.
reviewSchema.index(
  {
    autor: 1,
    encomenda: 1,
    produto: 1
  },
  {
    unique: true
  }
);

module.exports = model(
  'Review',
  reviewSchema
);