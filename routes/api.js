//Dependencies
const router = require('express').Router();
const { render } = require('ejs');
const { application } = require('express');
const session = require('express-session');
const mongoclient = global.mongoclient;
const mongoAccounts = mongoclient.db("StoaExchange").collection("accounts");
const mongoBrief = mongoclient.db("StoaExchange").collection("briefs");
const mongoContact = mongoclient.db("StoaExchange").collection("contact");
const mongoRatings = mongoclient.db("StoaExchange").collection("ratings");
const mongoBriefsReceived = mongoclient.db("StoaExchange").collection("briefsReceived");
const mongoPracticeRoundRequests = mongoclient.db("StoaExchange").collection("practiceRoundRequests");
const mongoContactPR = mongoclient.db("StoaExchange").collection("practiceRoundContact");
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const moment = require('moment');
const { ObjectId } = require('mongodb');
const env = require('dotenv').config()
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD
const EMAIL_USERNAME = process.env.EMAIL_USERNAME
const bcrypt = require('bcrypt')
const rateLimit = require('express-rate-limit')
const helmet = require("helmet");
const mongoSanitize = require('express-mongo-sanitize');
router.use(mongoSanitize());

//Middleware for cookie authentication
const isAuth = (req, res, next)=>{
    if(req.session.email){
        next()
    }else{
        req.session.nextRedirect = req.originalUrl
res.redirect('/login')    }
}
//middleware for verifying email

const verifyEmail =  (title, description) => {
    return async (req, res, next) => {
        if(req.session.email){
            var results = await mongoAccounts.findOne({email: req.session.email})
            var notificationsFromMongo = {
                "notifications":[]
                }
            if(results.verificationNumber != ""){
                return res.render("noEmail",{
                    verificationNumber: results.verificationNumber,
                    auth: req.session.email,
                    authName: req.session.name,
                    numberOfNotifications: notificationsFromMongo.notifications.length,
                    notificationsArray: notificationsFromMongo.notifications,
                    typeOfPageName: title,
                    typeOfPageDescription: description,
                })
            }            next()
    
        }
    }
  }
//middleware for redirecting to the same page after marking notifs as read
const markAsRead = (req,res,next)=>{
    req.session.notificationRedirect = req.originalUrl
    next()
}


const limiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 50,
	standardHeaders: true,
	legacyHeaders: false,
    message: async (req, res) => {
        if(req.session.email){
            var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
        }else{
            var notificationsFromMongo = {
                "notifications":[]
                }
        }
        res.render('429', {
            auth: req.session.email,
            authName: req.session.name,
            numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
            type: "api",
        }); 
		
	},

})
router.use(limiter)


function sortingMongoDB(results){
    let StringifiedResults = JSON.stringify(results)
    let ParsedResults = JSON.parse(StringifiedResults)
    return ParsedResults
}
router.post("/register",markAsRead, async (req,res)=>{
    try{

    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
        return res.render("register", {

            numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
                    emailAvailable: true,
                    nameAvailable: true,
                    email: null,
                    name: null,
                    speechranks: null,
                    password: null,
                    confirmPassword: null,
                    parliChecked: null,
                    ldChecked: null,
                    tpChecked: null,
                    speechranksValid: true,
                    passwordsMatching: true,
            emailAvailable: true,
                    auth: req.session.email,        
                    authName: req.session.name,
                termsAndConditionsAgreed: true,    })
    }

    var answer = req.body
    

    const recipient= answer.email

    if (answer.ld){
        var tempLD = true

    }else{
        var tempLD = false

    }
    if (answer.tp){
        var tempTP = true

    }else{
        var tempTP = false

    }
    if (answer.parli){
        var tempPARLI = true
    }else{
        var tempPARLI = false
    }

    var existing =  await mongoAccounts.count({email: answer.email.toLowerCase()})
    var existing2 =  await mongoAccounts.count({nameToLowerCase: answer.name.toLowerCase().replace(" ","")})
    if(existing>0){
        return res.render("register",{            fullName: true,
            emailAvailable: false,
            nameAvailable: true,
            email: answer.email,
            name: req.body.name,
            speechranks: answer.speechranks,
            password: answer.password,
            confirmPassword: answer.confirmPassword,
            parliChecked: tempPARLI,
            ldChecked: tempLD,
            tpChecked: tempTP,
            speechranksValid: true,
            passwordsMatching: true,
            auth: req.session.email,
            authName: req.session.name,
    numberOfNotifications: null,
    notificationsArray: null,
        })
    }
    if(existing2>0){
        return res.render("register",{            fullName: true,
            emailAvailable: true,
            nameAvailable: false,
            speechranksValid: true,
            email: answer.email,
            name: req.body.name,
            speechranks: answer.speechranks,
            password: answer.password,
            confirmPassword: answer.confirmPassword,
            parliChecked: tempPARLI,
            ldChecked: tempLD,
            tpChecked: tempTP,
            passwordsMatching: true,
            auth: req.session.email,
            authName: req.session.name,
            numberOfNotifications: null,
            notificationsArray: null,
        })
    }

    if(!answer.name.includes(" ")){
        return res.render("register",{
            fullName: false,
            emailAvailable: true,
            nameAvailable: true,
            passwordCorrect: true,
            speechranksValid: true,
            speechranksLink: false,
            email: answer.email,
            name: req.body.name,
            speechranks: answer.speechranks,
            password: answer.password,
            confirmPassword: answer.confirmPassword,
            parliChecked: tempPARLI,
            ldChecked: tempLD,
            tpChecked: tempTP,
            passwordsMatching: true,
            auth: req.session.email,
            authName: req.session.name,
            numberOfNotifications: null,
            notificationsArray: null,
        })
    }
    if(answer.speechranks != "" && !answer.speechranks.includes("speechranks.com/")){
        return res.render("register",{            fullName: true,
            emailAvailable: true,
            nameAvailable: true,
            passwordCorrect: true,
            speechranksValid: false,
            speechranksLink: false,
            email: answer.email,
            name: req.body.name,
            speechranks: answer.speechranks,
            password: answer.password,
            confirmPassword: answer.confirmPassword,
            parliChecked: tempPARLI,
            ldChecked: tempLD,
            tpChecked: tempTP,
            passwordsMatching: true,
            auth: req.session.email,
            authName: req.session.name,
            numberOfNotifications: null,
            notificationsArray: null,
        })
    }
    if(answer.password != answer.confirmPassword){
        return res.render("register",{            fullName: true,
            emailAvailable: true,
            nameAvailable: true,
            passwordCorrect: false,
            email: answer.email,
            name: req.body.name,
            speechranks: answer.speechranks,
            password: answer.password,
            confirmPassword: answer.confirmPassword,
            parliChecked: tempPARLI,
            ldChecked: tempLD,
            tpChecked: tempTP,
            speechranksValid: true,
            passwordsMatching: false,
            auth: req.session.email,
            authName: req.session.name,
            numberOfNotifications: null,
            notificationsArray: null,
        })
    }
    if(!answer.termsAndConditions){
        return res.render("register",{            fullName: true,
            emailAvailable: true,
            nameAvailable: true,
            passwordCorrect: true,
            termsAndConditionsAgreed: false,
            email: answer.email,
            name: req.body.name,
            speechranks: answer.speechranks,
            password: answer.password,
            confirmPassword: answer.confirmPassword,
            parliChecked: tempPARLI,
            ldChecked: tempLD,
            tpChecked: tempTP,
            speechranksValid: true,
            passwordsMatching: true,
            auth: req.session.email,
            authName: req.session.name,
            numberOfNotifications: null,
            notificationsArray: null,
        })
    }

var uuid = crypto.randomUUID()

    const emailContents = `
    <h1 style = "color:black;">Thanks for creating a BriefExchange account!</h1>
    <h2 style = "color:black;"> Please click <a href="https://stoaexchange.joshuaren.repl.co/verifyEmail?uuid=` + uuid +`" target = "_blank" style = "color: black;">here</a> to complete your signup. If you didn't create an account with us, please ignore this email.</h2>
    <style>*{  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"; text-align: center;} h1{font-size: 50px;} </style>
    ` 
    let transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      secure: true,
      port: 465,
      auth: {
        user: EMAIL_USERNAME,
        pass: EMAIL_PASSWORD,
      },
    });
    
    const mailOptions = {
        from: EMAIL_USERNAME, 
        to: recipient,
        subject: 'BriefExchange email verification',
        html: emailContents,
    };
    
    transporter.sendMail(mailOptions, function(err, info) {
    if (err) {
      console.log(err)
    }
    })

    try{
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(answer.password, salt)
        await mongoAccounts.insertOne({name: answer.name, speechranks: answer.speechranks, ld: tempLD, tp: tempTP, parli: tempPARLI, nameToLowerCase: answer.name.toLowerCase().replace(" ",""), rating: null, email: answer.email.toLowerCase(), password: hashedPassword, verificationNumber: uuid, notifications: []})
        
    }catch(err){
        if(req.session.email){
            var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
        }else{
            var notificationsFromMongo = {
                "notifications":[]
                }
        }
        res.status(500).render('500', {
            auth: req.session.email,
            authName: req.session.name,
            numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
        });      }

    return res.render("emailSent",{
        auth: req.session.email,
        authName: req.session.name,
        email: recipient,

    numberOfNotifications: null,
    notificationsArray: null,
    })

}catch(err){
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }
    res.status(500).render('500', {
        auth: req.session.email,
        authName: req.session.name,
        numberOfNotifications: notificationsFromMongo.notifications.length,
        notificationsArray: notificationsFromMongo.notifications,
    });    
}

})


