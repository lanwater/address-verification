/*
  This file is part of the xtaddrver Package for xTuple ERP,
  and is Copyright (c) 1999-2017 by OpenMFG LLC, d/b/a xTuple.  It
  is licensed to you under the xTuple End-User License Agreement ("the
  EULA"), the full text of which is available at www.xtuple.com/EULA.
  While the EULA gives you access to source code and encourages your
  involvement in the development process, this Package is not free
  software.  By using this software, you agree to be bound by the
  terms of the EULA.
*/

(function () {
  var mode = mywindow.mode("MaintainAddressValidationSetup", "ViewAddressValidationSetup");
  mywindow.insert(qsTr("Address Validation"), "configureAV", setup.Configure, Xt.SystemModule, mode, mode);

})();
