const Sauce = require('../models/Sauce');
const fs = require('fs');

// Fonction qui permet de créer une nouvelle sauce dans la base de données
exports.createSauce = (req, res, next) => {
    /* Crée sauceObject qui récupère l'objet sauce dans le corps de la requête, lui supprime son id par défaut et lui défini
    les valeurs de base des champs INT likes et dislikes, et des arrays usersLiked et Disliked */
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id;
    sauceObject.likes = 0;
    sauceObject.dislikes = 0;
    sauceObject.usersLiked = [];
    sauceObject.usersDisliked = [];
    /* Crée un nouvel objet de modèle Sauce, lui intègre les infos de sauceObject et lui définit son champ imageUrl 
    basé sur les infos et le corps de la requête, ainsi que l'emplacement de l'image sauvegardée plus tôt grâce au middleware multer */
    const sauce = new Sauce({
        ...sauceObject,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });
    // Sauvegarde le nouvel objet sauce dans la base de données et envoie une réponse de status 201 au frontend
    sauce.save()
        .then(() => {
        res.status(201).json({ message: 'Sauce saved successfully!' });
      })
    .catch((error) => {
        res.status(400).json({ error: error });
    });
  };


// Fonction qui permet de modifier une sauce déjà existante dans la base de données
exports.modifySauce = (req, res, next) => {
    /* Crée un objet sauceObject qui regarde si la requête est accompagnée d'un fichier à stocker
    Si oui, la nouvelle image est traitée, sinon, on traite juste l'objet entrant */
    const sauceObject = req.file ?
        {
            ...JSON.parse(req.body.sauce),
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        } : { ...req.body };
    // La sauce est mise à jour avec les infos dunouvel objet reçu par la requête
    Sauce.updateOne({_id: req.params.id}, { ...sauceObject, _id: req.params.id })
    .then(() => { 
        res.status(201).json({ message: 'Sauce updated successfully!' });
    })
    .catch((error) => {
          res.status(400).json({ error: error });
    });
};


// Fonction qui permet de supprimer une sauce existante dans la base de données
exports.deleteSauce = (req, res, next) => {
    // Cherche la sauce correspondante d'après l'id fournie par la requête
    Sauce.findOne({ _id: req.params.id })
    .then(sauce => {
        const filename = sauce.imageUrl.split('/images/')[1];
        // Supprime l'image associée à la sauce
        fs.unlink(`images/${filename}`, () => {
            // Supprime la sauce de la base de données et envoie une réponse pour en notifier le frontend
            Sauce.deleteOne({_id: req.params.id})
                .then(() => {
                    res.status(200).json({ message: 'Deleted!' });
                })
                .catch((error) => {
                    res.status(400).json({ error: error });
                });
        });
    })
    .catch(error => res.status(500).json({ error }));
};


// Fonction qui permet de récupérer les infos d'une sauce existante dans la base de données
exports.getOneSauce = (req, res, next) => {
    // Cherche la sauce correspondante d'après l'id fournie par la requête
    Sauce.findOne({ _id: req.params.id })
    // Envoie les infos de la sauce dans la réponse à la requête
    .then((sauce) => {
        res.status(200).json(sauce);
    })
    .catch((error) => {
        res.status(404).json({ error: error });
    });
};


// Fonction qui permet de récupérer la liste de toutes les sauces et leurs infos dans la base de données
exports.getAllSauces = (req, res, next) => {
    Sauce.find()
    .then((sauces) => {
        res.status(200).json(sauces);
    })
    .catch((error) => {
        res.status(400).json({ error: error });
    });
};