router.post("/login",markAsRead,  async (req, res)=>{
    try{
    var answer = req.body
    

    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }

    var existing =  await mongoAccounts.count({email: answer.email.toLowerCase()})
    if (existing >0){
        var results =  await mongoAccounts.findOne({ email: answer.email.toLowerCase()})
        
        try{
            if (await bcrypt.compare(answer.password, results.password)){
                req.session.email = answer.email.toLowerCase()
                req.session.name = results.name
                return res.redirect(req.session.nextRedirect || "/")
            }else{
                return res.render("login",{
                    accountExisting: true,
                    passwordCorrect: false,
                    email: answer.email,
                    password: answer.password,
                    auth: req.session.email,
                    authName: req.session.name,
            numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
    
                })
            }
        }catch(err){
            console.log(err)
            if(req.session.email){
                var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
            }else{
                var notificationsFromMongo = {
                    "notifications":[]
                    }
            }
            res.status(500).render('500', {
                auth: req.session.email,
                authName: req.session.name,
                numberOfNotifications: notificationsFromMongo.notifications.length,
                notificationsArray: notificationsFromMongo.notifications,
            });   
        }
           
        
    }else{
        return res.render("login", {
            accountExisting: false,
            passwordCorrect: true,
            email: answer.email,
            auth: req.session.email,
            authName: req.session.name,
            password: answer.password,
        numberOfNotifications: notificationsFromMongo.notifications.length,
        notificationsArray: notificationsFromMongo.notifications,
        })
    }

}catch(err){
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }
    res.status(500).render('500', {
        auth: req.session.email,
        authName: req.session.name,
        numberOfNotifications: notificationsFromMongo.notifications.length,
        notificationsArray: notificationsFromMongo.notifications,
    });    
}
})



router.post('/logout',markAsRead,  isAuth, async (req,res)=>{
    try{
    req.session.destroy(e => {
        if (e) return res.send(e);
        else return res.redirect("/")
    })

}catch(err){
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }
    res.status(500).render('500', {
        auth: req.session.email,
        authName: req.session.name,
        numberOfNotifications: notificationsFromMongo.notifications.length,
        notificationsArray: notificationsFromMongo.notifications,
    });    
}
})
router.post("/emailVerification", markAsRead, async (req,res)=>{
    try{
    var results =  await mongoAccounts.findOne({email: req.session.email})
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }

    const recipient= req.session.email
    const emailContents = `
    <h1 style = "color:black;">Thanks for creating a BriefExchange account!</h1>
    <h2 style = "color:black;"> Please click <a href="https://stoaexchange.joshuaren.repl.co/verifyEmail?uuid=` + results.verificationNumber +`" target = "_blank" style = "color: black;">here</a> to complete your signup. If you didn't create an account with us, please ignore this email.</h2>
    <style>*{  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"; text-align: center;} h1{font-size: 50px;} </style>
    ` 
    let transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      secure: true,
      port: 465,
      auth: {
        user: EMAIL_USERNAME,
        pass: EMAIL_PASSWORD,
      },
    });
    
    const mailOptions = {
        from: EMAIL_USERNAME, 
        to: recipient,
        subject: 'BriefExchange email verification',
        html: emailContents,
    };
    
    transporter.sendMail(mailOptions, function(err, info) {
    if (err) {
      console.log(err)
    }
    })

    return res.render("editAccountInformation", {
        numberOfNotifications: notificationsFromMongo.notifications.length,
        notificationsArray: notificationsFromMongo.notifications,
        auth: req.session.email,
        authName: req.session.name,    
        verificationNumber: "emailSent",
    })

}catch(err){
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }
    res.status(500).render('500', {
        auth: req.session.email,
        authName: req.session.name,
        numberOfNotifications: notificationsFromMongo.notifications.length,
        notificationsArray: notificationsFromMongo.notifications,
    });    
}
})
router.post('/editAccountInformation', verifyEmail("Edit Account Information","edit your account information"), markAsRead,  isAuth, async (req, res)=>{
    try{
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }

    answer = req.body
user = req.query.user
    if (answer.ld){
        var tempLD = true
    }else{
        var tempLD = false
    }
    if (answer.tp){
        var tempTP = true
    }else{
        var tempTP = false
    }
    if (answer.parli){
        var tempPARLI = true
    }else{
        var tempPARLI = false
    }


    var existing =  await mongoAccounts.count({email: req.session.email})
    var results =  await mongoAccounts.findOne({email: req.session.email})
    
    if(answer.speechranks != "" && !answer.speechranks.includes("speechranks.com/")){
        if(!req.session.email){
            return res.render("noAccess",{
                auth: req.session.email,
                authName: req.session.name,
                numberOfNotifications: notificationsFromMongo.notifications.length,
                notificationsArray: notificationsFromMongo.notifications,
            })
        }else{ return res.render("editAccountInformation",{
            emailAvailable: true,
            passwordCorrect: true,
            speechranksValid: false,
            speechranksLink: false,
            email: answer.email,
            name: answer.name,
            speechranks: answer.speechranks,
            password: answer.password,
            confirmPassword: answer.confirmPassword,
            parliChecked: tempPARLI,
            ldChecked: tempLD,
            tpChecked: tempTP,
            passwordsMatching: true,
            auth: req.session.email,
            authName: req.session.name,
            oldPassword: answer.oldPassword,
            newPassword: answer.newPassword,
            confirmNewPassword: answer.confirmNewPassword,
            numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
            verificationNumber: null,
            oldPasswordExisting: null,
        })}
    }
    if(!(await bcrypt.compare(answer.oldPassword, results.password)) && answer.oldPassword){
        if(!req.session.email){
            return res.render("noAccess",{
                auth: req.session.email,
                authName: req.session.name,
                numberOfNotifications: notificationsFromMongo.notifications.length,
                notificationsArray: notificationsFromMongo.notifications,
            })
        }else{return res.render("editAccountInformation",{
            emailAvailable: true,
            passwordCorrect: false,
            email: answer.email,
            name: answer.name,
            speechranks: answer.speechranks,
            password: answer.password,
            confirmPassword: answer.confirmPassword,
            parliChecked: tempPARLI,
            ldChecked: tempLD,
            tpChecked: tempTP,
            speechranksValid: true,
            passwordsMatching: false,
            auth: req.session.email,
            authName: req.session.name,
            passwordRight: false,
            oldPassword: answer.oldPassword,
            newPassword: answer.newPassword,
            confirmNewPassword: answer.confirmNewPassword,
            numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
            verificationNumber: null,oldPasswordExisting: null,

        })}
    }
    if(answer.newPassword != answer.confirmNewPassword){
        if(!req.session.email){
            return res.render("noAccess",{
                auth: req.session.email,
                authName: req.session.name,
                numberOfNotifications: notificationsFromMongo.notifications.length,
                notificationsArray: notificationsFromMongo.notifications,
            })
        }else{ return res.render("editAccountInformation",{
            emailAvailable: true,
            passwordCorrect: false,
            email: answer.email,
            name: answer.name,
            speechranks: answer.speechranks,
            password: answer.password,
            confirmPassword: answer.confirmPassword,
            parliChecked: tempPARLI,
            ldChecked: tempLD,
            tpChecked: tempTP,
            speechranksValid: true,
            passwordsMatching: false,
            auth: req.session.email,
            authName: req.session.name,
            passwordRight: true,
            oldPassword: answer.oldPassword,
            newPassword: answer.newPassword,
            confirmNewPassword: answer.confirmNewPassword,
            numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
            verificationNumber: null,oldPasswordExisting: null,
        })}
    }
   
    if(answer.newPassword && answer.confirmNewPassword && !answer.oldPassword){
        if(!req.session.email){
            return res.render("noAccess",{
                auth: req.session.email,
                authName: req.session.name,
                numberOfNotifications: notificationsFromMongo.notifications.length,
                notificationsArray: notificationsFromMongo.notifications,
            })
        }else{ return res.render("editAccountInformation",{
            oldPasswordExisting: false,
            emailAvailable: true,
            passwordCorrect: false,
            email: answer.email,
            name: answer.name,
            speechranks: answer.speechranks,
            password: answer.password,
            confirmPassword: answer.confirmPassword,
            parliChecked: tempPARLI,
            ldChecked: tempLD,
            tpChecked: tempTP,
            speechranksValid: true,
            passwordsMatching: false,
            auth: req.session.email,
            authName: req.session.name,
            passwordRight: true,
            oldPassword: answer.oldPassword,
            newPassword: answer.newPassword,
            confirmNewPassword: answer.confirmNewPassword,
            numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
            verificationNumber: null,
            oldPasswordExisting: null,
        })}
    }
   
if (answer.password){
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(answer.password, salt)
    
    await mongoAccounts.updateOne({email: req.session.email},{$set: {speechranks: answer.speechranks, password: hashedPassword, ld: tempLD, tp: tempTP, parli: tempPARLI, rating: results.rating, name: results.name, nameToLowerCase: results.nameToLowerCase}})

}else{
    await mongoAccounts.updateOne({email: req.session.email},{$set: {speechranks: answer.speechranks, ld: tempLD, tp: tempTP, parli: tempPARLI, rating: results.rating, name: results.name, nameToLowerCase: results.nameToLowerCase}})

}
    return res.render("success",{
        auth: req.session.email,
        authName: req.session.name,
        numberOfNotifications: notificationsFromMongo.notifications.length,
        notificationsArray: notificationsFromMongo.notifications,
    })

}catch(err){
    console.log(err)
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }
    res.status(500).render('500', {
        auth: req.session.email,
        authName: req.session.name,
        numberOfNotifications: notificationsFromMongo.notifications.length,
        notificationsArray: notificationsFromMongo.notifications,
    });    
}
})
router.post("/addABriefOffer",  verifyEmail("Add a Brief Offer","add a brief offer"),isAuth,  markAsRead,  async (req, res)=>{
    try{
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }
answer = req.body
    results = await mongoBrief.count({type: "offering", nameToLowerCase: req.session.name.toLowerCase().replace(" ", "")})
    if (results > 9){
        return res.render("addABriefOffer",{
            auth: req.session.email,
            authName: req.session.name,
            maxOfferingsMet: true,
            completed: false,
            briefName: answer.briefName,
            pages: answer.pages,
            arguments: answer.arguments,
            debate: answer.debate,
            verificationNumber: results.verificationNumber,
            numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
            description: answer.description,
        })
    }
    var d = new Date();
var month = d.getMonth()+1
var year = d.getFullYear()
var day = d.getDate()
var date = month + "/" + day + "/" + year
    await mongoBrief.insertOne({name: req.session.name, arguments: answer.arguments, briefName: answer.briefName, email: req.session.email, pageLength: answer.pages, nameToLowerCase: req.session.name.toLowerCase().replace(" ", ""), type: "offering", debate: answer.debate, date: date, rating: null, description: answer.description})
    return res.render("addABriefOffer",{
        auth: req.session.email,
        authName: req.session.name,
        maxOfferingsMet: false,
        completed: true,
        verificationNumber: results.verificationNumber,numberOfNotifications: notificationsFromMongo.notifications.length,
        notificationsArray: notificationsFromMongo.notifications,

    })

}catch(err){
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }
    res.status(500).render('500', {
        auth: req.session.email,
        authName: req.session.name,
        numberOfNotifications: notificationsFromMongo.notifications.length,
        notificationsArray: notificationsFromMongo.notifications,
    });    
}
})


