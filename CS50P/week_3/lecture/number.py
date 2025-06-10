def main():
    x = get_int("What's x? ")
    print(f"x is {x}")



def get_int(promt):
    while True:
        try:
            x = int(input(promt))
            return x
        except ValueError:
            pass

main()








