/*
  This file is part of the xtaddrver Package for xTuple ERP,
  and is Copyright (c) 1999-2018 by OpenMFG LLC, d/b/a xTuple.
  It is licensed to you under the Common Public Attribution License
  version 1.0, the full text of which (including xTuple-specific Exhibits)
  is available at www.xtuple.com/CPAL.  By using this software, you agree
  to be bound by its terms.
*/

(function () {
  var mode = mywindow.mode("MaintainAddressValidationSetup", "ViewAddressValidationSetup");
  mywindow.insert(qsTr("Address Validation"), "configureAV", setup.Configure, Xt.SystemModule, mode, mode);

})();