router.post("/addABriefRequest",  verifyEmail("Add a Brief Request","add a brief request"),isAuth, markAsRead, async (req, res)=>{
    try{
        if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }
    answer = req.body
    results = await mongoBrief.count({type: "request", nameToLowerCase: req.session.name.toLowerCase().replace(" ", "")})
    if (results > 14){
        return res.render("addABriefRequest",{
            auth: req.session.email,
            authName: req.session.name,
            maxRequestsMet: true,
            completed: false,
            briefName: answer.briefName,
            pages: answer.pages,
            arguments: answer.arguments,
            debate: answer.debate,numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
        })
    }
    var d = new Date();
var month = d.getMonth()+1
var year = d.getFullYear()
var day = d.getDate()
var date = month + "/" + day + "/" + year
    await mongoBrief.insertOne({name: req.session.name, arguments: answer.arguments, briefName: answer.briefName, email: req.session.email, pageLength: answer.pages, nameToLowerCase: req.session.name.toLowerCase().replace(" ", ""), type: "request", debate: answer.debate, date: date})
    return res.render("addABriefRequest",{
        auth: req.session.email,
        authName: req.session.name,
        maxRequestsMet: false,
        completed: true, numberOfNotifications: notificationsFromMongo.notifications.length,
        notificationsArray: notificationsFromMongo.notifications,

    })

}catch(err){
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }
    res.status(500).render('500', {
        auth: req.session.email,
        authName: req.session.name,
        numberOfNotifications: notificationsFromMongo.notifications.length,
        notificationsArray: notificationsFromMongo.notifications,
    });    
}
})




