# This file is part of the xtaddrver Package for xTuple ERP,
# and is Copyright (c) 1999-2018 by OpenMFG LLC, d/b/a xTuple.
# It is licensed to you under the Common Public Attribution License
# version 1.0, the full text of which (including xTuple-specific Exhibits)
# is available at www.xtuple.com/CPAL.  By using this software, you agree
# to be bound by its terms.

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

