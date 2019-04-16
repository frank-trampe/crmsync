var program = require("commander");
const requestp = require("request-promise-native");
const frankenlib = require("frankenlib");
const hslib = require("hubspotjs");
const orlib = require("outreachjs");
const hsorbridge = require("hubspotoutreachbridge");
const fs = require("fs");
const express = require("express");
const bodyParser = require("body-parser");
const url = require('url');
const hbexpress = require('express-handlebars');
const bottleneck = require('bottleneck');

function errPass(err) { return Promise.reject(err); }

function emailDomain(address) {
	return frankenlib.email_domain(address);
}

function arrayToDict(arrayData, keyName) {
	return frankenlib.array_to_dict(arrayData, keyName);
}

function dictToArray(dictData, keyName) {
	return frankenlib.dict_to_array(dictData, keyName);
}

function checkPathInDict(dict, dPath) {
	return frankenlib.check_path_in_dict(dict, dPath);
}

function makeQueryString(exso) {
	return frankenlib.make_query_string(exso);
}

function divideArray(flatArray, divisionSize) {
	return frankenlib.divide_array(flatArray, divisionSize);
}

function undivideArray(slicesArray) {
	return frankenlib.undivide_array(slicesArray);
}

var sampleStages = [ { type: 'stage',
    id: 2,
    attributes: 
     { color: '#46d6db',
       createdAt: '2017-09-08T14:20:32.000Z',
       name: 'Cold Lead',
       order: 2,
       updatedAt: '2017-09-08T14:23:54.000Z' },
    relationships: { creator: {}, prospects: {}, updater: {}},
    links: { self: 'https://app1c.outreach.io/api/v2/stages/2' } },
  { type: 'stage',
    id: 3,
    attributes: 
     { color: '#5484ed',
       createdAt: '2017-09-08T14:21:12.000Z',
       name: 'Warm Lead',
       order: 3,
       updatedAt: '2017-09-08T14:23:54.000Z' },
    relationships: { creator: {}, prospects: {}, updater: {}},
    links: { self: 'https://app1c.outreach.io/api/v2/stages/3' } },
  { type: 'stage',
    id: 4,
    attributes: 
     { color: '#fbd75b',
       createdAt: '2017-09-08T14:21:31.000Z',
       name: 'Pitched Lead',
       order: 4,
       updatedAt: '2017-09-08T14:23:54.000Z' },
    relationships: { creator: {}, prospects: {}, updater: {}},
    links: { self: 'https://app1c.outreach.io/api/v2/stages/4' } },
  { type: 'stage',
    id: 5,
    attributes: 
     { color: '#ffb878',
       createdAt: '2017-09-08T14:21:55.000Z',
       name: 'Declined',
       order: 5,
       updatedAt: '2017-09-08T14:23:54.000Z' },
    relationships: { creator: {}, prospects: {}, updater: {}},
    links: { self: 'https://app1c.outreach.io/api/v2/stages/5' } },
  { type: 'stage',
    id: 6,
    attributes: 
     { color: '#51b749',
       createdAt: '2017-09-08T14:22:12.000Z',
       name: 'Purchased',
       order: 6,
       updatedAt: '2017-09-08T14:23:54.000Z' },
    relationships: { creator: {}, prospects: {}, updater: {}},
    links: { self: 'https://app1c.outreach.io/api/v2/stages/6' } },
  { type: 'stage',
    id: 7,
    attributes: 
     { color: '#dc2127',
       createdAt: '2017-09-08T14:22:26.000Z',
       name: 'Disappeared',
       order: 7,
       updatedAt: '2017-09-08T14:23:54.000Z' },
    relationships: { creator: {}, prospects: {}, updater: {}},
    links: { self: 'https://app1c.outreach.io/api/v2/stages/7' } } ];

var hubspotStages = ["subscriber", "lead", "marketingqualifiedlead", "salesqualifiedlead", "opportunity", "customer", "evangelist"];