router.post("/deleteAccount", isAuth, markAsRead, async (req,res)=>{
    try{
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }

    var results = await mongoAccounts.findOne({email: req.session.email})
    var briefsLength = await mongoBrief.count()
    var briefsContent = await mongoBrief.find().toArray()
    if(await bcrypt.compare(answer.password, results.password)){
        await mongoAccounts.deleteOne({email: req.session.email, password: req.body.password})

        await mongoContact.deleteMany({to: req.session.email})
        await mongoContact.deleteMany({email: req.session.email})
        await mongoBrief.deleteMany({email: req.session.email})
        
    const emailContents = `
    <h1 style = "color:black;">Your account has been successfuly deleted.</h1>
    <h2 style = "color:black;">Thanks for using BriefExchange, sorry to see you leave so soon.</h2>
    <style>*{  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"; text-align: center;} h1{font-size: 50px;} </style>
    ` 
    recipient = req.session.email
    let transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      secure: true,
      port: 465,
      auth: {
        user: EMAIL_USERNAME,
        pass: EMAIL_PASSWORD,
      },
    });
    
    const mailOptions = {
        from: EMAIL_USERNAME, 
        to: recipient,
        subject: 'BriefExchange account deleted',
        html: emailContents,
    };
    
    transporter.sendMail(mailOptions, function(err, info) {
    if (err) {
      console.log(err)
    }
    })

        req.session.destroy(e => {
            if (e) return res.send(e);
        })
        
        return res.render("accountDeleted",{
            auth: "",
            authName: "",
            doneContacting: false,numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
        })
    }else{
        return res.render("deleteAccount",{
            auth: req.session.email,
            authName: req.session.name,
            passwordCorrect: false,numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
        })
    }

}catch(err){
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }
    res.status(500).render('500', {
        auth: req.session.email,
        authName: req.session.name,
        numberOfNotifications: notificationsFromMongo.notifications.length,
        notificationsArray: notificationsFromMongo.notifications,
    });    
}
})
router.post("/contact", verifyEmail("Contact","contact other users"),markAsRead,  isAuth, async (req,res)=>{
   try{ if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }
    var answer = req.body
var id = req.query.id
var results = await mongoBrief.findOne({_id: ObjectId(id)})

var alreadyRequested = await mongoContact.count({id: id, nameToLowerCase: req.session.name.toLowerCase().replace(" ","")})
if(alreadyRequested !=0){
    return res.render("alreadySubmitted",{
        reviewingOwn: false,
        name: results.name,
        auth: req.session.email,
            authName: req.session.name,
           numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
    })
}
var d = new Date();
var month = d.getMonth()+1
var year = d.getFullYear()
var day = d.getDate()
var date = month + "/" + day + "/" + year
    if(results.type == "request"){
        if(answer.additional){
            await mongoContact.insertOne({ status: "none", inReturn: answer.inReturn, toName: results.name, debate: "", name: req.session.name, nameToLowerCase: req.session.name.toLowerCase().replace(" ",""), email: req.session.email, date: date,id:req.query.id, description: answer.description, pageLength: answer.pages, arguments: answer.arguments, additional: answer.additional,to: results.email, status: "none", offerDebate: results.debate, offerBriefName: results.briefName})
        }else{
            await mongoContact.insertOne({name: req.session.name, nameToLowerCase: req.session.name.toLowerCase().replace(" ",""), email: req.session.email, date: date,id:req.query.id, description: answer.description, pageLength: answer.pages, arguments: answer.arguments, to: results.email, status: "none", offerDebate: results.debate, offerBriefName: results.briefName, debate: "", toName: results.name, inReturn: answer.inReturn, })
        }       
        await mongoAccounts.updateOne({email: results.email}, {$push:{notifications: req.session.name + " responded to your post requesting a brief on "+results.briefName}})
        
        return res.render("accountDeleted", {
            auth: req.session.email,
            authName: req.session.name,
            doneContacting: true,numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
        })
    }else{
        if(answer.additional){
        await mongoContact.insertOne({ status: "none",toName: results.name, to:results.email, additional: answer.additional, name: req.session.name, nameToLowerCase: req.session.name.toLowerCase().replace(" ",""), email: req.session.email, date: date,id:req.query.id, briefName: answer.briefName, description: answer.description, pageLength: answer.pages, arguments: answer.arguments, debate: answer.debate, offerDebate: results.debate, offerBriefName: results.briefName})
    }else{
        await mongoContact.insertOne({name: req.session.name, nameToLowerCase: req.session.name.toLowerCase().replace(" ",""), email: req.session.email, date: date,id:req.query.id, briefName: answer.briefName, description: answer.description, pageLength: answer.pages, arguments: answer.arguments, debate: answer.debate, offerDebate: results.debate, offerBriefName: results.briefName,to:results.email,toName: results.name, status: "none"})
         }       
        await mongoAccounts.updateOne({email: results.email}, {$push:{notifications: req.session.name + " responded to your post offering a brief on "+results.briefName}})

        return res.render("accountDeleted", {
            auth: req.session.email,
            authName: req.session.name,
            doneContacting: true,numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
        })
    }
    
}catch(err){
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }
    res.status(500).render('500', {
        auth: req.session.email,
        authName: req.session.name,
        numberOfNotifications: notificationsFromMongo.notifications.length,
        notificationsArray: notificationsFromMongo.notifications,
    });    
}
})
router.post("/deleteBrief", verifyEmail("Delete Brief","delete your briefs"),markAsRead,   isAuth,async (req,res)=>{
try{
        
        idQuery = req.query.id
    await mongoBrief.deleteOne({_id: ObjectId(idQuery)})
    await mongoContact.updateMany({id: idQuery}, {$set:{status: "OGdeleted"}})
    return res.redirect("/briefDashboard?section=yourBriefs")

}catch(err){
    console.log(err)
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }
    res.status(500).render('500', {
        auth: req.session.email,
        authName: req.session.name,
        numberOfNotifications: notificationsFromMongo.notifications.length,
        notificationsArray: notificationsFromMongo.notifications,
    });    
}
})

router.post("/deletePracticeRoundRequest", verifyEmail("Delete Practice Round Request","delete your practice round requests"),markAsRead,   isAuth,async (req,res)=>{

        try{
        idQuery = req.query.id
    await mongoPracticeRoundRequests.deleteOne({_id: ObjectId(idQuery)})
    await mongoContactPR.updateMany({id: idQuery}, {$set:{status: "OGdeleted"}})

    return res.redirect("/practiceRoundDashboard?section=yourPracticeRounds")

}catch(err){
    console.log(err)
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }
    res.status(500).render('500', {
        auth: req.session.email,
        authName: req.session.name,
        numberOfNotifications: notificationsFromMongo.notifications.length,
        notificationsArray: notificationsFromMongo.notifications,
    });    
}
})

router.post("/deletePracticeRoundResponse", verifyEmail("Delete Practice Round Response","delete your practice round responses"),markAsRead,   isAuth,async (req,res)=>{
try{
        
    idQuery = req.query.id
await mongoContactPR.updateOne({_id: ObjectId(idQuery)}, {$set:{status: "deleted"}})

return res.redirect("/practiceRoundDashboard?section=yourResponses")

}catch(err){
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }
    res.status(500).render('500', {
        auth: req.session.email,
        authName: req.session.name,
        numberOfNotifications: notificationsFromMongo.notifications.length,
        notificationsArray: notificationsFromMongo.notifications,
    });    
}
})

router.post("/rejectPracticeRoundRequest",  verifyEmail("Reject Request","reject a practice round request"),markAsRead, isAuth, async (req,res)=>{
   try{ var id = req.query.id
    await mongoContactPR.updateOne({_id: ObjectId(id)}, {$set: {status:"rejected"}})
    var results = await mongoContactPR.findOne({_id: ObjectId(id)})
    await mongoAccounts.updateOne({email: results.responderEmail},{$push:{notifications: results.requesterName + " has rejected your practice round request."}})
    
    
    return res.redirect("/practiceRoundDashboard?section=yourPracticeRounds")
}catch(err){
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }
    res.status(500).render('500', {
        auth: req.session.email,
        authName: req.session.name,
        numberOfNotifications: notificationsFromMongo.notifications.length,
        notificationsArray: notificationsFromMongo.notifications,
    });    
}
})
  

router.post("/reject",  verifyEmail("Reject Request","reject a brief request"),markAsRead, isAuth, async (req,res)=>{
    try{var id = req.query.id
    await mongoContact.updateOne({_id: ObjectId(id)}, {$set: {status:"rejected"}})
    var results = await mongoContact.findOne({_id: ObjectId(id)})
    if (results.inReturn){
        await mongoAccounts.updateOne({email: results.email},{$push:{notifications: results.toName + " has rejected your offer for a brief on " + results.offerBriefName}})
    }else{
        await mongoAccounts.updateOne({email: results.email},{$push:{notifications: results.toName + " has rejected your request to trade for a brief on " + results.briefName}})
    }
    
    return res.redirect("/briefDashboard?section=yourBriefs")

}catch(err){
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }
    res.status(500).render('500', {
        auth: req.session.email,
        authName: req.session.name,
        numberOfNotifications: notificationsFromMongo.notifications.length,
        notificationsArray: notificationsFromMongo.notifications,
    });    
}
})
  
router.post("/agreePracticeRound",  verifyEmail("Agree","agree to a practice round request"),markAsRead, isAuth, async (req,res)=>{
    try{var id = req.query.id
    var answer = req.body
    await mongoContactPR.updateOne({_id: ObjectId(id)}, {$set: {status:"agree", firstInfo: answer.info}})
    var results = await mongoContactPR.findOne({_id: ObjectId(id)})

    await mongoAccounts.updateOne({email: results.requesterEmail}, {$push:{notifications: req.session.name + " has agreed to debate you and has uploaded their contact information."}})
    return res.redirect("/practiceRoundDashboard?section=yourPracticeRounds")

}catch(err){
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }
    res.status(500).render('500', {
        auth: req.session.email,
        authName: req.session.name,
        numberOfNotifications: notificationsFromMongo.notifications.length,
        notificationsArray: notificationsFromMongo.notifications,
    });    
}
})

