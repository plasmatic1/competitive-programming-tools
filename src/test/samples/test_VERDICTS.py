import time
import sys

type = int(input())

if type == 1:
    print('AC') # AC
elif type == 2:
    print('WA') # WA
elif type == 3:
    time.sleep(999) # TLE
elif type == 4:
    print('AC')
    time.sleep(1) # AC but wait
elif type == 5:
    assert 0 # RTE
elif type == 6:
    exit(120324123) # Try to fake segfault