function runWebAPI(outreachTokenNew, hubspotToken, opts) {
	var wapp = express();
	wapp.use(bodyParser.urlencoded({ extended: true }));
	wapp.use(bodyParser.json());
	var key = null;
	if ("webKey" in opts && opts.webKey) key = opts.webKey;

	var port = opts.webPort || 8080;        // set our port
	console.log("Port is " + port + ".");
	wapp.engine('hbexpress', hbexpress(/*{defaultLayout: 'main'}*/));
	wapp.set('view engine', 'hbexpress');
	var apiRouter = express.Router();

	apiRouter.get('/', function(req, res) {
		if (!key || ("webKey" in req.query && key == req.query.webKey)) {
			return res.json({ message: 'Authentication is valid.' });
		} else {
			return res.json({ message: 'Authentication is invalid.' });
		}
	});
	apiRouter.post('/operation', function(req, res) {
		if (!key || ("webKey" in req.body && key == req.body.webKey)) {
			if ("operation" in req.body) {
				var topts = {};
				topts.writeEnable = 0;
				topts.hubspot = opts.hubspot;
				topts.outreach = opts.outreach;
				if ("writeEnable" in opts && opts.writeEnable && "write" in req.body && req.body.write)
					topts.writeEnable = 1;
				if ("recent" in req.body && req.body.recent) {
					topts.recentOnly = 1;
					var td = new Date();
					topts.cutDate = new Date(td.valueOf() - 30 * 24 * 60 * 60 * 1000);
				}
				if (req.body.operation == "import") {
					return hsorbridge.outreachImportAdjust(outreachTokenNew, hubspotToken, topts)
					.then(function (rv) {
						res.json(rv);
					}, function (err) {
						console.log(err);
						res.json({ message: 'There was an error.' });
					});
				} else if (req.body.operation == "campaign") {
					return hsorbridge.outreachPreCampaignAdjust(outreachTokenNew, hubspotToken, topts)
					.then(function (rv) {
						res.json(rv);
					}, function (err) {
						console.log(err);
						res.json({ message: 'There was an error.' });
					});
				} else {
					return res.json({ message: 'Operation is invalid.' });
				}
			} else {
				return res.json({ message: 'Operation is not specified.' });
			}
		} else {
			return res.json({ message: 'Authentication is invalid.' });
		}
	});

	wapp.use('/api', apiRouter);

	var humanRouter = express.Router();
	humanRouter.get('/compose', function(req, res) {
		var hbos = {};
		if ("writeEnabled" in opts && opts.writeEnabled) hbos.canWrite = 1;
		if ("webKey" in req.query && key == req.query.webKey) {
			hbos.webKey = key;
			// Use handlebars to render a page with the key injected.
			return res.render('compose', hbos,
				function (err, html) {
					if (err) {
					        console.log(err);
					        res.status(500).end();
					} else {
					        res.send(html);
					}
				}
			);
		} else if (!key) {
			return res.render('compose', hbos,
				function (err, html) {
					if (err) {
					        console.log(err);
					        res.status(500).end();
					} else {
					        res.send(html);
					}
				}
			);
		} else {
			return res.send("<html><head><title>Not authorized</title></head><body>The key is missing or wrong.</body></html>");
		}
	});

	wapp.use('/human', humanRouter);

	wapp.listen(port);
	return wapp;
}