router.post("/agree",  verifyEmail("Agree","agree to a brief request"),markAsRead, isAuth, async (req,res)=>{
    try{var id = req.query.id
    var answer = req.body
    await mongoContact.updateOne({_id: ObjectId(id)}, {$set: {status:"agree", firstLink: answer.link}})
    var results = await mongoContact.findOne({_id: ObjectId(id)})

    if(results.inReturn){
        await mongoAccounts.updateOne({email: results.email}, {$push:{notifications: req.session.name + " has agreed to your offer for a brief on "+results.inReturn}})
    }else{
        await mongoAccounts.updateOne({email: results.email}, {$push:{notifications: req.session.name + " has agreed to your request for a brief on "+results.offerBriefName}})
    }
    return res.redirect("/briefDashboard?section=yourBriefs")

}catch(err){
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }
    res.status(500).render('500', {
        auth: req.session.email,
        authName: req.session.name,
        numberOfNotifications: notificationsFromMongo.notifications.length,
        notificationsArray: notificationsFromMongo.notifications,
    });    
}
})
router.post("/response",  verifyEmail("Respond","respond to a brief request"),isAuth, async (req,res)=>{
    try{var id = req.query.id
    var answer = req.body
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }
    var validToSend = await mongoContact.count({_id: ObjectId(id),status:"bothSidesSent"})
    if(validToSend == 0){
        await mongoContact.updateOne({_id: ObjectId(id)}, {$set: {status:"bothSidesSent", secondLink: answer.link}})
        var results = await mongoContact.findOne({_id: ObjectId(id)})
    try{if(results.inReturn){
        await mongoBriefsReceived.insertOne({from: results.name, fromToLowerCase: results.nameToLowerCase, fromEmail: results.email, date: results.date, to: results.toName, toEmail: results.to, firstLink: results.firstLink, secondLink: results.secondLink, type: "request", firstBriefName: results.offerBriefName, firstBriefDebate: results.offerDebate, secondBriefName: results.briefName, secondBriefDescription: results.description, secondBriefPages: results.pageLength, secondBriefArguments:results.arguments, inReturn: results.inReturn, firstBriefDebate: results.debate,reviewed: false, id: results.id})
        await mongoAccounts.updateOne({nameToLowerCase: results.toName.toLowerCase().replace(" ","")},{$push:{notifications: results.name + " has uploaded their brief on " + results.offerBriefName}})
    }else{
        await mongoBriefsReceived.insertOne({from: results.name, fromToLowerCase: results.nameToLowerCase, fromEmail: results.email, date: results.date, to: results.toName, toEmail: results.to, firstLink: results.firstLink, secondLink: results.secondLink, type: "offering", firstBriefName: results.offerBriefName, firstBriefDebate: results.offerDebate, secondBriefName: results.briefName, secondBriefDescription: results.description, secondBriefPages: results.pageLength, secondBriefArguments:results.arguments, secondBriefDebate: results.debate, firstBriefDebate: results.debate,id: results.id,reviewed: false})
        await mongoAccounts.updateOne({nameToLowerCase: results.toName.toLowerCase().replace(" ","")},{$push:{notifications: results.name + " has uploaded their brief on " + results.briefName}})
    }}catch(err){await mongoAccounts.updateOne({nameToLowerCase: results.toName.toLowerCase().replace(" ","")},{$push:{notifications: results.name + " has uploaded their brief on " + results.briefName}})}
    

    section = req.query.section
    
    
        
    var senderRequestToName = []
    var senderRequestFrom = []
    var senderRequestFromEmail = []
    var senderRequestId = []
    var senderRequestBriefName = []
    var senderRequestDescription = []
    var senderRequestPages = []
    var senderRequestArguments = []
    var senderRequestDebate = []
    var senderRequestAdditional = []
    var senderRequestActualId = []
    var senderRequestStatus = []
    var senderRequestDate = []
    var senderRequestTo = []
    var senderRequestOfferDebate = []
    var senderRequestOfferBriefName = []
    var senderRequestInReturn = []
    var senderRequestFirstLink = []
    var senderRequestSecondLink = []
    var results7 =  await mongoContact.find({ email: req.session.email}).toArray()
    var senderRequestAmount =  await mongoContact.count({ email: req.session.email})
    for(let i = 0; i<senderRequestAmount; i++){
        senderRequestFrom.push(results7[senderRequestAmount-i-1].name)
        senderRequestId.push(results7[senderRequestAmount-i-1].id)
        senderRequestBriefName.push(results7[senderRequestAmount-i-1].briefName)
        senderRequestDescription.push(results7[senderRequestAmount-i-1].description)
        senderRequestPages.push(results7[senderRequestAmount-i-1].pageLength)
        senderRequestArguments.push(results7[senderRequestAmount-i-1].arguments)
        senderRequestDebate.push(results7[senderRequestAmount-i-1].debate.toUpperCase())
        senderRequestActualId.push(results7[senderRequestAmount-i-1]._id)
        senderRequestAdditional.push(results7[senderRequestAmount-i-1].additional)
        senderRequestDate.push(results7[senderRequestAmount-i-1].date)
        senderRequestFromEmail.push(results7[senderRequestAmount-i-1].email)
        senderRequestStatus.push(results7[senderRequestAmount-i-1].status)
        senderRequestTo.push(results7[senderRequestAmount-i-1].to)
        senderRequestToName.push(results7[senderRequestAmount-i-1].toName)
        senderRequestOfferDebate.push(results7[senderRequestAmount-i-1].offerDebate.toUpperCase())
        senderRequestOfferBriefName.push(results7[senderRequestAmount-i-1].offerBriefName)
        senderRequestInReturn.push(results7[senderRequestAmount-i-1].inReturn)
        senderRequestFirstLink.push(results7[senderRequestAmount-i-1].firstLink)
        senderRequestSecondLink.push(results7[senderRequestAmount-i-1].secondLink)
    }    
    return res.render("dashboardOutgoingRequests",{            alreadySent: false,    
    
            senderRequestAmount: senderRequestAmount,
            senderRequestFrom: senderRequestFrom,
            senderRequestId: senderRequestId,
            senderRequestActualId: senderRequestActualId,
            senderRequestBriefName:senderRequestBriefName,
            senderRequestDescription:senderRequestDescription,
            senderRequestPages:senderRequestPages,
            senderRequestArguments:senderRequestArguments,
            senderRequestDebate:senderRequestDebate,
            senderRequestAdditional:senderRequestAdditional,
            senderRequestStatus: senderRequestStatus,
            senderRequestDate:senderRequestDate,
            senderRequestFromEmail:senderRequestFromEmail,
            senderRequestTo:senderRequestTo,
            senderRequestOfferBriefName:senderRequestOfferBriefName,
            senderRequestOfferDebate:senderRequestOfferDebate, 
            senderRequestToName:senderRequestToName,
            senderRequestInReturn:senderRequestInReturn,
            senderRequestFirstLink:senderRequestFirstLink,
            senderRequestSecondLink:senderRequestSecondLink,
            auth: req.session.email,
            authName: req.session.name, numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
        })
         }else{ var results = await mongoContact.findOne({_id: ObjectId(id)})

         section = req.query.section
         
         
             
         var senderRequestToName = []
         var senderRequestFrom = []
         var senderRequestFromEmail = []
         var senderRequestId = []
         var senderRequestBriefName = []
         var senderRequestDescription = []
         var senderRequestPages = []
         var senderRequestArguments = []
         var senderRequestDebate = []
         var senderRequestAdditional = []
         var senderRequestActualId = []
         var senderRequestStatus = []
         var senderRequestDate = []
         var senderRequestTo = []
         var senderRequestOfferDebate = []
         var senderRequestOfferBriefName = []
         var senderRequestInReturn = []
         var senderRequestFirstLink = []
         var senderRequestSecondLink = []
         var results7 =  await mongoContact.find({ email: req.session.email}).toArray()
         var senderRequestAmount =  await mongoContact.count({ email: req.session.email})
         for(let i = 0; i<senderRequestAmount; i++){
             senderRequestFrom.push(results7[senderRequestAmount-i-1].name)
             senderRequestId.push(results7[senderRequestAmount-i-1].id)
             senderRequestBriefName.push(results7[senderRequestAmount-i-1].briefName)
             senderRequestDescription.push(results7[senderRequestAmount-i-1].description)
             senderRequestPages.push(results7[senderRequestAmount-i-1].pageLength)
             senderRequestArguments.push(results7[senderRequestAmount-i-1].arguments)
             senderRequestDebate.push(results7[senderRequestAmount-i-1].debate.toUpperCase())
             senderRequestActualId.push(results7[senderRequestAmount-i-1]._id)
             senderRequestAdditional.push(results7[senderRequestAmount-i-1].additional)
             senderRequestDate.push(results7[senderRequestAmount-i-1].date)
             senderRequestFromEmail.push(results7[senderRequestAmount-i-1].email)
             senderRequestStatus.push(results7[senderRequestAmount-i-1].status)
             senderRequestTo.push(results7[senderRequestAmount-i-1].to)
             senderRequestToName.push(results7[senderRequestAmount-i-1].toName)
             senderRequestOfferDebate.push(results7[senderRequestAmount-i-1].offerDebate.toUpperCase())
             senderRequestOfferBriefName.push(results7[senderRequestAmount-i-1].offerBriefName)
             senderRequestInReturn.push(results7[senderRequestAmount-i-1].inReturn)
             senderRequestFirstLink.push(results7[senderRequestAmount-i-1].firstLink)
             senderRequestSecondLink.push(results7[senderRequestAmount-i-1].secondLink)
         }    
         return res.render("dashboardOutgoingRequests",{            alreadySent: false,    
         
                 senderRequestAmount: senderRequestAmount,
                 senderRequestFrom: senderRequestFrom,
                 senderRequestId: senderRequestId,
                 senderRequestActualId: senderRequestActualId,
                 senderRequestBriefName:senderRequestBriefName,
                 senderRequestDescription:senderRequestDescription,
                 senderRequestPages:senderRequestPages,
                 senderRequestArguments:senderRequestArguments,
                 senderRequestDebate:senderRequestDebate,
                 senderRequestAdditional:senderRequestAdditional,
                 senderRequestStatus: senderRequestStatus,
                 senderRequestDate:senderRequestDate,
                 senderRequestFromEmail:senderRequestFromEmail,
                 senderRequestTo:senderRequestTo,
                 senderRequestOfferBriefName:senderRequestOfferBriefName,
                 senderRequestOfferDebate:senderRequestOfferDebate, 
                 senderRequestToName:senderRequestToName,
                 senderRequestInReturn:senderRequestInReturn,
                 senderRequestFirstLink:senderRequestFirstLink,
                 senderRequestSecondLink:senderRequestSecondLink,
                 auth: req.session.email,
                 authName: req.session.name, numberOfNotifications: notificationsFromMongo.notifications.length,
                 notificationsArray: notificationsFromMongo.notifications,
             })
            
         }

    }catch(err){
        if(req.session.email){
            var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
        }else{
            var notificationsFromMongo = {
                "notifications":[]
                }
        }
        res.status(500).render('500', {
            auth: req.session.email,
            authName: req.session.name,
            numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
        });    
    }
     })

