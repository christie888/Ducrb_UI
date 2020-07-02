import os

bind = '127.0.0.1:' + str(os.getenv('PORT', 9876))
proc_name = '172.26.16.8'
workers = 1