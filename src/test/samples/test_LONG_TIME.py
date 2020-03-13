import time

tms = lambda: int(round(time.time() * 1000))

beg = tms()
while tms() < beg + 700:
    pass

print('Done!')