router.post("/deleteContact", verifyEmail("Delete a Request","delete a request"), isAuth, markAsRead, async (req,res)=>{
    try{
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }
    var id = req.query.id
    await mongoContact.updateOne({_id: ObjectId(id)}, {$set: {status:"deleted"}})
    
    var senderRequestToName = []
    var senderRequestFrom = []
    var senderRequestFromEmail = []
    var senderRequestId = []
    var senderRequestBriefName = []
    var senderRequestDescription = []
    var senderRequestPages = []
    var senderRequestArguments = []
    var senderRequestDebate = []
    var senderRequestAdditional = []
    var senderRequestActualId = []
    var senderRequestStatus = []
    var senderRequestDate = []
    var senderRequestTo = []
    var senderRequestOfferDebate = []
    var senderRequestOfferBriefName = []
    var senderRequestInReturn = []
    var senderRequestFirstLink = []
    var senderRequestSecondLink = []
    var results7 =  await mongoContact.find({ email: req.session.email}).toArray()
    var senderRequestAmount =  await mongoContact.count({ email: req.session.email})
    for(let i = 0; i<senderRequestAmount; i++){
        senderRequestFrom.push(results7[senderRequestAmount-i-1].name)
        senderRequestId.push(results7[senderRequestAmount-i-1].id)
        senderRequestBriefName.push(results7[senderRequestAmount-i-1].briefName)
        senderRequestDescription.push(results7[senderRequestAmount-i-1].description)
        senderRequestPages.push(results7[senderRequestAmount-i-1].pageLength)
        senderRequestArguments.push(results7[senderRequestAmount-i-1].arguments)
        senderRequestDebate.push(results7[senderRequestAmount-i-1].debate.toUpperCase())
        senderRequestActualId.push(results7[senderRequestAmount-i-1]._id)
        senderRequestAdditional.push(results7[senderRequestAmount-i-1].additional)
        senderRequestDate.push(results7[senderRequestAmount-i-1].date)
        senderRequestFromEmail.push(results7[senderRequestAmount-i-1].email)
        senderRequestStatus.push(results7[senderRequestAmount-i-1].status)
        senderRequestTo.push(results7[senderRequestAmount-i-1].to)
        senderRequestToName.push(results7[senderRequestAmount-i-1].toName)
        senderRequestOfferDebate.push(results7[senderRequestAmount-i-1].offerDebate.toUpperCase())
        senderRequestOfferBriefName.push(results7[senderRequestAmount-i-1].offerBriefName)
        senderRequestInReturn.push(results7[senderRequestAmount-i-1].inReturn)
        senderRequestFirstLink.push(results7[senderRequestAmount-i-1].firstLink)
        senderRequestSecondLink.push(results7[senderRequestAmount-i-1].secondLink)
    }    
    return res.render("dashboardOutgoingRequests",{            alreadySent: false,    

            senderRequestAmount: senderRequestAmount,
            senderRequestFrom: senderRequestFrom,
            senderRequestId: senderRequestId,
            senderRequestActualId: senderRequestActualId,
            senderRequestBriefName:senderRequestBriefName,
            senderRequestDescription:senderRequestDescription,
            senderRequestPages:senderRequestPages,
            senderRequestArguments:senderRequestArguments,
            senderRequestDebate:senderRequestDebate,
            senderRequestAdditional:senderRequestAdditional,
            senderRequestStatus: senderRequestStatus,
            senderRequestDate:senderRequestDate,
            senderRequestFromEmail:senderRequestFromEmail,
            senderRequestTo:senderRequestTo,
            senderRequestOfferBriefName:senderRequestOfferBriefName,
            senderRequestOfferDebate:senderRequestOfferDebate, 
            senderRequestToName:senderRequestToName,
            senderRequestInReturn:senderRequestInReturn,
            senderRequestFirstLink:senderRequestFirstLink,
            senderRequestSecondLink:senderRequestSecondLink,
            auth: req.session.email, numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
            authName: req.session.name,})

        }catch(err){
            if(req.session.email){
                var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
            }else{
                var notificationsFromMongo = {
                    "notifications":[]
                    }
            }
            res.status(500).render('500', {
                auth: req.session.email,
                authName: req.session.name,
                numberOfNotifications: notificationsFromMongo.notifications.length,
                notificationsArray: notificationsFromMongo.notifications,
            });    
        }
        })

