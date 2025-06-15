people = [
    {"name": "Harry", "house": "Gryffindor"},
    {"name": "Ron", "house": "Gryffindor"},
    {"name": "Hermione", "house": "Gryffindor"},
    {"name": "Draco", "house": "Slytherin"},
    {"name": "Neville", "house": "Gryffindor"},
    {"name": "Luna", "house": "Ravenclaw"},
]

people.sort(key=lambda person: person["name"])  # Sort by name
print(people)