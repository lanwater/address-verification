/*
  This file is part of the xtaddrver Package for xTuple ERP,
  and is Copyright (c) 1999-2018 by OpenMFG LLC, d/b/a xTuple.
  It is licensed to you under the Common Public Attribution License
  version 1.0, the full text of which (including xTuple-specific Exhibits)
  is available at www.xtuple.com/CPAL.  By using this software, you agree
  to be bound by its terms.
*/

var xtaddrver = (function () {
  var result = { xml2js: xml2js, js2xml: js2xml };

  function xml2js(input)
  {
    try {
      if ((input + "").indexOf("QDom") != 0 &&
          (input + "").indexOf("[QDom") != 0)
      {
        var doc  = new QDomDocument();
        var err  = new Object();
        var line = 0;
        var col  = 0;
        if (! doc.setContent(input, false, err, line, col))
          throw "error reading XML at " + line + ":" + col + "\n" + err;
        input = doc;
      }

      var attribute = input.attributes();
      var nodename = tagToIdentifier(input.nodeName());
      var xmlattribute;
      var xmltag = nodename;

      if (attribute.size() > 0)
      {
        xmlattribute = new Object();
        for (var attr = 0; attr < attribute.size(); attr++)
          xmlattribute[tagToIdentifier(attribute.item(attr).toAttr().name())] =
                                      attribute.item(attr).toAttr().value();
      }

      var child = input.childNodes();
      var seq = 0;
      var output = new Object();

      for (var i = 0; i < child.size(); i++)
      {
        var childtag = tagToIdentifier(child.at(i).nodeName());
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
          output[childtag][seq] = xml2js(child.at(i));
          if (output[childtag][seq])
            output[childtag][seq].xmltag = childtag;
          seq = seq + 1;
        }
        else if (child.size() > 1 &&
                 i > 0 &&
                 child.at(i).nodeName() == child.at(i - 1).nodeName())
        {
          output[childtag][seq] = xml2js(child.at(i));
          if (output[childtag][seq])
            output[childtag][seq].xmltag = childtag;
          seq = seq + 1;
        }
        else
        {
          output[childtag] = xml2js(child.at(i));
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
      QMessageBox.critical(mywidget, "Address Validation Error",
                              "Error converting XML to JSON @ "
                              + e.lineNumber + ": " + e);
    }
  }

  function js2xml(input, inputname, namespace, level)
  {
    try {
    if (input == null)
      return "";

    if (level == null)
      level = 0;

    var tag = identifierToTag(input.xmltag == null ? inputname : input.xmltag,
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

    if (! hasXMLChildren(input, namespace))
    {
      output += indent + "<" + tag + xmlattribute;
      if ((input + "").indexOf("[") != 0)
        output += ">" + input + "</" + tag + ">\n";
      else
        output += "/>\n"
    }
    else
    {
      if (input instanceof Array)
      {
        for (var i = 0; i < input.length; i++)
          output += js2xml(input[i], input[i].xmltag, namespace, level + 1);
      }
      else if (typeof input == "object")
      {
        output += indent + "<" + tag + xmlattribute + ">\n";
        for (var j in input)
          output += js2xml(input[j], j, namespace, level + 1);
        if (input.xmltext != null)
          output += indent + "  " + input.xmltext + "\n";
        output += indent + "</" + tag + ">\n";
      }
    }

    return output;
    }
    catch(e) {
      QMessageBox.critical(mywidget, "Address Validation Error",
                              "Error converting JSON to XML @ "
                              + e.lineNumber + ": " + e);
    }
  }

  function hasXMLChildren(object, namespace)
  {
    try {
      if (object.xmltext != null)
        return true;

      else if (namespace instanceof Array)
      {
        for (var i in namespace)
          if (hasXMLChildren(object, namespace[i]))
            return true;
      }
      else if (namespace instanceof Object)
        return hasXMLChildren(object, namespace.ns);
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
      QMessageBox.critical(mywidget, "Address Validation Error",
                              "Error in hasXMLChildren @ "
                              + e.lineNumber + ": " + e);
    }
  }

  function tagToIdentifier(tag)
  {
    if (tag == "#text")
      return "xmltext";

    var nsidx = tag.indexOf(":");
    if (nsidx > 0)
      return tag.substring(0, nsidx) + "_" + tag.substring(nsidx + 1);
    else
      return tag;
  }

  function identifierToTag(identifier, namespace)
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
      QMessageBox.critical(mywidget, "Address Validation Error",
                              "Error in identifierToTag @ "
                              + e.lineNumber + ": " + e);
    }
  }

  return result;
})();

// copied from _ (underscore) to allow require()
if (typeof exports !== 'undefined') {
  if (typeof module !=== 'undefined' && module.exports) {
    exports = module.exports = xtaddrver;
  }
  exports.xtaddrver = xtaddrver;
}
