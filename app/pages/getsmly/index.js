'use strict';

var Ractive = require('lib/ractive')
var emitter = require('lib/emitter')
var CS = require('lib/wallet')

module.exports = function(el){
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      // address: '',
      // ip: '',
      // date: '',
      isPhonegap: process.env.BUILD_TYPE === 'phonegap'
    }
  })

  /*
  // Not needed when all the things below are not implemented
  emitter.on('wallet-ready', function(){
    ractive.set('address', getAddress())
    getIP()
    ractive.set('date', getDate())
  })
  */

  /*
  // Not needed unless we want to display address in html
  function getAddress(){
    return "wallet:" + CS.getWallet().getNextAddress()
  }
  */

  /*
  // Not needed unless we want to use date for some checks later
  function getDate(){
    return "date:" + new Date().getTime();
  }
  */

  /*
  // Not needed unless we want to use ip for some identifying later
  function getIP() {
    jQuery.getJSON('https://api.ipify.org?format=json', function(data){
      ractive.set('ip', "ip:"+data.ip)
    });
  }
  */
  
  document.getElementById("perks_check").addEventListener('click', function() {
    if (this.checked == true) {
      document.getElementById("get_perks_show").innerHTML = "Yes"
    }
    else {
      document.getElementById("get_perks_show").innerHTML = "No"
    }
  }, false);

  // just send the wallet address with the form, if perks is selected
  jQuery('.paypal_option').submit(function(e) {
    e.preventDefault()

    var list = document.getElementsByClassName('donate_form_info');
    var n;
    if ( document.getElementById("perks_check").checked == true) {
      for (n = 0; n < list.length; ++n) {
          list[n].value = "wallet:" + CS.getWallet().getNextAddress();
      }
    }
    else {
      for (n = 0; n < list.length; ++n) {
        list[n].value = "";
    }
    }
    
    this.submit();
  });


  return ractive
}
