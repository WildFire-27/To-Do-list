//jshint esversion:6
//declare all packages using require

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
//make express to use ejs public  files and body parsers
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(ignoreFavicon);

//make a mongoose connection to conneect database
mongoose.connect("mongodb+srv://Shreeya27:wildShreeya@cluster0-dcwbp.mongodb.net/todolistDB",{useUnifiedTopology: true,useNewUrlParser: true});

//create a itemsSchema giving one attribute as name: datatype
const itemsSchema = {
    name: String
};

//now create a module which is Item
const Item = mongoose.model("Item", itemsSchema);

//add values for these collections say name values added
const item1 = new Item({
  name:"Welcome to todolist!"
});

const item2 = new Item({
  name:"Hit the + button!"
});

const item3 = new Item({
  name:"---hit delete item!"
});
//now store these in a array name it defaultItems
const defaultItems = [item1,item2,item3];
//now we have to insert data into databse that is todolistDB
const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

   Item.find({}, function (err, foundItems) {
     //console.log(foundItems);

        if(foundItems.length === 0){
          Item.insertMany(defaultItems ,function (err) {
            if(err){
              console.log(err);
            }
            else {
              console.log("Succesfully added to db default");
            }
              });
              res.redirect("/");
        }else{
            res.render("list", {listTitle: "Today", newListItems: foundItems});
          }
   });
//const day = date.getDate();

});
function ignoreFavicon(req, res, next) {
  if (req.originalUrl === '/favicon.ico') {
    res.status(204).json({nope: true});
  } else {
    next();
  }
}
app.get("/:customListName", function(req,res){
   const customListName = _.capitalize(req.params.customListName);

   List.findOne({ name: customListName}, function (err, foundList) {
     if(!err){
       if(!foundList){
         // create new list
        // console.log("Doesnt exixt");
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/"+ customListName);
       } else {
         //console.log("Exists");
         //show an existing list
         res.render("list", {listTitle: foundList.name, newListItems: foundList.items});

       }
     }
   });

 });


app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
              name:itemName
  });
  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName}, function (err, foundList){
           foundList.items.push(item);
           foundList.save();
           res.redirect("/"+ listName);
    });
  }
  });

  // if (req.body.list === "Work") {
  //   workItems.push(item);
  //   res.redirect("/work");
  // } else {
  //   items.push(item);
  //   res.redirect("/");
  // }

//deleting data
app.post("/delete",function (req,res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if(!err){
        console.log("Success");
          res.redirect("/");
      }
    });
  }else{
    List.findOneAndUpdate({name: listName}, {$pull: {items:{_id:checkedItemId}}},function (err, foundList) {
      if(!err){
        res.redirect("/"+listName);
      }
   });
}
});


app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if(port == null || port == ""){
  port = 3000;
}
app.listen(port, function() {
  console.log("Server started Succesfully!!");
});
