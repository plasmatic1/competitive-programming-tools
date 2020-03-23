T = int(input())

if T == 1: # AC: same
    print('1.0000')
elif T == 2: # AC: at precision
    print('1.0001')
elif T == 3: # AC: below precision
    print('1.00005')
elif T == 4: # WA: above precision
    print('0.9998')
