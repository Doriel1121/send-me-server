const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
var mysql = require('mysql');
var cors = require('cors');
var bodyParser = require('body-parser');

var con = mysql.createConnection({
	host: 'firstdb.csjzksainsxv.us-east-2.rds.amazonaws.com',
	user: 'doriel',
	password: 'doriel123',
	database: 'sendme'
})

var insfunc = (clientId, body) => {
	var sql = "INSERT INTO Orders (Name, Phone, OrderData, Status, ClientId) VALUES ('" + body.Name + "', '" + body.Number + "', '" + JSON.stringify(body) + "', 1, " + clientId + ")";
	con.query(sql, function (err, result) {
		if (err) throw err;
		console.log("1 record inserted");
	});
}

var getOpenOrders = (clientId, callback) => {
	var sql = "SELECT Id, OrderData, Status FROM Orders WHERE Status != 0 AND ClientId = " + clientId;
	con.query(sql, function (err, result, fields) {
		if (err) throw err;
		console.log(result);
		callback(result);
	});
};

var updateToStatus = (orderId, statusId) => {
	console.log("Order id");
	console.log(orderId);
	var sql = "UPDATE Orders SET Status = " + statusId + " WHERE Id = " + orderId.id;
	con.query(sql, function (err, result) {
		if (err) throw err;
		console.log("updated row");
	});
};

var getAllItems = (clientId, callback) => {
	let sql = "SELECT * FROM Items WHERE Active = 1 AND ClientId = " + clientId;
	con.query(sql, function (err, result, fields) {
		if (err) throw err;
		callback(result);
	});
};

var updateItem = (itemId, newItem) => {
	var sql = "UPDATE Items SET Name = '" + newItem.Name + "', Price = '" + newItem.Price + "', Image = '" + newItem.Image + "', Units = '" + newItem.Units + "' WHERE Id = " + itemId;
	con.query(sql, function (err, result) {
		if (err) throw err;
		console.log("Updated item");
	});
};

var updateItemUnactive = (itemId) => {
	var sql = "UPDATE Items SET Active = '0' WHERE Id = " + itemId;
	con.query(sql, function (err, result) {
		if (err) throw err;
		console.log("Updated item");
	});
};

var insertItem = (clientId, Item) => {
	var sql = "INSERT INTO Items (Name, Price, Image, Active, Units, ClientId) VALUES ('" + Item.Name + "', '" + Item.Price + "', '" + Item.Image + "', 1, '" + Item.Units + "', " + clientId + ")";
	con.query(sql, function (err, result) {
		if (err) throw err;
		console.log("1 record inserted");
	});
};

var getOrderMin = (clientId, callback) => {
	let sql = "SELECT * FROM Config WHERE Name = 'OrderMin' AND ClientId = " + clientId;
	con.query(sql, function (err, result, fields) {
		if (err) throw err;

		callback(result[0]);
	});
};

var updateOrderMin = (clientId, newOrderMin) => {
	let sql = "UPDATE Config SET Value = '" + newOrderMin + "' WHERE Name = 'OrderMin' AND ClientId = " + clientId;
	con.query(sql, function (err, result) {
		if (err) throw err;
		console.log("Updated minimum");
	});
};

var requestHandler = (res, callback) => {
	try {
		callback();
	} catch (err) {
		console.log(err);
		res.status(500).send(err);
	}
}

express()
	.use(express.static(path.join(__dirname, 'public')))
	.use(cors())
	.use(bodyParser.urlencoded({
		extended: true
	}))
	.use(bodyParser.json())
	.use(bodyParser.raw())
	.get('/openOrders/:clientId', (req, res) => {
		requestHandler(res, () => {
			getOpenOrders(req.params.clientId, function (data) {
				res.send(data);
			});
		});
	})
	.get('/allItems/:clientId', (req, res) => {
		requestHandler(res, () => {
			getAllItems(req.params.clientId, function (data) {
				res.send(data);
			});
		});
	})
	.get('/orderMin/:clientId', (req, res) => {
		requestHandler(res, () => {
			getOrderMin(req.params.clientId, function (data) {
				res.send(data);
			});
		});
	})
	.post('/order/:clientId', (req, res) => {
		requestHandler(res, () => {
			insfunc(req.params.clientId, req.body);
			res.send('done')
		});
	})
	.post('/addItem/:clientId', (req, res) => {
		requestHandler(res, () => {
			insertItem(req.params.clientId, req.body);
			res.send('done')
		});
	})
	.post('/prepareOrder', (req, res) => {
		requestHandler(res, () => {
			updateToStatus(req.body, 2);
			res.send('done');
		});
	})
	.post('/closeOrder', (req, res) => {
		requestHandler(res, () => {
			updateToStatus(req.body, 0);
			res.send('done');
		});
	})
	.post('/updateItem', (req, res) => {
		requestHandler(res, () => {
			updateItem(req.body.Id, req.body.Item);
			res.send('done');
		});
	})
	.post('/updateOrderMin/:clientId', (req, res) => {
		requestHandler(res, () => {
			updateOrderMin(req.params.clientId, req.body.orderMin);
			res.send('done');
		});
	})
	.post('/deleteItem', (req, res) => {
		requestHandler(res, () => {
			updateItemUnactive(req.body.Id);
			res.send('done');
		});
	})
	.listen(PORT, () => console.log(`Listening on ${ PORT }`))