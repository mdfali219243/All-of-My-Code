people = {
    "Foysal":"4694681819",
    "Ammu": "4696744309",
    "Abbu": "2146037212",
}

name = input("Name: ")

if name in people:
    print(f"Number: {people[name]}")
else:
    print("not found")
