import express from 'express';
//import http from 'http';
import path from 'path';
import bodyparser from 'body-parser';
import cors from 'cors';
import expressValidator from 'express-validator';
import helmet from 'helmet';
import mongoose from 'mongoose';
//import autoIncrementSQ from 'mongoose-sequence';
import url from 'url';
import compression from 'compression' ;
import router from './routes';
import ApiError from './helpers/ApiError';
import fs from 'fs';
const fileUpload = require('express-fileupload');
const morgan = require('morgan');
import 'dotenv/config';

 //console.log(process.env) // remove this after you've confirmed it working

var i18n = require("i18n");
i18n.configure({
    locales:['ar', 'en'],
    directory: __dirname + '/locales',
    register: global,
    defaultLocale:'ar'
});

//
mongoose.Promise = global.Promise;

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, autoIndex: false, useUnifiedTopology: true });

//const autoIncrement = autoIncrementSQ(mongoose.connection);

mongoose.connection.on('connected', () =>{

    console.log('\x1b[32m%s\x1b[0m', '[DB] Connected...');
} );
mongoose.connection.on('error', err => console.log('\x1b[31m%s\x1b[0m', '[DB] Error : ' + err));
mongoose.connection.on('disconnected', () => console.log('\x1b[31m%s\x1b[0m', '[DB] Disconnected...'));



const app = express();
app.use(fileUpload({
    createParentPath: true
}));
app.use(compression());
app.use(cors());
app.use(helmet());
app.disable('x-powered-by');
app.use(morgan('dev'));
app.use(function(req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.header("Cross-Origin-Resource-Policy", "cross-origin");
   res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
   next();
});

// app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
// app.use('/otherImage.png', express.static(path.join(__dirname, '..','./other.png')));

app.use((req, res, next)=> {
    i18n.setLocale(req.headers['accept-language'] || 'ar');
    return next();
  });


// Ensure Content Type
app.use('/', (req, res, next) => {

    // check content type
    let contype = req.headers['content-type'];
    if (contype && !((contype.includes('application/json') || contype.includes('multipart/form-data'))))
        return res.status(415).send({ error: 'Unsupported Media Type (' + contype + ')' });
    // set current host url
    // config.appUrl = url.format({
    //     protocol: req.protocol,
    //     host: req.get('host')
    // });
    next();
});



app.use(bodyparser.json({ limit: '1000mb' }));
app.use(bodyparser.urlencoded({ limit: '1000mb', extended: true, parameterLimit: 50000 }));


//app.use(expressValidator());

//Routes
// app.use((req, res, next)=>{
//     console.log(req.body,"RES");
//     next()
// })

app.use('/', router);
app.use('/.well-known/assetlinks.json',express.static('./assetlinks.json'));



//Not Found Handler
// app.use((req, res, next) => {
//     next(new ApiError(404, 'Not Found...'));
// });


//ERROR Handler
app.use((err, req, res, next) => {

    if (err instanceof mongoose.CastError)
        err = new ApiError.NotFound(err) ||  new ApiError.NotFound(err.model.modelName)  ;
    console.log(err);
    res.status(err.status || 500).json({
        errors: err.message
    });

});

export default app;
