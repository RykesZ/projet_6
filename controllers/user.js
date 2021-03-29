const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.signup = (req, res, next) => {
  bcrypt.hash(req.body.password, 10)
    .then(hash => {
      const user = new User({
        email: req.body.email,
        password: hash
      });
      user.save()
        .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
        .catch(error => res.status(400).json({ error }));
    })
    .catch(error => res.status(500).json({ error }));
};


// Le token utilisé 'RANDOM_TOKEN_SECRET' est à remplacer par une chaîne aléatoire beaucoup plus longue une fois en prod
exports.login = (req, res, next) => {
    User.findOne({ email: req.body.email })
      .then(user => {
        if (!user) {
          return res.status(401).json({ error: 'Utilisateur non trouvé !' });
        }
        bcrypt.compare(req.body.password, user.password)
          .then(valid => {
            if (!valid) {
              return res.status(401).json({ error: 'Mot de passe incorrect !' });
            }
            res.status(200).json({
              userId: user._id,
              token: jwt.sign(
                { userId: user._id },
                'RANDOM_TOKEN_SECRET',
                { expiresIn: '24h' }
              )
            });
          })
          .catch(error => res.status(500).json({ error }));
      })
      .catch(error => res.status(500).json({ error }));
};


// Sécurité par mot de passe : l'utilisateur doit taper son mot de passe actuel pour en choisir un nouveau
exports.modifyUser = (req, res, next) => {
  User.findOne({ _id: req.body.userId })
  .then(user => {
    bcrypt.compare(req.body.password, user.password)
        .then(valid => {
          if (!valid) {
            return res.status(401).json({ error: 'Mot de passe incorrect !' });
          }
          bcrypt.hash(req.body.newPassword, 10)
            .then(hash => {
              let userToModify = user;
              userToModify.password = hash;
              User.updateOne({ _id: req.body.userId }, userToModify)
              .then(() => {
                res.status(201).json({ message : "Password modified!" });
              })
              .catch((error) => {
                res.status(409).json({ error: error });
              });
            })
            .catch(error => res.status(500).json({ error: error }));
        })
        .catch(error => res.status(500).json({ error: error }));
  })
  .catch(error => res.status(500).json({ error: error }));
};


/* Sécurité par mot de passe : l'utilisateur doit taper son mot de passe pour confirmer la suppression de son compte
 Pour s'assurer que les likes et dislikes associés à l'utilisateur soient bien supprimés en même temps que le compte, il faudra
 que le frontend développe une fonctionnalité qui enverra une requête likeSauce avec like = 0 à toutes les sauces
 OU ajouter un array à l'utilisateur qui stockera l'id de toutes les sauces likées/dislikées qui servira à l'envoi de requêtes likeSauce
 ciblées avec like = 0 de la part du frontend */
exports.deleteUser = (req, res, next) => {
  User.findOne({ _id: req.body.userId })
    .then(user => {
      bcrypt.compare(req.body.password, user.password)
        .then(valid => {
          if (!valid) {
            return res.status(401).json({ error: 'Mot de passe incorrect !' });
          }
          User.deleteOne({ _id: req.body.userId })
            .then(() => {
              res.status(200).json({ message: 'Compte supprimé !' });
            });
        })
        .catch(error => res.status(500).json({ error }));
    })
    .catch(error => res.status(500).json({ error }));
};