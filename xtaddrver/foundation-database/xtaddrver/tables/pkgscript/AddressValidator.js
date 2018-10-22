/*
  This file is part of the xtaddrver Package for xTuple ERP,
  and is Copyright (c) 1999-2018 by OpenMFG LLC, d/b/a xTuple.  It
  is licensed to you under the xTuple End-User License Agreement ("the
  CPAL"), the full text of which is available at www.xtuple.com/EULA.
  While the CPAL gives you access to source code and encourages your
  involvement in the development process, this Package is not free
  software.  By using this software, you agree to be bound by the
  terms of the CPAL.
*/

/**An "address validator" is a web service that accepts an encoded address
 * and returns information about that address.
 * The details of each service are described in a JavaScript structure.
 * To add a new validator, create a script called "addressvalidator_name",
 * where "name" is the name of the service (e.g. "usps", "ups").
 * That script should add a property to the AddressValidator global
 * (e.g. AddressValidator.USPS = {...}) with the following properties:
 * - setup: an array of objects describing how to configure this validator
 *   + label:     text to display on setup window
 *   + metric:    the metric[enc]_name used to hold this configuration field
 *   + encrypted: true => store in metric[enc], otherwise store in metric
 *   + default:   name of validator property storing the value or
 *                a text string giving the default value of this metric
 *                (e.g. If the validator has a property named "liveurl" and
 *                 setup contains "default": "liveurl", that property will
 *                 use the value in validator.liveurl if the metric is empty.
 *                 If the setup contains "default": "http://service.provider.com"
 *                 and the metric isn't set, then "http://service.provider.com"
 *                 will be used.
 *   + width:     A HACK holding the minimumSize() of the xlineedit
 *   + text:      static text to display, such as license agreement
 * - buildAddress:   a function
 *                   input: an object describing the address
 *                   (resembles an addr record but only has properties
 *                   for the non-empty fields in the widget)
 *                   output: { urlstr: url, query: query } => http get
 *                           { urlstr: url, post: string } => http post
 * - extractAddress: a function
 *                   input: an object describing the response from the service
 *                          (properties will be specific to the service)
 *                   output: { requestStatus: "unknown" }
 *                           or
 *                           { requestStatus: "error",
 *                             lastError: { text: message [, number: errnum ] }
 *                           }
 *                           or
 *                           { requestStatus: "good" or "warning"
 *                             addr: a typical addr record
 *                           }
 */

var AddressValidator = {
  // convenience function to wrap a key/value pair in XML <key>value</key>
  // better to use a js2xml functionthat knows how to set attributes
  wrap: function (key, value, attributes) {
    var attributeString = "";
    if (Array.isArray(attributes))
      attributeString = attributes.map(function (e) {
                                         if (e.key && e.value)
                                           return e.key + '="' + e.value + '"';
                                         else if (typeof e == "string")
                                             return e;
                                         return String(e);
                                       })
                                  .join(" ");

    return '<' + key
               + ( attributeString ? (' ' + attributeString) : '')
               + '>' + value + '</' + key + '>';
  },
  // convenience function to read a URL from the metrics table or its default
  getUrl: function (metricname, validator, label)
  {
    var urlsetup;
    var result = metrics.value(metricname).trim();

    if (! result)
      metricsenc.value(metricname).trim();

    if (! result)
    {
      urlsetup = validator.setup.filter(function (e) { return e.label == (label || "URL"); });
      result = urlsetup[0]["default"];
      if (result in validator)
        result = validator[result];
    }

    return result;
  },

  parseResponse: function (netreply) {
    try {
// this is so wrong!
var xtaddrver;
include("xtaddrver-utils");
      var result = {
        requestStatus: "error",
        lastError: "not yet implemented"
      };
      var replystr = ("readAll" in netreply)
                     ? netreply.readAll().toLatin1() + '' : netreply;

      switch (replystr[0]) {
        case '{': result = JSON.parse(replystr); break;
        case '<': result = xtaddrver.xml2js(replystr);     break;
      }

      return result;
    } catch (e) {
      QMessageBox.critical(mywidget, "AddressValidator Failure",
                           "AddressValidator.parseResponse Error @ "
                           + e.lineNumber + ": " + e.message);
    }
  }
};

(function () {
  // load all of the address validators we know about
  var qry = new QSqlQuery("SELECT script_name"
                        + "  FROM script"
                        + " WHERE script_name ~ '^addressvalidator_'"
                        + " ORDER BY script_order, script_name;");

  while (qry.next())
    include(qry.value("script_name"));
})();
