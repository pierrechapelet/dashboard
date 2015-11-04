#!/usr/bin/env python 
# -*- coding: utf-8 -*- 
#
#   generatejsonfiles
#   v 0.1
#
#   Usage: 
#   
#

import sys
sys.path.insert(0, '/opt/local/Library/Frameworks/Python.framework/Versions/3.4/lib/python3.4/site-packages')
import pymssql
import json
import collections

# Parameters
mssql_server = '172.16.159.129'
mssql_user = 'pierre'
mssql_password = 'pierre'
mssql_database = 'Domain20142015'

def getDataRows():
    with pymssql.connect(mssql_server, mssql_user, mssql_password, mssql_database) as conn:
        with conn.cursor(as_dict=True) as cursor:
            cursor.execute('SELECT * FROM xx_schools20142015')
            result = cursor.fetchall()
            return result

def convertToJsonFile(rows):
    # Conver to key-value pairs
    objects_list = []
    for row in rows:
        d = collections.OrderedDict()
        for (k, v) in row.items():
            d[k] = v
        objects_list.append(d)
    #print(objects_list)    
    
    #objects_file = 'schools20142015.json'
    #with open(objects_file, 'w', encoding='utf8') as outfile:
    #    json.dump(objects_list, outfile, sort_keys = True, ensure_ascii=False, indent=4)

    json_objects = json.dumps(objects_list, sort_keys = True, ensure_ascii=False, indent=4)
    return json_objects

    #print('Done.')



if __name__ == '__main__':
    print("#############################################")
    print("            Eduwave Data Migrator            ")
    print("#############################################")
    
    convertToJsonFile(getDataRows())

