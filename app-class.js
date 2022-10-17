require('dotenv').config();
const client=require('./db.js')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const app = express();

app.use(cookieParser());
app.use(bodyParser.json());
//app.use(express.static('public'));

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended: true}));
app.set('views','views')
app.set('view engine', "ejs");
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
      
            client.query('INSERT INTO Users(email,username,password) VALUES($1,$2,$3) RETURNING *',[req.body.email,req.body.username,hashedPassword],(err, res)=>{
                if(!err){
                   res.send(res.rows);

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
    //res.redirect('/homepage');
    res.redirect('/');
    }else{
        res
        .status(400)
        .json({ error: "Wrong Username and Password Combination!" });
    }
});

  
app.get('/logout',authenticateToken,(req,res)=>{
    res.clearCookie("access-token");
   // res.sendStatus(204);
    res.redirect('/login');
    //res.end()
});


//get all classes attended by user
app.get('/',authenticateToken, async function(req, res){
    
    let attending = await client.query('SELECT class_id FROM class_users where user_id=$1',[req.user.id]);
   // console.log(attending , 'here'); //attending works fine
    let Classname=[];let classtutor=[];
    for(let i=0;i<attending.rows.length;i++){   
     let  tutor= await client.query('SELECT teacher_id FROM class where id=$1',[attending.rows[i].class_id]);
    classtutor.push(tutor.rows[0]); 
   //console.log(tutor, 'here');
     let  title= await client.query('SELECT title FROM class where id=$1',[attending.rows[i].class_id]);
    Classname.push(title.rows[0]);
    }
   // console.log(classtutor,  'here it is')
    tutorName = [];
    for(let x = 0; x < attending.rows.length; x++){
        let users = await client.query('SELECT username FROM Users WHERE id=$1',[classtutor[x].teacher_id]);
       tutorName.push(users.rows[0].username);
    }
    //get current User character
    let user = await client.query('SELECT username FROM Users WHERE id=$1',[req.user.id]);
    console.log(tutorName);
    res.render("classes",{
        Classname: Classname,
        classtutor: tutorName,
        Class: attending.rows,
        user: (user.rows[0].username).charAt(0)
    });
});


//create a class, pass title of class, displayclass code
app.post('/create',authenticateToken, async function(req, res){
    let result           = '';
    let characters       = 'abcdefghijklmnopqrstuvwxyz0123456789';
    for ( var i = 0; i < 6; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
   }

   if(req.body.Createbtn!=="undefined"){
    let createClass = client.query('INSERT INTO class(teacher_id, title, class_code)  VALUES($1,$2,$3) RETURNING *',[req.user.id,req.body.title,result],(err, res)=>{
        if(!err){
            console.log(createClass);

    }else{
            console.log(err.message);
        }
    });
    
    res.redirect("/");
 }
});


//join a class //pass class code
app.post('/join',authenticateToken,async function(req, res){
    //fetch class id for the class code
  if(req.body.Joinbtn!=="undefined"){
   // console.log(typeof(req.body.code));
    let ClassId = await client.query('SELECT id FROM class WHERE class_code=$1',[req.body.code]);
    let joinClass = client.query('INSERT INTO class_users(user_id, class_id)  VALUES($1,$2)',[req.user.id,ClassId.rows[0].id]);
    res.redirect("/");
}
});



//to get a class //removed class
app.get("/:id",authenticateToken, async function(req, res){

    let posts = await client.query('SELECT id, user_id, content, posted_date FROM posts WHERE class_id=$1',[req.params.id]);
    let Comments = await client.query('SELECT user_id, content, commented_date, post_id FROM comments WHERE class_id=$1',[req.params.id]);
    let classDetails = await client.query('SELECT title, teacher_id FROM class WHERE id=$1',[req.params.id]);
    let classTutor = await client.query('SELECT username FROM Users WHERE id=$1',[classDetails.rows[0].teacher_id]);
     
    let post_users = [];
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

        for(let n = 0; n<posts.rows.length; n++){
            comment_users.push([]); 
        }
    }



    //to get posts content....
    if(posts.rows.length !== 0){
        var content = new Array();
        for(let i = 0; i<posts.rows.length; i++){
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
        for(let i=0; i<posts.rows.length; i++){
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
        post_id: post_Id,
        classTitle: classDetails.rows[0].title,
        teacherName: classTutor.rows[0].username,
        classid: req.params.id
    });



});



//to add a post  //removed awair from all insert statements , /added postid
app.post("/:id",authenticateToken,async function(req, res){
    //console.log(req.params.class_id, 'here i am');
    let class_index=parseInt(req.params.id);
    var post = req.body.newItem;
    var date=new Date().toLocaleString(); //let Id=req.params.id;
    if(req.body.list !== "undefined"){
       if(post || post.length!==0){//just added class id
       let new_post = client.query('INSERT INTO posts(class_id,user_id,content,posted_date) VALUES($1,$2,$3,$4) RETURNING *',[class_index ,req.user.id,post,date],(err, res)=>{
            if(!err){
                console.log(new_post);

        }else{
                res.send(err.message);
            }
        })
       res.redirect(`/${req.params.id}`);

       }
    }

});


//to comment on a post with id, /:id
app.post("/:classid/:postid", authenticateToken,async function(req, res){
  //  var index = parseInt(req.params.postid);
    var val = req.body.comment;
    if(val!=="undefined"){
        var comment = req.body.newComment; 
       if(comment|| !comment.length === 0 ) {
        //fetch comments.rows[0] from database
        
        let date=new Date().toLocaleString();
        //just added class id
        //dont matter if passing int or string in database
        client.query('INSERT INTO comments( class_id,user_id,post_id,content, commented_date) VALUES($1,$2,$3,$4,$5) RETURNING *',[req.params.classid,req.user.id,req.params.postid,comment,date],(err, res)=>{
            if(!err){
                console.log(res.rows);

        }else{
                console.log(err.message);
            } 
        })
       }
        res.redirect(`/${req.params.classid}`); //pass integer to : in url
   
    }
});



//delete a post with id
app.post("/:classid/delete/:id",authenticateToken, async function(req, res){
    if(req.body.delete!="undefined"){   
        var index = parseInt(req.params.id); 
        let delPost=await client.query('DELETE  FROM posts where id=$1',[index],(err, res)=>{
            if(!err){
                console.log(delPost);

        }else{
                res.send(err.message);
            }
        })
    }
    res.redirect(`/${req.params.classid}`);
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



