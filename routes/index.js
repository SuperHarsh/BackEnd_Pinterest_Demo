var express = require('express');
var router = express.Router();
var userModel = require('./users');
var postModel = require('./post');
var passport = require('passport');
var strategy = require('passport-local');
var upload = require('./multer');

passport.use(new strategy(userModel.authenticate()));

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('home',{nav: false});
});

router.get('/register',function(req,res){
  res.render('register',{nav: false});
})

router.get('/profile',isLoggedIn,async function(req,res){
  const user = await userModel.findOne({username: req.session.passport.user}).populate('postID');
  res.render('profile',{user: user,nav: true});
})

router.get('/add',isLoggedIn, function(req,res){
  res.render('add',{nav: true});
});

router.post('/createpost', isLoggedIn, upload.single("postImage"), async function(req,res){
  if(!req.file){
    return res.status(400).send('No Files were uploaded');
  }
  const user = await userModel.findOne({username: req.session.passport.user});
  const post = await postModel.create({
    userID: user._id,
    title: req.body.title,
    description: req.body.description,
    image: req.file.filename
  })
  user.postID.push(post._id);
  await user.save();
  res.redirect('/profile');
});

router.post('/upload', isLoggedIn, upload.single("image"), async function(req,res){
  if(!req.file){
    return res.status(400).send('No Files were uploaded');
  }
  const user = await userModel.findOne({username: req.session.passport.user});
  user.profileImage = req.file.filename;
  await user.save();
  res.redirect('/profile');
});

router.get('/feed',isLoggedIn, async function(req,res){
  const user = await userModel.findOne({username: req.session.passport.user});
  const post = await postModel.find().populate("userID");
  res.render('feed',{user, post, nav:true})
})

router.post('/register',function(req,res){
  const userdata = new userModel({
    username: req.body.username,
    fullname: req.body.fullname,
    email: req.body.email,
  });

  userModel.register(userdata,req.body.password).then(function(){
    passport.authenticate('local')(req,res,function(){
      res.redirect('/profile');
    })
  })

});

router.post('/login',passport.authenticate('local', {
  failureRedirect: '/',
  successRedirect: '/profile'
}), function(req,res,next){

});

router.get('/logout',function(req,res,next){
  req.logout(function(err){
    if(err){
      return next(err);
    }
    res.redirect('/');
  })
})

function isLoggedIn(req,res,next){
  if(req.isAuthenticated()){
    return next();
  }else{
    return res.redirect('/');
  }
  
}

module.exports = router;
