module.exports = function(app, passport, db) {

// function to randomize winner  ===============================================================
let choiceArray = ["red", "green", "black"]

function winner(playerChoice, compChoice) {
    if(playerChoice === compChoice) {
      return "win"
  } else {
      return "lost"
  }
}



// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.ejs', {outcome: null})
    });

    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function(req, res) {
        db.collection('messages').find().toArray((err, result) => {
          if (err) return console.log(err)
          let bank = 100000000000
          let totalWin = 0
          let totalLosses = 0

          for(let i = 0; i < result.length; i++){
            if(result[i].outcome === "win"){
              bank -= result[i].bet
              totalWin += result[i].bet
            }else {
              bank += result[i].bet
              totalLosses += result[i].bet
            }
          }
          //play with array to add the totals up

          res.render('profile.ejs', {
            user : req.user,
            bank : bank,
            totalWin : totalWin,
            totalLosses : totalLosses
          })
        })
    });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

// roulette game route ===============================================================

    app.post('/messages', (req, res) => {
      const computerChoice = choiceArray[Math.floor(Math.random() * choiceArray.length)]
      const playerChoice = req.body.color

      let result = winner(computerChoice, playerChoice)

      db.collection('messages').save({outcome: result, bet: parseFloat(req.body.bet) }, (err, savedResult) => {
        if (err) return console.log(err)
        console.log('saved to database')
        res.render('index.ejs', {outcome: result, computerChoice, playerChoice})
      })
    })


// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function(req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage') });
        });

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // SIGNUP =================================
        // show the signup form
        app.get('/signup', function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
