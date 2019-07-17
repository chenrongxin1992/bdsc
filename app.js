var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

const session = require('express-session')
const MongoStore = require('connect-mongo')(session);

var index = require('./routes/index');
var users = require('./routes/users');

//后台路由
var manage = require('./routes/manage/manage');//后台管理路由

//日志
var FileStreamRotator = require('file-stream-rotator')
var logDirectory = path.join(__dirname, 'logs')
var fs = require('fs')

//log4js
const log4js = require('log4js')
//通过configure()配置log4js
log4js.configure({
    appenders: {
      fileLog: { 
        type: 'dateFile', 
        filename: './logs/error-',
        pattern: ".yyyy-MM-dd.log",
        maxLogSize: 100000,
        encoding: "utf-8",
        alwaysIncludePattern: true 
      }
    },categories:{
      file: { appenders: ['fileLog'], level: 'error' },
      default: { appenders: ['fileLog'], level: 'error' }
    },
    replaceConsole: true
});
const logger1 = log4js.getLogger('normal');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// ensure log directory exists
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory)

// create a rotating write stream
var accessLogStream = FileStreamRotator.getStream({
  date_format: 'YYYYMMDD',
  filename: path.join(logDirectory, 'access-%DATE%.log'),
  frequency: 'daily',
  verbose: false
})

// setup the logger
app.use(logger('short', {stream: accessLogStream}))
app.use(log4js.connectLogger(logger1, {level: log4js.levels.INFO}));

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json({limit:'50mb'}));

app.use(bodyParser.urlencoded({ limit:'50mb',extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//add session
app.use(session({ 
    resave: true, //是指每次请求都重新设置session cookie，假设你的cookie是6000毫秒过期，每次请求都会再设置6000毫秒
    saveUninitialized: false, // 是指无论有没有session cookie，每次请求都设置个session cookie ，默认给个标示为 connect.sid。
    secret: 'spatial',
    cookie:{ 
        maxAge: 6* 60 * 60 * 1000//60分钟有效期
        //expires : new Date(Date.now() + 7200000)//默认是UTC时间，Date.now()获取当前时间的时间戳，输出是毫秒。
    },
    store:new MongoStore({url: 'mongodb://spatial_lab:youtrytry@localhost:27017/spatial_lab'})
}));

app.use(function(req,res,next){ 
  console.log('dddd',req.session)
  if(!req.session){
    next(new Error('no session'))
  }else{

    //console.log('-----------------',index.redis)
    res.locals.username = req.session.username;   // 从session 获取 user对象
    res.locals.rolename = req.session.rolename;
    res.locals.account = req.session.account;
    res.locals.userid = req.session.userid;
    res.locals.photo = req.session.photo;
    // use this middleware to reset cookie expiration time
    // when user hit page every time
    //req.session._garbage = Date();
    //req.session.touch();
    next() //中间件传递
  }
});

app.use('/', index);
app.use('/users', users);

app.use('/manage',function(req,res,next){
  console.log('check login',req.url)
  if(req.url == '/login' || (req.url).indexOf("/vcode") != -1){
    next()
  }else{
    if(req.session.account==''||req.session.account==null){
        console.log('no login redirect')
        return res.redirect('/spatial/manage/login')
    }else{
      next()
    }
  }
})
app.use('/manage', manage);//后台路由

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
