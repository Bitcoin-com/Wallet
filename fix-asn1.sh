#!/bin/bash
  
firstLine=`awk 'NR < 2 {print}' node_modules/asn1.js-rfc5280/index.js`

if [ "$firstLine" = "try {" ]; then
  echo "var asn1 = require('asn1.js');" > node_modules/asn1.js-rfc5280/index.new.js
  awk 'NR > 6 {print}' node_modules/asn1.js-rfc5280/index.js >> node_modules/asn1.js-rfc5280/index.new.js
  rm node_modules/asn1.js-rfc5280/index.js
  mv node_modules/asn1.js-rfc5280/index.new.js node_modules/asn1.js-rfc5280/index.js
  echo "node_modules/asn1.js-rfc5280/index.js fixed"
fi