// Fonction qui permet de d'ajouter ou retirer un like ou un dislike à une sauce
exports.likeSauce = (req, res, next) => {
    try {
        // Crée un nouveau type d'exception pour le switch à venir
        const switchException = (message, status) => {
            this.message = message;
            this.status = status;
        };
        // Cherche la sauce correspondante d'après l'id fournie par la requête
        Sauce.findOne({ _id: req.params.id })
        .then((sauce) => {
            // Crée un objet sauceToTest qui intègre les infos de la sauce trouvée plus tôt
            let sauceToTest = sauce;
            // En fonction de la valeur de "like" dans le corps de la requête, donne différents résultats
            switch (req.body.like) {
                /* Si like = 1, teste d'abord si le user à l'origine de la requête n'existe déjà pas dans la liste
                usersLiked de la sauce, puis, si il n'y est pas, l'y ajoute, recalcule le nombre de likes de la sauce en 
                fonction de la longueur de l'array usersLiked, et met à jour la sauce dans la base de données
                avec les infos de la sauce modifiée, avant d'envoyer une réponse de status 201 au frontend 
                Si le user est déjà dans usersLiked, throw une switchException avec un message d'erreur et un status code */
                case 1:
                    if (sauceToTest.usersLiked.indexOf(req.body.userId) === -1) {
                        sauceToTest.usersLiked.push(req.body.userId);
                        sauceToTest.likes = sauceToTest.usersLiked.length;
                        Sauce.updateOne({_id: req.params.id}, sauceToTest)
                        .then(() => {
                            res.status(201).json({ message : "Sauce liked!" });
                        })
                        .catch((error) => {
                            res.status(409).json({ error: error });
                        });
                    } else {
                        throw new switchException("User already likes this sauce!", 200);
                    };
                    break;
                /* Si like = 0, teste d'abord si le user à l'origine de la requête existe dans la liste
                usersLiked de la sauce, puis : 
                -si il y est, le retire et recalcule le nombre de likes de la sauce en 
                fonction de la longueur de l'array usersLiked, et met à jour la sauce dans la base de données
                avec les infos de la sauce modifiée, avant d'envoyer une réponse de status 201 au frontend 
                -s'il n'y est pas, teste si le user à l'origine de la requête existe dans la liste
                usersDisliked de la sauce, et s'il y est, le retire et recalcule le nombre de dislikes de la sauce en 
                fonction de la longueur de l'array usersDisliked, et met à jour la sauce dans la base de données
                avec les infos de la sauce modifiée, avant d'envoyer une réponse de status 201 au frontend 
                Si le user n'est dans aucun des deux arrays, throw une switchException avec un message d'erreur et un status code */
                case 0:
                    if ((userToRemoveIndex = sauceToTest.usersLiked.indexOf(req.body.userId)) !== -1) {
                        sauceToTest.usersLiked.splice(userToRemoveIndex, 1)
                        sauceToTest.likes = sauceToTest.usersLiked.length;
                        Sauce.updateOne({_id: req.params.id}, sauceToTest)
                        .then(() => {
                            res.status(201).json({ message : "Sauce unliked!" });
                        });
                    } else if ((userToRemoveIndex = sauceToTest.usersDisliked.indexOf(req.body.userId)) !== -1) {
                        sauceToTest.usersDisliked.splice(userToRemoveIndex, 1)
                        sauceToTest.dislikes = sauceToTest.usersDisliked.length;
                        Sauce.updateOne({_id: req.params.id}, sauceToTest)
                        .then(() => {
                            res.status(201).json({ message : "Sauce un-disliked!" });
                        });
                    } else {
                        throw new switchException("User does not have an opinion about this sauce.", 200);
                    };
                    break;
                /* Si like = -1, teste d'abord si le user à l'origine de la requête n'existe déjà pas dans la liste
                usersDisliked de la sauce, puis, si il n'y est pas, l'y ajoute, recalcule le nombre de dislikes de la sauce en 
                fonction de la longueur de l'array usersDisliked, et met à jour la sauce dans la base de données
                avec les infos de la sauce modifiée, avant d'envoyer une réponse de status 201 au frontend 
                Si le user est déjà dans usersDisliked, throw une switchException avec un message d'erreur et un status code */
                case -1:
                    if (sauceToTest.usersDisliked.indexOf(req.body.userId) === -1) {
                        sauceToTest.usersDisliked.push(req.body.userId)
                        sauceToTest.dislikes = sauceToTest.usersDisliked.length;
                        Sauce.updateOne({_id: req.params.id}, sauceToTest)
                        .then(() => {
                            res.status(201).json({ message : "Sauce disliked!" });
                        });
                    } else {
                        throw new switchException("User already dislikes this sauce!", 200);
                    };
                    break
                // Si la valeur de like ne correspond à aucune valeur admise par le switch, throw une switchException
                default:
                    throw new switchException("Like value is incorrect.", 400);
            }
        })
    } catch(error) {
        res.status(error.status).json({error: error.message });
    };
};