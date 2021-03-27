const Sauce = require('../models/Sauce');
const fs = require('fs');

exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id;
    sauceObject.likes = 0;
    sauceObject.dislikes = 0;
    sauceObject.usersLiked = [];
    sauceObject.usersDisliked = [];
    const sauce = new Sauce({
        ...sauceObject,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });
    sauce.save()
        .then(() => {
        res.status(201).json({ message: 'Sauce saved successfully!' });
      })
    .catch((error) => {
        res.status(400).json({ error: error });
    });
  };

exports.modifySauce = (req, res, next) => {
    const sauceObject = req.file ?
        {
            ...JSON.parse(req.body.sauce),
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        } : { ...req.body };
    Sauce.updateOne({_id: req.params.id}, { ...sauceObject, _id: req.params.id })
    .then(() => { 
        res.status(201).json({ message: 'Sauce updated successfully!' });
    })
    .catch((error) => {
          res.status(400).json({ error: error });
    });
};

exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
    .then(sauce => {
        const filename = sauce.imageUrl.split('/images/')[1];
        fs.unlink(`images/${filename}`, () => {
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

exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
        res.status(200).json(sauce);
    })
    .catch((error) => {
        res.status(404).json({ error: error });
    });
};

exports.getAllSauces = (req, res, next) => {
    Sauce.find()
    .then((sauces) => {
        res.status(200).json(sauces);
    })
    .catch((error) => {
        res.status(400).json({ error: error });
    });
};

exports.likeSauce = (req, res, next) => {
    try {
        const switchException = (message, status) => {
            this.message = message;
            this.status = status;
        };
        Sauce.findOne({ _id: req.params.id })
        .then((sauce) => {
            let sauceToTest = sauce;
            switch (req.body.like) {
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
                default:
                    throw new switchException("Like value is incorrect.", 400);
            }
        })
    } catch(error) {
        res.status(error.status).json({error: error.message });
    };
};