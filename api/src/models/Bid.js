const {
  Schema,
  model,
  Types
} = require('mongoose');

const bidSchema = new Schema({
  leilao: {
    type: Types.ObjectId,
    ref: 'Auction',
    required: true,
    index: true
  },

  comprador: {
    type: Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Cópia do nome do comprador no momento
  // da licitação, útil para mostrar o histórico.
  nome: {
    type: String,
    trim: true
  },

  valor: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

module.exports = model(
  'Bid',
  bidSchema
);