// Utilizador: comprador, produtor ou administrador
const { Schema, model } = require('mongoose');

const userSchema = new Schema({
  nome: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^\S+@\S+\.\S+$/
  },

  passwordHash: {
    type: String,
    required: true,
    select: false
  },

  papel: {
    type: String,
    enum: ['comprador', 'produtor', 'admin'],
    default: 'comprador'
  },

  // Dados específicos do produtor
  produtor: {
    nomeExploracao: String,

    descricao: {
      type: String,
      maxlength: 1000
    },

    localidade: String,

    localizacao: {
      lat: Number,
      lng: Number
    },

    estadoValidacao: {
  type: String,
  enum: [
    'pendente',
    'aprovado',
    'rejeitado'
  ],
  default: 'pendente'
},

validado: {
  type: Boolean,
  default: false
}
  }
}, {
  timestamps: true
});

// Dados que podem ser enviados para o frontend.
// A passwordHash nunca é incluída.
userSchema.methods.publico = function publico() {
  return {
    id: this._id,
    nome: this.nome,
    email: this.email,
    papel: this.papel,

    ...(this.papel === 'produtor'
      ? { produtor: this.produtor }
      : {})
  };
};

module.exports = model('User', userSchema);