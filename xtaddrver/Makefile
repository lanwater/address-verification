# This file is part of the xtaddrver Package for xTuple ERP,
# and is Copyright (c) 1999-2017 by OpenMFG LLC, d/b/a xTuple.  It
# is licensed to you under the xTuple End-User License Agreement ("the
# EULA"), the full text of which is available at www.xtuple.com/EULA.
# While the EULA gives you access to source code and encourages your
# involvement in the development process, this Package is not free
# software.  By using this software, you agree to be bound by the
# terms of the EULA.

VER = $(shell awk '/version *=/ { split($$0, ary, "[\"= ]*");	\
                                  for (i in ary) {		\
				    if (ary[i] == "version") {	\
				      print ary[i + 1] ; exit;	\
				    } } }' package.xml | tr "[A-Z]" "[a-z]")
PKG = xtaddrver
TAROPTS = -h --exclude Makefile --exclude .\*

all: ../packages/$(PKG)-$(VER).gz

../packages/$(PKG)-$(VER).gz: FORCE
	-[ `uname -s` = Linux ]
	cd .. && tar czf packages/$(PKG)-$(VER).gz $(TAROPTS) $(PKG)

FORCE:

