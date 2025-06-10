class wizard:
    def __init__(self, name):
        if not name:
            raise ValueError("Name cannot be empty")
        self.name = name


class Student(wizard):
    def __init__(self, name, house):
        super().__init__(name)
        self.house = house

    ...
class professor(wizard):
    def __init__(self, name, subject):
        super().__init__(name)
        self.subject = subject
        ...


student = Student("Harry Potter", "Gryffindor")
professor = professor("Severus", "Defense Against the Dark Arts")
