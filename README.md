# bpnote_monaca_app

## Overview
This is mobile app for recording daily 'blood pressure' for your health control.  



## Features
- Daily blood pressure (high / low) and pulse value can be recorded into your device. (No server storage and cloud service needed)  
- In addition, can check and record 'whether taken medicice' if you must do.  
- Monthly report can be shown as a table and chart.
- All data will be stored into 'web database (IndexedDB) using [PouchDB](https://pouchdb.com/).

## Usage
This software was designed for [Monaca](https://ja.monaca.io/).  
You need to prepare Monaca development environment to build this app.  
This project uses browserify, so you must use local environment (Monaca CLI) if you want to modify any .js code.
(Cloud IDE will not suitable for this project)
