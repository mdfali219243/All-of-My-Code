#create an empty set
s = set()

# add elements to the set
s.add(1)
s.add(2)
s.add(3)
s.add(4)
s.add(3)

s.remove(3)  # Remove the element 3 from the set
print(s)  # {1, 2, 4}

print(f"Set has some numers of elements: {len(s)}")  # Set has some numers of elements: 3