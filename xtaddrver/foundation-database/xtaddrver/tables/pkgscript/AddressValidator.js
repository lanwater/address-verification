/*
  This file is part of the xtaddrver Package for xTuple ERP,
  and is Copyright (c) 1999-2018 by OpenMFG LLC, d/b/a xTuple.
  It is licensed to you under the Common Public Attribution License
  version 1.0, the full text of which (including xTuple-specific Exhibits)
  is available at www.xtuple.com/CPAL.  By using this software, you agree
  to be bound by its terms.
*/

/** An "address validator" is a web service that accepts an encoded address
   and returns information about that address.
   The details of each service are described in a JavaScript structure.
   To add a new validator, create a script called "addressvalidator_name",
   where "name" is the name of the service (e.g. "usps", "ups").
   That script should add a property to the AddressValidator global
   (e.g. AddressValidator.USPS = {...}) with the following properties:
   - setup: an array of objects describing how to configure this validator
     + label:     text to display on setup window
     + metric:    the metric[enc]_name used to hold this configuration field
     + encrypted: true => store in metricenc, otherwise store in metric
     + default:   name of validator property storing the value or
                  a text string giving the default value of this metric
                  (e.g. If the validator has a property named "liveurl" and
                   setup contains "default": "liveurl", that property will
                   use the value in validator.liveurl if the metric is empty.
                   If the setup contains "default": "http://service.provider.com"
                   and the metric isn't set, then "http://service.provider.com"
                   will be used.
     + width:     A HACK holding the minimumSize() of the xlineedit
     + text:      static text to display, such as license agreement
   - servicecountry: An array of abbreviations for the countries this
                     validator serves (must match the country table)
   - buildAddress:   a function
                     input: an object describing the address
                     (resembles an addr record but only has properties
                     for the non-empty fields in the widget)
                     output: { urlstr: url, query: query } => http get
                             { urlstr: url, post: string } => http post
   - extractAddress: a function
                     input: an object describing the response from the service
                            (properties will be specific to the service)
                     output: { requestStatus: "unknown" }
                             or
                             { requestStatus: "error",
                               lastError: { text: message [, number: errnum ] }
                             }
                             or
                             { requestStatus: "good" or "warning"
                               addr: a typical addr record
                             }
 */

