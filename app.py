#!/usr/bin/env python 
# -*- coding: utf-8 -*- from /opt/local/Library/Frameworks/Python.framework/Versions/3.4/lib/python3.4/site-packages/flask import Flask
# use python pathtofolder/dashboard/app.py to run the server instance

import sys
sys.path.insert(0, '/opt/local/Library/Frameworks/Python.framework/Versions/3.4/lib/python3.4/site-packages')
from flask import Flask
from flask import render_template
import generatejsonfiles

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")
    #return render_template("index.html")


@app.route("/emisdata/schools")
def emisdata_schools():
    return generatejsonfiles.convertToJsonFile(generatejsonfiles.getDataRows())
    

if __name__ == "__main__":
    app.run(host='127.0.0.1',port=5000,debug=True)