router.post("/forgotPassword",verifyEmail("Reset Password", "reset your password"), markAsRead, async (req,res)=>{
    try{if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }
    var email = req.body.email
    var valid = await mongoAccounts.count({email: email})
    var spamming
    if(valid > 0){
        var results = await mongoAccounts.findOne({email: email})
        if(results.uuid){
            const date1 = results.lastRequest

            const currentDate = moment()
var difference = currentDate.diff(date1)
if(difference<43200000){
    difference = 43200000-difference
    difference = difference/3600000
    var hours = Math.ceil(difference)
    return res.render("forgotPassword",{
        auth: req.session.email,
        authName: req.session.name,
        existingEmail: true,
        spamming: true,
        successful: false,
        email: email,
hours: hours, numberOfNotifications: notificationsFromMongo.notifications.length,
notificationsArray: notificationsFromMongo.notifications,
    })
}
        }
    }else{
        return res.render("forgotPassword",{
            auth: req.session.email,
            authName: req.session.name,
            existingEmail: false,
            spamming: false,
            successful: false,
            email: email, numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,

        })
        
    }
var recipient = email
var uuid = crypto.randomUUID()
const d = moment()
await mongoAccounts.updateOne({email: email}, {$set: {uuid: uuid, lastRequest: d}})

    const emailContents = `
    <h2 style = "color:black;">Please click <a href="https://stoaexchange.joshuaren.repl.co/passwordReset?uuid=` + uuid +`" target = "_blank" style = "color: black;">here</a> to reset your password. If you didn't request a password reset, please disregard this email.</h2>
    <style>*{  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"; text-align: center;} h1{font-size: 50px;} </style>
    ` 
    let transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      secure: true,
      port: 465,
      auth: {
        user: EMAIL_USERNAME,
        pass: EMAIL_PASSWORD,
      },
    });
    
    const mailOptions = {
        from: EMAIL_USERNAME, 
        to: recipient,
        subject: 'BriefExchange password reset',
        html: emailContents,
    };
    
    transporter.sendMail(mailOptions, function(err, info) {
    if (err) {
      console.log(err)
    }
    })
    
    return res.render("forgotPassword",{
        auth: req.session.email,
        authName: req.session.name,
        existingEmail: true,
        spamming: false,
        successful: true,
        email: email, numberOfNotifications: notificationsFromMongo.notifications.length,
        notificationsArray: notificationsFromMongo.notifications,

    })

}catch(err){
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }
    res.status(500).render('500', {
        auth: req.session.email,
        authName: req.session.name,
        numberOfNotifications: notificationsFromMongo.notifications.length,
        notificationsArray: notificationsFromMongo.notifications,
    });    
}
})

router.post("/passwordReset",verifyEmail("Reset Password", "reset your password"), markAsRead, async (req,res)=>{
    try{if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }var uuid = req.query.uuid
    var answer = req.body

    var results = await mongoAccounts.count({uuid: uuid, email: answer.email.toLowerCase()})
    if (results <1) {
        return res.render("passwordReset",{
            auth: req.session.email,
            authName: req.session.name,
            email: answer.email,
            newPassword: answer.newPassword,
            confirmNewPassword: answer.confirmNewPassword,
            hoursPassed: false,
            valid: true,
            uuid: uuid,
            validEmail: false,numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
    
        })
    }
    if(answer.newPassword != answer.confirmNewPassword){
        return res.render("passwordReset",{
            auth: req.session.email,
            authName: req.session.name,
            email: answer.email,
            newPassword: answer.newPassword,
            confirmNewPassword: answer.confirmNewPassword,
            hoursPassed: false,
            valid: true,
            uuid: uuid,
            validEmail: true,
            passwordsEqual: false,numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
    
        })    }
       

        await mongoAccounts.updateOne({uuid: uuid, email: answer.email.toLowerCase()},{$set:{password: answer.newPassword}})
var recipient = answer.email
        const emailContents = `
        <h1 style = "color:black;">The password for your BriefExchange account was just changed.</h1>
        <h2 style = "color:black;">If that wasn't you, please email us at <a href = "mailto:ContactBriefExchange@gmail.com" target="_blank">ContactBriefExchange@gmail.com</a>.</h2>
        <style>*{  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"; text-align: center;} h1{font-size: 50px;} </style>
        ` 
        let transporter = nodemailer.createTransport({
          host: 'smtp.zoho.com',
          secure: true,
          port: 465,
          auth: {
            user: EMAIL_USERNAME,
            pass: EMAIL_PASSWORD,
          },
        });
        
        const mailOptions = {
            from: EMAIL_USERNAME, 
            to: recipient,
            subject: 'BriefExchange password change',
            html: emailContents,
        };
        
        transporter.sendMail(mailOptions, function(err, info) {
        if (err) {
          console.log(err)
        }
        })
        
        return res.render("passwordReset",{
            auth: req.session.email,
            authName: req.session.name,
            email: answer.email,
            newPassword: answer.newPassword,
            confirmNewPassword: answer.confirmNewPassword,
            hoursPassed: false,
            valid: true,
            uuid: uuid,
            validEmail: true,
            passwordsEqual: true,
            success: true, numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
    
        })
    }catch(err){
        if(req.session.email){
            var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
        }else{
            var notificationsFromMongo = {
                "notifications":[]
                }
        }
        res.status(500).render('500', {
            auth: req.session.email,
            authName: req.session.name,
            numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
        });    
    }
})

router.post("/rateABrief",isAuth, markAsRead, async (req,res)=>{
    try{id = req.query.id
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }
    var temp = await mongoBrief.findOne({_id: ObjectId(id)})

var name = temp.name
var briefName = temp.briefName
    var results = await mongoContact.findOne({id: id, email: req.session.email})
   if(!req.body.checkmark){
        return res.render("rateABrief",{
            auth: req.session.email,
            authName: req.session.name,
            checked: false,
            id: id,
            name: name,
            briefName: briefName,
            rating: req.body.rating,
            checkboxChecked: req.body.checkmark, numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
    
        })
   }
   try{
    if(!results.secondLink || !results.firstLink){
        
        return res.render("rateABrief",{
            auth: req.session.email,
            authName: req.session.name,
            checked: true,
            briefReceived: false,
            id: id,name: name,
            briefName: briefName, rating: req.body.rating,
            checkboxChecked: req.body.checkmark, numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
        })
    }}catch(err){  return res.render("rateABrief",{
        auth: req.session.email,
        authName: req.session.name,
        checked: true,
        briefReceived: false,
        id: id,name: name,
        briefName: briefName, rating: req.body.rating,
        checkboxChecked: req.body.checkmark, numberOfNotifications: notificationsFromMongo.notifications.length,
        notificationsArray: notificationsFromMongo.notifications,
    })}

    var valid = await mongoRatings.count({id: id, email: req.session.email})
    if(valid>0){
        return res.render("rateABrief",{
            auth: req.session.email,
            authName: req.session.name,
            briefReceived: true,
            alreadyReviewed: true,            checked: true,id: id,name: name,
            briefName: briefName,
            rating: req.body.rating,
            checkboxChecked: req.body.checkmark, numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
        })    }
        await mongoRatings.insertOne({id: id, email:req.session.email, rating: req.body.rating})
        var ratings = await mongoRatings.find({id: id}).toArray()
        await mongoAccounts.updateOne({nameToLowerCase: name.toLowerCase().replace(" ","")},{$push:{notifications: "A user has rated your brief on " + briefName + " " + req.body.rating + "/10"}})
        await mongoBriefsReceived.updateOne({id: id, to: req.session.name},{$set:{reviewed: true}})
        var totalRating = 0
        for(let i = 0; i<ratings.length;i++){
            totalRating = totalRating+ratings[i].rating*1
        }
        totalRating = totalRating/ratings.length
        await mongoBrief.updateOne({_id: ObjectId(id)},{$set:{rating: totalRating}})
    
        return res.render("rateABrief",{
            auth: req.session.email,
            authName: req.session.name,
            briefReceived: true,
            alreadyReviewed: false,
            successful: true,            checked: true,id: id,name: name,
            briefName: briefName,
            rating: req.body.rating,
            checkboxChecked: req.body.checkmark, numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
        })      
    
    }catch(err){
        if(req.session.email){
            var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
        }else{
            var notificationsFromMongo = {
                "notifications":[]
                }
        }
        res.status(500).render('500', {
            auth: req.session.email,
            authName: req.session.name,
            numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
        });    
    }
})



