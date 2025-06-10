def main():
    nutritions = {
        "Apple": 130,
        "Avocado":50,
        "Banana": 110,
        "Cantaloupe": 50,
        "Grapefruit": 60,
        "Grapes" : 90,
        "Honeydew" :50,
        "Kiwifruit": 90,
        "Lemon": 15,
        "Nectarine" : 60,
        "Orange" : 80,
        "Strawberries" : 50,
        "Sweet Cherries" : 100,
        "Pear": 100
    }
    fruits = input("Item: ").strip().title()
    if fruits in nutritions:
        print(f"Calories: {nutritions[fruits]}")

main()
