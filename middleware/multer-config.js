const multer = require('multer');


// Redéfinit les extensions des différentes images qu'il faudra traiter
const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png'
};

/* Indique dans quel répertoire il faudra stocker les fichiers sur le disque local 
et redéfinit le format du nom sous lequel les fichiers seront enregistrés */
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'images');
  },
  filename: (req, file, callback) => {
    const name = file.originalname.split(' ').join('_').split('.')[0];
    const extension = MIME_TYPES[file.mimetype];
    callback(null, name + Date.now() + '.' + extension);
  }
});

// Middleware permettant de stocker les images associées aux requêtes reçues par le serveur
module.exports = multer({storage: storage}).single('image');