//jshint esversion:6
require('dotenv').config();
const client=require('./db.js')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
//const { Pool } = require('pg');
const date = require(__dirname + "/date.js");
const app = express();

app.use(cookieParser());
app.use(bodyParser.json());
app.set('views','views')
app.set('view engine', "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
//get random characters
//require('crypto').randomBytes(64).toString('hex')



client.connect();


app.get('/register',(req,res)=>{
    res.render('register.ejs');
});

app.post('/register', async (req,res)=>{
    try{
        if(req.body.register!="undefined"){
        const salt = await bcrypt.genSalt() 
        const hashedPassword = await bcrypt.hash(req.body.password, salt)
      
            client.query('INSERT INTO Users( email,username,password) VALUES($1,$2,$3) RETURNING *',[req.body.email,req.body.username,hashedPassword],(err, res)=>{
                if(!err){
                    console.log(res.rows);

            }else{
                    console.log(err.message);
                } 
            })
            res.status(201).send({ 'success': `New user ${req.body.username} created!` });
        //bcrypt.hash(salt+'password')
        } 
    }catch(error){
            return res.status(500).send(error);
        }
});


app.get('/login',(req,res)=>{
    res.render('login.ejs');
});
let user;
app.post('/login', async (req, res) => {
   
    const{email,password}=req.body;
    if (!password || !email) return res.status(400).json({ 'message': 'All fields are required.' });
    let user = await client.query('SELECT * FROM users WHERE email=$1',[email]);
    
    if(!user.rows[0]) return res.status(401).send({'error':'Unauthorized'}); //Unauthorized 
    const pwd = user.rows[0].password;
    const match = await bcrypt.compare(password,pwd);
    if(match){
    // jwt.sign({"username":user.rows[0].username}, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30s' }, (err, token) => {
    //   res.json({
    //     token
    //   });
    // });
    // }
    const accessToken = createTokens(user.rows[0]);

      res.cookie("access-token", accessToken, {
        maxAge: 60 * 60 * 24 * 1* 1000,//1 day
        httpOnly: true,
      });
     //COMEBACK
    res.redirect('/homepage');
    }else{
        res
        .status(400)
        .json({ error: "Wrong Username and Password Combination!" });
    }
});

app.get('/homepage',authenticateToken,(req,res)=>{
 res.render('homepage.ejs');
});

  

app.get('/logout',authenticateToken,(req,res)=>{
    res.clearCookie("access-token");
    res.sendStatus(204);
    res.redirect('/login');
    //res.end()
});


  

app.get("/",authenticateToken, async function(req, res){

    let posts = await client.query('SELECT id, user_id, content, posted_date FROM posts');
    let Comments = await client.query('SELECT user_id, content, commented_date, post_id FROM comments');
     //console.log(Comments);
     
    let post_users=[];
    for(let x = 0; x < posts.rows.length; x++){
        let users = await client.query('SELECT username FROM Users WHERE id=$1',[posts.rows[x].user_id]);
       post_users.push(users.rows[0]);
    }


    //id to add comment to posts and delete them
    let post_Id = [];
    for(let x = 0; x < posts.rows.length; x++){
       post_Id.push(posts.rows[x].id);
    }
    


  //to get commenting users  
    let comment_users = [];
    if(Comments.rows.length!==0){ 
         for(let i = 0; i < posts.rows.length; i++){
        comment_users.push([]);}
        for(let x = 0; x < Comments.rows.length; x++){
            const user = await client.query('SELECT username FROM Users WHERE id=$1',[Comments.rows[x].user_id]);
            comment_users[ post_Id.indexOf(Comments.rows[x].post_id)].push(user.rows[0].username); 
            //console.log(comment_users);
        }

    }else{

        for(let n = 0; n < posts.rows.length; n++){
            comment_users.push([]); 
        }
    }



    //to get posts content....
    if(posts.rows.length !== 0){
        var content = new Array();
        for(let i = 0; i < posts.rows.length; i++){
            content.push(posts.rows[i].content)
        }

    }else{ 
        content = [];
    }





    //to deal with comments' dates 
    if(Comments.rows.length !== 0){
        var commdate = new Array();
        for(let i = 0; i < posts.rows.length; i++){
            commdate.push([]);
        } 
        for(let i = 0; i < Comments.rows.length; i++){
            commdate[post_Id.indexOf(Comments.rows[i].post_id)].push(Comments.rows[i].commented_date)
        }

    }else{
        var commdate = new Array();
        for(let n = 0; n < posts.rows.length; n++){
            commdate.push([]); 
        }
    }



    //to deal with Comments
    if(Comments.rows.length !== 0){
        var Comment = new Array();
        for(let n = 0; n < posts.rows.length; n++){
            Comment.push([]); 
        } 
        for(let i = 0; i < Comments.rows.length; i++){
            Comment[post_Id.indexOf(Comments.rows[i].post_id)].push([Comments.rows[i].content]);
        }

    }else{
        var Comment = new Array();
        for(let n = 0; n < posts.rows.length; n++){
            Comment.push([]); 
        }

    } 


    //to get posts' date
    if( posts.rows.length !== 0 ){
        var postdate = new Array();
        for(let i = 0; i < posts.rows.length; i++){
            postdate.push(posts.rows[i].posted_date);
         }

    }else{ 
        postdate = [];
    }



    //render everything on the page   
    res.render("class", { 
        users: post_users,
        postContent: content,
        Timing_post: postdate,
        comment_user: comment_users, 
        Comments: Comment,
        Timing_comment: commdate,
        post_id:post_Id
    });



});



//to add a post
app.post("/",authenticateToken,async function(req, res){
    var post = req.body.newItem;
    //var date = new Date().toLocaleString();
    var d=new Date(Date.parse(new Date().toLocaleString()));
    var date=d.toUTCString();
    if(req.body.list !== "undefined"){
       if( post || post.length !== 0){
       const new_post = await client.query('INSERT INTO posts( user_id,content,posted_date) VALUES($1,$2,$3) RETURNING *',[req.user.id,post,date],(err, res)=>{
            if(!err){
                console.log(new_post);

        }else{
                res.send(err.message);
            }
        })
        res.redirect("/");

       }
    }

});


//to comment on a post with id
app.post("/:id", authenticateToken,async function(req, res){
    var index = parseInt(req.params.id)
    var val = req.body.comment;
    if(val !== "undefined"){
        var comment = req.body.newComment; 
       if( comment || !comment.length === 0 ) {
        //fetch comments.rows[0] from database
        
        //let date = new Date().toLocaleString()
        var d=new Date(Date.parse(new Date().toLocaleString()));
        var date=d.toUTCString();
        client.query('INSERT INTO comments( user_id,post_id,content, commented_date) VALUES($1,$2,$3,$4) RETURNING *',[req.user.id,index,comment,date],(err, res)=>{
            if(!err){
                console.log(res.rows);

        }else{
                console.log(err.message);
            } 
        })
       }
        res.redirect("/");
   
    }
});



//delete a post with id
app.post("/delete/:id",authenticateToken, async function(req, res){
    if(req.body.delete != "undefined"){   
        var index = parseInt(req.params.id); 
        let delPost = await client.query('DELETE  FROM posts where id=$1',[index] );
    }
    res.redirect("/");
});


const createTokens = (user) => {
    const accessToken = jwt.sign(
      { username: user.username, id: user.id},
      process.env.ACCESS_TOKEN_SECRET
    );
    return accessToken;
};


function authenticateToken(req, res, next) {
    const accessToken = req.cookies["access-token"];

    if (!accessToken)
      return res.status(400).json({ error: "User not Authenticated!" });
    //     const authHeader = req.headers['authorization']
//     const token = authHeader && authHeader.split(' ')[1]
//     if (token == null) return res.sendStatus(401)
//token
jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
  console.log(err)
  if (err) return res.sendStatus(403)
  req.user = user
  next();
})


}

app.listen(3001, function(){
    console.log("Server started on port[:3001] at: localhost");
});

