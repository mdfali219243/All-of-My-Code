# My project name: Project Roads
#### Video Demo:  <https://youtu.be/7htj46ajAXg?si=cTz-4Xd5gTSERmre>
#### Description:

    This project is a Speeding Plate Tracker, a program that helps monitor and track speeding events based on vehicle license plate numbers. The program ensures that each plate entered is valid, records the speeding incident, checks for repeat offenses in the same week, and then either gives a warning or issues a ticket. It is useful for understanding how to work with user inputs, files, dates, and logic checks in Python.

    🧠 How It Works (Step-by-Step):

    Imports Modules:

        is_valid from check_plates: checks if the plate number format is correct.

        date: manages and validates the date inputs.

        sys: exits the program when necessary.

        csv: reads and writes data to a file.

        User Inputs:

            The program asks the user to enter the vehicle's speed, license plate number, and the date of the incident.

        Check Plate Validity:

            The function is_valid() is used to confirm the plate number format.

            If the format is wrong, it prints a warning in a box and exits.

        Check Date Validity:

            Uses the check_date() function to make sure the input date is valid and in the right format (YYYY-MM-DD).

        Record the Entry:

            Adds a new record with the date, plate, and speed to the CSV file using write_record().

        Count Past Records:

            Uses the get_record_count() function to find out how many times the same plate has been recorded speeding in the same week.

        Give Feedback:

            If the plate has been caught speeding less than 5 times, a warning message is printed.

            If 5 or more times, the program issues a ticket and displays a bold alert message.

        🛠️ Helper Functions:

            check_date(date_str): Validates the date format and converts it to a date object.

            write_record(file_path, record): Adds a record (date, plate, speed) to the CSV file.

            read_records(file_path): Reads the contents of the file into a list.

            record_exists(file_path, plate): Checks if a given plate number exists in the file.

            get_record_count(file_path, plate, current_date): Counts how many times a plate was caught speeding in the same week.

        📂 Example of records.csv file format:

                2025-06-08,ABC123,60
                2025-06-08,XYZ789,70

        Each line contains the date, plate number, and speed separated by commas. The file grows each time a new record is added.

        🔧 Testing the Program

            This project includes automated test cases written using the pytest library. These tests check each function to make sure everything is working properly:

            test_check_date(): Tests valid and invalid date formats. For example, it should accept "2023-10-01" and reject "2024/10/12".

            test_write_record(): Writes a test entry to test.csv and checks if it was saved correctly.

            test_read_records(): Ensures the read_records() function can read data from test.csv.

            test_record_exists(): Confirms that a known plate like "ABC123" is found, and that "XYZ789" (not added) is not found.

            test_get_record_count(): Checks how many times a plate was caught speeding in the same week. This ensures weekly count checking works.

            These tests help catch bugs and ensure all features work as intended. They are especially important when maintaining or modifying code, as they ensure previous functionality doesn’t break.

            This project is a good example of how to combine user input, file handling, data validation, logic conditions, and testing in one Python application. It shows how to apply real-world concepts like record-keeping, data checking, and rule-based feedback. Whether used by law enforcement for practice simulations or in a classroom to learn coding structure, this project demonstrates clear, structured, and useful programming design.
