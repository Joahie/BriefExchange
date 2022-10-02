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
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const moment = require('moment');
const { ObjectId } = require('mongodb');
const { MessageContextMenuCommandInteraction } = require('discord.js');
const env = require('dotenv').config()
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD
const EMAIL_USERNAME = process.env.EMAIL_USERNAME


//Middleware for cookie authentication
const isAuth = (req, res, next)=>{
    if(req.session.email){
        next()
    }else{
        req.session.nextRedirect = req.originalUrl
res.redirect('/login')    }
}
//middleware for redirecting to the same page after marking notifs as read
const markAsRead = (req,res,next)=>{
    req.session.notificationRedirect = req.originalUrl
    next()
}

function sortingMongoDB(results){
    let StringifiedResults = JSON.stringify(results)
    let ParsedResults = JSON.parse(StringifiedResults)
    return ParsedResults
}
router.get("/register", markAsRead,async (req, res)=>{
if(req.session.email){

    var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})

    res.render("register", {

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
}else{

    res.render("register", {
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
})

router.post("/register",markAsRead, async (req,res)=>{
    if(req.session.email){

        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})

    }else{
        var numberOfNotifications = null
        var notificationsArray = null
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


    var existing =  await mongoAccounts.count({email: answer.email})
    var existing2 =  await mongoAccounts.count({nameToLowerCase: answer.name.toLowerCase().replace(" ","")})
    if(existing>0){
        return res.render("register",{
            emailAvailable: false,
            nameAvailable: true,
            email: answer.email,
            name: answer.name,
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
    numberOfNotifications: notificationsFromMongo.notifications.length,
    notificationsArray: notificationsFromMongo.notifications,
        })
    }
    if(existing2>0){
        return res.render("register",{
            emailAvailable: true,
            nameAvailable: false,
            speechranksValid: true,
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
            numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
        })
    }
    if(!answer.speechranks.includes("http://speechranks.com/")){
        return res.render("register",{
            emailAvailable: true,
            nameAvailable: true,
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
            numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
        })
    }
    if(answer.password != answer.confirmPassword){
        return res.render("register",{
            emailAvailable: true,
            nameAvailable: true,
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
            numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
        })
    }
    if(!answer.termsAndConditions){
        return res.render("register",{
            emailAvailable: true,
            nameAvailable: true,
            passwordCorrect: true,
            termsAndConditionsAgreed: false,
            email: answer.email,
            name: answer.name,
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
            numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
        })
    }

var uuid = crypto.randomUUID()

    const emailContents = `
    <h1 style = "color:black;">Thanks for creating a StoaExchange account!</h1>
    <h2 style = "color:black;"> Please click <a href="http://localhost:3000/verifyEmail?uuid=` + uuid +`" target = "_blank" style = "color: black;">here</a> to complete your signup. If you didn't create an account with us, please ignore this email.</h2>
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
        subject: 'StoaExchange email verification',
        html: emailContents,
    };
    
    transporter.sendMail(mailOptions, function(err, info) {
    if (err) {
      console.log(err)
    }
    })
    await mongoAccounts.insertOne({name: answer.name, speechranks: answer.speechranks, ld: tempLD, tp: tempTP, parli: tempPARLI, nameToLowerCase: answer.name.toLowerCase().replace(" ",""), rating: null, email: answer.email, password: answer.password, verificationNumber: uuid, notifications: []})
    return res.render("emailSent",{
        auth: req.session.email,
        authName: req.session.name,
        email: recipient,

    numberOfNotifications: notificationsFromMongo.notifications.length,
    notificationsArray: notificationsFromMongo.notifications,
    })


})


router.post("/login",markAsRead,  async (req, res)=>{
    var answer = req.body
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }

    var existing =  await mongoAccounts.count({email: answer.email})
    if (existing >0){
        var results =  await mongoAccounts.findOne({ email: answer.email})
        if(results.password == answer.password){
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
})



router.get("/profiles", markAsRead,async (req, res)=>{
    

 if(req.session.email){
    var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
}else{
    var notificationsFromMongo = {
        "notifications":[]
        }
}


    try{
    

    var user = req.query.user.toLowerCase().replace(" ", "")  

    var results = await mongoAccounts.findOne({ nameToLowerCase: user})
    var results2 =  await mongoBrief.count({ type: "offering", nameToLowerCase: user})
    var results3 =  await mongoBrief.find({ type: "offering",nameToLowerCase: user}).toArray()
    var results4 =  await mongoBrief.find({ type: "request",nameToLowerCase: user}).toArray()
    var results5 =  await mongoBrief.count({ type: "request",nameToLowerCase: user})

    var date = []
    var dateR = []
    var briefName = []
    var arguments = []
    var pageLength = []
    var briefRating = []
    var idR = []
    var id = []
    var debate = []
    var briefNameR = []
    var argumentsR = []
    var pageLengthR = []
    var debateR = []
    var numberOfRatings = []

    for(let i = 0; i<results5; i++){
        briefNameR.push(results4[results5-i-1].briefName)
        argumentsR.push(results4[results5-i-1].arguments)
        pageLengthR.push(results4[results5-i-1].pageLength)
        debateR.push(results4[results5-i-1].debate.toUpperCase())
        dateR.push(results4[results5-i-1].date)
        idR.push(results4[results5-i-1]._id)

    }

    for(let i = 0; i<results2; i++){
        briefName.push(results3[results2-i-1].briefName)
        id.push(results3[results2-i-1]._id)

        arguments.push(results3[results2-i-1].arguments)
        pageLength.push(results3[results2-i-1].pageLength)
        briefRating.push(Math.floor(results3[results2-i-1].rating))
        debate.push(results3[results2-i-1].debate.toUpperCase())
        date.push(results3[results2-i-1].date)
        var temp = await mongoRatings.count({id: results3[results2-i-1]._id.toString()})
        numberOfRatings.push(temp)
        
    }

    return res.render("profile",{
        name: sortingMongoDB(results).name,
        speechranks: sortingMongoDB(results).speechranks,
        ld: sortingMongoDB(results).ld,
        tp: sortingMongoDB(results).tp,        
        parli: sortingMongoDB(results).parli,
        rating: Math.floor(sortingMongoDB(results).rating),
        numberOfBriefOfferings: results2,
        briefName: briefName,
        arguments: arguments,
        pageLength: pageLength,
        briefRating: briefRating,
        briefNameR: briefNameR,
        argumentsR: argumentsR,
        pageLengthR: pageLengthR,
        numberOfBriefRequests: results5,
        debate: debate,
        debateR: debateR,
        date: date,
        dateR: dateR,
        auth: req.session.email,        
        authName: req.session.name,   
        numberOfRatings:numberOfRatings,
        id: id,
        idR: idR,
        numberOfNotifications: notificationsFromMongo.notifications.length,
        notificationsArray: notificationsFromMongo.notifications,
     })
    }catch(err){
        console.log(err)
        return res.render("noProfiles", {
            name: req.query.user,
            auth: req.session.email,
            authName: req.session.name,
            numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
        })
    }
})

//Sample for get function that renders the homepage
router.get("/", markAsRead,async (req, res)=>{
    
function waitforme(milisec) {
    return new Promise(resolve => {
        setTimeout(() => { resolve('') }, milisec);
    })
}

    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
        return res.render("index", {
            auth: req.session.email,
            authName: req.session.name,
            numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
        })
    }else{

    return res.render("index", {
        auth: req.session.email,
        authName: req.session.name,
    })
    }
})


router.post('/logout',markAsRead,  (req,res)=>{
    req.session.destroy(e => {
        if (e) return res.send(e);
        else return res.redirect("/")
    })
})
router.get("/briefExchange", markAsRead,async (req,res)=>{
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }
    
    var results = await mongoBrief.count({debate: "tp", type: "offering"})
    var results1 = await mongoBrief.find({debate: "tp", type: "offering"}).toArray()
    var results2 = await mongoBrief.count({debate: "tp", type: "request"})
    var results3 = await mongoBrief.find({debate: "tp", type: "request"}).toArray()
    var results4 = await mongoBrief.count({debate: "ld", type: "offering"})
    var results5 = await mongoBrief.find({debate: "ld", type: "offering"}).toArray()
    var results6 = await mongoBrief.count({debate: "ld", type: "request"})
    var results7 = await mongoBrief.find({debate: "ld", type: "request"}).toArray()
    
    var nameTPO = []
    var briefNameTPO = []
    var argumentsTPO = []
    var pageLengthTPO = []
    var briefRatingTPO = []
    var dateTPO = []
    var nameToLowerCaseTPO = []
    var idTPO = []
    var numberOfRatingsTPO = []
   
    var nameTPR = []
    var briefNameTPR = []
    var argumentsTPR = []
    var pageLengthTPR = []
    var dateTPR = []
    var nameToLowerCaseTPR = []
    var idTPR = []


    var nameLDO = []
    var briefNameLDO = []
    var argumentsLDO = []
    var pageLengthLDO = []
    var briefRatingLDO = []   
    var dateLDO = []
    var nameToLowerCaseLDO = []
    var idLDO = []
    var numberOfRatingsLDO = []

    var nameLDR = []
    var briefNameLDR = []
    var argumentsLDR = []
    var pageLengthLDR = []
    var dateLDR = []
    var nameToLowerCaseLDR = []
    var idLDR = []


    for(let i = 0; i<results; i++){
        briefNameTPO.push(results1[results-i-1].briefName)
        nameTPO.push(results1[results-i-1].name)
        argumentsTPO.push(results1[results-i-1].arguments)
        pageLengthTPO.push(results1[results-i-1].pageLength)
        dateTPO.push(results1[results-i-1].date)
        idTPO.push(results1[results-i-1]._id)
        nameToLowerCaseTPO.push(results1[results-i-1].nameToLowerCase)
        briefRatingTPO.push(Math.floor(results1[results-i-1].rating))
        var temp = await mongoRatings.count({id: results1[results-i-1]._id.toString()})
        numberOfRatingsTPO.push(temp)
    }
    for(let i = 0; i<results4; i++){
        briefNameLDO.push(results5[results4-i-1].briefName)
        nameLDO.push(results5[results4-i-1].name)
        argumentsLDO.push(results5[results4-i-1].arguments)
        pageLengthLDO.push(results5[results4-i-1].pageLength)
        dateLDO.push(results5[results4-i-1].date)
        idLDO.push(results5[results4-i-1]._id)
        nameToLowerCaseLDO.push(results5[results4-i-1].nameToLowerCase)
        briefRatingLDO.push(Math.floor(results5[results4-i-1].rating))
        var temp = await mongoRatings.count({id: results5[results4-i-1]._id.toString()})
        numberOfRatingsLDO.push(temp)
    }

    for(let i = 0; i<results2; i++){
        briefNameTPR.push(results3[results2-i-1].briefName)
        nameTPR.push(results3[results2-i-1].name)
        argumentsTPR.push(results3[results2-i-1].arguments)
        idTPR.push(results3[results2-i-1]._id)
        pageLengthTPR.push(results3[results2-i-1].pageLength)
        dateTPR.push(results3[results2-i-1].date)
        nameToLowerCaseTPR.push(results3[results2-i-1].nameToLowerCase)
    }
    for(let i = 0; i<results6; i++){
        briefNameLDR.push(results7[results6-i-1].briefName)
        idLDR.push(results7[results6-i-1]._id)
        nameLDR.push(results7[results6-i-1].name)
        argumentsLDR.push(results7[results6-i-1].arguments)
        pageLengthLDR.push(results7[results6-i-1].pageLength)
        dateLDR.push(results7[results6-i-1].date)
        nameToLowerCaseLDR.push(results7[results6-i-1].nameToLowerCase)
    }
    return res.render("briefExchange",{
        nameTPO: nameTPO,
        briefNameTPO: briefNameTPO,
        argumentsTPO: argumentsTPO,
        pageLengthTPO: pageLengthTPO,
        briefRatingTPO: briefRatingTPO,
        numberOfBriefsTPO: results,
        dateTPO: dateTPO,
        nameToLowerCaseTPO: nameToLowerCaseTPO,
        nameLDO: nameLDO,
        briefNameLDO: briefNameLDO,
        argumentsLDO: argumentsLDO,
        pageLengthLDO: pageLengthLDO,
        briefRatingLDO: briefRatingLDO,
        numberOfBriefsLDO: results4,
        dateLDO: dateLDO,
        nameToLowerCaseLDR: nameToLowerCaseLDR,
        nameLDR: nameLDR,
        dateLDR: dateLDR,
        briefNameLDR: briefNameLDR,
        argumentsLDR: argumentsLDR,
        pageLengthLDR:pageLengthLDR,
        nameToLowerCaseTPR: nameToLowerCaseTPR,
        nameTPR: nameTPR,
        dateTPR: dateTPR,
        briefNameTPR: briefNameTPR,
        argumentsTPR: argumentsTPR,
        pageLengthTPR:pageLengthTPR,
        numberOfBriefsLDR:results6,
        numberOfBriefsTPR: results2,
        nameToLowerCaseLDO: nameToLowerCaseLDO,
        auth: req.session.email,        
        authName: req.session.name,
        idTPO: idTPO,
        idTPR: idTPR,
        idLDO: idLDO,
        idLDR: idLDR,
        numberOfRatingsLDO:numberOfRatingsLDO,
        numberOfRatingsTPO:numberOfRatingsTPO,
        numberOfNotifications: notificationsFromMongo.notifications.length,
        notificationsArray: notificationsFromMongo.notifications,
    })
})


router.get("/login",markAsRead, (req, res)=>{
    if(req.session.email){
res.redirect('/')
    }else{
          
        res.render("login", {
            passwordCorrect: true,
            accountExisting: true,
            email: null,
            password: null,
            auth: req.session.email,        
            authName: req.session.name,    })
    }
   
})

router.get("/editAccountInformation", isAuth, markAsRead,async (req, res)=>{
    user = req.session.name
    var results = await mongoAccounts.findOne({ nameToLowerCase: user.toLowerCase().replace(' ','')})
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }
    if(req.session.name != user){
        return res.render("noAccess",{
            auth: req.session.email,
            authName: req.session.name,
            numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
        })
    }else{
        return res.render("editAccountInformation", {
            name: results.name,
            speechranks: results.speechranks,
            ldChecked: results.ld,
            tpChecked: results.tp,
            parliChecked: results.parli,
            email: results.email,
            auth: req.session.email,        
            authName: req.session.name,  
            emailAvailable: true,
            passwordCorrect: true,
            oldPassword: null,
            newPassword: null,
            confirmNewPassword: null,
            speechranksValid: true,
            passwordRight: true,
            oldPasswordExisting: true,
            verificationNumber: results.verificationNumber,
            numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
        })
    }
   
})

router.get("/verifyEmail", isAuth, markAsRead,async (req,res)=>{
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }

    var uuid = req.query.uuid
    var results =  await mongoAccounts.findOne({email: req.session.email, verificationNumber: uuid})
    try{if (!results.speechranks){
        return res.render("noAccess",{
            auth: req.session.email,
            authName: req.session.name,numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
        })
    }}catch(err){
        return res.render("noAccess",{
            auth: req.session.email,
            authName: req.session.name,numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
        })
    }
    await mongoAccounts.updateOne({email: req.session.email},{$set: {speechranks: results.speechranks, password: results.password, email: results.email, ld: results.ld, tp: results.tp, parli: results.parli, rating: results.rating, name: results.name, nameToLowerCase: results.name.toLowerCase().replace(" ", ""), verificationNumber:""}})
    return res.render("emailVerified",{
        auth: req.session.email,
        authName: req.session.name,numberOfNotifications: notificationsFromMongo.notifications.length,
        notificationsArray: notificationsFromMongo.notifications,
    })
})
router.post("/emailVerification", markAsRead, async (req,res)=>{
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
    <h1 style = "color:black;">Thanks for creating a StoaExchange account!</h1>
    <h2 style = "color:black;"> Please click <a href="http://localhost:3000/verifyEmail?uuid=` + results.verificationNumber +`" target = "_blank" style = "color: black;">here</a> to complete your signup. If you didn't create an account with us, please ignore this email.</h2>
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
        subject: 'StoaExchange email verification',
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
})
router.post('/editAccountInformation', markAsRead, async (req, res)=>{
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


    var existing =  await mongoAccounts.count({email: answer.email})
    var results =  await mongoAccounts.findOne({email: req.session.email})
    if(existing>0 && answer.email != req.session.email){
        if(!req.session.email){
            return res.render("noAccess",{
                auth: req.session.email,
                authName: req.session.name,
                numberOfNotifications: notificationsFromMongo.notifications.length,
                notificationsArray: notificationsFromMongo.notifications,
            })
        }else{return res.render("editAccountInformation",{
            emailAvailable: false,
            email: answer.email,
            name: answer.name,
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
            oldPassword: answer.oldPassword,
            newPassword: answer.newPassword,
            confirmNewPassword: answer.confirmNewPassword,
            numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
        })}
    }
    if(!answer.speechranks.includes("http://speechranks.com/")){
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
        })}
    }
    if(answer.oldPassword != results.password && answer.oldPassword){
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
        })}
    }
   
if (answer.password){
    await mongoAccounts.updateOne({email: req.session.email},{$set: {speechranks: answer.speechranks, password: answer.newPassword, email: answer.email, ld: tempLD, tp: tempTP, parli: tempPARLI, rating: results.rating, name: results.name, nameToLowerCase: results.nameToLowerCase}})

}else{
    await mongoAccounts.updateOne({email: req.session.email},{$set: {speechranks: answer.speechranks, password: results.password, email: answer.email, ld: tempLD, tp: tempTP, parli: tempPARLI, rating: results.rating, name: results.name, nameToLowerCase: results.nameToLowerCase}})

}
    return res.redirect("/profiles?user=" + req.session.name)

})
router.get("/addABriefOffer", isAuth, markAsRead,async (req, res)=>{
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }
let email = req.session.email
    var results = await mongoAccounts.findOne({ email: email})
    return res.render('addABriefOffer',{
        auth: req.session.email,
        authName: req.session.name,
        maxOfferingsMet: false,
        completed: false,
        verificationNumber: results.verificationNumber,
        numberOfNotifications: notificationsFromMongo.notifications.length,
        notificationsArray: notificationsFromMongo.notifications,
    })
})
router.get("/addABriefRequest", isAuth,markAsRead, async (req, res)=>{
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }
let email = req.session.email
    var results = await mongoAccounts.findOne({ email: email})
    return res.render('addABriefRequest',{
        auth: req.session.email,
        authName: req.session.name,
        maxRequestsMet: false,
        completed: false,      
        pages: null,      
        verificationNumber: results.verificationNumber,
        numberOfNotifications: notificationsFromMongo.notifications.length,
        notificationsArray: notificationsFromMongo.notifications,

    })
})
router.post("/addABriefOffer", isAuth,  markAsRead,  async (req, res)=>{
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
    
        })
    }
    var d = new Date();
var month = d.getMonth()+1
var year = d.getFullYear()
var day = d.getDate()
var date = month + "/" + day + "/" + year
    await mongoBrief.insertOne({name: req.session.name, arguments: answer.arguments, briefName: answer.briefName, email: req.session.email, pageLength: answer.pages, nameToLowerCase: req.session.name.toLowerCase().replace(" ", ""), type: "offering", debate: answer.debate, date: date, rating: null})
    return res.render("addABriefOffer",{
        auth: req.session.email,
        authName: req.session.name,
        maxOfferingsMet: false,
        completed: true,
        verificationNumber: results.verificationNumber,numberOfNotifications: notificationsFromMongo.notifications.length,
        notificationsArray: notificationsFromMongo.notifications,

    })})


router.post("/addABriefRequest", isAuth, markAsRead, async (req, res)=>{
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

    })})



    router.get("/dashboard", isAuth, markAsRead,async (req, res)=>{
        if(req.session.email){
            var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
        }else{
            var notificationsFromMongo = {
                "notifications":[]
                }
        }

        section = req.query.section
        try{
        var user = req.session.name
        var userToLowerCase = user.toLowerCase().replace(" ", "")
       
       

if(section == "yourBriefs"){
    var date = []
    var id = []
    var dateR = []
    var briefName = []
    var arguments = []
    var pageLength = []
    var briefRating = []
    var debate = []
    var briefNameR = []
    var argumentsR = []
    var pageLengthR = []
    var debateR = []
    var idR = []
    var requestFrom = []
    var requestFromEmail = []
    var requestId = []
    var requestBriefName = []
    var requestDescription = []
    var requestPages = []
    var requestArguments = []
    var requestDebate = []
    var requestAdditional = []
    var requestActualId = []
    var requestStatus = []
    var requestDate = []
    var numberOfRatings = []
    var requestSecondLink = []

    var results = await mongoAccounts.findOne({ nameToLowerCase: userToLowerCase})
    var results2 =  await mongoBrief.count({ type: "offering", nameToLowerCase: userToLowerCase})
    var results3 =  await mongoBrief.find({ type: "offering",nameToLowerCase: userToLowerCase}).toArray()
    var results4 =  await mongoBrief.find({ type: "request",nameToLowerCase: userToLowerCase}).toArray()
    var results5 =  await mongoBrief.count({ type: "request",nameToLowerCase: userToLowerCase})
    var requestAmount =  await mongoContact.count({ to: req.session.email})
    var results6 =  await mongoContact.find({ to: req.session.email}).toArray()
    for(let i = 0; i<results5; i++){
        briefNameR.push(results4[results5-i-1].briefName)
        argumentsR.push(results4[results5-i-1].arguments)
        pageLengthR.push(results4[results5-i-1].pageLength)
        debateR.push(results4[results5-i-1].debate.toUpperCase())
        dateR.push(results4[results5-i-1].date)
        idR.push(results4[results5-i-1]._id)
    }

    for(let i = 0; i<requestAmount; i++){
        requestFrom.push(results6[requestAmount-i-1].name)
        requestId.push(results6[requestAmount-i-1].id)
        requestBriefName.push(results6[requestAmount-i-1].briefName)
        requestDescription.push(results6[requestAmount-i-1].description)
        requestPages.push(results6[requestAmount-i-1].pageLength)
        requestArguments.push(results6[requestAmount-i-1].arguments)
        requestDebate.push(results6[requestAmount-i-1].debate.toUpperCase())
        requestActualId.push(results6[requestAmount-i-1]._id)
        requestAdditional.push(results6[requestAmount-i-1].additional)
        requestDate.push(results6[requestAmount-i-1].date)
        requestFromEmail.push(results6[requestAmount-i-1].email)
        requestStatus.push(results6[requestAmount-i-1].status)
        requestSecondLink.push(results6[requestAmount-i-1].secondLink)
    }

    for(let i = 0; i<results2; i++){
        briefName.push(results3[results2-i-1].briefName)
        id.push(results3[results2-i-1]._id)
        arguments.push(results3[results2-i-1].arguments)
        pageLength.push(results3[results2-i-1].pageLength)
        briefRating.push(Math.floor(results3[results2-i-1].rating))
        debate.push(results3[results2-i-1].debate.toUpperCase())
        date.push(results3[results2-i-1].date)
        var temp = await mongoRatings.count({id: results3[results2-i-1]._id.toString()})
        numberOfRatings.push(temp)
    }    
    return res.render("dashboardYourBriefs",{
            name: sortingMongoDB(results).name,
            speechranks: sortingMongoDB(results).speechranks,
            ld: sortingMongoDB(results).ld,
            tp: sortingMongoDB(results).tp,        
            parli: sortingMongoDB(results).parli,
            rating: Math.floor(sortingMongoDB(results).rating),
            numberOfBriefOfferings: results2,
            briefName: briefName,
            arguments: arguments,
            pageLength: pageLength,
            briefRating: briefRating,
            briefNameR: briefNameR,
            argumentsR: argumentsR,
            pageLengthR: pageLengthR,
            numberOfBriefRequests: results5,
            debate: debate,
            debateR: debateR,
            date: date,
            dateR: dateR,
            id: id,
            idR: idR,
            auth: req.session.email,        
            authName: req.session.name,    
            requestAmount: requestAmount,
            from: requestFrom,
            requestId: requestId,
            requestActualId: requestActualId,
            requestBriefName:requestBriefName,
            requestDescription:requestDescription,
            requestPages:requestPages,
            requestArguments:requestArguments,
            requestDebate:requestDebate,
            requestAdditional:requestAdditional,
            requestStatus: requestStatus,
            requestDate:requestDate,
            requestFromEmail:requestFromEmail,
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
            requestSecondLink: requestSecondLink,
            numberOfRatings:numberOfRatings, numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,

        })}else if(section == "outgoingRequests"){
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
            return res.render("dashboardOutgoingRequests",{
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
                })}else if(section == "ratings"){
                    return res.render("dashboardRatings",{
                        auth: req.session.email,
                        authName: req.session.name, numberOfNotifications: notificationsFromMongo.notifications.length,
                        notificationsArray: notificationsFromMongo.notifications,
                    })
                }else if(section == "briefsYouveReceived"){
                    var results = await mongoBriefsReceived.find({ $or: [ { fromEmail: req.session.email}, { toEmail: req.session.email} ] }).toArray()
                    var receivedAmount = await mongoBriefsReceived.count({ $or: [ { fromEmail: req.session.email}, { toEmail: req.session.email} ] })
               
                    var receivedBriefsInReturn = []
                    var receivedBriefsFrom = []
                    var receivedBriefsDate = []
                    var receivedBriefsTo = []
                    var receivedBriefsFirstLink = []
                    var receivedBriefsSecondLink = []
                    var receivedBriefsType = []
                    var receivedBriefsFirstBriefName = []
                    var receivedBriefsSecondBriefName = []
                    var receivedBriefsSecondBriefDescription = []
                    var receivedBriefsSecondBriefPages = []
                    var receivedBriefsSecondBriefArguments = []
                    var receivedBriefsSecondBriefDebate = []
                    var receivedBriefsFirstBriefDebate = []
                    var receivedBriefsFromEmail = []
                    var receivedBriefsToEmail = []
                    var receivedBriefsReviewed = []
                    var receivedBriefsId = []
                    for(let i = 0; i<receivedAmount; i++){
                       
                        if(results[receivedAmount-i-1].inReturn){
                            receivedBriefsFromEmail.push(results[receivedAmount-i-1].fromEmail)
                            receivedBriefsToEmail.push(results[receivedAmount-i-1].toEmail)
                            receivedBriefsFrom.push(results[receivedAmount-i-1].from)
                            receivedBriefsDate.push(results[receivedAmount-i-1].date)
                            receivedBriefsTo.push(results[receivedAmount-i-1].to)
                            receivedBriefsFirstLink.push(results[receivedAmount-i-1].firstLink)
                            receivedBriefsSecondLink.push(results[receivedAmount-i-1].secondLink)
                            receivedBriefsType.push(results[receivedAmount-i-1].type)
                            receivedBriefsFirstBriefName.push(results[receivedAmount-i-1].firstBriefName)
                            receivedBriefsSecondBriefName.push(results[receivedAmount-i-1].secondBriefName)
                            receivedBriefsSecondBriefDescription.push(results[receivedAmount-i-1].secondBriefDescription)
                            receivedBriefsSecondBriefPages.push(results[receivedAmount-i-1].secondBriefPages)
                            receivedBriefsSecondBriefArguments.push(results[receivedAmount-i-1].secondBriefArguments)
                            receivedBriefsSecondBriefDebate.push("")           
                            receivedBriefsInReturn.push(results[receivedAmount-i-1].inReturn)      
                            receivedBriefsFirstBriefDebate.push(results[receivedAmount-i-1].firstBriefDebate)    
                            receivedBriefsReviewed.push("")  
                            receivedBriefsId.push(results[receivedAmount-i-1].id)          
                        }else{
                            receivedBriefsFromEmail.push(results[receivedAmount-i-1].fromEmail)
                            receivedBriefsToEmail.push(results[receivedAmount-i-1].toEmail)
                            receivedBriefsFrom.push(results[receivedAmount-i-1].from)
                            receivedBriefsDate.push(results[receivedAmount-i-1].date)
                            receivedBriefsTo.push(results[receivedAmount-i-1].to)
                            receivedBriefsFirstLink.push(results[receivedAmount-i-1].firstLink)
                            receivedBriefsSecondLink.push(results[receivedAmount-i-1].secondLink)
                            receivedBriefsType.push(results[receivedAmount-i-1].type)
                            receivedBriefsFirstBriefName.push(results[receivedAmount-i-1].firstBriefName)
                            receivedBriefsSecondBriefName.push(results[receivedAmount-i-1].secondBriefName)
                            receivedBriefsSecondBriefDescription.push(results[receivedAmount-i-1].secondBriefDescription)
                            receivedBriefsSecondBriefPages.push(results[receivedAmount-i-1].secondBriefPages)
                            receivedBriefsSecondBriefArguments.push(results[receivedAmount-i-1].secondBriefArguments)
                            receivedBriefsInReturn.push("")           
                            receivedBriefsSecondBriefDebate.push(results[receivedAmount-i-1].secondBriefDebate)           
                            receivedBriefsFirstBriefDebate.push(results[receivedAmount-i-1].firstBriefDebate)      
                            receivedBriefsReviewed.push(results[receivedAmount-i-1].reviewed)    
                            receivedBriefsId.push(results[receivedAmount-i-1].id)    
                        }
                    }    
                    return res.render("dashboardBriefsYouveReceived",{
                        receivedBriefsInReturn:receivedBriefsInReturn,
                        receivedBriefsFrom:receivedBriefsFrom,
                        receivedBriefsDate:receivedBriefsDate,
                        receivedBriefsTo:receivedBriefsTo,
                        receivedBriefsFirstLink:receivedBriefsFirstLink,
                        receivedBriefsSecondLink:receivedBriefsSecondLink,
                        receivedBriefsType:receivedBriefsType,
                        receivedBriefsFirstBriefName:receivedBriefsFirstBriefName,
                        receivedBriefsSecondBriefName:receivedBriefsSecondBriefName,
                        receivedBriefsSecondBriefDescription:receivedBriefsSecondBriefDescription,
                        receivedBriefsSecondBriefPages:receivedBriefsSecondBriefPages,
                        receivedBriefsSecondBriefArguments:receivedBriefsSecondBriefArguments,
                        receivedBriefsSecondBriefDebate:receivedBriefsSecondBriefDebate,
                        auth: req.session.email,
                        authName: req.session.name,numberOfNotifications: notificationsFromMongo.notifications.length,
                        notificationsArray: notificationsFromMongo.notifications,
                        receivedAmount: receivedAmount,
                        receivedBriefsFirstBriefDebate:receivedBriefsFirstBriefDebate,
                        receivedBriefsFromEmail:receivedBriefsFromEmail,
                        receivedBriefsToEmail:receivedBriefsToEmail,
                        receivedBriefsReviewed:receivedBriefsReviewed,
                        receivedBriefsId:receivedBriefsId,

                    })
                }
        }catch(err){
            console.log(err)
            return res.render("login", {
                auth: req.session.email,
                authName: req.session.name, numberOfNotifications: notificationsFromMongo.notifications.length,
                notificationsArray: notificationsFromMongo.notifications,
            })
        }
    })
    router.get("/deleteAccount", markAsRead,async(req, res)=>{
        if(req.session.email){
            var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
        }else{
            var notificationsFromMongo = {
                "notifications":[]
                }
        }
        return res.render("deleteAccount",{
            auth: req.session.email,
            authName: req.session.name,
            passwordCorrect: true, numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
        })
    })

    router.post("/deleteAccount", isAuth, markAsRead, async (req,res)=>{
        return res.render("accountDeleted")
    })

router.post("/deleteAccount", isAuth, markAsRead, async (req,res)=>{
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }

    var results = await mongoAccounts.count({email: req.session.email, password: req.body.password})
    var briefsLength = await mongoBrief.count()
    var briefsContent = await mongoBrief.find().toArray()
    if(results >0){
        await mongoAccounts.deleteOne({email: req.session.email, password: req.body.password})

        for(let i = 0; i< briefsLength;i++){
            if(briefsContent[i].email == req.session.email){
                await mongoBrief.deleteOne({_id: briefsContent[i]._id})
            }
        }

    const emailContents = `
    <h1 style = "color:black;">Your account has been successfuly deleted.</h1>
    <h2 style = "color:black;">Thanks for using StoaExchange, sorry to see you leave so soon.</h2>
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
        subject: 'StoaExchange account deleted',
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
})
router.post("/contact",markAsRead,  async (req,res)=>{
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }
    var answer = req.body
var id = req.query.id
var results = await mongoBrief.findOne({_id: ObjectId(id)})
var d = new Date();
var month = d.getMonth()+1
var year = d.getFullYear()
var day = d.getDate()
var date = month + "/" + day + "/" + year
    if(results.type == "request"){
        if(answer.additional){
            console.log('chad1')
            await mongoContact.insertOne({ status: "none", inReturn: answer.inReturn, toName: results.name, debate: "", name: req.session.name, nameToLowerCase: req.session.name.toLowerCase().replace(" ",""), email: req.session.email, date: date,id:req.query.id, description: answer.description, pageLength: answer.pages, arguments: answer.arguments, additional: answer.additional,to: results.email, status: "none", offerDebate: results.debate, offerBriefName: results.briefName})
        }else{
            console.log('chad2')
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
        if(answer.additional){console.log('chad3' )
        await mongoContact.insertOne({ status: "none",toName: results.name, to:results.email, additional: answer.additional, name: req.session.name, nameToLowerCase: req.session.name.toLowerCase().replace(" ",""), email: req.session.email, date: date,id:req.query.id, briefName: answer.briefName, description: answer.description, pageLength: answer.pages, arguments: answer.arguments, debate: answer.debate, offerDebate: results.debate, offerBriefName: results.briefName})
    }else{
        await mongoContact.insertOne({name: req.session.name, nameToLowerCase: req.session.name.toLowerCase().replace(" ",""), email: req.session.email, date: date,id:req.query.id, briefName: answer.briefName, description: answer.description, pageLength: answer.pages, arguments: answer.arguments, debate: answer.debate, offerDebate: results.debate, offerBriefName: results.briefName,to:results.email,toName: results.name, status: "none"})
         console.log('chad4')}       
        await mongoAccounts.updateOne({email: results.email}, {$push:{notifications: req.session.name + " responded to your post offering a brief on "+results.briefName}})

        return res.render("accountDeleted", {
            auth: req.session.email,
            authName: req.session.name,
            doneContacting: true,numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
        })
    }
    
})
router.get("/contact", isAuth, markAsRead,async (req,res)=>{
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }
    var id = req.query.id
    var results1 = await mongoContact.findOne({id: id, email: req.session.email})
    if (results1){
        return res.render("alreadySubmitted",{
            auth:req.session.email,
            authName: req.session.name,
            name: results1.toName,
            reviewingOwn: false, numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
        })
    }
    var count = await mongoBrief.count({_id: ObjectId(id), nameToLowerCase: req.session.name.toLowerCase().replace(" ","")})

if(count >0){
    return res.render("alreadySubmitted",{
        auth:req.session.email,
            authName: req.session.name,
            reviewingOwn: true, numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
    })
}
    try{
        var results = await mongoBrief.findOne({_id: ObjectId(id)})
        return res.render("contact",{
            name: results.name,
            briefName: results.briefName,
            rating: results.rating,
            pages: results.pageLength,
            arguments: results.arguments,
            date: results.date,
            debate: results.debate.toUpperCase(),
            auth:req.session.email,
            authName: req.session.name,
            type: results.type,
            id: id, numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
        })
    }catch(err){
        console.log(err)
        return res.render("404",{
            auth:req.session.email,
            authName: req.session.name, numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
        })
    }    
})
router.post("/deleteBrief",markAsRead,  async (req,res)=>{

        
        idQuery = req.query.id
    await mongoBrief.deleteOne({_id: ObjectId(idQuery)})

    return res.redirect("/dashboard?section=yourBriefs")
})

router.post("/reject", markAsRead, async (req,res)=>{
    var id = req.query.id
    await mongoContact.updateOne({_id: ObjectId(id)}, {$set: {status:"rejected"}})
    var results = await mongoContact.findOne({_id: ObjectId(id)})
    if (results.inReturn){
        await mongoAccounts.updateOne({email: results.email},{$push:{notifications: results.toName + " has rejected your offer for a brief on " + results.offerBriefName}})
    }else{
        await mongoAccounts.updateOne({email: results.email},{$push:{notifications: results.toName + " has rejected your request to trade for a brief on " + results.briefName}})
    }
    
    return res.redirect("/dashboard?section=yourBriefs")
})
  

router.post("/agree", markAsRead, async (req,res)=>{
    var id = req.query.id
    var answer = req.body
    await mongoContact.updateOne({_id: ObjectId(id)}, {$set: {status:"agree", firstLink: answer.link}})
    var results = await mongoContact.findOne({_id: ObjectId(id)})

    if(results.inReturn){
        await mongoAccounts.updateOne({email: results.email}, {$push:{notifications: req.session.name + " has agreed to your offer for a brief on "+results.inReturn}})
    }else{
        await mongoAccounts.updateOne({email: results.email}, {$push:{notifications: req.session.name + " has agreed to your request for a brief on "+results.offerBriefName}})
    }
    return res.redirect("/dashboard?section=yourBriefs")
})
router.post("/response", isAuth, async (req,res)=>{
    var id = req.query.id
    var answer = req.body
    await mongoContact.updateOne({_id: ObjectId(id)}, {$set: {status:"bothSidesSent", secondLink: answer.link}})
    var results = await mongoContact.findOne({_id: ObjectId(id)})
try{if(results.inReturn){
    await mongoBriefsReceived.insertOne({from: results.name, fromToLowerCase: results.nameToLowerCase, fromEmail: results.email, date: results.date, to: results.toName, toEmail: results.to, firstLink: results.firstLink, secondLink: results.secondLink, type: "request", firstBriefName: results.offerBriefName, firstBriefDebate: results.offerDebate, secondBriefName: results.briefName, secondBriefDescription: results.description, secondBriefPages: results.pageLength, secondBriefArguments:results.arguments, inReturn: results.inReturn, firstBriefDebate: results.debate,reviewed: false, id: results.id})
    await mongoAccounts.updateOne({nameToLowerCase: results.toName.toLowerCase().replace(" ","")},{$push:{notifications: results.name + " has uploaded their brief on " + results.offerBriefName}})
}else{
    await mongoBriefsReceived.insertOne({from: results.name, fromToLowerCase: results.nameToLowerCase, fromEmail: results.email, date: results.date, to: results.toName, toEmail: results.to, firstLink: results.firstLink, secondLink: results.secondLink, type: "offering", firstBriefName: results.offerBriefName, firstBriefDebate: results.offerDebate, secondBriefName: results.briefName, secondBriefDescription: results.description, secondBriefPages: results.pageLength, secondBriefArguments:results.arguments, secondBriefDebate: results.debate, firstBriefDebate: results.debate,id: results.id,reviewed: false})
    await mongoAccounts.updateOne({nameToLowerCase: results.toName.toLowerCase().replace(" ","")},{$push:{notifications: results.name + " has uploaded their brief on " + results.briefName}})
}}catch(err){await mongoAccounts.updateOne({nameToLowerCase: results.toName.toLowerCase().replace(" ","")},{$push:{notifications: results.name + " has uploaded their brief on " + results.briefName}})}


    
    res.redirect("dashboard?section=outgoingRequests")
})

router.post("/deleteContact", isAuth, markAsRead, async (req,res)=>{
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
    return res.render("dashboardOutgoingRequests",{
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
})
router.get('/termsAndConditions', markAsRead,async (req,res)=>{
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }return res.render("termsAndConditions", {
        auth: req.session.email,
        authName: req.session.name,numberOfNotifications: notificationsFromMongo.notifications.length,
        notificationsArray: notificationsFromMongo.notifications,
    })
})
router.get("/forgotPassword",markAsRead, async (req,res)=>{
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }return res.render("forgotPassword",{
        auth: req.session.email,
        authName: req.session.name,
        existingEmail: true,
        spamming: false,numberOfNotifications: notificationsFromMongo.notifications.length,
        notificationsArray: notificationsFromMongo.notifications,
email: "",
        successful: false,    })
})

router.post("/forgotPassword", markAsRead, async (req,res)=>{
    if(req.session.email){
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
    <h2 style = "color:black;">Please click <a href="http://localhost:3000/passwordReset?uuid=` + uuid +`" target = "_blank" style = "color: black;">here</a> to reset your password. If you didn't request a password reset, please disregard this email.</h2>
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
        subject: 'StoaExchange password reset',
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
})

router.get("/passwordReset", markAsRead,async (req,res)=>{
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }
uuid = req.query.uuid
    var count = await mongoAccounts.count({uuid: uuid})
    var results = await mongoAccounts.findOne({uuid: uuid})
    var currentDate = moment()

    if(count>0){
        var difference = currentDate.diff(results.lastRequest)

        if(currentDate.diff(results.lastRequest)> 3600000){

if(difference<43200000){
    difference = 43200000-difference
    difference = difference/3600000
    var hours = Math.ceil(difference)}else{var hours = "false"}

            return res.render("passwordReset",{
                auth: req.session.email,
                authName: req.session.name,
                hoursPassed: true,
                hours: hours,
                valid: true,
                passwordsEqual: true,
email: "",
newPassword: "",
confirmNewPassword: "", numberOfNotifications: notificationsFromMongo.notifications.length,
notificationsArray: notificationsFromMongo.notifications,
            })
        }else{
            return res.render("passwordReset",{
                auth: req.session.email,
                authName: req.session.name,
                hoursPassed: false,
                hours: hours,
                valid: true,
                uuid: uuid,
                validEmail: true,
                success: false,
                passwordsEqual: true,
                email: "",
                newPassword: "",
                confirmNewPassword: "",    numberOfNotifications: notificationsFromMongo.notifications.length,
                notificationsArray: notificationsFromMongo.notifications,
            })}
    
    }else{
        return res.render("passwordReset",{
            auth: req.session.email,
            authName: req.session.name,
            hoursPassed: false,
            valid: false,
            validEmail: true,
            success: false,
            passwordsEqual: true,
            email: "",
            newPassword: "",
            confirmNewPassword: "",     numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
       })    
    }
    })


router.post("/passwordReset", markAsRead, async (req,res)=>{
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }var uuid = req.query.uuid
    var answer = req.body

    var results = await mongoAccounts.count({uuid: uuid, email: answer.email})
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
       

        await mongoAccounts.updateOne({uuid: uuid, email: answer.email},{$set:{password: answer.newPassword}})
var recipient = answer.email
        const emailContents = `
        <h1 style = "color:black;">The password for your StoaExchange account was just changed.</h1>
        <h2 style = "color:black;">If that wasn't you, please email us at <a href = "mailto:StoaExchange@gmail.com" target="_blank">StoaExchange@gmail.com</a>.</h2>
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
            subject: 'StoaExchange password change',
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
})

router.post("/rateABrief",isAuth, markAsRead, async (req,res)=>{
    id = req.query.id
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
    
})
router.get("/rateABrief",isAuth, markAsRead, async (req,res)=>{
    if(req.session.email){
        var notificationsFromMongo = await mongoAccounts.findOne({email: req.session.email})
    }else{
        var notificationsFromMongo = {
            "notifications":[]
            }
    }var id = req.query.id
    try{var valid = await mongoBrief.count({_id: ObjectId(id)})}catch(err){var valid = 0}
    
if(valid>0){
    var results = await mongoBrief.findOne({_id: ObjectId(id)})
    var name = results.name
    var briefName = results.briefName
        return res.render("rateABrief",{
            auth: req.session.email,
            authName: req.session.name,
            briefReceived: true,
            alreadyReviewed: false,
            successful: false,            checked: true,id: id,name: name, briefName: briefName,
            rating: "",
            checkboxChecked: false, numberOfNotifications: notificationsFromMongo.notifications.length,
            notificationsArray: notificationsFromMongo.notifications,
    
        })}else{


            return res.render("briefDoesntExist",{
                auth: req.session.email,
                    authName: req.session.name, numberOfNotifications: notificationsFromMongo.notifications.length,
                    notificationsArray: notificationsFromMongo.notifications,
            })
        }
})



router.post("/markAsRead", markAsRead, async (req,res)=>{
    var results = await mongoAccounts.findOne({email: req.session.email})
    await mongoAccounts.updateOne({email: req.session.email},{ $pullAll: { notifications: results.notifications}})    

    return res.redirect(req.session.notificationRedirect || "/")
})
router.all('*', async (req, res) => {
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
    });
});

module.exports = router;