var AddressValidator = {
  /** Convenience function to convert an XML document to a JavaScript object */
  xml2js: function(input)
  {
    try {
      if ((input + "").indexOf("QDom") != 0 &&
          (input + "").indexOf("[QDom") != 0)
      {
        var doc  = new QDomDocument();
        var err  = {};
        var line = 0;
        var col  = 0;
        if (! doc.setContent(input, false, err, line, col))
          throw qsTr("error reading XML at %1:%2<br>%3").arg(line).arg(col).arg(err);
        input = doc;
      }

      var attribute = input.attributes();
      var nodename = this.tagToIdentifier(input.nodeName());
      var xmlattribute;
      var xmltag = nodename;

      if (attribute.size() > 0)
      {
        xmlattribute = {};
        for (var attr = 0; attr < attribute.size(); attr++)
          xmlattribute[this.tagToIdentifier(attribute.item(attr).toAttr().name())] =
                                      attribute.item(attr).toAttr().value();
      }

      var child = input.childNodes();
      var seq = 0;
      var output = {};

      for (var i = 0; i < child.size(); i++)
      {
        var childtag = this.tagToIdentifier(child.at(i).nodeName());
        if (child.at(i).isText())
        {
          output = new String(child.at(i).nodeValue().split(/\s+/).join(" "));
          output.xmltag = xmltag;
          seq = 0;
        }
        else
        if (child.size() > i + 1 &&
            child.at(i).nodeName() == child.at(i + 1).nodeName())
        {
          if (output[childtag] == null)
          {
            output[childtag] = new Array();
            output[childtag].xmltag = childtag;
          }
          output[childtag][seq] = this.xml2js(child.at(i));
          if (output[childtag][seq])
            output[childtag][seq].xmltag = childtag;
          seq = seq + 1;
        }
        else if (child.size() > 1 &&
                 i > 0 &&
                 child.at(i).nodeName() == child.at(i - 1).nodeName())
        {
          output[childtag][seq] = this.xml2js(child.at(i));
          if (output[childtag][seq])
            output[childtag][seq].xmltag = childtag;
          seq = seq + 1;
        }
        else
        {
          output[childtag] = this.xml2js(child.at(i));
          if (output[childtag]) {
            output[childtag].xmltag = childtag; }
          seq = 0;
        }
      }

      output.xmltag = xmltag;
      if (xmlattribute != null)
        output.xmlattribute = xmlattribute;
      return output;
    }
    catch (e) {
      QMessageBox.critical(mywidget, qsTr("Address Validation Error"),
                           qsTr("Error converting XML to JSON @ %1: %2")
                               .arg(e.lineNumber).arg(e.message));
    }
  },

  /** A convenience function to convert a JavaScript object to an XML document
      or fragment.
      This is a recursive function, calling itself to build XML fragments
      whenever the input object contains a child object.

      @param input     The JavaScript object
      @param inputname The name to give the XML document or fragment's root element
      @param namespace The XML namespace used to interpret the XML document's elements
      @param level     The level of indentation for the current fragment
   */
  js2xml: function(input, inputname, namespace, level)
  {
    try {
    if (input == null)
      return "";

    if (level == null)
      level = 0;

    var tag = this.identifierToTag(input.xmltag == null ? inputname : input.xmltag,
                              namespace);
    if (tag == null || tag.length == 0)
      return "";

    var indent = "";
    for (var i = 0; i < level; i++)
      indent += "  ";

    var output = "";


    var xmlattribute = "";
    if (input.xmlattribute != null)
      for (var i in input.xmlattribute)
        xmlattribute += ' ' + i + '="' + input.xmlattribute[i] + '"';

    if (! this.hasXMLChildren(input, namespace))
    {
      output += indent + "<" + tag + xmlattribute;
      if ((input + "").indexOf("[") != 0)
        output += ">" + input + "</" + tag + ">\n";
      else
        output += "/>\n";
    }
    else
    {
      if (input instanceof Array)
      {
        for (var i = 0; i < input.length; i++)
          output += this.js2xml(input[i], input[i].xmltag, namespace, level + 1);
      }
      else if (typeof input == "object")
      {
        output += indent + "<" + tag + xmlattribute + ">\n";
        for (var j in input)
          output += this.js2xml(input[j], j, namespace, level + 1);
        if (input.xmltext != null)
          output += indent + "  " + input.xmltext + "\n";
        output += indent + "</" + tag + ">\n";
      }
    }

    return output;
    }
    catch(e) {
      QMessageBox.critical(mywidget, qsTr("Address Validation Error"),
                           qsTr("Error converting JSON to XML @ %1: %2")
                               .arg(e.lineNumber).arg(e.message));
    }
  },

  hasXMLChildren: function(object, namespace)
  {
    try {
      if (object.xmltext != null)
        return true;

      else if (namespace instanceof Array)
      {
        for (var i in namespace)
          if (this.hasXMLChildren(object, namespace[i]))
            return true;
      }
      else if (namespace instanceof Object)
        return this.hasXMLChildren(object, namespace.ns);
      else if (namespace != null)
      {
        if (object instanceof Array)
        {
          if (object["xmltag"].indexOf(namespace + "_") == 0)
            return true;
        }
        else if (object instanceof Object)
        {
          for (var j in object)
          {
            if ((j + "").indexOf(namespace + "_") == 0)
              return true;
          }
        }
      }
      else
      {
        print("hasXMLChildren: namespace is empty!");
        if (object instanceof Array)
          return true;
        else if (object instanceof Object)
          return true;
      }

      return false;
    }
    catch(e) {
      QMessageBox.critical(mywidget, qsTr("Address Validation Error"),
                           qsTr("Error in hasXMLChildren @ %1: %2")
                               .arg(e.lineNumber).arg(e.message));
    }
  },

  tagToIdentifier: function(tag)
  {
    if (tag == "#text")
      return "xmltext";

    var nsidx = tag.indexOf(":");
    if (nsidx > 0)
      return tag.substring(0, nsidx) + "_" + tag.substring(nsidx + 1);
    else
      return tag;
  },

  identifierToTag: function(identifier, namespace)
  {
    try {
      if (namespace instanceof Array)
      {
        for (var i in namespace)
        {
          var nsidx = identifier.indexOf(namespace[i].ns + "_");
          if (nsidx == 0)
            return namespace[i].ns + ":" +
                   identifier.substring(namespace[i].ns.length + 1);
        }
        return null;
      }
      else if (namespace instanceof Object)
      {
        var nsidx = identifier.indexOf(namespace.ns + "_");
          if (nsidx == 0)
            return namespace.ns + ":" +
                   identifier.substring(namespace.ns.length + 1);
        return null;
      }
      else if (namespace != null)
      {
        var nsidx = identifier.indexOf(namespace + "_");
        if (nsidx == 0)
          return namespace + ":" + identifier.substring(namespace.length + 1);
        return null;
      }
      else
        return identifier;
    }
    catch(e) {
      QMessageBox.critical(mywidget, qsTr("Address Validation Error"),
                           qsTr("Error in identifierToTag @ %1: %2")
                               .arg(e.lineNumber).arg(e.message));
    }
  },

  /** Convenience function to wrap a key/value pair in XML <key>value</key>.
     It would be better to use a js2xml function that knows how to set attributes
    */
  wrap: function (key, value, attributes)
  {
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

  parseResponse: function (netreply)
  {
    DEBUG && print('parseResponse(', netreply, ') entered with', JSON.stringify(netreply));
    var result = {
      requestStatus: "error",
      lastError:     "unknown"
    };
    try {
      var replystr = ("readAll" in netreply)
                     ? netreply.readAll().toLatin1() + '' : JSON.stringify(netreply);

      switch (replystr[0]) {
        case '{': result = JSON.parse(replystr);  break;
        case '<': result = this.xml2js(replystr); break;
      }
    } catch (e) {
      QMessageBox.critical(mywidget, qsTr("AddressValidator Failure"),
                           qsTr("AddressValidator.parseResponse Error @ %1: %2")
                               .arg(e.lineNumber).arg(e.message));
      result.lastError = e.message ? e.message : qsTr("parseResponse exception");
    }
    DEBUG && print('parseResponse() returning', JSON.stringify(result));
    return result;
  }
};

(function () {
  // load all of the address validators we know about
  var qry = new QSqlQuery("SELECT script_name"
                        + "  FROM script"
                        + " WHERE script_name ~ '^addressvalidator_'"
                        + " ORDER BY script_order, script_name;");

  while (qry.next())
    include(qry.value("script_name"));  // this is wrong! is there a better way?
})();

// copied from _ (underscore) to allow require()
if (typeof exports !== 'undefined') {
  if (typeof module !== 'undefined' && module.exports) {
    exports = module.exports = AddressValidator;
  }
  exports.AddressValidator = AddressValidator;
}
