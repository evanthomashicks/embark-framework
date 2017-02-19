var colors = require('colors');
var shelljs = require('shelljs');

var fs = require('../../core/fs.js');
var utils = require('../../core/utils.js');

var GethCommands = require('./geth_commands.js');

var Blockchain = function(blockchainConfig, Client) {
  this.blockchainConfig = blockchainConfig;

  this.config = {
    geth_bin: this.blockchainConfig.geth_bin || 'geth',
    networkType: this.blockchainConfig.networkType || 'custom',
    genesisBlock: this.blockchainConfig.genesisBlock || false,
    datadir: this.blockchainConfig.datadir || false,
    mineWhenNeeded: this.blockchainConfig.mineWhenNeeded || false,
    rpcHost: this.blockchainConfig.rpcHost || 'localhost',
    rpcPort: this.blockchainConfig.rpcPort || 8545,
    rpcCorsDomain: this.blockchainConfig.rpcCorsDomain || false,
    networkId: this.blockchainConfig.networkId || 12301,
    port: this.blockchainConfig.port || 30303,
    nodiscover: this.blockchainConfig.nodiscover || false,
    mine: this.blockchainConfig.mine || false,
    account: this.blockchainConfig.account || {},
    whisper: (this.blockchainConfig.whisper === undefined) || this.blockchainConfig.whisper,
    maxpeers: ((this.blockchainConfig.maxpeers === 0) ? 0 : (this.blockchainConfig.maxpeers || 25)),
    bootnodes: this.blockchainConfig.bootnodes || "",
    rpcApi: (this.blockchainConfig.rpcApi || ['eth', 'web3', 'net']),
    vmdebug: this.blockchainConfig.vmdebug || false
  };

  this.client = new Client({config: this.config});
};

Blockchain.prototype.runCommand = function(cmd) {
  console.log(("running: " + cmd.underline).green);
  return shelljs.exec(cmd);
};

Blockchain.prototype.run = function() {
  console.log("===============================================================================".magenta);
  console.log("===============================================================================".magenta);
  console.log(("Embark Blockchain Using: " + this.client.name.underline).magenta);
  console.log("===============================================================================".magenta);
  console.log("===============================================================================".magenta);
  var address = this.initChainAndGetAddress();
  var mainCommand = this.client.mainCommand(address);
  this.runCommand(mainCommand);
};

Blockchain.prototype.initChainAndGetAddress = function() {
  var address = null, result;

  // ensure datadir exists, bypassing the interactive liabilities prompt.
  this.datadir = '.embark/development/datadir';
  fs.mkdirpSync(this.datadir);

  // copy mining script
  fs.copySync(utils.joinPath(__dirname, "/../js"), ".embark/development/js", {overwrite: true});

  // check if an account already exists, create one if not, return address
  result = this.runCommand(this.client.listAccountsCommand());
  if (result.output === undefined || result.output === '' || result.output.indexOf("Fatal") >= 0) {
    console.log("no accounts found".green);
    if (this.config.genesisBlock) {
      console.log("initializing genesis block".green);
      result = this.runCommand(this.client.initGenesisCommmand());
    }

    result = this.runCommand(this.client.newAccountCommand());
    address = result.output.match(/{(\w+)}/)[1];
  } else {
    console.log("already initialized".green);
    address = result.output.match(/{(\w+)}/)[1];
  }

  return address;
};

var BlockchainClient = function(blockchainConfig, client) {
  if (client === 'geth') {
    return new Blockchain(blockchainConfig, GethCommands);
  } else {
    throw new Error('unknown client');
  }
};

module.exports = BlockchainClient;
