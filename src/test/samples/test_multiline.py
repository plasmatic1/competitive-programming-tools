T = int(input())

if T == 1: # AC: Identical-ish
    print('''ac
    AC
    ac
    AC
    ''')
elif T == 2: # AC: newlines vs. spaces shouldn't matter
    print('''ac
    AC ac AC''')
elif T == 3: # AC: consecutive whitespace should be treated as single
    print('''ac                    AC
    
    
    ac
    
         AC''')
elif T == 4: # WA: tokens are different
    print('''ac AC ac wa''')
