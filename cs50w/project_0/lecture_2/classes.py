class Flight():
    def __init__(self, capacity):
        self.capacity = capacity
        self.passengers = []

    def add_passenger(self, name):
        if not self.open_seat():
            return False
        self.passengers.append(name)
        return True
    
    def open_seat(self):
        return self.capacity - len(self.passengers)

flight = Flight(3)

people = ["Alice", "Bob", "Charlie", "David"]
for person in people:
    if flight.add_passenger(person):
        print(f"{person} added to flight successfully.")
    else:
        print(f"Sorry, {person}. No available seats.")


