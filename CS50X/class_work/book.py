books = []

# Add three books to your shelf
for i in range(3):
    book = dict()
    book["author"] = input("enter the author name: ")
    book["book_name"] = input("enter the book name namez: ")
    books.append(book)

# print list of books
for book in books:
    print(book.keys())
