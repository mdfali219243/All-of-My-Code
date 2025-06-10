# Define a Student class with name and house attributes
class Student:
    def __init__(self, name, house):
        self.name = name      # Student's name
        self.house = house    # Student's house

    def __str__(self):
        return f"{self.name} from {self.house}"

    @classmethod
    def get(cls):
        name = input("Name: ")
        house = input("House: ")
        return cls(name, house)



# Main function to run the program
def main():
    student = Student.get()  # Get a Student object from user input
    print(student)  # Print student info
# Run main() if this file is executed directly
if __name__ == "__main__":
    main()

