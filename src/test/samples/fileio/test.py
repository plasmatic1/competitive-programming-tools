import os
import sys

def deb(s, c):
    print('%s: %s' % (s, c))

deb('os.getcwd()', os.getcwd())
deb('__file__', __file__)
deb('sys.argv[0]', sys.argv[0])
