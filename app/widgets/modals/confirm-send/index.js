'use strict';

var Ractive = require('widgets/modals/base');
var emitter = require('lib/emitter');
var getWallet = require('lib/wallet').getWallet;
var parseHistoryTx = require('lib/wallet').parseHistoryTx;
var toAtom = require('lib/convert').toAtom;
var toUnitString = require('lib/convert').toUnitString;
var bitcoin = require('cs-wallet').bitcoin;
var showInfo = require('widgets/modals/flash').showInfo;
var getTokenNetwork = require('lib/token').getTokenNetwork;

var minTransactionFee = 100000000;
var minFeePerByte = 100000;

function open(data) {

  var ractive = new Ractive({
    partials: {
      content: require('./_content.ract')
    },
    data: extendData(data)
  });

  ractive.on('send', function(){
    ractive.set('sending', true);
    var to = ractive.get('to');
    var fee = toAtom(ractive.get('fee'));
    var value = toAtom(ractive.get('amount'));
    var wallet = getWallet();
    var tx = null;
    var importTxOptions = ractive.get('importTxOptions');

    try {
      if (importTxOptions) {
        importTxOptions.unspents.pop();
        importTxOptions.fee = fee;
        tx = [wallet.createImportTx(importTxOptions)];
      } else {
        console.log("to:" + to + "\nval:" + value + "\nfee:" + fee)
        console.log("bal:" + wallet.getBalance())
        tx = wallet.createTx(to, value, fee);
      }
    } catch(err) {
      if (err.message.match(/Insufficient funds/)) {
        ractive.set('sending', false);
        return showInfo({message: 'Please choose lower fee.', title: 'Insufficient funds'});
      }
      return handleTransactionError(err);
    }
    tx.forEach(function(tx) {
      wallet.sendTx(tx, function (err, historyTx) {
        if (err) return handleTransactionError(err);
  
        ractive.set('confirmation', false);
        ractive.set('success', true);
        ractive.set('onDismiss', ractive.get('onSuccessDismiss'));
  
        // update balance & tx history
        emitter.emit('wallet-ready');
        if (historyTx) {
          emitter.emit('append-transactions', [parseHistoryTx(historyTx)]);
        }
        //updateUrl();
      });
    });
  });

  function handleTransactionError(err) {
    console.error(err);
    ractive.set('confirmation', false)
    ractive.set('error', err.message)
  }

  return ractive
}

function updateUrl(){
  var loc = window.location.search
  loc = loc.split('&')
  if (loc.length > 2) {
    window.location.href = loc[0]
  }
  return 0
}

function extendData(data) {

  var network = getTokenNetwork();

  data.confirmation = true;
  data.isEthereum = network === 'ethereum';
  data.isBitcoin = network === 'bitcoin' || network === 'testnet';
  data.isBitcoinCash = network === 'bitcoincash';
  data.isLitecoin = network === 'litecoin';
  data.isSmileycoin = network === 'smileycoin';
  data.feeSign = data.importTxOptions ? '-' : '+';

  var wallet = getWallet();
  var feeRates = null;
  var fees = null;
  var unspents = data.importTxOptions ? data.importTxOptions.unspents : null;

  if (data.isBitcoin) {
    var defaultFeePerKb = data.dynamicFees.minimum * 1000 || bitcoin.networks['bitcoin'].feePerKb;

    feeRates = [
      defaultFeePerKb,
      data.dynamicFees.hour * 1000 || defaultFeePerKb,
      data.dynamicFees.fastest * 1000 || defaultFeePerKb
    ];
    fees = wallet.estimateFees(data.to, toAtom(data.amount), feeRates, unspents);

    data.feeMinimum = toUnitString(fees[0]);
    data.feeHour = toUnitString(fees[1]);
    data.feeFastest = toUnitString(fees[2]);
    data.fee = data.feeHour;

    data.onFocus = function() {
      this.find('.js-fee-dropdown').selectedIndex = 1; // fix issue when values are the same
    }

  } else if (data.isBitcoinCash) {
    feeRates = [data.dynamicFees.minimum * 1000 || bitcoin.networks['bitcoincash'].feePerKb];
    fees = wallet.estimateFees(data.to, toAtom(data.amount), feeRates, unspents);
    data.fee = toUnitString(fees[0]);

  } else if (data.isLitecoin) {
    feeRates = [data.dynamicFees.minimum * 1000 || bitcoin.networks['litecoin'].feePerKb];
    fees = wallet.estimateFees(data.to, toAtom(data.amount), feeRates, unspents);
    data.fee = toUnitString(fees[0]);

  } else if (data.isSmileycoin) {
    feeRates = [bitcoin.networks['smileycoin'].feePerKb || 100000000];
    fees = Math.max(100000000, wallet.estimateFees(data.to, toAtom(data.amount), feeRates, unspents));
    data.fee = toUnitString(fees);

  } else if (data.isEthereum) {
    data.fee = toUnitString(wallet.getDefaultFee(), 18);
    data.feeDenomination = 'ETH';
  }

  return data;
}

module.exports = open
