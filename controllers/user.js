const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');


// Fonction qui permet à un utilisateur de s'inscrire dans la base de données avec l'email et le mot de passe qu'il fournit
exports.signup = (req, res, next) => {
  // Utilise le module bcrypt pour hash le mot de passe fourni par la requête
  bcrypt.hash(req.body.password, 10)
    .then(hash => {
      // Crée un nouveau user de modèle User et lui attribue l'email du corps de la requête ainsi que le mot de passe hashé par bcrypt
      const user = new User({
        email: req.body.email,
        password: hash
      });
      // Sauvegarde ce nouveau user dans la base de données et envoie une réponse avec status 201 au frontend
      user.save()
        .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
        .catch(error => res.status(400).json({ error }));
    })
    .catch(error => res.status(500).json({ error }));
};

// Fonction qui permet à un utilisateur de se connecter pour accéder au site web
exports.login = (req, res, next) => {
    // Cherche un utilisateur dans la base de données à partir de l'email fourni dans le corps de la requête
    User.findOne({ email: req.body.email })
      .then(user => {
        if (!user) {
          return res.status(401).json({ error: 'Utilisateur non trouvé !' });
        }
        /* Avec le module bcrypt, compare le mot de passe fourni par l'utilisateur et celui stocké dans la base de données associé à l'email fourni
        Si les mots de passe diffèrent, renvoie une erreur */
        bcrypt.compare(req.body.password, user.password)
          .then(valid => {
            if (!valid) {
              return res.status(401).json({ error: 'Mot de passe incorrect !' });
            }
            /* Avec le module jwt, fourni en réponse à l'utilisateur un token d'authentification expirant dans 24h 
            lui permettant d'accéder aux parties et aux fonctions du site web permises par son niveau d'accès
            Le token utilisé 'RANDOM_TOKEN_SECRET' est à remplacer par une chaîne aléatoire beaucoup plus longue une fois en prod */
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


/* Fonction qui permet à l'utilisateur de modifier son mot de passe
Sécurité par mot de passe : l'utilisateur doit taper son mot de passe actuel pour en choisir un nouveau */
exports.modifyUser = (req, res, next) => {
  // Cherche un utilisateur dans la base de données à partir du userId fourni dans le corps de la requête
  User.findOne({ _id: req.body.userId })
  .then(user => {
    /* Avec le module bcrypt, compare le mot de passe fourni par l'utilisateur et celui stocké dans la base de données associé au userId fourni
        Si les mots de passe diffèrent, renvoie une erreur */
    bcrypt.compare(req.body.password, user.password)
        .then(valid => {
          if (!valid) {
            return res.status(401).json({ error: 'Mot de passe incorrect !' });
          }
          // Utilise le module bcrypt pour hash le nouveau mot de passe fourni par la requête
          bcrypt.hash(req.body.newPassword, 10)
            .then(hash => {
              let userToModify = user;
              userToModify.password = hash;
              // Met à jour dans la base de données le nouveau mot de passe de l'utilisateur et envoie une réponse au status 201 au frontend
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


/* Fonction qui permet à l'utilisateur de supprimer son compte
Sécurité par mot de passe : l'utilisateur doit taper son mot de passe pour confirmer la suppression de son compte
 Pour s'assurer que les likes et dislikes associés à l'utilisateur soient bien supprimés en même temps que le compte, il faudra
 que le frontend développe une fonctionnalité qui enverra une requête likeSauce avec like = 0 à toutes les sauces
 OU ajouter un array à l'utilisateur qui stockera l'id de toutes les sauces likées/dislikées qui servira à l'envoi de requêtes likeSauce
 ciblées avec like = 0 de la part du frontend */
exports.deleteUser = (req, res, next) => {
  // Cherche un utilisateur dans la base de données à partir du userId fourni dans le corps de la requête
  User.findOne({ _id: req.body.userId })
    .then(user => {
      /* Avec le module bcrypt, compare le mot de passe fourni par l'utilisateur et celui stocké dans la base de données associé au userId fourni
        Si les mots de passe diffèrent, renvoie une erreur */
      bcrypt.compare(req.body.password, user.password)
        .then(valid => {
          if (!valid) {
            return res.status(401).json({ error: 'Mot de passe incorrect !' });
          }
          // Supprime l'utilisateur de la base de données et envoie une réponse au status 200
          User.deleteOne({ _id: req.body.userId })
            .then(() => {
              res.status(200).json({ message: 'Compte supprimé !' });
            });
        })
        .catch(error => res.status(500).json({ error }));
    })
    .catch(error => res.status(500).json({ error }));
};