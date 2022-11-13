const {Client}= require('pg')
const client = new Client({
    //specify connection parameters
    host: "localhost",
    user: "postgres",
    port: 5432, //by default if not provided
    password: process.env.DB_PASSWORD,
    database: "Google_Classroom"
})

module.exports = client;
console.log('The value of path is:', process.env.PORT)

client.on("connect",() => {
    console.log("Database connection")
 })

client.on("end", () => { console.log("connection end")
 })
