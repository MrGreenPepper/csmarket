var pgp = require('pg-promise')();
var db = pgp('postgres://postgres:postgres@localhost:5432/csmarket');
const e = require('express');
var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/container', function (req, res, next) {
	res.send('csMarketHere');
});

router.get('/container/list', function (req, res, next) {
	try {
		db.multi('SELECT itemname FROM containercontent').then((data) => {
			data = data[0];
			data = data.map((entry) => {
				return { value: entry.itemname, label: entry.itemname };
				// return a new element
			});
			res.send(data);
		});
	} catch (error) {
		res.send(error);
	}
});

router.get('/container/statistics', function (req, res, next) {
	/*console.log(req.body);
	console.log(req.params);
	console.log(req.data);
	console.log(req);*/

	console.log(req.query);
	let itemname = req.query.itemName;
	try {
		db.multi('SELECT * FROM containercontent WHERE itemname = $1', [itemname]).then((data) => {
			data = data[0];
			res.send(data);
		});
	} catch (error) {
		res.send(error);
	}
});

module.exports = router;
