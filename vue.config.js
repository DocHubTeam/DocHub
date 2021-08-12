const fs = require('fs');

// Дефолтная конфигурация dev-сервера
let config = {
    devServer: {
        /*
        allowedHosts: [
            'dochub.rabota.space',
            'localhost'
        ],
        */
    }
};

// Подключает сертификаты, если они обнаружены
if(false && fs.lstatSync(__dirname + '/certs').isDirectory()) {
    config.devServer = {
        http2: true,
        https: {
            key: fs.readFileSync(__dirname + '/certs/server.key'),
            cert: fs.readFileSync(__dirname + '/certs/server.cert')
        }
    }
}

module.exports = config;
