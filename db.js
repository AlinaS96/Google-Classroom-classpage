//create database script insame folder as .js file
//npm init --y to create node modules folder pckg json file
//initialize client object with db password 

const {Client}= require('pg');
const client = new Client({//specify connection parameters
    host: "localhost",
    user: "postgres",
    port: 5432, //by default if not provided
    password: "Mansoor123",
    database: "Google_Classroom"//"Classroom" //googleClass      //"Classroom"
});

module.exports = client;
console.log('The value of path is:', process.env.PORT);
//save above in seperate file and require
//https://www.youtube.com/watch?v=o2cwlmgeZDk
//module.exports=client;
//const client=require('./database')
/*
client.connect();//to connect node app and databse


//query takes query  and function 
/*
client.query('Select * from list',(err, res)=>{
    if(!err){
        console.log(res.rows);

    }else{
        console.log(err.message);
    }
    client.end(); 
});


client.query('Select * from list where chore_id=$1',[10],(err, res)=>{
    if(!err){
        console.log(res.rows);

    }else{
        console.log(err.message);
    }
    client.end(); 
});

*/

client.on("connect",()=>{
    console.log("Database connection");
});
client.on("end",()=>{console.log("connection end");
});

//INSERT INTO list(chore_id, to_do, deadline, entered) VALUES(1,'Garbage','14:00:00',CURRENT_TIMESTAMP)