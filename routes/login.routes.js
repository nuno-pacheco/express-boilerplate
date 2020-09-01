const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const User = require('../models/User.model');
const Job = require('../models/Job.model');
const Skill = require('../models/Skill.model');
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const mongoose = require('mongoose');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:true}));

//LOGIN//
router.get('/auth/login', (req, res, next) => res.render('login'));

router.post('/login', (req, res, next) => {
  console.log('SESSION =====> ', req.session);
  const { 
    email, 
    passwordHash 
  } = req.body;
  console.log(req.body)

  if (!email || !passwordHash) {
    res.render('login', {
      errorMessage: 'All fields are mandatory. Please provide your email and password.'});
    return;
  } else {
    console.log("email and password entered correctly");
  }

  User.findOne({ email })
    .then(user => {
      console.log('searching for email registration')
      if (!user) {
        res.render('login', { errorMessage: 'Email is not registered. Try with other email.' });
        return;
      } else if (bcrypt.compareSync(passwordHash, user.passwordHash)) {
       
//*** Save user ***//

       req.session.currentUser = user;
        res.redirect('/profile-user');
       // res.render("profileuser");
 
      }else {
        res.render('auth/login', {errorMessage: 'Incorrect password'});
      }
    })
    .catch(error => next(error));
  });

//LOGOUT//

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.render('logout')
  });
})

/*
router.post("/logout", (req,res) => {
  req.session.destroy();
  res.render('logout.hbs')
  res.redirect("/logout");
})
*/


router.get("/profile-user", (req, res, next) => {
  console.log(req.session.currentUser);
  const currentUser = req.session.currentUser;
  const {name, email, telephone, address, jobowner, skillprovider} = currentUser;
  const jobId = currentUser.jobs[0];
  Job.findOne({ _id: jobId })
    .then((jobdetailsFromDB) => {
      const { selectDescription, additionalInformation, jobowner, jobstatus, allocation } = jobdetailsFromDB;
      console.log(selectDescription, additionalInformation, jobowner, jobstatus, allocation);
      User.findOne({_id:jobdetailsFromDB.jobowner}).then((foundJobOwner) => {
      const { name:jobOwnerName, email:jobOwnerEmail, telephone:jobOwnerTelephone } = foundJobOwner;
      if(allocation){
      User.findOne({_id:jobdetailsFromDB.allocation}).then((foundSkillProvider) => {
      const { name:skillProviderName } = foundSkillProvider;
      const infoForProfilePage = {
        name,
        email,
        telephone,
        address,
        selectDescription,
        additionalInformation,
        skillProviderName,
        jobOwnerName,
        jobOwnerEmail,
        jobOwnerTelephone,
        jobstatus
    };
  });
 } else {
      const infoForProfilePage = {
        name,
        email,
        telephone,
        address,
        selectDescription,
        additionalInformation,
        skillProviderName:"Not yet assigned",
        jobOwnerName,
        jobOwnerEmail,
        jobOwnerTelephone,
        jobstatus
    }
    res.render("profileuser", infoForProfilePage);
      }
})
    
    .catch(error => next(error));
    })
  })


module.exports = router;
