def main():
    grocery = {}  # Dictionary to store item counts
    while True:
        try:
            items = input().strip().upper().split(", ")
            for item in items:
                if item in grocery:
                    grocery[item] += 1
                else:
                    grocery[item] = 1
        except EOFError:
            print()
            break
    for item in sorted(grocery):
        print(f"{grocery[item]} {item}")

main()



