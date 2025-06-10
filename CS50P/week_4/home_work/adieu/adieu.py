import inflect

def main():
    all_names = []
    p = inflect.engine()

    try:
        while True:
            names = input("Name: ").strip()
            all_names.append(names)
    except EOFError:
        print()
        print(f"Adieu, adieu, to {p.join(all_names)}")
main()
