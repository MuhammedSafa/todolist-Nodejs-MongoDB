const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');

const date = require(__dirname + "/date.js");

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));


const workList = [];
const items = [];

mongoose.connect('mongodb://localhost:27017/todoListDB', { useNewURLParser: true });

const itemsSchema = new mongoose.Schema({
    name: {
        type: String
    }
});

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({ name: 'Welcome to your todolist!' });

const item2 = new Item({ name: 'Hit the + button to add a new item' });

const item3 = new Item({ name: '<-- Hit this to delete an item' });

const defaultItem = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {

    const day = date.getDate();

    Item.find(function (err, foundItems) {
        console.log(foundItems.length)
        if (foundItems.length === 0) {
            Item.insertMany(defaultItem, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Succesfully added");
                }
            });
            res.redirect("/");
        }
        else {
            res.render("list", { listTitle: "Today", newItemList: foundItems });
        }
    });
});

app.post("/", function (req, res) {

    let item = req.body.newItem;
    let listName = req.body.list;
    const new_item = new Item({ name: item });
    const new_listItem = new List({});

    if (listName === "Today") {
        new_item.save();
        res.redirect("/");
    } else if (listName === "My") {
        const list = new List({
            name: item,
            items: defaultItem
        });

        list.save();
        res.redirect("/List");
    } else {
        List.findOne({ name: listName }, function (err, foundList) {
            foundList.items.push(new_item);
            foundList.save();
            res.redirect("/" + listName);
        });
    }



});

app.post("/delete", function (req, res) {
    let deletedItem = req.body.checkbox;
    let collectionName = _.capitalize(req.body.checkbox2);
    console.log(collectionName);

    if (collectionName === "Today") {
        Item.findByIdAndRemove(deletedItem, function (err) {
            if (err) {
                console.log(err);
            }
            else {
                console.log("Item Deleted");
            }
        });
        res.redirect("/");
    } else if (collectionName === "My") {
        List.findByIdAndRemove(deletedItem, function (err) {
            if (err) {
                console.log(err);
            }
            else {
                console.log("Item Deleted");
            }
        });
        res.redirect("/List");
    } else {
        List.findOneAndUpdate({ name: collectionName }, { $pull: { items: { _id: deletedItem } } }, function (err, foundList) {
            if (!err) {
                res.redirect("/" + collectionName);
            }
        });
    }

});

app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);

    if (customListName === "List") {
        var collections = mongoose.connections[0].collections;
        var names = [];
        Object.keys(collections).forEach(function (k) {
            names.push(k);
        });
        console.log(names);

        List.find(function (err, foundList) {
            if (!err) {

                res.render("list", { listTitle: "My Lists", newItemList: foundList });

            }
        });


    } else {

        List.findOne({ name: customListName }, function (err, foundList) {
            if (!err) {
                if (!foundList) {
                    const list = new List({
                        name: customListName,
                        items: defaultItem
                    });

                    list.save();
                    res.redirect("/" + customListName);
                } else {
                    res.render("list", { listTitle: foundList.name, newItemList: foundList.items });
                }
            }
        });

    }


});

app.get("/work", function (req, res) {

    Work.find(function (err, foundItems) {

        if (err) {
            console.log(err);
        }
        else {
            res.render("list", { listTitle: day, newItemList: foundItems });
        }
    });


});

app.post("/work", function (req, res) {
    let item = req.body.newItem;
    const new_work = new Work({ name: item });
    new_work.save();
    res.redirect("/work");
});


app.get("/about", function (req, res) {
    res.render("about");
});

app.listen(3000, function () {
    console.log("Server started port: 3000");
});