if (1) {
	var opts = {outreach: {}, hubspot: {}};
	opts.outreach.stagesTerminalNames = [];
	opts.outreach.stagesTerminalIds = [];
	opts.outreach.stageMap = {highStageCompany: {name: "Company is SQL+ in HubSpot"}, contactListed: {name: "Already in HubSpot"}};
	// These are necessary if we move to version 2 of the Hubspot API.
	// opts.outreach.stageMap.highStageCompany.id
	// opts.outreach.stageMap.contactListed.id
	opts.hubspot.stages = hubspotStages;
	opts.hubspot.stageHighIndex = 3;
	program
	    .option('--outreach-application <applicationfile>', 'Application parameters for Outreach')
	    .option('--outreach-token <tokenfile>', 'Access token for Outreach')
	    .option('--outreach-token-new <tokenfile>', 'Updated access token for Outreach')
	    .option('--hubspot-token <tokenfile>', 'Access token for Hubspot')
	    .option('--hubspot-queries-per-second <dumpfile>', 'Rate limit for Hubspot')
	    .option('--operation <operation>', 'Which operation (import or campaign or web)')
	    .option('--dump-file <dumpfile>', 'File into which to dump data')
	    .option('--web-key <key>', 'A key to use for restricting API access')
	    .option('--cut-date <date>', 'The timestamp cut-off for records to examine (Outreach)')
	    .option('--recent-only <operation>', 'Examine only recent records (Hubspot)')
	    .option('--write <flag>', 'Whether to write data')
	    .option('--debug <flag>', 'Whether to print data')
	    .parse(process.argv);
	var outreachApplication = null;
	var outreachTokenOld = null;
	var outreachTokenNew = null;
	var hubspotToken = null;
	if ("debug" in program && program.debug) opts.debug = 1;
	if ("write" in program && program.write) opts.writeEnable = 1;
	if ("outreachApplication" in program && program.outreachApplication) {
		var outreachApplicationBuffer = fs.readFileSync(program.outreachApplication);
		if (outreachApplicationBuffer) outreachApplication = JSON.parse(outreachApplicationBuffer);
	}
	if ("outreachToken" in program && program.outreachToken) {
		var outreachTokenBuffer = fs.readFileSync(program.outreachToken);
		if (outreachTokenBuffer) outreachTokenOld = JSON.parse(outreachTokenBuffer);
	}
	if ("hubspotToken" in program && program.hubspotToken) {
		var hubspotTokenBuffer = fs.readFileSync(program.hubspotToken);
		if (hubspotTokenBuffer) hubspotToken = JSON.parse(hubspotTokenBuffer);
	}
	if ("cutDate" in program && program.cutDate) {
		var td = new Date(program.cutDate);
		opts.cutDate = td;
	}
	if ("recentOnly" in program && program.recentOnly) {
		var tv = new Number(program.recentOnly);
		opts.recentOnly = tv;
	}
	if ("webKey" in program && program.webKey && typeof(program.webKey) == "string") {
		opts.webKey = program.webKey;
	}
	if ("hubspotQueriesPerSecond" in program && typeof(program.hubspotQueriesPerSecond) == "string" &&
			!isNaN(program.hubspotQueriesPerSecond)) {
		var tv = new Number(program.hubspotQueriesPerSecond);
		opts.hubspot.scheduler = new bottleneck(tv, 1000);
	}
	var tokenJob = null;
	// Refresh the outreach token if invalid.
	if (outreachTokenOld && !orlib.outreachTokenCheckValid(outreachTokenOld)) {
		tokenJob = orlib.outreachTokenRefresh(outreachApplication, outreachTokenOld);
	} else {
		tokenJob = Promise.resolve(outreachTokenOld);
	}
	return tokenJob
	.then(function (ort) {
		outreachTokenNew = ort;
		if ("outreachTokenNew" in program) {
			fs.writeFileSync(program.outreachTokenNew, JSON.stringify(outreachTokenNew));
		}
		if ("operation" in program) {
			if (program.operation == "import")
				return hsorbridge.outreachImportAdjust(outreachTokenNew, hubspotToken, opts)
				.then(
					function (rv) {
						if ("dumpFile" in program && typeof(program.dumpFile) == "string" &&
								program.dumpFile.length > 0) {
							console.log("Dumping.");
							fs.writeFileSync(program.dumpFile, JSON.stringify(rv));
						}
						return rv;
					}, function (err) {
						console.log(err);
						if ("details" in err) console.log(JSON.stringify(err.details));
						return Promise.reject(err);
					}
				);
			else if (program.operation == "campaign")
				return hsorbridge.outreachPreCampaignAdjust(outreachTokenNew, hubspotToken, opts)
				.then(
					function (rv) {
						if ("dumpFile" in program && typeof(program.dumpFile) == "string" &&
								program.dumpFile.length > 0) {
							console.log("Dumping.");
							fs.writeFileSync(program.dumpFile, JSON.stringify(rv));
						}
						return rv;
					}, function (err) {
						console.log(err);
						if ("details" in err) console.log(JSON.stringify(err.details));
						return Promise.reject(err);
					}
				);
			else if (program.operation == "dump")
				return hsorbridge.hubspotOutreachDump(outreachTokenNew, hubspotToken, opts)
				.then(
					function (rv) {
						if ("dumpFile" in program && typeof(program.dumpFile) == "string" &&
								program.dumpFile.length > 0) {
							console.log("Dumping.");
							fs.writeFileSync(program.dumpFile, JSON.stringify(rv));
						} else {
							console.log("No dump file specified.");
						}
						return rv;
					}, function (err) {
						console.log(err);
						if ("details" in err) console.log(JSON.stringify(err.details));
						return Promise.reject(err);
					}
				);
			else if (program.operation == "web")
				return runWebAPI(outreachTokenNew, hubspotToken, opts)
				.then(function (rv) { return rv; }, function (err) { console.log(err); return Promise.reject(err); });
			return Promise.reject(new Error("Unrecognized operation."));
		}
		return Promise.resolve(0);
	});
}