router.post("/requestAPracticeRound", isAuth, async(req,res)=>{
    try{if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }
answer = req.body
    results = await mongoPracticeRoundRequests.count({nameToLowerCase: req.session.name.toLowerCase().replace(" ", ""), debate: answer.debate})
    if (results > 0){
        return res.render("requestAPracticeRound",{
            auth: req.session.email,
            authName: req.session.name,
            maxOfferingsMet: true,
            completed: false,
            debate: answer.debate,
            availability: answer.availability,
            additional: answer.additional,
            numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
            skype: answer.skype,
            discord: answer.discord,
            googleMeet: answer.googleMeet,
            faceTime: answer.faceTime,
            zoom: answer.zoom,
            noAnswer: false,
        })
    }
    var d = new Date();
var month = d.getMonth()+1
var year = d.getFullYear()
var day = d.getDate()
var date = month + "/" + day + "/" + year
if(answer.zoom)    {
    var zoomTF = true;
}else{
    var zoomTF = false;
}if(answer.discord)    {
    var discordTF = true;
}else{
    var discordTF = false;
}
if(answer.skype)    {
    var skypeTF = true;
}else{
    var skypeTF = false;
}
if(answer.googleMeet)    {
    var googleMeetTF = true;
}else{
    var googleMeetTF = false;
}
if(answer.faceTime)    {
    var faceTimeTF = true;
}else{
    var faceTimeTF = false;
}

if(!faceTimeTF && !discordTF &&!zoomTF &&!googleMeetTF &&!skypeTF){
    return res.render("requestAPracticeRound",{
        auth: req.session.email,
        authName: req.session.name,
        maxOfferingsMet: false,
        completed: false,
        verificationNumber: results.verificationNumber,numberOfNotifications: notificationsFromMongo.notifications.length,
        notificationsArray: notificationsFromMongo.notifications,
        noAnswer: true,
        debate: answer.debate,
        availability: answer.availability,
        additional: answer.additional,
        skype: answer.skype,
        discord: answer.discord,
        googleMeet: answer.googleMeet,
        faceTime: answer.faceTime,
        zoom: answer.zoom,
    })    
}
await mongoPracticeRoundRequests.insertOne({name: req.session.name, email: req.session.email, nameToLowerCase: req.session.name.toLowerCase().replace(" ", ""), debate: answer.debate, date: date, additional: answer.additional, availability: answer.availability, faceTime: faceTimeTF, discord: discordTF, zoom: zoomTF, googleMeet: googleMeetTF, skype: skypeTF })
    return res.render("requestAPracticeRound",{
        auth: req.session.email,
        authName: req.session.name,
        maxOfferingsMet: false,
        completed: true,
        verificationNumber: results.verificationNumber,numberOfNotifications: notificationsFromMongo.notifications.length,
        notificationsArray: notificationsFromMongo.notifications,
        noAnswer: false,
    })    
}catch(err){
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }
    res.status(500).render('500', {
        auth: req.session.email,
        authName: req.session.name,
        numberOfNotifications: notificationsFromMongo.notifications.length,
        notificationsArray: notificationsFromMongo.notifications,
    });    
}

})


router.post("/contactPracticeRound", isAuth, async(req,res)=>{
    try{if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
        }
    }
    id = req.query.id
answer = req.body
    results = await mongoContactPR.count({id: id})
    results2 = await mongoPracticeRoundRequests.findOne({_id: ObjectId(id)})
    if(!results2.skype){
        var skype = false;
    }else{
        if(answer.skype){
            var skype = "checked";
        }else{
            var skype = "unchecked";
        }
    }
    if(!results2.discord){
        var discord = false;
    }else{
        if(answer.discord){
            var discord = "checked";
        }else{
            var discord = "unchecked";
        }
    }
    if(!results2.googleMeet){
        var googleMeet = false;
    }else{
        if(answer.googleMeet){
            var googleMeet = "checked";
        }else{
            var googleMeet = "unchecked";
        }
    }
    if(!results2.faceTime){
        var faceTime = false;
    }else{
        if(answer.faceTime){
            var faceTime = "checked";
        }else{
            var faceTime = "unchecked";
        }
    }
    if(!results2.zoom){
        var zoom = false;
    }else{
        if(answer.zoom){
            var zoom = "checked";
        }else{
            var zoom = "unchecked";
        }
    }

    if (results > 0){

        return res.render("contactPracticeRound",{
            auth: req.session.email,
            authName: req.session.name,
            maxOfferingsMet: true,
            completed: false,           
            availability: answer.availability,
            additional: answer.additional,
            numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,          
            skype: skype,
            discord: discord,
            googleMeet: googleMeet,
            faceTime: faceTime,
            zoom: zoom,
            noAnswer: false,
            name: results2.name,
        })
    }
    var d = new Date();
var month = d.getMonth()+1
var year = d.getFullYear()
var day = d.getDate()
var date = month + "/" + day + "/" + year

if(answer.zoom){
    zoom = true;
}
if(answer.faceTime){
    faceTime = true;
}
if(answer.googleMeet){
    googleMeet = true;
}
if(answer.skype){
    skype = true;
}
if(answer.discord){
    discord = true;
}
if((faceTime == "unchecked" || !faceTime)&&(discord == "unchecked" || !discord)&&(googleMeet == "unchecked" || !googleMeet)&&(zoom == "unchecked" || !zoom)&&(skype == "unchecked" || !skype)){
    return res.render("contactPracticeRound",{
        auth: req.session.email,
        authName: req.session.name,
        maxOfferingsMet: false,
        completed: false,
        verificationNumber: results.verificationNumber,numberOfNotifications: notificationsFromMongo.notifications.length,
        notificationsArray: notificationsFromMongo.notifications,
        noAnswer: true,
        debate: answer.debate,
        availability: answer.availability,
        additional: answer.additional,
        skype: faceTime,
        discord: discord,
        googleMeet: googleMeet,
        faceTime: faceTime,
        zoom: zoom,
        name: results2.name,
        
    })    
}
if(results2.debate == "parli"){
    var debateFormat = "Parliamentary Debate"
}else if(results2.debate == "ld"){
    var debateFormat = "Lincoln Douglas Debate"
}else{
    var debateFormat = "Team Policy Debate"
}
await mongoContactPR.insertOne({id: id, requesterName: results2.name,requesterEmail: results2.email,requesterNameToLowerCase: results2.nameToLowerCase,responderName: req.session.name, responderEmail: req.session.email, responderNameToLowerCase: req.session.name.toLowerCase().replace(" ", ""), debate: results2.debate, date: date, additional1: results2.additional, additional2: answer.additional, availability1: results2.availability, availability2: answer.availability,faceTime: faceTime, discord: discord, zoom: zoom, googleMeet: googleMeet, skype: skype, status: "none" , faceTimeOG: faceTime, discordOG: discord, zoomOG: zoom, googleMeetOG: googleMeet, skypeOG: skype, })
await mongoAccounts.updateOne({email: results2.email}, {$push:{notifications: req.session.name + " responded to your post requesting a " +debateFormat + " practice round."}})

    return res.render("contactPracticeRound",{
        auth: req.session.email,
        authName: req.session.name,
        maxOfferingsMet: false,
        completed: true,
        verificationNumber: results.verificationNumber,numberOfNotifications: notificationsFromMongo.notifications.length,
        notificationsArray: notificationsFromMongo.notifications,
        noAnswer: false,
        name: results2.name,
        skype: skype,
        discord: discord,
        googleMeet: googleMeet,
        faceTime: faceTime,
        zoom: zoom,
    })    
}catch(err){
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }
    res.status(500).render('500', {
        auth: req.session.email,
        authName: req.session.name,
        numberOfNotifications: notificationsFromMongo.notifications.length,
        notificationsArray: notificationsFromMongo.notifications,
    });    
}

})
router.post("/markAsRead", isAuth, async (req,res)=>{
    try{var results = await mongoAccounts.findOne({email: req.session.email})
    await mongoAccounts.updateOne({email: req.session.email},{ $pullAll: { notifications: results.notifications}})    

    return res.redirect(req.session.notificationRedirect || "/")
}catch(err){
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }
    res.status(500).render('500', {
        auth: req.session.email,
        authName: req.session.name,
        numberOfNotifications: notificationsFromMongo.notifications.length,
        notificationsArray: notificationsFromMongo.notifications,
    });    
}
})


router.use(async (req, res, next) => {
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }
    res.status(404).render('404', {
        auth: req.session.email,
        authName: req.session.name,
        numberOfNotifications: notificationsFromMongo.notifications.length,
        notificationsArray: notificationsFromMongo.notifications,
    });  })

    router.use(async (err, req, res, next) => {
        if(req.session.email){
            var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
        }else{
            var notificationsFromMongo = {
                "notifications":[]
                }
        }
        console.error(err.stack)
        res.status(500).render('500', {
            auth: req.session.email,
            authName: req.session.name,
            numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
        });  
      })

module.exports = router;