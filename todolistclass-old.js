//jshint esversion:6
const auth = require('./authentication.js');

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const app = express();

app.set('view engine', "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

let items = [];
let Comments=[];

app.get("/",authenticateToken, function(req, res){

    const day = date.getDate();
    res.render("class", {  //
        listTitle: day,
        newListItems: items,
        Timing: new Date().toLocaleString(), 
        Comments: Comments
    });

});




app.post("/",authenticateToken, function(req, res){
    var item = req.body.newItem;
    if(req.body.list !== "undefined"){
       if(item || !item.length==0){
        items.push(item); 
        Comments.push(new Array());
        res.redirect("/");

       }
    }

});


//to comment on a post with id
app.post("/:id", function(req, res){
    var index = parseInt(req.params.id);
    var val = req.body.comment;
    if(val!=="undefined"){
        var comment = req.body.newComment; //could either be input or button value, req.body.newComment or comment
       if(comment|| !comment.length === 0 ) {
        if(Comments.length<index+1){
           for(let i=Comments.length;i<index+1;i++){
              Comments.push(new Array());
         }
         }
           
       Comments[index].push(comment);
        console.log(Comments);
       }
        res.redirect("/");
   
    }
});


app.get("/delete/:id", function(req, res){
    var index = parseInt(req.params.id);
    items.splice(index,1);
    Comments.splice(index,1);
    res.redirect("/");
    }
);



app.listen(3001, function(){
    console.log("Server started on port[:3001] at: localhost");
});

