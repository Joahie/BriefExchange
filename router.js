//Maps the url to the function/file that needs to be executed
module.exports = (app) => {
    app.use("/api/", require("./routes/api.js"))

    app.use("/", require("./routes/index.js"))
}