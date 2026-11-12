const { Schema, model } = require('mongoose');

const reviewDenunciaSchema = new Schema(
  {
    avaliacao: {
      type: Schema.Types.ObjectId,
      ref: 'Review',
      required: true
    },

    autor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    motivo: {
      type: String,
      enum: [
        'linguagem_ofensiva',
        'informacao_falsa',
        'spam',
        'outro'
      ],
      required: true
    },

    descricao: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Cada utilizador pode denunciar
// cada avaliacao apenas uma vez.
reviewDenunciaSchema.index(
  {
    avaliacao: 1,
    autor: 1
  },
  {
    unique: true
  }
);

module.exports = model(
  'ReviewDenuncia',
  reviewDenunciaSchema
);
