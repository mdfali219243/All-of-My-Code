class Package:
    def __init__(self, number, sender, recipient, weight):
        self.number = number
        self.sender = sender
        self.recipient = recipient
        self.weight = weight

    def __str__(self):
        return f"Package {self.number}: The Sender is {self.sender} -> the receiver is {self.recipient}, the weight of the packet is {self.weight}kg"

    def calculate_cost(self, cost_per_kg):
        return self.weight * cost_per_kg


def main():
    packages = [
        Package(number=1, sender="Alice", recipient="Bob", weight=10),
        Package(number=2, sender="Bob", recipient="Charlie", weight=5),
    ]
    for package in packages:
        print(f"{package} and costs is ${package.calculate_cost(cost_per_kg=2)}")



main()
