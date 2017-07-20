/// Require files
const Inquirer = require('inquirer');
const MySQL = require('mysql');

/// Link to mysql connection
const Connection = require('./connections.js');

// --------------------------- BEGINNING PROMPT --------------------------- //
Inquirer.prompt([{
    name: 'initialPrompt',
    message: 'What would you like to do?',
    type: 'list',
    choices: [{
        name: "Buyer",
        value: "buyer"
    }, {
        name: "Admin",
        value: "admin"
    }]
}]).then((data) => {
    // Log error
    if (!data.initialPrompt) {
        console.log("Whoah, something failed.");
        return;
    };
    // Call buyer function
    if (data.initialPrompt === "buyer") {
        buyer();
    };
    // Call admin function
    if (data.initialPrompt === "admin") {
        admin();
    };
});

// ---------------------------  ADMIN FUNCTION  --------------------------- //
var admin = function() {
    Inquirer.prompt([{
        name: 'operation',
        message: 'What would you like to do?',
        type: 'list',
        choices: [{
                name: "View All Products",
                value: "read"
            }, {
                name: "Add an Item",
                value: "add"
            },
            {
                name: "Remove an Item",
                value: "remove"
            }
        ]
    }]).then((data) => {
        // Log error
        if (!data.operation) {
            console.log("Whoah, something failed.");
            return;
        }
        // View All Products
        if (data.operation === "read") {
            console.log("================================================================");
            console.log("Available Products:");
            console.log("================================================================");
            Connection.queryAsync("SELECT * FROM bamazon")
                .then(data => data.forEach(item => console.log(`${item.item_id}. ${item.product_name} - Price: ${item.price} - Quantity: ${item.stock_quantity} - Dept: ${item.department_name} `)))
                .then(() => Connection.end());
        }
        // Add an item
        if (data.operation === "add") {
            const questions = [{
                    type: "text",
                    name: "product_name",
                    message: "What item would you like to add?"
                }, {
                    type: "text",
                    name: "department_name",
                    message: "What department?"
                },
                {
                    type: "text",
                    name: "price",
                    message: "What is the list price?"
                },
                {
                    type: "text",
                    name: "stock_quantity",
                    message: "What is the quantity?"
                },
            ];

            Inquirer.prompt(questions).then(data => {
                const insertQuery = "INSERT INTO bamazon ( product_name, department_name, price, stock_quantity ) VALUES (?, ?, ?, ?)";

                Connection.queryAsync(insertQuery, [data.product_name, data.department_name, data.price, data.stock_quantity])
                    .then(() => console.log("Item Added!"))
                    .then(() => Connection.end());
            })
        }
        // Remove an item
        if (data.operation === "remove") {
            // grab a list of all of our records - we'll need them!
            Connection.queryAsync("SELECT * FROM bamazon").then(response => {
                item = response.map(item => {
                    return {
                        name: `${item.product_name} - Price: ${item.price} - Quantity: ${item.stock_quantity}`,
                        value: item.item_id
                    }
                });

                Inquirer.prompt({
                        name: 'deleteChoice',
                        message: 'Which product would you like to delete?',
                        type: 'list',
                        choices: item
                    })
                    .then(data => Connection.queryAsync("DELETE FROM bamazon WHERE item_id = ?", [data.deleteChoice]))
                    .then(() => {
                        Connection.end();
                        console.log("Product Deleted!");
                    })
                    .catch(err => {
                        throw err
                    });
            });
        };
    });
};

// ---------------------------  BUYER FUNCTION  --------------------------- //
var buyer = function() {
    // Inquirer prompts 
    Inquirer.prompt([{
        name: 'operation',
        message: 'What would you like to do?',
        type: 'list',
        choices: [{
            name: "View All Products",
            value: "read"
        }, {
            name: "Purchase an Item",
            value: "buy"
        }]
    }]).then((data) => {
        // Log error
        if (!data.operation) {
            console.log("Whoah, something failed.");
            return;
        }
        // View All Products
        if (data.operation === "read") {
            console.log("================================================================");
            console.log("Available Products:");
            console.log("================================================================");
            Connection.queryAsync("SELECT * FROM bamazon")
                .then(data => data.forEach(item => console.log(`${item.item_id}. ${item.product_name} - Price: ${item.price} - Quantity: ${item.stock_quantity} - Dept: ${item.department_name} `)))
                .then(() => Connection.end());
        }
        // Purchase an Item
        if (data.operation === "buy") {
            // Query the database for all products
            Connection.queryAsync("SELECT * FROM bamazon").then(response => {
                // Map each item in bamazon
                item = response.map(item => {
                    return {
                        name: `${item.product_name} - Price: ${item.price} - Quantity: ${item.stock_quantity}`,
                        quantity: `${item.stock_quantity}`,
                        price: `${item.price}`,
                        value: item.item_id
                    }
                });
                // Store global variable for chosen product
                var userProductChoice = "";

                Inquirer.prompt({
                        name: 'productChoice',
                        message: `Which item would you like to purchase?`,
                        type: 'list',
                        choices: item
                    })
                    .then((data) => {
                        // Hold the item id of the chosen product
                        userProductChoice = data.productChoice;
                        console.log(userProductChoice);

                        Inquirer.prompt({
                                name: 'userQuantity',
                                message: 'How many would you like to purchase?',
                                type: 'integer',
                                item: data
                            })
                            .then(data => {
                                // Store the product info
                                var currentQuantity = parseInt(item[userProductChoice - 1].quantity);
                                var currentPrice = parseInt(item[userProductChoice - 1].price);

                                // Store user's desired quantity
                                var userQuantity = parseInt(data.userQuantity);

                                // Store total purchase price
                                var totalPurchase = (userQuantity * currentPrice).toLocaleString('en-US', {
                                    style: 'currency',
                                    currency: 'USD',
                                });
                                // Compare currentQuantity to userQuantity       
                                if (currentQuantity < userQuantity) {
                                    console.log("Insufficient quantity!")
                                }

                                if (currentQuantity >= userQuantity) {
                                    console.log("You owe: " + totalPurchase);

                                    var newQuantity = currentQuantity - userQuantity;

                                    Connection.queryAsync(
                                        "UPDATE bamazon SET stock_quantity = ? WHERE item_id = ?", [newQuantity, userProductChoice]
                                    );
                                }
                            })
                            .then(() => {
                                Connection.end();
                            })
                            .catch(err => {
                                throw err
                            });
                    });
            });
        };
    });
};